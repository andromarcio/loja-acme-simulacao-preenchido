# Repositórios do sistema

| Repositório | URL | Domínio | Tipo | Responsabilidade | Stack | Responsável |
|---|---|---|---|---|---|---|
| [nome-docs] | [URL] | — | documentação | Documentação e especificações | Markdown | [nome] |
| [nome-backend] | [URL] | [domínio] | [frontend · BFF · domínio · worker · integração · técnico] | [responsabilidade] | [stack] | [nome] |
| [nome-frontend] | [URL] | [domínio] | frontend | [responsabilidade] | [stack] | [nome] |
| [nome-workers] | [URL] | [domínio] | worker | [responsabilidade] | [stack] | [nome] |

> Uma linha por repositório — num sistema de microsserviços, uma por serviço, com o nome **exato** do git: é por ele que a `## Implementação` do N3 o cita e que a CI de cada repositório se identifica. **Domínio** é o N1 (o domínio de negócio, não um por serviço); **Tipo** separa os serviços de negócio dos técnicos, que não viram funcionalidade. As funcionalidades de cada repositório não se listam aqui à mão: a seção *Funcionalidades por repositório*, no fim deste arquivo, é gerada pelo `node scripts/gera-indice-repos.mjs`.

---

## Como rodar cada repositório

| Repositório | Comando | Porta | Pré-requisitos |
|---|---|---|---|
| [nome-backend] | `[comando]` | [porta] | [ex: Node 20, PostgreSQL 15] |
| [nome-frontend] | `[comando]` | [porta] | [ex: Node 20] |
| [nome-workers] | `[comando]` | — | [ex: Redis] |

---

## Variáveis de ambiente

| Variável | Repositório(s) | Descrição | Exemplo |
|---|---|---|---|
| `[VARIAVEL]` | [repo] | [descrição] | `[exemplo]` |

---

## Relação entre repositórios

```
[nome-frontend]  ──→  [nome-backend]  ──→  [banco]
                            │
                            └──→  [nome-workers]  ──→  [fila/serviço]
```

---

## Padrão de branches

| Branch | Propósito | Merge via |
|---|---|---|
| `main` | Produção | PR aprovado |
| `develop` | Desenvolvimento | PR aprovado |
| `funcionalidade/[nome]` | Nova funcionalidade | PR para develop |
| `fix/[nome]` | Correção de bug | PR para develop |
| `hotfix/[nome]` | Correção urgente | PR para main e develop |

---

<!-- REPOS-FEATURES:INICIO -->
## Funcionalidades por repositório

> ⚙️ **Seção gerada por `scripts/gera-indice-repos.mjs` — não editar à mão.** O índice reverso do `## Implementação` dos N3: as funcionalidades que cada repositório implementa — o que muda se ele mudar. A fonte é o N3; corrija lá e regenere.

_Nenhum N3 declara repositório do inventário no `## Implementação` ainda._

**Sem funcionalidade declarada** (0): —

<!-- REPOS-FEATURES:FIM -->
