<!-- docqui: {{VERSION}} | prompt: {{PROMPT_ID}} | atualizado: {{YYYY-MM-DD}} -->
<!--
  CONVENÇÃO DE VISIBILIDADE
  Blocos <div class="dev-only"> contêm detalhes técnicos.
  Versão PO  → CSS: .dev-only { display: none; }
  Versão DEV → sem CSS adicional
-->

# Domínio: [Nome do Domínio]
> **Nível 1** - Visão estratégica do domínio - `[SIGLA]`

## Descrição
[Descrição em 2-3 frases do que este domínio faz e para quem.]

### O que este domínio NÃO faz
| Descrição | Pertence a |
|---|---|
| [o que não faz] | [Domínio responsável] |

---

## Agrupamentos Funcionais

| Agrupamento Funcional | Descrição | Funcionalidades |
|---|---|---|
| [**Nome do Agrupamento Funcional**](./[pasta]/README.md) <small>[SIGLA]-[SAF]</small> | [descrição em uma linha] | [N] |

---

## Regras transversais de negócio

1. [Regra que se aplica a todas as funcionalidades deste domínio]
2. [Regra que se aplica a todas as funcionalidades deste domínio]

---

## Integrações com outros domínios

### Leitura — domínios que consomem dados deste domínio
| Domínio | O que consome | Como |
|---|---|---|
| [Domínio] | [entidade/campo em Label PO] | FK / Evento / Serviço |

### Escrita — domínios que criam ou alteram dados deste domínio
| Domínio | O que altera | Situação |
|---|---|---|
| [Domínio] | [entidade/campo em Label PO] | [quando ocorre] |

---

<div class="dev-only">

## Entidades do domínio

<!--
  Apenas nome e descrição das entidades — campos completos estão no DATA-MODEL.md.
-->

| Entidade | Descrição | Campos no DATA-MODEL.md |
|---|---|---|
| [Nome] | [descrição em uma linha] | → ver DATA-MODEL.md: [Nome] |

---

## Dependências externas

| Serviço | Uso | Lib sugerida |
|---|---|---|
| [serviço] | [para que é usado] | [lib] |

---

## Regras de acesso consolidadas

| Role | Pode fazer |
|---|---|
| [role] | [permissões resumidas] |

---

</div>

## Changelog

<!-- Ordem decrescente por data: a entrada mais recente fica sempre no topo, logo abaixo do cabeçalho. -->

| Data | Autor | Tipo | Descrição |
|---|---|---|---|
| [AAAA-MM-DD] | [autor] | N1 criado | [descrição] |

---

*Última revisão: —*

*Links: [Agrupamento Funcional 1](./[pasta]/README.md) · [INDEX geral](../INDEX.md)*
