# PROMPT 2A — N2 Negócio
## Agrupamentos Funcionais · Parte negocial

> **Modelo de estrutura**: `engine/templates/modules/_template-dominio/_template-agrupamento-funcional/README.md` *(referência humana — o prompt já embute o esqueleto)*
> **Quem participa**: PO + dev (ou só PO)
> **Insumo necessário**: N1 completo do domínio escolhido
> **Entrega**: rascunho do README.md de cada Agrupamento Funcional com fluxo
> principal, telas e permissões — sem campos técnicos ou endpoints
>
> **Pré-requisito**: PROMPT_1B concluído para o domínio escolhido
> **Próximo passo**: após aprovação, usar PROMPT_3A para especificar as funcionalidades (o N2 é integralmente negocial — sem passada técnica)

---

## INSTRUÇÕES PARA O CLAUDE

> **Protocolo obrigatório desta sessão (F1 preflight · F2 autovalidação):**
> 1. **Antes de gerar** — rode `node scripts/preflight-spec.mjs [dominio] [agrupamento-funcional]` (ou, sem disco, leia o N0 + `modules/INDEX.md` + o N1/N2 pertinentes) e apresente um bloco **"Contexto verificado"**: o que já existe, IDs tomados, próximo NN livre, regras/campos já canônicos a **referenciar** (não reescrever). Não duplique ID/pasta/regra/campo existente.
> 2. **Ao montar a tabela `## Funcionalidades`** — cada linha precisa passar nos cinco testes de
>    `engine/DEFINICAO-FUNCIONALIDADE.md` (§ Definição): uma ação · de negócio · um ator executa ·
>    começo-meio-fim · resultado observável. Em dúvida se algo é **funcionalidade** ou **campo da
>    funcionalidade-pai**, aplique o teste do "pronto": *o item é gravado por si, ou só quando o
>    registro-pai é salvo?* Gravação própria → funcionalidade. Salvo junto com o pai → campo.
>    **Nunca** use diferença de permissão como critério: permissão é consequência de a
>    funcionalidade existir (`global/AUTHZ.md` da instância), nunca a razão de ela existir.
> 3. **Depois de gravar** — rode `node scripts/validate-doc.mjs <arquivo>`; se reprovar, **apresente os desvios, corrija e repita até `✓`**. Nunca conclua com o validador reprovando.
> *(No Claude Code os hooks em `.claude/settings.json` já enforçam isso automaticamente.)*

Você vai detalhar os Agrupamentos Funcionais de um domínio do ponto de vista de negócio.
Foque em fluxos, jornadas e regras — sem mencionar endpoints, FKs ou libs.

Regras da sessão:
- Trabalhe um Agrupamento Funcional de cada vez, na ordem que eu indicar.
- Ao completar as perguntas de um Agrupamento Funcional, gere o artefato parcial
  e aguarde aprovação antes de iniciar o próximo.
- Sinalize suposições com ⚠️.

---

## CONTEXTO DO PROJETO

=== MASTER.md ===
[cole aqui o conteúdo do MASTER.md]

=== N1 DO DOMÍNIO ESCOLHIDO ===
[cole aqui o README.md completo do domínio]

---

## PASSO 1 — Confirmação dos Agrupamentos Funcionais

Leia o N1, identifique a sigla do domínio (ID do N1) e os Agrupamentos Funcionais. **O ID de cada
Agrupamento Funcional (`[SIGLA]-[SAF]`) já vem definido no N1** — use-o como está, **não gere
outro**. Caso o N1 esteja desatualizado e algum Agrupamento Funcional não tenha ID (ou não conste),
atribua uma sigla de 3 letras maiúsculas única no domínio e proponha incluí-la no N1
(PASSO 3). Pergunte:

> "Identifiquei os seguintes Agrupamentos Funcionais no domínio **[nome]** (`[SIGLA]`):
>
> | Agrupamento Funcional | ID |
> |---|---|
> | [Nome] | [SIGLA]-[SAF] |
> | [Nome] | [SIGLA]-[SAF] |
>
> Qual deles deseja detalhar primeiro?"

Aguarde minha escolha antes de prosseguir.

---

## PASSO 2 — Detalhamento negocial de cada Agrupamento Funcional

Para cada Agrupamento Funcional que eu indicar, faça as perguntas abaixo
em sequência, uma de cada vez, aguardando minha resposta:

**Pergunta 1 — Funcionalidades**
> "Quais são as funcionalidades individuais deste grupo?
> Para cada uma: nome e uma linha do que o usuário consegue fazer."

**Pergunta 2 — Jornada principal**
> "Descreva a jornada principal do usuário dentro deste grupo,
> do início ao fim, em linguagem natural.
> O que ele faz primeiro? O que acontece depois? Como termina?"

**Pergunta 3 — Dependências entre funcionalidades**
> "Alguma funcionalidade depende de outra para existir ou funcionar?
> Existe alguma ordem obrigatória ou exclusão mútua entre elas?"

**Pergunta 4 — Telas**
> "Quais telas o usuário vai ver neste grupo de funcionalidades?
> Para cada tela: nome, o que ela mostra e quais funcionalidades ela atende."

**Pergunta 5 — Permissões (fonte única do projeto)**
> "Quem pode usar este grupo de funcionalidades?
> Liste os **perfis** de usuário envolvidos e, para **cada funcionalidade/ação** do
> Agrupamento Funcional (pesquisar, cadastrar, editar, excluir, importar, visualizar…),
> diga **quais perfis podem executá-la**.
> Descreva em linguagem de negócio — sem mencionar nomes técnicos de roles.
> Esta é a **única** definição de permissões do projeto: perfis e permissões
> vivem **só no N2** — os N3 das funcionalidades não repetem esta matriz (descrevem só
> o que o sistema faz quando alguém sem acesso tenta a ação)."

Com as respostas, gere o artefato parcial:

📄 `modules/[dominio]/[agrupamento-funcional]/README.md` — seções negociais

> **Nome da pasta do Agrupamento Funcional (obrigatório):** `[agrupamento-funcional]` é o **slug em kebab-case do nome do Agrupamento Funcional, SEM prefixo** — ex.: *Gestão de Fábricas* → `gestao-fabricas`; *Sistemas* → `sistemas`. **A pasta não leva prefixo** (nada de `g-`); só os **arquivos de funcionalidade** levam `f-`. O nome é também o segmento de rota (`/[dominio]/[agrupamento-funcional]`).

> ### Contrato estrutural (vinculante — verificado por `scripts/validate-doc.mjs`)
>
> O N2 tem **exatamente estas 7 seções `##`, nesta ordem, e nenhuma outra**:
> `## Descrição` · `## Funcionalidades` · `## Fluxo Principal` · `## Dependências entre funcionalidades` · `## Telas` · `## Permissões por perfil` · `## Changelog`.
>
> **Arquétipo do produto** (`global/MASTER.md` → "Arquétipo"): em `ml-dados` e
> `cli-biblioteca` (produto sem UI), `## Telas` e `## Permissões por perfil` são
> **opcionais** — omita-as quando não houver tela nem matriz de perfil (o validador
> aceita a omissão nesses arquétipos). As demais seções e a ordem não mudam.
>
> **MUST**
> - Título `# Agrupamento Funcional: [Nome]` e subtítulo `> **Nível 2** - Domínio: [Nome] - ` + ID em crase (hífens `-`, sem em-dash).
> - Nome da Funcionalidade **sempre** com o link do N3 embutido — `[**Nome**](f-….md) <small>SIGLA-SAF-NN</small>` (link envolve o negrito, nunca o inverso) — nunca texto puro nem link separado em coluna própria.
> - Fluxo Principal: bloco `mermaid` `flowchart TD` **acíclico nas setas comuns** — toda seta avança até o nó final; ramos de decisão convergem para frente. **Única exceção**: retorno de **processo iterativo** anotado como `-.->|itera: motivo|` (ver Regra do Fluxo principal).
>
> **MUST NOT**
> - Acrescentar **qualquer** seção, subtítulo ou tabela fora da lista de 7 acima (ex.: "Categorias", "Tipos", "Naturezas", "Regras de negócio", "Campos"). Informação de categoria/tipo/natureza de uma entidade vai na **Descrição** ou em **Dependências entre funcionalidades** — nunca em seção própria.
> - Setas de retorno no Mermaid **sem a anotação `itera`** (loop acidental, "voltar", reabrir etapa já percorrida): isso é fluxo alternativo e vive no N3, não no N2.
> - Duplicar Label Dev, campo banco, endpoints ou FKs (pertencem ao N3 / data-model).

**Gere exatamente esta estrutura — sem adicionar seções, subtítulos ou elementos não listados abaixo:**

```
# Agrupamento Funcional: [Nome do Agrupamento Funcional]
> **Nível 2** - Domínio: [Nome do Domínio] - `[SIGLA]-[SAF]`

## Descrição
[2-3 frases sobre o que faz]

**Não faz**: [o que está fora do escopo]

---

## Funcionalidades

| Funcionalidade | Descrição |
|---|---|
| [**Nome da Funcionalidade**](f-[verbo]-[entidade].md) <small>[SIGLA]-[SAF]-NN</small> | [descrição em uma linha] |

---

## Fluxo Principal

[diagrama Mermaid — ver "Regra do Fluxo principal" abaixo. O diagrama é a única
representação do fluxo: nada de lista numerada depois dele]

---

## Dependências entre funcionalidades

[lista descrevendo pré-requisitos e relações entre funcionalidades]

---

## Telas

| Tela | Rota sugerida | Funcionalidades atendidas | Descrição |
|---|---|---|---|
| [nome] | `/[rota]` | **[Nome da Funcionalidade]** <small>[SIGLA]-[SAF]-NN</small> | [descrição] |

---

## Permissões por perfil

> **Fonte única de permissões** deste Agrupamento Funcional. As funcionalidades (N3) não tratam de
> perfis nem permissões — qualquer acesso novo ou diferente entra nesta matriz.

Perfis: **[Perfil A]**, **[Perfil B]**, **[Perfil C]**.

| Perfil | [Ação 1] | [Ação 2] | [Ação 3] |
|---|---|---|---|
| **[Perfil A]** | ✓ | ✓ | ✓ |
| **[Perfil B]** | ✓ | — | ✓ |
| **[Perfil C]** | ✓ | — | — |

* **[Perfil A]** — [nível de acesso em uma linha].

---

## Changelog

<!-- Ordem decrescente por data: a entrada mais recente fica sempre no topo, logo abaixo do cabeçalho. -->

| Data | Autor | Tipo | Descrição |
|---|---|---|---|
| [data atual] | [Claude / autor] | N2 criado | Gerado pelo PROMPT 2A |

---

*Links: [N1 [Nome do Domínio]](../README.md) · [INDEX geral](../../INDEX.md)*
```

> **Regra da Descrição** — Escreva 2–3 frases em **linguagem de negócio pura**, cada
> parágrafo em **uma única linha contínua** (sem quebras internas). Comece pela
> **capacidade que o conjunto entrega ao usuário** — o Agrupamento Funcional *agrupa operações*.
> Em ordem de preferência: **1) "Reúne as operações de…"** (estruturalmente exato: um
> conjunto reúne operações, já antecipando as funcionalidades); **2) "Agrupa as funcionalidades
> que permitem…"**; **3) "Permite ao [perfil] …"** (quando o destaque é o valor para o
> perfil). **Não use** verbos de domínio (*Responde por, Concentra*) — confundem o nível.
> Ordene as frases assim: (1ª) quais operações reúne, já antecipando as funcionalidades · (2ª) o
> que isso permite ao perfil. A linha `**Não faz**:` delimita o escopo negativo do conjunto.
> Exemplo (Agrupamento Funcional **Cadastro de Clientes** `CLI-CAD`):
> ```
> ## Descrição
> Reúne as operações de manutenção do cadastro de clientes: incluir, pesquisar, editar, visualizar e desativar um cliente. Permite ao operador manter os dados cadastrais sempre atualizados a partir de uma única área do sistema.
>
> **Não faz**: análise de crédito, faturamento ou histórico de compras do cliente.
> ```

> **Regra do Fluxo principal** — O fluxo principal **sempre** deve ser gerado
> como um diagrama **Mermaid** (bloco ` ```mermaid `), usando `flowchart TD`.
> Não use ASCII art, lista numerada ou texto corrido para o fluxo.
> O diagrama é a **única** representação do fluxo: **não** o acompanhe de uma
> lista numerada, passo a passo ou descrição textual reexplicando os nós — a
> seção termina no próprio bloco Mermaid.
> **Sem caminho de volta — fluxo sempre para frente.** O fluxo principal é a
> **jornada de sucesso (happy path)** e deve **progredir do ponto de entrada até o
> nó terminal sem nenhuma seta que retorne a uma etapa anterior**: nada de loops,
> "voltar", "corrigir e tentar de novo" ou reabrir um passo já percorrido. Os ramos
> de uma decisão (`{"...?"}`) podem **divergir**, mas todas as setas **avançam em
> direção ao fim** e os ramos **convergem para frente** — nunca apontam de volta
> para um nó acima. Situações de retorno (cancelar, voltar à tela anterior,
> reeditar, validação que devolve ao formulário) são **fluxos alternativos/de
> exceção** e vivem no **N3 da funcionalidade**, não no fluxo principal do N2.
> **Exceção única — iteração anotada.** Quando a jornada do Agrupamento Funcional é um
> **processo genuinamente iterativo** (comum no arquétipo `ml-dados`: treinar →
> avaliar → ajustar → treinar de novo), o retorno **faz parte do happy path** e
> pode ser representado — mas **somente** como aresta **tracejada e rotulada com
> `itera`**: `-.->|itera: motivo|` (ex.: `E -.->|itera: ajustar configuração| B`).
> O validador ignora arestas `itera` no teste de aciclicidade e segue reprovando
> qualquer outra seta de volta. Não use a anotação para contornar retorno de
> exceção (validação que devolve ao formulário continua sendo N3).
> Converta a jornada descrita na Pergunta 2 em nós e setas:
> - Ponto de entrada e resultado final como nós de terminal: `(["texto"])`
> - Etapas/funcionalidades como nós de processo: `["texto"]`
> - Decisões como losangos: `{"texto?"}` com setas rotuladas (`-->|Sim|`, `-->|Não|`)
> - Use rótulos em linguagem de negócio (sem endpoints, FKs ou nomes técnicos).
> - **Envolva o texto dos NÓS em aspas duplas** (`["texto"]`, `(["texto"])`,
>   `{"texto?"}`) — sem aspas, caracteres como `'`, `?`, `,` e `()` quebram o
>   parser ("Syntax error in text").
> - **Rótulos de seta (`-->|texto|`) ficam SEM aspas** e sem `/`, `(` ou `)`
>   (use "e"/"ou" no lugar da barra). Não use parênteses dentro de um nó já
>   delimitado por `()`.
>
> Exemplo:
> ```mermaid
> flowchart TD
>     A(["Usuário abre o chamado"]) --> B["Registrar incidente"]
>     B --> C{"Tem anexo?"}
>     C -->|Sim| D["Anexar arquivo"]
>     C -->|Não| E["Classificar prioridade"]
>     D --> E
>     E --> F(["Chamado aberto"])
> ```
> - **Não use `\n` dentro de um nó** — quebra o parser. Mantenha o rótulo curto.

> **Regra dos IDs de funcionalidade** — Só a primeira atribuição segue a jornada confirmada na ordem da tabela `## Funcionalidades`. Antes de escrever N3s, rode `node scripts/ids-n3.mjs modules/[dominio]/[agrupamento-funcional]/README.md` (modo seco) e, conferido, `--write`. Preserve qualquer ID existente no N2/N3, mesmo fora da ordem atual; novas funcionalidades continuam após o maior reservado, sem reutilizar lacunas. Ao regenerar o N2, preserve o registro `docqui:n3-ids`. O ID é imutável, não uma posição da jornada — ver `engine/N3-IDS.md`.
> Na tabela **Funcionalidades**, renderize
> **sempre** como `[**Nome da Funcionalidade**](f-….md) <small>[SIGLA]-[SAF]-NN</small>`
> (link do N3 envolvendo o negrito + ID em `<small>` ao lado — nunca `**[Nome](...)**`,
> que quebra a extração automática do nome). Na coluna **Funcionalidades atendidas** das
> **Telas** (só referência cruzada, sem link) use `**Nome da Funcionalidade** <small>[SIGLA]-[SAF]-NN</small>`
> (múltiplas separadas por `<br>`). Nunca use o formato `**ID**: Nome` nem uma coluna
> de ID ou de arquivo separada.

> **Regra das Permissões** — A seção `## Permissões por perfil` é **sempre** a
> **matriz** perfis (linhas) × ações/funcionalidades (colunas), precedida da nota de fonte
> única e da linha `Perfis: ...`. Células: `✓` (pode) e `—` (não pode). Detalhes vão em
> bullets **após** a tabela. Nunca use lista solta ou texto corrido.

> **Conformidade estrutural (não desvie)** — O título é **sempre** `# Agrupamento Funcional:
> [Nome]`; o subtítulo é a linha de blockquote exata (hífens `-`, `Domínio: [Nome]`, ID
> em crase) — não use em-dash, não escreva "Agrupamento Funcional" no lugar do domínio nem
> adicione linhas `> **Domínio**`/`> **Artefato**`. **Não inclua** as seções
> `## Regras de negócio` nem `## Campos` no N2: regras que valem para o Agrupamento Funcional
> inteiro vão para as **Regras transversais do N1**; regras e campos de uma funcionalidade vão
> para o **N3**; campos físicos, para o **data-model**. Use os títulos e o casing exatos
> (`## Fluxo Principal`). Todas as seções são obrigatórias — não omita **Telas** nem
> **Dependências entre funcionalidades** — exceto nos arquétipos `ml-dados`/`cli-biblioteca`,
> onde **Telas** e **Permissões por perfil** podem ser omitidas se o Agrupamento Funcional não
> tiver UI (mantendo a ordem das demais).

Após apresentar, pergunte:
> "O N2 de [Agrupamento Funcional] está correto?
> Ajusta algo ou avanço para o próximo Agrupamento Funcional?"

Repita o Passo 2 para cada Agrupamento Funcional que eu indicar.

---

## PASSO 3 — Atualização do N1 (nível imediatamente anterior)

Sempre que um Agrupamento Funcional (N2) for gerado ou alterado, verifique se o N1 do
domínio (`modules/[dominio]/README.md`) e o `modules/INDEX.md` ainda refletem
a realidade e atualize-os quando necessário:

- **Agrupamentos Funcionais do domínio (link e contagem)**: o Agrupamento Funcional já consta na tabela
  do N1 com seu ID `[SIGLA]-[SAF]` (definido no N1). **Mantenha o ID como está**; agora
  que o N2 existe, preencha o link **direto no nome do Agrupamento Funcional** —
  `[**Nome**](./[agrupamento-funcional]/README.md) <small>[SIGLA]-[SAF]</small>` — e a contagem de
  **Funcionalidades** coerente com o N2, e garanta que o rodapé `*Links: ...*` do N1 aponte para
  este Agrupamento Funcional. Só se o N1 estiver desatualizado (Agrupamento Funcional ausente ou sem ID),
  inclua-o no formato acima, sem link, com o ID definido no PASSO 1.
- **Regras transversais**: se o N2 revelou uma regra que vale para o domínio
  inteiro, proponha incluí-la nas Regras transversais do N1.
- **Dependências entre domínios**: reflita no N1 e no INDEX qualquer
  dependência nova entre domínios surgida aqui.
- **Divergências**: sinalize com ⚠️ qualquer contradição entre o N2 e o N1.

Apresente as alterações propostas e peça aprovação antes de gravar:
> "Para manter o N1 consistente, proponho atualizar `[dominio]/README.md`
> (e o `modules/INDEX.md`): [lista]. Posso aplicar?"

---

## PASSO 4 — Confirmação de cobertura

Após todos os Agrupamentos Funcionais do domínio aprovados, confirme:
> "Todos os Agrupamentos Funcionais do domínio [nome] foram detalhados.
> O próximo passo é especificar cada funcionalidade."

---

## Checklist de conformidade do N2

Antes de apresentar cada Agrupamento Funcional, confira (todos os itens são obrigatórios):

- [ ] Título exatamente `# Agrupamento Funcional: [Nome]`
- [ ] Subtítulo em blockquote: `> **Nível 2** - Domínio: [Nome] - [ID]` (hífens `-`, sem em-dash, ID em crase)
- [ ] Descrição (2-3 frases) seguida da linha `**Não faz**:`
- [ ] **Funcionalidades**: 2 colunas; coluna *Funcionalidade* no formato `[**Nome**](f-*.md) <small>[SIGLA]-[SAF]-NN</small>` com o link do N3 embutido no nome
- [ ] **Fluxo Principal**: bloco `mermaid` `flowchart TD`, todo nó entre **aspas duplas**, sem `\n`, sem lista numerada depois
- [ ] **Fluxo Principal sem caminho de volta**: setas só para frente; ramos de decisão convergem para o nó final; sem loops nem retorno a etapas anteriores (retornos/exceções ficam no N3). Única exceção: iteração de processo anotada `-.->|itera: motivo|`
- [ ] **Dependências entre funcionalidades** presente
- [ ] **Telas**: 4 colunas; *Funcionalidades atendidas* como `**Nome** <small>ID</small>` (múltiplas separadas por `<br>`) — *opcional (pode ser omitida) nos arquétipos `ml-dados`/`cli-biblioteca` sem UI*
- [ ] **Permissões por perfil**: nota de fonte única + linha `Perfis:` + matriz perfil × ação (`✓`/`—`) + bullets de detalhe — *opcional (pode ser omitida) nos arquétipos `ml-dados`/`cli-biblioteca` sem UI*
- [ ] **Changelog** + rodapé `*Links: ...*`
- [ ] **Nenhuma** seção extra (sem `## Regras de negócio`, sem `## Campos`, sem renomear títulos)

> **Gate determinístico** — após gravar o N2, rode `node scripts/validate-doc.mjs <arquivo>`.
> O artefato só é considerado conforme quando o validador retorna `✓` (sai com código 0).
