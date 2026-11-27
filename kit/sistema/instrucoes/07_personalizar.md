# 07: Personalizar o kit (cada pessoa deixa do seu jeito)

Tudo o que vem no kit é o **padrão**. A pessoa pode mudar qualquer coisa, e você faz a mudança.
- Se for **só pra um vídeo**, mude no vídeo (cena ou `video.json`).
- Se for **pra sempre**, mude o padrão e **anote em `config/preferencias.md`** (data + a preferência em uma linha clara).
  Exemplos: "vídeos de no máximo 60 s", "chamada final: 'Segue pra mais!'", "sem assinatura no fim", "boneco sempre de capacete".
  Em toda conversa nova você lê esse arquivo primeiro, e ele vale mais que as instruções do kit.

## Canal, idioma, voz
- `config/canal.json`: `nome`, `idioma` (`pt`/`en`/`es`), `assinatura` (true/false), `voz_id` (use `vozes.py escolher`),
  `estilo`, `musica_padrao`, `velocidade` (1.0 = voz normal; 1.12 = padrão da série).

## Os estilos que já vêm no kit
`Estilos.html` mostra todos: no topo, uma tabela com 10 s de vídeo de cada estilo e o **peso** dele (o `"custo"` do `estilo.json`: nota de 0 a 100, créditos, tempo do Claude, render de 2 min e correções previstas); depois, cada um com **duas imagens**: o boneco modelo e uma cena com a edição do estilo. São **7 jeitos diferentes
de vídeo** — boneco, cenário e edição mudam juntos:
**Padrão** (o da série: low-poly, casa em corte) · **Ilustrado 2D** (desenho plano de lado) · **Quadradinhos** (tudo de blocos) ·
**Brinquedo** (bonequinho de plástico brilhante, cenário realista) · **Simples** (bem básico, estilo "E SE…?", multidão) ·
**Desenho** (desenho japonês com contorno preto) · **Avatar de jogo** (avatar de blocos, edição de meme).
Cada estilo é uma pasta `biblioteca/estilos/<nome>/` com:
- `estilo.json` — visual dos textos (letreiro, plaquinha, legenda, balão, assinatura), céu, luz e o resumo da edição (`edicao`);
- `estilo.js` — o boneco (`E.boneco`, `E.animar`), as peças pra montar objetos e os cenários prontos, no visual do estilo;
- `GUIA.md` — **o modelo de edição**: como montar cada momento do vídeo nesse estilo. Leia antes de montar a cena;
- `cena_modelo.js` — cena de partida que já funciona com qualquer roteiro (o `novo_video.py` copia pro vídeo);
- `personagem.jpg` e `cena.jpg` — as imagens da galeria.
Pra escolher: `"estilo": "<nome>"` em `config/canal.json` (todos os vídeos) ou no `video.json` (só um vídeo, ANTES de montar a cena —
a cena de um estilo não serve pra outro), e `estilos.py` pra marcar "em uso".
**Trocar o estilo de um vídeo que já tem cena** = refazer a cena a partir do `cena_modelo.js` do estilo novo (guarde a antiga em `versoes/`).

## Criar um estilo novo (a partir de uma imagem ou de uma descrição)
1. Olhe a referência (imagem que a pessoa mandou) ou pergunte: o boneco (proporção, rosto, material: plástico, desenho, blocos…),
   o lugar (cores, clima, dia/noite), os textos (tipo de letra, como são letreiros e legenda) e o jeito de editar (calmo, rápido, meme…).
2. Copie o estilo **mais parecido** inteiro: `biblioteca/estilos/<parecido>/` → `biblioteca/estilos/<nome-sem-acento>/`.
3. No `estilo.js` novo: troque `NOME`, as cores em `COR` e o que for preciso no `boneco()` (formas, rosto, cabelo) e nos cenários.
   Mantenha as funções com os mesmos nomes e parâmetros (`preparar`, `boneco`, `animar`, `pose`, peças, cenários): a cena de partida usa elas.
   Os caminhos de import continuam iguais (`../../../sistema/motor/...`).
4. No `estilo.json` novo: `nome`, `ordem` (posição na galeria), `descricao`, `edicao` (`resumo` + `transicao`, `rebobinar`, `emote`,
   `piscar`) e os textos (abaixo). Tudo é opcional: o que faltar vem do Padrão.
5. No `cena_modelo.js` novo: troque o import `biblioteca/estilos/<parecido>/` pelo nome novo. No `GUIA.md`: reescreva o que mudou.
6. Pra ver: `novo_video.py "Teste do estilo" --estilo <nome>`, escreva um roteiro curto e rode `rascunho.py` (narração grátis),
   rode `conferir.py` e `montar_pagina.py`, e peça pra pessoa abrir a página e tirar duas **📷 Fotos deste momento** (um quadro do boneco e um
   da cena com letreiro). Ajuste até ela gostar. Salve as fotos como `personagem.jpg` e `cena.jpg` na pasta do estilo e rode `estilos.py`.
   Se quiser, faça também uma demo de 10 s e salve o vídeo como `demo.mp4` na pasta do estilo, e ponha no
   `estilo.json` um `"custo"` estimado (compare com os estilos parecidos: `nota` 0–100, `creditos`, `tempo_claude`, `render_2min`, `correcoes`, `obs`),
   pra ele aparecer na tabela de comparação.
   Depois mova o vídeo de teste pra `_descartar/`.
7. Se for o estilo dela de agora em diante: `"estilo": "<nome>"` em `config/canal.json` + anote em `preferencias.md`.

**Textos do estilo (`estilo.json`)** — cores em `"#rrggbb"` ou `"rgba(r,g,b,a)"`:
- `letreiro` (o NOME DA PEÇA): `tipo` = `contorno` (grosso com contorno e sombra) | `neon` | `quadrinho` (contorno + sombra dura `sombraDura`) |
  `linha` (pílula `fundo` + linha `linhaCor` e `ponto` até a peça) | `fita` | `tecnico` | `pixel` (caixinha de jogo, `borda1`) | `jogo` (tarja
  translúcida de nome de jogo). Mais: `fonte`, `peso`, `cor`, `contorno`, `espessura`, `sombra`, `sombraX`, `sombraY`, `inclinacao` (0 = reto),
  `maiusculas`, `espacamento`, `escala`;
- `plaquinha`: `tipo` = `pilula_branca` | `escura` | `solida` | `neon` | `caixa` | `papel` | `contorno` | `pixel` | `jogo`; `fonte`, `peso`, `fundo`, `texto`, `borda`, `escala`, `cor`;
- `legenda`: `fonte`, `peso`, `tamanho`, `y`, `cor`, `destaque`, `contorno`, `espessura`, `sombra`, `sombraX`, `sombraY`, `sombraComContorno`,
  `maiusculas`, `espacamento`, `pulo`, `animacao` (`pulo` | `fade` | `sobe` | `maquina`), `brilho`, caixa atrás (`caixa`, `caixaPad`, `caixaAltura`,
  `caixaRaio`, `caixaBorda`, `caixaBordaCor`, `caixaInclinacao`, `caixaDestaque`);
- `fala` (balão), `assinatura` (nome do canal no fim), `vinheta`, `ceu` (`cores`, `sempre`, `padrao`), `luz`, `filtro3d`, `textura` (`grao` | `linhas` | `meio_tom` | `papel`).
Fontes disponíveis (`sistema/motor/fontes/fontes.json`): Montserrat, Fredoka, Baloo 2, Poppins, Nunito, Rubik, Luckiest Guy, Bebas Neue, Bangers,
Orbitron, JetBrains Mono, Permanent Marker, Pixelify Sans, Press Start 2P, Lilita One, Chewy.

**Fonte nova:** coloque o arquivo `.woff2` em `sistema/motor/fontes/` e adicione em `fontes.json`
(família → peso → arquivo). Fontes do Google Fonts têm versões `.woff2` no pacote npm `@fontsource/<nome>`
(`npm pack @fontsource/<nome>` baixa, se a internet do Claude permitir). Use só fontes de licença livre.

## O visual do boneco (em qualquer estilo)
O boneco modelo de todos os estilos é **camisa branca, calça azul-escura, cabelo preto**. Pra outro visual, passe as cores no
`E.boneco({...})` da cena — as chaves de cada estilo estão no `GUIA.md` dele (todos aceitam `camisa`, `calca`, `cabelo`, `pele`, `sapato`;
alguns têm mais: `oculos`, `bone`, `capacete`, `colete`, `penteado`, `solado`). Ex.: `E.boneco({ camisa: '#e63946', capacete: '#ffd21f' })`.
Se for pra sempre ("boneco sempre de boné vermelho"), anote em `preferencias.md` e use em todas as cenas.
Mais de um personagem: chame `E.boneco(...)` de novo com outras cores (cada um com o seu `E.animar`).
Uma peça que não existe (mochila, crachá): monte com as peças do estilo e prenda em `boneco.userData.headP` (cabeça) ou `boneco.userData.torso`.

## Música própria
1. A pessoa coloca o `.mp3` (sem direitos autorais, ou feito por ela/IA) em `biblioteca/musicas/`.
2. `python3 sistema/ferramentas/analisar_musica.py biblioteca/musicas/<arquivo>.mp3 "Título" "clima / pra que serve"`.
3. Ele avisa se a trilha tem silêncios no meio (ruim debaixo da voz) ou se não achou uma batida final.
4. Use com `"musica": "<id>"` no `video.json` (o id aparece na saída da ferramenta).
Trilhas novas podem ser criadas no site da ElevenLabs (Music). Peça: instrumental, sem pausas, ritmo constante,
uma batida final forte no fim, ~2min30.

## Efeitos sonoros próprios
- Arquivos `.mp3`/`.wav` jogados em `biblioteca/efeitos/novos/` já podem ser usados pelo nome do arquivo (sem a extensão).
- Ou crie com `efeito_novo.py` (já entra no catálogo).
- Um som só pra um vídeo: `Meus Videos/<x>/audio/efeitos/<nome>.mp3`. Esse tem prioridade sobre a biblioteca.

## Formato do roteiro, tamanho, chamada
Anote em `preferencias.md` e siga nos próximos roteiros. Ex.: "chamada: 'Salva esse vídeo e manda pra alguém!'",
"sempre começar com uma pergunta", "duração máxima 75 segundos", "sem o 'Parabéns'".

## Regras visuais
Câmera mais rápida, mais cortes, outra posição de legenda, outra cor de destaque, etc.: mude no vídeo ou no estilo, e anote.
O que é do estilo vai na pasta dele (`estilo.json` pros textos, `estilo.js` pro boneco e cenários, `GUIA.md` pro jeito de editar). O que é de "jeito de fazer" vai no `preferencias.md`.

## Atualizar o kit (quando a pessoa recebe uma versão nova do zip)
Nunca descompacte por cima do kit que está em uso: ali estão a configuração e os vídeos da pessoa.
1. Descompacte o zip novo numa pasta ao lado, `Desmontando o Video - Kit (novo)` (descompacte numa pasta temporária e renomeie).
2. Copie do kit antigo pro novo: `config/` inteira (canal, chave, preferências, amostras de voz), `Meus Videos/`, e o que a pessoa
   criou: estilos novos em `biblioteca/estilos/`, trilhas e efeitos novos (confira em `preferencias.md` o que foi criado).
3. No kit novo, rode `painel.py`, `estilos.py` e `sons.py` e confira com `verificar.py`.
4. Renomeie o antigo pra `Desmontando o Video - Kit (antigo)` e o novo pra `Desmontando o Video - Kit`.
   Diga à pessoa que o antigo pode ser apagado depois que ela conferir que está tudo lá.
