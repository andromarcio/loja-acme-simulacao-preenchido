<!-- docqui: 7.0.0 | prompt: MIGRA_NIVEIS | atualizado: 2026-10-21 -->
# Protótipo de Fluxo: Destaques
> Agrupamento Funcional: Destaques — Domínio: Vitrine
> Spec de referência: [../../../modules/vitrine/destaques/README.md](../../../modules/vitrine/destaques/README.md)

---

## Protótipos de fluxo

| Arquivo / Link | Formato | Status | Última revisão |
|---|---|---|---|
| [flow.html](./flow.html) | HTML gerado | 🎨 Mockup | 2026-10-18 |

---

## Telas cobertas neste fluxo

| Tela | Rota | Protótipo de estado |
|---|---|---|
| Pesquisa de Destaques — atende [Pesquisar Destaques](../../../modules/vitrine/destaques/f-pesquisar-destaque.md) <small>VIT-DST-01</small> e [Excluir Destaque](../../../modules/vitrine/destaques/f-excluir-destaque.md) <small>VIT-DST-04</small> | `/vitrine/destaques` | — (os estados das N3 estão no próprio fluxo) |
| Cadastrar Destaque — atende [Cadastrar Destaque](../../../modules/vitrine/destaques/f-cadastrar-destaque.md) <small>VIT-DST-02</small> | `/vitrine/destaques/novo` | — |
| Editar Destaque — atende [Editar Destaque](../../../modules/vitrine/destaques/f-editar-destaque.md) <small>VIT-DST-03</small> | `/vitrine/destaques/:id/editar` | — |
| Visualizar Destaque — atende [Visualizar Destaque](../../../modules/vitrine/destaques/f-visualizar-destaque.md) <small>VIT-DST-05</small> | `/vitrine/destaques/:id` | — |

---

## Decisões de design deste fluxo

- A pesquisa abre com os filtros vazios e os cinco destaques da massa, do início de vigência mais recente para o mais antigo; a situação aparece como etiqueta: vigente em verde, programado em destaque e encerrado em neutro.
- O Produto do cadastro é um campo de busca com sugestões que só oferece produtos de categorias ativas; a Almofada, da categoria Decoração (inativa), não aparece.
- Na edição, o produto e a situação ficam em rótulo e valor, só para leitura. No destaque vigente, o início da vigência também vira rótulo e valor; no programado, segue editável.
- A ação editar no destaque encerrado (a Caneca) não abre o formulário: mostra o aviso "Destaque encerrado não pode ser alterado." acima da lista.
- O conflito de vigência sai em alerta de aviso acima do formulário, mantendo os dados digitados; os erros de campo saem abaixo de cada campo.
- A exclusão tem só a caixa de confirmação: destaque não tem vínculo que bloqueie a exclusão, então não há modal de bloqueio.
- Os estados que não nascem de navegar pelo fluxo (nenhum destaque, sem acesso, falha ao carregar e falha ao gravar) são simulados por um seletor no painel de notas do protótipo, que não faz parte da tela.
- O menu lateral é o do perfil Gestor de catálogo: Categorias leva ao [protótipo das Categorias](../../catalogo/categorias/flow.html), e as notas ligam à página inicial do [protótipo da Navegação](../navegacao/flow.html), onde os destaques vigentes aparecem.

---

## Status geral

**Status**: 🎨 Mockup

**Aprovado por**: — *(pendente; a aprovação é registrada no [manifesto de protótipos](../../INDEX.md))*

---

*Links: [N2 da spec](../../../modules/vitrine/destaques/README.md) · [Protótipos do domínio](../README.md) · [Índice de protótipos](../../INDEX.md)*
