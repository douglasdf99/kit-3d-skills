---
name: sons-3d
description: Biblioteca de 817 efeitos sonoros curtos (água, bichos, máquinas, obra, veículos, desenho animado, 8-bit, suspense, vozes de boneco em português, transições, vinhetas) e 30 trilhas instrumentais pra vídeo. Use quando pedirem efeito sonoro, som de transição, whoosh, pop, trilha de fundo ou "um som de X" pra um vídeo ou projeto. Procura pelo nome ou descrição e baixa do GitHub só os arquivos escolhidos, um por um, sem zip.
---

# Biblioteca de sons (efeitos e trilhas)

## 1. Procurar

Baixe só o catálogo (texto, uns 95 KB) e procure nele pela descrição (em inglês) ou pelo nome:

```bash
python3 -c "import urllib.request as u; u.urlretrieve('https://raw.githubusercontent.com/douglasdf99/kit-3d-skills/main/kit/biblioteca/efeitos/efeitos.md', 'efeitos.md')"
```

Cada linha: `**nome** (volume típico em dB, duração) — descrição`. As trilhas estão em
`https://raw.githubusercontent.com/douglasdf99/kit-3d-skills/main/kit/biblioteca/musicas/musicas.json` (id, título, clima, BPM, duração).
Pra ouvir antes de escolher, abra o link direto do arquivo: `https://raw.githubusercontent.com/douglasdf99/kit-3d-skills/main/kit/biblioteca/efeitos/<categoria>/<nome>.mp3`.

| Categoria | Sons | Tamanho | O que tem |
|---|---|---|---|
| `agua` | 55 | 3.3 MB | água, chuva e mar |
| `aparecer_e_brilho` | 29 | 0.7 MB | pop, brilho, tada, acerto |
| `ar_e_vento` | 23 | 1.8 MB | ar, gás, vento e tempo |
| `casa_e_objetos` | 43 | 1.7 MB | portas, gavetas, objetos de casa |
| `cidade_e_gente` | 16 | 2.0 MB | trânsito, sirene, feira, festa, estádio |
| `cozinha_e_comida` | 20 | 0.8 MB | cozinha e comida |
| `eletricidade` | 15 | 0.5 MB | choque, faísca, zumbido elétrico |
| `escola_e_escritorio` | 14 | 0.5 MB | escola e escritório |
| `esportes_e_jogos` | 19 | 0.5 MB | esportes e sons de videogame 8-bit |
| `ficcao_e_espaco` | 16 | 0.9 MB | laser, robô, nave, foguete |
| `fogo_e_calor` | 22 | 1.5 MB | fogo, calor e frio |
| `humor` | 36 | 0.9 MB | desenho animado: boing, apito, tapa, plateia rindo |
| `impactos_e_quebras` | 56 | 1.6 MB | batidas, quedas, quebras |
| `interface_e_eletronicos` | 53 | 1.7 MB | cliques, bipes, alarmes, relógios, celular, erro |
| `maquinas_e_mecanismos` | 31 | 1.2 MB | engrenagens, motores, mecanismos |
| `musica_e_vinhetas` | 21 | 0.9 MB | prato, gongo, fanfarra, acordes |
| `natureza_e_bichos` | 53 | 3.1 MB | bichos e ambientes de fazenda, floresta e selva |
| `novos` | 1 | 0.0 MB | efeitos criados com efeito_novo.py |
| `obra_e_construcao` | 52 | 1.8 MB | ferramentas, martelo, serra, obra |
| `passos_e_movimento` | 21 | 0.9 MB | passos e movimento do boneco |
| `suspense_e_terror` | 12 | 0.8 MB | suspense e terror de desenho |
| `transicoes` | 38 | 1.2 MB | whoosh, subidas, rebobinar, zoom, glitch |
| `veiculos` | 49 | 2.5 MB | carro, moto, trem, avião |
| `vozes_do_boneco` | 122 | 3.7 MB | falas curtas em português, gritos, risadas, multidão |

## 2. Baixar só os escolhidos

```bash
python3 -c "import urllib.request as u; u.urlretrieve('https://raw.githubusercontent.com/douglasdf99/kit-3d-skills/main/kit/sistema/ferramentas/baixar.py', 'baixar.py')"
python3 baixar.py --so --destino sons efeito:whoosh efeito:pop efeito:vaca_mugindo musica:oficina_curiosa
```

No Windows o comando é `python` em vez de `python3`. `--so` baixa só os arquivos pedidos (sem o motor do kit). Eles ficam em `sons/biblioteca/efeitos/<categoria>/`
e `sons/biblioteca/musicas/`. Uma categoria inteira: `efeitos:agua`. Todas as trilhas: `musicas`.

Dentro do kit de vídeo 3D não precisa disso: as ferramentas do kit baixam sozinhas os sons que a cena usa.

## Aviso de uso

A origem e os direitos de redistribuição de cada áudio ainda estão sendo conferidos
(veja `kit/LICENCAS-E-ORIGENS-A-CONFERIR.txt` no repositório). Confira antes de usar em projeto comercial.
