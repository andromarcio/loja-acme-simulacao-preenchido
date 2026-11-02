#!/usr/bin/env node
// audit-instance.mjs — auditoria DETERMINÍSTICA de coerência cruzada da instância
// (complementa o validate-doc.mjs, que é por-arquivo). Reporta:
//   • IDs duplicados (SIGLA / SIGLA-SAF / SIGLA-SAF-NN)
//   • N3 órfão — funcionalidade (f-*.md) num Agrupamento Funcional sem README.md (N2)
//   • Cobertura do INDEX — funcionalidades cujo ID não aparece em modules/INDEX.md
//
// É ADVISORY (não é gate de gravação): roda sob demanda ou em CI/pre-PR. Ao contrário
// do hook, NÃO bloqueia cada escrita — porque N3 antes de N2/INDEX é um estado legítimo
// no fluxo bottom-up. Sai 1 se houver achados (útil em CI), 0 se limpo.
//
// Uso (a partir da raiz da instância):  node scripts/audit-instance.mjs

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';

const ROOT = process.cwd();

function collectMd(dir, out) {
  let entries;
  try { entries = readdirSync(dir); } catch { return; }
  for (const name of entries) {
    if (name === 'node_modules' || name === '.git' || name === 'engine') continue;
    const p = join(dir, name);
    let st; try { st = statSync(p); } catch { continue; }
    if (st.isDirectory()) collectMd(p, out);
    else if (name.endsWith('.md')) out.push(p);
  }
}
function levelId(raw) {
  const line = raw.split(/\r?\n/).find((l) => /> \*\*Nível [0-3]\*\*/.test(l));
  if (!line) return null;
  const m = line.match(/`([A-Z]{2,3}(?:-[A-Z]{3})?(?:-\d{2})?)`/);
  return m ? m[1] : null;
}
const rel = (p) => p.replace(`${ROOT}/`, '').replace(/\\/g, '/');

const files = [];
for (const d of ['modules', 'global']) collectMd(join(ROOT, d), files);

const issues = [];

// 1) IDs duplicados
const byId = new Map();
for (const f of files) {
  let id; try { id = levelId(readFileSync(f, 'utf8')); } catch { continue; }
  if (!id) continue;
  if (!byId.has(id)) byId.set(id, []);
  byId.get(id).push(rel(f));
}
for (const [id, list] of byId) {
  if (list.length > 1) issues.push(`ID duplicado "${id}": ${list.join(', ')}`);
}

// 2) N3 órfão (f-*.md sem README.md / N2 na mesma pasta)
const n3s = files.filter((f) => /(^|\/)f-[^/]+\.md$/.test(f.replace(/\\/g, '/')) && /(^|\/)modules\//.test(f.replace(/\\/g, '/')));
for (const f of n3s) {
  if (!existsSync(join(dirname(f), 'README.md'))) issues.push(`N3 órfão (Agrupamento Funcional sem N2/README.md): ${rel(f)}`);
}

// 3) Cobertura do INDEX
const indexPath = join(ROOT, 'modules', 'INDEX.md');
if (existsSync(indexPath)) {
  const idx = readFileSync(indexPath, 'utf8');
  for (const f of n3s) {
    let id; try { id = levelId(readFileSync(f, 'utf8')); } catch { continue; }
    if (id && !idx.includes(id)) issues.push(`Funcionalidade fora do INDEX (ID "${id}" não referenciado em modules/INDEX.md): ${rel(f)}`);
  }
} else {
  issues.push('modules/INDEX.md ausente — sem como auditar cobertura.');
}

if (!issues.length) {
  console.log(`✓ Auditoria de instância: ${files.length} artefato(s), nenhum problema de coerência cruzada.`);
  process.exit(0);
}
console.error(`✗ Auditoria de instância — ${issues.length} achado(s):`);
for (const i of issues) console.error(`    - ${i}`);
console.error('\n(Advisory: não bloqueia gravação. N3 antes de N2/INDEX é legítimo no fluxo bottom-up — resolva antes de fechar o ciclo.)');
process.exit(1);
