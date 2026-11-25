# 03: Produção (do roteiro aprovado até a página pronta pra renderizar)

Pré-requisito: o roteiro foi **aprovado** e o vídeo está na etapa 3 (`painel.py etapa "Meus Videos/<x>" 3 "Em produção"`).
Rode tudo a partir da pasta do kit. `<x>` é a pasta do vídeo dentro de `Meus Videos`.

Diga pra pessoa, em uma frase, o que vai acontecer e quanto tempo leva:
> Roteiro aprovado! Agora eu gravo a narração e monto a cena 3D. Te aviso quando a página estiver pronta pra você assistir.

## 1. Narração
```
python3 sistema/ferramentas/narrar.py "Meus Videos/<x>"
```
- Gera `audio/narracao.wav` e `audio/timeline.json` (o segundo exato de cada palavra).
- Custa créditos da ElevenLabs: só rode com o roteiro aprovado. Se o texto não mudou, ela reaproveita e não gasta nada.
- Confira a lista de linhas com os tempos que ela imprime. A duração total tem que ficar abaixo de 3 minutos.
- **Pronúncia errada?** (siglas, nomes estrangeiros): escreva no roteiro do jeito que se fala ("LED" → "léd",
  "Wi-Fi" → "uai-fai") e rode de novo. Avise a pessoa que a legenda vai mostrar a palavra desse jeito.

## 2. Plano de cenas (antes de programar)
> Vídeo em outro formato (terror, lista, curiosidade…)? Veja também `02b_outros_formatos.md` → "Na produção".
Escreva `notas.md` na pasta do vídeo com uma tabela curta, uma linha por fala do roteiro:

| fala (início) | o que aparece | câmera | letreiros / plaquinhas | sons |
|---|---|---|---|---|

Pense como no gabarito: **cada frase tem uma imagem**. O problema acontece na tela (fio queimando, gelo derretendo,
água pingando) e depois a solução entra. Use o gabarito (`Exemplo - Lampada/cena/cena.js`) como referência de quanta
coisa acontece por segundo. Não precisa mostrar esse plano pra pessoa, a não ser que ela peça.

## 3. Cena 3D
Leia `04_cena_3d.md`. Ele tem as regras visuais da série, a referência do motor e o roteiro do gabarito explicado linha por linha.
- A cena fica em `Meus Videos/<x>/cena/cena.js`. O `novo_video.py` já deixa a **cena de partida do estilo** escolhido, que funciona
  do começo ao fim com o roteiro (gancho, problemas com volta da fita, peças entrando e piscando, Parabéns, chamada). Leia o
  `GUIA.md` do estilo e troque o cenário, as peças e as ações pelo conteúdo do vídeo.
- Modelos 3D próprios do vídeo (o objeto e as peças) ficam melhor em `cena/modelos.js`, importado pela cena com `import * as M from './modelos.js'`.
- **Depois de cada bloco de mudanças:** `python3 sistema/ferramentas/conferir.py "Meus Videos/<x>"`. Ele roda o vídeo
  inteiro sem navegador e acusa erro de código, âncora que não existe na narração e efeito sonoro com nome errado.
  Só siga quando der **OK**. Leia também os avisos.

## 4. Sons e música
Leia `05_audio.md`. Efeitos sonoros entram na própria cena (`som(...)`, `ambiente(...)`).
A trilha é escolhida no `video.json` (`"musica": "<id>"`; veja `biblioteca/musicas/musicas.json`).

## 5. Montar tudo
```
python3 sistema/ferramentas/fazer_tudo.py "Meus Videos/<x>"
```
Confere a cena, monta o áudio (narração, música com a batida final no "Parabéns" e efeitos), gera a página
`ABRIR NO CHROME - <título> v<N>.html` e atualiza o painel. Tem que terminar com **PRONTO**.

## 6. Entregar pra pessoa
1. `painel.py etapa "Meus Videos/<x>" 4 "Pronto pra renderizar"`.
2. Mensagem curta:
   > Seu vídeo está pronto pra assistir! Abra a pasta **Meus Videos → <x>** e dê dois cliques em
   > **ABRIR NO CHROME - <título> v1.html** (ou use o botão no Painel).
   > Aperte ▶ pra ver com som. Se estiver bom, clique em **🎬 Renderizar vídeo final**: o MP4 vai pra sua pasta Downloads.
   > Se quiser que eu confira junto, clique em **🖼️ Folha de revisão** e arraste a imagem (ela vai pra Downloads) aqui no chat.
3. **Recomendado:** peça a folha de revisão na primeira entrega de cada vídeo. Você não consegue ver o vídeo sozinho, e a folha
   (16 quadros com o tempo de cada um) é o jeito de conferir enquadramento, letreiros e se nada atravessa nada.
   Olhe a folha com atenção e corrija o que estiver ruim **antes** de a pessoa renderizar. Se corrigir, rode `fazer_tudo.py`
   de novo (mesma versão, porque a pessoa ainda não aprovou nada) e peça pra ela recarregar a página (F5).

## 7. Miniatura no painel (opcional)
Se a pessoa mandar uma foto de um momento bonito do vídeo (botão "📷 Foto deste momento"), salve como `miniatura.jpg` na
pasta do vídeo (vertical) e rode `painel.py`. O painel passa a mostrar a imagem.

Depois disso, siga `06_render_e_revisao.md`.
