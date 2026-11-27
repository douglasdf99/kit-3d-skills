# 02b: Outros tipos de vídeo (além do "você constrói")

O formato da série (`02_roteiro.md`: problema → "Então você…" → "Esse é o…" → "Parabéns!") é só o **ponto de partida**.
A pessoa pode e deve criar vídeos com a cara dela: histórias, curiosidades, listas, humor, terror. O kit inteiro funciona
com qualquer formato: os 7 estilos, a narração, a legenda palavra por palavra, os efeitos, a trilha e o render.

Quando a pessoa disser o que quer fazer, **não empurre o formato da série**. Se ela não souber, mostre a lista abaixo
em uma mensagem curta (nome + uma frase de cada) e deixe ela escolher. Se virar o formato fixo do canal, anote em
`config/preferencias.md` (ex.: "formato do canal: histórias de terror de 60 s, sempre com final em aberto").

---

## Regras que valem pra qualquer formato
- **Gancho na primeira frase** (os primeiros 2 segundos decidem se a pessoa fica): uma pergunta, uma promessa, algo estranho
  ou uma afirmação que dá vontade de discordar. Nada de "Oi, gente" nem "Neste vídeo…".
- **Toda frase vira imagem.** Se uma frase não tem o que mostrar, corte ou troque por uma que tenha.
- **Uma ideia por frase**, frases curtas, português falado. Números por extenso.
- **Tensão e recompensa:** cada 2 ou 3 frases, algo muda (uma surpresa, uma virada, uma revelação).
- **Final que fecha** (revelação, piada, conclusão) **ou que volta pro começo** (o vídeo "emenda" em loop).
- **Chamada na última linha**, ligada ao tema: `Comente "medo" se você abriria esse armário.`
- **Tamanho:** o que a pessoa pedir; se não pediu, de 45 s a 2 min (≈190 palavras por minuto).
- **Verdade quando é fato** (curiosidade, história real, mito ou verdade): confira na web. Ficção é ficção, mas sem
  pessoas reais, marcas ou acontecimentos trágicos reais.
- **Limites:** terror sem sangue, violência explícita ou automutilação; nada de assustar com coisas reais perigosas
  (desafios, remédios, eletricidade). Humor sem zombar de grupos de pessoas.

---

## Formatos prontos

### 1. Construção (o da série)
"Você constrói um objeto resolvendo um problema de cada vez." Tudo em `02_roteiro.md`. Funciona em todos os estilos.

### 2. Como funciona por dentro (desmontando)
O contrário da construção: o objeto já existe e a câmera vai **abrindo camada por camada** até a peça que faz a mágica.
Gancho: "Você usa isso todo dia e nunca viu o que tem aqui dentro." · Cada camada: o que é + pra que serve.
Final: a peça principal em close + "É por isso que…". Edição: explosão das peças (vista explodida), letreiro em cada uma.

### 3. História de terror / mistério curta
Estrutura: **normal → sinal estranho → você investiga → piora → reviravolta → final em aberto**.
Gancho: um detalhe estranho e concreto ("Toda noite, às três da manhã, a luz do corredor acende sozinha.").
Narração em "você" ou em primeira pessoa. Frases ainda mais curtas perto do fim. O susto vem **depois de uma pausa**.
Edição: `noite()` + `feixe()` (lanterna), `chuva()`, `tremor()` no susto, `zoomSoco()` lento, cortes de som (silêncio antes
do susto), efeitos de `suspense_e_terror`. Trilha: `terror_sombrio`, `suspense_relogio` ou `misterio_noturno`.
Estilos que combinam: Desenho, Simples, Quadradinhos e Ilustrado 2D (com `clima: 'noite'`).

### 4. "E se…?"
Uma premissa absurda e as consequências **escalando**: "E se a Lua sumisse hoje à noite?" → 1ª consequência →
2ª maior → 3ª enorme → conclusão surpreendente. Tem que ser plausível pela ciência (confira).
Edição: manchete "E SE…?" no topo, multidão reagindo, transição a cada consequência. Estilo que brilha: **Simples**.

### 5. Curiosidade ("Você sabia?")
Um fato surpreendente + por que acontece + uma prova visual. 30 a 60 s.
Gancho: o fato direto ("Seu corpo tem mais bactérias do que células."). Depois: "Parece mentira, mas…" → explicação em
2 ou 3 passos → "Ou seja…" → chamada. Edição: letreiro no número, comparação visual (escala).

### 6. Lista (Top 3 / Top 5)
Contagem regressiva; o melhor fica por último. Cada item: nome + uma frase do motivo + imagem forte.
Gancho: "Três coisas na sua casa que são mais sujas que a privada." Edição: número grande na tela a cada item
(`manchete('Nº 3', …)`), transição entre itens. Avise "e o número um vai te surpreender" só se for verdade.

### 7. Mito ou verdade
Uma crença comum → "Será?" → o teste mostrado na tela → o veredito com letreiro (MITO / VERDADE) → o porquê em uma frase.
Pode ter 2 ou 3 mitos por vídeo. Edição: carimbo vermelho/verde no veredito (`impacto('MITO!', …)`).

### 8. História real em 60 segundos
Uma invenção, um acidente famoso (sem tragédia com vítimas), uma pessoa histórica.
Estrutura: **contexto → problema → tentativa que dá errado → virada → como mudou o mundo**. Datas e nomes conferidos.
Edição: cenário da época, letreiro com o ano, ◀◀ pra "voltar no tempo".

### 9. Comparação (A contra B)
Dois objetos ou jeitos de fazer, lado a lado, em 3 rodadas (ex.: preço, tempo, resultado). Placar na tela, vencedor no fim.
Gancho: "Qual seca mais rápido: varal ou secadora?" Edição: tela dividida, placar, `conquista()` pro vencedor.

### 10. Passo a passo (faça você mesmo, receita, dica)
Só coisas seguras. Cada passo: a ação + o detalhe que ninguém conta. Final: o resultado pronto.
Edição: número do passo, close nas mãos/objeto, `linhas()` nos momentos-chave.

### 11. Esquete de humor com o boneco do canal
Uma situação do dia a dia que dá errado de um jeito engraçado, com começo, meio e uma virada no fim.
Pode virar série com o mesmo boneco (personalize ele no `07_personalizar.md`). Edição: emotes, `zoomSoco()` na piada,
efeitos de `humor`. O boneco nunca fala palavras: a narração conta, ele reage com sons e caras.

---

## O arquivo `roteiro.txt` nos outros formatos
- Igual ao da série: **uma fala por linha** (cada linha = um momento/cena), `#` pra comentários.
- **A última linha é sempre a chamada** (a voz lê um pouquinho mais rápido). Se a pessoa não quer chamada, a última linha
  pode ser só uma frase de fecho: aí ponha `"velocidade_cta": 1.12` no `video.json` pra ela sair no mesmo ritmo.
- Sem "Parabéns"? Escolha a frase da virada/do final e marque no `video.json`: `"batida_final": "<nome da âncora>"`
  (ex.: `"susto"` se na cena existe `A.susto`). A batida final da música cai ali.
- Mostre pra aprovação do mesmo jeito (`02_roteiro.md` → "Como apresentar pra aprovação"): texto inteiro numerado +
  o que aparece na tela + duração. **Só produza depois do "pode".**

## Na produção
- A cena de partida do estilo (`cena_modelo.js`) roda com qualquer roteiro, mas ela foi pensada pra construção
  (peças que entram e piscam). Pra outros formatos, **reescreva a parte das ações**: crie as âncoras com `T('palavra')`
  pra cada momento (veja as demos em `biblioteca/estilos/quadradinhos/cena_modelo.js`: elas usam âncoras assim, sem `estrutura()`),
  monte um cenário por momento se precisar e mantenha a câmera sempre em movimento.
- Os efeitos de `sistema/motor/edicao.js` servem pra tudo: `noite`, `chuva`, `feixe`, `brilho`, `tremor`, `zoomSoco`,
  `emote`, `manchete`, `impacto`, `linhas`, `circulo`, `conquista`, `transicao`, `rebobinar`.
- **Trilha:** a biblioteca tem 30, incluindo terror (`terror_sombrio`), suspense (`suspense_relogio`), mistério (`misterio_noturno`),
  drama (`drama_piano`), épica (`epica_heroica`), urgência (`urgencia_noticia`) e fantasia (`fantasia_magica`). Se faltar um clima, gere uma nova:
  `python3 sistema/ferramentas/musica_nova.py <id> "descrição em inglês" [segundos] ["descrição em português"]`
  (custa créditos da ElevenLabs; confirme com a pessoa). Ou ponha um mp3 dela em `biblioteca/musicas/` e rode `analisar_musica.py`.
- Efeitos sonoros que faltarem: `efeito_novo.py`.
