<!-- docqui: 7.0.0 | prompt: MIGRA_NIVEIS | atualizado: 2026-10-21 -->
---
id: VND-CAR-03
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

# Alterar Quantidade do Item
> **Nível 3** - Agrupamento Funcional: Carrinho — Domínio: Vendas - `VND-CAR-03`

## Descrição

Permite que o cliente altere a quantidade de um item do carrinho, até a quantidade em estoque, com o subtotal e o total dos itens recalculados.

No **Carrinho**, o cliente muda o número no campo **Quantidade** da linha do item e confirma a mudança; o preço unitário do item continua o mesmo.

## Regras de negócio

- **RN-01** — A nova quantidade do item não passa da quantidade em estoque do produto.
- **RN-02** — Alterar a quantidade não muda o preço unitário do item.
- **RN-03** — O subtotal do item e o total dos itens passam a refletir a nova quantidade.

## Cenários

```gherkin
Feature: Alterar Quantidade do Item

  Background:
    Given que a cliente Ana Costa está no carrinho
    And que o carrinho tem 2 Canecas de cerâmica ACME 300 ml a R$ 39,90 e o total dos itens é R$ 339,20
    And que a Caneca de cerâmica ACME 300 ml tem 120 unidades em estoque

  # Caminho feliz
  @RN-03
  # ← MESSAGE-DICTIONARY: VND_QUANTIDADE_ATUALIZADA
  Scenario: Quantidade alterada com subtotal e total recalculados
    When Ana Costa muda a quantidade da Caneca de cerâmica ACME 300 ml para 4
    Then o sistema exibe "Quantidade atualizada."
    And o subtotal da Caneca de cerâmica ACME 300 ml passa a R$ 159,60
    And o total dos itens passa a R$ 419,00

  @RN-02
  # ← MESSAGE-DICTIONARY: VND_QUANTIDADE_ATUALIZADA
  Scenario: Preço unitário mantido ao alterar a quantidade
    Given que o preço da Caneca de cerâmica ACME 300 ml no Catálogo passou a R$ 44,90
    When Ana Costa muda a quantidade da Caneca de cerâmica ACME 300 ml para 3
    Then o sistema exibe "Quantidade atualizada."
    And o preço unitário da Caneca de cerâmica ACME 300 ml continua R$ 39,90

  # Erros de validação
  # ← FIELD-DICTIONARY: Quantidade
  Scenario: Quantidade menor que 1
    When Ana Costa muda a quantidade da Caneca de cerâmica ACME 300 ml para 0
    Then o sistema exibe abaixo do campo "Informe uma quantidade válida."
    And a quantidade continua 2

  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Quantidade vazia
    When Ana Costa apaga a quantidade da Caneca de cerâmica ACME 300 ml
    Then o sistema exibe abaixo do campo "Campo obrigatório."
    And a quantidade continua 2

  # Conflitos com dados existentes
  @RN-01
  # ← MESSAGE-DICTIONARY: VND_ESTOQUE_INSUFICIENTE
  Scenario: Quantidade maior que o estoque
    Given que o carrinho tem 1 Garrafa térmica ACME 500 ml, que tem 35 unidades em estoque
    When Ana Costa muda a quantidade da Garrafa térmica ACME 500 ml para 36
    Then o sistema exibe "Quantidade indisponível em estoque."
    And a quantidade da Garrafa térmica ACME 500 ml continua 1

  # Restrições de acesso
  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Tentativa sem acesso à funcionalidade
    Given que a pessoa não tem acesso à funcionalidade
    When tenta alterar a quantidade de um item do carrinho
    Then o sistema exibe "Você não tem permissão para esta ação."
    And o carrinho não muda

  # Estados especiais
  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Item removido em outra janela
    Given que a Caneca de cerâmica ACME 300 ml foi removida do carrinho em outra janela
    When Ana Costa muda a quantidade da Caneca de cerâmica ACME 300 ml nesta janela
    Then o sistema exibe "Registro não encontrado."
    And atualiza a lista de itens do carrinho

  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Falha inesperada ao alterar
    When a alteração não pode ser concluída por falha inesperada
    Then o sistema exibe "Ocorreu um erro. Tente novamente."
    And a quantidade continua 2
```

## Campos

| Label PO | Entidade | Preenchimento | Edição | Tipo | Obrigatório | Validação |
|---|---|---|---|---|---|---|
| Nome do produto | Produto | exibido do cadastro | somente leitura | texto | não | — |
| Quantidade | ItemPedido | entrada do usuário | editável | número | sim | Até a quantidade em estoque do produto; → ver FIELD-DICTIONARY: Quantidade |
| Preço unitário | ItemPedido | exibido do cadastro | somente leitura | valor | não | → ver FIELD-DICTIONARY: Valor monetário |
| Subtotal | derivado ↓ | calculado | somente leitura | valor | não | → ver FIELD-DICTIONARY: Valor monetário |
| Total dos itens | derivado ↓ | calculado | somente leitura | valor | não | → ver FIELD-DICTIONARY: Valor monetário |

## Derivações

| Campo derivado | Fórmula (Label PO) | Campos-fonte (Entidade) |
|---|---|---|
| Subtotal | Quantidade × Preço unitário | Quantidade (ItemPedido), Preço unitário (ItemPedido) |
| Total dos itens | Soma dos Subtotais dos itens do carrinho | Quantidade (ItemPedido), Preço unitário (ItemPedido) |

## Campos automáticos

| Label PO | Valor | Quando |
|---|---|---|
| — | Nenhum campo é preenchido automaticamente nesta funcionalidade | — |

## Superfície

**Ação em tela** — origem: Listar Itens do Carrinho (Carrinho, `/carrinho`).

**Fidelidade ao protótipo**: referência · `prototypes/vendas/carrinho/flow.html` · [abrir o protótipo ↗](../../../prototypes/vendas/carrinho/flow.html)

## Comportamento de tela

### Onde fica

Na tela **Carrinho** (VND-CAR-02 — Listar Itens do Carrinho), o campo **Quantidade** de cada linha; a mudança vale ao sair do campo ou ao confirmar com Enter, e o subtotal da linha e o total dos itens se atualizam na hora.

### Estados da tela

| Estado | Comportamento |
|---|---|
| Inicial | Quantidade atual de cada item, editável |
| Loading | Bloquear o campo da linha enquanto grava a nova quantidade |
| Erro de validação | Mensagem literal abaixo do campo; a quantidade volta à anterior |
| Erro de servidor | Mostrar "Ocorreu um erro. Tente novamente." e manter a quantidade anterior |
| Sucesso | Aviso "Quantidade atualizada." com o subtotal e o total recalculados |
| Estoque insuficiente | Mostrar "Quantidade indisponível em estoque." e manter a quantidade anterior |
| Item não encontrado | Mostrar "Registro não encontrado." e recarregar a lista de itens |

## Critérios de sucesso

| # | Critério mensurável | Origem |
|---|---|---|
| SC-01 | Nenhuma alteração deixa um item com mais unidades do que a quantidade em estoque | CA-3 e RN-01 |
| SC-02 | Após a alteração, o subtotal e o total dos itens batem com a nova quantidade | CA-3 e RN-03 |
| SC-03 | O preço unitário de um item é o mesmo antes e depois de alterar a quantidade | CA-3 e RN-02 |

## Métricas de tamanho

| Função de Transação | Papel | Tipo | ALR | DER | Complexidade | PF | Data |
|---|---|---|---|---|---|---|---|
| Alterar Quantidade do Item | principal | — | — | — | — | — | — |

A contagem está pendente e deve nascer da análise desta funcionalidade via CT, com memória de cálculo.

## Origem

| Ticket (AIMM) | Tipo | Critérios cobertos |
|---|---|---|
| [`STRY0013185`](../../../analise-impacto/AIMM-STRY0013185.md) | Criação | `CA-3` — mudar a quantidade de um item sem passar da quantidade em estoque |

## Changelog

| Data | Autor | Tipo | Descrição |
|---|---|---|---|
| 2026-10-18 | Claude | N3 criado | Alteração da quantidade de um item do carrinho a partir do ticket fictício STRY0013185, com limite de estoque e recálculo do subtotal e do total; gates sem aprovação e contagem pendente. |
| 2026-10-18 | Claude | Ajuste | Seções reordenadas: a Superfície vai para antes da seção Comportamento de tela e a Origem vai para antes da seção Changelog. Nenhuma regra, cenário ou campo muda. |
| 2026-10-20 | Docqui Caixa | Terminologia | Adoção de AIMM; histórico e chave preservados. |
| 2026-10-21 | Docqui Caixa | Terminologia | Níveis em português: Domínio, Agrupamento Funcional e Funcionalidade; histórico preservado. |
