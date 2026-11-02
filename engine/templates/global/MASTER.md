# MASTER.md
> Arquivo de contexto global, independente do módulo ou nível em trabalho.
> No Claude Code é carregado automaticamente a cada sessão via o `CLAUDE.md` da
> instância (ver `global/CLAUDE.md`); no fluxo copy-paste/CLI, cole-o em toda sessão.

---

## Identificação do sistema

- **Sigla**: [sigla do sistema — 5 letras maiúsculas, ex.: SIGEF]
- **Nome**: [nome do sistema por extenso — ex.: Sistema de Gestão de Fundos]
- **Descrição**: [descrição em uma frase]
- **Versão atual**: [a definir]
- **Repositório de docs**: [nome-docs] (este repositório)

> **Fonte única da identidade do sistema.** O N0 (`global/N0_PRODUCT_VISION.md`) repete a
> sigla no subtítulo, mas a **lê daqui** — não a redefine; o `validate-doc` reprova o N0 cuja
> sigla diverge desta. A descrição de uma frase aqui é o resumo; o `## Propósito` do N0 a desenvolve.
>
> A **sigla do sistema** (5 letras) identifica o produto como um todo e é **distinta** da
> `[SIGLA]` de **domínio** (3 letras, usada nos IDs `[SIGLA]-[SAF]-[NN]`) descrita
> na seção *Identificadores únicos* abaixo.

---

## Arquétipo do produto

<!--
  Declara o TIPO de produto que esta instância documenta. Linha máquina-legível:
  prompts e validadores (validate-doc.mjs) a leem para ligar/desligar exigências.
  Valores aceitos: transacional | ml-dados | cli-biblioteca. Ausente/valor
  desconhecido → transacional (comportamento clássico do framework).
-->

- **Arquétipo**: `transacional`

| Arquétipo | Quando usar | O que muda no framework |
|---|---|---|
| `transacional` | Sistema de negócio com UI + banco relacional (CRM, ERP, portais) | Comportamento clássico — nada muda |
| `ml-dados` | Pipelines de dados/ML: preparação, treino, avaliação, serving | N2: `Telas`/`Permissões por perfil` opcionais · N3: superfície típica `CLI`/`Job/Pipeline` com `## Execução e operação` no lugar de `## Comportamento de tela` · data-model pode usar o fragmento de **artefatos** (dataset/cache/checkpoint) · protótipos e APF opcionais (APF pressupõe transações de negócio) · engenharia reversa pela **Trilha B** do `PROMPT_REVERSE_ENGINEERING` |
| `cli-biblioteca` | Ferramentas de linha de comando, SDKs e bibliotecas | Igual a `ml-dados`, sem a ênfase em artefatos de dados — superfície típica `CLI`/`API` |

> A superfície de **cada funcionalidade** continua sendo declarada no `## Superfície` do N3 —
> o arquétipo dá o padrão do produto (e o validador usa a superfície da funcionalidade, não o
> arquétipo, para exigir `Comportamento de tela` vs `Execução e operação`). Um produto
> `transacional` pode ter funcionalidades `Job` (ex.: *gerar cobrança mensal*) e um `ml-dados`
> pode ter uma tela de acompanhamento.

---

## Perfil de escopo

<!--
  Declara ATÉ ONDE na esteira esta instância vai. Linha máquina-legível:
  o PROMPT_MENU e o gates.py a leem para encurtar o fluxo. Valores aceitos:
  completo | requisitos. Ausente/valor desconhecido → requisitos.
  As seções e itens técnicos deste arquivo (stack, repositórios, convenções de código,
  campos globais, padrão de API…) ficam entre os marcadores perfil:completo: o
  `init-instance --perfil requisitos` semeia o MASTER SEM eles, e o `completo`, com
  eles (os marcadores somem nos dois casos).
-->

- **Perfil**: `requisitos`

| Perfil | Quando usar | O que muda no framework |
|---|---|---|
| `completo` | Instância que documenta **e** leva ao código (spec → banco → testes → implementação) | Comportamento clássico — esteira inteira `requisitos → modelo-dados → testes → codigo`, todas as opções do menu |
| `requisitos` | Instância **só de requisitos**: para no negocial + data-model, sem passada técnica nem codificação | Menu só com as opções negociais (esconde 1B/2B/3B/4B, R1/R3/R4, Fase 5 e a exportação spec-kit) · esteira encurta para `requisitos → modelo-dados`, e o CP2 entrega `especificado` (📋 pronto para desenvolvimento — o estado final da esteira deste perfil); o CP1 e o CP2 podem ir juntos, num PR só · a camada de código (`mapa-codigo`, `valida-artefatos-previstos`, CI de código) fica inerte · o MASTER nasce **sem as seções técnicas** (stack, repositórios, convenções de código, campos globais, padrão de API) |

> O corte do perfil `requisitos` é no **3A**: mantém-se todo o lado negocial (N0, N1A, N2A, 3A, CRUD/Wizard, cenários, protótipos, auditoria, NFR) **e o data-model** (`PROMPT_DATA_MODEL_negocio`, gate `modelo-dados`); a especificação técnica (3B) e a implementação ficam de fora. A contagem APF não é etapa do Docqui em nenhum perfil: é feita pelo agente de contagem, fora do Docqui. O perfil é ortogonal ao arquétipo: um `transacional` ou um `ml-dados` pode rodar em `completo` ou `requisitos`.

---

## Cadência de entrega

<!--
  Declara a UNIDADE DE ENTREGA desta instância — e, com ela, a branch em que o trabalho
  em andamento vive. Linha máquina-legível: lida por scripts/lib/instancia.mjs (a
  valida-entrega, a valida-commits-ticket, o reverte-ticket e o preview do Pages).
  Valores aceitos: história | sprint. Ausente → nenhuma regra de branch (instâncias
  anteriores à 6.0.0: tudo entra direto na main).
  Regra das duas: a `main` só recebe o que foi ENTREGUE — é o retrato do sistema em
  produção (no perfil `requisitos`, das specs entregues). O que ainda não foi entregue
  vive na branch da unidade de entrega e se consulta no preview do site.
-->

- **Cadência**: `sprint`

| Cadência | Quando usar | Branch | Merge na `main` |
|---|---|---|---|
| `história` | Cada história é implementada e aprovada sozinha — desenvolvimento por agentes, com o humano aprovando cada entrega | `historia/<CHAVE>`, com a AIMM do ticket | a história entregue: a AIMM `concluído` e as funcionalidades no estado final da esteira |
| `sprint` | A entrega é a sprint — o caso mais comum em times com cerimônias de sprint | `sprint/<id>`, com a AIMM da sprint (`AIMM-<id>.md`, aberta no planejamento) e as AIMMs dos tickets planejados | a sprint fechada com o relatório de entrega: só os tickets entregues — os que ficaram são retirados com `node scripts/reverte-ticket.mjs <CHAVE>` e voltam na próxima sprint |

> Na cadência `sprint`, todo commit que toca a spec (`modules/`, `global/`, `qa/`, `prototypes/`, `analise-impacto/`) cita **uma** chave — a do ticket, ou o id da sprint nos commits da AIMM da sprint. É o que permite tirar uma história da branch sem arrastar outra (`node scripts/valida-commits-ticket.mjs`). Os requisitos da sprint em andamento ficam consultáveis no preview do site (`/sprint/<id>/`) até o merge.

> **Prefixos canônicos:** `historia/<CHAVE>` identifica a branch de história (ex.: `historia/STRY0000000`), com a AIMM da mesma chave; `sprint/<id>` identifica a sprint. PRs temporários de um checkpoint usam `checkpoint/<CHAVE>-<etapa>` com destino à branch de entrega, como no simulador. Não trate a chave de uma história como id de sprint.

---

<!-- perfil:completo -->
## Stack técnica

- **Frontend**: [framework, linguagem, design-system]
- **Backend**: [framework, linguagem]
- **Banco de dados**: [SGBD]
- **Autenticação**: [mecanismo]
- **Fila / Jobs**: [a definir] ⚠️
- **Storage**: [a definir] ⚠️
- **E-mail**: [a definir] ⚠️

---

## Technical Context (normalizado para exportação ao spec-kit)

<!--
  Bloco com os MESMOS campos da seção "Technical Context" do plan.md do spec-kit.
  O PROMPT_SPECKIT_EXPORT copia estes valores direto para o plan.md, evitando que
  o /plan precise rederivar a stack. Performance/Constraints derivam do global/NFR.md.
  Campos sem decisão ficam como NEEDS CLARIFICATION (o spec-kit trata isso nativamente).
-->

| Campo (spec-kit) | Valor |
|---|---|
| Language/Version | [ex.: TypeScript 5.x / Java 17 — ou NEEDS CLARIFICATION] |
| Primary Dependencies | [ex.: Next.js 14, Prisma, Zod / Spring Boot, JPA] |
| Storage | [ex.: PostgreSQL 16 / Oracle — ou N/A] |
| Testing | [ex.: Vitest + Playwright (E2E em `frontend/e2e/[dominio]/`) / JUnit + RestAssured] — a pasta de E2E é onde o `PROMPT_QA` põe o script |
| Target Platform | [ex.: Linux server (container) / navegador / nó de GPU] |
| Project Type | [single / web (frontend+backend) / mobile / ml-pipeline / cli] |
| Performance Goals | [`→ ver NFR: DES-*` — ex.: p95 < 200ms] |
| Constraints | [`→ ver NFR: SEG-*/REST-*` — ex.: SSO corporativo, multitenant] |
| Scale/Scope | [ex.: N usuários, M funcionalidades no Agrupamento Funcional] |

---

## Repositórios do sistema

| Repositório | Responsabilidade |
|---|---|
| [nome-backend] | API REST, regras de negócio |
| [nome-frontend] | Interface web |
| [nome-docs] | Documentação e especificações (este repo) |

---

## Convenções de código

> **Padrões de projeto** (Strategy, Repository, Facade, …) **não** ficam aqui —
> vivem no catálogo `global/PATTERNS.md`. Esta seção cobre *como se escreve/organiza*
> o código (nomes, lint, tipagem, pastas) e as **restrições de renderização/performance**
> (ex.: estratégia de change detection, lazy loading) — que são convenção, não padrão.

### Nomenclatura
- Rotas de API: kebab-case (ex.: `/recurso-exemplo`)
- Tabelas/colunas do banco: [snake_case / UPPER_SNAKE_CASE], em português ⚠️ *(confirmar padrão da organização)*
- [demais convenções de classes, arquivos e testes conforme a stack escolhida]

### Frontend
- [regras de tipagem, lint e modelos — ex.: `strict`, proibir `any`, DTOs a partir do contrato da API]

### Backend
- [regras de persistência, validação de entrada e separação DTO ⟷ entidade]

### Estrutura de pastas ⚠️ *(exemplo — ajustar à organização do projeto)*
```
[nome-frontend]/
  [estrutura por camada/funcionalidade]

[nome-backend]/
  [estrutura por camada/módulo]
```

---
<!-- /perfil:completo -->

## Integrações externas

<!-- Sistemas de que este depende ou com que troca dados, na ótica do negócio: o que vem de cada um e como (integração via API, arquivo, referência digitada). Vale nos dois perfis — é daqui que saem as AIE da contagem (global/ALI-AIE-MAP.md) e as fontes `externo: [Sistema]` dos N3. -->

- [Sistema] — [o que fornece e como: integração via API / arquivo / referência digitada] ⚠️

---

## Identificadores únicos (IDs)

Cada nível da hierarquia de documentação possui um ID único para rastreabilidade entre ferramentas externas (Jira, Azure DevOps, etc.).

| Nível | Formato | Exemplo |
|---|---|---|
| Ticket de origem (entrada) | chave da **ferramenta de origem** — externa, **não gerada aqui**; é a fonte de verdade do ticket. Tipos suportados: `servicenow` (`STRY…`), `issue` (`ISSUE-…`), `experimento` (`EXP-…`) — ver *Origem do ticket* abaixo | `STRY0012345` · `ISSUE-482` · `EXP-2026-003` |
| Domínio (N1) | `[SIGLA]` — sigla do domínio (sempre 3 letras maiúsculas) definida na criação do domínio | `CRM` |
| Agrupamento Funcional (N2) | `[SIGLA]-[SAF]` — sigla do domínio + sigla do Agrupamento Funcional (sempre 3 letras maiúsculas) | `CRM-CLI` |
| Funcionalidade (N3) | `[SIGLA]-[SAF]-[NN]` — 2 dígitos sequenciais dentro do Agrupamento Funcional | `CRM-CLI-01` |

**Regras:**
- O ticket entra pela ferramenta de origem; o framework **referencia** a chave (nunca cria ID próprio para o ticket), abre a AIMM do ticket em `analise-impacto/AIMM-<CHAVE>.md` e registra a chave na seção `## Origem` do N3
- A sigla do domínio é definida uma única vez na criação do N1 e nunca alterada
- A sigla do Agrupamento Funcional é definida **no N1** (ao listar os Agrupamentos Funcionais do domínio) e **reutilizada** pelo N2; é única dentro do domínio e nunca reutilizada após exclusão; deriva do nome do Agrupamento Funcional (ex.: Usuários → `USR`)
- A numeração de Funcionalidades é sequencial dentro do Agrupamento Funcional e não reutilizada após exclusão
- O ID fica no cabeçalho de cada artefato, logo abaixo da linha `**Nível X**`

### Origem do ticket (plugável)

<!--
  A ferramenta de onde vêm os tickets varia por organização: ServiceNow num time de
  produto corporativo, issues (GitHub/GitLab/Jira) num time OSS, registro de
  experimentos num time de pesquisa. Declare aqui a origem padrão desta instância;
  o front-matter de cada N3 registra `origem: { tipo, chave }` (o campo legado
  `servicenow:` de instâncias ≤1.5.x continua aceito pelos scripts).
  Os scripts de rastreabilidade reconhecem a chave pelo prefixo (STRY\d+ | ISSUE-\d+ |
  EXP-<id>) ou, em qualquer formato, pelo link da AIMM (`AIMM-<CHAVE>.md`).
-->

- **Origem padrão desta instância**: [servicenow | issue | experimento] — [ferramenta/URL]

| Tipo | Formato da chave | AIMM em `analise-impacto/` | Exemplo |
|---|---|---|---|
| `servicenow` | `STRY` + dígitos | `AIMM-STRY0012345.md` | `STRY0012345` |
| `issue` | `ISSUE-` + número | `AIMM-ISSUE-482.md` | `ISSUE-482` |
| `experimento` | `EXP-` + identificador | `AIMM-EXP-2026-003.md` | `EXP-2026-003` |

### Rastreabilidade ponta a ponta (ticket → spec → código)

Todo desenvolvimento começa por um ticket na ferramenta de origem e é rastreável até o código pela cadeia de IDs:

```
Ticket ([tipo] [chave] — ex.: ServiceNow STRYxxxxxxx, issue ISSUE-123, experimento EXP-…)
   └─ AIMM (analise-impacto/AIMM-<CHAVE>.md)  ← o que o ticket pede, vai mudar e mudou
        └─ N3 Funcionalidade (SIGLA-SAF-NN)  ← seção "Origem" guarda a chave e o link da AIMM
             └─ Código (commit/PR)    ← referencia a funcionalidade e o ticket
```

- **Ticket → N3**: a chave de origem é registrada na seção `## Origem` de cada funcionalidade, com o link da AIMM; o elo recíproco é a `## Funcionalidades` da AIMM (`analise-impacto/AIMM-<CHAVE>.md`). Cada critério de aceite é analisado e vira uma regra de negócio, um `## Cenário` (Gherkin) ou ambos — rastreabilidade semântica, não só por ID.
- **Critério de aceite → N3** *(quando a fonte numera)*: a coluna `Critérios cobertos` do `## Origem` abre com as referências `CA-n`, no mesmo número que a ferramenta de origem usa. É o elo que a **contagem por sprint** exige: cada funcionalidade impactada sai com a chave do ticket **e** o número do critério. Quando a fonte não numera os critérios, a coluna sai `—` e a rastreabilidade fica só pela chave — não se inventa número.
<!-- perfil:completo -->
- **N3 → código**: seção `## Implementação` do N3 — a coluna **Repositório** é definida já no 3B (nomes do inventário `repos/INDEX.md`), dizendo em qual repo (MFE, microsserviço, back, front) cada parte da funcionalidade vive; caminho/branch entram após o dev — + coluna na tabela `Rastreabilidade` do `modules/INDEX.md`.
- **Convenção de commit/PR** *(fecha a cadeia no git)*: `tipo([SIGLA]-[SAF]-[NN]): [resumo] ([origem] [chave])` — ex.: `feat(CRM-CLI-01): cadastro de cliente (ServiceNow STRY0012345)`

<!-- /perfil:completo -->
---

## Nomenclatura de funcionalidades

Funcionalidades são nomeadas sempre no **infinitivo**, seguindo o padrão:

**`Verbo + Entidade + Complemento (quando necessário)`**

| Regra | Exemplo |
|---|---|
| Criação | `Cadastrar Cliente` |
| Edição | `Editar Endereço de Entrega` |
| Exclusão | `Excluir Produto` |
| Listagem sem filtro | `Listar Pedidos` |
| Listagem com filtro | `Pesquisar Pedidos` |
| Ação específica | `Aprovar Solicitação de Crédito` |

**Regras:**
- Sempre infinitivo — nunca substantivo (`Cadastro de Cliente` ❌) nem gerúndio (`Cadastrando Cliente` ❌)
- Listagens que exibem apenas a lista, sem opções de filtro → verbo **Listar**
- Listagens que possuem campos de filtro ou busca → verbo **Pesquisar**
- Complemento é opcional — usar apenas quando necessário para distinguir funcionalidades de mesma entidade

---

## Nomenclatura de entidades e campos

<!-- perfil:requisitos -->
Entidades e atributos são nomeados em **português**. O `global/DATA-MODEL.md` e os fragmentos por domínio registram o modelo de entidades de negócio, com atributos em Label PO, sem definição física de banco.
<!-- /perfil:requisitos -->
<!-- perfil:completo -->
Entidades e campos são nomeados em **português**. A nomenclatura de campos segue três camadas com responsabilidades distintas. **A única fonte de verdade para Label Dev e campo banco é o `global/DATA-MODEL.md`.** Os N3 usam apenas Label PO — nunca duplicam as camadas técnicas.
<!-- /perfil:completo -->

| Camada | Convenção | Exemplo | Onde aparece |
|---|---|---|---|
| Entidade | PascalCase singular, português | `ModeloEmail` | DATA-MODEL.md, data-models/[dominio].md (cabeçalho) |
| Label PO | Português, title case, sem jargão | `Nome completo` | N3 (tabela de campos), Gherkin, telas |
<!-- perfil:completo -->
| Label Dev | camelCase, português, autoexplicativo | `nomeCompleto` | DATA-MODEL.md, código, API |
| Campo banco | snake_case, português ⚠️ | `nome_completo` | DATA-MODEL.md, migrations, ORM |

> ⚠️ Entidades e campos são nomeados em **português**. Confirme apenas a caixa
> dos identificadores do banco (snake_case vs. UPPER_SNAKE_CASE) antes de gerar
> N1/N3. Em engenharia reversa de bases legadas, transcreva os identificadores
> como estão na origem (podem estar em inglês) — não os traduza.
<!-- /perfil:completo -->

---

<!-- perfil:completo -->
## Campos globais obrigatórios em toda tabela

> **Decisões do projeto a confirmar**: multitenancy (sim/não), estratégia de PK
> (sequence / UUID / outra), tipos do SGBD, e exclusão física vs. **lógica** (soft
> delete via `deletedAt`). Ajuste a tabela abaixo conforme as decisões tomadas.

| Label Dev | Campo banco | Tipo | Notas |
|---|---|---|---|
| id | id | [tipo PK] | PK; gerada automaticamente |
| createdAt | created_at | [timestamp] | Gerado automaticamente |
| updatedAt | updated_at | [timestamp] | Atualizado automaticamente |
| deletedAt | deleted_at | [timestamp] | Soft delete (exclusão lógica); null = ativo |

---
<!-- /perfil:completo -->

## Decisões transversais

> ⚠️ Itens marcados dependem de decisão do projeto.

<!-- perfil:requisitos -->
1. **Exclusão**: [remoção definitiva / desativação com manutenção do histórico] ⚠️
<!-- /perfil:requisitos -->
<!-- perfil:completo -->
1. **Exclusão**: [física / lógica (soft delete via `deletedAt`)] ⚠️
<!-- /perfil:completo -->
2. **Auditoria**: ações críticas sempre registradas em log de auditoria.
<!-- perfil:requisitos -->
3. **Autorização**: o acesso a cada funcionalidade é controlado por perfil — permissões na matriz do N2 e qualidade em `global/NFR.md` → SEG-01. A solução técnica fica para o desenvolvimento.
<!-- /perfil:requisitos -->
<!-- perfil:completo -->
3. **Autorização**: acesso por **funcionalidade** (Funcionalidade = átomo de permissão), aplicado no servidor; vínculo perfil↔funcionalidade é dado configurável, nega por padrão — ver `global/AUTHZ.md` e `global/NFR.md` → SEG-01.
4. **IDs em URLs**: não expor o identificador interno (PK); usar a chave de negócio quando aplicável.
5. **Paginação**: [cursor-based / offset] e limites ⚠️
6. **Validação**: no frontend e no backend — nunca confiar apenas no client.
7. **Eventos internos**: [mensageria / chamadas diretas] ⚠️
<!-- /perfil:completo -->

---

<!-- perfil:completo -->
## Padrão de resposta de API

```typescript
// Sucesso com dado único
{ "data": { ...objeto }, "meta": null }

// Sucesso com lista
{ "data": [...], "meta": { "total": 0, "nextCursor": null, "prevCursor": null } }

// Erro
{ "data": null, "error": { "code": "ENTIDADE_ERRO", "message": "...", "details": [] } }
```

---
<!-- /perfil:completo -->

## O que NUNCA fazer

<!-- perfil:completo -->
- Expor o identificador interno (PK) em URLs ou respostas — usar a chave de negócio
- Retornar senhas ou tokens em respostas, mesmo hasheados
- Lançar exceções cruas — sempre retornar envelope de erro padronizado
<!-- /perfil:completo -->
<!-- perfil:requisitos -->
- Definir nomes de banco, tipos SQL, chaves ou índices no modelo de entidades de negócio — a camada física fica para o desenvolvimento
<!-- /perfil:requisitos -->
<!-- perfil:completo -->
- Duplicar Label Dev ou campo banco nos N3 — essas informações vivem apenas no DATA-MODEL.md
- [demais proibições específicas da stack — ex.: `any` no TypeScript, remoção física se a exclusão é lógica]
<!-- /perfil:completo -->

---

## Arquivos globais de referência

| Arquivo | Propósito |
|---|---|
| `CLAUDE.md` (raiz) | Índice de contexto carregado a cada sessão no Claude Code |
| `global/MASTER.md` | Identificação, perfil e convenções globais (este arquivo) |
<!-- perfil:requisitos -->
| `global/DATA-MODEL.md` | Índice de entidades e relacionamentos de negócio; funções de dados dimensionadas pelo agente de contagem, fora do Docqui |
<!-- /perfil:requisitos -->
<!-- perfil:completo -->
| `global/DATA-MODEL.md` | Índice de entidades + campos globais + enums |
<!-- /perfil:completo -->
| `global/SIZING.md` | Convenções de contagem APF e COSMIC, aplicadas pelo agente de contagem, fora do Docqui |
| `global/RULES-DICTIONARY.md` | Regras de negócio canônicas |
| `global/FIELD-DICTIONARY.md` | Campos canônicos (CPF, CEP, e-mail…) |
| `global/MESSAGE-DICTIONARY.md` | Mensagens de UI genéricas + baseline de validação |
| `global/ERROR-DICTIONARY.md` | Fonte única de códigos de erro |
<!-- perfil:completo -->
| `global/API-PATTERNS.md` | Padrões de API |
| `global/AUTHZ.md` | Modelo de autorização — controle de acesso por funcionalidade (Funcionalidade = átomo de permissão) |
<!-- /perfil:completo -->
| `global/DESIGN-SYSTEM.md` | Padrões de UI |
<!-- perfil:completo -->
| `global/PATTERNS.md` | Catálogo de padrões de projeto (design patterns) — como o sistema é construído no nível tático; consumido pelo `PROMPT_SDD` |
<!-- /perfil:completo -->
| `global/VOCABULARY-OVERRIDES.md` | *(opcional)* Ajustes de vocabulário desta instância (verbos/termos — ver DEFINICAO-FUNCIONALIDADE) |
<!-- perfil:requisitos -->
| `global/gates-config.yml` | *(opcional)* Papéis dos checkpoints CP1–CP2 desta instância (ver `scripts/gates.py`) |
<!-- /perfil:requisitos -->
<!-- perfil:completo -->
| `global/gates-config.yml` | *(opcional)* Papéis dos checkpoints CP1–CP4 desta instância (ver `scripts/gates.py`) |
<!-- /perfil:completo -->
