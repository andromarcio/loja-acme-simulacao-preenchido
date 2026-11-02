# PROMPT — Geração de SDD (Software Design Document)

> **Modo**: DEV
> **Entrada**: arquivos globais + N1s + N2s + N3s aprovados — no **modo alteração**, a AIMM
> do ticket + o delta dos N3 (`node scripts/delta-n3.mjs --aimm …`) + os N3 atuais
> **Saída**: SDD completo pronto para guiar a implementação — no modo alteração, o SDD de
> alteração: só o que muda
> **Pré-requisito**: todos os N3 da funcionalidade ou módulo a ser implementado
> devem estar com `estado: especificado` no front-matter — CP1, CP2 e CP3 aprovados
> na esteira; é o 📋 da seção *Esteira de checkpoints* do `modules/INDEX.md`
> (`python3 scripts/gates.py status`). No modo alteração, o pré-requisito é o aval do PO
> no escopo: a AIMM do ticket em `escopo-aprovado` ou adiante, com `avalizado-por`
> **Onde salvar**: `arquitetura/sdd/SDD-[SIGLA]-[SAF].md` (um por Agrupamento Funcional) — no modo
> alteração, `arquitetura/sdd/SDD-AIMM-<CHAVE>.md`. O `validate-doc` reconhece o SDD pelo
> título e confere as seções numeradas e a consolidação dos ❓ e 🏛️

---

## INSTRUÇÕES PARA O CLAUDE

Você é um arquiteto de software sênior. Com base nas especificações
fornecidas, você vai gerar um SDD (Software Design Document) que serve
como ponte entre as especificações de negócio e o código a ser escrito.

O SDD não repete o que está nas specs — ele traduz as specs em decisões
de design, estruturas de código e contratos técnicos que o dev pode
seguir diretamente para implementar.

> **Qual modo?** Funcionalidade **nova** — linha `criar` no `## Artefatos impactados` da AIMM, ou
> N3 que não existe na `main` — vai para o **SDD completo** (abaixo). Funcionalidade que **já
> existe** e muda — linha `alterar` na AIMM — vai para o **modo alteração** (seção
> *MODO ALTERAÇÃO*, no fim deste prompt): o N3 é a foto completa da funcionalidade, e
> redesenhá-la inteira por um campo novo no filtro gera retrabalho e risco de regressão.
> Um ticket com as duas coisas gera um SDD de cada tipo. O `delta-n3.mjs` já separa:
> marca a funcionalidade nova como "SDD completo" e entrega o delta das demais.

> **Antes de gerar — pronto para dev?** Leia o `estado` no front-matter de cada N3 do
> escopo (ou rode `python3 scripts/gates.py status`). Só `especificado` (📋 — CP1, CP2 e
> CP3 aprovados) segue para o design. N3 em outro estado fica **fora**: diga qual gate
> falta e não gere o design dele. O status da tabela de rastreabilidade não decide —
> quem decide é a esteira.

> **SDD retroativo — funcionalidade já em `em-desenvolvimento` ou `implementado`.** Só quando o
> pedido é documentar o desenho que existe ou validar a especificação. Gere o SDD completo
> com as 15 seções e diga na §1 que é retroativo e se o código foi consultado (qual
> repositório e caminho) ou não. A §1.1 traz o estado real da spec, e a §14 vira a lista
> de **defeitos da especificação**: o que o desenho precisou e o N3 não respondia, e o que
> contradiz outro artefato (N2, dicionário, API-PATTERNS, protótipo). Decisão que só existe
> em `PLANO-IMPLEMENTACAO.md` ou num registro de reconciliação é citada com a fonte — e
> anotada na §14 como decisão fora da spec.

### Regras de geração

> **Fidelidade ao protótipo:** para telas cuja funcionalidade (N3) declara `Fidelidade ao protótipo: obrigatória`, o design **referencia o protótipo aprovado** (`prototypes/…`) como fonte de verdade do layout, componentes e estados — não reinterprete a tela pelo texto; desvio vira decisão 🏛️ e exige aprovação.
> **Treino ≠ jogo — a fidelidade é de comportamento visual, NUNCA de código.** O
> protótipo é autocontido e procedural de propósito (HTML/CSS/JS de simulação);
> **copiar seu código para a produção é desvio por definição**. A realização vem
> dos componentes reais do design system (mapa de equivalência `.dsc-*` → componente
> no README do tema), do catálogo `global/PATTERNS.md` e das convenções do
> `MASTER.md`. Classes `.dsc-*` no código de produção denunciam cópia — recomenda-se
> regra de lint proibindo-as (fitness function da CI do repo de front).

1. **Referência, não repetição.** Sempre que uma regra ou campo já
   estiver definido nas specs, referencie o artefato de origem em vez
   de copiar o conteúdo. Use a notação: `→ ver [arquivo]: [seção]`. A regra da
   funcionalidade se cita pelo ID: `[SIGLA]-[SAF]-NN/RN-NN` — no SDD e no comentário do
   código que a implementa (`// → ADM-USR-04/RN-02`); nunca pela posição na lista.

2. **Decisões explícitas.** Toda escolha de design que não esteja
   determinada pelas specs deve ser declarada como decisão, com
   justificativa. Use o marcador 🏛️ para decisões de arquitetura.

3. **Nível de detalhe suficiente para implementar.** O dev não deve
   precisar tomar nenhuma decisão estrutural ao ler o SDD. Decisões
   de estilo (formatação de código, nomes de variáveis locais) ficam
   fora do escopo.

4. **Pseudocódigo quando necessário.** Para lógicas complexas
   (algoritmos, fluxos assíncronos, regras de negócio com múltiplas
   condições), use pseudocódigo na linguagem da stack (Technical Context
   do `MASTER.md`: Language/Version) para eliminar ambiguidade.

5. **Sinalize lacunas.** Se alguma informação necessária para o design
   não estiver nas specs, sinalize com ❓ e liste ao final como
   "Pontos a resolver antes de implementar".

6. **Escopo declarado.** Ao iniciar, liste explicitamente quais
   domínios, Agrupamentos Funcionais e funcionalidades o SDD cobre, com base nos
   artefatos fornecidos.

7. **A stack é a da instância.** Os exemplos da estrutura abaixo — `route.ts`,
   Prisma, Zod, BullMQ, `organizationId`, `/api/v1`, `it('should…')` — ilustram
   uma stack TypeScript. Camadas, pacotes, validação, migração, fila, nome do
   tenant, prefixo de rota e framework de teste saem do Technical Context do
   `MASTER.md`, do `PATTERNS.md` e do `API-PATTERNS.md` da instância. Onde a
   instância não define (ex.: o nome dos pacotes), a escolha é 🏛️.

8. **Tela ou consulta compartilhada.** Quando várias funcionalidades do escopo usam a
   mesma tela ou a mesma consulta (um GET que alimenta seções de funcionalidades
   diferentes), descreva-a uma vez — subseção *Telas e consultas compartilhadas*
   na §4 ou na §7 — e aponte para ela das funcionalidades. O contrato dela é ❓ se
   nenhum N3 o define.

---

## CONTEXTO DO PROJETO

> **Pacote de contexto (6.3.0)** — em vez de colar os blocos abaixo, gere-o:
> `node scripts/monta-contexto.mjs <ID da funcionalidade> [--base main] --out /tmp/contexto-<ID>.md` — para o Agrupamento Funcional inteiro, `--agrupamento <SIGLA-SAF>` (N1, N2, entidades e
> dicionários uma vez, em vez de repetidos por funcionalidade). Traz o
> N3 e, de cada artefato global, só o que a funcionalidade usa (matriz de permissões do N2,
> regras transversais do N1, entidades do data-model, entradas citadas dos dicionários,
> NFR citados, funcionalidades de `depende_de`, protótipos); o que o N3 cita e não existe vem
> como ❓ — resolva antes de usar, não deduza. Os blocos abaixo ficam para o que o pacote
> não cobre (MASTER, DESIGN-SYSTEM, API-PATTERNS) e para o modo copiar-colar.


=== MASTER.md ===
[cole aqui o conteúdo do MASTER.md]

=== DESIGN-SYSTEM.md ===
[cole aqui o conteúdo do DESIGN-SYSTEM.md]

=== DATA-MODEL.md ===
[cole aqui o conteúdo do DATA-MODEL.md]

=== API-PATTERNS.md ===
[cole aqui o conteúdo do API-PATTERNS.md]

=== PATTERNS.md ===
[cole aqui o conteúdo do global/PATTERNS.md — catálogo de padrões de projeto]

=== FIELD-DICTIONARY.md ===
[cole aqui o conteúdo do FIELD-DICTIONARY.md]

=== N1(s) — DOMÍNIOS ===
[cole aqui os README.md dos domínios envolvidos]

=== N2(s) — FUNCIONALIDADE SETS ===
[cole aqui os README.md dos Agrupamentos Funcionais envolvidos]

=== N3(s) — FUNCIONALIDADES ===
[cole aqui os .md de todas as funcionalidades a implementar]

---

## ESTRUTURA DO SDD A GERAR

Gere o SDD completo seguindo exatamente as seções abaixo,
na ordem apresentada.

---

```markdown
# SDD — [Nome do projeto / módulo]
> Software Design Document
> Versão: [1.0]
> Data: [data de geração]
> Baseado nas specs: [listar N3s de origem com seus status]
> Repositórios envolvidos: [listar repos do MASTER.md]

---

## 1. Escopo deste documento

### 1.1 O que este SDD cobre
[Lista de domínios, Agrupamentos Funcionais e funcionalidades incluídos,
com link para cada N3 de origem.]

| Funcionalidade | N3 de origem | Estado da spec |
|---|---|---|
| [funcionalidade] | [link] | 📋 especificado |

### 1.2 O que está fora do escopo
[Funcionalidades ou domínios explicitamente excluídos e por quê.]

### 1.3 Dependências com outros módulos
[Módulos ou serviços externos que este SDD pressupõe existentes,
com referência ao N1 de origem de cada dependência.]

---

## 2. Visão geral da arquitetura

### 2.1 Diagrama de componentes
[Diagrama em texto (ASCII ou Mermaid) mostrando os componentes
principais e suas relações para o escopo deste SDD.]

```
[Frontend]
    │  HTTP/REST
    ▼
[API Layer]  ──→  [Database]
    │
    └──→  [Worker/Queue]  ──→  [Serviços externos]
```

### 2.2 Padrão arquitetural adotado
🏛️ **Decisão**: [ex: "Layered Architecture com separação em
controller → service → repository"]
**Justificativa**: [por que esta escolha para este contexto]

**Padrões de projeto aplicados**: **referencie o catálogo** `global/PATTERNS.md`
para cada padrão tático que o design usa — `→ ver PATTERNS.md: [Padrão]` — em vez de
redescrever a mecânica. Se o design exigir um padrão **ainda não catalogado**,
proponha-o como decisão 🏛️ (registrada na §15) e **sinalize para promoção** ao
`PATTERNS.md` — a entrada promovida deve nascer **com o exemplo de código mínimo**
(esqueleto na stack), como as demais. Divergir de uma entrada do catálogo também é
decisão 🏛️ justificada.

### 2.3 Fluxo de uma requisição (ponta a ponta)
[Descrever o caminho de uma requisição desde o frontend até
o banco e de volta, identificando cada camada e sua responsabilidade.]

```
Request → [Middleware de Auth] → [Route Handler]
       → [Validation (Zod)] → [Service] → [Repository]
       → [Database] → [Response]
```

---

## 3. Modelo de dados

> **Fonte única — não redefina o schema aqui.** A definição física do banco —
> entidades, campos (Label Dev, campo banco, tipo SQL), chaves estrangeiras,
> índices, restrições de unicidade e enums — vive **exclusivamente** no DATA-MODEL
> (`global/DATA-MODEL.md` + os fragmentos `global/data-models/[dominio].md`). O SDD
> **referencia**; **não** copia colunas, tipos, constraints, DDL nem `CREATE TABLE/
> TYPE/INDEX`. Se o design exigir um campo, índice ou enum **novo**, **pare**:
> proponha-o primeiro no DATA-MODEL (via PROMPT_1B/3B) e só então cite-o aqui.

### 3.1 Entidades no escopo

→ Definição física completa: ver `DATA-MODEL.md` (índice) e os fragmentos
`global/data-models/[dominio].md` dos domínios cobertos.

| Entidade | Domínio | Fragmento (data-model) | N3 de origem |
|---|---|---|---|
| [Entidade] | [Domínio] | [data-models/[dominio].md](../global/data-models/[dominio].md) | [f-[verbo]-[entidade].md] |

### 3.2 Relacionamentos relevantes ao design

[Descreva, em nível de **design**, apenas como as entidades **já definidas no
DATA-MODEL** se combinam para esta solução (quem lê/escreve o quê, cardinalidade
relevante à arquitetura). **Não** reescreva colunas, tipos ou FKs — cite cada
relacionamento por referência.]

→ ver `DATA-MODEL.md`: **Relacionamentos** e **Relacionamentos de seleção (comboboxes)**.

### 3.3 Estratégia de migração

[Apenas a **ordem** e a **estratégia** de aplicação das mudanças de schema que o
DATA-MODEL já especifica: sequência, backfill de dados, reversibilidade, janela de
downtime. **Não** reescreva o DDL — o conteúdo de cada migration (colunas, tipos,
índices, enums) é o que o DATA-MODEL define; aqui registra-se só o **plano** de
aplicá-lo.]

| Ordem | Mudança | Entidade/seção no DATA-MODEL | Estratégia |
|---|---|---|---|
| 001 | Criar tabela de [Entidade] | Entidade [Nome] | tabela nova |
| 002 | Índices de [Entidade] | Índices e restrições de unicidade | — |
| 003 | Enum [Nome] | Enums do sistema | — |

> Toda mudança listada aqui já deve constar no DATA-MODEL. Se algo índice/campo/enum
> referido não estiver lá, **atualize o DATA-MODEL primeiro** — não o defina no SDD.

---

## 4. Design da API

### 4.1 Autenticação e autorização
→ Padrão global: ver API-PATTERNS.md: Autenticação e autorização

**Middleware de auth** (`lib/middleware/auth.ts`):
[Descrever o que o middleware valida e o que injeta no contexto
da requisição — ex: organizationId, userId, role.]

**Verificação de role por endpoint**:
[Como será implementada a verificação de role — decorator,
middleware específico, verificação no service.]

### 4.2 Endpoints

Para cada endpoint coberto por este SDD:

#### [MÉTODO] [/api/v1/rota]
→ Especificação de origem: ver [N3]: API: [endpoint]

**Handler** (`app/api/v1/[rota]/route.ts`):
```typescript
// Pseudocódigo do handler
export async function [METHOD](req: Request) {
  // 1. Extrair contexto da sessão
  const { organizationId, userId, role } = await getSession(req)

  // 2. Validar body/params com Zod
  const body = schema.[funcionalidade]Schema.parse(await req.json())

  // 3. Chamar service
  const result = await [funcionalidade]Service.[acao](organizationId, userId, body)

  // 4. Retornar resposta
  return Response.json({ data: result, meta: null }, { status: [código] })
}
```

**Schema de validação Zod** (`lib/validations/[funcionalidade].ts`):
```typescript
export const [funcionalidade]Schema = z.object({
  [campo]: z.[tipo]([validações]),  // → FIELD-DICTIONARY: [campo] se canônico
})
```

**Mapeamento de erros**:
→ Erros globais: ver API-PATTERNS.md: Códigos de erro globais

| Situação | Code | HTTP | Onde é lançado |
|---|---|---|---|
| [situação] | `[ENTIDADE_ERRO]` | [código] | [service/repository] |

---

## 5. Design dos serviços (camada de negócio)

Para cada serviço a ser criado:

### [NomeDoModulo]Service (`lib/services/[modulo].service.ts`)

**Responsabilidade**: [o que este service faz — uma frase]
→ Regras de negócio: ver [N3]: Regras de negócio

#### Método: [nomeDoMetodo]

**Assinatura**:
```typescript
async [nomeDoMetodo](
  organizationId: string,
  userId: string,
  data: [TipoDoInput]
): Promise<[TipoDoRetorno]>
```

**Pseudocódigo**:
```typescript
async [nomeDoMetodo](organizationId, userId, data) {
  // → Regra N: [descrição da regra] — ver [N3]: Regras de negócio: [N]
  const [validação] = await this.[repository].[método](...)
  if ([condição de erro]) {
    throw new AppError('[ENTIDADE_ERRO]', [httpStatus])
  }

  // → Regra N: [descrição]
  const resultado = await this.[repository].create({
    ...data,
    organizationId,
    source: '[valor automático]',
  })

  // → Regra N: publicar evento — ver [N3]: Eventos
  await publishEvent('[entidade.acao]', {
    organizationId,
    [entidade]Id: resultado.id,
  })

  // → Regra N: auditoria — ver [N3]: AuditLog
  await logAction({
    organizationId,
    userId,
    action: '[entidade.acao]',
    targetEntity: '[Entidade]',
    targetId: resultado.id,
    metadata: { [campos relevantes] },
  })

  return resultado
}
```

**Casos de erro mapeados**:
| Condição | Code lançado | Origem na spec |
|---|---|---|
| [condição] | `[ENTIDADE_ERRO]` | → [N3]: Regra [N] |

---

## 6. Design dos repositórios (camada de dados)

Para cada repositório a ser criado:

### [NomeDoModulo]Repository (`lib/repositories/[modulo].repository.ts`)

**Responsabilidade**: acesso a dados da entidade [Entidade] — sem lógica de negócio.

#### Método: [nomeDoMetodo]

```typescript
async [nomeDoMetodo](
  organizationId: string,
  [params]: [tipos]
): Promise<[Entidade] | null> {
  return prisma.[tabela].findFirst({
    where: {
      organization_id: organizationId,  // isolamento obrigatório
      deleted_at: null,                  // soft delete
      [filtros adicionais],
    },
  })
}
```

---

## 7. Design dos componentes de frontend

Para cada tela ou componente coberto por este SDD:

### [NomeDaTela] (`app/(auth)/[rota]/page.tsx`)
→ Especificação de origem: ver [N3]: Comportamento de tela

**Estado local necessário**:
```typescript
// Estados que este componente precisa gerenciar
const [dados, setDados] = useState<[Tipo][]>([])
const [loading, setLoading] = useState(false)
const [erro, setErro] = useState<string | null>(null)
```

**Estrutura de componentes**:
```
[NomeDaTela]
├── [ComponenteA]          → components/[modulo]/[ComponenteA].tsx
│   └── [SubComponente]    → components/ui/[SubComponente].tsx
└── [ComponenteB]          → components/[modulo]/[ComponenteB].tsx
```

**Chamadas de API**:
| Ação do usuário | Endpoint chamado | Tratamento de erro |
|---|---|---|
| [ação] | [MÉTODO] /api/v1/[rota] | [como tratar na UI] |

**Estados obrigatórios**:
→ Padrão de estados: ver DESIGN-SYSTEM.md: Estados obrigatórios de tela

| Estado | Componente responsável | O que renderiza |
|---|---|---|
| Loading | [componente] | Skeleton de [N] linhas |
| Empty | [componente] | [ícone + mensagem + botão] |
| Error | [componente] | [mensagem + botão retry] |
| Success | Toast | "[mensagem de sucesso]" |

---

## 8. Design de jobs assíncronos

*(Incluir apenas se houver processamento assíncrono nas funcionalidades do escopo)*

### [NomeDoJob] (`lib/workers/[job].worker.ts`)
→ Especificação de origem: ver [N3]: [seção relevante]

**Trigger**: [o que dispara este job — evento, schedule, requisição]
**Fila**: [nome da fila no BullMQ/similar]
**Timeout**: [tempo máximo de execução]
**Retries**: [número de tentativas em caso de falha]

**Pseudocódigo**:
```typescript
async function [nomeDoJob](payload: [TipoDoPayload]) {
  await updateStatus(payload.jobId, 'processing')

  try {
    // lógica principal
    for (const item of items) {
      // processar item
      // publicar evento por item se necessário
    }

    await updateStatus(payload.jobId, 'done', resultado)
    await publishEvent('[job].completed', { ...resultado })

  } catch (error) {
    await updateStatus(payload.jobId, 'failed', { error: error.message })
    await publishEvent('[job].failed', { jobId: payload.jobId })
  }
}
```

---

## 9. Design de eventos internos

### Mapa de eventos deste SDD

| Evento | Publicado por | Consumido por | Payload |
|---|---|---|---|
| `[entidade.acao]` | [Service] | [Handler/Worker] | `{ organizationId, [id] }` |

### Implementação dos handlers de evento

Para cada evento consumido:

```typescript
// lib/events/handlers/[evento].handler.ts
onEvent('[entidade.acao]', async (payload) => {
  // → ver [N3]: Eventos consumidos: [evento]
  await [service].[metodo](payload)
})
```

---

## 10. Estrutura de arquivos

Lista completa de arquivos a criar ou alterar,
agrupada por repositório:

### [nome-do-repositorio]

```
[caminho/arquivo]                     [criar/alterar] — [o que faz]

── Banco de dados ─────────────────────────────────────────────
prisma/migrations/[ts]_[nome].ts      criar — [descrição da migration]
prisma/schema.prisma                  alterar — adicionar [entidade(s)]

── Validações ─────────────────────────────────────────────────
lib/validations/[modulo].ts           criar — schemas Zod de [funcionalidade(s)]

── Repositórios ───────────────────────────────────────────────
lib/repositories/[modulo].repository.ts  criar — acesso a dados de [Entidade]

── Serviços ───────────────────────────────────────────────────
lib/services/[modulo].service.ts      criar — lógica de negócio de [funcionalidade(s)]

── Eventos ────────────────────────────────────────────────────
lib/events/handlers/[evento].handler.ts  criar — handler de [evento]

── API ────────────────────────────────────────────────────────
app/api/v1/[rota]/route.ts            criar — endpoint(s) de [funcionalidade]

── Frontend ───────────────────────────────────────────────────
app/(auth)/[rota]/page.tsx            criar — tela de [funcionalidade]
components/[modulo]/[Componente].tsx  criar — [descrição]
components/ui/[Componente].tsx        criar/alterar — [descrição]

── Workers ────────────────────────────────────────────────────
lib/workers/[job].worker.ts           criar — job de [funcionalidade]
```

---

## 11. Sequência de implementação

Ordem recomendada para implementar sem travar em dependências:

| Fase | O que implementar | Pré-requisito |
|---|---|---|
| 1 | Migrations e schema Prisma | — |
| 2 | Repositórios | Migration concluída |
| 3 | Schemas de validação (Zod) | — |
| 4 | Serviços | Repositórios + validações |
| 5 | Handlers de eventos | Serviços |
| 6 | Endpoints de API | Serviços + validações |
| 7 | Workers/Jobs | Serviços + eventos |
| 8 | Componentes de UI base | Design System |
| 9 | Telas (pages) | Componentes + endpoints |
| 10 | Testes | Tudo acima |

---

## 12. Design de testes

### Cobertura mínima esperada

| Tipo | O que testar | Arquivo |
|---|---|---|
| Unitário | Service: cada método com todos os cenários Gherkin negociais | `[modulo].service.spec.ts` |
| Unitário | Validação Zod: campos válidos e inválidos | `[modulo].validation.spec.ts` |
| Integração | Endpoint: request → response com banco real | `[rota].integration.spec.ts` |
| Integração | Job: processamento completo com casos de erro | `[job].worker.spec.ts` |
| Integração | **Segurança**: cenários de abuso do N3 — sem permissão (SEG-01), fora do tenant, entrada maliciosa; para funcionalidades que alimentam agentes de IA, os testes adversariais de injeção (SEG-08+) | `[rota].security.spec.ts` |
| E2E | Caminho feliz e permissões pela tela — o plano de `qa/` (`PROMPT_QA`) | `[pasta de E2E do MASTER]/[dominio]/[funcionalidade].spec.ts` |

### Mapeamento cenários Gherkin → testes

Para cada grupo de cenários do N3:

| Cenário Gherkin | Tipo de teste | Método de teste |
|---|---|---|
| [descrição do cenário] | Unitário / Integração / E2E | `[SIGLA]-[SAF]-NN/RN-NN — [o que verifica]` |

O nome do teste cita a regra que o cenário verifica (`@RN-NN` no N3) — é o texto que o
`valida-artefatos-previstos` procura no código. Cenário sem regra (técnico, de segurança)
cita só o ID da funcionalidade. Cenário cujo "Então" acontece em outro módulo (a esteira, um
agente) é testado pelo módulo dono: aponte a suíte dele em vez de duplicar o teste.

---

## 13. Checklist de implementação

O dev deve marcar cada item ao concluir:

### Banco de dados
- [ ] Migration criada e testada em ambiente local
- [ ] Schema Prisma atualizado e gerado (`prisma generate`)
- [ ] Índices criados conforme seção 3.2

### Backend
- [ ] Repositório implementado com isolamento por `organizationId`
- [ ] Service implementado cobrindo todas as regras do N3
- [ ] Validação Zod cobre todos os campos e formatos do N3
- [ ] Todos os endpoints retornam o envelope padrão do API-PATTERNS.md
- [ ] Todos os códigos de erro do N3 estão implementados
- [ ] Eventos publicados em todos os pontos definidos no N3
- [ ] AuditLog registrado conforme definido no N3
- [ ] Soft delete respeitado em todas as queries

### Frontend
- [ ] Todos os estados de tela implementados (loading, error, empty, success)
- [ ] Mensagens de erro do N3 estão exibidas nos campos corretos
- [ ] Toasts implementados conforme DESIGN-SYSTEM.md
- [ ] Campos canônicos usando componentes/validações do FIELD-DICTIONARY.md

### Testes
- [ ] Testes unitários cobrindo todos os cenários Gherkin negociais
- [ ] Testes de integração cobrindo os endpoints principais
- [ ] Todos os casos de erro testados

### Finalização
- [ ] Seção "Implementação" preenchida em cada N3 (repositório + caminho)
- [ ] CP4 aprovado (gate `codigo`, com o registro em `repos/` no mesmo PR) e o espelho da esteira regenerado — o `modules/INDEX.md` mostra ✅ implementado
- [ ] PR referencia os N3 implementados

---

## 14. Pontos a resolver antes de implementar

*(Gerado automaticamente — lista de ❓ identificados durante a geração do SDD)*

| # | Ponto em aberto | Artefato de origem | Impacto |
|---|---|---|---|
| 1 | ❓ [descrição da lacuna] | [N3/N2/N1]: [seção] | [Alto/Médio/Baixo] |

> Resolva os itens de impacto Alto antes de iniciar.
> Itens de impacto Médio e Baixo podem ser resolvidos durante a implementação
> com decisão documentada em um ADR.

---

## 15. Decisões de arquitetura registradas

*(Lista de todas as decisões marcadas com 🏛️ neste documento)*

| # | Decisão | Justificativa | Alternativa descartada |
|---|---|---|---|
| 1 | 🏛️ [decisão] | [justificativa] | [alternativa e por que não] |

> Decisões com impacto sistêmico devem ser formalizadas em um ADR
> na pasta de ADRs do repositório de docs (`decisions/`, quando existir;
> sem ela, a decisão fica registrada aqui e a criação do ADR vai para a §14).
>
> Padrão de projeto **novo** adotado aqui, ou divergência de uma entrada de
> `global/PATTERNS.md`, deve ser propagado para o catálogo (a decisão de adotar/
> mudar padrão é de arquitetura — não fica só no SDD de uma funcionalidade).
```

---

## MODO ALTERAÇÃO — SDD de uma funcionalidade que já existe

O N3 continua sendo o estado completo da funcionalidade; o que muda **não se escreve à mão**,
deriva-se do git. O "antes" é o N3 na `main`; o "depois", o N3 na branch do ticket, já
com o 4A/4B aplicado. O `delta-n3.mjs` entrega a diferença por seção — linhas de tabela
incluídas, alteradas e removidas, cenários e regras novos —, sem o Changelog e sem a
esteira (`estado`, `gates`, `contagem`).

### Entrada

```text
=== AIMM DO TICKET ===
[cole aqui analise-impacto/AIMM-<CHAVE>.md — escopo avalizado pelo PO]

=== DELTA DOS N3 ===
[cole aqui a saída de: node scripts/delta-n3.mjs --aimm analise-impacto/AIMM-<CHAVE>.md --base main]

=== N3 ATUAIS ===
[cole aqui os N3 com delta, inteiros — o contexto do que NÃO muda; a seção
## Implementação diz em qual repositório e caminho o código está]

=== GLOBAIS, SÓ OS TOCADOS ===
[DATA-MODEL (fragmento do domínio), API-PATTERNS, dicionários — só se o delta os toca]
```

### Regras do modo alteração

1. **Só o que o delta pede.** Toda mudança de design nasce de uma linha do delta — cite-a
   (`→ delta: ## Campos, + Situação`). Seção do N3 sem alteração não é redesenhada.
2. **O que não muda é declarado.** Liste o que o desenvolvedor **não** deve reimplementar
   (colunas, paginação, demais filtros, endpoints intactos). É o que protege da regressão.
3. **Onde está o código.** Os arquivos a alterar saem da `## Implementação` (repositório e
   caminho) e, quando houver, da `## Arquivos a criar ou alterar` do N3. Caminho que não
   está lá é ❓, não suposição.
4. **Mudança de contrato é decisão.** Parâmetro novo de API, coluna nova, mensagem ou
   código de erro novo: diga se quebra o contrato atual (🏛️ quando quebra) e como fica a
   compatibilidade.
5. **Delta sem efeito no código** (redação, exemplo, regra só reescrita) é dito como tal —
   não se inventa trabalho para ele.
6. Valem as regras gerais deste prompt: referência em vez de repetição, ❓ para lacunas,
   🏛️ para decisões.

### Estrutura do SDD de alteração

```markdown
# SDD de alteração — [AIMM-<CHAVE>]: [título do ticket]
> Base: `main` ([sha]) → branch do ticket ([sha]) · delta gerado por `delta-n3.mjs`
> AIMM: [link] · estado [escopo-aprovado | em-execução] · avalizado por [PO]

## 1. Escopo
| Funcionalidade | N3 | Seções alteradas (do delta) |
|---|---|---|
| [ID — Nome] | [link] | Campos · Cenários |

Funcionalidades novas deste ticket (SDD completo à parte): [lista, ou "nenhuma"].

## 2. O que muda, por camada
> Só as camadas que o delta toca; as demais saem desta seção.

### Dados
[coluna/índice/migração — → ver DATA-MODEL: …; "nenhuma" se o delta não toca dados]

### API
[endpoint, parâmetro, resposta, códigos de erro — e se o contrato quebra]

### Serviço e repositório
[regra, consulta, validação — com a linha do delta que pede]

### Frontend
[tela, componente, estado — com a linha do delta que pede]

### Jobs e eventos
[se o delta toca]

## 3. O que NÃO muda
- [o que segue igual e não deve ser reimplementado]

## 4. Testes
| Cenário | Origem | Tipo | Teste |
|---|---|---|---|
| [cenário novo ou alterado] | delta: ## Cenários | unitário / integração / E2E | `it('…')` |
| [regressão do que já existia] | N3 atual | integração | `it('…')` |

## 5. Arquivos a alterar
| Repositório | Caminho | O que muda |
|---|---|---|
| [da ## Implementação] | [caminho] | [mudança] |

## 6. Pontos a resolver antes de implementar
| # | Ponto em aberto | Origem | Impacto |
|---|---|---|---|

## 7. Decisões de arquitetura
| # | Decisão | Justificativa | Alternativa descartada |
|---|---|---|---|
```

Após gerar o SDD de alteração: confirme que **cada** seção alterada do delta virou item na
seção 2, na 4 ou foi declarada sem efeito no código (regra 5) — seção do delta sem destino
é mudança que ninguém vai implementar. Liste as funcionalidades novas que pedem SDD completo.

---

## INSTRUÇÕES FINAIS PARA O CLAUDE

Após gerar o SDD completo:

1. **Liste os N3 cobertos** — todos com `estado: especificado`, conferido antes de
   gerar — e os que ficaram de fora, com o gate que falta; alerte se algum dos
   cobertos tiver lacunas pendentes.

2. **Contabilize os pontos em aberto** (seção 14) e classifique
   por impacto. Se houver itens de impacto Alto, recomende
   resolver antes de iniciar a implementação.

3. **Identifique decisões que merecem ADR** (seção 15) e sugira
   abrir os ADRs correspondentes na pasta `decisions/`.

4. **Estime complexidade por fase** da sequência de implementação
   (seção 11), sinalizando as fases com maior risco técnico.
