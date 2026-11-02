<!-- docqui: 7.0.0 | prompt: MIGRA_NIVEIS | atualizado: 2026-10-21 -->
# Protótipos — Manifesto de fidelidade e aprovação
> Fonte de verdade do vínculo **protótipo ↔ N3**, do nível de **fidelidade** e do
> **status de aprovação**. Uma tela com fidelidade **obrigatória** só vira **contrato
> de implementação** quando o protótipo está **aprovado** aqui (com quem e quando).

| Protótipo | Funcionalidade (N3) | Fidelidade | Status | Aprovado por | Data |
|---|---|---|---|---|---|
| [prototypes/catalogo/categorias/flow.html](./catalogo/categorias/flow.html) | `CAT-CTG-01` | referência | rascunho | — | — |
| [prototypes/catalogo/categorias/flow.html](./catalogo/categorias/flow.html) | `CAT-CTG-02` | referência | rascunho | — | — |
| [prototypes/catalogo/categorias/flow.html](./catalogo/categorias/flow.html) | `CAT-CTG-03` | referência | rascunho | — | — |
| [prototypes/catalogo/categorias/flow.html](./catalogo/categorias/flow.html) | `CAT-CTG-04` | referência | rascunho | — | — |
| [prototypes/catalogo/categorias/flow.html](./catalogo/categorias/flow.html) | `CAT-CTG-05` | referência | rascunho | — | — |
| [prototypes/vitrine/navegacao/flow.html](./vitrine/navegacao/flow.html) | `VIT-NAV-01` | referência | rascunho | — | — |
| [prototypes/vitrine/navegacao/flow.html](./vitrine/navegacao/flow.html) | `VIT-NAV-02` | referência | rascunho | — | — |
| [prototypes/vitrine/navegacao/flow.html](./vitrine/navegacao/flow.html) | `VIT-NAV-03` | referência | rascunho | — | — |
| [prototypes/vitrine/destaques/flow.html](./vitrine/destaques/flow.html) | `VIT-DST-01` | referência | rascunho | — | — |
| [prototypes/vitrine/destaques/flow.html](./vitrine/destaques/flow.html) | `VIT-DST-02` | referência | rascunho | — | — |
| [prototypes/vitrine/destaques/flow.html](./vitrine/destaques/flow.html) | `VIT-DST-03` | referência | rascunho | — | — |
| [prototypes/vitrine/destaques/flow.html](./vitrine/destaques/flow.html) | `VIT-DST-04` | referência | rascunho | — | — |
| [prototypes/vitrine/destaques/flow.html](./vitrine/destaques/flow.html) | `VIT-DST-05` | referência | rascunho | — | — |
| [prototypes/vendas/carrinho/flow.html](./vendas/carrinho/flow.html) | `VND-CAR-01` | referência | rascunho | — | — |
| [prototypes/vendas/carrinho/flow.html](./vendas/carrinho/flow.html) | `VND-CAR-02` | referência | rascunho | — | — |
| [prototypes/vendas/carrinho/flow.html](./vendas/carrinho/flow.html) | `VND-CAR-03` | referência | rascunho | — | — |
| [prototypes/vendas/carrinho/flow.html](./vendas/carrinho/flow.html) | `VND-CAR-04` | referência | rascunho | — | — |
| [prototypes/vendas/checkout/flow.html](./vendas/checkout/flow.html) | `VND-CHK-01` | referência | rascunho | — | — |
| [prototypes/vendas/gestao-pedidos/flow.html](./vendas/gestao-pedidos/flow.html) | `VND-PED-01` | referência | rascunho | — | — |
| [prototypes/vendas/gestao-pedidos/flow.html](./vendas/gestao-pedidos/flow.html) | `VND-PED-02` | referência | rascunho | — | — |
| [prototypes/vendas/gestao-pedidos/flow.html](./vendas/gestao-pedidos/flow.html) | `VND-PED-03` | referência | rascunho | — | — |
| [prototypes/administracao/usuarios/flow.html](./administracao/usuarios/flow.html) | `ADM-USR-01` | referência | rascunho | — | — |
| [prototypes/administracao/usuarios/flow.html](./administracao/usuarios/flow.html) | `ADM-USR-02` | referência | rascunho | — | — |
| [prototypes/administracao/usuarios/flow.html](./administracao/usuarios/flow.html) | `ADM-USR-03` | referência | rascunho | — | — |
| [prototypes/administracao/usuarios/flow.html](./administracao/usuarios/flow.html) | `ADM-USR-04` | referência | rascunho | — | — |
| [prototypes/administracao/usuarios/flow.html](./administracao/usuarios/flow.html) | `ADM-USR-05` | referência | rascunho | — | — |
| [prototypes/administracao/faixas-frete/flow.html](./administracao/faixas-frete/flow.html) | `ADM-FRT-01` | referência | rascunho | — | — |
| [prototypes/administracao/faixas-frete/flow.html](./administracao/faixas-frete/flow.html) | `ADM-FRT-02` | referência | rascunho | — | — |
| [prototypes/administracao/faixas-frete/flow.html](./administracao/faixas-frete/flow.html) | `ADM-FRT-03` | referência | rascunho | — | — |
| [prototypes/administracao/faixas-frete/flow.html](./administracao/faixas-frete/flow.html) | `ADM-FRT-04` | referência | rascunho | — | — |
| [prototypes/administracao/faixas-frete/flow.html](./administracao/faixas-frete/flow.html) | `ADM-FRT-05` | referência | rascunho | — | — |

## Como manter

- A pasta `prototypes/` **espelha `modules/`**: `prototypes/[dominio]/[agrupamento-funcional]/[funcionalidade]/`, com os mesmos nomes de pasta e um `README.md` em cada nível — domínio (índice dos Agrupamentos Funcionais com protótipo), Agrupamento Funcional (protótipo de fluxo) e funcionalidade (protótipos de estado). Modelos em `engine/templates/prototypes/_template/`.
- Ao **gerar** um protótipo, registre a linha com status **rascunho** e a fidelidade lida do N3 (linha `Fidelidade ao protótipo` na `## Superfície`).
- Na **aprovação**, troque o status para **aprovado** e preencha **quem** e **quando**. Só então a tela é **contrato** para a codificação.
- A implementação de telas **obrigatória** exige a **checklist de fidelidade** — `node scripts/fidelity-checklist.mjs <pasta-do-protótipo> <N3.md>` — com **todos os estados cobertos** (✅, ou ⚠️ com desvio aprovado; nenhum ❌).
- **Reforço opcional (CI, onde há runtime):** regressão visual `node scripts/proto-visual-diff.mjs <protótipo> <tela-implementada>` — roda no **repositório de código** (Playwright + app), não aqui. Ver o cabeçalho do script.

## Legenda

- **Fidelidade** — `obrigatória`: a implementação reproduz o protótipo; `referência`: guia a intenção.
- **Status** — `rascunho`: em elaboração; `aprovado`: travado como contrato (registrar quem/quando).
