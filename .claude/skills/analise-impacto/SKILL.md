---
name: analise-impacto
description: >-
  Fecha a AIMM (Análise de Impacto de Mudança para Manutenção) de um ticket JÁ ENTREGUE e escreve a AIMM da sprint:
  descobre quais funcionalidades mudaram de comportamento, quais precisaram ser criadas, o que a
  entrega fez no data-model e nos dicionários, aplica o delta nos N3 e reescreve a AIMM com o
  que foi alterado — funcionalidades incluídas e alteradas e entidades alteradas, sem Pontos de
  Função: a medição é de um agente de contagem à parte, fora do Docqui, que lê as AIMMs.
  Acione sempre que o usuário falar de: análise de impacto, AIMM, AIM (nome anterior), AIMM da sprint, impacto de
  sprint ou de release, o que a sprint mudou na spec, delta da sprint, funcionalidades (ou features) impactadas,
  novas vs alteradas, conciliar entrega com documentação, função incluída, função alterada, ou entregar um
  documento de impacto para o PO, para a chefia ou para o agente de contagem. Acione também
  quando apontarem um ticket entregue, changelog de sprint, relatório de entrega ou lista de
  migrações pedindo "veja o que isso impacta". Antes da entrega, quem abre a AIMM e a leva ao
  aval do PO é o PROMPT_AIMM, não esta skill.
---

# Análise de Impacto de uma entrega

Uma sprint foi entregue. O código está em produção, as migrações rodaram, e existe uma especificação — escrita antes, ou por engenharia reversa — que agora está desalinhada. Esta skill conduz o trabalho de descobrir **o que exatamente mudou**, registrar isso de forma auditável na AIMM de cada ticket e **consolidar** a evolução na AIMM da sprint.

## Uma AIMM por ticket, versionada — esta skill a fecha

No contexto CAIXA, **AIMM** significa **Análise de Impacto de Mudança para Manutenção**, nome do artefato anteriormente chamado AIM. Um arquivo por ticket, `analise-impacto/AIMM-<CHAVE>.md`, é versionado à medida que o ticket avança. No início é a visão do que **será** alterado; no fim, do que **foi** alterado. Duas mãos escrevem nele, em momentos diferentes, e confundi-las faz você escrever a visão errada:

| | `engine/prompts/PROMPT_AIMM.md` | Esta skill |
|---|---|---|
| Momento | **Antes** da spec mudar (passos 1–6) | **Depois** da entrega (passo 7) |
| Estado da AIMM | `em-análise` → `escopo-aprovado` | `concluído` |
| Insumo | O ticket na ferramenta de origem | A AIMM avalizada + o que foi entregue: changelog, código, modelo físico |
| Pergunta | Que artefatos o ticket *vai* alterar? | O que o ticket *alterou* na spec publicada? |
| Entrega | Changeset para o aval do PO | As seções de impacto reescritas com o que mudou e a Reconciliação; a AIMM da sprint |
| Governa | O escopo antes do trabalho | A auditoria depois dele |

Se o ticket ainda não virou código, é o PROMPT_AIMM. Se a sprint entregou, é esta skill. Ticket entregue **sem** AIMM ganha a sua agora, a partir do `analise-impacto/_TEMPLATE_AIMM.md`, com `aberta-na-entrega: true`: não houve escopo prévio a reconciliar, e a `## Reconciliação` diz isso. *Analisar o impacto* continua sendo a atividade. Os leitores aceitam arquivos `AIM-*` legados; `PROMPT_AIM` encaminha ao `PROMPT_AIMM`. Não crie os dois nomes para a mesma chave: migre com `scripts/migra-aimm.mjs`.

---

## Toda funcionalidade aparece com código **e** nome

`TEM-ASO-03` não diz nada a quem lê. *Exportar Atendimento Social* diz. Quem recebe a análise — PO, métrica, chefia — não tem a árvore de IDs na cabeça, e uma tabela de códigos obriga a abrir os N3 um a um só para saber do que se está falando.

A regra: **onde a funcionalidade é um item enumerado, o código vem acompanhado do nome** — linha de tabela, item de lista, célula de resumo, bloco de decisão. Em prosa corrida, o par aparece na **primeira menção de cada seção**; as repetições seguintes podem ficar só com o código, que a essa altura já foi apresentado.

| ❌ | ✅ |
|---|---|
| Trava o fechamento de `TEM-ASO-02` e de `TEM-ASO-03` | Trava o fechamento de `TEM-ASO-02` *Consultar Atendimento Social* e de `TEM-ASO-03` *Exportar Atendimento Social* |
| \| `MON-API-03` \| página pública \| | \| `MON-API-03` **Consultar Status das APIs** \| página pública \| |
| 4 funcionalidades novas `MON-API-01..04` | 4 funcionalidades novas: verificar disponibilidade, notificar indisponibilidade, consultar status e configurar monitoramento (`MON-API-01..04`) |

Vale também para o **intervalo** de códigos: `MON-API-01..04` economiza espaço e esconde o conteúdo. Se são quatro, nomeie as quatro — é o mesmo princípio de não deixar contagem sem lastro (FD-9).

O nome canônico é o **título do N3** (a linha `# …` do arquivo), não uma paráfrase. Funcionalidade ainda sem N3 usa o nome proposto, marcado como proposta.

---

## Antes de qualquer coisa: fixe a linha do tempo

Esta é a decisão que contamina todo o resto, e errar aqui inverte conclusões inteiras. Descubra e escreva **duas datas** antes de analisar uma linha sequer:

1. **Quando a spec foi escrita, e a partir de quê?**
2. **Quando a sprint entregou?**

O que essas datas decidem:

- **Se a spec foi escrita por engenharia reversa do código atual**, ela já descreve comportamento *pós-sprint* em vários pontos. Então o "antes" de cada delta **não é o código anterior** (que você provavelmente não tem) — é o **N3 como publicado**. Extraia o "antes" do texto do N3, ou do diff do artefato, nunca do sistema em produção.

Quando faltar o estado anterior — SQL antigo, arquivos de migração —, **diga isso na AIMM como premissa**, não invente. A lista de alterações passa a ser a *declarada* pelo ticket, não a *verificada no script*, e essa diferença importa para quem audita.

---

## A reclassificação que ninguém espera

Tickets costumam marcar itens como **NOVA** quando o que querem dizer é *"primeiro envio à área negocial"*. Uma funcionalidade pode existir em produção há meses e ainda ser "nova" para o negócio.

Na spec, o critério é outro: **existe um N3 para isso?** Se existe, é **alteração**, por mais nova que o ticket diga que é. E cuidado com a sobreposição parcial: uma entrega marcada como nova pode ter metade já especificada em outra funcionalidade. Busque no índice de rastreabilidade por verbo e por entidade antes de concluir que algo não existe.

Sempre confronte item a item e registre a reclassificação explicitamente — é um dos achados mais valiosos da AIMM, porque muda quem faz o trabalho e como a entrega é medida.

---

## A AIMM da sprint rastreia ticket e critério

Toda sprint fecha com a lista das funcionalidades impactadas, e **cada funcionalidade carrega de onde veio**: a chave do ticket na ferramenta de origem e, quando a fonte numera os critérios de aceite, o número do critério que aquela funcionalidade realiza. É requisito de cliente, não enfeite — é o que permite conferir a lista lado a lado com a ferramenta, critério por critério.

O elo já existe nos artefatos: a coluna `Critérios cobertos` do `## Origem` de cada N3 abre com as referências `CA-n`, e a `## Funcionalidades` da AIMM do ticket as espelha. A coluna `CA-n` da `## Alterações em funcionalidades por Agrupamento Funcional` as repete, para quem lê a AIMM não precisar abrir os N3 um a um.

Duas regras mantêm isso honesto:

- **Número só existe se a fonte numerar.** Muito ticket lista os critérios como bullets, prosa ou sub-seções. Aí a coluna sai `—` e a rastreabilidade é só pela chave do ticket. Numerar por conta própria produz um número que não existe na ferramenta do cliente — e um número errado é pior que nenhum, porque parece conferível.
- **A união dos critérios das funcionalidades é o conjunto de critérios do ticket.** Ao fechar a AIMM, confira: nenhum `CA-n` repetido entre funcionalidades, nenhum faltando. Critério sobrando é funcionalidade que falta; critério repetido é fronteira mal traçada entre duas funcionalidades.

---

## Onde a AIMM mora e como se chama

As duas naturezas de AIMM se leem de formas diferentes: a da sprint é o que o agente de contagem lê para medir a entrega, a do ticket é o que o time consulta ao mexer naquele ticket.

| Natureza | Arquivo | Título (`#`) | Front-matter |
|---|---|---|---|
| AIMM do ticket — um item da ferramenta de origem | `analise-impacto/AIMM-<CHAVE>.md` | `# AIMM <CHAVE>` | `tipo: ticket` |
| AIMM da sprint — consolida os tickets entregues | `analise-impacto/AIMM-<sprint>.md` | `# AIMM <sprint>` | `tipo: sprint` |

`<CHAVE>` é a chave da ferramenta de origem, como ela é lá — `PDTIC25093-49`, `STRY0012345`. `<sprint>` é como a organização chama o lote: `SP05`, `APIS_PUBLICAS_262-266`. Quem separa as duas para os scripts — o HTML e a rastreabilidade — é o `tipo:` do front-matter, não o nome do arquivo: `SP07-08` tem cara de chave e é uma sprint.

**O título é só a chave — sem a descrição do ticket.** `AIMM PDTIC25093-49`, não `Análise de Impacto — PDTIC25093-49 Fechamento da Etapa de Avaliação`. A descrição envelhece: o ticket é renomeado no Jira, a entrega muda de escopo, e o título passa a divergir da fonte sem que nada acuse. A chave não envelhece, e é por ela que se procura o documento — na lista de arquivos, no menu e na conferência com a ferramenta de origem. O título curto fica no front-matter (`titulo:`) e o que o ticket pede na `## Descrição do ticket`, onde podem ser corrigidos sem renomear nada.

**A chave nunca aparece em caixa de título.** É identificador, não palavra: ninguém procura nem reconhece "Pdtic25093-49". No corpo do documento, escreva-a como a ferramenta escreve.

---

## A estrutura que o gerador espera

- **Front-matter** — a fonte única dos metadados: `ticket`, `ferramenta`, `link`, `titulo`, `sprint`, `estado`, `estado-por` e `estado-em` (na AIMM da sprint, `sprint` e `entrega`). O HTML o mostra como ficha, um campo por linha. Não repita esses campos no corpo: dois lugares para o mesmo dado divergem.
- **Entre o `# AIMM …` e o primeiro `##`, nada.** Um lede em prosa resumindo a AIMM não sai no HTML — o gerador o descarta, porque o título já entrega e a primeira seção repete.
- **Os comentários `<!-- … -->` do template** são instrução: não aparecem no HTML e podem ficar.

Dentro das seções vale o mesmo princípio: **nada de preâmbulo**. Uma seção abre direto no seu primeiro conteúdo — a tabela, o primeiro Agrupamento Funcional. Parágrafo anunciando o que a seção registra, ou blockquote explicando as colunas da tabela logo abaixo, é peso morto: quem chegou na seção de alterações já sabe que ela lista alterações.

Se uma convenção de leitura é mesmo indispensável — uma premissa que muda como a tabela se interpreta —, ela é conteúdo, não preâmbulo: dê a ela um lugar próprio no documento.

---

## O fechamento da AIMM do ticket, seção por seção

Trabalhe nesta ordem. As seções de impacto da AIMM chegam aqui com a visão do que **seria** alterado; o fechamento as reescreve com o que **foi**. O Changelog registra a versão, e o git guarda a anterior — não mantenha as duas visões lado a lado.

**1. `## Funcionalidades`.** A ponte entre o vocabulário do ticket e o da spec. Confira a tabela contra o que foi entregue: funcionalidade que a entrega tocou e não está lá entra agora — e o ticket entra na `## Origem` do N3, porque o elo é recíproco (o `audit-trace-links` confere). A reclassificação NOVA × alteração se decide aqui, funcionalidade a funcionalidade.

**2. `## Alterações em funcionalidades por Agrupamento Funcional`.** Depois de aplicar o delta nos N3, registre o que **efetivamente entrou**. Agrupe por Agrupamento Funcional e traga uma linha por funcionalidade — **incluindo as funcionalidades novas**, senão quem lê vê só metade do trabalho. A primeira célula traz o ID e, **na linha abaixo**, o nome canônico da funcionalidade. Depois vêm os critérios cobertos (`CA-n`, ou `—` quando a fonte não numera), a natureza (`incluída`/`alterada`), o que mudou em relação ao comportamento anterior e a contagem de regras e cenários acrescentados. PFB/PFL não entram na AIMM: a medição é do agente de contagem, fora do Docqui. Para uma funcionalidade nova, proponha o ID pela numeração livre do Agrupamento Funcional — rode o preflight da instância para não colidir — e reconcilie duplicatas: duas análises paralelas costumam propor funcionalidades diferentes para a mesma entrega.

**3. `## Entidades alteradas`.** Agrupe as alterações físicas pela entidade: migração → tabela/coleção e atributo → natureza → contraste. Registre coluna, relacionamento, restrição ou migração, com *Antes*/*Agora* quando existir estado anterior. **Não** classifique ALI/AIE, não informe RLR/DER e não inclua PF nesta seção: a medição é do agente de contagem, fora do Docqui.

**4. `## Impacto em dicionários`.** Mensagens, regras e campos canônicos novos ou alterados.

**5. `## Decisões pendentes`.** Onde o ticket contradiz o publicado, ou falta uma escolha antes de reescrever. Cada decisão precisa dizer **o que trava** se não for tomada.

**6. `## Reconciliação`.** O declarado no changeset × o efetivamente tocado: `node scripts/validate-impact.mjs analise-impacto/AIMM-<CHAVE>.md --git-base <base>`. Declarado e não tocado é escopo não cumprido; tocado e não declarado é desvio — os dois precisam de justificativa escrita. Na AIMM aberta na entrega, diga que não houve escopo prévio.

**7. Estado das funcionalidades.** Cada funcionalidade da `## Funcionalidades` precisa estar no **estado final da esteira** da instância — `implementado` no perfil `completo`, `especificado` no `requisitos` (MASTER → `**Perfil**`) — ou `deprecado`. A funcionalidade alterada pelo ticket ficou em `revisao-necessaria` desde o `PROMPT_4B` (a spec à frente do código): a entrega é o que a devolve — volte o `estado` ao derivado dos gates, rode `python3 scripts/gates.py promote --write` e atualize o Status na `## Funcionalidades` (o `audit-trace-links` compara o Status com o `estado` do N3). Funcionalidade que ficou por especificar não entra na `main` com o ticket: ou sai da `## Funcionalidades` (vai para outro ticket) ou a história não passa no portão da entrega (`valida-entrega`, que roda o `validate-impact --entrega`).

**8. Front-matter e Changelog.** Cada artefato de `## Artefatos impactados` com Status `Validado` ou `Não se aplica` — os que a pessoa ainda não revisou ficam `Especificado` e travam a conclusão. Então `estado: concluído`, com `estado-por` (quem disse que o ticket está concluído — a pessoa, não o agente) e `estado-em` (`AAAA-MM-DD HH:MM ±HH:MM`; no terminal, `date '+%Y-%m-%d %H:%M %:z'`), a `sprint` da entrega e o `avalizado-por` — na AIMM aberta na entrega, o PO que conferiu a visão final —, e uma linha no topo do Changelog registrando a versão final.

O `validate-impact` é o contrato do estado `concluído`, e desde a 9.2.0 ele só exige uma coisa: todo artefato `Validado` ou `Não se aplica` (decisão do PO, 2026-11-01). Sprint, Reconciliação e visão final são o trabalho desta skill, mas não travam a conclusão; o estado final das funcionalidades é cobrado no portão da entrega.

**Na branch da entrega** (MASTER → `**Cadência**`). A `main` só recebe o que foi entregue; o fechamento acontece na branch da unidade de entrega, e o merge dela é a entrega. Na cadência `história`, a branch é `historia/<CHAVE>` e leva só este ticket. Na cadência `sprint`, a branch é `sprint/<id>`: antes de fechar a AIMM da sprint, tire da branch cada ticket que **não** foi entregue — `node scripts/reverte-ticket.mjs <CHAVE>` (simulação) e, conferido, `--write` —, que reverte os commits que citam a chave dele e diz como reaplicá-lo na próxima sprint. O PR para a `main` passa no `node scripts/valida-entrega.mjs`: AIMM da unidade concluída, nenhuma AIMM de ticket aberta na branch e a branch alterando só o que os tickets entregues declaram.

## A AIMM da sprint

Fechadas as AIMMs dos tickets da sprint, escreva `analise-impacto/AIMM-<sprint>.md` a partir do `analise-impacto/_TEMPLATE_AIMM_SPRINT.md`, com `estado-por` e `estado-em` a cada troca de estado, como na AIMM do ticket. Ela não repete as AIMMs dos tickets — consolida:

- **`## Tickets da sprint`** — um ticket por linha, com o link da sua AIMM e o que ele entregou, em uma frase. Os tickets são os de front-matter `sprint:` igual a esta.
- **`## Alterações em funcionalidades por Agrupamento Funcional`** — uma linha por funcionalidade, **uma vez só**, com a(s) chave(s) do ticket na coluna Ticket. Funcionalidade entregue sem ticket na ferramenta entra aqui com `⚠️ sem ticket`: a AIMM da sprint é a única fonte dela.

O `validate-impact` confere a AIMM da sprint com as AIMMs dos tickets da pasta: os mesmos tickets (cada listado com a sua AIMM, de `sprint:` igual, e toda AIMM com esse `sprint:` na lista), cada funcionalidade da **sprint** uma vez, a visão final de cada ticket concluído dentro dela (a funcionalidade que ele alterou, na linha que cita a chave dele) e a natureza — `incluída` se algum ticket da sprint incluiu a funcionalidade, ainda que outro a tenha alterado depois. As entidades alteradas ficam nas AIMMs dos tickets, que a da sprint lista. Em `concluído`, divergência reprova; em `rascunho`, avisa. Por isso a AIMM da sprint se escreve **depois** de fechadas as dos tickets: é a consolidação delas, não uma segunda fonte.

A medição em PF é de um agente de contagem à parte, fora do Docqui: ele lê as AIMMs, os N3 e o DATA-MODEL. A AIMM do ticket dá a rastreabilidade ticket › critério › funcionalidade; a da sprint registra também o que não tem ticket. Numa AIMM anterior, `## Funções de dados alteradas`, `## Apurável da sprint` e as colunas PFB/PFL ficam como estão; o `validate-impact` não as confere.

---

## Como escrever a coluna Mudança

Este é o erro que mais se repete, e o que mais irrita quem lê: descrever **o estado atual** em vez da **mudança**. Quem lê a AIMM já pode ler a spec — o que ela não tem em lugar nenhum é o contraste.

Toda linha de delta abre com o **verbo da mudança** — Inclusão, Alteração, Restrição, Remoção, Correção — e depois traz o contraste explícito: *Antes* … *Agora* …

**Ruim**, porque descreve o que a funcionalidade faz:

> Seleção de estado (UF) com escopo de perfil e andamento da consolidação por estado.

**Bom**, porque diz o que mudou e de quê:

> **Inclusão** do recorte por estado e do andamento da consolidação. *Antes* o painel mostrava a árvore de toda a premiação, com indicadores e busca — **não havia nenhum filtro por UF**, e o Regional via exatamente o mesmo que o Nacional. *Agora* há seleção de estado com escopo de perfil e uma visão de quais estados concluíram a consolidação.

O mesmo vale para o modelo. Não descreva a coluna, diga o que aconteceu com ela: "**Inclusão da coluna** `NR_CLASSIFICADOS` (int, não nulo, padrão 1) — quantos avançam por grupo. *Antes* a etapa não guardava corte nenhum."

Para extrair o "antes" com fidelidade, leia as **linhas removidas** do diff do N3, não o arquivo atual:

```bash
git diff -U0 <commit-antes-do-delta> HEAD -- <arquivo-do-N3> | grep '^-' | grep -v '^---'
```

---

## Separe o que veio do ticket do que veio de outras revisões

Alterações aplicadas na mesma passagem, mas originadas de conferência contra o sistema, não são delta da sprint. Registre-as em bloco à parte, fora da `## Alterações em funcionalidades por Agrupamento Funcional`, ou quem mede a entrega conta a mais.

---

## Formatos de saída

Entregue **os dois**, sempre, com o mesmo conteúdo.

**Markdown** em `analise-impacto/`, no repositório de documentação. Respeite as regras de escrita da instância — no docqui, prosa em linha única, conferida por `node scripts/verifica-texto-corrido.mjs <arquivo>` —, e rode o `validate-impact` em cada AIMM.

**HTML** ao lado, **gerado** por `node scripts/atualiza-pages.mjs` (que chama o `gera-html-impacto.mjs` e os demais derivados do site na ordem certa) — nunca escrito à mão. Ver `references/relatorio-html.md` — inclui as checagens de renderização e a construção da versão standalone para enviar por celular.

Mantenha os dois em sincronia a cada alteração. Divergência entre eles é a falha mais comum e a mais constrangedora, porque o HTML é o que circula.

---

## Quando as respostas chegarem

Uma análise de impacto quase sempre abre perguntas — à equipe de métricas, ao produto. Quando a resposta vier, **não apague a pergunta**: marque como respondida, anexe a resposta e mantenha o registro do que foi considerado e descartado. Quem audita precisa ver o raciocínio, não só a conclusão.

E propague a resposta: se ela derruba um risco que você anotou em âmbar num bloco distante, esse aviso precisa sair também. Uma ressalva órfã sobre um risco já resolvido faz o leitor desconfiar do documento inteiro.

---

## Referências

- `references/relatorio-html.md` — o HTML da AIMM: design system, checagens de renderização no navegador e a versão standalone.

## Scripts

- `scripts/checa-render.mjs` — abre o HTML no Chromium e verifica alinhamento de colunas, estouro horizontal (inclusive em largura de celular), blocos grudados, coluna de chave com o valor partido em duas linhas, e recursos externos que não carregam. Rode antes de dar o documento por pronto.
- `scripts/build-standalone.mjs` — gera a versão autocontida, com as fontes embutidas, para o usuário baixar e encaminhar.
