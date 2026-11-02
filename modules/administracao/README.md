<!-- docqui: 7.0.0 | prompt: MIGRA_NIVEIS | atualizado: 2026-10-21 -->
# Domínio: Administração
> **Nível 1** - Visão estratégica do domínio - `ADM`

## Descrição

Responde pela operação da Loja ACME: quem tem acesso e com que perfil, e quais faixas de CEP a loja atende, com o valor do frete de cada uma. Mantém os usuários e as faixas da Tabela de Frete, que é entidade de Vendas. É consumido por Vendas, que identifica o cliente e quem cancelou cada pedido e calcula o frete pelas faixas mantidas aqui.

### O que este domínio NÃO faz

| Descrição | Pertence a |
|---|---|
| Calcular o frete do pedido | Vendas |
| Manter categorias e destaques | Catálogo e Vitrine |
| Definir a senha e dar acesso à loja (entrar na conta) | Não especificado no exemplo |

## Agrupamentos Funcionais

| Agrupamento Funcional | Descrição | Funcionalidades |
|---|---|---|
| [**Usuários**](usuarios/README.md) <small>ADM-USR</small> | Quem acessa a loja e com que perfil | 5 |
| [**Faixas de Frete**](faixas-frete/README.md) <small>ADM-FRT</small> | Faixas de CEP atendidas e o valor do frete de cada uma | 5 |

## Regras transversais de negócio

1. Usuário inativo não acessa a loja.
2. A loja tem sempre ao menos um usuário ativo de perfil Administrador.

## Integrações com outros domínios

### Leitura — domínios que consomem dados deste domínio

| Domínio | O que consome | Como |
|---|---|---|
| Vendas | Usuario (Nome completo, E-mail) | Referência no pedido: o cliente dono do pedido e quem o cancelou |

### Escrita — domínios que criam ou alteram dados deste domínio

Nenhum outro domínio altera dados da Administração. A Administração é que altera a TabelaFrete de Vendas (ver o N1 [Vendas](../vendas/README.md)).

## Changelog

| Data | Autor | Tipo | Descrição |
|---|---|---|---|
| 2026-10-18 | Claude | N1 criado | Administração com Usuários e Faixas de Frete especificados; exemplo em rascunho. |
| 2026-10-21 | Docqui Caixa | Terminologia | Níveis em português: Domínio, Agrupamento Funcional e Funcionalidade; histórico preservado. |

*Links: [Usuários](usuarios/README.md) · [Faixas de Frete](faixas-frete/README.md) · [INDEX geral](../INDEX.md)*
