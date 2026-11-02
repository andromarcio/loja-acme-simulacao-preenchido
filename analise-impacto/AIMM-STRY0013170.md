<!-- docqui: 9.1.0 | prompt: MIGRA_AIMM_ESTADO | atualizado: 2026-10-31 -->
---
tipo: ticket
ticket: STRY0013170
ferramenta: ServiceNow fictício
link: ../mentoria/backlog.md#stry0013170--categorias-de-produtos
titulo: Categorias de produtos
estado: em-análise
estado-por: "Claude"
estado-em: 2026-10-31 00:16 +00:00
aberta-na-entrega: false
sprint: ""
avalizado-por: ""
aberta-em: 2026-10-18
---

# AIMM STRY0013170

## Descrição do ticket

> Transcrição do ticket fictício do backlog da demonstração; não é um registro do ServiceNow real.

A equipe de vendas precisa organizar os produtos da loja em categorias, para que o cliente encontre o que procura: pesquisar, cadastrar, alterar, excluir e consultar as categorias.

## Critérios de aceite

> **Numeração**: a fonte fictícia numera os critérios; os números CA-n abaixo são os mesmos do backlog.

| Critério | Descrição |
|---|---|
| CA-1 | A equipe pesquisa as categorias por nome e por situação. |
| CA-2 | A categoria é cadastrada com nome e uma descrição opcional; não pode haver duas categorias com o mesmo nome. |
| CA-3 | A equipe altera a descrição e a situação da categoria, mas não o nome; os produtos de uma categoria inativa deixam de aparecer na vitrine. |
| CA-4 | Categoria com produtos não pode ser excluída. |
| CA-5 | A equipe consulta os dados de uma categoria e quantos produtos ela tem. |

## Funcionalidades

| Funcionalidade (N3) | Domínio · Agrupamento Funcional | Operação | Critérios cobertos | Status |
|---|---|---|---|---|
| [`CAT-CTG-01`: Pesquisar Categorias](../modules/catalogo/categorias/f-pesquisar-categoria.md) | Catálogo · Categorias | Criação | `CA-1` | 📋 Especificado |
| [`CAT-CTG-02`: Cadastrar Categoria](../modules/catalogo/categorias/f-cadastrar-categoria.md) | Catálogo · Categorias | Criação | `CA-2` | ✏️ Rascunho |
| [`CAT-CTG-03`: Editar Categoria](../modules/catalogo/categorias/f-editar-categoria.md) | Catálogo · Categorias | Criação | `CA-3` | ✏️ Rascunho |
| [`CAT-CTG-04`: Excluir Categoria](../modules/catalogo/categorias/f-excluir-categoria.md) | Catálogo · Categorias | Criação | `CA-4` | ✏️ Rascunho |
| [`CAT-CTG-05`: Visualizar Categoria](../modules/catalogo/categorias/f-visualizar-categoria.md) | Catálogo · Categorias | Criação | `CA-5` | ✏️ Rascunho |

## Artefatos impactados

O changeset abaixo descreve o pacote didático. Não há aval de PO registrado; os arquivos preenchidos são material de demonstração.

| Artefato | Tipo | Operação | Seção | Natureza | O quê | Proveniência |
|---|---|---|---|---|---|---|
| `modules/catalogo/README.md` | N1 | criar | — | funcional | Catálogo, com Categorias e Produtos planejado | elicitado |
| `modules/catalogo/categorias/README.md` | N2 | criar | — | funcional | CRUD de Categorias, telas e permissões | elicitado |
| `modules/catalogo/categorias/f-pesquisar-categoria.md` | N3 | criar | — | funcional | CAT-CTG-01 — Pesquisar Categorias | derivado: âncora |
| `modules/catalogo/categorias/f-cadastrar-categoria.md` | N3 | criar | — | funcional | CAT-CTG-02 — Cadastrar Categoria | derivado: âncora |
| `modules/catalogo/categorias/f-editar-categoria.md` | N3 | criar | — | funcional | CAT-CTG-03 — Editar Categoria | derivado: âncora |
| `modules/catalogo/categorias/f-excluir-categoria.md` | N3 | criar | — | funcional | CAT-CTG-04 — Excluir Categoria | derivado: âncora |
| `modules/catalogo/categorias/f-visualizar-categoria.md` | N3 | criar | — | funcional | CAT-CTG-05 — Visualizar Categoria | derivado: âncora |
| `global/DATA-MODEL.md` | DATA-MODEL | alterar | Modelos por domínio | funcional | Índice do modelo de Catálogo | elicitado |
| `global/data-models/catalogo.md` | DATA-MODEL | criar | — | funcional | Categoria e Produto, com a massa da demonstração | elicitado |
| `global/MESSAGE-DICTIONARY.md` | MESSAGE-DICT | alterar | Catálogo | funcional | Nome duplicado, exclusão bloqueada e confirmação de inativação | elicitado |
| `prototypes/catalogo/categorias/flow.html` | PROTÓTIPO | criar | — | funcional | Fluxo da pesquisa com os modais de cadastro, edição e visualização | derivado: espelho do N2 |

## Alterações em funcionalidades por Agrupamento Funcional

### Categorias

| Funcionalidade | CA-n | Natureza | Mudança | Regras | Cenários |
| --- | --- | --- | --- | --- | --- |
| `CAT-CTG-01`<br>**Pesquisar Categorias** | CA-1 | incluída | **Inclusão** da funcionalidade. *Antes*: não havia N3. *Agora*: encontrar categorias por nome e situação. | +3 | +9 |
| `CAT-CTG-02`<br>**Cadastrar Categoria** | CA-2 | incluída | **Inclusão** da funcionalidade. *Antes*: não havia N3. *Agora*: incluir uma categoria com nome único. | +2 | +9 |
| `CAT-CTG-03`<br>**Editar Categoria** | CA-3 | incluída | **Inclusão** da funcionalidade. *Antes*: não havia N3. *Agora*: alterar a descrição e a situação; o nome não muda. | +2 | +9 |
| `CAT-CTG-04`<br>**Excluir Categoria** | CA-4 | incluída | **Inclusão** da funcionalidade. *Antes*: não havia N3. *Agora*: remover uma categoria que não tem produtos. | +2 | +6 |
| `CAT-CTG-05`<br>**Visualizar Categoria** | CA-5 | incluída | **Inclusão** da funcionalidade. *Antes*: não havia N3. *Agora*: ver todos os dados e quantos produtos a categoria tem. | +1 | +5 |

## Entidades alteradas

Modelo negocial de Categoria e Produto, sem alterações físicas ou contagem ALI/AIE. Produto entra no modelo porque a Vitrine, os Destaques e o Carrinho o leem; a manutenção dele é o exercício STRY0013150.

## Impacto em dicionários

- Mensagens de Catálogo: `CAT_CATEGORIA_DUPLICADA`, `CAT_CATEGORIA_COM_PRODUTOS` e `CAT_INATIVAR_COM_PRODUTOS`.
- A exclusão bloqueada usa a regra canônica RC-09 — Registro vinculado não pode ser excluído, que já tinha entrada; o texto exibido ganha a chave `CAT_CATEGORIA_COM_PRODUTOS`.

## Decisões pendentes

- O responsável real deve revisar o escopo e conduzir CP1/CP2 antes de qualquer entrega.
- A contagem será feita via CT; nenhum PF foi estimado.
- O nome da categoria é o identificador e não muda na edição; renomear uma categoria exigiria uma decisão nova da PO.
- A manutenção dos produtos continua planejada (Produtos, `CAT-PRD`) e é o exercício STRY0013150.

## Reconciliação

Não encerrada. Esta AIMM está em análise e não declara entrega, aprovação de escopo ou aprovação dos gates.

## Changelog

| Data | Autor | Tipo | Descrição |
|---|---|---|---|
| 2026-10-31 | Docqui Caixa | Ajuste | Front-matter ganha `estado-por` e `estado-em` (9.1.0), preenchidos pelo histórico do git com quem levou a AIMM ao estado atual e quando. |
| 2026-10-21 | Docqui Caixa | Ajuste | Layout da AIMM do ticket: sem Contexto, alterações por Agrupamento Funcional, Decisões pendentes, nome abaixo do ID, entidades sem PF. |
| 2026-10-20 | Docqui Caixa | Ajuste | Layout da AIMM do ticket: nome abaixo do ID, entidades sem PF. |
| 2026-10-18 | Claude | Demonstração | Ticket fictício e Feature Set Categorias preenchidos, com 5 features em rascunho, sem aval e com a contagem pendente. |
| 2026-10-20 | Docqui Caixa | Terminologia | Adoção de AIMM; histórico e chave preservados. |
| 2026-10-21 | Docqui Caixa | Terminologia | Níveis em português: Domínio, Agrupamento Funcional e Funcionalidade; histórico preservado. |
