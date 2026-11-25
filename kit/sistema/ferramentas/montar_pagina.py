"""Monta a página "ABRIR NO CHROME - <título> v<N>.html" de um vídeo: um arquivo só, com a cena, o motor,
as fontes e o áudio dentro. É só dar dois cliques (no Chrome) pra assistir e renderizar.

Uso:  python3 sistema/ferramentas/montar_pagina.py "Meus Videos/<tema>"
"""
import base64, datetime, json, os, sys
sys.dont_write_bytecode = True; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kit import *


def js(v):
    return json.dumps(v, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/').replace('\u2028', '\\u2028').replace('\u2029', '\\u2029')


def fontes_css(est):
    cat = ler_json(os.path.join(MOTOR, 'fontes', 'fontes.json'))
    fams = []
    for q in ('letreiro', 'plaquinha', 'legenda', 'fala', 'assinatura'):
        f = (est.get(q) or {}).get('fonte')
        if f and f not in fams: fams.append(f)
    for f in est.get('fontes_extras', []):
        if f not in fams: fams.append(f)
    css = []
    for f in fams:
        if f not in cat: raise Erro(f'a fonte "{f}" do estilo não está no kit (veja sistema/motor/fontes/fontes.json)')
        for peso, arq in cat[f].items():
            b = base64.b64encode(open(os.path.join(MOTOR, 'fontes', arq), 'rb').read()).decode()
            css.append(f"@font-face{{font-family:'{f}';font-weight:{peso};font-style:normal;src:url(data:font/woff2;base64,{b}) format('woff2')}}")
    return '\n'.join(css)


def montar(pasta, silencioso=False):
    globais, v, est = globais_cena(pasta)
    entrada = id_de(os.path.join(pasta, 'cena', 'cena.js'))
    ordem, fontes = grafo_modulos(entrada)
    mux = 'sistema/motor/vendor/mp4-muxer.mjs'
    fontes[mux] = open(os.path.join(KIT, mux), encoding='utf-8').read(); ordem = [mux] + ordem
    aac = os.path.join(pasta, 'audio', 'mix.aac'); mp3 = os.path.join(pasta, 'audio', 'mix.mp3')
    tem_audio = os.path.exists(aac) and os.path.exists(mp3)
    c = canal()
    mus = next((m for m in musicas() if m['id'] == v.get('musica')), None)
    titulo = v.get('titulo') or v.get('id')
    info = {'titulo': titulo, 'tema': v.get('tema') or titulo, 'versao': v.get('versao', 1), 'arquivo': f"{titulo} v{v.get('versao', 1)}.mp4",
            'canal': globais['__CANAL__']['nome'], 'estilo': est.get('nome'), 'musica': (mus or {}).get('titulo') or v.get('musica'),
            'gerado': datetime.datetime.now().strftime('%d/%m/%Y %H:%M')}
    base = os.path.join(MOTOR, 'pagina')
    css = open(os.path.join(base, 'pagina.css'), encoding='utf-8').read()
    corpo = open(os.path.join(base, 'pagina.html'), encoding='utf-8').read()
    pjs = open(os.path.join(base, 'pagina.js'), encoding='utf-8').read()
    partes = ['<!doctype html>\n<html lang="pt-BR">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">',
              f'<title>{titulo} v{info["versao"]}</title>', '<style>', fontes_css(est), css, '</style>\n</head>\n<body>', corpo,
              '<script>', f'window.__INFO__={js(info)};', f'window.__TIMELINE__={js(globais["__TIMELINE__"])};',
              f'window.__ESTILO__={js(globais["__ESTILO__"])};', f'window.__CANAL__={js(globais["__CANAL__"])};', '</script>']
    if tem_audio:
        partes += ['<script>', 'window.__AUDIO_AAC__="' + base64.b64encode(open(aac, 'rb').read()).decode() + '";',
                   'window.__AUDIO_MP3__="' + base64.b64encode(open(mp3, 'rb').read()).decode() + '";', '</script>']
    partes += ['<script>', f'window.__ORDEM__={js(ordem)};', f'window.__ENTRADA__={js(entrada)};', 'window.__MODS__={'
               + ','.join(js(k) + ':' + js(fontes[k]) for k in ordem) + '};', '</script>', '<script>', pjs, '</script>', '</body>\n</html>\n']
    saida = os.path.join(pasta, nome_pagina(v))
    with open(saida, 'w', encoding='utf-8') as f: f.write('\n'.join(partes))
    if not silencioso:
        print(f'OK — página pronta: {rel(saida)} ({os.path.getsize(saida) / 1e6:.1f} MB)' + ('' if tem_audio else '  (ATENÇÃO: ainda sem áudio — rode montar_audio.py e depois esta ferramenta de novo)'))
    return saida


if __name__ == '__main__':
    def main():
        if len(sys.argv) < 2: raise Erro('uso: python3 sistema/ferramentas/montar_pagina.py "Meus Videos/<tema>"')
        montar(pasta_video(sys.argv[1]))
    principal(main)
