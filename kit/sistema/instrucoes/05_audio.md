# 05: Áudio (narração, música e efeitos sonoros)

## Narração
- Voz, modelo e ajustes ficam em `config/canal.json`: `voz_id`, `modelo` (padrão `eleven_v4`), `estabilidade` 0.3,
  `similaridade` 0.9, `velocidade` 1.12 (a fala sai 12% mais rápida, o ritmo da série), `velocidade_cta` 1.2 (chamada
  final ainda mais rápida), `pausa_max` 0.30 s (pausas longas são encurtadas).
- Um vídeo pode usar outra voz: coloque `"voz_id"` no `video.json` dele.
- `narrar.py` só gera de novo o que mudou (o texto principal ou a chamada) e guarda tudo em `audio/narracao/`.
  `--forcar` gera de novo mesmo sem mudança (útil se a pessoa não gostou da entonação; cada vez sai um pouco diferente).

## Música
Escolha pelo clima do objeto e grave no `video.json`: `"musica": "<id>"` (ou `"nenhuma"`).

| id | clima | boa pra |
|---|---|---|
| `oficina_curiosa` | pizzicato, marimba, curiosa | quase tudo (padrão) |
| `ideia_brilhante` | ukulele, glockenspiel, alegre | objetos do dia a dia, temas leves |
| `circuito` | synth retrô, bips | eletrônicos, aparelhos, tecnologia |
| `groove_de_garagem` | funk, guitarra, confiante | carros, motores, máquinas |
| `laboratorio_lofi` | lo-fi calmo | ciência, explicações tranquilas |
| `grande_obra` | orquestra aventureira | prédios, pontes, navios, aviões |
| `bossa_mecanica` | bossa/samba, violão | qualquer um com cara de Brasil |
| `swing_de_predio` | big band swing anos 30 | prédios, cidades, invenções antigas, história |
| `forro_da_oficina` | forró: sanfona, zabumba, triângulo | dia a dia, festa, campo, comida, cara de Brasil |
| `fase_bonus` | videogame 8-bit (chiptune) | games, computadores, eletrônicos retrô |
| `pista_misteriosa` | jazz de detetive, vibrafone | "como funciona por dentro", mecanismos escondidos |
| `gigante` | épica de cinema, taiko e metais | coisas enormes: navios, foguetes, represas, usinas |
| `desenho_animado` | orquestra de desenho: tuba, fagote, xilofone | humor, bichos, coisas que dão errado |
| `estrada_de_guitarra` | rockabilly/surf, guitarra com reverb | carros, motos, bicicletas, estrada |
| `batida_de_rua` | hip-hop boom bap com scratches | celular, gadgets, skate, objetos modernos |
| `fazenda_feliz` | bluegrass: banjo, rabeca, gaita | fazenda, bichos, ferramentas, comida |
| `orbita` | synthwave espacial | espaço, foguetes, satélites, energia, futuro |

- O `montar_audio.py` estica ou encurta a trilha em compassos inteiros pra **batida final cair exatamente no "Parabéns"**,
  abaixa a música quando a voz fala e deixa a batida final soar. Não precisa editar nada.
- Volume da música só neste vídeo: `"volume_musica": -2` (mais baixa) ou `2` (mais alta) no `video.json`.
- Trilha nova da pessoa: veja `07_personalizar.md`.
- **Nunca use música famosa ou com direitos** (a pessoa pode tomar strike).

## Efeitos sonoros (a série tem som em TODA ação)
Os efeitos entram na própria cena:
```js
som('whoosh', A.poe - 0.05, -18);                    // nome, segundo, volume em dB
som('sparks', A.brilham - 0.05, -13, 0.2);            // 4º número = pan (-1 esquerda … 1 direita)
som('rise', A.forte + 0.1, -4, { dur: 2.0, fadeIn: 0.05, fadeOut: 0.04 });   // corta o som em 2 s
ambiente('fire', A.quase - 0.25, A.metal - 0.3, -15, { fade: 0.3, env: (t) => 0.35 + 0.65 * clamp((t - A.quase) / 2.2) });
```
- A lista está em `biblioteca/efeitos/efeitos.md` (nome, volume típico, duração e descrição), separada por categoria.
  O volume típico é o que já foi usado nos vídeos da série (ou, nos sons novos, um bom ponto de partida): comece por ele.
  A pessoa pode ouvir tudo em `Biblioteca de Sons.html` e te dizer o nome do som que quer.
- Sons marcados "contínuo" (chuva, mar, fazenda, trânsito, feira, nave…) são pra `ambiente(...)`, não pra `som(...)`.
- **Falas curtas do boneco em português** (`voz_eita`, `voz_uau`, `voz_opa`, `voz_ue`, `voz_naao`, `voz_socorro`, `voz_ufa`,
  `voz_isso`, `voz_bora`, `voz_cuidado`, `voz_deucerto`, `voz_deuruim`…; as terminadas em `_f` são voz feminina, `_crianca`
  de criança): use junto do balão/reação. Se o vídeo for em outra língua, use as sem palavras (`grito_*`, `resmungo_*`, `risada_*`).
- `ambiente(...)` repete um som contínuo (fogo, chuva, motor, grilos, ventilador) entre dois momentos. `env` controla
  o volume ao longo do tempo (0 a 1).
- O `conferir.py` avisa se algum nome não existe (e sugere parecidos).

**Onde colocar som (padrão da série):**
- Movimento grande de câmera ou peça voando: `whoosh` (-18 a -22).
- Peça que aparece/encaixa: `pop`/`pop2` (-14 a -17), `click` (-13 a -16), `clank`/`clunk` em metal.
- Algo dá errado: som do problema (queimar `sizzle`/`burnout`, quebrar `snap`/`shatter`, vazar `drip`/`leak`) + reação do boneco.
- Algo dá certo: `sparkle`, `ding`, `correct`, `lighton`/`ledon`.
- Letreiro grande: o "pop" já entra sozinho (`pop2` a -19). Plaquinha importante: `pop2` (-16) se quiser.
- Boneco: passos (`steps`), voz de boneco junto do balão (`uhul` -1, `aah` -2, `ouch` -9, `wow`, `gasp`, `doll_oba`…).
- Fundo do lugar: `ambiente('crickets', 0, DURATION, -30)` à noite, `birds` de dia, bem baixinho.
- Voltar a fita: `record_scratch` ou `rewind`.
- Final: `som('tada', A.parabens - 0.06, -4)` e `som('pop2', A.comente, -14)`.
- Não empilhe muitos sons no mesmo instante: no máximo 2 ou 3 juntos.
- Nenhum som tampa a voz: impactos fortes (-6 a 0) só em momentos sem fala ou bem curtos.

**Faltou um som?** Crie com `python3 sistema/ferramentas/efeito_novo.py <nome> "descrição em inglês" [segundos]`
(gasta poucos créditos). Ex.: `efeito_novo.py zipper "A zipper being pulled closed quickly. No music, no voice." 1.2`.
Vozes de boneco: descreva como "A cute little cartoon toy character saying '...' , high pitched, playful. No music."

## Volume final
O `montar_audio.py` deixa o vídeo no volume padrão das plataformas (-14 LUFS). Se a pessoa achar que os efeitos estão
altos/baixos demais no vídeo todo: `"volume_efeitos": -3` (ou `3`) no `video.json`.

## Trilha com outro clima (terror, drama, épica…)
A biblioteca tem 30 trilhas (alegres, curiosas, terror, suspense, mistério, drama, épica, calma, eletrônica, trap, tropical, fantasia…).
Veja a `descricao` de cada uma em `musicas.json`. Se nenhuma servir, gere uma com a ElevenLabs (custa créditos; confirme antes):
`python3 sistema/ferramentas/musica_nova.py <id> "descrição em inglês do clima e dos instrumentos" [segundos] ["descrição em português"]`
Ex.: `musica_nova.py noite_sombria "Dark, tense horror ambient: low drones, music box, distant piano, soft heartbeat drum" 120 "Terror: tensa e sombria"`.
A ferramenta já pede "sem introdução silenciosa, sem buracos, sem voz e uma batida final ~10 s antes do fim", analisa a batida e põe no catálogo.
Use no `video.json`: `"musica": "noite_sombria"`. Pra marcar onde cai a batida final num vídeo sem "Parabéns": `"batida_final": "<âncora>"`.
