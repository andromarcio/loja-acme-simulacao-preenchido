# PROMPT_PROTOTYPE_FLOW_COMPONENT — Protótipo de Fluxo (Componente)

> **Modelo de estrutura**: `engine/templates/prototypes/_template/_template-dominio/_template-agrupamento-funcional/README.md` *(referência humana — o prompt já embute o esqueleto)*
> **Quem participia**: dev / designer / PO técnico
> **Insumo necessário**: DESIGN-SYSTEM.md + N2 do Agrupamento Funcional
> **Entrega**: arquivo `flow-component.html` mostrando o fluxo de navegação
> entre as áreas de conteúdo das telas, **sem** sidebar, topbar ou shell
> de aplicação — apenas o conteúdo principal de cada tela
>
> **Quando usar este em vez do FULL**:
> - Iteração rápida — quer validar o fluxo sem montar o layout completo
> - Componente será embutido em outro sistema (iframe, storybook, design token preview)
> - O Design System ainda não está definido completamente
> - Quer gerar múltiplas variações para comparação sem repetir o layout
>
> **Pré-requisito**: N2 aprovado (PROMPT_2A concluído)
> **Onde salvar**: `prototypes/[dominio]/[agrupamento-funcional]/flow-component.html`

---

## INSTRUÇÕES PARA O CLAUDE

> **Manifesto de fidelidade (obrigatório).** Ao gerar o(s) protótipo(s), registre/atualize a linha em `prototypes/INDEX.md` — caminho · N3 · **fidelidade** (lida da `## Superfície` do N3) · status **rascunho**. Na aprovação o status vira **aprovado** (quem/quando): só então a tela é contrato para a codificação. Telas `obrigatória` são verificadas na implementação pela checklist `node scripts/fidelity-checklist.mjs <pasta> <N3>`.


Você vai gerar um protótipo de fluxo HTML focado **exclusivamente no conteúdo**
de cada tela — sem sidebar, topbar, breadcrumb ou qualquer shell de aplicação.

O arquivo terá um menu de navegação próprio e minimalista no topo,
apenas para permitir alternar entre as telas durante a revisão.

### Regras de geração

> **Treino ≠ jogo.** Todo protótipo gerado carrega, logo após o `<!DOCTYPE html>`,
> o comentário de aviso do esqueleto abaixo (obrigatório, verbatim): o protótipo é
> fonte de verdade de layout/comportamento/estados, **nunca** de implementação —
> o código de produção segue o `PATTERNS.md`, o `MASTER.md` e os componentes reais
> do design system (não as classes `.dsc-*`).
>
> **Carimbo (obrigatório).** A primeira linha do arquivo, antes do `<!DOCTYPE html>`,
> é o carimbo `<!-- docqui: [VERSION] | prompt: PROMPT_PROTOTYPE_FLOW_COMPONENT | atualizado: [AAAA-MM-DD] -->`
> (ver `engine/VERSIONING.md`). Comentário antes do doctype não tira o navegador do
> modo padrão: o `document.compatMode` segue `CSS1Compat`.

1. **Sem shell de aplicação**: nenhuma sidebar, topbar, nav global ou footer.
   O foco é a área de conteúdo `<main>` de cada tela.

2. **Navegador de protótipo próprio**: incluir uma barra simples no topo
   do arquivo com os nomes das telas como abas ou botões de seleção.
   Essa barra pertence ao protótipo, não ao produto.

3. **Use a biblioteca de componentes**: linke `prototypes/_biblioteca-ds/ds.css`
   (ajuste os `../` conforme a profundidade) e use as classes `.dsc-*` para todos os
   elementos internos (tabelas, formulários, botões, cards). Não redefina tokens
   nem recrie componentes inline — apenas a barra navegadora do protótipo
   (`proto-nav`) e o JS de navegação ficam inline.

4. **Foco na informação e hierarquia**: sem o visual completo, o protótipo
   deve deixar claro o que é título de página, o que são ações primárias,
   o que é conteúdo principal e o que é secundário.

5. **Navegação funcional entre telas**: botões e links de transição devem
   funcionar — implementar como troca de `display` entre seções.

6. **Leve e rápido**: o arquivo deve ser compacto. Evitar CSS excessivo.
   Um desenvolvedor deve conseguir adaptar o componente em menos de 30 minutos.

7. **Dados fictícios realistas**: mesma regra do FULL — nunca Lorem ipsum.

8. **Anotar dependências do layout**: listar no painel de notas o que
   o componente precisa do shell para funcionar corretamente
   (ex: "Este componente assume que a sidebar passa o `organizationId` via contexto").

---

## CONTEXTO DO PROJETO

=== DESIGN-SYSTEM.md ===
[cole aqui o conteúdo do DESIGN-SYSTEM.md]

=== N2 DO FUNCIONALIDADE SET ===
[cole aqui o README.md do Agrupamento Funcional]

=== N3s DAS FUNCIONALIDADES (opcional) ===
[cole aqui os N3s disponíveis, se quiser mais fidelidade]

---

## PASSO 1 — Mapeamento de telas

Leia o N2 e liste as telas e o grafo de navegação entre elas.
Apresente antes de gerar:

```
[Listagem] ──"Novo"──→ [Formulário de criação]
           ──"Linha"──→ [Detalhe]
                            └──"Editar"──→ [Formulário de edição]
```

Pergunte:
> "O mapa de navegação reflete o fluxo esperado?
> Posso gerar o protótipo de componente?"

---

## PASSO 2 — Geração do HTML

Após aprovação, gere `flow-component.html`:

```html
<!-- docqui: [VERSION] | prompt: PROMPT_PROTOTYPE_FLOW_COMPONENT | atualizado: [AAAA-MM-DD] -->
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
  <title>[Agrupamento Funcional] — Fluxo (Componente)</title>
  <!-- Biblioteca de componentes (CAIXA DS) — ajuste os ../ conforme a profundidade -->
  <link rel="stylesheet" href="../../_biblioteca-ds/ds.css">
  <style>
    /* Barra navegadora do protótipo (não pertence ao produto) */
    .proto-nav { background: var(--dsc-grayscale-130); padding: 10px 20px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .proto-nav span { color: #97a3ab; font-size: 11px; font-family: monospace; margin-right: 8px; }
    .proto-nav button { background: transparent; border: 1px solid #525f66; color: #c6ced4; padding: 4px 12px; border-radius: var(--dsc-border-radius-pill); font-size: 12px; cursor: pointer; }
    .proto-nav button.is-active { background: var(--dsc-primary-90); border-color: var(--dsc-primary-90); color: #fff; }
  </style>
</head>
<body>

  <!-- Navegador do protótipo (troca telas) -->
  <nav class="proto-nav">
    <span>🎨 PROTÓTIPO COMPONENTE — [Agrupamento Funcional]</span>
    <button class="is-active" onclick="showScreen('screen-list', this)">[Tela 1]</button>
    <button onclick="showScreen('screen-detail', this)">[Tela 2]</button>
    <button onclick="showScreen('screen-form', this)">[Tela 3]</button>
  </nav>

  <!-- Toast de sucesso (canto superior direito) -->
  <div id="toast" class="dsc-toast dsc-toast--positive" style="display:none;position:fixed;top:24px;right:24px;z-index:250">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg><span id="toast-msg"></span>
  </div>

  <!-- Área de conteúdo (sem shell): dsc-component-only -->
  <main class="dsc-component-only">

    <!-- Tela 1: Listagem -->
    <div id="screen-list" class="dsc-screen is-active">
      <div class="dsc-flex dsc-justify-between dsc-items-center" style="margin-bottom:16px">
        <div class="dsc-page-header" style="margin:0">
          <h1 class="dsc-page-title">[Título da tela]</h1>
          <p class="dsc-page-subtitle">[Subtítulo opcional]</p>
        </div>
        <button class="dsc-btn" onclick="showScreen('screen-form', document.querySelector('[onclick*=screen-form]'))">[Ação primária]</button>
      </div>
      <div class="dsc-table-wrap">
        <table class="dsc-table">
          <thead><tr><th>[Coluna 1]</th><th>[Coluna 2]</th><th>[Coluna 3]</th><th class="dsc-col-actions">Ações</th></tr></thead>
          <tbody>
            <tr onclick="showScreen('screen-detail', document.querySelector('[onclick*=screen-detail]'))">
              <td>[dado fictício realista]</td>
              <td>[dado fictício realista]</td>
              <td><span class="dsc-tag dsc-tag--success">[tag]</span></td>
              <td class="dsc-col-actions"><button class="dsc-icon-action" aria-label="Editar [registro]" title="Editar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg></button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Tela 2: Detalhe -->
    <div id="screen-detail" class="dsc-screen">
      <div class="dsc-card"><!-- ficha de leitura com .dsc-lv (label-valor) --></div>
    </div>

    <!-- Tela 3: Formulário -->
    <div id="screen-form" class="dsc-screen">
      <div class="dsc-card">
        <!-- campos do formulário com .dsc-field / .dsc-input / .dsc-select -->
        <div class="dsc-flex dsc-gap-1" style="justify-content:flex-end;margin-top:24px">
          <button class="dsc-btn dsc-btn--chromeless" onclick="showScreen('screen-list', document.querySelector('[onclick*=screen-list]'))">Cancelar</button>
          <button class="dsc-btn" onclick="showToast('Registro salvo com sucesso.')">Salvar</button>
        </div>
      </div>
    </div>

    <!-- Modal de exclusão (dsc-modal) -->
    <div id="modal-delete" class="dsc-modal-mask" style="display:none">
      <div class="dsc-modal">
        <div class="dsc-modal-header"><strong>Excluir [item]?</strong>
          <button class="dsc-modal-close" aria-label="Fechar" onclick="closeModal('modal-delete')">✕</button></div>
        <div class="dsc-modal-body">Esta ação não pode ser desfeita.</div>
        <div class="dsc-modal-footer">
          <button class="dsc-btn dsc-btn--chromeless" onclick="closeModal('modal-delete')">Cancelar</button>
          <button class="dsc-btn dsc-btn--danger" onclick="closeModal('modal-delete'); showToast('Registro excluído.')">Excluir</button>
        </div>
      </div>
    </div>

    <!-- Notas do protótipo -->
    <div class="dsc-proto-notes">
      <strong>📋 Notas — Componente [Agrupamento Funcional]:</strong>
      <ul>
        <li>Este componente assume que recebe <code>organizationId</code> do contexto global.</li>
        <li>[Outro comportamento não representado aqui]</li>
      </ul>
    </div>

  </main>

  <script>
    function showScreen(id, btn) {
      document.querySelectorAll('.dsc-screen').forEach(s => s.classList.remove('is-active'));
      document.getElementById(id).classList.add('is-active');
      if (btn) {
        document.querySelectorAll('.proto-nav button').forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
      }
    }
    function openModal(id) { document.getElementById(id).style.display = 'flex'; }
    function closeModal(id) { document.getElementById(id).style.display = 'none'; }
    function showToast(msg) {
      const t = document.getElementById('toast');
      document.getElementById('toast-msg').textContent = msg;
      t.style.display = 'flex';
      clearTimeout(t._timer);
      t._timer = setTimeout(() => { t.style.display = 'none'; }, 4000);
    }
  </script>

</body>
</html>
```

---

## PASSO 3 — Entrega

> "✅ Protótipo de fluxo (componente) gerado.
>
> **Salvar como**: `prototypes/[dominio]/[agrupamento-funcional]/flow-component.html`
>
> **Atualizar**: `prototypes/[dominio]/[agrupamento-funcional]/README.md` (linha do protótipo) e
> `prototypes/[dominio]/README.md` — o índice do domínio (crie a partir de
> `engine/templates/prototypes/_template/_template-dominio/README.md` se ainda não existir) —
> com a linha do Agrupamento Funcional. A pasta `prototypes/` espelha `modules/`, com um README em cada nível.
>
> **Quando usar o FULL em vez deste**: quando precisar validar o layout
> completo com sidebar e topbar, ou para apresentações ao cliente.
>
> **Telas cobertas**: [lista]
> **Dependências declaradas nas notas**: [lista]"
