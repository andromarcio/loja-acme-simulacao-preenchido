<!-- docqui: 7.0.0 | prompt: MIGRA_NIVEIS | atualizado: 2026-10-21 -->
---
id: VIT-NAV-03
agrupamento_funcional: VIT-NAV
dominio: VIT
entidade: Produto
data_model_ref: data-models/catalogo.md#produto
endpoints: []
error_codes: []
depende_de: []
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

# Visualizar Produto na Vitrine
> **Nível 3** - Agrupamento Funcional: Navegação — Domínio: Vitrine - `VIT-NAV-03`

## Descrição

Permite que a pessoa que visita a loja abra a página de um produto e veja o nome, a descrição, a categoria, o preço e se há estoque, sabendo quanto vai pagar antes de decidir a compra.

A página abre ao escolher um card em VIT-NAV-01 — Listar Destaques ou em VIT-NAV-02 — Pesquisar Produtos na Vitrine; dali, o cliente segue para o carrinho pela ação de VND-CAR-01 — Adicionar Item ao Carrinho.

## Regras de negócio

- **RN-01** — Produto de categoria inativa não tem página na vitrine. → ver N1 Vitrine: Regras transversais de negócio: 1
- **RN-02** — Produto com quantidade em estoque zero aparece com o selo de esgotado. → ver N1 Vitrine: Regras transversais de negócio: 2
- **RN-03** — O preço mostrado é o preço atual do produto no Catálogo. → ver N1 Vitrine: Regras transversais de negócio: 3
- **RN-04** — Produto sem descrição tem página com os demais dados.

## Cenários

```gherkin
Feature: Visualizar Produto na Vitrine

  Background:
    Given que os produtos e as categorias da demonstração estão cadastrados

  # Caminho feliz
  @RN-03
  Scenario: Página de um produto com estoque
    When a pessoa abre a página da "Garrafa térmica ACME 500 ml"
    Then o sistema mostra o nome "Garrafa térmica ACME 500 ml", a categoria "Cozinha" e o preço "R$ 89,90"
    And mostra a disponibilidade "Em estoque"

  @RN-03
  Scenario: Preço atualizado no Catálogo
    Given que o preço da "Garrafa térmica ACME 500 ml" passou para R$ 84,90 no Catálogo
    When a pessoa abre a página da "Garrafa térmica ACME 500 ml"
    Then o sistema mostra o preço "R$ 84,90"

  # Conflitos com dados existentes
  @RN-01
  # ← MESSAGE-DICTIONARY: VIT_PRODUTO_INDISPONIVEL
  Scenario: Produto de categoria inativa
    Given que a "Almofada ACME estampada" é da categoria inativa "Decoração"
    When a pessoa abre o endereço da página da "Almofada ACME estampada"
    Then o sistema exibe "Este produto não está disponível na loja."
    And não mostra os dados do produto

  # Estados especiais
  @RN-02
  # ← MESSAGE-DICTIONARY: VIT_SELO_ESGOTADO
  Scenario: Produto sem estoque
    Given que o "Boné ACME aba curva" tem quantidade em estoque zero
    When a pessoa abre a página do "Boné ACME aba curva"
    Then o sistema mostra o preço "R$ 49,90" e o selo "Esgotado"

  @RN-04
  Scenario: Produto sem descrição
    Given que a "Caneta esferográfica ACME azul" não tem descrição
    When a pessoa abre a página da "Caneta esferográfica ACME azul"
    Then o sistema mostra o nome, a categoria "Papelaria", o preço "R$ 6,90" e a disponibilidade
    And não mostra o bloco de descrição

  # ← MESSAGE-DICTIONARY: VIT_PRODUTO_INDISPONIVEL
  Scenario: Produto inexistente
    When a pessoa abre o endereço de um produto que não existe no Catálogo
    Then o sistema exibe "Este produto não está disponível na loja."

  # ← MESSAGE-DICTIONARY: ERROR_STATE
  Scenario: Falha ao carregar o produto
    When a página do produto não pode ser carregada por falha inesperada
    Then o sistema exibe "Não foi possível carregar os dados."
```

## Campos

| Label PO | Entidade | Preenchimento | Edição | Tipo | Obrigatório | Validação |
|---|---|---|---|---|---|---|
| Nome do produto | Produto | exibido do cadastro | somente leitura | texto | não | Como cadastrado no Catálogo |
| Descrição | Produto | exibido do cadastro | somente leitura | texto | não | Omitida quando o produto não tem descrição |
| Categoria | Categoria | exibido do cadastro | somente leitura | texto | não | Nome da categoria do produto |
| Preço | Produto | exibido do cadastro | somente leitura | valor | não | → ver FIELD-DICTIONARY: Valor monetário |
| Disponibilidade | derivado ↓ | calculado | somente leitura | texto | não | "Em estoque" ou o selo "Esgotado" |

## Derivações

| Campo derivado | Fórmula (Label PO) | Campos-fonte (Entidade) |
|---|---|---|
| Disponibilidade | "Esgotado" quando a Quantidade em estoque é zero; "Em estoque" nos demais casos | Quantidade em estoque (Produto) |

## Campos automáticos

| Label PO | Valor | Quando |
|---|---|---|
| — | Nenhum campo é preenchido automaticamente nesta funcionalidade | — |

## Superfície

**Tela própria** — rota: Página do produto (`/produtos/:id`), aberta de Listar Destaques ou de Pesquisar Produtos na Vitrine.

**Fidelidade ao protótipo**: referência · `prototypes/vitrine/navegacao/flow.html` · [abrir o protótipo ↗](../../../prototypes/vitrine/navegacao/flow.html)

## Comportamento de tela

### Onde fica

A página do produto (`/produtos/:id`) mostra o nome como título, a categoria, o preço em destaque, a disponibilidade e, abaixo, a descrição. Ao lado do preço ficam a quantidade e o botão "Adicionar ao carrinho", que pertencem a VND-CAR-01 — Adicionar Item ao Carrinho e não são especificados aqui; no produto esgotado, o botão fica indisponível.

### Estados da tela

| Estado | Comportamento |
|---|---|
| Loading | Mostrar "Carregando…" e os blocos da página em esqueleto |
| Erro de servidor | Mostrar "Não foi possível carregar os dados." no lugar dos dados do produto |
| Sucesso | Mostrar os dados do produto, com a disponibilidade "Em estoque" |
| Produto esgotado | Mostrar o selo "Esgotado" junto ao preço |
| Produto indisponível | Mostrar "Este produto não está disponível na loja." para produto inexistente ou de categoria inativa |
| Sem descrição | Omitir o bloco de descrição e mostrar os demais dados |

## Critérios de sucesso

| # | Critério mensurável | Origem |
|---|---|---|
| SC-01 | A página de todo produto de categoria ativa mostra nome, categoria, preço atual e disponibilidade | CA-3 e RN-03 |
| SC-02 | Todo produto com quantidade em estoque zero aparece com o selo "Esgotado" | CA-3 e RN-02 |
| SC-03 | Nenhum produto de categoria inativa tem página aberta na vitrine | RN-01 |

## Métricas de tamanho

| Função de Transação | Papel | Tipo | ALR | DER | Complexidade | PF | Data |
|---|---|---|---|---|---|---|---|
| Visualizar Produto na Vitrine | principal | — | — | — | — | — | — |

A contagem está pendente e deve nascer da análise desta funcionalidade via CT, com memória de cálculo.

## Origem

| Ticket (AIMM) | Tipo | Critérios cobertos |
|---|---|---|
| [`STRY0013175`](../../../analise-impacto/AIMM-STRY0013175.md) | Criação | `CA-3` — página do produto com nome, descrição, categoria e preço, e o produto sem estoque como esgotado |

## Changelog

| Data | Autor | Tipo | Descrição |
|---|---|---|---|
| 2026-10-18 | Claude | N3 criado | Página do produto na vitrine do ticket fictício STRY0013175, com regras, cenários e estados de tela; gates sem aprovação e contagem pendente. |
| 2026-10-18 | Claude | Ajuste | Seções reordenadas: a Superfície vai para antes da seção Comportamento de tela e a Origem vai para antes da seção Changelog. Nenhuma regra, cenário ou campo muda. |
| 2026-10-20 | Docqui Caixa | Terminologia | Adoção de AIMM; histórico e chave preservados. |
| 2026-10-21 | Docqui Caixa | Terminologia | Níveis em português: Domínio, Agrupamento Funcional e Funcionalidade; histórico preservado. |
