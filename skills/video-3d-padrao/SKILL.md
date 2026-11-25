---
name: video-3d-padrao
description: Faz vídeos verticais em 3D (Shorts, Reels, TikTok, 1080x1920) no estilo "Padrão": O visual da série Desmontando o Mundo: 3D low-poly colorido, casa em corte, quintal com grama e cerca, céu com nuvens. Use quando pedirem vídeo 3D, vídeo explicativo animado ou Short animado no estilo Padrão (low-poly colorido, casa em corte, "como funciona por dentro", "monte um objeto do zero"). Baixa do GitHub só o motor e este estilo (uns 5 MB, sem zip), e os efeitos sonoros e trilhas só quando a cena usa.
---

# Vídeo 3D: estilo Padrão

**Como é:** O visual da série Desmontando o Mundo: 3D low-poly colorido, casa em corte, quintal com grama e cerca, céu com nuvens. Letreiros amarelos grossos com contorno preto, plaquinhas brancas em pílula, legenda branca com as palavras-chave em amarelo.

**Como é a edição:** O formato da série: câmera que gira devagar em volta das coisas, alterna perto e longe, letreiro amarelo com pop, volta da fita com ◀◀, emoções no boneco; transição de cortina.

**Peso pra fazer** (nota 60/100): créditos do Claude médio · Claude montando 35–50 min · render de 2 min 6–8 min · correções previstas 2–3. Tem objetos prontos e o vídeo da Lâmpada de gabarito, mas pede o capricho da série.

Prévia (abre no navegador, sem baixar o kit): [vídeo de 10 s](https://raw.githubusercontent.com/douglasdf99/kit-3d-skills/main/kit/biblioteca/estilos/padrao/demo.mp4) · [boneco](https://raw.githubusercontent.com/douglasdf99/kit-3d-skills/main/kit/biblioteca/estilos/padrao/personagem.jpg) · [cena](https://raw.githubusercontent.com/douglasdf99/kit-3d-skills/main/kit/biblioteca/estilos/padrao/cena.jpg)

## 1. Instalar só o que este estilo precisa

Na pasta que a pessoa escolheu pra conversa, rode:

```bash
python3 -c "import urllib.request as u; u.urlretrieve('https://raw.githubusercontent.com/douglasdf99/kit-3d-skills/main/kit/sistema/ferramentas/baixar.py', 'baixar.py')"
python3 baixar.py estilo:padrao exemplo:padrao
```

No Windows o comando é `python` em vez de `python3`. Isso cria a pasta `Desmontando o Video - Kit/` com o motor 3D (uns 4 MB), este estilo e a demo dele.
Depois apague o `baixar.py` solto: a cópia que vale fica em `Desmontando o Video - Kit/sistema/ferramentas/`.

Se a pasta já tem `Desmontando o Video - Kit/`, **não baixe de novo** (perderia a configuração). Só acrescente o estilo:
`python3 "Desmontando o Video - Kit/sistema/ferramentas/baixar.py" estilo:padrao`

## 2. Fazer o vídeo

1. Leia `Desmontando o Video - Kit/CLAUDE.md` e siga. É o manual do kit: configuração (voz da ElevenLabs), roteiro,
   produção, render e revisão. As ferramentas rodam de dentro da pasta do kit.
2. Crie o vídeo já neste estilo: `python3 sistema/ferramentas/novo_video.py "Tema do vídeo" --estilo padrao`
3. Antes de montar a cena, leia `biblioteca/estilos/padrao/GUIA.md` (o modelo de edição do estilo) e a cena da demo,
   `Exemplos/padrao/cena/cena.js`.
4. Cenários prontos deste estilo: `E.mundo()` → `{ group, clouds }` (quintal + céu; mova `clouds.position.x = t * 0.04` no update) · `E.sala({ x0, x1, z0, z1, h, t })` → `{ group }` (casa em corte).
5. Sons que combinam: `whoosh` (entra), `pop2` (letreiro, automático), `sad`/`record_scratch` (erro), `tada` + `cheer` (final), `rewind`. Ambiente: `birds`.
   Não precisa baixar sons antes. Quando a cena usa um efeito ou trilha que ainda não está no computador,
   `conferir.py` aceita (ele conhece o catálogo inteiro) e `fazer_tudo.py` / `montar_audio.py` baixam só aquele arquivo.
   Pra adiantar tudo de uma vez: `python3 sistema/ferramentas/baixar.py video "Meus Videos/<nome>"`.

## Regras rápidas

- Roteiro aprovado pela pessoa antes de gerar a voz (a narração gasta créditos da ElevenLabs).
- A chave da ElevenLabs fica só em `config/chave_elevenlabs.txt`, no computador da pessoa. Nunca peça nem mostre no chat.
- Sem marcas reais: nada de logo, nome de marca, personagem famoso ou música famosa.
- Outros estilos e a biblioteca de sons completa: https://github.com/douglasdf99/kit-3d-skills
