"""Narração de RASCUNHO, grátis (não gasta crédito da ElevenLabs): pra montar e revisar a cena antes da voz final.

Uso:  python3 sistema/ferramentas/rascunho.py "Meus Videos/<tema>"

- No Windows usa a voz do próprio Windows (robótica, mas com o tempo certo de cada palavra).
- Em outros sistemas (ou se a voz do Windows falhar) gera um áudio mudo com o tempo de cada palavra estimado.
Sai igual ao narrar.py (audio/narracao.wav + audio/timeline.json), então a cena, a legenda e a página funcionam.
Quando a cena estiver aprovada, rode o narrar.py: a voz da ElevenLabs substitui o rascunho e as âncoras da cena
(T('palavra')) se ajustam sozinhas ao novo tempo.
"""
import json, os, subprocess, sys, tempfile, wave
import numpy as np
sys.dont_write_bytecode = True; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kit import *
import narrar

SR = narrar.SR
PS = r'''
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech
$s = New-Object System.Speech.Synthesis.SpeechSynthesizer
$v = $s.GetInstalledVoices() | Where-Object { $_.VoiceInfo.Culture.Name -like ($env:LANG_WIN + '*') } | Select-Object -First 1
if ($v) { $s.SelectVoice($v.VoiceInfo.Name) }
$s.Rate = 1
$s.SetOutputToWaveFile($env:WAV_WIN)
$ev = New-Object System.Collections.ArrayList
$null = Register-ObjectEvent -InputObject $s -EventName SpeakProgress -SourceIdentifier fala
$s.Speak([System.IO.File]::ReadAllText($env:TXT_WIN, [System.Text.Encoding]::UTF8))
$s.SetOutputToNull()
Get-Event -SourceIdentifier fala | ForEach-Object { $a = $_.SourceEventArgs; $null = $ev.Add(@{ p = $a.CharacterPosition; n = $a.CharacterCount; t = $a.AudioPosition.TotalSeconds }) }
[System.IO.File]::WriteAllText($env:JSON_WIN, (ConvertTo-Json -InputObject $ev -Depth 3), [System.Text.Encoding]::UTF8)
'''


def tempos(texto, eventos, a, dur):
    """[ini], [fim] por caractere, a partir do começo de cada palavra; o fim é o último trecho com som antes da próxima"""
    hop = SR // 100; nfr = max(1, len(a) // hop)
    en = np.sqrt(np.mean(a[: nfr * hop].reshape(nfr, hop) ** 2, axis=1) + 1e-12) if len(a) >= hop else np.zeros(1)
    ini = [None] * len(texto); fim = [None] * len(texto)
    eventos = sorted(eventos, key=lambda e: e['p'])
    for k, e in enumerate(eventos):
        s = float(e['t']); prox = float(eventos[k + 1]['t']) if k + 1 < len(eventos) else dur
        seg = en[int(s * 100): max(int(s * 100) + 1, int(prox * 100))]
        vivo = np.where(seg > 10 ** (-38 / 20))[0]
        f = s + ((vivo[-1] + 1) / 100 if len(vivo) else min(prox - s, 0.3))
        for i in range(e['p'], min(len(texto), e['p'] + e['n'])): ini[i], fim[i] = s, max(s + 0.04, f)
    ult = 0.0
    for i in range(len(texto)):
        if ini[i] is None: ini[i] = fim[i] = ult
        ult = fim[i]
    return ini, fim


def voz_windows(texto, idioma):
    tmp = tempfile.mkdtemp(prefix='rascunho_')
    txt, wav, js = (os.path.join(tmp, n) for n in ('t.txt', 'a.wav', 'e.json'))
    open(txt, 'w', encoding='utf-8').write(texto)
    env = dict(os.environ, WAV_WIN=wav, TXT_WIN=txt, JSON_WIN=js, LANG_WIN={'pt': 'pt', 'en': 'en', 'es': 'es'}.get(idioma, 'pt'))
    r = subprocess.run(['powershell.exe', '-NoProfile', '-NonInteractive', '-Command', PS], env=env, capture_output=True, text=True)
    if r.returncode != 0 or not os.path.exists(js): raise Erro('voz do Windows indisponível')
    ev = json.load(open(js, encoding='utf-8-sig')); ev = [ev] if isinstance(ev, dict) else ev
    a = np.frombuffer(rodar([ffmpeg(), '-v', 'error', '-i', wav, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-']), dtype=np.float32).copy()
    with wave.open(wav) as w: dur0, bps = w.getnframes() / w.getframerate(), w.getframerate() * w.getsampwidth() * w.getnchannels()
    if ev and max(float(e['t']) for e in ev) > dur0 + 0.5:      # o SAPI conta o tempo como se fosse 16 kHz / 16 bits
        for e in ev: e['t'] = float(e['t']) * 32000 / bps
    ini, fim = tempos(texto, ev, a, len(a) / SR)
    return a, list(texto), ini, fim


def mudo(texto):
    """sem voz: cada palavra dura pelo número de letras (≈ 3 palavras por segundo), com pausa nas pontuações"""
    ini, fim, t, i = [None] * len(texto), [None] * len(texto), 0.05, 0
    for w in texto.split(' '):
        d = 0.12 + 0.055 * len(w) + (0.25 if w[-1:] in '.!?' else 0.12 if w[-1:] in ',:;' else 0)
        for k in range(i, i + len(w)): ini[k], fim[k] = t, t + d * 0.85
        if i + len(w) < len(texto): ini[i + len(w)] = fim[i + len(w)] = t + d
        t += d; i += len(w) + 1
    return np.zeros(int((t + 0.2) * SR), np.float32), list(texto), [x or 0 for x in ini], [x or 0 for x in fim]


def tts_rascunho(texto, cfg, cache_dir, nome, forcar=False):
    print(f'  {nome}: rascunho ({len(texto)} caracteres, sem gastar créditos)…', flush=True)
    if os.name == 'nt':
        try: return voz_windows(texto, cfg.get('idioma') or 'pt')
        except Exception as e: print(f'  (voz do Windows falhou: {e}; usando tempo estimado, sem voz)')
    return mudo(texto)


if __name__ == '__main__':
    def main():
        if len(sys.argv) < 2: raise Erro('uso: python3 sistema/ferramentas/rascunho.py "Meus Videos/<tema>"')
        pasta = pasta_video(sys.argv[1])
        os.makedirs(os.path.join(pasta, 'audio'), exist_ok=True)
        narrar.tts = tts_rascunho
        narrar.canal = lambda: {**canal(), 'voz_id': canal().get('voz_id') or 'rascunho'}   # narrar.py exige uma voz; o rascunho não usa (nada é gravado na config)
        narrar.narrar(pasta, True)
        print('Rascunho pronto (voz grátis). Monte e revise a cena; quando aprovar, rode narrar.py pra voz final.')
    principal(main)
