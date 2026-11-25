# 08: Problemas e soluções

As ferramentas mostram erros em português, começando com `ERRO:`, e quase sempre dizem o que fazer. Leia a mensagem
inteira antes de agir. Resolva sozinho o que puder; pra pessoa, explique só o que ela precisa fazer, em uma frase.

## Configuração / ElevenLabs
| Sintoma | O que fazer |
|---|---|
| "não consegui falar com a ElevenLabs" | A internet do Claude está bloqueada pra esse site. A pessoa precisa liberar **api.elevenlabs.io** (ou todos os domínios) nas configurações do Claude, em **Capacidades** → acesso à rede. Depois, uma conversa nova. |
| "atividade incomum" / "unusual activity" | Plano grátis bloqueado. Precisa de plano pago (Starter). |
| "recusou a chave (401)" | Chave errada ou incompleta. Copiar de novo, inteira, em `config/chave_elevenlabs.txt`. |
| "acabaram os créditos" | Esperar renovar no mês seguinte ou aumentar o plano. Enquanto isso, dá pra mexer na cena (só a narração gasta crédito). |
| "essa voz não pode ser usada por API" | Voz da biblioteca da ElevenLabs que o plano não libera. Usar voz da conta ("My Voices") ou um clone. |
| `pip`/`apt` sem internet | A rede do Claude só libera alguns sites. `numpy`, `ffmpeg` e `node` normalmente já vêm instalados; rode `verificar.py` pra ver. |

## Narração
| Sintoma | O que fazer |
|---|---|
| Palavra pronunciada errado | Escrever no roteiro como se fala ("LED" → "léd") e rodar `narrar.py` de novo. |
| Entonação estranha numa frase | `narrar.py --forcar` gera de novo (sai diferente a cada vez). Ou mudar um pouco a frase. |
| Passou de 3 minutos | Cortar falas do roteiro (pedir aprovação de novo) e narrar de novo. |

## Cena (`conferir.py`)
| Erro | O que fazer |
|---|---|
| "Âncora não encontrada na narração: T('…')" | O trecho não está no roteiro como foi narrado. Use as "palavras parecidas" do erro ou outro trecho. Narrou de novo? As âncoras precisam seguir o texto novo. |
| "a cena usa efeitos sonoros que não existem" | Corrija o nome (veja os "parecidos" ou `biblioteca/efeitos/efeitos.md`) ou crie com `efeito_novo.py`. |
| "no segundo X do vídeo: Cannot read properties of undefined" | Alguma coisa usada no `update(t)` não existe naquele momento (objeto não criado, âncora errada, índice de lista). A linha está na mensagem. |
| "Tomadas de câmera fora de ordem" | Use `fecharCameras(...)` depois das tomadas (ele ordena). |
| "import desconhecido" / "arquivo importado não existe" | Caminho de `import` errado. Os imports precisam ficar **no topo** do arquivo e ser relativos (`../../../sistema/motor/video.js`) ou `'three'`. |
| "A cena não chamou iniciar(...)" | Falta `iniciar({ duracao, ancoras, update })` no fim da cena. |

## Página / render (no computador da pessoa)
| Sintoma | O que fazer |
|---|---|
| Abriu em outro navegador / não funciona | Abrir no **Google Chrome** (botão direito → Abrir com → Google Chrome). Edge também funciona. Safari e Firefox não. |
| Tela em branco ou "Carregando…" pra sempre | Recarregar (F5). Se continuar, pedir pra pessoa apertar F12 → aba "Console" e mandar um print. Atualizar o Chrome. |
| Caixa vermelha "Deu um erro na cena" | Pedir pra copiar o texto (botão "Copiar o erro") e mandar. Corrigir a cena, rodar `fazer_tudo.py` e pedir F5. |
| Prévia travando | Marcar "Prévia leve". O render final não é afetado. |
| Render muito lento | Normal em computador simples (pode levar algumas vezes a duração do vídeo). Deixar a aba aberta e em primeiro plano, fechar outras abas e programas pesados. |
| "Este navegador não consegue gerar vídeo" | Chrome desatualizado ou navegador errado. Atualizar o Chrome. |
| O vídeo saiu sem som | A página foi montada antes do áudio. Rodar `fazer_tudo.py` e renderizar de novo. |
| "aviso: sem H.264 … gerando em VP9" | Raro (Chrome sem codificador H.264). O vídeo funciona no YouTube; pra Instagram/TikTok, tentar outro computador ou o Edge. |
| O download não aparece | Ver a pasta Downloads; ou clicar em "Baixar de novo". O Chrome pode perguntar se permite baixar: permitir. |

## Painel
| Sintoma | O que fazer |
|---|---|
| Painel desatualizado | `painel.py` e pedir F5 no navegador. |
| Botão do painel não abre o vídeo | O nome da página mudou (versão nova). `painel.py` corrige. |

## Pasta / arquivos
- Não apague nada da pessoa. Pra tirar do caminho, mova pra `_descartar/` dentro do kit.
- Se a pessoa mover ou renomear a pasta do kit, nada quebra (os caminhos são relativos). Só precisa conectar a pasta de novo no Claude.
- Se algum arquivo do kit sumir (`verificar.py` acusa), a pessoa pode copiar o kit original de novo **sem apagar**
  `Meus Videos/` e `config/` (ali estão os vídeos e as configurações dela).
