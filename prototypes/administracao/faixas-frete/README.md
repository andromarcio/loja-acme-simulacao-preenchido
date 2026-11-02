<!-- docqui: 7.0.0 | prompt: MIGRA_NIVEIS | atualizado: 2026-10-21 -->
# Protótipo de Fluxo: Faixas de Frete
> Agrupamento Funcional: Faixas de Frete — Domínio: Administração
> Spec de referência: [../../../modules/administracao/faixas-frete/README.md](../../../modules/administracao/faixas-frete/README.md)

---

## Protótipos de fluxo

| Arquivo / Link | Formato | Status | Última revisão |
|---|---|---|---|
| [flow.html](./flow.html) | HTML gerado | 🎨 Mockup | 2026-10-18 |

---

## Telas cobertas neste fluxo

| Tela | Rota | Protótipo de estado |
|---|---|---|
| Pesquisa de Faixas de Frete — atende [Pesquisar Faixas de Frete](../../../modules/administracao/faixas-frete/f-pesquisar-faixa-frete.md) <small>ADM-FRT-01</small> e [Excluir Faixa de Frete](../../../modules/administracao/faixas-frete/f-excluir-faixa-frete.md) <small>ADM-FRT-04</small> | `/administracao/faixas-frete` | — (os estados das N3 estão no próprio fluxo) |
| Cadastrar Faixa de Frete — atende [Cadastrar Faixa de Frete](../../../modules/administracao/faixas-frete/f-cadastrar-faixa-frete.md) <small>ADM-FRT-02</small> | `/administracao/faixas-frete/novo` | — |
| Editar Faixa de Frete — atende [Editar Faixa de Frete](../../../modules/administracao/faixas-frete/f-editar-faixa-frete.md) <small>ADM-FRT-03</small> | `/administracao/faixas-frete/:id/editar` | — |
| Visualizar Faixa de Frete — atende [Visualizar Faixa de Frete](../../../modules/administracao/faixas-frete/f-visualizar-faixa-frete.md) <small>ADM-FRT-05</small> | `/administracao/faixas-frete/:id` | — |

---

## Decisões de design deste fluxo

- A pesquisa abre com os filtros vazios e as cinco faixas da massa, em ordem crescente de CEP inicial; as ações de cada linha são icon-only (visualizar, editar e excluir).
- O CEP atendido inválido aparece abaixo do campo, como no Calcular Frete; a busca sem resultado e a tabela vazia usam o estado vazio com as mensagens do baseline.
- No cadastro e na edição, os erros de campo ficam abaixo de cada campo; os conflitos (intervalo invertido, região repetida e CEPs em comum com outra faixa) aparecem num alerta no topo do formulário, com a região da outra faixa na mensagem.
- Na edição, a região aparece em rótulo e valor, sem campo, e o aviso de que a alteração vale para os próximos cálculos fica no topo do formulário.
- A exclusão tem dois modais separados: a confirmação, com a região e o intervalo da faixa, e o bloqueio da faixa que atende pedidos, sem o botão Excluir.
- Os estados que não nascem de um clique (perfil Atendente, sem faixas, sem acesso e falha inesperada) são simulados por um seletor no painel de notas, fora da tela. No perfil Atendente, o menu e as ações seguem a matriz do N2: só pesquisa e visualização.
- O efeito no cálculo de frete do checkout e a preservação do frete dos pedidos já feitos não são visíveis nesta tela e ficam descritos nas notas.

---

## Status geral

**Status**: 🎨 Mockup

**Aprovado por**: — *(pendente; a aprovação é registrada no [manifesto de protótipos](../../INDEX.md))*

---

*Links: [N2 da spec](../../../modules/administracao/faixas-frete/README.md) · [Protótipos do domínio](../README.md) · [Índice de protótipos](../../INDEX.md)*
