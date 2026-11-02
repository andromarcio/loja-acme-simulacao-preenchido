#!/usr/bin/env node
// Migra AIM -> AIMM em uma instância, preservando histórico, chaves e transcrições.
// Uso: node scripts/migra-aimm.mjs [--root <instância>] [--write]

import { existsSync, readdirSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { impactFiles } from './lib/impact-files.mjs';
import { fileURLToPath } from 'node:url';
import { scanInstance, fingerprintText, STAMP_RE } from './lib/trace-index.mjs';

const args = process.argv.slice(2);
const index = args.indexOf('--root');
const root = resolve(index >= 0 ? args[index + 1] || '' : process.cwd());
const write = args.includes('--write');
const word = /(?<![A-Za-z0-9])AIM(?!M)(?=s?\b|[-_])/g;
const convert = text => text.replace(word, 'AIMM');
const skipped = new Set(['.git', '.github', '.claude', 'engine', 'scripts', 'node_modules', 'vendor', '_site']);
const generated = new Set(['assets/tree.js', 'assets/dashboard-data.js', 'assets/mapa-data.js', 'rastreabilidade/data.js']);

export function convertDocument(text, name, version, date) {
  const nl = text.includes('\r\n') ? '\r\n' : '\n';
  const original = text.replace(/\r\n/g, '\n');
  if (name === 'CHANGELOG.md') return text;
  const header = original.match(/^## Changelog\s*$/m);
  let body = header ? original.slice(0, header.index) : original;
  let history = header ? original.slice(header.index) : '';
  const protectedSections = [];
  if (/^AIMM?-/.test(name)) {
    for (const section of ['Descrição do ticket', 'Critérios de aceite']) {
      const expression = new RegExp(`^## ${section}\\s*\\n[\\s\\S]*?(?=^## |$(?![\\s\\S]))`, 'm');
      const match = body.match(expression);
      if (match) {
        const marker = `\u0000transcricao-${protectedSections.length}\u0000\n`;
        protectedSections.push(match[0]);
        body = body.replace(expression, marker);
      }
    }
  }
  body = convert(body).replace(/\u0000transcricao-(\d+)\u0000\n/g, (_, i) => protectedSections[Number(i)]);
  if (body === (header ? original.slice(0, header.index) : original) && !/^AIM-/.test(name)) return text;
  if (name.endsWith('.md') && header) {
    const lines = history.split('\n');
    const sep = lines.findIndex(line => /^\|[\s:|-]+\|$/.test(line.trim()));
    if (sep >= 0 && lines[sep].split('|').length === 6) {
      let end = sep + 1;
      while (end < lines.length && lines[end].trim().startsWith('|')) end++;
      const dates = lines.slice(sep + 1, end).map(line => line.match(/\d{4}-\d{2}-\d{2}/)?.[0]).filter(Boolean);
      const ascending = dates.length < 2 || dates[0] <= dates[dates.length - 1];
      lines.splice(ascending ? end : sep + 1, 0, `| ${date} | Docqui Caixa | Terminologia | Adoção de AIMM; histórico e chave preservados. |`);
      history = lines.join('\n');
    } else history += `\n- ${date} — Docqui Caixa: adoção de AIMM; histórico e chave preservados.\n`;
  }
  let output = body + history;
  if (/^<!-- docqui:/.test(output)) output = output.replace(/^<!-- docqui:.*?-->/, `<!-- docqui: ${version} | prompt: MIGRA_AIMM | atualizado: ${date} -->`);
  if ((output.match(/^## /gm) || []).length !== (original.match(/^## /gm) || []).length) throw new Error(`${name}: a quantidade de seções mudou.`);
  return output.replace(/\n/g, nl);
}

function main() {
  if (index >= 0 && (!args[index + 1] || args[index + 1].startsWith('--'))) throw new Error('Falta o valor de --root.');
  if (!existsSync(join(root, 'modules'))) throw new Error('Informe uma instância com modules/.');
  for (const option of args.filter(value => value.startsWith('--'))) if (!['--root', '--write'].includes(option)) throw new Error(`Opção desconhecida: ${option}.`);
  const version = readFileSync(join(root, 'VERSION'), 'utf8').trim();
  const date = new Date().toISOString().slice(0, 10);
  impactFiles(join(root, 'analise-impacto'));
  const model = scanInstance(root);
  const files = [];
  function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (skipped.has(entry.name) || entry.isSymbolicLink()) continue;
      const path = join(dir, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (/\.(md|html|js|json|txt)$/.test(entry.name)) files.push(path);
    }
  }
  walk(root);
  const changes = [];
  for (const file of files) {
    const rel = relative(root, file);
    if (generated.has(rel.replace(/\\/g, '/'))) continue;
    if (basename(file) === 'CHANGELOG.md' || /(?:^|[\\/])novidades\.md$/.test(rel)) continue;
    const before = readFileSync(file, 'utf8');
    if (before.includes('<!-- docqui:aimm-redirect -->')) continue;
    if (before.includes('<!-- Gerado de docqui-caixa-engine, docs/simulador/index.html')) continue;
    const name = basename(file), destination = join(dirname(file), convert(name));
    if (destination !== file && existsSync(destination)) throw new Error(`Destino já existente: ${destination}. Nada foi aplicado.`);
    // O visualizador pode ter aliases AIM em JavaScript: migre rótulos, não contratos.
    const after = name.endsWith('.md') ? convertDocument(before, name, version, date)
      : /^AIMM?-.+\.html$/.test(name) ? before
      : rel === 'index.html' ? before.split(/(<script\b[^>]*>[\s\S]*?<\/script>)/gi).map((part, i) => i % 2 ? part : convert(part)).join('')
      : convert(before);
    if (after !== before || file !== destination) changes.push({ file, destination, before, after });
  }
  const changed = new Map(changes.map(change => [change.file, change]));
  const fingerprints = new Map([...model.features, ...model.stories].map(node => {
    const change = changed.get(node.file);
    const before = change?.before ?? readFileSync(node.file, 'utf8');
    return [node.id || node.key, {
      before: fingerprintText(node.file, before),
      after: fingerprintText(change?.destination ?? node.file, change?.after ?? before),
    }];
  }));
  for (const file of files.filter(file => file.endsWith('.md') && basename(file) !== 'CHANGELOG.md')) {
    const change = changed.get(file), before = change?.before ?? readFileSync(file, 'utf8');
    const text = change?.after ?? before;
    const after = text.replace(new RegExp(STAMP_RE.source, 'g'), (stamp, key, hash) => {
      const target = fingerprints.get(key.toUpperCase());
      return target && hash === target.before ? stamp.replace(hash, target.after) : stamp;
    });
    if (after !== text) {
      if (change) change.after = after;
      else changes.push({ file, destination: file, before, after });
    }
  }
  console.log(`${write ? 'Migração' : 'Modo seco'}: ${changes.length} arquivo(s); AIMM = Análise de Impacto de Mudança para Manutenção.`);
  for (const change of changes) console.log(`  ${relative(root, change.file)}${change.file !== change.destination ? ` → ${relative(root, change.destination)}` : ''}`);
  if (!write) { console.log('Nenhum arquivo alterado. Confira a lista e aplique com --write.'); return; }
  for (const change of changes) if (readFileSync(change.file, 'utf8') !== change.before) throw new Error(`Arquivo mudou durante a análise: ${change.file}.`);
  for (const change of changes) {
    writeFileSync(change.destination, change.after);
    if (change.file !== change.destination) {
      unlinkSync(change.file);
      if (change.file.endsWith('.html')) {
        const target = basename(change.destination).replace(/[&"]/g, c => c === '&' ? '&amp;' : '&quot;');
        writeFileSync(change.file, `<!doctype html><!-- docqui:aimm-redirect --><html lang="pt-BR"><head><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=${target}"><title>AIMM</title></head><body><a href="${target}">Abrir AIMM</a></body></html>\n`);
      }
    }
  }
  console.log('✓ Migração aplicada. Regenere o HTML e o Pages pelos scripts da instância; confira os validadores antes do commit.');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch (error) { console.error(`✗ migra-aimm: ${error.message}`); process.exitCode = 1; }
}
