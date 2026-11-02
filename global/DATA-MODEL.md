<!-- docqui: 6.4.10 | prompt: PROMPT_DATA_MODEL_negocio | atualizado: 2026-10-23 -->
# DATA-MODEL.md
> **Modelo de entidades (negocial)** — índice dos modelos de entidades da Loja ACME. O perfil é `requisitos`: os fragmentos descrevem atributos em Label PO e relacionamentos de negócio, sem definir banco ou API.

## Convenção de nomenclatura

Entidades usam nomes em português, como `Pedido`, `TabelaFrete` e `Categoria`. Os atributos usam rótulos de negócio; a validação de campos canônicos é referenciada no FIELD-DICTIONARY.

## Modelos por domínio

| Domínio | Arquivo | Tipo | Entidades/Artefatos |
|---|---|---|---|
| Catálogo | [data-models/catalogo.md](data-models/catalogo.md) | entidades | Categoria, Produto |
| Vitrine | [data-models/vitrine.md](data-models/vitrine.md) | entidades | Destaque |
| Vendas | [data-models/vendas.md](data-models/vendas.md) | entidades | Pedido, ItemPedido, TabelaFrete |
| Administração | [data-models/administracao.md](data-models/administracao.md) | entidades | Usuario |

## Relacionamentos

| Relacionamento | Domínios | Detalhe |
|---|---|---|
| **Categoria** [1 — N] **Produto** | Catálogo | [catalogo.md](data-models/catalogo.md#relacionamentos) |
| **Categoria** [0..1 — 0..N] **Categoria** | Catálogo | Categoria superior opcional; zero ou várias subcategorias, em um único nível, sem autorreferência; [catalogo.md](data-models/catalogo.md#relacionamentos) |
| **Produto** [1 — N] **Destaque** | Catálogo → Vitrine | [vitrine.md](data-models/vitrine.md#relacionamentos) |
| **Produto** [1 — N] **ItemPedido** | Catálogo → Vendas | [vendas.md](data-models/vendas.md#relacionamentos) |
| **Pedido** [1 — N] **ItemPedido** | Vendas | [vendas.md](data-models/vendas.md#relacionamentos) |
| **TabelaFrete** [1 — N] **Pedido** | Vendas | [vendas.md](data-models/vendas.md#relacionamentos) |
| **Usuario** [1 — N] **Pedido** | Administração → Vendas | [vendas.md](data-models/vendas.md#relacionamentos) |

A TabelaFrete é entidade de Vendas, mantida pela Administração (Faixas de Frete). O diagrama de cada domínio está em [DIAGRAMA-ER.md](DIAGRAMA-ER.md).

## Arquivos Lógicos (APF)

As funções de dados ainda não foram dimensionadas. Nenhum ALI/AIE recebe PF por existir como entidade; a identificação e a contagem serão realizadas via CT, com memória de cálculo.

### ALIs — Arquivos Lógicos Internos

| ALI | Domínio | Entidades constituintes | RLR | DER | Complexidade | PF | Data |
|---|---|---|---|---|---|---|---|

### AIEs — Arquivos de Interface Externa

| AIE | Sistema externo | Entidades / estruturas usadas | RLR | DER | Complexidade | PF | Data |
|---|---|---|---|---|---|---|---|

## Changelog

| Data | Autor | Tipo | Descrição |
|---|---|---|---|
| 2026-10-18 | Claude | Modelo negocial | Entram os fragmentos de Catálogo (Categoria, Produto), Vitrine (Destaque) e Administração (Usuario). Em Vendas, entra ItemPedido; o Pedido ganha Cliente, as situações Aberto, Confirmado e Cancelado e os dados do cancelamento, e o CEP de entrega deixa de ser obrigatório no pedido aberto (é informado no checkout); a TabelaFrete ganha a Região e passa a ter cinco faixas na massa fictícia. Sem modelagem física ou contagem. |
| 2026-10-14 | Copilot | Modelo negocial | Índice de Vendas preenchido para demonstração, sem modelagem física ou contagem. |
| 2026-10-17 | Claude | Correção | Subtítulo com a marca **Modelo de entidades (negocial)** do template do perfil `requisitos`: sem ela, o `validate-doc` conferia o índice como físico e exigia a seção de campos globais. |
| 2026-10-23 | Copilot | Alteração | STRY0013205: autorrelacionamento opcional de Categoria, de um nível, e unicidade por superior no fragmento de Catálogo; sem camada física ou contagem. |
