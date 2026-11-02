<!-- docqui: 7.0.0 | prompt: MIGRA_NIVEIS | atualizado: 2026-10-21 -->
# Protótipo de Fluxo: Usuários
> Agrupamento Funcional: Usuários — Domínio: Administração
> Spec de referência: [../../../modules/administracao/usuarios/README.md](../../../modules/administracao/usuarios/README.md)

---

## Protótipos de fluxo

| Arquivo / Link | Formato | Status | Última revisão |
|---|---|---|---|
| [flow.html](./flow.html) | HTML gerado | 🎨 Mockup | 2026-10-18 |

---

## Telas cobertas neste fluxo

| Tela | Rota | Protótipo de estado |
|---|---|---|
| Pesquisa de Usuários — atende [Pesquisar Usuários](../../../modules/administracao/usuarios/f-pesquisar-usuario.md) <small>ADM-USR-01</small> e [Inativar Usuário](../../../modules/administracao/usuarios/f-inativar-usuario.md) <small>ADM-USR-04</small> | `/administracao/usuarios` | — (os estados das N3 estão no próprio fluxo) |
| Cadastrar Usuário — atende [Cadastrar Usuário](../../../modules/administracao/usuarios/f-cadastrar-usuario.md) <small>ADM-USR-02</small> | `/administracao/usuarios/novo` | — |
| Editar Usuário — atende [Editar Usuário](../../../modules/administracao/usuarios/f-editar-usuario.md) <small>ADM-USR-03</small> | `/administracao/usuarios/:id/editar` | — |
| Visualizar Usuário — atende [Visualizar Usuário](../../../modules/administracao/usuarios/f-visualizar-usuario.md) <small>ADM-USR-05</small> | `/administracao/usuarios/:id` | — |

---

## Decisões de design deste fluxo

- Quem usa o protótipo é Elisa Rocha, com o perfil Administrador, o único que a matriz do N2 deixa manter usuários; o menu lateral é o desse perfil e leva aos protótipos de Categorias, Destaques, Pedidos e Faixas de frete.
- A pesquisa abre com a situação Ativo e lista os sete usuários ativos da massa; Fábio Nunes, inativo, aparece com a situação Todas ou Inativo. Editar e inativar só aparecem nas linhas de usuários ativos.
- Na edição, o e-mail e a situação são rótulo e valor, não campos desabilitados: o e-mail é imutável e a situação só muda pela inativação. O bloqueio do último administrador aparece em alerta no topo do formulário.
- A inativação usa dois modais separados: o de confirmação, com o motivo opcional e o botão **Inativar**, e o de bloqueio, só com **Ok, entendi**, para a autoinativação e para o usuário que já estava inativo.
- A ficha de visualização mostra a data e o motivo da inativação apenas no usuário inativo; CPF e telefone não informados aparecem como "—".
- Os estados que nenhum clique produz — lista desatualizada, sem acesso, falha ao carregar e falha ao salvar — são simulados por um seletor no painel de notas, fora da tela.

---

## Status geral

**Status**: 🎨 Mockup

**Aprovado por**: — *(pendente; a aprovação é registrada no [manifesto de protótipos](../../INDEX.md))*

---

*Links: [N2 da spec](../../../modules/administracao/usuarios/README.md) · [Protótipos do domínio](../README.md) · [Índice de protótipos](../../INDEX.md)*
