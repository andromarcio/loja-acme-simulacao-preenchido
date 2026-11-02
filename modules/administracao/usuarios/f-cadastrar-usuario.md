<!-- docqui: 7.0.0 | prompt: MIGRA_NIVEIS | atualizado: 2026-10-21 -->
---
id: ADM-USR-02
agrupamento_funcional: ADM-USR
dominio: ADM
entidade: Usuario
data_model_ref: data-models/administracao.md#usuario
endpoints: []
error_codes: []
depende_de: []
origem:
  tipo: servicenow
  chave: STRY0013195
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

# Cadastrar Usuário
> **Nível 3** - Agrupamento Funcional: Usuários — Domínio: Administração - `ADM-USR-02`

## Descrição

Permite que o administrador cadastre um usuário da loja com nome completo, e-mail e perfil, deixando-o ativo e pronto para ser reconhecido pela loja.

Na Pesquisa de Usuários, o administrador aciona **Cadastrar usuário**, informa o nome completo, o e-mail e o perfil — e, se quiser, o CPF e o telefone — e aciona **Salvar**.

## Regras de negócio

- **RN-01** — O e-mail é único entre todos os usuários da loja, ativos e inativos.
- **RN-02** — O CPF, quando informado, é único entre todos os usuários da loja.
- **RN-03** — Todo usuário nasce ativo.

## Cenários

```gherkin
Feature: Cadastrar Usuário

  Background:
    Given que a administradora Elisa Rocha está em Cadastrar Usuário
    And que a loja tem os usuários da massa de demonstração, com Fábio Nunes inativo

  # Caminho feliz
  @RN-03
  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Usuário cadastrado com os campos obrigatórios
    When informa o nome completo "Gustavo Reis"
    And informa o e-mail "gustavo.reis@acme.example"
    And escolhe o perfil "Atendente"
    And aciona "Salvar"
    Then o sistema exibe "Registro salvo com sucesso."
    And "Gustavo Reis" aparece na Pesquisa de Usuários com a situação "Ativo" e a data de cadastro de hoje

  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Usuário cadastrado com CPF e telefone
    When informa o nome completo "Gustavo Reis", o e-mail "gustavo.reis@acme.example" e o perfil "Atendente"
    And informa o CPF "11144477735" e o telefone "11987654321"
    And aciona "Salvar"
    Then o sistema exibe "Registro salvo com sucesso."
    And o usuário fica registrado com o CPF e o telefone informados

  # Erros de validação
  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Campos obrigatórios ausentes
    When deixa vazios o nome completo, o e-mail e o perfil
    And aciona "Salvar"
    Then o sistema exibe abaixo de cada um desses campos "Campo obrigatório."
    And não cadastra o usuário

  # ← FIELD-DICTIONARY: Nome de pessoa
  Scenario: Nome sem sobrenome
    When informa o nome completo "Gustavo"
    And aciona "Salvar"
    Then o sistema exibe abaixo do campo "Informe nome e sobrenome."

  # ← FIELD-DICTIONARY: E-mail
  Scenario: E-mail em formato inválido
    When informa o e-mail "gustavo.reis@"
    And aciona "Salvar"
    Then o sistema exibe abaixo do campo "E-mail inválido."

  # ← FIELD-DICTIONARY: CPF
  Scenario: CPF com dígito verificador incorreto
    When informa o CPF "52998224700"
    And aciona "Salvar"
    Then o sistema exibe abaixo do campo "CPF inválido."

  # ← FIELD-DICTIONARY: Telefone
  Scenario: Telefone com dígitos a menos
    When informa o telefone "119876"
    And aciona "Salvar"
    Then o sistema exibe abaixo do campo "Telefone inválido."

  # Conflitos com dados existentes
  @RN-01
  # ← MESSAGE-DICTIONARY: ADM_EMAIL_DUPLICADO
  Scenario: E-mail de um usuário inativo
    When informa o nome completo "Fábio Souza", o e-mail "fabio.nunes@acme.example" e o perfil "Cliente"
    And aciona "Salvar"
    Then o sistema exibe abaixo do campo "Já existe um usuário com este e-mail."
    And não cadastra o usuário

  @RN-02
  # ← MESSAGE-DICTIONARY: ADM_CPF_DUPLICADO
  Scenario: CPF já usado por outro usuário
    Given que Ana Costa tem o CPF "52998224725"
    When informa o nome completo "Gustavo Reis", o e-mail "gustavo.reis@acme.example", o perfil "Atendente" e o CPF "52998224725"
    And aciona "Salvar"
    Then o sistema exibe abaixo do campo "Já existe um usuário com este CPF."
    And não cadastra o usuário

  # Restrições de acesso
  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Tentativa sem acesso à funcionalidade
    Given que a pessoa não tem acesso à funcionalidade
    When tenta cadastrar um usuário
    Then o sistema exibe "Você não tem permissão para esta ação."
    And não cadastra o usuário

  # Estados especiais
  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Falha inesperada ao salvar
    When o cadastro não pode ser concluído por falha inesperada
    Then o sistema exibe "Ocorreu um erro. Tente novamente."
    And mantém os dados informados no formulário
    And não cadastra o usuário
```

## Campos

| Label PO | Entidade | Preenchimento | Edição | Tipo | Obrigatório | Validação |
|---|---|---|---|---|---|---|
| Nome completo | Usuario | entrada do usuário | editável | texto | sim | → ver FIELD-DICTIONARY: Nome de pessoa |
| E-mail | Usuario | entrada do usuário | editável | texto | sim | Único entre todos os usuários, inativos inclusive; → ver FIELD-DICTIONARY: E-mail |
| CPF | Usuario | entrada do usuário | editável | texto | não | Único quando informado; → ver FIELD-DICTIONARY: CPF |
| Telefone | Usuario | entrada do usuário | editável | texto | não | → ver FIELD-DICTIONARY: Telefone |
| Perfil | Usuario | entrada do usuário | editável | lista (Cliente, Atendente, Gestor de catálogo, Administrador) | sim | Uma opção da lista |

## Campos automáticos

| Label PO | Valor | Quando |
|---|---|---|
| Situação | Ativo | Ao salvar o cadastro |
| Data de cadastro | Data do dia | Ao salvar o cadastro |

## Superfície

**Tela própria** — rota: Cadastrar Usuário (`/administracao/usuarios/novo`), acessada da Pesquisa de Usuários.

**Fidelidade ao protótipo**: referência · `prototypes/administracao/usuarios/flow.html` · [abrir o protótipo ↗](../../../prototypes/administracao/usuarios/flow.html)

## Comportamento de tela

### Onde fica

A tela Cadastrar Usuário abre pelo botão **Cadastrar usuário** da Pesquisa de Usuários (ADM-USR-01 — Pesquisar Usuários). O formulário traz nome completo, e-mail, CPF, telefone e perfil, com CPF e telefone marcados como opcionais; **Salvar** grava e **Cancelar** volta à pesquisa sem gravar.

### Estados da tela

| Estado | Comportamento |
|---|---|
| Inicial | Formulário vazio, sem mensagens de erro |
| Loading | Mostrar "Carregando…" e bloquear **Salvar** enquanto grava |
| Erro de validação | Mostrar a mensagem literal abaixo de cada campo inválido; nada é gravado |
| Conflito | Mostrar "Já existe um usuário com este e-mail." ou "Já existe um usuário com este CPF." abaixo do campo; nada é gravado |
| Erro de servidor | Mostrar "Ocorreu um erro. Tente novamente." e manter os dados informados |
| Sucesso | Toast "Registro salvo com sucesso." e volta à Pesquisa de Usuários, com o usuário novo listado como ativo |

## Critérios de sucesso

| # | Critério mensurável | Origem |
|---|---|---|
| SC-01 | Todo usuário cadastrado aparece na pesquisa com a situação Ativo e a data de cadastro do dia | CA-2 e RN-03 |
| SC-02 | Um e-mail já usado, inclusive por usuário inativo, nunca gera um segundo usuário | CA-2 e RN-01 |
| SC-03 | Um CPF já usado nunca gera um segundo usuário | CA-2 e RN-02 |

## Métricas de tamanho

| Função de Transação | Papel | Tipo | ALR | DER | Complexidade | PF | Data |
|---|---|---|---|---|---|---|---|
| Cadastrar Usuário | principal | — | — | — | — | — | — |

A contagem está pendente e deve nascer da análise desta funcionalidade via CT, com memória de cálculo.

## Origem

| Ticket (AIMM) | Tipo | Critérios cobertos |
|---|---|---|
| [`STRY0013195`](../../../analise-impacto/AIMM-STRY0013195.md) | Criação | `CA-2` — cadastro com nome completo, e-mail e perfil, CPF e telefone opcionais, e-mail e CPF sem repetição |

## Changelog

| Data | Autor | Tipo | Descrição |
|---|---|---|---|
| 2026-10-18 | Claude | N3 criado | Cadastro de usuário do ticket fictício STRY0013195, com e-mail e CPF únicos e o usuário nascendo ativo; gates sem aprovação e contagem pendente. |
| 2026-10-18 | Claude | Ajuste | Seções reordenadas: a Superfície vai para antes da seção Comportamento de tela e a Origem vai para antes da seção Changelog. Nenhuma regra, cenário ou campo muda. |
| 2026-10-20 | Docqui Caixa | Terminologia | Adoção de AIMM; histórico e chave preservados. |
| 2026-10-21 | Docqui Caixa | Terminologia | Níveis em português: Domínio, Agrupamento Funcional e Funcionalidade; histórico preservado. |
