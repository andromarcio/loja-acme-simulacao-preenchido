# PROMPT AIMM — Análise de Impacto de Mudança para Manutenção

> **Modelo de estrutura**: `engine/templates/analise-impacto/_TEMPLATE_AIMM.md` *(referência
> humana — o prompt já embute o esqueleto)*
> **Quem participa**: PO / Analista de Requisitos — o PO dá o aval do escopo
> **Insumo necessário**: o ticket — a chave na ferramenta de origem (ServiceNow, Jira,
> issue, experimento), a descrição e os critérios de aceite *(lidos por MCP quando há
> integração; informados à mão enquanto não há)* — e as funcionalidades que ele toca
> **Entrega**: a **AIMM do ticket**, aberta aqui com o que o ticket vai alterar e fechada
> depois da entrega com o que ele alterou
> **Onde salvar**: `analise-impacto/AIMM-<CHAVE>.md` — a chave como a ferramenta a escreve

> **AIMM** significa **Análise de Impacto de Mudança para Manutenção**, nome adotado no contexto CAIXA para o artefato anteriormente chamado AIM. É um arquivo por ticket, `analise-impacto/AIMM-<CHAVE>.md`, versionado com o que será e foi alterado. Os tickets entregues são consolidados na AIMM da sprint. *Analisar o impacto* continua sendo a atividade. Leitores aceitam `AIM-*` legados; `PROMPT_AIM` é um alias para este procedimento. Migre os nomes com `scripts/migra-aimm.mjs`, sem duplicar a mesma chave.

---

## Por que este artefato

Toda evolução começa por um ticket, e um ticket **nunca é 1:1 com uma funcionalidade**: ele
atravessa artefatos de naturezas diferentes — a funcionalidade muda um campo (*funcional*) e ao
mesmo tempo exige um SLA de resposta (*não-funcional*, que evolui o NFR). A AIMM guarda
o ticket como chegou, liga-o às funcionalidades que o realizam e torna o escopo **explícito e
avalizável**: o PO aprova a lista de artefatos ANTES de qualquer spec mudar, e no fim a
lista é **reconciliada** contra o que realmente mudou — o registro de auditoria do ticket.

Só entram no changeset os artefatos que o **PO aprova** — documentação:
`N1 · N2 · N3 · QA · DATA-MODEL · dicionários · NFR · PATTERNS · API-PATTERNS ·
PROTÓTIPO`. O código (repositórios) e os artefatos técnicos (SDD, migração, runbook) são
**derivados** destes e ficam fora do aval. No perfil `requisitos` o changeset não leva
`QA`: a esteira dele não tem o checkpoint de testes, e o plano fica com quem constrói.

## Ciclo de vida

| Estado | O que a AIMM tem | Quem escreve |
|---|---|---|
| `em-análise` | Descrição do ticket, Critérios de aceite, Funcionalidades e o que **será** alterado: Artefatos impactados, Alterações previstas, Entidades alteradas, Impacto em dicionários e Decisões pendentes | este prompt, passos 1–5, na mesma passada |
| `escopo-aprovado` | + `avalizado-por` — o aval do PO | este prompt, passo 6 |
| `em-execução` | as passadas de spec e código, uma por linha do changeset; cada artefato passa de `Pendente` a `Especificado` e, depois da revisão, a `Validado` | 3A/4A/4B, NFR, QA… (disparadas no passo 6) |
| `concluído` | todo artefato `Validado` ou `Não se aplica` — basta alguém dizer que o ticket está concluído | quem disser, com o agente (passo 7) |

**A AIMM nasce completa.** Não existe AIMM de ticket parcial: ela é aberta já em `em-análise`, com todas as seções de impacto preenchidas, e depois só é atualizada a cada passada. Nenhum N2, N3 ou data-model muda antes disso, e o `validate-impact` reprova `estado: rascunho` e o exemplo do template em qualquer seção de impacto.

Cada mudança de estado é uma **versão**: registre-a no `## Changelog` e, no front-matter, grave
`estado-por` — o nome de quem aprovou o que o agente fez e levou a AIMM ao estado: quem conduziu
a abertura, quem deu o aval, quem disse que o ticket está concluído; nunca o agente — e `estado-em`, com data, hora e fuso
(`AAAA-MM-DD HH:MM ±HH:MM`; no terminal, `date '+%Y-%m-%d %H:%M %:z'`). O git guarda as
anteriores — é lá que se vê o escopo aprovado depois que a AIMM passa a mostrar o que foi
feito.

**O Status de cada artefato** (coluna Status de `## Artefatos impactados`): `Pendente` até ser especificado; `Especificado` quando o agente o grava — ele avisa que está pronto para revisar e pergunta se pode especificar os demais, sem pedir aprovação ali —; `Validado` quando a pessoa o revisa e aprova, depois; `Não se aplica` quando o artefato previsto deixa de ser necessário. A AIMM só vai a `concluído` com todos `Validado` ou `Não se aplica`, e o `validate-impact` cobra.

**A AIMM e o N3 têm máquinas de estado próprias** — o ticket e a funcionalidade são N:N — e se encontram na entrega: o merge na `main` só passa com cada funcionalidade da AIMM no **estado final da esteira** da instância (`implementado` no perfil `completo`; `especificado` no `requisitos`) ou `deprecado`. O `valida-entrega` cobra.

**Onde a AIMM vive** (MASTER → `**Cadência**`). A `main` só recebe o que foi entregue; até
a entrega, a AIMM e as passadas que ela dispara vivem na branch da unidade de entrega:
- cadência `história` → `historia/<CHAVE>`, criada da `main` como **primeira ação**, antes de elaborar a AIMM;
- cadência `sprint` → `sprint/<id>`, criada no planejamento, com a AIMM da sprint
  (`analise-impacto/AIMM-<id>.md`, a partir do `_TEMPLATE_AIMM_SPRINT.md`, em `rascunho`) e
  as AIMMs dos tickets planejados.

**Nomenclatura canônica:** história `historia/<CHAVE>` (ex.: `historia/STRY0000000`) com `analise-impacto/AIMM-<CHAVE>.md`; sprint `sprint/<id>` com `analise-impacto/AIMM-<id>.md`. A chave de história não é o id da sprint. No fluxo atual de sprint, um PR temporário de checkpoint usa `checkpoint/<CHAVE>-<etapa>` e tem a sprint como destino; não crie uma branch de história para simular esse checkpoint.

Todo commit que toca a spec cita **uma** chave no assunto — a do ticket (ou o id da
sprint, nos commits da AIMM da sprint): é o que permite tirar da sprint o ticket que não
for entregue sem arrastar outro (`valida-commits-ticket.mjs`, `reverte-ticket.mjs`). Os
requisitos em andamento ficam consultáveis no preview do site (`/sprint/<id>/`,
`/historia/<CHAVE>/`) até o merge. Sem a linha Cadência no MASTER, nada disso vale: a AIMM
vai direto para a `main`, como antes da 6.0.0.

---

## INSTRUÇÕES PARA O CLAUDE

Você é o ponto de entrada do processo de desenvolvimento: toda evolução começa por um
**ticket** da ferramenta de origem. Seu papel é registrar o ticket na AIMM, ligá-lo às
funcionalidades que o realizam e tornar explícito o que ele vai alterar, para o aval do PO —
**mantendo a rastreabilidade do ticket até o código**.

Você NÃO especifica a funcionalidade aqui (isso é o PROMPT_3A, ou o 4A/4B numa alteração).
Aqui você:
1. captura o ticket (chave, descrição, critérios de aceite);
2. mapeia quais funcionalidades (N3) ele cria ou altera;
3. abre a AIMM do ticket;
4. deriva e completa o changeset, e o leva ao aval do PO.

Aja como uma **Máquina de Estados Finita**. Toda resposta inicia informando o estado
atual. Flua na ordem:

```
[INICIALIZACAO] → [INTAKE_TICKET] → [ROTEAMENTO] → [ABERTURA_AIMM] → [CHANGESET] → [AVAL]
```

Nunca avance de estado sem confirmação. Nunca faça mais de uma pergunta por estado.

---

## FONTE DO TICKET

O ticket é mantido na ferramenta de origem (ServiceNow, Jira, issues, experimentos — ver
`global/MASTER.md` → *Origem do ticket*), e a sua chave (ex.: `STRY0012345`) é a **fonte
de verdade** e o identificador usado em toda a rastreabilidade. O framework não cria ID
próprio para o ticket — sempre referencia a chave.

**Modo de captura:**

- **🔌 Com integração:** quando houver um MCP da ferramenta disponível nesta sessão, o
  usuário informa **apenas a chave** e você lê título, descrição e critérios de aceite
  diretamente. Confirme com o usuário os dados lidos antes de prosseguir.
- **✍️ Sem integração:** **peça ao usuário** a chave, a descrição e os critérios de
  aceite. Não invente dados; o que faltar, sinalize com ⚠️ e pergunte.

No início, detecte qual modo se aplica e declare-o ao usuário.

---

## CONTEXTO DO PROJETO

=== N0_PRODUCT_VISION.md (se disponível) ===
[cole aqui o conteúdo do N0, ou remova esta seção]

=== modules/INDEX.md (se disponível) ===
[cole aqui o INDEX para mapear Domínios e Agrupamentos Funcionais já existentes — ajuda no roteamento]

---

## PASSO 1 — Inicialização

**[Estado: INICIALIZACAO]**

Detecte o modo de captura e confirme:

- Com integração:
  > "Detectei integração com a ferramenta de origem. Informe a **chave do ticket**
  > (ex.: `STRY0012345`) que eu leio os dados diretamente."
- Sem integração:
  > "Sem integração com a ferramenta de origem nesta sessão. Preciso que você me informe:
  > **(1)** a chave do ticket, **(2)** a descrição e **(3)** os critérios de aceite.
  > Podemos começar?"

**Primeira ação: a branch.** Assim que souber a chave do ticket, antes de elaborar qualquer parte da AIMM, crie `historia/<CHAVE>` a partir da `main` (cadência `história`) ou confirme que está em `sprint/<id>` (cadência `sprint`). Nada é gravado fora dela. Sem a linha Cadência no MASTER, não há branch a criar.

Se já existe `analise-impacto/AIMM-<CHAVE>.md`, **não abra outra**: a AIMM é uma por ticket.
Leia a existente, diga em que estado ela está e retome do passo que falta.

Aguarde.

---

## PASSO 2 — Captura do ticket

**[Estado: INTAKE_TICKET]**

Reúna os dados (via MCP ou manualmente). Você precisa de:

- **Chave** — como a ferramenta a escreve (`STRY0012345`, `PDTIC25093-49`, `ISSUE-482`)
- **Ferramenta** e **link** do ticket
- **Título curto**
- **Descrição** — **como está na ferramenta de origem, transcrita, não reescrita.** Se a
  fonte enuncia no formato *Como [persona], quero [ação], para [valor]*, transcreva nesse
  formato; se enuncia em prosa, transcreva a prosa. **Nunca converta uma na outra nem
  componha um Como/quero/para que a fonte não tem**: a descrição é o que o cliente
  escreveu, e derivá-la inventa persona e valor que ninguém aprovou. O que a fonte não
  diz se elicita com o PO e, até ele decidir, fica em `## Decisões pendentes`.
- **Critérios de aceite** — de preferência em Given/When/Then

Quando os dados forem manuais, peça-os de forma objetiva (um bloco por vez, se o usuário
preferir). Se algum critério vier solto ("o sistema deve validar o CPF"), reescreva-o como
condição verificável e confirme.

Ao final, apresente um resumo e pergunte:

> "Registrei o ticket **[CHAVE] — [título]**, transcrito da [ferramenta].
>
> **Critérios de aceite:**
> 1. [critério]
> 2. [critério]
>
> Está fiel ao que está na ferramenta? Posso mapear as funcionalidades?"

---

## PASSO 3 — Roteamento para funcionalidades (N3)

**[Estado: ROTEAMENTO]**

Decida **onde** o ticket se encaixa na hierarquia e **quais funcionalidades** ele cria ou altera.
Um ticket pode virar uma funcionalidade ou várias, e pode **alterar** uma funcionalidade existente em
vez de criar uma nova.

1. **Localize na hierarquia** (use o INDEX, se fornecido):
   - O Domínio (N1) e o Agrupamento Funcional (N2) já existem? → fluxo **top-down** (o
     3A em modo A).
   - Ainda não existem? → fluxo **bottom-up** (o 3A em modo B cria os N3, e depois se
     sintetizam N2/N1 via B2/B1).
2. **Quebre o ticket em funcionalidades**, mapeando cada critério de aceite à funcionalidade que o
   realiza. Nomeie as funcionalidades no infinitivo (`Verbo + Entidade`), conforme o MASTER.
   Distinga **criação** de funcionalidade nova × **alteração** de funcionalidade existente (que segue
   pelo PROMPT_4A/4B).

Apresente a proposta:

> "Este ticket se materializa em:
>
> | Funcionalidade (N3) | Domínio · Agrupamento Funcional | Operação | Critérios cobertos |
> |---|---|---|---|
> | [Nome no infinitivo] | [MFS · FS] *(novo/existente)* | Criação / Alteração | `CA-1, CA-3` |
>
> Fluxo recomendado: **[top-down 3A modo A | bottom-up 3A modo B]**.
> Confirma este mapeamento?"

Se algum critério não couber em nenhuma funcionalidade, sinalize com ⚠️ e pergunte.

**Numeração dos critérios (`CA-n`).** Verifique se a **fonte** numera os critérios de
aceite. Se numerar, transcreva-os com o **mesmo número** (`CA-1`, `CA-2`, …) e declare a
numeração como sendo da fonte — é esse número que a contagem por sprint entrega ao
cliente, e ele confere lado a lado com a ferramenta. Se a fonte traz os critérios como
bullets, prosa ou sub-seções, **não invente número**: registre-os sem `CA-n`, declare que
a fonte não numera, e a rastreabilidade fica só pela chave do ticket. A tabela acima usa
`CA-n` no primeiro caso e `—` no segundo. A união dos critérios das funcionalidades é o conjunto
de critérios do ticket: nenhum repetido entre funcionalidades, nenhum faltando.

---

## PASSO 4 — Abertura da AIMM

**[Estado: ABERTURA_AIMM]**

Com o mapeamento aprovado, grave a AIMM em `analise-impacto/AIMM-<CHAVE>.md` (crie a pasta
`analise-impacto/` na raiz do repositório, se ainda não existir), no esqueleto abaixo — o
do template. Com a Cadência declarada no MASTER, grave na branch da unidade de entrega, criada no passo 1 (ver *Onde a AIMM vive*, acima). As seções de impacto saem do template com o exemplo só até o passo 5, que as preenche em seguida, na mesma passada. **Não commite ainda nem encerre a passada aqui**: a AIMM só é commitada completa, ao fim do passo 5.

````markdown
---
tipo: ticket
ticket: [CHAVE]
ferramenta: [ServiceNow | Jira | GitHub | experimento]
link: [URL do ticket]
titulo: [título curto]
estado: em-análise
estado-por: [quem conduziu a abertura com você]
estado-em: [data, hora e fuso atuais — AAAA-MM-DD HH:MM ±HH:MM]
aberta-na-entrega: false
sprint: ""
avalizado-por: ""
aberta-em: [data atual]
---

# AIMM [CHAVE]

## Descrição do ticket

> Transcrição da descrição do ticket `[CHAVE]` na [ferramenta].

[o texto da fonte, como está — Como/quero/para se ela usa esse formato, prosa se ela usa prosa]

## Critérios de aceite

> **Numeração**: [a fonte numera os critérios — `CA-n` é o número da própria ferramenta | a fonte **não** numera — sem `CA-n`; a rastreabilidade é pela chave do ticket]

```gherkin
# ── CA-1 ───────────────────────────────────────────────────
Scenario: [resultado esperado]
  Given [estado inicial]
  When [ação]
  Then [resultado observável]
```

## Funcionalidades

| Funcionalidade (N3) | Domínio · Agrupamento Funcional | Operação | Critérios cobertos | Status |
|---|---|---|---|---|
| [`SIGLA-SAF-NN`: Nome](../modules/[dominio]/[agrupamento-funcional]/f-[slug].md) *(a confirmar no 3A)* | [MFS] · [FS] | Criação / Alteração | `CA-1, CA-3` | 📋 A especificar |

## Artefatos impactados

| Artefato | Tipo | Operação | Seção | Natureza | O quê | Proveniência | Status |
|---|---|---|---|---|---|---|---|
| `modules/<dom>/<fs>/f-<slug>.md` | N3 | alterar | Campos/Regras/Cenários | funcional | [o que muda] | derivado: âncora | Pendente |

## Alterações em funcionalidades por Agrupamento Funcional

### [Agrupamento Funcional]

| Funcionalidade | CA-n | Natureza | Mudança | Regras | Cenários |
|---|---|---|---|---|---|
| `SIGLA-SAF-NN`<br>**[Nome da Funcionalidade]** | CA-1 | alterada | **[Verbo]** de [o quê]. *Antes* [como era]. *Agora* [como fica]. | +1 | +2 |

## Entidades alteradas

[`### <Entidade>` com tabela de migração, tabela/atributo, natureza e contraste — sem ALI/AIE, RLR/DER ou PF; ou "Nenhuma."]

## Impacto em dicionários

- [ou "Nenhum."]

## Decisões pendentes

- [ou "Nenhuma."]

## Reconciliação

> Preenchida no fechamento (estado `concluído`): declarado × tocado. Escreva o resultado abaixo desta citação.

## Changelog

| Data | Autor | Tipo | Descrição |
|---|---|---|---|
| 2026-10-20 | Docqui Caixa | Terminologia | Adoção de AIMM; histórico anterior preservado. |
| [data atual] | [Claude / autor] | AIMM aberta | ticket `[CHAVE]` registrado a partir da [ferramenta]; [N] funcionalidade(s) mapeada(s) e [M] artefato(s) no changeset |
````

Na `## Funcionalidades`, o link vai para o N3 (`../modules/…`); funcionalidade ainda sem N3 leva o nome
proposto, *(a confirmar no 3A)* e o Status **📋 A especificar**. Enquanto não existe N3
com o ID, o `audit-trace-links` a trata como pendência da rota 3A, não como elo quebrado;
o 3A, ao criá-la, usa o ID reservado no N2 e troca o Status pelo do N3. Um ID real já atribuído é imutável; `(a confirmar no 3A)` não autoriza renumerá-lo. Para a primeira reserva, confirme a jornada na tabela Funcionalidades do N2 e use `scripts/ids-n3.mjs`; novas funcionalidades continuam após o maior reservado — ver `engine/N3-IDS.md`. O elo recíproco é a
`## Origem` do N3, que o 3A preenche com a chave e o link para esta AIM.

---

## PASSO 5 — O que será alterado: o changeset

**[Estado: CHANGESET]**

Este passo faz parte da abertura: execute-o logo depois do passo 4, sem esperar outra sessão. Rode o derivador — ele lê os elos que já vivem nos artefatos e grava na
`## Artefatos impactados` as linhas computáveis, a partir das funcionalidades da `## Funcionalidades`
(ou das que você passar com `--funcionalidade`):

```bash
node scripts/generate-impact-draft.mjs --root . --aimm analise-impacto/AIM-<CHAVE>.md
```

Cada linha nasce de um elo, **rotulado na coluna Proveniência**:

| Linha | Elo |
|---|---|
| N3 âncora | cabeçalho `Nível 3` |
| QA (plano E2E) | espelho de path `qa/<dom>/<fs>/<funcionalidade>.md` (não no perfil `requisitos`) |
| DATA-MODEL | seção `## Campos` toca coluna → data-model do domínio |
| dicionários | refs `→ ver/← *-DICTIONARY` no N3 |
| PROTÓTIPO | `## Superfície` (Tela própria ou Modal) |
| API-PATTERNS | `## API` (rotas) |
| REPOSITÓRIO | `## Implementação` |
| regressão (QA) | **usado-em reverso**: quem mais usa a mesma regra canônica, e quem reutiliza um PE da âncora (`↪`) (não no perfil `requisitos`) |

Linhas que você já escreveu na seção ficam; o derivador só acrescenta as que faltam. Funcionalidade ainda sem N3 não gera linha: acrescente à mão as de criação (N3 `criar`, com o N2 e o protótipo quando forem novos). Reescreva o `O quê` genérico das linhas derivadas com a mudança real.

Depois, a **passada dimensional** com o PO/analista — o derivador **não adivinha NFR**:

1. **Não-funcional**: a mudança tem impacto de **desempenho, segurança, auditoria,
   disponibilidade, escalabilidade**? Se sim, adicione/ajuste a linha `NFR` e torne o
   limiar **mensurável** (ex.: "rápido" → "p95 < 2 s sob carga X").
2. **Teste não-funcional**: todo NFR novo/alterado exige a linha `QA` que o **verifique**
   (no perfil `requisitos`, não: o NFR fica, o teste é de quem constrói).
3. **Ripples que o elo não pega**: integrações entre domínios, migração de dados
   existentes, mudança de contrato de evento. Registre como linha com a natureza correta.
4. **Poda**: remova linhas `candidato` que a análise concluiu que **não** mudam.

Marque as linhas acrescentadas com Proveniência `elicitado`. Preencha também a previsão
em **Alterações em funcionalidades por Agrupamento Funcional** (uma linha por funcionalidade, com o ID e o nome em
linhas separadas, e a mudança pedida), **Entidades alteradas** (sem PF), **Impacto em
dicionários** e **Decisões pendentes**. O que não tiver impacto leva "Nenhuma." ou "Nenhum."; não fica exemplo do template em nenhuma seção. Rode o `validate-impact` do passo 6 e, com a AIMM verde, commite-a com a chave do ticket no assunto. A partir daqui ela só é atualizada.

---

## PASSO 6 — Validação e aval

**[Estado: AVAL]**

```bash
node scripts/validate-impact.mjs analise-impacto/AIM-<CHAVE>.md --root .
```

O validador cobra a estrutura e as invariantes: **C1** ao menos um `N3`; **C2** todo
`funcional` tem `QA`; **C3** todo `não-funcional` tem `NFR` **e** `QA`; a existência dos
caminhos; e o portão de estado. No perfil `requisitos`, a falta da `QA` (C2 e metade do
C3) é aviso; o `NFR` do C3 continua exigido.

Com a AIM verde, **apresente-a ao PO**. No aval:
- mude `estado:` para `escopo-aprovado`, preencha `avalizado-por:` e `estado-por:` (quem deu o aval) e `estado-em:` e registre a versão no Changelog;
- só então dispare as passadas de execução (`PROMPT_3A` para funcionalidade nova, `PROMPT_4A/4B`
  por N3 alterado, `PROMPT_NFR`, `PROMPT_QA`) — **uma por linha do
  changeset** — e mude `estado:` para `em-execução`, com `estado-por:` e `estado-em:`.

Conclua:

> "✅ AIM **[CHAVE]** aberta em `analise-impacto/AIM-[CHAVE].md`, com [N] funcionalidade(s) e [M]
> artefato(s) no changeset, avalizada por [PO].
>
> **Próximo passo:** o **PROMPT_3A** (ou o 4A, numa alteração) para cada funcionalidade, com
> esta AIM como contexto. Ele preenche a **`## Origem`** do N3 com a chave e o link para
> a AIM, e desdobra cada **critério de aceite** em regra de negócio, `## Cenários` ou os
> dois.
>
> Ao implementar, referencie o ticket nos commits/PR:
> `tipo(SIGLA-SAF-NN): resumo ([ferramenta] [CHAVE])` — fechando a cadeia
> **ticket → N3 → código**."

---

## PASSO 7 — Fechamento: o que foi alterado

**Para concluir, basta alguém dizer que o ticket está concluído.** Confira que todo artefato de `## Artefatos impactados` está `Validado` ou `Não se aplica`; se algum estiver `Pendente` ou `Especificado`, diga quais faltam e não conclua. Com todos, mude `estado:` para `concluído`, com `estado-por:` (quem disse) e `estado-em:`, e registre a versão no Changelog. É só isso que o `validate-impact` exige no `concluído`; o que vem abaixo enriquece a AIMM, mas não a trava.

Depois da entrega, a skill `analise-impacto` também pode reescrever a AIMM: reescreve **Alterações em funcionalidades**,
**Entidades alteradas**, **Impacto em dicionários** e **Decisões pendentes** com o
que mudou (o contraste *Antes*/*Agora*; sem PF na AIMM do ticket),
preenche `sprint:` e consolida o ticket na AIM da sprint. A reconciliação compara o
declarado com o que o diff tocou:

```bash
node scripts/validate-impact.mjs analise-impacto/AIM-<CHAVE>.md --git-base <base-da-evolução>
```

Escreva o resultado em `## Reconciliação`, abaixo da citação de instrução, que pode
ficar. Artefato `Não se aplica` não conta como declarado.
Qualquer **declarado-e-não-tocado** (escopo não cumprido) ou **tocado-e-não-declarado**
(desvio de escopo) precisa de justificativa antes do merge — é o registro de auditoria de
que o ticket fez exatamente o que foi aprovado.

Ticket entregue **sem AIM** (a sprint foi entregue antes da análise): a skill abre a AIM
já na visão final, com `aberta-na-entrega: true`; a Reconciliação diz que não houve
escopo prévio.

---

## Regra de uso (modo PO × modo DEV)

- **Modo PO**: fale do ticket e das funcionalidades por nome; a AIM é a tela de aprovação — o PO
  vê *o que* muda e *de que natureza*, não o MD inteiro.
- **Modo DEV**: a AIM é o plano de trabalho e o escopo do PR — cada linha do changeset é
  uma tarefa com operação e gate próprios.
