"""Tira fotos de momentos do vídeo (sem abrir janela nenhuma) pro Claude conferir o enquadramento ANTES de entregar.

Uso:  python3 sistema/ferramentas/fotos.py "Meus Videos/<tema>"              (uma foto a cada ~2,5 s)
      python3 sistema/ferramentas/fotos.py "Meus Videos/<tema>" 3 12.5 30    (só esses segundos)
Salva em Meus Videos/<tema>/fotos/ (q_012.5s.jpg …) e junta todas numa folha: fotos/folha.jpg.
Usa o Google Chrome (ou o Edge) e o Node que o kit já usa. Não instala nada.
Olhe a folha procurando: texto cortado na borda, câmera perto demais, braço/cabeça tapando a cena, peça atravessando outra.
"""
import glob, json, math, os, random, shutil, subprocess, sys, tempfile
sys.dont_write_bytecode = True; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kit import *
from abrir import pagina_de


def navegador():
    if os.name == 'nt':
        cands = [os.path.expandvars(c) for c in (r'%ProgramFiles%\Google\Chrome\Application\chrome.exe', r'%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe',
                 r'%LocalAppData%\Google\Chrome\Application\chrome.exe', r'%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe', r'%ProgramFiles%\Microsoft\Edge\Application\msedge.exe')]
    elif sys.platform == 'darwin':
        cands = ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge']
    else:
        cands = [shutil.which(x) or '' for x in ('google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'microsoft-edge')]
    for c in cands:
        if c and os.path.exists(c): return c
    raise Erro('não achei o Google Chrome nem o Microsoft Edge neste computador (instale o Chrome: https://www.google.com/chrome/).')


def main():
    if len(sys.argv) < 2: raise Erro('uso: python3 sistema/ferramentas/fotos.py "Meus Videos/<tema>" [segundos …]')
    pasta = pasta_video(sys.argv[1]); pagina = pagina_de(sys.argv[1])
    ts = [float(x.replace(',', '.')) for x in sys.argv[2:]]
    if not ts:
        dur = (ler_json(os.path.join(pasta, 'audio', 'timeline.json'), {}) or {}).get('duration') or 30
        ts = [round(0.8 + k * 2.5, 1) for k in range(int((dur - 1) / 2.5) + 1)] + [round(dur - 1.5, 1)]
        ts = sorted(set(ts))
    saida = os.path.join(pasta, 'fotos'); os.makedirs(saida, exist_ok=True)
    for f in glob.glob(os.path.join(saida, 'q_*.jpg')): os.remove(f)
    with tempfile.TemporaryDirectory(prefix='fotos_kit_', ignore_cleanup_errors=True) as perfil:
        r = subprocess.run([node(), os.path.join(os.path.dirname(os.path.abspath(__file__)), 'quadros.mjs'), navegador(), pagina, saida, perfil,
                            str(random.randint(9300, 9899)), *[str(t) for t in ts]], capture_output=True, text=True, timeout=300)
    fs = sorted(glob.glob(os.path.join(saida, 'q_*.jpg')))
    if not fs: raise Erro('não saiu nenhuma foto. ' + (r.stderr or '').strip()[-300:])
    cols = min(8, len(fs)); lin = math.ceil(len(fs) / cols)
    lista = os.path.join(saida, '_lista.txt')
    with open(lista, 'w', encoding='utf-8') as f: f.write(''.join(f"file '{os.path.basename(x)}'\n" for x in fs))
    rodar([ffmpeg(), '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', lista, '-vf', f'scale=300:533,tile={cols}x{lin}', '-frames:v', '1',
           os.path.join(saida, 'folha.jpg')])
    os.remove(lista)
    print(f'OK — {len(fs)} fotos em {rel(saida)} · folha com todas: {rel(os.path.join(saida, "folha.jpg"))}')
    print('  segundos: ' + ', '.join(f'{t:g}' for t in ts))


if __name__ == '__main__':
    principal(main)
