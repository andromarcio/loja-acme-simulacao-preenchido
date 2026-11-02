# Índice geral de módulos
> Visão consolidada de todos os domínios do sistema.
> Mantido via PROMPT 1A/1B — atualizar após cada N1 aprovado.

---

## Domínios

| Domínio | Pasta | Responsabilidade | Agrupamentos Funcionais |
|---|---|---|---|
| [Nome do Domínio](./[dominio]/README.md) | `modules/[dominio]/` | [responsabilidade em uma frase] | [N] |

---

## Rastreabilidade: ticket → spec → código

| Ticket (AIMM) | Funcionalidade | Domínio | Status | Contagem | PF | CFP | Repositórios |
|---|---|---|---|---|---|---|---|
| [`STRYxxxxxxx`](../analise-impacto/AIMM-[CHAVE].md) | [[SIGLA]-[SAF]-[NN]: Nome da Funcionalidade](./[dominio]/[agrupamento-funcional]/[funcionalidade].md) | [Domínio] | ✏️ Rascunho | 📋 | — | — | — |

<!--
  Ticket: chave do ticket que originou ou alterou a funcionalidade (seção "Origem" do N3),
  com o link da AIMM do ticket (`analise-impacto/AIMM-<CHAVE>.md`).
  Uma funcionalidade pode ter mais de um ticket; um ticket, mais de uma funcionalidade.
  Status: o `estado` do front-matter do N3, com o ícone da legenda abaixo — um N3
    recém-gerado é ✏️ Rascunho. Avança com os gates (um PR por checkpoint, que
    regenera a seção Esteira de checkpoints); nunca se escreve adiantado. Vale o mesmo
    na ## Funcionalidades da AIMM do ticket: o audit compara as duas.
  PF: preenchido pelo agente de contagem, fora do Docqui, a partir da ## Métricas de
    tamanho do N3 — os prompts do Docqui não contam. Ver critérios em global/SIZING.md.
  Contagem: status de contagem APF da funcionalidade — espelha `contagem.pendente` do
    front-matter do N3 (INDEPENDENTE dos gates/Status). ✅ = contada (revisão de PF
    feita para a última alteração do changelog, mesmo Δ PF = 0) · 📋 = pendente
    (há alteração ainda não revisada). Alteração de spec (3A/4A/CRUD/WIZARD/RT/R1/R3) → 📋;
    revisão pelo agente de contagem, fora do Docqui → ✅.
  Totais vigentes excluem funcionalidades ❌ Deprecadas.

  GATES DETERMINÍSTICOS desta tabela:
  - `node scripts/audit-trace-links.mjs` prova que cada par ticket↔funcionalidade está
    nos TRÊS lugares (## Origem do N3 + ## Funcionalidades da AIMM + esta linha)
    — roda no hook de gravação e no CI (engine/templates/ci/spec-guard.yml).
  - `node scripts/suspect-links.mjs --mark` troca o Status para ⚠️ Revisão necessária
    quando o outro lado do elo mudou depois da última verificação (carimbos
    trace-verified). O ⚠️ gravado por ele é tolerado pelo audit até a reverificação.
-->

**Total vigente: — PF · — CFP** *(dimensionamento pendente — o agente de contagem, fora do Docqui, registra o total depois da revisão; critérios em `global/SIZING.md`)*

---

<!-- GATES:INICIO -->
## Esteira de checkpoints (gates)

> ⚙️ **Seção gerada por `scripts/gates.py` — não editar à mão.** Espelha o estado de cada funcionalidade na esteira (CP1 requisitos (PO/Negócio) → CP2 modelo-dados (DBA/Arquiteto) → CP3 testes (QA) → CP4 codigo (Tech Lead)). Reflete o estado em **[AAAA-MM-DD]**.

_Nenhuma funcionalidade com esteira de gates ainda._
<!-- GATES:FIM -->

---

<!-- PENDENCIAS:INICIO -->
## Pendências de especificação

> ⚙️ **Seção gerada pelo PROMPT_PENDENCIAS (PD) — não editar à mão.**
> Varre as fontes (AIMMs em `analise-impacto/`, READMEs de N2, N3 com ⚠️) e espelha aqui o que está
> **pendente de especificar**. Edições manuais entre os marcadores são sobrescritas na
> próxima execução. Reflete o estado em **[AAAA-MM-DD]** — rode o **PD** para atualizar.

### Existência (falta N3)

> Algo é conhecido como necessário mas ainda **não tem N3**. Resolva pela rota indicada.

| Item | Nível | Origem | Rota |
|---|---|---|---|
| [Cancelar pedido] | N3 | [`STRYxxxxxxx`](../analise-impacto/AIMM-[CHAVE].md) · N2 [Agrupamento Funcional] | 3A |

### Conteúdo (⚠️ em aberto)

> O artefato **existe**, mas tem lacunas/suposições aguardando esclarecimento.

| Funcionalidade | Lacuna | Arquivo |
|---|---|---|
| [Nome da funcionalidade] | [pergunta em aberto, ex.: idade mínima exigida?] | [arquivo.md](./[dominio]/[agrupamento-funcional]/[funcionalidade].md) |
<!-- PENDENCIAS:FIM -->

---

## Entidades consolidadas

| Entidade | Domínio | N1 de origem |
|---|---|---|
| [Nome da Entidade] | [Domínio] | [[dominio]/README.md](./[dominio]/README.md) |

---

## Eventos do sistema

| Evento | Publicado por | Consumido por | Payload principal |
|---|---|---|---|
| `[entidade.acao]` | [Domínio] | [Domínio] | `{ [campos] }` |

---

## Mapa de integrações entre domínios

| Domínio origem | Depende de | Tipo | Descrição |
|---|---|---|---|
| [Domínio] | [Domínio] | Leitura / Escrita / Evento | [o que consome e como] |

---

## Legenda de status

Estados da **esteira de checkpoints**, derivados dos `gates` no front-matter de cada N3. A próxima etapa só ocorre após a aprovação da anterior — ordem: requisitos → modelo-dados → testes → código.

| Ícone | Estado | Checkpoint | Descrição |
|---|---|---|---|
| ✏️ | rascunho | — | N3 em elaboração, nenhum gate aprovado |
| 📝 | requisitos-aprovados | CP1 (PO) | Requisitos validados — aguardando modelo de dados |
| 🧱 | modelo-validado | CP2 (DBA) | Modelo físico de dados validado — aguardando testes |
| 📋 | especificado | CP3 (QA) · CP2 no perfil `requisitos` | **Pronto para desenvolvimento** (CP1+CP2+CP3 aprovados; no perfil `requisitos`, CP1+CP2 — o estado final da esteira dele) |
| 🔄 | em-desenvolvimento | — | Implementação em andamento (estado manual) |
| ✅ | implementado | CP4 (code review) | Em produção, rastreabilidade preenchida |
| ⚠️ | revisao-necessaria | — | Spec e código (ou spec e ticket) divergem — a spec mudou depois da implementação, o código mudou sem a spec, ou o outro lado de um elo mudou (estado manual; o `suspect-links` também o marca) |
| ❌ | deprecado | — | Funcionalidade removida do sistema |
