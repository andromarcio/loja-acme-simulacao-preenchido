<!-- docqui: 7.0.0 | prompt: MIGRA_NIVEIS | atualizado: 2026-10-21 -->
# Visão de Produto: Loja ACME
> **Nível 0** - Visão de Produto - `LACME`

> O documento de referência mais alto do sistema: define **por que** o produto
> existe, para **quem** e **que valor** entrega. Os níveis N1–N3 são confrontados
> contra ele para garantir que não extrapolam o escopo nem contradizem os objetivos
> do produto. O N0 dá a direção; não detalha funcionalidades, telas ou campos.
>
> **Identidade**: o nome e a sigla vêm de `global/MASTER.md` → *Identificação do sistema*,
> a fonte única — aqui eles só se repetem (o `validate-doc` reprova sigla divergente).
>
> **Quem mantém**: PO / Liderança de Produto
> **Atualização**: revisado quando a estratégia do produto muda — não a cada funcionalidade.

---

## Propósito

O cliente da ACME compra por telefone e só descobre o custo da entrega quando o pedido já foi fechado. A Loja ACME existe para que ele compre sozinho, a qualquer hora, sabendo quanto vai pagar antes de confirmar. Este produto é fictício e serve exclusivamente à demonstração do método.

---

## Proposta de valor

Encontrar o produto na vitrine e comprar em poucos passos, com o valor do frete à vista antes da confirmação. Do outro lado do balcão, a equipe da loja mantém o catálogo, a vitrine, os pedidos, os usuários e a tabela de frete sem depender da equipe de sistemas. O prazo estimado será tratado na evolução do exemplo, conforme o backlog.

---

## Público-alvo e personas

| Persona | Quem é | Principal dor | O que espera do produto |
|---|---|---|---|
| Visitante | Pessoa que navega pela loja sem se identificar | Não sabe se o produto existe nem quanto custa | Encontrar o produto e o preço sem precisar se identificar |
| Cliente | Pessoa que compra na loja | Só conhece o custo da entrega depois de fechar o pedido | Conhecer o frete antes de confirmar |
| Atendente | Pessoa que apoia a compra e atende os pedidos | Precisa cotar frete e localizar pedidos por telefone | Consultar o mesmo valor apresentado ao cliente e cancelar o pedido quando o cliente pede |
| Gestor de catálogo | Pessoa da equipe de vendas que organiza o que a loja mostra | Depende da equipe de sistemas para mudar categorias e destaques | Manter categorias e destaques da vitrine sozinho |
| Administrador | Pessoa que cuida da operação da loja | Não controla quem acessa a loja nem a tabela de frete | Manter usuários e faixas de frete |

---

## Objetivos do produto

> O **quê** o produto busca alcançar — em linguagem de negócio, sem soluções técnicas.

1. Levar 60% dos pedidos para o autoatendimento, como meta didática.
2. Eliminar a cotação de frete por telefone para CEPs atendidos.

---

## Métricas de sucesso (KPIs)

> Como saberemos que o produto está cumprindo seus objetivos.

| KPI | O que mede | Meta |
|---|---|---|
| Autoatendimento | Proporção de pedidos feitos diretamente pelo cliente | 60% na operação fictícia |
| Transparência do frete | Compras com valor da entrega conhecido antes de confirmar | 100% dos pedidos com CEP atendido |

---

## Escopo

### Está dentro

- Vitrine com destaques, busca e página do produto.
- Catálogo de produtos organizado em categorias.
- Carrinho e checkout com cálculo de frete.
- Gestão dos pedidos pelo atendimento, com cancelamento.
- Administração dos usuários e das faixas de frete.
- Evolução para prazo de entrega, resumo do pedido e cupom, conforme os tickets de exercício.

### Está fora (não-objetivos)

- Marketplace de outros vendedores.
- Cobrança, liquidação financeira e operação da transportadora.
- Compra, reposição e controle físico do estoque.

---

## Domínios previstos (N1)

> Visão preliminar das grandes áreas que comporão o sistema. Cada uma será
> detalhada em seu próprio N1. Mantenha esta lista alinhada com `modules/INDEX.md`.

| Domínio | SIGLA | O que cuida |
|---|---|---|
| Catálogo | CAT | Produtos à venda e as categorias que os organizam |
| Vitrine | VIT | O que o visitante vê: destaques, busca e página do produto |
| Vendas | VND | Carrinho, checkout e gestão dos pedidos |
| Administração | ADM | Usuários da loja e faixas de frete |

---

## Tom de voz e princípios de experiência

- **Tom**: direto e acolhedor.
- **Princípios**: mostrar o custo antes da confirmação; explicar quando a entrega não atende ao CEP; não apresentar uma cotação antiga como válida após mudar o destino.

---

## Restrições e premissas

- Todos os dados e tickets são fictícios; não usar dados pessoais ou credenciais reais.
- As faixas de frete, os produtos, os destaques e os usuários da demonstração são massa fictícia, declarada no modelo de entidades. O CEP `69900000` continua fora de todas as faixas.
- Nenhuma aprovação humana, contagem revisada ou implementação é inferida da existência dos documentos.

---

## Changelog

<!-- Ordem decrescente por data: a entrada mais recente fica sempre no topo, logo abaixo do cabeçalho. -->

| Data | Autor | Tipo | Descrição |
|---|---|---|---|
| 2026-10-21 | Docqui Caixa | Terminologia | Níveis em português: Domínio, Agrupamento Funcional e Funcionalidade; histórico preservado. |
| 2026-10-18 | Claude | N0 atualizado | Entram Vitrine e Administração entre os Major Feature Sets, as personas Visitante, Gestor de catálogo e Administrador e o novo escopo (vitrine, categorias, carrinho, gestão de pedidos, usuários e faixas de frete). Objetivos e KPIs não mudam; sem aprovação atribuída. |
| 2026-10-14 | Copilot | N0 criado | Visão didática baseada no roteiro do simulador, sem aprovação atribuída à PO fictícia. |

---

## Instrução para a LLM

Ao gerar ou alterar qualquer N1/N2/N3:
1. Confronte o artefato com este N0 — escopo, objetivos e público-alvo.
2. Sinalize com ⚠️ qualquer divergência (funcionalidade que extrapola a visão, contradição de objetivo, persona não prevista).
3. O N0 é documento de visão — **não o reestruture** para acomodar detalhes de implementação. Proponha ajustes e peça aprovação antes de alterá-lo.
