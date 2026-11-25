---
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
| 1 | `padrao` | Padrão | O visual da série Desmontando o Mundo: 3D low-poly colorido, casa em corte, quintal com grama e cerca, céu com nuvens. | 60 | [ver](https://raw.githubusercontent.com/douglasdf99/kit-3d-skills/main/kit/biblioteca/estilos/padrao/demo.mp4) |
| 2 | `ilustrado` | Ilustrado 2D | Desenho plano visto de lado, como animação de explicação: cores chapadas (petróleo, mostarda, creme, lilás), pôr do sol, prédios em corte, calçada de ondinhas. | 70 | [ver](https://raw.githubusercontent.com/douglasdf99/kit-3d-skills/main/kit/biblioteca/estilos/ilustrado/demo.mp4) |
| 3 | `cubinhos` | Cubinhos | Mundo de jogo de blocos: o boneco, as árvores, o chão e os objetos são montados com cubinhos. | 75 | [ver](https://raw.githubusercontent.com/douglasdf99/kit-3d-skills/main/kit/biblioteca/estilos/cubinhos/demo.mp4) |
| 4 | `brinquedo` | Brinquedo | Bonequinhos 3D lisinhos e brilhantes, cabeçudos e de olhos grandes, como brinquedos de plástico, num cenário mais realista: terra com pedrinhas, plantas, cerca de arame, trilho, morros ao longe. | 55 | [ver](https://raw.githubusercontent.com/douglasdf99/kit-3d-skills/main/kit/biblioteca/estilos/brinquedo/demo.mp4) |
| 5 | `simples` | Simples | 3D bem básico e colorido, estilo vídeo "E SE…?": bonequinhos de cápsula com cabeça redonda grande e olhinhos de bolinha, praça clara, árvores de bolinha, céu azul limpo. | 35 | [ver](https://raw.githubusercontent.com/douglasdf99/kit-3d-skills/main/kit/biblioteca/estilos/simples/demo.mp4) |
| 6 | `desenho` | Desenho | 3D com cara de desenho animado japonês: sombra em tons chapados, contorno preto em tudo, olhos grandes com brilho, cabelo espetado, cores fortes e lugares internos bem iluminados (ginásio, sala de aula, quarto). | 60 | [ver](https://raw.githubusercontent.com/douglasdf99/kit-3d-skills/main/kit/biblioteca/estilos/desenho/demo.mp4) |
| 7 | `avatar` | Avatar de jogo | Bonequinho de blocos de plástico, como avatar de jogo online: cabeça quadradinha com rosto desenhado, braços e pernas retos, mundo de blocos lisos e paredes de tijolo de textura simples. | 45 | [ver](https://raw.githubusercontent.com/douglasdf99/kit-3d-skills/main/kit/biblioteca/estilos/avatar/demo.mp4) |

Quanto menor o peso, mais leve (créditos, tempo de montagem e render). Na dúvida: `simples` é o mais leve, `padrao` é o da série.

## 2. Instalar só o necessário

Na pasta que a pessoa escolheu pra conversa (troque `<id>` pelo estilo escolhido):

```bash
python3 -c "import urllib.request as u; u.urlretrieve('https://raw.githubusercontent.com/douglasdf99/kit-3d-skills/main/kit/sistema/ferramentas/baixar.py', 'baixar.py')"
python3 baixar.py estilo:<id> exemplo:<id>
```

No Windows o comando é `python` em vez de `python3`. Vem o motor 3D (uns 4 MB) + o estilo + a demo dele. Nada de zip de 3 GB.
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

Uma skill por estilo (mais detalhada) e a biblioteca de sons: https://github.com/douglasdf99/kit-3d-skills/tree/main/skills
