<!-- docqui: 7.0.0 | prompt: MIGRA_NIVEIS | atualizado: 2026-10-21 -->
---
id: ADM-USR-01
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

# Pesquisar Usuários
> **Nível 3** - Agrupamento Funcional: Usuários — Domínio: Administração - `ADM-USR-01`

## Descrição

Permite que o administrador pesquise os usuários da loja por nome, e-mail, perfil e situação, vendo de cada um o perfil e se está ativo.

Ao abrir a Pesquisa de Usuários, o administrador já vê os usuários ativos; para filtrar, informa parte do nome ou do e-mail, escolhe um perfil ou uma situação e aciona **Pesquisar**. De cada linha, abre a visualização, a edição ou a inativação do usuário.

## Regras de negócio

- **RN-01** — A busca por nome completo e por e-mail encontra os usuários que contêm o termo informado, sem diferenciar maiúsculas, minúsculas e acentos.
- **RN-02** — Quando a situação não é escolhida, valem apenas os usuários ativos, em ordem alfabética de nome completo.
- **RN-03** — Um usuário atende à pesquisa somente quando satisfaz todos os critérios informados.

## Cenários

```gherkin
Feature: Pesquisar Usuários

  Background:
    Given que a administradora Elisa Rocha está na Pesquisa de Usuários
    And que a loja tem os oito usuários da massa de demonstração, com Fábio Nunes inativo

  # Caminho feliz
  @RN-02
  Scenario: Lista inicial com os usuários ativos
    When a pesquisa é aberta sem alterar os filtros
    Then o sistema lista os sete usuários ativos em ordem alfabética, de "Ana Costa" a "Roberto Dias"
    And "Fábio Nunes" não aparece na lista

  @RN-01
  Scenario: Busca parcial pelo nome, sem acento
    When informa "fabio" no nome completo
    And escolhe a situação "Todas"
    And aciona "Pesquisar"
    Then o sistema lista "Fábio Nunes" com a situação "Inativo"

  @RN-01
  Scenario: Busca parcial pelo e-mail
    When informa "acme.example" no e-mail
    And aciona "Pesquisar"
    Then o sistema lista "Carla Souza", "Diego Martins" e "Elisa Rocha"

  @RN-03
  Scenario: Filtros combinados
    When escolhe o perfil "Cliente"
    And informa "ana" no nome completo
    And aciona "Pesquisar"
    Then o sistema lista apenas "Ana Costa" e "Juliana Alves"

  # Restrições de acesso
  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Tentativa sem acesso à funcionalidade
    Given que a pessoa não tem acesso à funcionalidade
    When tenta abrir a Pesquisa de Usuários
    Then o sistema exibe "Você não tem permissão para esta ação."
    And não lista nenhum usuário

  # Estados especiais
  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Busca sem resultado
    When informa "Gustavo" no nome completo
    And aciona "Pesquisar"
    Then o sistema exibe "Nenhum resultado para a busca."

  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Falha ao carregar a lista
    When a lista não pode ser carregada por falha inesperada
    Then o sistema exibe "Não foi possível carregar os dados."
```

## Campos

| Label PO | Entidade | Preenchimento | Edição | Tipo | Obrigatório | Validação |
|---|---|---|---|---|---|---|
| Nome completo (filtro) | Usuario | entrada do usuário | editável | texto | não | Correspondência parcial, sem diferenciar maiúsculas, minúsculas e acentos |
| E-mail (filtro) | Usuario | entrada do usuário | editável | texto | não | Correspondência parcial, sem diferenciar maiúsculas e minúsculas |
| Perfil (filtro) | Usuario | entrada do usuário | editável | lista (Todos, Cliente, Atendente, Gestor de catálogo, Administrador) | não | Padrão: Todos |
| Situação (filtro) | Usuario | entrada do usuário | editável | lista (Todas, Ativo, Inativo) | não | Padrão: Ativo |

## Colunas do resultado

| Coluna (Label PO) | Origem | Ordenação |
|---|---|---|
| Nome completo | cadastro | padrão ↑ |
| E-mail | cadastro | ordenável |
| Perfil | cadastro | ordenável |
| Situação | cadastro | — |
| Data de cadastro | cadastro | ordenável |

## Campos automáticos

| Label PO | Valor | Quando |
|---|---|---|
| — | Nenhum campo é preenchido automaticamente nesta funcionalidade | — |

## Superfície

**Tela própria** — rota: Pesquisa de Usuários (`/administracao/usuarios`).

**Fidelidade ao protótipo**: referência · `prototypes/administracao/usuarios/flow.html` · [abrir o protótipo ↗](../../../prototypes/administracao/usuarios/flow.html)

## Comportamento de tela

### Onde fica

A Pesquisa de Usuários traz os filtros no topo, o botão **Cadastrar usuário** (ADM-USR-02 — Cadastrar Usuário) e a lista. Cada linha tem as ações visualizar (ADM-USR-05 — Visualizar Usuário), editar (ADM-USR-03 — Editar Usuário) e inativar (ADM-USR-04 — Inativar Usuário); editar e inativar aparecem só nos usuários ativos.

### Estados da tela

| Estado | Comportamento |
|---|---|
| Inicial | Filtros com os padrões (Perfil Todos, Situação Ativo) e a lista dos usuários ativos em ordem alfabética |
| Loading | Mostrar "Carregando…" no lugar da lista enquanto pesquisa |
| Erro de servidor | Mostrar "Não foi possível carregar os dados." no lugar da lista |
| Sucesso | Lista com os usuários que atendem aos filtros e a quantidade encontrada |
| Busca sem resultado | Mostrar "Nenhum resultado para a busca." |

## Critérios de sucesso

| # | Critério mensurável | Origem |
|---|---|---|
| SC-01 | Ao abrir a pesquisa, a lista traz os sete usuários ativos da massa, em ordem alfabética, sem o inativo | CA-1 e RN-02 |
| SC-02 | A busca por "fabio", com a situação Todas, encontra Fábio Nunes | CA-1 e RN-01 |
| SC-03 | O perfil Cliente combinado com "ana" retorna exatamente Ana Costa e Juliana Alves | CA-1 e RN-03 |

## Métricas de tamanho

| Função de Transação | Papel | Tipo | ALR | DER | Complexidade | PF | Data |
|---|---|---|---|---|---|---|---|
| Pesquisar Usuários | principal | — | — | — | — | — | — |

A contagem está pendente e deve nascer da análise desta funcionalidade via CT, com memória de cálculo.

## Origem

| Ticket (AIMM) | Tipo | Critérios cobertos |
|---|---|---|
| [`STRY0013195`](../../../analise-impacto/AIMM-STRY0013195.md) | Criação | `CA-1` — pesquisa de usuários por nome, e-mail, perfil e situação |

## Changelog

| Data | Autor | Tipo | Descrição |
|---|---|---|---|
| 2026-10-18 | Claude | N3 criado | Pesquisa de usuários do ticket fictício STRY0013195, derivada do cadastro, com filtros por nome, e-mail, perfil e situação; gates sem aprovação e contagem pendente. |
| 2026-10-18 | Claude | Ajuste | Seções reordenadas: a Superfície vai para antes da seção Comportamento de tela e a Origem vai para antes da seção Changelog. Nenhuma regra, cenário ou campo muda. |
| 2026-10-20 | Docqui Caixa | Terminologia | Adoção de AIMM; histórico e chave preservados. |
| 2026-10-21 | Docqui Caixa | Terminologia | Níveis em português: Domínio, Agrupamento Funcional e Funcionalidade; histórico preservado. |
