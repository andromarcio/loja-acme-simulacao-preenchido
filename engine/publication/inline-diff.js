(function () {
  "use strict";

  var segmenter = new Intl.Segmenter("pt", { granularity: "word" });
  var excluded = ".copy-btn, .heading-anchor, .page-nav, .file-banner, .docqui-inline-label, [data-docqui-removed], [data-docqui-gap]";
  function read(node) {
    var value = "", parts = [];
    var walker = document.createTreeWalker(node, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
      acceptNode: function (item) {
        if (item.nodeType === 1 && item.matches(excluded)) return NodeFilter.FILTER_REJECT;
        return item.nodeType === 3 || item.nodeName === "BR" ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
      },
    });
    var item;
    while ((item = walker.nextNode())) {
      var part = item.nodeType === 3 ? item.data : "\n";
      parts.push({ node: item, start: value.length, end: value.length + part.length, value: part });
      value += part;
    }
    return { value: value, parts: parts };
  }
  function text(node) {
    var value = read(node).value;
    return node.tagName === "PRE" ? value : value.replace(/\s+/g, " ").trim();
  }

  function align(before, after, key, score) {
    var left = before.map(key), right = after.map(key);
    var start = 0, endLeft = left.length, endRight = right.length;
    var result = [], tail = [], gaps = [];
    while (start < endLeft && start < endRight && left[start] === right[start]) {
      result.push({ before: before[start], after: after[start] }); start++;
    }
    while (endLeft > start && endRight > start && left[endLeft - 1] === right[endRight - 1]) {
      tail.unshift({ before: before[--endLeft], after: after[--endRight] });
    }
    var n = endLeft - start, m = endRight - start, width = m + 1;
    var dp = new Uint32Array((n + 1) * width);
    for (var i = n - 1; i >= 0; i--) for (var j = m - 1; j >= 0; j--) {
      dp[i * width + j] = left[start + i] === right[start + j]
        ? dp[(i + 1) * width + j + 1] + 1
        : Math.max(dp[(i + 1) * width + j], dp[i * width + j + 1]);
    }
    function flush() {
      var old = gaps.filter(function (p) { return p.before; }).map(function (p) { return p.before; });
      var current = gaps.filter(function (p) { return p.after; }).map(function (p) { return p.after; });
      while (old.length || current.length) {
        if (score && old[0] && current[0] && old[0].tagName === current[0].tagName) {
          var added = current.length - old.length, deleted = old.length - current.length;
          var initial = score(old[0], current[0]);
          if (added > 0 && current.slice(1, added + 1).some(function (node) { return node.tagName === old[0].tagName && score(old[0], node) > initial; })) {
            result.push({ before: null, after: current.shift() }); continue;
          }
          if (deleted > 0 && old.slice(1, deleted + 1).some(function (node) { return node.tagName === current[0].tagName && score(node, current[0]) > initial; })) {
            result.push({ before: old.shift(), after: null }); continue;
          }
        }
        if (old[0] && current[0] && old[0].tagName === current[0].tagName) result.push({ before: old.shift(), after: current.shift() });
        else if (old[0] && current.some(function (node) { return node.tagName === old[0].tagName; })) result.push({ before: null, after: current.shift() });
        else if (old.length) result.push({ before: old.shift(), after: null });
        else result.push({ before: null, after: current.shift() });
      }
      gaps = [];
    }
    i = 0; j = 0;
    while (i < n || j < m) {
      if (i < n && j < m && left[start + i] === right[start + j]) {
        flush(); result.push({ before: before[start + i++], after: after[start + j++] });
      } else if (i < n && (j === m || dp[(i + 1) * width + j] >= dp[i * width + j + 1])) {
        gaps.push({ before: before[start + i++], after: null });
      } else gaps.push({ before: null, after: after[start + j++] });
    }
    flush();
    return result.concat(tail);
  }

  function tokens(value) {
    return Array.from(segmenter.segment(value)).filter(function (part) { return part.segment.trim(); }).map(function (part) {
      return { tagName: "TOKEN", value: part.segment, start: part.index, end: part.index + part.segment.length };
    });
  }
  function edits(before, after) {
    var result = [], oldCursor = 0, newCursor = 0;
    function gap(oldEnd, newEnd) {
      var old = before.slice(oldCursor, oldEnd), current = after.slice(newCursor, newEnd);
      if (old === current) return;
      var start = 0, oldTail = old.length, newTail = current.length;
      while (start < oldTail && start < newTail && old[start] === current[start] && /\s/.test(old[start])) start++;
      while (oldTail > start && newTail > start && old[oldTail - 1] === current[newTail - 1] && /\s/.test(old[oldTail - 1])) { oldTail--; newTail--; }
      result.push({ start: newCursor + start, end: newCursor + newTail, before: old.slice(start, oldTail) });
    }
    align(tokens(before), tokens(after), function (part) { return part.value; }).forEach(function (pair) {
      if (pair.before && pair.after && pair.before.value === pair.after.value) {
        gap(pair.before.start, pair.after.start);
        oldCursor = pair.before.end; newCursor = pair.after.end;
      }
    });
    gap(before.length, after.length);
    return result;
  }
  function similarity(before, after) {
    var left = new Set(Array.from(segmenter.segment(text(before))).filter(function (part) { return part.isWordLike; }).map(function (part) { return part.segment; }));
    var right = new Set(Array.from(segmenter.segment(text(after))).filter(function (part) { return part.isWordLike; }).map(function (part) { return part.segment; }));
    return Array.from(left).filter(function (word) { return right.has(word); }).length / Math.max(left.size, right.size, 1);
  }

  function apply(content, beforeMarkdown, parse) {
    var template = document.createElement("template");
    template.innerHTML = parse(beforeMarkdown || "");
    var undo = [], stats = { cells: 0, rows: 0, blocks: 0 };
    function inserted(node, parent, next) {
      parent.insertBefore(node, next || null);
      undo.push(function () { node.remove(); });
    }
    function highlight(node, className) {
      var had = node.classList.contains(className);
      var originalClass = node.getAttribute("class");
      node.classList.add(className);
      if (!had) undo.push(function () {
        node.classList.remove(className);
        if (originalClass === null && !node.classList.length) node.removeAttribute("class");
      });
    }
    function removed(value, tag) {
      var node = document.createElement(tag || "div");
      node.className = "docqui-inline-before";
      if (tag === undefined) node.style.whiteSpace = "pre-wrap";
      var label = document.createElement("span");
      label.className = "docqui-inline-label";
      label.textContent = "Antes: ";
      var del = document.createElement("del");
      del.textContent = value;
      node.append(label, del);
      return node;
    }
    function words(old, current) {
      var after = read(current), changes = edits(read(old).value, after.value);
      if (!changes.length) return false;
      if (!after.parts.length) {
        var empty = document.createTextNode("");
        inserted(empty, current, current.firstChild);
        after = read(current);
      }
      function gap(value) {
        var node = document.createElement("span");
        node.dataset.docquiGap = "";
        node.textContent = value;
        return node;
      }
      function marked(value, removed) {
        var node = document.createElement(removed ? "del" : "ins");
        node.className = removed ? "docqui-inline-word-removed" : "docqui-inline-word-added";
        if (removed) node.dataset.docquiRemoved = "";
        node.textContent = value;
        node.title = (removed ? "Removido: " : "Incluído: ") + value;
        node.setAttribute("aria-label", node.title);
        return node;
      }
      function appendValue(fragment, value, removed) {
        if (!value) return;
        if (!value.trim()) { fragment.append(marked(value, removed)); return; }
        var first = value.search(/\S/), last = value.length - (value.match(/\s*$/)[0].length);
        if (first) fragment.append(removed ? gap(value.slice(0, first)) : document.createTextNode(value.slice(0, first)));
        fragment.append(marked(value.slice(first, last), removed));
        if (last < value.length) fragment.append(removed ? gap(value.slice(last)) : document.createTextNode(value.slice(last)));
      }
      function previous(fragment, change) {
        appendValue(fragment, change.before, true);
        if (/[\p{L}\p{N}]$/u.test(change.before) && /^[\p{L}\p{N}]/u.test(after.value.slice(change.start, change.end))) fragment.append(gap(" "));
      }
      changes.forEach(function (change) {
        change.anchor = after.parts.find(function (part) { return part.node.nodeType === 3 && change.start >= part.start && change.start <= part.end; })
          || after.parts.find(function (part) { return change.start >= part.start && change.start <= part.end; });
        if (!change.anchor) throw new Error("Não foi possível localizar a palavra no conteúdo renderizado.");
      });
      after.parts.forEach(function (part) {
        if (part.node.nodeType !== 3) {
          changes.filter(function (change) { return change.anchor === part && change.before; }).forEach(function (change) {
            var fragment = document.createDocumentFragment();
            previous(fragment, change);
            var next = change.start < part.end ? part.node : part.node.nextSibling;
            Array.from(fragment.childNodes).forEach(function (node) {
              inserted(node, part.node.parentNode, next);
            });
          });
          return;
        }
        var relevant = changes.filter(function (change) {
          return change.anchor === part && change.before || change.start < part.end && change.end > part.start;
        });
        if (!relevant.length) return;
        var fragment = document.createDocumentFragment(), cursor = 0;
        relevant.forEach(function (change) {
          var start = Math.max(0, Math.min(part.value.length, change.start - part.start));
          var end = Math.max(0, Math.min(part.value.length, change.end - part.start));
          fragment.append(part.value.slice(cursor, start));
          if (change.anchor === part && change.before) previous(fragment, change);
          appendValue(fragment, part.value.slice(start, end), false);
          cursor = end;
        });
        fragment.append(part.value.slice(cursor));
        var nodes = Array.from(fragment.childNodes), anchor = document.createComment("docqui-word");
        part.node.replaceWith(anchor);
        anchor.before(fragment);
        undo.push(function () { nodes.forEach(function (node) { node.remove(); }); anchor.replaceWith(part.node); });
      });
      return true;
    }
    function cell(old, current) {
      if (old && text(old) === text(current)) return;
      if (old) {
        if (words(old, current)) { highlight(current, "docqui-inline-cell"); stats.cells++; }
        return;
      }
      var nodes = Array.from(current.childNodes);
      var ins = document.createElement("ins");
      ins.className = "docqui-inline-after";
      var label = document.createElement("span");
      label.className = "docqui-inline-label";
      label.textContent = "Incluído: ";
      ins.append.apply(ins, nodes);
      current.append(label, ins);
      highlight(current, "docqui-inline-cell");
      undo.push(function () { current.replaceChildren.apply(current, nodes); });
      stats.cells++;
    }
    function block(pair, parent, next) {
      if (pair.before && pair.after) {
        if (words(pair.before, pair.after)) stats.blocks++;
        return;
      }
      var target = pair.after ? pair.after.parentNode : parent;
      if (pair.before) inserted(removed(text(pair.before), target.matches && target.matches("ul,ol") ? "li" : "div"), target, pair.after || next);
      if (pair.after) highlight(pair.after, "docqui-inline-after-block");
      stats.blocks++;
    }
    function table(old, current) {
      var oldHeader = old.tHead && old.tHead.rows[0], newHeader = current.tHead && current.tHead.rows[0];
      if (!oldHeader || !newHeader || Array.from(old.querySelectorAll("td,th")).concat(Array.from(current.querySelectorAll("td,th")))
        .some(function (c) { return c.colSpan !== 1 || c.rowSpan !== 1; })) {
        block({ before: old, after: current }); return;
      }
      var oldColumns = Array.from(oldHeader.cells), newColumns = Array.from(newHeader.cells);
      var columns = align(oldColumns, newColumns, text);
      function cells(oldRow, newRow) {
        var oldCells = Array.from(oldRow.cells), newCells = Array.from(newRow.cells);
        columns.forEach(function (column, index) {
          var oldCell = column.before && oldCells[oldColumns.indexOf(column.before)];
          var newCell = column.after && newCells[newColumns.indexOf(column.after)];
          if (newCell) cell(oldCell, newCell);
          else if (oldCell) {
            var deleted = document.createElement(oldCell.tagName.toLowerCase());
            deleted.append(removed(text(oldCell), "span"));
            var next = columns.slice(index + 1).find(function (p) { return p.after; });
            inserted(deleted, newRow, next ? newCells[newColumns.indexOf(next.after)] : null);
            stats.cells++;
          }
        });
      }
      var oldRows = Array.from(old.tBodies).flatMap(function (body) { return Array.from(body.rows); });
      var newRows = Array.from(current.tBodies).flatMap(function (body) { return Array.from(body.rows); });
      var duplicates = new Set();
      [oldRows, newRows].forEach(function (items) {
        var seen = new Set();
        items.forEach(function (row) {
          var key = row.cells.length ? text(row.cells[0]) : "";
          if (seen.has(key)) duplicates.add(key);
          seen.add(key);
        });
      });
      var rows = align(oldRows, newRows, function (row) {
        var key = row.cells.length ? text(row.cells[0]) : "";
        if (!duplicates.has(key)) return key;
        var isOld = row.closest("table") === old;
        return JSON.stringify(columns.filter(function (column) { return column.before && column.after; }).map(function (column) {
          var index = isOld ? oldColumns.indexOf(column.before) : newColumns.indexOf(column.after);
          return row.cells[index] ? text(row.cells[index]) : "";
        }));
      });
      cells(oldHeader, newHeader);
      rows.forEach(function (pair, index) {
        if (pair.before && pair.after) cells(pair.before, pair.after);
        else if (pair.after) {
          highlight(pair.after, "docqui-inline-after-block"); stats.rows++;
        } else {
          var deleted = document.createElement("tr");
          columns.forEach(function (column) {
            var td = document.createElement("td");
            var oldCell = column.before && pair.before.cells[oldColumns.indexOf(column.before)];
            td.append(removed(oldCell ? text(oldCell) : "—", "span"));
            deleted.append(td);
          });
          var next = rows.slice(index + 1).find(function (p) { return p.after; });
          var body = next ? next.after.parentNode : current.tBodies[0];
          if (!body) { body = current.createTBody(); undo.push(function () { body.remove(); }); }
          inserted(deleted, body, next && next.after);
          stats.rows++;
        }
      });
    }
    function blocks(parent) {
      return Array.from(parent.children).filter(function (node) {
        return !node.matches(".file-banner, .page-nav, .docqui-inline-before");
      }).map(function (node) {
        return node.matches(".table-wrap") ? node.querySelector("table") || node : node;
      });
    }
    function compare(old, current) {
      var pairs = align(blocks(old), blocks(current), function (node) { return node.tagName + "\n" + text(node); }, similarity);
      pairs.forEach(function (pair, index) {
        var next = pairs.slice(index + 1).find(function (p) { return p.after; });
        if (!pair.before || !pair.after) {
          var target = next ? next.after : current.querySelector(":scope > .page-nav");
          if (target && target.parentNode.matches(".table-wrap")) target = target.parentNode;
          block(pair, current, target); return;
        }
        if (text(pair.before) === text(pair.after)) return;
        if (pair.before.tagName === "TABLE" && pair.after.tagName === "TABLE") table(pair.before, pair.after);
        else if (["UL", "OL", "BLOCKQUOTE", "DETAILS"].includes(pair.before.tagName) && pair.before.tagName === pair.after.tagName) compare(pair.before, pair.after);
        else block(pair);
      });
    }
    try { compare(template.content, content); }
    catch (error) {
      undo.reverse().forEach(function (restore) { restore(); });
      throw error;
    }
    return { stats: stats, clear: function () { undo.reverse().forEach(function (restore) { restore(); }); undo = []; } };
  }

  window.DOCQUI_INLINE_DIFF = { apply: apply, currentText: function (node) { return read(node).value; } };
})();
