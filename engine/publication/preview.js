(function () {
  "use strict";
  var nav = document.querySelector(".docqui-preview");
  if (!nav) return;
  var menu = nav.querySelector(".docqui-preview__menu");
  // As rotas do artefato continuam na outra branch; âncoras do diff, não.
  function route() {
    if (document.body.classList.contains("docqui-review")) return;
    menu.querySelectorAll("a[href]").forEach(function (link) { link.hash = location.hash; });
  }
  route();
  window.addEventListener("hashchange", route);
  document.addEventListener("click", function (event) {
    if (menu.open && !menu.contains(event.target)) menu.open = false;
  });
  menu.addEventListener("keydown", function (event) {
    if (event.key !== "Escape" || !menu.open) return;
    menu.open = false;
    menu.querySelector("summary").focus();
  });

  var toggle = nav.querySelector("[data-docqui-inline-toggle]");
  if (!toggle) return;
  var status = nav.querySelector("[data-docqui-inline-status]");
  var source = null, metadata = null, loadError = null, comparison = null, observer = null;
  var legacyContent = null;
  function message(value, error) {
    status.textContent = value;
    status.setAttribute("role", error ? "alert" : "status");
  }
  function clear() {
    if (comparison) comparison.clear();
    comparison = null;
  }
  function refresh() {
    if (observer) observer.disconnect();
    try { renderCurrent(); }
    finally { if (observer) observer.observe(legacyContent, { childList: true, subtree: true }); }
  }
  function renderCurrent() {
    clear();
    if (loadError) { message(loadError, true); return; }
    if (!toggle.checked) { message("Destaques desativados."); return; }
    if (!source) { message("Selecione um artefato para comparar."); return; }
    if (!metadata) { message("Carregando comparação…"); return; }
    var prefix = source.root === "repository" || metadata.siteDir === "." ? "" : metadata.siteDir + "/";
    var file = metadata.files.find(function (item) {
      if (!item.path.startsWith(prefix)) return false;
      var path = item.path.slice(prefix.length);
      return path === source.path || path.split("/").map(encodeURIComponent).join("/") === source.path;
    });
    if (!file) { message("Este artefato não foi alterado em relação à base."); return; }
    if (!/\.md$/i.test(file.path) || file.binary) { message("Destaques disponíveis para conteúdo Markdown; consulte Ver alterações para este arquivo."); return; }
    try {
      if (typeof file.before !== "string" && file.before !== null) throw new Error("Conteúdo anterior ausente. Remonte a publicação.");
      if (!window.DOCQUI_INLINE_DIFF || !window.marked || typeof window.marked.parse !== "function") throw new Error("Visualizador sem o comparador ou renderizador Markdown.");
      comparison = window.DOCQUI_INLINE_DIFF.apply(source.element, file.before, function (md) { return window.marked.parse(md); });
      var parts = [];
      if (comparison.stats.cells) parts.push(comparison.stats.cells + " célula(s)");
      if (comparison.stats.rows) parts.push(comparison.stats.rows + " linha(s)");
      if (comparison.stats.blocks) parts.push(comparison.stats.blocks + " bloco(s)");
      message(parts.length ? parts.join(" · ") + " com diferenças. Palavras removidas riscadas; incluídas destacadas." : "Arquivo alterado, sem diferença no texto renderizado.");
    } catch (error) {
      console.error("Docqui: falha na comparação do artefato.", error);
      message("Não foi possível destacar as alterações: " + error.message, true);
    }
  }
  function rendered(detail) {
    if (!detail || typeof detail.path !== "string" || !detail.element) {
      clear(); source = null; message("O visualizador não informou a origem do artefato.", true); return;
    }
    source = detail;
    refresh();
  }
  document.addEventListener("docqui:artifact", function (event) { rendered(event.detail); });
  document.addEventListener("docqui:artifact-reset", function () { clear(); source = null; refresh(); });
  toggle.addEventListener("change", refresh);
  var copied = new WeakMap();
  document.addEventListener("click", function (event) {
    var button = event.target instanceof Element && event.target.closest(".copy-btn");
    var pre = button && button.closest("pre"), code = pre && pre.querySelector("code");
    if (!code || !code.querySelector("[data-docqui-removed]")) return;
    // A casca anterior copiaria também as palavras removidas da comparação.
    event.preventDefault();
    event.stopImmediatePropagation();
    if (!navigator.clipboard || typeof navigator.clipboard.writeText !== "function") { message("Não foi possível copiar: área de transferência indisponível.", true); return; }
    navigator.clipboard.writeText(window.DOCQUI_INLINE_DIFF.currentText(code)).then(function () {
      if (button.classList.contains("copied") && !copied.has(button)) return;
      var state = copied.get(button) || { html: button.innerHTML };
      clearTimeout(state.timer);
      button.classList.add("copied");
      button.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m5 12 4 4L19 6"/></svg>';
      state.timer = setTimeout(function () { button.classList.remove("copied"); button.innerHTML = state.html; copied.delete(button); }, 1600);
      copied.set(button, state);
    }).catch(function (error) {
      console.error("Docqui: falha ao copiar o código atual.", error);
      message("Não foi possível copiar o código atual: " + error.message, true);
    });
  }, true);
  var content = document.querySelector("[data-docqui-source]");
  if (content) source = { path: content.dataset.docquiSource, root: content.dataset.docquiSourceRoot, element: content };
  function initLegacy() {
    if (observer || !window.DOKU_CONFIG) return;
    legacyContent = document.getElementById("content");
    if (!legacyContent) return;
    function legacyRendered() {
      if (legacyContent.dataset.docquiSource) return;
      var route = location.hash.replace(/^#\/?/, "").split("#")[0];
      if (!route || legacyContent.querySelector(".state")) { source = null; refresh(); return; }
      rendered({
        path: route.startsWith("file/") ? route.slice(5) : "content/" + route + ".md",
        root: route.startsWith("file/") ? "repository" : "site",
        element: legacyContent,
      });
    }
    observer = new MutationObserver(legacyRendered);
    observer.observe(legacyContent, { childList: true, subtree: true });
    legacyRendered();
  }
  initLegacy();
  // A casca carrega config/app dinamicamente, depois dos scripts defer.
  window.addEventListener("load", initLegacy, { once: true });
  fetch(new URL("_docqui/changes.json", location.href), { cache: "no-cache" })
    .then(function (response) { if (!response.ok) throw new Error("HTTP " + response.status); return response.json(); })
    .then(function (data) {
      if (!Array.isArray(data.files) || typeof data.siteDir !== "string") throw new Error("Metadados de comparação inválidos.");
      metadata = data; refresh();
    })
    .catch(function (error) {
      console.error("Docqui: falha ao carregar a comparação.", error);
      loadError = "Não foi possível carregar as diferenças: " + error.message;
      refresh();
    });
})();
