<!-- docqui: 7.0.0 | prompt: MIGRA_NIVEIS | atualizado: 2026-10-21 -->
---
id: VIT-NAV-01
agrupamento_funcional: VIT-NAV
dominio: VIT
entidade: Destaque
data_model_ref: data-models/vitrine.md#destaque
endpoints: []
error_codes: []
depende_de: ["VIT-DST-02"]
origem:
  tipo: servicenow
  chave: STRY0013175
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

# Listar Destaques
> **Nível 3** - Agrupamento Funcional: Navegação — Domínio: Vitrine - `VIT-NAV-01`

## Descrição

Permite que a pessoa que visita a loja veja, na página inicial, os produtos em destaque vigentes, com a chamada, o preço e a disponibilidade de cada um, na ordem escolhida pela equipe de vendas.

Ao abrir a loja, a página inicial mostra os destaques em cards; escolher um card abre a página do produto, em VIT-NAV-03 — Visualizar Produto na Vitrine. Não há nada a informar: a lista sai das vigências e da ordem cadastradas em VIT-DST-02 — Cadastrar Destaque.

## Regras de negócio

- **RN-01** — Só aparecem os destaques vigentes: a data de hoje está entre o início e o fim da vigência, inclusive. → ver RULES-DICTIONARY: RC-03 — Período de vigência (parâmetro: Início da vigência e Fim da vigência, limites inclusive)
- **RN-02** — Os destaques aparecem em ordem crescente de Ordem de exibição; no empate, o destaque cadastrado primeiro vem antes.
- **RN-03** — Destaque de produto de categoria inativa não aparece. → ver N1 Vitrine: Regras transversais de negócio: 1
- **RN-04** — Produto com quantidade em estoque zero aparece com o selo de esgotado. → ver N1 Vitrine: Regras transversais de negócio: 2
- **RN-05** — O preço mostrado é o preço atual do produto no Catálogo. → ver N1 Vitrine: Regras transversais de negócio: 3

## Cenários

```gherkin
Feature: Listar Destaques

  Background:
    Given que hoje é 18/10/2026
    And que os destaques da demonstração estão cadastrados

  # Caminho feliz
  @RN-01 @RN-02
  # ← RULES-DICTIONARY: RC-03 — Período de vigência
  Scenario: Página inicial com os destaques vigentes, na ordem de exibição
    When a pessoa abre a página inicial da loja
    Then o sistema mostra, nesta ordem, "Garrafa térmica ACME 500 ml" com a chamada "Café quente o dia todo", "Camiseta ACME algodão — tamanho M" com a chamada "Nova coleção de algodão" e "Boné ACME aba curva" com a chamada "Volta em breve"
    And não mostra "Caneca de cerâmica ACME 300 ml", cujo destaque terminou em 15/10/2026
    And não mostra "Ecobag ACME de lona", cujo destaque começa em 20/11/2026

  @RN-02
  Scenario: Empate na ordem de exibição
    Given que dois destaques vigentes têm a ordem de exibição 2
    When a pessoa abre a página inicial da loja
    Then o sistema mostra primeiro o destaque cadastrado antes

  @RN-05
  Scenario: Preço atualizado no Catálogo
    Given que o preço da "Garrafa térmica ACME 500 ml" passou de R$ 89,90 para R$ 84,90 no Catálogo
    When a pessoa abre a página inicial da loja
    Then o card da "Garrafa térmica ACME 500 ml" mostra "R$ 84,90"

  # Conflitos com dados existentes
  @RN-03
  Scenario: Destaque de produto de categoria inativa
    Given que a "Almofada ACME estampada", da categoria inativa "Decoração", tem um destaque vigente
    When a pessoa abre a página inicial da loja
    Then o sistema não mostra o destaque da "Almofada ACME estampada"

  # Estados especiais
  @RN-04
  # ← MESSAGE-DICTIONARY: VIT_SELO_ESGOTADO
  Scenario: Produto em destaque sem estoque
    Given que o "Boné ACME aba curva" tem quantidade em estoque zero
    When a pessoa abre a página inicial da loja
    Then o card do "Boné ACME aba curva" mostra o selo "Esgotado"

  # ← MESSAGE-DICTIONARY: VIT_SEM_DESTAQUES
  Scenario: Nenhum destaque vigente
    Given que nenhum destaque está vigente em 18/10/2026
    When a pessoa abre a página inicial da loja
    Then o sistema exibe "Nenhum destaque no momento. Use a busca para encontrar produtos."

  # ← MESSAGE-DICTIONARY: ERROR_STATE
  Scenario: Falha ao carregar os destaques
    When os destaques não podem ser carregados por falha inesperada
    Then o sistema exibe "Não foi possível carregar os dados."
```

## Campos

| Label PO | Entidade | Preenchimento | Edição | Tipo | Obrigatório | Validação |
|---|---|---|---|---|---|---|
| Chamada | Destaque | exibido do cadastro | somente leitura | texto | não | Frase do destaque, como cadastrada |
| Nome do produto | Produto | exibido do cadastro | somente leitura | texto | não | Nome do produto do destaque |
| Preço | Produto | exibido do cadastro | somente leitura | valor | não | → ver FIELD-DICTIONARY: Valor monetário |
| Disponibilidade | derivado ↓ | calculado | somente leitura | texto | não | Selo "Esgotado" quando o produto não tem estoque |

## Derivações

| Campo derivado | Fórmula (Label PO) | Campos-fonte (Entidade) |
|---|---|---|
| Disponibilidade | Selo "Esgotado" quando a Quantidade em estoque é zero; sem selo nos demais casos | Quantidade em estoque (Produto) |

## Colunas do resultado

| Coluna (Label PO) | Origem | Ordenação |
|---|---|---|
| Nome do produto | entidade relacionada (Produto) | padrão ↑ pela Ordem de exibição |
| Chamada | cadastro | — |
| Preço | entidade relacionada (Produto) | — |
| Disponibilidade | derivado | — |

## Campos automáticos

| Label PO | Valor | Quando |
|---|---|---|
| — | Nenhum campo é preenchido automaticamente nesta funcionalidade | — |

## Dados lidos e gravados

| Entidade | Papel | Por que a funcionalidade a toca |
|---|---|---|
| Categoria | lê | A situação da categoria do produto decide se o destaque aparece (RN-03) |

## Superfície

**Tela própria** — rota: Página inicial (`/`).

**Fidelidade ao protótipo**: referência · `prototypes/vitrine/navegacao/flow.html` · [abrir o protótipo ↗](../../../prototypes/vitrine/navegacao/flow.html)

## Comportamento de tela

### Onde fica

Os destaques ocupam o corpo da página inicial (`/`), abaixo do campo de busca, um card por destaque com o nome do produto, a chamada, o preço e, quando for o caso, o selo de esgotado. O card inteiro leva à página do produto, em VIT-NAV-03 — Visualizar Produto na Vitrine; o campo de busca leva a VIT-NAV-02 — Pesquisar Produtos na Vitrine.

### Estados da tela

| Estado | Comportamento |
|---|---|
| Loading | Mostrar "Carregando…" e o espaço dos cards em esqueleto |
| Erro de servidor | Mostrar "Não foi possível carregar os dados." no lugar dos cards |
| Sucesso | Mostrar os cards dos destaques vigentes, na ordem de exibição |
| Empty state | Mostrar "Nenhum destaque no momento. Use a busca para encontrar produtos." |
| Produto esgotado | O card do produto sem estoque mostra o selo "Esgotado" e continua levando à página do produto |

## Critérios de sucesso

| # | Critério mensurável | Origem |
|---|---|---|
| SC-01 | Em 18/10/2026, a página inicial mostra exatamente os três destaques vigentes da demonstração, na ordem Garrafa, Camiseta e Boné | CA-1, RN-01 e RN-02 |
| SC-02 | Nenhum destaque de produto de categoria inativa aparece na página inicial | CA-1 e RN-03 |
| SC-03 | Todo produto em destaque com quantidade em estoque zero aparece com o selo "Esgotado" | RN-04 |

## Métricas de tamanho

| Função de Transação | Papel | Tipo | ALR | DER | Complexidade | PF | Data |
|---|---|---|---|---|---|---|---|
| Listar Destaques | principal | — | — | — | — | — | — |

A contagem está pendente e deve nascer da análise desta funcionalidade via CT, com memória de cálculo.

## Origem

| Ticket (AIMM) | Tipo | Critérios cobertos |
|---|---|---|
| [`STRY0013175`](../../../analise-impacto/AIMM-STRY0013175.md) | Criação | `CA-1` — página inicial com os destaques vigentes, na ordem definida pela equipe de vendas |

## Changelog

| Data | Autor | Tipo | Descrição |
|---|---|---|---|
| 2026-10-18 | Claude | N3 criado | Página inicial com os destaques vigentes do ticket fictício STRY0013175, regras, cenários e estados de tela; gates sem aprovação e contagem pendente. |
| 2026-10-18 | Claude | Ajuste | Seções reordenadas: a Superfície vai para antes da seção Comportamento de tela e a Origem vai para antes da seção Changelog. Nenhuma regra, cenário ou campo muda. |
| 2026-10-20 | Docqui Caixa | Terminologia | Adoção de AIMM; histórico e chave preservados. |
| 2026-10-21 | Docqui Caixa | Terminologia | Níveis em português: Domínio, Agrupamento Funcional e Funcionalidade; histórico preservado. |
