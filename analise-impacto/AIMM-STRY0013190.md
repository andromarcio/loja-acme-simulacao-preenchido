<!-- docqui: 9.1.0 | prompt: MIGRA_AIMM_ESTADO | atualizado: 2026-10-31 -->
---
tipo: ticket
ticket: STRY0013190
ferramenta: ServiceNow fictício
link: ../mentoria/backlog.md#stry0013190--atendimento-de-pedidos
titulo: Atendimento de pedidos
estado: em-análise
estado-por: "Claude"
estado-em: 2026-10-31 00:16 +00:00
aberta-na-entrega: false
sprint: ""
avalizado-por: ""
aberta-em: 2026-10-18
---

# AIMM STRY0013190

## Descrição do ticket

> Transcrição do ticket fictício do backlog da demonstração; não é um registro do ServiceNow real.

Como atendente, quero encontrar os pedidos dos clientes, ver o detalhe de cada um e cancelar um pedido quando o cliente pedir, registrando o motivo.

## Critérios de aceite

> **Numeração**: a fonte fictícia numera os critérios; os números CA-n abaixo são os mesmos do backlog.

| Critério | Descrição |
|---|---|
| CA-1 | O atendente pesquisa pedidos por número, cliente, situação e período da confirmação. |
| CA-2 | O detalhe do pedido mostra o cliente, os itens, o CEP de entrega, o frete, o total e a situação. |
| CA-3 | Só pedido confirmado pode ser cancelado, e o motivo é obrigatório. |

## Funcionalidades

| Funcionalidade (N3) | Domínio · Agrupamento Funcional | Operação | Critérios cobertos | Status |
|---|---|---|---|---|
| [`VND-PED-01`: Pesquisar Pedidos](../modules/vendas/gestao-pedidos/f-pesquisar-pedido.md) | Vendas · Gestão de Pedidos | Criação | `CA-1` | 📋 Especificado |
| [`VND-PED-02`: Visualizar Pedido](../modules/vendas/gestao-pedidos/f-visualizar-pedido.md) | Vendas · Gestão de Pedidos | Criação | `CA-2` | 📋 Especificado |
| [`VND-PED-03`: Cancelar Pedido](../modules/vendas/gestao-pedidos/f-cancelar-pedido.md) | Vendas · Gestão de Pedidos | Criação | `CA-3` | 📋 Especificado |

## Artefatos impactados

O changeset abaixo descreve o pacote didático. Não há aval de PO registrado; os arquivos preenchidos são material de demonstração.

| Artefato | Tipo | Operação | Seção | Natureza | O quê | Proveniência |
|---|---|---|---|---|---|---|
| `modules/vendas/README.md` | N1 | alterar | Agrupamentos Funcionais | funcional | Gestão de Pedidos entra entre os Agrupamentos Funcionais de Vendas | elicitado |
| `modules/vendas/gestao-pedidos/README.md` | N2 | criar | — | funcional | Jornada do atendimento, telas e permissões | elicitado |
| `modules/vendas/gestao-pedidos/f-pesquisar-pedido.md` | N3 | criar | — | funcional | VND-PED-01 — Pesquisar Pedidos | derivado: âncora |
| `modules/vendas/gestao-pedidos/f-visualizar-pedido.md` | N3 | criar | — | funcional | VND-PED-02 — Visualizar Pedido | derivado: âncora |
| `modules/vendas/gestao-pedidos/f-cancelar-pedido.md` | N3 | criar | — | funcional | VND-PED-03 — Cancelar Pedido | derivado: âncora |
| `global/data-models/vendas.md` | DATA-MODEL | alterar | Pedido | funcional | Data da confirmação, dados do cancelamento e situação Cancelado | elicitado |
| `global/MESSAGE-DICTIONARY.md` | MESSAGE-DICT | alterar | Baseline; Vendas | funcional | Período inválido, registro não encontrado e mensagens do cancelamento | elicitado |
| `prototypes/vendas/gestao-pedidos/flow.html` | PROTÓTIPO | criar | — | funcional | Pesquisa, detalhe e cancelamento do pedido | derivado: espelho do N2 |

## Alterações em funcionalidades por Agrupamento Funcional

### Gestão de Pedidos

| Funcionalidade | CA-n | Natureza | Mudança | Regras | Cenários |
| --- | --- | --- | --- | --- | --- |
| `VND-PED-01`<br>**Pesquisar Pedidos** | CA-1 | incluída | **Inclusão** da funcionalidade. *Antes*: não havia N3. *Agora*: encontrar pedidos por número, cliente, situação e período. | +5 | +11 |
| `VND-PED-02`<br>**Visualizar Pedido** | CA-2 | incluída | **Inclusão** da funcionalidade. *Antes*: não havia N3. *Agora*: ver o cliente, os itens, a entrega, o frete e o total. | +6 | +8 |
| `VND-PED-03`<br>**Cancelar Pedido** | CA-3 | incluída | **Inclusão** da funcionalidade. *Antes*: não havia N3. *Agora*: cancelar um pedido confirmado, com o motivo. | +4 | +9 |

## Entidades alteradas

Modelo negocial do Pedido com os dados do cancelamento, sem alterações físicas ou contagem ALI/AIE.

## Impacto em dicionários

- Baseline: `NOT_FOUND` e `INVALID_PERIOD`.
- Mensagens de Vendas: `VND_CANCELAR_CONFIRMACAO`, `VND_PEDIDO_CANCELADO` e `VND_PEDIDO_NAO_CANCELAVEL`.

## Decisões pendentes

- O responsável real deve revisar o escopo e conduzir CP1/CP2 antes de qualquer entrega.
- A contagem será feita via CT; nenhum PF foi estimado.
- O cancelamento não devolve o estoque nem estorna pagamento; os dois estão fora do exemplo.

## Reconciliação

Não encerrada. Esta AIMM está em análise e não declara entrega, aprovação de escopo ou aprovação dos gates.

## Changelog

| Data | Autor | Tipo | Descrição |
|---|---|---|---|
| 2026-10-31 | Docqui Caixa | Ajuste | Front-matter ganha `estado-por` e `estado-em` (9.1.0), preenchidos pelo histórico do git com quem levou a AIMM ao estado atual e quando. |
| 2026-10-21 | Docqui Caixa | Ajuste | Layout da AIMM do ticket: sem Contexto, alterações por Agrupamento Funcional, Decisões pendentes, nome abaixo do ID, entidades sem PF. |
| 2026-10-20 | Docqui Caixa | Ajuste | Layout da AIMM do ticket: nome abaixo do ID, entidades sem PF. |
| 2026-10-18 | Claude | Demonstração | Ticket fictício e Feature Set Gestão de Pedidos preenchidos, com 3 features em rascunho, sem aval e com a contagem pendente. |
| 2026-10-20 | Docqui Caixa | Terminologia | Adoção de AIMM; histórico e chave preservados. |
| 2026-10-21 | Docqui Caixa | Terminologia | Níveis em português: Domínio, Agrupamento Funcional e Funcionalidade; histórico preservado. |
