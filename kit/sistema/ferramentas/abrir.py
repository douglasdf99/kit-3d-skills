"""Abre a página do vídeo ("ABRIR NO CHROME - ….html") direto no navegador da pessoa, sem precisar de extensão nenhuma.

Uso:  python3 sistema/ferramentas/abrir.py "Meus Videos/<tema>"      (abre a versão mais nova)
      python3 sistema/ferramentas/abrir.py "<caminho do .html>"

Prefere o Google Chrome (é o que gera o MP4); se não tiver, tenta o Microsoft Edge; se não, o navegador padrão
(e avisa que pra gerar o MP4 precisa do Chrome ou do Edge).
"""
import glob, os, shutil, subprocess, sys
sys.dont_write_bytecode = True; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kit import *

CHROME_WIN = [r'%ProgramFiles%\Google\Chrome\Application\chrome.exe', r'%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe',
              r'%LocalAppData%\Google\Chrome\Application\chrome.exe']
EDGE_WIN = [r'%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe', r'%ProgramFiles%\Microsoft\Edge\Application\msedge.exe']


def pagina_de(arg):
    if arg.lower().endswith('.html'):
        p = arg if os.path.isabs(arg) else os.path.join(KIT, arg)
        if not os.path.exists(p): raise Erro(f'não achei a página {arg}')
        return os.path.abspath(p)
    pasta = pasta_video(arg)
    paginas = sorted(glob.glob(os.path.join(pasta, 'ABRIR NO CHROME - *.html')), key=os.path.getmtime)
    if not paginas: raise Erro(f'ainda não tem página nesse vídeo. Rode antes: python3 sistema/ferramentas/fazer_tudo.py "{rel(pasta)}"')
    return paginas[-1]


def abrir(p):
    """abre e devolve o nome do navegador usado"""
    if os.name == 'nt':
        for nome, lista in (('Google Chrome', CHROME_WIN), ('Microsoft Edge', EDGE_WIN)):
            for c in lista:
                exe = os.path.expandvars(c)
                if os.path.exists(exe):
                    subprocess.Popen([exe, p]); return nome
        os.startfile(p); return 'o navegador padrão'
    if sys.platform == 'darwin':
        for nome in ('Google Chrome', 'Microsoft Edge'):
            if subprocess.run(['open', '-a', nome, p], capture_output=True).returncode == 0: return nome
        subprocess.run(['open', p]); return 'o navegador padrão'
    for exe in ('google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'microsoft-edge'):
        if shutil.which(exe):
            subprocess.Popen([exe, p], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); return exe
    if shutil.which('xdg-open'):
        subprocess.Popen(['xdg-open', p]); return 'o navegador padrão'
    raise Erro('não consegui abrir um navegador aqui. Abra o arquivo na mão: ' + p)


if __name__ == '__main__':
    def main():
        if len(sys.argv) < 2: raise Erro('uso: python3 sistema/ferramentas/abrir.py "Meus Videos/<tema>"')
        p = pagina_de(sys.argv[1])
        nav = abrir(p)
        print(f'OK — abri "{os.path.basename(p)}" no {nav}.')
        if nav == 'o navegador padrão':
            print('  aviso: pra gerar o MP4 a página precisa do Google Chrome ou do Microsoft Edge. '
                  'Se o botão não funcionar, instale o Chrome (https://www.google.com/chrome/) e rode de novo.')
    principal(main)
