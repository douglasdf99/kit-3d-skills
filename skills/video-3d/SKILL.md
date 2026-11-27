---
name: video-3d
description: Faz vídeos verticais em 3D (Shorts, Reels, TikTok, 1080x1920) com narração, legenda palavra por palavra, efeitos sonoros e trilha, no estilo Quadradinhos (tudo feito de quadradinhos, como um jogo de blocos). Use quando pedirem vídeo 3D, vídeo explicativo animado, Short/Reels animado, "como funciona por dentro", curiosidade, lista, "E se...?" ou terror em animação. Ajuda a escolher o estilo e baixa do GitHub só o que ele precisa, sem zip.
---

# Vídeo 3D (estilo Quadradinhos)

Este kit faz, junto com a pessoa, vídeos verticais em 3D: você escreve o roteiro, gera a voz (ElevenLabs), monta a cena 3D
com câmera passeando, letreiros, legenda, efeitos e trilha; a pessoa assiste à prévia no navegador e clica em Renderizar.
O formato padrão é "você constrói um objeto do zero, resolvendo um problema de cada vez", mas dá pra fazer curiosidade,
lista, terror, "E se...?", mito ou verdade e humor.

## 1. Escolher o estilo (uma pergunta, com botões)

| # | id | Estilo | Como é | Peso (0-100) | Prévia de 10 s |
|---|---|---|---|---|---|
| 1 | `quadradinhos` | Quadradinhos | Mundo de jogo de blocos: o boneco, as árvores, o chão e os objetos são montados com quadradinhos. | 75 | [ver](https://raw.githubusercontent.com/douglasdf99/kit-3d-skills/main/kit/biblioteca/estilos/quadradinhos/cena.jpg) |

Quanto menor o peso, mais leve (créditos, tempo de montagem e render).

## 2. Instalar só o necessário

Na pasta que a pessoa escolheu pra conversa (troque `<id>` pelo estilo escolhido):

```bash
python3 -c "import urllib.request as u; u.urlretrieve('https://raw.githubusercontent.com/douglasdf99/kit-3d-skills/main/kit/sistema/ferramentas/baixar.py', 'baixar.py')"
python3 baixar.py estilo:<id>
```

No Windows o comando é `python` em vez de `python3`. Vem o motor 3D (uns 4 MB) + o estilo. Nada de zip.
Apague o `baixar.py` solto depois; a cópia que vale fica em `Desmontando o Video - Kit/sistema/ferramentas/`.
Se já existe `Desmontando o Video - Kit/` na pasta, não baixe por cima: use o `baixar.py` de dentro dela.

Outros pacotes (rode `python3 baixar.py lista` pra ver todos com tamanho):
`efeitos:<categoria>` · `efeito:<nome>` · `musica:<id>` · `musicas` · `objetos:praia` · `objetos:montanha` · `tudo`.

## 3. Fazer o vídeo

Leia `Desmontando o Video - Kit/CLAUDE.md` e siga: ele é o manual completo (configuração, roteiro, produção, render,
revisão, painel). Crie o vídeo com `python3 sistema/ferramentas/novo_video.py "Tema" --estilo <id>` e leia
`biblioteca/estilos/<id>/GUIA.md` antes de montar a cena.

Os efeitos sonoros e as 10 trilhas **não precisam ser baixados antes**: as ferramentas do kit
baixam só os que a cena usa, na hora. Pra adiantar: `python3 sistema/ferramentas/baixar.py video "Meus Videos/<nome>"`.

## Regras rápidas

- Roteiro aprovado antes de gerar voz (narração gasta créditos).
- Chave da ElevenLabs só em `config/chave_elevenlabs.txt`, no computador da pessoa. Nunca no chat.
- Sem marcas reais, logos, personagens ou músicas famosas.

Uma skill por estilo (mais detalhada) e a biblioteca de sons: https://github.com/douglasdf99/kit-3d-skills/tree/main/skills
