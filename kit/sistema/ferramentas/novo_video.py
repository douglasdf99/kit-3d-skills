"""Cria a pasta de um vídeo novo em "Meus Videos/<nome>" com tudo no lugar.

Uso:  python3 sistema/ferramentas/novo_video.py "Guarda-chuva" [--estilo padrao] [--musica ideia_brilhante]
"""
import datetime, os, re, shutil, sys
sys.dont_write_bytecode = True; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kit import *

ROTEIRO = """# Roteiro: {tema}
# Uma fala por linha. Linhas que começam com # são ignoradas.
# Formato da série: problema → "Então você..." → "Esse é o/a <peça>." … → "Parabéns! Você construiu um/uma {tema_min}."
# Outro tipo de vídeo (terror, curiosidade, lista, "E se…?"…): veja sistema/instrucoes/02b_outros_formatos.md
# A ÚLTIMA linha é a chamada final, ex.: Comente "luz" se você não sabia dessa!
# Escreva números por extenso (dois mil graus), do jeito que a voz vai falar.
"""


def novo(titulo, estilo=None, musica=None):
    c = canal()
    titulo_arq = re.sub(r'[\\/:*?"<>|]+', '', titulo).strip()
    if not titulo_arq: raise Erro('dê um nome pro vídeo, ex.: novo_video.py "Guarda-chuva"')
    sid = slug(titulo)
    pasta = os.path.join(VIDEOS, sid)
    if os.path.exists(pasta): raise Erro(f'já existe um vídeo com esse nome: {rel(pasta)}')
    estilo = estilo or c['estilo']; musica = musica or c['musica_padrao']
    os.makedirs(os.path.join(pasta, 'cena')); os.makedirs(os.path.join(pasta, 'audio'))
    from kit import estilo as carregar_estilo
    carregar_estilo(estilo)   # confere se existe
    salvar_json(os.path.join(pasta, 'video.json'), {
        'id': sid, 'titulo': titulo_arq, 'tema': titulo, 'versao': 1, 'etapa': 1, 'nota': 'Ideia registrada.',
        'estilo': estilo, 'musica': musica, 'criado': datetime.date.today().isoformat()})
    open(os.path.join(pasta, 'roteiro.txt'), 'w', encoding='utf-8').write(ROTEIRO.format(tema=titulo, tema_min=titulo.lower()))
    # cada estilo tem a sua cena de partida (biblioteca/estilos/<estilo>/cena_modelo.js); sem ela, usa a do Padrão
    modelo = os.path.join(BIBLIOTECA, 'estilos', estilo, 'cena_modelo.js')
    if not os.path.exists(modelo): modelo = os.path.join(SISTEMA, 'modelos', 'cena_modelo.js')
    cena = open(modelo, encoding='utf-8').read().replace('__TEMA__', titulo)
    open(os.path.join(pasta, 'cena', 'cena.js'), 'w', encoding='utf-8').write(cena)
    guia = os.path.join(BIBLIOTECA, 'estilos', estilo, 'GUIA.md')
    print(f'OK — vídeo criado em {rel(pasta)} (estilo {estilo}, música {musica}). Próximo passo: escrever o roteiro.txt')
    if os.path.exists(guia): print(f'Antes de montar a cena, leia o guia do estilo: {rel(guia)}')
    return pasta


if __name__ == '__main__':
    def main():
        a = [x for x in sys.argv[1:]]
        if not a: raise Erro('uso: python3 sistema/ferramentas/novo_video.py "Nome do vídeo" [--estilo padrao] [--musica id]')
        def opt(n):
            if n in a: i = a.index(n); v = a[i + 1]; del a[i:i + 2]; return v
        e, m = opt('--estilo'), opt('--musica')
        novo(' '.join(a), e, m)
    principal(main)
