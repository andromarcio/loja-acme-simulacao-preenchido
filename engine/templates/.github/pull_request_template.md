## Checkpoint da esteira (gates)

Qual checkpoint este PR conclui? (marque **um**)

- [ ] **CP1 — Requisitos** (PO) → gate `requisitos`
- [ ] **CP2 — Modelo físico de dados** (DBA) → gate `modelo-dados`
- [ ] **CP1 + CP2 juntos** — só no perfil `requisitos`: o N3 e o modelo de entidades na mesma revisão → gates `requisitos` e `modelo-dados`
- [ ] **CP3 — Casos de teste** (QA) → gate `testes`
- [ ] **CP4 — Código** (Tech Lead) → gate `codigo`
- [ ] Nenhum — alteração de conteúdo que não conclui checkpoint

### Confirmação

- [ ] No(s) N3 afetado(s), marquei `aprovado: true` **apenas** no(s) gate(s) acima e preenchi `por` e `em` (AAAA-MM-DD).
- [ ] O checkpoint **anterior** já está aprovado na `main` (a esteira não permite pular etapas; no CP1 + CP2 juntos, não se aplica).
- [ ] Rodei `python scripts/gates.py promote --write` e **incluí o `modules/INDEX.md` atualizado** neste PR (o gate-check reprova espelho defasado).
- [ ] (CP2) Incluí as mudanças do `DATA-MODEL.md` neste PR, para o DBA ser revisor obrigatório.
- [ ] (CP3) Incluí o **plano de testes** em `qa/[dominio]/[agrupamento-funcional]/[funcionalidade].md` neste PR — o gate-check exige, e é o que torna o QA revisor obrigatório.
- [ ] (CP4) Incluí o **registro da implementação** em `repos/` (e a `## Implementação` do N3 preenchida) neste PR — o gate-check exige, e é o que torna o Tech Lead revisor obrigatório.

> A verificação automática **Esteira de gates — check** valida a ordem; o review
> do CODEOWNER valida quem aprova.

> **Ao mesclar na `main`:** use *Create a merge commit*. A mensagem do merge termina com uma linha `Approved-by: Nome <email>` por aprovador, no último parágrafo — o git só lê o trailer ali. Com *Default commit message* em **Pull request title and description** (Settings → General → Pull Requests), deixe as linhas no fim desta descrição; com a mensagem padrão do GitHub, que não traz a descrição, acrescente-as na hora do merge. Sem elas, o job `aprovacao` do `spec-guard` reprova, no push, o merge que toca `modules/` ou `global/`.

---

**Funcionalidade(s):** `[SIGLA]-[SAF]-[NN]` · **Ticket:** `[STRYxxxxxxx]` — AIMM em `analise-impacto/AIMM-[CHAVE].md`

[Descreva a mudança.]
