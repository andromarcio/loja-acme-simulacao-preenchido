#!/usr/bin/env node
// generate-trace-index.mjs — varre uma instância do docqui (árvore
// `modules/` + `global/`) e emite dois artefatos derivados dos próprios `.md`:
//
//   1) data.js      → window.TRACE_DATA para o grafo em docs/rastreabilidade/
//   2) features.json → catálogo de funcionalidades (N3) para sincronizar no ServiceNow
//
// Determinístico e sem dependências (mesmo espírito de validate-doc.mjs). A
// informação já vive nos artefatos; este script só a projeta:
//   - cabeçalho do N3 (`SIGLA-SAF-NN`) + `**Status**` + `**Total: N PF**`  → funcionalidade
//   - seção `## Origem`         → arestas ticket → funcionalidade (kind: origina)
//   - seção `## Implementação`  → arestas funcionalidade → repositório (kind: implementa)
//   - `## Agrupamentos Funcionais` do N1   → hierarquia domínio → agrupamento funcional (kind: contem)
//   - `## Integrações …` do N1  → arestas domínio ↔ domínio (kind: integra)
//   - `analise-impacto/AIMM-*.md` → rótulo/URL das AIMMs dos tickets (`tipo: ticket`)
//
// Uso:
//   node scripts/generate-trace-index.mjs --root <instância> \
//        [--out-data docs/rastreabilidade/data.js] \
//        [--out-funcionalidades build/features.json] \
//        [--repo https://github.com/acme/simpf-doc] [--branch main]
//
// Sem --out-*, imprime um resumo e não escreve nada (dry-run).

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { join, relative, dirname, basename } from 'node:path';
import { frontMatterEstado } from './lib/front-matter.mjs';
import { keyOf, frontMatterCampos } from './lib/trace-index.mjs';
import { ehSecao } from './lib/niveis.mjs';

/* ----------------------------- CLI ----------------------------- */
const args = process.argv.slice(2);
function opt(name, def = null) {
  const i = args.indexOf(name);
  return i !== -1 && args[i + 1] ? args[i + 1] : def;
}
const ROOT = opt('--root');
const OUT_DATA = opt('--out-data');
const OUT_FEATURES = opt('--out-funcionalidades') || opt('--out-features');
const REPO = (opt('--repo', '') || '').replace(/\/$/, '');
const BRANCH = opt('--branch', 'main');
if (!ROOT) {
  console.error('Uso: node scripts/generate-trace-index.mjs --root <instância> [--out-data …] [--out-funcionalidades …] [--repo …] [--branch …]');
  process.exit(2);
}

/* --------------------------- helpers --------------------------- */
const splitRow = (r) => r.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
const firstTitle = (lines) => (lines.find((l) => /^# /.test(l.trim())) || '').replace(/^#\s+/, '').trim();

// Chave do ticket: a mesma leitura do trace-index (`keyOf` — o regex canônico, com
// PDTIC, ou o link para a AIMM do ticket). Antes este script tinha um regex próprio, sem
// PDTIC, e o índice não via os tickets nesse formato.
const PLACEHOLDER_KEY_RE = /STRYx|ISSUE-N|EXP-…|\[chave\]/i;

function sectionSlice(lines, name) {
  const start = lines.findIndex((l) => ehSecao(l, name));
  if (start === -1) return null;
  const out = [];
  for (let i = start + 1; i < lines.length; i++) {
    if (lines[i].trim().startsWith('## ')) break;
    out.push(lines[i]);
  }
  return out;
}
function tableRows(lines, name) {
  const slice = sectionSlice(lines, name);
  if (!slice) return [];
  const rows = slice.map((l) => l.trim()).filter((l) => l.startsWith('|'));
  return rows.filter((r) => !/^\|[\s:|-]+\|$/.test(r)).slice(1);
}
function firstProse(lines, name) {
  const slice = sectionSlice(lines, name) || [];
  for (const l of slice) {
    const t = l.trim();
    if (!t || t.startsWith('<!--') || t.startsWith('|') || t.startsWith('>')) continue;
    return t.replace(/^\[|\]$/g, '');
  }
  return '';
}
function walk(dir, acc = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (e.isFile() && e.name.endsWith('.md')) acc.push(p);
  }
  return acc;
}

const STATUS_BY_WORD = {
  'especificado': 'spec', 'em desenvolvimento': 'dev', 'implementado': 'impl',
  'revisão necessária': 'revisao', 'deprecado': 'deprecado',
};
const STATUS_BY_ICON = { '📋': 'spec', '🔄': 'dev', '✅': 'impl', '⚠️': 'revisao', '❌': 'deprecado' };
// `estado` da esteira (front-matter, 1.4.0+) — fonte preferencial do status.
// Estados pré-especificado caem no default 'spec'.
const STATUS_BY_ESTADO = {
  'especificado': 'spec', 'em-desenvolvimento': 'dev', 'implementado': 'impl',
  'revisao-necessaria': 'revisao', 'deprecado': 'deprecado',
};
function estadoOf(raw) {
  return frontMatterEstado(raw.split(/\r?\n/));
}
function parseStatus(raw) {
  const estado = estadoOf(raw);
  if (estado) return STATUS_BY_ESTADO[estado] || 'spec';
  // Legado (pré-1.4.0): linha manual `**Status**: [x] …` no corpo do N3.
  const line = (raw.split(/\r?\n/).find((l) => /\*\*Status\*\*/.test(l)) || '');
  for (const [icon, s] of Object.entries(STATUS_BY_ICON)) if (line.includes(icon)) return s;
  // checkbox marcado: "[x] Implementado"
  const m = line.match(/\[[xX]\]\s*([^`·|]+)/);
  if (m) {
    const word = m[1].trim().toLowerCase();
    for (const [w, s] of Object.entries(STATUS_BY_WORD)) if (word.startsWith(w)) return s;
  }
  return 'spec';
}

/* --------------------------- parse ----------------------------- */
const rel = (p) => relative(ROOT, p).split('\\').join('/');
const files = existsSync(join(ROOT, 'modules')) ? walk(ROOT) : walk(ROOT);

const domains = new Map();   // sigla -> { name, path, featureSets:[{id,name}], integ:[{name,note,dir}] }
const features = [];         // { id, name, domain, fs, status, pf, desc, path, stories:[{id,note}], repos:[] }
const backlog = new Map();   // STRY -> { label, path }
let product = null;          // { label, path }

for (const file of files) {
  const raw = readFileSync(file, 'utf8');
  const lines = raw.split(/\r?\n/);
  const levelLine = lines.find((l) => /> \*\*Nível [123]\*\*/.test(l));
  const level = levelLine ? levelLine.match(/Nível ([123])/)[1] : null;

  // N0 — visão de produto
  if (!level && /N0_PRODUCT_VISION/i.test(file)) {
    product = { label: firstTitle(lines) || 'Visão de Produto', path: rel(file) };
    continue;
  }
  // AIMM do ticket (analise-impacto/AIMM-<CHAVE>.md, `tipo: ticket`). A AIMM da sprint e
  // qualquer outro arquivo da pasta não viram nó: só o ticket é um lado do elo.
  // Ancorado na RAIZ da instância: um domínio chamado `analise-impacto` mora em
  // `modules/analise-impacto/` e não pode ser confundido com a pasta das AIMMs.
  if (/^analise-impacto\//.test(rel(file))) {
    const fm = frontMatterCampos(lines);
    if ((fm.tipo || '').toLowerCase() === 'ticket' && fm.ticket && !PLACEHOLDER_KEY_RE.test(fm.ticket)) {
      backlog.set(fm.ticket.toUpperCase(), { label: fm.titulo || firstTitle(lines) || fm.ticket, path: rel(file) });
    }
    continue;
  }

  if (level === '1') {
    const sigla = (levelLine.match(/`([A-Z]{3})`/) || [])[1];
    if (!sigla) continue;
    const fs = [];
    for (const row of tableRows(lines, 'Agrupamentos Funcionais')) {
      const c = splitRow(row);
      const id = (c[0].match(/([A-Z]{3}-[A-Z]{3})/) || [])[1];
      const name = (c[0].match(/\*\*(.+?)\*\*/) || [])[1] || (id || '');
      if (id) fs.push({ id, name });
    }
    // Integrações: domínios (por NOME) que leem/escrevem neste domínio → dependem dele
    const integ = [];
    const slice = sectionSlice(lines, 'Integrações com outros domínios') || [];
    for (const l of slice.map((x) => x.trim()).filter((x) => x.startsWith('|'))) {
      if (/^\|[\s:|-]+\|$/.test(l)) continue;
      const c = splitRow(l);
      if (/^Domínio$/i.test(c[0]) || !c[0]) continue;         // pula cabeçalhos
      integ.push({ name: c[0].replace(/\*/g, '').trim(), note: (c[1] || '').replace(/[\[\]]/g, '') });
    }
    domains.set(sigla, { name: (firstTitle(lines).replace(/^(?:Major Feature Set|Domínio):\s*/i, '') || sigla), path: rel(file), featureSets: fs, integ });
    continue;
  }

  if (level === '3') {
    const id = (levelLine.match(/`([A-Z]{3}-[A-Z]{3}-\d{2})`/) || [])[1];
    if (!id) continue;
    const [domain] = id.split('-');
    const fs = id.split('-').slice(0, 2).join('-');
    const stories = [];
    for (const row of tableRows(lines, 'Origem')) {
      const c = splitRow(row);
      const key = keyOf(c[0]);
      if (!key || PLACEHOLDER_KEY_RE.test(c[0])) continue;
      stories.push({ id: key, note: (c[2] || c[1] || '').replace(/[\[\]]/g, '') });
    }
    const repos = [];
    for (const row of tableRows(lines, 'Implementação')) {
      const c = splitRow(row);
      const r = (c[1] || '').replace(/[`*]/g, '').trim();
      const placeholder = !r || /^[—–-]+$/.test(r) || /^\[?repo\]?$/i.test(r);
      if (!placeholder && !repos.includes(r)) repos.push(r);
    }
    const pfM = raw.match(/\*\*Total:\s*(\d+)\s*PF\*\*/);
    features.push({
      id, name: firstTitle(lines) || id, domain, fs,
      status: parseStatus(raw), pf: pfM ? Number(pfM[1]) : null,
      desc: firstProse(lines, 'Descrição'), path: rel(file), stories, repos,
    });
  }
}

/* ---------------- resolver nomes de domínio → sigla ---------------- */
const nameToSigla = new Map();
for (const [sigla, d] of domains) nameToSigla.set(d.name.toLowerCase(), sigla);
const fsName = new Map();  // SIGLA-SAF -> name
for (const [, d] of domains) for (const f of d.featureSets) fsName.set(f.id, f.name);

/* ----------------------- montar nós/arestas ----------------------- */
const nodes = new Map();
const edges = [];
const addNode = (n) => { if (!nodes.has(n.id)) nodes.set(n.id, n); return nodes.get(n.id); };
const addEdge = (from, to, kind, note) => { if (nodes.has(from) && to && edges.push({ from, to, kind, ...(note ? { note } : {}) })); };
const specUrl = (p) => (REPO ? `${REPO}/blob/${BRANCH}/${p}` : p);

if (product) addNode({ id: 'N0', type: 'produto', label: product.label, sub: 'Visão de Produto', path: product.path });

for (const [sigla, d] of domains) {
  addNode({ id: sigla, type: 'dominio', label: d.name, sub: `Domínio · ${sigla}`, path: d.path });
  if (product) addEdge('N0', sigla, 'contem');
  for (const f of d.featureSets) {
    addNode({ id: f.id, type: 'featureset', label: f.name, sub: `Agrupamento Funcional · ${f.id}`, domain: sigla, path: d.path });
    addEdge(sigla, f.id, 'contem');
  }
}

for (const f of features) {
  addNode({
    id: f.id, type: 'feature', label: f.name, sub: `Funcionalidade · ${f.id}`,
    domain: f.domain, status: f.status, pf: f.pf, desc: f.desc, path: f.path,
  });
  // hierarquia agrupamento funcional → funcionalidade (cria o FS se o N1 não o listou)
  if (!nodes.has(f.fs)) addNode({ id: f.fs, type: 'featureset', label: fsName.get(f.fs) || f.fs, sub: `Agrupamento Funcional · ${f.fs}`, domain: f.domain });
  addEdge(f.fs, f.id, 'contem');
  // tickets (AIMM) → funcionalidade
  for (const s of f.stories) {
    if (!nodes.has(s.id)) {
      const b = backlog.get(s.id);
      addNode({ id: s.id, type: 'aim', label: b ? b.label : s.id, sub: `AIMM · ${s.id}`, path: b ? b.path : '' });
    }
    addEdge(s.id, f.id, 'origina', s.note || undefined);
  }
  // funcionalidade → repositório
  for (const r of f.repos) {
    if (!nodes.has(r)) addNode({ id: r, type: 'repo', label: r, sub: 'Repositório' });
    addEdge(f.id, r, 'implementa');
  }
}

// AIMMs de tickets ainda sem funcionalidade especificada (aparecem soltas — visão de pendência)
for (const [key, b] of backlog) {
  if (!nodes.has(key)) addNode({ id: key, type: 'aim', label: b.label, sub: `AIMM · ${key}`, path: b.path });
}

// integração domínio ↔ domínio (consumidor depende deste domínio)
for (const [sigla, d] of domains) {
  for (const it of d.integ) {
    const other = nameToSigla.get(it.name.toLowerCase());
    if (other && other !== sigla) addEdge(other, sigla, 'integra', it.note || undefined);
  }
}

/* ------------------------ ordenar (determinístico) ------------------------ */
const TYPE_ORDER = { produto: 0, dominio: 1, featureset: 2, feature: 3, aim: 4, repo: 5 };
const nodeList = [...nodes.values()].sort((a, b) => (TYPE_ORDER[a.type] - TYPE_ORDER[b.type]) || a.id.localeCompare(b.id));
edges.sort((a, b) => a.kind.localeCompare(b.kind) || a.from.localeCompare(b.from) || a.to.localeCompare(b.to));

/* ------------------------------ meta ------------------------------ */
let engineVersion = '—';
for (const vf of [join(ROOT, 'VERSION'), join(dirname(new URL(import.meta.url).pathname), '..', 'VERSION')]) {
  try { engineVersion = readFileSync(vf, 'utf8').trim(); break; } catch {}
}
const systemName = (product && product.label) || 'Sistema';
const meta = {
  system: systemName, generatedAt: new Date().toISOString().slice(0, 10),
  engineVersion, repo: REPO || undefined, branch: BRANCH,
};

/* --------------------------- features.json --------------------------- */
const featuresCatalog = features
  .slice()
  .sort((a, b) => a.id.localeCompare(b.id))
  .map((f) => ({
    feature_id: f.id,
    name: f.name,
    domain: f.domain,
    domain_name: (domains.get(f.domain) || {}).name || f.domain,
    feature_set: f.fs,
    feature_set_name: fsName.get(f.fs) || f.fs,
    status: f.status,
    pf: f.pf,
    stories: f.stories.map((s) => s.id),
    repos: f.repos,
    spec_path: f.path,
    spec_url: specUrl(f.path),
  }));

/* ----------------------------- output ----------------------------- */
const dataObj = { meta, nodes: nodeList, edges };
const dataJs =
  '/* GERADO por scripts/generate-trace-index.mjs — não editar à mão.\n' +
  `   Fonte: artefatos .md da instância. Sistema: ${systemName}. */\n` +
  'window.TRACE_DATA = ' + JSON.stringify(dataObj, null, 2) + ';\n';

function ensureDir(p) { const d = dirname(p); if (!existsSync(d)) mkdirSync(d, { recursive: true }); }
if (OUT_DATA) { ensureDir(OUT_DATA); writeFileSync(OUT_DATA, dataJs); }
if (OUT_FEATURES) { ensureDir(OUT_FEATURES); writeFileSync(OUT_FEATURES, JSON.stringify({ meta, features: featuresCatalog }, null, 2) + '\n'); }

/* ----------------------------- resumo ----------------------------- */
const byType = {};
for (const n of nodeList) byType[n.type] = (byType[n.type] || 0) + 1;
const byKind = {};
for (const e of edges) byKind[e.kind] = (byKind[e.kind] || 0) + 1;
const pfTotal = features.reduce((a, f) => a + (f.status !== 'deprecado' && f.pf ? f.pf : 0), 0);

console.log(`Sistema: ${systemName} · engine ${engineVersion}`);
console.log(`Nós:    ${nodeList.length}  (` + Object.entries(byType).map(([k, v]) => `${k}:${v}`).join(', ') + ')');
console.log(`Arestas:${edges.length}  (` + Object.entries(byKind).map(([k, v]) => `${k}:${v}`).join(', ') + ')');
console.log(`Funcionalidades (N3): ${features.length} · PF vigente: ${pfTotal}`);
console.log(OUT_DATA ? `→ data.js:      ${OUT_DATA}` : '  (data.js: dry-run — use --out-data para escrever)');
console.log(OUT_FEATURES ? `→ features.json: ${OUT_FEATURES}` : '  (features.json: dry-run — use --out-funcionalidades para escrever)');
