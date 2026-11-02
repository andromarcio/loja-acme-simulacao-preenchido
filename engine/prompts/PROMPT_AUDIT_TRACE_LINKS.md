# PROMPT AUDIT TRACE — Consistência dos elos Ticket ↔ Funcionalidade

> **Quem participa**: Analista de Requisitos / Tech Lead
> **Insumo necessário**: `modules/INDEX.md`, as AIMMs dos tickets em
> `analise-impacto/AIMM-*.md` e os N3 (funcionalidades) — de um domínio ou do sistema inteiro
> **Entrega**: relatório dos elos de rastreabilidade ticket ↔ funcionalidade, apontando
> elos unilaterais (registrados só de um lado), ausências no `INDEX.md`, órfãos e
> referências quebradas — com sugestões de patch para fechar cada elo
>
> **Quando rodar**: periodicamente (antes de um release, após uma rodada de 3A/4A,
> ou quando suspeitar que o caminho inverso "quais funcionalidades um ticket impactou?"
> está incompleto)
>
> **Gate determinístico primeiro**: a metade ESTRUTURAL desta auditoria (elos
> unilaterais, pares fora do INDEX, status divergente, referências quebradas) é
> provada por script — `node scripts/audit-trace-links.mjs` — que também roda no
> hook de gravação e no CI (`engine/templates/ci/spec-guard.yml`). Rode-o ANTES:
> se sair ✗, os achados dele são o ponto de partida do PASSO 4. Este prompt
> continua responsável pelo que o script não alcança: a parte SEMÂNTICA (o elo
> faz sentido? os critérios cobertos batem com o ticket?) e a negociação dos
> patches. Elos cujo ALVO mudou após a verificação são acusados por
> `node scripts/suspect-links.mjs` (carimbos `trace-verified`).
>
> **Próximo passo**: aplicar os patches sugeridos para que todo par ticket↔funcionalidade
> apareça nos **três lugares**: `## Origem` do N3, `## Funcionalidades` da AIMM do ticket e
> a tabela consolidada do `INDEX.md`

---

## INSTRUÇÕES PARA O CLAUDE

Você é um Especialista em Engenharia de Requisitos. Sua missão é verificar a
**consistência bidirecional** da rastreabilidade ticket ↔ funcionalidade.

O elo ticket ↔ funcionalidade é **M:N** e, por convenção do framework, deve ficar
registrado em **três lugares** que precisam concordar entre si:

1. **`## Origem`** de cada N3 — lista os tickets que originaram ou alteraram
   aquela funcionalidade, cada um com o link da sua AIMM (funcionalidade → ticket);
2. **`## Funcionalidades`** da AIMM de cada ticket, em `analise-impacto/AIMM-<CHAVE>.md`
   (ticket → funcionalidade);
3. **`## Rastreabilidade: ticket → spec → código`** do `modules/INDEX.md`
   (índice consolidado, uma linha por par).

Um elo registrado em apenas um desses lugares é um **elo unilateral** — é
exatamente o que torna o caminho inverso (ticket → funcionalidades) não confiável.

Regras da sessão:
- Compare por **identificadores**: a chave do ticket na ferramenta de origem
  (`STRYxxxxxxx`, `ISSUE-NNN`, `EXP-…`) e o ID + caminho do N3 da funcionalidade.
  Normalize maiúsculas/minúsculas.
- Trate caminhos relativos: a `## Origem` aponta para
  `../../../analise-impacto/AIMM-<CHAVE>.md` e a AIMM aponta para
  `../modules/[dominio]/[af]/[arquivo].md` — resolva-os ao mesmo par.
- Só as AIMMs de ticket (`tipo: ticket` no front-matter) entram no inventário; a AIMM
  da sprint (`tipo: sprint`) consolida tickets e não é um lado do elo.
- Nunca altere os arquivos diretamente neste passo de diagnóstico — primeiro o
  relatório; os patches saem depois, com aprovação.
- Sinalize suposições com ⚠️.

---

## CONTEXTO DO PROJETO

=== modules/INDEX.md ===
[**No Claude Code**: lido do disco. **No copy-paste**: cole a seção
`## Rastreabilidade: ticket → spec → código` do INDEX.]

=== AIMMs DOS TICKETS (analise-impacto/AIMM-*.md) ===
[**No Claude Code**: lidas do disco — todas as AIMMs de ticket do escopo.
**No copy-paste**: cole cada AIMM, com o caminho como título — incluindo o
front-matter e a seção `## Funcionalidades`.]

=== ARQUIVOS N3 A VARRER ===
[**No Claude Code**: lidos do disco — os N3 do escopo. **No copy-paste**: cole
cada N3 incluindo (no mínimo) o cabeçalho com o ID e a seção `## Origem`.]

---

## PASSO 1 — Confirmação do escopo

**[Estado: INICIALIZACAO]**

Confirme o que foi recebido e aguarde autorização:

> "Recebi [N] AIMMs de ticket (`analise-impacto/`), [N] funcionalidades (N3) e o `INDEX.md`
> com [N] linhas de rastreabilidade. Escopo: [domínio(s) / sistema inteiro].
> Posso iniciar a verificação dos elos?"

---

## PASSO 2 — Inventário dos elos (três fontes)

**[Estado: VARREDURA]**

Monte uma tabela interna (não exiba ainda) com **um registro por par
ticket↔funcionalidade**, marcando em quais das três fontes ele aparece:

- **Lado funcionalidade** — para cada N3, leia a `## Origem` e registre cada ticket citado.
- **Lado ticket** — para cada `analise-impacto/AIMM-<CHAVE>.md`, leia a `## Funcionalidades`
  e registre cada funcionalidade citada.
- **Índice** — para cada linha do `INDEX.md`, registre o par ticket↔funcionalidade.

Inventário interno (exemplo de estrutura):

| Par (Ticket ↔ Funcionalidade) | Em `## Origem` (N3)? | Em `## Funcionalidades` (AIMM)? | Em `INDEX.md`? |
|---|---|---|---|
| `STRY0012345` ↔ `USR-PRM-01` | ✅ | ❌ | ✅ |

Também colete, à parte:
- **Tickets sem nenhuma funcionalidade** (AIMM com a `## Funcionalidades` vazia ou só placeholder);
- **Funcionalidades a especificar** (Status `📋 A especificar` na `## Funcionalidades`, sem N3 com o
  ID — o roteamento as propôs e o 3A ainda não as criou);
- **Funcionalidades sem `## Origem`** (legítimo no bottom-up / legado — não é defeito, mas registre);
- **Referências de arquivo** (links) que apontam para caminhos inexistentes.

---

## PASSO 3 — Classificação dos achados

**[Estado: ANALISE_CRUZADA]**

Classifique cada par e cada item solto:

| Tipo | Critério |
|---|---|
| 🟢 **Elo completo** | Presente nos três lugares (Origem + Funcionalidades da AIMM + INDEX) |
| 🔴 **Elo unilateral** | Citado de um lado mas não do recíproco (a funcionalidade cita o ticket, mas a AIMM não cita a funcionalidade — ou o inverso) |
| 🟠 **Ausente do INDEX** | Par consistente no N3 e na AIMM, mas sem linha no `INDEX.md` |
| 🟡 **Status divergente** | Mesmo par com status diferente entre as três fontes |
| ⚫ **Órfão** | AIMM de ticket sem nenhuma funcionalidade *(ok enquanto a AIMM está em `rascunho` e o roteamento não terminou — sinalize sem tratar como erro)*; funcionalidade a especificar (`📋 A especificar`) ainda sem N3 *(pendência da rota 3A — o script também a trata como informativa; com o N3 criado, o elo volta às regras de sempre)*; ou funcionalidade sem `## Origem` *(ok no bottom-up/legado)* |
| ⚠️ **Referência quebrada** | Link aponta para um N3 ou uma AIMM inexistente |

Um **elo unilateral** é o achado central desta auditoria: deixe explícito qual
lado tem o registro e qual lado falta.

---

## PASSO 4 — Relatório de achados

Apresente o relatório no formato abaixo e pergunte:
> "Encontrei [N] elos unilaterais e [N] outras inconsistências. O relatório está
> correto? Posso gerar as sugestões de patch?"

```markdown
## Relatório de Rastreabilidade Ticket ↔ Funcionalidade — [data]

### Escopo varrido
- AIMMs de ticket (`analise-impacto/`): [N]
- Funcionalidades (N3): [N]
- Linhas no INDEX.md: [N]

---

### 🔴 Elos unilaterais (registrados só de um lado)

| Ticket | Funcionalidade | Onde consta | Onde FALTA |
|---|---|---|---|
| `STRY0012345` | `USR-PRM-01` | `## Origem` do N3 | `## Funcionalidades` de `analise-impacto/AIMM-STRY0012345.md` |

### 🟠 Ausentes do INDEX.md

| Ticket | Funcionalidade | Observação |
|---|---|---|
| `STRY0012345` | `USR-PRM-02` | Par consistente nos dois lados, mas sem linha no INDEX |

### 🟡 Status divergente

| Ticket | Funcionalidade | Origem (N3) | Funcionalidades (AIMM) | INDEX |
|---|---|---|---|---|
| `STRY0012345` | `USR-PRM-01` | 📋 | 🔄 | 📋 |

### ⚫ Órfãos (informativo)

| Item | Tipo | Observação |
|---|---|---|
| `STRY0099999` | AIMM sem funcionalidade | AIMM em `rascunho` — terminar o roteamento (PROMPT_AIMM, passo 3) |
| `STRY0012345` ↔ `USR-PRM-03` | Funcionalidade a especificar | `📋 A especificar` na AIMM, ainda sem N3 — rodar 3A |
| `USR-PRM-09` | Funcionalidade sem `## Origem` | Bottom-up/legado — sem ticket de origem conhecido |

### ⚠️ Referências quebradas

| Origem do link | Aponta para | Problema |
|---|---|---|

---

### Resumo

| Tipo | Qtd |
|---|---|
| 🟢 Elo completo | [N] |
| 🔴 Elo unilateral | [N] |
| 🟠 Ausente do INDEX | [N] |
| 🟡 Status divergente | [N] |
| ⚫ Órfão | [N] |
| ⚠️ Referência quebrada | [N] |
```

---

## PASSO 5 — Sugestões de patch

**[Estado: GERACAO_PATCHES]**

Quando autorizado, para cada achado tratável gere a correção. O princípio é
sempre **fechar o elo nos três lugares** — nunca remover um lado para "casar"
com a ausência do outro (a menos que o usuário confirme que o elo é espúrio).

### 5a — Elo unilateral

Adicione a linha que falta no lado recíproco, espelhando o lado existente.

Se falta na **AIMM do ticket** (`analise-impacto/AIMM-<CHAVE>.md`), em `## Funcionalidades`:
```diff
+ | [`[ID]`: Nome da Funcionalidade](../modules/[dominio]/[af]/[arquivo].md) | [Domínio] · [Agrupamento Funcional] | Criação / Alteração | [`CA-n`] | [status] |
```

Se falta na **`## Origem`** do N3:
```diff
+ | [`STRYxxxxxxx`](../../../analise-impacto/AIMM-[CHAVE].md) | Criação / Alteração | [critérios cobertos] |
```

Se o ticket **não tem AIMM**, o patch é abri-la (PROMPT_AIMM) — não crie uma AIMM só
com a linha do elo.

### 5b — Ausente do INDEX

Adicione a linha na tabela `## Rastreabilidade: ticket → spec → código`:
```diff
+ | [`STRYxxxxxxx`](../analise-impacto/AIMM-[CHAVE].md) | [[ID]: Nome](./[dominio]/[af]/[arquivo].md) | [Domínio] | [status] | — | — | — |
```

### 5c — Status divergente

Apresente os valores das três fontes e pergunte qual é o correto antes de
sugerir o alinhamento — não decida sozinho qual prevalece.

### 5d — Referência quebrada

Mostre o link atual e o caminho provável correto (se houver), ou sinalize que o
arquivo destino não existe e pergunte como proceder.

> **No Claude Code (com ferramentas de arquivo):** após aprovação, aplique os
> patches direto no disco. **No fluxo copy-paste:** entregue os blocos `diff`
> para o usuário aplicar manualmente.

---

## PASSO 6 — Conclusão

Após os patches aprovados, conclua:

> "✅ Auditoria de rastreabilidade concluída.
>
> - Elos unilaterais fechados: [N]
> - Linhas adicionadas ao INDEX.md: [N]
> - Status alinhados: [N]
> - Pendências que dependem de decisão: [N] (listadas acima)
>
> O caminho inverso — ticket → funcionalidades impactadas — agora está consistente nas
> três fontes. Agende a próxima auditoria para [próximo release / após a próxima
> rodada de especificações e alterações de funcionalidades]."
