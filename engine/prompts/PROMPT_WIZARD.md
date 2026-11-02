# PROMPT WIZARD — Agrupamento Funcional de processo guiado multi-etapas (N2 + N3 negocial)
## Atalho de especificação para fluxos do tipo assistente (wizard)

> **Modelo de estrutura (N2)**: `engine/templates/modules/_template-dominio/_template-agrupamento-funcional/README.md`
> **Modelo de estrutura (N3)**: `engine/templates/modules/_template-dominio/_template-agrupamento-funcional/_template-funcionalidade.md`
> *(referência humana — o prompt já embute os esqueletos)*
> **Quem participa**: PO + dev (ou só PO)
> **Insumo necessário**: descrição do processo + a lista ordenada de etapas e o que cada
> etapa coleta. N1 do domínio é opcional.
> **Entrega**: o `README.md` (N2) do Agrupamento Funcional **e** o N3 negocial da funcionalidade principal
> multi-etapas — mais os N3 auxiliares que o usuário optar (retomar rascunho, acompanhar
> status, cancelar).
>
> **Pré-requisito**: nenhum obrigatório. Se o N1 do domínio existir, informe-o para
> herdar regras transversais e manter consistência de Label PO.
> **Próximo passo**: após aprovação, usar **3B** para complementar cada N3 com a parte técnica.

---

## QUANDO USAR — e como o Wizard difere do CRUD

Use este atalho quando a funcionalidade é um **processo guiado em etapas sequenciais**
(assistente / wizard): o usuário avança por telas, uma valida antes da próxima, pode
voltar, e ao final há uma **revisão** e uma **confirmação** que produz um **resultado
observável** (ex.: *Abrir conta*, *Contratar seguro*, *Onboarding de cliente*,
*Solicitar crédito*).

Diferença fundamental de granularidade em relação ao CRUD:

| | CRUD | Wizard |
|---|---|---|
| Unidade | 1 entidade → **5 funcionalidades** (pesquisar/cadastrar/editar/excluir/visualizar) | 1 processo → **1 funcionalidade principal** (uma ação com começo, meio, fim e resultado) que percorre N telas |
| As "etapas" | — | **não são funcionalidades** — são **telas** da mesma funcionalidade, descritas em `## Comportamento de tela` |
| Funcionalidades auxiliares | — | opcionais: *retomar rascunho*, *acompanhar status*, *cancelar solicitação* |

> **Regra de granularidade** (skill de requisitos): uma funcionalidade é *um verbo + uma
> entidade* — "Abrir conta" é **uma** funcionalidade mesmo cobrindo 5 telas. As etapas do
> wizard são a superfície da funcionalidade, não funcionalidades distintas. **Não crie um N3 por etapa.**

---

## INSTRUÇÕES PARA O CLAUDE

> **Protocolo obrigatório desta sessão (F1 preflight · F2 autovalidação):**
> 1. **Antes de gerar** — rode `node scripts/preflight-spec.mjs [dominio] [agrupamento-funcional]` (ou, sem disco, leia o N0 + `modules/INDEX.md` + o N1/N2 pertinentes) e apresente um bloco **"Contexto verificado"**: o que já existe, IDs tomados, próximo NN livre, regras/campos já canônicos a **referenciar** (não reescrever). Não duplique ID/pasta/regra/campo existente.
> 2. **Depois de gravar** — rode `node scripts/validate-doc.mjs <arquivo>` (estrutura) **e** `node scripts/valida-semantica-funcionalidade.mjs <arquivo>` (é mesmo uma funcionalidade? — critérios FD de `engine/DEFINICAO-FUNCIONALIDADE.md`); se algum reprovar, **apresente os desvios, corrija e repita até `✓`**. Nunca conclua com um validador reprovando.
> *(No Claude Code os hooks em `.claude/settings.json` já enforçam isso automaticamente.)*

Você vai especificar, numa única sessão, um Agrupamento Funcional do tipo **processo guiado
(wizard)** seguindo o padrão do framework. A partir de **uma descrição do processo e
da lista ordenada de etapas**, produza o N2 do Agrupamento Funcional e o N3 negocial da
**funcionalidade principal multi-etapas** (mais os N3 auxiliares que o usuário escolher).

Princípio do atalho: o usuário descreve o processo e suas etapas **uma vez**. A
**funcionalidade principal** é a fonte canônica; *retomar*, *acompanhar status* e *cancelar*,
quando existirem, são **derivadas dela**.

Regras da sessão:
- Use exclusivamente linguagem de negócio — sem endpoints, FKs, libs ou arquivos.
- A tabela de campos usa as colunas padrão do N3: Label PO, **Entidade**, Preenchimento,
  Edição, Tipo, Obrigatório e Validação em linguagem natural. A coluna **Entidade**
  nomeia (por referência) a entidade dona do campo — nunca Label Dev ou campo banco.
  Como o assistente percorre várias etapas, campos de etapas diferentes podem
  pertencer a **entidades diferentes**: nomeie a entidade correta de cada um.
- **A etapa em que cada campo aparece** entra na coluna **Validação** do N3 (ex.:
  "Etapa 2 — Endereço"). Não acrescente colunas **avulsas** nem seções à estrutura do N3.
- Campos canônicos (CPF, CEP, e-mail, telefone, CNPJ, ISIN, data, valor monetário,
  percentual, URL, nome de pessoa, razão social, etc.): aplicar o FIELD-DICTIONARY
  automaticamente, sem perguntar suas regras de validação.
- Regras canônicas: aplicar o RULES-DICTIONARY automaticamente; perguntar apenas os
  parâmetros em aberto.
- **Regras de negócio atômicas — uma regra, uma invariante.** Ao escrever a seção
  `## Regras de negócio` de cada N3, quebre regras compostas: condições independentes
  ligadas por "e" / "ou" / "além disso" viram **itens distintos**, cada um com **uma
  única restrição verificável**. A reação do sistema ("não avança", "exibe mensagem")
  não é regra — vai para os **Cenários**. Cada item começa por `**RN-NN** —` (sequencial
  na funcionalidade, nunca reaproveitado), e ao menos um cenário o verifica com a tag `@RN-NN`
  na linha acima do `Scenario:`.
- **Quem pode vive só no N2.** Colete perfis e permissões por funcionalidade uma vez e
  registre-os apenas na matriz do `README.md` do Agrupamento Funcional. Os N3 não trazem regra de
  permissão nem lista de perfis: no grupo **Restrições de acesso** eles descrevem só a
  reação do sistema a quem não tem acesso (mensagem do catálogo).
- Um artefato de cada vez: gere, aguarde aprovação, só então avance.
- Sinalize suposições com ⚠️.

> **Escopo deste prompt: negocial.** Não gere seções técnicas (API, eventos, AuditLog,
> mapeamento de campos) nem o `data-models/[dominio].md` — isso é o **3B**.

---

## CONTEXTO DO PROJETO

=== MASTER.md ===
[cole aqui o conteúdo do MASTER.md]

=== DESIGN-SYSTEM.md ===
[cole aqui o conteúdo do DESIGN-SYSTEM.md]

=== FIELD-DICTIONARY.md ===
[cole aqui o conteúdo do FIELD-DICTIONARY.md]

=== RULES-DICTIONARY.md ===
[cole aqui o conteúdo do RULES-DICTIONARY.md]

=== ROUTING.md ===
[cole aqui o conteúdo do global/ROUTING.md — convenção de rotas de tela]

=== N1 DO DOMÍNIO *(opcional — omita se não existir ainda)* ===
[cole aqui o README.md do domínio]

=== IDENTIFICAÇÃO MANUAL *(preencher quando o N1 não for fornecido)* ===
Domínio: [nome do domínio]
Sigla do domínio: [3 letras maiúsculas — ex.: CAD]

---

## Controle de fluxo — Máquina de Estados

```
[INICIALIZACAO] → [COLETA_PROCESSO] → [COLETA_ETAPAS] → [COLETA_POLITICA_WIZARD]
   → [GERACAO_N2] → [GERACAO_N3_PRINCIPAL] → [DERIVACAO_N3_AUXILIARES] → [REVISAO_CONSISTENCIA]
```

Toda resposta inicia com `[Estado: NOME]`. Não pule estados. Aguarde aprovação explícita
antes de transitar de um estado de geração para o próximo.

---

## PASSO 1 — `[COLETA_PROCESSO]`

Confirme o domínio e a sigla (do N1, se fornecido; senão da identificação manual).
**Se o N1 já definir este Agrupamento Funcional, reutilize o ID `[SIGLA]-[SAF]` dele**; caso
contrário, derive uma sigla de 3 letras para o Agrupamento Funcional, formando o ID
`[SIGLA]-[SAF]` (e proponha incluí-lo no N1). Então
pergunte, em um bloco:

> 1. Qual o nome do processo guiado (ex.: Abertura de Conta, Contratação de Seguro)?
> 2. Em 2-3 frases, o que este processo faz? E o que ele explicitamente **não** faz
>    (onde termina o escopo)?
> 3. Qual é o **resultado observável** ao final (ex.: conta aberta, proposta enviada,
>    solicitação protocolada)? Que registro/identificador único representa esse
>    resultado (ex.: número da solicitação)?

---

## PASSO 2 — `[COLETA_ETAPAS]`

Peça a sequência de etapas — esta é a coleta central do atalho:

> 4. Liste as **etapas na ordem** em que o usuário as percorre. Para cada etapa: um
>    **nome curto** (ex.: "Dados pessoais", "Endereço", "Documentos") e **quais
>    informações** o usuário preenche nela — nome em português, tipo (texto, número,
>    data, lista de opções, sim/não, arquivo, ou seleção de outro cadastro) e se é
>    **obrigatória**.
>
> 5. Algum campo é preenchido **automaticamente** pelo sistema? Qual e quando?
>
> 6. Há **revisão final** (uma etapa de resumo para conferir tudo antes de confirmar)?
>    *(padrão: sim)*

Ao receber as etapas e campos:
- Identifique os campos **canônicos** e aplique o FIELD-DICTIONARY automaticamente;
  pergunte apenas o que o dicionário deixa em aberto (obrigatoriedade, unicidade).
- Para campos escolhidos a partir de **outro cadastro**, trate-os como **campo de
  seleção** (`seleção → [Entidade]`) — siga as regras de "Campos de seleção" do
  PROMPT_3A_N3_negocio.md (PASSO 1.5).
- Guarde, para cada campo, **a qual etapa pertence** — isso irá para a coluna Validação
  do N3 e para a seção `## Comportamento de tela`.

---

## PASSO 3 — `[COLETA_POLITICA_WIZARD]`

Faça apenas as perguntas que as etapas não responderam e que valem para o processo inteiro:

> 7. **Rascunho**: o usuário pode **salvar e retomar** depois um processo não concluído?
>    Se sim, por quanto tempo o rascunho fica disponível?
> 8. **Navegação**: o usuário pode **voltar** a etapas anteriores e alterar dados
>    livremente, ou o avanço é só para frente?
> 9. **Validação por etapa**: a etapa valida os dados **antes** de permitir avançar?
>    *(padrão: sim)*
> 10. **Cancelamento/abandono**: o que acontece se o usuário abandonar o processo no
>     meio (descarta? mantém rascunho? exige confirmação)?
> 11. **Acompanhamento**: depois de concluído, existe uma tela para **acompanhar o
>     status** da solicitação? *(vira funcionalidade auxiliar)*
> 12. **Permissões** (fonte única do projeto): quais **perfis** existem e, para cada
>     funcionalidade (iniciar o processo, retomar rascunho, acompanhar status, cancelar),
>     quais perfis podem executá-la? Descreva em linguagem de negócio.
> 13. Este processo precisa ficar registrado no **histórico de auditoria**? (sim/não —
>     servirá para o 3B preencher a seção AuditLog; não vira regra de negócio)

A partir das respostas 7, 10 e 11, defina quais **funcionalidades auxiliares** existem:
*Retomar rascunho* (se 7 = sim), *Acompanhar status* (se 11 = sim), *Cancelar
solicitação* (se 10 exigir uma ação dedicada). Liste-as ao usuário e confirme antes do
PASSO 4.

---

## PASSO 4 — `[GERACAO_N2]`

Monte a tabela de Funcionalidades pela jornada confirmada, começando pela principal e seguindo com as auxiliares. A sequência abaixo vale apenas para a primeira atribuição; omita auxiliares não confirmadas antes de numerar. Preserve todo ID existente no N2/N3, inclusive ao inserir uma auxiliar no meio da jornada; novas funcionalidades seguem o maior reservado, sem reutilizar números. Rode `node scripts/ids-n3.mjs modules/[dominio]/[agrupamento-funcional]/README.md` em modo seco e, conferido, com `--write`, antes de gerar N3s. Preserve o registro `docqui:n3-ids` do N2 — ver `engine/N3-IDS.md`. As etapas da principal não recebem IDs de funcionalidade próprios.

| Ordem | Funcionalidade | Arquivo |
|---|---|---|
| 01 | [Verbo] [processo] *(principal — multi-etapas)* | `f-[verbo]-[entidade].md` |
| 02 | Retomar [processo] *(se houver rascunho — resposta 7)* | `f-retomar-[entidade].md` |
| 03 | Acompanhar [processo] *(se houver acompanhamento — resposta 11)* | `f-acompanhar-[entidade].md` |
| 04 | Cancelar [processo] *(se houver cancelamento — resposta 10)* | `f-cancelar-[entidade].md` |

Gere o N2 — **exatamente esta estrutura**, idêntica à do PROMPT_2A:

📄 `modules/[dominio]/[agrupamento-funcional]/README.md`

> **Nome da pasta do Agrupamento Funcional (obrigatório):** `[agrupamento-funcional]` é o **slug em kebab-case do nome do Agrupamento Funcional, SEM prefixo** — ex.: *Gestão de Fábricas* → `gestao-fabricas`; *Sistemas* → `sistemas`. **A pasta não leva prefixo** (nada de `g-`); só os **arquivos de funcionalidade** levam `f-`. O nome é também o segmento de rota (`/[dominio]/[agrupamento-funcional]`).

```
# Agrupamento Funcional: [Nome do Agrupamento Funcional]
> **Nível 2** - Domínio: [Nome do Domínio] - `[SIGLA]-[SAF]`

## Descrição
[2-3 frases sobre o que o processo faz]

**Não faz**: [o que está fora do escopo]

---

## Funcionalidades

| Funcionalidade | Descrição |
|---|---|
| [**[Verbo] [processo]**](f-[verbo]-[entidade].md) <small>[SIGLA]-[SAF]-01</small> | [uma linha — funcionalidade principal multi-etapas] |
| [**Retomar [processo]**](f-retomar-[entidade].md) <small>[SIGLA]-[SAF]-02</small> | [uma linha — se houver] |
| [**Acompanhar [processo]**](f-acompanhar-[entidade].md) <small>[SIGLA]-[SAF]-03</small> | [uma linha — se houver] |
| [**Cancelar [processo]**](f-cancelar-[entidade].md) <small>[SIGLA]-[SAF]-04</small> | [uma linha — se houver] |

---

## Fluxo Principal

[esqueleto canônico do tipo WIZARD — copie o diagrama da "Regra do Fluxo principal
(Wizard)" logo abaixo deste bloco; instancie um nó de etapa por etapa real coletada no
PASSO 2 e troque {Processo}/{Resultado}. Não redesenhe a estrutura nem acompanhe de
lista numerada]

---

## Dependências entre funcionalidades

[A funcionalidade principal é o ponto de entrada e cria o processo; Retomar exige um rascunho
salvo pela principal; Acompanhar e Cancelar exigem uma solicitação já iniciada pela
principal]

---

## Telas

| Tela | Rota sugerida | Funcionalidades atendidas | Descrição |
|---|---|---|---|
| [Processo] — Etapas 1..N | `/[dominio]/[agrupamento-funcional]/novo` | **[Verbo] [processo]** <small>[SIGLA]-[SAF]-01</small> | assistente multi-etapas (uma rota, etapas internas) |
| Acompanhar [Processo] | `/[dominio]/[agrupamento-funcional]/:id` | **Acompanhar [processo]** <small>[SIGLA]-[SAF]-03</small> | status da solicitação (somente leitura) |

> Rotas determinísticas conforme `global/ROUTING.md`: `[agrupamento-funcional]` é o slug (kebab) da
> pasta do Agrupamento Funcional. O assistente vive em **uma** rota; as etapas são estados internos
> da tela, não rotas distintas.

---

## Permissões por perfil

> **Fonte única de permissões** deste Agrupamento Funcional.

| Perfil | [Verbo] | Retomar | Acompanhar | Cancelar |
|---|---|---|---|---|
| [perfil 1] | ✓ | ✓ | ✓ | ✓ |
| [perfil 2] | ✓ | — | ✓ | — |
| [perfil 3] | — | — | ✓ | — |

---

## Changelog

<!-- Ordem decrescente por data: a entrada mais recente fica sempre no topo, logo abaixo do cabeçalho. -->

| Data | Autor | Tipo | Descrição |
|---|---|---|---|
| [data atual] | [Claude / autor] | N2 criado | Gerado pelo PROMPT WIZARD |

---

*Links: [N1 [Nome do Domínio]](../README.md) · [INDEX geral](../../INDEX.md)*
```

> **Regra da Descrição** — Escreva 2–3 frases em **linguagem de negócio pura**, cada
> parágrafo em **uma única linha contínua** (sem quebras internas). Comece pela
> **capacidade que o conjunto entrega ao usuário** — como o Agrupamento Funcional é um processo
> guiado, prefira um verbo de condução. Em ordem de preferência: **1) "Conduz o [perfil],
> passo a passo, …"**; **2) "Reúne as etapas de…"**; **3) "Permite ao [perfil] …"**.
> **Não use** verbos de domínio (*Responde por, Concentra*) — confundem o nível. Ordene as
> frases assim: (1ª) o que o processo conduz e em que etapas · (2ª) o que isso permite ao
> perfil (iniciar, retomar, acompanhar, cancelar). A linha `**Não faz**:` delimita o
> escopo negativo.
> Exemplo (Agrupamento Funcional **Abertura de Conta** `CTA-ABR`):
> ```
> ## Descrição
> Conduz o cliente, passo a passo, pela abertura de uma nova conta, reunindo as etapas de identificação, envio de documentos e confirmação. Permite ao cliente iniciar a solicitação, salvá-la como rascunho, retomá-la depois e acompanhar seu andamento até a aprovação.
>
> **Não faz**: análise de crédito nem movimentação financeira da conta já aberta.
> ```

> **Regra do Fluxo principal (Wizard)** — O `## Fluxo Principal` do wizard é um
> **esqueleto canônico fixo**: copie o diagrama abaixo, **instancie um nó
> `["Etapa k — {nome}"]` por etapa real** (mantendo, para cada uma, o portão de
> validação e a aresta de *voltar*) e troque `{Processo}`/`{Resultado}`. **Não**
> redesenhe a estrutura (entrada → etapas com validação e voltar → revisão →
> confirmação → resultado) — é isso que torna o fluxo determinístico e idêntico entre
> wizards, independente da LLM. O diagrama é a única representação do fluxo (sem lista
> numerada). Vale a syntax da "Regra do Fluxo principal" do PROMPT_2A: nós entre aspas
> duplas; rótulos de seta sem aspas e sem `/`, `(` ou `)` (use "e"/"ou" no lugar da barra).
>
> **Exceção à regra geral de N2 ("sem caminho de volta"):** diferente dos demais
> fluxos principais de N2, o wizard **mantém de propósito** as arestas de *voltar* e
> o loop de validação por etapa (ex.: `V1 -->|Não| E1`, `V2 -->|Voltar| E1`,
> `C -->|Voltar| EN`) — a navegação "voltar" entre etapas é a característica que
> define o tipo wizard. Este é o **único** N2 em que o retorno a etapas anteriores
> faz parte do fluxo principal.
>
> ```mermaid
> flowchart TD
>     A(["Usuário inicia {Processo}"]) --> E1["Etapa 1 — {Etapa 1}"]
>     E1 --> V1{"Dados da etapa válidos?"}
>     V1 -->|Não| E1
>     V1 -->|Sim| E2["Etapa 2 — {Etapa 2}"]
>     E2 --> V2{"Dados da etapa válidos?"}
>     V2 -->|Não| E2
>     V2 -->|Voltar| E1
>     V2 -->|Sim| EN["Etapa N — {Etapa N}"]
>     EN --> VN{"Dados da etapa válidos?"}
>     VN -->|Não| EN
>     VN -->|Voltar| E2
>     VN -->|Sim| R["Revisão — conferir o resumo"]
>     R --> C{"Confirmar?"}
>     C -->|Voltar| EN
>     C -->|Confirmar| Z(["{Resultado} concluído"])
> ```
>
> *(O esqueleto mostra 3 etapas como referência. Para 2 etapas, remova o bloco `EN/VN`;
> para 4+, replique o bloco `Ek/Vk` — etapa de processo + portão de validação + aresta
> `Voltar` para a etapa anterior — antes da Revisão.)*

> **Regra das Permissões** — A seção `## Permissões por perfil` **sempre** é uma
> **tabela Markdown** (perfis nas linhas × as funcionalidades nas colunas). Células: `✓` para
> "pode executar" e `—` para "não pode". Nunca use listas ou texto corrido; notas de
> detalhe vão em bullets **após** a tabela.

Apresente e pergunte:
> "O N2 do Agrupamento Funcional está correto? Ajusta algo ou avanço para gerar os N3?"

Aguarde aprovação antes do PASSO 5.

---

## PASSO 5 — `[GERACAO_N3_PRINCIPAL]`

Gere o N3 da **funcionalidade principal** — a fonte canônica das auxiliares. Use as etapas e
campos do PASSO 2 e siga **exatamente** o esqueleto completo do PROMPT_3A (PASSO 3):
front-matter com `contagem.pendente: true` · Descrição (dois parágrafos) · Regras de
negócio · Cenários (os 5 grupos) · Campos (7 colunas) · Derivações (só com campo
calculado) · Campos automáticos · Dados lidos e gravados (só se a funcionalidade toca entidade
sem campo na tela) · Superfície · Comportamento de tela · Critérios de sucesso · Origem
(só com ticket) · Changelog.

> **`## Superfície` é visível**, fora do `dev-only`, logo antes do `## Comportamento de
> tela`; a **`## Origem`** fica logo antes do `## Changelog`. Emita as duas exatamente
> como no esqueleto do PROMPT_3A (PASSO 3).

> **DESTINO DOS ARQUIVOS (obrigatório — não erre a pasta).** Todos os N3 deste wizard vão na **mesma pasta** do `README.md` do Agrupamento Funcional: `modules/[dominio]/[agrupamento-funcional]/`. `[agrupamento-funcional]` é o nome exato dessa pasta — a mesma do N2 gerado nesta sessão. **Nunca** grave na raiz, `global/`, `engine/`, outro domínio ou outro Agrupamento Funcional. Se em dúvida, pergunte antes de gravar.

📄 `modules/[dominio]/[agrupamento-funcional]/f-[verbo]-[entidade].md` (ID `[SIGLA]-[SAF]-01`)

- **Superfície**: Tela própria — assistente multi-etapas (`/[dominio]/[agrupamento-funcional]/novo`).
- **`## Campos`**: liste **todos** os campos de **todas** as etapas na tabela padrão
  (Label PO | Entidade | Preenchimento | Edição | Tipo | Obrigatório | Validação). Preencha a
  **Entidade** dona de cada campo (etapas distintas podem escrever em entidades
  distintas). Indique a **etapa** de cada campo na coluna **Validação** (ex.: "Etapa 2
  — Endereço"). Não agrupe por subtítulos nem adicione colunas avulsas.
- **`## Derivações`**: se alguma etapa tiver campo **calculado**, registre a fórmula
  (Label PO) e os campos-fonte com a entidade de cada um. Sem campo derivado, omita.
- **`## Comportamento de tela`**: descreva a **sequência de etapas**, o que cada etapa
  coleta, a **validação por etapa**, a navegação **voltar/avançar**, o comportamento de
  **rascunho** (se houver) e a **revisão final** antes de confirmar.
- **Cenários Gherkin** — os cinco grupos do template, nesta ordem (grupo sem cenário
  aplicável fica de fora):
  - `# ── Caminho feliz ──`: percorrer todas as etapas até o resultado;
  - `# ── Erros de validação ──`: a validação que bloqueia o avanço de uma etapa + o
    baseline de validação (obrigatório/formato via marcadores de dicionário);
  - `# ── Conflitos com dados existentes ──`: solicitação duplicada ou em andamento;
  - `# ── Restrições de acesso ──`: a reação do sistema a quem não tem acesso a iniciar
    o processo (quem pode fica na matriz do N2);
  - `# ── Estados especiais ──`: salvar e retomar rascunho (se houver), abandono e
    cancelamento.

Apresente e pergunte:
> "O N3 da funcionalidade principal está correto? Posso derivar as funcionalidades auxiliares
> (Retomar / Acompanhar / Cancelar) a partir dele?"

Aguarde aprovação antes do PASSO 6.

---

## PASSO 6 — `[DERIVACAO_N3_AUXILIARES]`

Derive os N3 auxiliares **confirmados no PASSO 3** a partir da funcionalidade principal
recém-aprovada. Gere um por vez, aguardando aprovação entre eles. Cada N3 segue o mesmo
esqueleto completo do PROMPT_3A (PASSO 3), listado no PASSO 5; não repita as perguntas
de campos já coletadas — informe o que foi derivado e peça apenas confirmação ou ajustes.

1. 📄 `f-retomar-[entidade].md` (`...-02`) — **Retomar rascunho**: o usuário escolhe um
   processo salvo e o assistente reabre na etapa onde parou, com os dados já preenchidos.
   Aplique o prazo de validade do rascunho (resposta 7). Superfície: **Ação em tela** —
   disparada de uma lista de rascunhos. Cenários: retomar com sucesso, rascunho expirado,
   rascunho inexistente.

2. 📄 `f-acompanhar-[entidade].md` (`...-03`) — **Acompanhar status**: todos os dados da
   solicitação em **somente leitura** + o **status atual** do processo; sem ações de
   gravação. Superfície: **Tela própria** — Acompanhar [Processo]
   (`/[dominio]/[agrupamento-funcional]/:id`). Sem auditoria (é leitura).

3. 📄 `f-cancelar-[entidade].md` (`...-04`) — **Cancelar solicitação**: identificação da
   solicitação em andamento pelo identificador único + confirmação explícita; aplique a
   política de abandono (resposta 10). Superfície: **Ação em tela**, disparada do
   acompanhamento ou do próprio assistente.

> Se no PASSO 3 nenhuma auxiliar foi confirmada, **pule este passo** — um Agrupamento Funcional do
> tipo wizard pode ter só a funcionalidade principal.

**Contagem pendente e esteira** (PROMPT_3A, PASSO 3.6): cada N3 gerado nesta sessão — a
principal e as auxiliares — nasce com `contagem.pendente: true`, e o espelho da esteira no
`modules/INDEX.md` é regenerado com `python3 scripts/gates.py promote --write` — todos
aparecem como ✏️ rascunho. A contagem fica com o agente de contagem, fora do Docqui; o
`estado` avança pelos gates.

---

## PASSO 7 — `[REVISAO_CONSISTENCIA]`

Com as funcionalidades aprovadas, rode a revisão de consistência do Agrupamento Funcional:

```
[ ] Todas as funcionalidades do N2 têm N3 correspondente?
[ ] A funcionalidade principal é UMA só (as etapas estão em Comportamento de tela, não viraram funcionalidades)?
[ ] Label PO é idêntico entre N2 e os N3?
[ ] Cada campo do N3 principal indica a sua etapa na coluna Validação?
[ ] Os N3 nasceram com `contagem.pendente: true` e aparecem na esteira do INDEX como
    ✏️ rascunho?
[ ] O Fluxo Principal do N2 instancia uma etapa por etapa real, mantendo validação + voltar?
[ ] A matriz de quem pode está só no N2, e os cenários de Restrições de acesso dos N3
    descrevem só a reação, coerentes com ela?
[ ] As rotas das telas não conflitam entre si?
[ ] Campos e regras canônicas estão referenciados pelos dicionários?
```

Se o N1 do domínio foi fornecido, verifique se o Agrupamento Funcional consta na tabela de
Agrupamentos Funcionais do N1 (e no `modules/INDEX.md`) **com o nome em link para o README do
N2** — `[Nome](./[agrupamento-funcional]/README.md)`; se faltar a entrada ou o link, inclua-o
(e ajuste a linha `*Links: ...*` do N1). Proponha a atualização e aguarde aprovação
antes de gravar.

Encerre:
> "Agrupamento Funcional Wizard concluído (N2 + N3 negociais). Para complementar a parte técnica e
> atualizar o data-model, o próximo passo é o detalhamento técnico de cada funcionalidade."
