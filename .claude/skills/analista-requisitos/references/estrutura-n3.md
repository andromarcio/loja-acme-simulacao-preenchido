# Estrutura do N3 — Template de Referência

Espelho do template canônico
`engine/templates/modules/_template-dominio/_template-agrupamento-funcional/_template-funcionalidade.md`:
mesma ordem, mesmos headings, mesma visibilidade. **Em divergência, vale o template** — e o
`scripts/eval/run-evals.mjs` confere que os headings daqui, do esqueleto do `PROMPT_3A`
(PASSO 3) e da estrutura do `PROMPT_3B` (PASSO 6) batem com os dele. As orientações longas
de cada seção (os comentários do template) ficam só no template.

---

## Front-matter (metadados machine-readable)

Todo N3 abre com um bloco YAML que **espelha**, de forma parseável, informações que já estão no corpo. Serve à exportação determinística para o spec-kit (`PROMPT_SPECKIT_EXPORT`) e à esteira de checkpoints — o corpo continua sendo a fonte de verdade legível.

```yaml
---
id: [SIGLA]-[SAF]-[NN]
agrupamento_funcional: [SIGLA]-[SAF]
dominio: [SIGLA]
entidade: [Entidade principal]
data_model_ref: data-models/[dominio].md#[entidade]
endpoints: []                       # preenchido no 3B (espelha ## API) — só p/ funcionalidade que expõe API
error_codes: []                     # preenchido no 3B (espelha ## Mapeamento de erros)
depende_de: []                      # IDs de N3 pré-requisito (ordena fases no spec-kit)
origem:                             # ticket de origem (plugável — ver MASTER.md); omitir se não houver
  tipo: [servicenow | issue | experimento]
  chave: [STRYxxxxxxx | ISSUE-NNN | EXP-…]
estado: rascunho                    # DERIVADO dos gates (scripts/gates.py) — não editar à mão
gates:
  requisitos:   { aprovado: false, por: "", em: "", pr: "" }   # CP1 — PO/Negócio (3A)
  modelo-dados: { aprovado: false, por: "", em: "", pr: "" }   # CP2 — DBA/Arquiteto (DATA-MODEL/3B)
  testes:       { aprovado: false, por: "", em: "", pr: "" }   # CP3 — QA (5B)
  codigo:       { aprovado: false, por: "", em: "", pr: "" }   # CP4 — Tech Lead (code review)
contagem:                           # status de contagem APF — INDEPENDENTE dos gates
  pendente: true                    # há alteração no changelog ainda não revisada para PF
  revisada_em: ""                   # AAAA-MM-DD da última revisão de contagem
  revisada_ate: ""                  # ticket coberto pela revisão (ex.: STRY03800234)
---
```

- `endpoints`/`error_codes`/`data_model_ref` são completados no **3B**. O `PASSO 0` do exporter valida a sincronia front-matter ↔ corpo.
- `estado` é **derivado** dos `gates`: rascunho → requisitos-aprovados → modelo-validado →
  especificado → implementado (manuais: em-desenvolvimento, revisao-necessaria, deprecado).
  `estado: especificado` (CP1→CP3 aprovados) é pré-requisito para exportar ao spec-kit; a partir
  de `em-desenvolvimento`, o `validate-doc.mjs` exige repositório real em `## Implementação`.
- `contagem` é **ortogonal** à esteira: diz se a contagem de PF já foi **revisada** para a
  última alteração do changelog (mesmo que Δ PF = 0). 3A/4A/CRUD/WIZARD/RT/R1/R3 (nova alteração) →
  `pendente: true`; a medição do agente de contagem, fora do Docqui → `pendente: false` +
  `revisada_em`/`revisada_ate`. O `gates.py` ignora este bloco.

---

## Seções negociais (visíveis no Modo PO)

> A `## Superfície` é negocial e fica fora do `dev-only`, logo antes da seção de manifestação que ela decide. A `## Origem` também é negocial, mas é rastreabilidade: fica no fecho, logo antes do `## Changelog`. Seção marcada "só se…" é omitida quando a condição não vale.

````markdown
# [Nome da Funcionalidade]
> **Nível 3** - Agrupamento Funcional: [Nome do Agrupamento Funcional] — Domínio: [Nome do Domínio] - `[SIGLA]-[SAF]-[NN]`

## Descrição

[1º parágrafo — a ENTREGA: 1-2 frases de negócio, única, tangível e negocial (FD-8).
Fórmula: "Permite que [ator] [ação] [entidade], [resultado observável]."]

[2º parágrafo — COMO SE USA: por onde se chega, o que se informa, o que se aciona;
em Job/CLI, o que dispara a execução.]

---

## Regras de negócio

- **RN-01** — [Regra específica desta funcionalidade — uma invariante; a reação do sistema vai para os Cenários]
- **RN-02** — [Regra canônica] → ver RULES-DICTIONARY: [RC-NN] — [nome] (parâmetro: [valor])
- **RN-03** — [Regra de domínio] → ver N1 [Domínio]: Regras transversais do domínio: [N]

<!-- ID `RN-NN`: sequencial na funcionalidade, nunca reaproveitado. Toda regra tem ao menos um cenário com a tag `@RN-NN` na linha acima do `Scenario:`. -->

---

## Cenários

```gherkin
Feature: [Nome da funcionalidade em linguagem natural]

  Background:
    Given que o usuário está autenticado na organização "[org]"

  # ← FIELD-DICTIONARY: [nome do campo] (importar cenários de validação)
  # ← RULES-DICTIONARY: [RC-NN] — [nome da regra] (importar cenários)

  # ── Caminho feliz ──────────────────────────────────────────────

  @RN-01
  Scenario: [descrição]
    Given [estado inicial]
    When [ação]
    Then [resultado]

  # ── Erros de validação ─────────────────────────────────────────

  Scenario: [campo obrigatório ausente / formato inválido]
    ...

  # ── Conflitos com dados existentes ────────────────────────────

  Scenario: [duplicata ou conflito]
    ...

  # ── Restrições de acesso ───────────────────────────────────────
  # Só a reação — quem pode é a matriz "Permissões por perfil" do N2.

  Scenario: [usuário sem acesso a esta funcionalidade]
    Given que o perfil do usuário não tem acesso a "[Nome da funcionalidade]" na matriz do N2
    When o usuário tenta [ação]
    Then o sistema exibe: "[texto de NO_PERMISSION no MESSAGE-DICTIONARY]"

  # ── Estados especiais ──────────────────────────────────────────

  Scenario: [situação especial do sistema]
    ...
```

---

## Campos

<!-- Coluna "Entidade" = rastreabilidade campo→tabela VISÍVEL NO MODO PO: nomeia (por
     referência) a entidade dona do campo — principal por padrão; outra entidade /
     `dado de código` (lista de valores fixos) / `externo: [Sistema]` / `derivado ↓` quando
     for o caso. Nunca campo banco/Label Dev (o detalhe técnico fica no dev-only). -->

| Label PO | Entidade | Preenchimento | Edição | Tipo | Obrigatório | Validação |
|---|---|---|---|---|---|---|
| [nome em português] | [entidade principal / outra entidade / `dado de código` / `externo: [Sistema]` / `derivado ↓`] | [entrada do usuário / calculado / externo: [Fonte] / exibido do cadastro] | [editável / somente leitura / imutável] | [texto / número / data / lista de opções / `seleção → [Entidade]` / sim·não / arquivo] | sim / não | [regra em linguagem natural] |
| [campo canônico] | [entidade] | entrada do usuário | editável | [tipo] | [obrig.] | → ver FIELD-DICTIONARY: [nome] |

---

## Derivações
<!-- Só se houver campo calculado (`derivado ↓` na coluna Entidade): fórmula em Label PO +
     campos-fonte com a entidade de cada um — é daqui que a APF lê as entidades-fonte (ALR). -->

| Campo derivado | Fórmula (Label PO) | Campos-fonte (Entidade) |
|---|---|---|
| [campo] | [expressão — ex.: Quantidade × Preço unitário] | [Campo A (Entidade X), Campo B (Entidade Y)] |

---

## Colunas do resultado
<!-- Só em funcionalidade de Pesquisa/Listagem — o validador exige a seção nelas. -->

| Coluna (Label PO) | Origem | Ordenação |
|---|---|---|
| [campo exibido] | cadastro / entidade relacionada / derivado | padrão ↑ / ordenável / — |

---

## Campos automáticos

| Label PO | Valor | Quando |
|---|---|---|
| [campo] | [valor automático] | [quando é preenchido] |

---

## Dados lidos e gravados
<!-- Só se a funcionalidade lê ou grava entidade SEM contribuir campo para a tela (o registro de
     execução que recebe o status, o cronograma que define a janela). Completa a coluna
     Entidade de ## Campos — não a repete. É fonte do ALR da contagem. -->

| Entidade | Papel | Por que a funcionalidade a toca |
|---|---|---|
| [Entidade] | [lê / grava / lê e grava] | [o que a funcionalidade faz com ela — cite a regra que a motiva] |

---

## Superfície

**[Tela própria | Modal | Ação em tela | CLI | Job/Pipeline | API]** — [tela própria: rota `/...` · modal: origem: [Funcionalidade/Tela] · ação em tela: origem: [Funcionalidade/Tela] · CLI: comando · Job/Pipeline: gatilho · API: consumidor]

<!-- MAIS DE UMA ROTA? Escreva em LISTA, uma linha por rota, com o critério que as
     distingue à esquerda (tipo, canal, variante) — em parágrafo corrido não se
     percebe quantas são. A ressalva (⚠️) vai em parágrafo DEPOIS da lista. Exemplo:

     **Tela própria** — são **três** rotas, uma por canal e tipo de cliente:

     - Administrador — `/clientes/novo`
     - Autocadastro · Pessoa Física — `/cadastro/pessoa-fisica`
     - Autocadastro · Pessoa Jurídica — `/cadastro/pessoa-juridica` -->

**Fidelidade ao protótipo**: [obrigatória | referência | n/a] · [caminho do protótipo quando houver] · [[abrir o protótipo ↗](../../../prototypes/[dominio]/[agrupamento-funcional]/[funcionalidade]/[estado].html)]

<!-- O validador usa a Superfície para exigir a seção de manifestação certa:
     Tela própria/Modal/Ação em tela → ## Comportamento de tela
     CLI/Job/Pipeline/API     → ## Execução e operação (no lugar) -->

---

## Comportamento de tela
<!-- Quando a Superfície é Tela própria/Modal/Ação em tela. Para CLI/Job/Pipeline/API, omita e use "## Execução e operação". -->

### Onde fica
[em qual rota e componente a funcionalidade aparece]

### Estados da tela

| Estado | Comportamento |
|---|---|
| Loading | [o que exibir durante o processamento] |
| Erro de validação | [como exibir erros de campo] |
| Erro de servidor | [toast ou mensagem genérica] |
| Sucesso | [toast, redirecionamento ou relatório] |
| Empty state | [quando e o que exibir se não há dados] |

---

## Execução e operação
<!-- Quando a Superfície é CLI/Job/Pipeline/API — substitui "## Comportamento de tela". -->

### Como executa
### Parâmetros de execução
### Interrupção e reexecução
### Saídas e artefatos
### Acompanhamento

---

## Critérios de sucesso

| # | Critério mensurável | Origem |
|---|---|---|
| SC-01 | [resultado observável e medível, agnóstico de tecnologia] | [cenário / → ver NFR: [ID] / negócio] |

---

## Métricas de tamanho

| Função de Transação | Papel | Tipo | ALR | DER | Complexidade | PF | Data |
|---|---|---|---|---|---|---|---|
| [nome do PE] | [principal / acessório] | [EE / SE / CE] | [N] | [N] | Baixa / Média / Alta | [PF] | [AAAA-MM-DD] |

### Memória de cálculo

**[nome do PE]** — [EE/SE/CE] · ALR [N] · DER [N] · [complexidade] · [N] PF

```json
{"pe": "[nome do PE]",
 "alr": ["[Entidade]", "[Entidade]"],
 "der": ["[campo]", "[campo]", "Mensagem", "Ação"],
 "nao_contados": "[o que ficou de fora e por quê]"}
```

Por que cada ALR:
1. `[Entidade]` — [o que a transação lê ou grava aí]

**Total: [N] PF**
````

> **Métricas de tamanho** é preenchida pelo agente de contagem, fora do Docqui — nenhum prompt do Docqui a gera. Memória obrigatória em toda linha contada, com a enumeração no bloco ```json (listas de nomes, do tamanho do ALR e do DER — gate F8); funcionalidade que não é processo elementar fica como linha com PF 0 e `—`, e o bloco `{"pe", "motivo"}`. Ver `global/SIZING.md`.

> **Mapeamento de cenários → spec.md** (na exportação): "Caminho feliz" + "Erros de
> validação" viram *Acceptance Scenarios*; "Conflitos com dados existentes" + "Estados
> especiais" viram *Edge Cases*; "Restrições de acesso" viram cenários + princípio de
> autorização na *constitution*. Os "Critérios de sucesso" viram *Success Criteria (SC-###)*.

---

## Seções técnicas (dentro de `dev-only`, geradas pelo 3B)

````markdown
<div class="dev-only">

## Mapeamento de campos
→ ver DATA-MODEL.md: Entidade [Nome da Entidade]

---

## Cenários técnicos adicionais

```gherkin
  # ── Comportamento técnico ──────────────────────────────────────

  Scenario: [cenário técnico — sessão, cookies, formato de erro HTTP, jobs]
    Given [estado técnico]
    When [ação técnica]
    Then [resultado técnico com formato JSON ou HTTP status]
```

---

## Mapeamento de erros (código interno → mensagem ao usuário)

| Código | HTTP | Mensagem exibida ao usuário |
|---|---|---|
| `[ENTIDADE_ERRO]` | [código] | "[mensagem em português]" |

---

## API

### [MÉTODO] /api/v1/[rota]
**Acesso**: [público / autenticado — roles]

**Requisição** (tabela `Campo | Tipo | Obrigatório | Label PO`) · **Resposta de sucesso** (HTTP + tabela `Campo | Tipo | Label PO`) · **Respostas de erro** (HTTP | Code | Situação). Label PO = campo da funcionalidade, ou `—` se técnico; conferência: `node scripts/valida-contrato-api.mjs`

---

## Eventos

### Publicados
| Evento | Quando | Payload | Consumidores |
|---|---|---|---|

### Consumidos
| Evento | Publicado por | Reação |
|---|---|---|

---

## AuditLog

[`logAction({ … })` com os campos relevantes em Label Dev — materializa o NFR AUD-01]

---

## Arquivos a criar ou alterar

```
[caminho/arquivo]     ← [o que faz]
```

---

## Dependências

- **[Lib/Serviço]** — [para que é usado]

---

## Implementação

| Item | Repositório | Caminho | Branch/Tag |
|---|---|---|---|
| [endpoint/componente/job] | [repo — existe em repos/INDEX.md] | [caminho no repo] | `main` |

**Status**: definido pela esteira de checkpoints no front-matter (`estado` + `gates`) — não duplicar aqui.

---

</div>
````

A coluna **Repositório** é preenchida **no 3B** (PASSO 5), com nomes que existem em `repos/INDEX.md` — é ela que diz ao implementador em qual repo (MFE, microsserviço, back, front) cada parte da funcionalidade nasce ou evolui. `Caminho` e `Branch/Tag` podem ficar como placeholder até o dev. A partir de `estado: em-desenvolvimento`, o `validate-doc.mjs` exige ao menos uma linha com repositório real.

---

## Fecho (visível)

````markdown
## Origem
<!-- Só se houver ticket de origem (ServiceNow, issue, experimento); senão, omita a seção. -->

| Ticket (AIMM) | Tipo | Critérios cobertos |
|---|---|---|
| [`STRYxxxxxxx | ISSUE-NNN | EXP-…`](../../../analise-impacto/AIMM-[CHAVE].md) | Criação / Alteração | `CA-1, CA-4` — [o que esta funcionalidade realiza desses critérios] |

---

## Changelog

<!-- Ordem decrescente por data: a entrada mais recente fica sempre no topo, logo abaixo do cabeçalho. -->

| Data | Autor | Tipo | Descrição |
|---|---|---|---|
| 2026-10-20 | Docqui Caixa | Terminologia | Adoção de AIMM; histórico anterior preservado. |
| [AAAA-MM-DD] | [autor] | Funcionalidade criada | [descrição] |

---

*Agrupamento Funcional: [Nome] · Domínio: [Nome] · Última revisão: —*

*Links: [N2 do Agrupamento Funcional](./README.md) · [N1 do domínio](../README.md) · [INDEX geral](../../INDEX.md)*
````

---

## Convenção de visibilidade

Seções negociais ficam **fora** da tag `dev-only`, inclusive a `## Superfície`. Seções técnicas ficam **dentro**.

```html
<!-- Negocial — visível para todos -->
## Seção de negócio

<div class="dev-only">
<!-- Técnico — apenas para devs -->
## Seção técnica
</div>
```
