<!-- docqui: {{VERSION}} | prompt: {{PROMPT_ID}} | atualizado: {{YYYY-MM-DD}} -->
# RULES-DICTIONARY.md
> Dicionário de **regras de negócio canônicas** — invariantes que se repetem em
> várias funcionalidades (maioridade, registro vinculado não excluível, etc.).
>
> Registrá-las **uma vez** evita repetir (e divergir) a mesma regra em cada N3.
> Cada regra aqui descreve a **invariante** ("o quê"); a reação do sistema ("não
> salva", "exibe mensagem") vive nos **cenários**, não na regra.
>
> **Cada regra tem um ID `RC-NN`** — sequencial, **nunca reaproveitado** (a regra removida
> deixa o número vago). A citação vale **pelo ID**: o nome depois do travessão é só para
> quem lê; o índice de uso (`generate-usage-index`) e o `valida-citacoes-dicionario` leem
> apenas o `RC-NN`, e citação sem ID é acusada. Renomear a regra não quebra citação nenhuma.
>
> **Como referenciar nos N3**:
> - Regras de negócio: `→ ver RULES-DICTIONARY: [RC-NN] — [nome] (parâmetro: [valor])`
> - Cenários Gherkin: `# ← RULES-DICTIONARY: [RC-NN] — [nome] (importar cenários)`
> - Código (DEV): `// → RULES-DICTIONARY: [RC-NN] — [nome]`
>
> **Regra de uso**:
> - Modo PO: aplicar automaticamente; perguntar apenas os **parâmetros** em aberto.
> - Não confundir com NFR: qualidade do sistema (desempenho, segurança, auditoria)
>   vai para `global/NFR.md`, não aqui.

---

## Índice

| ID | Regra | Invariante (resumo) | Parâmetros em aberto |
|---|---|---|---|
| RC-01 | Maioridade | A pessoa precisa ter idade mínima | idade mínima |
| RC-02 | Responsável ativo | O responsável vinculado precisa estar ativo | quem é o "responsável" |
| RC-03 | Período de vigência | Início ≤ fim; ação válida só dentro da vigência | datas / fuso |
| RC-04 | Aprovação antes de publicar | Conteúdo só publica após aprovação | quem aprova |
| RC-05 | Limite por organização | Quantidade máxima de registros por organização | limite |
| RC-06 | Slug único público | Identificador público é único e estável | escopo da unicidade |
| RC-07 | Reenvio com cooldown | Reenvio só após intervalo mínimo | janela de cooldown |
| RC-08 | Arquivo com tamanho máximo | Upload limitado em tamanho/tipo | tamanho e tipos aceitos |
| RC-09 | Registro vinculado não pode ser excluído | Não excluir registro referenciado por outro | entidade vinculada; ação alternativa |

---

## Entradas

> Formato de cada regra. Abaixo, exemplos trabalhados; replique para as demais.

### RC-01 — Maioridade
<!-- usado-em:gerado -->
> **Usado em:** _(ainda não referenciado em N3)_
<!-- /usado-em -->

- **Invariante**: a pessoa associada ao registro deve ter pelo menos a idade mínima na data de referência.
- **Parâmetros (por funcionalidade)**: idade mínima (ex.: 18); data de referência (cadastro / evento).
- **Mensagem**: "É necessário ter no mínimo [idade] anos."

```gherkin
# ── Regra: Maioridade ────────────────────────────────────────────
Scenario: Pessoa abaixo da idade mínima
  Given que a data de nascimento informada resulta em idade menor que [idade mínima]
  When tento salvar
  Then o sistema rejeita e exibe "É necessário ter no mínimo [idade] anos."
```

### RC-08 — Arquivo com tamanho máximo
<!-- usado-em:gerado -->
> **Usado em:** _(ainda não referenciado em N3)_
<!-- /usado-em -->

- **Invariante**: o upload é aceito apenas se respeitar o tamanho e os tipos permitidos.
- **Parâmetros (por funcionalidade)**: tamanho máximo (ex.: 5 MB); tipos aceitos (ex.: PDF, PNG).
- **Mensagem**: "Arquivo excede o tamanho máximo de [tamanho]." / "Tipo de arquivo não permitido."

```gherkin
# ── Regra: Arquivo com tamanho máximo ────────────────────────────
Scenario: Arquivo acima do tamanho permitido
  Given que seleciono um arquivo maior que [tamanho máximo]
  When tento enviar
  Then o sistema rejeita e exibe "Arquivo excede o tamanho máximo de [tamanho]."
```

### RC-09 — Registro vinculado não pode ser excluído
<!-- usado-em:gerado -->
> **Usado em:** _(ainda não referenciado em N3)_
<!-- /usado-em -->

- **Invariante**: um registro referenciado por outros não pode ser removido enquanto houver vínculos.
- **Parâmetros (por funcionalidade)**: entidade(s) vinculada(s); ação alternativa (inativar em vez de excluir).
- **Mensagem**: "Não é possível excluir: existem [entidade] vinculados a este registro."

```gherkin
# ── Regra: Registro vinculado não pode ser excluído ──────────────
Scenario: Exclusão de registro com vínculos
  Given que o registro possui [entidade vinculada] associados
  When tento excluí-lo
  Then o sistema impede e exibe "Não é possível excluir: existem [entidade] vinculados a este registro."
```

---

## Como adicionar uma regra canônica

Uma regra vira canônica quando a **mesma invariante** aparece em **2+ funcionalidades** (detectável via auditoria — ver `PROMPT_AUDIT_RULES_DEDUP.md`). Para promovê-la:

1. Atribua o próximo **`RC-NN`** (o maior já usado + 1 — nunca reaproveite) e adicione a linha ao **Índice** (ID, nome, invariante, parâmetros em aberto).
2. Crie a **entrada** `### RC-NN — Nome` (invariante, parâmetros, mensagem, cenários).
3. Nos N3 que repetiam a regra inline, substitua por `→ ver RULES-DICTIONARY: [RC-NN] — [nome]` e importe os cenários com o marcador.

> Regra que vale só para um domínio (não para o sistema todo) **não** é canônica:
> registre-a nas *Regras transversais* do N1 do domínio.

---

## Instrução para a LLM

Ao especificar regras de negócio em um N3 (PROMPT_3A/3B):
1. Verifique se a regra é canônica — se for, **não pergunte** sobre o comportamento; aplique e pergunte apenas os parâmetros em aberto.
2. Referencie `→ ver RULES-DICTIONARY: [RC-NN] — [nome] (parâmetro: [valor])` e importe os cenários com `# ← RULES-DICTIONARY: [RC-NN] — [nome]`.
3. Regra recorrente ainda não dicionarizada: proponha com ⚠️ e aguarde aprovação.
4. Se o que foi descrito é uma **qualidade do sistema** (não uma invariante de negócio), encaminhe ao `global/NFR.md`.

> **Usado em (não escreva à mão)**: abaixo de cada `### <entrada>` há um bloco
> `> **Usado em:** …` entre `<!-- usado-em:gerado -->` e `<!-- /usado-em -->`,
> **gerado** por `scripts/generate-usage-index.mjs` a partir das referências
> `→ ver`/`←` dos N3. Não edite esse bloco à mão — rode o gerador (o CI valida
> que está fresco). O backlink já vive na referência direta do N3; aqui é só a
> projeção reversa.
