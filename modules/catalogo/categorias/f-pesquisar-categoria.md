<!-- docqui: 7.0.0 | prompt: MIGRA_NIVEIS | atualizado: 2026-10-21 -->
---
id: CAT-CTG-01
agrupamento_funcional: CAT-CTG
dominio: CAT
entidade: Categoria
data_model_ref: data-models/catalogo.md#categoria
endpoints: []
error_codes: []
depende_de: []
origem:
  tipo: servicenow
  chave: STRY0013170
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

# Pesquisar Categorias
> **Nível 3** - Agrupamento Funcional: Categorias — Domínio: Catálogo - `CAT-CTG-01`

## Descrição

Permite que o gestor de catálogo pesquise as categorias de produtos pelo nome e pela situação, vendo de cada uma quantos produtos ela agrupa.

Na Pesquisa de Categorias, a lista abre com todas as categorias em ordem alfabética; o gestor informa parte do nome, escolhe a situação e aciona **Pesquisar**. De cada linha partem as ações de visualizar, editar e excluir, e do topo da tela parte o cadastro de uma nova categoria.

## Regras de negócio

- **RN-01** — A pesquisa por nome encontra as categorias cujo nome contém o termo informado, sem diferenciar maiúsculas, minúsculas e acentos.
- **RN-02** — Sem critério informado, a pesquisa traz todas as categorias, ativas e inativas, em ordem alfabética do nome.
- **RN-03** — A quantidade de produtos de uma categoria é o número de produtos vinculados a ela, esgotados inclusive.

## Cenários

```gherkin
Feature: Pesquisar Categorias

  Background:
    Given que o gestor de catálogo está na Pesquisa de Categorias
    And que existem as categorias Cozinha, Vestuário, Papelaria, Acessórios e Brinquedos, ativas, e Decoração, inativa

  # Caminho feliz
  @RN-02
  Scenario: Lista inicial com todas as categorias
    When a Pesquisa de Categorias abre sem filtro
    Then o sistema lista as seis categorias em ordem alfabética, de "Acessórios" a "Vestuário"
    And a lista inclui a categoria inativa "Decoração"

  @RN-01
  Scenario: Pesquisa por parte do nome
    When o gestor informa "pape" no filtro Nome da categoria
    And aciona "Pesquisar"
    Then o sistema lista apenas a categoria "Papelaria"

  @RN-01
  Scenario: Pesquisa sem acento encontra nome acentuado
    When o gestor informa "decoracao" no filtro Nome da categoria
    And aciona "Pesquisar"
    Then o sistema lista a categoria "Decoração"

  Scenario: Pesquisa por situação
    When o gestor escolhe "Inativa" no filtro Situação
    And aciona "Pesquisar"
    Then o sistema lista apenas a categoria "Decoração"

  @RN-03
  Scenario: Quantidade de produtos de cada categoria
    When a Pesquisa de Categorias abre sem filtro
    Then a linha "Cozinha" mostra 2 em Quantidade de produtos
    And a linha "Decoração" mostra 1 em Quantidade de produtos
    And a linha "Brinquedos" mostra 0 em Quantidade de produtos

  # Erros de validação
  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Pesquisa sem resultado
    When o gestor informa "relógio" no filtro Nome da categoria
    And aciona "Pesquisar"
    Then o sistema exibe "Nenhum resultado para a busca."

  # Restrições de acesso
  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Tentativa sem acesso à funcionalidade
    Given que a pessoa não tem acesso à funcionalidade
    When tenta abrir a Pesquisa de Categorias
    Then o sistema exibe "Você não tem permissão para esta ação."
    And não lista nenhuma categoria

  # Estados especiais
  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Nenhuma categoria cadastrada
    Given que não existe nenhuma categoria cadastrada
    When a Pesquisa de Categorias abre sem filtro
    Then o sistema exibe "Nenhum registro encontrado."

  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Falha ao carregar a lista
    When a lista não pode ser carregada por falha inesperada
    Then o sistema exibe "Não foi possível carregar os dados."
```

## Campos

| Label PO | Entidade | Preenchimento | Edição | Tipo | Obrigatório | Validação |
|---|---|---|---|---|---|---|
| Nome da categoria (filtro) | Categoria | entrada do usuário | editável | texto | não | Correspondência parcial, sem diferenciar maiúsculas, minúsculas e acentos |
| Situação (filtro) | Categoria | entrada do usuário | editável | lista (Todas, Ativa, Inativa) | não | Padrão: Todas |
| Quantidade de produtos | derivado ↓ | calculado | somente leitura | número | não | Inteiro maior ou igual a zero |

## Derivações

| Campo derivado | Fórmula (Label PO) | Campos-fonte (Entidade) |
|---|---|---|
| Quantidade de produtos | Contagem dos produtos cuja Categoria é a categoria da linha | Categoria (Produto) |

## Colunas do resultado

| Coluna (Label PO) | Origem | Ordenação |
|---|---|---|
| Nome da categoria | cadastro | padrão ↑ |
| Situação | cadastro | ordenável |
| Quantidade de produtos | derivado | ordenável |
| Data de cadastro | cadastro | ordenável |

## Campos automáticos

| Label PO | Valor | Quando |
|---|---|---|
| — | Nenhum campo é preenchido automaticamente nesta funcionalidade | — |

## Superfície

**Tela própria** — rota: Pesquisa de Categorias (`/catalogo/categorias`).

**Fidelidade ao protótipo**: referência · `prototypes/catalogo/categorias/flow.html` · [abrir o protótipo ↗](../../../prototypes/catalogo/categorias/flow.html)

## Comportamento de tela

### Onde fica

A Pesquisa de Categorias é a tela de entrada do Agrupamento Funcional, com o card de filtros (Nome da categoria e Situação) acima da tabela de resultado. O botão **Cadastrar categoria** fica no topo da lista e abre CAT-CTG-02 — Cadastrar Categoria em modal; em cada linha, os ícones de visualizar, editar e excluir acionam CAT-CTG-05 — Visualizar Categoria, CAT-CTG-03 — Editar Categoria e CAT-CTG-04 — Excluir Categoria.

### Estados da tela

| Estado | Comportamento |
|---|---|
| Inicial | Filtros vazios e a lista de todas as categorias em ordem alfabética |
| Loading | Mostrar "Carregando…" no lugar da tabela enquanto pesquisa |
| Erro de servidor | Mostrar "Não foi possível carregar os dados." no lugar da tabela |
| Sucesso | Mostrar as categorias encontradas, com o total de registros acima da tabela |
| Empty state | Sem nenhuma categoria cadastrada, mostrar "Nenhum registro encontrado." |
| Busca sem resultado | Mostrar "Nenhum resultado para a busca." e manter os filtros informados |

## Critérios de sucesso

| # | Critério mensurável | Origem |
|---|---|---|
| SC-01 | A pesquisa por qualquer parte do nome, com ou sem acento, encontra a categoria correspondente | CA-1 e RN-01 |
| SC-02 | A lista inicial traz todas as categorias, ativas e inativas, em ordem alfabética | CA-1 e RN-02 |
| SC-03 | A quantidade de produtos de cada linha confere com os produtos vinculados à categoria | CA-1 e RN-03 |

## Métricas de tamanho

| Função de Transação | Papel | Tipo | ALR | DER | Complexidade | PF | Data |
|---|---|---|---|---|---|---|---|
| Pesquisar Categorias | principal | — | — | — | — | — | — |

A contagem está pendente e deve nascer da análise desta funcionalidade via CT, com memória de cálculo.

## Origem

| Ticket (AIMM) | Tipo | Critérios cobertos |
|---|---|---|
| [`STRY0013170`](../../../analise-impacto/AIMM-STRY0013170.md) | Criação | `CA-1` — pesquisa das categorias por nome e por situação |

## Changelog

| Data | Autor | Tipo | Descrição |
|---|---|---|---|
| 2026-10-18 | Claude | N3 criado | Pesquisa de categorias derivada do cadastro, a partir do ticket fictício STRY0013170, com filtros, colunas, regras e cenários; gates sem aprovação e contagem pendente. |
| 2026-10-18 | Claude | Ajuste | Seções reordenadas: a Superfície vai para antes da seção Comportamento de tela e a Origem vai para antes da seção Changelog. Nenhuma regra, cenário ou campo muda. |
| 2026-10-20 | Docqui Caixa | Terminologia | Adoção de AIMM; histórico e chave preservados. |
| 2026-10-21 | Docqui Caixa | Terminologia | Níveis em português: Domínio, Agrupamento Funcional e Funcionalidade; histórico preservado. |
