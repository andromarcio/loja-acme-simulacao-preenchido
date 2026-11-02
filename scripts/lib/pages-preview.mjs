const esc = value => String(value).replace(/[&<>"']/g, c => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[c]);
const urlPath = path => path.split('/').map(encodeURIComponent).join('/');
const prLink = pr => pr && /^https:\/\/github\.com\//.test(pr.url)
  ? `<a href="${esc(pr.url)}" target="_blank" rel="noopener">PR #${pr.number}${pr.draft ? ' · rascunho' : ''}</a>` : '';

export function patchLines(patch) {
  let inHunk = false;
  return patch.split('\n').map(text => {
    if (text.startsWith('diff --git ')) inHunk = false;
    if (text.startsWith('@@')) { inHunk = true; return { text, kind: 'hunk' }; }
    return { text, kind: inHunk && text.startsWith('+') ? 'added' :
      inHunk && text.startsWith('-') ? 'removed' : 'context' };
  });
}

export function previewNav(previews, info, home, review = false) {
  const current = info?.branch || 'main';
  const name = p => `${p.branch}${p.pr?.draft ? ' · rascunho' : ''}`;
  const branches = [{ branch: 'main', caminho: '', pr: null }, ...previews];
  // Lista própria, não <select>: a nativa do macOS abre por cima do campo. São links, então
  // a troca de branch funciona sem JavaScript; o preview.js só leva junto a rota aberta.
  const items = branches.map(p =>
    `<li><a href="${esc(`${home}/${p.caminho}index.html`)}"${p.branch === current ? ' aria-current="page"' : ''}>${esc(name(p))}</a></li>`).join('');
  const atual = branches.find(p => p.branch === current) || branches[0];
  return `<nav class="docqui-preview" aria-label="Versão dos artefatos" data-preview-branch="${esc(current)}"${info ? ` data-preview-commit="${info.commit}"` : ''}>
  <div class="docqui-preview__branch">Branch <details class="docqui-preview__menu">
    <summary aria-label="Branch dos artefatos: ${esc(name(atual))}"><span>${esc(name(atual))}</span></summary>
    <ul aria-label="Branch dos artefatos">${items}</ul>
  </details></div>
  <span class="docqui-preview__state">${info ? 'Em revisão · ainda não aprovado na main' : 'main · versão entregue'}</span>
  ${info ? `<span>Base: <strong>${esc(info.base)}</strong>${info.baseSource === 'fallback-main' ? ' (sem PR aberto; comparação com main)' : ''} · ${info.commit.slice(0, 12)}</span>
  ${prLink(info.pr)} <a href="${review ? 'changes.html' : '_docqui/changes.html'}">Ver alterações</a>` : ''}
  ${info && !review ? '<label><input type="checkbox" data-docqui-inline-toggle checked>Destacar alterações</label><span data-docqui-inline-status role="status" aria-live="polite">Selecione um artefato para comparar.</span>' : ''}
  ${review ? '<a href="../index.html">Consultar artefatos</a>' : ''}
</nav>`;
}

export function changesPage(previews, info, files, home, siteDir, assetVersion = '') {
  const statuses = { A: 'Incluído', M: 'Alterado', D: 'Excluído', R: 'Renomeado', C: 'Copiado', T: 'Tipo alterado' };
  const count = status => files.filter(f => f.status === status).length;
  const summary = files.map((f, i) => `<li><a href="#file-${i}">${esc(f.path)}</a> — ${statuses[f.status] || esc(f.status)}</li>`).join('');
  const sections = files.map((f, i) => {
    const sitePrefix = siteDir === '.' ? '' : siteDir.replace(/\\/g, '/').replace(/\/$/, '') + '/';
    const visible = f.status !== 'D' && f.path.startsWith(sitePrefix);
    const href = visible ? `../${urlPath(f.path.slice(sitePrefix.length))}` : null;
    const patch = patchLines(f.patch).map(line =>
      `<span class="docqui-diff__${line.kind}">${esc(line.text)}</span>`).join('\n');
    return `<section id="file-${i}" class="docqui-change">
      <h2>${esc(f.path)}</h2><p>${statuses[f.status] || esc(f.status)}${f.status === 'R' ? ` · antes: ${esc(f.oldPath)}` : ''} · +${f.added} / −${f.removed}
      ${href ? ` · <a href="${esc(href)}">Abrir arquivo nesta branch</a>` : ''}</p>
      ${f.binary ? '<p>Arquivo binário: diferença de conteúdo não exibida como texto.</p>' : ''}
      <pre class="docqui-diff" tabindex="0" aria-label="Diferença de ${esc(f.path)}">${patch}</pre></section>`;
  }).join('\n');
  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Alterações · ${esc(info.branch)}</title><link rel="stylesheet" href="preview.css?v=${assetVersion}"></head>
<body class="docqui-review">
${previewNav(previews, info, home, true)}
<main class="docqui-review__content"><h1>Alterações para aprovação</h1>
<p><strong>${esc(info.branch)}</strong> em relação a <strong>${esc(info.base)}</strong>, desde o ancestral comum <code>${info.mergeBase.slice(0, 12)}</code>.
Snapshot da branch: <code>${info.commit.slice(0, 12)}</code> · ${esc(info.data)}.</p>
<p>O nome da branch de origem não é registrado pelo Git. ${info.baseSource === 'pull-request' ? 'A base foi obtida do PR aberto.' : 'Sem PR aberto: main foi usada como referência, não como origem comprovada.'}
Mudanças que chegaram à base depois da separação não são atribuídas ao ticket. Esta consulta não registra aprovação nem libera o merge.</p>
<p>${files.length} arquivo(s): ${count('A')} incluído(s), ${count('M') + count('T')} alterado(s), ${count('D')} excluído(s), ${count('R')} renomeado(s).
Linhas: +${files.reduce((n, f) => n + f.added, 0)} / −${files.reduce((n, f) => n + f.removed, 0)}.</p>
<p>Verde e sinal +: inclusão. Vermelho e sinal −: remoção. Cabeçalhos @@ indicam as linhas antes/depois.</p>
${files.length ? `<ul>${summary}</ul>${sections}` : '<p>Nenhuma alteração em relação à base do PR.</p>'}
</main><script src="preview.js?v=${assetVersion}" defer></script></body></html>`;
}
