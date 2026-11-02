<!-- docqui: {{VERSION}} | prompt: {{PROMPT_ID}} | atualizado: {{YYYY-MM-DD}} -->
# PATTERNS.md — Catálogo de Padrões de Projeto

> Catálogo **canônico** dos padrões de projeto (design patterns) que o sistema
> adota. É a fonte única de "**como este sistema é construído**" no nível tático —
> o análogo do `DESIGN-SYSTEM.md` para o código de back-end e front-end.
>
> **Quem mantém**: arquiteto / tech lead. **Atualização**: quando um padrão novo
> é adotado ou um existente muda — **não** a cada funcionalidade.
> **Quem consome**: o `PROMPT_SDD` lê este arquivo e **referencia** as entradas
> em vez de reinventar a solução a cada funcionalidade; o dev segue o catálogo ao implementar.
>
> ℹ️ **Template do kit** — a lista abaixo é uma **baseline recomendada**; mantenha
> só os padrões que o seu sistema realmente usa e ajuste a coluna *Realização na
> stack* à stack do `MASTER.md`. Um padrão só entra aqui quando há **≥2 usos reais**
> (ou um uso + intenção clara de reuso): catálogo não é vitrine de padrões possíveis.
>
> 📐 **Toda entrada carrega um exemplo de código mínimo** — um **esqueleto** na
> linguagem da stack (forma, não implementação completa), não só um caminho. É o
> que torna "usamos Strategy/Facade" inequívoco e dá ao SDD/dev um molde para copiar.
> Ao **gerar** um `PATTERNS.md` para um sistema, gere **com** os exemplos preenchidos.

---

## 1. O que entra aqui — e o que NÃO entra

Este arquivo registra **padrões de projeto**: soluções estruturais reutilizáveis para um problema recorrente de design (Strategy, Repository, Facade, …). Cada entrada dá ao agente/dev um **vocabulário compartilhado** e uma realização única — para que a *funcionalidade 1* e a *funcionalidade 8* resolvam a mesma variabilidade do mesmo jeito.

**NÃO entra aqui** (mora em outro lugar):

| Conteúdo | Lar correto |
|---|---|
| Nomenclatura, lint, tipagem, estrutura de pastas | `MASTER.md` → *Convenções de código* |
| Idiomas do framework que não são decisão (ex.: injeção de dependência singleton, decorators nativos) | *Convenção*, não padrão — no máximo citar como "assumido pela stack" |
| Restrições de performance/estratégia de renderização (ex.: change detection, lazy loading) | `MASTER.md` → *Convenções* ou `NFR.md` → *REST* |
| Contrato de API (envelope, paginação, erros) | `API-PATTERNS.md` |
| Modelo de autorização | `AUTHZ.md` |
| Padrões visuais / componentes de UI | `DESIGN-SYSTEM.md` |

> Regra prática: se a escolha **muda a forma como o código é estruturado para
> absorver variação/mudança**, é padrão (aqui). Se é *como se escreve/organiza/nomeia*
> ou *como a stack já funciona por baixo*, é convenção (MASTER/NFR).

---

## 2. Como o SDD consome este catálogo

- No `PROMPT_SDD` §2.2 (*Padrão arquitetural adotado*) e nas seções de design (serviços, repositórios, componentes), **referencie** a entrada: `→ ver PATTERNS.md: [Padrão]` — não redescreva a mecânica do padrão.
- Se o design de uma funcionalidade exigir um padrão **ainda não catalogado**, o SDD o propõe como decisão 🏛️ e **sinaliza para promoção** a este arquivo (a decisão de adotar é de arquitetura, como no FIELD/RULES-DICTIONARY).
- Divergir do catálogo é permitido, mas é **decisão 🏛️ explícita** com justificativa.

---

## 3. Formato canônico de uma entrada

Cada padrão é registrado com:

| Campo | Conteúdo |
|---|---|
| **Padrão** | Nome consagrado (GoF ou enterprise) |
| **Intenção / quando usar** | O problema recorrente que ele resolve — o gatilho para escolhê-lo |
| **Realização na stack** | Como se materializa **nesta** stack (classe-base, interface, provider, operador…) |
| **Exemplo (código)** | **Esqueleto mínimo** na linguagem da stack — a forma do padrão, pronta para copiar (obrigatório) |
| **Referência no código** | Um ponto real no código que serve de referência (caminho), quando já existir |
| **Verificação** | Como a conformidade é garantida (obrigatório): a **regra mecanizável** — ArchUnit / ESLint / dependency-cruiser / Sonar (regra custom) — **ou** `CP4 (code review)` quando é intenção não-mecanizável. Ver "Verificação de conformidade" abaixo |
| **Quando NÃO usar** | O anti-uso — evita aplicação por excesso |

---

## 4. Catálogo — Back-end

> Ajuste *Realização na stack* à linguagem/framework do `MASTER.md`.

### [Nome do Padrão] — ex.: Repository

- **Intenção**: [problema recorrente que resolve]
- **Realização na stack**: [como se materializa — ex.: interface `[X]Repository` + implementação; ORM/driver atrás dela]
- **Exemplo (código)**:
  ```[linguagem]
  // esqueleto mínimo do padrão nesta stack — a forma, não a implementação completa
  ```
- **Referência no código**: `[caminho/no/repo]` *(quando já existir)*
- **Verificação**: [regra mecanizável (ArchUnit/ESLint/dependency-cruiser/Sonar) — ou `CP4 (code review)` se for intenção não-mecanizável]
- **Quando NÃO usar**: [anti-uso]

<!--
  Baseline enterprise comum (mantenha só o que usar):
  Repository · Service · DTO · Mapper (DTO↔entidade) · Strategy (variação de
  algoritmo em runtime) · Factory (criação condicional) · Template Method
  (esqueleto fixo + passos especializados) · Builder (montagem de objeto complexo).
-->

---

## 5. Catálogo — Front-end

> Ajuste *Realização na stack* ao framework de UI do `MASTER.md`.

### [Nome do Padrão] — ex.: Facade

- **Intenção**: [problema recorrente que resolve]
- **Realização na stack**: [como se materializa — ex.: serviço de domínio que esconde uma lib de terceiros]
- **Exemplo (código)**:
  ```[linguagem]
  // esqueleto mínimo do padrão nesta stack — a forma, não a implementação completa
  ```
- **Referência no código**: `[caminho/no/repo]` *(quando já existir)*
- **Verificação**: [regra mecanizável (ArchUnit/ESLint/dependency-cruiser/Sonar) — ou `CP4 (code review)` se for intenção não-mecanizável]
- **Quando NÃO usar**: [anti-uso]

<!--
  Baseline comum de SPA (mantenha só o que usar):
  Observer (fluxo reativo) · Facade (esconder libs de terceiros atrás de API de
  domínio) · Template Method (serviço-base de CRUD) · Proxy/Cache (memoização de
  leituras) · State (máquina de estados de domínio) · Strategy (regra/política
  plugável selecionada em runtime).
-->

---

## 6. Convenções relacionadas (referência cruzada — não são deste arquivo)

Liste aqui, com **link**, as convenções que andam junto dos padrões mas moram em outro lugar — para o dev achar rápido, sem duplicar a regra:

- Estratégia de change detection / renderização → `MASTER.md` (Convenções) ou `NFR.md`
- Lazy loading / divisão de bundles → `MASTER.md` (Convenções)
- Injeção de dependência (escopo/ciclo de vida) → *assumido pela stack*

---

## 7. Verificação de conformidade (catálogo × código)

A conformidade vive em **três camadas** — não confunda o que cada uma garante:

| Camada | Garante | Como / onde |
|---|---|---|
| **Catálogo bem-formado** | que este arquivo está completo (toda entrada com exemplo e `Verificação`) | `validate-doc.mjs` (hook + CI **deste** repo de docs) |
| **Conformidade estrutural do código** | que o código **segue** a forma do padrão, no que é mecanizável | *fitness functions* na **CI do repo de produto** — ArchUnit (back), ESLint/dependency-cruiser (front) — **ou** um quality gate (ex.: **SonarQube** com regras custom). Ligadas ao checkpoint **CP4** |
| **Conformidade de intenção** | que é *mesmo* o padrão certo (ex.: Strategy real × `switch` disfarçado) | **CP4 — code review** (humano). **Não** é mecanizável |

> **Ferramenta-agnóstico.** Este catálogo diz **o quê** garantir; a ferramenta é o
> **como**. O campo `Verificação` de cada entrada aponta a regra (ArchUnit, ESLint,
> dependency-cruiser, **Sonar**…) **ou** `CP4` quando só o review humano decide. Só o
> **estrutural** é automatizável ("entidade JPA nunca no controller", "componente não
> importa a lib de UI direto") — *intenção* fica no CP4. As fitness functions **nascem
> com os repositórios de produto** (ver o plano de implementação da instância); aqui
> fica a **fonte da verdade do que** verificar.

---

## 8. Registro de adoção / evolução

| Data | Padrão | Mudança | Por |
|---|---|---|---|
| [YYYY-MM-DD] | [padrão] | adotado / alterado / aposentado — [motivo] | [autor] |
