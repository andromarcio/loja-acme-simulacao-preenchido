#!/usr/bin/env node
// build-trace-data.mjs — gera o índice de rastreabilidade (data.js) do mapa visual
// a partir dos artefatos REAIS da instância. É o "passo de build" prometido em
// docs/rastreabilidade/: no protótipo o data.js é escrito à mão (Loja Acme); numa
// instância, ele é GERADO por este script — nenhum dado novo, só a projeção do que
// já está nos .md:
//
//   cabeçalho do N3 (ID + título)        → nó funcionalidade (status/PF vêm do INDEX.md)
//   seção ## Origem do N3                → aresta ticket (AIMM) → funcionalidade (origina)
//   seção ## Implementação do N3         → aresta funcionalidade → repositório (implementa)
//   árvore modules/ + N1/N2              → hierarquia                   (contem)
//   ## Integrações com outros domínios   → aresta domínio → domínio     (integra)
//
// Agrupamento funcional sem README de N2 (bottom-up legítimo: N3 antes de N2) não deixa a
// funcionalidade solta: o nó vem da tabela ## Agrupamentos Funcionais do N1 ou, em último caso, é
// sintetizado a partir do ID da funcionalidade — mesmo comportamento do
// generate-trace-index.mjs.
//
// Uso (a partir da raiz da instância, ou com --root):
//   node scripts/build-trace-data.mjs                          # imprime em stdout
//   node scripts/build-trace-data.mjs -o docs/rastreabilidade/data.js
//
// Determinístico e somente-leitura (exceto -o). Exit 0; 2 em erro de uso.

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import { execFileSync } from 'node:child_process';
import {
  scanInstance, findInstanceRoot, sectionSlice, tableRowsOf, splitRow,
  levelId, titleOf,
} from './lib/trace-index.mjs';
import { ligarCodigo } from './lib/mapa-codigo.mjs';

const args = process.argv.slice(2);
function argOf(flag) {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : null;
}
if (args.includes('--help') || args.includes('-h')) {
  console.log('Uso: node scripts/build-trace-data.mjs [--root <dir>] [-o <saida.js>]');
  process.exit(2);
}

const root = findInstanceRoot(argOf('--root') || process.cwd());
if (!root) {
  console.error('build-trace-data: nenhuma instância (pasta modules/) encontrada.');
  process.exit(2);
}

const read = (p) => readFileSync(p, 'utf8');
const isDir = (p) => existsSync(p) && statSync(p).isDirectory();
const subdirs = (p) => (isDir(p) ? readdirSync(p).filter((n) => isDir(join(p, n))).sort() : []);
const relp = (...seg) => seg.join('/');

// Primeiro parágrafo "limpo" de uma seção (sem comentários, tabelas e marcação).
function firstParagraph(lines, section) {
  const sec = sectionSlice(lines, section);
  if (!sec) return '';
  let inComment = false;
  for (const l of sec.lines) {
    let t = l.trim();
    if (t.startsWith('<!--')) inComment = true;
    if (inComment) { if (t.endsWith('-->')) inComment = false; continue; }
    if (!t || t.startsWith('|') || t.startsWith('#') || t.startsWith('---') || t.startsWith('>')) continue;
    if (/^\*\*Não faz\*\*/.test(t)) continue;
    t = t.replace(/\*\*/g, '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
    return t.length > 160 ? `${t.slice(0, 157)}…` : t;
  }
  return '';
}

const STATUS_BY_ICON = { '📋': 'spec', '🔄': 'dev', '✅': 'impl', '⚠️': 'revisao', '❌': 'deprecado' };
// `estado` da esteira (front-matter, 1.4.0+) → status do mapa. Estados
// pré-especificado (rascunho, requisitos-aprovados, modelo-validado) caem
// no default 'spec' — o mapa não distingue etapas anteriores ao contrato.
const STATUS_BY_ESTADO = {
  especificado: 'spec', 'em-desenvolvimento': 'dev', implementado: 'impl',
  'revisao-necessaria': 'revisao', deprecado: 'deprecado',
};
// Legado (pré-1.4.0): linha manual `**Status**: [x] …` no corpo do N3.
const STATUS_BY_IMPL = {
  especificado: 'spec', 'em desenvolvimento': 'dev', implementado: 'impl', deprecado: 'deprecado',
};

const model = scanInstance(root);
const nodes = [];
const edges = [];
const edgeSeen = new Set();
function addEdge(from, to, kind, note) {
  const k = `${from}>${to}>${kind}`;
  if (edgeSeen.has(k)) return;
  edgeSeen.add(k);
  edges.push(note ? { from, to, kind, note } : { from, to, kind });
}

// --- N0 ----------------------------------------------------------------------
const systemFlag = argOf('--system');
let systemName = systemFlag || basename(root);
const n0Path = join(root, 'global', 'N0_PRODUCT_VISION.md');
let hasN0 = false;
if (existsSync(n0Path)) {
  const lines = read(n0Path).split(/\r?\n/);
  systemName = systemFlag || titleOf(lines) || systemName;
  nodes.push({
    id: 'N0', type: 'produto', label: systemName, sub: 'Visão de Produto',
    desc: firstParagraph(lines, 'Propósito'), path: 'global/N0_PRODUCT_VISION.md',
  });
  hasN0 = true;
} else {
  // Sem N0 formal: sintetiza o nó de produto para o grafo ter raiz e título
  // (aponta ao MASTER, se houver) e conecta os domínios via `contem`.
  nodes.push({
    id: 'N0', type: 'produto', label: systemName, sub: 'Visão de Produto', desc: '',
    path: existsSync(join(root, 'global', 'MASTER.md')) ? 'global/MASTER.md' : '',
  });
  hasN0 = true;
}

// --- N1 (domínios) + N2 (agrupamentos funcionais) ----------------------------------------
const modulesDir = join(root, 'modules');
const domainMeta = []; // { sigla, label, folder, lines } — p/ resolver integrações por nome
const fsIds = new Set(); // agrupamentos funcionais já materializados como nó (N2, tabela do N1 ou síntese)
for (const folder of subdirs(modulesDir).filter((n) => !n.startsWith('_'))) {
  const n1File = join(modulesDir, folder, 'README.md');
  if (!existsSync(n1File)) continue;
  const lines = read(n1File).split(/\r?\n/);
  const sigla = levelId(lines);
  if (!sigla) continue;
  const label = titleOf(lines) || folder;
  domainMeta.push({ sigla, label, folder, lines });
  nodes.push({
    id: sigla, type: 'dominio', label, sub: `Domínio · ${sigla}`,
    desc: firstParagraph(lines, 'Descrição'), path: relp('modules', folder, 'README.md'),
  });
  if (hasN0) addEdge('N0', sigla, 'contem');

  for (const fsFolder of subdirs(join(modulesDir, folder)).filter((n) => !n.startsWith('_'))) {
    const n2File = join(modulesDir, folder, fsFolder, 'README.md');
    if (!existsSync(n2File)) continue;
    const n2Lines = read(n2File).split(/\r?\n/);
    const fsId = levelId(n2Lines);
    if (!fsId) continue;
    fsIds.add(fsId);
    nodes.push({
      id: fsId, type: 'featureset', label: titleOf(n2Lines) || fsFolder,
      sub: `Agrupamento Funcional · ${fsId}`, domain: sigla,
      desc: firstParagraph(n2Lines, 'Descrição'), path: relp('modules', folder, fsFolder, 'README.md'),
    });
    addEdge(sigla, fsId, 'contem');
  }

  // Fallback: agrupamentos funcionais listados na tabela ## Agrupamentos Funcionais do N1 mas ainda
  // sem README de N2 — o nó nasce da linha da tabela (nome, descrição).
  const fsTable = sectionSlice(lines, 'Agrupamentos Funcionais');
  if (fsTable) {
    for (const row of tableRowsOf(fsTable.lines)) {
      const cells = splitRow(row);
      const fsId = (String(cells[0] || '').match(/\b([A-Z]{3}-[A-Z]{3})\b/) || [])[1];
      if (!fsId || fsIds.has(fsId)) continue;
      fsIds.add(fsId);
      const name = (String(cells[0]).match(/\*\*(.+?)\*\*/) || [])[1] || fsId;
      nodes.push({
        id: fsId, type: 'featureset', label: name, sub: `Agrupamento Funcional · ${fsId}`,
        domain: sigla, desc: (cells[1] || '').trim(), path: relp('modules', folder, 'README.md'),
      });
      addEdge(sigla, fsId, 'contem');
    }
  }
}

// Integrações domínio → domínio: o N1 lista QUEM consome/altera os dados DELE,
// então a aresta sai do domínio citado na linha e chega no dono do N1.
const siglaByLabel = new Map(domainMeta.map((d) => [d.label.toLowerCase(), d.sigla]));
const resolveDomain = (cell) => {
  const t = String(cell || '').replace(/\*\*/g, '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').trim();
  if (/^[A-Z]{3}$/.test(t)) return t;
  return siglaByLabel.get(t.toLowerCase()) || null;
};
for (const d of domainMeta) {
  const integ = sectionSlice(d.lines, 'Integrações');
  if (!integ) continue;
  let mode = null;
  for (let i = 0; i < integ.lines.length; i++) {
    const t = integ.lines[i].trim();
    if (/^### Leitura/.test(t)) { mode = 'lê'; continue; }
    if (/^### Escrita/.test(t)) { mode = 'altera'; continue; }
    if (!mode || !t.startsWith('|') || /^\|[\s:|-]+\|$/.test(t)) continue;
    const cells = splitRow(t);
    if (/^Domínio$/i.test(cells[0] || '')) continue; // header
    const consumer = resolveDomain(cells[0]);
    const what = (cells[1] || '').replace(/\[|\]/g, '').trim();
    if (consumer && consumer !== d.sigla && !/\[/.test(cells[0])) {
      addEdge(consumer, d.sigla, 'integra', what ? `${mode} ${what}` : undefined);
    }
  }
}

// --- N3 (funcionalidades) — status/PF consolidados pelo INDEX.md ----------------------
const indexByFeat = new Map();
if (model.index) for (const r of model.index.rows) indexByFeat.set(r.featId, r);
const repoNodes = new Map();
const repoIndexPath = existsSync(join(root, 'repos', 'INDEX.md')) ? 'repos/INDEX.md' : '';

// URL-base do org (mesmo do doc) p/ linkar arquivo → GitHub blob dos repos de código.
let _remote = '';
try { _remote = execFileSync('git', ['-C', root, 'remote', 'get-url', 'origin'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { /* sem git */ }
const orgBase = _remote ? _remote.replace(/\.git$/, '').replace(/\/[^/]+$/, '/') : '';
// Camada de código: liga cada funcionalidade aos ARQUIVOS reais (o par [x]-backend/[x]-frontend
// e os repositórios do inventário `repos/INDEX.md` que estiverem no disco)
// — o "das funcionalidades até o código". Sem os repos irmãos, byFeat vem vazio e o grafo
// para no nó de repositório (scripts/lib/mapa-codigo.mjs é somente-leitura).
const codLink = ligarCodigo({ docRoot: root, featIds: model.features.filter((x) => x.id).map((x) => x.id) });
const codNodes = new Map();

for (const f of model.features.filter((x) => x.id)) {
  const idx = indexByFeat.get(f.id);
  const status =
    (idx && STATUS_BY_ICON[idx.status]) ||
    (f.estado && STATUS_BY_ESTADO[f.estado]) ||
    (f.statusImpl && STATUS_BY_IMPL[f.statusImpl.toLowerCase()]) || 'spec';
  const pfNum = idx ? parseInt(String(idx.pf).replace(/\D/g, ''), 10) : NaN;
  const fsId = f.id.replace(/-\d{2}$/, '');
  if (!fsIds.has(fsId)) {
    // Funcionalidade especificada antes do N2 e fora da tabela do N1 — sintetiza o nó
    // do agrupamento funcional a partir do ID para a funcionalidade não ficar solta no mapa.
    fsIds.add(fsId);
    nodes.push({
      id: fsId, type: 'featureset', label: fsId, sub: `Agrupamento Funcional · ${fsId}`,
      domain: f.id.slice(0, 3), desc: '', path: '',
    });
    addEdge(f.id.slice(0, 3), fsId, 'contem');
  }
  const lines = read(f.file).split(/\r?\n/);
  nodes.push({
    id: f.id, type: 'feature', label: f.title || f.id, status, pf: Number.isNaN(pfNum) ? null : pfNum,
    sub: `Funcionalidade · ${f.id}`, domain: f.id.slice(0, 3),
    desc: firstParagraph(lines, 'Descrição'), path: f.path,
  });
  addEdge(fsId, f.id, 'contem');

  for (const o of f.origem) addEdge(o.key, f.id, 'origina', o.note ? o.note.slice(0, 80) : undefined);

  // Separa células combinadas ("siesa-backend / siesa-frontend") em repos distintos.
  const repos = new Set(f.implRepos.flatMap((r) => String(r).split(/\s*[/,]\s*/)).map((r) => r.trim()).filter(Boolean));
  for (const repo of repos) {
    if (!repoNodes.has(repo)) {
      repoNodes.set(repo, {
        id: repo, type: 'repo', label: repo, sub: 'Repositório', desc: '', path: repoIndexPath,
      });
    }
    addEdge(f.id, repo, 'implementa');
  }

  // Desce até os ARQUIVOS: cada arquivo é um nó `codigo`; a aresta funcionalidade → arquivo
  // é `implementa`. Garante o nó de repositório do arquivo (para link e filtro).
  const cod = codLink.byFeat[f.id];
  if (cod) {
    // Um par backend/frontend ou dezenas de microsserviços: todo repositório acessível.
    for (const [repoName, arr] of Object.entries(cod.porRepo || {})) {
      if (!repoNodes.has(repoName)) {
        repoNodes.set(repoName, { id: repoName, type: 'repo', label: repoName, sub: 'Repositório', desc: '', path: repoIndexPath });
      }
      for (const file of arr) {
        const cid = `${repoName}/${file.path}`;
        if (!codNodes.has(cid)) {
          codNodes.set(cid, {
            id: cid, type: 'codigo', label: file.path.split('/').pop(), sub: file.path,
            repo: repoName, camada: file.kind, path: file.path,
            href: orgBase ? `${orgBase}${repoName}/blob/main/${file.path}` : '',
          });
        }
        addEdge(f.id, cid, 'implementa');
      }
    }
  }
}

// --- AIMMs dos tickets ----------------------------------------------------------
// Rótulo: o `titulo` da AIMM; descrição: o começo da transcrição do ticket (sem a
// citação que a apresenta).
for (const s of model.stories.filter((x) => x.key)) {
  const lines = read(s.file).split(/\r?\n/);
  const label = s.title || s.key;
  const descr = sectionSlice(lines, 'Descrição do ticket');
  let desc = '';
  if (descr) {
    desc = descr.lines.join('\n').replace(/<!--[\s\S]*?-->/g, '').split('\n').map((l) => l.trim())
      .filter((l) => l && !l.startsWith('>') && !l.startsWith('---'))
      .join(' ').replace(/\*\*/g, '');
    if (desc.length > 160) desc = `${desc.slice(0, 157)}…`;
  }
  nodes.push({ id: s.key, type: 'aim', label, sub: `AIMM · ${s.key}`, desc, path: s.path });
}
nodes.push(...repoNodes.values());
nodes.push(...codNodes.values());

// Arestas cujo nó não existe (ex.: ticket citado mas sem AIMM) são descartadas —
// o audit-trace-links é quem acusa; o mapa só projeta o que existe.
const nodeIds = new Set(nodes.map((n) => n.id));
const finalEdges = edges.filter((e) => nodeIds.has(e.from) && nodeIds.has(e.to));

// --- meta -------------------------------------------------------------------------
let repoUrl = '';
try { repoUrl = execFileSync('git', ['-C', root, 'remote', 'get-url', 'origin'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { /* sem git/remote */ }
let engineVersion = '';
try { engineVersion = readFileSync(join(root, 'VERSION'), 'utf8').trim(); } catch { /* instância sem VERSION */ }

const data = {
  meta: {
    system: systemName,
    subtitle: 'índice de rastreabilidade gerado por scripts/build-trace-data.mjs',
    generatedAt: new Date().toISOString().slice(0, 10),
    engineVersion,
    repo: repoUrl,
  },
  nodes,
  edges: finalEdges,
};

const banner =
  '/* GERADO por scripts/build-trace-data.mjs — não editar à mão.\n' +
  `   Fonte: artefatos .md da instância (${nodes.length} nós, ${finalEdges.length} arestas). */\n`;
const out = `${banner}window.TRACE_DATA = ${JSON.stringify(data, null, 2)};\n`;

const outFile = argOf('-o') || argOf('--out');
if (outFile) {
  writeFileSync(outFile, out);
  console.log(`✓ build-trace-data: ${outFile} gerado (${nodes.length} nós, ${finalEdges.length} arestas).`);
} else {
  process.stdout.write(out);
}
