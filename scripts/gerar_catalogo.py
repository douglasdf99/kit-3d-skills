"""Gera kit/sistema/catalogo.json: a lista de todos os arquivos do kit (com tamanho) e os pacotes.
O baixar.py usa esse catálogo pra baixar só o que foi pedido.

Rode da raiz do repositório depois de mudar qualquer arquivo dentro de kit/:
  python scripts/gerar_catalogo.py
"""
import json, os, sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KIT = os.path.join(RAIZ, 'kit')
SAIDA = 'sistema/catalogo.json'

NUCLEO = [
    'CLAUDE.md', 'COMECE AQUI.txt', 'ESTADO-DE-VALIDACAO.txt', 'LICENCAS-E-ORIGENS-A-CONFERIR.txt',
    'Painel.html', 'Estilos.html', 'Biblioteca de Sons.html', 'Estilos - visao geral.jpg', 'package.json',
    'config/', 'sistema/',
    'biblioteca/efeitos/efeitos.json', 'biblioteca/efeitos/efeitos.md', 'biblioteca/musicas/musicas.json',
    'Exemplo - Lampada/video.json', 'Exemplo - Lampada/roteiro.txt', 'Exemplo - Lampada/cena/',
    'Meus Videos/.gitkeep',
]

CATEGORIAS = {
    'vozes_do_boneco': 'falas curtas em português, gritos, risadas, multidão', 'transicoes': 'whoosh, subidas, rebobinar, zoom, glitch',
    'aparecer_e_brilho': 'pop, brilho, tada, acerto', 'interface_e_eletronicos': 'cliques, bipes, alarmes, relógios, celular, erro',
    'eletricidade': 'choque, faísca, zumbido elétrico', 'agua': 'água, chuva e mar', 'fogo_e_calor': 'fogo, calor e frio',
    'ar_e_vento': 'ar, gás, vento e tempo', 'natureza_e_bichos': 'bichos e ambientes de fazenda, floresta e selva',
    'veiculos': 'carro, moto, trem, avião', 'passos_e_movimento': 'passos e movimento do boneco',
    'obra_e_construcao': 'ferramentas, martelo, serra, obra', 'impactos_e_quebras': 'batidas, quedas, quebras',
    'maquinas_e_mecanismos': 'engrenagens, motores, mecanismos', 'casa_e_objetos': 'portas, gavetas, objetos de casa',
    'humor': 'desenho animado: boing, apito, tapa, plateia rindo', 'cozinha_e_comida': 'cozinha e comida',
    'cidade_e_gente': 'trânsito, sirene, feira, festa, estádio', 'escola_e_escritorio': 'escola e escritório',
    'esportes_e_jogos': 'esportes e sons de videogame 8-bit', 'ficcao_e_espaco': 'laser, robô, nave, foguete',
    'suspense_e_terror': 'suspense e terror de desenho', 'musica_e_vinhetas': 'prato, gongo, fanfarra, acordes',
    'novos': 'efeitos criados com efeito_novo.py',
}


def longo(p):
    """caminho longo no Windows (pastas muito fundas passam de 260 caracteres)"""
    p = os.path.abspath(p)
    return '\\\\?\\' + p if os.name == 'nt' and not p.startswith('\\\\?\\') else p


def listar_arquivos():
    arqs = []
    base = longo(KIT)
    for dp, dn, fn in os.walk(base):
        dn.sort()
        dn[:] = [d for d in dn if d != '__pycache__']
        for f in sorted(fn):
            p = os.path.relpath(os.path.join(dp, f), base).replace(os.sep, '/')
            if p == SAIDA or f.startswith('.baixando_') or f == '.DS_Store' or f.endswith('.pyc'): continue
            if p.startswith('Meus Videos/') and p != 'Meus Videos/.gitkeep': continue
            if p == 'config/chave_elevenlabs.txt': continue
            arqs.append({'p': p, 't': os.path.getsize(os.path.join(dp, f))})
    return arqs


def mb(arqs, prefixo):
    return round(sum(a['t'] for a in arqs if a['p'].startswith(prefixo)) / 1e6, 1)


def main():
    arqs = listar_arquivos()
    caminhos = {a['p'] for a in arqs}
    for n in NUCLEO:
        if not (n in caminhos or any(c.startswith(n) for c in caminhos if n.endswith('/'))):
            sys.exit(f'item do núcleo não existe: {n}')
    est_dir = os.path.join(KIT, 'biblioteca', 'estilos')
    estilos = {}
    for n in sorted(os.listdir(est_dir), key=lambda n: (json.load(open(os.path.join(est_dir, n, 'estilo.json'), encoding='utf-8')).get('ordem', 99), n)):
        e = json.load(open(os.path.join(est_dir, n, 'estilo.json'), encoding='utf-8'))
        estilos[n] = {'mb': mb(arqs, f'biblioteca/estilos/{n}/'), 'titulo': e.get('nome', n), 'descricao': e.get('nome', n) + ': ' + e.get('descricao', '')}
    exemplos = {n: {'mb': mb(arqs, f'Exemplos/{n}/'), 'descricao': 'demo de 10 s do estilo ' + n} for n in sorted(os.listdir(os.path.join(KIT, 'Exemplos'))) if os.path.isdir(os.path.join(KIT, 'Exemplos', n))}
    exemplos['lampada'] = {'mb': mb(arqs, 'Exemplo - Lampada/'), 'descricao': 'vídeo de exemplo completo (2 min), o gabarito'}
    ef = json.load(open(os.path.join(KIT, 'biblioteca', 'efeitos', 'efeitos.json'), encoding='utf-8'))['efeitos']
    efeitos = {}
    for c in sorted({x['categoria'] for x in ef}):
        efeitos[c] = {'mb': mb(arqs, f'biblioteca/efeitos/{c}/'), 'n': sum(1 for x in ef if x['categoria'] == c),
                      'descricao': f"{sum(1 for x in ef if x['categoria'] == c)} sons: {CATEGORIAS.get(c, c)}"}
    obj_dir = os.path.join(KIT, 'biblioteca', 'personagens')
    objetos = {n: {'mb': mb(arqs, f'biblioteca/personagens/{n}/'), 'descricao': 'objetos 3D (GLB) prontos: ' + n} for n in sorted(os.listdir(obj_dir))}
    cat = {
        'versao': 1,
        'sobre': 'Catálogo gerado por scripts/gerar_catalogo.py. O baixar.py usa pra baixar só o que foi pedido.',
        'pacotes': {'nucleo': NUCLEO},
        'grupos': {'estilos': estilos, 'exemplos': exemplos, 'efeitos': efeitos, 'objetos': objetos,
                   'musicas': {'mb': mb(arqs, 'biblioteca/musicas/')}},
        'arquivos': arqs,
    }
    with open(os.path.join(KIT, *SAIDA.split('/')), 'w', encoding='utf-8', newline='\n') as f:
        json.dump(cat, f, ensure_ascii=False, separators=(',', ':'))
    print(f'catálogo: {len(arqs)} arquivos, {sum(a["t"] for a in arqs) / 1e6:.1f} MB, núcleo {sum(a["t"] for a in arqs if any(a["p"] == n or (n.endswith("/") and a["p"].startswith(n)) for n in NUCLEO)) / 1e6:.1f} MB')


if __name__ == '__main__':
    main()
