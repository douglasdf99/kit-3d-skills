"""Gera a 'Biblioteca de Sons.html' na pasta do kit: todos os efeitos e trilhas, com botão de ouvir e busca.

Uso:  python3 sistema/ferramentas/sons.py
(efeito_novo.py e analisar_musica.py já refazem a página sozinhos.)
"""
import os, sys
sys.dont_write_bytecode = True; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kit import *

if __name__ == '__main__':
    def main():
        pagina_sons(); catalogo_efeitos_md()
        print('OK — Biblioteca de Sons.html atualizada.')
    principal(main)
