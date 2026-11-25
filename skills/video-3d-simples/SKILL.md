---
name: video-3d-simples
description: Faz vídeos verticais em 3D (Shorts, Reels, TikTok, 1080x1920) no estilo "Simples": 3D bem básico e colorido, estilo vídeo "E SE…?": bonequinhos de cápsula com cabeça redonda grande e olhinhos de bolinha, praça clara, árvores de bolinha, céu azul limpo. Use quando pedirem vídeo 3D, vídeo explicativo animado ou Short animado no estilo Simples ("E se...?", multidão reagindo, vídeo rápido e leve, bonecos de cápsula). Baixa do GitHub só o motor e este estilo (uns 7 MB, sem zip), e os efeitos sonoros e trilhas só quando a cena usa.
---

# Vídeo 3D: estilo Simples

**Como é:** 3D bem básico e colorido, estilo vídeo "E SE…?": bonequinhos de cápsula com cabeça redonda grande e olhinhos de bolinha, praça clara, árvores de bolinha, céu azul limpo. Bom pra multidão reagindo junto. Manchete amarela grande no topo, legenda branca grossa com contorno preto.

**Como é a edição:** Abre com uma manchete no topo (ex.: E SE…?); a multidão reage junto (emotes em várias pessoas); socos de zoom nas revelações; transição de círculo; ritmo rápido.

**Peso pra fazer** (nota 35/100): créditos do Claude baixo · Claude montando 20–30 min · render de 2 min 4–5 min · correções previstas 1–2. O mais leve: bonecos e objetos com pouco detalhe.

Prévia (abre no navegador, sem baixar o kit): [vídeo de 10 s](https://raw.githubusercontent.com/douglasdf99/kit-3d-skills/main/kit/biblioteca/estilos/simples/demo.mp4) · [boneco](https://raw.githubusercontent.com/douglasdf99/kit-3d-skills/main/kit/biblioteca/estilos/simples/personagem.jpg) · [cena](https://raw.githubusercontent.com/douglasdf99/kit-3d-skills/main/kit/biblioteca/estilos/simples/cena.jpg)

## 1. Instalar só o que este estilo precisa

Na pasta que a pessoa escolheu pra conversa, rode:

```bash
python3 -c "import urllib.request as u; u.urlretrieve('https://raw.githubusercontent.com/douglasdf99/kit-3d-skills/main/kit/sistema/ferramentas/baixar.py', 'baixar.py')"
python3 baixar.py estilo:simples exemplo:simples
```

No Windows o comando é `python` em vez de `python3`. Isso cria a pasta `Desmontando o Video - Kit/` com o motor 3D (uns 4 MB), este estilo e a demo dele.
Depois apague o `baixar.py` solto: a cópia que vale fica em `Desmontando o Video - Kit/sistema/ferramentas/`.

Se a pasta já tem `Desmontando o Video - Kit/`, **não baixe de novo** (perderia a configuração). Só acrescente o estilo:
`python3 "Desmontando o Video - Kit/sistema/ferramentas/baixar.py" estilo:simples`

## 2. Fazer o vídeo

1. Leia `Desmontando o Video - Kit/CLAUDE.md` e siga. É o manual do kit: configuração (voz da ElevenLabs), roteiro,
   produção, render e revisão. As ferramentas rodam de dentro da pasta do kit.
2. Crie o vídeo já neste estilo: `python3 sistema/ferramentas/novo_video.py "Tema do vídeo" --estilo simples`
3. Antes de montar a cena, leia `biblioteca/estilos/simples/GUIA.md` (o modelo de edição do estilo) e a cena da demo,
   `Exemplos/simples/cena/cena.js`.
4. Cenários prontos deste estilo: `E.chao({ raio, cor })` · `E.praca({ raio })` · `E.fonte()` · `E.arvore({ tam })` · `E.predio({ largura, altura, cor })` · `E.sala({ ... })` · **`E.multidao(n, { raio, arco, a0 })`** → grupo com `.pessoas` (anime cada uma com `E.animar(p, t + i, {...})`, dá pra usar `emote` nelas).
5. Sons que combinam: `pop` (entra), `crowd_wow`/`applause_short` (nome e final), `gasp`/`crowdpanic` (problema), `tada`, `rewind`. Ambiente: `birds`.
   Não precisa baixar sons antes. Quando a cena usa um efeito ou trilha que ainda não está no computador,
   `conferir.py` aceita (ele conhece o catálogo inteiro) e `fazer_tudo.py` / `montar_audio.py` baixam só aquele arquivo.
   Pra adiantar tudo de uma vez: `python3 sistema/ferramentas/baixar.py video "Meus Videos/<nome>"`.

## Regras rápidas

- Roteiro aprovado pela pessoa antes de gerar a voz (a narração gasta créditos da ElevenLabs).
- A chave da ElevenLabs fica só em `config/chave_elevenlabs.txt`, no computador da pessoa. Nunca peça nem mostre no chat.
- Sem marcas reais: nada de logo, nome de marca, personagem famoso ou música famosa.
- Outros estilos e a biblioteca de sons completa: https://github.com/douglasdf99/kit-3d-skills
