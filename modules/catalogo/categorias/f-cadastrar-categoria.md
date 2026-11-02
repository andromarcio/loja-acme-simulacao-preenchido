<!-- docqui: 7.0.0 | prompt: MIGRA_NIVEIS | atualizado: 2026-10-23 -->
---
id: CAT-CTG-02
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

# Cadastrar Categoria
> **Nível 3** - Agrupamento Funcional: Categorias — Domínio: Catálogo - `CAT-CTG-02`

## Descrição

Permite que o gestor de catálogo cadastre uma categoria de produtos de primeiro nível ou uma subcategoria, com nome único entre as categorias com a mesma categoria superior e uma descrição opcional, que passa a existir como ativa no catálogo.

Na Pesquisa de Categorias, o gestor aciona **Cadastrar categoria**; no modal, informa o nome e, se quiser, a descrição e a Categoria superior, e aciona **Salvar**. Sem superior, cadastra uma categoria de primeiro nível. A categoria cadastrada aparece na pesquisa.

## Regras de negócio

- **RN-01** — O nome da categoria é único entre as categorias com a mesma Categoria superior, ativas ou inativas, sem diferenciar maiúsculas, minúsculas e acentos. Sem superior, os nomes das categorias de primeiro nível são únicos entre si; superiores diferentes permitem nomes iguais.
- **RN-02** — Toda categoria nasce ativa.
- **RN-03** — Categoria superior é opcional e lista somente categorias de primeiro nível, ativas ou inativas. Uma subcategoria não pode ter subcategorias; a elegibilidade da superior é conferida novamente ao salvar.

## Cenários

```gherkin
Feature: Cadastrar Categoria

  Background:
    Given que o gestor de catálogo abriu o cadastro de categoria a partir da Pesquisa de Categorias
    And que existem as categorias Cozinha, Vestuário, Papelaria, Acessórios, Decoração e Brinquedos
    And que "Decoração" está inativa e as categorias citadas são de primeiro nível

  # Caminho feliz
  @RN-02
  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Categoria cadastrada com nome e descrição
    When o gestor informa "Jardinagem" em Nome da categoria
    And informa "Vasos, regadores e sementes" em Descrição
    And aciona "Salvar"
    Then o sistema exibe "Registro salvo com sucesso."
    And a categoria "Jardinagem" aparece na Pesquisa de Categorias com a situação "Ativa"

  Scenario: Categoria cadastrada sem descrição
    When o gestor informa "Jardinagem" em Nome da categoria
    And deixa a Descrição vazia
    And aciona "Salvar"
    Then o sistema exibe "Registro salvo com sucesso."

  # Erros de validação
  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Nome da categoria vazio
    When o gestor deixa o Nome da categoria vazio
    And aciona "Salvar"
    Then o sistema exibe abaixo do campo "Campo obrigatório."
    And não cadastra a categoria

  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Nome da categoria com mais de 40 caracteres
    When o gestor informa um nome com 41 caracteres
    And aciona "Salvar"
    Then o sistema exibe abaixo do campo "Máximo de 40 caracteres."

  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Descrição com mais de 200 caracteres
    When o gestor informa uma descrição com 201 caracteres
    And aciona "Salvar"
    Then o sistema exibe abaixo do campo "Máximo de 200 caracteres."

  # Conflitos com dados existentes
  @RN-01
  # ← MESSAGE-DICTIONARY: CAT_CATEGORIA_DUPLICADA
  Scenario: Nome igual ao de outra categoria
    When o gestor informa "cozinha" em Nome da categoria
    And aciona "Salvar"
    Then o sistema exibe abaixo de Nome da categoria "Já existe uma categoria com este nome nesta categoria superior."
    And não cadastra a categoria

  @RN-01
  # ← MESSAGE-DICTIONARY: CAT_CATEGORIA_DUPLICADA
  Scenario: Nome igual ao de uma categoria inativa, sem acento
    When o gestor informa "Decoracao" em Nome da categoria
    And aciona "Salvar"
    Then o sistema exibe abaixo de Nome da categoria "Já existe uma categoria com este nome nesta categoria superior."

  @RN-03
  Scenario: Cadastro de subcategoria e seleção de superior
    Given que "Canecas" é subcategoria de "Cozinha"
    When o gestor abre a seleção Categoria superior
    Then o sistema oferece "Cozinha" e "Decoração", mas não oferece "Canecas"
    When o gestor informa "Garrafas" em Nome da categoria
    And escolhe "Cozinha" em Categoria superior
    And aciona "Salvar"
    Then o sistema exibe "Registro salvo com sucesso."
    And "Garrafas" é cadastrada como subcategoria ativa de "Cozinha"

  @RN-01
  # ← MESSAGE-DICTIONARY: CAT_CATEGORIA_DUPLICADA
  Scenario: Nome repetido entre irmãs, mesmo com diferenças de acento e caixa
    Given que existe a subcategoria inativa "Xícaras" de "Cozinha"
    When o gestor informa "xicaras" em Nome da categoria
    And escolhe "Cozinha" em Categoria superior
    And aciona "Salvar"
    Then o sistema exibe abaixo de Nome da categoria "Já existe uma categoria com este nome nesta categoria superior."
    And não cadastra a categoria

  @RN-01
  Scenario: Mesmo nome em superiores diferentes
    Given que "Canecas" é subcategoria de "Cozinha"
    When o gestor informa "Canecas" em Nome da categoria
    And escolhe "Decoração" em Categoria superior
    And aciona "Salvar"
    Then o sistema exibe "Registro salvo com sucesso."
    And as duas subcategorias "Canecas" permanecem vinculadas às respectivas superiores

  @RN-03
  # ← MESSAGE-DICTIONARY: CAT_SUPERIOR_INVALIDA
  Scenario: Superior deixa de ser elegível antes de salvar
    Given que a Categoria superior selecionada passou a ser subcategoria ou foi excluída
    When o gestor aciona "Salvar"
    Then o sistema exibe abaixo de Categoria superior "Selecione uma categoria superior de primeiro nível, diferente da própria categoria."
    And mantém os dados no modal sem cadastrar a categoria

  # Restrições de acesso
  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Tentativa sem acesso à funcionalidade
    Given que a pessoa não tem acesso à funcionalidade
    When tenta cadastrar uma categoria
    Then o sistema exibe "Você não tem permissão para esta ação."
    And não cadastra a categoria

  # Estados especiais
  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Falha inesperada ao salvar
    When o cadastro não pode ser concluído por falha inesperada
    Then o sistema exibe "Ocorreu um erro. Tente novamente."
    And mantém no modal os dados informados
```

## Campos

| Label PO | Entidade | Preenchimento | Edição | Tipo | Obrigatório | Validação |
|---|---|---|---|---|---|---|
| Nome da categoria | Categoria | entrada do usuário | editável | texto | sim | Até 40 caracteres; único na mesma Categoria superior (inclusive sem superior), sem diferenciar maiúsculas, minúsculas e acentos |
| Descrição | Categoria | entrada do usuário | editável | texto | não | Até 200 caracteres |
| Categoria superior | Categoria | entrada do usuário | editável | seleção → Categoria | não | Somente categorias de primeiro nível, ativas ou inativas; vazia significa primeiro nível |

## Campos automáticos

| Label PO | Valor | Quando |
|---|---|---|
| Situação | Ativa | Ao salvar o cadastro |
| Data de cadastro | Data do dia | Ao salvar o cadastro |

## Superfície

**Modal** — origem: Pesquisar Categorias (Pesquisa de Categorias, `/catalogo/categorias`).

**Fidelidade ao protótipo**: referência · `prototypes/catalogo/categorias/flow.html` · [abrir o protótipo ↗](../../../prototypes/catalogo/categorias/flow.html)

## Comportamento de tela

### Onde fica

O cadastro abre em modal sobre a Pesquisa de Categorias, pelo botão **Cadastrar categoria** no topo da lista, com os campos Nome da categoria, Descrição e Categoria superior e os botões **Cancelar** e **Salvar**. A seleção mostra o nome das categorias de primeiro nível e a opção **Sem categoria superior**. Ao salvar, o modal fecha e a lista é atualizada.

### Estados da tela

| Estado | Comportamento |
|---|---|
| Inicial | Modal com Nome da categoria e Descrição vazios, Categoria superior em **Sem categoria superior** e sem mensagens de erro |
| Sem superiores disponíveis | Seleção apenas com **Sem categoria superior**; permite cadastrar categoria de primeiro nível |
| Loading | Mostrar "Carregando…" no botão **Salvar** e evitar novo acionamento enquanto salva |
| Erro de validação | Mostrar a mensagem literal abaixo do campo; o modal continua aberto |
| Erro de servidor | Mostrar "Ocorreu um erro. Tente novamente." no modal, mantendo os dados informados |
| Sucesso | Fechar o modal, mostrar o aviso "Registro salvo com sucesso." e atualizar a lista |
| Cancelado | Fechar o modal sem cadastrar nada |

## Critérios de sucesso

| # | Critério mensurável | Origem |
|---|---|---|
| SC-01 | Toda categoria cadastrada aparece na pesquisa com a situação Ativa | CA-2 e RN-02 |
| SC-02 | Nenhum nome repetido na mesma Categoria superior, inclusive sem superior e contra registros inativos, é aceito, ignorando maiúsculas e acentos; superiores diferentes permitem o mesmo nome | STRY0013205 CA-3 e RN-01 |
| SC-03 | Categoria superior é opcional e só aceita categorias de primeiro nível, sem permitir um segundo nível de subcategorias | STRY0013205 CA-1 e RN-03 |

## Métricas de tamanho

| Função de Transação | Papel | Tipo | ALR | DER | Complexidade | PF | Data |
|---|---|---|---|---|---|---|---|
| Cadastrar Categoria | principal | — | — | — | — | — | — |

A contagem está pendente e deve nascer da análise desta funcionalidade via CT, com memória de cálculo.

## Origem

| Ticket (AIMM) | Tipo | Critérios cobertos |
|---|---|---|
| [`STRY0013170`](../../../analise-impacto/AIMM-STRY0013170.md) | Criação | `CA-2` — cadastro com nome e descrição opcional, sem nomes repetidos |
| [`STRY0013205`](../../../analise-impacto/AIMM-STRY0013205.md) | Alteração | `CA-1, CA-3` — categoria superior no cadastro e nome único entre as categorias com a mesma categoria superior (AIMM em análise, sem aval da PO) |

## Changelog

| Data | Autor | Tipo | Descrição |
|---|---|---|---|
| 2026-10-18 | Claude | N3 criado | Cadastro de categoria em modal, fonte canônica do CRUD, a partir do ticket fictício STRY0013170; gates sem aprovação e contagem pendente. |
| 2026-10-18 | Claude | Ajuste | Seções reordenadas: a Superfície vai para antes da seção Comportamento de tela e a Origem vai para antes da seção Changelog. Nenhuma regra, cenário ou campo muda. |
| 2026-10-20 | Docqui Caixa | Terminologia | Adoção de AIMM; histórico e chave preservados. |
| 2026-10-21 | Claude | Origem | Ticket `STRY0013205` registrado na Origem: a AIMM está em análise e ainda não muda campos, regras ou cenários. |
| 2026-10-21 | Docqui Caixa | Terminologia | Níveis em português: Domínio, Agrupamento Funcional e Funcionalidade; histórico preservado. |
| 2026-10-23 | Copilot | Alteração | STRY0013205: Categoria superior opcional, hierarquia de um nível e unicidade por superior; campos, cenários, estados e critérios atualizados, ainda em rascunho. |
