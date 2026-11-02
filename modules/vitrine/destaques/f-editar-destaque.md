<!-- docqui: 7.0.0 | prompt: MIGRA_NIVEIS | atualizado: 2026-10-21 -->
---
id: VIT-DST-03
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

# Editar Destaque
> **Nível 3** - Agrupamento Funcional: Destaques — Domínio: Vitrine - `VIT-DST-03`

## Descrição

Permite que o gestor de catálogo altere a chamada, a ordem de exibição e a vigência de um destaque que ainda não terminou, sem trocar o produto em destaque.

Na pesquisa de destaques, o gestor aciona editar na linha do destaque, ajusta os campos liberados e aciona **Salvar**; o produto aparece só para leitura.

## Regras de negócio

- **RN-01** — O produto do destaque não muda depois do cadastro.
- **RN-02** — Destaque encerrado não é alterado.
- **RN-03** — O início da vigência de um destaque vigente não muda.
- **RN-04** — A data de início da vigência é igual ou anterior à data de fim. → ver RULES-DICTIONARY: RC-03 — Período de vigência (parâmetro: Início da vigência e Fim da vigência, inclusive)
- **RN-05** — O mesmo produto não tem dois destaques com vigências sobrepostas; o próprio destaque editado não conta.
- **RN-06** — A ordem de exibição é um número inteiro de 1 a 99.

## Cenários

```gherkin
Feature: Editar Destaque

  Background:
    Given que o gestor de catálogo está na edição de um destaque
    And que hoje é 18/10/2026

  # Caminho feliz
  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Chamada alterada
    Given que o destaque da "Camiseta ACME algodão — tamanho M" está vigente
    When o gestor muda a chamada para "Algodão que dura"
    And aciona "Salvar"
    Then o sistema exibe "Registro salvo com sucesso."
    And a nova chamada aparece nos destaques da página inicial

  @RN-04 @RN-05
  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Fim da vigência adiado
    Given que o destaque da "Garrafa térmica ACME 500 ml" vai de 01/10/2026 a 31/10/2026
    And que a Garrafa não tem outro destaque
    When o gestor muda o fim da vigência para 05/11/2026
    And aciona "Salvar"
    Then o sistema exibe "Registro salvo com sucesso."
    And o destaque fica vigente até 05/11/2026

  @RN-01
  Scenario: Produto somente para leitura
    When o gestor abre a edição do destaque da "Garrafa térmica ACME 500 ml"
    Then o produto aparece só para leitura
    And não há como escolher outro produto

  @RN-03
  Scenario: Início de destaque vigente somente para leitura
    Given que o destaque da "Camiseta ACME algodão — tamanho M" está vigente desde 10/10/2026
    When o gestor abre a edição desse destaque
    Then o início da vigência aparece só para leitura

  # Erros de validação
  @RN-04
  # ← RULES-DICTIONARY: RC-03 — Período de vigência
  Scenario: Fim da vigência anterior ao início
    Given que o destaque da "Ecobag ACME de lona" está programado de 20/11/2026 a 30/11/2026
    When o gestor muda o fim da vigência para 15/11/2026
    And aciona "Salvar"
    Then o sistema exibe abaixo do campo "A data final não pode ser anterior à data inicial."
    And o destaque não é alterado

  # ← FIELD-DICTIONARY: Data futura
  Scenario: Fim da vigência anterior a hoje
    Given que o destaque da "Camiseta ACME algodão — tamanho M" está vigente
    When o gestor muda o fim da vigência para 17/10/2026
    And aciona "Salvar"
    Then o sistema exibe abaixo do campo "Informe uma data igual ou posterior a hoje."

  @RN-06
  # ← MESSAGE-DICTIONARY: VIT_ORDEM_INVALIDA
  Scenario: Ordem de exibição fora de 1 a 99
    When o gestor informa a ordem de exibição 100
    And aciona "Salvar"
    Then o sistema exibe abaixo do campo "Informe uma ordem de 1 a 99."

  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Chamada vazia
    When o gestor apaga a chamada
    And aciona "Salvar"
    Then o sistema exibe abaixo do campo "Campo obrigatório."

  # Conflitos com dados existentes
  @RN-05
  # ← MESSAGE-DICTIONARY: VIT_DESTAQUE_SOBREPOSTO
  Scenario: Vigência que passa a se sobrepor a outro destaque do mesmo produto
    Given que a "Garrafa térmica ACME 500 ml" também tem um destaque programado de 01/11/2026 a 30/11/2026
    When o gestor muda o fim do destaque vigente da Garrafa para 05/11/2026
    And aciona "Salvar"
    Then o sistema exibe "Este produto já tem um destaque nesse período."
    And o destaque não é alterado

  # Restrições de acesso
  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Tentativa sem acesso à funcionalidade
    Given que a pessoa não tem acesso à funcionalidade
    When tenta editar um destaque
    Then o sistema exibe "Você não tem permissão para esta ação."
    And o destaque não é alterado

  # Estados especiais
  @RN-02
  # ← MESSAGE-DICTIONARY: VIT_DESTAQUE_ENCERRADO
  Scenario: Tentativa de alterar destaque encerrado
    Given que o destaque da "Caneca de cerâmica ACME 300 ml" terminou em 15/10/2026
    When o gestor tenta editá-lo
    Then o sistema exibe "Destaque encerrado não pode ser alterado."
    And o destaque não é alterado

  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Destaque excluído durante a edição
    Given que outra pessoa excluiu o destaque enquanto ele estava aberto
    When o gestor aciona "Salvar"
    Then o sistema exibe "Registro não encontrado."

  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Falha inesperada ao salvar
    When a alteração não pode ser concluída por falha inesperada
    Then o sistema exibe "Ocorreu um erro. Tente novamente."
    And o destaque não é alterado
```

## Campos

| Label PO | Entidade | Preenchimento | Edição | Tipo | Obrigatório | Validação |
|---|---|---|---|---|---|---|
| Produto | Produto | exibido do cadastro | imutável | seleção → Produto | sim | Mostrado só para leitura |
| Chamada | Destaque | entrada do usuário | editável | texto | sim | Até 60 caracteres |
| Ordem de exibição | Destaque | entrada do usuário | editável | número | sim | Inteiro de 1 a 99; o menor aparece primeiro |
| Início da vigência | Destaque | entrada do usuário | editável enquanto programado | data | sim | → ver FIELD-DICTIONARY: Data futura; somente leitura quando o destaque está vigente |
| Fim da vigência | Destaque | entrada do usuário | editável | data | sim | Igual ou posterior ao Início da vigência; → ver FIELD-DICTIONARY: Data futura |
| Situação | derivado ↓ | calculado | somente leitura | lista (Programado, Vigente) | automático | Mostrada para o gestor saber o que pode alterar |

## Derivações

| Campo derivado | Fórmula (Label PO) | Campos-fonte (Entidade) |
|---|---|---|
| Situação | Programado quando hoje é anterior ao Início da vigência; Vigente quando hoje está entre o Início e o Fim da vigência, inclusive; Encerrado quando hoje é posterior ao Fim da vigência | Início da vigência (Destaque), Fim da vigência (Destaque) |

## Campos automáticos

| Label PO | Valor | Quando |
|---|---|---|
| — | Nenhum campo é preenchido automaticamente nesta funcionalidade | — |

## Superfície

**Tela própria** — rota: Editar Destaque (`/vitrine/destaques/:id/editar`), acessada da Pesquisa de Destaques.

**Fidelidade ao protótipo**: referência · `prototypes/vitrine/destaques/flow.html` · [abrir o protótipo ↗](../../../prototypes/vitrine/destaques/flow.html)

## Comportamento de tela

### Onde fica

Página própria Editar Destaque (`/vitrine/destaques/:id/editar`), aberta pela ação editar na linha da Pesquisa de Destaques. É o formulário do cadastro, já preenchido: o produto aparece só para leitura e, no destaque vigente, o início da vigência também. A situação atual aparece no topo do formulário, e o destaque encerrado não abre para edição. **Salvar** grava e volta à pesquisa; **Cancelar** volta sem gravar.

### Estados da tela

| Estado | Comportamento |
|---|---|
| Inicial | Formulário preenchido com os dados do destaque; produto só para leitura |
| Destaque vigente | Início da vigência só para leitura; chamada, ordem e fim liberados |
| Destaque encerrado | Mostrar "Destaque encerrado não pode ser alterado." sem abrir o formulário |
| Loading | Mostrar "Carregando…" e bloquear **Salvar** enquanto grava |
| Erro de validação | Mostrar a mensagem literal abaixo do campo; o destaque não é alterado |
| Erro de servidor | Mostrar "Ocorreu um erro. Tente novamente." e manter os dados digitados |
| Sucesso | Toast "Registro salvo com sucesso." e volta à pesquisa |
| Registro não encontrado | Mostrar "Registro não encontrado." e voltar à pesquisa |
| Sem acesso | Mostrar "Você não tem permissão para esta ação." sem exibir o formulário |

## Critérios de sucesso

| # | Critério mensurável | Origem |
|---|---|---|
| SC-01 | Nenhum destaque muda de produto depois do cadastro | CA-3 e RN-01 |
| SC-02 | Nenhum destaque encerrado tem os dados alterados | CA-3 e RN-02 |
| SC-03 | Nenhuma edição deixa o fim da vigência antes do início | CA-3 e RN-04 |

## Métricas de tamanho

| Função de Transação | Papel | Tipo | ALR | DER | Complexidade | PF | Data |
|---|---|---|---|---|---|---|---|
| Editar Destaque | principal | — | — | — | — | — | — |

A contagem está pendente e deve nascer da análise desta funcionalidade via CT, com memória de cálculo.

## Origem

| Ticket (AIMM) | Tipo | Critérios cobertos |
|---|---|---|
| [`STRY0013180`](../../../analise-impacto/AIMM-STRY0013180.md) | Criação | `CA-3` — alteração da chamada, da ordem e do período, sem trocar o produto; destaque encerrado não é alterado |

## Changelog

| Data | Autor | Tipo | Descrição |
|---|---|---|---|
| 2026-10-18 | Claude | N3 criado | Edição de destaque do ticket fictício STRY0013180, derivada do cadastro: produto imutável, encerrado bloqueado e início travado no destaque vigente; gates sem aprovação e contagem pendente. |
| 2026-10-18 | Claude | Ajuste | Seções reordenadas: a Superfície vai para antes da seção Comportamento de tela e a Origem vai para antes da seção Changelog. Nenhuma regra, cenário ou campo muda. |
| 2026-10-20 | Docqui Caixa | Terminologia | Adoção de AIMM; histórico e chave preservados. |
| 2026-10-21 | Docqui Caixa | Terminologia | Níveis em português: Domínio, Agrupamento Funcional e Funcionalidade; histórico preservado. |
