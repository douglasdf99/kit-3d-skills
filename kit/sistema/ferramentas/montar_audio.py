"""Monta o áudio final do vídeo: narração + música (com a batida final no "Parabéns") + efeitos sonoros.

Uso:  python3 sistema/ferramentas/montar_audio.py "Meus Videos/<tema>"

Precisa de: audio/narracao.wav (narrar.py) e audio/cena.json (conferir.py).
A música vem do video.json ("musica": id de biblioteca/musicas/musicas.json, ou "nenhuma").
Ajustes opcionais no video.json: "volume_musica": -2 (dB, mais baixo) / +2 (mais alto), "volume_efeitos": idem.
Saída: audio/mix.wav (master), audio/mix.aac (vai dentro do MP4) e audio/mix.mp3 (prévia).
"""
import json, os, sys, tempfile, wave
import numpy as np
sys.dont_write_bytecode = True; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kit import *

SR = 48000
BED = -6.0           # música e efeitos ficam 6 dB abaixo da referência (a narração é a referência)
MUSICA_BASE = -17.5  # volume padrão da trilha na série
_cache = {}


def carregar(p, velocidade=None):
    k = (p, velocidade)
    if k not in _cache:
        garantir(p)   # trilha ou efeito ainda não baixado: baixa só ele
        af = ['-af', f'atempo={velocidade}'] if velocidade else []
        _cache[k] = np.frombuffer(rodar([ffmpeg(), '-v', 'error', '-i', p, *af, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-']), dtype=np.float32).copy()
    return _cache[k]


def db(x): return 10 ** (x / 20)


def movavg(x, k):
    k = max(1, int(k)); c = np.cumsum(np.concatenate([[0.0], x.astype(np.float64)]))
    y = (c[k:] - c[:-k]) / k; pad = k // 2
    return np.concatenate([np.full(pad, y[0]), y, np.full(len(x) - len(y) - pad, y[-1])]).astype(np.float32)


class Mix:
    def __init__(self, dur):
        self.N = int((dur + 0.5) * SR); self.L = np.zeros(self.N, np.float32); self.R = np.zeros(self.N, np.float32)

    def add(self, sig, t, ganho=0.0, pan=0.0, fade_in=0.0, fade_out=0.0, env=None, bed=True):
        i0 = int(round(t * SR))
        if i0 >= self.N or len(sig) == 0: return
        s = sig.copy() * db(ganho + (BED if bed else 0.0))
        if fade_in > 0: k = min(len(s), int(fade_in * SR)); s[:k] *= np.linspace(0, 1, k)
        if fade_out > 0: k = min(len(s), int(fade_out * SR)); s[len(s) - k:] *= np.linspace(1, 0, k)
        if env is not None: s *= env[:len(s)]
        if i0 < 0: s = s[-i0:]; i0 = 0
        s = s[:self.N - i0]
        l = np.cos((pan + 1) * np.pi / 4); r = np.sin((pan + 1) * np.pi / 4)
        self.L[i0:i0 + len(s)] += s * l * 1.414; self.R[i0:i0 + len(s)] += s * r * 1.414

    def loop(self, sig, t0, t1, ganho, pan=0.0, fade=0.4, env=None, env_dt=0.02):
        n = int((t1 - t0) * SR)
        if n <= 0 or len(sig) == 0: return
        xf = min(int(0.25 * SR), len(sig) // 3)
        out = np.zeros(n + len(sig), np.float32); pos = 0
        while pos < n:
            seg = sig.copy()
            if pos > 0: seg[:xf] *= np.linspace(0, 1, xf)
            seg[len(seg) - xf:] *= np.linspace(1, 0, xf)
            out[pos:pos + len(seg)] += seg; pos += len(sig) - xf
        out = out[:n]
        e = None
        if env:
            arr = np.array(env, np.float32); tt = np.arange(n) / SR
            e = movavg(arr[np.clip((tt / env_dt).astype(int), 0, len(arr) - 1)], int(0.05 * SR))
        self.add(out, t0, ganho, pan, fade, fade, e)


def fluxo(base):
    hop = 512
    fr = np.lib.stride_tricks.sliding_window_view(base, 2048)[::hop]
    sp = np.abs(np.fft.rfft(fr * np.hanning(2048), axis=1))
    flux = np.concatenate([[0], np.maximum(0, np.diff(np.log1p(sp), axis=0)).sum(axis=1)])
    return flux, np.arange(len(flux)) * hop / SR


def refinar(base, i0, i1, busca=0.08, janela=1.0):
    """procura, perto de i1, o ponto que mais se parece com i0 (mesma batida do compasso) — evita 'tropeço' no corte"""
    w = int(janela * SR); ref = base[i0:i0 + w]
    if len(ref) < w: return i1
    ref = ref - ref.mean(); nr = np.linalg.norm(ref) + 1e-9
    melhor, bv = i1, -2
    for d in range(-int(busca * SR), int(busca * SR) + 1, 48):
        j = i1 + d
        if j < 0 or j + w > len(base): continue
        seg = base[j:j + w]; seg = seg - seg.mean()
        v = float(np.dot(ref, seg) / (nr * (np.linalg.norm(seg) + 1e-9)))
        if v > bv: melhor, bv = j, v
    lo, hi = max(0, melhor - 48), melhor + 48   # refino fino
    for j in range(lo, hi + 1):
        if j + w > len(base): break
        seg = base[j:j + w]; seg = seg - seg.mean()
        v = float(np.dot(ref, seg) / (nr * (np.linalg.norm(seg) + 1e-9)))
        if v > bv: melhor, bv = j, v
    return melhor


def trilha_alinhada(m, alvo):
    """estica/encurta a trilha em compassos inteiros (+ ajuste de andamento mínimo) pra batida final cair em `alvo`"""
    base = carregar(os.path.join(BIBLIOTECA, 'musicas', m['arquivo'])).copy()
    base[:int(0.2 * SR)] *= np.linspace(0, 1, int(0.2 * SR))
    flux, ft = fluxo(base)
    def forte(a, b):
        idx = np.where((ft >= a) & (ft < b))[0]; return ft[idx[np.argmax(flux[idx])]] if len(idx) else a
    HIT0, BAR = m['batida_final'], m['compasso']
    TAIL = min(len(base) / SR, HIT0 + m.get('cauda', 3.4))
    nb = int(round((alvo - HIT0) / BAR)); LOOP = nb * BAR
    if abs(HIT0 + LOOP - alvo) / max(alvo, 1) > 0.015 and m.get('tempo'):   # vídeo curto: corta em batidas (mais preciso)
        BAR = m['tempo']; nb = int(round((alvo - HIT0) / BAR)); LOOP = nb * BAR
    ext = base[:int(TAIL * SR)].copy()
    if nb != 0:
        s0 = max(6.0, min(40.0, alvo * 0.4, HIT0 - abs(LOOP) - BAR - 6))
        c0 = forte(s0, s0 + BAR) - 0.05; i0 = int(c0 * SR); xf = int(0.06 * SR)
        i1 = refinar(base, i0, int((c0 + LOOP if nb > 0 else c0 - LOOP) * SR), busca=min(0.45 * BAR, 0.9))   # acerta o corte no mesmo ponto do compasso
        LOOP = (i1 - i0) / SR if nb > 0 else -(i1 - i0) / SR
        if nb > 0:
            a_ = base[:i1].copy(); b_ = base[i0:int(TAIL * SR)].copy()
            while len(a_) < i1:  # trilha curta demais: repete o trecho
                a_ = np.concatenate([a_, base[i0:i0 + (i1 - len(a_))]])
        else:
            a_ = base[:i0].copy(); b_ = base[i1:int(TAIL * SR)].copy()
        a_[len(a_) - xf:] *= np.linspace(1, 0, xf); b_[:xf] *= np.linspace(0, 1, xf)
        ext = np.concatenate([a_[:-xf], a_[-xf:] + b_[:xf], b_[xf:]])
    ext[len(ext) - int(0.4 * SR):] *= np.linspace(1, 0, int(0.4 * SR))
    HIT = HIT0 + LOOP; vel = round(HIT / alvo, 4)
    if abs(vel - 1) > 0.04: vel = 1.0   # não acelera/desacelera a música demais (a batida cai perto, e o "tada" marca o Parabéns)
    fd, tmp = tempfile.mkstemp(suffix='.wav'); os.close(fd)
    with wave.open(tmp, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(ext, -1, 1) * 32767).astype(np.int16).tobytes())
    try:
        af = ['-af', f'atempo={vel}'] if vel != 1.0 else []
        out = np.frombuffer(rodar([ffmpeg(), '-v', 'error', '-i', tmp, *af, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-']), dtype=np.float32).copy()
    finally:
        os.remove(tmp)
    return out, vel, LOOP


def montar_audio(pasta, silencioso=False):
    cena_p = os.path.join(pasta, 'audio', 'cena.json')
    if not os.path.exists(cena_p): raise Erro('rode antes o conferir.py (ele prepara a lista de efeitos da cena)')
    cena = ler_json(cena_p); v = video_cfg(pasta); A = cena['ancoras']; D = cena['duracao']
    tl = timeline(pasta)
    narr_p = os.path.join(pasta, 'audio', 'narracao.wav')
    if not os.path.exists(narr_p): raise Erro('falta a narração (rode narrar.py)')
    mix = Mix(D)
    narr = carregar(narr_p)
    mix.add(narr, 0.0, 0.0, bed=False)
    # ---------- música
    alvo = (A['parabens'] if 'parabens' in A else (A.get(v.get('batida_final')) if v.get('batida_final') else tl['lines'][-2]['s'])) - 0.04
    mid = v.get('musica') or 'nenhuma'
    info_mus = 'sem música'
    if mid != 'nenhuma':
        m = next((x for x in musicas() if x['id'] == mid), None)
        if not m: raise Erro(f'a música "{mid}" não está em biblioteca/musicas/musicas.json. Disponíveis: ' + ', '.join(x['id'] for x in musicas()))
        if m.get('batida_final') and m.get('compasso'):
            mus, vel, loop = trilha_alinhada(m, alvo)
            info_mus = f'{m["titulo"]} (batida final em {alvo + 0.04:.2f}s, andamento x{vel})'
        else:  # trilha sem análise: repete e some no fim
            base = carregar(os.path.join(BIBLIOTECA, 'musicas', m['arquivo']))
            reps = int(np.ceil((D + 1) * SR / max(1, len(base))))
            mus = np.tile(base, reps)[:int((D + 0.5) * SR)].copy(); k = int(1.5 * SR); mus[-k:] *= np.linspace(1, 0, k)
            info_mus = f'{m["titulo"]} (sem batida final alinhada — rode analisar_musica.py nela)'
        nen = movavg(np.abs(narr), int(0.05 * SR))
        fala = movavg((nen > 0.01).astype(np.float32), int(0.35 * SR))
        duck = np.ones(len(mus), np.float32); L = min(len(mus), len(fala))
        duck[:L] = 1 - 0.45 * np.clip(fala[:L] * 1.4, 0, 1)
        tt = np.arange(len(mus)) / SR
        duck *= 1 + 1.6 * np.clip((tt - (alvo - 0.06)) / 0.15, 0, 1)   # deixa a batida final soar
        mix.add(mus, 0.0, MUSICA_BASE + m.get('ganho', 0.0) + v.get('volume_musica', 0.0), env=duck)
    # ---------- efeitos
    idx = indice_efeitos(pasta); ve = v.get('volume_efeitos', 0.0)
    for a in cena['ambientes']:
        mix.loop(carregar(idx[a['nome']]), a['t0'], a['t1'], a['ganho'] + ve, a.get('pan', 0), a.get('fade', 0.4), a.get('env'), a.get('env_dt', 0.02))
    for s in cena['sons']:
        sig = carregar(idx[s['nome']])
        if s.get('dur'): sig = sig[:max(1, int(s['dur'] * SR))]
        mix.add(sig, s['t'], s['ganho'] + ve, s.get('pan', 0), s.get('fadeIn', 0), s.get('fadeOut', 0))
    # ---------- volume final (padrão de plataforma: -14 LUFS) e arquivos
    st = np.stack([mix.L, mix.R], axis=1).astype(np.float32)
    wav = os.path.join(pasta, 'audio', 'mix.wav')
    rodar([ffmpeg(), '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', '-ar', str(SR), '-c:a', 'pcm_s16le', wav], entrada=st.tobytes())
    # AAC (ADTS) pro MP4: adianta 1024 amostras pra compensar o atraso do codificador AAC (fica sincronizado no MP4)
    rodar([ffmpeg(), '-v', 'error', '-y', '-i', wav, '-af', 'atrim=start_sample=1024', '-c:a', 'aac', '-b:a', '192k', '-f', 'adts', os.path.join(pasta, 'audio', 'mix.aac')])
    rodar([ffmpeg(), '-v', 'error', '-y', '-i', wav, '-c:a', 'libmp3lame', '-b:a', '128k', os.path.join(pasta, 'audio', 'mix.mp3')])
    if not silencioso:
        print(f'OK — áudio pronto: {D:.1f} s · música: {info_mus} · {len(cena["sons"])} efeitos + {len(cena["ambientes"])} ambientes')


if __name__ == '__main__':
    def main():
        if len(sys.argv) < 2: raise Erro('uso: python3 sistema/ferramentas/montar_audio.py "Meus Videos/<tema>"')
        montar_audio(pasta_video(sys.argv[1]))
    principal(main)
