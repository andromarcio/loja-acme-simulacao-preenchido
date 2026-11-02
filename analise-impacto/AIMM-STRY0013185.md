<!-- docqui: 9.1.0 | prompt: MIGRA_AIMM_ESTADO | atualizado: 2026-10-31 -->
---
tipo: ticket
ticket: STRY0013185
ferramenta: ServiceNow fictício
link: ../mentoria/backlog.md#stry0013185--carrinho-de-compras
titulo: Carrinho de compras
estado: em-análise
estado-por: "Claude"
estado-em: 2026-10-31 00:16 +00:00
aberta-na-entrega: false
sprint: ""
avalizado-por: ""
aberta-em: 2026-10-18
---

# AIMM STRY0013185

## Descrição do ticket

> Transcrição do ticket fictício do backlog da demonstração; não é um registro do ServiceNow real.

Como cliente, quero colocar produtos no carrinho, ver o que escolhi, mudar quantidades e tirar itens, para fechar a compra só com o que quero.

## Critérios de aceite

> **Numeração**: a fonte fictícia numera os critérios; os números CA-n abaixo são os mesmos do backlog.

| Critério | Descrição |
|---|---|
| CA-1 | Na página do produto, o cliente escolhe a quantidade e adiciona o produto ao carrinho; se o produto já está no carrinho, a quantidade é somada. |
| CA-2 | O carrinho mostra cada item com o preço unitário, a quantidade e o subtotal, e o total dos itens. |
| CA-3 | O cliente muda a quantidade de um item, sem passar da quantidade em estoque. |
| CA-4 | O cliente remove um item do carrinho. |

## Funcionalidades

| Funcionalidade (N3) | Domínio · Agrupamento Funcional | Operação | Critérios cobertos | Status |
|---|---|---|---|---|
| [`VND-CAR-01`: Adicionar Item ao Carrinho](../modules/vendas/carrinho/f-adicionar-item-carrinho.md) | Vendas · Carrinho | Criação | `CA-1` | 📋 Especificado |
| [`VND-CAR-02`: Listar Itens do Carrinho](../modules/vendas/carrinho/f-listar-item-carrinho.md) | Vendas · Carrinho | Criação | `CA-2` | 📋 Especificado |
| [`VND-CAR-03`: Alterar Quantidade do Item](../modules/vendas/carrinho/f-alterar-quantidade-item.md) | Vendas · Carrinho | Criação | `CA-3` | 📋 Especificado |
| [`VND-CAR-04`: Remover Item do Carrinho](../modules/vendas/carrinho/f-remover-item-carrinho.md) | Vendas · Carrinho | Criação | `CA-4` | 📋 Especificado |

## Artefatos impactados

O changeset abaixo descreve o pacote didático. Não há aval de PO registrado; os arquivos preenchidos são material de demonstração.

| Artefato | Tipo | Operação | Seção | Natureza | O quê | Proveniência |
|---|---|---|---|---|---|---|
| `modules/vendas/README.md` | N1 | alterar | Agrupamentos Funcionais; Regras transversais | funcional | Carrinho especificado; o pedido aberto é o carrinho | elicitado |
| `modules/vendas/carrinho/README.md` | N2 | criar | — | funcional | Jornada do carrinho, telas e permissões | elicitado |
| `modules/vendas/carrinho/f-adicionar-item-carrinho.md` | N3 | criar | — | funcional | VND-CAR-01 — Adicionar Item ao Carrinho | derivado: âncora |
| `modules/vendas/carrinho/f-listar-item-carrinho.md` | N3 | criar | — | funcional | VND-CAR-02 — Listar Itens do Carrinho | derivado: âncora |
| `modules/vendas/carrinho/f-alterar-quantidade-item.md` | N3 | criar | — | funcional | VND-CAR-03 — Alterar Quantidade do Item | derivado: âncora |
| `modules/vendas/carrinho/f-remover-item-carrinho.md` | N3 | criar | — | funcional | VND-CAR-04 — Remover Item do Carrinho | derivado: âncora |
| `modules/vendas/checkout/README.md` | N2 | alterar | Dependências entre funcionalidades | funcional | Calcular Frete passa a depender de VND-CAR-01 — Adicionar Item ao Carrinho | elicitado |
| `global/DATA-MODEL.md` | DATA-MODEL | alterar | Modelos por domínio; Relacionamentos | funcional | ItemPedido e os relacionamentos com Produto e Usuario | elicitado |
| `global/data-models/vendas.md` | DATA-MODEL | alterar | Pedido; ItemPedido | funcional | ItemPedido; Pedido com Cliente, situação Aberto e CEP informado no checkout | elicitado |
| `global/FIELD-DICTIONARY.md` | FIELD-DICT | alterar | Quantidade | funcional | Novo campo canônico Quantidade | elicitado |
| `global/MESSAGE-DICTIONARY.md` | MESSAGE-DICT | alterar | Vendas | funcional | Mensagens do carrinho e do estoque | elicitado |
| `prototypes/vendas/carrinho/flow.html` | PROTÓTIPO | criar | — | funcional | Página do produto e carrinho | derivado: espelho do N2 |
| `prototypes/vendas/checkout/flow.html` | PROTÓTIPO | alterar | Notas do protótipo | funcional | Os itens do pedido passam a vir do Carrinho especificado | elicitado |

## Alterações em funcionalidades por Agrupamento Funcional

### Carrinho

| Funcionalidade | CA-n | Natureza | Mudança | Regras | Cenários |
| --- | --- | --- | --- | --- | --- |
| `VND-CAR-01`<br>**Adicionar Item ao Carrinho** | CA-1 | incluída | **Inclusão** da funcionalidade. *Antes*: não havia N3. *Agora*: pôr um produto no carrinho, na quantidade escolhida. | +5 | +10 |
| `VND-CAR-02`<br>**Listar Itens do Carrinho** | CA-2 | incluída | **Inclusão** da funcionalidade. *Antes*: não havia N3. *Agora*: ver os itens, os subtotais e o total dos itens. | +5 | +7 |
| `VND-CAR-03`<br>**Alterar Quantidade do Item** | CA-3 | incluída | **Inclusão** da funcionalidade. *Antes*: não havia N3. *Agora*: mudar a quantidade de um item do carrinho. | +3 | +8 |
| `VND-CAR-04`<br>**Remover Item do Carrinho** | CA-4 | incluída | **Inclusão** da funcionalidade. *Antes*: não havia N3. *Agora*: tirar um item do carrinho. | +2 | +5 |

## Entidades alteradas

Modelo negocial de ItemPedido e do Pedido aberto, sem alterações físicas ou contagem ALI/AIE.

## Impacto em dicionários

- Quantidade vira campo canônico no FIELD-DICTIONARY (usado em VND-CAR-01 e VND-CAR-03).
- Mensagens de Vendas: `VND_PRODUTO_ESGOTADO`, `VND_ESTOQUE_INSUFICIENTE`, `VND_ITEM_ADICIONADO`, `VND_QUANTIDADE_ATUALIZADA`, `VND_ITEM_REMOVIDO`, `VND_CARRINHO_SEM_ITENS` e `VND_ESTOQUE_REDUZIDO`.

## Decisões pendentes

- O responsável real deve revisar o escopo e conduzir CP1/CP2 antes de qualquer entrega.
- A contagem será feita via CT; nenhum PF foi estimado.
- A baixa de estoque e a confirmação do pedido não estão especificadas; o carrinho só confere o estoque ao adicionar e ao alterar.
- O preço do item fica o do momento em que ele entrou no carrinho; a PO pode preferir atualizar pelo preço vigente.

## Reconciliação

Não encerrada. Esta AIMM está em análise e não declara entrega, aprovação de escopo ou aprovação dos gates.

## Changelog

| Data | Autor | Tipo | Descrição |
|---|---|---|---|
| 2026-10-31 | Docqui Caixa | Ajuste | Front-matter ganha `estado-por` e `estado-em` (9.1.0), preenchidos pelo histórico do git com quem levou a AIMM ao estado atual e quando. |
| 2026-10-21 | Docqui Caixa | Ajuste | Layout da AIMM do ticket: sem Contexto, alterações por Agrupamento Funcional, Decisões pendentes, nome abaixo do ID, entidades sem PF. |
| 2026-10-20 | Docqui Caixa | Ajuste | Layout da AIMM do ticket: nome abaixo do ID, entidades sem PF. |
| 2026-10-18 | Claude | Demonstração | Ticket fictício e Feature Set Carrinho preenchidos, com 4 features em rascunho, sem aval e com a contagem pendente. |
| 2026-10-20 | Docqui Caixa | Terminologia | Adoção de AIMM; histórico e chave preservados. |
| 2026-10-21 | Docqui Caixa | Terminologia | Níveis em português: Domínio, Agrupamento Funcional e Funcionalidade; histórico preservado. |
