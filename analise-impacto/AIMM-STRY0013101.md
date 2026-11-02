<!-- docqui: 9.1.0 | prompt: MIGRA_AIMM_ESTADO | atualizado: 2026-10-31 -->
---
tipo: ticket
ticket: STRY0013101
ferramenta: ServiceNow fictício
link: ../mentoria/backlog.md#stry0013101--calcular-frete-no-checkout
titulo: Calcular frete no checkout
estado: em-análise
estado-por: "Claude"
estado-em: 2026-10-31 00:16 +00:00
aberta-na-entrega: false
sprint: SP07
avalizado-por: ""
aberta-em: 2026-10-14
---

# AIMM STRY0013101

## Descrição do ticket

> Transcrição do ticket fictício do backlog da demonstração; não é um registro do ServiceNow real.

Como cliente, quero informar o CEP no checkout e ver o valor do frete, para saber quanto vou pagar pela entrega antes de fechar o pedido.

## Critérios de aceite

> **Numeração**: a fonte fictícia numera os critérios; os números CA-n abaixo são os mesmos do backlog.

| Critério | Descrição |
|---|---|
| CA-1 | Dado que o carrinho tem itens, quando o cliente informa um CEP atendido, o sistema mostra o valor do frete. |
| CA-2 | Quando o cliente informa um CEP com menos de 8 dígitos, o sistema avisa que o CEP é inválido. |
| CA-3 | Quando o cliente informa um CEP não atendido, o sistema avisa que não entrega nesse CEP. |

## Funcionalidades

| Funcionalidade (N3) | Domínio · Agrupamento Funcional | Operação | Critérios cobertos | Status |
|---|---|---|---|---|
| [`VND-CHK-01`: Calcular Frete](../modules/vendas/checkout/f-calcular-frete.md) | Vendas · Checkout | Criação | `CA-1, CA-2, CA-3` | ✏️ Rascunho |

## Artefatos impactados

O changeset abaixo descreve o pacote didático. Não há aval de PO registrado; os arquivos preenchidos são material de demonstração.

| Artefato | Tipo | Operação | Seção | Natureza | O quê | Proveniência |
|---|---|---|---|---|---|---|
| `modules/vendas/README.md` | N1 | criar | — | funcional | Limites de Vendas e Checkout | elicitado |
| `modules/vendas/checkout/README.md` | N2 | criar | — | funcional | Jornada e permissões | elicitado |
| `modules/vendas/checkout/f-calcular-frete.md` | N3 | criar | — | funcional | VND-CHK-01 — Calcular Frete | derivado: âncora |
| `global/DATA-MODEL.md` | DATA-MODEL | alterar | Modelos por domínio | funcional | Índice do modelo de Vendas | elicitado |
| `global/data-models/vendas.md` | DATA-MODEL | criar | — | funcional | Pedido e TabelaFrete | elicitado |
| `global/FIELD-DICTIONARY.md` | FIELD-DICT | alterar | CEP | funcional | Validação canônica de CEP | elicitado |
| `global/MESSAGE-DICTIONARY.md` | MESSAGE-DICT | alterar | Vendas | funcional | Mensagens literais de entrega | elicitado |

## Alterações em funcionalidades por Agrupamento Funcional

### Checkout

| Funcionalidade | CA-n | Natureza | Mudança | Regras | Cenários |
| --- | --- | --- | --- | --- | --- |
| `VND-CHK-01`<br>**Calcular Frete** | CA-1, CA-2, CA-3 | incluída | **Inclusão** do cálculo. *Antes*: o exemplo não tinha N3. *Agora*: o valor da faixa do CEP é especificado antes da confirmação. | +3 | +7 |

## Entidades alteradas

Modelo negocial de Pedido e TabelaFrete, sem alterações físicas ou contagem ALI/AIE.

## Impacto em dicionários

- CEP recebe uma entrada trabalhada no FIELD-DICTIONARY.
- Vendas recebe mensagens para CEP não atendido e carrinho vazio.

## Decisões pendentes

- O responsável real deve revisar o escopo e conduzir CP1/CP2 antes de qualquer entrega.
- A contagem será feita via CT; nenhum PF estimado foi copiado do simulador.

## Reconciliação

Não encerrada. Esta AIMM está em análise e não declara entrega, aprovação de escopo ou aprovação dos gates.

## Changelog

| Data | Autor | Tipo | Descrição |
|---|---|---|---|
| 2026-10-31 | Docqui Caixa | Ajuste | Front-matter ganha `estado-por` e `estado-em` (9.1.0), preenchidos pelo histórico do git com quem levou a AIMM ao estado atual e quando. |
| 2026-10-21 | Docqui Caixa | Ajuste | Layout da AIMM do ticket: sem Contexto, alterações por Agrupamento Funcional, Decisões pendentes, nome abaixo do ID, entidades sem PF. |
| 2026-10-20 | Docqui Caixa | Ajuste | Layout da AIMM do ticket: nome abaixo do ID, entidades sem PF. |
| 2026-10-14 | Copilot | Demonstração | Ticket fictício e pacote de requisitos preenchidos, com estado e contagem pendentes. |
| 2026-10-20 | Docqui Caixa | Terminologia | Adoção de AIMM; histórico e chave preservados. |
| 2026-10-21 | Docqui Caixa | Terminologia | Níveis em português: Domínio, Agrupamento Funcional e Funcionalidade; histórico preservado. |
