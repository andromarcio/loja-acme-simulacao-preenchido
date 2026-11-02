<!-- docqui: {{VERSION}} | prompt: analise-impacto | atualizado: {{YYYY-MM-DD}} -->
---
tipo: sprint
sprint: [rótulo da sprint na organização — SP07, APIS_PUBLICAS_262-266]
entrega: [AAAA-MM-DD]
estado: rascunho          # rascunho → concluído (consolidação conferida)
estado-por: ""            # quem levou a AIMM ao estado atual — a pessoa, não o agente
estado-em: ""             # quando: AAAA-MM-DD HH:MM ±HH:MM (data, hora e fuso)
---

<!--
  AIMM DA SPRINT. Um arquivo por sprint, em `analise-impacto/AIMM-<sprint>.md`. Consolida
  as AIMMs dos tickets atendidos na sprint — as de front-matter `sprint:` igual a esta — e
  é a ÚNICA fonte do que foi entregue sem ticket na ferramenta de origem. É o documento
  que o agente de contagem lê para medir a sprint, fora do Docqui; a AIMM de cada ticket é
  o que o time consulta ao mexer naquele ticket. Escrita pela skill `analise-impacto`,
  depois da entrega. Não traz PF.

  O `validate-impact` a confere com as AIMMs dos tickets da pasta: os mesmos tickets, cada
  funcionalidade uma vez, a visão final de cada ticket dentro dela e a natureza. Em
  `concluído`, divergência reprova; em `rascunho`, avisa.
-->

# AIMM [sprint]

## Tickets da sprint

<!-- Um por linha, com o link da AIMM do ticket. Funcionalidade entregue sem ticket entra na tabela seguinte, com `⚠️ sem ticket`. -->

| Ticket | AIMM | Funcionalidades | Resumo |
|---|---|---|---|
| `[CHAVE]` | [AIMM-[CHAVE]](AIMM-[CHAVE].md) | `SIGLA-SAF-NN` **[Nome]** | [o que o ticket entregou, em uma frase] |

## Alterações em funcionalidades por Agrupamento Funcional

<!--
  Uma linha por funcionalidade, cada uma UMA vez. Coluna Ticket: a(s) chave(s) em crase —
  `⚠️ sem ticket` quando a entrega não tem item na ferramenta. Natureza: `incluída` ou
  `alterada`. O agente de contagem lê esta tabela.
-->

| Funcionalidade | Ticket | CA-n | Natureza |
|---|---|---|---|
| `SIGLA-SAF-NN` **[Nome da Funcionalidade]** | `[CHAVE]` | CA-1 | alterada |

## Decisões pendentes

- [o que ainda depende de decisão, e o que trava — ou "Nenhuma."]

## Changelog

| Data | Autor | Tipo | Descrição |
|---|---|---|---|
| 2026-10-20 | Docqui Caixa | Terminologia | Adoção de AIMM; histórico anterior preservado. |
| [AAAA-MM-DD] | [autor] | AIM da sprint | consolidação dos tickets da [sprint] |
