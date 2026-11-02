# Esteira de checkpoints (gates) — arquivos de adoção

Estes arquivos são **templates** (parte do `engine/`). Eles **não** rodam aqui no `docqui-caixa-engine` — destinam-se à **instância** de documentação (o repositório onde vivem os N3 reais). Copie-os para a **raiz** do repositório de docs:

| Template (aqui no engine)                          | Destino (raiz da instância)      |
|----------------------------------------------------|----------------------------------|
| `engine/templates/.github/CODEOWNERS`              | `.github/CODEOWNERS`             |
| `engine/templates/.github/workflows/gate-check.yml`| `.github/workflows/gate-check.yml` |
| `engine/templates/.github/workflows/promote-estado.yml` | `.github/workflows/promote-estado.yml` |
| `engine/templates/.github/workflows/pages.yml` | `.github/workflows/pages.yml` — o site com a `main` e as branches de entrega abertas (ver *Docs → Cadência e entrega*) |
| `engine/templates/.github/pull_request_template.md`| `.github/pull_request_template.md` |
| `scripts/gates.py` *(sincronizado do engine)*      | `scripts/gates.py`               |

## O modelo em uma frase

Cada **N3** carrega no front-matter a sua **esteira de gates**. Um gate é um **checkpoint humano**; a próxima etapa só ocorre após a aprovação da anterior.

```
🆕 → [CP1 requisitos · PO] → 📝 → [CP2 modelo-dados · DBA] → 🧱
   → [CP3 testes · QA] → 📋 PRONTO P/ DEV → [CP4 código · Tech Lead] → ✅
```

- **Fonte de verdade:** o bloco `gates` no front-matter do N3.
- **`estado`** é **derivado** dos gates (verificado pela CI, não mantido à mão).
- **`modules/INDEX.md`** é só um **espelho** regenerado por `scripts/gates.py`.
- **"Pronto para implementar?"** = `estado == especificado` (CP1+CP2+CP3 aprovados).

## Quem garante o quê

| Mecanismo | Garante |
|---|---|
| `gate-check.yml` (status check obrigatório) | a **ordem** (não pular etapas, 1 gate por PR — no PR da branch de entrega, 1 por commit —, `por`/`em` preenchidos), o **espelho do `INDEX.md` em dia** e o **artefato da etapa no PR** (CP3 → `qa/` · CP4 → `repos/`) |
| `CODEOWNERS` + branch protection | **quem** aprova cada checkpoint — o artefato-companheiro leva o dono certo ao review: CP1 `modules/` → PO · CP2 `DATA-MODEL` → DBA · CP3 `qa/` → QA · CP4 `repos/` → Tech Lead |
| `promote-estado.yml` | rede de segurança pós-merge: **acusa** (sem push) espelho do `INDEX.md` defasado na `main` |

## Configuração única (na instância)

1. Copie os arquivos da tabela acima para a raiz.
2. Edite o `CODEOWNERS` trocando `@org/*` pelos times reais.
3. Em **Settings → Branches → branch protection** da `main`:
   - *Require a pull request before merging*
   - *Require review from Code Owners*
   - *Require status checks to pass* → selecione **Esteira de gates — check** e os jobs **estrutura**, **rastreabilidade** e **entrega** do `spec-guard.yml` (copiado de `engine/templates/ci/`). O `spec-guard` roda em todo PR, então exigi-lo não trava PR que não mexe na especificação; fora de uma branch `historia/` ou `sprint/`, o `entrega` é pulado e conta como aprovado. O check só aparece na busca depois de rodar uma vez no repositório.
4. O **CP4 (código)** vive no(s) repositório(s) de implementação: replique lá um `CODEOWNERS` apontando o review para o Tech Lead. O elo com o N3 é a chave do ServiceNow + o ID da funcionalidade nos commits/PR (ver `## Implementação` do N3).

Para o Pages, selecione **GitHub Actions** como fonte e permita `main`, `sprint/*` e `historia/*` no ambiente `github-pages` (e a base do PR, se usar outro nome). O site de cada branch de entrega inclui o seletor **Branch** e **Ver alterações**, comparando com a base do PR aberto desde o ancestral comum; sem PR, a referência é a `main`, com aviso explícito. O template monta o visualizador da raiz; use `--site-dir docs` se ele estiver nessa pasta. A publicação depende de `scripts/monta-site-preview.mjs`, `scripts/lib/pages-preview.mjs` e `engine/publication/`, sincronizados pelo engine. O `sync-instance` não troca o workflow já adotado: integre este template preservando os ajustes locais, depois de a mudança estar na `main` do engine.

## Como passar um gate (fluxo do dia a dia)

1. Faça o trabalho do checkpoint (ex.: o DBA finaliza o `DATA-MODEL.md`).
2. No mesmo PR, no front-matter do N3, marque **só** aquele gate:
   ```yaml
   modelo-dados: { aprovado: true, por: "bru.dba", em: 2026-06-23, pr: 0 }
   ```
   e ajuste `estado` para o derivado (ex.: `modelo-validado`). **Inclua o artefato da etapa no mesmo PR** — é ele que torna o dono do checkpoint revisor obrigatório: CP2 → `DATA-MODEL.md` · CP3 → plano de testes em `qa/[dominio]/[agrupamento-funcional]/[funcionalidade].md` · CP4 → registro em `repos/`. Para CP3/CP4 o gate-check **exige** o artefato no diff. No perfil `requisitos`, o CP1 e o CP2 podem ir juntos, num PR só, quando a mesma revisão cobre o N3 e o modelo de entidades: marque os dois gates, com `por` e `em`, e o `estado` em `especificado`.
3. Regenere o espelho e inclua-o **no mesmo PR** (o gate-check reprova espelho defasado): `python scripts/gates.py promote --write` → commit do `modules/INDEX.md`.
4. Abra o PR. O **gate-check** valida ordem + espelho; o **CODEOWNER** aprova; faça o merge. Nada é empurrado direto na `main` — o workflow de **drift** (`promote-estado.yml`) só confirma, após o merge, que o espelho seguiu em dia. No merge para a `main`, use *Create a merge commit*, com `Approved-by: Nome <email>` no último parágrafo da mensagem: no fim da descrição do PR, se o repositório usa *Pull request title and description* como mensagem padrão; senão, acrescentado na hora do merge. Sem o trailer, o job `aprovacao` do `spec-guard` reprova o push.

## Comandos locais

```bash
python scripts/gates.py status                 # esteira (readiness) de todas as funcionalidades
python scripts/gates.py promote --write        # regenera a seção no INDEX.md
python scripts/gates.py check --base origin/main  # valida transições (como no CI)
```

> Requer Python 3.8+ e PyYAML (`pip install pyyaml`). Item 5 (integração com o
> ServiceNow — espelhar gate ↔ estado do ticket) fica a cargo da instância,
> conforme a infraestrutura disponível.
