<!-- docqui: 7.0.0 | prompt: MIGRA_NIVEIS | atualizado: 2026-10-23 -->
---
id: CAT-CTG-04
agrupamento_funcional: CAT-CTG
dominio: CAT
entidade: Categoria
data_model_ref: data-models/catalogo.md#categoria
endpoints: []
error_codes: []
depende_de: []
origem:
  tipo: servicenow
  chave: STRY0013170
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

# Excluir Categoria
> **Nível 3** - Agrupamento Funcional: Categorias — Domínio: Catálogo - `CAT-CTG-04`

## Descrição

Permite que o gestor de catálogo exclua definitivamente uma categoria que não tem produtos nem subcategorias, tirando-a do catálogo.

Na Pesquisa de Categorias, o gestor aciona o ícone de excluir da linha e confirma a exclusão. Se a categoria tiver produtos ou subcategorias, a exclusão não acontece. Para produtos, a alternativa é inativá-la em CAT-CTG-03 — Editar Categoria; para subcategorias, é preciso antes retirar ou trocar a superior delas, sem exclusão em cascata.

## Regras de negócio

- **RN-01** — A exclusão remove a categoria definitivamente do catálogo.
- **RN-02** — Categoria com produtos vinculados não pode ser excluída. → ver RULES-DICTIONARY: RC-09 — Registro vinculado não pode ser excluído (parâmetro: entidade vinculada Produto; ação alternativa: inativar a categoria em CAT-CTG-03 — Editar Categoria)
- **RN-03** — Categoria com subcategorias, ativas ou inativas, não pode ser excluída. → ver RULES-DICTIONARY: RC-09 — Registro vinculado não pode ser excluído (parâmetro: entidade vinculada Categoria; ação alternativa: retirar ou trocar a superior das subcategorias em CAT-CTG-03). Sem exclusão em cascata. Conferir os dois bloqueios também ao confirmar; se houver ambos, mostrar primeiro o bloqueio por subcategorias.

## Cenários

```gherkin
Feature: Excluir Categoria

  Background:
    Given que o gestor de catálogo está na Pesquisa de Categorias
    And que a categoria "Brinquedos" não tem produtos nem subcategorias
    And que a categoria "Cozinha" tem 2 produtos

  # Caminho feliz
  @RN-01
  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Categoria sem produtos nem subcategorias excluída
    When o gestor aciona excluir na linha "Brinquedos"
    Then o sistema pergunta "Deseja realmente excluir este registro?" mostrando a categoria "Brinquedos"
    When o gestor confirma
    Then o sistema exibe "Registro excluído com sucesso."
    And a categoria "Brinquedos" não aparece mais na Pesquisa de Categorias

  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Gestor desiste da exclusão
    When o gestor aciona excluir na linha "Brinquedos"
    And desiste na pergunta "Deseja realmente excluir este registro?"
    Then a categoria "Brinquedos" continua na Pesquisa de Categorias

  # Conflitos com dados existentes
  @RN-02
  # ← RULES-DICTIONARY: RC-09 — Registro vinculado não pode ser excluído
  # ← MESSAGE-DICTIONARY: CAT_CATEGORIA_COM_PRODUTOS
  Scenario: Categoria com produtos não é excluída
    When o gestor aciona excluir na linha "Cozinha"
    Then o sistema exibe "Não é possível excluir: existem produtos vinculados a este registro."
    And não oferece a opção de confirmar a exclusão
    And a categoria "Cozinha" continua na Pesquisa de Categorias com os seus 2 produtos

  @RN-03
  # ← RULES-DICTIONARY: RC-09 — Registro vinculado não pode ser excluído
  # ← MESSAGE-DICTIONARY: CAT_CATEGORIA_COM_SUBCATEGORIAS
  Scenario Outline: Categoria com subcategorias não é excluída
    Given que "Cozinha" tem a subcategoria "Canecas" na situação <situacao>
    And que "Cozinha" não tem produtos diretamente vinculados
    When o gestor aciona excluir na linha "Cozinha"
    Then o sistema abre a caixa com "Não é possível excluir: existem subcategorias vinculadas a este registro."
    And oferece somente "Ok, entendi", sem opção de confirmar a exclusão
    And mantém "Cozinha" e "Canecas" com o mesmo vínculo

    Examples:
      | situacao  |
      | "Ativa"   |
      | "Inativa" |

  @RN-03
  # ← MESSAGE-DICTIONARY: CAT_CATEGORIA_COM_SUBCATEGORIAS
  Scenario: Subcategoria vinculada após abrir a confirmação
    Given que a confirmação de exclusão de "Brinquedos" está aberta
    And que outra pessoa cadastrou uma subcategoria de "Brinquedos"
    When o gestor confirma a exclusão
    Then o sistema substitui a confirmação pela caixa "Não é possível excluir: existem subcategorias vinculadas a este registro."
    And não exclui a categoria nem sua subcategoria

  # Restrições de acesso
  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Tentativa sem acesso à funcionalidade
    Given que a pessoa não tem acesso à funcionalidade
    When tenta excluir uma categoria
    Then o sistema exibe "Você não tem permissão para esta ação."
    And não exclui a categoria

  # Estados especiais
  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Categoria já excluída por outra pessoa
    Given que outra pessoa já excluiu a categoria "Brinquedos"
    When o gestor confirma a exclusão de "Brinquedos"
    Then o sistema exibe "Registro não encontrado."

  # ← MESSAGE-DICTIONARY: BASELINE
  Scenario: Falha inesperada ao excluir
    When a exclusão não pode ser concluída por falha inesperada
    Then o sistema exibe "Ocorreu um erro. Tente novamente."
    And a categoria continua na Pesquisa de Categorias
```

## Campos

| Label PO | Entidade | Preenchimento | Edição | Tipo | Obrigatório | Validação |
|---|---|---|---|---|---|---|
| Nome da categoria | Categoria | exibido do cadastro | somente leitura | texto | — | Identifica, na confirmação, a categoria a excluir |

## Campos automáticos

| Label PO | Valor | Quando |
|---|---|---|
| — | Nenhum campo é preenchido automaticamente nesta funcionalidade | — |

## Dados lidos e gravados

| Entidade | Papel | Por que a funcionalidade a toca |
|---|---|---|
| Produto | lê | Verificar se há produtos vinculados à categoria antes de excluir (RN-02) |
| Categoria | lê | Verificar se há subcategorias vinculadas antes de excluir (RN-03) |

## Superfície

**Ação em tela** — origem: Pesquisar Categorias (Pesquisa de Categorias, `/catalogo/categorias`).

**Fidelidade ao protótipo**: referência · `prototypes/catalogo/categorias/flow.html` · [abrir o protótipo ↗](../../../prototypes/catalogo/categorias/flow.html)

## Comportamento de tela

### Onde fica

A exclusão é acionada pelo ícone de excluir em cada linha da Pesquisa de Categorias. Sem produtos nem subcategorias vinculados, abre a caixa de confirmação com o nome da categoria e os botões **Cancelar** e **Excluir**. Com vínculos, abre outra caixa, só com a mensagem de bloqueio e o botão **Ok, entendi**, sem a opção de excluir.

### Estados da tela

| Estado | Comportamento |
|---|---|
| Inicial | Pesquisa de Categorias com o ícone de excluir em cada linha |
| Confirmação | Caixa "Deseja realmente excluir este registro?" com o nome da categoria |
| Loading | Mostrar "Carregando…" no botão **Excluir** e evitar novo acionamento enquanto exclui |
| Bloqueio | Caixa separada com "Não é possível excluir: existem produtos vinculados a este registro." e só o botão **Ok, entendi** |
| Bloqueio por subcategorias | Caixa separada com "Não é possível excluir: existem subcategorias vinculadas a este registro." e só o botão **Ok, entendi**; precede o bloqueio por produtos quando ambos existem |
| Erro de servidor | Mostrar "Ocorreu um erro. Tente novamente." |
| Sucesso | Fechar a caixa, mostrar o aviso "Registro excluído com sucesso." e tirar a linha da lista |
| Registro inexistente | Mostrar "Registro não encontrado." e atualizar a lista |

## Critérios de sucesso

| # | Critério mensurável | Origem |
|---|---|---|
| SC-01 | Nenhuma categoria com produtos vinculados é excluída | CA-4 e RN-02 |
| SC-02 | A categoria excluída não aparece em nenhuma pesquisa posterior | CA-4 e RN-01 |
| SC-03 | Nenhuma categoria com subcategorias ativas ou inativas é excluída, mesmo que vinculadas após abrir a confirmação; nenhum vínculo é removido em cascata | STRY0013205 CA-4 e RN-03 |

## Métricas de tamanho

| Função de Transação | Papel | Tipo | ALR | DER | Complexidade | PF | Data |
|---|---|---|---|---|---|---|---|
| Excluir Categoria | principal | — | — | — | — | — | — |

A contagem está pendente e deve nascer da análise desta funcionalidade via CT, com memória de cálculo.

## Origem

| Ticket (AIMM) | Tipo | Critérios cobertos |
|---|---|---|
| [`STRY0013170`](../../../analise-impacto/AIMM-STRY0013170.md) | Criação | `CA-4` — categoria com produtos não pode ser excluída |
| [`STRY0013205`](../../../analise-impacto/AIMM-STRY0013205.md) | Alteração | `CA-4` — categoria com subcategorias não pode ser excluída (AIMM em análise, sem aval da PO) |

## Changelog

| Data | Autor | Tipo | Descrição |
|---|---|---|---|
| 2026-10-18 | Claude | N3 criado | Exclusão definitiva de categoria, com bloqueio por produtos vinculados (RC-09), derivada do cadastro, a partir do ticket fictício STRY0013170; gates sem aprovação e contagem pendente. |
| 2026-10-18 | Claude | Ajuste | Seções reordenadas: a Superfície vai para antes da seção Comportamento de tela e a Origem vai para antes da seção Changelog. Nenhuma regra, cenário ou campo muda. |
| 2026-10-20 | Docqui Caixa | Terminologia | Adoção de AIMM; histórico e chave preservados. |
| 2026-10-21 | Claude | Origem | Ticket `STRY0013205` registrado na Origem: a AIMM está em análise e ainda não muda campos, regras ou cenários. |
| 2026-10-21 | Docqui Caixa | Terminologia | Níveis em português: Domínio, Agrupamento Funcional e Funcionalidade; histórico preservado. |
| 2026-10-23 | Copilot | Alteração | STRY0013205: exclusão bloqueada por subcategorias, com caixa e mensagem próprias, revalidação, cenários e critério de sucesso; rascunho preservado. |
