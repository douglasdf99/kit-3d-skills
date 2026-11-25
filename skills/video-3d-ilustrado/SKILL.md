---
name: video-3d-ilustrado
description: Faz vídeos verticais em 3D (Shorts, Reels, TikTok, 1080x1920) no estilo "Ilustrado 2D": Desenho plano visto de lado, como animação de explicação: cores chapadas (petróleo, mostarda, creme, lilás), pôr do sol, prédios em corte, calçada de ondinhas. Use quando pedirem vídeo 3D, vídeo explicativo animado ou Short animado no estilo Ilustrado 2D (2D, desenho plano, animação de explicação, motion graphics, explainer). Baixa do GitHub só o motor e este estilo (uns 6 MB, sem zip), e os efeitos sonoros e trilhas só quando a cena usa.
---

# Vídeo 3D: estilo Ilustrado 2D

**Como é:** Desenho plano visto de lado, como animação de explicação: cores chapadas (petróleo, mostarda, creme, lilás), pôr do sol, prédios em corte, calçada de ondinhas. Sem luz nem sombra 3D. A câmera anda de lado, aproxima e afasta, como se o desenho fosse um cenário de papel. Letreiros em pílula branca com linha até a peça, legenda arredondada numa caixinha.

**Como é a edição:** Câmera de lado que desliza (nunca gira); transições de cortina colorida; peças entram deslizando ou crescendo; ênfase com zoom suave; emoções em ícones planos.

**Peso pra fazer** (nota 70/100): créditos do Claude médio-alto · Claude montando 45–60 min · render de 2 min 4 min · correções previstas 2–3. Render rápido, mas cada peça é um desenho plano feito de várias formas.

Prévia (abre no navegador, sem baixar o kit): [vídeo de 10 s](https://raw.githubusercontent.com/douglasdf99/kit-3d-skills/main/kit/biblioteca/estilos/ilustrado/demo.mp4) · [boneco](https://raw.githubusercontent.com/douglasdf99/kit-3d-skills/main/kit/biblioteca/estilos/ilustrado/personagem.jpg) · [cena](https://raw.githubusercontent.com/douglasdf99/kit-3d-skills/main/kit/biblioteca/estilos/ilustrado/cena.jpg)

## 1. Instalar só o que este estilo precisa

Na pasta que a pessoa escolheu pra conversa, rode:

```bash
python3 -c "import urllib.request as u; u.urlretrieve('https://raw.githubusercontent.com/douglasdf99/kit-3d-skills/main/kit/sistema/ferramentas/baixar.py', 'baixar.py')"
python3 baixar.py estilo:ilustrado exemplo:ilustrado
```

No Windows o comando é `python` em vez de `python3`. Isso cria a pasta `Desmontando o Video - Kit/` com o motor 3D (uns 4 MB), este estilo e a demo dele.
Depois apague o `baixar.py` solto: a cópia que vale fica em `Desmontando o Video - Kit/sistema/ferramentas/`.

Se a pasta já tem `Desmontando o Video - Kit/`, **não baixe de novo** (perderia a configuração). Só acrescente o estilo:
`python3 "Desmontando o Video - Kit/sistema/ferramentas/baixar.py" estilo:ilustrado`

## 2. Fazer o vídeo

1. Leia `Desmontando o Video - Kit/CLAUDE.md` e siga. É o manual do kit: configuração (voz da ElevenLabs), roteiro,
   produção, render e revisão. As ferramentas rodam de dentro da pasta do kit.
2. Crie o vídeo já neste estilo: `python3 sistema/ferramentas/novo_video.py "Tema do vídeo" --estilo ilustrado`
3. Antes de montar a cena, leia `biblioteca/estilos/ilustrado/GUIA.md` (o modelo de edição do estilo) e a cena da demo,
   `Exemplos/ilustrado/cena/cena.js`.
4. Cenários prontos deste estilo: `E.horizonte({ solX, solY, solR, marY, marAltura, cidadeAltura })` (fundo bem atrás, com parallax) · `E.rua({ largura })` · `E.predio({ largura, andares, janelas, portaX, escada })` · `E.sala({ x0, x1, y0, h, janelaX, parede })` (cômodo em corte) · `E.planta({ tam })` · `E.arvore({ tam })` · `E.ceuDoEstilo(cores)`.
5. Sons que combinam: `whoosh_suave` (peça entra), `ding` (nome), `confused` (problema), `slide`, `pop`, `tada` + `cheer` (final), `rewind`. Ambiente: `birds`, cidade.
   Não precisa baixar sons antes. Quando a cena usa um efeito ou trilha que ainda não está no computador,
   `conferir.py` aceita (ele conhece o catálogo inteiro) e `fazer_tudo.py` / `montar_audio.py` baixam só aquele arquivo.
   Pra adiantar tudo de uma vez: `python3 sistema/ferramentas/baixar.py video "Meus Videos/<nome>"`.

## Regras rápidas

- Roteiro aprovado pela pessoa antes de gerar a voz (a narração gasta créditos da ElevenLabs).
- A chave da ElevenLabs fica só em `config/chave_elevenlabs.txt`, no computador da pessoa. Nunca peça nem mostre no chat.
- Sem marcas reais: nada de logo, nome de marca, personagem famoso ou música famosa.
- Outros estilos e a biblioteca de sons completa: https://github.com/douglasdf99/kit-3d-skills
