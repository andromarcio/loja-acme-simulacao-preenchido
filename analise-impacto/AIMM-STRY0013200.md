<!-- docqui: 9.1.0 | prompt: MIGRA_AIMM_ESTADO | atualizado: 2026-10-31 -->
---
tipo: ticket
ticket: STRY0013200
ferramenta: ServiceNow fictício
link: ../mentoria/backlog.md#stry0013200--faixas-de-frete
titulo: Faixas de frete
estado: em-análise
estado-por: "Claude"
estado-em: 2026-10-31 00:16 +00:00
aberta-na-entrega: false
sprint: ""
avalizado-por: ""
aberta-em: 2026-10-18
---

# AIMM STRY0013200

## Descrição do ticket

> Transcrição do ticket fictício do backlog da demonstração; não é um registro do ServiceNow real.

O administrador precisa manter as faixas de CEP atendidas e o valor do frete de cada uma, sem depender da equipe de sistemas para mudar a tabela.

## Critérios de aceite

> **Numeração**: a fonte fictícia numera os critérios; os números CA-n abaixo são os mesmos do backlog.

| Critério | Descrição |
|---|---|
| CA-1 | O administrador pesquisa as faixas por região ou por um CEP que elas atendem. |
| CA-2 | A faixa é cadastrada com região, CEP inicial, CEP final e valor do frete; duas faixas não podem ter CEPs em comum. |
| CA-3 | O administrador altera o intervalo e o valor da faixa; a mudança vale para os próximos cálculos, não para os pedidos já feitos. |
| CA-4 | Faixa usada em pedidos não pode ser excluída. |
| CA-5 | O administrador consulta todos os dados de uma faixa. |

## Funcionalidades

| Funcionalidade (N3) | Domínio · Agrupamento Funcional | Operação | Critérios cobertos | Status |
|---|---|---|---|---|
| [`ADM-FRT-01`: Pesquisar Faixas de Frete](../modules/administracao/faixas-frete/f-pesquisar-faixa-frete.md) | Administração · Faixas de Frete | Criação | `CA-1` | 📋 Especificado |
| [`ADM-FRT-02`: Cadastrar Faixa de Frete](../modules/administracao/faixas-frete/f-cadastrar-faixa-frete.md) | Administração · Faixas de Frete | Criação | `CA-2` | 📋 Especificado |
| [`ADM-FRT-03`: Editar Faixa de Frete](../modules/administracao/faixas-frete/f-editar-faixa-frete.md) | Administração · Faixas de Frete | Criação | `CA-3` | 📋 Especificado |
| [`ADM-FRT-04`: Excluir Faixa de Frete](../modules/administracao/faixas-frete/f-excluir-faixa-frete.md) | Administração · Faixas de Frete | Criação | `CA-4` | 📋 Especificado |
| [`ADM-FRT-05`: Visualizar Faixa de Frete](../modules/administracao/faixas-frete/f-visualizar-faixa-frete.md) | Administração · Faixas de Frete | Criação | `CA-5` | 📋 Especificado |

## Artefatos impactados

O changeset abaixo descreve o pacote didático. Não há aval de PO registrado; os arquivos preenchidos são material de demonstração.

| Artefato | Tipo | Operação | Seção | Natureza | O quê | Proveniência |
|---|---|---|---|---|---|---|
| `modules/administracao/README.md` | N1 | alterar | Agrupamentos Funcionais | funcional | Faixas de Frete entra entre os Agrupamentos Funcionais da Administração | elicitado |
| `modules/administracao/faixas-frete/README.md` | N2 | criar | — | funcional | CRUD de Faixas de Frete, telas e permissões | elicitado |
| `modules/administracao/faixas-frete/f-pesquisar-faixa-frete.md` | N3 | criar | — | funcional | ADM-FRT-01 — Pesquisar Faixas de Frete | derivado: âncora |
| `modules/administracao/faixas-frete/f-cadastrar-faixa-frete.md` | N3 | criar | — | funcional | ADM-FRT-02 — Cadastrar Faixa de Frete | derivado: âncora |
| `modules/administracao/faixas-frete/f-editar-faixa-frete.md` | N3 | criar | — | funcional | ADM-FRT-03 — Editar Faixa de Frete | derivado: âncora |
| `modules/administracao/faixas-frete/f-excluir-faixa-frete.md` | N3 | criar | — | funcional | ADM-FRT-04 — Excluir Faixa de Frete | derivado: âncora |
| `modules/administracao/faixas-frete/f-visualizar-faixa-frete.md` | N3 | criar | — | funcional | ADM-FRT-05 — Visualizar Faixa de Frete | derivado: âncora |
| `modules/vendas/README.md` | N1 | alterar | Integrações com outros domínios | funcional | A Administração escreve a TabelaFrete e consulta os pedidos | elicitado |
| `global/data-models/vendas.md` | DATA-MODEL | alterar | TabelaFrete | funcional | Região e cinco faixas na massa da demonstração | elicitado |
| `global/MESSAGE-DICTIONARY.md` | MESSAGE-DICT | alterar | Administração | funcional | Região duplicada, intervalo inválido, sobreposição, exclusão bloqueada e aviso de edição | elicitado |
| `prototypes/administracao/faixas-frete/flow.html` | PROTÓTIPO | criar | — | funcional | Pesquisa, cadastro, edição, visualização e exclusão de faixas | derivado: espelho do N2 |

## Alterações em funcionalidades por Agrupamento Funcional

### Faixas de Frete

| Funcionalidade | CA-n | Natureza | Mudança | Regras | Cenários |
| --- | --- | --- | --- | --- | --- |
| `ADM-FRT-01`<br>**Pesquisar Faixas de Frete** | CA-1 | incluída | **Inclusão** da funcionalidade. *Antes*: não havia N3. *Agora*: encontrar faixas por região ou por um CEP que elas atendem. | +4 | +9 |
| `ADM-FRT-02`<br>**Cadastrar Faixa de Frete** | CA-2 | incluída | **Inclusão** da funcionalidade. *Antes*: não havia N3. *Agora*: incluir uma faixa de CEP com o valor do frete. | +6 | +11 |
| `ADM-FRT-03`<br>**Editar Faixa de Frete** | CA-3 | incluída | **Inclusão** da funcionalidade. *Antes*: não havia N3. *Agora*: alterar o intervalo de CEP e o valor. | +6 | +12 |
| `ADM-FRT-04`<br>**Excluir Faixa de Frete** | CA-4 | incluída | **Inclusão** da funcionalidade. *Antes*: não havia N3. *Agora*: remover uma faixa que não atende pedidos. | +3 | +6 |
| `ADM-FRT-05`<br>**Visualizar Faixa de Frete** | CA-5 | incluída | **Inclusão** da funcionalidade. *Antes*: não havia N3. *Agora*: ver todos os dados de uma faixa. | +2 | +6 |

## Entidades alteradas

Modelo negocial da TabelaFrete, entidade de Vendas mantida pela Administração, sem alterações físicas ou contagem ALI/AIE.

## Impacto em dicionários

- Mensagens de Administração: `ADM_REGIAO_DUPLICADA`, `ADM_FAIXA_INTERVALO_INVALIDO`, `ADM_FAIXA_SOBREPOSTA`, `ADM_FAIXA_COM_PEDIDOS` e `ADM_FAIXA_VALE_PROXIMOS`.
- A exclusão bloqueada usa a regra canônica RC-09 — Registro vinculado não pode ser excluído; o texto exibido ganha a chave `ADM_FAIXA_COM_PEDIDOS`.

## Decisões pendentes

- O responsável real deve revisar o escopo e conduzir CP1/CP2 antes de qualquer entrega.
- A contagem será feita via CT; nenhum PF foi estimado.
- O prazo de entrega por faixa é o exercício STRY0013120; quando entrar, ele também altera os formulários desta AIMM.
- A faixa com valor zero não é aceita: o frete grátis é o exercício STRY0013165.

## Reconciliação

Não encerrada. Esta AIMM está em análise e não declara entrega, aprovação de escopo ou aprovação dos gates.

## Changelog

| Data | Autor | Tipo | Descrição |
|---|---|---|---|
| 2026-10-31 | Docqui Caixa | Ajuste | Front-matter ganha `estado-por` e `estado-em` (9.1.0), preenchidos pelo histórico do git com quem levou a AIMM ao estado atual e quando. |
| 2026-10-21 | Docqui Caixa | Ajuste | Layout da AIMM do ticket: sem Contexto, alterações por Agrupamento Funcional, Decisões pendentes, nome abaixo do ID, entidades sem PF. |
| 2026-10-20 | Docqui Caixa | Ajuste | Layout da AIMM do ticket: nome abaixo do ID, entidades sem PF. |
| 2026-10-18 | Claude | Demonstração | Ticket fictício e Feature Set Faixas de Frete preenchidos, com 5 features em rascunho, sem aval e com a contagem pendente. |
| 2026-10-20 | Docqui Caixa | Terminologia | Adoção de AIMM; histórico e chave preservados. |
| 2026-10-21 | Docqui Caixa | Terminologia | Níveis em português: Domínio, Agrupamento Funcional e Funcionalidade; histórico preservado. |
