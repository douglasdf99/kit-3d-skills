"""Atualiza o Painel (Painel.html na pasta do kit) com todos os vídeos e a etapa de cada um.

Uso:  python3 sistema/ferramentas/painel.py
      python3 sistema/ferramentas/painel.py etapa "Meus Videos/<tema>" 5 "nota opcional"

Etapas: 1 Ideia · 2 Roteiro p/ aprovar · 3 Em produção · 4 Pronto p/ renderizar · 5 Em revisão · 6 Pronto p/ postar · 7 Postado
A etapa e a nota de cada vídeo ficam no video.json dele ("etapa", "nota").
"""
import datetime, glob, json, os, sys
sys.dont_write_bytecode = True; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kit import *

ETAPAS = ['Ideia', 'Roteiro p/ aprovar', 'Em produção', 'Pronto p/ renderizar', 'Em revisão', 'Pronto p/ postar', 'Postado']
PROXIMO = {1: ('Claude', 'Escrever o roteiro'), 2: ('Você', 'Ler e aprovar o roteiro'), 3: ('Claude', 'Montar a cena e o áudio'),
           4: ('Você', 'Abrir a página no Chrome e renderizar'), 5: ('Você', 'Assistir e dizer o que mudar (ou aprovar)'),
           6: ('Você', 'Postar o vídeo'), 7: ('—', '—')}


def atualizar(silencioso=False):
    itens = []
    pastas = sorted(glob.glob(os.path.join(VIDEOS, '*', 'video.json'))) + sorted(glob.glob(os.path.join(KIT, 'Exemplo - *', 'video.json')))
    for vj in pastas:
        p = os.path.dirname(vj)
        try: v = ler_json(vj)
        except Erro: continue
        n = int(v.get('etapa', 1)); quem, prox = PROXIMO.get(n, ('Claude', ''))
        pag = os.path.join(p, nome_pagina({**v, 'versao': v.get('versao', 1)}))
        rot = os.path.join(p, 'roteiro.txt')
        txt = '\n'.join(l.rstrip() for l in open(rot, encoding='utf-8') if l.strip() and not l.startswith('#')) if os.path.exists(rot) else ''
        thumb = next((os.path.join(p, f) for f in ('miniatura.jpg', 'miniatura.png') if os.path.exists(os.path.join(p, f))), None)
        mp4 = next(iter(sorted(glob.glob(os.path.join(p, '*.mp4')))), None)
        itens.append({
            'id': v.get('id'), 'tema': v.get('tema') or v.get('titulo'), 'etapa_n': n, 'etapa': ETAPAS[n - 1], 'quem': quem, 'proximo': v.get('proximo') or prox,
            'versao': f"v{v.get('versao', 1)}", 'pasta': rel(p).replace('\\', '/'), 'nota': v.get('nota', ''), 'ideia': v.get('ideia', ''),
            'render': rel(pag).replace('\\', '/') if os.path.exists(pag) and n in (4, 5) else None,
            'pagina': rel(pag).replace('\\', '/') if os.path.exists(pag) else None,
            'video': rel(mp4).replace('\\', '/') if mp4 else None, 'thumb': rel(thumb).replace('\\', '/') if thumb else None,
            'roteiro_texto': txt, 'exemplo': bool(v.get('exemplo'))})
    c = canal()
    dados = os.path.join(SISTEMA, 'painel', 'dados.js')
    os.makedirs(os.path.dirname(dados), exist_ok=True)
    agora = datetime.datetime.now().strftime('%d/%m/%Y %H:%M')
    with open(dados, 'w', encoding='utf-8') as f:
        f.write('window.PAINEL_CANAL = ' + json.dumps(c['nome'], ensure_ascii=False) + ';\n')
        f.write('window.PAINEL_DADOS = ' + json.dumps(itens, ensure_ascii=False, indent=1) + ';\n')
        f.write('window.PAINEL_ATUALIZADO = "' + agora + '";\n')
    if not silencioso: print(f'OK — painel atualizado ({len(itens)} vídeos). Abra o Painel.html da pasta do kit.')


def mudar_etapa(arg, n, nota=None):
    p = pasta_video(arg); vj = os.path.join(p, 'video.json'); v = ler_json(vj)
    n = int(n)
    if not 1 <= n <= 7: raise Erro('etapa vai de 1 a 7')
    v['etapa'] = n
    if nota is not None: v['nota'] = nota
    salvar_json(vj, v); atualizar(silencioso=True)
    print(f'OK — {v.get("tema")}: etapa {n} ({ETAPAS[n - 1]})')


if __name__ == '__main__':
    def main():
        a = sys.argv[1:]
        if a and a[0] == 'etapa':
            if len(a) < 3: raise Erro('uso: painel.py etapa "Meus Videos/<tema>" <1-7> ["nota"]')
            mudar_etapa(a[1], a[2], a[3] if len(a) > 3 else None)
        else: atualizar()
    principal(main)
