<!-- docqui: 7.0.0 | prompt: MIGRA_NIVEIS | atualizado: 2026-10-21 -->
---
id: VND-CAR-02
agrupamento_funcional: VND-CAR
dominio: VND
entidade: ItemPedido
data_model_ref: data-models/vendas.md#itempedido
endpoints: []
error_codes: []
depende_de: ["VND-CAR-01"]
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

# Listar Itens do Carrinho
> **Nível 3** - Agrupamento Funcional: Carrinho — Domínio: Vendas - `VND-CAR-02`

## Descrição

Permite que o cliente visualize os itens do seu carrinho, com o preço unitário, a quantidade e o subtotal de cada item e o total dos itens.

O cliente abre o **Carrinho** pelo menu ou pelo aviso que aparece ao adicionar um produto; dali ajusta as quantidades, remove itens e aciona **Ir para o checkout**.

## Regras de negócio

- **RN-01** — O carrinho mostra só os itens do pedido aberto do próprio cliente. → ver N1 Vendas: Regras transversais de negócio: 2
- **RN-02** — O subtotal de um item é a quantidade multiplicada pelo preço unitário.
- **RN-03** — O total dos itens é a soma dos subtotais e não inclui o frete, que é calculado no checkout.
- **RN-04** — Item cuja quantidade no carrinho passou da quantidade em estoque atual do produto fica sinalizado.
- **RN-05** — Os itens aparecem na ordem em que entraram no carrinho.

## Cenários

```gherkin
Feature: Listar Itens do Carrinho

  Background:
    Given que a cliente Ana Costa está identificada na loja
    And que o carrinho dela tem, nesta ordem, 2 Canecas de cerâmica ACME 300 ml a R$ 39,90, 1 Camiseta ACME algodão — tamanho M a R$ 59,90, 1 Garrafa térmica ACME 500 ml a R$ 89,90, 3 Blocos de notas ACME A5 a R$ 24,90 e 1 Ecobag ACME de lona a R$ 34,90

  # Caminho feliz
  @RN-02 @RN-05
  Scenario: Itens com preço unitário, quantidade e subtotal
    When Ana Costa abre o carrinho
    Then o sistema lista os 5 itens na ordem em que entraram
    And a linha da Caneca de cerâmica ACME 300 ml mostra preço unitário R$ 39,90, quantidade 2 e subtotal R$ 79,80
    And a linha do Bloco de notas ACME A5 mostra preço unitário R$ 24,90, quantidade 3 e subtotal R$ 74,70

  @RN-03
  Scenario: Total dos itens sem o frete
    When Ana Costa abre o carrinho
    Then o sistema mostra "Total dos itens: R$ 339,20"
    And não mostra valor de frete

  @RN-01
  Scenario: Só os itens do próprio carrinho
    Given que o carrinho de Marcos Pereira tem 1 Ecobag ACME de lona
    When Ana Costa abre o carrinho
    Then o sistema mostra apenas os itens do carrinho de Ana Costa

  # Restrições de acesso
  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Tentativa sem acesso à funcionalidade
    Given que a pessoa não tem acesso à funcionalidade
    When tenta abrir o carrinho
    Then o sistema exibe "Você não tem permissão para esta ação."
    And não mostra nenhum item

  # Estados especiais
  # ← MESSAGE-DICTIONARY: VND_CARRINHO_SEM_ITENS
  Scenario: Carrinho sem itens
    Given que o carrinho de Ana Costa está vazio
    When ela abre o carrinho
    Then o sistema exibe "Seu carrinho está vazio."
    And o botão "Ir para o checkout" fica indisponível

  @RN-04
  # ← MESSAGE-DICTIONARY: VND_ESTOQUE_REDUZIDO
  Scenario: Estoque menor que a quantidade no carrinho
    Given que a quantidade em estoque do Bloco de notas ACME A5 passou a 2
    When Ana Costa abre o carrinho
    Then a linha do Bloco de notas ACME A5 mostra "O estoque deste produto é menor que a quantidade no carrinho."
    And os demais itens aparecem sem sinalização

  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Falha ao carregar o carrinho
    When os itens não podem ser carregados por falha inesperada
    Then o sistema exibe "Não foi possível carregar os dados."
```

## Campos

| Label PO | Entidade | Preenchimento | Edição | Tipo | Obrigatório | Validação |
|---|---|---|---|---|---|---|
| Nome do produto | Produto | exibido do cadastro | somente leitura | texto | não | — |
| Preço unitário | ItemPedido | exibido do cadastro | somente leitura | valor | não | → ver FIELD-DICTIONARY: Valor monetário |
| Quantidade | ItemPedido | exibido do cadastro | somente leitura | número | não | → ver FIELD-DICTIONARY: Quantidade |
| Subtotal | derivado ↓ | calculado | somente leitura | valor | não | → ver FIELD-DICTIONARY: Valor monetário |
| Total dos itens | derivado ↓ | calculado | somente leitura | valor | não | → ver FIELD-DICTIONARY: Valor monetário |
| Aviso de estoque reduzido | derivado ↓ | calculado | somente leitura | texto | não | Aparece só na linha cuja quantidade passou da quantidade em estoque |

## Derivações

| Campo derivado | Fórmula (Label PO) | Campos-fonte (Entidade) |
|---|---|---|
| Subtotal | Quantidade × Preço unitário | Quantidade (ItemPedido), Preço unitário (ItemPedido) |
| Total dos itens | Soma dos Subtotais dos itens do carrinho | Quantidade (ItemPedido), Preço unitário (ItemPedido) |
| Aviso de estoque reduzido | Exibido quando a Quantidade é maior que a Quantidade em estoque | Quantidade (ItemPedido), Quantidade em estoque (Produto) |

## Colunas do resultado

| Coluna (Label PO) | Origem | Ordenação |
|---|---|---|
| Produto | entidade relacionada (Produto) | padrão ↑ pela ordem de inclusão no carrinho |
| Preço unitário | cadastro | — |
| Quantidade | cadastro | — |
| Subtotal | derivado | — |

## Campos automáticos

| Label PO | Valor | Quando |
|---|---|---|
| — | Nenhum campo é preenchido automaticamente nesta funcionalidade | — |

## Dados lidos e gravados

| Entidade | Papel | Por que a funcionalidade a toca |
|---|---|---|
| Pedido | lê | Localiza o pedido aberto do cliente, que é o carrinho (RN-01) |

## Superfície

**Tela própria** — rota: Carrinho (`/carrinho`).

**Fidelidade ao protótipo**: referência · `prototypes/vendas/carrinho/flow.html` · [abrir o protótipo ↗](../../../prototypes/vendas/carrinho/flow.html)

## Comportamento de tela

### Onde fica

Tela **Carrinho** (`/carrinho`): a tabela dos itens, com a quantidade de cada um editável (VND-CAR-03 — Alterar Quantidade do Item) e o ícone de remover na linha (VND-CAR-04 — Remover Item do Carrinho); abaixo, o **Total dos itens** e o botão **Ir para o checkout**, que leva a VND-CHK-01 — Calcular Frete.

### Estados da tela

| Estado | Comportamento |
|---|---|
| Inicial | Itens do carrinho na ordem de inclusão e o total dos itens |
| Loading | Mostrar "Carregando…" no lugar da tabela |
| Erro de servidor | Mostrar "Não foi possível carregar os dados." |
| Sucesso | Tabela com os itens, subtotais e o total dos itens |
| Empty state | Mostrar "Seu carrinho está vazio." e deixar "Ir para o checkout" indisponível |
| Estoque reduzido | Sinalizar a linha com "O estoque deste produto é menor que a quantidade no carrinho." |

## Critérios de sucesso

| # | Critério mensurável | Origem |
|---|---|---|
| SC-01 | O subtotal de cada linha é exatamente a quantidade × o preço unitário | CA-2 e RN-02 |
| SC-02 | O total dos itens é igual à soma dos subtotais exibidos, sem frete | CA-2 e RN-03 |
| SC-03 | Nenhum item de outro cliente aparece no carrinho | CA-2 e RN-01 |

## Métricas de tamanho

| Função de Transação | Papel | Tipo | ALR | DER | Complexidade | PF | Data |
|---|---|---|---|---|---|---|---|
| Listar Itens do Carrinho | principal | — | — | — | — | — | — |

A contagem está pendente e deve nascer da análise desta funcionalidade via CT, com memória de cálculo.

## Origem

| Ticket (AIMM) | Tipo | Critérios cobertos |
|---|---|---|
| [`STRY0013185`](../../../analise-impacto/AIMM-STRY0013185.md) | Criação | `CA-2` — mostrar cada item com preço unitário, quantidade e subtotal, e o total dos itens |

## Changelog

| Data | Autor | Tipo | Descrição |
|---|---|---|---|
| 2026-10-18 | Claude | N3 criado | Listagem dos itens do carrinho a partir do ticket fictício STRY0013185, com subtotais, total dos itens e sinal de estoque reduzido; gates sem aprovação e contagem pendente. |
| 2026-10-18 | Claude | Ajuste | Seções reordenadas: a Superfície vai para antes da seção Comportamento de tela e a Origem vai para antes da seção Changelog. Nenhuma regra, cenário ou campo muda. |
| 2026-10-20 | Docqui Caixa | Terminologia | Adoção de AIMM; histórico e chave preservados. |
| 2026-10-21 | Docqui Caixa | Terminologia | Níveis em português: Domínio, Agrupamento Funcional e Funcionalidade; histórico preservado. |
