<!-- docqui: {{VERSION}} | prompt: {{PROMPT_ID}} | atualizado: {{YYYY-MM-DD}} -->
# Feature Set: [Nome do Feature Set]
> **Nível 2** - Major Feature Set: [Nome do Domínio] - `[SIGLA]-[SFS]`

## Descrição
[Descrição em 2-3 frases do que este Feature Set faz.]

**Não faz**: [o que está explicitamente fora do escopo.]

---

## Features

<!-- Primeira atribuição: confirme a jornada e numere somente as entradas sem ID com scripts/ids-n3.mjs (modo seco, depois --write). IDs existentes são imutáveis; novas features continuam após o maior reservado. Preserve o registro docqui:n3-ids quando ele for criado. Ver engine/N3-IDS.md. -->

| Feature | Descrição |
|---|---|
| [**Nome da Feature**](f-[verbo]-[entidade].md) <small>[SIGLA]-[SFS]-01</small> | [descrição em uma linha] |

---

## Fluxo Principal

```mermaid
flowchart TD
    A(["Ponto de entrada do usuário"]) --> B["Feature 1"]
    B --> C{"Decisão?"}
    C -->|Sim| D["Resultado"]
    C -->|Não| E["Feature 2"]
    E --> F(["Resultado final"])
    D --> F
```

---

## Dependências entre features

[lista descrevendo pré-requisitos e relações entre as features]

---

## Telas

| Tela | Rota sugerida | Features atendidas | Descrição |
|---|---|---|---|
| [Nome da tela] | `/[rota]` | **[Nome da Feature]** <small>[SIGLA]-[SFS]-01</small> | [o que a tela mostra] |

---

## Permissões por perfil

> **Fonte única de permissões** deste Feature Set. As features (N3) não tratam de
> perfis nem permissões — qualquer acesso novo ou diferente entra nesta matriz.

Perfis: **[Perfil A]**, **[Perfil B]**, **[Perfil C]**.

| Perfil | [Ação 1] | [Ação 2] | [Ação 3] |
|---|---|---|---|
| **[Perfil A]** | ✓ | ✓ | ✓ |
| **[Perfil B]** | ✓ | — | ✓ |
| **[Perfil C]** | ✓ | — | — |

* **[Perfil A]** — [nível de acesso em uma linha].

---

## Changelog

<!-- Ordem decrescente por data: a entrada mais recente fica sempre no topo, logo abaixo do cabeçalho. -->

| Data | Autor | Tipo | Descrição |
|---|---|---|---|
| [AAAA-MM-DD] | [autor] | N2 criado | Gerado pelo PROMPT 2A |

---

*Links: [N1 do domínio](../README.md) · [INDEX geral](../../INDEX.md)*
