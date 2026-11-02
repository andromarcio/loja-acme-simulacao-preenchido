<!-- docqui: 7.0.0 | prompt: MIGRA_NIVEIS | atualizado: 2026-10-21 -->
---
id: ADM-USR-05
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

# Visualizar Usuário
> **Nível 3** - Agrupamento Funcional: Usuários — Domínio: Administração - `ADM-USR-05`

## Descrição

Permite que o administrador consulte a ficha completa de um usuário, ativo ou inativo, com o perfil, a situação e, se inativo, quando e por que perdeu o acesso.

Na Pesquisa de Usuários, o administrador aciona visualizar na linha do usuário; a ficha abre em somente leitura e **Voltar** retorna à pesquisa.

## Regras de negócio

- **RN-01** — A data e o motivo da inativação aparecem apenas na ficha de usuário inativo.
- **RN-02** — O usuário inativo continua podendo ser visualizado.

## Cenários

```gherkin
Feature: Visualizar Usuário

  Background:
    Given que a administradora Elisa Rocha está na Pesquisa de Usuários
    And que Fábio Nunes foi inativado em 30/09/2026 com o motivo "Desligado da equipe de atendimento"

  # Caminho feliz
  @RN-01
  Scenario: Ficha de um usuário ativo
    When aciona visualizar na linha de "Carla Souza"
    Then o sistema mostra o nome completo "Carla Souza", o e-mail "carla.souza@acme.example", o perfil "Atendente" e a situação "Ativo"
    And a ficha não mostra a data nem o motivo da inativação

  @RN-01 @RN-02
  Scenario: Ficha de um usuário inativo
    When escolhe a situação "Todas" e pesquisa
    And aciona visualizar na linha de "Fábio Nunes"
    Then o sistema mostra a situação "Inativo"
    And mostra a data da inativação "30/09/2026" e o motivo "Desligado da equipe de atendimento"

  Scenario: Dados opcionais não informados
    Given que Diego Martins não tem CPF nem telefone informados
    When aciona visualizar na linha de "Diego Martins"
    Then o CPF e o telefone aparecem como "—"

  # Restrições de acesso
  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Tentativa sem acesso à funcionalidade
    Given que a pessoa não tem acesso à funcionalidade
    When tenta visualizar um usuário
    Then o sistema exibe "Você não tem permissão para esta ação."
    And não mostra os dados do usuário

  # Estados especiais
  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Usuário que não existe mais
    Given que o usuário escolhido não existe mais
    When aciona visualizar
    Then o sistema exibe "Registro não encontrado."

  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Falha ao carregar a ficha
    When a ficha não pode ser carregada por falha inesperada
    Then o sistema exibe "Não foi possível carregar os dados."
```

## Campos

| Label PO | Entidade | Preenchimento | Edição | Tipo | Obrigatório | Validação |
|---|---|---|---|---|---|---|
| Nome completo | Usuario | exibido do cadastro | somente leitura | texto | — | — |
| E-mail | Usuario | exibido do cadastro | somente leitura | texto | — | — |
| CPF | Usuario | exibido do cadastro | somente leitura | texto | — | "—" quando não informado |
| Telefone | Usuario | exibido do cadastro | somente leitura | texto | — | "—" quando não informado |
| Perfil | Usuario | exibido do cadastro | somente leitura | lista (Cliente, Atendente, Gestor de catálogo, Administrador) | — | — |
| Situação | Usuario | exibido do cadastro | somente leitura | lista (Ativo, Inativo) | — | — |
| Data de cadastro | Usuario | exibido do cadastro | somente leitura | data | — | — |
| Data da inativação | Usuario | exibido do cadastro | somente leitura | data | — | Só no usuário inativo |
| Motivo da inativação | Usuario | exibido do cadastro | somente leitura | texto | — | Só no usuário inativo; "—" quando não informado |

## Campos automáticos

| Label PO | Valor | Quando |
|---|---|---|
| — | Nenhum campo é preenchido automaticamente nesta funcionalidade | — |

## Superfície

**Tela própria** — rota: Visualizar Usuário (`/administracao/usuarios/:id`), acessada da Pesquisa de Usuários.

**Fidelidade ao protótipo**: referência · `prototypes/administracao/usuarios/flow.html` · [abrir o protótipo ↗](../../../prototypes/administracao/usuarios/flow.html)

## Comportamento de tela

### Onde fica

A tela Visualizar Usuário abre pelo ícone visualizar em qualquer linha da Pesquisa de Usuários (ADM-USR-01 — Pesquisar Usuários), de usuário ativo ou inativo. É uma ficha de rótulo e valor, sem campos editáveis; a única ação é **Voltar**.

### Estados da tela

| Estado | Comportamento |
|---|---|
| Inicial | Ficha com os dados do usuário em rótulo e valor |
| Loading | Mostrar "Carregando…" no lugar da ficha |
| Erro de servidor | Mostrar "Não foi possível carregar os dados." |
| Sucesso | Ficha completa; no inativo, também a data e o motivo da inativação |
| Registro não encontrado | Mostrar "Registro não encontrado." e voltar à pesquisa |

## Critérios de sucesso

| # | Critério mensurável | Origem |
|---|---|---|
| SC-01 | A ficha mostra todos os dados do cadastro do usuário, sem nenhum campo editável | CA-5 |
| SC-02 | A data e o motivo da inativação aparecem em todo usuário inativo e em nenhum ativo | CA-5 e RN-01 |
| SC-03 | Todo usuário inativo continua com a ficha disponível | CA-5 e RN-02 |

## Métricas de tamanho

| Função de Transação | Papel | Tipo | ALR | DER | Complexidade | PF | Data |
|---|---|---|---|---|---|---|---|
| Visualizar Usuário | principal | — | — | — | — | — | — |

A contagem está pendente e deve nascer da análise desta funcionalidade via CT, com memória de cálculo.

## Origem

| Ticket (AIMM) | Tipo | Critérios cobertos |
|---|---|---|
| [`STRY0013195`](../../../analise-impacto/AIMM-STRY0013195.md) | Criação | `CA-5` — consulta de todos os dados de um usuário |

## Changelog

| Data | Autor | Tipo | Descrição |
|---|---|---|---|
| 2026-10-18 | Claude | N3 criado | Visualização de usuário do ticket fictício STRY0013195, derivada do cadastro, com os dados da inativação só no usuário inativo; gates sem aprovação e contagem pendente. |
| 2026-10-18 | Claude | Ajuste | Seções reordenadas: a Superfície vai para antes da seção Comportamento de tela e a Origem vai para antes da seção Changelog. Nenhuma regra, cenário ou campo muda. |
| 2026-10-20 | Docqui Caixa | Terminologia | Adoção de AIMM; histórico e chave preservados. |
| 2026-10-21 | Docqui Caixa | Terminologia | Níveis em português: Domínio, Agrupamento Funcional e Funcionalidade; histórico preservado. |
