"""Termina a instalação dos complementos da skill criativo-video-reels (rode da pasta do kit, depois de criar os arquivos).

Uso:  python3 sistema/ferramentas/instalar_complementos.py
Ajusta a página do vídeo (pagina.js), baixa a logo do evento, avisa o manual do kit e marca a versão. Pode rodar de novo sem medo.
"""
import json, os, shutil, subprocess, sys, urllib.request
KIT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
VERSAO = '2026-11-26'
LOGO_URL = 'https://vendatodosantodia.com.br/_next/static/media/logo.d6b19741.svg'
PRECISA = ['sistema/ferramentas/chave.py', 'sistema/ferramentas/abrir.py', 'sistema/ferramentas/rascunho.py',
           'sistema/modelos/cena_anuncio.js', 'sistema/motor/pagina/pagina.html', 'sistema/motor/pagina/pagina.css',
           'sistema/instrucoes/09_criativo_anuncio.md']
SECAO = """
<!-- complementos-criativo -->
## Criativo de anúncio (skill criativo-video-reels)

Se a pessoa chegou com uma **copy de anúncio aprovada** (problema-solução, 25 a 40 s, última frase "Clique no link abaixo…"),
não use o formato da série: siga `sistema/instrucoes/09_criativo_anuncio.md`. Ferramentas extras desta skill:
`chave.py` (salva a chave da ElevenLabs pelo Ctrl+C), `rascunho.py` (narração grátis pra montar a cena) e
`abrir.py "Meus Videos/<x>"` (abre a página do vídeo no Chrome da pessoa; use no fim de toda entrega).
"""
TROCAS = [
    ('  const INFO = window.__INFO__ || {};\n',
     "  const INFO = window.__INFO__ || {};\n  const APP = document.querySelector('.app');\n  const etapa = (n) => { if (APP) APP.dataset.etapa = String(n); };   // funil do topo: 1 assistir · 2 gerar · 3 ajustar\n  const pôr = (id, txt) => { const el = $(id); if (el) el.textContent = txt; };\n"),
    ("    pausar(); ocupado = true; blobOut = null; $('save').hidden = true; $('go').disabled = true; $('status').className = '';\n",
     "    pausar(); ocupado = true; blobOut = null; $('save').hidden = true; $('go').disabled = true; $('status').className = ''; etapa(2);\n"),
    ("      $('status').className = 'ok'; $('save').hidden = false;\n",
     "      $('status').className = 'ok'; $('save').hidden = false; etapa(3);\n"),
    ("    $('titulo').textContent = `${INFO.tema || INFO.titulo || 'Vídeo'} — versão ${INFO.versao || 1}`;\n",
     "    $('titulo').textContent = INFO.tema || INFO.titulo || 'Vídeo';\n    pôr('titulo2', `versão ${INFO.versao || 1} · carregando a cena…`);\n    const vs = $('ver-seguro'); if (vs && APP) vs.onchange = () => APP.classList.toggle('com-seguro', vs.checked);\n"),
    ("    $('info').textContent = [INFO.canal, 'duração ' + fmt(D).replace(/\\.\\d$/, ''), INFO.estilo && ('estilo ' + INFO.estilo), INFO.musica && ('música ' + INFO.musica), INFO.gerado && ('montado em ' + INFO.gerado)].filter(Boolean).join(' · ');\n",
     "    $('info').textContent = [INFO.canal, INFO.gerado && ('montado em ' + INFO.gerado)].filter(Boolean).join(' · ');\n    pôr('titulo2', `versão ${INFO.versao || 1} · pronta pra virar MP4`);\n    pôr('k-dur', fmt(D).replace(/\\.\\d$/, '')); pôr('k-estilo', INFO.estilo || '–'); pôr('k-musica', INFO.musica && INFO.musica !== 'nenhuma' ? INFO.musica : 'sem trilha');\n    etapa(1);\n"),
    ("    $('status').textContent = 'Tudo pronto. Assista à prévia ou clique em Renderizar.';\n",
     "    $('status').textContent = 'Tudo pronto. Assista à prévia ou clique em Gerar vídeo final.';\n"),
]


def baixar_logo(destino):
    try:
        req = urllib.request.Request(LOGO_URL, headers={'User-Agent': 'kit-3d'})
        dados = urllib.request.urlopen(req, timeout=30).read()
        if dados.lstrip().startswith(b'<svg'): open(destino, 'wb').write(dados); return True
    except Exception:
        pass
    if shutil.which('curl'):
        r = subprocess.run(['curl', '-fsSL', '-o', destino, LOGO_URL], capture_output=True)
        return r.returncode == 0 and os.path.exists(destino)
    return False


def main():
    faltam = [p for p in PRECISA if not os.path.exists(os.path.join(KIT, *p.split('/')))]
    if faltam:
        sys.exit('ERRO: ainda faltam arquivos dos complementos (crie a partir do Anexo B do md): ' + ', '.join(faltam))
    pj = os.path.join(KIT, 'sistema', 'motor', 'pagina', 'pagina.js')
    s = open(pj, encoding='utf-8').read()
    if 'const APP = document.querySelector' not in s:
        for antes, depois in TROCAS:
            if s.count(antes) != 1:
                sys.exit('ERRO: o pagina.js do kit não é o esperado (o kit do GitHub mudou?). Trecho não encontrado: ' + antes[:80])
            s = s.replace(antes, depois)
        with open(pj, 'w', encoding='utf-8', newline='\n') as f: f.write(s)
    logo = os.path.join(KIT, 'sistema', 'motor', 'pagina', 'logo.svg')
    tem_logo = os.path.exists(logo) or baixar_logo(logo)
    manual = os.path.join(KIT, 'CLAUDE.md')
    if '<!-- complementos-criativo -->' not in open(manual, encoding='utf-8').read():
        with open(manual, 'a', encoding='utf-8') as f: f.write(SECAO)
    chave = os.path.join(KIT, 'config', 'chave_elevenlabs.txt')
    if not os.path.exists(chave):
        os.makedirs(os.path.dirname(chave), exist_ok=True); open(chave, 'w', encoding='utf-8').close()
    with open(os.path.join(KIT, 'sistema', 'complementos_skill.json'), 'w', encoding='utf-8') as f:
        json.dump({'skill': 'criativo-video-reels', 'versao': VERSAO}, f, ensure_ascii=False, indent=2)
    print(f'OK — complementos instalados (versão {VERSAO}).' + ('' if tem_logo else ' Aviso: não consegui baixar a logo; a página mostra "Vídeo 3D" no lugar.'))


if __name__ == '__main__':
    main()
