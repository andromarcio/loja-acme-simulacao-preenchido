# `qa/` — planos de teste por funcionalidade

Guarda o **plano de testes de cada funcionalidade (N3)** — a saída do `PROMPT_QA` (opção **5B** do menu): roteiro E2E, scripts base (Playwright/Cypress/Cucumber) ou roteiro manual, sempre derivado dos `## Cenários` do N3.

## Convenção de caminho

Espelha a árvore de `modules/`:

```
qa/[dominio]/[agrupamento-funcional]/[funcionalidade].md    ← ex.: qa/vendas/checkout/f-calcular-frete.md
```

O plano segue o molde `engine/templates/qa/_template-plano.md`: massa de teste, cobertura das regras (`[ID]/RN-NN` → teste), testes por grupo, script base e pontos a resolver (❓).

## Papel na esteira (CP3)

Esta pasta é a **âncora de autorização do CP3**: o PR que aprova o gate `testes` de um N3 **deve incluir o plano de testes daqui** — o `gates.py check` (via `gate-check.yml`) reprova o flip de `testes` sem arquivo de `qa/` no diff, e o `CODEOWNERS` (`/qa/ @org/qa`) torna o **QA revisor obrigatório** desse PR. Mesmo mecanismo do CP2 com o `DATA-MODEL.md` (DBA) e do CP4 com o `repos/` (Tech Lead): *cada gate carrega o artefato da sua etapa, e o dono do artefato é quem aprova*.

## Manutenção

- Atualizou os `## Cenários` do N3 (4A/4B)? Reflita no plano — e o PR da mudança de cenários é um bom lugar para levar o plano junto.
- O plano cita os cenários pelo texto do Gherkin do N3; não duplique regras de negócio aqui — referencie o N3.
