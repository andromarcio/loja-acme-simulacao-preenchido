<!-- docqui: 9.1.0 | prompt: MIGRA_AIMM_ESTADO | atualizado: 2026-10-31 -->
---
tipo: ticket
ticket: STRY0013180
ferramenta: ServiceNow fictício
link: ../mentoria/backlog.md#stry0013180--destaques-da-página-inicial
titulo: Destaques da página inicial
estado: em-análise
estado-por: "Claude"
estado-em: 2026-10-31 00:16 +00:00
aberta-na-entrega: false
sprint: ""
avalizado-por: ""
aberta-em: 2026-10-18
---

# AIMM STRY0013180

## Descrição do ticket

> Transcrição do ticket fictício do backlog da demonstração; não é um registro do ServiceNow real.

A equipe de vendas precisa escolher quais produtos aparecem em destaque na página inicial da loja, com uma chamada, a ordem e o período em que cada destaque fica no ar.

## Critérios de aceite

> **Numeração**: a fonte fictícia numera os critérios; os números CA-n abaixo são os mesmos do backlog.

| Critério | Descrição |
|---|---|
| CA-1 | A equipe pesquisa os destaques por produto e por situação (programado, vigente ou encerrado). |
| CA-2 | O destaque é cadastrado com produto, chamada, ordem de exibição e período de vigência; o fim não pode ser anterior ao início, e o mesmo produto não pode ter dois destaques no mesmo período. |
| CA-3 | A equipe altera a chamada, a ordem e o período de um destaque, mas não troca o produto; destaque encerrado não pode ser alterado. |
| CA-4 | A equipe exclui um destaque, que sai da página inicial. |
| CA-5 | A equipe consulta todos os dados de um destaque. |

## Funcionalidades

| Funcionalidade (N3) | Domínio · Agrupamento Funcional | Operação | Critérios cobertos | Status |
|---|---|---|---|---|
| [`VIT-DST-01`: Pesquisar Destaques](../modules/vitrine/destaques/f-pesquisar-destaque.md) | Vitrine · Destaques | Criação | `CA-1` | 📋 Especificado |
| [`VIT-DST-02`: Cadastrar Destaque](../modules/vitrine/destaques/f-cadastrar-destaque.md) | Vitrine · Destaques | Criação | `CA-2` | 📋 Especificado |
| [`VIT-DST-03`: Editar Destaque](../modules/vitrine/destaques/f-editar-destaque.md) | Vitrine · Destaques | Criação | `CA-3` | 📋 Especificado |
| [`VIT-DST-04`: Excluir Destaque](../modules/vitrine/destaques/f-excluir-destaque.md) | Vitrine · Destaques | Criação | `CA-4` | 📋 Especificado |
| [`VIT-DST-05`: Visualizar Destaque](../modules/vitrine/destaques/f-visualizar-destaque.md) | Vitrine · Destaques | Criação | `CA-5` | 📋 Especificado |

## Artefatos impactados

O changeset abaixo descreve o pacote didático. Não há aval de PO registrado; os arquivos preenchidos são material de demonstração.

| Artefato | Tipo | Operação | Seção | Natureza | O quê | Proveniência |
|---|---|---|---|---|---|---|
| `modules/vitrine/README.md` | N1 | alterar | Agrupamentos Funcionais | funcional | Destaques entra entre os Agrupamentos Funcionais da Vitrine | elicitado |
| `modules/vitrine/destaques/README.md` | N2 | criar | — | funcional | CRUD de Destaques, telas e permissões | elicitado |
| `modules/vitrine/destaques/f-pesquisar-destaque.md` | N3 | criar | — | funcional | VIT-DST-01 — Pesquisar Destaques | derivado: âncora |
| `modules/vitrine/destaques/f-cadastrar-destaque.md` | N3 | criar | — | funcional | VIT-DST-02 — Cadastrar Destaque | derivado: âncora |
| `modules/vitrine/destaques/f-editar-destaque.md` | N3 | criar | — | funcional | VIT-DST-03 — Editar Destaque | derivado: âncora |
| `modules/vitrine/destaques/f-excluir-destaque.md` | N3 | criar | — | funcional | VIT-DST-04 — Excluir Destaque | derivado: âncora |
| `modules/vitrine/destaques/f-visualizar-destaque.md` | N3 | criar | — | funcional | VIT-DST-05 — Visualizar Destaque | derivado: âncora |
| `global/DATA-MODEL.md` | DATA-MODEL | alterar | Modelos por domínio | funcional | Índice do modelo de Vitrine | elicitado |
| `global/data-models/vitrine.md` | DATA-MODEL | criar | — | funcional | Destaque, com a massa da demonstração | elicitado |
| `global/FIELD-DICTIONARY.md` | FIELD-DICT | alterar | Data futura | funcional | Entrada trabalhada de Data futura | elicitado |
| `global/RULES-DICTIONARY.md` | RULES-DICT | alterar | RC-03 | funcional | Entrada trabalhada de RC-03 — Período de vigência | elicitado |
| `global/MESSAGE-DICTIONARY.md` | MESSAGE-DICT | alterar | Vitrine | funcional | Ordem inválida, destaque sobreposto e destaque encerrado | elicitado |
| `prototypes/vitrine/destaques/flow.html` | PROTÓTIPO | criar | — | funcional | Pesquisa, cadastro, edição e visualização de destaques | derivado: espelho do N2 |

## Alterações em funcionalidades por Agrupamento Funcional

### Destaques

| Funcionalidade | CA-n | Natureza | Mudança | Regras | Cenários |
| --- | --- | --- | --- | --- | --- |
| `VIT-DST-01`<br>**Pesquisar Destaques** | CA-1 | incluída | **Inclusão** da funcionalidade. *Antes*: não havia N3. *Agora*: encontrar destaques por produto e situação. | +2 | +10 |
| `VIT-DST-02`<br>**Cadastrar Destaque** | CA-2 | incluída | **Inclusão** da funcionalidade. *Antes*: não havia N3. *Agora*: pôr um produto em destaque, com chamada, ordem e vigência. | +4 | +11 |
| `VIT-DST-03`<br>**Editar Destaque** | CA-3 | incluída | **Inclusão** da funcionalidade. *Antes*: não havia N3. *Agora*: alterar a chamada, a ordem e a vigência. | +6 | +13 |
| `VIT-DST-04`<br>**Excluir Destaque** | CA-4 | incluída | **Inclusão** da funcionalidade. *Antes*: não havia N3. *Agora*: tirar um destaque da página inicial. | +3 | +6 |
| `VIT-DST-05`<br>**Visualizar Destaque** | CA-5 | incluída | **Inclusão** da funcionalidade. *Antes*: não havia N3. *Agora*: ver todos os dados de um destaque. | +2 | +6 |

## Entidades alteradas

Modelo negocial de Destaque, sem alterações físicas ou contagem ALI/AIE. A situação do destaque é derivada das datas, não guardada.

## Impacto em dicionários

- Data futura recebe entrada trabalhada no FIELD-DICTIONARY.
- RC-03 — Período de vigência recebe entrada trabalhada no RULES-DICTIONARY.
- Mensagens de Vitrine: `VIT_ORDEM_INVALIDA`, `VIT_DESTAQUE_SOBREPOSTO` e `VIT_DESTAQUE_ENCERRADO`.

## Decisões pendentes

- O responsável real deve revisar o escopo e conduzir CP1/CP2 antes de qualquer entrega.
- A contagem será feita via CT; nenhum PF foi estimado.
- O empate de ordem de exibição entre destaques vigentes é desfeito pela data de cadastro; a PO pode preferir proibir o empate.

## Reconciliação

Não encerrada. Esta AIMM está em análise e não declara entrega, aprovação de escopo ou aprovação dos gates.

## Changelog

| Data | Autor | Tipo | Descrição |
|---|---|---|---|
| 2026-10-31 | Docqui Caixa | Ajuste | Front-matter ganha `estado-por` e `estado-em` (9.1.0), preenchidos pelo histórico do git com quem levou a AIMM ao estado atual e quando. |
| 2026-10-21 | Docqui Caixa | Ajuste | Layout da AIMM do ticket: sem Contexto, alterações por Agrupamento Funcional, Decisões pendentes, nome abaixo do ID, entidades sem PF. |
| 2026-10-20 | Docqui Caixa | Ajuste | Layout da AIMM do ticket: nome abaixo do ID, entidades sem PF. |
| 2026-10-18 | Claude | Demonstração | Ticket fictício e Feature Set Destaques preenchidos, com 5 features em rascunho, sem aval e com a contagem pendente. |
| 2026-10-20 | Docqui Caixa | Terminologia | Adoção de AIMM; histórico e chave preservados. |
| 2026-10-21 | Docqui Caixa | Terminologia | Níveis em português: Domínio, Agrupamento Funcional e Funcionalidade; histórico preservado. |
