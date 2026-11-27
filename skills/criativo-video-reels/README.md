# Criativo em vídeo para Reels (3D)

Skill do Claude que cria um anúncio curto (25 a 40 s, 9:16) no formato problema-solução: pesquisa as dores do público,
sugere 10 ideias, escreve a copy, pede aprovação e produz o vídeo animado em 3D, com narração da ElevenLabs, legenda,
efeitos sonoros e trilha.

## O que tem nesta pasta

| Arquivo | Para que serve |
|---|---|
| `SKILL.md` | A skill: o passo a passo que o Claude segue |
| `modelos/index.html` | Página para ver o estilo Quadradinhos, ouvir as 10 trilhas e os efeitos |
| `modelos/estilos/` | Prints do estilo Quadradinhos (o único da skill) |
| `modelos/trilhas/` | As 10 trilhas (60 s cada) e as descrições usadas para criá-las (`trilhas.json`) |
| `modelos/efeitos/` | Os 46 efeitos sonoros, todos no mesmo volume, e as descrições de cada um (`efeitos.json`) |
| `modelos/instalar_modelos.py` | Coloca as trilhas e os efeitos da skill no kit, no lugar dos do kit (a skill roda sozinha) |

## Como instalar

**Claude Code:** copie esta pasta inteira (`criativo-video-reels`) para a pasta de skills:
- Mac/Linux: `~/.claude/skills/criativo-video-reels/`
- Windows: `%USERPROFILE%\.claude\skills\criativo-video-reels\`

Depois abra o Claude Code e peça: "quero um vídeo criativo para o meu produto".

**Claude (app ou site):** compacte esta pasta em ZIP e envie na área de Skills das configurações.

## O que você vai precisar

- Uma conta na **ElevenLabs** (a skill guia a criação da chave). Para usar o vídeo em anúncio pago, precisa de um plano
  pago com licença comercial.
- Internet na primeira vez: o motor que monta o vídeo é baixado na hora.
- Google Chrome ou Edge, para gerar o MP4.
