/* =========================================================================
   PROTÓTIPO — grafo de rastreabilidade + backlinks
   Vanilla JS + SVG. Sem dependências, sem build (igual ao site docs/).
   - mini simulação de força (repulsão + molas + centro + colisão)
   - clique: realça vizinhos (1 salto) + painel de relações/backlinks
   - duplo-clique numa história: modo rastro (cadeia história→spec→código)
   - filtros por camada, busca, zoom/pan, drag de nó, tema claro/escuro
   ========================================================================= */
(function () {
  "use strict";

  var DATA = window.TRACE_DATA;
  var SVGNS = "http://www.w3.org/2000/svg";

  /* ---------- metadados de tipos e elos ---------- */
  var TYPES = {
    produto:    { label: "Visão de Produto (N0)", color: "var(--t-produto)", shape: "rect", r: 16 },
    dominio:    { label: "Domínios (N1)",         color: "var(--t-dominio)", shape: "circle", r: 15 },
    featureset: { label: "Agrupamentos Funcionais (N2)",     color: "var(--t-featureset)", shape: "circle", r: 12 },
    feature:    { label: "Funcionalidades (N3)",         color: "var(--s-spec)", shape: "circle", r: 10, byStatus: true },
    historia:   { label: "Histórias",             color: "var(--t-historia)", shape: "rect", r: 11 },
    repo:       { label: "Código",                color: "var(--t-repo)", shape: "rect", r: 11 },
  };
  var STATUS = {
    spec:      { label: "Especificado", icon: "📋", color: "var(--s-spec)" },
    dev:       { label: "Em desenvolvimento", icon: "🔄", color: "var(--s-dev)" },
    impl:      { label: "Implementado", icon: "✅", color: "var(--s-impl)" },
    revisao:   { label: "Revisão necessária", icon: "⚠️", color: "var(--s-revisao)" },
    deprecado: { label: "Deprecado", icon: "❌", color: "var(--s-deprecado)" },
  };
  var EDGES = {
    contem:     { label: "contém", style: "", color: "var(--e-contem)" },
    origina:    { label: "origina", style: "", color: "var(--e-origina)" },
    implementa: { label: "implementa", style: "dashed", color: "var(--e-implementa)" },
    integra:    { label: "integra", style: "dotted", color: "var(--e-integra)" },
  };

  function nodeColor(n) {
    if (n.type === "feature" && n.status && STATUS[n.status]) return STATUS[n.status].color;
    return TYPES[n.type].color;
  }

  /* ---------- index ---------- */
  var byId = {};
  DATA.nodes.forEach(function (n) { byId[n.id] = n; });
  // adjacency (both directions)
  var adj = {};
  DATA.nodes.forEach(function (n) { adj[n.id] = { out: [], in: [] }; });
  DATA.edges.forEach(function (e) {
    if (!byId[e.from] || !byId[e.to]) return;
    adj[e.from].out.push(e);
    adj[e.to].in.push(e);
  });

  /* ---------- estado ---------- */
  var hidden = {};         // type -> true se camada oculta
  var selected = null;     // id selecionado
  var traceMode = false;   // realça cadeia descendente completa
  var sim;

  /* ---------- DOM ---------- */
  var svg = document.getElementById("graph");
  var gRoot = el("g");      // transform (zoom/pan)
  var gEdges = el("g");
  var gNodes = el("g");
  gRoot.appendChild(gEdges); gRoot.appendChild(gNodes); svg.appendChild(gRoot);

  document.getElementById("sysName").textContent = DATA.meta.system + " — Rastreabilidade";
  document.getElementById("sysSub").textContent =
    "gerado de .md · engine " + DATA.meta.engineVersion + " · " + DATA.meta.generatedAt;

  /* ---------- viewport / zoom-pan ---------- */
  var view = { x: 0, y: 0, k: 1 };
  function applyView() {
    gRoot.setAttribute("transform", "translate(" + view.x + "," + view.y + ") scale(" + view.k + ")");
  }

  /* =======================================================================
     Mini simulação de força
     ======================================================================= */
  function size() { var r = svg.getBoundingClientRect(); return { w: r.width || 900, h: r.height || 600 }; }

  // raio de colisão por nó — inclui folga para o rótulo não encavalar.
  // rótulos longos ampliam o raio (largura estimada do texto a 10px).
  function collR(n) {
    var base = TYPES[n.type].r;
    var pad = (n.type === "produto" || n.type === "dominio") ? 40 : 30;
    var halfLabel = (String(n.label).length * 5.2) / 2 + 8;
    return Math.max(base + pad, halfLabel);
  }

  function initPositions() {
    var s = size(), cx = s.w / 2, cy = s.h / 2;
    // anéis por nível, para já começar espalhado e em camadas
    var ringOf = { produto: 0, dominio: 1, featureset: 2, feature: 3, historia: 3.4, repo: 4.1 };
    var perRing = {};
    DATA.nodes.forEach(function (n) { perRing[n.type] = (perRing[n.type] || 0) + 1; });
    var idx = {};
    DATA.nodes.forEach(function (n) {
      idx[n.type] = (idx[n.type] || 0);
      var count = perRing[n.type], i = idx[n.type]++;
      var a = (i / count) * Math.PI * 2 + (ringOf[n.type] || 0);
      var rad = 70 + (ringOf[n.type] || 0) * 150;
      n.x = cx + Math.cos(a) * rad + (Math.random() - 0.5) * 40;
      n.y = cy + Math.sin(a) * rad + (Math.random() - 0.5) * 40;
      n.vx = 0; n.vy = 0;
    });
  }

  function createSim() {
    var alpha = 1, alphaDecay = 0.010, alphaMin = 0.004, running = true, raf, settled = false;
    var LINK = 175, LINK_HIER = 125, CHARGE = -1900, CENTER = 0.009, MAXV = 16;

    function tick() {
      var s = size(), cx = s.w / 2, cy = s.h / 2;
      var nodes = DATA.nodes, i, j;

      // repulsão O(n^2)
      for (i = 0; i < nodes.length; i++) {
        var a = nodes[i];
        for (j = i + 1; j < nodes.length; j++) {
          var b = nodes[j];
          var dx = a.x - b.x, dy = a.y - b.y;
          var d2 = dx * dx + dy * dy || 0.01;
          var d = Math.sqrt(d2);
          var f = (CHARGE * alpha) / d2;
          var fx = (dx / d) * f, fy = (dy / d) * f;
          a.vx += fx; a.vy += fy; b.vx -= fx; b.vy -= fy;
        }
      }
      // molas
      DATA.edges.forEach(function (e) {
        var na = byId[e.from], nb = byId[e.to];
        if (!na || !nb) return;
        var dx = nb.x - na.x, dy = nb.y - na.y;
        var d = Math.sqrt(dx * dx + dy * dy) || 0.01;
        var rest = e.kind === "contem" ? LINK_HIER : LINK;
        var f = ((d - rest) / d) * 0.35 * alpha;
        var fx = dx * f, fy = dy * f;
        na.vx += fx; na.vy += fy; nb.vx -= fx; nb.vy -= fy;
      });
      // gravidade fraca ao centro
      nodes.forEach(function (n) {
        n.vx += (cx - n.x) * CENTER * alpha;
        n.vy += (cy - n.y) * CENTER * alpha;
      });
      // integração de velocidade
      nodes.forEach(function (n) {
        if (n.fx != null) { n.x = n.fx; n.vx = 0; }
        if (n.fy != null) { n.y = n.fy; n.vy = 0; }
        n.vx = Math.max(-MAXV, Math.min(MAXV, n.vx * 0.85));
        n.vy = Math.max(-MAXV, Math.min(MAXV, n.vy * 0.85));
        n.x += n.vx; n.y += n.vy;
      });
      // COLISÃO — separa nós que se sobrepõem (chave da legibilidade)
      for (var pass = 0; pass < 2; pass++) {
        for (i = 0; i < nodes.length; i++) {
          for (j = i + 1; j < nodes.length; j++) {
            var p = nodes[i], q = nodes[j];
            var ddx = q.x - p.x, ddy = q.y - p.y;
            var dist = Math.sqrt(ddx * ddx + ddy * ddy) || 0.01;
            var minD = collR(p) + collR(q);
            if (dist < minD) {
              var push = (minD - dist) / dist / 2;
              var ox = ddx * push, oy = ddy * push;
              if (p.fx == null) { p.x -= ox; p.y -= oy; }
              if (q.fx == null) { q.x += ox; q.y += oy; }
            }
          }
        }
      }

      render();
      alpha = Math.max(alphaMin, alpha - alphaDecay);
      if (alpha > alphaMin && running) raf = requestAnimationFrame(tick);
      else { running = false; if (!settled) { settled = true; fitView(); } }
    }

    return {
      start: function () { running = true; settled = false; alpha = 1; cancelAnimationFrame(raf); raf = requestAnimationFrame(tick); },
      reheat: function () { settled = false; alpha = 0.7; if (!running) { running = true; raf = requestAnimationFrame(tick); } },
      nudge: function () { if (!running) { running = true; alpha = Math.max(alpha, 0.12); raf = requestAnimationFrame(tick); } },
    };
  }

  /* =======================================================================
     Render
     ======================================================================= */
  var nodeEls = {}, edgeEls = [];

  function buildSvg() {
    gEdges.innerHTML = ""; gNodes.innerHTML = "";
    nodeEls = {}; edgeEls = [];

    DATA.edges.forEach(function (e) {
      var line = el("line");
      line.setAttribute("class", "edge kind-" + e.kind);
      line.__edge = e;
      gEdges.appendChild(line);
      edgeEls.push({ e: e, line: line });
    });

    DATA.nodes.forEach(function (n) {
      var g = el("g");
      g.setAttribute("class", "node type-" + n.type);
      g.__id = n.id;
      var t = TYPES[n.type];

      var ring = el("circle");
      ring.setAttribute("class", "ring");
      ring.setAttribute("r", t.r + 5);
      g.appendChild(ring);

      var shape;
      if (t.shape === "rect") {
        shape = el("rect");
        var s = t.r * 1.9;
        shape.setAttribute("width", s); shape.setAttribute("height", s);
        shape.setAttribute("x", -s / 2); shape.setAttribute("y", -s / 2);
        shape.setAttribute("rx", 5);
      } else {
        shape = el("circle");
        shape.setAttribute("r", t.r);
      }
      shape.setAttribute("fill", nodeColor(n));
      g.appendChild(shape);

      var label = el("text");
      label.setAttribute("text-anchor", "middle");
      label.setAttribute("dy", t.r + 13);
      label.textContent = n.label;
      g.appendChild(label);

      if (n.type === "feature" || n.type === "featureset" || n.type === "historia") {
        var sub = el("text");
        sub.setAttribute("class", "sub");
        sub.setAttribute("text-anchor", "middle");
        sub.setAttribute("dy", t.r + 24);
        sub.textContent = n.id;
        g.appendChild(sub);
      }

      g.addEventListener("pointerdown", onNodeDown);
      g.addEventListener("dblclick", function (ev) { ev.stopPropagation(); openTrace(n.id); });
      gNodes.appendChild(g);
      nodeEls[n.id] = { g: g, shape: shape };
    });
  }

  function render() {
    edgeEls.forEach(function (o) {
      var a = byId[o.e.from], b = byId[o.e.to];
      o.line.setAttribute("x1", a.x); o.line.setAttribute("y1", a.y);
      o.line.setAttribute("x2", b.x); o.line.setAttribute("y2", b.y);
    });
    DATA.nodes.forEach(function (n) {
      var ne = nodeEls[n.id];
      if (ne) ne.g.setAttribute("transform", "translate(" + n.x + "," + n.y + ")");
    });
  }

  /* ---------- realce de seleção / camadas / rastro ---------- */
  function highlightSet(id) {
    // vizinhos 1 salto
    var keep = {}; keep[id] = true;
    (adj[id].out.concat(adj[id].in)).forEach(function (e) { keep[e.from] = true; keep[e.to] = true; });
    return keep;
  }
  function traceSet(id) {
    // cadeia: para cima (origens) e para baixo (impl), seguindo origina/contem/implementa
    var keep = {}; var stack = [id]; keep[id] = true;
    while (stack.length) {
      var cur = stack.pop();
      adj[cur].out.forEach(function (e) { if (!keep[e.to]) { keep[e.to] = true; stack.push(e.to); } });
      adj[cur].in.forEach(function (e) { if (!keep[e.from]) { keep[e.from] = true; stack.push(e.from); } });
    }
    return keep;
  }

  function paintStates() {
    var keep = null;
    if (selected) keep = traceMode ? traceSet(selected) : highlightSet(selected);

    DATA.nodes.forEach(function (n) {
      var ne = nodeEls[n.id]; if (!ne) return;
      var off = hidden[n.type];
      ne.g.style.display = off ? "none" : "";
      ne.g.classList.toggle("dim", !!keep && !keep[n.id]);
      ne.g.classList.toggle("sel", n.id === selected);
      ne.g.classList.toggle("hot", !!keep && !!keep[n.id] && n.id !== selected);
    });
    edgeEls.forEach(function (o) {
      var off = hidden[byId[o.e.from].type] || hidden[byId[o.e.to].type];
      o.line.style.display = off ? "none" : "";
      var hot = keep && keep[o.e.from] && keep[o.e.to];
      o.line.classList.toggle("dim", !!keep && !hot);
      o.line.classList.toggle("hot", !!hot);
    });
  }

  function select(id) {
    selected = id;
    document.getElementById("selectionCap").textContent = id ? id + " · " + byId[id].label : "nada selecionado";
    paintStates();
    renderDetail(id);
    sim.nudge();
  }
  function openTrace(id) {
    traceMode = true;
    document.getElementById("btnTrace").classList.add("is-active");
    select(id);
  }
  function clearSelection() {
    selected = null;
    document.getElementById("selectionCap").textContent = "nada selecionado";
    paintStates();
    showEmptyDetail();
  }

  /* =======================================================================
     Painel de detalhe (página + relações + BACKLINKS)
     ======================================================================= */
  var $body = document.getElementById("detailBody");
  var $empty = document.getElementById("detailEmpty");

  function showEmptyDetail() { $empty.hidden = false; $body.hidden = true; }

  function renderDetail(id) {
    var n = byId[id];
    var t = TYPES[n.type];
    $empty.hidden = true; $body.hidden = false;

    var out = adj[id].out.slice(), inc = adj[id].in.slice();

    var statusHtml = "";
    if (n.type === "feature" && n.status && STATUS[n.status]) {
      var st = STATUS[n.status];
      statusHtml = '<span class="status-badge" style="background:' + softColor(st.color) +
        ';color:' + st.color + '"><span class="sd" style="background:' + st.color +
        '"></span>' + st.icon + " " + st.label + "</span>";
    }

    var meta = [];
    if (n.domain) meta.push('<span class="tag">Domínio <b>' + esc(n.domain) + "</b></span>");
    if (n.pf != null) meta.push('<span class="tag">PF <b>' + n.pf + "</b></span>");
    if (n.type === "feature" && n.pf == null) meta.push('<span class="tag">PF <b>—</b></span>');

    var isExternal = /^https?:/.test(n.path || "");
    var openHref = isExternal ? n.path : ("../index.html#" + encodeURI(n.path));

    var html = "";
    html += '<span class="d-type" style="background:' + softColor(t.color) + ';color:' + t.color + '">' +
              typeIcon(n.type) + esc(t.label.replace(/ \(.*\)/, "")) + "</span>";
    html += '<h2 class="d-title">' + esc(n.label) + "</h2>";
    html += '<div class="d-id">' + esc(n.id) + (n.sub ? " · " + esc(n.sub) : "") + "</div>";
    if (n.desc) html += '<p class="d-desc">' + esc(n.desc) + "</p>";
    if (statusHtml || meta.length) html += '<div class="d-meta">' + statusHtml + meta.join("") + "</div>";

    html += '<div class="d-actions">';
    html += '<a class="btn btn--ghost" href="' + esc(openHref) + '" target="_blank" rel="noopener">' +
            (isExternal ? "Abrir repo ↗" : "Abrir .md ↗") + "</a>";
    html += '<a class="btn btn--ghost" href="#" data-focus="' + esc(id) + '">Centralizar</a>';
    html += "</div>";

    // Aponta para (saídas)
    html += relGroup("Aponta para", out, "to", false);
    // Backlinks (entradas) — o recurso que o .md cru não mostra
    html += relGroup("Backlinks — quem aponta para isto", inc, "from", true);

    $body.innerHTML = html;

    // wire relation clicks
    $body.querySelectorAll(".rel-item").forEach(function (it) {
      it.addEventListener("click", function () { select(it.dataset.target); centerOn(it.dataset.target); });
    });
    var focus = $body.querySelector("[data-focus]");
    if (focus) focus.addEventListener("click", function (ev) { ev.preventDefault(); centerOn(id); });
  }

  function relGroup(title, edges, endKey, isBacklink) {
    var head = '<div class="rel-group"><div class="rel-head' + (isBacklink ? " backlinks" : "") + '">' +
      (isBacklink ? backIcon() : fwdIcon()) + esc(title) +
      '<span class="n">' + edges.length + "</span></div>";
    if (!edges.length) return head + '<div class="rel-empty">— nenhum —</div></div>';
    var list = '<div class="rel-list">';
    edges.forEach(function (e) {
      var other = byId[e[endKey]];
      var ek = EDGES[e.kind];
      list += '<div class="rel-item" data-target="' + esc(other.id) + '">' +
        '<span class="dot' + (TYPES[other.type].shape === "rect" ? " dot--sq" : "") +
          '" style="background:' + nodeColor(other) + '"></span>' +
        '<span class="ri-main"><span class="ri-label">' + esc(other.label) + "</span>" +
        '<span class="ri-id">' + esc(other.id) + "</span></span>" +
        '<span class="ri-edge kind-' + e.kind + '">' + esc(ek.label) + "</span></div>";
      if (e.note) list += '<div class="rel-note">↳ ' + esc(e.note) + "</div>";
    });
    return head + list + "</div></div>";
  }

  /* =======================================================================
     Rail: legendas e filtros
     ======================================================================= */
  function buildRail() {
    // contagem por tipo
    var counts = {};
    DATA.nodes.forEach(function (n) { counts[n.type] = (counts[n.type] || 0) + 1; });

    var layers = document.getElementById("layerFilters");
    layers.innerHTML = "";
    Object.keys(TYPES).forEach(function (tp) {
      if (!counts[tp]) return;
      var li = document.createElement("li");
      li.dataset.type = tp;
      li.innerHTML = '<span class="dot' + (TYPES[tp].shape === "rect" ? " dot--sq" : "") +
        '" style="background:' + TYPES[tp].color + '"></span>' +
        esc(TYPES[tp].label) + '<span class="count">' + counts[tp] + "</span>";
      li.addEventListener("click", function () {
        hidden[tp] = !hidden[tp];
        li.classList.toggle("is-off", !!hidden[tp]);
        paintStates();
      });
      layers.appendChild(li);
    });

    var edgeLeg = document.getElementById("edgeLegend");
    edgeLeg.innerHTML = "";
    Object.keys(EDGES).forEach(function (k) {
      var li = document.createElement("li");
      li.style.cursor = "default";
      li.innerHTML = '<span class="edge-key ' + (EDGES[k].style || "") + '" style="border-top-color:' +
        EDGES[k].color + '"></span>' + esc(edgeDesc(k));
      edgeLeg.appendChild(li);
    });

    var statusLeg = document.getElementById("statusLegend");
    statusLeg.innerHTML = "";
    Object.keys(STATUS).forEach(function (k) {
      var li = document.createElement("li");
      li.style.cursor = "default";
      li.innerHTML = '<span class="dot" style="background:' + STATUS[k].color + '"></span>' +
        STATUS[k].icon + " " + esc(STATUS[k].label);
      statusLeg.appendChild(li);
    });

    var totalPf = DATA.nodes.reduce(function (a, n) { return a + (n.status !== "deprecado" && n.pf ? n.pf : 0); }, 0);
    document.getElementById("stats").innerHTML =
      stat(DATA.nodes.filter(function(n){return n.type==="feature";}).length, "Funcionalidades (N3)") +
      stat(DATA.nodes.filter(function(n){return n.type==="historia";}).length, "Histórias") +
      stat(DATA.edges.filter(function(e){return e.kind==="origina";}).length, "Elos de rastro") +
      stat(totalPf, "PF vigente");
  }
  function stat(v, l) { return '<div class="stat"><b>' + v + "</b><span>" + esc(l) + "</span></div>"; }
  function edgeDesc(k) {
    return ({ contem: "contém (hierarquia)", origina: "origina (história→N3)",
      implementa: "implementa (N3→código)", integra: "integra (domínio↔domínio)" })[k];
  }

  /* =======================================================================
     Busca
     ======================================================================= */
  var $search = document.getElementById("search");
  var pop;
  $search.addEventListener("input", function () {
    var q = $search.value.trim().toLowerCase();
    if (pop) { pop.remove(); pop = null; }
    if (!q) return;
    var hits = DATA.nodes.filter(function (n) {
      return (n.id + " " + n.label + " " + (n.desc || "")).toLowerCase().indexOf(q) !== -1;
    }).slice(0, 8);
    if (!hits.length) return;
    pop = document.createElement("div");
    pop.className = "search-pop";
    hits.forEach(function (n) {
      var it = document.createElement("div");
      it.className = "rel-item";
      it.innerHTML = '<span class="dot' + (TYPES[n.type].shape === "rect" ? " dot--sq" : "") +
        '" style="background:' + nodeColor(n) + '"></span>' +
        '<span class="ri-main"><span class="ri-label">' + esc(n.label) +
        '</span><span class="ri-id">' + esc(n.id) + "</span></span>";
      it.addEventListener("click", function () {
        select(n.id); centerOn(n.id); pop.remove(); pop = null; $search.value = "";
      });
      pop.appendChild(it);
    });
    document.querySelector(".topbar__search").appendChild(pop);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "/" && document.activeElement !== $search) { e.preventDefault(); $search.focus(); }
    if (e.key === "Escape") { if (pop) { pop.remove(); pop = null; } $search.blur(); clearSelection(); resetTrace(); }
  });

  /* =======================================================================
     Interação: pan/zoom + drag de nó
     ======================================================================= */
  var drag = null;   // { node, moved, sx, sy }
  var pan = null;    // { ox, oy, moved, sx, sy }
  var THRESH = 4;

  function onNodeDown(ev) {
    ev.stopPropagation();
    drag = { node: byId[ev.currentTarget.__id], moved: false, sx: ev.clientX, sy: ev.clientY };
  }
  // pointerdown no fundo do SVG (nós dão stopPropagation) → inicia pan
  svg.addEventListener("pointerdown", function (ev) {
    pan = { ox: ev.clientX - view.x, oy: ev.clientY - view.y, moved: false, sx: ev.clientX, sy: ev.clientY };
    svg.classList.add("grabbing");
  });
  window.addEventListener("pointermove", function (ev) {
    if (drag) {
      if (!drag.moved && Math.hypot(ev.clientX - drag.sx, ev.clientY - drag.sy) > THRESH) drag.moved = true;
      if (drag.moved) {
        var p = toLocal(ev.clientX, ev.clientY);
        drag.node.fx = p.x; drag.node.fy = p.y; sim.nudge();
      }
      return;
    }
    if (pan) {
      if (!pan.moved && Math.hypot(ev.clientX - pan.sx, ev.clientY - pan.sy) > THRESH) pan.moved = true;
      view.x = ev.clientX - pan.ox; view.y = ev.clientY - pan.oy; applyView();
    }
  });
  window.addEventListener("pointerup", function () {
    if (drag) {
      if (!drag.moved) select(drag.node.id);                 // clique = selecionar
      else { drag.node.fx = null; drag.node.fy = null; sim.nudge(); }  // soltar nó arrastado
      drag = null;
    } else if (pan) {
      if (!pan.moved) clearSelection();                      // clique no fundo = limpar
      pan = null;
    }
    svg.classList.remove("grabbing");
  });
  svg.addEventListener("wheel", function (ev) {
    ev.preventDefault();
    var p = toLocal(ev.clientX, ev.clientY);
    var k = Math.max(0.25, Math.min(2.6, view.k * (ev.deltaY < 0 ? 1.12 : 0.89)));
    view.x = ev.clientX - rectLeft() - p.x * k;
    view.y = ev.clientY - rectTop() - p.y * k;
    view.k = k; applyView();
  }, { passive: false });

  function rectLeft() { return svg.getBoundingClientRect().left; }
  function rectTop() { return svg.getBoundingClientRect().top; }
  function toLocal(cx, cy) {
    return { x: (cx - rectLeft() - view.x) / view.k, y: (cy - rectTop() - view.y) / view.k };
  }

  function centerOn(id) {
    var n = byId[id]; if (!n) return;
    var s = size();
    view.k = Math.max(view.k, 1);
    view.x = s.w / 2 - n.x * view.k;
    view.y = s.h / 2 - n.y * view.k;
    applyView();
  }

  function fitView() {
    var xs = DATA.nodes.filter(function(n){return !hidden[n.type];});
    if (!xs.length) return;
    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    xs.forEach(function (n) { minX = Math.min(minX, n.x); minY = Math.min(minY, n.y); maxX = Math.max(maxX, n.x); maxY = Math.max(maxY, n.y); });
    var s = size(), pad = 70;
    var k = Math.min((s.w - pad * 2) / (maxX - minX || 1), (s.h - pad * 2) / (maxY - minY || 1), 1.4);
    k = Math.max(0.4, k);
    view.k = k;
    view.x = s.w / 2 - ((minX + maxX) / 2) * k;
    view.y = s.h / 2 - ((minY + maxY) / 2) * k;
    applyView();
  }

  /* ---------- toolbar ---------- */
  document.getElementById("btnReset").addEventListener("click", fitView);
  document.getElementById("btnReheat").addEventListener("click", function () { sim.reheat(); });
  document.getElementById("btnTrace").addEventListener("click", function () {
    traceMode = !traceMode;
    this.classList.toggle("is-active", traceMode);
    paintStates();
  });
  function resetTrace() { traceMode = false; document.getElementById("btnTrace").classList.remove("is-active"); paintStates(); }

  /* =======================================================================
     Tema
     ======================================================================= */
  function applyTheme(mode) {
    var dark = mode === "dark" || (mode === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    document.querySelectorAll(".theme-switch button").forEach(function (b) {
      b.classList.toggle("is-active", b.dataset.themeSet === mode);
    });
  }
  (function initTheme() {
    var mode = "system";
    try { mode = localStorage.getItem("doku-theme") || "system"; } catch (e) {}
    applyTheme(mode);
    document.querySelectorAll(".theme-switch button").forEach(function (b) {
      b.addEventListener("click", function () {
        try { localStorage.setItem("doku-theme", b.dataset.themeSet); } catch (e) {}
        applyTheme(b.dataset.themeSet);
      });
    });
  })();

  /* =======================================================================
     Helpers
     ======================================================================= */
  function el(tag) { return document.createElementNS(SVGNS, tag); }
  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function softColor(c) {
    // converte var(--x) numa versão translúcida via color-mix (suporte amplo); fallback subtle
    if (/^var\(/.test(c)) return "color-mix(in srgb, " + c + " 14%, transparent)";
    return c + "22";
  }
  function typeIcon(t) {
    var m = { produto: "◆ ", dominio: "● ", featureset: "○ ", feature: "• ", historia: "▣ ", repo: "▢ " };
    return m[t] || "";
  }
  function fwdIcon() { return '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="margin-right:2px"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'; }
  function backIcon() { return '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="margin-right:2px"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>'; }

  /* =======================================================================
     Boot
     ======================================================================= */
  initPositions();
  buildSvg();
  buildRail();
  showEmptyDetail();
  sim = createSim();
  sim.start(); // enquadra sozinho (fitView) quando a simulação assenta
  window.addEventListener("resize", function () { applyView(); });
})();
