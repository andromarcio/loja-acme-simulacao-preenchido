<!-- docqui: 7.0.0 | prompt: MIGRA_NIVEIS | atualizado: 2026-10-21 -->
---
id: ADM-FRT-04
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

# Excluir Faixa de Frete
> **Nível 3** - Agrupamento Funcional: Faixas de Frete — Domínio: Administração - `ADM-FRT-04`

## Descrição

Permite que o administrador exclua definitivamente uma faixa de frete que não atende pedidos, e os CEPs dela deixam de ser atendidos no cálculo de frete.

Na Pesquisa de Faixas de Frete, o administrador aciona a ação de excluir na linha da faixa e confirma a exclusão na caixa de diálogo; a faixa que atende pedidos não é excluída.

## Regras de negócio

- **RN-01** — A exclusão remove a faixa de frete definitivamente.
- **RN-02** — Faixa de frete que atende algum pedido não pode ser excluída. → ver RULES-DICTIONARY: RC-09 — Registro vinculado não pode ser excluído (parâmetro: entidade vinculada Pedido; ação alternativa: editar a faixa em ADM-FRT-03 — Editar Faixa de Frete)
- **RN-03** — Os CEPs de uma faixa excluída deixam de ser atendidos no cálculo de frete.

## Cenários

```gherkin
Feature: Excluir Faixa de Frete

  Background:
    Given que o administrador está na Pesquisa de Faixas de Frete
    And que a faixa "Centro — São Paulo" atende os pedidos 1001 e 1003
    And que a faixa "Rio de Janeiro — Centro" não atende nenhum pedido

  # Caminho feliz
  @RN-01 @RN-03
  # ← MESSAGE-DICTIONARY: BASELINE
  # ← MESSAGE-DICTIONARY: VND_CEP_NAO_ATENDIDO
  Scenario: Faixa sem pedidos excluída
    When o administrador aciona excluir na linha da faixa "Rio de Janeiro — Centro"
    Then o sistema pergunta "Deseja realmente excluir este registro?"
    When o administrador confirma a exclusão
    Then o sistema exibe "Registro excluído com sucesso."
    And a faixa "Rio de Janeiro — Centro" sai da Pesquisa de Faixas de Frete
    And o cálculo de frete do CEP "20040000" passa a resultar em "Ainda não entregamos neste CEP."

  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Exclusão cancelada na confirmação
    When o administrador aciona excluir na linha da faixa "Rio de Janeiro — Centro"
    And o sistema pergunta "Deseja realmente excluir este registro?"
    And o administrador aciona "Cancelar"
    Then a faixa "Rio de Janeiro — Centro" continua na Pesquisa de Faixas de Frete

  # Conflitos com dados existentes
  @RN-02
  # ← RULES-DICTIONARY: RC-09 — Registro vinculado não pode ser excluído
  # ← MESSAGE-DICTIONARY: ADM_FAIXA_COM_PEDIDOS
  Scenario: Faixa que atende pedidos
    When o administrador aciona excluir na linha da faixa "Centro — São Paulo"
    Then o sistema exibe "Não é possível excluir: existem pedidos vinculados a este registro."
    And não oferece a confirmação da exclusão
    And a faixa "Centro — São Paulo" continua na Pesquisa de Faixas de Frete

  # Restrições de acesso
  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Tentativa sem acesso à funcionalidade
    Given que a pessoa não tem acesso à funcionalidade
    When tenta excluir uma faixa de frete
    Then o sistema exibe "Você não tem permissão para esta ação."
    And não exclui a faixa

  # Estados especiais
  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Faixa já excluída por outra pessoa
    Given que a faixa "Rio de Janeiro — Centro" foi excluída por outra pessoa depois de a lista ser carregada
    When o administrador confirma a exclusão dessa faixa
    Then o sistema exibe "Registro não encontrado."

  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Falha inesperada ao excluir
    When a exclusão não pode ser concluída por falha inesperada
    Then o sistema exibe "Ocorreu um erro. Tente novamente."
    And a faixa continua na Pesquisa de Faixas de Frete
```

## Campos

| Label PO | Entidade | Preenchimento | Edição | Tipo | Obrigatório | Validação |
|---|---|---|---|---|---|---|
| Região | TabelaFrete | exibido do cadastro | somente leitura | texto | não | Identifica a faixa na confirmação |

## Campos automáticos

| Label PO | Valor | Quando |
|---|---|---|
| — | Nenhum campo é preenchido automaticamente nesta funcionalidade | — |

## Dados lidos e gravados

| Entidade | Papel | Por que a funcionalidade a toca |
|---|---|---|
| Pedido | lê | Verificar se algum pedido usa a faixa antes de excluí-la (RN-02) |

## Superfície

**Ação em tela** — origem: Pesquisar Faixas de Frete (Pesquisa de Faixas de Frete, `/administracao/faixas-frete`).

**Fidelidade ao protótipo**: referência · `prototypes/administracao/faixas-frete/flow.html` · [abrir o protótipo ↗](../../../prototypes/administracao/faixas-frete/flow.html)

## Comportamento de tela

### Onde fica

A exclusão é uma ação na linha da faixa, na Pesquisa de Faixas de Frete, sem tela própria. Para a faixa sem pedidos, o ícone de excluir abre a caixa de diálogo de confirmação com a região da faixa e os botões **Cancelar** e **Excluir**; para a faixa que atende pedidos, abre no lugar uma caixa de bloqueio, sem o botão **Excluir**, só com **Ok, entendi**.

### Estados da tela

| Estado | Comportamento |
|---|---|
| Inicial | Lista de faixas com a ação de excluir em cada linha |
| Confirmação | Caixa de diálogo "Deseja realmente excluir este registro?" com a região da faixa |
| Loading | Mostrar "Carregando…" e bloquear **Excluir** enquanto a exclusão é concluída |
| Bloqueio por vínculo | Caixa de diálogo com "Não é possível excluir: existem pedidos vinculados a este registro.", sem o botão **Excluir** |
| Erro de servidor | Mostrar "Ocorreu um erro. Tente novamente." e manter a faixa na lista |
| Registro inexistente | Mostrar "Registro não encontrado." e atualizar a lista |
| Sucesso | Mostrar "Registro excluído com sucesso." e retirar a faixa da lista |

## Critérios de sucesso

| # | Critério mensurável | Origem |
|---|---|---|
| SC-01 | Uma faixa sem pedidos é excluída e sai da pesquisa | CA-4 e RN-01 |
| SC-02 | Nenhuma faixa que atende pedidos é excluída | CA-4 e RN-02 |
| SC-03 | Depois da exclusão, os CEPs da faixa resultam em "Ainda não entregamos neste CEP." no cálculo de frete | CA-4 e RN-03 |

## Métricas de tamanho

| Função de Transação | Papel | Tipo | ALR | DER | Complexidade | PF | Data |
|---|---|---|---|---|---|---|---|
| Excluir Faixa de Frete | principal | — | — | — | — | — | — |

A contagem está pendente e deve nascer da análise desta funcionalidade via CT, com memória de cálculo.

## Origem

| Ticket (AIMM) | Tipo | Critérios cobertos |
|---|---|---|
| [`STRY0013200`](../../../analise-impacto/AIMM-STRY0013200.md) | Criação | `CA-4` — exclusão da faixa de frete, bloqueada quando a faixa é usada em pedidos |

## Changelog

| Data | Autor | Tipo | Descrição |
|---|---|---|---|
| 2026-10-18 | Claude | N3 criado | Exclusão definitiva de faixa de frete, derivada do cadastro pelo PROMPT CRUD a partir do ticket fictício STRY0013200, com bloqueio pela RC-09 quando a faixa atende pedidos; gates sem aprovação e contagem pendente. |
| 2026-10-18 | Claude | Ajuste | Seções reordenadas: a Superfície vai para antes da seção Comportamento de tela e a Origem vai para antes da seção Changelog. Nenhuma regra, cenário ou campo muda. |
| 2026-10-20 | Docqui Caixa | Terminologia | Adoção de AIMM; histórico e chave preservados. |
| 2026-10-21 | Docqui Caixa | Terminologia | Níveis em português: Domínio, Agrupamento Funcional e Funcionalidade; histórico preservado. |
