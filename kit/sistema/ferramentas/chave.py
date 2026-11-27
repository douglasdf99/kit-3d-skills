"""Salva a chave da ElevenLabs direto do Ctrl+C da pessoa: sem Bloco de Notas, sem colar no chat, sem mostrar a chave.

Uso (da pasta do kit), DEPOIS de a pessoa clicar em copiar a chave no site da ElevenLabs:
  python3 sistema/ferramentas/chave.py            pega a chave da área de transferência, salva, limpa a área e testa
  python3 sistema/ferramentas/chave.py --manter   igual, mas não limpa a área de transferência
  python3 sistema/ferramentas/chave.py testar     só testa a chave que já está salva

A chave vai pra config/chave_elevenlabs.txt (só neste computador; o arquivo nunca vai pro GitHub).
Nada aqui imprime a chave: no máximo os 4 últimos caracteres, como o site da ElevenLabs mostra.
"""
import os, re, shutil, subprocess, sys
sys.dont_write_bytecode = True; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kit import *

ARQ = os.path.join(CONFIG, 'chave_elevenlabs.txt')
FORMATO = re.compile(r'^sk_[A-Za-z0-9_\-]{20,200}$')


def _rodar(cmd, entrada=None):
    try:
        return subprocess.run(cmd, input=entrada, capture_output=True, text=True, encoding='utf-8', errors='replace', timeout=20)
    except (OSError, subprocess.TimeoutExpired):
        return None


def ler_area():
    """texto da área de transferência (Windows, Mac ou Linux)"""
    if os.name == 'nt':
        cands = [['powershell.exe', '-NoProfile', '-NonInteractive', '-Command', 'Get-Clipboard -Raw']]
    elif sys.platform == 'darwin':
        cands = [['pbpaste']]
    else:
        cands = [['wl-paste', '--no-newline'], ['xclip', '-selection', 'clipboard', '-o'], ['xsel', '--clipboard', '--output']]
    for c in cands:
        if not shutil.which(c[0]): continue
        r = _rodar(c)
        if r is not None and r.returncode == 0: return r.stdout or ''
    raise Erro('não consegui ler a área de transferência deste computador. Cole a chave no arquivo config/chave_elevenlabs.txt e salve.')


def limpar_area():
    """apaga a chave da área de transferência (pra ela não ser colada sem querer em outro lugar)"""
    if os.name == 'nt':
        _rodar(['powershell.exe', '-NoProfile', '-NonInteractive', '-STA', '-Command', 'Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Clipboard]::Clear()'])
    elif sys.platform == 'darwin':
        _rodar(['pbcopy'], entrada='')
    elif shutil.which('wl-copy'):
        _rodar(['wl-copy', '--clear'])
    elif shutil.which('xclip'):
        _rodar(['xclip', '-selection', 'clipboard', '-i'], entrada='')


def testar():
    s = eleven('/v1/user/subscription', timeout=30)
    usados, limite = s.get('character_count', 0), s.get('character_limit', 0)
    fmt = lambda n: f'{n:,}'.replace(',', '.')
    print(f'OK — a chave funciona · plano {s.get("tier")} · créditos: {fmt(limite - usados)} sobrando de {fmt(limite)} neste mês')
    if str(s.get('tier', '')).lower() == 'free':
        print('  lembrete: o plano grátis não tem licença comercial (serve pra testar). Pra anúncio pago, use o Starter.')


def salvar(manter=False):
    k = re.sub(r'\s+', '', ler_area())
    if not k:
        raise Erro('a área de transferência está vazia. No site da ElevenLabs, clique no botão de copiar ao lado da chave e rode de novo.')
    if not FORMATO.match(k):
        raise Erro('o que está copiado não parece uma chave da ElevenLabs (ela começa com sk_). '
                   'Copie a chave de novo no site (botão de copiar ao lado dela) e rode de novo.')
    os.makedirs(CONFIG, exist_ok=True)
    with open(ARQ, 'w', encoding='utf-8') as f: f.write(k + '\n')
    try: os.chmod(ARQ, 0o600)                           # só a própria pessoa lê o arquivo (Mac/Linux)
    except OSError: pass
    if not manter: limpar_area()
    print(f'OK — chave salva em config/chave_elevenlabs.txt (termina em …{k[-4:]})' + ('' if manter else ' · área de transferência limpa'))
    testar()


if __name__ == '__main__':
    def main():
        a = sys.argv[1:]
        if a and a[0] == 'testar': testar()
        else: salvar(manter='--manter' in a)
    principal(main)
