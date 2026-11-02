# Backlog da mentoria — ServiceNow da Acme (fictício)

Os tickets abaixo fazem o papel do ServiceNow: é daqui que você copia a descrição e os critérios de aceite para a AIMM de cada ticket, **como estão escritos** — transcrição, não formulação. O mentor faz o papel da PO: é com ele que você elicita o que o ticket não diz e é ele quem avaliza o escopo.

Os três primeiros formam a sprint SP07 e são os mesmos do simulador (`mentoria/simulador.html`). Os dois seguintes são para praticar sem o roteiro do simulador. Os da última seção já estão especificados no exemplo: servem de consulta, para comparar cada ticket com a AIMM e as funcionalidades que ele originou. O STRY0013205 tem só a AIMM, em análise e sem aval: mostra o que uma alteração no modelo de entidades leva para a AIMM antes de qualquer funcionalidade mudar.

## Sprint SP07

### STRY0013101 — Calcular frete no checkout

> Como cliente, quero informar o CEP no checkout e ver o valor do frete, para saber quanto vou pagar pela entrega antes de fechar o pedido.

| Critério | Descrição |
|---|---|
| CA-1 | Dado que o carrinho tem itens, quando o cliente informa um CEP atendido, o sistema mostra o valor do frete. |
| CA-2 | Quando o cliente informa um CEP com menos de 8 dígitos, o sistema avisa que o CEP é inválido. |
| CA-3 | Quando o cliente informa um CEP não atendido, o sistema avisa que não entrega nesse CEP. |

### STRY0013120 — Prazo de entrega estimado

> Como cliente, quero ver o prazo de entrega estimado junto com o valor do frete, para decidir a compra sabendo quando o pedido chega.

| Critério | Descrição |
|---|---|
| CA-1 | Quando o cliente calcula o frete de um CEP atendido, o sistema mostra o valor e o prazo em dias úteis. |
| CA-2 | Quando a faixa do CEP não tem prazo cadastrado, o sistema mostra o valor e avisa que o prazo será informado por e-mail. |
| CA-3 | Quando o cliente abre o resumo antes de confirmar, o resumo mostra o prazo prometido. |

### STRY0013135 — Cupom de desconto

> Como cliente, quero aplicar um cupom de desconto no checkout, para pagar menos pelo pedido.

| Critério | Descrição |
|---|---|
| CA-1 | Quando o cliente aplica um cupom válido, o total mostra o desconto. |

Este ticket **não será entregue** na SP07: no fechamento, o mentor avisa, e você o tira da branch com o `reverte-ticket`.

## Para praticar depois da SP07

### STRY0013150 — Cadastro de produtos

> A equipe de vendas precisa manter o catálogo de produtos no próprio site: cadastrar, consultar, editar e retirar de venda os produtos, com nome, preço e quantidade em estoque.

| Critério | Descrição |
|---|---|
| CA-1 | O produto é cadastrado com nome, preço e quantidade em estoque; os três são obrigatórios. |
| CA-2 | Não pode haver dois produtos com o mesmo nome. |
| CA-3 | O produto retirado de venda não aparece mais na loja, mas continua nos pedidos antigos. |

O que este ticket exercita: o Agrupamento Funcional Produtos (`CAT-PRD`), planejado no N1 Catálogo, pela opção **CR** (CRUD padrão), e a fronteira entre "retirar de venda" e "excluir". A entidade Produto já existe no modelo de entidades, porque a Vitrine, os Destaques e o Carrinho a leem: o "retirar de venda" do CA-3 muda o que essas funcionalidades mostram e aceitam, e a AIMM tem de dizer quais delas o ticket altera.

### STRY0013165 — Frete grátis

Descrição no ServiceNow:

> Pedidos acima de R$ 200,00 não pagam frete. A regra vale para todos os CEPs atendidos. O cliente precisa ver que ganhou o frete grátis.

Critérios de aceite (como estão no ticket, sem numeração):

- frete zerado quando o total dos itens passa de R$ 200,00
- mensagem avisando que o frete é grátis
- CEP não atendido continua não atendido, mesmo acima de R$ 200,00

O que este ticket exercita: alteração de uma funcionalidade que já existe (4A), regra de negócio que é invariante e reação que vira cenário, mensagem nova no MESSAGE-DICTIONARY e, sobretudo, a **numeração**: a fonte não numera os critérios, então a AIMM declara isso e a coluna `CA-n` sai `—`. Número inventado não vale.

## AIMM em análise

### STRY0013205 — Subcategorias

> A equipe de vendas precisa dividir as categorias em subcategorias — por exemplo, Canecas e Garrafas dentro de Cozinha —, para que o cliente refine a busca sem que a lista de categorias cresça sem ordem. Basta um nível: uma subcategoria não tem subcategorias.

| Critério | Descrição |
|---|---|
| CA-1 | Ao cadastrar uma categoria, a equipe pode escolher a categoria superior, entre as categorias que não são subcategorias. |
| CA-2 | Ao editar uma categoria, a equipe pode trocar ou retirar a categoria superior; uma categoria que tem subcategorias não pode passar a ser subcategoria. |
| CA-3 | Duas subcategorias da mesma categoria superior não podem ter o mesmo nome; com categorias superiores diferentes, podem. |
| CA-4 | Categoria com subcategorias não pode ser excluída. |
| CA-5 | Ao consultar uma categoria, a equipe vê a categoria superior e as subcategorias dela. |
| CA-6 | Na vitrine, ao filtrar a busca por uma categoria, aparecem também os produtos das subcategorias dela. |

O que este ticket exercita: a seção `## Entidades alteradas` da AIMM. O ticket não cria funcionalidade; altera cinco e muda a entidade Categoria — um atributo novo, um relacionamento da categoria com ela mesma e a regra de nome único, que deixa de valer para todas as categorias. No perfil `requisitos`, a alteração é descrita em Label PO, sem tabela nem coluna de banco.

## Já especificados no exemplo

Cada ticket abaixo tem a sua AIMM em `analise-impacto/` e originou um Agrupamento Funcional inteiro, com a contagem pendente. As funcionalidades estão especificadas, menos as cinco que a STRY0013205 ainda vai alterar.

### STRY0013170 — Categorias de produtos

> A equipe de vendas precisa organizar os produtos da loja em categorias, para que o cliente encontre o que procura: pesquisar, cadastrar, alterar, excluir e consultar as categorias.

| Critério | Descrição |
|---|---|
| CA-1 | A equipe pesquisa as categorias por nome e por situação. |
| CA-2 | A categoria é cadastrada com nome e uma descrição opcional; não pode haver duas categorias com o mesmo nome. |
| CA-3 | A equipe altera a descrição e a situação da categoria, mas não o nome; os produtos de uma categoria inativa deixam de aparecer na vitrine. |
| CA-4 | Categoria com produtos não pode ser excluída. |
| CA-5 | A equipe consulta os dados de uma categoria e quantos produtos ela tem. |

### STRY0013175 — Navegar pela vitrine

> Como visitante da loja, quero ver os destaques, pesquisar produtos e abrir a página de um produto, para encontrar o que quero comprar e saber quanto custa.

| Critério | Descrição |
|---|---|
| CA-1 | Na página inicial, o sistema mostra os destaques vigentes, na ordem definida pela equipe de vendas. |
| CA-2 | O visitante pesquisa produtos por parte do nome e pode filtrar por categoria; produtos de categoria inativa não aparecem. |
| CA-3 | Ao abrir um produto, o sistema mostra nome, descrição, categoria e preço; o produto sem estoque aparece como esgotado. |

### STRY0013180 — Destaques da página inicial

> A equipe de vendas precisa escolher quais produtos aparecem em destaque na página inicial da loja, com uma chamada, a ordem e o período em que cada destaque fica no ar.

| Critério | Descrição |
|---|---|
| CA-1 | A equipe pesquisa os destaques por produto e por situação (programado, vigente ou encerrado). |
| CA-2 | O destaque é cadastrado com produto, chamada, ordem de exibição e período de vigência; o fim não pode ser anterior ao início, e o mesmo produto não pode ter dois destaques no mesmo período. |
| CA-3 | A equipe altera a chamada, a ordem e o período de um destaque, mas não troca o produto; destaque encerrado não pode ser alterado. |
| CA-4 | A equipe exclui um destaque, que sai da página inicial. |
| CA-5 | A equipe consulta todos os dados de um destaque. |

### STRY0013185 — Carrinho de compras

> Como cliente, quero colocar produtos no carrinho, ver o que escolhi, mudar quantidades e tirar itens, para fechar a compra só com o que quero.

| Critério | Descrição |
|---|---|
| CA-1 | Na página do produto, o cliente escolhe a quantidade e adiciona o produto ao carrinho; se o produto já está no carrinho, a quantidade é somada. |
| CA-2 | O carrinho mostra cada item com o preço unitário, a quantidade e o subtotal, e o total dos itens. |
| CA-3 | O cliente muda a quantidade de um item, sem passar da quantidade em estoque. |
| CA-4 | O cliente remove um item do carrinho. |

### STRY0013190 — Atendimento de pedidos

> Como atendente, quero encontrar os pedidos dos clientes, ver o detalhe de cada um e cancelar um pedido quando o cliente pedir, registrando o motivo.

| Critério | Descrição |
|---|---|
| CA-1 | O atendente pesquisa pedidos por número, cliente, situação e período da confirmação. |
| CA-2 | O detalhe do pedido mostra o cliente, os itens, o CEP de entrega, o frete, o total e a situação. |
| CA-3 | Só pedido confirmado pode ser cancelado, e o motivo é obrigatório. |

### STRY0013195 — Usuários da loja

> O administrador precisa manter os usuários da loja — clientes, atendentes, gestores de catálogo e administradores — e tirar o acesso de quem não deve mais usar a loja, sem apagar o histórico.

| Critério | Descrição |
|---|---|
| CA-1 | O administrador pesquisa usuários por nome, e-mail, perfil e situação. |
| CA-2 | O usuário é cadastrado com nome completo, e-mail e perfil, e opcionalmente CPF e telefone; e-mail e CPF não se repetem. |
| CA-3 | O administrador altera o nome, o CPF, o telefone e o perfil do usuário; o e-mail não muda, e a loja nunca fica sem um administrador ativo. |
| CA-4 | O usuário inativado perde o acesso, mas continua nos pedidos; o administrador não pode inativar o próprio usuário. |
| CA-5 | O administrador consulta todos os dados de um usuário. |

### STRY0013200 — Faixas de frete

> O administrador precisa manter as faixas de CEP atendidas e o valor do frete de cada uma, sem depender da equipe de sistemas para mudar a tabela.

| Critério | Descrição |
|---|---|
| CA-1 | O administrador pesquisa as faixas por região ou por um CEP que elas atendem. |
| CA-2 | A faixa é cadastrada com região, CEP inicial, CEP final e valor do frete; duas faixas não podem ter CEPs em comum. |
| CA-3 | O administrador altera o intervalo e o valor da faixa; a mudança vale para os próximos cálculos, não para os pedidos já feitos. |
| CA-4 | Faixa usada em pedidos não pode ser excluída. |
| CA-5 | O administrador consulta todos os dados de uma faixa. |
