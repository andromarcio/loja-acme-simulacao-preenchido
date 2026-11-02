<!-- docqui: 7.0.0 | prompt: MIGRA_NIVEIS | atualizado: 2026-10-21 -->
---
id: ADM-USR-03
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

# Editar Usuário
> **Nível 3** - Agrupamento Funcional: Usuários — Domínio: Administração - `ADM-USR-03`

## Descrição

Permite que o administrador altere o nome completo, o CPF, o telefone e o perfil de um usuário ativo, mantendo o e-mail que o identifica.

Na Pesquisa de Usuários, o administrador aciona editar na linha de um usuário ativo, ajusta os dados no formulário já preenchido e aciona **Salvar**.

## Regras de negócio

- **RN-01** — O e-mail não muda depois do cadastro.
- **RN-02** — O CPF, quando informado, é único entre todos os usuários da loja.
- **RN-03** — Usuário inativo não é alterado.
- **RN-04** — A loja tem sempre ao menos um usuário ativo de perfil Administrador. → ver N1 Administração: Regras transversais de negócio: 2

## Cenários

```gherkin
Feature: Editar Usuário

  Background:
    Given que a administradora Elisa Rocha está na Pesquisa de Usuários
    And que Elisa Rocha é a única usuária ativa de perfil Administrador

  # Caminho feliz
  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Perfil alterado
    When abre a edição de "Carla Souza"
    And troca o perfil para "Administrador"
    And aciona "Salvar"
    Then o sistema exibe "Registro salvo com sucesso."
    And "Carla Souza" aparece na pesquisa com o perfil "Administrador"

  @RN-01
  Scenario: E-mail exibido sem edição
    When abre a edição de "Carla Souza"
    Then o e-mail "carla.souza@acme.example" aparece somente para leitura
    And nenhuma ação do formulário altera o e-mail

  # Erros de validação
  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Nome completo apagado
    When abre a edição de "Carla Souza"
    And apaga o nome completo
    And aciona "Salvar"
    Then o sistema exibe abaixo do campo "Campo obrigatório."

  # ← FIELD-DICTIONARY: Telefone
  Scenario: Telefone com dígitos a menos
    When abre a edição de "Carla Souza"
    And informa o telefone "119876"
    And aciona "Salvar"
    Then o sistema exibe abaixo do campo "Telefone inválido."

  # Conflitos com dados existentes
  @RN-02
  # ← MESSAGE-DICTIONARY: ADM_CPF_DUPLICADO
  Scenario: CPF já usado por outro usuário
    Given que Ana Costa tem o CPF "52998224725"
    When abre a edição de "Carla Souza"
    And informa o CPF "52998224725"
    And aciona "Salvar"
    Then o sistema exibe abaixo do campo "Já existe um usuário com este CPF."
    And mantém o CPF anterior de Carla Souza

  @RN-04
  # ← MESSAGE-DICTIONARY: ADM_ULTIMO_ADMINISTRADOR
  Scenario: Única administradora perde o perfil
    When abre a edição de "Elisa Rocha"
    And troca o perfil para "Atendente"
    And aciona "Salvar"
    Then o sistema exibe "A loja precisa de ao menos um administrador ativo."
    And Elisa Rocha continua com o perfil "Administrador"

  # Restrições de acesso
  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Tentativa sem acesso à funcionalidade
    Given que a pessoa não tem acesso à funcionalidade
    When tenta editar um usuário
    Then o sistema exibe "Você não tem permissão para esta ação."
    And não altera o usuário

  # Estados especiais
  @RN-03
  # ← MESSAGE-DICTIONARY: ADM_USUARIO_INATIVO
  Scenario: Usuário inativo
    Given que Fábio Nunes está inativo
    When tenta editar "Fábio Nunes"
    Then o sistema exibe "Usuário inativo não pode ser alterado."
    And não altera o usuário

  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Usuário que não existe mais
    Given que o usuário aberto na edição não existe mais
    When aciona "Salvar"
    Then o sistema exibe "Registro não encontrado."

  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Falha inesperada ao salvar
    When a alteração não pode ser concluída por falha inesperada
    Then o sistema exibe "Ocorreu um erro. Tente novamente."
    And mantém os dados anteriores do usuário
```

## Campos

| Label PO | Entidade | Preenchimento | Edição | Tipo | Obrigatório | Validação |
|---|---|---|---|---|---|---|
| E-mail | Usuario | exibido do cadastro | imutável | texto | — | Identifica o usuário; não muda depois do cadastro |
| Nome completo | Usuario | entrada do usuário | editável | texto | sim | → ver FIELD-DICTIONARY: Nome de pessoa |
| CPF | Usuario | entrada do usuário | editável | texto | não | Único quando informado; → ver FIELD-DICTIONARY: CPF |
| Telefone | Usuario | entrada do usuário | editável | texto | não | → ver FIELD-DICTIONARY: Telefone |
| Perfil | Usuario | entrada do usuário | editável | lista (Cliente, Atendente, Gestor de catálogo, Administrador) | sim | Uma opção da lista |
| Situação | Usuario | exibido do cadastro | somente leitura | lista (Ativo, Inativo) | — | Muda só por ADM-USR-04 — Inativar Usuário |

## Campos automáticos

| Label PO | Valor | Quando |
|---|---|---|
| — | Nenhum campo é preenchido automaticamente nesta funcionalidade | — |

## Superfície

**Tela própria** — rota: Editar Usuário (`/administracao/usuarios/:id/editar`), acessada da Pesquisa de Usuários.

**Fidelidade ao protótipo**: referência · `prototypes/administracao/usuarios/flow.html` · [abrir o protótipo ↗](../../../prototypes/administracao/usuarios/flow.html)

## Comportamento de tela

### Onde fica

A tela Editar Usuário abre pelo ícone editar na linha de um usuário ativo da Pesquisa de Usuários (ADM-USR-01 — Pesquisar Usuários). O formulário é o do cadastro, já preenchido, com o e-mail e a situação em somente leitura; **Salvar** grava e **Cancelar** volta à pesquisa sem gravar.

### Estados da tela

| Estado | Comportamento |
|---|---|
| Inicial | Formulário preenchido com os dados do usuário; e-mail e situação em somente leitura |
| Loading | Mostrar "Carregando…" e bloquear **Salvar** enquanto grava |
| Erro de validação | Mostrar a mensagem literal abaixo de cada campo inválido; nada é gravado |
| Conflito | Mostrar "Já existe um usuário com este CPF." abaixo do CPF, ou "A loja precisa de ao menos um administrador ativo." no topo do formulário; nada é gravado |
| Erro de servidor | Mostrar "Ocorreu um erro. Tente novamente." e manter o que foi digitado |
| Sucesso | Toast "Registro salvo com sucesso." e volta à Pesquisa de Usuários com os dados novos |
| Usuário inativo | Mostrar "Usuário inativo não pode ser alterado." e não abrir o formulário para edição |
| Registro não encontrado | Mostrar "Registro não encontrado." e voltar à pesquisa |

## Critérios de sucesso

| # | Critério mensurável | Origem |
|---|---|---|
| SC-01 | Uma troca de perfil salva aparece na pesquisa na mesma hora | CA-3 |
| SC-02 | Nenhuma edição altera o e-mail de um usuário | CA-3 e RN-01 |
| SC-03 | A loja nunca fica sem um usuário ativo de perfil Administrador por uma edição | CA-3 e RN-04 |

## Métricas de tamanho

| Função de Transação | Papel | Tipo | ALR | DER | Complexidade | PF | Data |
|---|---|---|---|---|---|---|---|
| Editar Usuário | principal | — | — | — | — | — | — |

A contagem está pendente e deve nascer da análise desta funcionalidade via CT, com memória de cálculo.

## Origem

| Ticket (AIMM) | Tipo | Critérios cobertos |
|---|---|---|
| [`STRY0013195`](../../../analise-impacto/AIMM-STRY0013195.md) | Criação | `CA-3` — alteração de nome, CPF, telefone e perfil, sem mudar o e-mail e sem deixar a loja sem administrador ativo |

## Changelog

| Data | Autor | Tipo | Descrição |
|---|---|---|---|
| 2026-10-18 | Claude | N3 criado | Edição de usuário do ticket fictício STRY0013195, derivada do cadastro, com o e-mail imutável e a garantia de ao menos um administrador ativo; gates sem aprovação e contagem pendente. |
| 2026-10-18 | Claude | Ajuste | Seções reordenadas: a Superfície vai para antes da seção Comportamento de tela e a Origem vai para antes da seção Changelog. Nenhuma regra, cenário ou campo muda. |
| 2026-10-20 | Docqui Caixa | Terminologia | Adoção de AIMM; histórico e chave preservados. |
| 2026-10-21 | Docqui Caixa | Terminologia | Níveis em português: Domínio, Agrupamento Funcional e Funcionalidade; histórico preservado. |
