# 06: Render e revisão

## O que a pessoa faz (explique assim, a primeira vez)
1. Abre **Meus Videos → <vídeo> → ABRIR NO CHROME - <título> vN.html** (dois cliques; se não abrir no Chrome:
   botão direito → Abrir com → Google Chrome). Também dá pra abrir pelo **Painel**.
2. Aperta ▶ pra assistir à prévia com som. Se engasgar, marca "Prévia leve". O vídeo final não engasga.
3. Clica em **🎬 Renderizar vídeo final** e espera a barra encher (com a aba aberta).
   Num computador bom leva mais ou menos o tempo do vídeo; num simples, pode levar algumas vezes mais.
4. O arquivo **"<título> vN.mp4"** aparece na pasta **Downloads**, já com som, pronto pra postar.

O vídeo sai em 1080×1920, 30 quadros por segundo, H.264 + AAC (formato aceito por YouTube, Instagram e TikTok).

## Conferir antes (você não enxerga o vídeo, então peça imagens)
- **🖼️ Folha de revisão** (botão na página): 16 quadros do vídeo com o tempo de cada um, numa imagem só, que vai pra Downloads.
  Peça pra pessoa arrastar pro chat. Confira: o assunto da fala está no quadro? Algum letreiro tampa o boneco ou a ação?
  A câmera entrou em alguma parede? Algo atravessando algo? Cores e luz ok?
- **📷 Foto deste momento:** a imagem do segundo exato em que a prévia está (pra pessoa mostrar um problema específico).

## Revisão: quando a pessoa pede mudança
1. Entenda o pedido (se precisar, peça o segundo do vídeo ou uma foto do momento).
2. **Mude só o que ela pediu**, mais o que estiver obviamente quebrado. Não mexa no resto, nem pra "melhorar".
3. Se ela já viu essa versão (página entregue), **crie uma nova versão**:
   - copie a pasta `cena/` pra `versoes/v<N>/cena/` (guarda a anterior);
   - aumente `"versao"` no `video.json` (1 → 2);
   - faça a mudança. Se o roteiro mudou, rode `narrar.py`; depois rode `fazer_tudo.py`.
   A página nova sai com outro nome ("… v2.html") e a antiga continua lá.
4. Etapa 4 no painel com uma nota do que mudou (`painel.py etapa "<pasta>" 4 "v2: letreiro do motor mais pra cima"`) e avise a pessoa:
   > Pronto, fiz a v2: [o que mudou, em uma frase]. Abra **ABRIR NO CHROME - <título> v2.html** e renderize de novo.
5. Mudou só detalhe e a pessoa ainda nem abriu a página? Pode refazer na mesma versão.

## Quando a pessoa aprova
- Etapa 6: `painel.py etapa "<pasta>" 6 "Aprovado — pronto pra postar"`.
- Dica pra ela: mover o MP4 da pasta Downloads pra pasta do vídeo (aí o painel mostra o vídeo).
- Se ela quiser, sugira título, descrição curta e 3 a 5 hashtags pro post (no idioma do canal).
- Postou: etapa 7.

## Se o render der problema
Veja `08_problemas.md` ("render"). Resumo: use o Google Chrome atualizado, deixe a aba aberta e em primeiro plano,
feche outras abas pesadas. Se aparecer uma caixa vermelha de erro, peça pra pessoa copiar o texto e mandar pra você.
