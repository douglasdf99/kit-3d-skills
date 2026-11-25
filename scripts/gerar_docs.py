"""Gera as skills (skills/*/SKILL.md) e o README.md a partir do kit, e alinha o repositório padrão do baixar.py.

O nome do repositório vem de kit/sistema/origem.json ("repo": "dono/nome"). Mudou o nome? Edite lá e rode:
  python scripts/gerar_catalogo.py && python scripts/gerar_docs.py
"""
import json, os, re

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KIT = os.path.join(RAIZ, 'kit')
ORIGEM = json.load(open(os.path.join(KIT, 'sistema', 'origem.json'), encoding='utf-8'))
REPO, RAMO = ORIGEM['repo'], ORIGEM.get('ramo', 'main')
RAW = f'https://raw.githubusercontent.com/{REPO}/{RAMO}'
GH = f'https://github.com/{REPO}'
CAT = json.load(open(os.path.join(KIT, 'sistema', 'catalogo.json'), encoding='utf-8'))
ORDEM = list(CAT['grupos']['estilos'])

GATILHOS = {
    'padrao': 'low-poly colorido, casa em corte, "como funciona por dentro", "monte um objeto do zero"',
    'ilustrado': '2D, desenho plano, animação de explicação, motion graphics, explainer',
    'cubinhos': 'blocos, voxel, mundo de jogo de cubinhos, pixel, 8-bit',
    'brinquedo': 'bonequinhos de plástico, miniatura, brinquedo, toy, cinema',
    'simples': '"E se...?", multidão reagindo, vídeo rápido e leve, bonecos de cápsula',
    'desenho': 'anime, desenho animado japonês, cel shading, linhas de velocidade',
    'avatar': 'avatar de jogo online, blocos de plástico, edição de meme',
}

INSTALAR = '''```bash
python3 -c "import urllib.request as u; u.urlretrieve('{raw}/kit/sistema/ferramentas/baixar.py', 'baixar.py')"
python3 baixar.py {pacotes}
```'''

AVISO_PY = 'No Windows o comando é `python` em vez de `python3`.'


def estilo(n):
    e = json.load(open(os.path.join(KIT, 'biblioteca', 'estilos', n, 'estilo.json'), encoding='utf-8'))
    g = open(os.path.join(KIT, 'biblioteca', 'estilos', n, 'GUIA.md'), encoding='utf-8').read()
    m = re.search(r'## Sons que combinam\n(.*?)(?:\n\(Lista completa|\n## |\Z)', g, re.S)
    e['_sons'] = ' '.join(m.group(1).split()) if m else ''
    m = re.search(r'## Cenários prontos\n(.*?)(?:\n## |\Z)', g, re.S)
    e['_cenarios'] = m.group(1).strip() if m else ''
    e['_mb'] = CAT['grupos']['estilos'][n]['mb']
    return e


def skill_estilo(n, e):
    c = e.get('custo') or {}
    base = f'{RAW}/kit/biblioteca/estilos/{n}'
    desc = (f'Faz vídeos verticais em 3D (Shorts, Reels, TikTok, 1080x1920) no estilo "{e["nome"]}": '
            f'{e["descricao"].split(".")[0].strip()}. Use quando pedirem vídeo 3D, vídeo explicativo animado ou '
            f'Short animado no estilo {e["nome"]} ({GATILHOS.get(n, n)}). Baixa do GitHub só o motor e este estilo '
            f'(uns {round(3.6 + e["_mb"])} MB, sem zip), e os efeitos sonoros e trilhas só quando a cena usa.')
    return f'''---
name: video-3d-{n}
description: {desc[:1020]}
---

# Vídeo 3D: estilo {e["nome"]}

**Como é:** {e["descricao"]}

**Como é a edição:** {e.get("edicao", {}).get("resumo", "")}

**Peso pra fazer** (nota {c.get("nota", "?")}/100): créditos do Claude {c.get("creditos", "?")} · Claude montando {c.get("tempo_claude", "?")} · render de 2 min {c.get("render_2min", "?")} · correções previstas {c.get("correcoes", "?")}. {c.get("obs", "")}

Prévia (abre no navegador, sem baixar o kit): [vídeo de 10 s]({base}/demo.mp4) · [boneco]({base}/personagem.jpg) · [cena]({base}/cena.jpg)

## 1. Instalar só o que este estilo precisa

Na pasta que a pessoa escolheu pra conversa, rode:

{INSTALAR.format(raw=RAW, pacotes=f"estilo:{n} exemplo:{n}")}

{AVISO_PY} Isso cria a pasta `Desmontando o Video - Kit/` com o motor 3D (uns 4 MB), este estilo e a demo dele.
Depois apague o `baixar.py` solto: a cópia que vale fica em `Desmontando o Video - Kit/sistema/ferramentas/`.

Se a pasta já tem `Desmontando o Video - Kit/`, **não baixe de novo** (perderia a configuração). Só acrescente o estilo:
`python3 "Desmontando o Video - Kit/sistema/ferramentas/baixar.py" estilo:{n}`

## 2. Fazer o vídeo

1. Leia `Desmontando o Video - Kit/CLAUDE.md` e siga. É o manual do kit: configuração (voz da ElevenLabs), roteiro,
   produção, render e revisão. As ferramentas rodam de dentro da pasta do kit.
2. Crie o vídeo já neste estilo: `python3 sistema/ferramentas/novo_video.py "Tema do vídeo" --estilo {n}`
3. Antes de montar a cena, leia `biblioteca/estilos/{n}/GUIA.md` (o modelo de edição do estilo) e a cena da demo,
   `Exemplos/{n}/cena/cena.js`.
4. Cenários prontos deste estilo: {" ".join(e["_cenarios"].split())}
5. Sons que combinam: {e["_sons"]}
   Não precisa baixar sons antes. Quando a cena usa um efeito ou trilha que ainda não está no computador,
   `conferir.py` aceita (ele conhece o catálogo inteiro) e `fazer_tudo.py` / `montar_audio.py` baixam só aquele arquivo.
   Pra adiantar tudo de uma vez: `python3 sistema/ferramentas/baixar.py video "Meus Videos/<nome>"`.

## Regras rápidas

- Roteiro aprovado pela pessoa antes de gerar a voz (a narração gasta créditos da ElevenLabs).
- A chave da ElevenLabs fica só em `config/chave_elevenlabs.txt`, no computador da pessoa. Nunca peça nem mostre no chat.
- Sem marcas reais: nada de logo, nome de marca, personagem famoso ou música famosa.
- Outros estilos e a biblioteca de sons completa: {GH}
'''


def skill_principal(estilos):
    linhas = '\n'.join(f'| {i} | `{n}` | {e["nome"]} | {e["descricao"].split(".")[0]}. | {(e.get("custo") or {}).get("nota", "?")} | [ver]({RAW}/kit/biblioteca/estilos/{n}/demo.mp4) |'
                       for i, (n, e) in enumerate(estilos, 1))
    return f'''---
name: video-3d
description: Faz vídeos verticais em 3D (Shorts, Reels, TikTok, 1080x1920) com narração, legenda palavra por palavra, efeitos sonoros e trilha, em 7 estilos (low-poly, ilustrado 2D, cubinhos, brinquedo, simples, desenho/anime, avatar de jogo). Use quando pedirem vídeo 3D, vídeo explicativo animado, Short/Reels animado, "como funciona por dentro", curiosidade, lista, "E se...?" ou terror em animação. Ajuda a escolher o estilo e baixa do GitHub só o que ele precisa, sem zip.
---

# Vídeo 3D (kit com 7 estilos)

Este kit faz, junto com a pessoa, vídeos verticais em 3D: você escreve o roteiro, gera a voz (ElevenLabs), monta a cena 3D
com câmera passeando, letreiros, legenda, efeitos e trilha; a pessoa assiste à prévia no navegador e clica em Renderizar.
O formato padrão é "você constrói um objeto do zero, resolvendo um problema de cada vez", mas dá pra fazer curiosidade,
lista, terror, "E se...?", mito ou verdade e humor.

## 1. Escolher o estilo (uma pergunta, com botões)

| # | id | Estilo | Como é | Peso (0-100) | Prévia de 10 s |
|---|---|---|---|---|---|
{linhas}

Quanto menor o peso, mais leve (créditos, tempo de montagem e render). Na dúvida: `simples` é o mais leve, `padrao` é o da série.

## 2. Instalar só o necessário

Na pasta que a pessoa escolheu pra conversa (troque `<id>` pelo estilo escolhido):

{INSTALAR.format(raw=RAW, pacotes="estilo:<id> exemplo:<id>")}

{AVISO_PY} Vem o motor 3D (uns 4 MB) + o estilo + a demo dele. Nada de zip de 3 GB.
Apague o `baixar.py` solto depois; a cópia que vale fica em `Desmontando o Video - Kit/sistema/ferramentas/`.
Se já existe `Desmontando o Video - Kit/` na pasta, não baixe por cima: use o `baixar.py` de dentro dela.

Outros pacotes (rode `python3 baixar.py lista` pra ver todos com tamanho):
`exemplo:lampada` (vídeo completo de 2 min, o gabarito) · `efeitos:<categoria>` · `efeito:<nome>` · `musica:<id>` · `musicas` · `objetos:praia` · `objetos:montanha` · `tudo`.

## 3. Fazer o vídeo

Leia `Desmontando o Video - Kit/CLAUDE.md` e siga: ele é o manual completo (configuração, roteiro, produção, render,
revisão, painel). Crie o vídeo com `python3 sistema/ferramentas/novo_video.py "Tema" --estilo <id>` e leia
`biblioteca/estilos/<id>/GUIA.md` antes de montar a cena.

Os efeitos sonoros (817, em 23 categorias) e as 30 trilhas **não precisam ser baixados antes**: as ferramentas do kit
baixam só os que a cena usa, na hora. Pra adiantar: `python3 sistema/ferramentas/baixar.py video "Meus Videos/<nome>"`.

## Regras rápidas

- Roteiro aprovado antes de gerar voz (narração gasta créditos).
- Chave da ElevenLabs só em `config/chave_elevenlabs.txt`, no computador da pessoa. Nunca no chat.
- Sem marcas reais, logos, personagens ou músicas famosas.

Uma skill por estilo (mais detalhada) e a biblioteca de sons: {GH}/tree/{RAMO}/skills
'''


def skill_sons(n_ef, cats):
    linhas = '\n'.join(f'| `{c}` | {info["n"]} | {info["mb"]} MB | {info["descricao"].split(": ", 1)[-1]} |' for c, info in cats.items())
    return f'''---
name: sons-3d
description: Biblioteca de {n_ef} efeitos sonoros curtos (água, bichos, máquinas, obra, veículos, desenho animado, 8-bit, suspense, vozes de boneco em português, transições, vinhetas) e 30 trilhas instrumentais pra vídeo. Use quando pedirem efeito sonoro, som de transição, whoosh, pop, trilha de fundo ou "um som de X" pra um vídeo ou projeto. Procura pelo nome ou descrição e baixa do GitHub só os arquivos escolhidos, um por um, sem zip.
---

# Biblioteca de sons (efeitos e trilhas)

## 1. Procurar

Baixe só o catálogo (texto, uns 95 KB) e procure nele pela descrição (em inglês) ou pelo nome:

```bash
python3 -c "import urllib.request as u; u.urlretrieve('{RAW}/kit/biblioteca/efeitos/efeitos.md', 'efeitos.md')"
```

Cada linha: `**nome** (volume típico em dB, duração) — descrição`. As trilhas estão em
`{RAW}/kit/biblioteca/musicas/musicas.json` (id, título, clima, BPM, duração).
Pra ouvir antes de escolher, abra o link direto do arquivo: `{RAW}/kit/biblioteca/efeitos/<categoria>/<nome>.mp3`.

| Categoria | Sons | Tamanho | O que tem |
|---|---|---|---|
{linhas}

## 2. Baixar só os escolhidos

```bash
python3 -c "import urllib.request as u; u.urlretrieve('{RAW}/kit/sistema/ferramentas/baixar.py', 'baixar.py')"
python3 baixar.py --so --destino sons efeito:whoosh efeito:pop efeito:vaca_mugindo musica:oficina_curiosa
```

{AVISO_PY} `--so` baixa só os arquivos pedidos (sem o motor do kit). Eles ficam em `sons/biblioteca/efeitos/<categoria>/`
e `sons/biblioteca/musicas/`. Uma categoria inteira: `efeitos:agua`. Todas as trilhas: `musicas`.

Dentro do kit de vídeo 3D não precisa disso: as ferramentas do kit baixam sozinhas os sons que a cena usa.

## Aviso de uso

A origem e os direitos de redistribuição de cada áudio ainda estão sendo conferidos
(veja `kit/LICENCAS-E-ORIGENS-A-CONFERIR.txt` no repositório). Confira antes de usar em projeto comercial.
'''


def readme(estilos, cats, n_ef):
    total = sum(a['t'] for a in CAT['arquivos']) / 1e6
    galeria = '\n'.join(
        f'| **{i}. {e["nome"]}** (`{n}`)<br>{e["descricao"].split(".")[0]}.<br><br>Peso {(e.get("custo") or {}).get("nota", "?")}/100 · '
        f'[▶ demo de 10 s](kit/biblioteca/estilos/{n}/demo.mp4) · [skill](skills/video-3d-{n}/SKILL.md) | '
        f'<img src="kit/biblioteca/estilos/{n}/personagem.jpg" width="110"> | <img src="kit/biblioteca/estilos/{n}/cena.jpg" width="110"> |'
        for i, (n, e) in enumerate(estilos, 1))
    sons = '\n'.join(f'| `efeitos:{c}` | {info["n"]} | {info["mb"]} MB | {info["descricao"].split(": ", 1)[-1]} |' for c, info in cats.items())
    return f'''# Kit 3D: vídeos verticais em 3D com o Claude

Skills (`SKILL.md`) e arquivos separados por tipo pra fazer vídeos verticais em 3D (Shorts, Reels, TikTok) com o Claude:
**7 estilos visuais**, **{n_ef} efeitos sonoros** em {len(cats)} categorias e **30 trilhas**.

Em vez de um zip de 3 GB, cada coisa fica na sua pasta e é baixada **só quando precisa**:
o motor tem uns 4 MB, cada estilo uns 2 a 3 MB, e os sons vêm um por um conforme a cena usa.

## Os estilos

| Estilo | Boneco | Cena |
|---|---|---|
{galeria}

## Como usar

### Opção 1: skill (recomendado)

Baixe **só a SKILL.md** do estilo que quiser (ou a `video-3d`, que ajuda a escolher) e instale no Claude:

- **Claude Code:** salve em `~/.claude/skills/<nome-da-skill>/SKILL.md`.
- **App do Claude:** em Configurações → Capacidades → Skills, envie a pasta da skill compactada.

Depois é só pedir: *"faz um vídeo 3D no estilo cubinhos sobre como funciona uma ponte"*.
A skill baixa o motor + o estilo e segue o manual do kit (`kit/CLAUDE.md`).

| Skill | Pra quê |
|---|---|
| [`video-3d`](skills/video-3d/SKILL.md) | escolhe o estilo com a pessoa e instala só ele |
{chr(10).join(f"| [`video-3d-{n}`](skills/video-3d-{n}/SKILL.md) | estilo {e['nome']} |" for n, e in estilos)}
| [`sons-3d`](skills/sons-3d/SKILL.md) | procurar e baixar efeitos sonoros e trilhas soltos, pra qualquer projeto |

### Opção 2: `baixar.py` (só Python, nada pra instalar)

```bash
python3 -c "import urllib.request as u; u.urlretrieve('{RAW}/kit/sistema/ferramentas/baixar.py', 'baixar.py')"
python3 baixar.py lista                         # todos os pacotes, com tamanho
python3 baixar.py estilo:cubinhos               # motor + um estilo (o núcleo vem junto na 1ª vez)
python3 baixar.py efeitos:veiculos              # uma categoria de sons
python3 baixar.py efeito:vaca_mugindo           # um som só
python3 baixar.py video "Meus Videos/ponte"     # só o que a cena desse vídeo usa
```

No Windows o comando é `python`. As ferramentas do kit (`fazer_tudo.py`, `montar_audio.py`, `novo_video.py`…) também
chamam o `baixar.py` sozinhas quando falta um estilo, efeito, trilha ou objeto 3D.

### Opção 3: git sparse-checkout

```bash
git clone --filter=blob:none --sparse {GH}.git
cd {REPO.split("/")[1]}
git sparse-checkout set kit/sistema kit/config kit/biblioteca/estilos/cubinhos kit/biblioteca/efeitos/transicoes
```

## Pacotes

| Pacote | Tamanho | O que tem |
|---|---|---|
| `nucleo` | 3.6 MB | motor 3D, ferramentas, instruções, catálogos de sons e estilos |
{chr(10).join(f"| `estilo:{n}` | {e['_mb']} MB | {e['nome']} |" for n, e in estilos)}
| `exemplo:<estilo>` | ~2.7 MB | demo pronta de 10 s do estilo |
| `exemplo:lampada` | {CAT['grupos']['exemplos']['lampada']['mb']} MB | vídeo de exemplo completo (2 min), o gabarito |
| `musicas` / `musica:<id>` | {CAT['grupos']['musicas']['mb']} MB | 30 trilhas instrumentais (ou uma só) |
| `objetos:praia` / `objetos:montanha` | {CAT['grupos']['objetos']['praia']['mb']} / {CAT['grupos']['objetos']['montanha']['mb']} MB | objetos 3D (GLB) prontos |
| `tudo` | {total:.0f} MB | o kit inteiro |

### Efeitos sonoros

| Pacote | Sons | Tamanho | O que tem |
|---|---|---|---|
{sons}

Lista de todos os sons, com descrição: [`kit/biblioteca/efeitos/efeitos.md`](kit/biblioteca/efeitos/efeitos.md).

## O que o kit precisa no computador

Python 3 com NumPy, Node.js, FFmpeg e Google Chrome (a skill e o `kit/CLAUDE.md` conduzem a instalação).
Pra gerar narração nova: uma conta e uma chave próprias da ElevenLabs, guardadas só em `kit/config/chave_elevenlabs.txt`
(esse arquivo nunca vai pro repositório).

## Licenças e avisos

- Motor: [three.js](kit/sistema/motor/vendor/LICENSE-three.txt) (MIT) e [mp4-muxer](kit/sistema/motor/vendor/LICENSE-mp4-muxer.txt) (MIT).
- Fontes: 13 famílias OFL-1.1 e 3 Apache-2.0 ([avisos](kit/sistema/motor/fontes/)).
- **Áudios:** a origem e os direitos de redistribuição de cada efeito e trilha ainda estão sendo conferidos
  ([detalhes](kit/LICENCAS-E-ORIGENS-A-CONFERIR.txt)). Confira antes de uso comercial.

## Manutenção do repositório

Mudou algum arquivo em `kit/`? Rode da raiz:

```bash
python scripts/gerar_catalogo.py
python scripts/gerar_docs.py
```

O primeiro atualiza `kit/sistema/catalogo.json` (a lista que o `baixar.py` usa); o segundo refaz as skills e este README.
O nome do repositório fica em `kit/sistema/origem.json`.
'''


def escrever(rel, txt):
    p = os.path.join(RAIZ, *rel.split('/'))
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, 'w', encoding='utf-8', newline='\n') as f: f.write(txt)


def main():
    estilos = [(n, estilo(n)) for n in ORDEM]
    ef = json.load(open(os.path.join(KIT, 'biblioteca', 'efeitos', 'efeitos.json'), encoding='utf-8'))['efeitos']
    cats = CAT['grupos']['efeitos']
    for n, e in estilos:
        escrever(f'skills/video-3d-{n}/SKILL.md', skill_estilo(n, e))
    escrever('skills/video-3d/SKILL.md', skill_principal(estilos))
    escrever('skills/sons-3d/SKILL.md', skill_sons(len(ef), cats))
    escrever('README.md', readme(estilos, cats, len(ef)))
    # o baixar.py solto (antes de ter um kit) usa este repositório como padrão
    bp = os.path.join(KIT, 'sistema', 'ferramentas', 'baixar.py')
    src = open(bp, encoding='utf-8').read()
    src2 = re.sub(r"REPO_PADRAO = '[^']*'", f"REPO_PADRAO = '{REPO}'", src)
    src2 = re.sub(r"RAMO_PADRAO = '[^']*'", f"RAMO_PADRAO = '{RAMO}'", src2)
    if src2 != src:
        with open(bp, 'w', encoding='utf-8', newline='\n') as f: f.write(src2)
        import sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
        import gerar_catalogo; gerar_catalogo.main()   # o baixar.py mudou de tamanho: refaz o catálogo
    print(f'ok: {len(estilos) + 2} skills e README pro repositório {REPO}')


if __name__ == '__main__':
    main()
