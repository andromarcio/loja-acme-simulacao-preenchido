<!-- docqui: {{VERSION}} | prompt: PROMPT_AIMM | atualizado: {{YYYY-MM-DD}} -->
---
tipo: ticket
ticket: [STRYxxxxxxx | ISSUE-NNN | EXP-… | PDTIC…-NN]
ferramenta: [ServiceNow | Jira | GitHub | experimento]
link: [URL do ticket na ferramenta de origem]
titulo: [título curto do ticket]
estado: em-análise        # em-análise → escopo-aprovado → em-execução → concluído
estado-por: ""            # quem aprovou o que levou a AIMM ao estado atual — a pessoa, não o agente
estado-em: ""             # quando: AAAA-MM-DD HH:MM ±HH:MM (data, hora e fuso)
aberta-na-entrega: false  # true quando a AIMM nasce depois da entrega (skill analise-impacto)
sprint: ""                # sprint da entrega — preenchida no fechamento
avalizado-por: ""         # aval do PO no escopo — obrigatório de escopo-aprovado em diante
aberta-em: [AAAA-MM-DD]
---

<!--
  AIMM — ANÁLISE DE IMPACTO DO TICKET. Um arquivo por ticket, em
  `analise-impacto/AIMM-<CHAVE>.md` (a chave como a ferramenta a escreve:
  `AIMM-STRY0012345.md`, `AIMM-PDTIC25093-49.md`). É o único artefato do ticket no
  framework: o que o ticket pede, o que ele vai mudar e, no fim, o que ele mudou.
  A AIMM é VERSIONADA à medida que o ticket avança — o Changelog registra cada versão
  e o git guarda as anteriores:

    em-análise       aberta completa: o ticket, as Funcionalidades e o que SERÁ alterado, com
                     todas as seções de impacto preenchidas (PROMPT_AIMM, passos 1–5)
    escopo-aprovado  o PO avalizou o escopo (`avalizado-por`) — só então a spec muda (passo 6)
    em-execução      as passadas de spec e código, uma por linha do changeset
    concluído        todo artefato do changeset (Artefatos impactados) Validado ou Não se aplica;
                     basta alguém dizer ao agente que o ticket está concluído (skill
                     analise-impacto, PROMPT_AIMM passo 7)

  Front-matter: fonte única dos metadados — o HTML da AIMM o mostra como ficha.
    ticket · ferramenta · link · titulo → o ticket na ferramenta de origem; a chave é a
      FONTE DE VERDADE e o identificador em toda a rastreabilidade (o framework não
      cria ID próprio para o ticket).
    aberta-na-entrega → a AIMM nasceu depois da entrega, sem escopo prévio a
      reconciliar: C2 e C3 viram aviso, e a Reconciliação diz isso.
    sprint → a sprint em que o ticket foi entregue; é por ela que a AIMM da sprint
      (`analise-impacto/AIMM-<sprint>.md`) consolida os tickets.
  Dentro do front-matter, comentário só no fim da linha: linha que começa com `#` seria
  lida como o título do arquivo.
-->

# AIMM [CHAVE]

## Descrição do ticket

<!--
  TRANSCRIÇÃO, não formulação. Cole aqui a descrição como ela está na ferramenta de
  origem. Se a fonte enuncia no formato Como/quero/para, transcreva nesse formato; se
  enuncia em prosa, transcreva a prosa. NUNCA converta uma na outra nem componha um
  Como/quero/para que a fonte não tem — derivá-lo inventa persona e valor que ninguém
  aprovou. O que a fonte não diz se elicita com o PO e, até ele decidir, fica em
  `## Decisões pendentes`.
-->

> Transcrição da descrição do ticket `[CHAVE]` na ferramenta de origem.

[o texto da fonte, como está]

## Critérios de aceite

<!--
  Cada critério é analisado no N3 e vira regra de negócio (se expressa uma invariante),
  um `## Cenários` (Gherkin, se descreve comportamento observável) ou os dois.

  NUMERAÇÃO `CA-n` — a AIMM da sprint cita o critério pelo número, para o cliente
  conferir lado a lado com a ferramenta. Só numere quando a FONTE numerar, e com o MESMO
  número dela. Se a fonte traz os critérios como bullets, prosa ou sub-seções, NÃO
  invente número: deixe a lista sem `CA-n` e declare isso abaixo — a rastreabilidade
  fica pela chave do ticket, e a coluna CA-n sai `—`. Número inventado aqui vira número
  errado no relatório do cliente.
-->

> **Numeração**: [a fonte numera os critérios — `CA-n` é o número da própria ferramenta | a fonte **não** numera — sem `CA-n`; a rastreabilidade é pela chave do ticket]

```gherkin
# ── CA-1 ───────────────────────────────────────────────────
Scenario: [resultado esperado em linguagem de negócio]
  Given [estado inicial]
  When [ação do usuário]
  Then [resultado observável]
```

## Funcionalidades

<!--
  As funcionalidades (N3) que realizam o ticket. Relação M:N: um ticket pode ser realizado por
  várias funcionalidades, e uma funcionalidade atende a vários tickets. É o elo recíproco da
  `## Origem` de cada N3 — os dois lados precisam dizer o mesmo, e o
  `audit-trace-links` confere. Preencha no roteamento (PROMPT_AIMM, passo 3) e mantenha
  o Status em dia (o ícone do `estado` do N3, da legenda do modules/INDEX.md). Funcionalidade
  que o ticket cria e que ainda não tem N3: nome proposto, *(a confirmar no 3A)* e o
  Status `📋 A especificar` — o `audit-trace-links` a trata como pendência até o 3A
  criá-la e trocar o Status.

  A união dos `CA-n` das funcionalidades é o conjunto de critérios do ticket: nenhum repetido
  entre funcionalidades, nenhum faltando. Critério sobrando é funcionalidade que falta; critério
  repetido é fronteira mal traçada entre duas funcionalidades.

  CARIMBO DE VERIFICAÇÃO (elo suspeito): depois de fechar ou rever o elo, rode
  `node scripts/suspect-links.mjs --stamp --file <este arquivo>` — ele grava aqui um
  comentário `<!- - trace-verified: [ID da funcionalidade] @ fingerprint - ->` por funcionalidade. Se
  a Descrição ou os Critérios mudarem depois disso, o `suspect-links` acusa o elo como
  suspeito. Não edite os carimbos à mão.
-->

| Funcionalidade (N3) | Domínio · Agrupamento Funcional | Operação | Critérios cobertos | Status |
|---|---|---|---|---|
| [`SIGLA-SAF-NN`: Nome da Funcionalidade](../modules/[dominio]/[agrupamento-funcional]/f-[slug].md) | [Domínio] · [Agrupamento Funcional] | Criação / Alteração | `CA-1, CA-3` | ✏️ Rascunho |

## Artefatos impactados

> O **changeset**: os artefatos de documentação que o ticket vai criar ou alterar,
> aprovados pelo PO ANTES de qualquer um deles mudar. Linhas `derivado:` nascem dos elos
> (`node scripts/generate-impact-draft.mjs --aimm <este arquivo>`); linhas `elicitado`
> vêm da passada do analista (NFR e limiares de teste não-funcional não são deriváveis).
> Só documentação entra aqui — código e artefatos técnicos (SDD, migração, runbook)
> derivam destes e ficam fora do aval.
>
> Invariantes (o `validate-impact` cobra): **C1** ao menos uma linha `N3`; **C2** toda
> linha `funcional` tem uma linha `QA`; **C3** toda linha `não-funcional` tem `NFR`
> **e** `QA`. No perfil `requisitos` não há linha `QA` (sem checkpoint de testes): a falta
> dela é aviso, e a linha de exemplo abaixo sai.
>
> **Status** de cada artefato: `Pendente` (ainda não especificado) → `Especificado` (o agente
> gravou e avisou que está pronto para revisar) → `Validado` (a pessoa revisou e aprovou,
> depois). `Não se aplica` marca o artefato previsto que deixou de ser necessário. A AIMM só
> vai a `concluído` com todos `Validado` ou `Não se aplica`.

| Artefato | Tipo | Operação | Seção | Natureza | O quê | Proveniência | Status |
|---|---|---|---|---|---|---|---|
| `modules/<dom>/<fs>/f-<slug>.md` | N3 | alterar | Campos/Regras/Cenários | funcional | [o que muda] | derivado: âncora | Pendente |
| `qa/<dom>/<fs>/<slug>.md` | QA | criar | — | funcional | plano E2E | derivado: espelho do N3 | Pendente |

> Tipos: `N1 · N2 · N3 · QA · DATA-MODEL · FIELD-DICT · RULES-DICT · MESSAGE-DICT · ERROR-DICT ·
> NFR · PATTERNS · API-PATTERNS · MÉTRICA · PROTÓTIPO · REPOSITÓRIO`.
> Operação: `criar | alterar | deprecar`.

## Alterações em funcionalidades por Agrupamento Funcional

<!--
  O DELTA FUNCIONAL, por Agrupamento Funcional, uma linha por funcionalidade — as novas também.
  Até a entrega, é o PREVISTO; no fechamento, é o que FOI aplicado nos N3.

  Coluna Mudança: abra com o verbo da mudança (Inclusão, Alteração, Restrição, Remoção,
  Correção) e traga o contraste: *Antes* … *Agora* … — não descreva o estado atual da
  funcionalidade, diga o que mudou e de quê.
  Natureza: `incluída` ou `alterada`. A AIMM não traz PF: a medição é do agente de
  contagem, fora do Docqui.
-->

### [Agrupamento Funcional]

| Funcionalidade | CA-n | Natureza | Mudança | Regras | Cenários |
|---|---|---|---|---|---|
| `SIGLA-SAF-NN`<br>**[Nome da Funcionalidade]** | CA-1 | alterada | **[Verbo]** de [o quê]. *Antes* [como era]. *Agora* [como fica]. | +1 | +2 |

## Entidades alteradas

<!--
  As alterações no modelo de dados agrupadas por ENTIDADE: tabela/coleção, atributos,
  relacionamentos, restrições e migração associada. Descreva o contraste *Antes*/*Agora*
  quando houver estado anterior. Não classifique ALI/AIE, não informe RLR/DER e não
  inclua PF: a medição é do agente de contagem, fora do Docqui.
  Sem alteração de entidade, escreva "Nenhuma." e apague o exemplo.
-->

### [Entidade]

| Migração | Tabela / atributo | Natureza | Mudança |
|---|---|---|---|
| [V000NN] | `[TABELA.COLUNA]` | coluna incluída | **Inclusão** de [o quê]. *Antes* [como era]. |

## Impacto em dicionários

- [mensagens, regras e campos canônicos novos ou alterados — ou "Nenhum."]

## Decisões pendentes

- [onde o ticket contradiz o publicado, ou falta uma escolha — e o que TRAVA se ela não for tomada; ou "Nenhuma."]

## Reconciliação

> Preenchida no fechamento (estado `concluído`): artefatos **declarados** no changeset ×
> artefatos **efetivamente tocados** no diff/PR. Rodar:
> `node scripts/validate-impact.mjs analise-impacto/AIMM-<CHAVE>.md --git-base <base>`.
> Declarado-e-não-tocado = escopo não cumprido; tocado-e-não-declarado = desvio — os dois
> precisam de justificativa. AIMM aberta na entrega: diga que não houve escopo prévio.
> Escreva o resultado abaixo desta citação — ela é instrução e pode ficar.

## Changelog

<!-- Ordem decrescente por data: a versão mais recente fica no topo. Cada mudança de estado é uma versão. -->

| Data | Autor | Tipo | Descrição |
|---|---|---|---|
| 2026-10-20 | Docqui Caixa | Terminologia | Adoção de AIMM; histórico anterior preservado. |
| [AAAA-MM-DD] | [autor] | AIM aberta | ticket `[CHAVE]` registrado; funcionalidades mapeadas |
