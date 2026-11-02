<!-- docqui: 9.1.0 | prompt: MIGRA_AIMM_ESTADO | atualizado: 2026-10-31 -->
---
tipo: ticket
ticket: STRY0013195
ferramenta: ServiceNow fictício
link: ../mentoria/backlog.md#stry0013195--usuários-da-loja
titulo: Usuários da loja
estado: em-análise
estado-por: "Claude"
estado-em: 2026-10-31 00:16 +00:00
aberta-na-entrega: false
sprint: ""
avalizado-por: ""
aberta-em: 2026-10-18
---

# AIMM STRY0013195

## Descrição do ticket

> Transcrição do ticket fictício do backlog da demonstração; não é um registro do ServiceNow real.

O administrador precisa manter os usuários da loja — clientes, atendentes, gestores de catálogo e administradores — e tirar o acesso de quem não deve mais usar a loja, sem apagar o histórico.

## Critérios de aceite

> **Numeração**: a fonte fictícia numera os critérios; os números CA-n abaixo são os mesmos do backlog.

| Critério | Descrição |
|---|---|
| CA-1 | O administrador pesquisa usuários por nome, e-mail, perfil e situação. |
| CA-2 | O usuário é cadastrado com nome completo, e-mail e perfil, e opcionalmente CPF e telefone; e-mail e CPF não se repetem. |
| CA-3 | O administrador altera o nome, o CPF, o telefone e o perfil do usuário; o e-mail não muda, e a loja nunca fica sem um administrador ativo. |
| CA-4 | O usuário inativado perde o acesso, mas continua nos pedidos; o administrador não pode inativar o próprio usuário. |
| CA-5 | O administrador consulta todos os dados de um usuário. |

## Funcionalidades

| Funcionalidade (N3) | Domínio · Agrupamento Funcional | Operação | Critérios cobertos | Status |
|---|---|---|---|---|
| [`ADM-USR-01`: Pesquisar Usuários](../modules/administracao/usuarios/f-pesquisar-usuario.md) | Administração · Usuários | Criação | `CA-1` | 📋 Especificado |
| [`ADM-USR-02`: Cadastrar Usuário](../modules/administracao/usuarios/f-cadastrar-usuario.md) | Administração · Usuários | Criação | `CA-2` | 📋 Especificado |
| [`ADM-USR-03`: Editar Usuário](../modules/administracao/usuarios/f-editar-usuario.md) | Administração · Usuários | Criação | `CA-3` | 📋 Especificado |
| [`ADM-USR-04`: Inativar Usuário](../modules/administracao/usuarios/f-inativar-usuario.md) | Administração · Usuários | Criação | `CA-4` | 📋 Especificado |
| [`ADM-USR-05`: Visualizar Usuário](../modules/administracao/usuarios/f-visualizar-usuario.md) | Administração · Usuários | Criação | `CA-5` | 📋 Especificado |

## Artefatos impactados

O changeset abaixo descreve o pacote didático. Não há aval de PO registrado; os arquivos preenchidos são material de demonstração.

| Artefato | Tipo | Operação | Seção | Natureza | O quê | Proveniência |
|---|---|---|---|---|---|---|
| `modules/administracao/README.md` | N1 | criar | — | funcional | Administração, com as regras de acesso | elicitado |
| `modules/administracao/usuarios/README.md` | N2 | criar | — | funcional | CRUD de Usuários com inativação, telas e permissões | elicitado |
| `modules/administracao/usuarios/f-pesquisar-usuario.md` | N3 | criar | — | funcional | ADM-USR-01 — Pesquisar Usuários | derivado: âncora |
| `modules/administracao/usuarios/f-cadastrar-usuario.md` | N3 | criar | — | funcional | ADM-USR-02 — Cadastrar Usuário | derivado: âncora |
| `modules/administracao/usuarios/f-editar-usuario.md` | N3 | criar | — | funcional | ADM-USR-03 — Editar Usuário | derivado: âncora |
| `modules/administracao/usuarios/f-inativar-usuario.md` | N3 | criar | — | funcional | ADM-USR-04 — Inativar Usuário | derivado: âncora |
| `modules/administracao/usuarios/f-visualizar-usuario.md` | N3 | criar | — | funcional | ADM-USR-05 — Visualizar Usuário | derivado: âncora |
| `global/DATA-MODEL.md` | DATA-MODEL | alterar | Modelos por domínio | funcional | Índice do modelo de Administração | elicitado |
| `global/data-models/administracao.md` | DATA-MODEL | criar | — | funcional | Usuario, com a massa da demonstração | elicitado |
| `global/FIELD-DICTIONARY.md` | FIELD-DICT | alterar | Nome de pessoa; Telefone | funcional | Entradas trabalhadas de Nome de pessoa e Telefone | elicitado |
| `global/MESSAGE-DICTIONARY.md` | MESSAGE-DICT | alterar | Administração | funcional | Duplicidades, último administrador e inativação | elicitado |
| `prototypes/administracao/usuarios/flow.html` | PROTÓTIPO | criar | — | funcional | Pesquisa, cadastro, edição, visualização e inativação | derivado: espelho do N2 |

## Alterações em funcionalidades por Agrupamento Funcional

### Usuários

| Funcionalidade | CA-n | Natureza | Mudança | Regras | Cenários |
| --- | --- | --- | --- | --- | --- |
| `ADM-USR-01`<br>**Pesquisar Usuários** | CA-1 | incluída | **Inclusão** da funcionalidade. *Antes*: não havia N3. *Agora*: encontrar usuários por nome, e-mail, perfil e situação. | +3 | +7 |
| `ADM-USR-02`<br>**Cadastrar Usuário** | CA-2 | incluída | **Inclusão** da funcionalidade. *Antes*: não havia N3. *Agora*: incluir um usuário com e-mail único e perfil. | +3 | +11 |
| `ADM-USR-03`<br>**Editar Usuário** | CA-3 | incluída | **Inclusão** da funcionalidade. *Antes*: não havia N3. *Agora*: alterar os dados e o perfil, sem mudar o e-mail. | +4 | +10 |
| `ADM-USR-04`<br>**Inativar Usuário** | CA-4 | incluída | **Inclusão** da funcionalidade. *Antes*: não havia N3. *Agora*: tirar o acesso de um usuário, mantendo o histórico. | +4 | +8 |
| `ADM-USR-05`<br>**Visualizar Usuário** | CA-5 | incluída | **Inclusão** da funcionalidade. *Antes*: não havia N3. *Agora*: ver todos os dados de um usuário. | +2 | +6 |

## Entidades alteradas

Modelo negocial de Usuario, sem alterações físicas ou contagem ALI/AIE.

## Impacto em dicionários

- Nome de pessoa e Telefone recebem entradas trabalhadas no FIELD-DICTIONARY; CPF e E-mail já tinham.
- Mensagens de Administração: `ADM_EMAIL_DUPLICADO`, `ADM_CPF_DUPLICADO`, `ADM_USUARIO_INATIVO`, `ADM_ULTIMO_ADMINISTRADOR`, `ADM_AUTOINATIVACAO`, `ADM_INATIVAR_CONFIRMACAO`, `ADM_USUARIO_INATIVADO` e `ADM_USUARIO_JA_INATIVO`.

## Decisões pendentes

- O responsável real deve revisar o escopo e conduzir CP1/CP2 antes de qualquer entrega.
- A contagem será feita via CT; nenhum PF foi estimado.
- Senha, primeiro acesso, reativação e autocadastro do cliente não estão especificados.

## Reconciliação

Não encerrada. Esta AIMM está em análise e não declara entrega, aprovação de escopo ou aprovação dos gates.

## Changelog

| Data | Autor | Tipo | Descrição |
|---|---|---|---|
| 2026-10-31 | Docqui Caixa | Ajuste | Front-matter ganha `estado-por` e `estado-em` (9.1.0), preenchidos pelo histórico do git com quem levou a AIMM ao estado atual e quando. |
| 2026-10-21 | Docqui Caixa | Ajuste | Layout da AIMM do ticket: sem Contexto, alterações por Agrupamento Funcional, Decisões pendentes, nome abaixo do ID, entidades sem PF. |
| 2026-10-20 | Docqui Caixa | Ajuste | Layout da AIMM do ticket: nome abaixo do ID, entidades sem PF. |
| 2026-10-18 | Claude | Demonstração | Ticket fictício e Feature Set Usuários preenchidos, com 5 features em rascunho, sem aval e com a contagem pendente. |
| 2026-10-20 | Docqui Caixa | Terminologia | Adoção de AIMM; histórico e chave preservados. |
| 2026-10-21 | Docqui Caixa | Terminologia | Níveis em português: Domínio, Agrupamento Funcional e Funcionalidade; histórico preservado. |
