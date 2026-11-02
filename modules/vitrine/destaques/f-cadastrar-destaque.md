<!-- docqui: 7.0.0 | prompt: MIGRA_NIVEIS | atualizado: 2026-10-21 -->
---
id: VIT-DST-02
agrupamento_funcional: VIT-DST
dominio: VIT
entidade: Destaque
data_model_ref: data-models/vitrine.md#destaque
endpoints: []
error_codes: []
depende_de: []
origem:
  tipo: servicenow
  chave: STRY0013180
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

# Cadastrar Destaque
> **Nível 3** - Agrupamento Funcional: Destaques — Domínio: Vitrine - `VIT-DST-02`

## Descrição

Permite que o gestor de catálogo ponha um produto em destaque na página inicial da loja, com uma chamada, a ordem de exibição e o período em que o destaque fica no ar.

Na pesquisa de destaques, o gestor aciona **Cadastrar destaque**, escolhe o produto, escreve a chamada, informa a ordem e as datas de início e de fim da vigência e aciona **Salvar**.

## Regras de negócio

- **RN-01** — A data de início da vigência é igual ou anterior à data de fim. → ver RULES-DICTIONARY: RC-03 — Período de vigência (parâmetro: Início da vigência e Fim da vigência, inclusive)
- **RN-02** — O mesmo produto não tem dois destaques com vigências sobrepostas.
- **RN-03** — O produto do destaque pertence a uma categoria ativa.
- **RN-04** — A ordem de exibição é um número inteiro de 1 a 99.

## Cenários

```gherkin
Feature: Cadastrar Destaque

  Background:
    Given que o gestor de catálogo está no cadastro de destaques
    And que hoje é 18/10/2026
    And que a "Garrafa térmica ACME 500 ml" tem um destaque de 01/10/2026 a 31/10/2026

  # Caminho feliz
  @RN-01 @RN-04
  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Destaque cadastrado com todos os dados
    When o gestor escolhe o produto "Caneta esferográfica ACME azul"
    And informa a chamada "Volta às aulas", a ordem de exibição 1 e a vigência de 20/10/2026 a 31/10/2026
    And aciona "Salvar"
    Then o sistema exibe "Registro salvo com sucesso."
    And o destaque aparece na pesquisa de destaques com a situação "Programado"

  @RN-02
  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Mesmo produto em período que não se sobrepõe
    When o gestor escolhe o produto "Garrafa térmica ACME 500 ml"
    And informa a chamada "Inverno com café", a ordem de exibição 2 e a vigência de 01/11/2026 a 30/11/2026
    And aciona "Salvar"
    Then o sistema exibe "Registro salvo com sucesso."

  # Erros de validação
  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Campo obrigatório ausente
    When o gestor deixa a chamada vazia
    And aciona "Salvar"
    Then o sistema exibe abaixo do campo "Campo obrigatório."
    And o destaque não é cadastrado

  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Chamada com mais de 60 caracteres
    When o gestor informa uma chamada com 61 caracteres
    And aciona "Salvar"
    Then o sistema exibe abaixo do campo "Máximo de 60 caracteres."

  @RN-04
  # ← MESSAGE-DICTIONARY: VIT_ORDEM_INVALIDA
  Scenario: Ordem de exibição fora de 1 a 99
    When o gestor informa a ordem de exibição 0
    And aciona "Salvar"
    Then o sistema exibe abaixo do campo "Informe uma ordem de 1 a 99."

  @RN-01
  # ← RULES-DICTIONARY: RC-03 — Período de vigência
  Scenario: Fim da vigência anterior ao início
    When o gestor informa a vigência de 31/10/2026 a 20/10/2026
    And aciona "Salvar"
    Then o sistema exibe abaixo do campo "A data final não pode ser anterior à data inicial."
    And o destaque não é cadastrado

  # ← FIELD-DICTIONARY: Data futura
  Scenario: Início da vigência anterior a hoje
    When o gestor informa o início da vigência 17/10/2026
    And aciona "Salvar"
    Then o sistema exibe abaixo do campo "Informe uma data igual ou posterior a hoje."

  # Conflitos com dados existentes
  @RN-02
  # ← MESSAGE-DICTIONARY: VIT_DESTAQUE_SOBREPOSTO
  Scenario: Produto com outro destaque no mesmo período
    When o gestor escolhe o produto "Garrafa térmica ACME 500 ml"
    And informa a vigência de 25/10/2026 a 05/11/2026
    And aciona "Salvar"
    Then o sistema exibe "Este produto já tem um destaque nesse período."
    And o destaque não é cadastrado

  @RN-03
  Scenario: Produto de categoria inativa fora da seleção
    Given que a categoria "Decoração" está inativa
    When o gestor digita "almofada" no campo Produto
    Then a seleção não oferece a "Almofada ACME estampada"

  # Restrições de acesso
  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Tentativa sem acesso à funcionalidade
    Given que a pessoa não tem acesso à funcionalidade
    When tenta cadastrar um destaque
    Then o sistema exibe "Você não tem permissão para esta ação."
    And o destaque não é cadastrado

  # Estados especiais
  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Falha inesperada ao salvar
    When o cadastro não pode ser concluído por falha inesperada
    Then o sistema exibe "Ocorreu um erro. Tente novamente."
    And o destaque não é cadastrado
```

## Campos

| Label PO | Entidade | Preenchimento | Edição | Tipo | Obrigatório | Validação |
|---|---|---|---|---|---|---|
| Produto | Produto | entrada do usuário | editável | seleção → Produto | sim | carga: autocomplete por Nome do produto; apenas produtos de categorias ativas |
| Chamada | Destaque | entrada do usuário | editável | texto | sim | Até 60 caracteres |
| Ordem de exibição | Destaque | entrada do usuário | editável | número | sim | Inteiro de 1 a 99; o menor aparece primeiro |
| Início da vigência | Destaque | entrada do usuário | editável | data | sim | → ver FIELD-DICTIONARY: Data futura |
| Fim da vigência | Destaque | entrada do usuário | editável | data | sim | Igual ou posterior ao Início da vigência |

## Campos automáticos

| Label PO | Valor | Quando |
|---|---|---|
| Data de cadastro | Data do dia em que o destaque é salvo | Ao concluir o cadastro |

## Dados lidos e gravados

| Entidade | Papel | Por que a funcionalidade a toca |
|---|---|---|
| Categoria | lê | Saber se o produto é de categoria ativa, para oferecer só esses produtos na seleção (RN-03) |

## Superfície

**Tela própria** — rota: Cadastrar Destaque (`/vitrine/destaques/novo`), acessada da Pesquisa de Destaques.

**Fidelidade ao protótipo**: referência · `prototypes/vitrine/destaques/flow.html` · [abrir o protótipo ↗](../../../prototypes/vitrine/destaques/flow.html)

## Comportamento de tela

### Onde fica

Página própria Cadastrar Destaque (`/vitrine/destaques/novo`), aberta pelo botão **Cadastrar destaque** da Pesquisa de Destaques. O formulário abre vazio; o campo Produto busca conforme o gestor digita o nome e só oferece produtos de categorias ativas. **Salvar** grava e volta à pesquisa; **Cancelar** volta sem gravar.

### Estados da tela

| Estado | Comportamento |
|---|---|
| Inicial | Formulário vazio, sem mensagens |
| Loading | Mostrar "Carregando…" e bloquear **Salvar** enquanto grava |
| Erro de validação | Mostrar a mensagem literal abaixo do campo; o destaque não é gravado |
| Erro de servidor | Mostrar "Ocorreu um erro. Tente novamente." e manter os dados digitados |
| Sucesso | Toast "Registro salvo com sucesso." e volta à pesquisa, com o novo destaque na lista |
| Conflito de vigência | Mostrar "Este produto já tem um destaque nesse período." acima do formulário, mantendo os dados |
| Sem acesso | Mostrar "Você não tem permissão para esta ação." sem exibir o formulário |

## Critérios de sucesso

| # | Critério mensurável | Origem |
|---|---|---|
| SC-01 | Todo destaque salvo tem o início da vigência igual ou anterior ao fim | CA-2 e RN-01 |
| SC-02 | Nenhum produto fica com dois destaques de vigências sobrepostas | CA-2 e RN-02 |
| SC-03 | Nenhum destaque é salvo com produto de categoria inativa | RN-03 |

## Métricas de tamanho

| Função de Transação | Papel | Tipo | ALR | DER | Complexidade | PF | Data |
|---|---|---|---|---|---|---|---|
| Cadastrar Destaque | principal | — | — | — | — | — | — |

A contagem está pendente e deve nascer da análise desta funcionalidade via CT, com memória de cálculo.

## Origem

| Ticket (AIMM) | Tipo | Critérios cobertos |
|---|---|---|
| [`STRY0013180`](../../../analise-impacto/AIMM-STRY0013180.md) | Criação | `CA-2` — cadastro com produto, chamada, ordem e vigência, com o fim não anterior ao início e sem dois destaques do mesmo produto no mesmo período |

## Changelog

| Data | Autor | Tipo | Descrição |
|---|---|---|---|
| 2026-10-18 | Claude | N3 criado | Cadastro de destaque do ticket fictício STRY0013180, com vigência (RC-03), ordem de 1 a 99 e sem sobreposição para o mesmo produto; gates sem aprovação e contagem pendente. |
| 2026-10-18 | Claude | Ajuste | Seções reordenadas: a Superfície vai para antes da seção Comportamento de tela e a Origem vai para antes da seção Changelog. Nenhuma regra, cenário ou campo muda. |
| 2026-10-20 | Docqui Caixa | Terminologia | Adoção de AIMM; histórico e chave preservados. |
| 2026-10-21 | Docqui Caixa | Terminologia | Níveis em português: Domínio, Agrupamento Funcional e Funcionalidade; histórico preservado. |
