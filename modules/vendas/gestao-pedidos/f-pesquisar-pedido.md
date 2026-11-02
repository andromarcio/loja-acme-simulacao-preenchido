<!-- docqui: 7.0.0 | prompt: MIGRA_NIVEIS | atualizado: 2026-10-21 -->
---
id: VND-PED-01
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

# Pesquisar Pedidos
> **Nível 3** - Agrupamento Funcional: Gestão de Pedidos — Domínio: Vendas - `VND-PED-01`

## Descrição

Permite que o atendente encontre os pedidos confirmados e cancelados dos clientes por número, cliente, situação e período da confirmação, vendo o total de cada pedido.

Na Pesquisa de Pedidos, o atendente informa um ou mais filtros e aciona **Pesquisar**; sem filtro, a lista mostra os pedidos confirmados nos últimos 30 dias, e cada linha leva a VND-PED-02 — Visualizar Pedido.

## Regras de negócio

- **RN-01** — A pesquisa lista apenas pedidos confirmados ou cancelados; o pedido aberto, que é o carrinho do cliente, não aparece. → ver N1 Vendas: Regras transversais de negócio: 2
- **RN-02** — Quando nenhum critério é informado, a pesquisa considera os pedidos com data da confirmação nos últimos 30 dias, do mais recente para o mais antigo.
- **RN-03** — O total do pedido é a soma, item a item, da quantidade multiplicada pelo preço unitário, mais o valor do frete.
- **RN-04** — No período da confirmação, a data final é igual ou posterior à data inicial.
- **RN-05** — A busca por cliente encontra os pedidos cujo nome do cliente contém o termo informado, sem diferenciar maiúsculas, minúsculas e acentos.

## Cenários

```gherkin
Feature: Pesquisar Pedidos

  Background:
    Given que o atendente está na Pesquisa de Pedidos
    And que hoje é 18/10/2026
    And que a loja tem os pedidos confirmados 1001, 1002, 1005 e 1006, o pedido cancelado 1003 e os pedidos abertos 1004 e 1007

  # Caminho feliz
  @RN-02 @RN-03
  Scenario: Lista inicial sem filtro
    When o atendente abre a pesquisa sem informar filtro
    Then o sistema lista os pedidos 1006, 1005, 1003, 1002 e 1001, nesta ordem
    And o pedido 1001 aparece com o total do pedido R$ 158,60
    And o pedido 1006 aparece com o total do pedido R$ 63,50

  @RN-05
  Scenario: Pedidos encontrados por parte do nome do cliente
    When o atendente informa "COSTA" no filtro Cliente
    And aciona "Pesquisar"
    Then o sistema lista os pedidos 1003 e 1001, da cliente Ana Costa

  Scenario: Pedido encontrado pelo número
    When o atendente informa "1002" no filtro Número do pedido
    And aciona "Pesquisar"
    Then o sistema lista apenas o pedido 1002, de Marcos Pereira, com o total do pedido R$ 112,40

  Scenario: Pedidos filtrados pela situação
    When o atendente escolhe "Cancelado" no filtro Situação
    And aciona "Pesquisar"
    Then o sistema lista apenas o pedido 1003

  Scenario: Pedidos filtrados pelo período da confirmação
    When o atendente informa "14/10/2026" em Confirmado de e "16/10/2026" em Confirmado até
    And aciona "Pesquisar"
    Then o sistema lista os pedidos 1005, 1003 e 1002, nesta ordem

  # Erros de validação
  @RN-04
  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Período com a data final antes da inicial
    When o atendente informa "17/10/2026" em Confirmado de e "12/10/2026" em Confirmado até
    And aciona "Pesquisar"
    Then o sistema exibe abaixo do campo Confirmado até "A data final não pode ser anterior à data inicial."
    And não executa a pesquisa

  # Conflitos com dados existentes
  @RN-01
  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Pedido aberto não aparece na pesquisa
    When o atendente informa "1007" no filtro Número do pedido
    And aciona "Pesquisar"
    Then o sistema exibe "Nenhum resultado para a busca."

  # Restrições de acesso
  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Tentativa sem acesso à funcionalidade
    Given que a pessoa não tem acesso à funcionalidade
    When tenta pesquisar pedidos
    Then o sistema exibe "Você não tem permissão para esta ação."
    And não lista nenhum pedido

  # Estados especiais
  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Pesquisa sem resultado
    When o atendente informa "Fernanda" no filtro Cliente
    And aciona "Pesquisar"
    Then o sistema exibe "Nenhum resultado para a busca."

  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Nenhum pedido confirmado nos últimos 30 dias
    Given que nenhum pedido foi confirmado nos últimos 30 dias
    When o atendente abre a pesquisa sem informar filtro
    Then o sistema exibe "Nenhum registro encontrado."

  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Falha ao carregar os pedidos
    When a pesquisa não pode ser concluída por falha inesperada
    Then o sistema exibe "Não foi possível carregar os dados."
```

## Campos

| Label PO | Entidade | Preenchimento | Edição | Tipo | Obrigatório | Validação |
|---|---|---|---|---|---|---|
| Número do pedido (filtro) | Pedido | entrada do usuário | editável | número | não | Valor exato do número do pedido |
| Cliente (filtro) | Usuario | entrada do usuário | editável | texto | não | Parte do nome completo do cliente, sem diferenciar maiúsculas, minúsculas e acentos |
| Situação (filtro) | Pedido | entrada do usuário | editável | lista (Todas, Confirmado, Cancelado) | não | Padrão: Todas |
| Confirmado de (filtro) | Pedido | entrada do usuário | editável | data | não | Data inicial do período da confirmação |
| Confirmado até (filtro) | Pedido | entrada do usuário | editável | data | não | Igual ou posterior a Confirmado de |
| Total do pedido | derivado ↓ | calculado | somente leitura | valor | não | → ver FIELD-DICTIONARY: Valor monetário |

## Derivações

| Campo derivado | Fórmula (Label PO) | Campos-fonte (Entidade) |
|---|---|---|
| Total do pedido | Soma de Quantidade × Preço unitário de cada item + Valor do frete | Quantidade (ItemPedido), Preço unitário (ItemPedido), Valor do frete (Pedido) |

## Colunas do resultado

| Coluna (Label PO) | Origem | Ordenação |
|---|---|---|
| Número do pedido | cadastro | ordenável |
| Cliente | entidade relacionada (Usuario) | ordenável |
| Data da confirmação | cadastro | padrão ↓ |
| Situação | cadastro | — |
| Total do pedido | derivado | ordenável |

## Campos automáticos

| Label PO | Valor | Quando |
|---|---|---|
| — | Nenhum campo é preenchido automaticamente nesta funcionalidade | — |

## Superfície

**Tela própria** — rota: Pesquisa de Pedidos (`/vendas/pedidos`).

**Fidelidade ao protótipo**: referência · `prototypes/vendas/gestao-pedidos/flow.html` · [abrir o protótipo ↗](../../../prototypes/vendas/gestao-pedidos/flow.html)

## Comportamento de tela

### Onde fica

A Pesquisa de Pedidos (`/vendas/pedidos`) tem no topo o card de filtros — Número do pedido, Cliente, Situação e o período Confirmado de / Confirmado até — com os botões **Pesquisar** e **Limpar**, e abaixo a lista dos pedidos com o contador de resultados. Cada linha tem a ação Visualizar, que abre VND-PED-02 — Visualizar Pedido.

### Estados da tela

| Estado | Comportamento |
|---|---|
| Inicial | Filtros vazios; a lista mostra os pedidos confirmados nos últimos 30 dias, do mais recente para o mais antigo |
| Loading | Mostrar "Carregando…" no lugar da lista e evitar novo acionamento de **Pesquisar** |
| Erro de validação | Mostrar "A data final não pode ser anterior à data inicial." abaixo do campo Confirmado até, sem pesquisar |
| Erro de servidor | Mostrar "Não foi possível carregar os dados." no lugar da lista |
| Sucesso | Mostrar os pedidos que atendem a todos os filtros, com o contador atualizado |
| Empty state | Mostrar "Nenhum registro encontrado." quando não há pedido confirmado nos últimos 30 dias |
| Busca sem resultado | Mostrar "Nenhum resultado para a busca." quando os filtros não encontram pedido |

## Critérios de sucesso

| # | Critério mensurável | Origem |
|---|---|---|
| SC-01 | A pesquisa retorna só os pedidos que atendem a todos os filtros informados | CA-1 e RN-05 |
| SC-02 | Nenhum pedido aberto aparece na pesquisa | CA-1 e RN-01 |
| SC-03 | O total de cada linha é igual à soma dos itens mais o valor do frete do pedido | CA-1 e RN-03 |

## Métricas de tamanho

| Função de Transação | Papel | Tipo | ALR | DER | Complexidade | PF | Data |
|---|---|---|---|---|---|---|---|
| Pesquisar Pedidos | principal | — | — | — | — | — | — |

A contagem está pendente e deve nascer da análise desta funcionalidade via CT, com memória de cálculo.

## Origem

| Ticket (AIMM) | Tipo | Critérios cobertos |
|---|---|---|
| [`STRY0013190`](../../../analise-impacto/AIMM-STRY0013190.md) | Criação | `CA-1` — pesquisa dos pedidos por número, cliente, situação e período da confirmação |

## Changelog

| Data | Autor | Tipo | Descrição |
|---|---|---|---|
| 2026-10-18 | Claude | N3 criado | Pesquisa de pedidos do atendimento a partir do ticket fictício STRY0013190, com filtros, total derivado e cenários sobre a massa da demonstração; gates sem aprovação e contagem pendente. |
| 2026-10-18 | Claude | Ajuste | Seções reordenadas: a Superfície vai para antes da seção Comportamento de tela e a Origem vai para antes da seção Changelog. Nenhuma regra, cenário ou campo muda. |
| 2026-10-20 | Docqui Caixa | Terminologia | Adoção de AIMM; histórico e chave preservados. |
| 2026-10-21 | Docqui Caixa | Terminologia | Níveis em português: Domínio, Agrupamento Funcional e Funcionalidade; histórico preservado. |
