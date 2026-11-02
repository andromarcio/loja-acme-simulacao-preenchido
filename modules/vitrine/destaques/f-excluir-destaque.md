<!-- docqui: 7.0.0 | prompt: MIGRA_NIVEIS | atualizado: 2026-10-21 -->
---
id: VIT-DST-04
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

# Excluir Destaque
> **Nível 3** - Agrupamento Funcional: Destaques — Domínio: Vitrine - `VIT-DST-04`

## Descrição

Permite que o gestor de catálogo exclua um destaque, que sai na hora da página inicial da loja e da pesquisa de destaques.

Na pesquisa de destaques, o gestor aciona excluir na linha do destaque e confirma na caixa de diálogo; se desistir, nada muda.

## Regras de negócio

- **RN-01** — A exclusão remove o destaque definitivamente.
- **RN-02** — Destaque excluído não aparece em VIT-NAV-01 — Listar Destaques, mesmo que estivesse vigente.
- **RN-03** — A exclusão do destaque não altera o produto.

## Cenários

```gherkin
Feature: Excluir Destaque

  Background:
    Given que o gestor de catálogo está na pesquisa de destaques
    And que hoje é 18/10/2026

  # Caminho feliz
  @RN-01
  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Destaque programado excluído
    When o gestor aciona excluir no destaque da "Ecobag ACME de lona"
    And confirma em "Deseja realmente excluir este registro?"
    Then o sistema exibe "Registro excluído com sucesso."
    And o destaque não aparece mais na pesquisa de destaques

  @RN-02 @RN-03
  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Destaque vigente excluído sai da página inicial
    Given que o destaque do "Boné ACME aba curva" está vigente
    When o gestor exclui esse destaque e confirma
    Then o sistema exibe "Registro excluído com sucesso."
    And o "Boné ACME aba curva" deixa de aparecer nos destaques da página inicial
    And o produto continua no catálogo, com o mesmo preço e a mesma quantidade em estoque

  # Restrições de acesso
  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Tentativa sem acesso à funcionalidade
    Given que a pessoa não tem acesso à funcionalidade
    When tenta excluir um destaque
    Then o sistema exibe "Você não tem permissão para esta ação."
    And o destaque continua na pesquisa

  # Estados especiais
  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Exclusão cancelada na confirmação
    When o gestor aciona excluir no destaque da "Ecobag ACME de lona"
    And desiste em "Deseja realmente excluir este registro?"
    Then o destaque continua na pesquisa

  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Destaque já excluído por outra pessoa
    Given que outra pessoa já excluiu o destaque da "Ecobag ACME de lona"
    When o gestor confirma a exclusão desse destaque
    Then o sistema exibe "Registro não encontrado."

  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Falha inesperada ao excluir
    When a exclusão não pode ser concluída por falha inesperada
    Then o sistema exibe "Ocorreu um erro. Tente novamente."
    And o destaque continua na pesquisa
```

## Campos

| Label PO | Entidade | Preenchimento | Edição | Tipo | Obrigatório | Validação |
|---|---|---|---|---|---|---|
| Produto | Produto | exibido do cadastro | somente leitura | seleção → Produto | não | Identifica o destaque na confirmação |
| Chamada | Destaque | exibido do cadastro | somente leitura | texto | não | Identifica o destaque na confirmação |

## Campos automáticos

| Label PO | Valor | Quando |
|---|---|---|
| — | Nenhum campo é preenchido automaticamente nesta funcionalidade | — |

## Superfície

**Ação em tela** — origem: Pesquisar Destaques (Pesquisa de Destaques, `/vitrine/destaques`).

**Fidelidade ao protótipo**: referência · `prototypes/vitrine/destaques/flow.html` · [abrir o protótipo ↗](../../../prototypes/vitrine/destaques/flow.html)

## Comportamento de tela

### Onde fica

Ícone excluir na linha da Pesquisa de Destaques (`/vitrine/destaques`). A caixa de diálogo mostra o produto e a chamada do destaque e pede a confirmação; não há tela própria.

### Estados da tela

| Estado | Comportamento |
|---|---|
| Inicial | Ícone excluir disponível em cada linha da pesquisa |
| Confirmação | Caixa de diálogo com "Deseja realmente excluir este registro?", o produto, a chamada e os botões **Cancelar** e **Excluir** |
| Loading | Mostrar "Carregando…" e bloquear **Excluir** enquanto exclui |
| Sucesso | Toast "Registro excluído com sucesso." e o destaque sai da lista |
| Erro de servidor | Mostrar "Ocorreu um erro. Tente novamente." e manter o destaque na lista |
| Registro não encontrado | Mostrar "Registro não encontrado." e atualizar a lista |
| Sem acesso | Mostrar "Você não tem permissão para esta ação." |

## Critérios de sucesso

| # | Critério mensurável | Origem |
|---|---|---|
| SC-01 | Todo destaque excluído deixa de aparecer na página inicial e na pesquisa de destaques | CA-4 e RN-02 |
| SC-02 | A exclusão de um destaque não muda nenhum dado do produto | RN-03 |

## Métricas de tamanho

| Função de Transação | Papel | Tipo | ALR | DER | Complexidade | PF | Data |
|---|---|---|---|---|---|---|---|
| Excluir Destaque | principal | — | — | — | — | — | — |

A contagem está pendente e deve nascer da análise desta funcionalidade via CT, com memória de cálculo.

## Origem

| Ticket (AIMM) | Tipo | Critérios cobertos |
|---|---|---|
| [`STRY0013180`](../../../analise-impacto/AIMM-STRY0013180.md) | Criação | `CA-4` — exclusão do destaque, que sai da página inicial |

## Changelog

| Data | Autor | Tipo | Descrição |
|---|---|---|---|
| 2026-10-18 | Claude | N3 criado | Exclusão definitiva de destaque do ticket fictício STRY0013180, sem vínculo a bloquear; o destaque sai da página inicial; gates sem aprovação e contagem pendente. |
| 2026-10-18 | Claude | Ajuste | Seções reordenadas: a Superfície vai para antes da seção Comportamento de tela e a Origem vai para antes da seção Changelog. Nenhuma regra, cenário ou campo muda. |
| 2026-10-20 | Docqui Caixa | Terminologia | Adoção de AIMM; histórico e chave preservados. |
| 2026-10-21 | Docqui Caixa | Terminologia | Níveis em português: Domínio, Agrupamento Funcional e Funcionalidade; histórico preservado. |
