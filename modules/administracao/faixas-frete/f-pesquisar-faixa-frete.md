<!-- docqui: 7.0.0 | prompt: MIGRA_NIVEIS | atualizado: 2026-10-21 -->
---
id: ADM-FRT-01
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

# Pesquisar Faixas de Frete
> **Nível 3** - Agrupamento Funcional: Faixas de Frete — Domínio: Administração - `ADM-FRT-01`

## Descrição

Permite que o administrador e o atendente pesquisem as faixas de frete por parte da região ou por um CEP atendido, vendo o intervalo de CEP e o valor da entrega de cada faixa.

Na Pesquisa de Faixas de Frete, a pessoa informa parte da região, um CEP ou nenhum filtro e aciona **Pesquisar**; da lista, abre, edita ou exclui uma faixa, e pelo botão **Cadastrar faixa de frete** inclui uma nova.

## Regras de negócio

- **RN-01** — A pesquisa por região encontra as faixas cuja região contém o termo informado, sem diferenciar maiúsculas, minúsculas e acentos.
- **RN-02** — A pesquisa por CEP atendido encontra a faixa cujo intervalo contém o CEP, com o CEP inicial e o CEP final inclusive.
- **RN-03** — A pesquisa que não informa região nem CEP traz todas as faixas de frete, em ordem crescente de CEP inicial.
- **RN-04** — O CEP atendido tem oito dígitos numéricos. → ver FIELD-DICTIONARY: CEP

## Cenários

```gherkin
Feature: Pesquisar Faixas de Frete

  Background:
    Given que a pessoa está na Pesquisa de Faixas de Frete
    And que a Tabela de Frete tem as faixas "Centro — São Paulo" (01310000 a 01310999, R$ 18,90), "Mooca — São Paulo" (03100000 a 03199999, R$ 22,50), "Pinheiros — São Paulo" (05400000 a 05499999, R$ 21,00), "Campinas" (13000000 a 13139999, R$ 32,90) e "Rio de Janeiro — Centro" (20000000 a 20099999, R$ 39,90)

  # Caminho feliz
  @RN-03
  Scenario: Lista inicial sem filtro
    When a pessoa abre a Pesquisa de Faixas de Frete sem informar filtro
    Then o sistema lista as cinco faixas, na ordem "Centro — São Paulo", "Mooca — São Paulo", "Pinheiros — São Paulo", "Campinas" e "Rio de Janeiro — Centro"
    And cada linha mostra a região, o CEP inicial, o CEP final e o valor do frete

  @RN-01
  Scenario: Faixas encontradas por parte da região
    When a pessoa informa a região "sao paulo"
    And aciona "Pesquisar"
    Then o sistema lista "Centro — São Paulo", "Mooca — São Paulo" e "Pinheiros — São Paulo"

  @RN-02
  Scenario: Faixa encontrada pelo CEP atendido
    When a pessoa informa o CEP atendido "01310100"
    And aciona "Pesquisar"
    Then o sistema lista somente "Centro — São Paulo", de 01310000 a 01310999, com frete de R$ 18,90

  @RN-02
  Scenario: CEP igual ao limite final de uma faixa
    When a pessoa informa o CEP atendido "13139999"
    And aciona "Pesquisar"
    Then o sistema lista somente "Campinas"

  # Erros de validação
  @RN-04
  # ← FIELD-DICTIONARY: CEP
  Scenario: CEP atendido com menos de oito dígitos
    When a pessoa informa o CEP atendido "0131"
    And aciona "Pesquisar"
    Then o sistema exibe abaixo do campo "CEP inválido."
    And mantém a lista anterior

  # Restrições de acesso
  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Tentativa sem acesso à funcionalidade
    Given que a pessoa não tem acesso à funcionalidade
    When tenta pesquisar as faixas de frete
    Then o sistema exibe "Você não tem permissão para esta ação."
    And não mostra as faixas

  # Estados especiais
  @RN-02
  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: CEP que nenhuma faixa atende
    When a pessoa informa o CEP atendido "69900000"
    And aciona "Pesquisar"
    Then o sistema exibe "Nenhum resultado para a busca."

  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Nenhuma faixa cadastrada
    Given que todas as faixas de frete foram excluídas
    When a pessoa abre a Pesquisa de Faixas de Frete
    Then o sistema exibe "Nenhum registro encontrado."

  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Falha inesperada ao carregar a lista
    When a lista não pode ser carregada por falha inesperada
    Then o sistema exibe "Não foi possível carregar os dados."
```

## Campos

| Label PO | Entidade | Preenchimento | Edição | Tipo | Obrigatório | Validação |
|---|---|---|---|---|---|---|
| Região (filtro) | TabelaFrete | entrada do usuário | editável | texto | não | Parte da região; sem diferenciar maiúsculas, minúsculas e acentos |
| CEP atendido (filtro) | TabelaFrete | entrada do usuário | editável | texto | não | → ver FIELD-DICTIONARY: CEP; comparado ao intervalo de cada faixa, limites inclusive |

## Colunas do resultado

| Coluna (Label PO) | Origem | Ordenação |
|---|---|---|
| Região | cadastro | ordenável |
| CEP inicial | cadastro | padrão ↑ |
| CEP final | cadastro | — |
| Valor do frete | cadastro | ordenável |

## Campos automáticos

| Label PO | Valor | Quando |
|---|---|---|
| — | Nenhum campo é preenchido automaticamente nesta funcionalidade | — |

## Superfície

**Tela própria** — rota: Pesquisa de Faixas de Frete (`/administracao/faixas-frete`).

**Fidelidade ao protótipo**: referência · `prototypes/administracao/faixas-frete/flow.html` · [abrir o protótipo ↗](../../../prototypes/administracao/faixas-frete/flow.html)

## Comportamento de tela

### Onde fica

A Pesquisa de Faixas de Frete é a tela de entrada das faixas de frete, na Administração: um card de filtros com **Região** e **CEP atendido** e os botões **Pesquisar** e **Limpar** e, abaixo, a lista com o botão **Cadastrar faixa de frete** e, em cada linha, as ações de visualizar, editar e excluir, que levam a ADM-FRT-05 — Visualizar Faixa de Frete, ADM-FRT-03 — Editar Faixa de Frete e ADM-FRT-04 — Excluir Faixa de Frete. As ações que o perfil não tem na matriz do N2 não aparecem. O CEP é informado sem máscara, como no restante da demonstração.

### Estados da tela

| Estado | Comportamento |
|---|---|
| Inicial | Filtros vazios e a lista com todas as faixas, em ordem crescente de CEP inicial |
| Loading | Mostrar "Carregando…" no lugar da lista e bloquear **Pesquisar** até a resposta |
| Erro de validação | Mostrar "CEP inválido." abaixo do campo CEP atendido e manter a lista anterior |
| Erro de servidor | Mostrar "Não foi possível carregar os dados." no lugar da lista |
| Sucesso | Mostrar as faixas encontradas e a quantidade de registros |
| Empty state | Mostrar "Nenhum registro encontrado." quando não há faixas e "Nenhum resultado para a busca." quando os filtros não encontram faixa |

## Critérios de sucesso

| # | Critério mensurável | Origem |
|---|---|---|
| SC-01 | O CEP 01310100 retorna somente a faixa Centro — São Paulo | CA-1 e RN-02 |
| SC-02 | A região "sao paulo" retorna as três faixas de São Paulo da massa da demonstração | CA-1 e RN-01 |
| SC-03 | Sem filtro, as cinco faixas aparecem em ordem crescente de CEP inicial | CA-1 e RN-03 |

## Métricas de tamanho

| Função de Transação | Papel | Tipo | ALR | DER | Complexidade | PF | Data |
|---|---|---|---|---|---|---|---|
| Pesquisar Faixas de Frete | principal | — | — | — | — | — | — |

A contagem está pendente e deve nascer da análise desta funcionalidade via CT, com memória de cálculo.

## Origem

| Ticket (AIMM) | Tipo | Critérios cobertos |
|---|---|---|
| [`STRY0013200`](../../../analise-impacto/AIMM-STRY0013200.md) | Criação | `CA-1` — pesquisa das faixas por região ou por um CEP que elas atendem |

## Changelog

| Data | Autor | Tipo | Descrição |
|---|---|---|---|
| 2026-10-18 | Claude | N3 criado | Pesquisa das faixas de frete por região e por CEP atendido, derivada do cadastro pelo PROMPT CRUD a partir do ticket fictício STRY0013200; gates sem aprovação e contagem pendente. |
| 2026-10-18 | Claude | Ajuste | Seções reordenadas: a Superfície vai para antes da seção Comportamento de tela e a Origem vai para antes da seção Changelog. Nenhuma regra, cenário ou campo muda. |
| 2026-10-20 | Docqui Caixa | Terminologia | Adoção de AIMM; histórico e chave preservados. |
| 2026-10-21 | Docqui Caixa | Terminologia | Níveis em português: Domínio, Agrupamento Funcional e Funcionalidade; histórico preservado. |
