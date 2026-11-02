<!-- docqui: 7.0.0 | prompt: MIGRA_NIVEIS | atualizado: 2026-10-23 -->
# Agrupamento Funcional: Categorias
> **Nível 2** - Domínio: Catálogo - `CAT-CTG`

## Descrição

Reúne as operações de manutenção das categorias de produtos: pesquisar, cadastrar, editar, excluir e visualizar uma categoria. Permite ao gestor de catálogo organizar os produtos que a vitrine mostra e tirar uma categoria inteira da vitrine sem apagá-la.

**Não faz**: cadastrar produtos (Produtos, exercício STRY0013150) nem decidir o que aparece em destaque (Vitrine › Destaques).

## Funcionalidades

<!-- docqui:n3-ids {"version":1,"ids":{"CAT-CTG-01":"f-pesquisar-categoria.md","CAT-CTG-02":"f-cadastrar-categoria.md","CAT-CTG-03":"f-editar-categoria.md","CAT-CTG-04":"f-excluir-categoria.md","CAT-CTG-05":"f-visualizar-categoria.md"}} -->

| Funcionalidade | Descrição |
|---|---|
| [**Pesquisar Categorias**](f-pesquisar-categoria.md) <small>CAT-CTG-01</small> | Encontrar categorias por nome e situação |
| [**Cadastrar Categoria**](f-cadastrar-categoria.md) <small>CAT-CTG-02</small> | Incluir categoria ou subcategoria, com nome único por superior |
| [**Editar Categoria**](f-editar-categoria.md) <small>CAT-CTG-03</small> | Alterar descrição, situação e superior; o nome não muda e categoria com subcategorias não recebe superior |
| [**Excluir Categoria**](f-excluir-categoria.md) <small>CAT-CTG-04</small> | Remover categoria sem produtos nem subcategorias |
| [**Visualizar Categoria**](f-visualizar-categoria.md) <small>CAT-CTG-05</small> | Ver dados, superior, subcategorias e quantidade de produtos diretos |

## Fluxo Principal

```mermaid
flowchart TD
    A(["Usuário acessa a listagem de Categoria"]) --> B["Pesquisar Categorias"]
    B --> C{"Qual ação?"}
    C -->|Cadastrar novo| D["Cadastrar Categoria"]
    C -->|Selecionar registro| E{"Ação sobre o registro"}
    E -->|Visualizar| F["Visualizar Categoria"]
    E -->|Editar| G["Editar Categoria"]
    E -->|Excluir| H["Excluir Categoria"]
    D --> Z(["Categoria atualizada"])
    G --> Z
    H --> Z
    F --> Z
```

## Dependências entre funcionalidades

- **Pesquisar Categorias** é o ponto de entrada; **Cadastrar Categoria** independe das demais.
- **Editar Categoria**, **Excluir Categoria** e **Visualizar Categoria** exigem uma categoria existente, alcançada pela pesquisa.
- **Excluir Categoria** depende de a categoria não ter produtos (Produto, do Catálogo). A categoria com produtos sai da vitrine ao ser inativada em **Editar Categoria**.
- **Cadastrar Categoria** e **Editar Categoria** consultam as categorias de primeiro nível para a superior, em um único nível de subcategorias. **Excluir Categoria** também depende de não haver subcategorias; seus vínculos podem ser retirados ou trocados em **Editar Categoria**, respeitando a unicidade do nome no destino.

## Telas

| Tela | Rota sugerida | Funcionalidades atendidas | Descrição |
|---|---|---|---|
| Pesquisa de Categorias | `/catalogo/categorias` | **Pesquisar Categorias** <small>CAT-CTG-01</small><br>**Cadastrar Categoria** <small>CAT-CTG-02</small><br>**Editar Categoria** <small>CAT-CTG-03</small><br>**Excluir Categoria** <small>CAT-CTG-04</small><br>**Visualizar Categoria** <small>CAT-CTG-05</small> | Filtros e lista das categorias; cadastro, edição e visualização abrem em modal sobre a pesquisa, e a exclusão é ação na linha |

## Permissões por perfil

> **Fonte única de permissões** deste Agrupamento Funcional. As funcionalidades (N3) não tratam de perfis nem permissões; qualquer acesso novo ou diferente entra nesta matriz.

Perfis: **Gestor de catálogo**, **Administrador**.

| Perfil | Pesquisar | Cadastrar | Editar | Excluir | Visualizar |
|---|---|---|---|---|---|
| **Gestor de catálogo** | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Administrador** | ✓ | — | — | — | ✓ |

* **Gestor de catálogo** — mantém as categorias.
* **Administrador** — consulta, sem alterar.

## Changelog

| Data | Autor | Tipo | Descrição |
|---|---|---|---|
| 2026-10-18 | ids-n3 | IDs reservados | Registro dos IDs existentes, sem renumeração; IDs imutáveis. |
| 2026-10-18 | Claude | N2 criado | CRUD de Categorias gerado pelo PROMPT CRUD a partir do ticket fictício STRY0013170; cadastro, edição e visualização em modal; sem aprovação de checkpoint. |
| 2026-10-21 | Docqui Caixa | Terminologia | Níveis em português: Domínio, Agrupamento Funcional e Funcionalidade; histórico preservado. |
| 2026-10-23 | Copilot | Alteração | STRY0013205: descrições e dependências do cadastro, edição, exclusão e consulta com subcategorias, sem aprovar gates. |

*Links: [N1 Catálogo](../README.md) · [INDEX geral](../../INDEX.md)*
