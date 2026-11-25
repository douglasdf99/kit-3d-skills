---
name: video-3d-desenho
description: Faz vídeos verticais em 3D (Shorts, Reels, TikTok, 1080x1920) no estilo "Desenho": 3D com cara de desenho animado japonês: sombra em tons chapados, contorno preto em tudo, olhos grandes com brilho, cabelo espetado, cores fortes e lugares internos bem iluminados (ginásio, sala de aula, quarto). Use quando pedirem vídeo 3D, vídeo explicativo animado ou Short animado no estilo Desenho (anime, desenho animado japonês, cel shading, linhas de velocidade). Baixa do GitHub só o motor e este estilo (uns 6 MB, sem zip), e os efeitos sonoros e trilhas só quando a cena usa.
---

# Vídeo 3D: estilo Desenho

**Como é:** 3D com cara de desenho animado japonês: sombra em tons chapados, contorno preto em tudo, olhos grandes com brilho, cabelo espetado, cores fortes e lugares internos bem iluminados (ginásio, sala de aula, quarto). Linhas de velocidade e palavras de impacto nas horas fortes.

**Como é a edição:** Momentos fortes com linhas de velocidade e soco de zoom; palavras de impacto (PÁ!, VUSH!); emoções de desenho (gota de suor, veia de raiva, estrelinhas); transição de risco diagonal.

**Peso pra fazer** (nota 60/100): créditos do Claude médio · Claude montando 35–45 min · render de 2 min 6–7 min · correções previstas 2. Como o Brinquedo, mais contorno preto e efeitos de desenho.

Prévia (abre no navegador, sem baixar o kit): [vídeo de 10 s](https://raw.githubusercontent.com/douglasdf99/kit-3d-skills/main/kit/biblioteca/estilos/desenho/demo.mp4) · [boneco](https://raw.githubusercontent.com/douglasdf99/kit-3d-skills/main/kit/biblioteca/estilos/desenho/personagem.jpg) · [cena](https://raw.githubusercontent.com/douglasdf99/kit-3d-skills/main/kit/biblioteca/estilos/desenho/cena.jpg)

## 1. Instalar só o que este estilo precisa

Na pasta que a pessoa escolheu pra conversa, rode:

```bash
python3 -c "import urllib.request as u; u.urlretrieve('https://raw.githubusercontent.com/douglasdf99/kit-3d-skills/main/kit/sistema/ferramentas/baixar.py', 'baixar.py')"
python3 baixar.py estilo:desenho exemplo:desenho
```

No Windows o comando é `python` em vez de `python3`. Isso cria a pasta `Desmontando o Video - Kit/` com o motor 3D (uns 4 MB), este estilo e a demo dele.
Depois apague o `baixar.py` solto: a cópia que vale fica em `Desmontando o Video - Kit/sistema/ferramentas/`.

Se a pasta já tem `Desmontando o Video - Kit/`, **não baixe de novo** (perderia a configuração). Só acrescente o estilo:
`python3 "Desmontando o Video - Kit/sistema/ferramentas/baixar.py" estilo:desenho`

## 2. Fazer o vídeo

1. Leia `Desmontando o Video - Kit/CLAUDE.md` e siga. É o manual do kit: configuração (voz da ElevenLabs), roteiro,
   produção, render e revisão. As ferramentas rodam de dentro da pasta do kit.
2. Crie o vídeo já neste estilo: `python3 sistema/ferramentas/novo_video.py "Tema do vídeo" --estilo desenho`
3. Antes de montar a cena, leia `biblioteca/estilos/desenho/GUIA.md` (o modelo de edição do estilo) e a cena da demo,
   `Exemplos/desenho/cena/cena.js`.
4. Cenários prontos deste estilo: `E.ginasio({ largura, prof, circuloX, circuloZ })` · `E.sala({ x0, x1, z0, z1, h, piso, parede })` · `E.chao({ raio, cor })`. Fundo de céu claro já vem do `E.preparar()`.
5. Sons que combinam: `whoosh` (entra), `sparkle` (nome), `susto_impacto` (erro), `tada` + `sparkle` (final), `rewind`.
   Não precisa baixar sons antes. Quando a cena usa um efeito ou trilha que ainda não está no computador,
   `conferir.py` aceita (ele conhece o catálogo inteiro) e `fazer_tudo.py` / `montar_audio.py` baixam só aquele arquivo.
   Pra adiantar tudo de uma vez: `python3 sistema/ferramentas/baixar.py video "Meus Videos/<nome>"`.

## Regras rápidas

- Roteiro aprovado pela pessoa antes de gerar a voz (a narração gasta créditos da ElevenLabs).
- A chave da ElevenLabs fica só em `config/chave_elevenlabs.txt`, no computador da pessoa. Nunca peça nem mostre no chat.
- Sem marcas reais: nada de logo, nome de marca, personagem famoso ou música famosa.
- Outros estilos e a biblioteca de sons completa: https://github.com/douglasdf99/kit-3d-skills
