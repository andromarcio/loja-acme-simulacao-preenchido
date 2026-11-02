<!-- docqui: 7.0.0 | prompt: MIGRA_NIVEIS | atualizado: 2026-10-23 -->
# Data Model: Catálogo
> **Modelo de entidades (negocial)** — entidades, atributos e relacionamentos de negócio, sem camada física.

## Categoria

> Agrupa produtos afins para organizar a vitrine e a busca.

| Atributo (Label PO) | Tipo | Obrigatório | Notas |
|---|---|---|---|
| Nome da categoria | texto | sim | Até 40 caracteres; único entre categorias com a mesma Categoria superior, inclusive sem superior, ativas ou inativas, ignorando maiúsculas e acentos; imutável após cadastro |
| Descrição | texto | não | Até 200 caracteres |
| Categoria superior | seleção → Categoria | não | Referência a categoria de primeiro nível, ativa ou inativa, diferente da própria; sem valor significa primeiro nível; categoria com subcategorias não pode receber superior |
| Situação | lista (Ativa, Inativa) | sim | Nasce Ativa; os produtos de uma categoria inativa não aparecem na vitrine |
| Data de cadastro | data | automático | Registrada ao cadastrar a categoria |

## Produto

> Item à venda na loja. A manutenção do cadastro de produtos é o exercício STRY0013150 (Agrupamento Funcional Produtos, planejado); os produtos da demonstração são massa fictícia.

| Atributo (Label PO) | Tipo | Obrigatório | Notas |
|---|---|---|---|
| Nome do produto | texto | sim | Identifica o produto na vitrine, no carrinho e nos pedidos |
| Descrição | texto | não | Texto exibido na página do produto |
| Preço | valor | sim | → ver FIELD-DICTIONARY: Valor monetário |
| Quantidade em estoque | número | sim | Inteiro maior ou igual a zero; com zero, o produto aparece como esgotado |
| Categoria | seleção → Categoria | sim | Todo produto pertence a uma única categoria |

## Relacionamentos

- **Categoria** [1 — N] **Produto** — uma categoria agrupa vários produtos; todo produto pertence a uma única categoria.
- **Categoria** [0..1 — 0..N] **Categoria** — cada categoria tem zero ou uma Categoria superior; uma superior pode ter zero ou várias subcategorias. Um único nível: uma subcategoria não pode ter subcategorias. Não admite autorreferência, ciclos ou exclusão de categoria com subcategorias. Trocar ou retirar a superior respeita a unicidade do nome no destino.

A situação não se propaga pelo autorrelacionamento: superior inativa mantém subcategorias e suas situações. Na vitrine, só a situação da categoria diretamente vinculada ao produto determina sua exibição; uma subcategoria ativa permanece elegível mesmo com a superior inativa (proposta da STRY0013205, sem aval da PO).

### Dados da demonstração

| Categoria | Situação | Descrição |
|---|---|---|
| Cozinha | Ativa | Canecas, garrafas e utensílios |
| Vestuário | Ativa | Camisetas e bonés |
| Papelaria | Ativa | Blocos, cadernos e canetas |
| Acessórios | Ativa | Ecobags e chaveiros |
| Decoração | Inativa | Almofadas e quadros |
| Brinquedos | Ativa | Sem produtos — pode ser excluída |

| Produto | Categoria | Preço | Quantidade em estoque |
|---|---|---|---|
| Caneca de cerâmica ACME 300 ml | Cozinha | R$ 39,90 | 120 |
| Garrafa térmica ACME 500 ml | Cozinha | R$ 89,90 | 35 |
| Camiseta ACME algodão — tamanho M | Vestuário | R$ 59,90 | 48 |
| Boné ACME aba curva | Vestuário | R$ 49,90 | 0 |
| Bloco de notas ACME A5 | Papelaria | R$ 24,90 | 200 |
| Caneta esferográfica ACME azul | Papelaria | R$ 6,90 | 500 |
| Ecobag ACME de lona | Acessórios | R$ 34,90 | 60 |
| Chaveiro ACME de metal | Acessórios | R$ 14,90 | 75 |
| Almofada ACME estampada | Decoração | R$ 69,90 | 12 |

O Boné está esgotado; a Almofada não aparece na vitrine porque Decoração está inativa; Brinquedos não tem produtos e é a única categoria que pode ser excluída.

#### Variação da massa — STRY0013205

Sem alterar a massa base acima, os cenários de hierarquia e o simulador de Categorias podem acrescentar:

| Categoria | Categoria superior | Situação | Produtos diretos |
|---|---|---|---|
| Canecas | Cozinha | Ativa | 0 |
| Garrafas | Cozinha | Ativa | 0 |

Nos cenários que explicitam reclassificação, a caneca passa de Cozinha para Canecas e a garrafa pode passar para Garrafas, sem criar produtos nem mudar preço ou estoque. Cada cenário explicita mudanças de situação; os demais continuam usando a massa base. A quantidade exibida na ficha conta somente produtos diretos.
