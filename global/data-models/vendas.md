<!-- docqui: 6.4.10 | prompt: PROMPT_DATA_MODEL_negocio | atualizado: 2026-10-18 -->
# Data Model: Vendas
> **Modelo de entidades (negocial)** — entidades, atributos e relacionamentos de negócio, sem camada física.

## Pedido

> Compra que o cliente monta no carrinho, prepara no checkout e o atendimento acompanha depois de confirmada. Enquanto está aberto, o pedido é o carrinho do cliente.

| Atributo (Label PO) | Tipo | Obrigatório | Notas |
|---|---|---|---|
| Número do pedido | número | automático | Identifica a compra fictícia |
| Cliente | seleção → Usuario | sim | Usuário de perfil Cliente dono do pedido |
| CEP de entrega | texto | não | Informado no checkout; → ver FIELD-DICTIONARY: CEP |
| Valor do frete | valor | não | Recebe o valor da faixa atendida ao calcular |
| Faixa de frete | seleção → TabelaFrete | não | Referência atribuída automaticamente ao concluir a cotação |
| Situação | lista (Aberto, Confirmado, Cancelado) | sim | Aberto enquanto é o carrinho; a confirmação ainda não está especificada, e os pedidos confirmados da demonstração são massa fictícia |
| Data da confirmação | data | não | Registrada quando o pedido é confirmado |
| Motivo do cancelamento | texto | não | Informado ao cancelar; de 10 a 200 caracteres |
| Data do cancelamento | data | não | Registrada ao cancelar |
| Cancelado por | seleção → Usuario | não | Quem cancelou o pedido |

## ItemPedido

> Produto escolhido pelo cliente, com a quantidade e o preço do momento em que entrou no carrinho.

| Atributo (Label PO) | Tipo | Obrigatório | Notas |
|---|---|---|---|
| Pedido | seleção → Pedido | sim | Pedido a que o item pertence |
| Produto | seleção → Produto | sim | Um produto aparece no máximo uma vez em cada pedido |
| Quantidade | número | sim | → ver FIELD-DICTIONARY: Quantidade |
| Preço unitário | valor | sim | Preço do produto no momento em que entrou no carrinho; → ver FIELD-DICTIONARY: Valor monetário |

## TabelaFrete

> Faixas de CEP atendidas e seus respectivos valores de entrega. Cada linha é uma faixa de frete.

| Atributo (Label PO) | Tipo | Obrigatório | Notas |
|---|---|---|---|
| Região | texto | sim | Nome da área atendida; único entre as faixas; até 60 caracteres |
| CEP inicial | texto | sim | Limite inicial inclusivo; → ver FIELD-DICTIONARY: CEP |
| CEP final | texto | sim | Limite final inclusivo; → ver FIELD-DICTIONARY: CEP |
| Valor do frete | valor | sim | → ver FIELD-DICTIONARY: Valor monetário |

## Relacionamentos

- **TabelaFrete** [1 — N] **Pedido** — uma faixa pode atender vários pedidos; um pedido com cotação válida usa uma faixa.
- **Pedido** [1 — N] **ItemPedido** — o pedido reúne os itens escolhidos; cada item é de um único pedido.
- **Produto** [1 — N] **ItemPedido** — um produto pode estar em vários pedidos; cada item é de um único produto. Produto é entidade do Catálogo.
- **Usuario** [1 — N] **Pedido** — o cliente dono do pedido e, no cancelamento, quem cancelou. Usuario é entidade da Administração.

### Dados da demonstração

| Região | CEP inicial | CEP final | Valor do frete |
|---|---|---|---|
| Centro — São Paulo | 01310000 | 01310999 | R$ 18,90 |
| Mooca — São Paulo | 03100000 | 03199999 | R$ 22,50 |
| Pinheiros — São Paulo | 05400000 | 05499999 | R$ 21,00 |
| Campinas | 13000000 | 13139999 | R$ 32,90 |
| Rio de Janeiro — Centro | 20000000 | 20099999 | R$ 39,90 |

A faixa Centro — São Paulo é a da massa inicial: o CEP `01310100` é atendido por R$ 18,90, e o `69900000` continua fora de todas as faixas. Nenhuma faixa tem CEP em comum com outra.

| Número do pedido | Cliente | Situação | Data da confirmação | Itens | CEP de entrega | Faixa de frete | Valor do frete |
|---|---|---|---|---|---|---|---|
| 1001 | Ana Costa | Confirmado | 12/10/2026 | 2 × Caneca de cerâmica ACME 300 ml (R$ 39,90) · 1 × Camiseta ACME algodão — tamanho M (R$ 59,90) | 01310100 | Centro — São Paulo | R$ 18,90 |
| 1002 | Marcos Pereira | Confirmado | 14/10/2026 | 1 × Garrafa térmica ACME 500 ml (R$ 89,90) | 03105000 | Mooca — São Paulo | R$ 22,50 |
| 1003 | Ana Costa | Cancelado | 15/10/2026 | 3 × Bloco de notas ACME A5 (R$ 24,90) | 01310200 | Centro — São Paulo | R$ 18,90 |
| 1004 | Marcos Pereira | Aberto | — | 1 × Ecobag ACME de lona (R$ 34,90) | — | — | — |
| 1005 | Juliana Alves | Confirmado | 16/10/2026 | 1 × Boné ACME aba curva (R$ 49,90) | 13010000 | Campinas | R$ 32,90 |
| 1006 | Roberto Dias | Confirmado | 17/10/2026 | 4 × Caneta esferográfica ACME azul (R$ 6,90) · 1 × Chaveiro ACME de metal (R$ 14,90) | 05410000 | Pinheiros — São Paulo | R$ 21,00 |
| 1007 | Ana Costa | Aberto | — | 2 × Caneca de cerâmica ACME 300 ml · 1 × Camiseta ACME algodão — tamanho M · 1 × Garrafa térmica ACME 500 ml · 3 × Bloco de notas ACME A5 · 1 × Ecobag ACME de lona | — | — | — |

O pedido 1003 foi cancelado em 16/10/2026 por Carla Souza, com o motivo "Cliente desistiu da compra". Os pedidos 1004 e 1007 são os carrinhos de Marcos Pereira e de Ana Costa, ainda sem cotação de frete; o de Ana Costa é o carrinho dos protótipos do Carrinho e do Checkout, com R$ 339,20 em itens. A faixa Rio de Janeiro — Centro não atende nenhum pedido.
