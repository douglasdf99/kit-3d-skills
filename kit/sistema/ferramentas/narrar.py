"""Gera a narração de um vídeo com a voz da ElevenLabs e o tempo de cada palavra (pra animação e legenda).

Uso:  python3 sistema/ferramentas/narrar.py "Meus Videos/<tema>"            (só gera de novo o que mudou no roteiro)
      python3 sistema/ferramentas/narrar.py "Meus Videos/<tema>" --forcar   (gera tudo de novo, gasta créditos)

Lê o roteiro.txt (uma fala por linha; linhas que começam com # são ignoradas).
A ÚLTIMA linha é a chamada final (ex.: Comente "luz" se você não sabia dessa!) e sai um pouco mais rápida.
Do jeito da série: voz acelerada (1,12x), pausas longas encurtadas pra no máximo 0,30 s.
Saída: audio/narracao.wav e audio/timeline.json
"""
import base64, hashlib, json, os, re, sys, wave
import numpy as np
sys.dont_write_bytecode = True; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kit import *

SR = 44100
FORMATOS = ['pcm_44100', 'mp3_44100_192', 'mp3_44100_128']


def ler_roteiro(pasta):
    p = os.path.join(pasta, 'roteiro.txt')
    if not os.path.exists(p): raise Erro(f'falta o {rel(p)} (uma fala por linha)')
    linhas = [l.strip() for l in open(p, encoding='utf-8') if l.strip() and not l.strip().startswith('#')]
    if len(linhas) < 2: raise Erro('o roteiro precisa de pelo menos 2 linhas (a última é a chamada final)')
    return linhas


def tts(texto, cfg, cache_dir, nome, forcar=False):
    """gera (ou reaproveita) a fala com o tempo de cada letra. Devolve (áudio float32 44.1k, chars, ini, fim)"""
    os.makedirs(cache_dir, exist_ok=True)
    chave_cache = hashlib.sha1(json.dumps([texto, cfg['voz_id'], cfg['modelo'], cfg['estabilidade'], cfg['similaridade'], cfg['idioma']], ensure_ascii=False).encode()).hexdigest()[:16]
    pj = os.path.join(cache_dir, f'{nome}_{chave_cache}.json')
    if os.path.exists(pj) and not forcar:
        d = ler_json(pj); print(f'  {nome}: reaproveitando (o texto não mudou)')
    else:
        corpo = {'text': texto, 'model_id': cfg['modelo'], 'voice_settings': {'stability': cfg['estabilidade'], 'similarity_boost': cfg['similaridade']}, 'apply_text_normalization': 'on'}
        if cfg.get('idioma'): corpo['language_code'] = cfg['idioma'][:2]
        ult = None
        for fmt in FORMATOS:
            try:
                print(f'  {nome}: gerando voz ({len(texto)} caracteres)…', flush=True)
                r = eleven(f"/v1/text-to-speech/{cfg['voz_id']}/with-timestamps?output_format={fmt}", corpo, timeout=600)
                d = {'formato': fmt, 'audio': r['audio_base64'], 'alinhamento': r.get('alignment') or r.get('normalized_alignment'), 'texto': texto}
                break
            except Erro as e:
                ult = e
                if 'output_format' in str(e).lower() or 'tier' in str(e).lower() or 'pcm' in str(e).lower() or 'subscription' in str(e).lower(): continue
                raise
        else:
            raise ult
        salvar_json(pj, d)
    raw = base64.b64decode(d['audio'])
    if d['formato'].startswith('pcm'):
        a = np.frombuffer(raw[: len(raw) // 2 * 2], dtype=np.int16).astype(np.float32) / 32768
    else:
        a = np.frombuffer(rodar([ffmpeg(), '-v', 'error', '-i', '-', '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], entrada=raw), dtype=np.float32).copy()
    al = d['alinhamento']
    return a, al['characters'], al['character_start_times_seconds'], al['character_end_times_seconds']


def tempos_por_palavra(texto, chars, ini, fim):
    """[(ini, fim)] pra cada caractere do texto original (alinha mesmo se a ElevenLabs normalizou números etc.)"""
    alvo = ''.join(chars)
    if alvo == texto: return list(zip(ini, fim))
    import difflib
    sm = difflib.SequenceMatcher(a=texto, b=alvo, autojunk=False)
    m = [None] * len(texto)
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == 'equal':
            for k in range(i2 - i1): m[i1 + k] = (ini[j1 + k], fim[j1 + k])
        elif tag == 'replace' and j2 > j1:
            s0, e0 = ini[j1], fim[j2 - 1]
            for k in range(i2 - i1): m[i1 + k] = (s0 + (e0 - s0) * k / (i2 - i1), s0 + (e0 - s0) * (k + 1) / (i2 - i1))
    ultimo = (0.0, 0.0)
    for k in range(len(m)):
        if m[k] is None: m[k] = (ultimo[1], ultimo[1])
        ultimo = m[k]
    return m


def palavras(linhas_idx, texto, tempos):
    """separa o texto em palavras (como no roteiro) com início/fim"""
    out, pos = [], 0
    for li, linha in linhas_idx:
        for w in linha.split():
            i = texto.index(w, pos); j = i + len(w); pos = j
            n = norm(w)
            if not n: continue
            ts = [tempos[k] for k in range(i, j) if texto[k].strip()]
            out.append({'w': w, 'n': n, 's': min(t[0] for t in ts), 'e': max(t[1] for t in ts), 'line': li})
    return out


def acelerar(a, v):
    if abs(v - 1) < 1e-3: return a
    filtros = []
    while v > 2.0: filtros.append('atempo=2.0'); v /= 2.0
    filtros.append(f'atempo={v:.4f}')
    return np.frombuffer(rodar([ffmpeg(), '-v', 'error', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-', '-af', ','.join(filtros), '-f', 'f32le', '-'], entrada=a.astype(np.float32).tobytes()), dtype=np.float32).copy()


def energia(a, hop):
    n = len(a) // hop
    return np.sqrt(np.mean(a[: n * hop].reshape(n, hop) ** 2, axis=1) + 1e-12)


def encurtar_pausas(a, ws, alvo):
    """encurta silêncios entre palavras maiores que `alvo` segundos (corta no meio do silêncio)"""
    hop = SR // 100; env = energia(a, hop); thr = 10 ** (-42 / 20)
    cortes, prev_e = [], 0.0
    for w in ws:
        s = w['s']
        if s - prev_e > alvo + 0.04:
            i0, i1 = max(0, int((prev_e - 0.05) * 100)), min(len(env), int((s + 0.05) * 100))
            seg = env[i0:i1] < thr
            best, cur = (0, 0), None
            for k, v in enumerate(seg):
                if v and cur is None: cur = k
                if (not v or k == len(seg) - 1) and cur is not None:
                    end = k if not v else k + 1
                    if end - cur > best[1] - best[0]: best = (cur, end)
                    cur = None
            sil0, sil1 = (i0 + best[0]) / 100, (i0 + best[1]) / 100
            sil = sil1 - sil0
            keep = max(0.12, alvo - max(0.0, (s - prev_e) - sil))
            if sil > keep + 0.03:
                c0 = sil0 + keep / 2; cortes.append((c0, c0 + sil - keep))
        prev_e = max(prev_e, w['e'])
    pedacos, pos, xf = [], 0, int(0.008 * SR)
    for c0, c1 in cortes: pedacos.append(a[pos:int(c0 * SR)]); pos = int(c1 * SR)
    pedacos.append(a[pos:])
    out = pedacos[0]
    for p in pedacos[1:]:
        if len(out) > xf and len(p) > xf:
            f = np.linspace(0, 1, xf, dtype=np.float32)
            out = np.concatenate([out[:-xf], out[-xf:] * (1 - f) + p[:xf] * f, p[xf:]])
        else: out = np.concatenate([out, p])

    def mapa(t):
        tirado = 0.0
        for c0, c1 in cortes:
            if t >= c1: tirado += c1 - c0
            elif t > c0: return c0 - tirado
        return t - tirado
    for w in ws: w['s'], w['e'] = mapa(w['s']), mapa(w['e'])
    return out, sum(c1 - c0 for c0, c1 in cortes)


def aparar(a, db=-45):
    hop = SR // 200; env = energia(a, hop); thr = 10 ** (db / 20)
    idx = np.where(env > thr)[0]
    if not len(idx): return a, 0.0
    i0, i1 = max(0, idx[0] * hop - int(0.01 * SR)), min(len(a), (idx[-1] + 1) * hop + int(0.03 * SR))
    return a[i0:i1], i0 / SR


def pronunciar(texto, v):
    """troca palavras só no texto que vai pra voz (a legenda continua com o original). video.json: "pronuncia": {"ROAS": "Rôas"}"""
    for orig, fala in (v.get('pronuncia') or {}).items():
        texto = re.sub(r'(?<!\w)' + re.escape(orig) + r'(?!\w)', fala, texto)
    return texto


def narrar(pasta, forcar=False):
    linhas = ler_roteiro(pasta)
    c = canal(); v = video_cfg(pasta)
    cfg = {k: v.get(k, c[k]) for k in ('voz_id', 'modelo', 'estabilidade', 'similaridade', 'idioma', 'velocidade', 'velocidade_cta', 'pausa_max')}
    if not cfg['voz_id']: raise Erro('ainda não tem voz escolhida. Escolha uma voz (python3 sistema/ferramentas/vozes.py listar) e coloque o "voz_id" em config/canal.json')
    cache = os.path.join(pasta, 'audio', 'narracao')
    corpo, cta = linhas[:-1], linhas[-1]
    # -------- texto principal (em partes de até ~9000 caracteres, separadas em fim de linha)
    grupos, atual = [], []
    for i, l in enumerate(corpo):
        if atual and sum(len(x[1]) + 1 for x in atual) + len(l) > 9000: grupos.append(atual); atual = []
        atual.append((i, l))
    grupos.append(atual)
    partes_audio, ws, t0 = [], [], 0.0
    for gi, g in enumerate(grupos):
        texto = ' '.join(l for _, l in g)
        a, chars, ini, fim = tts(pronunciar(texto, v), cfg, cache, f'fala{gi + 1}', forcar)
        w = palavras(g, texto, tempos_por_palavra(texto, chars, ini, fim))
        a = acelerar(a, cfg['velocidade'])
        for x in w: x['s'] /= cfg['velocidade']; x['e'] /= cfg['velocidade']
        a, tirado = encurtar_pausas(a, w, cfg['pausa_max'])
        env = energia(a, SR // 100); k = len(env) - 1
        while k > 0 and env[k] < 10 ** (-40 / 20): k -= 1
        a = a[: min(len(a), int((k + 1) / 100 * SR) + int(0.05 * SR))]
        for x in w: x['s'] += t0; x['e'] += t0
        ws += w; partes_audio.append(a); t0 += len(a) / SR
        if gi < len(grupos) - 1: partes_audio.append(np.zeros(int(0.35 * SR), np.float32)); t0 += 0.35
    # -------- chamada final, um pouco mais rápida
    a, chars, ini, fim = tts(pronunciar(cta, v), cfg, cache, 'chamada', forcar)
    w = palavras([(len(linhas) - 1, cta)], cta, tempos_por_palavra(cta, chars, ini, fim))
    vel = cfg['velocidade'] * cfg['velocidade_cta']
    a = acelerar(a, vel)
    for x in w: x['s'] /= vel; x['e'] /= vel
    a, lead = aparar(a)
    gap = 0.5
    for x in w: x['s'] = max(0.0, x['s'] - lead) + t0 + gap; x['e'] = max(0.0, x['e'] - lead) + t0 + gap
    ws += w
    final = np.concatenate(partes_audio + [np.zeros(int(gap * SR), np.float32), a, np.zeros(int(0.15 * SR), np.float32)])
    pico = np.abs(final).max() or 1
    if pico > 0.99: final = final * (0.99 / pico)
    # -------- pausas extras pedidas no video.json: "pausas_extra": [{"antes": "começo da frase", "s": 0.4}]
    for pe in v.get('pausas_extra', []):
        alvo = norm(pe['antes'].split()[0]); dur = float(pe.get('s', 0.4))
        li = next((i for i, l in enumerate(linhas) if l.lower().startswith(pe['antes'].lower())), None)
        if li is None: continue
        w0 = next(x for x in ws if x['line'] == li); prev = [x for x in ws if x['s'] < w0['s']]
        a0 = prev[-1]['e'] if prev else 0.0
        jan = final[int(max(0, a0 - 0.02) * SR): int((w0['s'] + 0.02) * SR)]          # ponto mais silencioso entre as duas palavras
        hop = max(1, SR // 200); en = [np.abs(jan[k:k + hop]).mean() for k in range(0, max(1, len(jan) - hop), hop)] or [0]
        corte = int(max(0, a0 - 0.02) * SR) + int(np.argmin(en)) * hop
        xf = int(0.006 * SR); fade = np.linspace(1, 0, xf, dtype=np.float32)
        antes, depois = final[:corte].copy(), final[corte:].copy()
        antes[-xf:] *= fade; depois[:xf] *= fade[::-1]
        final = np.concatenate([antes, np.zeros(int(dur * SR), np.float32), depois])
        tc = corte / SR
        for x in ws:
            if x['s'] >= tc: x['s'] += dur; x['e'] += dur
    out = os.path.join(pasta, 'audio', 'narracao.wav')
    with wave.open(out, 'wb') as wv:
        wv.setnchannels(1); wv.setsampwidth(2); wv.setframerate(SR); wv.writeframes((np.clip(final, -1, 1) * 32767).astype(np.int16).tobytes())
    for x in ws: x['s'] = round(x['s'], 3); x['e'] = round(max(x['e'], x['s'] + 0.04), 3)
    lns = []
    for li, l in enumerate(linhas):
        wl = [x for x in ws if x['line'] == li]
        lns.append({'text': l, 's': wl[0]['s'] if wl else 0, 'e': wl[-1]['e'] if wl else 0})
    salvar_json(os.path.join(pasta, 'audio', 'timeline.json'), {'words': ws, 'lines': lns, 'duration': round(len(final) / SR, 3)})
    print(f'OK — narração pronta: {len(final) / SR:.1f} s, {len(ws)} palavras.')
    for l in lns: print(f'  {l["s"]:6.2f}s  {l["text"][:80]}')
    if len(final) / SR > 178: print('  aviso: passou de 3 minutos — encurte o roteiro (Shorts têm limite de 3 min).')


if __name__ == '__main__':
    def main():
        if len(sys.argv) < 2: raise Erro('uso: python3 sistema/ferramentas/narrar.py "Meus Videos/<tema>" [--forcar]')
        narrar(pasta_video(sys.argv[1]), '--forcar' in sys.argv)
    principal(main)
