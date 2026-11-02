# Exportação N3 → spec-kit

Como levar a especificação validada (N3 + globais) até **código + testes** reaproveitando o **GitHub spec-kit** *vanilla* (sem fork/preset/extensão).

## Quando usar

Depois que todos os N3 de um **Agrupamento Funcional** estão com `estado: especificado` (gates CP1+CP2+CP3 aprovados na esteira de checkpoints). Roteie para `engine/prompts/PROMPT_SPECKIT_EXPORT.md`.

## A tese do encaixe

O N3 já separa **negócio** (fora do `dev-only`) de **técnico** (`dev-only`). O spec-kit separa **`spec.md`** (agnóstico de tecnologia) de **`plan.md`/`data-model.md`/`contracts/`** (técnico). O mapeamento é quase 1:1, então o exporter **pré-preenche** o que `/specify` e `/plan` gerariam e o usuário só roda o trecho a jusante (`/tasks` → `/implement`).

```
N3 aprovados + globais
   └─ PROMPT_SPECKIT_EXPORT  (resolve todo ponteiro "→ ver X" inlinando o conteúdo)
        └─ workspace spec-kit (vanilla):
             .specify/memory/constitution.md
             specs/NNN-[agrupamento-funcional]/{spec.md, plan.md, data-model.md, contracts/, quickstart.md}
        └─ spec-kit VANILLA: /speckit.tasks → /speckit.implement → código + testes
```

**Granularidade**: 1 Agrupamento Funcional (N2) = 1 "feature" do spec-kit; cada N3 = 1 User Story.

## Mapeamento artefato-a-artefato

| Artefato spec-kit | Fonte no engine |
|---|---|
| `constitution.md` | `MASTER.md` (proibições, decisões, envelope) + `API-PATTERNS` + `NFR` + `DESIGN-SYSTEM` |
| `spec.md` › User Story | cada N3, na ordem da tabela de Funcionalidades do N2 |
| `spec.md` › Acceptance Scenarios | Gherkin "Caminho feliz" + "Erros de validação" |
| `spec.md` › Edge Cases | Gherkin "Conflitos…" + "Estados especiais" |
| `spec.md` › FR-### | `## Regras de negócio` (RULES-DICTIONARY resolvido) |
| `spec.md` › Success Criteria | `## Critérios de sucesso` + `NFR` |
| `plan.md` › Technical Context | bloco "Technical Context" do `MASTER.md` |
| `data-model.md` | `global/data-models/[dominio].md` (3 camadas, resolvido) |
| `contracts/` | `## API` do N3 + `API-PATTERNS` + `ERROR-DICTIONARY` |
| `tasks.md` | **não emitido** — gerado pelo `/speckit.tasks` vanilla |

## Ajustes de N3 que tornam a exportação determinística

1. **Front-matter YAML** (`id`, `entidade`, `endpoints`, `error_codes`,
   `data_model_ref`, `depende_de`, `estado`).
2. **`## Critérios de sucesso`** (alimenta os `SC-###`).
3. **Bloco "Technical Context"** normalizado no `MASTER.md` (alimenta o `plan.md`).
4. **Mapeamento de Edge Cases** (grupos Gherkin → seção Edge Cases).
5. **Gate de completude do 3B** (PASSO 0 do exporter — bloqueia se algo não resolve).

## Escopo

Para em **código + testes** (saída do `/speckit.implement`). CI, container e deploy ficam fora — evolução futura.

## Exemplo executável

Ver `examples/speckit-pilot/` (CRUD "Contatos"): os N3 de entrada e o workspace spec-kit emitido, lado a lado.
