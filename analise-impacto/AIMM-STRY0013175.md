<!-- docqui: 9.1.0 | prompt: MIGRA_AIMM_ESTADO | atualizado: 2026-10-31 -->
---
tipo: ticket
ticket: STRY0013175
ferramenta: ServiceNow fictício
link: ../mentoria/backlog.md#stry0013175--navegar-pela-vitrine
titulo: Navegar pela vitrine
estado: em-análise
estado-por: "Claude"
estado-em: 2026-10-31 00:16 +00:00
aberta-na-entrega: false
sprint: ""
avalizado-por: ""
aberta-em: 2026-10-18
---

# AIMM STRY0013175

## Descrição do ticket

> Transcrição do ticket fictício do backlog da demonstração; não é um registro do ServiceNow real.

Como visitante da loja, quero ver os destaques, pesquisar produtos e abrir a página de um produto, para encontrar o que quero comprar e saber quanto custa.

## Critérios de aceite

> **Numeração**: a fonte fictícia numera os critérios; os números CA-n abaixo são os mesmos do backlog.

| Critério | Descrição |
|---|---|
| CA-1 | Na página inicial, o sistema mostra os destaques vigentes, na ordem definida pela equipe de vendas. |
| CA-2 | O visitante pesquisa produtos por parte do nome e pode filtrar por categoria; produtos de categoria inativa não aparecem. |
| CA-3 | Ao abrir um produto, o sistema mostra nome, descrição, categoria e preço; o produto sem estoque aparece como esgotado. |

## Funcionalidades

| Funcionalidade (N3) | Domínio · Agrupamento Funcional | Operação | Critérios cobertos | Status |
|---|---|---|---|---|
| [`VIT-NAV-01`: Listar Destaques](../modules/vitrine/navegacao/f-listar-destaque.md) | Vitrine · Navegação | Criação | `CA-1` | 📋 Especificado |
| [`VIT-NAV-02`: Pesquisar Produtos na Vitrine](../modules/vitrine/navegacao/f-pesquisar-produto-vitrine.md) | Vitrine · Navegação | Criação | `CA-2` | ✏️ Rascunho |
| [`VIT-NAV-03`: Visualizar Produto na Vitrine](../modules/vitrine/navegacao/f-visualizar-produto-vitrine.md) | Vitrine · Navegação | Criação | `CA-3` | 📋 Especificado |

## Artefatos impactados

O changeset abaixo descreve o pacote didático. Não há aval de PO registrado; os arquivos preenchidos são material de demonstração.

| Artefato | Tipo | Operação | Seção | Natureza | O quê | Proveniência |
|---|---|---|---|---|---|---|
| `modules/vitrine/README.md` | N1 | criar | — | funcional | Vitrine, com as regras de exposição dos produtos | elicitado |
| `modules/vitrine/navegacao/README.md` | N2 | criar | — | funcional | Jornada da visita, telas e permissões abertas | elicitado |
| `modules/vitrine/navegacao/f-listar-destaque.md` | N3 | criar | — | funcional | VIT-NAV-01 — Listar Destaques | derivado: âncora |
| `modules/vitrine/navegacao/f-pesquisar-produto-vitrine.md` | N3 | criar | — | funcional | VIT-NAV-02 — Pesquisar Produtos na Vitrine | derivado: âncora |
| `modules/vitrine/navegacao/f-visualizar-produto-vitrine.md` | N3 | criar | — | funcional | VIT-NAV-03 — Visualizar Produto na Vitrine | derivado: âncora |
| `global/MESSAGE-DICTIONARY.md` | MESSAGE-DICT | alterar | Vitrine | funcional | Selo de esgotado, página sem destaques e produto indisponível | elicitado |
| `prototypes/vitrine/navegacao/flow.html` | PROTÓTIPO | criar | — | funcional | Página inicial, busca e página do produto | derivado: espelho do N2 |

## Alterações em funcionalidades por Agrupamento Funcional

### Navegação

| Funcionalidade | CA-n | Natureza | Mudança | Regras | Cenários |
| --- | --- | --- | --- | --- | --- |
| `VIT-NAV-01`<br>**Listar Destaques** | CA-1 | incluída | **Inclusão** da funcionalidade. *Antes*: não havia N3. *Agora*: ver os produtos em destaque na página inicial. | +5 | +7 |
| `VIT-NAV-02`<br>**Pesquisar Produtos na Vitrine** | CA-2 | incluída | **Inclusão** da funcionalidade. *Antes*: não havia N3. *Agora*: encontrar produtos por nome e por categoria. | +5 | +11 |
| `VIT-NAV-03`<br>**Visualizar Produto na Vitrine** | CA-3 | incluída | **Inclusão** da funcionalidade. *Antes*: não havia N3. *Agora*: ver a página do produto, com preço e disponibilidade. | +4 | +7 |

## Entidades alteradas

Leitura de Destaque, Produto e Categoria; nenhuma entidade nova, sem alterações físicas ou contagem ALI/AIE.

## Impacto em dicionários

- Mensagens de Vitrine: `VIT_SELO_ESGOTADO`, `VIT_SEM_DESTAQUES` e `VIT_PRODUTO_INDISPONIVEL`.
- Os destaques vigentes seguem a regra canônica RC-03 — Período de vigência (entrada criada pelo STRY0013180).

## Decisões pendentes

- O responsável real deve revisar o escopo e conduzir CP1/CP2 antes de qualquer entrega.
- A contagem será feita via CT; nenhum PF foi estimado.
- A identificação de quem visita (entrar na conta) não está especificada; o Carrinho pede um cliente identificado.

## Reconciliação

Não encerrada. Esta AIMM está em análise e não declara entrega, aprovação de escopo ou aprovação dos gates.

## Changelog

| Data | Autor | Tipo | Descrição |
|---|---|---|---|
| 2026-10-31 | Docqui Caixa | Ajuste | Front-matter ganha `estado-por` e `estado-em` (9.1.0), preenchidos pelo histórico do git com quem levou a AIMM ao estado atual e quando. |
| 2026-10-21 | Docqui Caixa | Ajuste | Layout da AIMM do ticket: sem Contexto, alterações por Agrupamento Funcional, Decisões pendentes, nome abaixo do ID, entidades sem PF. |
| 2026-10-20 | Docqui Caixa | Ajuste | Layout da AIMM do ticket: nome abaixo do ID, entidades sem PF. |
| 2026-10-18 | Claude | Demonstração | Ticket fictício e Feature Set Navegação preenchidos, com 3 features em rascunho, sem aval e com a contagem pendente. |
| 2026-10-20 | Docqui Caixa | Terminologia | Adoção de AIMM; histórico e chave preservados. |
| 2026-10-21 | Docqui Caixa | Terminologia | Níveis em português: Domínio, Agrupamento Funcional e Funcionalidade; histórico preservado. |
