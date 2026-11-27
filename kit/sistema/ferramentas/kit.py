"""Funções comuns das ferramentas do kit (caminhos, configuração, ElevenLabs, ffmpeg, módulos JS).
Não precisa rodar este arquivo: as outras ferramentas importam ele."""
import json, os, re, shutil, subprocess, sys, unicodedata, urllib.request, urllib.error

KIT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SISTEMA = os.path.join(KIT, 'sistema')
MOTOR = os.path.join(SISTEMA, 'motor')
BIBLIOTECA = os.path.join(KIT, 'biblioteca')
CONFIG = os.path.join(KIT, 'config')
VIDEOS = os.path.join(KIT, 'Meus Videos')


class Erro(Exception):
    """erro com mensagem amigável (em português) — as ferramentas mostram só a mensagem"""


def principal(fn):
    """roda fn() mostrando erros de um jeito que o aluno (e o Claude) entendam"""
    try:
        fn()
    except Erro as e:
        print('\nERRO: ' + str(e), file=sys.stderr); sys.exit(1)
    except KeyboardInterrupt:
        sys.exit(130)
    except BrokenPipeError:   # saída cortada (ex.: | head) — não é erro
        try: sys.stdout = open(os.devnull, 'w')
        except Exception: pass
        sys.exit(0)


def ler_json(p, padrao=None):
    if not os.path.exists(p):
        if padrao is not None: return padrao
        raise Erro(f'arquivo não encontrado: {rel(p)}')
    try:
        with open(p, encoding='utf-8') as f: return json.load(f)
    except json.JSONDecodeError as e:
        raise Erro(f'{rel(p)} tem um erro de formatação (JSON) na linha {e.lineno}: {e.msg}')


def salvar_json(p, d):
    os.makedirs(os.path.dirname(p), exist_ok=True)
    tmp = p + '.tmp'
    with open(tmp, 'w', encoding='utf-8') as f: json.dump(d, f, ensure_ascii=False, indent=2)
    os.replace(tmp, p)


def rel(p):
    try: return os.path.relpath(p, KIT)
    except ValueError: return p


# ------------------------------------------------------------------ download sob demanda (kit baixado do GitHub em partes)
# Quem baixou só o núcleo + um estilo não tem todos os efeitos, trilhas e objetos no computador.
# Quando uma ferramenta precisa de um arquivo que ainda não está aqui, ela baixa SÓ aquele arquivo (baixar.py).
def garantir(caminho):
    """devolve o caminho; se o arquivo do kit ainda não existe neste computador, baixa só ele do repositório"""
    if os.path.exists(caminho): return caminho
    r = os.path.relpath(os.path.abspath(caminho), KIT).replace('\\', '/')
    if r.startswith('..'): return caminho
    try:
        import baixar
        baixar.garantir_arquivo(KIT, r)
    except Exception as e:
        raise Erro(f'o arquivo {r} não está no seu computador e não consegui baixar agora ({e}). '
                   f'Confira a internet ou baixe manualmente: python3 sistema/ferramentas/baixar.py tudo')
    return caminho


def garantir_pasta(prefixo):
    """baixa uma pasta inteira do kit (ex.: 'biblioteca/estilos/quadradinhos/') se ela existir no repositório; devolve True se baixou"""
    try:
        import baixar
        if not baixar.existe_no_repositorio(KIT, prefixo): return False
        baixar.garantir_pasta(KIT, prefixo)
        return True
    except Exception:
        return False


class _IndiceSobDemanda(dict):
    """{nome do efeito: caminho}. Inclui os efeitos do catálogo que ainda não foram baixados;
    ao pegar um deles (indice[nome]), baixa só aquele arquivo."""
    def __getitem__(self, k): return garantir(super().__getitem__(k))
    def get(self, k, padrao=None): return self[k] if k in self else padrao


def slug(s):
    s = unicodedata.normalize('NFD', s.lower()); s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-') or 'video'


def norm(s):
    s = unicodedata.normalize('NFD', s.lower()); s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    return re.sub(r'[^a-z0-9]', '', s)


def pasta_video(arg):
    """aceita 'Meus Videos/guarda-chuva', 'guarda-chuva' ou um caminho completo"""
    cands = [arg, os.path.join(KIT, arg), os.path.join(VIDEOS, arg), os.path.join(KIT, 'Exemplo - ' + arg)]
    for c in cands:
        if os.path.isdir(c) and os.path.exists(os.path.join(c, 'video.json')): return os.path.abspath(c)
    for c in cands:
        if os.path.isdir(c): raise Erro(f'a pasta {rel(c)} não tem video.json (crie o vídeo com: python3 sistema/ferramentas/novo_video.py "Título")')
    raise Erro(f'não achei a pasta do vídeo "{arg}". Os vídeos ficam em "Meus Videos/<nome>".')


CANAL_PADRAO = {
    'nome': 'Meu Canal', 'idioma': 'pt', 'assinatura': True,
    'voz_id': '', 'voz_nome': '', 'modelo': 'eleven_v4',
    'estabilidade': 0.3, 'similaridade': 0.9, 'velocidade': 1.12, 'velocidade_cta': 1.2, 'pausa_max': 0.30,
    'estilo': 'padrao', 'musica_padrao': 'oficina_curiosa', 'personagem': None,
}


def canal():
    return {**CANAL_PADRAO, **ler_json(os.path.join(CONFIG, 'canal.json'), {})}


def estilo(nome):
    p = os.path.join(BIBLIOTECA, 'estilos', nome, 'estilo.json')
    if not os.path.exists(p) and nome and '/' not in nome and '\\' not in nome:
        garantir_pasta(f'biblioteca/estilos/{nome}/')   # estilo ainda não baixado: baixa só ele
    if not os.path.exists(p):
        tem = sorted(d for d in os.listdir(os.path.join(BIBLIOTECA, 'estilos')) if os.path.exists(os.path.join(BIBLIOTECA, 'estilos', d, 'estilo.json')))
        raise Erro(f'estilo "{nome}" não existe. Estilos disponíveis: {", ".join(tem)}')
    return ler_json(p)


def personagens():
    base = os.path.join(BIBLIOTECA, 'personagens')
    if not os.path.isdir(base): return []
    return sorted(d for d in os.listdir(base) if os.path.exists(os.path.join(base, d, 'personagem.json')))


def personagem(nome):
    """biblioteca/personagens/<nome>/personagem.json → {nome, descricao, boneco}. O boneco substitui o do estilo."""
    p = os.path.join(BIBLIOTECA, 'personagens', nome, 'personagem.json')
    if not os.path.exists(p):
        raise Erro(f'personagem "{nome}" não existe. Personagens disponíveis: {", ".join(personagens())} (veja Personagens.html)')
    return ler_json(p)


def video_cfg(pasta):
    v = ler_json(os.path.join(pasta, 'video.json'))
    c = canal()
    v.setdefault('estilo', c['estilo']); v.setdefault('musica', c['musica_padrao']); v.setdefault('versao', 1)
    if v.get('personagem') is None and c.get('personagem'): v['personagem'] = c['personagem']
    return v


def nome_pagina(v):
    return f"ABRIR NO CHROME - {v.get('titulo') or v.get('id')} v{v.get('versao', 1)}.html"


# ------------------------------------------------------------------ ElevenLabs
def chave():
    p = os.path.join(CONFIG, 'chave_elevenlabs.txt')
    k = open(p, encoding='utf-8').read().strip() if os.path.exists(p) else ''
    k = re.sub(r'\s+', '', k)
    if not k or k.startswith('cole'):
        raise Erro('a chave da ElevenLabs ainda não foi colocada. Abra config/chave_elevenlabs.txt, cole a chave (começa com sk_) e salve.')
    return k


def eleven(caminho, corpo=None, metodo=None, timeout=300, bruto=False):
    """chama a API da ElevenLabs. Nunca imprime a chave."""
    url = 'https://api.elevenlabs.io' + caminho
    dados = json.dumps(corpo).encode('utf-8') if corpo is not None else None
    req = urllib.request.Request(url, data=dados, method=metodo or ('POST' if dados else 'GET'))
    req.add_header('xi-api-key', chave())
    if dados: req.add_header('Content-Type', 'application/json')
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            b = r.read()
            return b if bruto else json.loads(b.decode('utf-8'))
    except urllib.error.HTTPError as e:
        txt = e.read().decode('utf-8', 'ignore')[:600]
        raise Erro(explicar_erro_eleven(e.code, txt))
    except urllib.error.URLError as e:
        raise Erro('não consegui falar com a ElevenLabs (api.elevenlabs.io). Provável causa: o acesso à internet do Claude está bloqueado pra esse site. '
                   'Nas configurações do Claude, na parte de Capacidades (acesso à rede / domínios permitidos), libere api.elevenlabs.io. Detalhe: ' + str(e.reason))


def explicar_erro_eleven(code, txt):
    low = txt.lower()
    if code == 401 and 'unusual' in low:
        return ('a ElevenLabs bloqueou o plano gratuito por "atividade incomum" (isso acontece quando o acesso vem de um servidor/proxy). '
                'Resolve assinando qualquer plano pago (o Starter já basta).')
    if code == 401:
        return 'a ElevenLabs recusou a chave (401). Confira se colou a chave inteira em config/chave_elevenlabs.txt, sem espaços. Detalhe: ' + txt[:200]
    if code == 402 or 'quota' in low or 'credits' in low or 'insufficient' in low:
        return 'acabaram os créditos da ElevenLabs deste mês (ou o plano não permite isso). Veja em elevenlabs.io → Subscription. Detalhe: ' + txt[:200]
    if code == 403 and ('voice' in low or 'library' in low):
        return 'essa voz não pode ser usada por API no seu plano. Escolha uma voz da sua conta (My Voices) ou um plano pago. Detalhe: ' + txt[:200]
    if code == 403:
        return 'acesso negado (403). Pode ser bloqueio de rede do Claude ou permissão da chave. Detalhe: ' + txt[:200]
    if code == 404:
        return 'a ElevenLabs não encontrou isso (404) — a voz_id em config/canal.json está certa? Detalhe: ' + txt[:200]
    if code == 422:
        return 'a ElevenLabs não aceitou o pedido (422). Detalhe: ' + txt[:300]
    if code == 429:
        return 'muitos pedidos ao mesmo tempo na ElevenLabs (429). Espere 1 minuto e rode de novo.'
    return f'a ElevenLabs respondeu erro {code}: {txt[:300]}'


# ------------------------------------------------------------------ ffmpeg / node
def ffmpeg():
    f = shutil.which('ffmpeg')
    if f: return f
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        raise Erro('o programa ffmpeg não está instalado. Rode: pip install imageio-ffmpeg --break-system-packages')


def rodar(cmd, entrada=None):
    r = subprocess.run(cmd, input=entrada, capture_output=True)
    if r.returncode != 0:
        raise Erro('comando falhou: ' + ' '.join(str(c) for c in cmd[:4]) + ' … → ' + r.stderr.decode('utf-8', 'ignore')[-600:])
    return r.stdout


def node():
    n = shutil.which('node')
    if not n: raise Erro('o Node.js não está instalado (precisa pra conferir a cena). Rode: sudo apt-get install -y nodejs  (ou peça ajuda ao Claude)')
    return n


# ------------------------------------------------------------------ módulos JS (cena + motor)
RX_IMPORT = re.compile(r"""(\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)(['"])([^'"\n]+)\2""")
VENDOR = {'three': 'sistema/motor/vendor/three.module.js', 'mp4-muxer': 'sistema/motor/vendor/mp4-muxer.mjs'}


def resolver(spec, de_id):
    """id (caminho a partir da raiz do kit, com /) do módulo importado"""
    if spec in VENDOR: return VENDOR[spec]
    if spec.startswith('three/addons/'): return 'sistema/motor/vendor/addons/' + spec[len('three/addons/'):]
    if spec.startswith('.'):
        base = os.path.dirname(de_id)
        p = os.path.normpath(os.path.join(base, spec)).replace('\\', '/')
        return p
    raise Erro(f'import desconhecido "{spec}" em {de_id} (use caminhos relativos, "three" ou "three/addons/...")')


def imports_do_topo(src):
    """trechos [ini, fim) com os imports do topo do arquivo (os imports precisam ficar no começo, antes de qualquer código)"""
    pos, em_bloco, lendo_import, spans = 0, False, False, []
    for linha in src.split('\n'):
        prox = pos + len(linha) + 1
        s = linha.strip()
        if em_bloco:
            if '*/' in s: em_bloco = False
            pos = prox; continue
        if lendo_import:
            spans[-1][1] = prox
            if re.search(r"""\bfrom\s*['"]""", s) or s.endswith(';'): lendo_import = False
            pos = prox; continue
        if not s or s.startswith('//'): pos = prox; continue
        if s.startswith('/*'):
            if '*/' not in s[2:]: em_bloco = True
            pos = prox; continue
        if re.match(r'(import|export)\b', s) and (s.startswith('import') or re.search(r'\bfrom\b', s) or s.startswith('export {') or s.startswith('export *')):
            if s.startswith('export') and not re.search(r"""\bfrom\s*['"]""", s) and not s.startswith('export {') and not s.startswith('export *'): break
            spans.append([pos, prox])
            if not (re.search(r"""\bfrom\s*['"]""", s) or re.match(r"""import\s*['"]""", s) or s.endswith(';')): lendo_import = True
            pos = prox; continue
        break
    return spans


def grafo_modulos(entrada_id):
    """lê a cena e tudo o que ela importa. Devolve (ordem com dependências primeiro, {id: código com imports marcados})"""
    if entrada_id.startswith('..') or os.path.isabs(entrada_id):
        raise Erro('o vídeo precisa estar dentro da pasta do kit (em "Meus Videos"), e as ferramentas precisam ser as do mesmo kit.')
    fontes, ordem, visit = {}, [], set()

    def visitar(mid, cadeia):
        if mid in visit: return
        if mid in cadeia: raise Erro('importação circular: ' + ' → '.join(cadeia + [mid]))
        p = os.path.join(KIT, mid)
        if mid.startswith('..'): raise Erro(f'o arquivo importado fica fora da pasta do kit: {mid} (importado por {cadeia[-1] if cadeia else "?"})')
        if not os.path.exists(p) and mid.startswith('biblioteca/'):
            try: garantir(p)   # objeto 3D / estilo ainda não baixado
            except Erro: pass
        if not os.path.exists(p): raise Erro(f'arquivo importado não existe: {mid} (importado por {cadeia[-1] if cadeia else "?"})')
        src = open(p, encoding='utf-8').read()
        deps = []

        def troca(m):
            d = resolver(m.group(3), mid); deps.append(d)
            return m.group(1) + m.group(2) + '__MOD__(' + d + ')__' + m.group(2)
        partes, ult = [], 0
        for a, b in imports_do_topo(src):
            partes.append(src[ult:a]); partes.append(RX_IMPORT.sub(troca, src[a:b])); ult = b
        src2 = ''.join(partes) + src[ult:]
        for d in deps: visitar(d, cadeia + [mid])
        visit.add(mid); ordem.append(mid); fontes[mid] = src2
    visitar(entrada_id, [])
    return ordem, fontes


def id_de(caminho):
    return os.path.relpath(os.path.abspath(caminho), KIT).replace('\\', '/')


def timeline(pasta):
    p = os.path.join(pasta, 'audio', 'timeline.json')
    if not os.path.exists(p): raise Erro('ainda não tem narração neste vídeo. Rode antes: python3 sistema/ferramentas/narrar.py "' + rel(pasta) + '"')
    return ler_json(p)


def globais_cena(pasta):
    v = video_cfg(pasta); c = canal()
    est = estilo(v['estilo'])
    # (antigo) personagem pronto da pasta biblioteca/personagens, se ainda existir; hoje o visual do boneco vai no E.boneco({...}) da cena
    if v.get('personagem') and os.path.isdir(os.path.join(BIBLIOTECA, 'personagens', str(v['personagem']))):
        est = dict(est); est['boneco'] = {**(est.get('boneco') or {}), **(personagem(v['personagem']).get('boneco') or {})}; est['personagem'] = v['personagem']
    # ajustes de visual só deste vídeo (video.json → "estilo_ajustes": {"letreiro": {"fonte": "Poppins"}, ...})
    if v.get('estilo_ajustes'):
        est = dict(est)
        for k, val in v['estilo_ajustes'].items(): est[k] = {**(est.get(k) or {}), **val} if isinstance(val, dict) and isinstance(est.get(k), dict) else val
    canal_js = {'nome': v.get('assinatura_texto') or c['nome'], 'idioma': v.get('idioma') or c['idioma'], 'assinatura': c.get('assinatura', True) if v.get('assinatura') is None else v['assinatura']}
    return {'__TIMELINE__': timeline(pasta), '__ESTILO__': est, '__CANAL__': canal_js}, v, est


# ------------------------------------------------------------------ biblioteca de efeitos e músicas
def indice_efeitos(pasta=None):
    """{nome: caminho} — primeiro os efeitos do próprio vídeo (audio/efeitos), depois a biblioteca"""
    idx = {}
    raizes = []
    if pasta: raizes.append(os.path.join(pasta, 'audio', 'efeitos'))
    raizes.append(os.path.join(BIBLIOTECA, 'efeitos'))
    for raiz in raizes:
        if not os.path.isdir(raiz): continue
        for dp, dn, fn in os.walk(raiz):
            dn.sort()
            for f in sorted(fn):
                if f.lower().endswith(('.mp3', '.wav', '.ogg', '.m4a', '.flac')):
                    idx.setdefault(os.path.splitext(f)[0], os.path.join(dp, f))
    # efeitos do catálogo que ainda não foram baixados (kit baixado em partes): entram no índice e baixam quando usados
    for x in ler_json(os.path.join(BIBLIOTECA, 'efeitos', 'efeitos.json'), {'efeitos': []})['efeitos']:
        if x.get('nome') and x.get('arquivo'):
            idx.setdefault(x['nome'], os.path.join(BIBLIOTECA, 'efeitos', *x['arquivo'].split('/')))
    return _IndiceSobDemanda(idx)


def parecidos(nome, nomes, n=6):
    import difflib
    return difflib.get_close_matches(nome, list(nomes), n=n, cutoff=0.5)


def musicas():
    return ler_json(os.path.join(BIBLIOTECA, 'musicas', 'musicas.json'), {'musicas': []})['musicas']


CATEGORIAS_EFEITOS = {
    'vozes_do_boneco': 'Vozes do boneco e de gente (falas curtas em português, gritos, resmungos, risadas, multidão; o personagem nunca fala com a voz do narrador)',
    'transicoes': 'Transições (whoosh, subidas, rebobinar, zoom, glitch)',
    'aparecer_e_brilho': 'Aparecer, brilhar, pop, tada, acerto', 'interface_e_eletronicos': 'Cliques, bipes, alarmes, relógios, celular, erro', 'eletricidade': 'Eletricidade',
    'agua': 'Água, chuva e mar', 'fogo_e_calor': 'Fogo, calor e frio', 'ar_e_vento': 'Ar, gás, vento e tempo', 'natureza_e_bichos': 'Natureza e bichos (vaca, cachorro, gato, galo, leão… e ambientes de fazenda, floresta e selva)',
    'veiculos': 'Veículos', 'passos_e_movimento': 'Passos e movimento do boneco', 'obra_e_construcao': 'Obra, ferramentas e construção',
    'impactos_e_quebras': 'Batidas, quedas, batidas de carro e quebras', 'maquinas_e_mecanismos': 'Máquinas e mecanismos', 'casa_e_objetos': 'Casa e objetos',
    'humor': 'Humor e desenho animado (assobios, apito, boing, tapa, plateia rindo)', 'cozinha_e_comida': 'Cozinha e comida',
    'cidade_e_gente': 'Cidade e lugares (trânsito, sirene, feira, festa, estádio)', 'escola_e_escritorio': 'Escola e escritório',
    'esportes_e_jogos': 'Esportes e jogos (inclui sons de videogame 8-bit)', 'ficcao_e_espaco': 'Ficção científica e espaço (laser, robô, nave, foguete)',
    'suspense_e_terror': 'Suspense e terror (de desenho, sem susto pesado)', 'musica_e_vinhetas': 'Vinhetas musicais curtas (prato, gongo, fanfarra, acordes)',
    'novos': 'Criados por você (efeito_novo.py)', 'outros': 'Outros'}


def catalogo_efeitos_md():
    """refaz biblioteca/efeitos/efeitos.md a partir do efeitos.json"""
    d = ler_json(os.path.join(BIBLIOTECA, 'efeitos', 'efeitos.json'), {'efeitos': []})
    md = ['# Efeitos sonoros do kit', '', f'{len(d["efeitos"])} efeitos. Formato: **nome** (volume típico em dB, duração) — descrição (em inglês: é a descrição usada pra criar o som). Pra ouvir todos: abra "Biblioteca de Sons.html" na pasta do kit.',
          'Use na cena: `som("nome", A.momento, volume)`. Sons contínuos (fogo, chuva, motor, grilos): `ambiente("nome", inicio, fim, volume)`.', '']
    cats = list(CATEGORIAS_EFEITOS) + sorted({x['categoria'] for x in d['efeitos']} - set(CATEGORIAS_EFEITOS))
    for c in cats:
        xs = [x for x in d['efeitos'] if x['categoria'] == c]
        if not xs: continue
        md += [f'## {CATEGORIAS_EFEITOS.get(c, c)}', ''] + [f"- **{x['nome']}** ({x['volume']} dB, {x.get('duracao', 0):.1f}s{', contínuo: use ambiente()' if x.get('continuo') else ''}) — " + (f"fala \"{x['fala']}\" · " if x.get('fala') else '') + x.get('descricao', '')[:110] for x in xs] + ['']
    open(os.path.join(BIBLIOTECA, 'efeitos', 'efeitos.md'), 'w', encoding='utf-8').write('\n'.join(md))



def pagina_sons():
    """refaz 'Biblioteca de Sons.html' (na pasta do kit): todos os efeitos e trilhas com botão de ouvir"""
    import html as _h
    ef = ler_json(os.path.join(BIBLIOTECA, 'efeitos', 'efeitos.json'), {'efeitos': []})['efeitos']
    mus = musicas()
    cats = list(CATEGORIAS_EFEITOS) + sorted({x['categoria'] for x in ef} - set(CATEGORIAS_EFEITOS))
    E = lambda s: _h.escape(str(s), quote=True)
    sec = []
    sec.append('<section id="musicas"><h2>Trilhas <span>' + str(len(mus)) + '</span></h2><div class="lista">' + ''.join(
        f'<div class="item mus" data-busca="{E((m.get("titulo","") + " " + m["id"] + " " + m.get("descricao","")).lower())}"><button class="play" data-src="biblioteca/musicas/{E(m["arquivo"])}" aria-label="ouvir"></button>'
        f'<div class="txt"><b>{E(m.get("titulo", m["id"]))}</b> <code>{E(m["id"])}</code><small>{E(m.get("descricao",""))} · {m.get("bpm","?")} BPM · {int(m.get("duracao",0))//60}min{int(m.get("duracao",0))%60:02d}</small></div>'
        f'<button class="copia" data-nome="{E(m["id"])}">copiar nome</button></div>' for m in mus) + '</div></section>')
    for c in cats:
        xs = [x for x in ef if x['categoria'] == c]
        if not xs: continue
        sec.append(f'<section id="{E(c)}"><h2>{E(CATEGORIAS_EFEITOS.get(c, c))} <span>{len(xs)}</span></h2><div class="lista">' + ''.join(
            f'<div class="item" data-busca="{E((x["nome"] + " " + x.get("fala","") + " " + x.get("descricao","")).lower())}"><button class="play" data-src="biblioteca/efeitos/{E(x["arquivo"])}" aria-label="ouvir"></button>'
            f'<div class="txt"><b>{E(x["nome"])}</b>' + (f' <em>“{E(x["fala"])}”</em>' if x.get('fala') else '') + (' <i>contínuo</i>' if x.get('continuo') else '') +
            f'<small>{E(x.get("descricao",""))} · {x.get("duracao",0):.1f}s</small></div><button class="copia" data-nome="{E(x["nome"])}">copiar nome</button></div>' for x in xs) + '</div></section>')
    nav = ''.join(f'<a href="#{E(c)}">{E(CATEGORIAS_EFEITOS.get(c, c).split(" (")[0])}</a>' for c in ['musicas'] + [c for c in cats if any(x['categoria'] == c for x in ef)]).replace('>musicas<', '>Trilhas<')
    pg = f"""<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Biblioteca de Sons</title>
<style>
:root{{--bg:#f6f5f1;--fg:#1d1f1c;--mut:#6b6f68;--card:#fff;--line:#e2e1db;--acc:#c8623a}}
@media (prefers-color-scheme:dark){{:root{{--bg:#16171a;--fg:#ecebe6;--mut:#9a9d96;--card:#202226;--line:#30333a;--acc:#e98a5f}}}}
*{{box-sizing:border-box}}body{{margin:0;background:var(--bg);color:var(--fg);font:15px/1.45 system-ui,'Segoe UI',sans-serif}}
header{{position:sticky;top:0;background:var(--bg);border-bottom:1px solid var(--line);padding:14px 16px 10px;z-index:2}}
h1{{margin:0 0 4px;font-size:22px}}header p{{margin:0 0 10px;color:var(--mut);font-size:13px}}
input{{width:100%;max-width:520px;font:16px system-ui;padding:9px 12px;border:1px solid var(--line);border-radius:10px;background:var(--card);color:var(--fg)}}
nav{{display:flex;gap:6px;overflow-x:auto;padding:10px 0 2px}}nav a{{white-space:nowrap;font-size:12px;color:var(--fg);text-decoration:none;border:1px solid var(--line);border-radius:99px;padding:4px 10px;background:var(--card)}}
main{{max-width:980px;margin:0 auto;padding:8px 16px 60px}}section{{scroll-margin-top:178px}}.mus .txt b{{font-family:inherit}}h2{{font-size:17px;margin:26px 0 10px}}h2 span{{color:var(--mut);font-weight:400;font-size:13px}}
.lista{{display:grid;gap:8px}}.item{{display:flex;align-items:center;gap:12px;background:var(--card);border:1px solid var(--line);border-radius:12px;padding:9px 12px}}
.txt{{flex:1;min-width:0}}.txt b{{font-family:ui-monospace,Consolas,monospace;font-size:14px}}.txt em{{color:var(--acc);font-style:normal;margin-left:4px}}.txt i{{font-style:normal;font-size:11px;color:var(--mut);border:1px solid var(--line);border-radius:6px;padding:0 5px;margin-left:6px}}
.txt code{{color:var(--mut);font-size:12px}}.txt small{{display:block;color:var(--mut);font-size:12px;overflow:hidden;text-overflow:ellipsis}}
.play{{flex:none;width:38px;height:38px;border-radius:50%;border:0;background:var(--acc);cursor:pointer;position:relative}}
.play::after{{content:'';position:absolute;left:14px;top:11px;border-left:13px solid #fff;border-top:8px solid transparent;border-bottom:8px solid transparent}}
.play.on::after{{left:12px;top:12px;width:14px;height:14px;border:0;background:#fff;border-radius:2px}}
.copia{{flex:none;font:12px system-ui;border:1px solid var(--line);background:transparent;color:var(--mut);border-radius:8px;padding:5px 8px;cursor:pointer}}
.oculto{{display:none}}@media (max-width:560px){{.copia{{display:none}}}}
</style></head><body><header><h1>Biblioteca de Sons</h1><p>{len(ef)} efeitos e {len(mus)} trilhas. Clique pra ouvir. Pra usar num vídeo, é só dizer pro Claude o nome do som (ex.: "põe o som vaca_mugindo quando a vaca aparece").</p>
<input id="q" type="search" placeholder="buscar: vaca, grito, chuva, laser, assobio..."><nav>{nav}</nav></header><main>{''.join(sec)}</main>
<script>
let au=null,bt=null;document.addEventListener('click',e=>{{const p=e.target.closest('.play');if(p){{if(bt===p&&au&&!au.paused){{au.pause();p.classList.remove('on');return}}if(au)au.pause();if(bt)bt.classList.remove('on');au=new Audio(p.dataset.src);bt=p;p.classList.add('on');au.play().catch(()=>{{}});au.onended=()=>p.classList.remove('on');return}}
const c=e.target.closest('.copia');if(c){{navigator.clipboard&&navigator.clipboard.writeText(c.dataset.nome);const t=c.textContent;c.textContent='copiado!';setTimeout(()=>c.textContent=t,900)}}}});
document.getElementById('q').addEventListener('input',e=>{{const q=e.target.value.trim().toLowerCase();document.querySelectorAll('.item').forEach(it=>it.classList.toggle('oculto',!!q&&!it.dataset.busca.includes(q)));document.querySelectorAll('section').forEach(s=>s.classList.toggle('oculto',!!q&&!s.querySelector('.item:not(.oculto)')))}});
</script></body></html>"""
    open(os.path.join(KIT, 'Biblioteca de Sons.html'), 'w', encoding='utf-8').write(pg)
