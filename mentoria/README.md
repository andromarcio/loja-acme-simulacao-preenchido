<!-- docqui: 7.0.0 | prompt: MIGRA_NIVEIS | atualizado: 2026-10-21 -->
# Demonstração — Loja ACME

Esta instância é um exemplo preenchido do perfil **requisitos**, pronto para apresentar o método e praticar os checkpoints. O [simulador](simulador.html) mostra o processo completo; selecione **requisitos** no topo.

## O que já está preenchido

Quatro Domínios estão preenchidos, com 31 funcionalidades, 25 delas especificadas:

- **Catálogo** (`CAT`): Categorias (`CAT-CTG`), CRUD completo com cadastro, edição e visualização em modal. Produtos (`CAT-PRD`) fica planejado: é o exercício STRY0013150.
- **Vitrine** (`VIT`): Navegação (`VIT-NAV`), aberta a quem visita, e Destaques (`VIT-DST`), CRUD completo com período de vigência.
- **Vendas** (`VND`): Carrinho (`VND-CAR`), Checkout (`VND-CHK`), com **VND-CHK-01 — Calcular Frete**, e Gestão de Pedidos (`VND-PED`).
- **Administração** (`ADM`): Usuários (`ADM-USR`), CRUD com inativação no lugar da exclusão, e Faixas de Frete (`ADM-FRT`), CRUD da tabela que o Calcular Frete usa.

Cada Agrupamento Funcional nasceu de um ticket fictício (STRY0013101 e STRY0013170 a STRY0013200, no [backlog](backlog.md)), tem a sua AIMM e o seu protótipo de fluxo, e cada funcionalidade está ligada ao ticket nos três lugares: a N3, a AIMM e o INDEX. O modelo de entidades tem Categoria, Produto, Destaque, Pedido, ItemPedido, TabelaFrete e Usuario, com massa fictícia; os dicionários têm as entradas canônicas que as funcionalidades citam, como CEP, Quantidade e RC-09 — Registro vinculado não pode ser excluído.

Em 2026-10-21, Andro Márcio aprovou o CP1 e o CP2 juntos em 25 funcionalidades, num PR só. VND-CHK-01 — Calcular Frete segue em rascunho, para percorrer a sprint SP07, e CAT-CTG-02 a CAT-CTG-05 e VIT-NAV-02 também, até a AIMM da STRY0013205 ter aval. A existência do material não equivale a aprovação: o que está especificado tem `por` e `em` no front-matter. Ana, Rui e Bruno são personagens do simulador, não usuários que deram aprovação neste repositório.

## Roteiro de apresentação

1. Abra o N0 e mostre a fronteira entre Vendas e Catálogo.
2. Navegue pelo N1 Vendas e pelo N2 Checkout; mostre que permissões ficam apenas no N2.
3. Abra a AIMM STRY0013101 e siga o link para **VND-CHK-01 — Calcular Frete**.
4. Compare CA-1, CA-2 e CA-3 com RN-01, RN-02, RN-03 e seus cenários marcados.
5. Abra o modelo de entidades e a entrada CEP no FIELD-DICTIONARY; nenhum schema de banco é necessário.
6. Compare dois CRUDs completos: Categorias, em modal, e Faixas de Frete, em telas próprias. As cinco operações nascem do Cadastrar; a exclusão bloqueada cita a regra canônica RC-09, e Usuários troca a exclusão pela inativação.
7. Siga as relações entre domínios: a faixa mantida em Faixas de Frete é a que o Calcular Frete usa, a categoria inativada no Catálogo some da Vitrine e o carrinho é o pedido aberto que a Gestão de Pedidos acompanha depois de confirmado.
8. Mostre os mapas de funcionalidades e rastreabilidade, o diagrama ER e o INDEX com a esteira: 25 funcionalidades especificadas e 6 em rascunho.
9. No simulador, percorra CP1 e CP2. No repositório real, esses passos exigem responsáveis reais, um checkpoint por PR — ou, no perfil requisitos, o CP1 e o CP2 juntos, num PR só — e regeneração do espelho.

## Praticar sem alterar o ponto de partida

Crie uma branch `sprint/SP07-<nome>` da `main`; faça os PRs de checkpoint para essa branch. Não reescreva o exemplo inicial, não use `git reset --hard` para simular e não copie os nomes dos personagens para os campos de aprovação.

Antes de usar a CI como trilha de aprovação, substitua os times de exemplo de `.github/CODEOWNERS` por responsáveis reais e configure proteção de branch. No perfil requisitos, CP1 aprova o negócio e CP2 aprova o modelo negocial; CP3 e CP4 não se aplicam.

## Evoluir o exemplo

O [backlog](backlog.md) preserva os tickets fictícios do simulador. STRY0013120 introduz prazo de entrega e resumo; STRY0013135 introduz cupom. Use AIMM → 4A/3A, atualize o N2 e feche os elos nos três lugares. A contagem de PF é uma atividade separada: execute CT a partir do N3, sem copiar os totais da apresentação.

Nesta loja maior, as AIMMs da SP07 alcançam mais artefatos do que no simulador: o prazo do STRY0013120 entra na TabelaFrete e, com ela, nas Faixas de Frete (`ADM-FRT`). Os IDs VND-CHK-02 e VND-CHK-03 continuam livres para o resumo do pedido e o cupom, como no simulador. O STRY0013150 cria o Agrupamento Funcional Produtos sobre o N1 Catálogo e precisa dizer o que o "retirar de venda" muda na Vitrine, nos Destaques e no Carrinho.

## Limites do material

As mensagens de carrinho vazio e os estados de tela são complementos didáticos ao ticket inicial, não requisitos aprovados. Os protótipos de fluxo, um por Agrupamento Funcional e listados no [manifesto](../prototypes/INDEX.md), estão em rascunho, sem aprovação; não há implementação, testes de código ou dados reais. Os arquivos em branco herdados do bootstrap são referências para exercícios futuros, não funcionalidades implementadas.
