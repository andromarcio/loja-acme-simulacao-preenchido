<!-- docqui: 7.0.0 | prompt: MIGRA_NIVEIS | atualizado: 2026-10-23 -->
---
id: VIT-NAV-02
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
estado: rascunho
gates:
  requisitos: { aprovado: false, por: "", em: "", pr: "" }
  modelo-dados: { aprovado: false, por: "", em: "", pr: "" }
  testes: { aprovado: false, por: "", em: "", pr: "" }
  codigo: { aprovado: false, por: "", em: "", pr: "" }
contagem:
  pendente: true
  revisada_em: ""
  revisada_ate: ""
---

# Pesquisar Produtos na Vitrine
> **Nível 3** - Agrupamento Funcional: Navegação — Domínio: Vitrine - `VIT-NAV-02`

## Descrição

Permite que a pessoa que visita a loja pesquise os produtos à venda por parte do nome e por categoria, vendo o nome, a categoria, o preço e a disponibilidade de cada um.

A pessoa digita o termo no campo de busca da página inicial ou da própria tela de resultados, pode escolher uma categoria e a ordenação — Nome A–Z, Menor preço ou Maior preço — e escolhe um produto para abrir a página dele, em VIT-NAV-03 — Visualizar Produto na Vitrine.

## Regras de negócio

- **RN-01** — A busca encontra os produtos cujo nome contém o termo informado, sem diferenciar maiúsculas, minúsculas e acentos.
- **RN-02** — Quando informado, o termo de busca tem ao menos 2 caracteres.
- **RN-03** — Só aparecem produtos cuja categoria diretamente vinculada está ativa. A situação da superior não se propaga: superior inativa não oculta produtos de subcategorias ativas nem altera a situação delas; subcategoria inativa nunca expõe seus produtos, mesmo com superior ativa. → ver N1 Vitrine: Regras transversais de negócio: 1
- **RN-04** — Produto com quantidade em estoque zero aparece com o selo de esgotado. → ver N1 Vitrine: Regras transversais de negócio: 2
- **RN-05** — Sem termo e sem categoria, o resultado traz todos os produtos de categorias ativas.
- **RN-06** — Filtrar por categoria de primeiro nível inclui seus produtos diretos e os das suas subcategorias, sempre respeitando RN-03 e o termo de busca, sem duplicar produtos. Filtrar por subcategoria inclui somente os produtos dela.
- **RN-07** — O filtro lista categorias de primeiro nível ativas e subcategorias ativas, estas logo abaixo da superior com o caminho "Cozinha › Canecas". Superior inativa não é opção selecionável, mas suas subcategorias ativas continuam listadas com o caminho completo. Os nomes de primeiro nível e os de suas subcategorias seguem ordem A–Z em cada grupo; o caminho também identifica a categoria nos resultados quando for subcategoria.

**Decisão proposta para STRY0013205 (sem aval da PO)**: o filtro lista as subcategorias para refinar a busca, inclusive quando a superior está inativa. A elegibilidade do produto depende apenas da situação da categoria diretamente vinculada, sem inativação em cascata.

## Cenários

```gherkin
Feature: Pesquisar Produtos na Vitrine

  Background:
    Given que os produtos e as categorias da demonstração estão cadastrados
    And que a categoria "Decoração" está inativa

  # Caminho feliz
  @RN-01 @RN-03
  Scenario: Busca por parte do nome
    When a pessoa pesquisa "acme"
    Then o sistema mostra, nesta ordem, "Bloco de notas ACME A5", "Boné ACME aba curva", "Camiseta ACME algodão — tamanho M", "Caneca de cerâmica ACME 300 ml", "Caneta esferográfica ACME azul", "Chaveiro ACME de metal", "Ecobag ACME de lona" e "Garrafa térmica ACME 500 ml"
    And não mostra "Almofada ACME estampada"

  @RN-01
  Scenario: Busca sem acento encontra nome acentuado
    When a pessoa pesquisa "ceramica"
    Then o sistema mostra "Caneca de cerâmica ACME 300 ml"

  @RN-06
  Scenario: Filtro só por categoria, sem termo, com produtos diretos
    When a pessoa escolhe a categoria "Cozinha" sem informar termo
    Then o sistema mostra "Caneca de cerâmica ACME 300 ml" e "Garrafa térmica ACME 500 ml"

  @RN-03 @RN-06
  Scenario: Filtro pela superior inclui produtos diretos e de subcategorias
    Given que nesta variação da massa "Caneca de cerâmica ACME 300 ml" pertence a "Canecas", subcategoria ativa de "Cozinha"
    And que "Garrafa térmica ACME 500 ml" continua diretamente em "Cozinha"
    When a pessoa escolhe a categoria "Cozinha" sem informar termo
    Then o sistema mostra a caneca e a garrafa uma única vez cada
    And não mostra produtos de outras categorias

  @RN-06 @RN-07
  Scenario: Refinar por subcategoria
    Given que nesta variação da massa a caneca pertence a "Canecas" e a garrafa a "Garrafas", ambas subcategorias ativas de "Cozinha"
    When a pessoa escolhe "Cozinha › Canecas" no filtro
    Then o sistema mostra somente "Caneca de cerâmica ACME 300 ml"
    And mostra "Cozinha › Canecas" como categoria do resultado

  @RN-06
  Scenario: Termo e superior combinados
    Given que nesta variação da massa a caneca pertence à subcategoria ativa "Canecas" de "Cozinha"
    When a pessoa pesquisa "ceramica" e escolhe "Cozinha"
    Then o sistema mostra somente "Caneca de cerâmica ACME 300 ml"

  @RN-03 @RN-07
  Scenario: Superior inativa com subcategoria ativa
    Given que nesta variação da massa "Cozinha" está inativa, "Canecas" está ativa e a caneca pertence a "Canecas"
    When a pessoa abre o filtro de categoria
    Then não pode selecionar "Cozinha", mas pode selecionar "Cozinha › Canecas"
    When pesquisa "acme" sem filtro de categoria
    Then a caneca aparece e os produtos diretamente vinculados a "Cozinha" não aparecem

  @RN-03 @RN-06
  Scenario: Subcategoria inativa não expõe produtos pela superior
    Given que nesta variação da massa a caneca pertence a "Canecas" inativa, subcategoria de "Cozinha" ativa
    When a pessoa escolhe "Cozinha"
    Then não mostra a caneca, mas mantém os produtos de categorias ativas abrangidas pelo filtro
    And "Cozinha › Canecas" não é oferecida no filtro

  @RN-05
  Scenario: Todos os produtos à venda
    When a pessoa abre o resultado da busca sem informar termo nem categoria
    Then o sistema mostra os 8 produtos das categorias ativas, em ordem alfabética

  Scenario: Ordenação pelo menor preço
    When a pessoa pesquisa "acme"
    And escolhe a ordenação "Menor preço"
    Then o primeiro produto é "Caneta esferográfica ACME azul", por "R$ 6,90"
    And o último é "Garrafa térmica ACME 500 ml", por "R$ 89,90"

  # Erros de validação
  @RN-02
  # ← MESSAGE-DICTIONARY: MIN_LENGTH
  Scenario: Termo com menos de 2 caracteres
    When a pessoa pesquisa "a"
    Then o sistema exibe junto ao campo de busca "Mínimo de 2 caracteres."
    And não altera o resultado mostrado

  # Conflitos com dados existentes
  @RN-03
  # ← MESSAGE-DICTIONARY: EMPTY_SEARCH
  Scenario: Produto de categoria inativa não é encontrado
    When a pessoa pesquisa "almofada"
    Then o sistema exibe "Nenhum resultado para a busca."

  Scenario: Categoria inativa fora do filtro
    Given que a variação da massa inclui "Canecas" e "Garrafas" ativas sob "Cozinha"
    When a pessoa abre o filtro de categoria
    Then o sistema oferece as categorias de primeiro nível "Acessórios", "Brinquedos", "Cozinha", "Papelaria" e "Vestuário"
    And oferece "Cozinha › Canecas" e "Cozinha › Garrafas" logo abaixo de "Cozinha"
    And não oferece "Decoração"

  # Estados especiais
  # ← MESSAGE-DICTIONARY: EMPTY_SEARCH
  Scenario: Nenhum produto com o termo
    When a pessoa pesquisa "relógio"
    Then o sistema exibe "Nenhum resultado para a busca."

  @RN-04
  # ← MESSAGE-DICTIONARY: VIT_SELO_ESGOTADO
  Scenario: Produto sem estoque no resultado
    Given que o "Boné ACME aba curva" tem quantidade em estoque zero
    When a pessoa pesquisa "boné"
    Then o card do "Boné ACME aba curva" mostra o selo "Esgotado"

  # ← MESSAGE-DICTIONARY: ERROR_STATE
  Scenario: Falha ao pesquisar
    When a pesquisa não pode ser concluída por falha inesperada
    Then o sistema exibe "Não foi possível carregar os dados."
```

## Campos

| Label PO | Entidade | Preenchimento | Edição | Tipo | Obrigatório | Validação |
|---|---|---|---|---|---|---|
| Busca (filtro) | Produto | entrada do usuário | editável | texto | não | Parte do nome do produto; ao menos 2 caracteres quando informado |
| Categoria (filtro) | Categoria | entrada do usuário | editável | seleção → Categoria | não | carga: lista completa de categorias ativas, inclusive subcategorias com caminho; superior inclui produtos diretos e das subcategorias ativas |
| Ordenar por (filtro) | dado de código | entrada do usuário | editável | lista (Nome A–Z, Menor preço, Maior preço) | não | Padrão: Nome A–Z |
| Nome do produto (resultado) | Produto | exibido do cadastro | somente leitura | texto | não | Como cadastrado no Catálogo |
| Categoria (resultado) | Categoria | exibido do cadastro | somente leitura | texto | não | Nome da categoria do produto; para subcategoria, caminho "Superior › Subcategoria" |
| Preço (resultado) | Produto | exibido do cadastro | somente leitura | valor | não | → ver FIELD-DICTIONARY: Valor monetário |
| Disponibilidade (resultado) | derivado ↓ | calculado | somente leitura | texto | não | Selo "Esgotado" quando o produto não tem estoque |

## Derivações

| Campo derivado | Fórmula (Label PO) | Campos-fonte (Entidade) |
|---|---|---|
| Disponibilidade | Selo "Esgotado" quando a Quantidade em estoque é zero; sem selo nos demais casos | Quantidade em estoque (Produto) |

## Colunas do resultado

| Coluna (Label PO) | Origem | Ordenação |
|---|---|---|
| Nome do produto | cadastro | padrão ↑ |
| Categoria | entidade relacionada (Categoria) | — |
| Preço | cadastro | ordenável |
| Disponibilidade | derivado | — |

## Campos automáticos

| Label PO | Valor | Quando |
|---|---|---|
| — | Nenhum campo é preenchido automaticamente nesta funcionalidade | — |

## Superfície

**Tela própria** — rota: Resultado da busca (`/produtos`), alcançada pelo campo de busca da página inicial.

**Fidelidade ao protótipo**: referência · `prototypes/vitrine/navegacao/flow.html` · [abrir o protótipo ↗](../../../prototypes/vitrine/navegacao/flow.html)

## Comportamento de tela

### Onde fica

A tela de resultado da busca (`/produtos`) tem no topo o mesmo campo de busca da página inicial, com o filtro de categoria e a ordenação ao lado; abaixo, os produtos em cards com o nome, a categoria, o preço e, quando for o caso, o selo de esgotado. Escolher um card abre a página do produto, em VIT-NAV-03 — Visualizar Produto na Vitrine.

### Estados da tela

| Estado | Comportamento |
|---|---|
| Inicial | Chegando da página inicial, o termo digitado já vem preenchido e o resultado aparece; sem termo nem categoria, aparecem todos os produtos de categorias ativas, em ordem alfabética do nome |
| Loading | Mostrar "Carregando…" e os cards em esqueleto, sem permitir nova busca até concluir |
| Erro de validação | Mostrar "Mínimo de 2 caracteres." junto ao campo de busca e manter o resultado anterior |
| Erro de servidor | Mostrar "Não foi possível carregar os dados." no lugar dos cards |
| Sucesso | Mostrar os cards na ordenação escolhida — Nome A–Z quando não se escolhe outra —, com o total de produtos encontrados |
| Empty state | Mostrar "Nenhum resultado para a busca." quando nada atende ao termo e à categoria |
| Filtro por superior | Mostrar produtos diretos e das subcategorias ativas; subcategoria escolhida restringe aos produtos dela |
| Superior inativa | Não oferecer a superior no filtro; manter subcategorias ativas com caminho completo, sem ocultar seus produtos |
| Produto esgotado | O card do produto sem estoque mostra o selo "Esgotado" e continua levando à página do produto |

## Critérios de sucesso

| # | Critério mensurável | Origem |
|---|---|---|
| SC-01 | A busca "acme" retorna os 8 produtos de categorias ativas e nenhum produto de categoria inativa | CA-2, RN-01 e RN-03 |
| SC-02 | O filtro "Cozinha" retorna os 2 produtos da massa base e também produtos de Canecas/Garrafas quando nela vinculados e ativos, sem duplicar nem incluir outras categorias ou produtos de subcategorias inativas | STRY0013205 CA-6, RN-03 e RN-06 |
| SC-03 | Nenhuma busca é feita com termo de 1 caractere | RN-02 |
| SC-04 | Subcategorias ativas aparecem no filtro com caminho e refinam o resultado aos próprios produtos; superior inativa não é selecionável nem oculta subcategorias ativas | RN-03 e RN-07 |

## Métricas de tamanho

| Função de Transação | Papel | Tipo | ALR | DER | Complexidade | PF | Data |
|---|---|---|---|---|---|---|---|
| Pesquisar Produtos na Vitrine | principal | — | — | — | — | — | — |

A contagem está pendente e deve nascer da análise desta funcionalidade via CT, com memória de cálculo.

## Origem

| Ticket (AIMM) | Tipo | Critérios cobertos |
|---|---|---|
| [`STRY0013175`](../../../analise-impacto/AIMM-STRY0013175.md) | Criação | `CA-2` — busca por parte do nome, filtro por categoria e produtos de categoria inativa fora do resultado |
| [`STRY0013205`](../../../analise-impacto/AIMM-STRY0013205.md) | Alteração | `CA-6` — o filtro por categoria inclui as subcategorias (AIMM em análise, sem aval da PO) |

## Changelog

| Data | Autor | Tipo | Descrição |
|---|---|---|---|
| 2026-10-18 | Claude | N3 criado | Busca de produtos da vitrine do ticket fictício STRY0013175, com filtros, colunas, regras e cenários; gates sem aprovação e contagem pendente. |
| 2026-10-18 | Claude | Ajuste | Seções reordenadas: a Superfície vai para antes da seção Comportamento de tela e a Origem vai para antes da seção Changelog. Nenhuma regra, cenário ou campo muda. |
| 2026-10-20 | Docqui Caixa | Terminologia | Adoção de AIMM; histórico e chave preservados. |
| 2026-10-21 | Claude | Origem | Ticket `STRY0013205` registrado na Origem: a AIMM está em análise e ainda não muda campos, regras ou cenários. |
| 2026-10-21 | Docqui Caixa | Terminologia | Níveis em português: Domínio, Agrupamento Funcional e Funcionalidade; histórico preservado. |
| 2026-10-23 | Copilot | Alteração | STRY0013205: filtro abrange subcategorias, opções e resultados com caminho; situação da superior não se propaga; regras, cenários e SC-02 atualizados como proposta em rascunho. |
