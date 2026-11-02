<!-- docqui: 7.0.0 | prompt: MIGRA_NIVEIS | atualizado: 2026-10-21 -->
# Domínio: Vendas
> **Nível 1** - Visão estratégica do domínio - `VND`

## Descrição

Vendas reúne o carrinho, o checkout e a gestão dos pedidos da Loja ACME. O cliente monta o carrinho com os produtos do Catálogo e conhece o valor da entrega antes de confirmar o pedido; o atendente pode apoiar essa consulta, localizar os pedidos e cancelá-los quando o cliente pede.

### O que este domínio NÃO faz

| Descrição | Pertence a |
|---|---|
| Manter os produtos e as categorias | Catálogo |
| Mostrar os produtos a quem visita a loja | Vitrine |
| Manter as faixas de frete | Administração |
| Executar pagamento ou entrega | Serviços fora do escopo do produto |

## Agrupamentos Funcionais

| Agrupamento Funcional | Descrição | Funcionalidades |
|---|---|---|
| [**Carrinho**](carrinho/README.md) <small>VND-CAR</small> | Itens escolhidos antes da compra | 4 |
| [**Checkout**](checkout/README.md) <small>VND-CHK</small> | Valor da entrega antes da confirmação | 1 |
| [**Gestão de Pedidos**](gestao-pedidos/README.md) <small>VND-PED</small> | Consulta e cancelamento dos pedidos pelo atendimento | 3 |

## Regras transversais de negócio

1. Todo pedido confirmado tem um CEP de entrega atendido.
2. Cada cliente tem no máximo um pedido aberto, que é o seu carrinho.

## Integrações com outros domínios

### Leitura — domínios que consomem dados deste domínio

| Domínio | O que consome | Como |
|---|---|---|
| Administração | Pedido (Faixa de frete) | Consulta ao excluir uma faixa de frete, para saber se ela atende algum pedido |

### Escrita — domínios que criam ou alteram dados deste domínio

| Domínio | O que altera | Situação |
|---|---|---|
| Administração | TabelaFrete (Região, CEP inicial, CEP final, Valor do frete) | Ao cadastrar, editar ou excluir uma faixa de frete |

## Changelog

| Data | Autor | Tipo | Descrição |
|---|---|---|---|
| 2026-10-21 | Docqui Caixa | Terminologia | Níveis em português: Domínio, Agrupamento Funcional e Funcionalidade; histórico preservado. |
| 2026-10-18 | Claude | N1 atualizado | Carrinho especificado e novo Feature Set Gestão de Pedidos; a regra 2 diz que o pedido aberto é o carrinho. Integrações com Administração, que mantém as faixas da Tabela de Frete e consulta os pedidos antes de excluir uma faixa. Catálogo deixa de ser apenas previsto. |
| 2026-10-14 | Copilot | N1 criado | Vendas com Checkout preenchido e Carrinho planejado; exemplo em rascunho. |

*Links: [Carrinho](carrinho/README.md) · [Checkout](checkout/README.md) · [Gestão de Pedidos](gestao-pedidos/README.md) · [INDEX geral](../INDEX.md)*
