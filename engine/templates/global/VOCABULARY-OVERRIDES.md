<!-- docqui: {{VERSION}} | prompt: {{PROMPT_ID}} | atualizado: {{YYYY-MM-DD}} -->
# VOCABULARY-OVERRIDES.md — ajustes de vocabulário desta instância

> Ajusta o vocabulário canônico do framework (`engine/DEFINICAO-FUNCIONALIDADE.md`) **para
> esta instância**, sem editar o engine. Lido automaticamente pelo gate semântico
> (`scripts/valida-semantica-funcionalidade.mjs`) — as tabelas abaixo são **máquina-legíveis**
> (primeira coluna = termo, grafia sem acento, como nas tabelas do engine).
>
> Um termo não é técnico ou negocial *por natureza* — depende do produto (Regra 10 da
> skill): `cache` vaza camada técnica num CRM, mas é a entidade central de um pipeline
> de ML. **Todo termo liberado exige justificativa** na segunda coluna — o gate não
> julga o motivo; quem confere é o revisor humano do PR que alterar este arquivo.
>
> Mantenha este arquivo **enxuto**: cada linha aqui é uma exceção ao contrato do
> framework. Se a exceção vale para qualquer produto do mesmo tipo, proponha a mudança
> no próprio `DEFINICAO-FUNCIONALIDADE.md` do engine (via CHANGELOG) em vez de acumulá-la aqui.

---

## Verbos adicionais da instância

<!--
  Verbos no infinitivo que são ações de negócio DESTE produto e ainda não constam do
  vocabulário canônico. Efeito: FD-1 passa sem aviso; o verbo conta para a checagem de
  atomicidade (FD-3). Grafia kebab-case sem acento (como `lancar` no engine).
-->

| Verbo | Justificativa (ação de negócio deste produto) |
|---|---|
| [verbo] | [por que é uma ação que um ator deste produto executa] |

---

## Termos liberados na posição do verbo

<!--
  Termos da tabela "Termos bloqueados na posição do verbo" do engine que NESTA
  instância nomeiam uma ação legítima. Use com parcimônia — o bloqueio quase sempre
  está certo; libere apenas quando o termo é genuinamente o nome da ação no domínio.
-->

| Termo | Justificativa |
|---|---|
| [termo] | [por que aqui é ação, não agrupador/nominalização/artefato] |

---

## Termos liberados na Descrição

<!--
  Termos da tabela "Termos proibidos na Descrição" do engine que NESTE produto são
  entidade/conceito de domínio (não vazamento técnico). Ex. clássico: `cache` num
  sistema de ML cujo produto é construir e consumir um cache de dados de treino.
-->

| Termo | Justificativa (entidade de domínio deste produto) |
|---|---|
| [termo] | [por que o usuário de negócio deste produto raciocina sobre isto] |

---

## Termos adicionais proibidos na Descrição

<!--
  Termos que NESTA instância denunciam vazamento técnico ou vagueza e devem reprovar
  a Descrição do N3, além dos já proibidos pelo engine. Mesmo formato da tabela do
  engine: tipo = `vago` | `tecnico`; a orientação diz o que escrever no lugar.
-->

| Termo | Tipo | Orientação |
|---|---|---|
| [termo] | [vago \| tecnico] | [o que escrever no lugar] |

---

## Changelog

| Data | Autor | Tipo | Descrição |
|---|---|---|---|
| [AAAA-MM-DD] | [autor] | Criação | Overrides de vocabulário da instância |
