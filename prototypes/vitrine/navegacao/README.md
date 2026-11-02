<!-- docqui: 7.0.0 | prompt: MIGRA_NIVEIS | atualizado: 2026-10-21 -->
# Protótipo de Fluxo: Navegação
> Agrupamento Funcional: Navegação — Domínio: Vitrine
> Spec de referência: [../../../modules/vitrine/navegacao/README.md](../../../modules/vitrine/navegacao/README.md)

---

## Protótipos de fluxo

| Arquivo / Link | Formato | Status | Última revisão |
|---|---|---|---|
| [flow.html](./flow.html) | HTML gerado | 🎨 Mockup | 2026-10-18 |

---

## Telas cobertas neste fluxo

| Tela | Rota | Protótipo de estado |
|---|---|---|
| Página inicial — atende [Listar Destaques](../../../modules/vitrine/navegacao/f-listar-destaque.md) <small>VIT-NAV-01</small> | `/` | — (os estados do N3 estão no próprio fluxo) |
| Resultado da busca — atende [Pesquisar Produtos na Vitrine](../../../modules/vitrine/navegacao/f-pesquisar-produto-vitrine.md) <small>VIT-NAV-02</small> | `/produtos` | — (os estados do N3 estão no próprio fluxo) |
| Página do produto — atende [Visualizar Produto na Vitrine](../../../modules/vitrine/navegacao/f-visualizar-produto-vitrine.md) <small>VIT-NAV-03</small> | `/produtos/:id` | — (os estados do N3 estão no próprio fluxo) |

---

## Decisões de design deste fluxo

- Os destaques e os resultados da busca usam o mesmo card de produto, em grade de três colunas (duas no tablet, uma no celular): nome, preço, o selo "Esgotado" quando for o caso e o botão "Ver produto". No destaque, a chamada vai acima do nome; na busca, a categoria.
- O campo de busca aparece na página inicial e no topo do resultado; o termo com menos de 2 caracteres mostra "Mínimo de 2 caracteres." junto ao campo e não troca o resultado.
- A categoria e a ordenação refazem a busca ao mudar; o filtro de categoria só oferece as categorias ativas.
- Na página do produto, os dados ficam à esquerda em label-valor e o preço, a quantidade e o botão "Adicionar ao carrinho" à direita. A quantidade e o botão pertencem a VND-CAR-01 — Adicionar Item ao Carrinho e levam ao [protótipo do Carrinho](../../vendas/carrinho/flow.html); no produto esgotado, ficam indisponíveis.
- O menu é o do perfil Cliente: Início e Produtos trocam de tela aqui, e Carrinho leva ao protótipo do Carrinho.
- Os estados que não nascem da navegação (nenhum destaque vigente, falha ao carregar e o endereço de um produto de categoria inativa) são simulados por um seletor no painel de notas, fora da tela.

---

## Status geral

**Status**: 🎨 Mockup

**Aprovado por**: — *(pendente; a aprovação é registrada no [manifesto de protótipos](../../INDEX.md))*

---

*Links: [N2 da spec](../../../modules/vitrine/navegacao/README.md) · [Protótipos do domínio](../README.md) · [Índice de protótipos](../../INDEX.md)*
