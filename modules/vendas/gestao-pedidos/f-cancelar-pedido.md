<!-- docqui: 7.0.0 | prompt: MIGRA_NIVEIS | atualizado: 2026-10-21 -->
---
id: VND-PED-03
agrupamento_funcional: VND-PED
dominio: VND
entidade: Pedido
data_model_ref: data-models/vendas.md#pedido
endpoints: []
error_codes: []
depende_de: []
origem:
  tipo: servicenow
  chave: STRY0013190
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

# Cancelar Pedido
> **Nível 3** - Agrupamento Funcional: Gestão de Pedidos — Domínio: Vendas - `VND-PED-03`

## Descrição

Permite que o atendente cancele um pedido confirmado quando o cliente pede, deixando registrados o motivo, a data e quem cancelou.

No Detalhe do Pedido de um pedido confirmado, o atendente aciona **Cancelar pedido**, informa o motivo na caixa de confirmação e confirma; o pedido passa à situação Cancelado.

## Regras de negócio

- **RN-01** — Só pedido na situação Confirmado pode ser cancelado.
- **RN-02** — O cancelamento não altera os itens, o frete nem os valores do pedido.
- **RN-03** — Pedido cancelado não volta à situação Confirmado.
- **RN-04** — Todo pedido cancelado tem um motivo do cancelamento.

## Cenários

```gherkin
Feature: Cancelar Pedido

  Background:
    Given que a atendente "Carla Souza" está no Detalhe do Pedido
    And que hoje é 18/10/2026

  # Caminho feliz
  @RN-02 @RN-04
  # ← MESSAGE-DICTIONARY: VND_CANCELAR_CONFIRMACAO
  # ← MESSAGE-DICTIONARY: VND_PEDIDO_CANCELADO
  Scenario: Pedido confirmado cancelado com o motivo
    Given que o pedido 1002 está confirmado, com o valor do frete R$ 22,50 e o total do pedido R$ 112,40
    When a atendente aciona "Cancelar pedido"
    Then o sistema pergunta "Deseja realmente cancelar o pedido 1002?"
    When a atendente informa o motivo "Cliente pediu o cancelamento por telefone"
    And confirma o cancelamento
    Then o sistema exibe "Pedido cancelado."
    And o pedido 1002 passa à situação "Cancelado", com a data do cancelamento "18/10/2026" e cancelado por "Carla Souza"
    And o pedido 1002 mantém os itens, o valor do frete R$ 22,50 e o total do pedido R$ 112,40

  # Erros de validação
  @RN-04
  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Motivo do cancelamento vazio
    Given que o pedido 1002 está confirmado
    When a atendente aciona "Cancelar pedido" e confirma sem informar o motivo
    Then o sistema exibe abaixo do campo "Campo obrigatório."
    And o pedido 1002 continua confirmado

  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Motivo do cancelamento curto demais
    Given que o pedido 1002 está confirmado
    When a atendente informa o motivo "Desistiu" e confirma o cancelamento
    Then o sistema exibe abaixo do campo "Mínimo de 10 caracteres."
    And o pedido 1002 continua confirmado

  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Motivo do cancelamento longo demais
    Given que o pedido 1002 está confirmado
    When a atendente informa um motivo com 201 caracteres e confirma o cancelamento
    Then o sistema exibe abaixo do campo "Máximo de 200 caracteres."
    And o pedido 1002 continua confirmado

  # Conflitos com dados existentes
  @RN-01
  # ← MESSAGE-DICTIONARY: VND_PEDIDO_NAO_CANCELAVEL
  Scenario: Pedido cancelado por outra pessoa durante o atendimento
    Given que o pedido 1006 estava confirmado quando a atendente abriu o detalhe
    And que outra pessoa cancelou o pedido 1006 em seguida
    When a atendente informa o motivo "Cliente pediu o cancelamento por telefone" e confirma o cancelamento
    Then o sistema exibe "Somente pedidos confirmados podem ser cancelados."
    And mantém o motivo e a data do primeiro cancelamento

  @RN-01 @RN-03
  # ← MESSAGE-DICTIONARY: VND_PEDIDO_NAO_CANCELAVEL
  Scenario: Pedido já cancelado
    Given que o pedido 1003 está cancelado, com o motivo "Cliente desistiu da compra"
    When a pessoa tenta cancelar o pedido 1003
    Then o sistema exibe "Somente pedidos confirmados podem ser cancelados."
    And o pedido 1003 continua cancelado, com o motivo "Cliente desistiu da compra"

  # Restrições de acesso
  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Tentativa sem acesso à funcionalidade
    Given que a pessoa não tem acesso à funcionalidade
    When tenta cancelar o pedido 1002
    Then o sistema exibe "Você não tem permissão para esta ação."
    And o pedido 1002 continua confirmado

  # Estados especiais
  Scenario: Desistência na caixa de confirmação
    Given que o pedido 1002 está confirmado
    When a atendente aciona "Cancelar pedido" e escolhe "Voltar" na caixa de confirmação
    Then o sistema fecha a caixa de confirmação
    And o pedido 1002 continua confirmado, sem motivo do cancelamento

  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Falha inesperada ao cancelar
    Given que o pedido 1002 está confirmado
    When o cancelamento não pode ser concluído por falha inesperada
    Then o sistema exibe "Ocorreu um erro. Tente novamente."
    And o pedido 1002 continua confirmado
```

## Campos

| Label PO | Entidade | Preenchimento | Edição | Tipo | Obrigatório | Validação |
|---|---|---|---|---|---|---|
| Número do pedido | Pedido | exibido do cadastro | somente leitura | número | não | Identifica o pedido na pergunta de confirmação |
| Motivo do cancelamento | Pedido | entrada do usuário | editável | texto | sim | De 10 a 200 caracteres |

## Campos automáticos

| Label PO | Valor | Quando |
|---|---|---|
| Situação | Cancelado | Ao confirmar o cancelamento |
| Data do cancelamento | Data de hoje | Ao confirmar o cancelamento |
| Cancelado por | O usuário que confirmou o cancelamento | Ao confirmar o cancelamento |

## Dados lidos e gravados

| Entidade | Papel | Por que a funcionalidade a toca |
|---|---|---|
| Usuario | lê | Identifica quem confirma o cancelamento, gravado no campo automático Cancelado por |

## Superfície

**Ação em tela** — origem: Visualizar Pedido (Detalhe do Pedido, `/vendas/pedidos/:numero`).

**Fidelidade ao protótipo**: referência · `prototypes/vendas/gestao-pedidos/flow.html` · [abrir o protótipo ↗](../../../prototypes/vendas/gestao-pedidos/flow.html)

## Comportamento de tela

### Onde fica

O botão **Cancelar pedido** fica no Detalhe do Pedido, de VND-PED-02 — Visualizar Pedido, e só aparece no pedido confirmado. Ele abre uma caixa de confirmação com a pergunta "Deseja realmente cancelar o pedido [número]?", o campo Motivo do cancelamento e os botões **Voltar** e **Cancelar pedido**; confirmado o cancelamento, a ficha passa a mostrar a situação Cancelado e os dados do cancelamento.

### Estados da tela

| Estado | Comportamento |
|---|---|
| Inicial | Botão **Cancelar pedido** visível só no pedido confirmado |
| Confirmação | Caixa aberta com a pergunta e o Motivo do cancelamento vazio |
| Loading | Mostrar "Carregando…" e bloquear o botão de confirmação enquanto cancela |
| Erro de validação | Mostrar a mensagem literal abaixo do campo Motivo do cancelamento, com a caixa aberta |
| Erro de servidor | Mostrar "Ocorreu um erro. Tente novamente." na caixa; o pedido continua confirmado |
| Sucesso | Fechar a caixa, mostrar o toast "Pedido cancelado." e atualizar a ficha com a situação Cancelado e os dados do cancelamento |
| Pedido não cancelável | Mostrar "Somente pedidos confirmados podem ser cancelados." e recarregar a ficha com a situação atual |

## Critérios de sucesso

| # | Critério mensurável | Origem |
|---|---|---|
| SC-01 | Todo pedido cancelado tem motivo, data do cancelamento e quem cancelou | CA-3 e RN-04 |
| SC-02 | Nenhum pedido em situação diferente de Confirmado é cancelado | CA-3 e RN-01 |
| SC-03 | Itens, valor do frete e total do pedido são os mesmos antes e depois do cancelamento | CA-3 e RN-02 |

## Métricas de tamanho

| Função de Transação | Papel | Tipo | ALR | DER | Complexidade | PF | Data |
|---|---|---|---|---|---|---|---|
| Cancelar Pedido | principal | — | — | — | — | — | — |

A contagem está pendente e deve nascer da análise desta funcionalidade via CT, com memória de cálculo.

## Origem

| Ticket (AIMM) | Tipo | Critérios cobertos |
|---|---|---|
| [`STRY0013190`](../../../analise-impacto/AIMM-STRY0013190.md) | Criação | `CA-3` — cancelamento só de pedido confirmado, com o motivo obrigatório |

## Changelog

| Data | Autor | Tipo | Descrição |
|---|---|---|---|
| 2026-10-18 | Claude | N3 criado | Cancelamento de pedido confirmado pelo atendimento a partir do ticket fictício STRY0013190, com motivo obrigatório e registro de quem cancelou; gates sem aprovação e contagem pendente. |
| 2026-10-18 | Claude | Ajuste | Seções reordenadas: a Superfície vai para antes da seção Comportamento de tela e a Origem vai para antes da seção Changelog. Nenhuma regra, cenário ou campo muda. |
| 2026-10-20 | Docqui Caixa | Terminologia | Adoção de AIMM; histórico e chave preservados. |
| 2026-10-21 | Docqui Caixa | Terminologia | Níveis em português: Domínio, Agrupamento Funcional e Funcionalidade; histórico preservado. |
