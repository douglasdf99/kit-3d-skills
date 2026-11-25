"""Confere se está tudo pronto pra fazer vídeos (programas, pasta do kit, chave e créditos da ElevenLabs).

Uso:  python3 sistema/ferramentas/verificar.py
"""
import importlib, os, shutil, subprocess, sys
sys.dont_write_bytecode = True; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kit import *

ok_total = True
def linha(ok, txt, dica=''):
    global ok_total
    ok_total = ok_total and ok
    print(('  [OK]   ' if ok else '  [FALTA] ') + txt + ('' if ok or not dica else '\n           → ' + dica))


def pip(pacote):
    r = subprocess.run([sys.executable, '-m', 'pip', 'install', '-q', '--break-system-packages', pacote], capture_output=True, text=True)
    if r.returncode != 0: r = subprocess.run([sys.executable, '-m', 'pip', 'install', '-q', pacote], capture_output=True, text=True)
    return r.returncode == 0


def main():
    print('Conferindo o computador do Claude…')
    linha(sys.version_info >= (3, 8), f'Python {sys.version.split()[0]}')
    try: import numpy; linha(True, f'numpy {numpy.__version__}')
    except ImportError:
        linha(pip('numpy'), 'numpy (instalei agora)' if importlib.util.find_spec('numpy') else 'numpy', 'rode: pip install numpy --break-system-packages')
    f = shutil.which('ffmpeg')
    if not f and pip('imageio-ffmpeg'):
        try: import imageio_ffmpeg; f = imageio_ffmpeg.get_ffmpeg_exe()
        except Exception: f = None
    linha(bool(f), 'ffmpeg (áudio)', 'rode: pip install imageio-ffmpeg --break-system-packages')
    if f:
        enc = subprocess.run([f, '-hide_banner', '-encoders'], capture_output=True, text=True).stdout
        linha('libmp3lame' in enc and ' aac ' in enc, 'ffmpeg com MP3 e AAC', 'o ffmpeg instalado não tem MP3/AAC — rode: pip install imageio-ffmpeg --break-system-packages')
    n = shutil.which('node')
    v = subprocess.run([n, '--version'], capture_output=True, text=True).stdout.strip() if n else ''
    linha(bool(n) and int((v.lstrip('v').split('.') or ['0'])[0] or 0) >= 18, f'Node.js {v or "(não encontrado)"}', 'precisa do Node 18 ou mais novo (o Claude consegue instalar: sudo apt-get install -y nodejs)')
    print('\nConferindo a pasta do kit…')
    for p in ['sistema/motor/video.js', 'sistema/motor/vendor/three.module.js', 'sistema/motor/pagina/pagina.js', 'biblioteca/musicas/musicas.json', 'biblioteca/efeitos/efeitos.json', 'Painel.html', 'Exemplo - Lampada/video.json']:
        linha(os.path.exists(os.path.join(KIT, p)), p, 'arquivo do kit faltando — copie a pasta do kit de novo')
    cp = os.path.join(CONFIG, 'canal.json')
    if not os.path.exists(cp): salvar_json(cp, CANAL_PADRAO)
    c = canal()
    linha(c['nome'] != 'Meu Canal', f'nome do canal: {c["nome"]}', 'ainda não configurado (config/canal.json → "nome")')
    linha(bool(c['voz_id']), f'voz escolhida: {c.get("voz_nome") or c["voz_id"] or "(nenhuma)"}', 'escolha a voz: python3 sistema/ferramentas/vozes.py listar')
    print('\nConferindo a ElevenLabs…')
    try:
        chave()
    except Erro as e:
        linha(False, 'chave da ElevenLabs', str(e)); return fim()
    try:
        s = eleven('/v1/user/subscription', timeout=30)
        usados, limite = s.get('character_count', 0), s.get('character_limit', 0)
        linha(True, f'chave funcionando · plano {s.get("tier")} · créditos usados {usados:,} de {limite:,}'.replace(',', '.'))
        sobra = limite - usados
        linha(sobra > 3000, f'créditos sobrando: {sobra:,}'.replace(',', '.') + ' (um vídeo de ~2 min gasta uns 2.500)', 'poucos créditos — espere renovar ou aumente o plano')
        if str(s.get('tier', '')).lower() == 'free':
            print('           atenção: no plano grátis a ElevenLabs costuma bloquear o acesso pelo Claude ("atividade incomum") e não permite uso comercial. O Starter resolve.')
    except Erro as e:
        linha(False, 'acesso à ElevenLabs', str(e))
    fim()


def fim():
    print('\n' + ('TUDO CERTO — dá pra fazer vídeos.' if ok_total else 'Falta resolver os itens marcados com [FALTA].'))


if __name__ == '__main__':
    principal(main)
