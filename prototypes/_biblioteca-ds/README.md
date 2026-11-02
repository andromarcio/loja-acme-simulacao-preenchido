# `_biblioteca-ds/` — biblioteca de componentes para protótipos

> ⚠️ **Exclusiva de protótipos.** As classes `.dsc-*` existem para tornar protótipos
> navegáveis — **nunca** aparecem no código de produção (lá entram os componentes
> reais do design system; ver o mapa de equivalência no README do tema do projeto).
> Recomenda-se regra de lint na CI do front proibindo `dsc-` em templates —
> a presença denuncia cópia de protótipo.

HTML/CSS **sem build e sem dependências** para os protótipos do docqui (classes `.dsc-*`, espelhando os componentes do Figma **CAIXA DS**). É consumida pelos prompts de protótipo (`6A`/`6B` FULL e `6C`/`6D` componente) e pela skill `/prototype` — todo protótipo gerado linka o `ds.css` daqui.

> ℹ️ **Template do kit.** Assim como o `global/DESIGN-SYSTEM.md` (a fonte desta
> implementação), esta biblioteca vem preenchida com o CAIXA DS como referência.
> Para outro produto, troque os valores de [`tokens.css`](tokens.css) pelos
> tokens do seu design system — os componentes em `ds.css` são token-driven e
> se adaptam. Confira os valores com o Figma da sua instância.

| Arquivo | O que é |
|---|---|
| [`ds.css`](ds.css) | Componentes `.dsc-*` (importa `tokens.css`) — **o link dos protótipos** |
| [`tokens.css`](tokens.css) | Tokens `--dsc-*`: cores, tipografia, espaçamento, raios, sombras |
| [`index.html`](index.html) | **Catálogo navegável** — todos os componentes com markup de exemplo |
| [`shell-responsive.html`](shell-responsive.html) | Demo do shell (header + drawer + grid) nos breakpoints |

## Como linkar

O caminho relativo depende da profundidade do protótipo dentro de `prototypes/`:

```html
<!-- prototypes/[dominio]/[agrupamento-funcional]/flow.html -->
<link rel="stylesheet" href="../../_biblioteca-ds/ds.css">

<!-- prototypes/[dominio]/[agrupamento-funcional]/[funcionalidade]/form.html -->
<link rel="stylesheet" href="../../../_biblioteca-ds/ds.css">
```

## O shell (protótipos FULL)

Estrutura canônica — sidebar **oculta por padrão**, aberta como drawer pelo ☰ (classe `is-menu-open` no `.dsc-app`); o backdrop fecha ao clicar fora:

```html
<div class="dsc-app">
  <aside class="dsc-sidebar">
    <div class="dsc-sidebar-backdrop" onclick="dscToggleMenu()"></div>
    <div class="dsc-sidebar-brand"><span class="dsc-brand-mark">S</span> Sistema</div>
    <ul class="dsc-menu">
      <li class="dsc-menu-section">Seção</li>
      <li><a class="dsc-menu-item is-active" href="#">Item</a></li>
    </ul>
  </aside>
  <div class="dsc-shell-main">
    <header class="dsc-header">…</header>
    <main class="dsc-main">…</main>
  </div>
</div>
<script>
  function dscToggleMenu() {
    document.querySelector('.dsc-app').classList.toggle('is-menu-open');
  }
</script>
```

**Protótipo sem shell** (Storybook, iframe, doc técnica — prompts `6C`/`6D`): troque o bloco `.dsc-app` por `<main class="dsc-component-only">…</main>`.

**Tema escuro**: adicione a classe `app-dark` ao `<html>` ou `<body>`.

## Catálogo de classes

O markup de exemplo de cada componente está no [`index.html`](index.html) — **não invente variações**: se algo não está aqui, não existe na biblioteca.

| Grupo | Classes |
|---|---|
| Shell | `dsc-app` `is-menu-open` · `dsc-sidebar` `dsc-sidebar-backdrop` `dsc-sidebar-brand` `dsc-brand-mark` · `dsc-menu` `dsc-menu-section` `dsc-menu-item` `is-active` · `dsc-shell-main` · `dsc-header` `dsc-header-start` `dsc-header-actions` `dsc-header-logo` `dsc-header-item` `dsc-menu-toggle` · `dsc-hi-body` `dsc-hi-title` `dsc-hi-sub` `dsc-hi-caret` · `dsc-main` `is-narrow` · `dsc-page-header` `dsc-page-title` `dsc-page-subtitle` · `dsc-breadcrumb` `is-current` `dsc-sep` · `dsc-component-only` |
| Grid / utilitários | `dsc-row` `dsc-col-{1..12}` · `dsc-grid-{2,3,4}` `dsc-gap-{1,2,3}` · `dsc-flex` `dsc-items-center` `dsc-justify-between` · `dsc-divider` |
| Tipografia | `dsc-display` `dsc-title` `dsc-title-sm` `dsc-body` `dsc-body-sm` `dsc-caption` · `dsc-text-muted` `dsc-text-primary` · `dsc-req` |
| Card | `dsc-card` `dsc-card-title` |
| Botões | `dsc-btn` (+ `--outline` `--chromeless` `--danger` `--on-media` `--sm` `--icon` · `is-loading` `disabled`) · `dsc-segmented` · `dsc-icon-action` |
| Formulários | `dsc-field` (+ `is-invalid`) `dsc-field-label` `dsc-field-hint` `dsc-field-error` `dsc-field-action` · `dsc-input` `dsc-textarea` `dsc-select` `dsc-input-icon` `dsc-search` · `dsc-check` `dsc-radio` `dsc-switch` (+ `is-on`) `dsc-slider` `dsc-stepper` · `dsc-money` `dsc-pin` `dsc-input-chips` `dsc-account-select` `dsc-calendar` |
| Tabela | `dsc-table-wrap` `dsc-table` (+ `--dense`) · `dsc-table-toolbar` `dsc-table-footer` `dsc-table-empty` · `dsc-col-check` `dsc-col-actions` · `dsc-sortable` (+ `is-sorted`) `dsc-num` `dsc-cell-editable` · `tr.is-selected` · `dsc-lv` `dsc-lv-label` `dsc-lv-value` |
| Modal | `dsc-modal-mask` `dsc-modal` `dsc-modal-header` `dsc-modal-close` `dsc-modal-body` `dsc-modal-footer` |
| Feedback | `dsc-toast` (+ `--positive` `--danger` `--warning`) · `dsc-alert` (+ `--success` `--warning` `--danger`, `dsc-alert-cta`) · `dsc-tag` (+ `--highlight` `--neutral` `--success` `--warning` `--danger` `--sm` `--lg`) · `dsc-badge` (+ `--dot`) · `dsc-chip` · `dsc-avatar` (+ `--sm`) |
| Estados de tela | `dsc-skeleton` · `dsc-state` `dsc-state-icon` `dsc-state-title` `dsc-state-text` · `dsc-spinner` · `dsc-progress` |
| Protótipo | `dsc-proto-badge` · `dsc-proto-notes` · `dsc-screen` (+ `is-active`) |

## Fonte

A **CAIXA Std** é proprietária e **não** vem embutida — sem `@font-face` ou instalação local, o navegador usa o fallback (`Segoe UI`/Roboto/system-ui). Para fidelidade total, embuta os arquivos da fonte e declare o `@font-face` apontando para `--dsc-font-family-1`.
