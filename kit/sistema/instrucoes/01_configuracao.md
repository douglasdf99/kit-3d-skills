# 01: Configuração inicial (primeira conversa)

Objetivo: conduzir a pessoa pela configuração, conferindo cada etapa antes de avançar. Isso inclui ter visto um vídeo pronto, ter a voz escolhida, o estilo escolhido e o painel aberto.
Faça **um passo de cada vez**, com perguntas curtas. Use botões (AskUserQuestion) sempre que der.
Confira cada passo antes de ir pro próximo. Ao final, anote as escolhas em `config/canal.json` e `config/preferencias.md`.

---

## Passo 0: Boas-vindas (1 mensagem curta)
Se o kit acabou de ser instalado a partir do zip, você já mostrou o resumo do que vem nele: não repita, vá direto pro "vou deixar tudo
configurado". Se a pessoa começou com a pasta já descompactada, abra com o mesmo resumo rápido do kit (o da instalação no `CLAUDE.md`:
estilo Quadradinhos, 10 trilhas, 46 efeitos, painel) e depois a mensagem abaixo.
Algo como:
> Oi! Eu sou o Claude e vou te ajudar a fazer seus vídeos 3D. Primeiro vou deixar tudo configurado com você, conferindo cada etapa antes de avançar.
> Vou te fazer umas perguntas rápidas, uma de cada vez. Só um instante enquanto eu confiro se está tudo instalado aqui…

Em seguida, **sem esperar resposta**, rode `python3 sistema/ferramentas/verificar.py` (da pasta do kit).
- Se faltar programa (numpy, ffmpeg, node): resolva você mesmo (a própria ferramenta tenta instalar; se precisar,
  `pip install numpy imageio-ffmpeg --break-system-packages`, `sudo apt-get install -y nodejs`). Só fale disso com a pessoa se não conseguir.
- Os itens de voz, nome e chave vão aparecer como faltando. É normal, você configura nos passos abaixo.

## Passo 1: Mostrar como fica (vitória rápida)
Mostre a imagem `biblioteca/estilos/quadradinhos/cena.jpg` (uma cena pronta do estilo) e diga em uma frase como o vídeo vai
ser: tudo feito de quadradinhos, com narração, legenda, letreiros, efeitos e trilha. Não precisa esperar resposta.

## Passo 2: Nome do canal
Pergunte o nome do canal (ou do perfil) onde os vídeos vão ser postados. Ele aparece no fim de cada vídeo, numa plaquinha.
Grave em `config/canal.json` → `"nome"`. Se a pessoa não quiser assinatura no vídeo, use `"assinatura": false`.

## Passo 3: Idioma dos vídeos
Botões: **Português (padrão)** · English · Español. Grave `"idioma"`: `"pt"`, `"en"` ou `"es"`.
(Em inglês/espanhol o formato é o mesmo, traduzido: "So you…", "Congratulations! You built a…", "Comment "…" if you didn't know this!".)

## Passo 4: Conta e chave da ElevenLabs (a voz do narrador)
A narração é feita pela ElevenLabs (site de vozes com inteligência artificial). Cada pessoa usa **a própria conta**.

**4a. Conta.** Pergunte se já tem conta. Se não tiver:
> Entre em **elevenlabs.io** e crie uma conta (dá pra entrar com o Google).
> Recomendo o plano **Starter** (o mais barato), porque:
> - no plano grátis a ElevenLabs costuma bloquear o uso feito pelo Claude;
> - o grátis não permite usar os vídeos comercialmente;
> - o Starter já deixa clonar a sua própria voz.

**4b. Chave.**
> Agora pegue sua chave de acesso:
> 1. No site da ElevenLabs, procure no menu por **API Keys**. Costuma estar em **Developers** ou clicando no seu nome/perfil.
> 2. Clique em **Create API Key** (criar chave).
> 3. Habilite apenas os serviços usados pelo seu fluxo: Text to Speech para narrar, e as permissões correspondentes quando usar vozes, efeitos ou música.
> 4. Copie a chave (ela começa com `sk_`).

**4c. Colocar a chave no kit.** O mais seguro é a pessoa colar num arquivo:
> Abra a pasta do kit → pasta **config** → dê dois cliques em **chave_elevenlabs.txt** (abre no Bloco de Notas).
> Apague o texto que está lá, cole a chave, salve (Ctrl+S) e feche. Me avise quando terminar.

Não peça nem incentive que a pessoa cole a chave na conversa. Oriente a colocação apenas no arquivo local; confirme o funcionamento sem exibir o valor.

**4d. Testar.** Rode `verificar.py` de novo e leia a parte "ElevenLabs":
- OK com plano e créditos → diga em uma frase ("Chave funcionando! Você tem X créditos este mês, dá pra uns Y vídeos").
  Conta: um vídeo de 2 minutos gasta uns 2.500 créditos de narração.
- "não consegui falar com a ElevenLabs" → o acesso à internet do Claude está bloqueado pra esse site. Explique:
  > Nas configurações do Claude, procure a parte de **Capacidades** (Capabilities). Em acesso à rede / domínios permitidos,
  > libere **api.elevenlabs.io**. Depois me avise.
  Depois que a pessoa mudar, o ideal é **abrir uma conversa nova** (a configuração de rede vale pras conversas novas).
  Antes de ela sair, anote em `config/preferencias.md` em que passo vocês pararam.
- "atividade incomum" / plano grátis → explique que precisa de um plano pago (Starter resolve).
- "recusou a chave (401)" → peça pra copiar de novo, a chave inteira.

## Passo 5: A voz
Botões: **Quero usar a minha voz (clone)** · **Quero escolher uma voz pronta**.

- **Voz pronta:** rode `python3 sistema/ferramentas/vozes.py amostras`. Ele grava amostras curtas (numeradas: 01, 02…) em
  `config/amostras de voz/`. Prefere vozes nativas do idioma do canal; se a conta não tiver, busca vozes nativas na
  biblioteca da ElevenLabs (ex.: sotaque brasileiro) e adiciona na conta da pessoa (diga isso a ela).
  > Abra a pasta **config → amostras de voz** e escute (dois cliques em cada arquivo). Qual você gostou mais?
  Depois: `vozes.py escolher <número da amostra>` (ex.: `vozes.py escolher 2`).
- **Clonar a própria voz** (precisa de plano pago):
  > No site da ElevenLabs: **Voices** → **Add a new voice** → **Instant Voice Clone**.
  > Grave ou envie de 1 a 3 minutos da sua voz lendo um texto qualquer, num lugar silencioso, sem música.
  > Dê um nome (ex.: "Minha voz") e salve. Me avise quando terminar.
  Depois rode `vozes.py listar`, ache a voz (aparece como "clone (sua)"), rode `vozes.py amostra <id>`
  pra pessoa ouvir como fica no estilo do canal, e então `vozes.py escolher <id>`.
- Se a pessoa já tem um clone na conta, é só listar e escolher.

## Passo 6: O estilo
O kit tem **um estilo só: o Quadradinhos** (boneco, cenário e objetos feitos de quadradinhos, letreiros e sons de videogame).
Não pergunte: grave `"estilo": "quadradinhos"` em `config/canal.json` e siga.

## Passo 6b: O boneco (opcional)
> O boneco de todos os estilos vem de camisa branca, calça azul-escura e cabelo preto. Quer mudar alguma coisa nele?
> (ex.: cor da camisa, boné, óculos, capacete, cabelo)

Botões: **Deixar como está** · **Quero mudar**. Se mudar, anote em `config/preferencias.md` a linha exata
(ex.: "boneco: camisa vermelha e boné preto em todos os vídeos") e use essas cores no `E.boneco({...})` de toda cena
(as chaves de cada estilo estão no `GUIA.md` dele).

## Passo 7: O tipo de vídeo (rápido)
Explique em 3 linhas:
> O kit vem com o formato da série: você "constrói" um objeto resolvendo um problema de cada vez, até o "Parabéns! Você construiu…".
> Mas dá pra fazer vídeos do seu jeito também: histórias de terror, curiosidades, listas, "E se…?", mito ou verdade, humor…
> E dá pra misturar: escolher a cada vídeo.

Botões: **Formato da série (recomendado pra começar)** · **Outro tipo de vídeo** · **Vou decidindo a cada vídeo**.
- **Outro tipo:** mostre a lista de `02b_outros_formatos.md` (nome + uma frase de cada) e pergunte qual, ou peça pra pessoa
  descrever o vídeo que ela quer (um exemplo de vídeo que ela gosta ajuda). Anote em `config/preferencias.md`
  (ex.: "formato do canal: terror curto, 60 s, final em aberto, chamada 'Comente medo'").
- **Série:** pergunte se quer mudar algo nele (outro bordão, outro final). Se mudar, anote exatamente o que muda.

## Passo 8: O painel
> Abra o arquivo **Painel.html** (na pasta do kit). Ali você vê todos os seus vídeos e o que falta em cada um.
> Dica: deixe ele nos favoritos do navegador, ou crie um atalho na área de trabalho
> (botão direito no arquivo → Enviar para → Área de trabalho).

Rode `painel.py` antes, pra ele estar atualizado.

## Passo 9: Fechar a configuração
1. Confira `config/canal.json` (nome, idioma, voz, estilo) e rode `verificar.py`. Deve dar "TUDO CERTO".
2. Escreva em `config/preferencias.md` um resumo das escolhas (data de hoje).
3. Mande um resumo curto pra pessoa, em lista: canal, idioma, voz, estilo, boneco e formato.
4. Proponha o primeiro vídeo:
   > Pronto! Agora a parte divertida: qual vai ser o primeiro vídeo?
   > No formato da série, ideias de objetos: guarda-chuva, ventilador, chuveiro elétrico, fechadura, bicicleta, caneta, extintor.
   (Se a pessoa escolheu outro tipo de vídeo no Passo 7, dê 3 ideias desse tipo, ex.: terror → "a luz do corredor que acende sozinha".)

   Dica pra primeira vez: objetos com 4 a 7 peças e um funcionamento fácil de mostrar.
   Siga para `02_roteiro.md` (ou `02b_outros_formatos.md`, se for outro tipo de vídeo).

---

### Se a pessoa voltar numa conversa nova no meio da configuração
Leia `config/preferencias.md`, onde você deixou anotado em que passo parou, e continue dali, sem repetir o que já foi feito.
