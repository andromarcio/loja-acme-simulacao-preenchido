<!-- docqui: {{VERSION}} | prompt: {{PROMPT_ID}} | atualizado: {{YYYY-MM-DD}} -->
# NFR.md
> Catálogo de **Requisitos Não-Funcionais** (Especificação Suplementar, à la RUP).
> Reúne as **qualidades** do sistema — *quão bem* ele faz algo (desempenho,
> segurança, confiabilidade…) — separadas das regras de negócio (*o quê* ele faz).
>
> **Quem mantém**: arquiteto / dev / analista (ver `PROMPT_NFR.md`)
> **Atualização**: a cada NFR a saída **substitui o arquivo inteiro** — preserve
> todos os itens existentes e apenas integre a alteração.

---

## Roteamento — o que é (e o que não é) NFR

Antes de criar um NFR, classifique:

- **É NFR** → uma **qualidade** do sistema: tempo de resposta, segurança, disponibilidade, auditoria, usabilidade, restrição técnica. Registre aqui.
- **Não é NFR**:
  - **invariante de negócio** (*o quê* o sistema garante) → `RULES-DICTIONARY.md` (canônica) ou N1 (transversal de domínio) ou N3 (específica da funcionalidade);
  - **mensagem de UI** → `MESSAGE-DICTIONARY.md`;
  - **código de erro** → `ERROR-DICTIONARY.md`.

## Herança

NFRs são **herdados** por todas as funcionalidades — não se repetem nos N3. Um N3 só **referencia** um NFR quando precisa apontá-lo explicitamente (ex.: a seção `## AuditLog` aponta `→ ver NFR: AUD-01`). Nunca reescreva a qualidade no N3.

---

## Índice

| ID | Categoria | Requisito |
|---|---|---|
<!-- perfil:requisitos -->
| [SEG-01](#seg-01--autorização-por-funcionalidade) | Segurança | Acesso a cada funcionalidade é efetivamente controlado por perfil |
<!-- /perfil:requisitos -->
<!-- perfil:completo -->
| [SEG-01](#seg-01--autorização-por-funcionalidade) | Segurança | Acesso a cada funcionalidade é controlado por perfil, no servidor |
<!-- /perfil:completo -->
| [AUD-01](#aud-01--registro-de-auditoria) | Auditoria | Ações críticas ficam registradas em log de auditoria |

> Categorias (prefixos FURPS+): **DES** Desempenho · **SEG** Segurança ·
> **CONF** Confiabilidade/Disponibilidade · **AUD** Auditoria/Rastreabilidade ·
> **USA** Usabilidade/Acessibilidade · **SUP** Suportabilidade/Observabilidade ·
> **REST** Restrições de design e implementação.

---

## DES — Desempenho

> *(sem itens ainda — adicione no formato canônico abaixo)*

## SEG — Segurança

### SEG-01 — Autorização por funcionalidade

<!-- perfil:requisitos -->
**Requisito**: o acesso a cada funcionalidade é controlado pelo perfil do usuário, conforme a matriz de permissões do N2. A restrição deve ser efetiva, não apenas uma ocultação visual.

**Critério de aceitação**: um usuário sem permissão não executa a funcionalidade; um usuário com permissão consegue executá-la nas condições previstas.

**Verificação**: cenários positivos e negativos de acesso conforme a matriz do N2, sem prescrever a solução técnica de autorização.
<!-- /perfil:requisitos -->
<!-- perfil:completo -->
**Requisito**: o acesso a cada funcionalidade (Funcionalidade N3) é controlado por perfil e **aplicado no servidor**. A funcionalidade é o átomo de autorização, identificada pelo ID da Funcionalidade (`[SIGLA]-[SAF]-[NN]`); o vínculo perfil↔funcionalidade é dado configurável, sem alteração de código. Modelo completo em `global/AUTHZ.md`.

**Critério de aceitação**: (a) toda requisição a um endpoint de funcionalidade é negada quando o perfil do usuário não tem a Funcionalidade vinculada — *nega por padrão*; (b) a ocultação no frontend é apenas UX e nunca a única barreira; (c) o perfil Administrador acessa toda Funcionalidade do Catálogo; (d) uma Funcionalidade globalmente desabilitada é inacessível a todos, independentemente de perfil.

**Verificação**: teste negativo que chama o endpoint com perfil sem vínculo e espera negação; teste que confirma acesso com vínculo; teste do *kill switch* global; revisão de que todo endpoint de funcionalidade declara o ID da Funcionalidade.
<!-- /perfil:completo -->

**Exceções**: autenticação/identidade no login → SSO corporativo (fora do sistema); registro do acesso → ver NFR AUD-01.

> **Cobertura mínima recomendada (SEG)** — instancie via `PROMPT_NFR`, um item
> canônico por tema, conforme se aplicar ao produto:
>
> - **Clássica**: armazenamento de credenciais (hash adaptativo, reset de uso
>   único) · sessão e tokens (expiração, invalidação, segredo fora de código) ·
>   força bruta (rate limit + bloqueio progressivo + respostas neutras) · upload
>   de arquivos (allowlist, tamanho, URL pré-assinada, nunca executável) ·
>   criptografia em trânsito e em repouso · privacidade/dados pessoais (LGPD:
>   minimização, eliminação, retenção).
> - **Sistemas com agentes de IA (LLM)** — baseada no *OWASP Top 10 for LLM
>   Applications*; obrigatória quando o produto monta prompts com conteúdo de
>   usuário ou dá ferramentas a agentes: **entrada não confiável no prompt**
>   (prompt injection: instruções × dados separados; conteúdo externo não
>   redefine regras do agente) · **saída não confiável** (validação por schema;
>   sanitizar render; código gerado só em sandbox/CI) · **agência limitada**
>   (ação irreversível/externa exige gate humano; menor privilégio nos tokens
>   dos agentes) · **isolamento de contexto entre tenants** (contexto/cache/
>   memória segregados por conta) · **limites de consumo** (orçamento de
>   tokens por requisição/conta — custo é superfície de abuso).

## CONF — Confiabilidade / Disponibilidade

> *(sem itens ainda)*

## AUD — Auditoria e rastreabilidade

### AUD-01 — Registro de auditoria

**Requisito**: ações críticas (criação, alteração e exclusão de registros sensíveis) devem ser registradas em log de auditoria, com autor, data/hora e o que mudou.

**Critério de aceitação**: para toda ação marcada como auditável, existe um registro de auditoria recuperável contendo identificação do autor, timestamp e o delta (antes/depois) da operação.

**Verificação**: teste que executa a ação e confere a criação do registro de auditoria correspondente; revisão da cobertura de ações auditáveis.

## USA — Usabilidade / Acessibilidade

> *(sem itens ainda)*

## SUP — Suportabilidade / Observabilidade

> *(sem itens ainda)*

## REST — Restrições de design e implementação

> *(sem itens ainda)*

---

## Formato canônico de um NFR

Cada item segue **exatamente** este bloco, na seção da sua categoria:

```markdown
### [CATEGORIA-NN] — [Título curto]

**Requisito**: [a qualidade que o sistema deve ter — uma a duas frases]

**Critério de aceitação**: [condição objetiva e verificável de atendimento]

**Verificação**: [como se comprova — teste de carga, teste negativo, revisão…]

**Exceções**: [quando não se aplica, ou → ver outro NFR]   (incluir só se houver)
```

Regras de conteúdo:
- **Requisito** descreve uma **qualidade** (*quão bem*), nunca um comportamento de negócio (*o quê*).
- **Critério de aceitação** deve ser **verificável** (limite numérico, condição binária, padrão a conferir).
- **ID novo**: próximo número sequencial dentro da categoria (não reutilize números removidos).

---

## Instrução para a LLM

Ao adicionar ou ajustar um NFR (PROMPT_NFR):
1. Determine ação (novo vs. ajuste de ID existente), categoria (prefixo FURPS+) e ID sequencial.
2. Monte o bloco no formato canônico, na seção da categoria correta.
3. Atualize a tabela de **Índice** no topo.
4. **Devolva o arquivo inteiro** com todos os itens preservados — nunca um fragmento.
5. Se o que foi informado é regra de negócio (não qualidade), avise e encaminhe ao RULES-DICTIONARY/N1/N3 em vez de criar um NFR.
