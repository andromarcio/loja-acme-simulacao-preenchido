<!-- docqui: 7.0.0 | prompt: MIGRA_NIVEIS | atualizado: 2026-10-23 -->
# Domínio: Catálogo
> **Nível 1** - Visão estratégica do domínio - `CAT`

## Descrição

Responde pelos produtos que a Loja ACME vende e pelas categorias que os organizam, sendo a fonte única do que existe para vender. Mantém as categorias, com a situação de cada uma, e os produtos, com preço, quantidade em estoque e categoria. É consumido pela Vitrine, que mostra os produtos a quem visita a loja, e por Vendas, que leva os produtos ao carrinho e aos pedidos.

### O que este domínio NÃO faz

| Descrição | Pertence a |
|---|---|
| Mostrar os produtos a quem visita a loja e escolher os destaques | Vitrine |
| Montar o carrinho, calcular o frete e acompanhar os pedidos | Vendas |
| Comprar, repor e controlar fisicamente o estoque | Fora do escopo do produto (N0) |

## Agrupamentos Funcionais

| Agrupamento Funcional | Descrição | Funcionalidades |
|---|---|---|
| [**Categorias**](categorias/README.md) <small>CAT-CTG</small> | Organização dos produtos em categorias | 5 |
| **Produtos** <small>CAT-PRD</small> — planejado, sem N2 | Cadastro dos produtos à venda; é o exercício STRY0013150 da mentoria | 0 |

## Regras transversais de negócio

1. Todo produto pertence a uma única categoria.
2. Uma categoria inativa continua no catálogo com os seus produtos; ela só deixa de expô-los na vitrine.

## Integrações com outros domínios

### Leitura — domínios que consomem dados deste domínio

| Domínio | O que consome | Como |
|---|---|---|
| Vitrine | Produto (Nome do produto, Descrição, Preço, Quantidade em estoque, Categoria) e Categoria (Nome da categoria, Situação, Categoria superior) | Consulta ao cadastro; na busca, inclui produtos das subcategorias e identifica o caminho. A situação da superior não se propaga às subcategorias |
| Vendas | Produto (Nome do produto, Preço, Quantidade em estoque) | Consulta ao cadastro, ao adicionar e alterar itens do carrinho |

### Escrita — domínios que criam ou alteram dados deste domínio

Nenhum outro domínio altera dados do Catálogo. A baixa de estoque na confirmação do pedido ainda não está especificada.

## Changelog

| Data | Autor | Tipo | Descrição |
|---|---|---|---|
| 2026-10-18 | Claude | N1 criado | Catálogo com Categorias especificado e Produtos planejado, preservado como exercício STRY0013150; exemplo em rascunho. |
| 2026-10-21 | Docqui Caixa | Terminologia | Níveis em português: Domínio, Agrupamento Funcional e Funcionalidade; histórico preservado. |

*Links: [Categorias](categorias/README.md) · [INDEX geral](../INDEX.md)*
