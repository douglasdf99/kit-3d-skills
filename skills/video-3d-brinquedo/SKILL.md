---
name: video-3d-brinquedo
description: Faz vídeos verticais em 3D (Shorts, Reels, TikTok, 1080x1920) no estilo "Brinquedo": Bonequinhos 3D lisinhos e brilhantes, cabeçudos e de olhos grandes, como brinquedos de plástico, num cenário mais realista: terra com pedrinhas, plantas, cerca de arame, trilho, morros ao longe. Use quando pedirem vídeo 3D, vídeo explicativo animado ou Short animado no estilo Brinquedo (bonequinhos de plástico, miniatura, brinquedo, toy, cinema). Baixa do GitHub só o motor e este estilo (uns 6 MB, sem zip), e os efeitos sonoros e trilhas só quando a cena usa.
---

# Vídeo 3D: estilo Brinquedo

**Como é:** Bonequinhos 3D lisinhos e brilhantes, cabeçudos e de olhos grandes, como brinquedos de plástico, num cenário mais realista: terra com pedrinhas, plantas, cerca de arame, trilho, morros ao longe. Luz de sol macia, cara de miniatura. Legenda branca grossa com contorno, letreiros brancos limpos.

**Como é a edição:** Câmera de cinema: aproximações lentas, giros suaves em volta do boneco, câmera lenta nos erros (tempoLento), tremor leve nos impactos; letreiro limpo e plaquinha escura.

**Peso pra fazer** (nota 55/100): créditos do Claude médio · Claude montando 35–45 min · render de 2 min 6 min · correções previstas 2. Formas lisas montadas na hora, com brilho e sombra.

Prévia (abre no navegador, sem baixar o kit): [vídeo de 10 s](https://raw.githubusercontent.com/douglasdf99/kit-3d-skills/main/kit/biblioteca/estilos/brinquedo/demo.mp4) · [boneco](https://raw.githubusercontent.com/douglasdf99/kit-3d-skills/main/kit/biblioteca/estilos/brinquedo/personagem.jpg) · [cena](https://raw.githubusercontent.com/douglasdf99/kit-3d-skills/main/kit/biblioteca/estilos/brinquedo/cena.jpg)

## 1. Instalar só o que este estilo precisa

Na pasta que a pessoa escolheu pra conversa, rode:

```bash
python3 -c "import urllib.request as u; u.urlretrieve('https://raw.githubusercontent.com/douglasdf99/kit-3d-skills/main/kit/sistema/ferramentas/baixar.py', 'baixar.py')"
python3 baixar.py estilo:brinquedo exemplo:brinquedo
```

No Windows o comando é `python` em vez de `python3`. Isso cria a pasta `Desmontando o Video - Kit/` com o motor 3D (uns 4 MB), este estilo e a demo dele.
Depois apague o `baixar.py` solto: a cópia que vale fica em `Desmontando o Video - Kit/sistema/ferramentas/`.

Se a pasta já tem `Desmontando o Video - Kit/`, **não baixe de novo** (perderia a configuração). Só acrescente o estilo:
`python3 "Desmontando o Video - Kit/sistema/ferramentas/baixar.py" estilo:brinquedo`

## 2. Fazer o vídeo

1. Leia `Desmontando o Video - Kit/CLAUDE.md` e siga. É o manual do kit: configuração (voz da ElevenLabs), roteiro,
   produção, render e revisão. As ferramentas rodam de dentro da pasta do kit.
2. Crie o vídeo já neste estilo: `python3 sistema/ferramentas/novo_video.py "Tema do vídeo" --estilo brinquedo`
3. Antes de montar a cena, leia `biblioteca/estilos/brinquedo/GUIA.md` (o modelo de edição do estilo) e a cena da demo,
   `Exemplos/brinquedo/cena/cena.js`.
4. Cenários prontos deste estilo: `E.chao({ cor, repetir })` (terra com pedrinhas) · `E.pedras(n, [x0, x1, z0, z1])` · `E.agave({ tam })` · `E.cerca(x0, x1, z)` · `E.arvore({ tam })` · `E.morros()` · `E.trilho(x0, x1, z)` · `E.sala({ x0, x1, z0, z1, h, parede })`.
5. Sons que combinam: `whoosh_suave`/`whoosh_cinema` (entra), `sparkle` (nome), `orquestra_impacto`/`boom` (erro), `tada` + `sparkle` (final), `rewind`. Ambiente: `birds`, vento.
   Não precisa baixar sons antes. Quando a cena usa um efeito ou trilha que ainda não está no computador,
   `conferir.py` aceita (ele conhece o catálogo inteiro) e `fazer_tudo.py` / `montar_audio.py` baixam só aquele arquivo.
   Pra adiantar tudo de uma vez: `python3 sistema/ferramentas/baixar.py video "Meus Videos/<nome>"`.

## Regras rápidas

- Roteiro aprovado pela pessoa antes de gerar a voz (a narração gasta créditos da ElevenLabs).
- A chave da ElevenLabs fica só em `config/chave_elevenlabs.txt`, no computador da pessoa. Nunca peça nem mostre no chat.
- Sem marcas reais: nada de logo, nome de marca, personagem famoso ou música famosa.
- Outros estilos e a biblioteca de sons completa: https://github.com/douglasdf99/kit-3d-skills
