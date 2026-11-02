<!-- docqui: 7.0.0 | prompt: MIGRA_NIVEIS | atualizado: 2026-10-21 -->
# Protótipo de Fluxo: Categorias
> Agrupamento Funcional: Categorias — Domínio: Catálogo
> Spec de referência: [../../../modules/catalogo/categorias/README.md](../../../modules/catalogo/categorias/README.md)

---

## Protótipos de fluxo

| Arquivo / Link | Formato | Status | Última revisão |
|---|---|---|---|
| [flow.html](./flow.html) | HTML gerado | 🎨 Mockup | 2026-10-18 |

---

## Telas cobertas neste fluxo

| Tela | Rota | Protótipo de estado |
|---|---|---|
| Pesquisa de Categorias — atende [Pesquisar Categorias](../../../modules/catalogo/categorias/f-pesquisar-categoria.md) <small>CAT-CTG-01</small> e [Excluir Categoria](../../../modules/catalogo/categorias/f-excluir-categoria.md) <small>CAT-CTG-04</small> | `/catalogo/categorias` | — (os estados das N3 estão no próprio fluxo) |
| Modal Cadastrar categoria — atende [Cadastrar Categoria](../../../modules/catalogo/categorias/f-cadastrar-categoria.md) <small>CAT-CTG-02</small> | — (modal sobre a pesquisa) | — |
| Modal Editar categoria — atende [Editar Categoria](../../../modules/catalogo/categorias/f-editar-categoria.md) <small>CAT-CTG-03</small> | — (modal sobre a pesquisa) | — |
| Modal Categoria — atende [Visualizar Categoria](../../../modules/catalogo/categorias/f-visualizar-categoria.md) <small>CAT-CTG-05</small> | — (modal sobre a pesquisa) | — |

---

## Decisões de design deste fluxo

- Uma única tela, a Pesquisa de Categorias: cadastro, edição e visualização abrem em modal sobre ela, como pede a Superfície das N3, e a exclusão é ação na linha.
- A lista abre com as seis categorias da massa em ordem alfabética, com a situação em tag (verde para Ativa, neutra para Inativa) e a quantidade de produtos de cada uma.
- Na edição, o Nome da categoria aparece em rótulo e valor, sem campo de entrada, porque não muda depois do cadastro.
- Inativar uma categoria com produtos abre a confirmação "Os produtos desta categoria deixarão de aparecer na vitrine. Deseja continuar?" antes de salvar; desistir mantém o modal aberto, sem salvar.
- A exclusão tem dois modais separados: a confirmação, só para categoria sem produtos, e o bloqueio por produtos vinculados (RC-09), sem botão de excluir e com a orientação de inativar.
- Sem acesso, a tela mostra só o aviso "Você não tem permissão para esta ação.", sem filtros nem lista. Lista vazia, sem acesso e as falhas são simulados pelo seletor do painel de notas, que não faz parte da tela.
- O menu lateral é o do perfil Gestor de catálogo: Categorias e o link para o protótipo de Destaques.

---

## Status geral

**Status**: 🎨 Mockup

**Aprovado por**: — *(pendente; a aprovação é registrada no [manifesto de protótipos](../../INDEX.md))*

---

*Links: [N2 da spec](../../../modules/catalogo/categorias/README.md) · [Protótipos do domínio](../README.md) · [Índice de protótipos](../../INDEX.md)*
