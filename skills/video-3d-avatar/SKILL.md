---
name: video-3d-avatar
description: Faz vídeos verticais em 3D (Shorts, Reels, TikTok, 1080x1920) no estilo "Avatar de jogo": Bonequinho de blocos de plástico, como avatar de jogo online: cabeça quadradinha com rosto desenhado, braços e pernas retos, mundo de blocos lisos e paredes de tijolo de textura simples. Use quando pedirem vídeo 3D, vídeo explicativo animado ou Short animado no estilo Avatar de jogo (avatar de jogo online, blocos de plástico, edição de meme). Baixa do GitHub só o motor e este estilo (uns 5 MB, sem zip), e os efeitos sonoros e trilhas só quando a cena usa.
---

# Vídeo 3D: estilo Avatar de jogo

**Como é:** Bonequinho de blocos de plástico, como avatar de jogo online: cabeça quadradinha com rosto desenhado, braços e pernas retos, mundo de blocos lisos e paredes de tijolo de textura simples. Edição de meme: legenda grande no meio da tela, soco de zoom, tremor e círculo vermelho apontando a peça.

**Como é a edição:** Edição de meme: legenda grande e centralizada, soco de zoom nas piadas e revelações, tremor nos impactos, círculo vermelho com seta na peça nomeada, rosto do avatar trocando de expressão; transição de flash.

**Peso pra fazer** (nota 45/100): créditos do Claude baixo · Claude montando 25–35 min · render de 2 min 7–8 min · correções previstas 1–2. Peças fáceis (tudo é bloco); o render é um pouco mais demorado.

Prévia (abre no navegador, sem baixar o kit): [vídeo de 10 s](https://raw.githubusercontent.com/douglasdf99/kit-3d-skills/main/kit/biblioteca/estilos/avatar/demo.mp4) · [boneco](https://raw.githubusercontent.com/douglasdf99/kit-3d-skills/main/kit/biblioteca/estilos/avatar/personagem.jpg) · [cena](https://raw.githubusercontent.com/douglasdf99/kit-3d-skills/main/kit/biblioteca/estilos/avatar/cena.jpg)

## 1. Instalar só o que este estilo precisa

Na pasta que a pessoa escolheu pra conversa, rode:

```bash
python3 -c "import urllib.request as u; u.urlretrieve('https://raw.githubusercontent.com/douglasdf99/kit-3d-skills/main/kit/sistema/ferramentas/baixar.py', 'baixar.py')"
python3 baixar.py estilo:avatar exemplo:avatar
```

No Windows o comando é `python` em vez de `python3`. Isso cria a pasta `Desmontando o Video - Kit/` com o motor 3D (uns 4 MB), este estilo e a demo dele.
Depois apague o `baixar.py` solto: a cópia que vale fica em `Desmontando o Video - Kit/sistema/ferramentas/`.

Se a pasta já tem `Desmontando o Video - Kit/`, **não baixe de novo** (perderia a configuração). Só acrescente o estilo:
`python3 "Desmontando o Video - Kit/sistema/ferramentas/baixar.py" estilo:avatar`

## 2. Fazer o vídeo

1. Leia `Desmontando o Video - Kit/CLAUDE.md` e siga. É o manual do kit: configuração (voz da ElevenLabs), roteiro,
   produção, render e revisão. As ferramentas rodam de dentro da pasta do kit.
2. Crie o vídeo já neste estilo: `python3 sistema/ferramentas/novo_video.py "Tema do vídeo" --estilo avatar`
3. Antes de montar a cena, leia `biblioteca/estilos/avatar/GUIA.md` (o modelo de edição do estilo) e a cena da demo,
   `Exemplos/avatar/cena/cena.js`.
4. Cenários prontos deste estilo: `E.chao({ cor, largura, prof })` (placas) · `E.paredeTijolo(w, h, { cor, esp })` · `E.sala({ x0, x1, z0, z1, h, tijolo, piso, janelaX })` · `E.arvore({ tam })` · `E.plataforma(w, d, cor, { altura })`.
5. Sons que combinam: `click_ui` (entra), `boom` (nome/impacto), `nene`/`nope` (erro), `record_scratch` (parada brusca), `applause_short` (final), `tada`, `rewind`.
   Não precisa baixar sons antes. Quando a cena usa um efeito ou trilha que ainda não está no computador,
   `conferir.py` aceita (ele conhece o catálogo inteiro) e `fazer_tudo.py` / `montar_audio.py` baixam só aquele arquivo.
   Pra adiantar tudo de uma vez: `python3 sistema/ferramentas/baixar.py video "Meus Videos/<nome>"`.

## Regras rápidas

- Roteiro aprovado pela pessoa antes de gerar a voz (a narração gasta créditos da ElevenLabs).
- A chave da ElevenLabs fica só em `config/chave_elevenlabs.txt`, no computador da pessoa. Nunca peça nem mostre no chat.
- Sem marcas reais: nada de logo, nome de marca, personagem famoso ou música famosa.
- Outros estilos e a biblioteca de sons completa: https://github.com/douglasdf99/kit-3d-skills
