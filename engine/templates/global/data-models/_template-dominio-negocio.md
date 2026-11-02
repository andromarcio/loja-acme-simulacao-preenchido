<!-- docqui: {{VERSION}} | prompt: {{PROMPT_ID}} | atualizado: {{YYYY-MM-DD}} -->
# Data Model: [Nome do Domínio]
> **Modelo de entidades (negocial)** — só a parte das entidades, **sem camada física**
> (sem nomes físicos, tipos de banco, chaves, índices ou contagem ALI/AIE). Cole apenas
> este fragmento nas sessões que envolvam o domínio [Nome do Domínio].

---

## [Entidade Principal]
> [uma frase de negócio: o que esta entidade representa no domínio]

| Atributo (Label PO) | Tipo | Obrigatório | Notas |
|---|---|---|---|
| [nome de negócio] | [texto / número / data / valor / booleano / seleção → Entidade] | sim / não / automático | [regra ou observação de negócio; canônico → ver FIELD-DICTIONARY: [nome]] |

---

## [Entidade de Suporte]
> [uma frase de negócio]

| Atributo (Label PO) | Tipo | Obrigatório | Notas |
|---|---|---|---|
| [nome de negócio] | [tipo de negócio] | sim / não / automático | [nota] |

---

## Relacionamentos

- **[Entidade A]** [1 — N] **[Entidade B]** — [descrição de negócio da relação]
- **[Entidade B]** [N — N] **[Entidade C]** — [descrição de negócio da relação]
