<!-- docqui: {{VERSION}} | prompt: {{PROMPT_ID}} | atualizado: {{YYYY-MM-DD}} -->
# DATA-MODEL.md
<!-- perfil:requisitos -->
> **Modelo de entidades (negocial)** — índice de entidades, atributos e relacionamentos de negócio, sem camada física de banco. Os modelos detalhados estão em `global/data-models/`; use `PROMPT_DATA_MODEL_negocio` para criá-los ou atualizá-los.
<!-- /perfil:requisitos -->
<!-- perfil:completo -->
> **Índice e fonte de verdade** para nomenclatura e mapeamento de campos.
> Os modelos detalhados estão fragmentados por domínio em `global/data-models/`
> para otimizar o contexto enviado ao LLM — cole apenas o fragmento do
> domínio que está sendo trabalhado, não o arquivo inteiro.
>
> **Fonte única de definição de banco.** Toda definição física — entidade/tabela,
> Label Dev, campo banco, tipo SQL, FK, índice, restrição de unicidade e enum —
> vive **exclusivamente** aqui (índice) e nos fragmentos `global/data-models/`.
> Qualquer outro artefato (N0–N3, SDD, protótipo, contagem) **referencia**, nunca
> redefine: `→ ver DATA-MODEL.md: Entidade [Nome]`. Os N3 usam só Label PO e
> **nunca** duplicam Label Dev, campo banco, tipo ou FK em suas tabelas.
<!-- /perfil:completo -->

---

## Convenção de nomenclatura

| Camada | Convenção | Exemplo | Onde aparece |
|---|---|---|---|
| Entidade | PascalCase singular, português | `ModeloEmail` | **data-models/[dominio].md** (cabeçalho), "Modelos por domínio" |
| Label PO | Português, title case, sem jargão | `Nome completo` | N3 (campos), Gherkin, telas |
<!-- perfil:completo -->
| Label Dev | camelCase, português, autoexplicativo | `nomeCompleto` | **data-models/[dominio].md** — apenas aqui |
| Campo banco | snake_case, português ⚠️ | `nome_completo` | **data-models/[dominio].md** — apenas aqui |

> ⚠️ Entidades e campos em **português**. Confirme apenas a caixa dos identificadores
> (snake_case vs. UPPER_SNAKE_CASE) antes de implementar; em engenharia reversa,
> transcreva a origem como está — não traduza.

---

## Campos globais (presentes em todas as tabelas)

Estão implícitos — não precisam ser listados nos arquivos de domínio.

| Label PO | Label Dev | Campo banco | Tipo SQL | Notas |
|---|---|---|---|---|
| Identificador | id | id | [tipo PK] | PK; gerada automaticamente |
| Data de criação | createdAt | created_at | [timestamp] | Gerado automaticamente |
| Data de atualização | updatedAt | updated_at | [timestamp] | Atualizado automaticamente |
| Data de exclusão | deletedAt | deleted_at | [timestamp] | Exclusão lógica (soft delete); null = ativo |
<!-- /perfil:completo -->

---

## Modelos por domínio

<!--
  Tipo do fragmento: `entidades` (tabelas relacionais — padrão) ou `artefatos`
  (datasets/caches/checkpoints — modelo `data-models/_template-artefatos.md`,
  típico do arquétipo ml-dados). Um domínio pode ter os dois fragmentos.
-->

| Domínio | Arquivo | Tipo | Entidades/Artefatos |
|---|---|---|---|
| [Nome do Domínio] | [data-models/[dominio].md](./data-models/[dominio].md) | entidades | [Entidade A, Entidade B] |
| [Nome do Domínio] | [data-models/[dominio]-artefatos.md](./data-models/[dominio]-artefatos.md) | artefatos | [Artefato A, Artefato B] |

---

<!-- perfil:completo -->
## Enums do sistema

| Enum | Campo banco | Valores | Usado em |
|---|---|---|---|
| [NomeEnum] | [campo_banco] | [valor A, valor B] | [Entidade].[campo] |

---

## Campos adicionados recentemente

| Data | Entidade | Label PO | Label Dev | Campo banco | Tipo | N3 de origem |
|---|---|---|---|---|---|---|
| [data] | [Entidade] | [Label PO] | [labelDev] | [campo_banco] | [tipo] | [funcionalidade] |
<!-- /perfil:completo -->

---

## Relacionamentos

```
[Entidade A] 1──N [Entidade B]    ([descrição da relação])
```

---

## Relacionamentos de seleção (comboboxes)
<!-- perfil:requisitos -->

Os campos de seleção dos N3 referenciam entidades deste modelo pelo nome de negócio. Registre aqui a entidade e o atributo exibido; nomes físicos, consultas e operações de API ficam para o desenvolvimento.

| Campo (Label PO) | Entidade de origem | Atributo exibido (Label PO) | Critério de seleção |
|---|---|---|---|
| [campo de negócio] | [Entidade] | [atributo de negócio] | [restrição de negócio] |
<!-- /perfil:requisitos -->
<!-- perfil:completo -->

> Fonte de verdade para campos que, na tela, são uma **combobox/seleção cujas
> opções vêm de outra entidade** (chave estrangeira com exibição de label).
> Um campo do N3 com tipo `seleção → [Entidade]` referencia uma linha desta tabela.
> O agente de implementação usa estas colunas para resolver a consulta sozinho:
> grava o **campo-valor**, exibe o **campo-label** e busca as opções no **endpoint origem**.

| Campo (FK) | Entidade origem | Campo-valor | Campo-label | Endpoint origem | Filtro de origem |
|---|---|---|---|---|---|
| [exemploId] | [Entidade] | id | [labelDev] | GET /api/v1/[recurso] | apenas ativos (deletedAt IS NULL) |

**Significado das colunas:**
- **Campo (FK)** — Label Dev do campo que armazena a referência; termina em `Id`. É uma FK.
- **Entidade origem** — entidade de onde vêm as opções; deve existir em "Modelos por domínio".
- **Campo-valor** — o que é gravado no banco. Quase sempre o `id` da entidade origem.
- **Campo-label** — Label Dev exibido na combobox (ex: `nomeCompleto`, `razaoSocial`).
- **Endpoint origem** — rota de coleção que retorna as opções (paginada, com `?search=` para autocomplete). **Nunca** um endpoint novo dedicado — reusa a coleção da entidade.
- **Filtro de origem** — restrição de negócio sobre quais registros podem aparecer (ex.: "apenas ativos").

> A **estratégia de carga** (lista completa vs. autocomplete por digitação) é decisão
> de cada funcionalidade e fica no N3 (coluna Validação do campo), não aqui.

---

## Índices e restrições de unicidade

| Tabela | Campos | Tipo | Justificativa |
|---|---|---|---|
| [tabela] | (campo) | UNIQUE / INDEX | [justificativa] |
<!-- /perfil:completo -->

---

## Arquivos Lógicos (APF)

> Registro central de ALIs e AIEs do sistema.
> Mantido via atualização dos fragmentos `global/data-models/[dominio].md`.
<!-- perfil:requisitos -->
> O Docqui não faz a contagem: as funções de dados são dimensionadas pelo agente de contagem, fora do Docqui, conforme `global/SIZING.md`, que registra os resultados nas tabelas abaixo.
<!-- /perfil:requisitos -->
<!-- perfil:completo -->
> A contagem de DER **exclui** os campos globais técnicos (createdAt, updatedAt, deletedAt) e conta o `id` como **1 DER por ALI**, não por tabela — ver `global/SIZING.md`.
> **RLR** (Registro Lógico Referenciado = IFPUG RET) e **DER** (Dado Elementar Referenciado = IFPUG DET) determinam a complexidade — ver `global/SIZING.md`.
<!-- /perfil:completo -->

### ALIs — Arquivos Lógicos Internos

| ALI | Domínio | Entidades constituintes | RLR | DER | Complexidade | PF | Data |
|---|---|---|---|---|---|---|---|
| [Nome] | [Domínio] | [Entidade] | 1 | [N] | a definir ⚠️ | a definir | [AAAA-MM-DD] |

<!-- perfil:requisitos -->
**Total ALIs: a definir** *(dimensionado pelo agente de contagem, fora do Docqui / SIZING.md)*
<!-- /perfil:requisitos -->
<!-- perfil:completo -->
**Total ALIs: a definir** *(dimensionado pelo agente de contagem, fora do Docqui / SIZING.md)*
<!-- /perfil:completo -->

### AIEs — Arquivos de Interface Externa

| AIE | Sistema externo | Entidades / estruturas usadas | RLR | DER | Complexidade | PF | Data |
|---|---|---|---|---|---|---|---|
| [Nome] ⚠️ | [sistema externo] | [estrutura usada] | a definir | a definir | a definir | a definir | [AAAA-MM-DD] |

**Total AIEs: a definir**

---

<!-- perfil:requisitos -->
> ℹ️ **Como manter esta seção:** a opção DM registra entidades e relacionamentos, sem dimensionar funções de dados. As tabelas de ALIs/AIEs são preenchidas e atualizadas pelo agente de contagem, fora do Docqui.
<!-- /perfil:requisitos -->
<!-- perfil:completo -->
> ℹ️ **Como manter esta seção**
> 1. Ao criar ou alterar uma entidade num fragmento `data-models/[dominio].md`,
>    sinalize o ALI correspondente para o agente de contagem, fora do Docqui,
>    que atualiza a linha (RLR, DER, Complexidade, PF).
> 2. Se uma nova entidade formar um ALI novo, adicione a linha aqui
>    **e** anote o ALI no cabeçalho da entidade no fragmento do domínio.
> 3. Entidades de suporte (tabelas de junção, tabelas de auditoria) geralmente
>    não formam ALI próprio — pertencem ao ALI da entidade principal.
<!-- /perfil:completo -->
