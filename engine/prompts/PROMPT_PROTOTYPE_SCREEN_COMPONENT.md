# PROMPT_PROTOTYPE_SCREEN_COMPONENT — Protótipos de Estado (Componente)

> **Modelo de estrutura**: `engine/templates/prototypes/_template/_template-dominio/_template-agrupamento-funcional/_template-funcionalidade/README.md` *(referência humana — o prompt já embute o esqueleto)*
> **Quem participa**: dev / designer / PO técnico
> **Insumo necessário**: DESIGN-SYSTEM.md + N3 da funcionalidade
> **Entrega**: um arquivo HTML por estado, mostrando **apenas a área de conteúdo**
> da tela — sem sidebar, topbar ou shell de aplicação
>
> **Quando usar este em vez do FULL**:
> - Iteração rápida com o PO — quer validar campos e mensagens sem montar o layout
> - Dev quer usar como referência de markup para um componente isolado
> - Quer comparar variações de um mesmo estado lado a lado
> - Quer embutir em Storybook, design token preview ou documentação técnica
>
> **Pré-requisito**: N3 aprovado (PROMPT_3B concluído)
> **Onde salvar**: `prototypes/[dominio]/[agrupamento-funcional]/[funcionalidade]/[estado]-component.html`

---

## INSTRUÇÕES PARA O CLAUDE

> **Manifesto de fidelidade (obrigatório).** Ao gerar o(s) protótipo(s), registre/atualize a linha em `prototypes/INDEX.md` — caminho · N3 · **fidelidade** (lida da `## Superfície` do N3) · status **rascunho**. Na aprovação o status vira **aprovado** (quem/quando): só então a tela é contrato para a codificação. Telas `obrigatória` são verificadas na implementação pela checklist `node scripts/fidelity-checklist.mjs <pasta> <N3>`.


Você vai gerar protótipos HTML de cada estado de tela de uma funcionalidade,
focados **exclusivamente na área de conteúdo** — sem sidebar, topbar ou
qualquer shell de aplicação.

Cada arquivo representa um estado isolado que pode ser aberto diretamente
no browser ou embutido como componente.

### Regras de geração

> **Treino ≠ jogo.** Todo protótipo gerado carrega, logo após o `<!DOCTYPE html>`,
> o comentário de aviso do esqueleto abaixo (obrigatório, verbatim): o protótipo é
> fonte de verdade de layout/comportamento/estados, **nunca** de implementação —
> o código de produção segue o `PATTERNS.md`, o `MASTER.md` e os componentes reais
> do design system (não as classes `.dsc-*`).
>
> **Carimbo (obrigatório).** A primeira linha do arquivo, antes do `<!DOCTYPE html>`,
> é o carimbo `<!-- docqui: [VERSION] | prompt: PROMPT_PROTOTYPE_SCREEN_COMPONENT | atualizado: [AAAA-MM-DD] -->`
> (ver `engine/VERSIONING.md`). Comentário antes do doctype não tira o navegador do
> modo padrão: o `document.compatMode` segue `CSS1Compat`.

1. **Sem shell de aplicação**: nenhuma sidebar, topbar, breadcrumb ou footer.
   O arquivo começa diretamente com o conteúdo da área principal.

2. **Use a biblioteca de componentes**: linke `prototypes/_biblioteca-ds/ds.css`
   (ajuste os `../` conforme a profundidade) e use as classes `.dsc-*` para todos os
   elementos internos. Não redefina tokens nem recrie componentes inline.
   Em especial, `.dsc-proto-badge` já vem estilizado pela biblioteca (flutua no
   canto) — não recrie essa regra nem reposicione o badge (sem
   `top/right/bottom/left` soltos nele), senão ele vira um bloco sobre a tela.

3. **Largura máxima realista**: envolva o conteúdo em
   `<main class="dsc-component-only">` — já centraliza com `max-width` e padding
   lateral, equivalente à área de conteúdo do layout completo.

4. **Um arquivo por estado**: `form-component.html`, `loading-component.html`,
   `empty-component.html`, `error-component.html`. Nunca misturar estados.

5. **Campos mapeados do N3**: labels = Label PO do N3. Tipos de input =
   tipo do campo. Mensagens de erro/validação = exatamente as do N3.
   Campo `seleção → [Entidade]` → combobox `.dsc-select` com opções fictícias
   realistas (texto = campo-label do DATA-MODEL.md), nunca input de texto;
   anote a origem (`GET /api/v1/[recurso]?search=`) no painel de notas.

6. **Componente autoexplicativo**: use o badge da biblioteca no topo do
   `<body>` para identificar funcionalidade e estado:
   ```html
   <div class="dsc-proto-badge">🔲 COMPONENTE — [Funcionalidade] / [Estado]</div>
   ```
   e registre o caminho da spec na última linha do `.dsc-proto-notes`
   (`→ spec: [caminho do N3]`).

7. **Dados fictícios realistas**: mesma regra do FULL — nunca Lorem ipsum.

8. **Declarar dependências explicitamente**: o arquivo deve listar no rodapé
   o que o componente espera receber do contexto pai (props, contexto global,
   permissões). Isso é essencial para que o dev saiba como integrar.

---

## CONTEXTO DO PROJETO

=== DESIGN-SYSTEM.md ===
[cole aqui o conteúdo do DESIGN-SYSTEM.md]

=== N3 DA FUNCIONALIDADE ===
[cole aqui o arquivo completo da funcionalidade]

---

## PASSO 1 — Mapeamento de estados

Leia o N3 e liste os estados a gerar:

| Arquivo | Estado | Baseado em |
|---|---|---|
| `form-component.html` | Formulário principal | Seção "Campos" do N3 |
| `loading-component.html` | Skeleton | "Comportamento de tela: Loading" |
| `empty-component.html` | Sem dados | "Comportamento de tela: Empty state" |
| `error-component.html` | Erro | "Comportamento de tela: Error state" |
| `modal-component.html` | Modal | "Onde fica" (se for modal) |
| `[custom]-component.html` | [estado] | [referência no N3] |

Pergunte:
> "Os estados mapeados estão corretos? Qual gerar primeiro?"

---

## PASSO 2 — Geração estado a estado

Gere um estado por vez. Aguarde aprovação antes de avançar.

### Estrutura base de cada arquivo

```html
<!-- docqui: [VERSION] | prompt: PROMPT_PROTOTYPE_SCREEN_COMPONENT | atualizado: [AAAA-MM-DD] -->
<!DOCTYPE html>
<!--
  ⚠️ PROTÓTIPO NAVEGÁVEL — treino, não jogo.
  Fonte de verdade de LAYOUT, COMPORTAMENTO e ESTADOS — NUNCA de implementação.
  Não copie este HTML/CSS/JS para o código de produção: aqui tudo é autocontido
  e procedural DE PROPÓSITO (simulação). A implementação real segue outra
  estratégia: componentes do design system do projeto (mapa de equivalência no
  README do tema), catálogo global/PATTERNS.md e convenções do global/MASTER.md.
  Classes .dsc-* são EXCLUSIVAS de protótipo — proibidas em código de produção.
-->
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>[Funcionalidade] — [Estado] (Componente)</title>
  <!-- Biblioteca de componentes (CAIXA DS) — ajuste os ../ conforme a profundidade -->
  <link rel="stylesheet" href="../../../_biblioteca-ds/ds.css">
</head>
<body>

  <div class="dsc-proto-badge">🔲 COMPONENTE — [Funcionalidade] / [Estado]</div>

  <!-- Componente sem shell: dsc-component-only centraliza com max-width + padding -->
  <main class="dsc-component-only">

    <div class="dsc-card">
      <!-- CONTEÚDO DO ESTADO — usar classes da biblioteca:
           .dsc-field / .dsc-input / .dsc-select / .dsc-btn / .dsc-table / .dsc-tag
           .dsc-skeleton (loading) · .dsc-state (empty/error) · .dsc-table-empty
           .dsc-alert (Card Alert) · .dsc-modal / .dsc-modal-mask · .dsc-toast
           Linha de filtro/ação horizontal (campos + botões lado a lado): use
           .dsc-row com colunas por campo, ou .dsc-flex com align-items:flex-end —
           o .dsc-field não tem margem inferior, então as bases já alinham.
           Ícones de ação na coluna "Ações" da tabela (ver/editar/ativar/excluir):
           use SEMPRE a MESMA variante nos quatro — `.dsc-icon-action` (icon-only,
           sem borda, com aria-label). Não misture com botões com borda na linha.
           Substituir pelo estado correspondente: form / loading / empty / error / modal -->
    </div>

    <!-- Notas do protótipo + dependências esperadas do componente pai -->
    <div class="dsc-proto-notes">
      <strong>📋 Notas — [Funcionalidade] / [Estado]:</strong>
      <ul>
        <li>[comportamento não representado neste arquivo]</li>
      </ul>
      <strong style="display:block;margin-top:12px">Dependências esperadas do componente pai:</strong>
      <ul>
        <li><code>organizationId</code> — via contexto global de autenticação</li>
        <li><code>userRole</code> — para exibir/ocultar campos por permissão</li>
        <li>[outras dependências identificadas no N3]</li>
        <li>→ spec: [caminho do N3]</li>
      </ul>
    </div>

    <!-- Modais/toasts deste estado (se necessário) usam .dsc-modal / .dsc-toast da biblioteca -->
    <script>
      // JS pontual de interação (abrir/fechar modal, exibir toast) pode ficar inline.
      function openDialog(id){ document.getElementById(id).style.display = 'flex'; }
      function closeDialog(id){ document.getElementById(id).style.display = 'none'; }
    </script>

  </main>
</body>
</html>
```

### Conteúdo de cada estado

**`form-component.html`**
- Título da página + subtítulo (se houver)
- Todos os campos do N3 com Label PO, tipo correto, obrigatoriedade e dica de formato
- Ao menos um campo com erro de validação pré-preenchido (para referência visual)
- Campos desabilitados para roles sem permissão (conforme N3)
- Rodapé com cancelar (`.dsc-btn--chromeless`) + ação principal (`.dsc-btn`)

**`loading-component.html`**
- Skeleton (`.dsc-skeleton`) no lugar de títulos, campos e tabelas
- Sem dados — apenas blocos cinza animados com proporções equivalentes ao conteúdo real
- Botões de ação desabilitados

**`empty-component.html`**
- `.dsc-state` com ícone SVG simples, título e descrição exatos do N3
- Botão de ação primária (conforme N3 — pode não existir)

**`error-component.html`**
- `.dsc-state` com ícone, título e mensagem descritiva (conforme N3 — não genérica)
- Botão "Tentar novamente"

**`modal-component.html`**
- Componente já com o modal aberto (overlay + caixa) para visualização direta
- Estrutura: título + corpo + footer com ações
- Para modal de exclusão: botão danger + cancelar

---

## PASSO 3 — Geração do README do nível

Após gerar todos os estados aprovados, gere ou atualize o
`prototypes/[dominio]/[agrupamento-funcional]/[funcionalidade]/README.md`
adicionando os arquivos `*-component.html` na tabela de estados
com status `🎨 Mockup`.
Se ainda não existirem, crie também o README do Agrupamento Funcional
(`prototypes/[dominio]/[agrupamento-funcional]/README.md`) e o do domínio
(`prototypes/[dominio]/README.md`) a partir dos modelos em
`engine/templates/prototypes/_template/` — a pasta `prototypes/` espelha `modules/`, com um
README em cada nível.

---

## PASSO 4 — Entrega

> "✅ Protótipos de componente de [funcionalidade] gerados.
>
> **Salvar em**: `prototypes/[dominio]/[agrupamento-funcional]/[funcionalidade]/`
>
> **Arquivos gerados** (sufixo `-component`):
> - `form-component.html`
> - `loading-component.html`
> - `empty-component.html`
> - `error-component.html`
>
> **Dependências declaradas**: [lista das props/contexto esperados]
>
> **Quando usar o FULL em vez deste**: quando precisar apresentar ao
> cliente ou validar o layout completo com sidebar e topbar."
