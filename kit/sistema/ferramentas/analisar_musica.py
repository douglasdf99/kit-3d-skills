"""Analisa uma trilha e coloca (ou atualiza) ela na biblioteca de músicas, pra batida final cair no "Parabéns".

Uso:  python3 sistema/ferramentas/analisar_musica.py biblioteca/musicas/minha_trilha.mp3 ["Título"] ["descrição"]

Descobre: duração do tempo (batida) e do compasso, onde fica a última batida forte ("batida final"),
e o volume (pra ficar no mesmo nível das outras trilhas). Grava em biblioteca/musicas/musicas.json.
Dica: trilha boa pra série = sem pausas/silêncios no meio e com uma batida final forte no fim.
"""
import json, os, subprocess, sys
import numpy as np
sys.dont_write_bytecode = True; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kit import *

SR = 48000
REFERENCIA_LUFS = -13.4   # volume da trilha de referência da série (ganho = REF - volume da trilha)


def lufs(p):
    r = subprocess.run([ffmpeg(), '-v', 'info', '-i', p, '-af', 'ebur128', '-f', 'null', '-'], capture_output=True, text=True).stderr
    vals = [l for l in r.splitlines() if l.strip().startswith('I:')]
    return float(vals[-1].split()[1]) if vals else None


def analisar(p):
    a = np.frombuffer(rodar([ffmpeg(), '-v', 'error', '-i', p, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-']), dtype=np.float32).copy()
    dur = len(a) / SR
    hop = 512
    fr = np.lib.stride_tricks.sliding_window_view(a, 2048)[::hop]
    sp = np.abs(np.fft.rfft(fr * np.hanning(2048), axis=1))
    flux = np.concatenate([[0], np.maximum(0, np.diff(np.log1p(sp), axis=0)).sum(axis=1)])
    ft = np.arange(len(flux)) * hop / SR
    rms = np.sqrt(np.mean(fr ** 2, axis=1) + 1e-12); rdb = 20 * np.log10(rms)
    med = np.median(rdb[(ft > 5) & (ft < dur - 15)])
    # buracos (silêncios) no meio: ruim pra narração
    baixo = rdb < med - 14; buracos = []; s = None
    for i, b in enumerate(baixo):
        if b and s is None: s = i
        if (not b or i == len(baixo) - 1) and s is not None:
            if ft[i] - ft[s] >= 0.6 and ft[s] > 2 and ft[i] < dur - 12: buracos.append((round(ft[s], 1), round(ft[i], 1)))
            s = None
    # fim da música = onde o volume cai de vez (decaimento final ou parada); a batida final é a nota forte logo antes
    k = max(1, int(0.4 * SR / hop)); suave = np.convolve(rdb, np.ones(k) / k, mode='same')
    nivel = np.median(suave[(ft > 5) & (ft < dur - 15)])
    cheio = np.where((suave >= nivel - 3) & (ft < dur - 1.0))[0]
    t_fim = ft[cheio[-1]] if len(cheio) else dur - 4
    idx = np.where((ft >= t_fim - 1.2) & (ft <= t_fim + 0.15))[0]
    batida = float(ft[idx[np.argmax(flux[idx] * (rms[idx] / (rms[idx].max() + 1e-12)) ** 0.5)]]) if len(idx) else None
    seg = (ft > 8) & (ft < (batida or dur) - 8); f = flux[seg] - flux[seg].mean()
    # autocorrelação do "fluxo" (onde começam as notas) → compasso = atraso que mais se repete,
    # conferindo também metade, um quarto e o dobro (pra não confundir com 1,5 compasso)
    fpad = np.concatenate([f, np.zeros(len(f))])
    spec = np.fft.rfft(fpad); ac = np.fft.irfft(spec * np.conj(spec))[:len(f)]; ac /= (len(f) - np.arange(len(f)))
    lag = lambda L: ac[int(round(L * SR / hop))] if int(round(L * SR / hop)) < len(ac) else 0.0
    # tempo (batida): soma da autocorrelação em 1, 2, 3 e 4 batidas, com preferência suave por ~110 BPM
    melhor, bv = None, -1e18
    for T_ in np.arange(0.33, 1.0, 0.002):
        v = sum(lag(k * T_) for k in (1, 2, 3, 4)) * np.exp(-0.5 * (np.log2(60 / T_ / 110) / 0.6) ** 2)
        if v > bv: melhor, bv = T_ * 4, v
    # refina o compasso com resolução fina em volta do melhor
    fino = np.arange(melhor - 0.03, melhor + 0.03, 0.0005)
    def acf(L):
        k = L * SR / hop; i = int(k); fr_ = k - i
        return ac[i] * (1 - fr_) + ac[min(i + 1, len(ac) - 1)] * fr_
    bar = float(fino[np.argmax([acf(L) + 0.5 * acf(2 * L) for L in fino])])
    beat = bar / 4
    return {'duracao': round(dur, 2), 'batida_final': round(batida, 3) if batida else None, 'tempo': round(beat, 4), 'compasso': round(bar, 4),
            'bpm': round(60 / beat, 1), 'cauda': round(max(1.0, min(3.4, t_fim + 2.6 - (batida or t_fim))), 2), 'buracos': buracos}


if __name__ == '__main__':
    def main():
        if len(sys.argv) < 2: raise Erro('uso: python3 sistema/ferramentas/analisar_musica.py biblioteca/musicas/<arquivo>.mp3 ["Título"] ["descrição"]')
        p = os.path.abspath(sys.argv[1] if os.path.isabs(sys.argv[1]) else os.path.join(KIT, sys.argv[1]) if os.path.exists(os.path.join(KIT, sys.argv[1])) else sys.argv[1])
        if not os.path.exists(p): raise Erro('arquivo não encontrado: ' + sys.argv[1])
        pasta_mus = os.path.join(BIBLIOTECA, 'musicas')
        if os.path.dirname(p) != pasta_mus: raise Erro('coloque o arquivo dentro de biblioteca/musicas/ antes de analisar')
        r = analisar(p); L = lufs(p)
        arq = os.path.basename(p); mid = slug(os.path.splitext(arq)[0]).replace('-', '_')
        cat_p = os.path.join(pasta_mus, 'musicas.json'); cat = ler_json(cat_p, {'musicas': []})
        e = next((x for x in cat['musicas'] if x['id'] == mid), None) or {'id': mid}
        e.update({'arquivo': arq, 'titulo': sys.argv[2] if len(sys.argv) > 2 else e.get('titulo', os.path.splitext(arq)[0].replace('_', ' ').title()),
                  'descricao': sys.argv[3] if len(sys.argv) > 3 else e.get('descricao', ''), 'ganho': round(REFERENCIA_LUFS - L, 1) if L is not None else 0.0, 'lufs': L, **r})
        if e not in cat['musicas']: cat['musicas'].append(e)
        salvar_json(cat_p, cat)
        try: pagina_sons()
        except Exception: pass
        print(f'OK — {arq}: {r["bpm"]} BPM, compasso {r["compasso"]} s, batida final em {r["batida_final"]} s, volume {L} LUFS (ganho {e["ganho"]:+} dB)')
        if r['buracos']: print('  aviso: a trilha tem silêncios no meio (ruim debaixo da narração): ' + ', '.join(f'{a}–{b}s' for a, b in r['buracos']))
        if not r['batida_final']: print('  aviso: não achei uma batida final clara — o vídeo vai usar o efeito "tada" no Parabéns')
    principal(main)
