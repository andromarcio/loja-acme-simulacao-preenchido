<!-- docqui: 7.0.0 | prompt: MIGRA_NIVEIS | atualizado: 2026-10-21 -->
# Protótipo de Fluxo: Checkout
> Agrupamento Funcional: Checkout — Domínio: Vendas
> Spec de referência: [../../../modules/vendas/checkout/README.md](../../../modules/vendas/checkout/README.md)

---

## Protótipos de fluxo

| Arquivo / Link | Formato | Status | Última revisão |
|---|---|---|---|
| [flow.html](./flow.html) | HTML gerado | 🎨 Mockup | 2026-10-17 |

---

## Telas cobertas neste fluxo

| Tela | Rota | Protótipo de estado |
|---|---|---|
| Checkout — atende [Calcular Frete](../../../modules/vendas/checkout/f-calcular-frete.md) <small>VND-CHK-01</small> | `/checkout` | — (os estados do N3 estão no próprio fluxo) |

---

## Decisões de design deste fluxo

- O resultado da cotação aparece no card **Seu pedido**, abaixo dos itens, como pede o N3 ("com o resultado ao lado do pedido").
- O CEP fora da área sai em alerta de aviso; sem acesso e falha inesperada saem em alerta de erro, sempre no lugar da cotação.
- O carrinho sem itens usa o estado vazio no card do pedido, com a mensagem do N3.
- Durante o cálculo, "Carregando…" e um skeleton ocupam o lugar da cotação, e o botão **Calcular** fica bloqueado.
- Os estados que não nascem de digitar o CEP (carrinho vazio, sem acesso e falha no cálculo) são simulados por um seletor no painel de notas do protótipo, que não faz parte da tela.
- Prazo de entrega, resumo do pedido, cupom e a confirmação do pedido ficam fora do fluxo, por ainda não estarem especificados.

---

## Status geral

**Status**: 🎨 Mockup

**Aprovado por**: — *(pendente; a aprovação é registrada no [manifesto de protótipos](../../INDEX.md))*

---

*Links: [N2 da spec](../../../modules/vendas/checkout/README.md) · [Protótipos do domínio](../README.md) · [Índice de protótipos](../../INDEX.md)*
