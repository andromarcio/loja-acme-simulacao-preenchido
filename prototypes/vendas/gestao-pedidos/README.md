<!-- docqui: 7.0.0 | prompt: MIGRA_NIVEIS | atualizado: 2026-10-21 -->
# Protótipo de Fluxo: Gestão de Pedidos
> Agrupamento Funcional: Gestão de Pedidos — Domínio: Vendas
> Spec de referência: [../../../modules/vendas/gestao-pedidos/README.md](../../../modules/vendas/gestao-pedidos/README.md)

---

## Protótipos de fluxo

| Arquivo / Link | Formato | Status | Última revisão |
|---|---|---|---|
| [flow.html](./flow.html) | HTML gerado | 🎨 Mockup | 2026-10-18 |

---

## Telas cobertas neste fluxo

| Tela | Rota | Protótipo de estado |
|---|---|---|
| Pesquisa de Pedidos — atende [Pesquisar Pedidos](../../../modules/vendas/gestao-pedidos/f-pesquisar-pedido.md) <small>VND-PED-01</small> | `/vendas/pedidos` | — (os estados do N3 estão no próprio fluxo) |
| Detalhe do Pedido — atende [Visualizar Pedido](../../../modules/vendas/gestao-pedidos/f-visualizar-pedido.md) <small>VND-PED-02</small> e [Cancelar Pedido](../../../modules/vendas/gestao-pedidos/f-cancelar-pedido.md) <small>VND-PED-03</small> | `/vendas/pedidos/:numero` | — (os estados do N3 estão no próprio fluxo) |

---

## Decisões de design deste fluxo

- A pesquisa abre com os filtros vazios e a lista dos pedidos confirmados nos últimos 30 dias, do mais recente para o mais antigo, como pede a carga sem critério da VND-PED-01 — Pesquisar Pedidos.
- O período Confirmado de / Confirmado até valida a data final junto do campo, sem pesquisar; a lista só muda depois de **Pesquisar**.
- A situação aparece em tag: verde no confirmado e vermelha no cancelado. O total do pedido fica alinhado à direita, em cada linha e na ficha.
- O detalhe é uma ficha em label-valor, dividida em Pedido, Cliente, Entrega, Itens e, só no cancelado, Cancelamento; as únicas ações são **Voltar** e, no confirmado, **Cancelar pedido**.
- O cancelamento abre uma caixa de confirmação com a pergunta do catálogo e o Motivo do cancelamento; as mensagens de validação ficam abaixo do campo, e a de pedido não cancelável, sem acesso ou falha, em alerta dentro da caixa.
- Depois de cancelar, a caixa fecha, o toast "Pedido cancelado." aparece e a ficha mostra a situação Cancelado com a data e quem cancelou, mantendo itens e totais.
- Os estados que nenhum clique produz — nenhum pedido nos últimos 30 dias, sem acesso, falha e pedido cancelado por outra pessoa — são simulados pelo seletor do painel de notas.
- O menu lateral é o do perfil Atendente: Pedidos e, na Administração, Faixas de frete, que leva ao protótipo das faixas.

---

## Status geral

**Status**: 🎨 Mockup

**Aprovado por**: — *(pendente; a aprovação é registrada no [manifesto de protótipos](../../INDEX.md))*

---

*Links: [N2 da spec](../../../modules/vendas/gestao-pedidos/README.md) · [Protótipos do domínio](../README.md) · [Índice de protótipos](../../INDEX.md)*
