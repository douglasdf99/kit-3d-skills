# 02: Roteiro

O roteiro é o que faz o vídeo prender. Ele é escrito pra ser **falado** (pela voz da ElevenLabs) e cada frase
vira uma cena. Leia os exemplos reais em `exemplos_de_roteiro.md` antes de escrever o primeiro.

> Este arquivo é o **formato da série** (construir um objeto). Se a pessoa quer outro tipo de vídeo (terror, curiosidade,
> lista, "E se…?", história, humor…), siga `02b_outros_formatos.md`. Não force a construção em tudo.

## A fórmula (padrão do kit; a pessoa pode mudar, veja `config/preferencias.md`)

1. **Abertura com a solução mais tosca que existe, e o problema dela.**
   A pessoa tenta resolver a necessidade do jeito mais simples possível, e funciona *mais ou menos*.
   - "Se você encosta uma pilha de nove volts numa palha de aço, os fiozinhos esquentam, brilham e iluminam o quarto. Só que a luz é fraquinha e dura uns dois segundos…"
   - "Se você tá morrendo de calor e coloca um balde de gelo na frente do ventilador, sai um vento geladinho. Mas logo o gelo derrete…"
2. **"Então você…"**: a solução, sempre com **você** fazendo a ação.
3. **"Esse é o / Essa é a [PEÇA]."**: o nome da peça, logo depois da solução. É aqui que entra o letreiro grande.
4. **"Mas… / Só que…"**: o próximo problema, causado pela solução anterior ou ainda não resolvido. Volta pro passo 2.
   Repita até o objeto ficar completo (normalmente de 5 a 9 peças).
5. **Curiosidades no meio, em uma frase**: "Por isso, se você abrir uma lâmpada, o argônio escapa…", "Ou seja: o ar-condicionado não fabrica frio…", "Ao contrário do que muita gente pensa…". Elas fazem a pessoa comentar.
6. **Acabamento numa frase só:** "Coloque uma rosca…, um pino… e um bulbo leitoso." (as peças sem problema pra resolver).
7. **"Parabéns! Você construiu um(a) [objeto]."**, sozinha numa linha (penúltima).
8. **Chamada:** `Comente “[palavra]” se você não sabia dessa!`, sozinha na **última linha**. A palavra é curta e ligada
   ao objeto (luz, frio, bip, chuva).

## Regras que fazem o vídeo funcionar
- **Quem constrói é sempre "você"**: "então você põe…", "você enrola o fio…". Nunca "a lâmpada ganha um filamento",
  "o ar-condicionado tem um compressor", nem voz passiva.
- **Cada peça nova entra como solução de um problema que foi MOSTRADO antes.** Primeiro mostra o que dá errado, depois resolve.
  Nunca "E se a gente colocasse X? Já existe: é o Y." Nunca uma peça que aparece sem motivo.
- **Uma ideia por frase.** Frases curtas. Português falado, informal (pra, tá, num, a gente), sem palavras difíceis.
  Se precisar de termo técnico, compare com algo do dia a dia: "igual bomba de encher pneu", "igual copo gelado suando".
- **Números por extenso**, do jeito que a voz vai falar: "dois mil graus", "noventa e cinco por cento", "uns doze centímetros".
- **Tem que ser verdade.** Confira cada informação (se tiver busca na web, use). Prefira números redondos e "uns/cerca de".
  Quando for simplificação, simplifique sem mentir.
- **Tamanho:** se a pessoa pediu um tamanho pra este vídeo ("uns 60 segundos"), siga o pedido dela. Se não pediu, use o padrão: de 1min30 a 2min30 de narração. A voz fala ~3,2 palavras por segundo (já acelerada), então
  **2 minutos ≈ 380 palavras**. Máximo absoluto: 3 minutos ≈ 560 palavras (limite dos Shorts). Conte as palavras antes de mostrar.
- **Ritmo:** problema e solução se alternam a cada 1 ou 2 frases. Nada de parágrafo explicativo comprido.
- **Sem marcas** (nada de nomes de empresa ou produto) e sem nada que não dê pra mostrar em 3D de um jeito simples.

## Formato do arquivo `roteiro.txt`
- **Uma fala por linha** (um parágrafo curto por linha: um problema + solução + nome, como nos exemplos).
- Linhas que começam com `#` são comentários (ignoradas pela voz). O cabeçalho que o `novo_video.py` cria pode ficar.
- **Penúltima linha:** `Parabéns! Você construiu um(a) X.` · **Última linha:** a chamada.
- Aspas da chamada: “curvas” ou "retas", tanto faz.

## Como apresentar pra aprovação
1. Escreva o `roteiro.txt` e atualize o painel: `painel.py etapa "Meus Videos/<x>" 2 "Roteiro esperando aprovação"`.
2. Mostre **o texto inteiro** na conversa, numerado por linha, e logo abaixo, em 3 a 6 tópicos curtos,
   **o que vai aparecer na tela** (ex.: "o boneco liga a pilha na palha de aço e o quarto acende", "a câmera entra no bulbo
   e mostra o oxigênio queimando o fio"). Diga a duração estimada.
3. Pergunte: **Posso produzir?** · **Quero mudar algo**.
4. Mudou? Ajuste e mostre de novo só o que mudou (ou tudo, se mudou muito). **Só produza depois do "pode".**
5. Aprovado: `painel.py etapa "Meus Videos/<x>" 3 "Em produção"` e siga para `03_producao.md`.

## Checklist antes de mostrar
- [ ] Começa com uma tentativa tosca que funciona mais ou menos?
- [ ] Toda peça aparece depois de um problema mostrado, com "Então você…"?
- [ ] Toda peça importante tem "Esse é o/Essa é a …"?
- [ ] Tem pelo menos 2 curiosidades do tipo "por isso…" / "ou seja…"?
- [ ] Penúltima linha é "Parabéns! Você construiu…" e a última é a chamada?
- [ ] Números por extenso, frases curtas, sem marcas?
- [ ] Entre 280 e 480 palavras (os exemplos têm de 370 a 530), ou o tamanho que a pessoa pediu (~190 palavras por minuto)?
