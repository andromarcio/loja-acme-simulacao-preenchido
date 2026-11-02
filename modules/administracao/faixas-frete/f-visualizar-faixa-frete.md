<!-- docqui: 7.0.0 | prompt: MIGRA_NIVEIS | atualizado: 2026-10-21 -->
---
id: ADM-FRT-05
agrupamento_funcional: ADM-FRT
dominio: ADM
entidade: TabelaFrete
data_model_ref: data-models/vendas.md#tabelafrete
endpoints: []
error_codes: []
depende_de: []
origem:
  tipo: servicenow
  chave: STRY0013200
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

# Visualizar Faixa de Frete
> **Nível 3** - Agrupamento Funcional: Faixas de Frete — Domínio: Administração - `ADM-FRT-05`

## Descrição

Permite que o administrador e o atendente consultem todos os dados de uma faixa de frete, inclusive quantos pedidos ela atende, sem alterar nada.

Na Pesquisa de Faixas de Frete, a pessoa aciona a ação de visualizar na linha da faixa e vê a ficha somente leitura; **Voltar** retorna à pesquisa.

## Regras de negócio

- **RN-01** — A quantidade de pedidos conta os pedidos que usam a faixa, de qualquer situação.
- **RN-02** — O valor do frete mostrado é o valor atual da faixa, o que vale para os próximos cálculos de frete.

## Cenários

```gherkin
Feature: Visualizar Faixa de Frete

  Background:
    Given que a pessoa está na Pesquisa de Faixas de Frete
    And que a Tabela de Frete tem as cinco faixas da demonstração

  # Caminho feliz
  @RN-01
  Scenario: Ficha de uma faixa que atende pedidos
    Given que a faixa "Centro — São Paulo" atende os pedidos 1001 e 1003
    When a pessoa aciona visualizar na linha da faixa "Centro — São Paulo"
    Then o sistema mostra a região "Centro — São Paulo", o CEP inicial "01310000", o CEP final "01310999" e o valor do frete "R$ 18,90"
    And mostra a quantidade de pedidos "2"
    And nenhum dado aparece para edição

  @RN-01
  Scenario: Ficha de uma faixa sem pedidos
    When a pessoa aciona visualizar na linha da faixa "Rio de Janeiro — Centro"
    Then o sistema mostra a quantidade de pedidos "0"

  @RN-02
  Scenario: Valor atual depois de uma alteração
    Given que o valor do frete da faixa "Campinas" foi alterado de R$ 32,90 para R$ 34,90
    When a pessoa aciona visualizar na linha da faixa "Campinas"
    Then o sistema mostra o valor do frete "R$ 34,90"

  # Restrições de acesso
  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Tentativa sem acesso à funcionalidade
    Given que a pessoa não tem acesso à funcionalidade
    When tenta visualizar uma faixa de frete
    Then o sistema exibe "Você não tem permissão para esta ação."
    And não mostra a ficha

  # Estados especiais
  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Faixa excluída antes da consulta
    Given que a faixa "Rio de Janeiro — Centro" foi excluída depois de a lista ser carregada
    When a pessoa aciona visualizar na linha dessa faixa
    Then o sistema exibe "Registro não encontrado."

  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Falha inesperada ao carregar a ficha
    When a ficha não pode ser carregada por falha inesperada
    Then o sistema exibe "Não foi possível carregar os dados."
```

## Campos

| Label PO | Entidade | Preenchimento | Edição | Tipo | Obrigatório | Validação |
|---|---|---|---|---|---|---|
| Região | TabelaFrete | exibido do cadastro | somente leitura | texto | não | — |
| CEP inicial | TabelaFrete | exibido do cadastro | somente leitura | texto | não | → ver FIELD-DICTIONARY: CEP |
| CEP final | TabelaFrete | exibido do cadastro | somente leitura | texto | não | → ver FIELD-DICTIONARY: CEP |
| Valor do frete | TabelaFrete | exibido do cadastro | somente leitura | valor | não | → ver FIELD-DICTIONARY: Valor monetário |
| Quantidade de pedidos | derivado ↓ | calculado | somente leitura | número | não | Contagem dos pedidos que usam a faixa |

## Derivações

| Campo derivado | Fórmula (Label PO) | Campos-fonte (Entidade) |
|---|---|---|
| Quantidade de pedidos | Contagem dos pedidos cuja Faixa de frete é esta faixa | Faixa de frete (Pedido) |

## Campos automáticos

| Label PO | Valor | Quando |
|---|---|---|
| — | Nenhum campo é preenchido automaticamente nesta funcionalidade | — |

## Superfície

**Tela própria** — rota: Visualizar Faixa de Frete (`/administracao/faixas-frete/:id`), acessada da Pesquisa de Faixas de Frete.

**Fidelidade ao protótipo**: referência · `prototypes/administracao/faixas-frete/flow.html` · [abrir o protótipo ↗](../../../prototypes/administracao/faixas-frete/flow.html)

## Comportamento de tela

### Onde fica

Visualizar Faixa de Frete é uma tela própria, aberta pela ação de visualizar na linha da faixa, na Pesquisa de Faixas de Frete: a ficha em rótulo e valor, com a região, o CEP inicial, o CEP final, o valor do frete e a quantidade de pedidos, e o único botão **Voltar**, que retorna à pesquisa.

### Estados da tela

| Estado | Comportamento |
|---|---|
| Loading | Mostrar "Carregando…" no lugar da ficha |
| Sucesso | Mostrar a ficha somente leitura, sem campo editável nem ação de gravação |
| Erro de servidor | Mostrar "Não foi possível carregar os dados." no lugar da ficha |
| Registro inexistente | Mostrar "Registro não encontrado." quando a faixa foi excluída |

## Critérios de sucesso

| # | Critério mensurável | Origem |
|---|---|---|
| SC-01 | A ficha de Centro — São Paulo mostra 2 pedidos, e a de Rio de Janeiro — Centro, 0 | CA-5 e RN-01 |
| SC-02 | A ficha mostra a região, o CEP inicial, o CEP final e o valor do frete, sem campo editável | CA-5 |
| SC-03 | Depois de uma alteração do valor, a ficha mostra o valor novo | CA-5 e RN-02 |

## Métricas de tamanho

| Função de Transação | Papel | Tipo | ALR | DER | Complexidade | PF | Data |
|---|---|---|---|---|---|---|---|
| Visualizar Faixa de Frete | principal | — | — | — | — | — | — |

A contagem está pendente e deve nascer da análise desta funcionalidade via CT, com memória de cálculo.

## Origem

| Ticket (AIMM) | Tipo | Critérios cobertos |
|---|---|---|
| [`STRY0013200`](../../../analise-impacto/AIMM-STRY0013200.md) | Criação | `CA-5` — consulta de todos os dados de uma faixa de frete |

## Changelog

| Data | Autor | Tipo | Descrição |
|---|---|---|---|
| 2026-10-18 | Claude | N3 criado | Ficha somente leitura da faixa de frete, com a quantidade de pedidos derivada, gerada pelo PROMPT CRUD a partir do ticket fictício STRY0013200; gates sem aprovação e contagem pendente. |
| 2026-10-18 | Claude | Ajuste | Seções reordenadas: a Superfície vai para antes da seção Comportamento de tela e a Origem vai para antes da seção Changelog. Nenhuma regra, cenário ou campo muda. |
| 2026-10-20 | Docqui Caixa | Terminologia | Adoção de AIMM; histórico e chave preservados. |
| 2026-10-21 | Docqui Caixa | Terminologia | Níveis em português: Domínio, Agrupamento Funcional e Funcionalidade; histórico preservado. |
