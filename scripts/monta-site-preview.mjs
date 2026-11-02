#!/usr/bin/env node
// Publica snapshots da main e das branches de entrega num único artefato do Pages.
// Uso: node scripts/monta-site-preview.mjs [--out _site] [--remote origin]
//      [--site-dir docs] [--pull-requests arquivo.json]

import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { unidadeDaBranch } from './lib/instancia.mjs';
import { changesPage, patchLines, previewNav } from './lib/pages-preview.mjs';

const args = process.argv.slice(2);
const opt = (n, d) => {
  const i = args.indexOf(n);
  if (i < 0) return d;
  if (!args[i + 1] || args[i + 1].startsWith('--')) throw new Error(`Falta o valor de ${n}.`);
  return args[i + 1];
};
const ROOT = resolve('.');
const OUT = resolve(opt('--out', '_site'));
const REMOTE = opt('--remote', 'origin');
const SITE = opt('--site-dir', '.');
const PR_FILE = opt('--pull-requests', null);
const PUBLICATION = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'engine', 'publication');
const ASSETS = ['preview.css', 'inline-diff.js', 'preview.js'];
const ASSET_VERSION = createHash('sha256').update(ASSETS.map(name => readFileSync(join(PUBLICATION, name), 'utf8')).join('\n')).digest('hex').slice(0, 12);
const SITE_PATH = relative(ROOT, resolve(ROOT, SITE)).replace(/\\/g, '/') || '.';
const MARKER = '.docqui-pages-output';
const git = (...a) => execFileSync('git', ['-C', ROOT, ...a], {
  encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024,
});
const sha = (ref) => git('rev-parse', '--verify', `${ref}^{commit}`).trim();
const ancestral = (a, b) => {
  const result = spawnSync('git', ['-C', ROOT, 'merge-base', '--is-ancestor', a, b], { encoding: 'utf8' });
  if (result.status === 0) return true;
  if (result.status === 1) return false;
  throw new Error(result.stderr || result.error?.message || 'Falha ao consultar o histórico.');
};

function copia(de, para) {
  mkdirSync(para, { recursive: true });
  for (const n of readdirSync(de)) {
    if (['.git', 'node_modules', '_site', MARKER].includes(n)) continue;
    cpSync(join(de, n), join(para, n), { recursive: true, dereference: false });
  }
}

// Na loja, cada snapshot regenera os artefatos derivados no próprio worktree (antes, o CI
// regenerava só a main, no checkout que esta montagem não usa) e o dashboard com a branch.
function derivados(dir) {
  if (existsSync(join(dir, 'scripts', 'atualiza-pages.mjs'))) {
    execFileSync('node', ['scripts/atualiza-pages.mjs'], { cwd: dir, stdio: ['ignore', 'ignore', 'inherit'] });
  }
}

// Na branch de entrega, o dashboard também retrata a sprint (ou a história): o que ela mudou
// desde o ancestral comum com a base do PR, o mesmo ponto do Ver alterações.
function dashboard(dir, gitRoot, branch, base) {
  execFileSync(process.platform === 'win32' ? 'python' : 'python3',
    [join(ROOT, 'scripts', 'gera-dashboard.py'), '--root', dir, '--git-root', gitRoot, '--branch', branch,
      ...(base ? ['--base', base] : [])],
    { stdio: ['ignore', 'inherit', 'inherit'] });
}

function snapshot(commit, destino, rotulo, base) {
  const tmp = mkdtempSync(join(tmpdir(), 'docqui-snapshot-'));
  let added = false;
  try {
    git('worktree', 'add', '--detach', tmp, commit);
    added = true;
    derivados(tmp);
    const site = resolve(tmp, SITE);
    if (isAbsolute(relative(tmp, site)) || relative(tmp, site).startsWith('..') || !existsSync(join(site, 'index.html'))) {
      throw new Error(`${rotulo}: não há index.html em ${SITE}. Não é possível publicar o visualizador.`);
    }
    copia(site, destino);
    const gerador = join(destino, 'assets', 'generate-tree.js');
    if (existsSync(gerador)) {
      execFileSync('node', [gerador], { cwd: destino, stdio: ['ignore', 'ignore', 'inherit'] });
    } else if (SITE === '.') {
      console.warn(`⚠ ${rotulo}: sem assets/generate-tree.js; usando os artefatos versionados.`);
    }
    if (existsSync(join(tmp, 'VERSION'))) cpSync(join(tmp, 'VERSION'), join(destino, 'engine-version.txt'));
    dashboard(destino, tmp, rotulo, base);
  } finally {
    if (added) git('worktree', 'remove', '--force', tmp);
    else rmSync(tmp, { recursive: true, force: true });
  }
}

function changes(base, head) {
  const options = ['--no-ext-diff', '--no-textconv', '--no-color', '--find-renames', '--submodule=short'];
  const tokens = git('diff', ...options, '--name-status', '-z', base, head, '--').split('\0');
  const patches = git('diff', ...options, '--unified=3', base, head, '--')
    .split(/(?=^diff --git )/m).filter(Boolean);
  const files = [];
  for (let i = 0; tokens[i];) {
    const status = tokens[i++];
    const oldPath = tokens[i++];
    const path = /^[RC]/.test(status) ? tokens[i++] : oldPath;
    const patch = patches[files.length];
    if (patch === undefined) throw new Error(`Diff incompleto para ${path}.`);
    const lines = patchLines(patch);
    const binary = /^(Binary files |GIT binary patch)/m.test(patch);
    files.push({
      status: status[0], path, oldPath, patch,
      added: lines.filter(l => l.kind === 'added').length,
      removed: lines.filter(l => l.kind === 'removed').length,
      binary,
      ...(/\.md$/i.test(path) && !binary ? { before: null } : {}),
    });
  }
  if (patches.length !== files.length) throw new Error('A lista de arquivos e os blocos de diff divergem.');
  const previous = files.filter(file => Object.hasOwn(file, 'before') && file.status !== 'A');
  if (previous.length) {
    const blobs = execFileSync('git', ['-C', ROOT, 'cat-file', '--batch'], {
      input: previous.map(file => `${base}:${file.oldPath}`).join('\n') + '\n',
      maxBuffer: 64 * 1024 * 1024,
    });
    let offset = 0;
    for (const file of previous) {
      const end = blobs.indexOf(10, offset);
      const header = blobs.subarray(offset, end).toString('utf8').match(/^[0-9a-f]+ blob (\d+)$/);
      if (!header) throw new Error(`Conteúdo anterior indisponível para ${file.oldPath}.`);
      const size = Number(header[1]);
      file.before = blobs.subarray(end + 1, end + 1 + size).toString('utf8');
      offset = end + size + 2;
    }
  }
  return files;
}

function decorate(destino, previews, info, home) {
  const assets = join(destino, '_docqui');
  if (existsSync(assets)) throw new Error(`${destino}: _docqui/ é reservado à publicação.`);
  mkdirSync(assets);
  for (const name of ASSETS) cpSync(join(PUBLICATION, name), join(assets, name));
  const index = join(destino, 'index.html');
  let html = readFileSync(index, 'utf8');
  if (!/<body(?:\s[^>]*)?>/i.test(html) || !/<\/head\s*>/i.test(html) || !/<\/body\s*>/i.test(html)) {
    throw new Error(`${index}: HTML sem head/body; não foi possível inserir o seletor.`);
  }
  if (!/<meta\b[^>]*charset\s*=/i.test(html)) {
    html = html.replace(/<head(?:\s[^>]*)?>/i, head => `${head}\n<meta charset="utf-8">`);
  }
  writeFileSync(index, html
    .replace(/<\/head\s*>/i, `<link rel="stylesheet" href="_docqui/preview.css?v=${ASSET_VERSION}">\n</head>`)
    .replace(/<body(?:\s[^>]*)?>/i, body => `${body}\n${previewNav(previews, info, home)}`)
    .replace(/<\/body\s*>/i, `<script src="_docqui/inline-diff.js?v=${ASSET_VERSION}" defer></script>\n<script src="_docqui/preview.js?v=${ASSET_VERSION}" defer></script>\n</body>`));
  if (info) {
    const files = changes(info.mergeBase, info.commit);
    writeFileSync(join(destino, 'preview.json'), `${JSON.stringify(info, null, 2)}\n`);
    writeFileSync(join(assets, 'changes.json'), `${JSON.stringify({ ...info, siteDir: SITE_PATH, files }, null, 2)}\n`);
    writeFileSync(join(assets, 'changes.html'), changesPage(previews, info, files, `${home}/..`, SITE_PATH, ASSET_VERSION));
  }
}

function build() {
  const outRelative = relative(ROOT, OUT);
  if (!outRelative || isAbsolute(outRelative) || outRelative === '..' || outRelative.startsWith(`..${sep}`) ||
      outRelative.split(sep).includes('.git')) {
    throw new Error('--out deve ser uma subpasta do repositório, fora de .git.');
  }
  if (existsSync(OUT) && !existsSync(join(OUT, MARKER))) {
    throw new Error(`${OUT} já existe e não foi criado por este script. Escolha outra pasta de saída.`);
  }
  const prs = PR_FILE ? JSON.parse(readFileSync(resolve(PR_FILE), 'utf8')) : [];
  if (!Array.isArray(prs)) throw new Error('--pull-requests deve conter uma lista JSON.');
  const main = sha('refs/heads/main');
  const refs = git('for-each-ref', '--format=%(refname)', `refs/remotes/${REMOTE}/sprint/`,
    `refs/remotes/${REMOTE}/historia/`).trim().split('\n').filter(Boolean);
  const previews = [];
  for (const ref of refs) {
    const branch = ref.slice(`refs/remotes/${REMOTE}/`.length);
    const unidade = unidadeDaBranch(branch);
    if (!unidade) continue;
    const commit = sha(ref);
    if (ancestral(commit, main) || prs.some(p => p.branch === branch && p.base === 'main' && p.merged && p.head === commit)) {
      console.log(`· ${branch}: já incorporada à main.`);
      continue;
    }
    const open = prs.filter(p => p.branch === branch && p.state === 'open');
    if (new Set(open.map(p => p.base)).size > 1) throw new Error(`${branch}: PRs abertos com bases diferentes.`);
    const pr = open.sort((a, b) => b.number - a.number)[0];
    const base = pr?.base || 'main';
    const baseRef = pr ? `refs/remotes/${REMOTE}/${base}` : 'refs/heads/main';
    const baseCommit = sha(baseRef);
    const mergeBase = git('merge-base', baseCommit, commit).trim();
    previews.push({
      ...unidade, branch, caminho: branch.split('/').map(encodeURIComponent).join('/') + '/',
      commit, data: git('log', '-1', '--format=%cs', commit).trim(),
      base, baseCommit, mergeBase, baseSource: pr ? 'pull-request' : 'fallback-main',
      pr: pr ? { number: pr.number, url: pr.url, draft: Boolean(pr.draft) } : null,
    });
  }

  const stage = mkdtempSync(join(tmpdir(), 'docqui-pages-'));
  try {
    snapshot(main, stage, 'main');
    for (const info of previews) {
      const destino = join(stage, ...info.branch.split('/'));
      if (existsSync(destino)) throw new Error(`${info.branch}: o caminho do preview já existe no site da main.`);
      snapshot(info.commit, destino, info.branch, info.mergeBase);
      console.log(`✓ ${info.branch} → ${info.caminho}`);
    }
    // Só depois de todas as cópias: o seletor de cada snapshot recebe a mesma lista.
    decorate(stage, previews, null, '.');
    for (const info of previews) {
      const home = info.branch.split('/').map(() => '..').join('/');
      decorate(join(stage, ...info.branch.split('/')), previews, info, home);
    }
    writeFileSync(join(stage, 'previews.json'), `${JSON.stringify(previews, null, 2)}\n`);
    writeFileSync(join(stage, MARKER), 'Saída gerada por monta-site-preview.mjs\n');
    if (existsSync(OUT)) rmSync(OUT, { recursive: true });
    cpSync(stage, OUT, { recursive: true });
    console.log(`✓ main + ${previews.length} preview(s) → ${OUT}`);
  } finally {
    rmSync(stage, { recursive: true, force: true });
  }
}

try { build(); }
catch (e) { console.error(`✗ Pages: ${e.message}`); process.exitCode = 1; }
