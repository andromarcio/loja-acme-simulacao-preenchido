<!-- docqui: 7.0.0 | prompt: MIGRA_NIVEIS | atualizado: 2026-10-21 -->
---
id: VND-CHK-01
agrupamento_funcional: VND-CHK
dominio: VND
entidade: Pedido
data_model_ref: data-models/vendas.md#pedido
endpoints: []
error_codes: []
depende_de: []
origem:
  tipo: servicenow
  chave: STRY0013101
estado: rascunho
gates:
  requisitos: { aprovado: false, por: "", em: "", pr: "" }
  modelo-dados: { aprovado: false, por: "", em: "", pr: "" }
  testes: { aprovado: false, por: "", em: "", pr: "" }
  codigo: { aprovado: false, por: "", em: "", pr: "" }
contagem:
  pendente: true
  revisada_em: ""
  revisada_ate: ""
---

# Calcular Frete
> **Nível 3** - Agrupamento Funcional: Checkout — Domínio: Vendas - `VND-CHK-01`

## Descrição

Permite que o cliente calcule o frete do pedido pelo CEP de entrega, conhecendo o valor antes de confirmar a compra.

No checkout com itens no carrinho, o cliente informa o CEP e aciona **Calcular**; o valor aparece ao lado do pedido.

## Regras de negócio

- **RN-01** — O frete é o valor da faixa da Tabela de Frete que contém o CEP de entrega.
- **RN-02** — Um CEP fora de todas as faixas da Tabela de Frete não é atendido.
- **RN-03** — O CEP de entrega tem oito dígitos numéricos. → ver FIELD-DICTIONARY: CEP

## Cenários

```gherkin
Feature: Calcular Frete

  Background:
    Given que o cliente está no checkout com itens no carrinho
    And que a Tabela de Frete atende de "01310000" a "01310999" por R$ 18,90

  # Caminho feliz
  @RN-01
  Scenario: Frete calculado pelo CEP atendido
    When o cliente informa o CEP "01310100"
    And aciona "Calcular"
    Then o sistema mostra "Frete: R$ 18,90"
    And o valor do frete do Pedido recebe R$ 18,90

  # Erros de validação
  @RN-03
  # ← FIELD-DICTIONARY: CEP
  Scenario: CEP com menos de oito dígitos
    When o cliente informa o CEP "0131"
    And aciona "Calcular"
    Then o sistema exibe abaixo do campo "CEP inválido."
    And não apresenta uma cotação válida

  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: CEP obrigatório ausente
    When o cliente deixa o CEP de entrega vazio
    And aciona "Calcular"
    Then o sistema exibe abaixo do campo "Campo obrigatório."

  # Conflitos com dados existentes
  @RN-02
  # ← MESSAGE-DICTIONARY: VND_CEP_NAO_ATENDIDO
  Scenario: CEP fora da área de entrega
    When o cliente informa o CEP "69900000"
    And aciona "Calcular"
    Then o sistema exibe "Ainda não entregamos neste CEP."
    And não apresenta uma cotação válida

  # Restrições de acesso
  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Tentativa sem acesso à funcionalidade
    Given que a pessoa não tem acesso à funcionalidade
    When tenta calcular o frete
    Then o sistema exibe "Você não tem permissão para esta ação."
    And não executa o cálculo

  # Estados especiais
  # ← MESSAGE-DICTIONARY: VND_CARRINHO_VAZIO
  Scenario: Carrinho sem itens
    Given que o carrinho está vazio
    When o cliente tenta calcular o frete
    Then o sistema exibe "Adicione itens ao carrinho para calcular o frete."

  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Falha inesperada durante o cálculo
    When o cálculo não pode ser concluído por falha inesperada
    Then o sistema exibe "Ocorreu um erro. Tente novamente."
    And não apresenta uma cotação válida
```

## Campos

| Label PO | Entidade | Preenchimento | Edição | Tipo | Obrigatório | Validação |
|---|---|---|---|---|---|---|
| CEP de entrega | Pedido | entrada do usuário | editável | texto | sim | → ver FIELD-DICTIONARY: CEP |
| Valor do frete | TabelaFrete | exibido do cadastro | somente leitura | valor | não | → ver FIELD-DICTIONARY: Valor monetário |

## Campos automáticos

| Label PO | Valor | Quando |
|---|---|---|
| Valor do frete | Valor da faixa atendida, registrado no Pedido | Ao concluir o cálculo com CEP atendido |
| Faixa de frete | Faixa da TabelaFrete que atende ao CEP, vinculada ao Pedido | Ao concluir o cálculo com CEP atendido |

## Superfície

**Ação em tela** — origem: Checkout (`/checkout`).

**Fidelidade ao protótipo**: referência · `prototypes/vendas/checkout/flow.html` · [abrir o protótipo ↗](../../../prototypes/vendas/checkout/flow.html)

## Comportamento de tela

### Onde fica

O campo **CEP de entrega** e o botão **Calcular** ficam na tela de Checkout, com o resultado ao lado do pedido. O CEP da massa didática é informado sem máscara.

### Estados da tela

| Estado | Comportamento |
|---|---|
| Inicial | CEP disponível para digitação; sem cotação válida |
| Loading | Mostrar "Carregando…" e evitar novo acionamento enquanto calcula |
| Erro de validação | Mostrar a mensagem literal junto ao campo; sem cotação válida |
| Erro de servidor | Mostrar "Ocorreu um erro. Tente novamente." |
| Sucesso | Mostrar "Frete: R$ 18,90" para a faixa didática e manter o CEP informado |
| Empty state | Mostrar "Adicione itens ao carrinho para calcular o frete." |
| CEP alterado | Retirar a cotação anterior até concluir um novo cálculo |

## Critérios de sucesso

| # | Critério mensurável | Origem |
|---|---|---|
| SC-01 | Todo CEP da faixa didática retorna R$ 18,90 | CA-1 e RN-01 |
| SC-02 | Um CEP com menos de oito dígitos não gera cotação válida | CA-2 e RN-03 |
| SC-03 | Um CEP fora da faixa didática não gera cotação válida | CA-3 e RN-02 |

## Métricas de tamanho

| Função de Transação | Papel | Tipo | ALR | DER | Complexidade | PF | Data |
|---|---|---|---|---|---|---|---|
| Calcular Frete | principal | — | — | — | — | — | — |

A contagem está pendente. Não foi deduzida do valor de PF mostrado no simulador; deve nascer da análise desta funcionalidade via CT, com memória de cálculo.

## Origem

| Ticket (AIMM) | Tipo | Critérios cobertos |
|---|---|---|
| [`STRY0013101`](../../../analise-impacto/AIMM-STRY0013101.md) | Criação | `CA-1, CA-2, CA-3` — valor do frete pelo CEP, CEP inválido e CEP fora da área |

## Changelog

| Data | Autor | Tipo | Descrição |
|---|---|---|---|
| 2026-10-14 | Copilot | N3 criado | Exemplo negocial do ticket fictício, regras e cenários preenchidos; gates sem aprovação e contagem pendente. |
| 2026-10-17 | Claude | Protótipo vinculado | A Superfície passa a apontar o protótipo de fluxo do Checkout (`prototypes/vendas/checkout/flow.html`), com fidelidade referência e em rascunho, sem aprovação. |
| 2026-10-17 | Claude | Ajuste | Saem `prioridade` e `mvp` do front-matter e a linha de Prioridade e MVP do cabeçalho: a priorização das features saiu do método no engine 6.4.4. Nenhuma regra, cenário ou campo muda. |
| 2026-10-18 | Claude | Ajuste | Seções reordenadas: a Superfície vai para antes da seção Comportamento de tela e a Origem vai para antes da seção Changelog. Nenhuma regra, cenário ou campo muda. |
| 2026-10-20 | Docqui Caixa | Terminologia | Adoção de AIMM; histórico e chave preservados. |
| 2026-10-21 | Docqui Caixa | Terminologia | Níveis em português: Domínio, Agrupamento Funcional e Funcionalidade; histórico preservado. |
