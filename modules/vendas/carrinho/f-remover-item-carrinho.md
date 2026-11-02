<!-- docqui: 7.0.0 | prompt: MIGRA_NIVEIS | atualizado: 2026-10-21 -->
---
id: VND-CAR-04
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

# Remover Item do Carrinho
> **Nível 3** - Agrupamento Funcional: Carrinho — Domínio: Vendas - `VND-CAR-04`

## Descrição

Permite que o cliente remova um item do carrinho, que deixa de contar no total dos itens.

No **Carrinho**, o cliente aciona o ícone **Remover** na linha do item; a remoção é imediata, sem caixa de confirmação, e o total dos itens se atualiza.

## Regras de negócio

- **RN-01** — O item removido sai do carrinho e deixa de contar no total dos itens.
- **RN-02** — O carrinho que fica sem itens continua aberto para o cliente. → ver N1 Vendas: Regras transversais de negócio: 2

## Cenários

```gherkin
Feature: Remover Item do Carrinho

  Background:
    Given que a cliente Ana Costa está no carrinho
    And que o carrinho tem 5 itens e o total dos itens é R$ 339,20, com 1 Ecobag ACME de lona a R$ 34,90

  # Caminho feliz
  @RN-01
  # ← MESSAGE-DICTIONARY: VND_ITEM_REMOVIDO
  Scenario: Item removido do carrinho
    When Ana Costa aciona "Remover" na linha da Ecobag ACME de lona
    Then o sistema exibe "Item removido do carrinho."
    And a Ecobag ACME de lona não aparece mais no carrinho
    And o total dos itens passa a R$ 304,30

  # Restrições de acesso
  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Tentativa sem acesso à funcionalidade
    Given que a pessoa não tem acesso à funcionalidade
    When tenta remover um item do carrinho
    Then o sistema exibe "Você não tem permissão para esta ação."
    And o carrinho não muda

  # Estados especiais
  @RN-02
  # ← MESSAGE-DICTIONARY: VND_ITEM_REMOVIDO
  # ← MESSAGE-DICTIONARY: VND_CARRINHO_SEM_ITENS
  Scenario: Remoção do último item
    Given que o carrinho de Ana Costa tem apenas a Ecobag ACME de lona
    When Ana Costa aciona "Remover" na linha da Ecobag ACME de lona
    Then o sistema exibe "Item removido do carrinho."
    And o sistema exibe "Seu carrinho está vazio."
    And o carrinho de Ana Costa continua aberto, sem itens

  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Item já removido em outra janela
    Given que a Ecobag ACME de lona foi removida do carrinho em outra janela
    When Ana Costa aciona "Remover" na linha da Ecobag ACME de lona nesta janela
    Then o sistema exibe "Registro não encontrado."
    And atualiza a lista de itens do carrinho

  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Falha inesperada ao remover
    When a remoção não pode ser concluída por falha inesperada
    Then o sistema exibe "Ocorreu um erro. Tente novamente."
    And a Ecobag ACME de lona continua no carrinho
```

## Campos

| Label PO | Entidade | Preenchimento | Edição | Tipo | Obrigatório | Validação |
|---|---|---|---|---|---|---|
| Nome do produto | Produto | exibido do cadastro | somente leitura | texto | não | Identifica na linha o item a remover |
| Total dos itens | derivado ↓ | calculado | somente leitura | valor | não | → ver FIELD-DICTIONARY: Valor monetário |

## Derivações

| Campo derivado | Fórmula (Label PO) | Campos-fonte (Entidade) |
|---|---|---|
| Total dos itens | Soma de Quantidade × Preço unitário dos itens que ficaram no carrinho | Quantidade (ItemPedido), Preço unitário (ItemPedido) |

## Campos automáticos

| Label PO | Valor | Quando |
|---|---|---|
| — | Nenhum campo é preenchido automaticamente nesta funcionalidade | — |

## Dados lidos e gravados

| Entidade | Papel | Por que a funcionalidade a toca |
|---|---|---|
| Pedido | lê | Localiza o pedido aberto do cliente, que continua aberto mesmo sem itens (RN-02) |

## Superfície

**Ação em tela** — origem: Listar Itens do Carrinho (Carrinho, `/carrinho`).

**Fidelidade ao protótipo**: referência · `prototypes/vendas/carrinho/flow.html` · [abrir o protótipo ↗](../../../prototypes/vendas/carrinho/flow.html)

## Comportamento de tela

### Onde fica

Na tela **Carrinho** (VND-CAR-02 — Listar Itens do Carrinho), o ícone **Remover** na coluna de ações de cada linha. Não há caixa de confirmação: o item sai na hora e o total dos itens se atualiza.

### Estados da tela

| Estado | Comportamento |
|---|---|
| Inicial | Ícone Remover disponível em cada linha |
| Loading | Bloquear o ícone da linha enquanto remove |
| Erro de servidor | Mostrar "Ocorreu um erro. Tente novamente." e manter o item |
| Sucesso | Aviso "Item removido do carrinho." e o total dos itens recalculado |
| Empty state | Ao remover o último item, mostrar "Seu carrinho está vazio." |
| Item não encontrado | Mostrar "Registro não encontrado." e recarregar a lista de itens |

## Critérios de sucesso

| # | Critério mensurável | Origem |
|---|---|---|
| SC-01 | O item removido não aparece mais no carrinho e o total dos itens cai exatamente o valor do subtotal dele | CA-4 e RN-01 |
| SC-02 | Remover o último item deixa o carrinho vazio, sem encerrar o pedido aberto do cliente | CA-4 e RN-02 |

## Métricas de tamanho

| Função de Transação | Papel | Tipo | ALR | DER | Complexidade | PF | Data |
|---|---|---|---|---|---|---|---|
| Remover Item do Carrinho | principal | — | — | — | — | — | — |

A contagem está pendente e deve nascer da análise desta funcionalidade via CT, com memória de cálculo.

## Origem

| Ticket (AIMM) | Tipo | Critérios cobertos |
|---|---|---|
| [`STRY0013185`](../../../analise-impacto/AIMM-STRY0013185.md) | Criação | `CA-4` — remover um item do carrinho |

## Changelog

| Data | Autor | Tipo | Descrição |
|---|---|---|---|
| 2026-10-18 | Claude | N3 criado | Remoção de um item do carrinho a partir do ticket fictício STRY0013185, sem caixa de confirmação e com o carrinho aberto mesmo vazio; gates sem aprovação e contagem pendente. |
| 2026-10-18 | Claude | Ajuste | Seções reordenadas: a Superfície vai para antes da seção Comportamento de tela e a Origem vai para antes da seção Changelog. Nenhuma regra, cenário ou campo muda. |
| 2026-10-20 | Docqui Caixa | Terminologia | Adoção de AIMM; histórico e chave preservados. |
| 2026-10-21 | Docqui Caixa | Terminologia | Níveis em português: Domínio, Agrupamento Funcional e Funcionalidade; histórico preservado. |
