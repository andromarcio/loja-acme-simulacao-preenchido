<!-- docqui: 7.0.0 | prompt: MIGRA_NIVEIS | atualizado: 2026-10-21 -->
---
id: ADM-FRT-02
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

# Cadastrar Faixa de Frete
> **Nível 3** - Agrupamento Funcional: Faixas de Frete — Domínio: Administração - `ADM-FRT-02`

## Descrição

Permite que o administrador cadastre uma faixa de CEP com o valor do frete, e os CEPs dela passam a ser atendidos no cálculo de frete do checkout.

Na Pesquisa de Faixas de Frete, o administrador aciona **Cadastrar faixa de frete**, informa a região, o CEP inicial, o CEP final e o valor do frete e aciona **Salvar**.

## Regras de negócio

- **RN-01** — A região é única entre as faixas de frete, sem diferenciar maiúsculas, minúsculas e acentos.
- **RN-02** — O CEP inicial é menor ou igual ao CEP final.
- **RN-03** — Duas faixas de frete não têm CEP em comum.
- **RN-04** — O valor do frete é maior que zero. → ver FIELD-DICTIONARY: Valor monetário
- **RN-05** — O CEP inicial e o CEP final têm oito dígitos numéricos. → ver FIELD-DICTIONARY: CEP
- **RN-06** — Os CEPs do intervalo de uma faixa cadastrada passam a ser atendidos no cálculo de frete, pelo valor da faixa.

## Cenários

```gherkin
Feature: Cadastrar Faixa de Frete

  Background:
    Given que o administrador está em Cadastrar Faixa de Frete
    And que a Tabela de Frete tem as cinco faixas da demonstração, entre elas "Centro — São Paulo" (01310000 a 01310999) e "Campinas" (13000000 a 13139999)

  # Caminho feliz
  @RN-06
  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Faixa cadastrada com todos os campos válidos
    When o administrador informa a região "Belo Horizonte — Centro"
    And informa o CEP inicial "30110000" e o CEP final "30199999"
    And informa o valor do frete "35,50"
    And aciona "Salvar"
    Then o sistema exibe "Registro salvo com sucesso."
    And a faixa "Belo Horizonte — Centro" aparece na Pesquisa de Faixas de Frete com frete de R$ 35,50
    And o cálculo de frete do CEP "30110500" passa a resultar em R$ 35,50

  @RN-02
  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Faixa de um único CEP
    When o administrador informa a região "Praça da Sé — São Paulo"
    And informa o CEP inicial "01001000" e o CEP final "01001000"
    And informa o valor do frete "15,00"
    And aciona "Salvar"
    Then o sistema exibe "Registro salvo com sucesso."

  # Erros de validação
  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Campo obrigatório ausente
    When o administrador deixa a região vazia
    And aciona "Salvar"
    Then o sistema exibe abaixo do campo "Campo obrigatório."
    And não cadastra a faixa

  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Região com mais de 60 caracteres
    When o administrador informa uma região com 61 caracteres
    And aciona "Salvar"
    Then o sistema exibe abaixo do campo "Máximo de 60 caracteres."
    And não cadastra a faixa

  @RN-05
  # ← FIELD-DICTIONARY: CEP
  Scenario: CEP com menos de oito dígitos
    When o administrador informa o CEP inicial "3011"
    And aciona "Salvar"
    Then o sistema exibe abaixo do campo "CEP inválido."
    And não cadastra a faixa

  @RN-04
  # ← FIELD-DICTIONARY: Valor monetário
  Scenario: Valor do frete igual a zero
    When o administrador informa o valor do frete "0,00"
    And aciona "Salvar"
    Then o sistema exibe abaixo do campo "Informe um valor válido."
    And não cadastra a faixa

  @RN-02
  # ← MESSAGE-DICTIONARY: ADM_FAIXA_INTERVALO_INVALIDO
  Scenario: CEP final menor que o CEP inicial
    When o administrador informa o CEP inicial "30199999" e o CEP final "30110000"
    And aciona "Salvar"
    Then o sistema exibe "O CEP final deve ser igual ou maior que o CEP inicial."
    And não cadastra a faixa

  # Conflitos com dados existentes
  @RN-03
  # ← MESSAGE-DICTIONARY: ADM_FAIXA_SOBREPOSTA
  Scenario: Faixa com CEPs em comum com outra
    When o administrador informa a região "Paulista — São Paulo", o CEP inicial "01310500" e o CEP final "01311500"
    And informa o valor do frete "19,90"
    And aciona "Salvar"
    Then o sistema exibe "Esta faixa tem CEPs em comum com a faixa Centro — São Paulo."
    And não cadastra a faixa

  @RN-01
  # ← MESSAGE-DICTIONARY: ADM_REGIAO_DUPLICADA
  Scenario: Região já usada por outra faixa
    When o administrador informa a região "campinas", o CEP inicial "13140000" e o CEP final "13199999"
    And informa o valor do frete "34,90"
    And aciona "Salvar"
    Then o sistema exibe "Já existe uma faixa com esta região."
    And não cadastra a faixa

  # Restrições de acesso
  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Tentativa sem acesso à funcionalidade
    Given que a pessoa não tem acesso à funcionalidade
    When tenta cadastrar uma faixa de frete
    Then o sistema exibe "Você não tem permissão para esta ação."
    And não cadastra a faixa

  # Estados especiais
  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Falha inesperada ao salvar
    When o cadastro não pode ser concluído por falha inesperada
    Then o sistema exibe "Ocorreu um erro. Tente novamente."
    And não cadastra a faixa
```

## Campos

| Label PO | Entidade | Preenchimento | Edição | Tipo | Obrigatório | Validação |
|---|---|---|---|---|---|---|
| Região | TabelaFrete | entrada do usuário | editável | texto | sim | Até 60 caracteres; única entre as faixas, sem diferenciar maiúsculas, minúsculas e acentos |
| CEP inicial | TabelaFrete | entrada do usuário | editável | texto | sim | → ver FIELD-DICTIONARY: CEP; menor ou igual ao CEP final |
| CEP final | TabelaFrete | entrada do usuário | editável | texto | sim | → ver FIELD-DICTIONARY: CEP; maior ou igual ao CEP inicial |
| Valor do frete | TabelaFrete | entrada do usuário | editável | valor | sim | → ver FIELD-DICTIONARY: Valor monetário; maior que zero |

## Campos automáticos

| Label PO | Valor | Quando |
|---|---|---|
| — | Nenhum campo é preenchido automaticamente nesta funcionalidade | — |

## Superfície

**Tela própria** — rota: Cadastrar Faixa de Frete (`/administracao/faixas-frete/novo`), acessada da Pesquisa de Faixas de Frete.

**Fidelidade ao protótipo**: referência · `prototypes/administracao/faixas-frete/flow.html` · [abrir o protótipo ↗](../../../prototypes/administracao/faixas-frete/flow.html)

## Comportamento de tela

### Onde fica

Cadastrar Faixa de Frete é uma tela própria, aberta pelo botão **Cadastrar faixa de frete** da Pesquisa de Faixas de Frete: um formulário com Região, CEP inicial, CEP final e Valor do frete e os botões **Salvar** e **Cancelar**. Ao salvar, o sistema volta à pesquisa com a faixa nova na lista; **Cancelar** volta sem cadastrar. Os CEPs são informados sem máscara.

### Estados da tela

| Estado | Comportamento |
|---|---|
| Inicial | Formulário vazio, sem mensagens |
| Loading | Mostrar "Carregando…" e bloquear **Salvar** enquanto o cadastro é concluído |
| Erro de validação | Mostrar a mensagem literal abaixo de cada campo inválido; nada é cadastrado |
| Conflito | Mostrar a mensagem do conflito (região repetida, CEP em comum ou intervalo invertido) no topo do formulário; nada é cadastrado |
| Erro de servidor | Mostrar "Ocorreu um erro. Tente novamente." e manter os dados digitados |
| Sucesso | Mostrar "Registro salvo com sucesso." e voltar à Pesquisa de Faixas de Frete com a faixa nova na lista |

## Critérios de sucesso

| # | Critério mensurável | Origem |
|---|---|---|
| SC-01 | Uma faixa com região nova, intervalo válido e valor maior que zero é cadastrada e aparece na pesquisa | CA-2 e RN-01 |
| SC-02 | Nenhuma faixa com CEP em comum com outra é cadastrada | CA-2 e RN-03 |
| SC-03 | Depois do cadastro, um CEP do intervalo resulta no valor da faixa no cálculo de frete | CA-2 e RN-06 |

## Métricas de tamanho

| Função de Transação | Papel | Tipo | ALR | DER | Complexidade | PF | Data |
|---|---|---|---|---|---|---|---|
| Cadastrar Faixa de Frete | principal | — | — | — | — | — | — |

A contagem está pendente e deve nascer da análise desta funcionalidade via CT, com memória de cálculo.

## Origem

| Ticket (AIMM) | Tipo | Critérios cobertos |
|---|---|---|
| [`STRY0013200`](../../../analise-impacto/AIMM-STRY0013200.md) | Criação | `CA-2` — cadastro da faixa com região, CEP inicial, CEP final e valor do frete, sem CEP em comum com outra faixa |

## Changelog

| Data | Autor | Tipo | Descrição |
|---|---|---|---|
| 2026-10-18 | Claude | N3 criado | Cadastro de faixa de frete, fonte canônica do CRUD gerado pelo PROMPT CRUD a partir do ticket fictício STRY0013200; gates sem aprovação e contagem pendente. |
| 2026-10-18 | Claude | Ajuste | Seções reordenadas: a Superfície vai para antes da seção Comportamento de tela e a Origem vai para antes da seção Changelog. Nenhuma regra, cenário ou campo muda. |
| 2026-10-20 | Docqui Caixa | Terminologia | Adoção de AIMM; histórico e chave preservados. |
| 2026-10-21 | Docqui Caixa | Terminologia | Níveis em português: Domínio, Agrupamento Funcional e Funcionalidade; histórico preservado. |
