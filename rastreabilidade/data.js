/* GERADO por scripts/build-trace-data.mjs — não editar à mão.
   Fonte: artefatos .md da instância (54 nós, 84 arestas). */
window.TRACE_DATA = {
  "meta": {
    "system": "Loja ACME",
    "subtitle": "índice de rastreabilidade gerado por scripts/build-trace-data.mjs",
    "generatedAt": "2026-10-31",
    "engineVersion": "9.1.0",
    "repo": "https://github.com/andromarcio/loja-acme-simulacao"
  },
  "nodes": [
    {
      "id": "N0",
      "type": "produto",
      "label": "Loja ACME",
      "sub": "Visão de Produto",
      "desc": "O cliente da ACME compra por telefone e só descobre o custo da entrega quando o pedido já foi fechado. A Loja ACME existe para que ele compre sozinho, a qual…",
      "path": "global/N0_PRODUCT_VISION.md"
    },
    {
      "id": "ADM",
      "type": "dominio",
      "label": "Administração",
      "sub": "Domínio · ADM",
      "desc": "Responde pela operação da Loja ACME: quem tem acesso e com que perfil, e quais faixas de CEP a loja atende, com o valor do frete de cada uma. Mantém os usuár…",
      "path": "modules/administracao/README.md"
    },
    {
      "id": "ADM-FRT",
      "type": "featureset",
      "label": "Faixas de Frete",
      "sub": "Agrupamento Funcional · ADM-FRT",
      "domain": "ADM",
      "desc": "Reúne as operações de manutenção das faixas de frete: pesquisar, cadastrar, editar, excluir e visualizar uma faixa de CEP com o valor da entrega. Permite ao …",
      "path": "modules/administracao/faixas-frete/README.md"
    },
    {
      "id": "ADM-USR",
      "type": "featureset",
      "label": "Usuários",
      "sub": "Agrupamento Funcional · ADM-USR",
      "domain": "ADM",
      "desc": "Reúne as operações de manutenção dos usuários da loja: pesquisar, cadastrar, editar, inativar e visualizar um usuário. Permite ao administrador definir quem …",
      "path": "modules/administracao/usuarios/README.md"
    },
    {
      "id": "CAT",
      "type": "dominio",
      "label": "Catálogo",
      "sub": "Domínio · CAT",
      "desc": "Responde pelos produtos que a Loja ACME vende e pelas categorias que os organizam, sendo a fonte única do que existe para vender. Mantém as categorias, com a…",
      "path": "modules/catalogo/README.md"
    },
    {
      "id": "CAT-CTG",
      "type": "featureset",
      "label": "Categorias",
      "sub": "Agrupamento Funcional · CAT-CTG",
      "domain": "CAT",
      "desc": "Reúne as operações de manutenção das categorias de produtos: pesquisar, cadastrar, editar, excluir e visualizar uma categoria. Permite ao gestor de catálogo …",
      "path": "modules/catalogo/categorias/README.md"
    },
    {
      "id": "CAT-PRD",
      "type": "featureset",
      "label": "Produtos",
      "sub": "Agrupamento Funcional · CAT-PRD",
      "domain": "CAT",
      "desc": "Cadastro dos produtos à venda; é o exercício STRY0013150 da mentoria",
      "path": "modules/catalogo/README.md"
    },
    {
      "id": "VND",
      "type": "dominio",
      "label": "Vendas",
      "sub": "Domínio · VND",
      "desc": "Vendas reúne o carrinho, o checkout e a gestão dos pedidos da Loja ACME. O cliente monta o carrinho com os produtos do Catálogo e conhece o valor da entrega …",
      "path": "modules/vendas/README.md"
    },
    {
      "id": "VND-CAR",
      "type": "featureset",
      "label": "Carrinho",
      "sub": "Agrupamento Funcional · VND-CAR",
      "domain": "VND",
      "desc": "Reúne as operações do cliente sobre os itens escolhidos antes da compra: adicionar um produto ao carrinho, ver os itens com o total, alterar a quantidade de …",
      "path": "modules/vendas/carrinho/README.md"
    },
    {
      "id": "VND-CHK",
      "type": "featureset",
      "label": "Checkout",
      "sub": "Agrupamento Funcional · VND-CHK",
      "domain": "VND",
      "desc": "Checkout é a etapa em que o cliente informa onde quer receber e consulta o valor da entrega antes de confirmar o pedido. O exemplo inicial cobre o cálculo do…",
      "path": "modules/vendas/checkout/README.md"
    },
    {
      "id": "VND-PED",
      "type": "featureset",
      "label": "Gestão de Pedidos",
      "sub": "Agrupamento Funcional · VND-PED",
      "domain": "VND",
      "desc": "Reúne as operações do atendimento sobre os pedidos já confirmados: pesquisar pedidos, ver o detalhe de um pedido e cancelá-lo. Permite ao atendente localizar…",
      "path": "modules/vendas/gestao-pedidos/README.md"
    },
    {
      "id": "VIT",
      "type": "dominio",
      "label": "Vitrine",
      "sub": "Domínio · VIT",
      "desc": "Responde pelo que a pessoa vê ao visitar a Loja ACME: os destaques da página inicial, a busca de produtos e a página de cada produto. Mantém os destaques, co…",
      "path": "modules/vitrine/README.md"
    },
    {
      "id": "VIT-DST",
      "type": "featureset",
      "label": "Destaques",
      "sub": "Agrupamento Funcional · VIT-DST",
      "domain": "VIT",
      "desc": "Reúne as operações de manutenção dos destaques da página inicial: pesquisar, cadastrar, editar, excluir e visualizar um destaque. Permite ao gestor de catálo…",
      "path": "modules/vitrine/destaques/README.md"
    },
    {
      "id": "VIT-NAV",
      "type": "featureset",
      "label": "Navegação",
      "sub": "Agrupamento Funcional · VIT-NAV",
      "domain": "VIT",
      "desc": "Reúne o que a pessoa faz ao visitar a loja: ver os destaques da página inicial, pesquisar produtos por nome ou categoria e abrir a página de um produto. Perm…",
      "path": "modules/vitrine/navegacao/README.md"
    },
    {
      "id": "ADM-FRT-02",
      "type": "feature",
      "label": "Cadastrar Faixa de Frete",
      "status": "spec",
      "pf": null,
      "sub": "Funcionalidade · ADM-FRT-02",
      "domain": "ADM",
      "desc": "Permite que o administrador cadastre uma faixa de CEP com o valor do frete, e os CEPs dela passam a ser atendidos no cálculo de frete do checkout.",
      "path": "modules/administracao/faixas-frete/f-cadastrar-faixa-frete.md"
    },
    {
      "id": "ADM-FRT-03",
      "type": "feature",
      "label": "Editar Faixa de Frete",
      "status": "spec",
      "pf": null,
      "sub": "Funcionalidade · ADM-FRT-03",
      "domain": "ADM",
      "desc": "Permite que o administrador altere o intervalo de CEP e o valor do frete de uma faixa, com a alteração valendo para os próximos cálculos de frete e os pedido…",
      "path": "modules/administracao/faixas-frete/f-editar-faixa-frete.md"
    },
    {
      "id": "ADM-FRT-04",
      "type": "feature",
      "label": "Excluir Faixa de Frete",
      "status": "spec",
      "pf": null,
      "sub": "Funcionalidade · ADM-FRT-04",
      "domain": "ADM",
      "desc": "Permite que o administrador exclua definitivamente uma faixa de frete que não atende pedidos, e os CEPs dela deixam de ser atendidos no cálculo de frete.",
      "path": "modules/administracao/faixas-frete/f-excluir-faixa-frete.md"
    },
    {
      "id": "ADM-FRT-01",
      "type": "feature",
      "label": "Pesquisar Faixas de Frete",
      "status": "spec",
      "pf": null,
      "sub": "Funcionalidade · ADM-FRT-01",
      "domain": "ADM",
      "desc": "Permite que o administrador e o atendente pesquisem as faixas de frete por parte da região ou por um CEP atendido, vendo o intervalo de CEP e o valor da entr…",
      "path": "modules/administracao/faixas-frete/f-pesquisar-faixa-frete.md"
    },
    {
      "id": "ADM-FRT-05",
      "type": "feature",
      "label": "Visualizar Faixa de Frete",
      "status": "spec",
      "pf": null,
      "sub": "Funcionalidade · ADM-FRT-05",
      "domain": "ADM",
      "desc": "Permite que o administrador e o atendente consultem todos os dados de uma faixa de frete, inclusive quantos pedidos ela atende, sem alterar nada.",
      "path": "modules/administracao/faixas-frete/f-visualizar-faixa-frete.md"
    },
    {
      "id": "ADM-USR-02",
      "type": "feature",
      "label": "Cadastrar Usuário",
      "status": "spec",
      "pf": null,
      "sub": "Funcionalidade · ADM-USR-02",
      "domain": "ADM",
      "desc": "Permite que o administrador cadastre um usuário da loja com nome completo, e-mail e perfil, deixando-o ativo e pronto para ser reconhecido pela loja.",
      "path": "modules/administracao/usuarios/f-cadastrar-usuario.md"
    },
    {
      "id": "ADM-USR-03",
      "type": "feature",
      "label": "Editar Usuário",
      "status": "spec",
      "pf": null,
      "sub": "Funcionalidade · ADM-USR-03",
      "domain": "ADM",
      "desc": "Permite que o administrador altere o nome completo, o CPF, o telefone e o perfil de um usuário ativo, mantendo o e-mail que o identifica.",
      "path": "modules/administracao/usuarios/f-editar-usuario.md"
    },
    {
      "id": "ADM-USR-04",
      "type": "feature",
      "label": "Inativar Usuário",
      "status": "spec",
      "pf": null,
      "sub": "Funcionalidade · ADM-USR-04",
      "domain": "ADM",
      "desc": "Permite que o administrador inative um usuário, tirando o acesso dele à loja sem apagá-lo dos pedidos e do histórico.",
      "path": "modules/administracao/usuarios/f-inativar-usuario.md"
    },
    {
      "id": "ADM-USR-01",
      "type": "feature",
      "label": "Pesquisar Usuários",
      "status": "spec",
      "pf": null,
      "sub": "Funcionalidade · ADM-USR-01",
      "domain": "ADM",
      "desc": "Permite que o administrador pesquise os usuários da loja por nome, e-mail, perfil e situação, vendo de cada um o perfil e se está ativo.",
      "path": "modules/administracao/usuarios/f-pesquisar-usuario.md"
    },
    {
      "id": "ADM-USR-05",
      "type": "feature",
      "label": "Visualizar Usuário",
      "status": "spec",
      "pf": null,
      "sub": "Funcionalidade · ADM-USR-05",
      "domain": "ADM",
      "desc": "Permite que o administrador consulte a ficha completa de um usuário, ativo ou inativo, com o perfil, a situação e, se inativo, quando e por que perdeu o acesso.",
      "path": "modules/administracao/usuarios/f-visualizar-usuario.md"
    },
    {
      "id": "CAT-CTG-02",
      "type": "feature",
      "label": "Cadastrar Categoria",
      "status": "spec",
      "pf": null,
      "sub": "Funcionalidade · CAT-CTG-02",
      "domain": "CAT",
      "desc": "Permite que o gestor de catálogo cadastre uma categoria de produtos de primeiro nível ou uma subcategoria, com nome único entre as categorias com a mesma cat…",
      "path": "modules/catalogo/categorias/f-cadastrar-categoria.md"
    },
    {
      "id": "CAT-CTG-03",
      "type": "feature",
      "label": "Editar Categoria",
      "status": "spec",
      "pf": null,
      "sub": "Funcionalidade · CAT-CTG-03",
      "domain": "CAT",
      "desc": "Permite que o gestor de catálogo altere a descrição, a situação e a categoria superior de uma categoria, mantendo o nome; ao inativá-la, os produtos diretame…",
      "path": "modules/catalogo/categorias/f-editar-categoria.md"
    },
    {
      "id": "CAT-CTG-04",
      "type": "feature",
      "label": "Excluir Categoria",
      "status": "spec",
      "pf": null,
      "sub": "Funcionalidade · CAT-CTG-04",
      "domain": "CAT",
      "desc": "Permite que o gestor de catálogo exclua definitivamente uma categoria que não tem produtos nem subcategorias, tirando-a do catálogo.",
      "path": "modules/catalogo/categorias/f-excluir-categoria.md"
    },
    {
      "id": "CAT-CTG-01",
      "type": "feature",
      "label": "Pesquisar Categorias",
      "status": "spec",
      "pf": null,
      "sub": "Funcionalidade · CAT-CTG-01",
      "domain": "CAT",
      "desc": "Permite que o gestor de catálogo pesquise as categorias de produtos pelo nome e pela situação, vendo de cada uma quantos produtos ela agrupa.",
      "path": "modules/catalogo/categorias/f-pesquisar-categoria.md"
    },
    {
      "id": "CAT-CTG-05",
      "type": "feature",
      "label": "Visualizar Categoria",
      "status": "spec",
      "pf": null,
      "sub": "Funcionalidade · CAT-CTG-05",
      "domain": "CAT",
      "desc": "Permite que o gestor de catálogo visualize todos os dados de uma categoria, sua categoria superior, suas subcategorias e quantos produtos diretamente vincula…",
      "path": "modules/catalogo/categorias/f-visualizar-categoria.md"
    },
    {
      "id": "VND-CAR-01",
      "type": "feature",
      "label": "Adicionar Item ao Carrinho",
      "status": "spec",
      "pf": null,
      "sub": "Funcionalidade · VND-CAR-01",
      "domain": "VND",
      "desc": "Permite que o cliente adicione um produto ao carrinho na quantidade escolhida, com o preço do momento em que o item entra.",
      "path": "modules/vendas/carrinho/f-adicionar-item-carrinho.md"
    },
    {
      "id": "VND-CAR-03",
      "type": "feature",
      "label": "Alterar Quantidade do Item",
      "status": "spec",
      "pf": null,
      "sub": "Funcionalidade · VND-CAR-03",
      "domain": "VND",
      "desc": "Permite que o cliente altere a quantidade de um item do carrinho, até a quantidade em estoque, com o subtotal e o total dos itens recalculados.",
      "path": "modules/vendas/carrinho/f-alterar-quantidade-item.md"
    },
    {
      "id": "VND-CAR-02",
      "type": "feature",
      "label": "Listar Itens do Carrinho",
      "status": "spec",
      "pf": null,
      "sub": "Funcionalidade · VND-CAR-02",
      "domain": "VND",
      "desc": "Permite que o cliente visualize os itens do seu carrinho, com o preço unitário, a quantidade e o subtotal de cada item e o total dos itens.",
      "path": "modules/vendas/carrinho/f-listar-item-carrinho.md"
    },
    {
      "id": "VND-CAR-04",
      "type": "feature",
      "label": "Remover Item do Carrinho",
      "status": "spec",
      "pf": null,
      "sub": "Funcionalidade · VND-CAR-04",
      "domain": "VND",
      "desc": "Permite que o cliente remova um item do carrinho, que deixa de contar no total dos itens.",
      "path": "modules/vendas/carrinho/f-remover-item-carrinho.md"
    },
    {
      "id": "VND-CHK-01",
      "type": "feature",
      "label": "Calcular Frete",
      "status": "spec",
      "pf": null,
      "sub": "Funcionalidade · VND-CHK-01",
      "domain": "VND",
      "desc": "Permite que o cliente calcule o frete do pedido pelo CEP de entrega, conhecendo o valor antes de confirmar a compra.",
      "path": "modules/vendas/checkout/f-calcular-frete.md"
    },
    {
      "id": "VND-PED-03",
      "type": "feature",
      "label": "Cancelar Pedido",
      "status": "spec",
      "pf": null,
      "sub": "Funcionalidade · VND-PED-03",
      "domain": "VND",
      "desc": "Permite que o atendente cancele um pedido confirmado quando o cliente pede, deixando registrados o motivo, a data e quem cancelou.",
      "path": "modules/vendas/gestao-pedidos/f-cancelar-pedido.md"
    },
    {
      "id": "VND-PED-01",
      "type": "feature",
      "label": "Pesquisar Pedidos",
      "status": "spec",
      "pf": null,
      "sub": "Funcionalidade · VND-PED-01",
      "domain": "VND",
      "desc": "Permite que o atendente encontre os pedidos confirmados e cancelados dos clientes por número, cliente, situação e período da confirmação, vendo o total de ca…",
      "path": "modules/vendas/gestao-pedidos/f-pesquisar-pedido.md"
    },
    {
      "id": "VND-PED-02",
      "type": "feature",
      "label": "Visualizar Pedido",
      "status": "spec",
      "pf": null,
      "sub": "Funcionalidade · VND-PED-02",
      "domain": "VND",
      "desc": "Permite que o atendente veja o pedido completo de um cliente — itens, entrega, frete, total e situação —, com o motivo, a data e o responsável quando o pedid…",
      "path": "modules/vendas/gestao-pedidos/f-visualizar-pedido.md"
    },
    {
      "id": "VIT-DST-02",
      "type": "feature",
      "label": "Cadastrar Destaque",
      "status": "spec",
      "pf": null,
      "sub": "Funcionalidade · VIT-DST-02",
      "domain": "VIT",
      "desc": "Permite que o gestor de catálogo ponha um produto em destaque na página inicial da loja, com uma chamada, a ordem de exibição e o período em que o destaque f…",
      "path": "modules/vitrine/destaques/f-cadastrar-destaque.md"
    },
    {
      "id": "VIT-DST-03",
      "type": "feature",
      "label": "Editar Destaque",
      "status": "spec",
      "pf": null,
      "sub": "Funcionalidade · VIT-DST-03",
      "domain": "VIT",
      "desc": "Permite que o gestor de catálogo altere a chamada, a ordem de exibição e a vigência de um destaque que ainda não terminou, sem trocar o produto em destaque.",
      "path": "modules/vitrine/destaques/f-editar-destaque.md"
    },
    {
      "id": "VIT-DST-04",
      "type": "feature",
      "label": "Excluir Destaque",
      "status": "spec",
      "pf": null,
      "sub": "Funcionalidade · VIT-DST-04",
      "domain": "VIT",
      "desc": "Permite que o gestor de catálogo exclua um destaque, que sai na hora da página inicial da loja e da pesquisa de destaques.",
      "path": "modules/vitrine/destaques/f-excluir-destaque.md"
    },
    {
      "id": "VIT-DST-01",
      "type": "feature",
      "label": "Pesquisar Destaques",
      "status": "spec",
      "pf": null,
      "sub": "Funcionalidade · VIT-DST-01",
      "domain": "VIT",
      "desc": "Permite que o gestor de catálogo encontre os destaques da página inicial pelo produto e pela situação, vendo de relance o que está no ar, o que vai entrar e …",
      "path": "modules/vitrine/destaques/f-pesquisar-destaque.md"
    },
    {
      "id": "VIT-DST-05",
      "type": "feature",
      "label": "Visualizar Destaque",
      "status": "spec",
      "pf": null,
      "sub": "Funcionalidade · VIT-DST-05",
      "domain": "VIT",
      "desc": "Permite que o gestor de catálogo consulte todos os dados de um destaque — produto, chamada, ordem, vigência, situação e data de cadastro — sem risco de alter…",
      "path": "modules/vitrine/destaques/f-visualizar-destaque.md"
    },
    {
      "id": "VIT-NAV-01",
      "type": "feature",
      "label": "Listar Destaques",
      "status": "spec",
      "pf": null,
      "sub": "Funcionalidade · VIT-NAV-01",
      "domain": "VIT",
      "desc": "Permite que a pessoa que visita a loja veja, na página inicial, os produtos em destaque vigentes, com a chamada, o preço e a disponibilidade de cada um, na o…",
      "path": "modules/vitrine/navegacao/f-listar-destaque.md"
    },
    {
      "id": "VIT-NAV-02",
      "type": "feature",
      "label": "Pesquisar Produtos na Vitrine",
      "status": "spec",
      "pf": null,
      "sub": "Funcionalidade · VIT-NAV-02",
      "domain": "VIT",
      "desc": "Permite que a pessoa que visita a loja pesquise os produtos à venda por parte do nome e por categoria, vendo o nome, a categoria, o preço e a disponibilidade…",
      "path": "modules/vitrine/navegacao/f-pesquisar-produto-vitrine.md"
    },
    {
      "id": "VIT-NAV-03",
      "type": "feature",
      "label": "Visualizar Produto na Vitrine",
      "status": "spec",
      "pf": null,
      "sub": "Funcionalidade · VIT-NAV-03",
      "domain": "VIT",
      "desc": "Permite que a pessoa que visita a loja abra a página de um produto e veja o nome, a descrição, a categoria, o preço e se há estoque, sabendo quanto vai pagar…",
      "path": "modules/vitrine/navegacao/f-visualizar-produto-vitrine.md"
    },
    {
      "id": "STRY0013101",
      "type": "aim",
      "label": "Calcular frete no checkout",
      "sub": "AIMM · STRY0013101",
      "desc": "Como cliente, quero informar o CEP no checkout e ver o valor do frete, para saber quanto vou pagar pela entrega antes de fechar o pedido.",
      "path": "analise-impacto/AIMM-STRY0013101.md"
    },
    {
      "id": "STRY0013170",
      "type": "aim",
      "label": "Categorias de produtos",
      "sub": "AIMM · STRY0013170",
      "desc": "A equipe de vendas precisa organizar os produtos da loja em categorias, para que o cliente encontre o que procura: pesquisar, cadastrar, alterar, excluir e c…",
      "path": "analise-impacto/AIMM-STRY0013170.md"
    },
    {
      "id": "STRY0013175",
      "type": "aim",
      "label": "Navegar pela vitrine",
      "sub": "AIMM · STRY0013175",
      "desc": "Como visitante da loja, quero ver os destaques, pesquisar produtos e abrir a página de um produto, para encontrar o que quero comprar e saber quanto custa.",
      "path": "analise-impacto/AIMM-STRY0013175.md"
    },
    {
      "id": "STRY0013180",
      "type": "aim",
      "label": "Destaques da página inicial",
      "sub": "AIMM · STRY0013180",
      "desc": "A equipe de vendas precisa escolher quais produtos aparecem em destaque na página inicial da loja, com uma chamada, a ordem e o período em que cada destaque …",
      "path": "analise-impacto/AIMM-STRY0013180.md"
    },
    {
      "id": "STRY0013185",
      "type": "aim",
      "label": "Carrinho de compras",
      "sub": "AIMM · STRY0013185",
      "desc": "Como cliente, quero colocar produtos no carrinho, ver o que escolhi, mudar quantidades e tirar itens, para fechar a compra só com o que quero.",
      "path": "analise-impacto/AIMM-STRY0013185.md"
    },
    {
      "id": "STRY0013190",
      "type": "aim",
      "label": "Atendimento de pedidos",
      "sub": "AIMM · STRY0013190",
      "desc": "Como atendente, quero encontrar os pedidos dos clientes, ver o detalhe de cada um e cancelar um pedido quando o cliente pedir, registrando o motivo.",
      "path": "analise-impacto/AIMM-STRY0013190.md"
    },
    {
      "id": "STRY0013195",
      "type": "aim",
      "label": "Usuários da loja",
      "sub": "AIMM · STRY0013195",
      "desc": "O administrador precisa manter os usuários da loja — clientes, atendentes, gestores de catálogo e administradores — e tirar o acesso de quem não deve mais us…",
      "path": "analise-impacto/AIMM-STRY0013195.md"
    },
    {
      "id": "STRY0013200",
      "type": "aim",
      "label": "Faixas de frete",
      "sub": "AIMM · STRY0013200",
      "desc": "O administrador precisa manter as faixas de CEP atendidas e o valor do frete de cada uma, sem depender da equipe de sistemas para mudar a tabela.",
      "path": "analise-impacto/AIMM-STRY0013200.md"
    },
    {
      "id": "STRY0013205",
      "type": "aim",
      "label": "Subcategorias",
      "sub": "AIMM · STRY0013205",
      "desc": "A equipe de vendas precisa dividir as categorias em subcategorias — por exemplo, Canecas e Garrafas dentro de Cozinha —, para que o cliente refine a busca se…",
      "path": "analise-impacto/AIMM-STRY0013205.md"
    }
  ],
  "edges": [
    {
      "from": "N0",
      "to": "ADM",
      "kind": "contem"
    },
    {
      "from": "ADM",
      "to": "ADM-FRT",
      "kind": "contem"
    },
    {
      "from": "ADM",
      "to": "ADM-USR",
      "kind": "contem"
    },
    {
      "from": "N0",
      "to": "CAT",
      "kind": "contem"
    },
    {
      "from": "CAT",
      "to": "CAT-CTG",
      "kind": "contem"
    },
    {
      "from": "CAT",
      "to": "CAT-PRD",
      "kind": "contem"
    },
    {
      "from": "N0",
      "to": "VND",
      "kind": "contem"
    },
    {
      "from": "VND",
      "to": "VND-CAR",
      "kind": "contem"
    },
    {
      "from": "VND",
      "to": "VND-CHK",
      "kind": "contem"
    },
    {
      "from": "VND",
      "to": "VND-PED",
      "kind": "contem"
    },
    {
      "from": "N0",
      "to": "VIT",
      "kind": "contem"
    },
    {
      "from": "VIT",
      "to": "VIT-DST",
      "kind": "contem"
    },
    {
      "from": "VIT",
      "to": "VIT-NAV",
      "kind": "contem"
    },
    {
      "from": "VND",
      "to": "ADM",
      "kind": "integra",
      "note": "lê Usuario (Nome completo, E-mail)"
    },
    {
      "from": "VIT",
      "to": "CAT",
      "kind": "integra",
      "note": "lê Produto (Nome do produto, Descrição, Preço, Quantidade em estoque, Categoria) e Categoria (Nome da categoria, Situação, Categoria superior)"
    },
    {
      "from": "VND",
      "to": "CAT",
      "kind": "integra",
      "note": "lê Produto (Nome do produto, Preço, Quantidade em estoque)"
    },
    {
      "from": "ADM",
      "to": "VND",
      "kind": "integra",
      "note": "lê Pedido (Faixa de frete)"
    },
    {
      "from": "ADM-FRT",
      "to": "ADM-FRT-02",
      "kind": "contem"
    },
    {
      "from": "STRY0013200",
      "to": "ADM-FRT-02",
      "kind": "origina",
      "note": "`CA-2` — cadastro da faixa com região, CEP inicial, CEP final e valor do frete, "
    },
    {
      "from": "ADM-FRT",
      "to": "ADM-FRT-03",
      "kind": "contem"
    },
    {
      "from": "STRY0013200",
      "to": "ADM-FRT-03",
      "kind": "origina",
      "note": "`CA-3` — alteração do intervalo e do valor da faixa, valendo para os próximos cá"
    },
    {
      "from": "ADM-FRT",
      "to": "ADM-FRT-04",
      "kind": "contem"
    },
    {
      "from": "STRY0013200",
      "to": "ADM-FRT-04",
      "kind": "origina",
      "note": "`CA-4` — exclusão da faixa de frete, bloqueada quando a faixa é usada em pedidos"
    },
    {
      "from": "ADM-FRT",
      "to": "ADM-FRT-01",
      "kind": "contem"
    },
    {
      "from": "STRY0013200",
      "to": "ADM-FRT-01",
      "kind": "origina",
      "note": "`CA-1` — pesquisa das faixas por região ou por um CEP que elas atendem"
    },
    {
      "from": "ADM-FRT",
      "to": "ADM-FRT-05",
      "kind": "contem"
    },
    {
      "from": "STRY0013200",
      "to": "ADM-FRT-05",
      "kind": "origina",
      "note": "`CA-5` — consulta de todos os dados de uma faixa de frete"
    },
    {
      "from": "ADM-USR",
      "to": "ADM-USR-02",
      "kind": "contem"
    },
    {
      "from": "STRY0013195",
      "to": "ADM-USR-02",
      "kind": "origina",
      "note": "`CA-2` — cadastro com nome completo, e-mail e perfil, CPF e telefone opcionais, "
    },
    {
      "from": "ADM-USR",
      "to": "ADM-USR-03",
      "kind": "contem"
    },
    {
      "from": "STRY0013195",
      "to": "ADM-USR-03",
      "kind": "origina",
      "note": "`CA-3` — alteração de nome, CPF, telefone e perfil, sem mudar o e-mail e sem dei"
    },
    {
      "from": "ADM-USR",
      "to": "ADM-USR-04",
      "kind": "contem"
    },
    {
      "from": "STRY0013195",
      "to": "ADM-USR-04",
      "kind": "origina",
      "note": "`CA-4` — inativação que tira o acesso e mantém o usuário nos pedidos, sem que o "
    },
    {
      "from": "ADM-USR",
      "to": "ADM-USR-01",
      "kind": "contem"
    },
    {
      "from": "STRY0013195",
      "to": "ADM-USR-01",
      "kind": "origina",
      "note": "`CA-1` — pesquisa de usuários por nome, e-mail, perfil e situação"
    },
    {
      "from": "ADM-USR",
      "to": "ADM-USR-05",
      "kind": "contem"
    },
    {
      "from": "STRY0013195",
      "to": "ADM-USR-05",
      "kind": "origina",
      "note": "`CA-5` — consulta de todos os dados de um usuário"
    },
    {
      "from": "CAT-CTG",
      "to": "CAT-CTG-02",
      "kind": "contem"
    },
    {
      "from": "STRY0013170",
      "to": "CAT-CTG-02",
      "kind": "origina",
      "note": "`CA-2` — cadastro com nome e descrição opcional, sem nomes repetidos"
    },
    {
      "from": "STRY0013205",
      "to": "CAT-CTG-02",
      "kind": "origina",
      "note": "`CA-1, CA-3` — categoria superior no cadastro e nome único entre as categorias c"
    },
    {
      "from": "CAT-CTG",
      "to": "CAT-CTG-03",
      "kind": "contem"
    },
    {
      "from": "STRY0013170",
      "to": "CAT-CTG-03",
      "kind": "origina",
      "note": "`CA-3` — alteração da descrição e da situação, sem mudar o nome; categoria inati"
    },
    {
      "from": "STRY0013205",
      "to": "CAT-CTG-03",
      "kind": "origina",
      "note": "`CA-2, CA-3` — trocar ou retirar a categoria superior, sem hierarquia inválida n"
    },
    {
      "from": "CAT-CTG",
      "to": "CAT-CTG-04",
      "kind": "contem"
    },
    {
      "from": "STRY0013170",
      "to": "CAT-CTG-04",
      "kind": "origina",
      "note": "`CA-4` — categoria com produtos não pode ser excluída"
    },
    {
      "from": "STRY0013205",
      "to": "CAT-CTG-04",
      "kind": "origina",
      "note": "`CA-4` — categoria com subcategorias não pode ser excluída (AIMM em análise, sem"
    },
    {
      "from": "CAT-CTG",
      "to": "CAT-CTG-01",
      "kind": "contem"
    },
    {
      "from": "STRY0013170",
      "to": "CAT-CTG-01",
      "kind": "origina",
      "note": "`CA-1` — pesquisa das categorias por nome e por situação"
    },
    {
      "from": "CAT-CTG",
      "to": "CAT-CTG-05",
      "kind": "contem"
    },
    {
      "from": "STRY0013170",
      "to": "CAT-CTG-05",
      "kind": "origina",
      "note": "`CA-5` — consulta aos dados da categoria e à quantidade de produtos"
    },
    {
      "from": "STRY0013205",
      "to": "CAT-CTG-05",
      "kind": "origina",
      "note": "`CA-5` — categoria superior e subcategorias na consulta (AIMM em análise, sem av"
    },
    {
      "from": "VND-CAR",
      "to": "VND-CAR-01",
      "kind": "contem"
    },
    {
      "from": "STRY0013185",
      "to": "VND-CAR-01",
      "kind": "origina",
      "note": "`CA-1` — adicionar o produto ao carrinho na quantidade escolhida, somando quando"
    },
    {
      "from": "VND-CAR",
      "to": "VND-CAR-03",
      "kind": "contem"
    },
    {
      "from": "STRY0013185",
      "to": "VND-CAR-03",
      "kind": "origina",
      "note": "`CA-3` — mudar a quantidade de um item sem passar da quantidade em estoque"
    },
    {
      "from": "VND-CAR",
      "to": "VND-CAR-02",
      "kind": "contem"
    },
    {
      "from": "STRY0013185",
      "to": "VND-CAR-02",
      "kind": "origina",
      "note": "`CA-2` — mostrar cada item com preço unitário, quantidade e subtotal, e o total "
    },
    {
      "from": "VND-CAR",
      "to": "VND-CAR-04",
      "kind": "contem"
    },
    {
      "from": "STRY0013185",
      "to": "VND-CAR-04",
      "kind": "origina",
      "note": "`CA-4` — remover um item do carrinho"
    },
    {
      "from": "VND-CHK",
      "to": "VND-CHK-01",
      "kind": "contem"
    },
    {
      "from": "STRY0013101",
      "to": "VND-CHK-01",
      "kind": "origina",
      "note": "`CA-1, CA-2, CA-3` — valor do frete pelo CEP, CEP inválido e CEP fora da área"
    },
    {
      "from": "VND-PED",
      "to": "VND-PED-03",
      "kind": "contem"
    },
    {
      "from": "STRY0013190",
      "to": "VND-PED-03",
      "kind": "origina",
      "note": "`CA-3` — cancelamento só de pedido confirmado, com o motivo obrigatório"
    },
    {
      "from": "VND-PED",
      "to": "VND-PED-01",
      "kind": "contem"
    },
    {
      "from": "STRY0013190",
      "to": "VND-PED-01",
      "kind": "origina",
      "note": "`CA-1` — pesquisa dos pedidos por número, cliente, situação e período da confirm"
    },
    {
      "from": "VND-PED",
      "to": "VND-PED-02",
      "kind": "contem"
    },
    {
      "from": "STRY0013190",
      "to": "VND-PED-02",
      "kind": "origina",
      "note": "`CA-2` — detalhe do pedido com o cliente, os itens, o CEP de entrega, o frete, o"
    },
    {
      "from": "VIT-DST",
      "to": "VIT-DST-02",
      "kind": "contem"
    },
    {
      "from": "STRY0013180",
      "to": "VIT-DST-02",
      "kind": "origina",
      "note": "`CA-2` — cadastro com produto, chamada, ordem e vigência, com o fim não anterior"
    },
    {
      "from": "VIT-DST",
      "to": "VIT-DST-03",
      "kind": "contem"
    },
    {
      "from": "STRY0013180",
      "to": "VIT-DST-03",
      "kind": "origina",
      "note": "`CA-3` — alteração da chamada, da ordem e do período, sem trocar o produto; dest"
    },
    {
      "from": "VIT-DST",
      "to": "VIT-DST-04",
      "kind": "contem"
    },
    {
      "from": "STRY0013180",
      "to": "VIT-DST-04",
      "kind": "origina",
      "note": "`CA-4` — exclusão do destaque, que sai da página inicial"
    },
    {
      "from": "VIT-DST",
      "to": "VIT-DST-01",
      "kind": "contem"
    },
    {
      "from": "STRY0013180",
      "to": "VIT-DST-01",
      "kind": "origina",
      "note": "`CA-1` — pesquisa dos destaques por produto e por situação (programado, vigente "
    },
    {
      "from": "VIT-DST",
      "to": "VIT-DST-05",
      "kind": "contem"
    },
    {
      "from": "STRY0013180",
      "to": "VIT-DST-05",
      "kind": "origina",
      "note": "`CA-5` — consulta de todos os dados de um destaque"
    },
    {
      "from": "VIT-NAV",
      "to": "VIT-NAV-01",
      "kind": "contem"
    },
    {
      "from": "STRY0013175",
      "to": "VIT-NAV-01",
      "kind": "origina",
      "note": "`CA-1` — página inicial com os destaques vigentes, na ordem definida pela equipe"
    },
    {
      "from": "VIT-NAV",
      "to": "VIT-NAV-02",
      "kind": "contem"
    },
    {
      "from": "STRY0013175",
      "to": "VIT-NAV-02",
      "kind": "origina",
      "note": "`CA-2` — busca por parte do nome, filtro por categoria e produtos de categoria i"
    },
    {
      "from": "STRY0013205",
      "to": "VIT-NAV-02",
      "kind": "origina",
      "note": "`CA-6` — o filtro por categoria inclui as subcategorias (AIMM em análise, sem av"
    },
    {
      "from": "VIT-NAV",
      "to": "VIT-NAV-03",
      "kind": "contem"
    },
    {
      "from": "STRY0013175",
      "to": "VIT-NAV-03",
      "kind": "origina",
      "note": "`CA-3` — página do produto com nome, descrição, categoria e preço, e o produto s"
    }
  ]
};
