<!-- docqui: {{VERSION}} | prompt: {{PROMPT_ID}} | atualizado: {{YYYY-MM-DD}} -->
---
id: [SIGLA]-[SFS]-[NN]
feature_set: [SIGLA]-[SFS]
dominio: [SIGLA]
entidade: [Entidade principal]
data_model_ref: data-models/[dominio].md#[entidade]
endpoints: []                       # ex.: ["POST /api/v1/recurso"] — preencher no 3B (se a feature expõe API)
error_codes: []                     # ex.: ["ENTIDADE_ERRO"] — preencher no 3B
depende_de: []                      # ex.: ["SIGLA-SFS-01"]
origem:
  tipo: [servicenow | issue | experimento]
  chave: [STRYxxxxxxx | ISSUE-NNN | EXP-…]
estado: rascunho
gates:
  requisitos:   { aprovado: false, por: "", em: "", pr: "" }   # CP1 — papel padrão: PO/Negócio (3A)
  modelo-dados: { aprovado: false, por: "", em: "", pr: "" }   # CP2 — papel padrão: DBA/Arquiteto (DATA-MODEL/3B)
  testes:       { aprovado: false, por: "", em: "", pr: "" }   # CP3 — papel padrão: QA (5B)
  codigo:       { aprovado: false, por: "", em: "", pr: "" }   # CP4 — papel padrão: Tech Lead (code review)
contagem:
  pendente: true            # há alteração no changelog ainda não revisada para PF
  revisada_em: ""           # AAAA-MM-DD da última revisão de contagem
  revisada_ate: ""          # ticket coberto pela revisão (ex.: STRY03800234)
---

<!--
  METADADOS DO FRONT-MATTER — o que cada bloco acima guarda. A explicação mora aqui, e
  não em comentários `#` dentro do front-matter: uma linha que começa com `#` seria lida
  como o título do N3 por quem procura a primeira linha `# ` do arquivo. Dentro do
  bloco, comentário só no fim da linha (`campo: valor  # …`).

  id · feature_set · dominio · entidade · data_model_ref · endpoints
  · error_codes · depende_de — fonte estruturada para a exportação ao spec-kit
  (PROMPT_SPECKIT_EXPORT). O corpo do N3 continua sendo a fonte de verdade legível; estes
  campos apenas espelham, de forma parseável, o que já está no corpo. Mantê-los em
  sincronia — o PASSO 0 do exporter valida a consistência.
    endpoints / error_codes → preenchidos no 3B (espelham ## API e ## Mapeamento de erros).
    data_model_ref → entidade canônica resolvida em data-models/[dominio].md.
    depende_de → IDs de N3 pré-requisito (ordena foundational vs. user story).

  origem — o ticket de origem (plugável — ver MASTER.md → "Origem do ticket").
    tipo: servicenow | issue | experimento | outro · chave: STRY… | ISSUE-123 | EXP-…
    (instâncias ≤1.5.x usavam a linha `servicenow: STRY…`; os scripts seguem aceitando.)

  estado · gates — a esteira de checkpoints: fonte de verdade do ciclo de vida desta
  feature, validada por scripts/gates.py.
    'estado' é DERIVADO dos gates (não editar à mão): rascunho → requisitos-aprovados
    → modelo-validado → especificado → implementado. Manuais: em-desenvolvimento,
    revisao-necessaria, deprecado. No perfil `requisitos` (MASTER), a esteira tem só CP1 e
    CP2, e o CP2 entrega `especificado` — o estado final dela.
    Ordem dos checkpoints (não pule etapas): requisitos → modelo-dados → testes → codigo.
    Ao aprovar um gate: aprovado: true e preencha 'por' e 'em' (AAAA-MM-DD).
    Papéis (quem aprova cada CP): o padrão está no fim da linha de cada gate; a instância
    pode redefini-los em global/gates-config.yml (ex.: time de pesquisa — CP2
    "reprodutibilidade/revisor técnico").

  contagem — o status de contagem (APF), INDEPENDENTE da esteira de gates. Registra se
  a contagem de PF já foi REVISADA para a última alteração do changelog — mesmo que a
  revisão conclua Δ PF = 0. NÃO é um gate e NÃO afeta 'estado' (o gates.py ignora este
  bloco). Marcado automaticamente:
    3A / 4A / CRUD / WIZARD / RT / R1 / R3 (nova alteração de spec) → pendente: true
    agente de contagem, fora do Docqui (revisão de contagem feita) → pendente: false
-->

<!--
  CONVENÇÃO DE VISIBILIDADE
  ─────────────────────────────────────────────────────────────────
  Blocos <div class="dev-only"> contêm detalhes técnicos.
  Versão PO  → CSS: .dev-only { display: none; }
  Versão DEV → sem CSS adicional
  ─────────────────────────────────────────────────────────────────
-->

# [Nome da Feature]
> **Nível 3** - Feature Set: [Nome do Feature Set] — Major Feature Set: [Nome do Domínio] - `[SIGLA]-[SFS]-[NN]`

## Descrição

<!-- ID da feature: copie a reserva exata da tabela Features do N2. A primeira sequência segue a jornada confirmada; qualquer ID já usado é imutável, mesmo quando a ordem da jornada muda. Não renumere no 3B/4A/4B nem na síntese bottom-up. Ver engine/N3-IDS.md e scripts/ids-n3.mjs. -->

<!--
  O CONTRATO DE ENTREGA da feature (FEATURE-DEFINITION.md, FD-8): 1-2 frases de
  negócio, para alguém que nunca viu o sistema, respondendo "o que eu ganho quando
  esta feature estiver pronta?". Entrega ÚNICA (uma coisa, e desta feature — não
  copie a descrição de outra), TANGÍVEL (ação + resultado, não intenção: nada de
  "facilita/otimiza/melhora a experiência", "etc.", "de forma eficiente") e
  NEGOCIAL (sem endpoint/API/banco — Modo PO).
  Fórmula sugerida: "Permite que [ator] [ação] [entidade], [resultado observável]."

  SEGUNDO PARÁGRAFO — COMO SE USA. A Descrição tem duas camadas em parágrafos
  consecutivos: a 1ª é o contrato de entrega (acima), a 2ª diz como se OPERA a
  funcionalidade (ou, em Job/CLI, como ela se dispara), em uma ou duas frases. Só o
  1º parágrafo é medido pelo FD-8. Ao citar um conjunto de opções — filtros, colunas,
  ações — cite até três precedidas de "como…"; se o conjunto tem três ou menos, liste
  todas e dispense o "como". Não crie seção própria para isso: o texto do uso caía
  longe da entrega e as duas camadas se leem melhor juntas.
-->

[Descrição em 1-2 frases do que esta feature ENTREGA, em linguagem de negócio, para alguém que nunca viu o sistema.]

[Uma ou duas frases de COMO SE USA: por onde se chega, o que se informa e o que se aciona — ou, em Job/CLI, o que dispara a execução.]

---

## Regras de negócio

<!--
  Regras canônicas: referenciar o dicionário em vez de repetir.
  Regras de domínio: referenciar o N1 em vez de repetir.
  Regras específicas desta feature: descrever aqui.

  REGRA ≠ COMPORTAMENTO — uma regra é a invariante/condição ("o quê"),
  não a reação do sistema ("como"). Apare a cauda de comportamento:
    ✗ "...todos os obrigatórios preenchidos e válidos; caso contrário,
       não salva e exibe mensagem conforme o Design System."
    ✓ "...todos os obrigatórios preenchidos e válidos."
  A reação ("não salva", "exibe mensagem", bloqueio) vira CENÁRIO em
  "## Cenários". E "conforme o Design System" não é texto final: é gatilho
  para resolver a mensagem no MESSAGE-DICTIONARY/FIELD-DICTIONARY e escrever
  o TEXTO LITERAL no cenário (ou usar o marcador BASELINE de validação).

  ID DA REGRA — `RN-NN` (6.3.0). Toda regra desta seção, inclusive a que só cita o
  dicionário ou o N1, começa por `**RN-NN** —`: sequencial na feature e NUNCA
  reaproveitado (a regra removida leva o número; a nova pega o próximo livre). É por ele
  que o cenário diz o que verifica (tag `@RN-NN` em "## Cenários") e que o SDD, o código
  e o teste citam a regra — fora do N3, com o ID da feature: `[SIGLA]-[SFS]-[NN]/RN-NN`.
  Toda regra tem ao menos um cenário com a tag dela: node scripts/valida-regras-cenarios.mjs
-->

- **RN-01** — [Regra específica desta feature em linguagem de negócio] → ver RULES-DICTIONARY: [RC-NN] — [nome da regra] *(se for regra canônica)* → ver [N1 do domínio]: Regras transversais de negócio: [N] *(se for regra de domínio)*

- **RN-02** — [Regra específica]

---

## Cenários

<!--
  Mapeamento para o spec-kit (PROMPT_SPECKIT_EXPORT):
  - "Caminho feliz" + "Erros de validação"  → Acceptance Scenarios da user story no spec.md
  - "Conflitos com dados existentes" + "Estados especiais" → seção Edge Cases do spec.md
  - "Restrições de acesso" → Acceptance Scenarios + princípio de autorização na constitution
  Manter os 5 grupos garante cobertura completa na geração de tasks/testes.

  RESTRIÇÕES DE ACESSO = A REAÇÃO, NÃO A MATRIZ (decisão do PO, 2026-09-28). Quem pode
  executar a ação vive só na matriz "Permissões por perfil" do N2 — o N3 não traz regra
  de permissão nem lista de perfis. O grupo descreve o que o sistema faz quando alguém
  SEM acesso tenta a ação: a mensagem literal do catálogo (NO_PERMISSION, ou uma
  específica) e o que fica bloqueado. Assim, mudar quem pode mexe só no N2, e o cenário
  continua certo.

  TAG DA REGRA (6.3.0). O cenário que verifica uma regra de "## Regras de negócio" leva,
  na linha logo acima dele, a tag `@RN-NN` dela (várias, se verifica mais de uma). Toda
  regra tem ao menos um cenário com a sua tag; cenário sem tag é permitido (campo
  obrigatório, formato, acesso). A tag vale só no cenário — no `Feature:` não cobre nada.
  É ela que o teste herda (`[SIGLA]-[SFS]-[NN]/RN-NN` no nome ou na tag do teste).
-->


```gherkin
Feature: [Nome da feature em linguagem natural]

  Background:
    Given que o usuário está autenticado na organização "[org]"
    And [contexto adicional comum a todos os cenários]

  # ── Caminho feliz ──────────────────────────────────────────────

  @RN-01
  Scenario: [Descrição do cenário principal]
    Given [estado inicial em linguagem de negócio]
    When [ação do usuário]
    Then [resultado esperado]
    And [efeito colateral esperado]

  # ── Erros de validação ─────────────────────────────────────────

  Scenario: [Campo obrigatório ausente]
    When o usuário deixa o campo "[Label PO]" vazio
    And clica em "[botão de ação]"
    Then o sistema exibe abaixo do campo: "[mensagem de erro]"

  Scenario: [Formato inválido]
    When o usuário preenche "[Label PO]" com "[valor inválido]"
    Then o sistema exibe abaixo do campo: "[mensagem de erro]"
    # ← FIELD-DICTIONARY: [nome do campo] *(se for campo canônico)*

  # ── Conflitos com dados existentes ────────────────────────────

  @RN-02
  Scenario: [Duplicata ou conflito]
    Given que já existe [registro] com [dado conflitante]
    When o usuário tenta [ação]
    Then o sistema exibe: "[mensagem de conflito]"

  # ── Restrições de acesso ───────────────────────────────────────

  Scenario: [Usuário sem acesso a esta feature]
    Given que o perfil do usuário não tem acesso a "[Nome da feature]" na matriz do N2
    When o usuário tenta [ação]
    Then o sistema exibe: "[texto de NO_PERMISSION no MESSAGE-DICTIONARY]"

  # ── Estados especiais ──────────────────────────────────────────

  Scenario: [Situação especial do sistema]
    Given que [estado especial]
    When o usuário tenta [ação]
    Then [comportamento alterado]
    And o sistema exibe: "[mensagem contextual]"
```

---

## Campos

<!--
  Esta tabela usa apenas Label PO e regras em linguagem de negócio.
  A nomenclatura técnica (Label Dev e campo banco) está centralizada
  no DATA-MODEL.md — não duplicar aqui.

  COLUNA "Entidade" — rastreabilidade campo→tabela, VISÍVEL NO MODO PO (referência,
  não redefinição). Nomeia a entidade dona do campo (nome negocial da entidade, como
  no front-matter `entidade` e no data-model), para evolução ("mexeu na entidade X →
  estes campos"), proveniência e leitura direta da APF (as entidades distintas aqui =
  ALIs/AIEs referenciados → ALR). É uma REFERÊNCIA à entidade — o detalhe técnico
  (Label Dev, campo banco, tipo SQL) continua só no dev-only `## Mapeamento de campos`
  e no DATA-MODEL. Preenchimento:
   - campo próprio da feature → a **entidade principal** (padrão);
   - campo que pertence a outra entidade → o nome dessa entidade;
   - campo de seleção/lookup (Tipo `seleção → [Entidade]`) → a entidade origem;
   - campo cuja lista é de **valores fixos** (não vem de cadastro nenhum) → `dado de
     código` — é o que o tira da conta de ALR (CPM 5.4.2d); sem isso, uma combo de
     valores fixos parece igual a uma que lê uma entidade;
   - campo vindo de fora → `externo: [Sistema]`;
   - campo calculado/derivado → `derivado ↓` (detalhe em `## Derivações`).

  ENTIDADE × PREENCHIMENTO — duas perguntas diferentes, não confundir. `Entidade`
  diz DE ONDE O DADO VEM (que arquivo lógico alimenta o campo); `Preenchimento` diz
  COMO O VALOR CHEGA (o usuário informa, o sistema calcula, vem de fora, ou já está
  gravado e só é mostrado — `exibido do cadastro`, na ficha de Visualizar ou no campo
  somente leitura de Editar, como a matrícula). Numa combo,
  "entrada do usuário" só conta que o usuário escolheu — quem responde de qual conjunto
  é a coluna `Entidade`. A coluna chamava-se `Origem` e foi renomeada porque "origem"
  é justamente o que a `Entidade` responde.
-->

| Label PO | Entidade | Preenchimento | Edição | Tipo | Obrigatório | Validação |
|---|---|---|---|---|---|---|
| [Nome do campo em português] | [Entidade dona — principal por padrão / outra entidade / `dado de código` / `externo: [Sistema]` / `derivado ↓`] | [entrada do usuário / calculado / externo: [Fonte] / exibido do cadastro] | [editável / somente leitura / imutável] | [texto / número / data / lista de opções / `seleção → [Entidade]` / sim·não / arquivo] | sim / não | [regras em linguagem natural] |

*[Notas sobre dependências entre campos, se houver.]*

---

## Derivações
<!--
  Só quando houver campo com Preenchimento "calculado" (marcado `derivado ↓` na coluna
  Entidade de `## Campos`). Diz DE ONDE cada informação derivada vem: a fórmula em
  Label PO e os campos-fonte com a respectiva entidade. É daqui que a APF lê as
  entidades-fonte referenciadas por campos calculados (contam como ALR). Se não
  houver campo derivado, OMITA esta seção.
-->

| Campo derivado | Fórmula (Label PO) | Campos-fonte (Entidade) |
|---|---|---|
| [campo] | [expressão em Label PO — ex.: Quantidade × Preço unitário] | [Campo A (Entidade X), Campo B (Entidade Y)] |

---

## Colunas do resultado
<!-- Apenas para features de Pesquisa/Listagem — colunas exibidas em cada linha do resultado da busca. Em features que NÃO são de busca, OMITA esta seção. -->

| Coluna (Label PO) | Origem | Ordenação |
|---|---|---|
| [campo exibido] | cadastro / entidade relacionada / derivado | padrão ↑ / ordenável / — |

---

## Campos automáticos

| Label PO | Valor | Quando |
|---|---|---|
| [campo] | [valor fixo ou calculado em linguagem natural] | [momento — ex: "no momento do salvamento"] |

---

## Dados lidos e gravados
<!--
  Entidades que a feature lê ou grava SEM contribuir campo para a tela — as que a
  tabela `## Campos` não revela. Não repita aqui entidade que já apareça na coluna
  `Entidade`: esta seção COMPLETA aquela, não a espelha. Se toda entidade tocada já
  está em `## Campos`, OMITA esta seção.

  POR QUE ELA EXISTE: as demais fontes de arquivo lógico do N3 (`Entidade` em
  `## Campos`, entidades-fonte de `## Derivações`, `Tipo: seleção → X`) são todas
  ancoradas em campo. A tabela de campos descreve **a tela**; o ALR da APF descreve
  **a transação** — recortes diferentes. Uma entidade que a feature toca sem exibir
  campo algum (o registro de execução que recebe o status, o cronograma que define a
  janela válida, o painel entregue junto do dado) fica invisível às três, e o ALR sai
  menor do que a feature realmente referencia. É daqui que a contagem o fecha.

  Papel: `lê` · `grava` · `lê e grava`. Justifique cada linha pelo que a motiva —
  a regra de negócio, o campo automático, o cenário.
-->

| Entidade | Papel | Por que a feature a toca |
|---|---|---|
| [Entidade] | [lê / grava / lê e grava] | [o que a feature faz com ela — ex.: "Recebe o status do processamento e o relatório de erros (RN-08)"] |

---

## Superfície

<!--
  Classifica COMO a feature se manifesta — marcador escaneável lido pelo validador
  (validate-doc.mjs), que decide qual seção de detalhamento exigir:

  - **Tela própria** — página/rota ou formulário dedicado.        → exige ## Comportamento de tela
  - **Modal** — janela aberta sobre outra tela, com conteúdo       → exige ## Comportamento de tela
    próprio: o detalhe de um registro, uma consulta ou um formulário que não é
    subformulário de outro. Indicar a origem. Como a Tela própria, é dona dos seus
    acessórios (lista consultada, consulta implícita, exportação).
  - **Ação em tela** — disparada de dentro de outra tela           → exige ## Comportamento de tela
    (botão/ícone em listagem, menu de contexto), no máximo com uma caixa de diálogo.
    Indicar a origem.

  Caixa de diálogo (confirmação, alerta) não é Modal: é parte da Ação em tela que a abre.
  Modal que é subformulário de outro formulário — os dados só são gravados com o
  registro-pai — não é N3 nem Superfície: fica no `## Comportamento de tela` e nos
  `## Campos` da feature do pai. *(decisão do PO, 2026-09-27)*
  - **CLI** — comando de terminal executado pelo ator.             → exige ## Execução e operação
  - **Job/Pipeline** — execução disparada por agendamento/evento/  → exige ## Execução e operação
    estágio de pipeline (sem interação durante a execução).
  - **API** — operação exposta para consumo por outro sistema      → exige ## Execução e operação
    (a "tela" é de terceiros; o contrato vive no dev-only/3B).

  Esta linha apenas classifica. O mapa tela↔feature (N:N), quando uma tela atende
  várias features, é consolidado no N2 (seção Telas — arquétipo transacional).

  MAIS DE UMA ROTA NA MESMA FEATURE? Escreva em LISTA, uma linha por rota, com o
  critério que as distingue à esquerda (tipo, canal, variante). Em parágrafo
  corrido não se percebe quantas são (REP-038 do portal-compras: uma feature
  carregava cinco rotas numa frase só). Assim:

      **Tela própria** — são **três** rotas, uma por canal e tipo de cliente:

      - Administrador — `/clientes/novo`
      - Autocadastro · Pessoa Física — `/cadastro/pessoa-fisica`
      - Autocadastro · Pessoa Jurídica — `/cadastro/pessoa-juridica`

  A ressalva (⚠️) vai em parágrafo DEPOIS da lista, nunca dentro de um item: ela
  costuma valer para o conjunto, e presa a um item mente sobre o alcance.

  NÃO vire lista a rota que aparece dentro de uma frase de ANÁLISE ("a rota antiga
  `/x` não existe no código; há duas candidatas, `/y` e `/z`") — ali as rotas são
  argumento, não inventário, e a lista quebra o raciocínio no meio.
-->

**[Tela própria | Modal | Ação em tela | CLI | Job/Pipeline | API]** — [tela própria: rota `/...` · modal: origem: [Feature/Tela] (`/rota`) · ação em tela: origem: [Feature/Tela] (`/rota`) · CLI: comando `...` · Job/Pipeline: gatilho (cron/evento/estágio) · API: consumidor previsto]

**Fidelidade ao protótipo**: [obrigatória | referência | n/a] · [caminho do protótipo quando houver, ex.: `prototypes/[dominio]/[feature-set]/[feature]/[estado].html`] · [[abrir o protótipo ↗](../../../prototypes/[dominio]/[feature-set]/[feature]/[estado].html)]
<!-- obrigatória = a implementação deve reproduzir o protótipo (exige o caminho); referência (padrão) = protótipo guia, ajustes permitidos no Design System; n/a = sem tela/protótipo (padrão para CLI/Job/API). A fidelidade "obrigatória" é checada pelo validador. O link "abrir o protótipo ↗" é relativo a este N3 (sobe três níveis até a raiz) — é a forma que funciona no GitHub e no editor; o visualizador da instância o abre em outra aba. -->

---

## Comportamento de tela
<!-- Obrigatória quando a Superfície é Tela própria/Modal/Ação em tela. Se a Superfície é CLI/Job/API, OMITA esta seção e preencha "## Execução e operação". -->

### Onde fica
[Descrever em qual rota e componente a feature aparece: formulário em página própria, modal, botão em listagem, etc.]

### Estados da tela

| Estado | Comportamento |
|---|---|
| Loading | [o que exibir durante o processamento] |
| Erro de validação | [como exibir erros de campo] |
| Erro de servidor | [toast ou mensagem genérica] |
| Sucesso | [toast, redirecionamento ou relatório] |
| Empty state | [quando e o que exibir se não há dados] |

---

## Execução e operação
<!-- Obrigatória quando a Superfície é CLI/Job/Pipeline/API — é o equivalente operacional do "Comportamento de tela". Se a Superfície é Tela própria/Modal/Ação em tela, OMITA esta seção. Mantenha a linguagem negocial (Modo PO): o COMANDO/gatilho e os parâmetros são a "tela" deste ator; flags/paths literais detalhados demais vão para o dev-only/3B. -->

### Como executa
[Comando ou gatilho em linguagem de negócio: `treinar` com o arquivo de configuração do experimento · disparado ao concluir o estágio anterior do pipeline · agendado toda madrugada. Pré-condições de ambiente relevantes ao negócio (ex.: exige nó de GPU, exige o cache de dados pronto).]

### Parâmetros de execução

| Parâmetro (Label PO) | Obrigatório | Efeito |
|---|---|---|
| [ex.: Arquivo de configuração] | sim | [define modelo-alvo, dados e hiperparâmetros da execução] |

### Interrupção e reexecução
[O que acontece se a execução for interrompida (suspensão, falha, preempção): retoma do último ponto salvo? Reexecutar do zero é seguro (idempotente) ou duplica resultado? O que precisa ser limpo antes de reexecutar?]

### Saídas e artefatos
[O que a execução produz e onde fica (em linguagem de negócio): artefatos gerados, relatórios, registros — referencie o data-model de artefatos: → ver data-models/[dominio].md: [Artefato].]

### Acompanhamento

| Situação | Como o ator percebe |
|---|---|
| Em andamento | [progresso: log de negócio, métrica, % concluído] |
| Falha | [como a falha é comunicada e onde ver o motivo] |
| Sucesso | [resultado observável: artefato disponível, resumo, notificação] |

---

## Critérios de sucesso

<!--
  Resultados MENSURÁVEIS e AGNÓSTICOS DE TECNOLOGIA que comprovam que a feature
  entrega valor. Alimentam a seção "Success Criteria" (SC-###) do spec.md na
  exportação ao spec-kit. Derivar de: cobertura dos cenários + NFRs herdados.
  - ✓ observável e medível: "90% dos usuários concluem o cadastro em < 2 min"
  - ✗ não citar stack/implementação: "endpoint responde em < 200ms" é NFR técnico,
    referencie via → ver NFR: [ID] em vez de repetir aqui.
  Se a feature não tiver métrica própria, herde do NFR aplicável.
-->

| # | Critério mensurável | Origem |
|---|---|---|
| SC-01 | [resultado observável e medível em linguagem de negócio] | [cenário / `→ ver NFR: [ID]` / negócio] |

---

## Métricas de tamanho

<!--
  Preenchida pelo agente de contagem, fora do Docqui, depois da aprovação do N3 e antes do
  início do desenvolvimento. Os prompts do Docqui não contam: deixam a seção como está.
  Revisão: Tech Lead do domínio.
  Critérios de contagem: ver global/SIZING.md

  IMPORTANTE — Arquitetura BFF (Java + Angular):
  A unidade de contagem é a FEATURE (N3) inteira, não o endpoint (ver global/SIZING.md).
  O front e o BFF são camadas internas da mesma feature: ter o backend em BFF interno
  NÃO é, por si só, motivo para não contar. A feature conta se satisfaz os critérios de
  processo elementar (PE) e se classifica como EE/SE/CE.
  Registrar aqui apenas Funções de Transação (EE, SE, CE).
  Funções de Dados (ALI, AIE) são contadas centralmente no DATA-MODEL.md.
-->

| Função de Transação | Papel | Tipo | ALR | DER | Complexidade | PF | Data |
|---|---|---|---|---|---|---|---|
| [Nome da Feature] | principal | [EE / SE / CE] | [N] | [N] | Baixa / Média / Alta | [3/4/5/6/7] | [AAAA-MM-DD] |
| [Consultar Rótulo do campo (combo)] | acessório | [CE / SE] | [N] | [N] | Baixa / Média / Alta | [3/4] | [AAAA-MM-DD] |

> **Papel** = o que o PE é **em relação à feature**: `principal` realiza a feature (mesma intenção e objeto do nome dela, inclusive as variantes por canal, por tipo e por completude); `acessório` a feature só hospeda ou consome (lista consultada, consulta implícita, exportação, ação vizinha que é principal de outra feature). Toda feature contada tem ao menos um `principal`; a linha `↪` e a ainda não medida levam `—`. Não muda o PF — diz o que a análise de impacto mede por padrão (os principais). Regras em `global/SIZING.md` → *Papel do PE em relação à feature*.

> **ALR** = nº de ALIs/AIEs lidos ou mantidos pela transação, apurado nas quatro fontes do `global/SIZING.md` · **DER** = campos distintos que cruzam a fronteira (entrada ∪ saída, uma vez cada) **+1** capacidade de mensagens **+1** ação que dispara. O par ALR × DER define a complexidade pela tabela da EE ou pela da SE/CE do `global/SIZING.md`. · **Data** = quando a linha foi contada/atualizada (ISO `AAAA-MM-DD`); linha inalterada numa recontagem mantém a data anterior. · **PF 0** = feature que não é processo elementar, ou PE descartado: a linha fica, com `—` em Tipo, ALR, DER e Complexidade, e a memória diz por quê — é esse porquê que a planilha de entrega mostra na linha, para o PO ver que a feature foi impactada e não contada. · **PE reutilizado** = PE já contado noutra feature (cada PE conta uma vez na aplicação): a linha leva o nome dele, `↪ [ID](caminho do N3)` no Tipo e `—` em ALR, DER, Complexidade e PF, sem memória — ver `global/SIZING.md` → *PE reutilizado*. Antes de contar, confira: `node scripts/valida-acessorio-tela.mjs --pe "<nome do PE>"`.

### Memória de cálculo

<!--
  OBRIGATÓRIA em toda linha contada. Número sem memória não é auditável: quem revisa
  não consegue dizer se o ALR 3 esqueceu um arquivo lógico ou se o DER 18 contou duas
  vezes o mesmo campo — e, numa recontagem, ninguém sabe o que mudou de fato.
  A ENUMERAÇÃO é dado, não prosa: um bloco ```json por processo elementar, logo abaixo
  do cabeçalho dele, com `pe` (o nome da linha da tabela), `alr` e `der` (listas de
  NOMES — sem parêntese de anotação, sem explicação: é o que a planilha de entrega copia
  para as colunas Descrição) e, se houver, `nao_contados`. As listas têm o tamanho do ALR
  e do DER da tabela; os dois `+1` do DER entram como "Mensagem" e "Ação". Na linha de
  0 PF, o bloco é `{"pe": …, "motivo": "por que não conta"}`. O porquê de cada leitura
  fica em prosa, abaixo do bloco. Conferência: node scripts/valida-enumeracao-contagem.mjs
  (gate F8 do spec-guard, ao gravar).
  O ALR sai das quatro fontes do SIZING — a coluna `Entidade` de `## Campos` (entidades
  distintas), as entidades-fonte de `## Derivações`, a seção `## Dados lidos e gravados` e
  a varredura de `## Regras de negócio` e `## Campos automáticos`; a memória só torna essa
  leitura explícita.
-->

**[Nome do processo elementar]** — [EE/SE/CE] · ALR [N] · DER [N] · [complexidade] · [N] PF

```json
{"pe": "[Nome do processo elementar]",
 "alr": ["[Entidade]", "[Entidade]"],
 "der": ["[campo]", "[campo]", "Mensagem", "Ação"],
 "nao_contados": "[o que ficou de fora e por quê — campos de controle, dado de código, campo repetido já contado; sem nada a dizer, apague a chave]"}
```

Por que cada ALR:
1. `[Entidade]` — [o que a transação lê ou grava aí]
2. `[Entidade]` — [motivo]

**Total: [N] PF**

---

<div class="dev-only">

## Mapeamento de campos
→ ver DATA-MODEL.md: Entidade [Nome da Entidade]

<!--
  Todos os campos desta feature — Label Dev, campo banco, tipo SQL
  e constraints — estão centralizados no DATA-MODEL.md.
  Campos novos aprovados durante a sessão devem ser adicionados
  ao DATA-MODEL.md antes de iniciar a implementação.

  A entidade dona de cada campo, VISÍVEL NO MODO PO, é a coluna `Entidade`
  de `## Campos`; este bloco é o detalhe técnico (Label Dev/campo banco/tipo SQL)
  do mesmo mapeamento. Mantenha os dois consistentes.
-->

---

## Cenários técnicos adicionais

```gherkin
  # ── Comportamento técnico ──────────────────────────────────────

  Scenario: [Cenário técnico — sessão, cookies, formato de erro HTTP]
    Given [estado técnico]
    When [ação técnica]
    Then [resultado técnico com formato JSON ou HTTP status]
```

---

## Mapeamento de erros (código interno → mensagem ao usuário)

| Código | HTTP | Mensagem exibida ao usuário |
|---|---|---|
| `[ENTIDADE_ERRO]` | [código] | "[mensagem em português]" |

---

## API

### [MÉTODO] /api/v1/[rota]
**Acesso**: [público / autenticado — roles `[role1]`, `[role2]`]

<!--
  CONTRATO EM TABELA (6.3.0). Requisição e resposta são tabelas de campos, não exemplo
  JSON: o exemplo mostra UM caso e deixa tipo, obrigatoriedade e origem por conta de quem
  lê — é ali que o agente que gera o código inventa campo. A coluna Label PO liga o campo
  da API ao campo da feature (`## Campos`, `## Campos automáticos` ou `## Colunas do
  resultado`); campo técnico (id, versão, paginação) leva `—`. Tipos e constraints
  completos continuam no DATA-MODEL. O envelope (`data`/`meta`/`error`) é o do
  API-PATTERNS e não se repete. Conferência: node scripts/valida-contrato-api.mjs
  (também `endpoints`/`error_codes` do front-matter × esta seção × ERROR-DICTIONARY).
-->

**Requisição** (body / query params):

| Campo | Tipo | Obrigatório | Label PO |
|---|---|---|---|
| `[labelDev]` | [tipo] | sim / não | [Label PO de ## Campos] |

**Resposta de sucesso** — HTTP [código] — em `data`:

| Campo | Tipo | Label PO |
|---|---|---|
| `id` | uuid | — |
| `[labelDev]` | [tipo] | [Label PO de ## Campos] |

**Respostas de erro**:

| HTTP | Code | Situação |
|---|---|---|
| [código] | `[ENTIDADE_ERRO]` | [quando ocorre] |

---

## Eventos

### Publicados
| Evento | Quando | Payload | Consumidores |
|---|---|---|---|
| `[entidade.acao]` | [quando] | `{ organizationId, [id] }` | [quem consome] |

### Consumidos
| Evento | Publicado por | Reação |
|---|---|---|
| `[entidade.acao]` | [Domínio] | [o que faz ao receber] |

---

## AuditLog

```typescript
logAction({
  organizationId: context.organizationId,
  userId: context.userId,
  action: '[entidade.acao]',
  targetEntity: '[Entidade]',
  targetId: [entidade].id,
  metadata: {
    // campos relevantes usando Label Dev
    // → nomes completos em DATA-MODEL.md: Entidade [Nome]
  }
})
```

---

## Arquivos a criar ou alterar

```
[caminho/arquivo.ts]     ← [o que faz]
[caminho/arquivo.tsx]    ← [o que faz]
```

---

## Dependências

- **[Lib/Serviço]** — [para que é usado]

---

## Implementação

<!--
  Onde o código desta feature vive. A coluna Repositório é preenchida no 3B
  (PASSO 5) — no perfil `requisitos`, no 3A, quando há o inventário — com nomes
  que EXISTEM em repos/INDEX.md — uma linha por parte da feature (endpoint → repo
  do serviço; componente/tela → repo do front/MFE; job → repo do pipeline; num
  sistema de microsserviços, cada serviço que a realiza). Caminho e Branch/Tag
  podem ficar como placeholder até o dev. A partir de `estado: em-desenvolvimento`,
  o validate-doc.mjs exige ao menos uma linha com repositório real (não
  placeholder). O índice reverso — as features de cada repositório — sai daqui:
  `node scripts/gera-indice-repos.mjs` (seção gerada no repos/INDEX.md).
-->

| Item | Repositório | Caminho | Branch/Tag |
|---|---|---|---|
| [endpoint/componente/job] | [repo] | [caminho no repo] | `main` |

**Status**: definido pela **esteira de checkpoints** no front-matter (`estado` + `gates`) no topo deste arquivo — não duplicar aqui. `📋 especificado` = pronto para desenvolvimento (CP1+CP2+CP3 aprovados); `✅ implementado` = CP4 (code review) aprovado. Para sinalizar trabalho em andamento, declare `estado: em-desenvolvimento`. Ver `docs` da esteira de gates.

<!--
  Elo spec → código. Para que a cadeia ticket → N3 → código fique completa,
  referencie ambos os IDs nos commits e no PR:
    tipo(SIGLA-SFS-NN): resumo da mudança ([origem] [chave])
  Assim a feature (ID do N3) e o ticket de origem (chave desta seção "Origem")
  são localizáveis a partir do histórico do git.
-->

**Rastreabilidade no git**: commits/PR referenciam o ID da feature e o ticket de origem — `tipo([SIGLA]-[SFS]-[NN]): [resumo] ([origem] [chave])` (ex.: `(ServiceNow STRY0012345)`, `(issue ISSUE-482)`, `(experimento EXP-2026-003)`)

---

</div>

## Origem

<!--
  Os tickets (história do ServiceNow, issue, experimento — ver MASTER.md → "Origem do
  ticket") que originaram ou alteraram esta feature, cada um com o link para a sua AIMM
  (`analise-impacto/AIMM-<CHAVE>.md`). Elo recíproco da seção `## Features` da AIMM.
  Relação M:N: uma feature pode atender a vários tickets; um ticket pode gerar várias
  features. A chave da ferramenta de origem é a fonte de verdade — não inventar IDs aqui.

  CARIMBO DE VERIFICAÇÃO (elo suspeito): após fechar/rever o elo, rode
  `node scripts/suspect-links.mjs --stamp --file <este arquivo>` — ele grava aqui
  um comentário `<!- - trace-verified: [chave] @ fingerprint - ->` por ticket.
  Se a descrição ou os critérios do ticket mudarem na AIMM depois disso,
  `suspect-links` acusa o elo como suspeito (e `--mark` sinaliza ⚠️ no INDEX.md).
  Não editar os carimbos à mão. A consistência dos três lugares é provada por
  `scripts/audit-trace-links.mjs`.
-->

| Ticket (AIMM) | Tipo | Critérios cobertos |
|---|---|---|
| [`STRYxxxxxxx | ISSUE-NNN | EXP-…`](../../../analise-impacto/AIMM-[CHAVE].md) | Criação / Alteração | `CA-1, CA-4` — [o que esta feature realiza desses critérios] |

<!--
  A célula "Critérios cobertos" ABRE com as referências `CA-n` quando o ticket
  numera os critérios (ver a linha de Numeração na AIMM do ticket) — é delas que a
  contagem por sprint monta a rastreabilidade ticket › critério › feature.
  Formato: `CA-1, CA-4` seguido de travessão e da prosa do que a feature realiza.
  Quando a fonte NÃO numera, abra a célula com `—` e mantenha só a prosa: a
  rastreabilidade fica pela chave do ticket. Nunca invente número de critério.
  Entre as features de um mesmo ticket, os `CA-n` não devem se repetir nem faltar:
  a união dos critérios das features é o conjunto de critérios do ticket.
-->

---

## Changelog

<!-- Ordem decrescente por data: a entrada mais recente fica sempre no topo, logo abaixo do cabeçalho. -->

| Data | Autor | Tipo | Descrição |
|---|---|---|---|
| 2026-10-20 | Docqui Caixa | Terminologia | Adoção de AIMM; histórico anterior preservado. |
| [AAAA-MM-DD] | [autor] | Feature criada | [descrição] |

---

*Feature Set: [Nome] · Major Feature Set: [Nome] · Última revisão: —*

*Links: [N2 do Feature Set](./README.md) · [N1 do domínio](../README.md) · [INDEX geral](../../INDEX.md)*
