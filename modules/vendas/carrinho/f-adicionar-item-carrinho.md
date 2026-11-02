<!-- docqui: 7.0.0 | prompt: MIGRA_NIVEIS | atualizado: 2026-10-21 -->
---
id: VND-CAR-01
agrupamento_funcional: VND-CAR
dominio: VND
entidade: ItemPedido
data_model_ref: data-models/vendas.md#itempedido
endpoints: []
error_codes: []
depende_de: ["VIT-NAV-03"]
origem:
  tipo: servicenow
  chave: STRY0013185
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

# Adicionar Item ao Carrinho
> **Nível 3** - Agrupamento Funcional: Carrinho — Domínio: Vendas - `VND-CAR-01`

## Descrição

Permite que o cliente adicione um produto ao carrinho na quantidade escolhida, com o preço do momento em que o item entra.

Na página do produto, o cliente informa a quantidade (1 por padrão) e aciona **Adicionar ao carrinho**; se ainda não tem carrinho, o primeiro item o cria, e se o produto já está no carrinho, a quantidade é somada à que estava lá.

## Regras de negócio

- **RN-01** — A quantidade de um produto no carrinho não passa da quantidade em estoque do produto.
- **RN-02** — Produto com quantidade em estoque zero não entra no carrinho.
- **RN-03** — Cada produto aparece uma única vez no carrinho; adicioná-lo de novo soma a quantidade à que já estava lá.
- **RN-04** — Quando o cliente não tem pedido aberto, o primeiro item cria o carrinho. → ver N1 Vendas: Regras transversais de negócio: 2
- **RN-05** — O preço unitário do item é o preço do produto no momento em que o item entra no carrinho.

## Cenários

```gherkin
Feature: Adicionar Item ao Carrinho

  Background:
    Given que o cliente está identificado na loja e na página de um produto
    And que a Garrafa térmica ACME 500 ml custa R$ 89,90 e tem 35 unidades em estoque
    And que a Caneca de cerâmica ACME 300 ml custa R$ 39,90 e tem 120 unidades em estoque

  # Caminho feliz
  @RN-05
  # ← MESSAGE-DICTIONARY: VND_ITEM_ADICIONADO
  Scenario: Produto adicionado ao carrinho
    Given que o carrinho de Ana Costa não tem a Garrafa térmica ACME 500 ml
    When ela informa a quantidade 1 na página da Garrafa térmica ACME 500 ml
    And aciona "Adicionar ao carrinho"
    Then o sistema exibe "Produto adicionado ao carrinho."
    And o carrinho passa a ter a Garrafa térmica ACME 500 ml com quantidade 1 e preço unitário de R$ 89,90

  @RN-03
  # ← MESSAGE-DICTIONARY: VND_ITEM_ADICIONADO
  Scenario: Produto que já está no carrinho tem a quantidade somada
    Given que o carrinho de Ana Costa tem 2 unidades da Caneca de cerâmica ACME 300 ml
    When ela informa a quantidade 1 na página da Caneca de cerâmica ACME 300 ml
    And aciona "Adicionar ao carrinho"
    Then o sistema exibe "Produto adicionado ao carrinho."
    And o carrinho mostra a Caneca de cerâmica ACME 300 ml uma única vez, com quantidade 3

  @RN-04
  # ← MESSAGE-DICTIONARY: VND_ITEM_ADICIONADO
  Scenario: Primeiro item cria o carrinho
    Given que a cliente Juliana Alves não tem pedido aberto
    When ela informa a quantidade 2 na página da Caneca de cerâmica ACME 300 ml
    And aciona "Adicionar ao carrinho"
    Then o sistema exibe "Produto adicionado ao carrinho."
    And Juliana Alves passa a ter um pedido aberto com a Caneca de cerâmica ACME 300 ml, quantidade 2

  # Erros de validação
  # ← FIELD-DICTIONARY: Quantidade
  Scenario: Quantidade menor que 1
    When o cliente informa a quantidade 0
    And aciona "Adicionar ao carrinho"
    Then o sistema exibe abaixo do campo "Informe uma quantidade válida."
    And o carrinho não muda

  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Quantidade vazia
    When o cliente deixa a quantidade vazia
    And aciona "Adicionar ao carrinho"
    Then o sistema exibe abaixo do campo "Campo obrigatório."

  # Conflitos com dados existentes
  @RN-01
  # ← MESSAGE-DICTIONARY: VND_ESTOQUE_INSUFICIENTE
  Scenario: Quantidade maior que o estoque
    When o cliente informa a quantidade 40 na página da Garrafa térmica ACME 500 ml
    And aciona "Adicionar ao carrinho"
    Then o sistema exibe "Quantidade indisponível em estoque."
    And o carrinho não muda

  @RN-01
  # ← MESSAGE-DICTIONARY: VND_ESTOQUE_INSUFICIENTE
  Scenario: Soma com o que já está no carrinho passa do estoque
    Given que o carrinho do cliente tem 30 unidades da Garrafa térmica ACME 500 ml
    When ele informa a quantidade 10 na página da Garrafa térmica ACME 500 ml
    And aciona "Adicionar ao carrinho"
    Then o sistema exibe "Quantidade indisponível em estoque."
    And a Garrafa térmica ACME 500 ml continua com quantidade 30 no carrinho

  @RN-02
  # ← MESSAGE-DICTIONARY: VND_PRODUTO_ESGOTADO
  Scenario: Produto esgotado
    Given que o Boné ACME aba curva tem 0 unidades em estoque
    When o cliente tenta adicionar o Boné ACME aba curva ao carrinho
    Then o sistema exibe "Este produto está esgotado."
    And o carrinho não muda

  # Restrições de acesso
  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Tentativa sem acesso à funcionalidade
    Given que a pessoa não tem acesso à funcionalidade
    When tenta adicionar um produto ao carrinho
    Then o sistema exibe "Você não tem permissão para esta ação."
    And nenhum carrinho é criado ou alterado

  # Estados especiais
  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Falha inesperada ao adicionar
    When a inclusão não pode ser concluída por falha inesperada
    Then o sistema exibe "Ocorreu um erro. Tente novamente."
    And o carrinho não muda
```

## Campos

| Label PO | Entidade | Preenchimento | Edição | Tipo | Obrigatório | Validação |
|---|---|---|---|---|---|---|
| Produto | Produto | exibido do cadastro | somente leitura | texto | não | O produto da página aberta |
| Quantidade | ItemPedido | entrada do usuário | editável | número | sim | Começa em 1; até a quantidade em estoque, descontado o que já está no carrinho; → ver FIELD-DICTIONARY: Quantidade |

## Campos automáticos

| Label PO | Valor | Quando |
|---|---|---|
| Pedido | Pedido aberto do cliente, criado com a situação Aberto quando ele ainda não tem um | Ao adicionar o primeiro item |
| Preço unitário | Preço do produto no Catálogo naquele momento | Ao adicionar um produto que ainda não estava no carrinho |
| Quantidade | Soma da quantidade informada com a que já estava no carrinho | Ao adicionar um produto que já estava no carrinho |

## Dados lidos e gravados

| Entidade | Papel | Por que a funcionalidade a toca |
|---|---|---|
| Pedido | lê e grava | Localiza o pedido aberto do cliente e o cria quando não existe (RN-04) |

## Superfície

**Ação em tela** — origem: Visualizar Produto na Vitrine (Página do produto, `/produtos/:id`).

**Fidelidade ao protótipo**: referência · `prototypes/vendas/carrinho/flow.html` · [abrir o protótipo ↗](../../../prototypes/vendas/carrinho/flow.html)

## Comportamento de tela

### Onde fica

Na Página do produto (VIT-NAV-03 — Visualizar Produto na Vitrine), abaixo do preço: o campo **Quantidade** e o botão **Adicionar ao carrinho**. O retorno é um aviso no canto da tela, com o caminho para o carrinho (VND-CAR-02 — Listar Itens do Carrinho).

### Estados da tela

| Estado | Comportamento |
|---|---|
| Inicial | Quantidade 1 e o botão disponível |
| Loading | Mostrar "Carregando…" no botão e evitar novo acionamento enquanto adiciona |
| Erro de validação | Mensagem literal abaixo do campo Quantidade; o carrinho não muda |
| Erro de servidor | Mostrar "Ocorreu um erro. Tente novamente." |
| Sucesso | Aviso "Produto adicionado ao carrinho." e a quantidade volta a 1 |
| Produto esgotado | A página mostra o selo "Esgotado"; ao acionar Adicionar ao carrinho, mostrar "Este produto está esgotado." e não mudar o carrinho |
| Estoque insuficiente | Mostrar "Quantidade indisponível em estoque." e manter a quantidade informada para correção |

## Critérios de sucesso

| # | Critério mensurável | Origem |
|---|---|---|
| SC-01 | Adicionar um produto que já está no carrinho nunca gera uma segunda linha do mesmo produto | CA-1 e RN-03 |
| SC-02 | Nenhum carrinho passa a ter, de um produto, mais unidades do que a quantidade em estoque | CA-1 e RN-01 |
| SC-03 | O preço unitário do item é igual ao preço do produto no instante da inclusão | CA-1 e RN-05 |

## Métricas de tamanho

| Função de Transação | Papel | Tipo | ALR | DER | Complexidade | PF | Data |
|---|---|---|---|---|---|---|---|
| Adicionar Item ao Carrinho | principal | — | — | — | — | — | — |

A contagem está pendente e deve nascer da análise desta funcionalidade via CT, com memória de cálculo.

## Origem

| Ticket (AIMM) | Tipo | Critérios cobertos |
|---|---|---|
| [`STRY0013185`](../../../analise-impacto/AIMM-STRY0013185.md) | Criação | `CA-1` — adicionar o produto ao carrinho na quantidade escolhida, somando quando ele já está lá |

## Changelog

| Data | Autor | Tipo | Descrição |
|---|---|---|---|
| 2026-10-18 | Claude | N3 criado | Inclusão do produto no carrinho a partir do ticket fictício STRY0013185, com soma de quantidade, limite de estoque e criação do pedido aberto; gates sem aprovação e contagem pendente. |
| 2026-10-18 | Claude | Ajuste | Seções reordenadas: a Superfície vai para antes da seção Comportamento de tela e a Origem vai para antes da seção Changelog. Nenhuma regra, cenário ou campo muda. |
| 2026-10-20 | Docqui Caixa | Terminologia | Adoção de AIMM; histórico e chave preservados. |
| 2026-10-21 | Docqui Caixa | Terminologia | Níveis em português: Domínio, Agrupamento Funcional e Funcionalidade; histórico preservado. |
