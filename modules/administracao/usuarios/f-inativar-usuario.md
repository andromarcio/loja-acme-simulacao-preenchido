<!-- docqui: 7.0.0 | prompt: MIGRA_NIVEIS | atualizado: 2026-10-21 -->
---
id: ADM-USR-04
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

# Inativar Usuário
> **Nível 3** - Agrupamento Funcional: Usuários — Domínio: Administração - `ADM-USR-04`

## Descrição

Permite que o administrador inative um usuário, tirando o acesso dele à loja sem apagá-lo dos pedidos e do histórico.

Na Pesquisa de Usuários, o administrador aciona inativar na linha de um usuário ativo, informa o motivo se quiser e confirma na caixa de diálogo.

## Regras de negócio

- **RN-01** — A inativação é lógica: o usuário continua registrado nos pedidos em que é cliente ou em que cancelou.
- **RN-02** — O administrador não inativa o próprio usuário.
- **RN-03** — Usuário inativo não acessa a loja. → ver N1 Administração: Regras transversais de negócio: 1
- **RN-04** — Usuário já inativo não é inativado de novo.

## Cenários

```gherkin
Feature: Inativar Usuário

  Background:
    Given que a administradora Elisa Rocha está na Pesquisa de Usuários
    And que o pedido 1003 foi cancelado por Carla Souza

  # Caminho feliz
  @RN-01
  # ← MESSAGE-DICTIONARY: ADM_INATIVAR_CONFIRMACAO
  # ← MESSAGE-DICTIONARY: ADM_USUARIO_INATIVADO
  Scenario: Usuário inativado com motivo
    When aciona "Inativar" na linha de "Carla Souza"
    Then o sistema exibe "Deseja realmente inativar Carla Souza? O usuário perderá o acesso à loja."
    When informa o motivo "Transferida para outra loja"
    And confirma a inativação
    Then o sistema exibe "Usuário inativado."
    And "Carla Souza" passa a ter a situação "Inativo", com a data da inativação de hoje
    And o pedido 1003 continua mostrando "Carla Souza" em quem cancelou

  @RN-03
  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Usuário inativado perde o acesso
    Given que Carla Souza foi inativada
    When Carla Souza tenta pesquisar pedidos
    Then o sistema exibe "Você não tem permissão para esta ação."

  # Erros de validação
  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Motivo longo demais
    When aciona "Inativar" na linha de "Carla Souza"
    And informa um motivo com 201 caracteres
    And confirma a inativação
    Then o sistema exibe abaixo do campo "Máximo de 200 caracteres."
    And Carla Souza continua ativa

  # Conflitos com dados existentes
  @RN-02
  # ← MESSAGE-DICTIONARY: ADM_AUTOINATIVACAO
  Scenario: Administrador tenta inativar o próprio usuário
    When aciona "Inativar" na linha de "Elisa Rocha"
    Then o sistema exibe "Você não pode inativar o próprio usuário."
    And Elisa Rocha continua ativa

  @RN-04
  # ← MESSAGE-DICTIONARY: ADM_USUARIO_JA_INATIVO
  Scenario: Usuário inativado por outra pessoa enquanto a lista estava aberta
    Given que a lista ainda mostra Fábio Nunes como ativo
    And que outra pessoa já inativou Fábio Nunes
    When aciona "Inativar" na linha de "Fábio Nunes" e confirma
    Then o sistema exibe "Este usuário já está inativo."
    And a data e o motivo da inativação anterior não mudam

  # Restrições de acesso
  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Tentativa sem acesso à funcionalidade
    Given que a pessoa não tem acesso à funcionalidade
    When tenta inativar um usuário
    Then o sistema exibe "Você não tem permissão para esta ação."
    And não inativa o usuário

  # Estados especiais
  Scenario: Desistência na confirmação
    When aciona "Inativar" na linha de "Carla Souza"
    And aciona "Cancelar" na caixa de diálogo
    Then Carla Souza continua ativa
    And nada é alterado

  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Falha inesperada ao inativar
    When a inativação não pode ser concluída por falha inesperada
    Then o sistema exibe "Ocorreu um erro. Tente novamente."
    And o usuário continua ativo
```

## Campos

| Label PO | Entidade | Preenchimento | Edição | Tipo | Obrigatório | Validação |
|---|---|---|---|---|---|---|
| Nome completo | Usuario | exibido do cadastro | somente leitura | texto | — | Identifica o usuário na caixa de confirmação |
| Motivo da inativação | Usuario | entrada do usuário | editável | texto | não | Até 200 caracteres |

## Campos automáticos

| Label PO | Valor | Quando |
|---|---|---|
| Situação | Inativo | Ao confirmar a inativação |
| Data da inativação | Data do dia | Ao confirmar a inativação |

## Superfície

**Ação em tela** — origem: Pesquisar Usuários (Pesquisa de Usuários, `/administracao/usuarios`).

**Fidelidade ao protótipo**: referência · `prototypes/administracao/usuarios/flow.html` · [abrir o protótipo ↗](../../../prototypes/administracao/usuarios/flow.html)

## Comportamento de tela

### Onde fica

O ícone inativar aparece na linha de cada usuário ativo da Pesquisa de Usuários (ADM-USR-01 — Pesquisar Usuários). Ele abre uma caixa de diálogo com a pergunta de confirmação, o nome do usuário, o motivo opcional e os botões **Cancelar** e **Inativar**. A autoinativação e o usuário já inativo aparecem numa caixa de diálogo separada, só com **Ok, entendi**, sem o botão de inativar.

### Estados da tela

| Estado | Comportamento |
|---|---|
| Inicial | Linha do usuário ativo com o ícone inativar |
| Confirmação | Caixa de diálogo com "Deseja realmente inativar [nome]? O usuário perderá o acesso à loja." e o campo do motivo, vazio |
| Loading | Mostrar "Carregando…" e bloquear **Inativar** enquanto grava |
| Erro de validação | Mostrar "Máximo de 200 caracteres." abaixo do motivo; nada é gravado |
| Bloqueio | Caixa de diálogo com "Você não pode inativar o próprio usuário." ou "Este usuário já está inativo.", só com **Ok, entendi** |
| Erro de servidor | Mostrar "Ocorreu um erro. Tente novamente."; o usuário continua ativo |
| Sucesso | Toast "Usuário inativado." e a linha passa a mostrar a situação Inativo, sem os ícones de editar e inativar |

## Critérios de sucesso

| # | Critério mensurável | Origem |
|---|---|---|
| SC-01 | O usuário inativado continua aparecendo em todo pedido em que é cliente ou em que cancelou | CA-4 e RN-01 |
| SC-02 | O usuário inativado não usa nenhuma funcionalidade da loja | CA-4 e RN-03 |
| SC-03 | Nenhum administrador consegue inativar o próprio usuário | CA-4 e RN-02 |

## Métricas de tamanho

| Função de Transação | Papel | Tipo | ALR | DER | Complexidade | PF | Data |
|---|---|---|---|---|---|---|---|
| Inativar Usuário | principal | — | — | — | — | — | — |

A contagem está pendente e deve nascer da análise desta funcionalidade via CT, com memória de cálculo.

## Origem

| Ticket (AIMM) | Tipo | Critérios cobertos |
|---|---|---|
| [`STRY0013195`](../../../analise-impacto/AIMM-STRY0013195.md) | Criação | `CA-4` — inativação que tira o acesso e mantém o usuário nos pedidos, sem que o administrador inative a si mesmo |

## Changelog

| Data | Autor | Tipo | Descrição |
|---|---|---|---|
| 2026-10-18 | Claude | N3 criado | Inativação de usuário do ticket fictício STRY0013195: exclusão lógica, com motivo opcional e sem autoinativação; gates sem aprovação e contagem pendente. |
| 2026-10-18 | Claude | Ajuste | Seções reordenadas: a Superfície vai para antes da seção Comportamento de tela e a Origem vai para antes da seção Changelog. Nenhuma regra, cenário ou campo muda. |
| 2026-10-20 | Docqui Caixa | Terminologia | Adoção de AIMM; histórico e chave preservados. |
| 2026-10-21 | Docqui Caixa | Terminologia | Níveis em português: Domínio, Agrupamento Funcional e Funcionalidade; histórico preservado. |
