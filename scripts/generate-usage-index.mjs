#!/usr/bin/env node
// generate-usage-index.mjs — índice reverso de uso dos dicionários.
//
// Sob cada entrada de RULES / FIELD / MESSAGE / ERROR, registra **onde foi
// utilizada** (em quais N3), derivado das referências que já vivem nos próprios
// artefatos:
//
//   → ver RULES-DICTIONARY: [RC-NN] — [nome]        ·  ← RULES-DICTIONARY: [RC-NN] — [nome]
//   → ver FIELD-DICTIONARY: [nome]        ·  ← FIELD-DICTIONARY: [nome]
//   → ver ERROR-DICTIONARY: `CODIGO`      ·  ← ERROR-DICTIONARY: `CODIGO`
//   → ver MESSAGE-DICTIONARY: `CHAVE`     ·  ← MESSAGE-DICTIONARY: BASELINE
//
// Determinístico e sem dependências (mesmo espírito de generate-trace-index.mjs):
// o backlink NÃO é escrito à mão — a informação já existe na referência direta
// do N3; este script só a projeta de volta para o dicionário. Backlink escrito à
// mão apodrece; derivado, nunca diverge.
//
//   - Dicionários com entradas `### <nome>` (RULES, FIELD): injeta um bloco
//     `> **Usado em:** …` logo ABAIXO de cada `### <nome>`, entre marcadores. No RULES,
//     a entrada é `### RC-NN — Nome` e a chave é só o ID.
//   - Dicionários tabelados por chave/código (MESSAGE, ERROR): (re)gera uma
//     seção `## Usado em (índice reverso)` ao final, entre marcadores.
//
// Uso:
//   node scripts/generate-usage-index.mjs --root <instância>          # dry-run (relatório)
//   node scripts/generate-usage-index.mjs --root <instância> --write  # escreve nos dicionários

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

/* ----------------------------- CLI ----------------------------- */
const args = process.argv.slice(2);
function opt(name, def = null) {
  const i = args.indexOf(name);
  return i !== -1 && args[i + 1] ? args[i + 1] : def;
}
const ROOT = opt('--root', '.');
const WRITE = args.includes('--write');
if (!existsSync(join(ROOT, 'global')) || !existsSync(join(ROOT, 'modules'))) {
  console.error(`Uso: node scripts/generate-usage-index.mjs --root <instância> [--write]`);
  console.error(`  "${ROOT}" não parece uma instância (faltam global/ e/ou modules/).`);
  process.exit(2);
}

/* --------------------------- helpers --------------------------- */
const DICTS = ['RULES', 'FIELD', 'MESSAGE', 'ERROR'];
const HEADING_DICTS = new Set(['RULES', 'FIELD']); // entradas `### <nome>`
const norm = (s) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();

function walk(dir, acc = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('_') || e.name.startsWith('.')) continue; // _base-conhecimento, _review…
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (e.isFile() && e.name.endsWith('.md')) acc.push(p);
  }
  return acc;
}

// ID da funcionalidade: linha "Nível 3" com `SIGLA-SAF-NN` (mesma extração do trace-index).
function featureId(raw, path) {
  const lvl = raw.split(/\r?\n/).find((l) => /N[íi]vel 3/.test(l));
  const id = lvl && (lvl.match(/`([A-Z]{3}-[A-Z]{3}-\d{2})`/) || [])[1];
  return id || relative(ROOT, path).replace(/\.md$/, '');
}

// Extrai referências de uma linha. Uma referência aponta um dicionário e ≥1 chave.
const REF_RE = /(?:→\s*ver\s+|←\s*|→\s*)(RULES|FIELD|MESSAGE|ERROR)-DICTIONARY\s*:?\s*([^\n]*)/g;
// Regra canônica: a chave é SÓ o ID `RC-NN` (decisão do PO, 2026-09-28 — REP-045 do
// portal-compras); o nome depois do travessão é para quem lê. Citação sem ID não indexa.
const RC_RE = /\bRC-\d{2,}\b/g;
const idDaRegra = (titulo) => (titulo.match(/^(RC-\d{2,})\b/) || [])[1] || null;
function keysFromTail(dict, tail) {
  if (dict === 'RULES') return [...tail.split(/[;(|]|⚠|←|→/)[0].matchAll(RC_RE)].map((m) => m[0]);
  // Códigos/chaves em backticks — pode haver vários separados por `/` ou `,`.
  const ticked = [...tail.matchAll(/`([^`]+)`/g)].map((m) => m[1].trim());
  if (ticked.length) return ticked;
  // Nome livre até o primeiro delimitador; separa alternativas por `/` e `,`.
  const head = tail.split(/[;(|]|⚠|←|→|\.\s|$/)[0];
  return head
    .split(/\s*\/\s*|\s*,\s*/)
    .map((s) => s.trim())
    .filter((s) => /[\p{L}\d]/u.test(s) && !/^ver$/i.test(s));
}
// Ponteiro sem chave numa linha de tabela — `| CODIGO | 409 | … (→ ver ERROR-DICTIONARY) |`:
// a chave é a primeira célula. Antes, o `)` que fecha o parêntese virava a chave (achado no
// siesa-doc, 2026-10-11: uma linha `)` com 17 funcionalidades no índice do ERROR-DICTIONARY, e os
// códigos dessas linhas fora do índice).
function keysFromRow(raw, idx) {
  const ini = raw.lastIndexOf('\n', idx) + 1;
  const linha = raw.slice(ini, raw.indexOf('\n', idx) < 0 ? undefined : raw.indexOf('\n', idx)).trim();
  if (!linha.startsWith('|')) return [];
  const cel = linha.replace(/^\|/, '').split('|')[0].replace(/[`*]/g, '').trim();
  return cel && /[\p{L}\d]/u.test(cel) ? [cel] : [];
}

/* --------------- varre os N3 e monta o índice reverso --------------- */
// usage: dict -> normKey -> { display, ids:Set }
const usage = Object.fromEntries(DICTS.map((d) => [d, new Map()]));
for (const file of walk(join(ROOT, 'modules'))) {
  // A `## Changelog` fica de fora: entrada que CITA o marcador (`# ← MESSAGE-DICTIONARY`)
  // não é uso, e virava chave fantasma — o changelog é histórico, a instância não o limpa.
  const raw = readFileSync(file, 'utf8').replace(/^## Changelog\b[\s\S]*?(?=^## |(?![\s\S]))/m, '');
  const fid = featureId(raw, file);
  let m;
  REF_RE.lastIndex = 0;
  while ((m = REF_RE.exec(raw))) {
    const dict = m[1];
    const chaves = keysFromTail(dict, m[2]);
    for (const key of chaves.length ? chaves : keysFromRow(raw, m.index)) {
      const nk = norm(key);
      if (!nk) continue;
      const bucket = usage[dict];
      if (!bucket.has(nk)) bucket.set(nk, { display: key, ids: new Set() });
      bucket.get(nk).ids.add(fid);
    }
  }
}
const idList = (set) => [...set].sort().map((i) => `\`${i}\``).join(' · ');

/* ----------------------- injeção nos dicionários ----------------------- */
const S = '<!-- usado-em:gerado -->';
const E = '<!-- /usado-em -->';
const report = [];

function injectHeadings(dict, path, raw) {
  const bucket = usage[dict];
  const lines = raw.split(/\r?\n/);
  const out = [];
  let hits = 0;
  for (let i = 0; i < lines.length; i++) {
    const h = lines[i].match(/^###\s+(.+?)\s*$/);
    out.push(lines[i]);
    if (!h) continue;
    // pula um bloco gerado preexistente logo abaixo do heading
    let j = i + 1;
    while (j < lines.length && lines[j].trim() === '') j++;
    if (lines[j] && lines[j].trim() === S) {
      const end = lines.findIndex((l, k) => k >= j && l.trim() === E);
      i = end !== -1 ? end : j; // consome o bloco antigo
    }
    const entry = bucket.get(norm(dict === 'RULES' ? idDaRegra(h[1]) || '' : h[1]));
    const val = entry && entry.ids.size ? idList(entry.ids) : '_(ainda não referenciado em N3)_';
    if (entry && entry.ids.size) hits++;
    out.push(S, `> **Usado em:** ${val}`, E);
  }
  report.push(`  ${dict}-DICTIONARY: ${hits} entrada(s) com uso registrado`);
  return out.join('\n');
}

function injectTable(dict, path, raw) {
  const bucket = usage[dict];
  const rows = [...bucket.entries()]
    .sort((a, b) => a[1].display.localeCompare(b[1].display, 'pt'))
    .map(([, v]) => `| \`${v.display}\` | ${idList(v.ids)} |`);
  const block = [
    S,
    `## Usado em (índice reverso)`,
    ``,
    `> Gerado por \`scripts/generate-usage-index.mjs\` a partir das referências \`→ ver\`/\`←\` nos N3. **Não editar à mão.**`,
    ``,
    `| Entrada | Usado em |`,
    `|---|---|`,
    ...(rows.length ? rows : [`| _(nenhuma referência encontrada)_ | — |`]),
    E,
  ].join('\n');
  const re = new RegExp(`${S}[\\s\\S]*?${E}`);
  const next = re.test(raw) ? raw.replace(re, block) : `${raw.replace(/\s*$/, '')}\n\n${block}\n`;
  report.push(`  ${dict}-DICTIONARY: ${bucket.size} entrada(s) no índice reverso`);
  return next;
}

let changed = 0;
for (const dict of DICTS) {
  const path = join(ROOT, 'global', `${dict}-DICTIONARY.md`);
  if (!existsSync(path)) { report.push(`  ${dict}-DICTIONARY: (ausente — pulado)`); continue; }
  const raw = readFileSync(path, 'utf8');
  const next = HEADING_DICTS.has(dict) ? injectHeadings(dict, path, raw) : injectTable(dict, path, raw);
  if (next !== raw) {
    changed++;
    if (WRITE) writeFileSync(path, next.endsWith('\n') ? next : next + '\n');
  }
}

console.log(`índice reverso de uso — instância: ${relative('.', ROOT) || '.'}`);
console.log(report.join('\n'));
console.log(WRITE
  ? `\n${changed} dicionário(s) atualizado(s).`
  : `\n${changed} dicionário(s) seriam atualizados — rode com --write para aplicar.`);
