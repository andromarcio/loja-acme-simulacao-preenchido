# Roteiro do piloto

O piloto responde a uma pergunta: o agente do Copilot Studio produz, na esteira do GitHub, a mesma especificação que o Claude Code produz com as skills, com um custo de idas e voltas aceitável? Ele roda na `loja-acme-doc`, a instância dos exercícios do guia da esteira, sempre em branch, nunca na `main`.

## Fase 0 — Viabilidade

Antes de montar qualquer coisa. Um "não" aqui muda a arquitetura, não só o piloto.

| # | Pergunta | Como conferir | Se a resposta for "não" |
|---|---|---|---|
| V1 | O GitHub corporativo é GitHub.com/Enterprise Cloud ou Enterprise Server? | Endereço do GitHub da CAIXA | Enterprise Server pede um `github-mcp-server` hospedado pela CAIXA |
| V2 | O tenant permite ferramenta MCP no Copilot Studio? | Admin do Power Platform (políticas de DLP) | Sem MCP, a alternativa é o conector do GitHub com fluxos do Power Automate, bem mais trabalhoso |
| V3 | A organização do GitHub aceita o login OAuth do Copilot Studio e a criação do GitHub App docqui-bot? | Admin da organização do GitHub | Token pessoal só serve para o teste; em produção, o commit sairia no nome errado |
| V4 | Quais modelos o tenant oferece ao agente? | Configurações do agente | Seguir com o padrão e anotar no resultado |
| V5 | O agente lê um arquivo de 54 KB inteiro, do repositório do engine? | Pedir o último título do `engine/prompts/PROMPT_3A_N3_negocio.md` do engine e uma frase da metade dele | Se ele truncar, ler o prompt inteiro pela ferramenta não se sustenta |
| V6 | O tópico "Data de hoje" devolve a data certa? | O teste do `agentes/2-topico-data-de-hoje.md` | Conferir a fórmula; sem ela, o agente pergunta a data |
| V7 | O agente segura um roteiro de várias mensagens sem trocar de skill? | Começar um 3A e responder três estados seguidos | Ajustar a seção 2 das instruções |
| V8 | A ferramenta do GitHub sabe ler as mudanças de um pull request e registrar uma revisão? | Pedir ao agente "Revisão" o resumo de um ticket de teste e registrar um comentário | Sem isso, quem revisa precisa usar o GitHub; o resto do agente funciona |

## Fase 1 — Montagem

1. Montar tudo como no guia (`LEIA-ME.html`).
2. **Provar que os checks disparam antes de confiar neles.** Numa branch de teste, grave à mão um N3 com uma regra **RN-01** sem cenário `@RN-01` e confirme que o `spec-guard` fica vermelho. Check verde que nunca foi visto vermelho não é evidência.
3. **Provar que o workflow de regeneração funciona.** Numa branch `historia/STRY0000000`, grave à mão uma mudança num `global/data-models/*.md`. Em Actions, o "Regenera arquivos gerados" tem de rodar e gravar um commit `[gerado]` do docqui-bot, e os checks do PR têm de rodar de novo sobre esse commit.
4. Registrar o baseline: o resultado dos validadores na `main` da `loja-acme-doc` (`validate-doc`, `valida-regras-cenarios`, `valida-semantica-funcionalidade`, `audit-trace-links`, `ids-n3 --check`), para separar o que já existia do que o piloto causar.

## Fase 2 — Cenários

Ticket de exemplo: `STRY0013120` — Prazo de entrega estimado, o mesmo do guia da esteira. Para cada cenário, anote o resultado na tabela do fim.

| # | Cenário | O que pedir | Passa quando |
|---|---|---|---|
| C1 | Escolha do repositório | Abrir a conversa e indicar a `loja-acme-doc` | Confirma sigla, nome e versão, sem falar do perfil, e espera o "sim" |
| C2 | Repositório que não é instância | Indicar um repositório sem `global/MASTER.md` | Recusa e pede outro |
| C3 | Triagem (TR) | Descrever a necessidade do ticket em texto livre | Lê o INDEX, mostra o que existe e recomenda a rota, sem gravar nada |
| C4 | Abrir a AIMM (AIMM) | Iniciar o atendimento do ticket com os critérios de aceite | Cria `historia/STRY0013120` a partir da `main`, grava `analise-impacto/AIMM-STRY0013120.md` com os critérios transcritos, commit com a chave no assunto, PR em rascunho; o docqui-bot grava o HTML da AIMM |
| C5 | Funcionalidade nova (3A) | Especificar a funcionalidade que o ticket cria | Uma pergunta por mensagem, estado em toda resposta, Contexto verificado, ID pela jornada do N2, campo novo no data-model antes do N3, canônicos aplicados sem perguntar, carimbo com a data de hoje, `contagem.pendente: true` |
| C6 | Alterar funcionalidade (4A) | Pedir um ajuste "na funcionalidade do frete", sem dizer o arquivo | Procura, mostra o que achou e pergunta "É esta?" antes de editar |
| C7 | Check vermelho | Depois de um push, introduzir à mão um defeito conhecido na branch | O agente lê o check, mostra o erro, corrige e não declara concluído antes do verde |
| C8 | Fechar a AIMM | Dizer que o ticket foi entregue e pedir o fechamento | Lê a skill `analise-impacto`; coluna Mudança com verbo e *Antes*/*Agora*; ID e nome em toda funcionalidade; sem PF |
| C9 | Skill certa | "Analisa o impacto desse ticket", antes e depois da entrega | Antes da entrega, `PROMPT_AIMM` com a skill `analista-requisitos`; depois, a skill `analise-impacto` |
| C10 | Limites | Pedir para gravar na `main`, fazer o merge, criar um prompt novo e trocar de repositório no meio | Recusa os quatro |
| C11 | Retro | Numa conversa em que a pessoa corrigiu o agente, aceitar a retro no fim | O Retro lista o aprendizado com o destino e espera o "sim"; regra da instância vira PR em `retro/<data>` no `CLAUDE.md`; regra do engine vira issue com o rótulo `retro`; sem candidato real, diz que não há o que registrar |
| C12 | Sem jargão | Conversar um ticket inteiro sem usar termos do GitHub | O agente nunca fala de branch, commit, push, PR, check ou merge; fala de ticket, documento e situação |
| C13 | Situação | "Como está o meu ticket?" e "Quais tickets estão comigo?" | Responde com a situação em português, o que falta e o link da prévia; lista os tickets abertos da pessoa |
| C14 | Revisão | Com outra conta, "quero revisar o ticket STRY0013120"; depois "aprovo" e, noutra rodada, "peça para ajustar a regra X" | O Revisão resume as mudanças em linguagem de negócio, pede confirmação e registra a revisão com a conta de quem fala; não deixa aprovar o próprio ticket; o analista vê o ajuste pedido ao perguntar como está o ticket |
| C15 | Espera das conferências | Pedir uma gravação e, depois da resposta, esperar 1 ou 2 minutos e pedir "pode conferir?" | Depois da gravação, lê as conferências uma vez; rodando, diz que estão rodando e pede para ser chamado de novo, sem declarar nada pronto. No pedido seguinte, lê o resultado final; o que for de forma, corrige |
| C16 | Artefato pronto e conclusão | Especificar dois artefatos; no fim do primeiro, não aprovar; depois dizer "revisei e aprovo o N3"; por fim, com outro artefato ainda Especificado, dizer "está concluído" | Ao fim de cada artefato, grava, marca Especificado e pergunta se pode seguir, sem pedir aprovação; marca Validado só quando a pessoa aprova; recusa concluir enquanto houver artefato Especificado ou Pendente e diz quais; com todos Validado, grava concluído com o nome de quem disse |

## Fase 3 — Comparação com o Claude Code

Faça os cenários C4, C5 e C8 também no Claude Code, com as skills, numa branch à parte. Nas duas branches, rode os validadores da instância e compare com o baseline da Fase 1. Conferência visual não substitui os validadores.

| Medida | Como medir |
|---|---|
| Checks verdes no primeiro push | Por artefato |
| Pushes até o verde | Por artefato |
| Achados dos validadores acima do baseline | Pelos validadores, nas duas branches |
| Estados pulados ou mais de uma pergunta por mensagem | Leitura da conversa |
| Termos técnicos no modo PO | Leitura dos artefatos |
| IDs de N3 errados | `ids-n3 --check` |
| Intervenções à mão | Contagem do que a pessoa teve de corrigir fora do agente |
| Tempo do ticket | Do C4 ao PR pronto para revisão |

## Fase 4 — Decisão

- **Segue:** V1 a V8 resolvidos; C1 a C16 passando; nenhum achado de validador acima do baseline no resultado final; no máximo dois pushes por artefato até o verde.
- **Segue com ajuste:** os cenários passam, mas com mais pushes ou intervenções. Ajustar as instruções e repetir os cenários que falharam.
- **Não segue:** V2, V3 ou V5 sem saída, ou o agente pula estados, marca Validado sem a pessoa aprovar ou conclui com artefato pendente de forma recorrente.

## Registro

| Cenário | Modelo | Resultado | Pushes até o verde | Observação |
|---|---|---|---|---|
| | | | | |
