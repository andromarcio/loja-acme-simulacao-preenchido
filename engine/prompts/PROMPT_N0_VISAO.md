# PROMPT N0 — Visão de Produto
## Visão estratégica do produto · Parte negocial

> **Modelo de estrutura**: `engine/templates/global/N0_PRODUCT_VISION.md` *(referência humana — o prompt já embute o esqueleto)*
> **Quem participa**: PO / Liderança de Produto
> **Insumo necessário**: descrição do produto em linguagem natural (problema, público, valor). A **sigla e o nome** do produto vêm do `MASTER.md` → *Identificação do sistema*, a fonte única da identidade: o N0 os **lê** de lá, não os redefine. A base de conhecimento do `PROMPT_0` é opcional e ajuda.
> **Entrega**: `global/N0_PRODUCT_VISION.md` — o documento de referência mais alto do sistema: propósito, proposta de valor, personas, objetivos, KPIs, escopo, domínios previstos e tom de voz. Sem telas, campos ou endpoints.
>
> **Próximo passo**: após aprovação, usar PROMPT_1A para derivar os domínios (N1) a partir desta visão.

---

## INSTRUÇÕES PARA O CLAUDE

> **Protocolo obrigatório desta sessão (F1 preflight · F2 autovalidação):**
> 1. **Antes de gerar** — rode `node scripts/preflight-spec.mjs [dominio] [agrupamento-funcional]` (ou, sem disco, leia o N0 + `modules/INDEX.md` + o N1/N2 pertinentes) e apresente um bloco **"Contexto verificado"**: o que já existe, IDs tomados, próximo NN livre, regras/campos já canônicos a **referenciar** (não reescrever). Não duplique ID/pasta/regra/campo existente.
> 2. **Depois de gravar** — rode `node scripts/validate-doc.mjs <arquivo>`; se reprovar, **apresente os desvios, corrija e repita até `✓`**. Nunca conclua com o validador reprovando.
> *(No Claude Code os hooks em `.claude/settings.json` já enforçam isso automaticamente.)*

Você vai me ajudar a escrever a **Visão de Produto (N0)** — o documento de referência mais alto do sistema, que define **por que** o produto existe, para **quem** e **que valor** entrega. É um documento **integralmente negocial**: foque na dor real do usuário ou do negócio, não na solução técnica. Não mencione tabelas, campos de banco, endpoints, telas ou tecnologias.

O N0 dá a **direção**; ele **não detalha funcionalidades**. Os níveis N1–N3 serão confrontados contra ele depois. Mantenha-o enxuto e estratégico.

Regras da sessão:
- Faça uma pergunta de cada vez e aguarde minha resposta antes de prosseguir.
- Sinalize suposições com ⚠️ e liste-as ao final do artefato.
- Não invente objetivos, personas ou métricas: lacuna = ⚠️ + pergunta de esclarecimento.
- Só gere o artefato após coletar todas as respostas e receber minha aprovação.

**Controle de fluxo — Máquina de Estados.** Toda resposta inicia com `[Estado: NOME]`. Flua apenas na ordem abaixo, sem pular estados e sem fazer mais de uma pergunta por estado:

```
[INICIALIZACAO] → [COLETA_PROPOSITO] → [COLETA_PERSONAS] → [COLETA_OBJETIVOS]
                → [COLETA_ESCOPO] → [COLETA_DOMINIOS] → [COLETA_PRINCIPIOS]
                → [GERACAO_ARTEFATO]
```

---

## CONTEXTO DO PROJETO

=== MASTER.md (se disponível) ===
[cole aqui o conteúdo do MASTER.md — sigla, nome e descrição do produto. No Claude Code é lido do disco.]

=== Base de conhecimento (se houver — saída do PROMPT_0) ===
[cole aqui `modules/_base-conhecimento/[assunto].md`, ou remova esta seção]

---

## PASSO 1 — Inicialização

**[Estado: INICIALIZACAO]**

Confirme o contexto e peça autorização (uma pergunta):

> "Vou conduzir a especificação da **Visão de Produto (N0)** de **[nome do produto — do MASTER, se disponível]**. Contexto carregado: [MASTER/base lidos ou 'nenhum']. Farei uma pergunta por vez sobre propósito, público, objetivos, escopo, domínios e princípios. Posso começar?"

Sigla e nome do produto: **leia-os do MASTER** e use-os no título e no subtítulo do N0 — não os pergunte de novo. Se o MASTER ainda estiver em placeholder (`[sigla do sistema…]`), pergunte-os aqui e grave-os **primeiro no `global/MASTER.md`**, depois no N0; o `validate-doc` reprova o N0 cuja sigla diverge da do MASTER.

Aguarde a confirmação antes de transitar.

---

## PASSO 2 — Propósito e proposta de valor

**[Estado: COLETA_PROPOSITO]**

> "Em uma ou duas frases: **que problema este produto resolve e por que ele deve existir?** Foque na dor real do usuário ou do negócio — não na solução. E qual é o **benefício central** que justifica adotá-lo em vez de uma alternativa ou do status quo?"

Com a resposta, redija o **Propósito** (um parágrafo, foco na dor) e a **Proposta de valor** (uma a três frases, foco no benefício). Não grave ainda — siga para o próximo estado.

---

## PASSO 3 — Público-alvo e personas

**[Estado: COLETA_PERSONAS]**

> "Para **quem** é este produto? Liste as principais personas. Para cada uma: quem é (papel/contexto), a principal dor que enfrenta hoje e o que espera obter do produto."

Monte a tabela de personas (Persona | Quem é | Principal dor | O que espera do produto). Se uma persona for inferida e não confirmada, marque-a com ⚠️.

---

## PASSO 4 — Objetivos e métricas de sucesso

**[Estado: COLETA_OBJETIVOS]**

> "Quais são os **objetivos estratégicos** do produto — o que ele busca alcançar, em linguagem de negócio? E, para cada um (ou para o conjunto), **como saberemos que está dando certo**: que indicador (KPI) mede isso e qual a meta?"

Monte os **Objetivos do produto** (lista numerada) e a tabela de **Métricas de sucesso (KPIs)** (KPI | O que mede | Meta). Se não houver meta numérica definida, registre ⚠️ e deixe o alvo como "a definir".

---

## PASSO 5 — Escopo

**[Estado: COLETA_ESCOPO]**

> "Em alto nível: o que **está dentro** do escopo deste produto (grandes capacidades/áreas que ele cobre)? E o que está **deliberadamente fora** — os não-objetivos que ajudam a conter o escopo?"

Monte as listas **Está dentro** e **Está fora (não-objetivos)**.

---

## PASSO 6 — Domínios previstos (N1)

**[Estado: COLETA_DOMINIOS]**

> "Quais são as **grandes áreas de negócio** que você imagina que comporão o sistema? Para cada uma: um nome e uma frase do que ela cuida. Esta é uma visão **preliminar** — cada área vira um domínio (N1) e será detalhada depois."

Para cada área, proponha uma **sigla de 3 letras maiúsculas** como ID do domínio (mesmo padrão do PROMPT_1A) e confirme a lista comigo antes de seguir. Monte a tabela **Domínios previstos (N1)** (Domínio | SIGLA | O que cuida).

> Esta lista é **preliminar**: a verdade dos domínios nasce no PROMPT_1A, que **reaproveita** as siglas propostas aqui — não gere outras lá. Mantenha-a alinhada com `modules/INDEX.md`. Não detalhe Agrupamentos Funcionais nem funcionalidades no N0.

---

## PASSO 7 — Tom de voz, princípios, restrições

**[Estado: COLETA_PRINCIPIOS]**

> "Por fim: que **tom de voz** o produto deve ter (ex.: direto e profissional, acolhedor, técnico)? Quais **princípios de experiência** guiam as decisões (ex.: 'menos cliques', 'transparência sobre o que o sistema fez', 'nunca perder dados do usuário')? E há alguma **restrição** (de negócio, regulatória, de mercado) ou **premissa** assumida que, se mudar, altera a visão?"

Monte **Tom de voz e princípios de experiência** e **Restrições e premissas** (premissas frágeis marcadas com ⚠️).

---

## PASSO 8 — Geração do artefato

**[Estado: GERACAO_ARTEFATO]**

Antes de escrever o conteúdo, leia a versão vigente em `VERSION` e componha o carimbo invisível na **primeira linha**. Gere o arquivo:

📄 `global/N0_PRODUCT_VISION.md`

**Gere exatamente esta estrutura — sem adicionar seções, subtítulos ou elementos fora dos listados abaixo:**

```
<!-- docqui: <versão> | prompt: PROMPT_N0 | atualizado: <YYYY-MM-DD> -->
# Visão de Produto: [Nome do Produto]
> **Nível 0** - Visão de Produto - `[SIGLA]`

> O documento de referência mais alto do sistema: define **por que** o produto
> existe, para **quem** e **que valor** entrega. Os níveis N1–N3 são confrontados
> contra ele para garantir que não extrapolam o escopo nem contradizem os objetivos.

## Propósito
[um parágrafo em uma linha contínua: que problema o produto resolve e por que existe — foco na dor, não na solução]

---

## Proposta de valor
[uma a três frases: o benefício central que justifica adotar o produto]

---

## Público-alvo e personas

| Persona | Quem é | Principal dor | O que espera do produto |
|---|---|---|---|
| [Nome da persona] | [papel / contexto] | [problema que enfrenta hoje] | [resultado desejado] |

---

## Objetivos do produto

> O **quê** o produto busca alcançar — em linguagem de negócio, sem soluções técnicas.

1. [Objetivo estratégico 1]
2. [Objetivo estratégico 2]

---

## Métricas de sucesso (KPIs)

> Como saberemos que o produto está cumprindo seus objetivos.

| KPI | O que mede | Meta |
|---|---|---|
| [indicador] | [o que ele indica sobre o sucesso] | [alvo / faixa] |

---

## Escopo

### Está dentro

- [grande capacidade/área que o produto cobre]

### Está fora (não-objetivos)

- [o que o produto deliberadamente NÃO faz — para conter o escopo]

---

## Domínios previstos (N1)

> Visão preliminar das grandes áreas que comporão o sistema. Cada uma será
> detalhada em seu próprio N1. Mantenha esta lista alinhada com `modules/INDEX.md`.

| Domínio | SIGLA | O que cuida |
|---|---|---|
| [Nome] | [ABC] | [uma frase] |

---

## Tom de voz e princípios de experiência

- **Tom**: [ex.: direto e profissional / acolhedor / técnico]
- **Princípios**: [ex.: "menos cliques", "transparência sobre o que o sistema fez", "nunca perder dados do usuário"]

---

## Restrições e premissas

- [restrição de negócio, regulatória ou de mercado relevante]
- [premissa assumida que, se mudar, altera a visão] ⚠️

---

## Changelog

<!-- Ordem decrescente por data: a entrada mais recente fica sempre no topo, logo abaixo do cabeçalho. -->

| Data | Autor | Tipo | Descrição |
|---|---|---|---|
| [data atual] | [PO / autor] | N0 criado | Visão de produto inicial — gerada pelo PROMPT_N0 |

---

## Instrução para a LLM

Ao gerar ou alterar qualquer N1/N2/N3:
1. Confronte o artefato com este N0 — escopo, objetivos e público-alvo.
2. Sinalize com ⚠️ qualquer divergência (funcionalidade que extrapola a visão,
   contradição de objetivo, persona não prevista).
3. O N0 é documento de visão — **não o reestruture** para acomodar detalhes de
   implementação. Proponha ajustes e peça aprovação antes de alterá-lo.
```

> **Regra do Propósito** — Escreva em **linguagem de negócio pura**, cada parágrafo
> em **uma única linha contínua** (sem quebras internas). O Propósito começa pela
> **dor** ("Hoje, [usuário] enfrenta…" / "[Problema] custa…") e só então aponta o que
> o produto faz a respeito. A Proposta de valor sintetiza o **ganho** — não repita o
> Propósito; diga o que o usuário leva embora ao adotar o produto.

> **Regra dos Domínios previstos** — A tabela é **preliminar** e existe só para dar
> nome às grandes áreas. Proponha siglas de 3 letras maiúsculas; o PROMPT_1A as
> confirma e reaproveita. Não detalhe Agrupamentos Funcionais nem funcionalidades aqui.

Após apresentar, pergunte:
> "A Visão de Produto (N0) está correta? Ajusta algo ou aprovo para seguir especificando os domínios?"

---

## PASSO 9 — Próximo passo

Após aprovação, informe:
> "Visão de Produto (N0) concluída e gravada em `global/N0_PRODUCT_VISION.md`. O próximo passo é especificar os domínios a partir das grandes áreas — cada um já é confrontado cada domínio contra este N0 e reaproveita as siglas propostas aqui."

---

## Checklist de conformidade do N0

Antes de apresentar, confira (todos os itens são obrigatórios):

- [ ] Carimbo de versão na **primeira linha** (`<!-- docqui: … | prompt: PROMPT_N0 | atualizado: YYYY-MM-DD -->`)
- [ ] Título exatamente `# Visão de Produto: [Nome]`
- [ ] Subtítulo em blockquote: `> **Nível 0** - Visão de Produto - [SIGLA]` (SIGLA do produto em crase, **a mesma** do `global/MASTER.md` → Sigla)
- [ ] **Propósito** (foco na dor) e **Proposta de valor** (foco no benefício), cada parágrafo em uma linha contínua
- [ ] **Público-alvo e personas**: tabela (Persona | Quem é | Principal dor | O que espera do produto)
- [ ] **Objetivos do produto** (lista numerada) e **Métricas de sucesso (KPIs)** (tabela KPI | O que mede | Meta)
- [ ] **Escopo** com as subseções `### Está dentro` e `### Está fora (não-objetivos)`
- [ ] **Domínios previstos (N1)**: tabela (Domínio | SIGLA | O que cuida), siglas de 3 letras maiúsculas
- [ ] **Tom de voz e princípios de experiência** e **Restrições e premissas**
- [ ] **Changelog** + **Instrução para a LLM**
- [ ] **Linguagem de negócio pura** — sem telas, campos, endpoints ou tecnologias
- [ ] Suposições sinalizadas com ⚠️ e listadas

> **Gate determinístico** — após gravar o N0, rode `node scripts/validate-doc.mjs <arquivo>`.
> Ele detecta o nível pelo subtítulo `**Nível 0**` e exige as seções obrigatórias do N0
> (Propósito, Proposta de valor, Público-alvo e personas, Objetivos do produto, Métricas
> de sucesso (KPIs), Escopo, Domínios previstos (N1), Tom de voz e princípios de
> experiência, Restrições e premissas, Changelog). O artefato só é conforme quando o
> validador retorna `✓` (sai com código 0).
