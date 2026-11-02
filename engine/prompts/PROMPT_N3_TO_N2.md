# PROMPT N3→N2 — Síntese do Agrupamento Funcional a partir dos N3s

> **Modelo de estrutura**: `engine/templates/modules/_template-dominio/_template-agrupamento-funcional/README.md` *(referência humana — o prompt já embute o esqueleto)*
> **Quem participa**: Analista de Requisitos / Tech Lead
> **Insumo necessário**: todos os N3s de um mesmo Agrupamento Funcional
> **Entrega**: README.md do N2 (Agrupamento Funcional) sintetizado a partir das specs existentes
>
> **Quando usar**: sistema existente cujos N3s já foram escritos mas o N2
> ainda não existe — ou precisa ser regenerado para refletir o estado atual
>
> **Próximo passo**: com os N2s gerados, usar PROMPT_N3_TO_N1 para sintetizar o N1

---

## INSTRUÇÕES PARA O CLAUDE

> **Protocolo obrigatório desta sessão (F1 preflight · F2 autovalidação):**
> 1. **Antes de sintetizar** — rode `node scripts/preflight-spec.mjs [dominio] [agrupamento-funcional]` (ou, sem disco, leia o N0 + `modules/INDEX.md` + o N1 do domínio) e apresente um bloco **"Contexto verificado"**: o N2 que já existe (se for regenerar), o ID do Agrupamento Funcional e os IDs das funcionalidades — a síntese reusa esses IDs, não cria outros.
> 2. **Depois de gravar** — rode `node scripts/validate-doc.mjs modules/[dominio]/[agrupamento-funcional]/README.md`; se reprovar, **apresente os desvios, corrija e repita até `✓`**. Nunca conclua com o validador reprovando.
> *(No Claude Code os hooks em `.claude/settings.json` já enforçam isso automaticamente.)*

Você é um Analista de Requisitos Sênior. Sua missão é ler um conjunto de
funcionalidades (N3) de um mesmo Agrupamento Funcional e consolidar as informações em um
README.md de N2 coerente, sem inventar nada que não esteja nos N3s.

Regras da sessão:
- Derive tudo exclusivamente do conteúdo dos N3s fornecidos.
- Se uma informação necessária para o N2 não puder ser inferida dos N3s,
  sinalize com ⚠️ e inclua um placeholder para preenchimento manual.
- Não repita nos campos de texto o que já está nas tabelas — seja conciso.
- Sinalize suposições com ⚠️.

---

## CONTEXTO DO PROJETO

=== IDENTIFICAÇÃO ===
Agrupamento Funcional: [nome do Agrupamento Funcional]
Domínio: [nome do Domínio]
Caminho de destino: `modules/[dominio]/[agrupamento-funcional]/README.md`

=== N3s DO FUNCIONALIDADE SET ===
[cole aqui cada N3 — separe com `---` e indique o nome do arquivo como título]

---

## PASSO 1 — Confirmação do escopo

Liste as funcionalidades recebidas e confirme antes de prosseguir:

> "Recebi [N] funcionalidades para o Agrupamento Funcional **[nome]** do domínio **[nome]**:
> [lista numerada das funcionalidades]
> Posso iniciar a síntese?"

---

## PASSO 2 — Extração dos elementos do N2

**[Estado: EXTRACAO]**

Leia todos os N3s e extraia:

1. **Descrição do Agrupamento Funcional** — qual problema de negócio unifica
   todas as funcionalidades deste conjunto? O que está fora do escopo?

2. **ID do Agrupamento Funcional** — se um N1 já existir e já trouxer o ID deste Agrupamento Funcional,
   **reutilize-o**; caso contrário, derive do ID do domínio (presente nos N3s) e atribua
   uma sigla de exatamente 3 letras maiúsculas derivada do nome do Agrupamento Funcional, formando
   `[SIGLA]-[SAF]` (ex.: Usuários → `[SIGLA]-USR`), única dentro do domínio;
   confirme os IDs já existentes nos N3s e preserve-os, mesmo fora da ordem da jornada. Para uma entrada ainda sem ID, organize a tabela Funcionalidades na jornada confirmada e reserve o próximo número com `scripts/ids-n3.mjs` (modo seco; depois `--write`), sem renumerar os N3s existentes nem preencher lacunas. Preserve o registro `docqui:n3-ids` do N2 ao regenerá-lo — ver `engine/N3-IDS.md`.

3. **Índice de funcionalidades** — nome, arquivo, ID e descrição de uma linha de cada
   funcionalidade (extraído da seção "Descrição" de cada N3)

4. **Fluxo principal** — qual a sequência ou relação de uso entre as
   funcionalidades? Derive das dependências e pré-condições descritas nos N3s.
   É a **jornada de sucesso** e deve seguir **só para frente**, do início ao fim,
   **sem caminho de volta** — sem loops nem setas que retornem a uma etapa
   anterior. Retornos, cancelamentos e validações que devolvem ao passo anterior
   são exceção e ficam nos N3, não no fluxo principal.

5. **Dependências entre funcionalidades** — funcionalidades que exigem outra como
   pré-requisito (derive dos campos `Given` dos cenários Gherkin e das
   regras de negócio dos N3s)

6. **Telas e rotas** — consolide a seção "Comportamento de tela / Onde fica"
   de cada N3 em uma tabela de telas únicas com as funcionalidades que cada uma atende

7. **Permissões por perfil** — consolide as restrições de acesso de todos
   os N3s em uma matriz perfil × funcionalidade

---

## PASSO 3 — Apresentação e validação

Apresente o rascunho do N2 no formato do template e pergunte:

> "N2 sintetizado para **[Agrupamento Funcional]**. Verifique:
> - ⚠️ Há [N] ponto(s) que não puderam ser inferidos dos N3s — marcados com ⚠️.
> - O fluxo principal está correto?
> - Falta alguma dependência entre funcionalidades?
> Posso gerar o arquivo final?"

---

## PASSO 4 — Geração do artefato final

Após aprovação, gere o arquivo completo no formato abaixo:

```markdown
# Agrupamento Funcional: [Nome do Agrupamento Funcional]
> **Nível 2** - Domínio: [Nome do Domínio] - `[SIGLA]-[SAF]`

## Descrição
[síntese em 2-3 frases]

**Não faz**: [o que está fora do escopo — inferido dos limites dos N3s]

---

## Funcionalidades

| Funcionalidade | Descrição |
|---|---|
| [**Nome da Funcionalidade**](f-[verbo]-[entidade].md) <small>[SIGLA]-[SAF]-NN</small> | [descrição em uma linha] |

---

## Fluxo Principal

[diagrama Mermaid (` ```mermaid ` com `flowchart TD`) derivado das dependências entre
as funcionalidades — ver "Regra do Fluxo Principal" abaixo]

---

## Dependências entre funcionalidades

[lista descrevendo pré-requisitos e relações entre as funcionalidades — ex.: "[Funcionalidade A]
depende de [Funcionalidade B] porque..."]

---

## Telas

| Tela | Rota sugerida | Funcionalidades atendidas | Descrição |
|---|---|---|---|
| [nome] | `/[rota]` | **[Nome da Funcionalidade]** <small>[SIGLA]-[SAF]-NN</small> | [o que a tela mostra] |

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
| [data atual] | [Claude / autor] | N2 criado | Sintetizado a partir dos N3s pelo PROMPT N3→N2 |

---

*Links: [N1 do domínio](../README.md) · [INDEX geral](../../INDEX.md)*
```

> **Regra do Fluxo Principal** — mesma do PROMPT_2A: bloco ` ```mermaid ` com
> `flowchart TD`, **só para frente** (sem caminho de volta — sem loops nem setas que
> retornem a etapas anteriores), derivado das dependências entre as funcionalidades; nós
> entre aspas duplas, rótulos de seta sem aspas e sem `/`, `(` ou `)`.

Ao finalizar, informe:
> "✅ N2 de **[Agrupamento Funcional]** gerado. Salve em `modules/[dominio]/[agrupamento-funcional]/README.md`.
> O próximo passo é resumir os agrupamentos no domínio, com este agrupamento
> e os demais do domínio."
