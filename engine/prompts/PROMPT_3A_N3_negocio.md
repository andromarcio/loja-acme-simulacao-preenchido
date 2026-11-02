# PROMPT 3A — N3 Negócio
## Funcionalidades · Parte negocial

> **Modelo de estrutura**: `engine/templates/modules/_template-dominio/_template-agrupamento-funcional/_template-funcionalidade.md` *(referência humana — o prompt já embute o esqueleto)*
> **Quem participa**: PO + dev (ou só PO)
> **Insumo necessário**: N1 do domínio + N2 do Agrupamento Funcional escolhido
> *(ambos opcionais no fluxo bottom-up — ver Modo B abaixo)*
> **Entrega**: rascunho do .md de cada funcionalidade com descrição, campos
> em Label PO, regras e cenários Gherkin negociais
>
> **Pré-requisito (fluxo top-down)**: PROMPT_2A concluído (N2 negocial) para o Agrupamento Funcional escolhido
> **Pré-requisito (fluxo bottom-up)**: nenhum — informe nome do domínio, Agrupamento Funcional e funcionalidade
> **Próximo passo**: após aprovação, usar PROMPT_3B

---

## INSTRUÇÕES PARA O CLAUDE

> **Protocolo obrigatório desta sessão (F1 preflight · F2 autovalidação):**
> 1. **Antes de gerar** — rode `node scripts/preflight-spec.mjs [dominio] [agrupamento-funcional]` (ou, sem disco, leia o N0 + `modules/INDEX.md` + o N1/N2 pertinentes) e apresente um bloco **"Contexto verificado"**: o que já existe, IDs tomados, próximo NN livre, regras/campos já canônicos a **referenciar** (não reescrever). Não duplique ID/pasta/regra/campo existente.
> 2. **Depois de gravar** — rode `node scripts/validate-doc.mjs <arquivo>` (estrutura) **e** `node scripts/valida-semantica-funcionalidade.mjs <arquivo>` (é mesmo uma funcionalidade? — critérios FD de `engine/DEFINICAO-FUNCIONALIDADE.md`); se algum reprovar, **apresente os desvios, corrija e repita até `✓`**. Nunca conclua com um validador reprovando.
> *(No Claude Code os hooks em `.claude/settings.json` já enforçam isso automaticamente.)*

Você vai especificar funcionalidades do ponto de vista de negócio.
Use exclusivamente linguagem de negócio — sem mencionar endpoints,
campos de banco, libs, FKs ou arquivos de código.

Regras da sessão:
- Trabalhe uma funcionalidade de cada vez, na ordem que eu indicar.
- Apresente as perguntas em blocos temáticos, um bloco de cada vez.
- Ao completar todos os blocos, gere o artefato e aguarde aprovação.
- A tabela de campos usa Label PO, **Entidade**, Preenchimento, Edição, Tipo, Obrigatório e
  Validação em linguagem natural. A coluna **Entidade** nomeia (por referência) a
  entidade dona do campo — nunca Label Dev nem campo banco.
- Campos canônicos (CPF, CEP, e-mail, etc.): aplicar FIELD-DICTIONARY
  automaticamente sem perguntar sobre suas regras de validação.
- Regras canônicas (maioridade, responsável ativo, etc.): aplicar
  RULES-DICTIONARY automaticamente sem perguntar sobre o comportamento.
- **Mensagens de UI**: toda mensagem exibida num cenário sai do `MESSAGE-DICTIONARY`.
  Genérica → marcador `# ← MESSAGE-DICTIONARY: BASELINE`. Específica → chave
  `<DOMINIO>_<SITUACAO>` + marcador `# ← MESSAGE-DICTIONARY: <CHAVE>` no cenário, e a
  entrada acrescentada ao catálogo na mesma entrega. Mensagem nova não catalogada é
  pendência ⚠️, não texto livre.
- Perguntar apenas o que os dicionários deixam em aberto (parâmetros).
- Sinalize suposições com ⚠️.
- **Nunca resuma uma contagem sem nomear os itens.** Se a frase disser "as N
  configurações/campos/grupos/abas…", liste os N itens ali mesmo (ou garanta
  que já estão numa tabela da mesma seção) — cada N3 é autocontido; quem lê
  só ele não pode depender de abrir outro arquivo para saber quais são.
- **Nomenclatura dos arquivos N3**: prefixo `f-` obrigatório + verbo no infinitivo + hífen + substantivo da entidade principal (singular) + adjetivo qualificador quando a entidade tiver um (derivar do nome do Agrupamento Funcional), tudo em kebab-case. Padrão de caminho: `modules/[dominio]/[agrupamento-funcional]/f-[verbo]-[entidade]-[adjetivo].md` ou `f-[verbo]-[entidade].md` quando não houver adjetivo. Aqui `[agrupamento-funcional]` é o **nome exato da pasta do Agrupamento Funcional** — a mesma onde já vive o `README.md` do N2 (ver **DESTINO** abaixo); não invente outra pasta nem acrescente/remova prefixo. Exemplos com adjetivo: `f-cadastrar-fundo-gerido.md`, `f-pesquisar-fundo-gerido.md`, `f-pesquisar-fundo-alocado.md`. Exemplos sem adjetivo: `f-cadastrar-cliente.md`, `f-excluir-usuario.md`. O adjetivo evita colisão entre funcionalidades de Agrupamentos Funcionais distintos dentro do mesmo domínio. Nunca omita o prefixo `f-` nem use outro separador que não seja hífen. O **verbo** deve constar do vocabulário canônico de `engine/DEFINICAO-FUNCIONALIDADE.md` (a definição testável do que é uma funcionalidade); termo na posição do verbo que denuncia não-funcionalidade ("cadastro", "gestão", "painel", nominalizações como "aprovação") é **reprovado** pelo gate semântico, e verbo legítimo ainda não catalogado gera **aviso** — proponha adicioná-lo à tabela do DEFINICAO-FUNCIONALIDADE.

> **DESTINO DO ARQUIVO (obrigatório — não erre a pasta).** O N3 é gravado na **mesma pasta** do `README.md` do Agrupamento Funcional (o N2): `modules/[dominio]/[agrupamento-funcional]/`. **Localize** essa pasta pelo `modules/INDEX.md` / pelo N2 — **não a invente** nem crie uma paralela com nome diferente. O arquivo **nunca** vai para a raiz do repositório, `global/`, `engine/`, outro domínio ou outro Agrupamento Funcional. Se o Agrupamento Funcional ainda não tem pasta (bottom-up), crie-a com o **mesmo nome** que o N2 usa (ou usará) para o `README.md`. Em caso de dúvida sobre a pasta, **pergunte antes de gravar**.

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

=== NFR.md ===
[cole aqui o conteúdo do global/NFR.md — para rotear requisitos não-funcionais e evitar duplicação]

=== N1 DO DOMÍNIO *(opcional — omita se não existir ainda)* ===
[cole aqui o README.md do domínio]

=== N2 DO FUNCIONALIDADE SET *(opcional — omita se não existir ainda)* ===
[cole aqui o README.md do Agrupamento Funcional]

=== AIMM DO TICKET *(opcional — do PROMPT_AIMM)* ===
[cole aqui o conteúdo de analise-impacto/AIMM-<CHAVE>.md — a AIMM do ticket que
originou esta funcionalidade. Quando presente, registre a chave do ticket na seção
`## Origem` do N3, com o link da AIMM, e analise cada critério de aceite: ele vira
regra de negócio, cenário ou ambos.]

=== IDENTIFICAÇÃO MANUAL *(preencher apenas no fluxo bottom-up, quando N1/N2 não existem)* ===
Domínio: [nome do domínio]
Agrupamento Funcional: [nome do Agrupamento Funcional]
Funcionalidade(s) a especificar: [nome da funcionalidade — ou lista separada por vírgula]

---

## PASSO 0 — Preflight obrigatório de contexto

> **Não gere nada antes de concluir este passo.** Especificar sem verificar o que já existe foi a falha recorrente — elimine-a de forma sistemática.

1. Levante o **estado atual** de forma determinística (Claude Code / CLI):
   ```
   node scripts/preflight-spec.mjs [dominio] [agrupamento-funcional]
   ```
   Ele lista o N0, os domínios (N1), os Agrupamentos Funcionais (N2) e as Funcionalidades (N3) já existentes, com seus IDs e o **próximo NN livre** do Agrupamento Funcional. No modo copiar-colar (sem acesso ao disco), leia manualmente o `global/N0_PRODUCT_VISION.md`, o `modules/INDEX.md`, o N1 do domínio e o N2 do Agrupamento Funcional colados no contexto.

2. Apresente ao usuário o bloco **Contexto verificado** — antes de qualquer coleta ou geração:

   > **Contexto verificado**
   > - Domínio: `[SIGLA]` [existe? / novo] · Agrupamento Funcional: `[ID]` [existe? / novo] · próximo NN livre: `[SIGLA-SAF-NN]`
   > - Funcionalidades já existentes no Agrupamento Funcional: [lista de IDs] → esta funcionalidade **é nova** ou **já existe**?
   > - Regras/campos já canônicos aplicáveis: [FIELD/RULES-DICTIONARY: …] — **referenciar, não reescrever**
   > - Cabe no escopo do N0 e do N1? [sim / ⚠️ divergência: …]

3. Se a funcionalidade, o ID ou a pasta **já existem**, **não duplique**: confirme com o usuário se o caso é **edição** (PROMPT_4A) em vez de criação. Se o domínio/Agrupamento Funcional ainda não existe (bottom-up), sinalize antes de criar pasta nova.

Só avance para o PASSO 1 após apresentar o **Contexto verificado**.

---

## PASSO 1 — Detecção do modo e confirmação das funcionalidades

Verifique os insumos recebidos e bifurque:

---

### AIMM do ticket fornecida (se houver)

Se a **AIMM de um ticket** (`analise-impacto/AIMM-<CHAVE>.md`) foi colada no
contexto, o ticket é a **origem** desta funcionalidade. Antes de bifurcar entre Modo A/B:

- Registre a **chave do ticket** para preencher a seção `## Origem` do N3, com o
  link da AIMM.
- **Analise cada critério de aceite** e classifique-o — ele pode virar:
  - uma **regra de negócio**, se expressa uma **invariante** (*o quê* sempre vale);
  - um **`## Cenário`** (Gherkin), se descreve um **comportamento observável**
    (reaproveite o Given/When/Then quando já vier nesse formato);
  - **ambos** — a invariante vira regra; o comportamento que a exercita vira cenário.

  Isso garante o elo semântico ticket → spec (regra e/ou cenário), não só por ID.
- Confirme com o usuário se esta sessão cobre **um critério, vários ou todos**
  os do ticket (um ticket pode virar mais de uma funcionalidade — a `## Funcionalidades` da AIMM
  diz quais).

> "Esta funcionalidade tem origem no ticket **[STRYxxxxxxx]**. Vou registrá-lo na
> seção `## Origem` e desdobrar cada critério de aceite em regra de negócio,
> cenário ou ambos. Esta funcionalidade cobre [todos os critérios | os critérios N, M]
> do ticket?"

---

### Modo A — Top-down (N2 disponível)

Se o N2 foi fornecido, leia a tabela de Funcionalidades do N2 e extraia **exatamente**:
- O nome da funcionalidade (em **negrito**, dentro do link, na coluna "Funcionalidade" do N2)
- O ID já atribuído no formato `[SIGLA]-[SAF]-NN` (no N2 ele aparece em `<small>` ao lado do nome da funcionalidade)
- O nome do arquivo já definido (ex: `f-cadastrar-cliente.md` — é o link embutido no nome da funcionalidade, `[**Nome**](f-cadastrar-cliente.md)`)

**Não gere novos IDs nem novos nomes de arquivo** — use os que o N2 já define.
Se uma funcionalidade ainda não tiver ID, confirme sua posição na jornada e reserve-o no N2 com `node scripts/ids-n3.mjs modules/[dominio]/[agrupamento-funcional]/README.md` (modo seco; depois `--write`). Preserve IDs e reservas existentes; o N3 copia o ID atribuído pelo N2, não um número calculado pela ordem de geração. Arquivo ausente no N2 é uma lacuna a confirmar antes da reserva — ver `engine/N3-IDS.md`.

Pergunte:

> "Identifiquei as seguintes funcionalidades em **[Agrupamento Funcional]**:
>
> | Funcionalidade | ID | Arquivo |
> |---|---|---|
> | [nome exato do N2] | [SIGLA]-[SAF]-NN | [arquivo do N2] |
>
> Qual delas deseja especificar primeiro?"

---

### Modo B — Bottom-up (sem N2)

Se o N2 **não** foi fornecido, confronte os N3s e os IDs já usados. IDs existentes são imutáveis, inclusive os que já nasceram no fluxo bottom-up: a síntese via B2 conserva-os. Para uma funcionalidade ainda sem ID, confirme a jornada e registre primeiro a tabela Funcionalidades do N2, reservando IDs com `scripts/ids-n3.mjs` antes de escrever o N3 — ver `engine/N3-IDS.md`. Confirme:

> "Vou especificar a funcionalidade **[nome da funcionalidade]** do Agrupamento Funcional
> **[Agrupamento Funcional]** no domínio **[Domínio]**.
> ID reservado no agrupamento: **[SIGLA]-[SAF]-[NN]** — imutável; resumir as funcionalidades no agrupamento depois não o renumera.
>
> ⚠️ O contexto completo do domínio e do agrupamento ainda será consolidado. A tabela da jornada e as reservas do agrupamento são registradas antes de atribuir IDs novos; as demais informações coletadas servirão para resumir as funcionalidades no agrupamento e os agrupamentos no domínio, sem renumerar as identidades já usadas.
>
> Podemos começar?"

Em Modo B, ao longo dos blocos:
- Sempre que o usuário mencionar regras que pareçam valer para outras
  funcionalidades do mesmo Agrupamento Funcional, sinalize com:
  > "⚠️ Esta regra pode ser transversal ao Agrupamento Funcional — anote para
  > incluir no N2 quando for gerado via B2."
- Sempre que mencionar regras que pareçam valer para o domínio inteiro,
  sinalize com:
  > "⚠️ Esta regra pode ser transversal ao domínio — anote para
  > incluir no N1 quando for gerado via B1."

---

## PASSO 1.5 — Detecção de padrão CRUD

Antes de iniciar o PASSO 2, verifique se o nome da funcionalidade sugere uma
operação derivada de um cadastro:

- **Pesquisa / Listagem**: pesquisar, listar, consultar, buscar
- **Edição**: editar, alterar, atualizar
- **Exclusão**: excluir, remover, deletar, inativar, arquivar
- **Visualização**: visualizar, detalhar, exibir

Se o nome da funcionalidade se encaixar em algum desses padrões, pergunte:

> "Esta funcionalidade parece ser derivada de um cadastro existente.
> Já existe um N3 de **cadastro / inclusão** para este módulo?
> Se sim, cole o conteúdo aqui para que eu proponha os campos automaticamente."

Se o N3 de cadastro for fornecido, aplique as regras abaixo para a funcionalidade
em questão **antes** de entrar no PASSO 2. Informe ao usuário o que foi derivado
e peça apenas confirmação ou ajustes.

---

### Derivação para Pesquisa / Listagem

A partir dos campos do N3 de cadastro, proponha automaticamente:

**Filtros sugeridos** — mapeie por tipo de campo:
- Texto livre → filtro por correspondência parcial
- Lista de opções / enum → filtro por seleção (dropdown)
- Data → filtro por intervalo (De / Até)
- Sim/Não → filtro por seleção (todos / sim / não)
- Campos de identificação única (ex: CNPJ, código) → filtro por valor exato
- Campo que referencia outro cadastro (ex: Cliente, Gestor) → filtro por
  seleção que busca na entidade origem — ver "Campos de seleção" abaixo

**Colunas do resultado sugeridas** — inclua por padrão:
- O campo identificador único do cadastro
- Os campos de nome / descrição / razão social (quando existirem)
- Campos de status ou situação (quando existirem)
- No máximo 6 colunas — priorize os de maior valor para reconhecimento rápido

Apresente a proposta ao usuário:

> "Com base no cadastro, proponho:
>
> **Filtros:**
> | Campo | Tipo de filtro | Obrigatório |
> |---|---|---|
> | [campo] | [texto / seleção / intervalo] | não |
>
> **Colunas do resultado:**
> | Coluna | Origem |
> |---|---|
> | [campo] | cadastro |
>
> Algum filtro deve ser removido ou adicionado?
> Alguma coluna deve ser removida, adicionada ou reordenada?"

> **Persistência (obrigatório):** as colunas confirmadas viram a seção `## Colunas do resultado` no artefato (logo após `## Campos`), com a tabela `Coluna (Label PO) | Origem | Ordenação`. Não basta propor — tem de constar no `.md`. O validador **exige** essa seção para funcionalidades de pesquisa/listagem (`Pesquisar`/`Listar`/`Consultar`/`Buscar`).

Após confirmação, **pule o BLOCO B** no PASSO 2 — os campos já estão derivados.
Prossiga a partir do BLOCO C (Regras de negócio), focando nas regras
específicas da pesquisa (ex: carga inicial, ordenação padrão, limite de registros).

**Superfície sugerida:** pesquisa/listagem normalmente é **Tela própria** (a tela
de resultados). Confirme com o usuário e registre na seção `## Superfície`.

---

### Derivação para Edição

A partir dos campos do N3 de cadastro, proponha automaticamente:

- Todos os campos do cadastro, mantendo tipo, obrigatoriedade e validações
- O campo identificador único → **imutável** (chave de negócio, não editável) — coluna *Edição*
- Campos preenchidos automaticamente no cadastro → manter como automáticos

Apresente a proposta ao usuário:

> "Com base no cadastro, proponho o mesmo formulário com as seguintes diferenças:
>
> | Label PO | Edição | Tipo | Obrigatório |
> |---|---|---|---|
> | [identificador único] | ⚠️ imutável (não editável) | [tipo] | — |
> | [demais campos] | editável | [tipo] | [igual ao cadastro] |
>
> Algum campo adicional deve ser **somente leitura** ou **imutável** na edição? (coluna *Edição* do `## Campos`)
> Algum campo deve ser removido ou ter sua obrigatoriedade alterada?"

Após confirmação, **pule o BLOCO B** no PASSO 2 — os campos já estão derivados.
Prossiga a partir do BLOCO C (Regras de negócio), focando nas regras
específicas da edição (ex: restrições de edição por status; quem pode editar é a
matriz de permissões do N2, não regra do N3).

---

### Derivação para Exclusão

A partir do N3 de cadastro, proponha automaticamente:

- Identificação do registro pelo campo único do cadastro (somente leitura)
- Confirmação explícita do usuário antes de excluir (mensagem de confirmação)

Faça apenas as perguntas essenciais que a derivação não responde:

> "Com base no cadastro, proponho:
>
> - Exibir o registro identificado por [campo único] para confirmação
> - Solicitar confirmação explícita antes de excluir
>
> Preciso de mais duas informações:
>
> 1. A exclusão é **física** (remove do banco) ou **lógica**
>    (marca como inativo/excluído, mas mantém o registro)?
> 2. Este registro pode estar **vinculado** a outros no sistema?
>    Se sim, o que deve acontecer ao tentar excluir um registro com vínculos?"

Após as respostas, **pule os BLOCOs B e C** no PASSO 2 — campos e regras
principais já estão derivados. Passe diretamente ao BLOCO D (Cenários
alternativos), focando nos casos de erro e integridade.

**Superfície sugerida:** exclusão normalmente é **Ação em tela** — disparada da
listagem de resultados da pesquisa (ícone/botão na linha + caixa de diálogo de
confirmação), sem tela própria. Registre a funcionalidade/tela de origem na seção `## Superfície`.

---

### Campos de seleção (combobox que vem de outra funcionalidade)

Sempre que um campo — de cadastro **ou** de filtro — não for digitado livremente,
mas **escolhido a partir de registros de outra entidade** (ex: escolher um Cliente,
um Gestor, uma Categoria já cadastrada), trate-o como **campo de seleção**, não como
lista de opções fixas.

Diferencie:
- **Lista de opções fixa (enum)**: valores fechados e estáveis, definidos no código
  (ex: Tipo = FOF / Espelho). Tipo na tabela de campos: `lista (opção A, opção B)`.
- **Seleção de outra entidade (FK)**: as opções são registros vivos de outra funcionalidade
  e mudam conforme o cadastro. Tipo na tabela de campos: `seleção → [Entidade]`.

Para campos de seleção, registre na tabela de campos do N3 assim:

```markdown
| Gestor (filtro) | Gestor | entrada do usuário | editável | seleção → Gestor | não | carga: autocomplete por nome; apenas Gestores ativos |
```

- **Tipo** = `seleção → [Entidade origem]` (nome da entidade em português).
- **Validação** carrega o que é decisão de negócio desta funcionalidade:
  - **carga**: `lista completa` (poucas opções, carrega tudo) ou
    `autocomplete por [campo]` (muitas opções, busca conforme o usuário digita);
  - **filtro de origem**: quais registros podem aparecer (ex: "apenas ativos").
- O **mapeamento técnico** (campo-valor, campo-label, endpoint) **não** vai no N3 —
  fica no DATA-MODEL.md e é resolvido no PROMPT_3B. O N3 apenas aponta.

Pergunte ao usuário apenas o que a derivação não responde:

> "O campo **[campo]** é uma seleção que vem do cadastro de **[Entidade]**.
> 1. Deve carregar a lista completa ou buscar conforme o usuário digita?
> 2. Algum registro de [Entidade] deve ficar de fora (ex: apenas ativos)?"

---

## PASSO 2 — Coleta negocial por blocos

Para cada funcionalidade, percorra os blocos abaixo em ordem.
Apresente um bloco de cada vez e aguarde minhas respostas.

> **Nota:** Se o PASSO 1.5 derivou campos de um N3 de cadastro existente,
> os blocos marcados como "pulados" na derivação devem ser **omitidos**
> — não faça as perguntas correspondentes.

---

### BLOCO A — Visão geral
> 1. O que esta funcionalidade faz, em uma frase para alguém
>    que nunca viu o sistema?
> 2. Quem a aciona: usuário interno, externo ou o próprio sistema?

---

### BLOCO B — Campos em linguagem de negócio

> 3. Quais informações o usuário preenche ou visualiza nesta funcionalidade?
>    Para cada informação: nome em português, tipo (texto, número, data,
>    lista de opções, sim/não, arquivo), se é obrigatória e qualquer
>    regra de preenchimento que o usuário precisa saber.
>
> 3.1. **De onde vem cada informação?** Para cada campo, confirme a origem com o
>    usuário: **entrada do usuário**, **calculado** pelo sistema, **vem de uma
>    fonte externa** (outro sistema/API — ex.: Receita, Serpro, ServiceNow), ou
>    **exibido do cadastro** (já gravado, só mostrado — ficha de Visualizar, campo
>    somente leitura de Editar).
>    Se **externa**, pergunte explicitamente:
>    - **Qual é a fonte?** (nome de negócio do sistema)
>    - **Quando** o dado é consultado (a cada acesso? no preenchimento?) e se vale
>      um **último valor conhecido** (cache) ou precisa estar sempre atual.
>    - O que a funcionalidade faz **se a fonte estiver indisponível** — bloqueia,
>      segue em modo degradado, ou usa o valor anterior?
>    - O campo é **editável** pelo usuário ou **somente leitura**?
>
> 4. Existe alguma informação que o sistema preenche automaticamente?
>    Qual e quando?

Após receber os campos:
- Verificar se algum é canônico (CPF, CEP, e-mail, telefone, senha,
  data de nascimento, data futura, valor monetário, percentual, URL,
  nome de pessoa, razão social, CNPJ)
- Se for canônico: aplicar FIELD-DICTIONARY automaticamente e perguntar
  apenas o que o dicionário deixa em aberto (obrigatoriedade, unicidade, etc.)
- Se a opção for **escolhida a partir de outro cadastro** (ex: "seleciona um
  Cliente já cadastrado"): tratar como campo de seleção `seleção → [Entidade]`
  — ver "Campos de seleção" no PASSO 1.5
- Se não for canônico: registrar Label PO, tipo e validações informadas
- **Preenchimento de cada campo** (coluna *Preenchimento* da tabela `## Campos`): marque
  `entrada do usuário`, `calculado`, `externo: [Fonte]` ou `exibido do cadastro`
  (valor já gravado, só mostrado). Para todo campo
  **`externo:`**, além de marcar a origem:
  - registre um **`## Cenário`** para a **indisponibilidade da fonte** (o que o
    usuário vê) — a mecânica (endpoint, timeout, retry) fica no **3B**, não aqui;
  - se for **somente leitura**, prefira `## Campos automáticos` a `## Campos`.
- **Edição de cada campo** (coluna *Edição* da tabela `## Campos`): `editável`
  (padrão), `somente leitura` (exibido, não altera nesta funcionalidade) ou `imutável`
  (nunca muda após a criação — ex.: chave de negócio). Em **cadastro** tudo nasce
  `editável`; em **Edição** o identificador é `imutável` e a derivação do cadastro
  pergunta se há outros campos travados. Em funcionalidades de **editar/alterar/atualizar**
  a coluna é **obrigatória** (o validador reprova sem ela).
- **Entidade de cada campo** (coluna *Entidade* da tabela `## Campos`): nomeie, por
  **referência**, a entidade dona do campo — para rastrear campo→tabela (evolução,
  proveniência e leitura da APF), visível no Modo PO. Regra de preenchimento:
  - campo próprio da funcionalidade → a **entidade principal** (a do front-matter `entidade`);
    preencha-a por padrão, não pergunte quando for óbvio;
  - campo que pertence a **outra** entidade (ex.: dado de endereço num cadastro de
    cliente) → o nome dessa entidade;
  - campo de seleção (`seleção → [Entidade]`) → a **entidade origem**;
  - campo cuja lista é de **valores fixos**, sem cadastro por trás → `dado de código`
    (CPM 5.4.2d: não entra na conta de ALR). É a distinção que faz a contagem fechar —
    sem ela, uma combo de valores fixos e uma que lê uma entidade ficam idênticas;
  - campo `externo:` → `externo: [Sistema]`;
  - campo **calculado** → `derivado ↓` e detalhe a proveniência em `## Derivações`.
  > **Ambiguidade**: se um Label PO casar com atributo de **mais de uma entidade** no
  > `data-models/[dominio].md`, **não escolha em silêncio** — pergunte ao usuário a qual
  > entidade o campo pertence. Se a entidade citada ainda não existe no data-model,
  > sinalize `⚠️` e encaminhe à opção `DM` para criá-la antes de fechar o N3.
- **`## Derivações`** (só se houver campo `calculado`): para cada campo derivado,
  registre a **fórmula em Label PO** e os **campos-fonte com a respectiva entidade**
  (ex.: `Valor total | Quantidade × Preço unitário | Quantidade (Item), Preço unitário (Item)`).
  É de onde a APF lê as entidades-fonte que a transação referencia. Sem campo derivado,
  omita a seção.

---

### BLOCO C — Regras de negócio

> **Ao fechar as regras, pergunte-se: que entidade esta funcionalidade toca sem mostrar campo
> nenhum?** O registro de execução que recebe o status, o cronograma que define a janela
> válida, o painel entregue junto do dado. Toda entidade que aparecer nas regras e **não**
> estiver na coluna `Entidade` de `## Campos` vai para `## Dados lidos e gravados` — é o
> que sustenta o ALR da contagem, e é o que mais escapa na especificação.

> 5. Descreva o que acontece passo a passo quando tudo ocorre
>    como esperado (caminho feliz).
>
> 6. Existe alguma condição que impede ou altera o comportamento?
>
> 7. Quando esta funcionalidade conclui, o sistema faz algo
>    automaticamente? (e-mail, tarefa, notificação)
>
> 8. Esta ação precisa ficar registrada no histórico de auditoria?

Após receber as regras:
- **Atomicidade — uma regra, uma invariante**: ao montar `## Regras de negócio`,
  quebre regras compostas. Se a resposta liga condições independentes por
  "e" / "ou" / "além disso", separe em itens distintos — cada item deve carregar
  **uma única restrição verificável**. A reação do sistema ("não salva", "exibe
  mensagem") não é regra: vai para `## Cenários` (BLOCO D).
- **ID da regra — `RN-NN`**: cada item de `## Regras de negócio` começa por
  `**RN-NN** —`, sequencial na funcionalidade e nunca reaproveitado (a regra removida leva o
  número; a nova pega o próximo livre). Vale também para o item que só cita o
  RULES-DICTIONARY ou o N1. É por ele que o cenário, o SDD, o código e o teste citam a
  regra (fora do N3: `[SIGLA]-[SAF]-NN/RN-NN`).
- Verificar se alguma é canônica (maioridade, responsável ativo,
  período de vigência, aprovação antes de publicar, limite por organização,
  slug único público, reenvio com cooldown, arquivo com tamanho máximo,
  registro vinculado não pode ser excluído)
- Se for canônica: aplicar RULES-DICTIONARY e perguntar apenas os parâmetros
  que o dicionário deixa em aberto
- **Roteamento regra × NFR**: registre em `## Regras de negócio` apenas
  **invariantes de negócio** (o *que* a funcionalidade garante). Se a resposta trouxer
  uma **qualidade do sistema** — tempo de resposta, segurança, disponibilidade,
  auditoria, restrição técnica — ela é **não-funcional** e **não** entra como
  regra de negócio: pertence ao `global/NFR.md`. Se já houver NFR equivalente,
  ele é herdado e **não** se repete no N3; se for novo, sinalize:
  > "⚠️ Isto é um requisito não-funcional ([categoria]). Não entra nas regras
  > de negócio — proponho registrá-lo no NFR.md como [ID sugerido]. Confirma?"
- **Pergunta 8 (auditoria)**: se a ação precisa ficar auditada, isso é o NFR
  **AUD-01** (herdado) — não escreva "fica auditado" como regra de negócio.
  Registre o "sim/não" para que o PROMPT_3B preencha a seção `## AuditLog`
  (que apontará `→ ver NFR: AUD-01`).

---

### BLOCO D — Cenários alternativos
> 9. Quais erros o usuário pode cometer? Para cada erro: o que aconteceu
>    e qual mensagem deve ser exibida?
>
> 10. Pode ocorrer conflito com dados já existentes? O que acontece?
>
> 11. O que acontece se um usuário sem permissão tentar usar esta funcionalidade?
>     *(só a reação — mensagem e o que fica bloqueado; quem pode é a matriz do N2)*
>
> 12. Existe alguma situação especial no sistema que muda o comportamento?
>     (cadastro arquivado, período de carência, conta suspensa)

---

### BLOCO E — Interface / Execução

> 13. Como o ator usa esta funcionalidade: numa **tela** do sistema, por um
>     **comando** (terminal/CLI), como **execução automática** (agendada ou
>     disparada por evento/estágio de pipeline) ou como **operação consumida por
>     outro sistema**? *(No arquétipo `ml-dados`/`cli-biblioteca`, o padrão é
>     comando/execução — confirme em vez de assumir tela.)*

**Se a resposta for TELA**, siga com:

> 14. Onde esta funcionalidade aparece na tela?
>     (formulário, modal, botão em lista, página própria)
>
> 15. O que o usuário vê durante o processamento? E em caso de erro?
>     E quando não há dados?
>
> 16. Qual o retorno visual após a ação? (toast, redirect, relatório)

**Se a resposta for COMANDO / EXECUÇÃO AUTOMÁTICA / OPERAÇÃO CONSUMIDA**, siga com:

> 14. O que o ator informa para executar? (parâmetros/arquivo de configuração —
>     cada um vira campo de negócio) E o que precisa estar pronto antes?
>     (pré-condições: dados de entrada, ambiente)
>
> 15. Se a execução for interrompida no meio (falha, suspensão), o que acontece?
>     Retoma de onde parou? Reexecutar do zero é seguro ou duplica resultado?
>
> 16. O que a execução produz (artefatos, relatórios, registros), e como o ator
>     acompanha o andamento e sabe que terminou bem ou mal?

Com a resposta da pergunta 13, **classifique a funcionalidade na seção `## Superfície`**:
- Página/rota ou formulário dedicado → **Tela própria** (registre a rota).
- Janela aberta sobre outra tela, com conteúdo próprio — o detalhe de um registro, uma
  consulta ou um formulário que não é subformulário de outro → **Modal** (registre a
  funcionalidade/tela de origem). Como a Tela própria, é dona dos seus acessórios.
- Disparada de dentro de outra tela (botão/ícone em listagem, menu de contexto), no
  máximo com uma caixa de diálogo de confirmação ou alerta → **Ação em tela** (registre
  a funcionalidade/tela de origem). A caixa de diálogo não é Modal.
- Modal que é **subformulário** de outro formulário (os dados só são gravados com o
  registro-pai) não é N3: vai para o `## Comportamento de tela` e os `## Campos` da
  funcionalidade do pai (`DEFINICAO-FUNCIONALIDADE.md`, teste 5).
- Comando executado pelo ator → **CLI** (registre o comando em linguagem de negócio).
- Execução agendada/disparada por evento ou estágio anterior → **Job/Pipeline**
  (registre o gatilho).
- Operação exposta para outro sistema consumir → **API** (registre o consumidor;
  o contrato técnico vai para o `dev-only`/3B).

A seção `## Superfície` é o classificador escaneável — **o validador a usa para
exigir a seção de detalhamento certa**: Tela própria/Modal/Ação em tela → `## Comportamento
de tela`; CLI/Job/Pipeline/API → `## Execução e operação` (omita a outra). Quando uma
mesma tela atende várias funcionalidades, isso será consolidado na seção **Telas** do N2.
A `## Superfície` é negocial e **visível no Modo PO**, fora do `dev-only`. No N3 ela fica
logo antes da seção que decide (`## Comportamento de tela` ou `## Execução e operação`),
e a `## Origem` fica no fim, logo antes do `## Changelog` — o `validate-doc` confere a ordem.

---

## PASSO 3 — Geração do artefato negocial

Com as respostas de todos os blocos, gere:

📄 `modules/[dominio]/[agrupamento-funcional]/[arquivo-do-N2]` — **na mesma pasta do `README.md` do N2** (ver DESTINO acima; nunca na raiz, `global/`, `engine/` ou outro domínio). Usar o nome de arquivo **exatamente como definido** na tabela de Funcionalidades do N2 (Modo A), ou derivar do nome da funcionalidade em kebab-case (Modo B)

> **Nome da pasta do Agrupamento Funcional (obrigatório):** `[agrupamento-funcional]` é o **slug em kebab-case do nome do Agrupamento Funcional, SEM prefixo** — ex.: *Gestão de Fábricas* → `gestao-fabricas`; *Sistemas* → `sistemas`. **A pasta não leva prefixo** (nada de `g-`); só os **arquivos de funcionalidade** levam `f-`. O nome é também o segmento de rota (`/[dominio]/[agrupamento-funcional]`).

**Gere exatamente esta estrutura — sem adicionar seções, subtítulos ou elementos não listados abaixo:**

```
---
id: [ID do N2 — ex.: SIGLA-SAF-NN]
agrupamento_funcional: [SIGLA]-[SAF]
dominio: [SIGLA]
entidade: [Entidade principal]
data_model_ref: data-models/[dominio].md#[entidade]
endpoints: []
error_codes: []
depende_de: []
origem:                             # ticket de origem (plugável — ver MASTER.md); omitir se não houver
  tipo: [servicenow | issue | experimento]
  chave: [STRYxxxxxxx | ISSUE-NNN | EXP-…]
estado: rascunho
gates:
  requisitos:   { aprovado: false, por: "", em: "", pr: "" }
  modelo-dados: { aprovado: false, por: "", em: "", pr: "" }
  testes:       { aprovado: false, por: "", em: "", pr: "" }
  codigo:       { aprovado: false, por: "", em: "", pr: "" }
contagem:                           # status APF — independente dos gates; só o agente de contagem, fora do Docqui, marca false
  pendente: true
  revisada_em: ""
  revisada_ate: ""
---

# [Nome da Funcionalidade — exatamente como consta no N2]
> **Nível 3** - Agrupamento Funcional: [Nome do Agrupamento Funcional] — Domínio: [Nome do Domínio] - `[SIGLA]-[SAF]-[NN]`
<!-- Este é o CÓDIGO DA FUNCIONALIDADE (SIGLA do domínio + SAF do Agrupamento Funcional + NN sequencial da primeira jornada, ex.: `CAD-CLI-01`) — NÃO o ID do Agrupamento Funcional (`CAD-CLI`). Copie o código EXATO reservado no N2 (`<small>SIGLA-SAF-NN</small>`). IDs já usados no bottom-up são imutáveis; B2 não os renumera. Nunca omita o `-NN` nem recalcule a numeração pela ordem de geração. Ver engine/N3-IDS.md. -->

## Descrição
[1-2 frases de negócio que declaram a ENTREGA — única, tangível e negocial (DEFINICAO-FUNCIONALIDADE.md, FD-8). Fórmula: "Permite que [ator] [ação] [entidade], [resultado observável]." Sem "etc."/"de forma eficiente", sem termo técnico, sem repetir a descrição de outra funcionalidade]

[SEGUNDO PARÁGRAFO — COMO SE USA: uma ou duas frases de como se opera a funcionalidade (por onde se chega, o que se informa, o que se aciona) ou, em Job/CLI, do que dispara a execução. É a 2ª camada da descrição e mora aqui, não em seção própria. Só o 1º parágrafo é medido pelo FD-8. Ao citar um conjunto de opções, cite até três precedidas de "como…"]

---

## Regras de negócio

- **RN-01** — [Regra específica desta funcionalidade]
- **RN-02** — [Regra canônica] → ver RULES-DICTIONARY: [RC-NN] — [nome] (parâmetro: [valor])
- **RN-03** — [Regra de domínio] → ver N1 [Domínio]: Regras transversais de negócio: [N]

---

## Cenários

[bloco gherkin — ver formato abaixo]

---

## Campos

| Label PO | Entidade | Preenchimento | Edição | Tipo | Obrigatório | Validação |
|---|---|---|---|---|---|---|
| [nome em português] | [entidade dona / `dado de código` / `externo: [Sistema]` / `derivado ↓`] | [entrada do usuário / calculado / externo: [Fonte] / exibido do cadastro] | [editável / somente leitura / imutável] | [tipo] | sim/não/automático | [regra em linguagem natural] |
| [campo canônico] | [entidade principal] | entrada do usuário | editável | [tipo] | [obrig.] | → ver FIELD-DICTIONARY: [nome] |

---

## Derivações
<!-- Só quando houver campo com Preenchimento "calculado" (`derivado ↓` na coluna Entidade de `## Campos`): a fórmula em Label PO e os campos-fonte com a entidade de cada um — é daqui que a APF lê as entidades-fonte (ALR). Sem campo derivado, OMITA esta seção. -->

| Campo derivado | Fórmula (Label PO) | Campos-fonte (Entidade) |
|---|---|---|
| [campo] | [expressão em Label PO — ex.: Quantidade × Preço unitário] | [Campo A (Entidade X), Campo B (Entidade Y)] |

---

## Colunas do resultado
<!-- Apenas para funcionalidades de Pesquisa/Listagem — colunas exibidas em cada linha do resultado da busca. Em funcionalidades que NÃO são de busca, OMITA esta seção. -->

| Coluna (Label PO) | Origem | Ordenação |
|---|---|---|
| [campo exibido] | cadastro / entidade relacionada / derivado | padrão ↑ / ordenável / — |

---

## Campos automáticos

| Label PO | Valor | Quando |
|---|---|---|
| [campo] | [valor automático] | [quando é preenchido] |

---

## Dados lidos e gravados
<!-- Entidades que a funcionalidade lê ou grava SEM contribuir campo para a tela — as que `## Campos` não revela. Não repita entidade já presente na coluna `Entidade`. Se não houver nenhuma, OMITA esta seção. -->

| Entidade | Papel | Por que a funcionalidade a toca |
|---|---|---|
| [Entidade] | [lê / grava / lê e grava] | [o que a funcionalidade faz com ela — cite a regra/campo automático que a motiva] |

---

## Superfície

**[Tela própria | Modal | Ação em tela | CLI | Job/Pipeline | API]** — [tela própria: rota `/...` · modal: origem: [Funcionalidade/Tela] · ação em tela: origem: [Funcionalidade/Tela] · CLI: comando · Job/Pipeline: gatilho · API: consumidor]

**Fidelidade ao protótipo**: [obrigatória | referência | n/a] · [caminho do protótipo quando houver, ex.: `prototypes/[dominio]/[agrupamento-funcional]/[funcionalidade]/[estado].html`] · [[abrir o protótipo ↗](../../../prototypes/[dominio]/[agrupamento-funcional]/[funcionalidade]/[estado].html)]
<!-- obrigatória = a implementação deve reproduzir o protótipo (exige o caminho); referência (padrão) = protótipo guia, ajustes permitidos no Design System; n/a = sem tela/protótipo (padrão para CLI/Job/API). A fidelidade "obrigatória" é checada pelo validador. -->

---

## Comportamento de tela
<!-- Somente quando a Superfície é Tela própria/Modal/Ação em tela. Para CLI/Job/Pipeline/API, OMITA esta seção e gere "## Execução e operação" no lugar. -->

### Onde fica
[em qual rota e componente a funcionalidade aparece: página própria, modal, botão em listagem]

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
<!-- Somente quando a Superfície é CLI/Job/Pipeline/API (respostas 14–16 do BLOCO E). Para Tela própria/Modal/Ação em tela, OMITA esta seção. Linguagem negocial: flags/paths literais vão para o dev-only/3B. -->

### Como executa
[comando ou gatilho em linguagem de negócio + pré-condições relevantes (dados de entrada prontos, ambiente)]

### Parâmetros de execução

| Parâmetro (Label PO) | Obrigatório | Efeito |
|---|---|---|
| [parâmetro] | sim/não | [o que ele define na execução] |

### Interrupção e reexecução
[retoma do último ponto salvo? reexecução é segura (idempotente)? o que limpar antes de reexecutar?]

### Saídas e artefatos
[o que a execução produz e onde — referencie o data-model: → ver data-models/[dominio].md: [Artefato/Entidade]]

### Acompanhamento

| Situação | Como o ator percebe |
|---|---|
| Em andamento | [progresso/log de negócio/métrica] |
| Falha | [como é comunicada e onde ver o motivo] |
| Sucesso | [resultado observável ao terminar] |

---

## Critérios de sucesso

| # | Critério mensurável | Origem |
|---|---|---|
| SC-01 | [resultado observável e medível, em linguagem de negócio] | [cenário / → ver NFR: [ID] / negócio] |

---

## Origem
<!-- Incluir apenas se houver ticket de origem (ServiceNow, issue, experimento); senão, omitir a seção. -->

| Ticket (AIMM) | Tipo | Critérios cobertos |
|---|---|---|
| [`STRYxxxxxxx | ISSUE-NNN | EXP-…`](../../../analise-impacto/AIMM-[CHAVE].md) | Criação / Alteração | `CA-1, CA-4` — [o que esta funcionalidade realiza desses critérios] |

<!-- A célula abre com as referências `CA-n` quando o ticket numera os critérios
     (linha de Numeração da AIMM do ticket), seguidas de travessão e da prosa.
     Quando a fonte não numera, abra com `—` e deixe só a prosa. Nunca invente
     número: é ele que a contagem por sprint entrega ao cliente. -->

---

## Changelog

<!-- Ordem decrescente por data: a entrada mais recente fica sempre no topo, logo abaixo do cabeçalho. -->

| Data | Autor | Tipo | Descrição |
|---|---|---|---|
| 2026-10-20 | Docqui Caixa | Terminologia | Adoção de AIMM; histórico anterior preservado. |
| [data atual] | [Claude / autor] | Funcionalidade criada | N3 negocial gerado |

---

*Agrupamento Funcional: [Nome] · Domínio: [Nome] · Última revisão: —*

*Links: [N2 do Agrupamento Funcional](./README.md) · [N1 do domínio](../README.md) · [INDEX geral](../../INDEX.md)*
```

**Preenchimento dos `Critérios de sucesso`**: derive 1–3 critérios **mensuráveis** e
**agnósticos de tecnologia** a partir dos cenários e dos NFR herdados (consulte o
`NFR.md` no contexto). Não invente métricas — se a funcionalidade não tiver métrica própria,
referencie o NFR aplicável (`→ ver NFR: [ID]`). Apresente para confirmação do usuário.

**Formato do bloco Gherkin** (seção `## Cenários`) — os cinco grupos do template, nesta
ordem; grupo sem cenário aplicável fica de fora:
```gherkin
Feature: [Nome da funcionalidade em linguagem natural]

  Background:
    Given que o usuário está autenticado na organização "[org]"

  # ← FIELD-DICTIONARY: [nome do campo] (importar cenários de validação)
  # ← RULES-DICTIONARY: [RC-NN] — [nome da regra] (importar cenários)

  # ── Caminho feliz ──────────────────────────────────────────────

  @RN-01
  Scenario: [descrição]
    Given [estado inicial]
    When [ação]
    Then [resultado]

  # ── Erros de validação ─────────────────────────────────────────

  Scenario: [campo obrigatório ausente / formato inválido]
    When [o usuário deixa o campo "[Label PO]" vazio]
    Then o sistema exibe abaixo do campo: "[mensagem do catálogo]"

  # ── Conflitos com dados existentes ────────────────────────────

  Scenario: [duplicata ou conflito]
    Given que já existe [registro] com [dado conflitante]
    When o usuário tenta [ação]
    Then o sistema exibe: "[mensagem do catálogo]"

  # ── Restrições de acesso ───────────────────────────────────────

  Scenario: [usuário sem acesso a esta funcionalidade]
    Given que o perfil do usuário não tem acesso a "[Nome da funcionalidade]" na matriz do N2
    When o usuário tenta [ação]
    Then o sistema exibe: "[texto de NO_PERMISSION no MESSAGE-DICTIONARY]"

  # ── Estados especiais ──────────────────────────────────────────

  Scenario: [situação especial do sistema]
    Given que [estado especial]
    When o usuário tenta [ação]
    Then [comportamento alterado]
```

Após apresentar, pergunte:
> "O N3 negocial de [funcionalidade] está correto do ponto de vista de negócio?
> Ajusta algo ou avanço para a próxima funcionalidade?"

---

## PASSO 3.5 — Fechar o elo recíproco (ticket ↔ funcionalidade)

> Execute este passo **somente se a funcionalidade tem origem num ticket** (a seção
> `## Origem` foi preenchida no PASSO 3). O elo ticket ↔ funcionalidade é **M:N** e
> precisa ficar registrado nos **três lugares** — senão o caminho inverso
> ("quais funcionalidades este ticket impactou?") fica incompleto. A `## Origem` é só
> o lado funcionalidade → ticket; os outros dois precisam ser atualizados na mesma passada.

Após o N3 ser aprovado, atualize:

**1. AIM do ticket — `analise-impacto/AIM-<CHAVE>.md`**
Na seção `## Funcionalidades`, adicione (ou atualize) a linha desta funcionalidade — espelho
exato da `## Origem` do N3. Se o roteamento a deixou proposta (*(a confirmar no 3A)*,
Status **📋 A especificar**), confirme o ID e o caminho, tire a marca e troque o Status
pelo do N3 — com o N3 criado, o `audit-trace-links` volta a cobrar o elo inteiro:

```markdown
| [`[ID]`: Nome da Funcionalidade](../modules/[dominio]/[agrupamento-funcional]/[arquivo].md) | [Domínio] · [Agrupamento Funcional] | Criação | `CA-1, CA-3` | ✏️ Rascunho |
```

A coluna Status espelha o `estado` do front-matter, com o ícone da legenda do
`INDEX.md`: um N3 recém-gerado é **✏️ Rascunho** até o CP1. Nunca escreva um status
adiantado (📋 *especificado* exige CP1+CP2+CP3 aprovados na esteira).

Acrescente também uma linha **no topo** do Changelog da AIM ("Funcionalidade especificada")
— mantendo o Changelog em ordem decrescente por data.

**2. Índice consolidado — `modules/INDEX.md`**
Na tabela `## Rastreabilidade: ticket → spec → código`, adicione uma linha por
par ticket↔funcionalidade (se ainda não existir), com o **Status** igual ao da AIM
(✏️ Rascunho) e a coluna **Contagem** = 📋 — a contagem nasce pendente, para o agente de contagem (PASSO 3.6):

```markdown
| [`STRYxxxxxxx`](../analise-impacto/AIM-[CHAVE].md) | [[ID]: Nome](./[dominio]/[agrupamento-funcional]/[arquivo].md) | [Domínio] | ✏️ Rascunho | 📋 | — | — | — |
```

**No Claude Code (com ferramentas de arquivo):** edite os dois arquivos direto no
disco, na mesma passada da geração do N3 — não peça para o usuário colar conteúdo.
**No fluxo copy-paste:** apresente os dois blocos como patch para o usuário aplicar.

Confirme ao final:
> "Elo recíproco fechado: a funcionalidade consta na `## Origem` do N3, na
> `## Funcionalidades` da AIM `[STRYxxxxxxx]` e no `INDEX.md`. O caminho
> inverso ticket → funcionalidades está rastreável.
> 💡 Para conferir todos os vínculos entre tickets e funcionalidades de uma vez (e achar os de um lado só), é só pedir."

---

## PASSO 3.6 — Registrar a funcionalidade nova: contagem pendente e esteira

> Execute este passo **sempre** — com ou sem ticket de origem. Toda funcionalidade nasce
> sem contagem revisada: quem conta é o agente de contagem, fora do Docqui, a partir das
> funcionalidades com `contagem.pendente: true` no front-matter.

Após o N3 ser aprovado, na mesma passada:

1. **Front-matter**: confira `contagem.pendente: true` (já vem do esqueleto do PASSO 3),
   com `revisada_em` e `revisada_ate` vazios.
2. **`modules/INDEX.md`**: se a funcionalidade tem linha na tabela de rastreabilidade (PASSO
   3.5), a coluna **Contagem** = 📋.
3. **Espelho da esteira**: rode `python3 scripts/gates.py promote --write` — a funcionalidade
   entra na seção *Esteira de checkpoints* do `modules/INDEX.md` como ✏️ rascunho — e
   inclua o `INDEX.md` no mesmo PR: o `gate-check` da instância reprova o PR com o
   espelho defasado.

Não toque nos gates nem em `estado`, e não conte aqui: quem conta e marca a contagem
revisada é o agente de contagem, fora do Docqui. O `estado` avança pelos gates, um PR por checkpoint (CP1 = aprovação do
PO sobre este N3).

---

## PASSO 4 — Confirmação de cobertura

Após todas as funcionalidades aprovadas, bifurque conforme o modo da sessão:

**Modo A (top-down):**
> "Parte negocial do N3 concluída para todas as funcionalidades de [Agrupamento Funcional].
> Para complementar com a parte técnica e atualizar o DATA-MODEL.md,
> o próximo passo é o detalhamento técnico de cada funcionalidade, com cada .md gerado aqui como contexto."

**Modo B (bottom-up):**
> "Parte negocial do N3 concluída para todas as funcionalidades de [Agrupamento Funcional].
>
> **Próximos passos recomendados:**
> 1. Detalhamento técnico de cada funcionalidade
> 2. Com funcionalidades suficientes, resumir as funcionalidades no agrupamento
> 3. Com os agrupamentos prontos, resumir os agrupamentos no domínio
> 4. Procurar regras repetidas ou conflitantes entre as funcionalidades especificadas"

---

## Checklist de conformidade do N3

Antes de apresentar cada funcionalidade, confira (todos os itens são obrigatórios):

- [ ] Título `# [Nome da Funcionalidade]` (exatamente como no N2) + subtítulo `> **Nível 3** - Agrupamento Funcional: [Nome] — Domínio: [Nome] - [SIGLA]-[SAF]-NN` (o **código da funcionalidade** em crase, com o `-NN` — nunca só o ID do Agrupamento Funcional)
- [ ] `## Origem` presente **somente** se houver ticket de origem — ServiceNow, issue, experimento (senão, omitir a seção), com o link da AIM do ticket
- [ ] `## Superfície`: **Tela própria** (rota `/...`) · **Modal** (funcionalidade/tela de origem) · **Ação em tela** (funcionalidade/tela de origem) · **CLI** (comando) · **Job/Pipeline** (gatilho) · **API** (consumidor)
- [ ] `## Descrição`: **dois parágrafos** — 1º declara a **entrega** (única, tangível, negocial; 1-2 frases; sem placeholder, termos vagos "etc."/"de forma eficiente" ou técnicos, sem duplicar a descrição de outro N3 — é o que o FD-8 mede) · 2º é o **como se usa** (por onde se chega, o que se informa, o que se aciona; em Job/CLI, o que dispara)
- [ ] `## Regras de negócio`: itens **atômicos** (uma invariante cada); a reação do sistema e o texto da mensagem **não** entram aqui (vão para Cenários); canônicas como `→ ver RULES-DICTIONARY: [RC-NN] — [nome]`; **todo item com `**RN-NN** —`**
- [ ] `## Cenários`: Gherkin com os grupos (Caminho feliz · Erros de validação · Conflitos com dados existentes · Restrições de acesso · Estados especiais), em Label PO, com os marcadores de importação dos canônicos; **toda regra com ao menos um cenário marcado `@RN-NN`** na linha acima do `Scenario:` (`node scripts/valida-regras-cenarios.mjs <N3>`)
- [ ] Front-matter com o bloco `contagem` (`pendente: true`, `revisada_em` e `revisada_ate` vazios) e o PASSO 3.6 feito (a funcionalidade no espelho da esteira, como ✏️ rascunho)
- [ ] `## Campos`: 7 colunas (Label PO | Entidade | Preenchimento | Edição | Tipo | Obrigatório | Validação) — **apenas Label PO** (nunca Label Dev nem campo banco); **Entidade** em todo campo (`dado de código` para lista de valores fixos); canônicos como `→ ver FIELD-DICTIONARY: [nome]`
- [ ] `## Derivações` presente se houver campo `derivado ↓` (fórmula em Label PO + campos-fonte com a entidade)
- [ ] `## Colunas do resultado` presente em funcionalidade de pesquisa/listagem
- [ ] `## Campos automáticos`: 3 colunas (Label PO | Valor | Quando)
- [ ] `## Dados lidos e gravados` presente se a funcionalidade toca entidade que não aparece na coluna `Entidade` de `## Campos`
- [ ] `## Critérios de sucesso`: 1–3 critérios mensuráveis (`SC-##`), agnósticos de tecnologia
- [ ] Seção de manifestação conforme a Superfície: **Tela própria/Modal/Ação em tela** → `## Comportamento de tela` · **CLI/Job/Pipeline/API** → `## Execução e operação` (nunca as duas) + `## Changelog`
- [ ] **Nenhuma regra** de permissão nem lista de perfis no N3 — quem pode vive na matriz do N2; o grupo **Restrições de acesso** descreve só a reação do sistema, com a mensagem do catálogo. NFR **não** vira regra de negócio
- [ ] Campos novos (não canônicos) sinalizados para o **data-model** com ⚠️ — nunca inventados no N3
- [ ] **Nenhuma** seção técnica (API, eventos, AuditLog, mapeamento de campos) — isso é o **PROMPT_3B**

> **Gate determinístico de autovalidação (obrigatório — F2)** — após gravar o N3, rode:
> ```
> node scripts/validate-doc.mjs <arquivo>
> node scripts/valida-semantica-funcionalidade.mjs <arquivo>
> ```
> O primeiro (estrutura) exige as seções obrigatórias do N3 (Descrição, Superfície,
> Regras de negócio, Cenários, Campos, Campos automáticos, Changelog, e — conforme a
> Superfície — Comportamento de tela **ou** Execução e operação), **reprova** seção fora da
> ordem do template e **reprova** se a tabela `## Campos` vazar camada técnica (Label Dev / campo banco). O segundo (semântico) verifica se o artefato **é mesmo uma funcionalidade**
> segundo a definição canônica (`engine/DEFINICAO-FUNCIONALIDADE.md`, critérios FD-1…FD-9 —
> os FD-10…FD-12 também rodam, como avisos de contagem que não reprovam):
> verbo no infinitivo catalogado, título com a mesma ação, atomicidade (um verbo só),
> nenhum termo de agrupador/nominalização/NFR na posição do verbo, todo cenário com
> `Então/Then`, regras sem cauda de reação e Descrição declarando a entrega (sem
> placeholder, sem termos vagos/técnicos, sem duplicar a descrição de outro N3).
>
> Se algum validador **reprovar**: **apresente os desvios apontados**, **corrija o arquivo** e
> **rode de novo** — repita até ambos saírem `✓` (código 0). **Nunca** declare a funcionalidade concluída
> com um validador reprovando. Se você produziu algo fora do que este prompt define, o
> caminho é **corrigir para o padrão**, não seguir adiante.
>
> No Claude Code estes gates são **automáticos e model-agnostic**: o hook `PostToolUse`
> (`scripts/hooks/spec-guard.mjs`) roda os dois validadores a cada gravação e devolve os
> desvios para correção — vale para qualquer modelo (Haiku, Sonnet, etc.).
