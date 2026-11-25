# Estilo «Brinquedo» — guia do Claude (o modelo de edição)

Leia este guia inteiro antes de montar a cena de um vídeo neste estilo. Ele diz como o estilo **se parece** e como ele **é editado**,
e quais peças prontas existem. A cena de partida (`cena_modelo.js`, que o `novo_video.py` copia pro vídeo) já funciona do começo ao
fim — use como base e troque o conteúdo.

> **Exemplo pronto neste estilo:** `Exemplos/brinquedo/` é uma demo de 10 s (trilho de trem: terra → dormentes) com a cena inteira em `cena/cena.js`. Leia junto com este guia: ela mostra o erro acontecendo, a volta da fita, a peça entrando e o "Esse é" com tudo do estilo (câmera, letreiros, efeitos e sons). O vídeo dela é o `demo.mp4` desta pasta.

Na cena: `import * as E from '../../../biblioteca/estilos/brinquedo/estilo.js';` e, logo no começo, `E.preparar();`

## O visual
- **Bonequinhos de plástico**: cabeçudos, olhos grandes brilhantes, tudo liso e com brilho (verniz). Peças arredondadas.
- **Cenário mais realista**: terra com pedrinhas, plantas (agave), cerca de arame, trilho, morros e árvores ao longe, luz de sol macia.
- **Sensação de miniatura bem filmada**: sombras macias, câmera de cinema, câmera lenta nos erros.
- **Letreiro**: branco grosso com contorno escuro. **Legenda**: branca com contorno (como legenda de vídeo de canal grande).

## O boneco modelo
`const ze = E.boneco(look)` — sempre camisa branca, calça azul-escura e cabelo preto, a não ser que a pessoa peça outro visual.
`look` aceita: `camisa`, `calca`, `cabelo`, `pele`, `sapato`, `capacete` (cor), `colete` (cor, com faixas refletivas), `oculos` (cor).
A cada quadro: `E.animar(ze, t, { humor, fala, andar, passo, pose, poseK, olhar })`
- `humor` -1 (triste/bravo) … 1 (feliz) — muda boca e sobrancelha · `fala` 0..1 mexe a boca (só pros sons de voz do boneco)
- `andar` 0..1 = ciclo de caminhada (mova `ze.position` junto) · `olhar` -1..1 vira a cabeça
- `pose`: `'comemora'` · `'aponta'` · `'segura'` · `'pensa'` · `'susto'` · `'tchau'` — `poseK` 0..1 mistura (use `win(...)` pra entrar e sair)
- mão até um ponto: `alcancar(ze, ze.userData.arms[1], V(x, y, z), k)` (`arms[0]` e `arms[1]` são os dois braços)
- vários bonecos: chame `E.boneco()` de novo (pode mudar `look`); cada um precisa do seu `E.animar`.

## Peças pra montar o objeto do vídeo
`E.caixa(w, h, d, cor, { r })` (caixa arredondada) · `E.cilindro(r, h, cor, { rTopo })` · `E.esfera(r, cor)` · `E.capsula(r, h, cor)` · `E.toro(r, tubo, cor, { arco })` · `E.cone(r, h, cor)`
· `E.material(cor, { brilho, fosco, metal, rugosidade, opacity })` (plástico brilhante; `fosco: true` pra terra/tecido/madeira; `metal` pra aço) · `E.grupo` · `E.em`.
Arredonde tudo (raio nas caixas) e prefira cores de brinquedo. Vidro: `opacity: 0.5`. Metal: `metal: 0.7, rugosidade: 0.35`.

## Cenários prontos
`E.chao({ cor, repetir })` (terra com pedrinhas) · `E.pedras(n, [x0, x1, z0, z1])` · `E.agave({ tam })` · `E.cerca(x0, x1, z)` · `E.arvore({ tam })` · `E.morros()`
· `E.trilho(x0, x1, z)` · `E.sala({ x0, x1, z0, z1, h, parede })`.

## Câmera
`orb` normal, como câmera de cinema: aproximações lentas (`drift` maior), giros suaves em volta do boneco.
PERTO 1,6–2,2 · MÉDIO 3–3,8 · LONGE 4,5–6 (o "Esse é" e o Parabéns). Nos erros, câmera lenta: `tempoLentoVarios(t, janelas, 0.4)` no tempo das animações.

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
| Problema ("Mas…/Só que…") | o problema ACONTECE na tela, o boneco sente | tremer/quebrar/vazar o objeto, câmera lenta (`tempoLentoVarios`) + `tremor(...)` + `emote('suor', ...)` |
| Volta a fita | ◀◀ e tudo volta ao estado de antes | `rebobinar(t, 0.7)` + `som('rewind', t, -8)` + tomada nova com `dur = 0` logo depois |
| "Então você…" | a peça nova entra (voando, encaixando, crescendo) | `pop(t, ...)` na escala, `pose: 'segura'`, som de entrada; câmera PERTO da peça |
| "Esse é o X" | a peça PISCA 2× em amarelo + letreiro com o nome | `piscar(peca, t)` + `label('X', t, t + 1.6, ...)` + `zoomSoco(t, 0.06)` suave + som `sparkle`; câmera LONGE (objeto inteiro) |
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
Este estilo usa como ASSINATURA: câmera lenta nos erros, tremor leve nos impactos, zoom suave no nome, transição `'flash'`. Os outros também funcionam, mas use com moderação pra não misturar estilos.

## O que vale do `sistema/instrucoes/04_cena_3d.md`
Valem pra todos os estilos: o princípio do tempo (tudo é função de `t`), âncoras, mostrar o problema e depois a solução, letreiros e legenda,
o final, desempenho e o checklist de entrega. As partes de boneco (`B.buildPerson`), cenário (`buildWorld`/`buildRoom`), luzes e a referência
rápida do motor antigo são do estilo Padrão — neste estilo use as funções `E.*` deste guia no lugar delas.

## Letreiros, plaquinhas e legenda
Já vêm no visual do estilo (estilo.json): use `label('NOME', t0, t1, ancora)` pro nome da peça, `chip('TEXTO', t0, t1, ancora, cor)` pra
informação curta (medida, temperatura, "NÃO QUEIMA"), `banner('TEXTO', t0, t1)` pra faixa no topo. Não escreva fonte nem cor de letreiro na cena.
`configurarLegendas({ destaque: ['parabens'], nomes: [...] })` deixa os nomes das peças em destaque na legenda quando são nomeados.

## Sons que combinam
`whoosh_suave`/`whoosh_cinema` (entra), `sparkle` (nome), `orquestra_impacto`/`boom` (erro), `tada` + `sparkle` (final), `rewind`. Ambiente: `birds`, vento.
(Lista completa: `biblioteca/efeitos/efeitos.md` ou `Biblioteca de Sons.html`.)

## Cuidados
- Capacete e colete (`look.capacete`, `look.colete`) são ótimos pra temas de obra — e mostram o trabalho seguro.
- Sombras macias são pesadas: evite dezenas de luzes extras. Uma luz pontual a mais já basta pra efeito.
- Rode `conferir.py` depois de cada mudança e peça a folha de revisão na primeira entrega.

## Imagens de referência
`personagem.jpg` (o boneco modelo) e `cena.jpg` (uma cena com a edição do estilo), nesta mesma pasta.
