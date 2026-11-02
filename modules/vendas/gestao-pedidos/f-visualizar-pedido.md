<!-- docqui: 7.0.0 | prompt: MIGRA_NIVEIS | atualizado: 2026-10-21 -->
---
id: VND-PED-02
agrupamento_funcional: VND-PED
dominio: VND
entidade: Pedido
data_model_ref: data-models/vendas.md#pedido
endpoints: []
error_codes: []
depende_de: []
origem:
  tipo: servicenow
  chave: STRY0013190
estado: especificado
gates:
  requisitos: { aprovado: true, por: "Andro Márcio", em: "2026-10-21", pr: 25 }
  modelo-dados: { aprovado: true, por: "Andro Márcio", em: "2026-10-21", pr: 25 }
  testes: { aprovado: false, por: "", em: "", pr: "" }
  codigo: { aprovado: false, por: "", em: "", pr: "" }
contagem:
  pendente: true
  revisada_em: ""
  revisada_ate: ""
---

# Visualizar Pedido
> **Nível 3** - Agrupamento Funcional: Gestão de Pedidos — Domínio: Vendas - `VND-PED-02`

## Descrição

Permite que o atendente veja o pedido completo de um cliente — itens, entrega, frete, total e situação —, com o motivo, a data e o responsável quando o pedido foi cancelado.

O atendente chega ao Detalhe do Pedido pela ação Visualizar de VND-PED-01 — Pesquisar Pedidos; a ficha é só de leitura e, no pedido confirmado, traz o botão **Cancelar pedido**, de VND-PED-03 — Cancelar Pedido.

## Regras de negócio

- **RN-01** — O subtotal de cada item é a quantidade multiplicada pelo preço unitário.
- **RN-02** — O total dos itens é a soma dos subtotais.
- **RN-03** — O total do pedido é o total dos itens mais o valor do frete.
- **RN-04** — O motivo, a data e o responsável pelo cancelamento existem só no pedido cancelado.
- **RN-05** — O valor do frete do pedido é o registrado na cotação, mesmo que a faixa de frete mude depois.
- **RN-06** — O pedido aberto, que é o carrinho do cliente, não tem detalhe no atendimento. → ver N1 Vendas: Regras transversais de negócio: 2

## Cenários

```gherkin
Feature: Visualizar Pedido

  Background:
    Given que o atendente está na Pesquisa de Pedidos
    And que a loja tem os pedidos confirmados 1001, 1002, 1005 e 1006, o pedido cancelado 1003 e os pedidos abertos 1004 e 1007

  # Caminho feliz
  @RN-01 @RN-02 @RN-03
  Scenario: Detalhe de um pedido confirmado
    When o atendente abre o pedido 1001
    Then o sistema mostra a cliente "Ana Costa", o e-mail "ana.costa@cliente.example", a situação "Confirmado" e a data da confirmação "12/10/2026"
    And mostra o CEP de entrega "01310100", a faixa de frete "Centro — São Paulo" e o valor do frete "R$ 18,90"
    And mostra o item "Caneca de cerâmica ACME 300 ml" com quantidade 2, preço unitário "R$ 39,90" e subtotal "R$ 79,80"
    And mostra o item "Camiseta ACME algodão — tamanho M" com quantidade 1, preço unitário "R$ 59,90" e subtotal "R$ 59,90"
    And mostra o total dos itens "R$ 139,70" e o total do pedido "R$ 158,60"
    And mostra o botão "Cancelar pedido"

  @RN-04
  Scenario: Detalhe de um pedido cancelado
    When o atendente abre o pedido 1003
    Then o sistema mostra a situação "Cancelado"
    And mostra o motivo do cancelamento "Cliente desistiu da compra", a data do cancelamento "16/10/2026" e cancelado por "Carla Souza"
    And não mostra o botão "Cancelar pedido"

  @RN-04
  Scenario: Pedido confirmado sem dados de cancelamento
    When o atendente abre o pedido 1002
    Then o sistema não mostra motivo, data do cancelamento nem quem cancelou

  # Conflitos com dados existentes
  @RN-05
  Scenario: Frete registrado mantido depois de mudança na faixa
    Given que o valor da faixa de frete "Campinas" passou de R$ 32,90 para R$ 34,90 depois da confirmação do pedido 1005
    When o atendente abre o pedido 1005
    Then o sistema mostra o valor do frete "R$ 32,90"
    And mostra o total do pedido "R$ 82,80"

  # Restrições de acesso
  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Tentativa sem acesso à funcionalidade
    Given que a pessoa não tem acesso à funcionalidade
    When tenta abrir o pedido 1001
    Then o sistema exibe "Você não tem permissão para esta ação."
    And não mostra os dados do pedido

  # Estados especiais
  @RN-06
  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Pedido aberto acessado pelo endereço
    When a pessoa abre o endereço do pedido 1007
    Then o sistema exibe "Registro não encontrado."

  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Pedido inexistente
    When a pessoa abre o endereço do pedido 9999
    Then o sistema exibe "Registro não encontrado."

  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Falha ao carregar o pedido
    When o detalhe não pode ser carregado por falha inesperada
    Then o sistema exibe "Não foi possível carregar os dados."
```

## Campos

| Label PO | Entidade | Preenchimento | Edição | Tipo | Obrigatório | Validação |
|---|---|---|---|---|---|---|
| Número do pedido | Pedido | exibido do cadastro | somente leitura | número | não | — |
| Situação | Pedido | exibido do cadastro | somente leitura | lista (Confirmado, Cancelado) | não | — |
| Data da confirmação | Pedido | exibido do cadastro | somente leitura | data | não | — |
| Cliente | Usuario | exibido do cadastro | somente leitura | texto | não | Nome completo do cliente do pedido |
| E-mail do cliente | Usuario | exibido do cadastro | somente leitura | texto | não | → ver FIELD-DICTIONARY: E-mail |
| CEP de entrega | Pedido | exibido do cadastro | somente leitura | texto | não | → ver FIELD-DICTIONARY: CEP |
| Faixa de frete | TabelaFrete | exibido do cadastro | somente leitura | texto | não | Região da faixa que atendeu o pedido |
| Valor do frete | Pedido | exibido do cadastro | somente leitura | valor | não | → ver FIELD-DICTIONARY: Valor monetário |
| Produto | Produto | exibido do cadastro | somente leitura | texto | não | Nome do produto de cada item |
| Quantidade | ItemPedido | exibido do cadastro | somente leitura | número | não | → ver FIELD-DICTIONARY: Quantidade |
| Preço unitário | ItemPedido | exibido do cadastro | somente leitura | valor | não | → ver FIELD-DICTIONARY: Valor monetário |
| Subtotal | derivado ↓ | calculado | somente leitura | valor | não | → ver FIELD-DICTIONARY: Valor monetário |
| Total dos itens | derivado ↓ | calculado | somente leitura | valor | não | → ver FIELD-DICTIONARY: Valor monetário |
| Total do pedido | derivado ↓ | calculado | somente leitura | valor | não | → ver FIELD-DICTIONARY: Valor monetário |
| Motivo do cancelamento | Pedido | exibido do cadastro | somente leitura | texto | não | Só no pedido cancelado |
| Data do cancelamento | Pedido | exibido do cadastro | somente leitura | data | não | Só no pedido cancelado |
| Cancelado por | Usuario | exibido do cadastro | somente leitura | texto | não | Nome completo de quem cancelou; só no pedido cancelado |

## Derivações

| Campo derivado | Fórmula (Label PO) | Campos-fonte (Entidade) |
|---|---|---|
| Subtotal | Quantidade × Preço unitário | Quantidade (ItemPedido), Preço unitário (ItemPedido) |
| Total dos itens | Soma dos Subtotais dos itens do pedido | Quantidade (ItemPedido), Preço unitário (ItemPedido) |
| Total do pedido | Total dos itens + Valor do frete | Quantidade (ItemPedido), Preço unitário (ItemPedido), Valor do frete (Pedido) |

## Campos automáticos

| Label PO | Valor | Quando |
|---|---|---|
| — | Nenhum campo é preenchido automaticamente nesta funcionalidade | — |

## Superfície

**Tela própria** — rota: Detalhe do Pedido (`/vendas/pedidos/:numero`), aberta de VND-PED-01 — Pesquisar Pedidos.

**Fidelidade ao protótipo**: referência · `prototypes/vendas/gestao-pedidos/flow.html` · [abrir o protótipo ↗](../../../prototypes/vendas/gestao-pedidos/flow.html)

## Comportamento de tela

### Onde fica

O Detalhe do Pedido (`/vendas/pedidos/:numero`) abre em página própria a partir da Pesquisa de Pedidos, com o breadcrumb até o número do pedido e o botão **Voltar**. A ficha mostra, em label-valor, os dados do pedido, do cliente e da entrega; abaixo, a tabela dos itens com os subtotais, o total dos itens e o total do pedido; no pedido cancelado, um card com o motivo, a data e quem cancelou. O botão **Cancelar pedido**, de VND-PED-03 — Cancelar Pedido, aparece só no pedido confirmado.

### Estados da tela

| Estado | Comportamento |
|---|---|
| Inicial | Ficha do pedido escolhido na pesquisa, só de leitura |
| Loading | Mostrar "Carregando…" no lugar da ficha |
| Erro de servidor | Mostrar "Não foi possível carregar os dados." no lugar da ficha |
| Sucesso | Mostrar todos os dados do pedido, os itens e os totais |
| Pedido cancelado | Mostrar o card do cancelamento e esconder o botão **Cancelar pedido** |
| Pedido não encontrado | Mostrar "Registro não encontrado." para pedido inexistente ou aberto |

## Critérios de sucesso

| # | Critério mensurável | Origem |
|---|---|---|
| SC-01 | O total do pedido mostrado é igual à soma dos subtotais mais o valor do frete registrado | CA-2 e RN-03 |
| SC-02 | O valor do frete de um pedido não muda quando a faixa de frete é alterada depois da cotação | CA-2 e RN-05 |
| SC-03 | Os dados do cancelamento aparecem em todo pedido cancelado e em nenhum pedido confirmado | CA-2 e RN-04 |

## Métricas de tamanho

| Função de Transação | Papel | Tipo | ALR | DER | Complexidade | PF | Data |
|---|---|---|---|---|---|---|---|
| Visualizar Pedido | principal | — | — | — | — | — | — |

A contagem está pendente e deve nascer da análise desta funcionalidade via CT, com memória de cálculo.

## Origem

| Ticket (AIMM) | Tipo | Critérios cobertos |
|---|---|---|
| [`STRY0013190`](../../../analise-impacto/AIMM-STRY0013190.md) | Criação | `CA-2` — detalhe do pedido com o cliente, os itens, o CEP de entrega, o frete, o total e a situação |

## Changelog

| Data | Autor | Tipo | Descrição |
|---|---|---|---|
| 2026-10-18 | Claude | N3 criado | Detalhe do pedido para o atendimento a partir do ticket fictício STRY0013190, com itens, totais derivados e os dados do cancelamento; gates sem aprovação e contagem pendente. |
| 2026-10-18 | Claude | Ajuste | Seções reordenadas: a Superfície vai para antes da seção Comportamento de tela e a Origem vai para antes da seção Changelog. Nenhuma regra, cenário ou campo muda. |
| 2026-10-20 | Docqui Caixa | Terminologia | Adoção de AIMM; histórico e chave preservados. |
| 2026-10-21 | Docqui Caixa | Terminologia | Níveis em português: Domínio, Agrupamento Funcional e Funcionalidade; histórico preservado. |
