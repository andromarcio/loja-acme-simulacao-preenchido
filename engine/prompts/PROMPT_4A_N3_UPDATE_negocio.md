# PROMPT 4A — N3 Update Negócio
## Atualização de Funcionalidade Existente · Parte negocial

> **Modelo de estrutura**: `engine/templates/modules/_template-dominio/_template-agrupamento-funcional/_template-funcionalidade.md` *(referência humana — o prompt já embute o esqueleto)*
> **Quem participa**: PO + dev (ou só PO)
> **Insumo necessário**: descrição da mudança desejada + a funcionalidade alvo
> (informada por nome/palavra-chave e **localizada pelo engine**, ou colada manualmente)
> **Entrega**: N3 negocial atualizado com as mudanças solicitadas e changelog
>
> **Pré-requisito**: PROMPT_3A e PROMPT_3B originais já aprovados
> **Próximo passo**: após aprovação, usar PROMPT_4B para a parte técnica
>
> ⚠️ **Use este prompt para manutenção (Brownfield).**
> Para funcionalidades novas do zero, use PROMPT_3A.

---

## INSTRUÇÕES PARA O CLAUDE

**ID imutável:** a atualização preserva o ID do N3. Reorganizar a jornada não renumera as funcionalidades; se a alteração exigir outra funcionalidade, reserve um novo ID pelo N2 com `scripts/ids-n3.mjs`, depois do maior reservado, sem reutilizar lacunas — ver `engine/N3-IDS.md`.

> **Protocolo obrigatório desta sessão (F1 preflight · F2 autovalidação):**
> 1. **Antes de gerar** — rode `node scripts/preflight-spec.mjs [dominio] [agrupamento-funcional]` (ou, sem disco, leia o N0 + `modules/INDEX.md` + o N1/N2 pertinentes) e apresente um bloco **"Contexto verificado"**: o que já existe, IDs tomados, próximo NN livre, regras/campos já canônicos a **referenciar** (não reescrever). Não duplique ID/pasta/regra/campo existente.
> 2. **Depois de gravar** — rode `node scripts/validate-doc.mjs <arquivo>` (estrutura) **e** `node scripts/valida-semantica-funcionalidade.mjs <arquivo>` (é mesmo uma funcionalidade? — critérios FD de `engine/DEFINICAO-FUNCIONALIDADE.md`); se algum reprovar, **apresente os desvios, corrija e repita até `✓`**. Nunca conclua com um validador reprovando.
> *(No Claude Code os hooks em `.claude/settings.json` já enforçam isso automaticamente.)*

Você vai me ajudar a atualizar uma especificação de funcionalidade (N3) já existente
do ponto de vista de negócio. Você **não reescreverá** tudo do zero —
apenas aplicará a mudança solicitada sobre o conteúdo atual.

Para evitar que o fluxo seja quebrado, você agirá como uma **Máquina de
Estados**. Toda resposta deve iniciar informando o estado atual:

```
[INICIALIZACAO] → [LOCALIZACAO_FEATURE] → [IDENTIFICACAO_MUDANCA]
                → [AVALIACAO_IMPACTO] → [ALINHAMENTO] → [GERACAO_ATUALIZACAO]
```

Regras da sessão:
- **Localize a funcionalidade antes de editar.** Nunca assuma qual é a funcionalidade alvo:
  pergunte qual é, busque-a no repositório e **confirme com o usuário** o que foi
  encontrado antes de coletar a mudança
- Trabalhe apenas na funcionalidade solicitada
- Verifique se a mudança afeta outras regras, fluxos ou campos — se sim, pergunte
- Mantenha linguagem de negócio — sem mencionar tabelas, endpoints ou tecnologias
- **Mensagens de UI**: toda mensagem exibida num cenário sai do `MESSAGE-DICTIONARY`.
  Genérica → marcador `# ← MESSAGE-DICTIONARY: BASELINE`. Específica → chave
  `<DOMINIO>_<SITUACAO>` + marcador `# ← MESSAGE-DICTIONARY: <CHAVE>` no cenário, e a
  entrada acrescentada ao catálogo na mesma entrega. Mensagem nova não catalogada é
  pendência ⚠️, não texto livre
- Faça uma pergunta de cada vez
- Sinalize suposições com ⚠️

---

## CONTEXTO DO PROJETO

=== MASTER.md ===
[cole aqui o conteúdo do MASTER.md]

=== FIELD-DICTIONARY.md ===
[cole aqui o conteúdo do FIELD-DICTIONARY.md]

=== RULES-DICTIONARY.md ===
[cole aqui o conteúdo do RULES-DICTIONARY.md]

=== N3 EXISTENTE DA FUNCIONALIDADE ===
[**No Claude Code**: deixe em branco — o engine localiza a funcionalidade no passo
LOCALIZACAO_FEATURE a partir do nome/palavra-chave que você informar.
**No fluxo copy-paste**: cole aqui o .md negocial atual da funcionalidade.]

=== AIMM DO TICKET *(opcional — do PROMPT_AIMM)* ===
[cole aqui a AIMM do ticket que motiva esta alteração — `analise-impacto/AIMM-<CHAVE>.md`.
Quando presente, acrescente a chave do ticket à seção `## Origem` do N3, com o link
da AIMM e Tipo "Alteração", e registre-a no changelog.]

---

## PASSO 1 — Inicialização

**[Estado: INICIALIZACAO]**

Confirme o que foi recebido e aguarde:
> "Vamos atualizar uma funcionalidade existente. Posso iniciar localizando a funcionalidade que
> você quer alterar?"

---

## PASSO 2 — Localização da funcionalidade

**[Estado: LOCALIZACAO_FEATURE]**

Nunca assuma qual é a funcionalidade alvo. Identifique-a junto com o usuário antes de
qualquer coleta de mudança.

**1. Pergunte qual funcionalidade** (se ainda não foi informada por nome/ID/palavra-chave):
> "Qual funcionalidade você quer alterar? Pode informar o nome, o ID (ex.: `USR-PRM-01`)
> ou uma palavra-chave do que ela faz."

**2. Busque a funcionalidade no repositório:**
- **No Claude Code (com ferramentas de arquivo):** procure nos N3 em
  `modules/**/[funcionalidade].md` por correspondências no nome do arquivo, na `## Descrição`,
  no ID e nos campos. Não peça para colar o conteúdo — leia direto do disco.
- **No fluxo copy-paste:** use o N3 colado na seção CONTEXTO; se nenhum foi colado,
  peça que cole o N3 da funcionalidade.

**3. Apresente o que foi encontrado e confirme** antes de avançar:
- Se houver **uma** correspondência clara, mostre um cartão de identificação e peça
  confirmação:
  > "Encontrei esta funcionalidade:
  > - **Funcionalidade:** [nome] (`[ID]`)
  > - **Caminho:** `modules/[dom]/[af]/[func].md`
  > - **Descrição:** [1º parágrafo da ## Descrição — a entrega]
  > - **Campos:** [lista curta dos Label PO]
  >
  > É esta que você quer alterar?"
- Se houver **mais de uma** correspondência, liste as candidatas (nome, ID, caminho,
  descrição em uma linha) e peça para o usuário escolher — **uma pergunta**.
- Se **nenhuma** for encontrada, informe e pergunte se a funcionalidade usa outro nome ou se
  ainda não foi especificada (nesse caso, é caso de PROMPT_3A, não de manutenção).

Só transite para `IDENTIFICACAO_MUDANCA` após o usuário confirmar a funcionalidade. A partir
daqui, leia o N3 confirmado como base e trabalhe apenas sobre ele.

---

## PASSO 3 — Identificação da mudança

**[Estado: IDENTIFICACAO_MUDANCA]**

Faça esta pergunta e aguarde:
> "O que você deseja alterar, adicionar ou remover nesta funcionalidade?
> Descreva a necessidade em linguagem de negócio.
> Se a mudança vem de um ticket (ServiceNow, issue, experimento), informe a chave
> (ex.: `STRYxxxxxxx`) para eu registrá-la na seção `## Origem` e no changelog."

---

## PASSO 4 — Avaliação de impacto negocial

**[Estado: AVALIACAO_IMPACTO]**

Com base na resposta, avalie no N3 existente os pontos abaixo.
Para cada ponto com impacto, formule uma pergunta de esclarecimento —
**uma por vez**, aguardando resposta antes da próxima:

- **Campos**: novos campos são necessários? Algum campo sai ou muda? Todo campo
  novo/alterado precisa da coluna **Entidade** preenchida (entidade dona — principal por
  padrão; outra entidade / `externo:` / `derivado ↓` quando for o caso). Se a mudança
  cria um campo **calculado**, atualize a seção `## Derivações` (fórmula + campos-fonte
  com entidade). Entidade citada e ainda inexistente no data-model → `⚠️` + opção `DM`.
- **Regras de negócio**: a mudança altera regras atuais ou insere uma nova? A regra
  nova pega o **próximo `RN-NN` livre**; a alterada mantém o ID; a removida sai com o
  ID, que **não** é reaproveitado (registre no Changelog). N3 cujas regras ainda não têm
  ID: rode antes `node scripts/migra-regras-rn.mjs <N3> --aplicar`.
- **Dicionários**: se a mudança introduz (ou revela) um campo ou regra com
  potencial de reuso, proponha ⚠️ promovê-lo ao FIELD-DICTIONARY / RULES-DICTIONARY
  (com aprovação) em vez de registrá-lo apenas inline. Se a mudança altera um
  campo/regra **já canônico**, sinalize que o dicionário pode precisar de ajuste.
- **Cenários**: quais novos cenários surgem? Quais ficam obsoletos? Toda regra nova ou
  alterada tem ao menos um cenário com a tag `@RN-NN`; a tag da regra removida sai do
  cenário (`node scripts/valida-regras-cenarios.mjs <N3>`).
- **Comportamento de tela**: a UI precisará de mudanças?
- **Lista ou funcionalidade compartilhada**: se a mudança toca um PE que esta funcionalidade
  reutiliza — linha com `↪ [ID](…)` na `## Métricas de tamanho` (`SIZING.md` → *PE
  reutilizado*) —, ela vale para toda tela que o usa. Pergunte se é isso: sendo, a
  alteração vai para o PE onde ele conta — o ticket entra também na `## Origem` e no
  Changelog da funcionalidade `ID`, com a contagem pendente — e as outras funcionalidades que o
  reutilizam entram na AIMM como regressão (`node scripts/generate-impact-draft.mjs`
  as lista). Se a mudança vale só para esta tela, a lista deixa de ser a mesma: esta
  funcionalidade passa a ter um PE próprio.

Exemplo de pergunta:
> "Notei que você quer adicionar 'Data de validade'. Esse campo será obrigatório?"

---

## PASSO 5 — Alinhamento final

**[Estado: ALINHAMENTO]**

Após todas as perguntas respondidas, apresente um resumo das mudanças
alinhadas e confirme:
> "Com base no que discutimos, as mudanças negociais são:
> [lista resumida]. Posso gerar a versão atualizada do N3?"

---

## PASSO 6 — Geração da atualização

**[Estado: GERACAO_ATUALIZACAO]**

Gere a versão atualizada das seções negociais do N3 afetadas,
evidenciando o que mudou. Se a alteração veio de um ticket, adicione a linha
correspondente à seção `## Origem` (Tipo "Alteração", com o link da AIMM do ticket). O bloco
`origem:` do front-matter **não muda**: ele guarda só o ticket que criou a funcionalidade (é a coluna
Origem da esteira no `modules/INDEX.md`), e a funcionalidade que nasceu sem ticket continua sem ele —
o histórico de tickets é a `## Origem`. Adicione ou atualize a
seção de changelog. **Insira a nova linha no topo da tabela** (logo abaixo do
cabeçalho), mantendo o changelog em **ordem decrescente por data** — a entrada
mais recente sempre primeiro:

```markdown
## Changelog

| Data | Autor | Tipo | Descrição |
|---|---|---|---|
| 2026-10-20 | Docqui Caixa | Terminologia | Adoção de AIMM; histórico anterior preservado. |
| [data] | [nome] | Novo campo / Regra alterada / Correção | [o que mudou e por quê] |
| [data anterior] | … | … | … |
```

**Marque a contagem como pendente** (bloco `contagem` do front-matter, independente dos
gates): toda alteração de spec que gerou entrada no changelog exige nova revisão de PF —
defina `contagem.pendente: true` (deixe `revisada_em`/`revisada_ate` como estavam, para
manter o histórico da última revisão). Isso vale **mesmo que você ache que a contagem não
muda** — quem decide é o agente de contagem, fora do Docqui. Propague o marcador: na tabela de
rastreabilidade do `modules/INDEX.md`, coluna **Contagem** = 📋 (pendente) para esta
funcionalidade. Não toque nos gates nem em `estado`.

Apresente apenas as seções alteradas (não repita o que não mudou).
Se houver promoções aprovadas a dicionários, liste-as como ação pendente
(⚠️ aplicar no FIELD-DICTIONARY / RULES-DICTIONARY antes de implementar).
Pergunte:
> "A atualização negocial do N3 de [funcionalidade] está correta?
> Ajusta algo ou avanço para o detalhamento técnico da alteração?"

---

## PASSO 7 — Fechar o elo recíproco (se a alteração veio de um ticket)

**[Estado: GERACAO_ATUALIZACAO]**

> Execute **somente se** um ticket motivou esta alteração (uma linha Tipo
> "Alteração" foi adicionada à `## Origem` no PASSO 6). O elo ticket ↔ funcionalidade
> é **M:N** e precisa ficar registrado dos dois lados mais o índice — senão o
> caminho inverso ("quais funcionalidades este ticket alterou?") fica incompleto.

Atualize os outros dois lados, espelhando a linha que entrou na `## Origem`:

**1. `analise-impacto/AIM-<CHAVE>.md`** — na seção `## Funcionalidades` da AIM do ticket,
adicione a linha desta funcionalidade se ainda não constar (Operação "Alteração"), e
registre uma linha no topo do Changelog da AIM ("Funcionalidade alterada") — mantendo o
Changelog em ordem decrescente por data. A linha da funcionalidade no changeset da AIM
(`## Artefatos impactados`) é a desta passada: a execução segue o escopo que o PO
avalizou.

**2. `modules/INDEX.md`** — garanta que existe a linha do par ticket↔funcionalidade na
tabela `## Rastreabilidade: ticket → spec → código` (adicione se faltar;
atualize o Status se ele mudou com esta alteração).

**No Claude Code (com ferramentas de arquivo):** edite os arquivos direto no disco.
**No fluxo copy-paste:** entregue os blocos como patch para o usuário aplicar.

> 💡 Para auditar todos os elos de uma vez e detectar links unilaterais, use o
> **PROMPT_AUDIT_TRACE_LINKS** (opção **AT** no menu).
