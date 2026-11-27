---
name: sons-3d
description: Biblioteca de 46 efeitos sonoros curtos pra anúncio e vídeo (gancho, problema, transição, revelação do produto, CTA, videogame), todos no mesmo volume, e 10 trilhas instrumentais. Use quando pedirem efeito sonoro, som de transição, whoosh, pop, trilha de fundo ou "um som de X" pra um vídeo ou projeto. Procura pelo nome ou descrição e baixa do GitHub só os arquivos escolhidos, um por um, sem zip.
---

# Biblioteca de sons (efeitos e trilhas)

## 1. Procurar

Baixe só o catálogo (texto, uns 95 KB) e procure nele pela descrição (em inglês) ou pelo nome:

```bash
python3 -c "import urllib.request as u; u.urlretrieve('https://raw.githubusercontent.com/douglasdf99/kit-3d-skills/main/kit/biblioteca/efeitos/efeitos.md', 'efeitos.md')"
```

Cada linha: `**nome** (volume típico em dB, duração) — descrição`. As trilhas estão em
`https://raw.githubusercontent.com/douglasdf99/kit-3d-skills/main/kit/biblioteca/musicas/musicas.json` (id, título, clima, BPM, duração).
Pra ouvir antes de escolher, abra o link direto do arquivo: `https://raw.githubusercontent.com/douglasdf99/kit-3d-skills/main/kit/biblioteca/efeitos/skill/<nome>.mp3`.

| Categoria | Sons | Tamanho | O que tem |
|---|---|---|---|
| `skill` | 46 | 1.0 MB | efeitos próprios, todos no mesmo volume (gancho, problema, transição, produto, CTA, videogame) |

## 2. Baixar só os escolhidos

```bash
python3 -c "import urllib.request as u; u.urlretrieve('https://raw.githubusercontent.com/douglasdf99/kit-3d-skills/main/kit/sistema/ferramentas/baixar.py', 'baixar.py')"
python3 baixar.py --so --destino sons efeito:whoosh efeito:pop efeito:magic musica:calma
```

No Windows o comando é `python` em vez de `python3`. `--so` baixa só os arquivos pedidos (sem o motor do kit). Eles ficam em `sons/biblioteca/efeitos/<categoria>/`
e `sons/biblioteca/musicas/`. Todos os efeitos: `efeitos:skill`. Todas as trilhas: `musicas`.

Dentro do kit de vídeo 3D não precisa disso: as ferramentas do kit baixam sozinhas os sons que a cena usa.

## Aviso de uso

Os efeitos e as trilhas foram criados na ElevenLabs (Eleven Music e Sound Effects) num plano pago com licença comercial.
Confira os termos da ElevenLabs antes de redistribuir os arquivos.
