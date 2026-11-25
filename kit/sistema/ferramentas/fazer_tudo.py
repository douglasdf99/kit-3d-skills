"""Depois de mexer na cena: confere, monta o áudio e a página, e atualiza o painel — tudo de uma vez.

Uso:  python3 sistema/ferramentas/fazer_tudo.py "Meus Videos/<tema>"
      (a narração é separada: narrar.py, só quando o roteiro muda)
"""
import os, sys
sys.dont_write_bytecode = True; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kit import *
from conferir import conferir
from montar_audio import montar_audio
from montar_pagina import montar
import painel

if __name__ == '__main__':
    def main():
        if len(sys.argv) < 2: raise Erro('uso: python3 sistema/ferramentas/fazer_tudo.py "Meus Videos/<tema>"')
        p = pasta_video(sys.argv[1])
        print('1/3 conferindo a cena…'); conferir(p)
        print('2/3 montando o áudio…'); montar_audio(p)
        print('3/3 montando a página…'); s = montar(p)
        painel.atualizar(silencioso=True)
        print(f'\nPRONTO. Abra no Google Chrome: {rel(s)}')
    principal(main)
