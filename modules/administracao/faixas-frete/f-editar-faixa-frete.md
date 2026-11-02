<!-- docqui: 7.0.0 | prompt: MIGRA_NIVEIS | atualizado: 2026-10-21 -->
---
id: ADM-FRT-03
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

# Editar Faixa de Frete
> **Nível 3** - Agrupamento Funcional: Faixas de Frete — Domínio: Administração - `ADM-FRT-03`

## Descrição

Permite que o administrador altere o intervalo de CEP e o valor do frete de uma faixa, com a alteração valendo para os próximos cálculos de frete e os pedidos já feitos mantendo o frete cobrado.

Na Pesquisa de Faixas de Frete, o administrador aciona a ação de editar na linha da faixa, muda o CEP inicial, o CEP final ou o valor do frete e aciona **Salvar**; a região aparece sem edição.

## Regras de negócio

- **RN-01** — A região da faixa não muda depois do cadastro.
- **RN-02** — O CEP inicial é menor ou igual ao CEP final.
- **RN-03** — A faixa não tem CEP em comum com outra faixa; o intervalo anterior da própria faixa não conta.
- **RN-04** — O valor do frete é maior que zero. → ver FIELD-DICTIONARY: Valor monetário
- **RN-05** — O CEP inicial e o CEP final têm oito dígitos numéricos. → ver FIELD-DICTIONARY: CEP
- **RN-06** — A alteração vale para os próximos cálculos de frete; os pedidos já feitos mantêm o valor do frete registrado neles.

## Cenários

```gherkin
Feature: Editar Faixa de Frete

  Background:
    Given que o administrador abriu a edição de uma faixa a partir da Pesquisa de Faixas de Frete
    And que a Tabela de Frete tem as cinco faixas da demonstração

  # Caminho feliz
  @RN-06
  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Valor alterado sem mudar o frete dos pedidos já feitos
    Given que a faixa "Campinas" vai de 13000000 a 13139999 com frete de R$ 32,90
    And que o pedido 1005 foi confirmado com frete de R$ 32,90 pela faixa "Campinas"
    When o administrador muda o valor do frete para "34,90"
    And aciona "Salvar"
    Then o sistema exibe "Registro salvo com sucesso."
    And a faixa "Campinas" aparece na Pesquisa de Faixas de Frete com frete de R$ 34,90
    And o cálculo de frete do CEP "13050000" passa a resultar em R$ 34,90
    And o pedido 1005 continua com frete de R$ 32,90

  @RN-03
  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Intervalo ampliado sem CEP em comum com outra faixa
    Given que a faixa "Mooca — São Paulo" vai de 03100000 a 03199999
    When o administrador muda o CEP final para "03299999"
    And aciona "Salvar"
    Then o sistema exibe "Registro salvo com sucesso."
    And a faixa "Mooca — São Paulo" passa a ir de 03100000 a 03299999

  @RN-06
  # ← MESSAGE-DICTIONARY: ADM_FAIXA_VALE_PROXIMOS
  Scenario: Aviso sobre os pedidos já feitos
    When o administrador abre a edição da faixa "Campinas"
    Then o sistema exibe "A alteração vale para os próximos cálculos de frete; os pedidos já feitos mantêm o valor cobrado."

  @RN-01
  Scenario: Região sem edição
    When o administrador abre a edição da faixa "Campinas"
    Then a região "Campinas" aparece sem possibilidade de alteração
    And o CEP inicial, o CEP final e o valor do frete aparecem preenchidos e editáveis

  # Erros de validação
  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Campo obrigatório ausente
    When o administrador apaga o CEP final
    And aciona "Salvar"
    Then o sistema exibe abaixo do campo "Campo obrigatório."
    And não altera a faixa

  @RN-05
  # ← FIELD-DICTIONARY: CEP
  Scenario: CEP com menos de oito dígitos
    When o administrador muda o CEP inicial para "1300"
    And aciona "Salvar"
    Then o sistema exibe abaixo do campo "CEP inválido."
    And não altera a faixa

  @RN-04
  # ← FIELD-DICTIONARY: Valor monetário
  Scenario: Valor do frete igual a zero
    When o administrador muda o valor do frete para "0,00"
    And aciona "Salvar"
    Then o sistema exibe abaixo do campo "Informe um valor válido."
    And não altera a faixa

  @RN-02
  # ← MESSAGE-DICTIONARY: ADM_FAIXA_INTERVALO_INVALIDO
  Scenario: CEP final menor que o CEP inicial
    Given que a faixa "Campinas" vai de 13000000 a 13139999
    When o administrador muda o CEP final para "12999999"
    And aciona "Salvar"
    Then o sistema exibe "O CEP final deve ser igual ou maior que o CEP inicial."
    And não altera a faixa

  # Conflitos com dados existentes
  @RN-03
  # ← MESSAGE-DICTIONARY: ADM_FAIXA_SOBREPOSTA
  Scenario: Intervalo com CEPs em comum com outra faixa
    Given que a faixa "Mooca — São Paulo" vai de 03100000 a 03199999
    When o administrador muda o CEP final para "05450000"
    And aciona "Salvar"
    Then o sistema exibe "Esta faixa tem CEPs em comum com a faixa Pinheiros — São Paulo."
    And não altera a faixa

  # Restrições de acesso
  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Tentativa sem acesso à funcionalidade
    Given que a pessoa não tem acesso à funcionalidade
    When tenta editar uma faixa de frete
    Then o sistema exibe "Você não tem permissão para esta ação."
    And não altera a faixa

  # Estados especiais
  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Faixa excluída durante a edição
    Given que a faixa em edição foi excluída por outra pessoa
    When o administrador aciona "Salvar"
    Then o sistema exibe "Registro não encontrado."

  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Falha inesperada ao salvar
    When a alteração não pode ser concluída por falha inesperada
    Then o sistema exibe "Ocorreu um erro. Tente novamente."
    And não altera a faixa
```

## Campos

| Label PO | Entidade | Preenchimento | Edição | Tipo | Obrigatório | Validação |
|---|---|---|---|---|---|---|
| Região | TabelaFrete | exibido do cadastro | imutável | texto | sim | Não muda depois do cadastro |
| CEP inicial | TabelaFrete | entrada do usuário | editável | texto | sim | → ver FIELD-DICTIONARY: CEP; menor ou igual ao CEP final |
| CEP final | TabelaFrete | entrada do usuário | editável | texto | sim | → ver FIELD-DICTIONARY: CEP; maior ou igual ao CEP inicial |
| Valor do frete | TabelaFrete | entrada do usuário | editável | valor | sim | → ver FIELD-DICTIONARY: Valor monetário; maior que zero |

## Campos automáticos

| Label PO | Valor | Quando |
|---|---|---|
| — | Nenhum campo é preenchido automaticamente nesta funcionalidade | — |

## Superfície

**Tela própria** — rota: Editar Faixa de Frete (`/administracao/faixas-frete/:id/editar`), acessada da Pesquisa de Faixas de Frete.

**Fidelidade ao protótipo**: referência · `prototypes/administracao/faixas-frete/flow.html` · [abrir o protótipo ↗](../../../prototypes/administracao/faixas-frete/flow.html)

## Comportamento de tela

### Onde fica

Editar Faixa de Frete é uma tela própria, aberta pela ação de editar na linha da faixa, na Pesquisa de Faixas de Frete: o mesmo formulário do cadastro, já preenchido, com a região só para leitura, o aviso de que a alteração vale para os próximos cálculos de frete no topo e os botões **Salvar** e **Cancelar**. Ao salvar, o sistema volta à pesquisa com a faixa atualizada; **Cancelar** volta sem alterar.

### Estados da tela

| Estado | Comportamento |
|---|---|
| Inicial | Formulário preenchido com os dados da faixa, a região sem edição e o aviso "A alteração vale para os próximos cálculos de frete; os pedidos já feitos mantêm o valor cobrado." |
| Loading | Mostrar "Carregando…" e bloquear **Salvar** enquanto a alteração é concluída |
| Erro de validação | Mostrar a mensagem literal abaixo de cada campo inválido; nada é alterado |
| Conflito | Mostrar a mensagem do conflito (CEP em comum ou intervalo invertido) no topo do formulário; nada é alterado |
| Erro de servidor | Mostrar "Ocorreu um erro. Tente novamente." e manter os dados digitados |
| Registro inexistente | Mostrar "Registro não encontrado." quando a faixa foi excluída durante a edição |
| Sucesso | Mostrar "Registro salvo com sucesso." e voltar à Pesquisa de Faixas de Frete com a faixa atualizada |

## Critérios de sucesso

| # | Critério mensurável | Origem |
|---|---|---|
| SC-01 | Depois de alterar o valor da faixa, o próximo cálculo de frete de um CEP dela resulta no valor novo | CA-3 e RN-06 |
| SC-02 | Os pedidos já confirmados mantêm o frete registrado depois da alteração da faixa | CA-3 e RN-06 |
| SC-03 | Nenhuma alteração deixa duas faixas com CEP em comum | CA-3 e RN-03 |

## Métricas de tamanho

| Função de Transação | Papel | Tipo | ALR | DER | Complexidade | PF | Data |
|---|---|---|---|---|---|---|---|
| Editar Faixa de Frete | principal | — | — | — | — | — | — |

A contagem está pendente e deve nascer da análise desta funcionalidade via CT, com memória de cálculo.

## Origem

| Ticket (AIMM) | Tipo | Critérios cobertos |
|---|---|---|
| [`STRY0013200`](../../../analise-impacto/AIMM-STRY0013200.md) | Criação | `CA-3` — alteração do intervalo e do valor da faixa, valendo para os próximos cálculos e não para os pedidos já feitos |

## Changelog

| Data | Autor | Tipo | Descrição |
|---|---|---|---|
| 2026-10-18 | Claude | N3 criado | Edição de faixa de frete, derivada do cadastro pelo PROMPT CRUD a partir do ticket fictício STRY0013200, com a região imutável; gates sem aprovação e contagem pendente. |
| 2026-10-18 | Claude | Ajuste | Seções reordenadas: a Superfície vai para antes da seção Comportamento de tela e a Origem vai para antes da seção Changelog. Nenhuma regra, cenário ou campo muda. |
| 2026-10-20 | Docqui Caixa | Terminologia | Adoção de AIMM; histórico e chave preservados. |
| 2026-10-21 | Docqui Caixa | Terminologia | Níveis em português: Domínio, Agrupamento Funcional e Funcionalidade; histórico preservado. |
