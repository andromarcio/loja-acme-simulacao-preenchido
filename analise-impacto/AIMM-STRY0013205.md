<!-- docqui: 9.1.0 | prompt: MIGRA_AIMM_ESTADO | atualizado: 2026-10-31 -->
---
tipo: ticket
ticket: STRY0013205
ferramenta: ServiceNow fictício
link: ../mentoria/backlog.md#stry0013205--subcategorias
titulo: Subcategorias
estado: em-análise
estado-por: "Claude"
estado-em: 2026-10-31 00:16 +00:00
aberta-na-entrega: false
sprint: ""
avalizado-por: ""
aberta-em: 2026-10-21
---

# AIMM STRY0013205

## Descrição do ticket

> Transcrição do ticket fictício do backlog da demonstração; não é um registro do ServiceNow real.

A equipe de vendas precisa dividir as categorias em subcategorias — por exemplo, Canecas e Garrafas dentro de Cozinha —, para que o cliente refine a busca sem que a lista de categorias cresça sem ordem. Basta um nível: uma subcategoria não tem subcategorias.

## Critérios de aceite

> **Numeração**: a fonte fictícia numera os critérios; os números CA-n abaixo são os mesmos do backlog.

| Critério | Descrição |
|---|---|
| CA-1 | Ao cadastrar uma categoria, a equipe pode escolher a categoria superior, entre as categorias que não são subcategorias. |
| CA-2 | Ao editar uma categoria, a equipe pode trocar ou retirar a categoria superior; uma categoria que tem subcategorias não pode passar a ser subcategoria. |
| CA-3 | Duas subcategorias da mesma categoria superior não podem ter o mesmo nome; com categorias superiores diferentes, podem. |
| CA-4 | Categoria com subcategorias não pode ser excluída. |
| CA-5 | Ao consultar uma categoria, a equipe vê a categoria superior e as subcategorias dela. |
| CA-6 | Na vitrine, ao filtrar a busca por uma categoria, aparecem também os produtos das subcategorias dela. |

## Funcionalidades

| Funcionalidade (N3) | Domínio · Agrupamento Funcional | Operação | Critérios cobertos | Status |
|---|---|---|---|---|
| [`CAT-CTG-02`: Cadastrar Categoria](../modules/catalogo/categorias/f-cadastrar-categoria.md) | Catálogo · Categorias | Alteração | `CA-1, CA-3` | ✏️ Rascunho |
| [`CAT-CTG-03`: Editar Categoria](../modules/catalogo/categorias/f-editar-categoria.md) | Catálogo · Categorias | Alteração | `CA-2, CA-3` | ✏️ Rascunho |
| [`CAT-CTG-04`: Excluir Categoria](../modules/catalogo/categorias/f-excluir-categoria.md) | Catálogo · Categorias | Alteração | `CA-4` | ✏️ Rascunho |
| [`CAT-CTG-05`: Visualizar Categoria](../modules/catalogo/categorias/f-visualizar-categoria.md) | Catálogo · Categorias | Alteração | `CA-5` | ✏️ Rascunho |
| [`VIT-NAV-02`: Pesquisar Produtos na Vitrine](../modules/vitrine/navegacao/f-pesquisar-produto-vitrine.md) | Vitrine · Navegação | Alteração | `CA-6` | ✏️ Rascunho |

## Artefatos impactados

O changeset abaixo é a previsão do analista, ainda sem o aval da PO. As linhas derivadas que a análise concluiu que não mudam saíram: a vitrine.md (a busca não muda o Destaque), o FIELD-DICTIONARY (nenhum campo canônico novo), o RULES-DICTIONARY (a RC-09 — Registro vinculado não pode ser excluído só ganha parâmetro, no N3) e o NFR (a busca com as subcategorias segue as qualidades vigentes).

Em 2026-10-23, a proposta foi incorporada às fontes documentais e aos protótipos para revisão, por solicitação desta história. Isso não constitui aval da PO: a AIMM continua **em-análise**, os cinco N3 continuam **✏️ Rascunho**, os gates seguem sem aprovação e a contagem via CT permanece pendente.

| Artefato | Tipo | Operação | Seção | Natureza | O quê | Proveniência |
|---|---|---|---|---|---|---|
| `modules/catalogo/categorias/f-cadastrar-categoria.md` | N3 | alterar | Campos/Regras/Cenários | funcional | Campo Categoria superior; o nome passa a ser único entre as categorias com a mesma categoria superior | derivado: âncora |
| `modules/catalogo/categorias/f-editar-categoria.md` | N3 | alterar | Campos/Regras/Cenários | funcional | Trocar ou retirar a superior; bloquear autorreferência, segundo nível e conflito de nome no destino; categoria com subcategorias não vira subcategoria | derivado: âncora |
| `modules/catalogo/categorias/f-excluir-categoria.md` | N3 | alterar | Regras/Cenários/Dados lidos e gravados | funcional | Exclusão bloqueada também pelas subcategorias | derivado: âncora |
| `modules/catalogo/categorias/f-visualizar-categoria.md` | N3 | alterar | Campos/Cenários | funcional | Mostrar a categoria superior e a lista de subcategorias | derivado: âncora |
| `modules/vitrine/navegacao/f-pesquisar-produto-vitrine.md` | N3 | alterar | Regras/Cenários | funcional | O filtro por categoria inclui os produtos das subcategorias | derivado: âncora |
| `modules/catalogo/categorias/README.md` | N2 | alterar | Funcionalidades/Dependências entre funcionalidades | funcional | Descrições de Editar e Excluir e a dependência das subcategorias | elicitado |
| `modules/catalogo/README.md` | N1 | alterar | Integrações com outros domínios | funcional | A Vitrine passa a ler a Categoria superior | elicitado |
| `global/data-models/catalogo.md` | DATA-MODEL | alterar | Categoria/Relacionamentos | dados | Atributo Categoria superior, relacionamento da Categoria com ela mesma e o nome único por categoria superior | derivado: ## Campos → coluna |
| `global/DATA-MODEL.md` | DATA-MODEL | alterar | Relacionamentos | dados | Autorrelacionamento opcional da Categoria, 0..1 — 0..N, em um único nível | elicitado |
| `global/DIAGRAMA-ER.md` | DATA-MODEL | alterar | Catálogo | derivado | Regenerar o autorrelacionamento a partir do fragmento negocial | derivado: modelo |
| `global/CONTAGEM-PF.md` | MÉTRICA | alterar | — | derivado | Recontagem pelo CT, depois do N3 e do DATA-MODEL; a contagem da instância ainda está pendente | derivado: delta de dados |
| `global/MESSAGE-DICTIONARY.md` | MESSAGE-DICT | alterar | Catálogo | funcional | Nome repetido na mesma categoria superior, superior com subcategorias e exclusão com subcategorias | derivado: referência no N3 |
| `prototypes/catalogo/categorias/flow.html` | PROTÓTIPO | alterar | — | funcional | Campo Categoria superior nos modais de cadastro e edição; subcategorias no modal de visualização | derivado: ## Superfície (Modal) |
| `prototypes/vitrine/navegacao/flow.html` | PROTÓTIPO | alterar | — | funcional | Seletor de categoria com as subcategorias abaixo da categoria superior | derivado: ## Superfície (Tela própria) |

**Derivados de publicação**: regenerar `analise-impacto/AIMM-STRY0013205.html`, `assets/tree.js`, `assets/mapa-data.js`, `rastreabilidade/data.js`, o espelho em `modules/INDEX.md` e `assets/dashboard-data.js` pelos scripts canônicos, sem edição manual. O espelho pode permanecer sem diff quando os gates não mudam.

**Correção de infraestrutura da história**: recuperar `scripts/`, `engine/publication/` e a definição semântica `engine/DEFINICAO-FUNCIONALIDADE.md` do histórico desta instância para executar os checks e a geração. Alinhar a cadência em `global/MASTER.md` e sua apresentação no `README.md` à branch `historia/STRY0013205` exigida pelo escopo; não constitui aprovação nem entrega na `main`.

## Alterações em funcionalidades por Agrupamento Funcional

### Categorias

| Funcionalidade | CA-n | Natureza | Mudança | Regras | Cenários |
|---|---|---|---|---|---|
| `CAT-CTG-02`<br>**Cadastrar Categoria** | CA-1, CA-3 | alterada | **Inclusão** da categoria superior e **Alteração** do nome único. *Antes*: toda categoria era de primeiro nível, e o nome era único entre todas as categorias. *Agora*: a equipe pode escolher a categoria superior entre as que não são subcategorias, e o nome é único entre as categorias com a mesma categoria superior. | +1 | +4 |
| `CAT-CTG-03`<br>**Editar Categoria** | CA-2, CA-3 | alterada | **Inclusão** da troca ou retirada de superior, mantendo o nome imutável. Bloquear superior para categoria com subcategorias, autorreferência, segundo nível e nome repetido no destino, inclusive ao retirar a superior. | +3 | +7 |
| `CAT-CTG-04`<br>**Excluir Categoria** | CA-4 | alterada | **Restrição** da exclusão. *Antes*: só os produtos vinculados bloqueavam a exclusão. *Agora*: as subcategorias também bloqueiam, pela mesma RC-09 — Registro vinculado não pode ser excluído, inclusive ao confirmar. | +1 | +2 |
| `CAT-CTG-05`<br>**Visualizar Categoria** | CA-5 | alterada | **Inclusão** da hierarquia na consulta. *Antes*: a consulta mostrava os dados da categoria e quantos produtos ela tem. *Agora*: mostra também a categoria superior e as subcategorias, com estados vazios e sem somar produtos indiretos. | +1 | +3 |

### Navegação

| Funcionalidade | CA-n | Natureza | Mudança | Regras | Cenários |
|---|---|---|---|---|---|
| `VIT-NAV-02`<br>**Pesquisar Produtos na Vitrine** | CA-6 | alterada | **Alteração** do filtro por categoria. Inclui produtos diretos e de subcategorias ativas, oferece subcategorias com caminho e não propaga a situação da superior. | +2 | +5 |

## Entidades alteradas

Perfil `requisitos`: a alteração é descrita no modelo de entidades de negócio, em Label PO. Não há migração nem tabela ou coluna de banco, e a coluna Migração sai `—`; a camada física fica para o desenvolvimento.

### Categoria

| Migração | Tabela / atributo | Natureza | Mudança |
|---|---|---|---|
| — | Categoria superior | atributo incluído | **Inclusão** da referência a outra Categoria, opcional. *Antes*: toda categoria era de primeiro nível. *Agora*: a categoria com categoria superior é uma subcategoria; só as categorias de primeiro nível podem ser escolhidas como superior. |
| — | Categoria [0..1 — 0..N] Categoria | relacionamento incluído | **Inclusão** do autorrelacionamento opcional, de um nível só. Uma categoria tem zero ou uma superior; uma superior agrupa zero ou várias subcategorias. Sem autorreferência ou ciclos; uma subcategoria não tem subcategorias. |
| — | Nome da categoria | restrição alterada | **Alteração** da unicidade. *Antes*: único entre todas as categorias. *Agora*: único entre as categorias com a mesma categoria superior — e entre as de primeiro nível; "Canecas" pode existir em Cozinha e em Presentes. |

### Produto

Nenhuma alteração de atributo: o produto continua com uma única Categoria, que agora pode ser uma subcategoria. O que muda é a leitura na vitrine (VIT-NAV-02 — Pesquisar Produtos na Vitrine), não a entidade.

## Impacto em dicionários

- Mensagens de Catálogo novas, propostas com ⚠️: `CAT_CATEGORIA_COM_SUBCATEGORIAS`, para exclusão; `CAT_SUPERIOR_COM_SUBCATEGORIAS`, para categoria com subcategorias escolhida como subcategoria; `CAT_SUPERIOR_INVALIDA`, para superior inexistente, autorreferência ou segundo nível; `CAT_SEM_SUBCATEGORIAS`, para lista vazia na ficha.
- `CAT_CATEGORIA_DUPLICADA` muda de "Já existe uma categoria com este nome." para "Já existe uma categoria com este nome nesta categoria superior.", inclusive no primeiro nível e ao mover ou retirar a superior.
- A RC-09 — Registro vinculado não pode ser excluído não muda no RULES-DICTIONARY: em CAT-CTG-04 — Excluir Categoria, ganha a Categoria como segunda entidade vinculada.

## Decisões pendentes

- A PO ainda não avalizou o escopo. Os documentos foram alterados como proposta revisável da história, sem aprovação de gates ou mudança de status; a entrega permanece pendente.
- Proposta explícita para categoria superior inativa: sua situação não se propaga. Subcategoria ativa mantém seus produtos na vitrine; produtos de categoria diretamente inativa continuam excluídos. A superior inativa não pode ser selecionada no filtro, mas as subcategorias ativas podem.
- Trocar ou retirar a superior, na edição, é bloqueado se o destino já tiver categoria de mesmo nome, ignorando maiúsculas e acentos e considerando inativas. Mantém o nome imutável e usa a mesma mensagem de duplicidade.
- O filtro da vitrine oferece subcategorias com o caminho "Cozinha › Canecas", também usado nos resultados; cadastro e edição oferecem somente superiores de primeiro nível, cujos nomes já são únicos. O formato e a regra de inatividade seguem propostos, sem aval da PO.
- A Pesquisa de Categorias (CAT-CTG-01 — Pesquisar Categorias) não está no ticket. Se ela deve mostrar a categoria superior ou filtrar por ela, é critério novo, a pedir na ferramenta de origem.
- A contagem será feita pelo CT; nenhum PF foi estimado.

## Reconciliação

> Preenchida no fechamento (estado `concluído`): artefatos **declarados** no changeset ×
> artefatos **efetivamente tocados** no diff/PR. Rodar:
> `node scripts/validate-impact.mjs analise-impacto/AIMM-<CHAVE>.md --git-base <base>`.
> Declarado-e-não-tocado = escopo não cumprido; tocado-e-não-declarado = desvio — os dois
> precisam de justificativa. AIMM aberta na entrega: diga que não houve escopo prévio.
> Escreva o resultado abaixo desta citação — ela é instrução e pode ficar.

## Changelog

| Data | Autor | Tipo | Descrição |
|---|---|---|---|
| 2026-10-31 | Docqui Caixa | Ajuste | Front-matter ganha `estado-por` e `estado-em` (9.1.0), preenchidos pelo histórico do git com quem levou a AIMM ao estado atual e quando. |
| 2026-10-21 | Claude | Em análise | Changeset derivado e podado; alterações previstas nas 5 features e na entidade Categoria, em Label PO, sem aval da PO. |
| 2026-10-21 | Claude | AIMM aberta | Ticket fictício `STRY0013205` registrado a partir do backlog da demonstração; 5 features mapeadas, todas alteradas. |
| 2026-10-21 | Docqui Caixa | Terminologia | Níveis em português: Domínio, Agrupamento Funcional e Funcionalidade; histórico preservado. |
| 2026-10-23 | Copilot | Alteração | STRY0013205 incorporada aos cinco N3, modelo negocial, mensagens e protótipos como proposta; CA-3 também na edição, decisões de filtro e inatividade explicitadas, mantendo em-análise e contagem pendente. Regeneração dos derivados bloqueada pela ausência de scripts neste checkout. |
| 2026-10-23 | Copilot | Correção | Restaurados os validadores e geradores canônicos do commit `7569391`, anterior à remoção de ferramentas no commit-base; regenerados HTML, ER, índices, rastreabilidade e dashboard. O espelho de gates já estava atualizado; nenhum gate ou PF foi aprovado ou preenchido. |
