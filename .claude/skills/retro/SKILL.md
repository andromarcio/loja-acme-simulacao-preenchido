---
name: retro
description: >-
  Registra aprendizados da sessão de trabalho de forma permanente, atualizando o
  artefato certo — skill, validador, CLAUDE.md ou template do engine. Acione ao
  final de uma sessão em que houve correção de rumo, decisão nova, dúvida
  recorrente ou desvio repetido pego por validador, ou quando o usuário falar de:
  registrar aprendizado, lição aprendida, retro, retrospectiva, aprender com
  isso, evoluir a skill, atualizar a skill com o que aprendemos.
argument-hint: "[aprendizado específico, opcional]"
---

# /retro — Aprendizado contínuo

O Claude **não retém memória entre sessões**. O que ele "aprende" numa sessão só persiste se virar artefato versionado no repositório. Esta skill transforma aprendizados da sessão em mudanças permanentes, no lugar certo.

**Uso**: `/retro` (revisa a sessão inteira) ou `/retro "aprendizado específico"`.

---

## PASSO 1 — Coletar candidatos

Revise a sessão atual (ou parta de `$ARGUMENTS`, se fornecido) e liste candidatos a aprendizado:

- **Correções de rumo** — o usuário corrigiu algo que foi feito "pelo padrão antigo".
- **Decisões novas** — escolhas feitas na sessão que ainda não estão documentadas.
- **Dúvidas recorrentes** — a mesma pergunta surgiu mais de uma vez (sinal de skill/doc ambígua).
- **Desvios repetidos** — o mesmo erro pego por validador várias vezes (sinal de regra que precisa ficar mais explícita — ou virar código).

Se não houver nenhum candidato real, diga isso e encerre. Não invente aprendizado.

## PASSO 2 — Classificar o destino

Cada aprendizado tem um lugar certo. Regra de ouro: **regra em texto é sugestão; regra em código é garantia** (é a filosofia do `spec-guard.mjs`).

| Tipo de aprendizado | Destino |
|---|---|
| Comportamento/persona de uma skill | `.claude/skills/<skill>/SKILL.md` ou `references/` |
| Regra estrutural verificável mecanicamente | `scripts/validate-*.mjs` ou `scripts/hooks/spec-guard.mjs` |
| Convenção geral do projeto (vale para qualquer tarefa) | `CLAUDE.md` |
| Conteúdo de prompt ou template do engine | `engine/prompts/` ou `engine/templates/` |

## PASSO 3 — Propor e confirmar

Apresente uma lista `aprendizado → destino → mudança proposta` e peça confirmação antes de aplicar. Exceção: se o usuário já pediu diretamente o registro de um aprendizado específico, aplique direto.

## PASSO 4 — Aplicar cirurgicamente

- Antes de adicionar, **verifique se regra equivalente já existe** no destino — se existir, refine-a em vez de duplicar.
- Menor diff possível; siga o estilo do arquivo destino.
- Mudança em skill/prompt/template é evolução do engine: registre na seção da versão nova do `CHANGELOG.md` e faça o *bump* em todos os lugares que o `engine/VERSIONING.md` lista. Nada fica no `Unreleased` — o eval reprova.
- Commite com mensagem `retro: <aprendizado em uma linha>`.

---

## Recorrência

A regra §5 do `CLAUDE.md` instrui o Claude a **propor `/retro` proativamente** ao final de sessões em que houve aprendizado — assim a captura não depende de alguém lembrar de pedir.
