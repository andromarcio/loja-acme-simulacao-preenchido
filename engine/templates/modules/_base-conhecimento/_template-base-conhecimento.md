# Base de Conhecimento Extraída: [Assunto Central]
> **Origem**: insumos desestruturados (transcrições, PDFs, e-mails, rascunhos, prints)
> **Gerado por**: PROMPT_0 (Extração de Insumos Desestruturados)
> **Status**: 🧱 Insumo bruto — ainda não especificado

<!--
  Este arquivo NÃO é um nível de spec (N0–N3). É o INSUMO de extração: o
  "Raw Spec Document" que organiza material desestruturado para alimentar os
  PROMPTS 1A / 2A / 3A. Vive em `modules/_base-conhecimento/` — como
  `analise-impacto/`, não é um domínio do sistema.

  Nome do arquivo: kebab-case do assunto central — ex.: `gestao-de-fundos.md`.
  É descartável e regenerável: ao avançar para os N1/N2/N3, a verdade migra
  para os artefatos finais; esta base é só o trampolim.

  Tudo aqui é PROVISÓRIO e RASTREÁVEL aos insumos: não invente domínios,
  campos ou regras — o que não estiver no material entra em "Pontos de
  Atenção / Lacunas" como ❓, não como fato.
-->

---

## Visão Geral e Atores

<!--
  O propósito central discutido e os atores/usuários mencionados, em
  linguagem de negócio. Uma a três frases + a lista de atores.
-->

- **Propósito**: [o problema/oportunidade central que os insumos descrevem]
- **Atores**: [perfis/usuários citados — um por linha]

---

## Árvore de Funcionalidades (Domínios → Agrupamentos Funcionais → Funcionalidades)

<!--
  Árvore NUMERADA (1., 1.1, 1.1.1) para que cada item seja referenciável com
  precisão nas revisões. É uma hipótese de estrutura — vira N1/N2/N3 nos
  prompts seguintes, não aqui.
-->

- 1. [Domínio A]
  - 1.1 [Agrupamento Funcional 1]
    - 1.1.1 [Funcionalidade]
    - 1.1.2 [Funcionalidade]
  - 1.2 [Agrupamento Funcional 2]
    - 1.2.1 [Funcionalidade]

---

## Dicionário de Campos Extraídos

<!--
  Apenas campos MENCIONADOS nos insumos, em linguagem de negócio (Label PO).
  Não defina Label Dev, campo banco, tipo SQL nem FK — isso nasce no
  DATA-MODEL (via PROMPT_1B/3B), nunca aqui.
-->

| Campo mencionado | Tipo inferido | Regras mencionadas |
|---|---|---|
| [campo] | [tipo] | [regras citadas, ou — se nenhuma] |

---

## Regras de Negócio e Casos de Erro Mapeados

<!--
  Regras imperativas e fluxos de exceção citados explicitamente nos insumos.
  Uma invariante/caso por item; a reação do sistema vira cenário no N3.
-->

1. [Regra de negócio inflexível, ex.: "não vender para menores de 18 anos"]
2. [Caso de erro / fluxo de exceção, ex.: "3 senhas erradas → bloquear"]

---

## Pontos de Atenção / Lacunas

<!--
  Tudo que ficou sem resposta nos insumos. Cada lacuna é uma pergunta para o
  PO resolver antes (ou durante) a especificação — nunca preenchida por suposição.
-->

- ❓ [Pergunta sem resposta nos insumos]
- ❓ [Ambiguidade / informação conflitante a confirmar]
