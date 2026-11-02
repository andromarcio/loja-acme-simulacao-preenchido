<!-- docqui: 7.0.0 | prompt: MIGRA_NIVEIS | atualizado: 2026-10-21 -->
---
id: VIT-DST-01
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

# Pesquisar Destaques
> **Nível 3** - Agrupamento Funcional: Destaques — Domínio: Vitrine - `VIT-DST-01`

## Descrição

Permite que o gestor de catálogo encontre os destaques da página inicial pelo produto e pela situação, vendo de relance o que está no ar, o que vai entrar e o que já saiu.

Na tela Pesquisa de Destaques, o gestor informa parte do nome do produto, escolhe a situação — programado, vigente ou encerrado — e aciona **Pesquisar**; da lista, cadastra, visualiza, edita ou exclui um destaque.

## Regras de negócio

- **RN-01** — A situação do destaque é derivada da vigência e da data de hoje: programado antes do início, vigente do início ao fim, inclusive, e encerrado depois do fim. → ver RULES-DICTIONARY: RC-03 — Período de vigência (parâmetro: Início da vigência e Fim da vigência, inclusive)
- **RN-02** — A busca por produto encontra os destaques cujo nome do produto contém o termo, sem diferenciar maiúsculas, minúsculas e acentos.

## Cenários

```gherkin
Feature: Pesquisar Destaques

  Background:
    Given que o gestor de catálogo está na pesquisa de destaques
    And que hoje é 18/10/2026
    And que existem os cinco destaques da massa da demonstração

  # Caminho feliz
  Scenario: Lista inicial sem filtro
    When o gestor abre a pesquisa de destaques
    Then o sistema lista os cinco destaques, do início de vigência mais recente para o mais antigo
    And o destaque da "Ecobag ACME de lona", com início em 20/11/2026, aparece primeiro

  @RN-01
  Scenario: Destaques vigentes
    When o gestor escolhe a situação "Vigente"
    And aciona "Pesquisar"
    Then o sistema lista os destaques de "Garrafa térmica ACME 500 ml", "Camiseta ACME algodão — tamanho M" e "Boné ACME aba curva"

  @RN-01
  Scenario: Destaque encerrado
    When o gestor escolhe a situação "Encerrado"
    And aciona "Pesquisar"
    Then o sistema lista apenas o destaque da "Caneca de cerâmica ACME 300 ml"

  @RN-01
  Scenario: Destaque programado
    When o gestor escolhe a situação "Programado"
    And aciona "Pesquisar"
    Then o sistema lista apenas o destaque da "Ecobag ACME de lona"

  @RN-01
  Scenario: Último dia da vigência ainda é vigente
    Given que hoje é 31/10/2026
    When o gestor escolhe a situação "Vigente"
    And aciona "Pesquisar"
    Then o destaque da "Garrafa térmica ACME 500 ml" aparece com a situação "Vigente"

  @RN-02
  Scenario: Busca por parte do nome do produto
    When o gestor informa "GARRAFA" no filtro Produto
    And aciona "Pesquisar"
    Then o sistema lista apenas o destaque da "Garrafa térmica ACME 500 ml"

  # Restrições de acesso
  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Tentativa sem acesso à funcionalidade
    Given que a pessoa não tem acesso à funcionalidade
    When tenta abrir a pesquisa de destaques
    Then o sistema exibe "Você não tem permissão para esta ação."
    And não mostra a lista

  # Estados especiais
  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Busca sem resultado
    When o gestor informa "relógio" no filtro Produto
    And aciona "Pesquisar"
    Then o sistema exibe "Nenhum resultado para a busca."

  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Nenhum destaque cadastrado
    Given que não há destaques cadastrados
    When o gestor abre a pesquisa de destaques
    Then o sistema exibe "Nenhum registro encontrado."

  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Falha ao carregar a lista
    When a lista não pode ser carregada por falha inesperada
    Then o sistema exibe "Não foi possível carregar os dados."
```

## Campos

| Label PO | Entidade | Preenchimento | Edição | Tipo | Obrigatório | Validação |
|---|---|---|---|---|---|---|
| Produto (filtro) | Produto | entrada do usuário | editável | texto | não | Parte do nome do produto |
| Situação (filtro) | dado de código | entrada do usuário | editável | lista (Todas, Programado, Vigente, Encerrado) | não | Padrão: Todas |

## Derivações

| Campo derivado | Fórmula (Label PO) | Campos-fonte (Entidade) |
|---|---|---|
| Situação | Programado quando hoje é anterior ao Início da vigência; Vigente quando hoje está entre o Início e o Fim da vigência, inclusive; Encerrado quando hoje é posterior ao Fim da vigência | Início da vigência (Destaque), Fim da vigência (Destaque) |

## Colunas do resultado

| Coluna (Label PO) | Origem | Ordenação |
|---|---|---|
| Produto | entidade relacionada (Produto) | ordenável |
| Chamada | cadastro | — |
| Ordem de exibição | cadastro | ordenável |
| Início da vigência | cadastro | padrão ↓ |
| Fim da vigência | cadastro | ordenável |
| Situação | derivado | — |

## Campos automáticos

| Label PO | Valor | Quando |
|---|---|---|
| — | Nenhum campo é preenchido automaticamente nesta funcionalidade | — |

## Superfície

**Tela própria** — rota: Pesquisa de Destaques (`/vitrine/destaques`).

**Fidelidade ao protótipo**: referência · `prototypes/vitrine/destaques/flow.html` · [abrir o protótipo ↗](../../../prototypes/vitrine/destaques/flow.html)

## Comportamento de tela

### Onde fica

Página própria Pesquisa de Destaques (`/vitrine/destaques`), no menu Vitrine › Destaques. No topo ficam os filtros Produto e Situação e o botão **Pesquisar**; acima da lista, o botão **Cadastrar destaque** leva a VIT-DST-02 — Cadastrar Destaque. Cada linha tem as ações visualizar (VIT-DST-05 — Visualizar Destaque), editar (VIT-DST-03 — Editar Destaque) e excluir (VIT-DST-04 — Excluir Destaque), e a situação aparece como etiqueta.

### Estados da tela

| Estado | Comportamento |
|---|---|
| Inicial | Filtros vazios e a lista com todos os destaques, do início de vigência mais recente para o mais antigo |
| Loading | Mostrar "Carregando…" no lugar da lista |
| Erro de servidor | Mostrar "Não foi possível carregar os dados." |
| Sucesso | Lista filtrada, com a quantidade de registros encontrados |
| Empty state | Mostrar "Nenhum registro encontrado." quando não há destaque cadastrado |
| Busca sem resultado | Mostrar "Nenhum resultado para a busca." |
| Sem acesso | Mostrar "Você não tem permissão para esta ação." sem a lista |

## Critérios de sucesso

| # | Critério mensurável | Origem |
|---|---|---|
| SC-01 | Todo destaque aparece com a situação que corresponde à data de hoje e às datas de vigência | CA-1 e RN-01 |
| SC-02 | A busca por parte do nome do produto devolve todos os destaques desse produto, e só eles | CA-1 e RN-02 |

## Métricas de tamanho

| Função de Transação | Papel | Tipo | ALR | DER | Complexidade | PF | Data |
|---|---|---|---|---|---|---|---|
| Pesquisar Destaques | principal | — | — | — | — | — | — |

A contagem está pendente e deve nascer da análise desta funcionalidade via CT, com memória de cálculo.

## Origem

| Ticket (AIMM) | Tipo | Critérios cobertos |
|---|---|---|
| [`STRY0013180`](../../../analise-impacto/AIMM-STRY0013180.md) | Criação | `CA-1` — pesquisa dos destaques por produto e por situação (programado, vigente ou encerrado) |

## Changelog

| Data | Autor | Tipo | Descrição |
|---|---|---|---|
| 2026-10-18 | Claude | N3 criado | Pesquisa de destaques do ticket fictício STRY0013180, derivada do cadastro, com a situação derivada da vigência (RC-03); gates sem aprovação e contagem pendente. |
| 2026-10-18 | Claude | Ajuste | Seções reordenadas: a Superfície vai para antes da seção Comportamento de tela e a Origem vai para antes da seção Changelog. Nenhuma regra, cenário ou campo muda. |
| 2026-10-20 | Docqui Caixa | Terminologia | Adoção de AIMM; histórico e chave preservados. |
| 2026-10-21 | Docqui Caixa | Terminologia | Níveis em português: Domínio, Agrupamento Funcional e Funcionalidade; histórico preservado. |
