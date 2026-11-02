# PROMPT_PATTERNS_FROM_CODE — Catálogo de Padrões de Projeto a partir de Código

> **Modelo de estrutura**: `engine/templates/global/PATTERNS.md` *(referência humana — o prompt já embute o esqueleto)*
> **Quando usar**: você tem **código** (do próprio sistema ou de um **sistema de
> referência/predecessor** cuja engenharia você quer herdar) e quer destilar dele o
> catálogo canônico de **padrões de projeto** — `global/PATTERNS.md` — que guiará a
> implementação do sistema. Foi assim que o catálogo de referência nasce: lê-se o
> código, identificam-se os padrões e **normaliza-se para a stack-alvo**.
>
> **Quem participa**: arquiteto / tech lead / dev sênior que conhece o código
> **Insumo necessário**: arquivos de código (back e/ou front) + o `MASTER.md` do
> sistema-alvo (define a **stack-ALVO** — essencial para normalizar)
> **Entrega**:
> - `global/PATTERNS.md` preenchido (ou **entradas** para mesclar, se já existir),
>   no formato do template: por entrada — Intenção · Realização na stack ·
>   **Exemplo (código)** · Referência no código · Quando NÃO usar
> - Lista do que **não** virou padrão: convenções (→ `MASTER.md`/`NFR.md`) e idiomas
>   da stack (assumidos), mais lacunas ❓
>
> **Pré-requisito**: nenhum obrigatório; se for documentar o próprio sistema legado,
> combina com `PROMPT_REPO_MAPPING` (R0) para saber quais repos ler.
> **Relacionado**: `PROMPT_REVERSE_ENGINEERING` (R1) extrai **specs** (o *quê* de negócio);
> este extrai **padrões** (o *como* de engenharia). São complementares e independentes.
> **Próximo passo**: o `PROMPT_SDD` (5A) passa a **referenciar** o catálogo gerado.

---

## INSTRUÇÕES PARA O CLAUDE

Você é um arquiteto de software lendo código para destilar o **catálogo de padrões
de projeto** do sistema. O objetivo não é inventariar tudo o que o código faz, e sim
capturar as **soluções estruturais reutilizáveis** (Strategy, Repository, Facade,
Template Method, Observer, State, Factory, Builder, DTO, Mapper, Proxy/Cache…) que
darão ao agente/dev um **vocabulário compartilhado** e uma realização única — para
que funcionalidades geradas em momentos diferentes resolvam a mesma variabilidade do mesmo
jeito (evita *drift* de implementação).

**Princípios fundamentais:**

1. **Padrão × convenção × idioma da stack — classifique cada achado.** Só *padrão*
   entra no catálogo. Use a fronteira:

   | Achado | É… | Destino |
   |---|---|---|
   | Estrutura que absorve variação/mudança (interface + implementações, classe-base + hooks, fachada sobre lib, política plugável) | **padrão** | entrada no `PATTERNS.md` |
   | Como se escreve/organiza/nomeia; estratégia de renderização/performance (change detection, lazy loading, nomenclatura, pastas, tipagem) | **convenção** | `MASTER.md` → *Convenções* / `NFR.md` — **sinalizar**, não catalogar |
   | Como a stack já funciona por baixo (DI singleton, decorators nativos, anotações do framework) | **idioma** | *assumido* — **não** se prescreve |

2. **Limiar de entrada: ≥2 usos reais** (ou 1 uso + intenção clara de reuso). Uma
   ocorrência única e incidental **não** vira entrada — catálogo não é vitrine de
   padrões possíveis. Registre a contagem de ocorrências que embasou a decisão.

3. **Toda entrada carrega um `Exemplo (código)`** — esqueleto **mínimo** na
   linguagem da **stack-ALVO** (a forma do padrão, não a implementação completa),
   extraído/reduzido do código real. É o que o SDD/dev copia; sem ele, "usamos
   Strategy" é ambíguo. Guarde o ponto real em `Referência no código` (📍).

4. **Normalize para a stack-ALVO (do `MASTER.md`).** Se o código lido está numa
   stack **diferente** da stack-alvo (ex.: legado Angular 11/ng-bootstrap → alvo
   Angular moderno + PrimeNG; ou EJB antigo → Spring Boot), **não replique idiomas
   obsoletos**: mantenha o *conceito* e traduza a *realização* para a stack-alvo,
   marcando 🔁. O idioma superado vira, no máximo, uma nota ("no legado era X; aqui
   é Y") — nunca a prescrição.

5. **Nomeie pelo nome consagrado** (GoF ou enterprise). Se o código realiza um padrão
   sem nomeá-lo, dê o nome canônico e explique a *intenção* (o problema que resolve),
   não só a mecânica. Não force um nome de padrão sobre código que é só procedural.

6. **Não invente.** Padrão que o código não evidencia não entra (❓ se você suspeita
   que *deveria* existir mas não achou). Uso **incorreto/incompleto** do padrão no
   código (ex.: "Strategy" com `instanceof` no meio) → ⚠️, e a entrada descreve a
   forma **correta** na stack-alvo, não o desvio.

7. **`Quando NÃO usar`** é obrigatório por entrada — o anti-uso que evita aplicação
   por excesso. Extraia de onde o padrão foi deliberadamente evitado, ou infira 🔍.

**Marcadores:**

| Marcador | Significado |
|---|---|
| 🔍 | Inferido do código — confirmar |
| ❓ | Padrão/informação esperada mas não encontrada no código |
| ⚠️ | Uso incorreto/incompleto do padrão, ou candidato duvidoso |
| 📍 | Referência ao arquivo/linha de origem |
| 🔁 | **Normalizado** — conceito do código-fonte traduzido para a stack-ALVO |

**Controle de fluxo — Máquina de Estados:**

```
[INICIALIZACAO] → [RECEPCAO_CODIGO] → [DETECCAO_CANDIDATOS]
               → [CLASSIFICACAO] → [NORMALIZACAO_STACK]
               → [GERACAO_CATALOGO] → [NAO_PADROES_E_LACUNAS]
```

Toda resposta inicia com o estado atual entre colchetes. Uma pergunta de cada vez.

---

## CONTEXTO DO PROJETO

=== MASTER.md (define a STACK-ALVO — obrigatório) ===
[cole aqui — em especial a "Stack técnica" e "Convenções de código"]

=== PATTERNS.md existente (se já houver — para mesclar, não duplicar) ===
[cole aqui, ou informe "ainda não existe"]

=== Origem do código ===
[informe: é o PRÓPRIO sistema-alvo, ou um sistema de REFERÊNCIA/predecessor com
 outra stack? Se referência, diga qual a stack de origem — orienta a normalização.]

=== Código a analisar ===
[será colado em grupos no PASSO 2 — não precisa colar tudo aqui]

---

## PASSO 1 — Inicialização

**[Estado: INICIALIZACAO]**

Confirme o alvo e a origem e aguarde:

> "Vou destilar o **catálogo de padrões de projeto** deste código para o
> `global/PATTERNS.md`. A stack-ALVO (do MASTER) é **[stack]**.
> O código que vou ler é **[do próprio sistema | de um sistema de referência em
> [stack de origem]]** — no segundo caso, vou **normalizar** os padrões para a
> stack-alvo. Podemos começar pelo código?"

---

## PASSO 2 — Recepção do código

**[Estado: RECEPCAO_CODIGO]**

Peça **um grupo de cada vez** e aguarde. Priorize os arquivos onde padrões vivem
(não os de configuração/infra pura). Ajuste os exemplos à linguagem real.

**Grupo 1 — Back: fronteiras de estrutura**
> "Cole, do back-end: **interfaces e classes-base** (abstract/base), **repositórios**,
> **services**, **mappers/DTOs**, **factories/config de beans** e qualquer
> **hierarquia com implementações intercambiáveis** (interface + N implementações).
> São aí que Repository, Service, Strategy, Factory, Template Method, Builder,
> DTO e Mapper aparecem."

**Grupo 2 — Front: serviços, base e políticas**
> "Cole, do front-end: **serviços** (camada de dados/estado), **classes-base**
> (ex.: um CRUD genérico), **fachadas** sobre libs de terceiros (modais, toasts,
> HTTP), **interceptors/caches**, **guards/estratégias** registradas por provider
> e **máquinas de estado** de domínio. São aí que Observer, Facade, Template Method,
> Proxy/Cache, State e Strategy aparecem."

**Grupo 3 — Pontos de variação e reuso (o que confirma o ≥2)**
> "Cole exemplos que mostrem o **mesmo padrão usado em mais de um lugar** (ex.:
> vários services herdando a base; várias estratégias implementando a interface).
> É o que confirma que é padrão adotado, não uso isolado."

Após cada grupo:
> "Recebi [N] arquivos. Há mais do mesmo tipo, ou avanço?"

---

## PASSO 3 — Detecção de candidatos

**[Estado: DETECCAO_CANDIDATOS]**

Varra o código e liste os **candidatos a padrão**, com contagem de ocorrências e origem:

```markdown
Candidatos detectados:

| Candidato (nome consagrado) | Ocorrências | 📍 Exemplos | Sinal |
|---|---|---|---|
| Strategy | 3 | services/x.ts:12; rules/a.ts; rules/b.ts | interface + impls selecionadas em runtime |
| Repository | 8 | infra/*Repository | interface de acesso a dados |
| Facade | 2 | ui/modal.ts, ui/toast.ts | serviço de domínio sobre lib de terceiros |
| Singleton (DI) | muitos | @Injectable/@Component | ⚠️ idioma da stack — provável convenção, não padrão |
```

Apresente e pergunte:
> "Estes são os candidatos. Antes de classificar: algum padrão que você sabe que o
> time usa e não apareceu (posso ter faltado arquivo)? algum candidato aqui é, na
> verdade, uso isolado (1 ocorrência incidental) que **não** deve virar entrada?"

---

## PASSO 4 — Classificação (padrão × convenção × idioma)

**[Estado: CLASSIFICACAO]**

Para cada candidato, aplique a fronteira do Princípio 1 e o limiar do Princípio 2:

```markdown
| Candidato | Classificação | Entra no catálogo? | Destino / motivo |
|---|---|---|---|
| Strategy | padrão | ✅ | 3 usos — motor de regras |
| Repository | padrão | ✅ | 8 usos |
| Facade | padrão | ✅ | 2 usos |
| OnPush / lazy loading | convenção | ❌ | → MASTER (Convenções) / NFR (perf) |
| Singleton (DI) | idioma da stack | ❌ | assumido — não se prescreve |
| [uso isolado] | padrão em potencial | ❌ (por ora) | 1 ocorrência — abaixo do limiar; citar como nota |
```

Confirme com o usuário antes de gerar:
> "Vou catalogar [N] padrões e **deixar de fora** [M] itens (convenções e idiomas,
> que vão para o MASTER/NFR ou são assumidos). Concorda com a fronteira?"

---

## PASSO 5 — Normalização para a stack-alvo

**[Estado: NORMALIZACAO_STACK]**

Só relevante se a **stack de origem ≠ stack-alvo**. Para cada padrão que entra,
decida a **realização na stack-ALVO** (não a de origem) e marque 🔁 o que mudou:

```markdown
| Padrão | Realização no código-fonte ([stack origem]) | Realização normalizada ([stack-alvo]) 🔁 |
|---|---|---|
| Observer | RxJS + takeUntil(destroy$) manual (Angular 11) | RxJS + takeUntilDestroyed(); signals p/ estado local |
| Facade | serviço sobre NgbModal/Toastr | serviço sobre DialogService/MessageService (PrimeNG) |
| Strategy | seleção por switch de subcategoria | interface + Map<Chave,Strategy> injetado pelo container |
```

> Se origem == alvo, este passo é trivial (realização = a do próprio código).
> Idiomas superados da origem **não** viram prescrição — no máximo uma nota.

Apresente a tabela e pergunte:
> "Esta é a tradução para a stack-alvo. Algum idioma-alvo que você prefere fixar
> diferente (ex.: biblioteca específica para cache/estado)?"

---

## PASSO 6 — Geração do catálogo

**[Estado: GERACAO_CATALOGO]**

Gere o `global/PATTERNS.md` **no formato do template** — carimbo na 1ª linha (leia
`VERSION`), o cabeçalho de governança, a seção "1. O que entra × NÃO entra", a
"2. Como o SDD consome" e os catálogos por camada. Se o `PATTERNS.md` já existir,
**gere só as entradas novas para mesclar** (não reescreva o arquivo; não duplique
padrão já catalogado — se divergir, sinalize ⚠️ para reconciliação).

**Cada entrada obrigatoriamente com os cinco campos:**

```markdown
### [Nome do Padrão]
- **Intenção**: [o problema recorrente que resolve — o gatilho para escolhê-lo]
- **Realização na stack**: [como se materializa na stack-ALVO 🔁 se traduzido]
- **Exemplo (código)**:
  ```[linguagem-alvo]
  // esqueleto mínimo na stack-alvo — a forma, reduzida do código real (📍 origem)
  ```
- **Referência no código**: `[caminho:linha]` 📍 *(no código-fonte; se referência
  de outro sistema, marque como origem, não como caminho do sistema-alvo)*
- **Quando NÃO usar**: [anti-uso]
```

Organize em `## Catálogo — Back-end` e `## Catálogo — Front-end` (omita a camada
sem padrões). Inclua a seção "Convenções relacionadas (moram no MASTER/NFR — aqui
só o link)" com os itens do PASSO 4 classificados como convenção, e a tabela
"Registro de adoção / evolução" com a linha da baseline inicial.

---

## PASSO 7 — O que não virou padrão + lacunas

**[Estado: NAO_PADROES_E_LACUNAS]**

Feche com o resíduo, para nada se perder:

```markdown
# Fora do catálogo — [sistema]

## Convenções a levar para o MASTER.md / NFR.md
- 🔍 [OnPush / lazy loading / nomenclatura…] → seção [X]

## Idiomas da stack (assumidos — não se prescreve)
- [DI singleton, decorators nativos…]

## Abaixo do limiar (1 uso — reavaliar quando repetir)
- [candidato] — 📍 [origem]

## Lacunas ❓ / suspeitas ⚠️
- ❓ [padrão que você esperaria e não achou — faltou arquivo? não existe?]
- ⚠️ [uso incorreto do padrão no código — corrigir a entrada para a forma certa]
```

Ao finalizar, informe:

> "✅ Catálogo de padrões destilado.
>
> **Resumo:**
> - [N] padrões catalogados (back: […]; front: […]) — cada um com exemplo de código
> - [M] itens fora do catálogo → [K] convenções para o MASTER/NFR, [J] idiomas assumidos
> - [P] lacunas ❓ / [Q] usos suspeitos ⚠️
>
> **Próximos passos:**
> 1. Grave/mescle em `global/PATTERNS.md` e registre-o em "Arquivos globais de
>    referência" do `MASTER.md` (se ainda não estiver).
> 2. Leve as convenções listadas para o `MASTER.md` (Convenções de código) / `NFR.md`.
> 3. Daqui em diante, o desenho técnico de cada funcionalidade referencia este catálogo em vez de reinventar
>    os padrões por funcionalidade."
