<!-- docqui: 7.0.0 | prompt: MIGRA_NIVEIS | atualizado: 2026-10-21 -->
# Protótipo de Fluxo: Carrinho
> Agrupamento Funcional: Carrinho — Domínio: Vendas
> Spec de referência: [../../../modules/vendas/carrinho/README.md](../../../modules/vendas/carrinho/README.md)

---

## Protótipos de fluxo

| Arquivo / Link | Formato | Status | Última revisão |
|---|---|---|---|
| [flow.html](./flow.html) | HTML gerado | 🎨 Mockup | 2026-10-18 |

---

## Telas cobertas neste fluxo

| Tela | Rota | Protótipo de estado |
|---|---|---|
| Página do produto — atende [Adicionar Item ao Carrinho](../../../modules/vendas/carrinho/f-adicionar-item-carrinho.md) <small>VND-CAR-01</small> | `/produtos/:id` | — (os estados do N3 estão no próprio fluxo) |
| Carrinho — atende [Listar Itens do Carrinho](../../../modules/vendas/carrinho/f-listar-item-carrinho.md) <small>VND-CAR-02</small>, [Alterar Quantidade do Item](../../../modules/vendas/carrinho/f-alterar-quantidade-item.md) <small>VND-CAR-03</small> e [Remover Item do Carrinho](../../../modules/vendas/carrinho/f-remover-item-carrinho.md) <small>VND-CAR-04</small> | `/carrinho` | — (os estados do N3 estão no próprio fluxo) |

---

## Decisões de design deste fluxo

- A Página do produto é tela da Navegação (VIT-NAV-03 — Visualizar Produto na Vitrine); aqui ela aparece simplificada, só com o que a ação VND-CAR-01 — Adicionar Item ao Carrinho precisa: a quantidade, o botão e o retorno. O protótipo completo dela está em [Navegação](../../vitrine/navegacao/flow.html).
- O retorno da inclusão é um toast com o atalho **Ver carrinho**; os bloqueios (estoque insuficiente, produto esgotado, sem acesso) aparecem em alerta logo abaixo do botão, e o carrinho não muda.
- No Carrinho, a quantidade é editada na própria linha e vale ao sair do campo ou com Enter; o erro aparece abaixo do campo da linha e a quantidade volta à anterior.
- Remover é um ícone na linha, sem caixa de confirmação, como pede o N3; o toast confirma a remoção.
- O total dos itens fica abaixo da tabela, sem frete; **Ir para o checkout** leva ao [protótipo do Checkout](../checkout/flow.html) e fica indisponível com o carrinho vazio.
- Os estados que não nascem de navegar (carrinho vazio, estoque reduzido, visitante sem acesso e falha) e a troca do produto da página (Garrafa, Caneca já no carrinho, Boné esgotado) são simulados por seletores no painel de notas, fora da tela.

---

## Status geral

**Status**: 🎨 Mockup

**Aprovado por**: — *(pendente; a aprovação é registrada no [manifesto de protótipos](../../INDEX.md))*

---

*Links: [N2 da spec](../../../modules/vendas/carrinho/README.md) · [Protótipos do domínio](../README.md) · [Índice de protótipos](../../INDEX.md)*
