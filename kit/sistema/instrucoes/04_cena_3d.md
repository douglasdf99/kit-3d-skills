# 04: Cena 3D (o que aparece na tela)

> **Primeiro de tudo: leia o `GUIA.md` do estilo do vídeo** (`biblioteca/estilos/<estilo>/GUIA.md`). Cada estilo tem o seu boneco, os
> seus cenários, as suas peças e o seu **modelo de edição**. A cena de partida do vídeo (`cena/cena.js`, copiada do `cena_modelo.js` do estilo)
> já funciona do começo ao fim: troque o cenário, as peças e as ações pelo conteúdo do vídeo.
> Nos estilos novos use `E.boneco()`, `E.animar()` e as peças/cenários `E.*` do estilo (não `B.buildPerson`/`B.buildWorld`, que são do Padrão).
> Este arquivo traz as regras gerais da série (valem pra todos) e a referência do motor.

A cena é um arquivo JavaScript (`Meus Videos/<x>/cena/cena.js`) que usa o motor do kit (`sistema/motor/`) e three.js.
**Antes de escrever a primeira cena, leia o gabarito inteiro:** `Exemplo - Lampada/cena/cena.js` (vídeo real da série).
O fim deste arquivo explica o gabarito fala por fala.

---

## 1. O princípio mais importante: tudo é função do tempo
O render chama `composeFrame(t)` pra qualquer segundo `t`, em qualquer ordem (a prévia pula pra frente e pra trás).
Por isso:
- **Crie todos os objetos uma vez** (no corpo do arquivo). No `update(t)` só mude posição, rotação, escala, cor,
  opacidade e `visible`. **Nunca** crie geometria/material/objeto dentro do `update`.
- **Nada de "estado" entre quadros** (contadores, física acumulada, `x += velocidade`). Calcule tudo a partir de `t`:
  `const k = prog(t, A.poe, 0.8)` (0→1), `obj.position.lerpVectors(DE, ATE, k)`.
- Aleatório só com `hash(n)` (sempre dá o mesmo resultado pro mesmo `n`), nunca `Math.random()`.

## 2. Esqueleto de toda cena (na ordem)
1. `import` do motor (copie do modelo ou do gabarito; os caminhos são relativos: `../../../sistema/motor/...` pra quem está em `Meus Videos/<x>/cena/`).
2. **Âncoras** `const A = { … }`: o segundo de cada momento da narração, com `T('trecho')`.
   Momentos derivados: `A.voa0 = A.agora - 0.25`. `const DURATION = A.end + 0.3` (com `end: FIM_NARRACAO`).
3. Céu e luzes.
4. Cenário (mundo/casa/sala), boneco, objetos.
5. **Tomadas de câmera** (`orb(...)`), uma por momento, e no fim `fecharCameras({...})`.
6. Letreiros, plaquinhas, chamada final e `configurarLegendas({...})`.
7. Desenhos 2D extras (`function desenhar(t)`), se houver.
8. `function update(t) { … }`: a animação.
9. Efeitos sonoros: `som(...)` e `ambiente(...)` (veja `05_audio.md`).
10. `iniciar({ duracao: DURATION, ancoras: A, update, desenhar, flash })`.

## 3. Âncoras (sincronizar com a voz)
- `T('esse e o filamento')` → segundo em que "esse" começa. Acentos e pontuação não importam.
- `T('trecho', 2)` → 2ª vez que o trecho aparece. `T('trecho', 1, true)` → fim da última palavra do trecho.
- Use trechos curtos e únicos (2 a 4 palavras). Se não existir, o `conferir.py` mostra o erro com palavras parecidas.
- Ação começa um pouquinho **antes** da palavra (0,1–0,3 s) pra parecer sincronizada: `prog(t, A.poe - 0.1, 0.6)`.
- Uma âncora por coisa que acontece. O gabarito tem ~100.

## 4. Câmera: regras da série
- **Nunca parada.** Cada tomada gira devagar em volta do alvo, chega um pouco mais perto e flutua. O motor já faz isso.
- **Sem corte seco.** A troca de tomada é um movimento suave de `dur` segundos (0,6 a 1,2).
  `dur = 0` só em momento especial, como "voltar a fita" depois de mostrar um erro.
- **Uma tomada nova por ideia** (a cada 2 a 4 s, mais ou menos), mostrando exatamente o que a narração está falando.
- **Tela dividida só se for indispensável.**
- `orb(t, alvo, giroGraus, alturaGraus, distancia, fov = 40, dur = 1.0, drift = 0.07, { spin, bob, livre })`
  - `alvo`: ponto pra onde a câmera olha (`V(x, y, z)`, em metros).
  - `giroGraus`: 0 = câmera na frente (lado +z) olhando pra trás; positivo = câmera vai pra direita (+x).
  - `alturaGraus`: positivo = câmera acima do alvo olhando pra baixo.
  - `distancia`: em metros. Referência: peça pequena de perto 0,3–0,8; objeto numa mesa 1–1,8; boneco de corpo inteiro 2,6–3,6; sala inteira 4,5–6; casa de fora 8–10.
  - `fov`: 40 normal; 44–56 pra planos abertos.
  - `spin` (opcional): velocidade do giro (padrão ±0,045, alternando o lado sozinho). Final: `{ spin: -0.07, bob: 0.5 }`.
- `shotAt(t, posicao, alvo, fov, dur)`: quando você quer a câmera num ponto exato.
- Depois de todas as tomadas: `fecharCameras({ duracao: DURATION, aberturaAte: <fim da 1ª fala>, finalDesde: A.parabens - 1 })`.
- O alvo tem que estar **no meio do que importa** e nada pode ficar na frente (parede, objeto). Câmera dentro de parede
  = tela de uma cor só. Na dúvida, afaste e suba um pouco.
- Lembre que a tela é **vertical e estreita** (9:16): na horizontal cabe pouca coisa. Se duas coisas precisam aparecer
  juntas lado a lado, afaste a câmera ou gire pra elas ficarem uma atrás da outra.
- O `conferir.py` confere o enquadramento sem ver a imagem e avisa: letreiro que não aparece (o ponto dele está fora da
  tela), letreiro empurrado pra longe da peça, letreiro em cima da legenda, objeto na frente do que a câmera mira e close
  exagerado no rosto do boneco. **Trate todos esses avisos antes de entregar.**

## 5. O boneco
```js
const person = B.buildPerson({ standing: true, look: LOOK });   // LOOK = visual do estilo escolhido (não invente cores)
person.position.set(0.55, 0.04, -1.5); person.rotation.y = -0.35; scene.add(person);
```
- **Em pé** (`standing: true`): ~1,75 m de altura, cabeça entre 1,35 e 1,73 m (centro ~1,55 m), ~0,66 m de largura.
  **Sentado** (`standing: false`, pra poltrona/cadeira/banco de carro): ~1,40 m, cabeça ~1,2 m.
  `rotation.y = 0` olha pra +z (pra câmera na posição padrão). Os pés ficam em y = 0 (use `position.y = 0.04` sobre o piso).
- Enquadramento: corpo inteiro em pé ≈ distância 3–3,6 com alvo em y≈0,9; do peito pra cima ≈ 1,2–1,6 com alvo na cabeça.
  **Não chegue mais perto que isso do rosto** (o `conferir.py` avisa "close exagerado").
- **Expressões só pelo `updatePerson`** (os olhos e a boca são os da série, não invente outros):
  `B.updatePerson(person, t, { mood, sweat, fan, shiver, remote })`
  - `mood`: -1 triste … 0 neutro … 1 feliz · `sweat`: 0–1 suando (calor) · `fan`: 0–1 se abanando ·
    `shiver`: 0–1 tremendo de frio · `remote`: 0–1 segurando controle.
  - As poses de braço `fan`, `remote` e `shiver` foram feitas pro boneco **sentado**. Em pé, faça a pose com `armIK` ou girando `arms[i].sh` / `arms[i].el`.
- Partes: `person.userData` → `headP` (cabeça: `rotation.y` vira o rosto), `torso`, `body`,
  `arms[0|1]` = `{ sh, el, handP, sx }` (ombro, cotovelo, mão; `sx` = lado -1/+1), `legs[i]` = `{ hip, sx }`.
- **Comemorar** (sucesso, e sempre no "Parabéns"): braços em V e pulinhos. O código está no modelo e no gabarito (`celebrate`).
- **Triste** (quando algo dá errado): `mood` negativo, cabeça inclinada, braços caídos (gabarito: `sad`).
- **Alcançar/pegar algo:** `armIK(person, person.userData.arms[1], pontoNoMundo, k, pole)`. Carregar objeto: anime
  a posição do objeto até a mão, ou prenda com `arm.handP.add(objeto)`.
- **Andar:** veja `personPose(t)` no gabarito (curva de caminho + balanço de pernas e braços).
- Se o boneco usar **boné ou capacete, esconda o topete/cabelo** que ficaria aparecendo por cima.
- O boneco reage ao que acontece: comemora quando funciona, fica triste quando falha, sua no calor, queima a mão…
  É o que dá vida ao vídeo.

## 6. Cenário
- **Casa em corte com quintal** (padrão do modelo): `B.buildWorld()` + `B.buildRoom({ x0, x1, z0, z1, h, t })`.
  As cores e formas (grama, cerca, árvores, piso, fachada) vêm do estilo. Pra trocar só neste vídeo:
  `B.setTema({ piso: 'lajota', cerca: 'ferro', ... })` **antes** de construir. Opções em `sistema/motor/modelos_base.js` (`TH`).
- **Fundo:** `ceu()` sem nada = o céu do estilo escolhido (dia claro no Padrão). Clima próprio: `ceu('#topo', '#base', '#meio')`;
  noite: `ceu('#0b1424', '#1a2740')` (gabarito). Estilos com céu fixo (Neon, Projeto, Caderno…) passam por cima do que a cena pedir.
- **Luzes (dia):** `const { hemi, sol, contra } = luzes();` (modelo) — céu + sol com sombra + contraluz, nas cores do estilo.
  Pra mudar algo só nesta cena: `luzes({ sol: ['#ffffff', 1.4, [-4, 9, 6]] })`.
  **Noite/interior:** veja o gabarito (luz da lua + `PointLight` que acende com o objeto).
- Ambientes próprios (oficina, cozinha, rua, obra, fundo do mar…) também valem: monte com caixas e cilindros low-poly.
  Mantenha o visual: cores vivas, `flatShading`, formas simples e arredondadas, nada fotorrealista.

## 7. Objetos e efeitos visuais
- Peças com os ajudantes de `lib.js`: `box`, `rbox` (caixa arredondada), `cyl`, `sph`, `cap` (cápsula), `at(obj, x, y, z)`,
  `group(...)`, `mat(cor, {metalness, roughness, opacity, emissive...})`, `basic(cor)` (sem luz), `mesh(geo, mat)`.
- Vidro/transparente: material com `transparent: true, opacity` baixo. O gabarito tem `glassMat()` em `modelos.js`.
- Brilho/luz: `THREE.Sprite` com textura de brilho (`glowTexture()` no gabarito) + `PointLight`.
- Muitas partículas (ar, água, moléculas, faíscas, corrente elétrica): `InstancedMesh`. Copie `inst/setInst/finishInst` do gabarito
  (o `inst` do gabarito já deixa todas as partículas brancas = cor do material; passe a cor no `setInst` se quiser outra).
- Fluxo dentro de cano: `new Pipe({ points, ... })` (lib.js): `reveal(f)` desenha o cano, `flow(...)` anima bolinhas.
- Tela/visor com texto: `canvasPlane(w, h, pxW, pxH)` (plano com um canvas 2D que você desenha).
- **Pode copiar funções do gabarito** pro seu `cena/modelos.js` (não importe da pasta do exemplo).
- Peças entram **voando e encaixando** (`prog` com `ease.out`/`ease.back`) com som (whoosh + click),
  e somem diminuindo ou saindo de cena. Nada aparece "do nada" sem animação.

## 8. Mostrar o problema e depois a solução (o coração do formato)
1. A tentativa: o objeto incompleto funciona mal **na tela** (o fio queima, o gelo derrete, a água vaza). Boneco triste.
   Plaquinha vermelha explicando ("QUEIMA", "50 °C", "VAZOU").
2. Quando faz sentido, **volta a fita**: tomada com `dur = 0` e o estado de antes, mais o som `record_scratch` ou `rewind`.
3. A solução entra (voando/encaixando, com som). O problema não acontece mais. Plaquinha verde ("NÃO QUEIMA").
4. "Esse é o X": **letreiro grande** com o nome, preso na peça, por ~1,5 s.
5. Curiosidade ("por isso…"): mostre o exemplo prático (no gabarito: lâmpada aberta, argônio escapa, fio queima, "TEM QUE COMPRAR OUTRA").

## 9. Letreiros, plaquinhas e chamada
```js
label('FILAMENTO', A.filamento, A.filamento + 1.6, () => FILC.clone(), { dy: -90 });       // nome da peça (na hora do "Esse é o")
chip('3400 °C', A.tresMil - 0.05, A.tungstenio - 0.1, () => FIRE_C.clone().add(V(0, 0.36, 0)), '#ff3b2f', { dy: -60 });
chip('PRESO', t0, t1, wpos(objeto, V(0, 0.1, 0)), '#6b7280');                                // preso num objeto que se mexe
banner('COMENTE “LUZ”', A.comente + 0.05, DURATION + 1, { screen: [W / 2, 330], size: 92, rot: -0.06, semPop: true });
```
- `label` = nome de peça (letreiro grande, com "pop" e som automáticos). **Só na hora do "Esse é o/Essa é a".**
- `chip` = informação curta (números, estados). Cores: vermelho `#ff3b2f` problema/calor/perigo · azul `#2f8cff` frio/info ·
  verde `#22b35e` resolvido · amarelo `#d9a400` atenção · cinza `#6b7280` neutro · roxo `#8b5cf6` gases.
- Texto em MAIÚSCULAS, curto (1 a 4 palavras). No máximo 2 na tela ao mesmo tempo.
- `dy` sobe (negativo) ou desce o texto em pixels em relação ao ponto. Não tampe o rosto do boneco nem a ação principal.
  A legenda fica em y≈1330 (estilo Padrão): não ponha nada importante ali.
- Opções: `size` (tamanho), `screen: [x, y]` (posição fixa na tela), `fill` (cor do letreiro), `semPop: true`.
- A fonte, as cores e o formato vêm do estilo. **Não escreva fonte/cor de letreiro na cena.** Em desenhos extras use `FT` (fonte do estilo).

## 10. Legenda
```js
configurarLegendas({ destaque: ['parabens'], nomes: ['tungstenio', 'filamento', 'argonio'], linhas: { lampada: -2, luz: -1 } });
```
- `nomes`: nomes de peça. Ficam em destaque só quando estão sendo nomeados ("é o filamento").
- `linhas`: palavra em destaque só numa linha (-2 = penúltima, a do "Parabéns"; -1 = a chamada).

## 11. Desenhos extras por cima do 3D (termômetros, gráficos, balões)
Use `function desenhar(t)` com o canvas 2D `g2` (1080×1920). `project(V(x,y,z))` dá a posição na tela de um ponto 3D.
Exemplos no gabarito: `drawThermo` (termômetro que sobe e estoura), `drawEnergyBar` (barra 95% calor / 5% luz),
`drawMetalsGrid` (tela cheia com metais derretendo), `drawBalloon` (balão de fala de um objeto).
Faça entrar com `pop(t, t0, t1)` e sair encolhendo. Fonte: `` g2.font = `900 60px ${FT}` ``.

## 12. A voz do boneco
O boneco não fala com a voz do narrador. Use balão + som de voz de boneco:
```js
fala('UHUL!', A.uhul - 0.05, A.uhul + 1.2, person);          som('uhul', A.uhul, -1);
fala('Aaah...', A.aah - 0.05, A.aah + 1.3, person, { triste: true });   som('aah', A.aah, -2);
```
Sons de voz prontos: categoria "Vozes do boneco" em `biblioteca/efeitos/efeitos.md` (uhul, aah, wow, ouch, gasp, doll_oba, doll_hmm…).

## 13. O final (igual em todo vídeo)
1. "Coloque X, Y e Z": as últimas peças entram rapidinho, uma depois da outra, cada uma com som.
2. O objeto completo **funciona** (acende, liga, gira) e o boneco usa ou aciona o objeto.
3. "Parabéns!": câmera abre e gira devagar em volta (`{ spin: -0.07, bob: 0.5 }`), boneco comemorando,
   `label('NOME DO OBJETO', A.construiu + 0.3, A.comente - 0.15, …)`, `som('tada', A.parabens - 0.06, -4)`.
4. Chamada: `banner('COMENTE “PALAVRA”', …, { semPop: true })` + `som('pop2', A.comente, -14)`.
5. A assinatura com o nome do canal entra sozinha no último segundo.

## 14. Desempenho (o vídeo tem que rodar em computador comum)
- Uma luz com sombra (`castShadow`) só. Sombra em objetos pequenos dentro de close: desligue (`mesh(geo, m, false, false)`).
- Reaproveite geometrias e materiais (`mat()` já guarda em cache). Muitas cópias iguais: `InstancedMesh`.
- Objeto que não aparece mais: `visible = false` (não renderiza).
- Evite mais de ~200 mil triângulos visíveis. Esferas com poucos segmentos (estilo low-poly ajuda).

## 15. Antes de entregar (checklist)
- [ ] `conferir.py` deu OK e você tratou os avisos de enquadramento.
- [ ] Toda fala tem uma imagem; o problema aparece antes da solução.
- [ ] Toda peça tem letreiro na hora do "Esse é o"; plaquinhas legíveis e sem tampar o principal.
- [ ] Câmera sempre se mexendo; uma tomada nova a cada 2–4 s; sem corte seco (exceto voltar a fita).
- [ ] Boneco aparece e reage; comemora no Parabéns; sem cores inventadas (usa `LOOK`).
- [ ] Cada ação tem som (veja `05_audio.md`).
- [ ] Final completo: objeto funcionando, Parabéns, nome do objeto, chamada.
- [ ] Pediu a **folha de revisão** à pessoa e conferiu enquadramentos.

---

## 16. Referência rápida do motor

**`sistema/motor/video.js`**
| Nome | O que é |
|---|---|
| `T(trecho, ocorr, fim)`, `words`, `TL`, `FIM_NARRACAO` | tempos da narração |
| `scene`, `camera`, `renderer`, `sky`, `ceu()`, `luzes()` | cena three.js, câmera, fundo, luzes do estilo |
| `V(x,y,z)` | atalho pra `new THREE.Vector3` |
| `LOOK` | visual do boneco do estilo (passe em `buildPerson`) |
| `ESTILO`, `CANAL`, `FT`, `FP`, `fonte(peso, px)` | estilo atual, canal, fontes |
| `orb`, `shotAt`, `fecharCameras`, `cameraAt` | câmera |
| `label`, `chip`, `banner`, `wpos`, `project` | letreiros e posição na tela |
| `configurarLegendas` | legenda |
| `fala` | balão de fala do boneco |
| `armIK(person, arm, alvo, k, pole)`, `lerpAng` | braço que alcança; ângulo suave |
| `som`, `ambiente` | efeitos sonoros |
| `g2`, `W`, `H`, `vinheta`, `clarao` | canvas 2D por cima (1080×1920) |
| `iniciar({...})` | liga tudo (sempre a última linha) |

**`sistema/motor/lib.js`**: `clamp`, `lerp`, `ease.{lin,in,out,inOut,inOut2,back,bounce}`, `prog(t, t0, dur, ease)` (0→1),
`win(t, t0, t1, subida, descida)` (sobe e desce), `pop(t, t0, t1)` (escala com "pulo"), `hash(n)`, `fract`,
`mat`, `basic`, `mesh`, `box`, `rbox`, `cyl`, `sph`, `cap`, `at`, `group`, `roundedPath`, `Sampled`, `Pipe`, `canvasPlane`, `mixColor`.

**`sistema/motor/modelos_base.js`** (`import * as B`): `buildWorld()` (quintal, cerca, árvores, nuvens, sol) ·
`buildRoom(R)` (sala em corte com janela, telhado) · `buildPerson(opts)` / `updatePerson(P, t, estado)` · `setTema(o)` / `TH` ·
`skyTexture()` · objetos prontos: `buildClock`, `buildThermo`, `buildArmchair`, `buildFan`/`spinFan`, `buildBucket`/`updateBucket`,
`buildTank`/`updateTank`, `buildCoil`, `buildHelix`, `buildCompressor`, `buildPropeller`/`spinProp`, `buildValve`,
`buildBikePump`/`updateBikePump`, `buildPressureCooker`/`updatePressureCooker`, `buildSpray`/`updateSpray`,
`buildGlass`/`updateGlass`, `buildRemote`, `buildIndoorCover`/`drawIndoorDisplay`, `buildOutdoorCabinet`,
`buildSensor`/`drawSensor`, `buildGauge`/`drawGauge`. Abra o arquivo pra ver os parâmetros de cada um.

---

## 17. O gabarito fala por fala (`Exemplo - Lampada/cena/cena.js`)

| Fala | O que aparece | Como é feito |
|---|---|---|
| "Se você encosta uma pilha… palha de aço… iluminam o quarto" | quarto à noite; a pilha desliza até a palha, faíscas, a palha brilha e ilumina o quarto; boneco comemora ("UHUL!") | `battery`, `wool` + `M.updateSteelWool`; `woolLight` acende; `celebrate`; `fala('UHUL!')` + `som('uhul')` |
| "Só que a luz é fraquinha… reagem com o oxigênio… cinza" | a luz enfraquece, boneco triste ("Aaah..."); close nos fios: bolinhas de oxigênio batem e o fio vira cinza | `sad`; partículas `o2` (InstancedMesh); plaquinhas FRAQUINHA, OXIGÊNIO |
| "Então você põe o fio dentro de um bulbo… tira todo o ar" | o fio voa pros suportes; o vidro desce; a bomba puxa o ar pela mangueira | `filament`, `bulb`, `pump`, `hose`; `ambiente('pump')` |
| "Agora o fio brilha… não queima… Esse é o vácuo" | o fio acende e não queima; brilho azulado dentro do bulbo; letreiro VÁCUO | `filamentState`; `vacFill` (shader); `label('VÁCUO')`; chips NÃO QUEIMA / SEM OXIGÊNIO |
| "Só que a luz continua fraca… dois mil graus… quase todo metal derreteu" | termômetro na tela sobe e estoura; tela cheia com 9 metais derretendo no fogo | `drawThermo`, `drawMetalsGrid` (2D) + sons rise/boom/shatter/melt |
| "Então você usa o metal que mais aguenta… Esse é o tungstênio… é o filamento" | bloco de metal no fogo zomba ("Você chama isso de esquentar?"); voa pro bulbo e vira o filamento | `tungBlock`, chamas (sprites), `drawBalloon`; `label('TUNGSTÊNIO')`, `label('FILAMENTO')` |
| "Mas… evaporando… gruda no vidro… afina até arrebentar" | átomos saem do fio e grudam no vidro, que escurece; o fio afina e arrebenta | partículas `watoms`/`stuck`; chips EVAPORA, GRUDA NO VIDRO, FIO FINO; `som('snap')` |
| "Então você enche o bulbo com um gás… argônio… Por isso, se você abrir… já era" | gás roxo enche o bulbo e empurra os átomos de volta; depois a lâmpada abre, o gás escapa, o oxigênio entra e o fio queima | `argon`; `label('ARGÔNIO')`; chips; **volta a fita** (`orb(A.masGas, …, 0)`) pra lâmpada inteira de novo |
| "Mas o gás rouba calor… enrola o fio numa molinha…" | o fio vira mola, e a mola vira mola de novo; demonstração: 50 cm de fio cabem em 2 cm | `setFilament(k1, k2)`; `demoWire`; chips MOLINHA, 50 cm DE FIO, CABE EM 2 cm |
| "Mas noventa e cinco por cento… calor… lâmpada velha queima a mão" | barra de energia 95% calor / 5% luz; lâmpada velha aparece e o boneco queima a mão ("AI!") | `drawEnergyBar`; `oldLamp`; `armIK` alcança, recua; `som('ouch')` |
| "Então você… chip de cristal… LED… pó amarelo… azul com amarelo vira branco" | o vidro sobe, o filamento sai, a placa de LEDs entra; luz azul; pó amarelo cobre; luz branca | `led`, raios (`rays`, `wRays`); `label('LED')`, `label('GOTINHA AMARELA')`; `banner('AZUL + AMARELO = BRANCO')` |
| "Coloque uma rosca… um pino… um bulbo leitoso… enroscar no bocal… acender" | rosca gira e encaixa, pino, vidro leitoso; o boneco leva a lâmpada ao bocal, enrosca, anda até o interruptor e acende | `screw`, `lampTransform`, `personPose` (andar), `armIK` (mãos na lâmpada, apertar o interruptor); corrente nos conduítes |
| "Parabéns! Você construiu uma lâmpada." | sala acesa, câmera gira em volta, boneco comemora; letreiro LÂMPADA | última `orb` com `{ spin: -0.07 }`; `label('LÂMPADA')`; `som('tada')` |
| "Comente “luz” se você não sabia dessa!" | faixa COMENTE “LUZ”; nome do canal no fim | `banner(... semPop)`; assinatura automática |
