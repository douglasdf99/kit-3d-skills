"""Baixa do GitHub SÓ o que você precisa do kit (sem zip gigante). Só usa Python, nada pra instalar.

Uso (de qualquer pasta):
  python baixar.py lista                              mostra os pacotes e o tamanho de cada um
  python baixar.py nucleo                             motor 3D + ferramentas + instruções + catálogos (~4 MB)
  python baixar.py estilo:cubinhos                    um estilo (boneco, cenário, guia de edição, demo de 10 s)
  python baixar.py exemplo:cubinhos                   a demo pronta de um estilo   (exemplo:lampada = vídeo completo)
  python baixar.py efeitos:agua                       uma categoria inteira de efeitos sonoros
  python baixar.py efeito:vaca_mugindo efeito:pop     efeitos soltos, pelo nome
  python baixar.py musica:oficina_curiosa             uma trilha     (musicas = as 30)
  python baixar.py objetos:praia                      objetos 3D prontos (praia, montanha)
  python baixar.py video "Meus Videos/<x>"            só os sons, a trilha e os objetos que a cena desse vídeo usa
  python baixar.py tudo                               o kit inteiro (~240 MB)

Opções:
  --destino PASTA   onde fica o kit (padrão: a pasta do kit onde este arquivo está;
                    fora de um kit: ./Desmontando o Video - Kit)
  --repo DONO/NOME  outro repositório (padrão: o de sistema/origem.json)
  --so              baixa só o que foi pedido, sem o núcleo (ex.: só uns efeitos sonoros pra outro projeto)

As ferramentas do kit também chamam este arquivo sozinhas: se a cena usa um efeito, uma trilha, um estilo
ou um objeto 3D que ainda não está no computador, ele baixa só aquele arquivo na hora.
"""
import concurrent.futures, json, os, re, sys, tempfile, time, urllib.parse, urllib.request

REPO_PADRAO = 'douglasdf99/kit-3d-skills'
RAMO_PADRAO = 'main'
PASTA_NO_REPO = 'kit'
NOME_KIT = 'Desmontando o Video - Kit'
CATALOGO = 'sistema/catalogo.json'

AQUI = os.path.dirname(os.path.abspath(__file__))


class ErroDownload(Exception):
    pass


# ------------------------------------------------------------------ onde está o kit e de onde baixar
def kit_local():
    """se este arquivo está dentro de um kit (sistema/ferramentas/), devolve a pasta do kit"""
    k = os.path.dirname(os.path.dirname(AQUI))
    return k if os.path.basename(AQUI) == 'ferramentas' and os.path.exists(os.path.join(k, 'CLAUDE.md')) else None


def origem(kit, repo=None):
    o = {'repo': REPO_PADRAO, 'ramo': RAMO_PADRAO, 'pasta': PASTA_NO_REPO}
    try:
        o.update(json.load(open(os.path.join(kit, 'sistema', 'origem.json'), encoding='utf-8')))
    except Exception:
        pass
    if os.environ.get('KIT3D_REPO'): o['repo'] = os.environ['KIT3D_REPO']
    if repo: o['repo'] = repo
    return o


def url_de(o, rel):
    caminho = '/'.join(urllib.parse.quote(s) for s in (o['pasta'] + '/' + rel).split('/'))
    espelho = os.environ.get('KIT3D_URL_BASE')   # outro servidor/espelho (ou um teste local): http://host/raiz-do-repo
    if espelho: return espelho.rstrip('/') + '/' + caminho
    return f"https://raw.githubusercontent.com/{o['repo']}/{o['ramo']}/{caminho}"


def _longo(p):
    p = os.path.abspath(p)
    if os.name == 'nt' and not p.startswith('\\\\?\\') and len(p) > 240:
        return '\\\\?\\' + p
    return p


def _baixar_um(o, kit, rel, tamanho=None, tentativas=3):
    destino = _longo(os.path.join(kit, *rel.split('/')))
    if os.path.exists(destino) and (tamanho is None or os.path.getsize(destino) == tamanho):
        return 0
    os.makedirs(os.path.dirname(destino), exist_ok=True)
    ultimo = None
    for i in range(tentativas):
        try:
            req = urllib.request.Request(url_de(o, rel), headers={'User-Agent': 'kit-3d-baixar'})
            with urllib.request.urlopen(req, timeout=60) as r:
                dados = r.read()
            fd, tmp = tempfile.mkstemp(dir=os.path.dirname(destino), prefix='.baixando_')
            with os.fdopen(fd, 'wb') as f:
                f.write(dados)
            os.replace(tmp, destino)
            return len(dados)
        except Exception as e:  # rede instável: tenta de novo
            ultimo = e
            time.sleep(1.5 * (i + 1))
    raise ErroDownload(f'não consegui baixar {rel} ({ultimo})')


def catalogo(o, kit, atualizar=False):
    p = os.path.join(kit, *CATALOGO.split('/'))
    if atualizar or not os.path.exists(p):
        if os.path.exists(p): os.remove(p)
        _baixar_um(o, kit, CATALOGO)
    return json.load(open(p, encoding='utf-8'))


def _json_do_kit(o, kit, rel):
    p = os.path.join(kit, *rel.split('/'))
    if not os.path.exists(p): _baixar_um(o, kit, rel)
    return json.load(open(p, encoding='utf-8'))


# ------------------------------------------------------------------ pacotes
def prefixos_do_pacote(nome, cat):
    """nome do pacote → lista de prefixos/arquivos (relativos à pasta do kit)"""
    tipo, _, alvo = nome.partition(':')
    if tipo == 'nucleo':
        return list(cat['pacotes']['nucleo'])
    if tipo == 'tudo':
        return ['']
    if tipo == 'estilo':
        return [f'biblioteca/estilos/{alvo}/']
    if tipo == 'exemplo':
        return ['Exemplo - Lampada/'] if alvo.lower() in ('lampada', 'lâmpada') else [f'Exemplos/{alvo}/']
    if tipo == 'efeitos':
        return [f'biblioteca/efeitos/{alvo}/']
    if tipo == 'musicas':
        return ['biblioteca/musicas/']
    if tipo == 'objetos':
        return [f'biblioteca/personagens/{alvo}/']
    raise ErroDownload(f'pacote desconhecido: {nome}. Rode "python baixar.py lista" pra ver os pacotes.')


def arquivos_de(prefixos, cat):
    arqs = cat['arquivos']
    escolhidos = {}
    for pre in prefixos:
        achou = False
        for a in arqs:
            if a['p'] == pre or (pre.endswith('/') or pre == '') and a['p'].startswith(pre):
                escolhidos[a['p']] = a['t']; achou = True
        if not achou:
            raise ErroDownload(f'não existe no repositório: {pre or "(kit inteiro)"}')
    return escolhidos


def sons_e_objetos_do_video(pasta):
    """lê a cena de um vídeo e devolve (efeitos, música, objetos 3D) que ela usa"""
    efeitos, objetos = set(), set()
    cj = os.path.join(pasta, 'audio', 'cena.json')
    if os.path.exists(cj):
        c = json.load(open(cj, encoding='utf-8'))
        efeitos |= {s['nome'] for s in c.get('sons', [])} | {a['nome'] for a in c.get('ambientes', [])}
    for dp, _, fn in os.walk(os.path.join(pasta, 'cena')):
        for f in fn:
            if not f.endswith('.js'): continue
            src = open(os.path.join(dp, f), encoding='utf-8', errors='replace').read()
            efeitos |= set(re.findall(r"""\b(?:som|ambiente)\s*\(\s*['"]([\w\-]+)['"]""", src))
            objetos |= set(re.findall(r"""biblioteca/personagens/([\w\-]+)/""", src))
    v = {}
    try:
        v = json.load(open(os.path.join(pasta, 'video.json'), encoding='utf-8'))
    except Exception:
        pass
    return efeitos, v.get('musica'), objetos, v.get('estilo')


def resolver(pedidos, o, kit, cat):
    """lista de pedidos (pacotes, efeito:x, musica:x, video <pasta>) → {arquivo: tamanho}"""
    arquivos, avisos = {}, []
    i = 0
    while i < len(pedidos):
        p = pedidos[i]; i += 1
        tipo, _, alvo = p.partition(':')
        if tipo == 'video':
            if not alvo:
                if i >= len(pedidos): raise ErroDownload('use: python baixar.py video "Meus Videos/<nome>"')
                alvo = pedidos[i]; i += 1
            pasta = alvo if os.path.isabs(alvo) else os.path.join(kit, alvo)
            if not os.path.isdir(pasta): raise ErroDownload(f'não achei a pasta do vídeo: {alvo}')
            efs, mus, objs, est = sons_e_objetos_do_video(pasta)
            pedidos += [f'efeito:{e}' for e in sorted(efs)] + [f'objetos:{x}' for x in sorted(objs)]
            if mus and mus != 'nenhuma': pedidos.append(f'musica:{mus}')
            if est: pedidos.append(f'estilo:{est}')
            continue
        if tipo == 'efeito':
            idx = {e['nome']: e['arquivo'] for e in _json_do_kit(o, kit, 'biblioteca/efeitos/efeitos.json')['efeitos']}
            if alvo not in idx:
                avisos.append(f'efeito "{alvo}" não está na biblioteca do repositório (se é um efeito do próprio vídeo, ignore)')
                continue
            rel = 'biblioteca/efeitos/' + idx[alvo]
            arquivos.update(arquivos_de([rel], cat)); continue
        if tipo == 'musica':
            ms = {m['id']: m['arquivo'] for m in _json_do_kit(o, kit, 'biblioteca/musicas/musicas.json')['musicas']}
            if alvo not in ms: raise ErroDownload(f'trilha "{alvo}" não existe. Trilhas: {", ".join(sorted(ms))}')
            arquivos.update(arquivos_de(['biblioteca/musicas/' + ms[alvo]], cat)); continue
        arquivos.update(arquivos_de(prefixos_do_pacote(p, cat), cat))
    return arquivos, avisos


def baixar(pedidos, kit, repo=None, silencioso=False):
    o = origem(kit, repo)
    os.makedirs(kit, exist_ok=True)
    cat = catalogo(o, kit, atualizar=not silencioso)
    arquivos, avisos = resolver(list(pedidos), o, kit, cat)
    faltam = {r: t for r, t in arquivos.items()
              if not (os.path.exists(_longo(os.path.join(kit, *r.split('/')))) and os.path.getsize(_longo(os.path.join(kit, *r.split('/')))) == t)}
    total = sum(faltam.values())
    if not silencioso and faltam:
        print(f'Baixando {len(faltam)} arquivo(s), {total / 1e6:.1f} MB...')
    feitos = 0
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as ex:
        futs = {ex.submit(_baixar_um, o, kit, r, t): r for r, t in faltam.items()}
        for f in concurrent.futures.as_completed(futs):
            f.result(); feitos += 1
            if not silencioso and (feitos % 50 == 0): print(f'  {feitos}/{len(faltam)}')
    for a in avisos:
        if not silencioso: print('  aviso: ' + a)
    if not silencioso:
        print(f'OK — {len(arquivos)} arquivo(s) no kit ({len(faltam)} baixado(s) agora) em: {kit}')
    return len(faltam)


# ------------------------------------------------------------------ usado pelas ferramentas do kit (kit.py)
def garantir_arquivo(kit, rel):
    """baixa um arquivo do kit que ainda não está no computador"""
    o = origem(kit)
    cat = catalogo(o, kit)
    t = next((a['t'] for a in cat['arquivos'] if a['p'] == rel), None)
    if t is None: raise ErroDownload(f'{rel} não existe no repositório')
    return _baixar_um(o, kit, rel, t)


def garantir_pasta(kit, prefixo):
    """baixa uma pasta do kit (ex.: um estilo) que ainda não está no computador; devolve quantos arquivos baixou"""
    o = origem(kit)
    cat = catalogo(o, kit)
    arqs = arquivos_de([prefixo], cat)
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as ex:
        list(ex.map(lambda rt: _baixar_um(o, kit, rt[0], rt[1]), arqs.items()))
    return len(arqs)


def existe_no_repositorio(kit, prefixo):
    try:
        cat = catalogo(origem(kit), kit)
    except Exception:
        return False
    return any(a['p'].startswith(prefixo) for a in cat['arquivos'])


# ------------------------------------------------------------------ linha de comando
def listar(kit, repo=None):
    o = origem(kit, repo)
    cat = catalogo(o, kit, atualizar=True)
    tam = lambda pre: sum(a['t'] for a in cat['arquivos'] if any(a['p'].startswith(x) or a['p'] == x for x in pre))
    print(f"Repositório: github.com/{o['repo']}  (pasta {o['pasta']}/)\n")
    print(f"  nucleo{'':26}{tam(cat['pacotes']['nucleo']) / 1e6:7.1f} MB   motor, ferramentas, instruções, catálogos")
    for grupo, rotulo in [('estilos', 'estilo'), ('exemplos', 'exemplo'), ('efeitos', 'efeitos'), ('objetos', 'objetos')]:
        print()
        for nome, info in cat['grupos'][grupo].items():
            print(f"  {rotulo + ':' + nome:32}{info['mb']:7.1f} MB   {info.get('descricao', '')}"[:150])
    print(f"\n  musicas{'':25}{cat['grupos']['musicas']['mb']:7.1f} MB   as 30 trilhas (ou uma só: musica:<id>)")
    print(f"  tudo{'':28}{sum(a['t'] for a in cat['arquivos']) / 1e6:7.1f} MB   o kit inteiro")
    print('\n  efeito:<nome>   musica:<id>   video "Meus Videos/<x>"   → arquivos soltos, pelo nome')


def main(argv):
    args = list(argv)
    def opt(n):
        if n in args:
            i = args.index(n); v = args[i + 1]; del args[i:i + 2]; return v
    destino, repo = opt('--destino'), opt('--repo')
    so = '--so' in args
    if so: args.remove('--so')
    kit = os.path.abspath(destino) if destino else (kit_local() or os.path.abspath(NOME_KIT))
    if not args or args[0] in ('-h', '--help', 'ajuda'):
        print(__doc__); return
    if args[0] == 'lista':
        listar(kit, repo); return
    if not so and kit_local() is None and 'nucleo' not in args and 'tudo' not in args and not os.path.exists(os.path.join(kit, 'CLAUDE.md')):
        args = ['nucleo'] + args  # primeira vez: o núcleo vem junto
    baixar(args, kit, repo)


if __name__ == '__main__':
    try:
        main(sys.argv[1:])
    except ErroDownload as e:
        print('\nERRO: ' + str(e), file=sys.stderr); sys.exit(1)
    except KeyboardInterrupt:
        sys.exit(130)
