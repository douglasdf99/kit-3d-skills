# Estilo «Ilustrado 2D» — guia do Claude (o modelo de edição)

Leia este guia inteiro antes de montar a cena de um vídeo neste estilo. Ele diz como o estilo **se parece** e como ele **é editado**,
e quais peças prontas existem. A cena de partida (`cena_modelo.js`, que o `novo_video.py` copia pro vídeo) já funciona do começo ao
fim — use como base e troque o conteúdo.

> **Exemplo pronto neste estilo:** `Exemplos/ilustrado/` é uma demo de 10 s (guarda-chuva: jornal → tecido impermeável) com a cena inteira em `cena/cena.js`. Leia junto com este guia: ela mostra o erro acontecendo, a volta da fita, a peça entrando e o "Esse é" com tudo do estilo (câmera, letreiros, efeitos e sons). O vídeo dela é o `demo.mp4` desta pasta.

Na cena: `import * as E from '../../../biblioteca/estilos/ilustrado/estilo.js';` e, logo no começo, `E.preparar();`

## O visual
- **Tudo é plano**: formas chapadas (retângulos arredondados, círculos, polígonos) sem luz nem sombra 3D. Sombras são formas mais escuras.
- **Visto de lado**, como animação de explicação: x = direita, y = cima. O `z` só decide quem fica na frente (maior = na frente, passos de 0,01).
- **Paleta**: petróleo `#2a8c88`, mostarda `#dfa53c`, creme `#f6e8cc`, lilás, coral do pôr do sol, azul-marinho. Use `E.COR`.
- **Cenários**: pôr do sol com mar e cidade ao fundo, prédios em corte com escada em zigue-zague, toldo listrado, calçada de ondinhas, cômodos em corte.
- **Letreiro**: pílula branca com texto petróleo e uma linha até a peça. **Legenda**: arredondada, numa caixinha escura.

## O boneco modelo
`const ze = E.boneco(look)` — sempre camisa branca, calça azul-escura e cabelo preto, a não ser que a pessoa peça outro visual.
`look` aceita: `camisa`, `calca`, `cabelo`, `pele`, `sapato`, `oculos` (cor), `bone` (cor).
A cada quadro: `E.animar(ze, t, { humor, fala, andar, passo, pose, poseK, olhar })`
- `humor` -1 (triste/bravo) … 1 (feliz) — muda boca e sobrancelha · `fala` 0..1 mexe a boca (só pros sons de voz do boneco)
- `andar` 0..1 = ciclo de caminhada (mova `ze.position` junto) · `olhar` -1..1 vira a cabeça
- `pose`: `'comemora'` · `'aponta'` · `'segura'` · `'pensa'` · `'susto'` · `'tchau'` — `poseK` 0..1 mistura (use `win(...)` pra entrar e sair)
- mão até um ponto: `alcancar(ze, ze.userData.arms[1], V(x, y, z), k)` (`arms[0]` e `arms[1]` são os dois braços — no 2D o braço 1 é o da frente; virar pra esquerda: `ze.scale.x = -1`)
- vários bonecos: chame `E.boneco()` de novo (pode mudar `look`); cada um precisa do seu `E.animar`.

## Peças pra montar o objeto do vídeo
Peças são formas planas: `E.ret(w, h, cor, { r, z })` (centrado) · `E.retBase(w, h, cor)` (base no 0) · `E.retPend(w, h, cor)` (topo no 0)
· `E.circ(r, cor)` · `E.elipse(rx, ry, cor, { a0, a1 })` (arco = meia-lua) · `E.poli([[x, y], ...], cor)` · `E.anel(r1, r2, cor)` · `E.traco([[x, y], ...], esp, cor)` (fio, cano)
· `E.sombra(largura)` · `E.retPadrao(w, h, desenho)` (textura desenhada: listras, tijolinho) · `E.grupo(...)` · `E.em(obj, x, y, z)`.
Monte objetos empilhando formas e use **2 tons** de cada cor (a cor e uma mais escura do lado da sombra) pra dar volume, como no boneco.
Coisas que giram (hélice, roda, engrenagem): ponha num grupo e gire `rotation.z`. Pra "abrir" um objeto e mostrar dentro, troque a frente por uma versão em corte.

## Cenários prontos
`E.horizonte({ solX, solY, solR, marY, marAltura, cidadeAltura })` (fundo bem atrás, com parallax) · `E.rua({ largura })` · `E.predio({ largura, andares, janelas, portaX, escada })`
· `E.sala({ x0, x1, y0, h, janelaX, parede })` (cômodo em corte) · `E.planta({ tam })` · `E.arvore({ tam })` · `E.ceuDoEstilo(cores)`.

## Câmera
Use **`E.tomada(t, x, y, alturaVisivel, dur, { lado })`** em vez de `orb`: a câmera olha pro ponto (x, y) mostrando `alturaVisivel` metros de altura.
A tela é vertical: com altura 3 m aparecem só ~1,7 m de largura — ponha o boneco e o objeto perto um do outro.
PERTO = altura 1,5–2,2 · MÉDIO = 3–3,5 · LONGE = 4,2–5,5 (o "Esse é" e o Parabéns). Trocar de cena = deslizar a câmera pro lado
(`dur` 1–1,5 s) ou `transicao(t, 'cortina')` no meio. A câmera nunca gira em volta das coisas (é desenho plano).

**Enquadramento:** as distâncias acima são pra um objeto de ~1 m. O que vale é a regra: PERTO = a peça nova enche boa parte da tela;
LONGE = o objeto INTEIRO e o boneco aparecem (objeto pequeno, câmera mais perto). Ponha o boneco **ao lado** do objeto, virado pra ele
(nunca atrás dele, senão todo close mostra as costas do boneco). A tela é vertical: boneco e objeto perto um do outro.

## Momento a momento (o formato da série neste estilo)
A cena de partida (`cena_modelo.js`, copiada pelo `novo_video.py`) já faz tudo isto sozinha a partir da narração
(`estrutura()` acha em cada linha o problema, a volta da fita, a hora em que a peça entra e a hora do nome).
Você troca o cenário, as peças e as ações pelo conteúdo do vídeo; a lógica de tempo pode ficar.

| Momento | O que aparece | Como fazer |
|---|---|---|
| Gancho (linha 0) | a tentativa tosca funciona mais ou menos e dá errado na tela | objeto simples + falha visível (quebra, cai, queima) + boneco em `pose: 'susto'` + emote; no fim, ◀◀ |
| Problema ("Mas…/Só que…") | o problema ACONTECE na tela, o boneco sente | tremer/quebrar/vazar o objeto, `emote('suor', ...)` ou `emote('!', ...)` |
| Volta a fita | ◀◀ e tudo volta ao estado de antes | `rebobinar(t, 0.7)` + `som('rewind', t, -8)` + tomada nova com `dur = 0` logo depois |
| "Então você…" | a peça nova entra (voando, encaixando, crescendo) | `pop(t, ...)` na escala, `pose: 'segura'`, som de entrada; câmera PERTO da peça |
| "Esse é o X" | a peça PISCA 2× em amarelo + letreiro com o nome | `piscar(peca, t)` + `label('X', t, t + 1.6, ...)` + `emote('ideia', ...)` + som `'ding'`; câmera LONGE (objeto inteiro) |
| "É por isso que…" | o exemplo do dia a dia, mostrado | uma mini-cena rápida (inserto) ou plaquinha com `chip(...)` |
| Acabamento | as peças finais entram em sequência rápida | várias peças com `pop` em sequência + sons curtos |
| "Parabéns!" | câmera abre, boneco USA o objeto e comemora | `pose: 'comemora'`, `som('tada', ...)`, tomada bem aberta girando |
| Chamada | palavra pra comentar no topo | `banner('COMENTE “X”', ...)` (a cena de partida já faz) |

Regras que valem sempre: a narração começa no segundo 0; câmera nunca parada; alternar tomada PERTO e LONGE;
som em toda ação; o boneco sempre na cena com emoção; nada de marcas, logos ou personagens famosos; o boneco nunca
aparece trabalhando de jeito perigoso.

## Efeitos de edição disponíveis (sistema/motor/edicao.js)
`piscar(obj, t)` · `rebobinar(t, dur)` · `zoomSoco(t, força)` · `tremor(t, dur, força)` · `emote(tipo, t0, t1, boneco)`
(`'!'`, `'?'`, `'suor'`, `'raiva'`, `'estrelas'`, `'coracao'`, `'ideia'`, `'zzz'`, `'nojo'`) · `linhas(t0, t1)` (linhas de velocidade) ·
`circulo(t0, t1, ancora)` (círculo vermelho + seta) · `conquista('NOME', t)` (aviso de peça nova) · `manchete('E SE...?', t0, t1)` ·
`impacto('PÁ!', t0, t1, ancora)` · `transicao(t, 'cortina'|'pixel'|'circulo'|'flash'|'risco', dur)` · `tempoLento(t, t0, t1, fator)` /
`tempoLentoVarios(t, janelas, fator)` (câmera lenta) · `alcancar(boneco, braco, ponto, k)` (mão chega num ponto) · `estrutura()`.
No update: `efeitosCamera(t)` no começo e `aplicarPiscadas(t)` no fim. No `iniciar`: `desenhar: (t) => desenharEfeitos(t)`.
Mais: `passos(B)` (um passo por "Esse é", inclusive dois nomes na mesma linha) · `tempoHistoria(t, B)` (tempo da história: no ◀◀ as
animações andam pra trás de verdade — use `tt` nos objetos e no boneco, e `t` na câmera e nas piscadas) · `chuva({ area, qtd, vento })`
(chame `ch.userData.atualizar(t, força)`) · `noite(k, L)` (0 = dia, 1 = noite; `L` = o que `E.preparar()` devolveu) · `brilho(cor, tamanho)`
(bola de luz: lâmpada acesa, LED, faísca) · `feixe(comprimento, abertura, cor)` (luz de lanterna/farol, sai pra +z).
Detalhes que pegam: `piscar()` dá à peça **cópias** dos materiais — depois dele, mude cor/brilho por `mesh.material` (fora da piscada vale);
`emote(..., { dx, dy })` muda a posição (padrão: em cima da cabeça); `label(..., { dx, dy })` desloca o letreiro; o balão `fala()` some se a
cabeça do boneco estiver fora do quadro.
Este estilo usa como ASSINATURA: câmera deslizando de lado, `transicao(t, 'cortina')` entre cenas e emotes planos (`'ideia'`, `'suor'`). Os outros também funcionam, mas use com moderação pra não misturar estilos.

## O que vale do `sistema/instrucoes/04_cena_3d.md`
Valem pra todos os estilos: o princípio do tempo (tudo é função de `t`), âncoras, mostrar o problema e depois a solução, letreiros e legenda,
o final, desempenho e o checklist de entrega. As partes de boneco (`B.buildPerson`), cenário (`buildWorld`/`buildRoom`), luzes e a referência
rápida do motor antigo são do estilo Padrão — neste estilo use as funções `E.*` deste guia no lugar delas.

## Letreiros, plaquinhas e legenda
Já vêm no visual do estilo (estilo.json): use `label('NOME', t0, t1, ancora)` pro nome da peça, `chip('TEXTO', t0, t1, ancora, cor)` pra
informação curta (medida, temperatura, "NÃO QUEIMA"), `banner('TEXTO', t0, t1)` pra faixa no topo. Não escreva fonte nem cor de letreiro na cena.
`configurarLegendas({ destaque: ['parabens'], nomes: [...] })` deixa os nomes das peças em destaque na legenda quando são nomeados.

## Sons que combinam
`whoosh_suave` (peça entra), `ding` (nome), `confused` (problema), `slide`, `pop`, `tada` + `cheer` (final), `rewind`. Ambiente: `birds`, cidade.
(Lista completa: `biblioteca/efeitos/efeitos.md` ou `Biblioteca de Sons.html`.)

## Cuidados
- Não use `orb` neste estilo (a câmera ficaria torta): use `E.tomada`.
- Tudo na frente do boneco precisa de `z` maior que 0,06; atrás, `z` negativo. Cenário de fundo: z entre -0,5 e -2; horizonte: -30.
- Não deixe formas com exatamente o mesmo `z` se sobrepondo (pisca). Some 0,001.
- Pra o boneco andar: `andar: 1` no animar e mova `ze.position.x`; virar: `ze.scale.x = -1`.
- **Ordem na frente/atrás do boneco:** braço de trás z ≈ -0,04, corpo 0, braço da frente ≈ 0,04. Objeto que o boneco SEGURA (cabo, alça):
  z entre 0,02 e 0,04 (a mão fica na frente dele). Objeto inteiro na frente do boneco: z > 0,06.
- **Forma que muda (pano murchando, papel rasgando, balão enchendo):** troque entre 2–4 versões prontas da forma (visible), ou escale/gire partes.
  Se precisar mesmo deformar, refaça a geometria só quando a forma muda (não em todo quadro).
- **Clima:** `E.horizonte({ clima: 'sol' | 'nublado' | 'noite' })` + `E.ceuDoEstilo('sol' | 'nublado' | 'noite')`; chuva: `chuva({ area: [x0, x1, y0, y1, 0.1, 0.3] })`
  (no 2D a chuva fica num z na frente de tudo). `E.sala({ porta: x })` desenha uma porta na parede.
- `E.tomada(..., { lado: 1 | -1 })` = pra que lado a câmera desliza devagar durante a tomada.
- Rode `conferir.py` depois de cada mudança e peça a folha de revisão na primeira entrega.

## Imagens de referência
`personagem.jpg` (o boneco modelo) e `cena.jpg` (uma cena com a edição do estilo), nesta mesma pasta.
