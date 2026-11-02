<!-- docqui: 7.0.0 | prompt: MIGRA_NIVEIS | atualizado: 2026-10-21 -->
# Domínio: Vitrine
> **Nível 1** - Visão estratégica do domínio - `VIT`

## Descrição

Responde pelo que a pessoa vê ao visitar a Loja ACME: os destaques da página inicial, a busca de produtos e a página de cada produto. Mantém os destaques, com a chamada, a ordem e o período de cada um, e lê do Catálogo os produtos e as categorias que mostra. Leva quem visita até o carrinho de Vendas, de onde a compra segue.

### O que este domínio NÃO faz

| Descrição | Pertence a |
|---|---|
| Manter produtos e categorias | Catálogo |
| Montar o carrinho e fechar a compra | Vendas |
| Identificar a pessoa que visita (entrar na conta) | Não especificado no exemplo |

## Agrupamentos Funcionais

| Agrupamento Funcional | Descrição | Funcionalidades |
|---|---|---|
| [**Navegação**](navegacao/README.md) <small>VIT-NAV</small> | Destaques, busca e página do produto para quem visita a loja | 3 |
| [**Destaques**](destaques/README.md) <small>VIT-DST</small> | Escolha dos produtos em evidência na página inicial | 5 |

## Regras transversais de negócio

1. A vitrine só mostra produtos de categorias ativas.
2. Produto com quantidade em estoque zero aparece como esgotado.
3. O preço mostrado é o preço atual do produto no Catálogo.

## Integrações com outros domínios

### Leitura — domínios que consomem dados deste domínio

Nenhum outro domínio consome dados da Vitrine. Os produtos e as categorias que ela mostra são lidos do Catálogo (ver o N1 [Catálogo](../catalogo/README.md)).

### Escrita — domínios que criam ou alteram dados deste domínio

Nenhum outro domínio altera dados da Vitrine.

## Changelog

| Data | Autor | Tipo | Descrição |
|---|---|---|---|
| 2026-10-18 | Claude | N1 criado | Vitrine com Navegação e Destaques especificados; exemplo em rascunho. |
| 2026-10-21 | Docqui Caixa | Terminologia | Níveis em português: Domínio, Agrupamento Funcional e Funcionalidade; histórico preservado. |

*Links: [Navegação](navegacao/README.md) · [Destaques](destaques/README.md) · [INDEX geral](../INDEX.md)*
