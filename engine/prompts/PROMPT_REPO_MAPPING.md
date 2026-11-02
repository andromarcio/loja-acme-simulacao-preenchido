# PROMPT_REPO_MAPPING — Mapeamento de Repositórios para FDD

> **Modelo de estrutura**: `engine/templates/repos/_template-repo.md` *(referência humana — o prompt já embute o esqueleto)*
> **Quando usar**: sistema existente com múltiplos repositórios sem documentação.
> Este é o **primeiro passo** antes de qualquer extração de código.
>
> **Quem participa**: dev sênior ou arquiteto que conhece a estrutura dos repos
> **Insumo necessário**: lista dos repositórios com descrição resumida de cada um
> **Entrega**:
> - `repos/INDEX.md` preenchido — vira o **inventário canônico**: o 3B (PASSO 5)
>   só aceita repositórios de destino que constem nele (cruzado pelo `validate-doc.mjs`)
> - Um `repos/[nome-repo].md` por repositório
> - Rascunho do mapa FDD: qual repo corresponde a qual Domínio/Agrupamento Funcional
> - `modules/INDEX.md` com os domínios identificados (sem N1s ainda)
>
> **Próximo passo**: PROMPT_REVERSE_ENGINEERING — um repo de cada vez

---

## INSTRUÇÕES PARA O CLAUDE

Você vai mapear os repositórios de um sistema existente para a estrutura
FDD (Domínio → Agrupamento Funcional → Funcionalidade), criando a base de navegação
do repositório de documentação.

**Controle de fluxo — Máquina de Estados:**

```
[INICIALIZACAO] → [COLETA_REPOS] → [ANALISE_DOMINIOS]
               → [MAPA_FDD] → [GERACAO_ARTEFATOS]
```

Regras da sessão:
- Faça uma pergunta de cada vez
- Não assuma a estrutura de domínios — derive do que o usuário informar
- Sinalize dependências entre repos com ⚠️ quando identificadas
- Repos que compartilham banco de dados ou eventos são candidatos
  a pertencerem ao mesmo domínio — sinalizar para confirmação

---

## CONTEXTO DO PROJETO

=== MASTER.md (se já existir) ===
[cole aqui, ou informe que ainda não existe]

---

## PASSO 1 — Inicialização

**[Estado: INICIALIZACAO]**

Confirme e aguarde:
> "Vou ajudá-lo a mapear os repositórios do sistema existente para a
> estrutura de documentação. Podemos começar com a lista de repositórios?"

---

## PASSO 2 — Coleta dos repositórios

**[Estado: COLETA_REPOS]**

Faça esta pergunta e aguarde:

> "Liste os repositórios do sistema. Para cada um informe:
> - **Nome** do repositório (como está no git)
> - **URL** (se quiser registrar)
> - **O que faz** em uma ou duas frases
> - **Tecnologia principal** (ex: Node.js, Python, React, etc.)
> - **Banco de dados próprio?** (sim/não — e qual, se sim)
> - **Comunica com outros repos?** (quais e como: API, eventos, banco compartilhado)"

Após receber a lista, pergunte:
> "Recebo [N] repositórios. Está completa ou há outros que devo incluir?"

**Muitos repositórios** (dezenas ou centenas — um sistema de microsserviços): peça a
lista de uma vez, como tabela ou arquivo, em vez de um a um, e trabalhe por **prefixo
de domínio** do nome quando ele existir (`pagamento-*`, `frete-*`): é o rascunho dos
agrupamentos do passo 3.

---

## PASSO 3 — Análise de domínios

**[Estado: ANALISE_DOMINIOS]**

Com base nas descrições recebidas, identifique agrupamentos naturais.
Apresente sua análise e pergunte **uma pergunta de cada vez**:

**Pergunta 1 — Validação de agrupamentos**
> "Com base nas descrições, identifico os seguintes agrupamentos naturais:
>
> - **[Domínio A]**: repos [X, Y] — ambos lidam com [assunto comum]
> - **[Domínio B]**: repo [Z] — responsável por [assunto]
> - ⚠️ **Incerto**: repo [W] — pode pertencer a [A] ou [B]. A que área
>   de negócio ele está mais próximo?
>
> Os agrupamentos fazem sentido para o seu sistema?"

**Pergunta 2 — Repos de infraestrutura**

> ⚠️ **Antes de rebaixar um repo a "infraestrutura", pergunte: este repositório
> É o produto?** Ausência de banco de dados e de UI **não** significa ausência de
> lógica de negócio: um pipeline de ML, uma CLI ou uma biblioteca são o próprio
> produto — as "transações" deles são entry points/estágios e os "dados" são
> artefatos persistidos (datasets, caches, checkpoints). Um repo assim **gera N1**
> (arquétipo `ml-dados`/`cli-biblioteca` no MASTER.md; extração pela **Trilha B**
> do PROMPT_REVERSE_ENGINEERING). São infraestrutura apenas os repos de **apoio**
> ao produto: IaC/Terraform, CI/CD, scripts de deploy, configuração de ambiente.

> "Algum dos repositórios é puramente de **apoio** — IaC, CI/CD, scripts de
> deploy ou configuração de ambiente — ou seja, existe só para operar os demais?
> Se sim, quais? Eles serão registrados em `repos/` mas não gerarão N1.
> Atenção: repositório sem banco/UI cujo código **é o produto que os usuários
> executam** (pipeline, CLI, biblioteca) **não** entra nessa lista — ele gera N1
> normalmente."

**Microsserviços — o domínio é de negócio, não um por serviço.** Um sistema com
dezenas ou centenas de microsserviços continua sendo **uma sigla**: uma instância, uma
fronteira de contagem. Agrupe os serviços em domínios de negócio — o *bounded context*,
quando a arquitetura segue DDD; o prefixo do nome costuma dizê-lo — e **não** crie um
N1 ou N2 por serviço: uma funcionalidade na visão do usuário atravessa vários deles (o BFF, o
serviço de domínio, o worker), e organizada por serviço apareceria picada e contada
duas vezes. O serviço entra pelo inventário e pela coluna Repositório da
`## Implementação` de cada N3. Serviços técnicos — gateway, autenticação, configuração,
observabilidade, bibliotecas internas — são apoio: entram no inventário (Tipo
`técnico`) e nos globais (`PATTERNS`, `NFR`, `API-PATTERNS`), não viram funcionalidade.
Chamada entre serviços da mesma sigla é interna à fronteira: não é AIE nem transação a
mais na contagem (`SIZING.md`); AIE é dado de **outra sigla**.

**Pergunta 3 — Repositório de frontend**
> "Existe um repositório de frontend? Se sim, ele serve todas as funcionalidades
> ou há frontends separados por domínio/produto?"

---

## PASSO 4 — Mapa FDD

**[Estado: MAPA_FDD]**

Consolide as respostas e apresente o mapa completo para aprovação:

```
Sistema: [nome]

Domínios identificados:
├── [Domínio A]
│   ├── Repos backend: [repo-x, repo-y]
│   ├── Repo frontend: [repo-frontend] (parcial — seções A e B)
│   └── Agrupamentos Funcionais prováveis: [fs-1, fs-2] ← inferido das descrições
│
├── [Domínio B]
│   ├── Repo: [repo-z]
│   └── Agrupamentos Funcionais prováveis: [fs-3]
│
└── Infra / sem N1 (somente repos de APOIO — o produto nunca entra aqui):
    └── [repo-w] — CI/CD, scripts de deploy

Dependências entre repos:
- [repo-x] → chama API de → [repo-z]  ⚠️ acoplamento direto
- [repo-y] → publica eventos para → [repo-z]  ✅ via mensageria
```

Pergunte:
> "O mapa acima reflete corretamente a arquitetura do sistema?
> Posso gerar os artefatos?"

---

## PASSO 5 — Geração dos artefatos

**[Estado: GERACAO_ARTEFATOS]**

Após aprovação do mapa, gere todos os arquivos de uma vez:

### 📄 `repos/INDEX.md`

```markdown
# Repositórios do sistema

| Repositório | URL | Domínio | Tipo | Responsabilidade | Stack | BD próprio |
|---|---|---|---|---|---|---|
| [repo] | [url] | [domínio] | [frontend · BFF · domínio · worker · integração · técnico] | [o que faz] | [stack] | [sim/não — qual] |
```

O nome na coluna Repositório é **exatamente** o do git: é por ele que a
`## Implementação` do N3 cita o repositório (o `validate-doc` cruza os dois), que a CI
de cada repositório se identifica (`valida-artefatos-previstos --repo <nome>=…`) e que o
`gera-indice-repos.mjs` monta, no fim deste arquivo, a seção gerada **Funcionalidades por
repositório** — o índice reverso, que não se escreve à mão.

---

### 📄 `repos/[nome-repo].md` — um por repositório (com muitos, só os que pedem detalhe)

Com dezenas ou centenas de repositórios, não gere uma ficha para cada: o inventário já
diz o essencial, e ficha que ninguém lê envelhece. Gere a dos repositórios que têm
estrutura própria a explicar (o BFF, o serviço com regra de negócio pesada, o que fala
com sistema externo).

```markdown
# Repositório: [nome]

- **URL**: [url]
- **Domínio**: [domínio FDD]
- **Responsabilidade**: [o que faz]
- **Stack**: [tecnologias]
- **Banco de dados**: [sim/não — qual]
- **Comunica com**: [outros repos e como]

## Estrutura de pastas
[a preencher após leitura do código — PROMPT_REVERSE_ENGINEERING]

## Como rodar localmente
[a preencher]

## Funcionalidades implementadas neste repositório
→ ver `repos/INDEX.md` → *Funcionalidades por repositório* (gerada do `## Implementação`
dos N3 pelo `node scripts/gera-indice-repos.mjs` — não mantenha a lista aqui)
```

---

### 📄 `modules/INDEX.md` — rascunho inicial

```markdown
# Índice de módulos — rascunho inicial

> Gerado automaticamente pelo PROMPT_REPO_MAPPING.
> N1s, N2s e N3s serão criados pelo PROMPT_REVERSE_ENGINEERING.

## Domínios identificados

| Domínio | Pasta | Repos de origem | Status |
|---|---|---|---|
| [Domínio A] | modules/[dom-a]/ | [repo-x, repo-y] | 🔄 A documentar |
| [Domínio B] | modules/[dom-b]/ | [repo-z] | 🔄 A documentar |
```

---

### 📄 `MASTER.md` — rascunho inicial (se não existia)

Gerar apenas se o usuário confirmou que não existe MASTER.md.
Preencher os campos conhecidos (repos, stack) e marcar com ❓ o que
precisará ser complementado.

---

Ao finalizar, informe:

> "✅ Mapeamento de repositórios concluído.
>
> **Artefatos gerados:**
> - `repos/INDEX.md`
> - `repos/[N repos].md`
> - `modules/INDEX.md` (rascunho)
> - `MASTER.md` (rascunho, se aplicável)
>
> **Próximo passo**: extrair os requisitos do código de cada
> repositório, na seguinte ordem sugerida:
>
> **Sistema transacional/web (Trilha A):**
> 1. Começar pelos repos de **backend com banco próprio** — eles definem
>    as entidades principais
> 2. Depois repos de **workers e jobs** — complementam regras de negócio
> 3. Por último **frontend** — confirma comportamento de tela e fluxos
>
> **Pipeline/CLI/ML (Trilha B — arquétipo `ml-dados`/`cli-biblioteca`):**
> 1. Começar pelos **entry points e configs** — definem as ações e os campos
> 2. Depois os **estágios e artefatos persistidos** — regras e data-model de artefatos
> 3. Por último **testes/benchmarks** — critérios de sucesso e cenários
>
> Ordem sugerida para este sistema:
> [lista dos repos na ordem recomendada]"
