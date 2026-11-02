# PROMPT CRUD — Agrupamento Funcional CRUD padrão (N2 + N3 negocial)
## Atalho de especificação para cadastros

> **Modelo de estrutura (N2)**: `engine/templates/modules/_template-dominio/_template-agrupamento-funcional/README.md`
> **Modelo de estrutura (N3)**: `engine/templates/modules/_template-dominio/_template-agrupamento-funcional/_template-funcionalidade.md`
> *(referência humana — o prompt já embute os esqueletos)*
> **Quem participa**: PO + dev (ou só PO)
> **Insumo necessário**: descrição da entidade + tabela de campos. N1 do domínio é opcional.
> **Entrega**: o `README.md` (N2) do Agrupamento Funcional **e** os N3 negociais das cinco
> operações CRUD — `f-pesquisar-[entidade].md`, `f-cadastrar-[entidade].md`, `f-editar-[entidade].md`, `f-excluir-[entidade].md`,
> `f-visualizar-[entidade].md`.
>
> **Pré-requisito**: nenhum obrigatório. Se o N1 do domínio existir, informe-o para
> herdar regras transversais e manter consistência de Label PO.
> **Próximo passo**: após aprovação, usar **3B** para complementar cada N3 com a parte técnica.

---

## INSTRUÇÕES PARA O CLAUDE

> **Protocolo obrigatório desta sessão (F1 preflight · F2 autovalidação):**
> 1. **Antes de gerar** — rode `node scripts/preflight-spec.mjs [dominio] [agrupamento-funcional]` (ou, sem disco, leia o N0 + `modules/INDEX.md` + o N1/N2 pertinentes) e apresente um bloco **"Contexto verificado"**: o que já existe, IDs tomados, próximo NN livre, regras/campos já canônicos a **referenciar** (não reescrever). Não duplique ID/pasta/regra/campo existente.
> 2. **Depois de gravar** — rode `node scripts/validate-doc.mjs <arquivo>` (estrutura) **e** `node scripts/valida-semantica-funcionalidade.mjs <arquivo>` (é mesmo uma funcionalidade? — critérios FD de `engine/DEFINICAO-FUNCIONALIDADE.md`); se algum reprovar, **apresente os desvios, corrija e repita até `✓`**. Nunca conclua com um validador reprovando.
> *(No Claude Code os hooks em `.claude/settings.json` já enforçam isso automaticamente.)*

Você vai especificar, numa única sessão, um Agrupamento Funcional de **cadastro (CRUD)**
seguindo o padrão do framework. A partir de **uma descrição da entidade e da
tabela de campos**, produza o N2 do Agrupamento Funcional e os N3 negociais das cinco
operações: **Pesquisar, Cadastrar, Editar, Excluir e Visualizar**.

Princípio do atalho: o usuário descreve a entidade **uma vez**. O N3 de
**Cadastro** é a fonte canônica; **Pesquisa, Edição, Exclusão e Visualização são
derivadas dele** — não repita as perguntas de campos para cada operação.

Regras da sessão:
- Use exclusivamente linguagem de negócio — sem endpoints, FKs, libs ou arquivos.
- A tabela de campos usa Label PO, **Entidade**, Preenchimento, Edição, Tipo, Obrigatório e
  Validação em linguagem natural. A coluna **Entidade** nomeia (por referência) a
  entidade dona do campo — nunca Label Dev ou campo banco.
- Campos canônicos (CPF, CEP, e-mail, telefone, CNPJ, ISIN, data, valor
  monetário, percentual, URL, nome de pessoa, razão social, etc.): aplicar o
  FIELD-DICTIONARY automaticamente, sem perguntar suas regras de validação.
- Regras canônicas: aplicar o RULES-DICTIONARY automaticamente; perguntar
  apenas os parâmetros em aberto.
- **Mensagens de UI**: toda mensagem exibida num cenário sai do `MESSAGE-DICTIONARY`.
  Genérica → marcador `# ← MESSAGE-DICTIONARY: BASELINE`. Específica → chave
  `<DOMINIO>_<SITUACAO>` + marcador `# ← MESSAGE-DICTIONARY: <CHAVE>` no cenário, e a
  entrada acrescentada ao catálogo na mesma entrega. Mensagem nova não catalogada é
  pendência ⚠️, não texto livre.
- **Regras de negócio atômicas — uma regra, uma invariante.** Ao escrever a
  seção `## Regras de negócio` de cada N3, quebre regras compostas: condições
  independentes ligadas por "e" / "ou" / "além disso" viram **itens distintos**,
  cada um com **uma única restrição verificável**. A reação do sistema ("não
  salva", "exibe mensagem") não é regra — vai para os **Cenários**. Cada item
  começa por `**RN-NN** —` (sequencial na funcionalidade, nunca reaproveitado), e ao menos
  um cenário o verifica com a tag `@RN-NN` na linha acima do `Scenario:`.
- **Nunca resuma uma contagem sem nomear os itens.** Se a frase disser "as N
  configurações/campos/grupos/abas…", liste os N itens ali mesmo (ou garanta
  que já estão numa tabela da mesma seção) — cada N3 é autocontido; quem lê
  só ele não pode depender de abrir outro arquivo para saber quais são.
- **Quem pode vive só no N2.** Colete perfis e permissões por operação uma
  vez e registre-os apenas na matriz do `README.md` do Agrupamento Funcional. Os N3 não trazem
  regra de permissão nem lista de perfis: no grupo **Restrições de acesso** eles
  descrevem só a reação do sistema a quem não tem acesso (mensagem do catálogo).
- Um artefato de cada vez: gere, aguarde aprovação, só então avance.
- Sinalize suposições com ⚠️.

> **Escopo deste prompt: negocial.** Não gere seções técnicas (API, eventos,
> AuditLog, mapeamento de campos) nem o `data-models/[dominio].md` — isso é o **3B**.

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
[INICIALIZACAO] → [COLETA_ENTIDADE] → [COLETA_CAMPOS] → [COLETA_POLITICA_CRUD]
   → [GERACAO_N2] → [GERACAO_N3_CADASTRO] → [DERIVACAO_N3_DEMAIS] → [REVISAO_CONSISTENCIA]
```

Toda resposta inicia com `[Estado: NOME]`. Não pule estados. Aguarde aprovação
explícita antes de transitar de um estado de geração para o próximo.

---

## PASSO 1 — `[COLETA_ENTIDADE]`

Confirme o domínio e a sigla (do N1, se fornecido; senão da identificação
manual). **Se o N1 já definir este Agrupamento Funcional, reutilize o ID `[SIGLA]-[SAF]` dele**;
caso contrário, derive uma sigla de 3 letras para o Agrupamento Funcional, formando o ID
`[SIGLA]-[SAF]` (e proponha incluí-lo no N1). Então pergunte, em um bloco:

> 1. Qual o nome da entidade que será cadastrada (ex.: Fundo Gerido, Cliente)?
> 2. Em 2-3 frases, o que este cadastro permite fazer? E o que ele
>    explicitamente **não** faz (onde termina o escopo)?
> 3. Qual campo identifica unicamente cada registro (ex.: ISIN, CNPJ, código)?

---

## PASSO 2 — `[COLETA_CAMPOS]`

Peça a tabela de campos da entidade — esta é a coleta central do atalho:

> 4. Liste os campos do cadastro. Para cada um: **nome em português**, **tipo**
>    (texto, número, data, lista de opções, sim/não, arquivo, ou seleção de
>    outro cadastro) e se é **obrigatório**. Indique qual é **único**.
>
> 5. Algum campo é preenchido **automaticamente** pelo sistema? Qual e quando?

Ao receber os campos:
- Identifique os **canônicos** e aplique o FIELD-DICTIONARY automaticamente;
  pergunte apenas o que o dicionário deixa em aberto (obrigatoriedade, unicidade).
- Para campos escolhidos a partir de **outro cadastro**, trate-os como
  **campo de seleção** (`seleção → [Entidade]`) — siga as regras de "Campos de
  seleção" do PROMPT_3A_N3_negocio.md (PASSO 1.5).
- O campo identificador único (PASSO 1, pergunta 3) será **imutável** na Edição
  (coluna *Edição* da tabela ## Campos) e o critério de identificação na Exclusão.
- **Entidade** (coluna *Entidade* da tabela ## Campos): como o atalho parte de **uma**
  entidade, preencha a coluna com **a própria entidade cadastrada** em todos os campos
  próprios; nos campos de seleção (`seleção → [Entidade]`) use a **entidade origem**. Se
  algum campo pertencer a outra entidade (raro num CRUD), nomeie-a — e, se ela não existir
  no data-model, sinalize `⚠️` e encaminhe à opção `DM`.

---

## PASSO 3 — `[COLETA_POLITICA_CRUD]`

Faça apenas as perguntas que a tabela de campos não responde e que valem para
o Agrupamento Funcional inteiro:

> 6. **Exclusão**: é **física** (remove do banco) ou **lógica** (marca como
>    inativo/arquivado, mantendo o registro)?
> 7. **Vínculos**: o registro pode estar vinculado a outros no sistema? Se sim,
>    o que deve acontecer ao tentar excluir um registro com vínculos?
>    (→ regra canônica "registro vinculado não pode ser excluído", se aplicável)
> 8. **Permissões** (fonte única do projeto): quais **perfis** existem e, para
>    **cada operação** (pesquisar, cadastrar, editar, excluir, visualizar), quais
>    perfis podem executá-la? Descreva em linguagem de negócio.
> 9. **Pesquisa**: quais **colunas aparecem no resultado** (viram a seção obrigatória `## Colunas do resultado`); há ordenação padrão, carga inicial (ex.: últimos N registros)
>    ou limite de resultados?
> 10. Esta entidade precisa ficar registrada no **histórico de auditoria**? (sim/não —
>     servirá para o 3B preencher a seção AuditLog; não vira regra de negócio)
> 11. **Onde abrem** o cadastro, a edição e a visualização: em **página própria** (com
>     rota) ou num **modal** sobre a pesquisa? *(Página → Superfície **Tela própria**;
>     modal → **Modal**, sem rota. A exclusão continua ação na linha da pesquisa, com
>     caixa de diálogo de confirmação: **Ação em tela**.)*

---

## PASSO 4 — `[GERACAO_N2]`

Monte a tabela de Funcionalidades na ordem da jornada confirmada. A sequência abaixo vale apenas para a primeira atribuição, quando não houver IDs usados. Preserve qualquer ID existente no N2/N3, mesmo que a jornada seja reorganizada; novas funcionalidades recebem números depois do maior reservado, sem preencher lacunas. Rode `node scripts/ids-n3.mjs modules/[dominio]/[agrupamento-funcional]/README.md` em modo seco e, conferido, com `--write`, antes de gerar os N3s. Preserve o registro `docqui:n3-ids` do N2 — ver `engine/N3-IDS.md`. A ordem de geração (Cadastro primeiro, depois os derivados) não é a ordem dos IDs.

| Ordem | Funcionalidade | Arquivo |
|---|---|---|
| 01 | Pesquisar [Entidade] | `f-pesquisar-[entidade].md` |
| 02 | Cadastrar [Entidade] | `f-cadastrar-[entidade].md` |
| 03 | Editar [Entidade] | `f-editar-[entidade].md` |
| 04 | Excluir [Entidade] | `f-excluir-[entidade].md` |
| 05 | Visualizar [Entidade] | `f-visualizar-[entidade].md` |

> `[entidade]` é a entidade do PASSO 1 em kebab-case, no singular, com o adjetivo
> qualificador quando houver — a regra de nomes do PROMPT_3A (ex.: *Fundo Gerido* →
> `f-pesquisar-fundo-gerido.md`). Sem a entidade no nome, o gate semântico reprova a
> funcionalidade (FD-1) e o `valida-acessorio-tela.mjs` não reconhece o Editar (procura
> `f-editar-*`).

Gere o N2 — **exatamente esta estrutura**, idêntica à do PROMPT_2A:

📄 `modules/[dominio]/[agrupamento-funcional]/README.md`

> **Nome da pasta do Agrupamento Funcional (obrigatório):** `[agrupamento-funcional]` é o **slug em kebab-case do nome do Agrupamento Funcional, SEM prefixo** — ex.: *Gestão de Fábricas* → `gestao-fabricas`; *Sistemas* → `sistemas`. **A pasta não leva prefixo** (nada de `g-`); só os **arquivos de funcionalidade** levam `f-`. O nome é também o segmento de rota (`/[dominio]/[agrupamento-funcional]`).

```
# Agrupamento Funcional: [Nome do Agrupamento Funcional]
> **Nível 2** - Domínio: [Nome do Domínio] - `[SIGLA]-[SAF]`

## Descrição
[2-3 frases sobre o que o cadastro faz]

**Não faz**: [o que está fora do escopo]

---

## Funcionalidades

| Funcionalidade | Descrição |
|---|---|
| [**Pesquisar [Entidade]**](f-pesquisar-[entidade].md) <small>[SIGLA]-[SAF]-01</small> | [uma linha] |
| [**Cadastrar [Entidade]**](f-cadastrar-[entidade].md) <small>[SIGLA]-[SAF]-02</small> | [uma linha] |
| [**Editar [Entidade]**](f-editar-[entidade].md) <small>[SIGLA]-[SAF]-03</small> | [uma linha] |
| [**Excluir [Entidade]**](f-excluir-[entidade].md) <small>[SIGLA]-[SAF]-04</small> | [uma linha] |
| [**Visualizar [Entidade]**](f-visualizar-[entidade].md) <small>[SIGLA]-[SAF]-05</small> | [uma linha] |

---

## Fluxo Principal

[esqueleto canônico do tipo CRUD — copie o diagrama da "Regra do Fluxo principal
(CRUD)" logo abaixo deste bloco e apenas substitua {Entidade}. Não redesenhe o grafo
nem acompanhe de lista numerada — a estrutura é fixa para todo CRUD]

---

## Dependências entre funcionalidades

[Pesquisa é o ponto de entrada; Cadastro independe; Edição, Exclusão e
Visualização exigem um registro existente, alcançado pela Pesquisa]

---

## Telas

| Tela | Rota sugerida | Funcionalidades atendidas | Descrição |
|---|---|---|---|
| Pesquisa de [Entidade] | `/[dominio]/[agrupamento-funcional]` | **Pesquisar [Entidade]** <small>[SIGLA]-[SAF]-01</small><br>**Excluir [Entidade]** <small>[SIGLA]-[SAF]-04</small> | listagem + filtros; origem das ações |
| Cadastrar [Entidade] | `/[dominio]/[agrupamento-funcional]/novo` | **Cadastrar [Entidade]** <small>[SIGLA]-[SAF]-02</small> | formulário de cadastro |
| Editar [Entidade] | `/[dominio]/[agrupamento-funcional]/:id/editar` | **Editar [Entidade]** <small>[SIGLA]-[SAF]-03</small> | mesmo formulário em modo edição |
| Visualizar [Entidade] | `/[dominio]/[agrupamento-funcional]/:id` | **Visualizar [Entidade]** <small>[SIGLA]-[SAF]-05</small> | ficha somente leitura |

> Rotas determinísticas conforme `global/ROUTING.md`: `[agrupamento-funcional]` é o slug (kebab)
> da pasta do Agrupamento Funcional. Exclusão não tem rota (ação em tela, da listagem). O que abre
> em **modal** (pergunta 11) também não tem rota nem linha própria: some da tabela, e a
> funcionalidade entra em *Funcionalidades atendidas* da tela de Pesquisa.

---

## Permissões por perfil

> **Fonte única de permissões** deste Agrupamento Funcional.

| Perfil | Pesquisar | Cadastrar | Editar | Excluir | Visualizar |
|---|---|---|---|---|---|
| [perfil 1] | ✓ | ✓ | ✓ | — | ✓ |
| [perfil 2] | ✓ | ✓ | ✓ | ✓ | ✓ |
| [perfil 3] | ✓ | — | — | — | ✓ |

---

## Changelog

<!-- Ordem decrescente por data: a entrada mais recente fica sempre no topo, logo abaixo do cabeçalho. -->

| Data | Autor | Tipo | Descrição |
|---|---|---|---|
| [data atual] | [Claude / autor] | N2 criado | Gerado pelo PROMPT CRUD |

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

> **Regra do Fluxo principal (CRUD)** — O `## Fluxo Principal` do CRUD é um
> **esqueleto canônico fixo**: copie o diagrama abaixo e apenas troque `{Entidade}`
> pelo nome da entidade. **Não** redesenhe os nós nem as setas — a estrutura é a mesma
> para todo CRUD, o que torna o fluxo determinístico e idêntico entre funcionalidades do mesmo
> tipo, independente da LLM. O diagrama é a única representação do fluxo (sem lista
> numerada) e, como todo fluxo principal de N2, é **só para frente**: todos os ramos
> da decisão convergem para o nó final `Z`, **sem caminho de volta** (sem loops nem
> retorno a etapas anteriores). Vale a syntax da "Regra do Fluxo principal" do
> PROMPT_2A: nós entre aspas duplas; rótulos de seta sem aspas e sem `/`, `(` ou `)`.
>
> ```mermaid
> flowchart TD
>     A(["Usuário acessa a listagem de {Entidade}"]) --> B["Pesquisar {Entidade}"]
>     B --> C{"Qual ação?"}
>     C -->|Cadastrar novo| D["Cadastrar {Entidade}"]
>     C -->|Selecionar registro| E{"Ação sobre o registro"}
>     E -->|Visualizar| F["Visualizar {Entidade}"]
>     E -->|Editar| G["Editar {Entidade}"]
>     E -->|Excluir| H["Excluir {Entidade}"]
>     D --> Z(["{Entidade} atualizada"])
>     G --> Z
>     H --> Z
>     F --> Z
> ```

> **Regra das Permissões** — A seção `## Permissões por perfil` **sempre** é uma
> **tabela Markdown** (perfis nas linhas × as cinco operações nas colunas).
> Células: `✓` para "pode executar" e `—` para "não pode". Nunca use listas ou
> texto corrido; notas de detalhe vão em bullets **após** a tabela.

Apresente e pergunte:
> "O N2 do Agrupamento Funcional está correto? Ajusta algo ou avanço para gerar os N3?"

Aguarde aprovação antes do PASSO 5.

---

## PASSO 5 — `[GERACAO_N3_CADASTRO]`

Gere o N3 de **Cadastro** — a fonte canônica das demais operações. Use os campos
do PASSO 2 e siga **exatamente** o esqueleto completo do PROMPT_3A (PASSO 3):
front-matter com `contagem.pendente: true` · Descrição (dois parágrafos) · Regras de
negócio · Cenários (os 5 grupos) · Campos (7 colunas) · Derivações (só com campo
calculado) · Colunas do resultado (só na Pesquisa) · Campos automáticos · Dados lidos
e gravados (só se a funcionalidade toca entidade sem campo na tela) · Superfície ·
Comportamento de tela · Critérios de sucesso · Origem (só com ticket) · Changelog.

> **`## Superfície` é visível**, fora do `dev-only`, logo antes do `## Comportamento de
> tela`; a **`## Origem`** fica logo antes do `## Changelog`. Emita as duas exatamente
> como no esqueleto do PROMPT_3A (PASSO 3).

> **DESTINO DOS ARQUIVOS (obrigatório — não erre a pasta).** Todos os N3 deste CRUD vão na **mesma pasta** do `README.md` do Agrupamento Funcional: `modules/[dominio]/[agrupamento-funcional]/`. `[agrupamento-funcional]` é o nome exato dessa pasta — a mesma do N2 gerado nesta sessão. **Nunca** grave na raiz, `global/`, `engine/`, outro domínio ou outro Agrupamento Funcional. Se em dúvida, pergunte antes de gravar.

📄 `modules/[dominio]/[agrupamento-funcional]/f-cadastrar-[entidade].md` (ID `[SIGLA]-[SAF]-02`)

- **Superfície**: pela pergunta 11 — **Tela própria** — Cadastrar [Entidade] (`/[dominio]/[agrupamento-funcional]/novo`), acessada da Pesquisa — ou **Modal**, com origem na Pesquisa.
- O campo identificador único entra como obrigatório e **único**.
- Cenários Gherkin: caminho feliz + duplicidade do campo único + baseline de
  validação (obrigatório/formato via marcadores de dicionário).

Apresente e pergunte:
> "O N3 de Cadastro está correto? Posso derivar Pesquisa, Edição, Exclusão e Visualização a partir dele?"

Aguarde aprovação antes do PASSO 6.

---

## PASSO 6 — `[DERIVACAO_N3_DEMAIS]`

Derive os quatro N3 restantes a partir do N3 de Cadastro recém-aprovado,
aplicando as **regras de derivação do PROMPT_3A_N3_negocio.md (PASSO 1.5)** —
não as reproduza de memória; trate o N3 de Cadastro como o "N3 de cadastro
fornecido" daquele passo. Gere um por vez, aguardando aprovação entre eles:

1. 📄 `f-pesquisar-[entidade].md` (`...-01`) — **Derivação para Pesquisa / Listagem**:
   filtros mapeados por tipo de campo + colunas do resultado (máx. 6). Aplique a
   ordenação/carga/limite da pergunta 9. Superfície: **Tela própria** — Pesquisa
   de [Entidade] (`/[dominio]/[agrupamento-funcional]`).

2. 📄 `f-editar-[entidade].md` (`...-03`) — **Derivação para Edição**: mesmo formulário do
   cadastro; identificador único **imutável** (coluna *Edição*); campos automáticos mantidos.
   Superfície pela pergunta 11: **Tela própria** — Editar [Entidade] (`/[dominio]/[agrupamento-funcional]/:id/editar`) — ou **Modal**, com origem na Pesquisa.

3. 📄 `f-excluir-[entidade].md` (`...-04`) — **Derivação para Exclusão**: identificação pelo
   campo único + confirmação explícita; aplique a política física/lógica
   (pergunta 6) e o tratamento de vínculos (pergunta 7). Superfície: **Ação em
   tela**, disparada da listagem (origem: Pesquisar [Entidade]).

4. 📄 `f-visualizar-[entidade].md` (`...-05`) — **Derivação para Visualização**: todos os
   campos do cadastro em **somente leitura** (nenhum editável, sem ações de
   gravação); sem auditoria (é leitura). Superfície pela pergunta 11: **Tela própria** —
   Visualizar [Entidade] (`/[dominio]/[agrupamento-funcional]/:id`) — ou **Modal**, com origem na Pesquisa.

Cada N3 derivado segue o mesmo esqueleto completo do PROMPT_3A (PASSO 3), listado no
PASSO 5 — `## Colunas do resultado` só na Pesquisa. Não repita as perguntas de campos
já coletadas — informe o que foi derivado e peça apenas confirmação ou ajustes.

**Contagem pendente e esteira** (PROMPT_3A, PASSO 3.6): cada um dos cinco N3 nasce com
`contagem.pendente: true`, e o espelho da esteira no `modules/INDEX.md` é regenerado com
`python3 scripts/gates.py promote --write` — os cinco aparecem como ✏️ rascunho. A
contagem fica com o agente de contagem, fora do Docqui; o `estado` avança pelos gates.

---

## PASSO 7 — `[REVISAO_CONSISTENCIA]`

Com as cinco funcionalidades aprovadas, rode a revisão de consistência do Agrupamento Funcional:

```
[ ] As 5 funcionalidades do N2 têm N3 correspondente?
[ ] Label PO é idêntico entre N2 e os cinco N3?
[ ] O identificador único é único no Cadastro, imutável na Edição, somente leitura na
    Visualização e critério de identificação na Exclusão?
[ ] Os cinco arquivos têm a entidade no nome (`f-[verbo]-[entidade].md`)?
[ ] Os cinco N3 nasceram com `contagem.pendente: true` e aparecem na esteira do INDEX
    como ✏️ rascunho?
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
> "Agrupamento Funcional CRUD concluído (N2 + 5 N3 negociais). Para complementar a parte
> técnica e atualizar o data-model, o próximo passo é o detalhamento técnico de cada funcionalidade."
