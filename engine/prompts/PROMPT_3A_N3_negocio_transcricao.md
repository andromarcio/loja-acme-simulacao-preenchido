# PROMPT — N3 Negócio a partir de transcrição de reunião
## ⚠️ Descontinuado — substituído por `PROMPT_TRANSCRICAO_REUNIAO.md`

> Use **PROMPT_TRANSCRICAO_REUNIAO** (opção **RT** do menu): além do N3, ele
> extrai/atualiza N1 e N2 a partir da transcrição, cruzando níveis. Este prompt
> permanece apenas como referência histórica.

> **Modelo de estrutura**: `engine/templates/modules/_template-dominio/_template-agrupamento-funcional/_template-funcionalidade.md` *(referência humana — o prompt já embute o esqueleto)*
> **Modo**: PO
> **Entrada**: transcrição de reunião + contexto do projeto
> **Saída**: artefato N3 negocial com lacunas sinalizadas
> **Diferença do PROMPT 3A**: em vez de conduzir uma entrevista pergunta
> a pergunta, este prompt extrai as informações diretamente da transcrição
> e sinaliza o que ficou em aberto para validação posterior.

---

## INSTRUÇÕES PARA O CLAUDE

Você é um analista de requisitos. Você receberá a transcrição de uma reunião
de levantamento de requisitos e deve extrair dela a especificação negocial
de uma ou mais funcionalidades no formato N3.

### Regras de extração

1. **Use apenas o que está na transcrição.** Não invente, não assuma, não complete
   com conhecimento próprio sobre o domínio. Se uma informação não aparece
   explicitamente ou implicitamente na transcrição, ela é uma lacuna.

2. **Informe implícita conta.** Se a reunião deixou algo claro de forma
   indireta (ex: "sempre que salvar, o sistema manda um e-mail" implica
   uma ação automática), você pode inferir — mas sinalizar como inferência
   com 🔍 para validação.

3. **Lacunas são sinalizadas no artefato.** Não pergunte durante a geração.
   Gere o artefato completo e sinalize cada lacuna no próprio lugar onde
   a informação deveria estar, usando o marcador ❓.

4. **Use linguagem de negócio.** Nunca mencione endpoint, FK, enum, uuid,
   camelCase, snake_case, lib, JSON, HTTP, query ou qualquer jargão técnico.
   Use os equivalentes em linguagem natural:
   - lista de opções (não enum)
   - identificador único (não uuid)
   - processamento em segundo plano (não job assíncrono)
   - referência a outro cadastro (não FK)

5. **Uma funcionalidade por artefato.** Se a transcrição cobrir mais de uma funcionalidade,
   gere um artefato separado para cada uma. Ao final, liste as funcionalidades
   identificadas e pergunte se a separação está correta.

6. **Preserve falas relevantes.** Quando uma regra de negócio vier de uma
   fala direta de um participante, registre a fala original entre aspas
   na seção de notas da regra correspondente, para rastreabilidade.

### Marcadores utilizados no artefato

| Marcador | Significado |
|---|---|
| ❓ | Informação ausente na transcrição — requer esclarecimento |
| 🔍 | Inferência baseada no contexto — requer confirmação |
| ⚠️ | Conflito ou ambiguidade identificada na transcrição |
| 💬 | Fala original preservada para rastreabilidade |

### O que fazer ao final

Após gerar todos os artefatos, apresente obrigatoriamente:

1. **Lista de funcionalidades identificadas** — confirmar se a separação está correta
2. **Resumo de lacunas por funcionalidade** — lista de todos os ❓ agrupados
3. **Inferências para validação** — lista de todos os 🔍 agrupados
4. **Conflitos identificados** — lista de todos os ⚠️ agrupados
5. **Próximos passos sugeridos** — o que precisa ser resolvido antes do PROMPT 3B

---

## CONTEXTO DO PROJETO

=== MASTER.md ===
[cole aqui o conteúdo do MASTER.md]

=== DESIGN-SYSTEM.md ===
[cole aqui o conteúdo do DESIGN-SYSTEM.md]

=== N1 DO DOMÍNIO ===
[cole aqui o README.md do domínio]

=== N2 DO FUNCIONALIDADE SET ===
[cole aqui o README.md do Agrupamento Funcional]

---

## TRANSCRIÇÃO DA REUNIÃO

=== TRANSCRIÇÃO ===
[cole aqui a transcrição da reunião]

---

## FORMATO DO ARTEFATO GERADO

Para cada funcionalidade identificada, gere o arquivo no formato abaixo.
Não omita nenhuma seção — se não houver informação, use ❓.

---

# [nome extraído da transcrição ou ❓]
> **Nível 3** - Agrupamento Funcional: [do N2 fornecido] — Domínio: [do N1 fornecido] - `[ID provisório ou ❓]`
> **Origem**: Transcrição de reunião — [data se mencionada ou ❓]
> **Participantes**: [nomes mencionados na transcrição ou ❓]

---

## Descrição
[Extraído da transcrição. Se não houver descrição clara: ❓ Descrição não
mencionada na reunião — descrever em uma frase o que esta funcionalidade faz.]

---

## Regras de negócio

[Cada regra extraída da transcrição com o ID `RN-NN` — sequencial, nunca reaproveitado. O cenário que a verifica leva a tag `@RN-NN`.]

- **RN-01** — [Regra extraída]
   > 💬 "[fala original que originou esta regra]" — [nome do participante, se identificado]

- **RN-02** — [Regra extraída]

> ❓ **Lacunas de regras**: os seguintes pontos não foram abordados na reunião
> e precisam ser esclarecidos antes da implementação:
> - ❓ [ponto não coberto — ex: "O que acontece se o usuário tentar salvar sem preencher X?"]
> - ❓ [ponto não coberto]

> 🔍 **Inferências**: as seguintes regras foram inferidas do contexto
> e precisam de confirmação:
> - 🔍 [regra inferida — ex: "Entende-se que apenas admin pode realizar esta ação,
>   pois a reunião mencionou restrição de acesso sem especificar o perfil"]

> ⚠️ **Conflitos**: os seguintes pontos apresentaram informações contraditórias
> na transcrição e precisam ser resolvidos:
> - ⚠️ [conflito identificado — ex: "Em um momento foi dito X, em outro foi dito Y"]

---

## Cenários

```gherkin
Feature: [nome da funcionalidade]

  Background:
    Given que o usuário está autenticado
    And [contexto extraído da transcrição ou ❓ Contexto não especificado]

  # ── Caminho feliz ──────────────────────────────────────────────

  Scenario: [extraído da transcrição]
    Given [estado inicial extraído]
    When [ação extraída]
    Then [resultado extraído]

  # ❓ Cenários do caminho feliz não completamente descritos na reunião:
  # - ❓ [cenário ausente identificado como necessário]

  # ── Erros de validação ─────────────────────────────────────────

  Scenario: [extraído ou ❓]
    # ❓ Erros de validação não foram discutidos na reunião.
    # Os seguintes casos precisam ser definidos:
    # - ❓ O que acontece se [campo obrigatório] estiver vazio?
    # - ❓ O que acontece se [campo] tiver formato inválido?

  # ── Conflitos com dados existentes ────────────────────────────

  # ❓ Tratamento de duplicatas e conflitos não foi mencionado.
  # Definir: o que acontece se [dado único] já existir?

  # ── Restrições de acesso ───────────────────────────────────────

  Scenario: [extraído ou ❓]
    # 🔍 Inferido: usuários sem permissão não devem ter acesso.
    # Confirmar: qual o perfil mínimo necessário e qual mensagem exibir?

  # ── Estados especiais ──────────────────────────────────────────

  # ❓ Situações especiais do sistema não foram discutidas.
  # Avaliar se há casos como: registro arquivado, período de carência, etc.
```

---

## Campos

<!-- Colunas padrão do N3 (7). Como a transcrição é lossy, marque `❓` no que a ata
     não disser: Entidade (dona do campo — principal por padrão), Origem (entrada do
     usuário / calculado / externo) e Edição (editável / somente leitura / imutável)
     costumam ficar `❓` e são refinadas depois no 3A/4A. -->

| Label PO | Entidade | Preenchimento | Edição | Tipo | Obrigatório | Validação |
|---|---|---|---|---|---|---|
| [campo extraído] | [entidade principal / outra entidade / ❓] | [entrada do usuário / calculado / externo / exibido do cadastro / ❓] | [editável / somente leitura / imutável / ❓] | [tipo] | [sim/não/❓] | [regra ou ❓ Não mencionado] |

> ❓ **Campos não confirmados**: [listar campos que provavelmente existem mas não
> foram mencionados explicitamente na transcrição — incluindo os que ficaram `❓` em
> **Entidade**, **Origem** ou **Edição** a confirmar]

> Campo `calculado`? Registre a seção `## Derivações` (fórmula + campos-fonte com
> entidade) — com `❓` no que a ata não detalhar.

### Campos preenchidos automaticamente pelo sistema

| Label PO | Valor | Quando |
|---|---|---|
| [campo] | [valor ou ❓] | [momento ou ❓] |

> ❓ Se não houver campos automáticos mencionados: "A reunião não
> especificou campos preenchidos automaticamente pelo sistema."

---

## Comportamento de tela

### Onde fica
[Extraído da transcrição ou ❓ Localização na interface não mencionada —
definir se é formulário, modal, botão em lista ou página própria.]

### Estados da tela

| Estado | Comportamento |
|---|---|
| Loading | [extraído ou ❓ Não mencionado] |
| Erro de validação | [extraído ou ❓ Não mencionado] |
| Erro de servidor | [extraído ou ❓ Não mencionado] |
| Sucesso | [extraído ou ❓ Não mencionado] |
| Empty state | [extraído ou ❓ Não mencionado] |

---

<div class="dev-only">

## ⚙️ Seção técnica
*A ser preenchida pelo PROMPT 3B após aprovação do conteúdo negocial acima.*

---

## Implementação
*Com o inventário `repos/INDEX.md`, preencha já Item e Repositório — o nome exato do inventário, uma linha por repositório que realiza a funcionalidade (num sistema de microsserviços, cada serviço). No perfil `requisitos`, que não tem 3B, esta é a única passada que liga a funcionalidade aos repositórios; no `completo`, o 3B (PASSO 5) confere e completa. Caminho e Branch/Tag ficam para depois da implementação. Sem inventário, deixe a linha de traços.*

| Item | Repositório | Caminho | Branch/Tag |
|---|---|---|---|
| — | — | — | — |

**Status**: `[x] Especificado (parcial — lacunas pendentes)` · `[ ] Especificado` · `[ ] Em desenvolvimento` · `[ ] Implementado`

---

</div>

## Changelog

<!-- Ordem decrescente por data: a entrada mais recente fica sempre no topo, logo abaixo do cabeçalho. -->

| Data | Autor | Tipo | Descrição |
|---|---|---|---|
| [data de geração] | [Claude / autor] | Funcionalidade criada | N3 negocial gerado a partir de transcrição de reunião |

---

*Agrupamento Funcional: [nome] · Domínio: [nome] · Gerado em: [data] · Origem: transcrição de reunião*

*Links: [N2 do Agrupamento Funcional] · [N1 do domínio] · [INDEX geral]*

---

## RESUMO PÓS-GERAÇÃO

Após gerar todos os artefatos, apresente obrigatoriamente esta seção:

---

### Funcionalidades identificadas na transcrição

| # | Funcionalidade | Artefato gerado | Cobertura |
|---|---|---|---|
| 1 | [nome] | [nome-do-arquivo].md | 🟢 Boa / 🟡 Parcial / 🔴 Insuficiente |

> A separação acima está correta? Alguma funcionalidade foi agrupada ou separada
> de forma diferente do esperado?

---

### Lacunas por funcionalidade (❓)

**[Nome da funcionalidade]**
- ❓ [lacuna 1]
- ❓ [lacuna 2]

---

### Inferências para validação (🔍)

**[Nome da funcionalidade]**
- 🔍 [inferência 1]
- 🔍 [inferência 2]

---

### Conflitos identificados (⚠️)

**[Nome da funcionalidade]**
- ⚠️ [conflito 1 — trecho A diz X, trecho B diz Y]

---

### Próximos passos

1. **Resolver lacunas**: agendar sessão de esclarecimento para os ❓ acima
   ou responder diretamente neste documento antes de avançar.
2. **Confirmar inferências**: validar os 🔍 com o PO ou responsável de produto.
3. **Resolver conflitos**: definir o comportamento correto para os ⚠️.
4. **Aprovação do artefato**: após resolver os pontos acima, atualizar o
   status para `[x] Especificado` e remover os marcadores resolvidos.
5. **Próxima sessão**: usar PROMPT_3B com o artefato aprovado para gerar
   a parte técnica.
