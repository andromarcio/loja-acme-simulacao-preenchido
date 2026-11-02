#!/usr/bin/env node
// Atualiza a AIMM do ticket para o layout sem Contexto, sem PF e com entidades; a AIMM da
// sprint, só nos nomes das alterações por Agrupamento Funcional e das Decisões pendentes.
// Uso: node scripts/migra-aimm-ticket-layout.mjs [--root <instância>] [--write]

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { impactFiles } from './lib/impact-files.mjs';
import { frontMatterCampos } from './lib/trace-index.mjs';
import { ehSecao } from './lib/niveis.mjs';

const args = process.argv.slice(2);
const rootIndex = args.indexOf('--root');
const ROOT = resolve(rootIndex >= 0 ? args[rootIndex + 1] || '' : process.cwd());
const WRITE = args.includes('--write');
const allowed = new Set(['--root', '--write']);
for (const option of args.filter(arg => arg.startsWith('--'))) {
  if (!allowed.has(option)) throw new Error(`Opção desconhecida: ${option}.`);
}
if (rootIndex >= 0 && (!args[rootIndex + 1] || args[rootIndex + 1].startsWith('--'))) throw new Error('Falta o valor de --root.');

const column = (cells, name) => cells.findIndex(cell => cell.trim().toLowerCase() === name);
const cells = line => line.trim().replace(/^\||\|$/g, '').split('|').map(cell => cell.trim());
const tableLine = values => `| ${values.join(' | ')} |`;
const isSeparator = line => /^\|[\s:|-]+\|$/.test(line.trim());

function section(lines, title) {
  const start = lines.findIndex(line => ehSecao(line, title));
  if (start < 0) return null;
  const end = lines.findIndex((line, index) => index > start && /^##\s/.test(line));
  return { start, end: end < 0 ? lines.length : end };
}

function withFeatureNameBelow(value) {
  if (/<br\s*\/?>/i.test(value)) return value;
  const match = value.match(/^(.*?\b[A-Z]{3}-[A-Z]{3}-\d{2}\b[`)\]]*)(?:\s+)(\*\*[^*]+\*\*)$/);
  return match ? `${match[1]}<br>${match[2]}` : value;
}

function migrate(text, version, date) {
  const eol = text.includes('\r\n') ? '\r\n' : '\n';
  const original = text.replace(/\r\n/g, '\n');
  const lines = original.split('\n');
  const fm = frontMatterCampos(lines);
  const kind = String(fm.tipo || '').toLowerCase(), ticket = kind === 'ticket';
  if (!ticket && kind !== 'sprint') return text;
  let changed = false;
  const context = ticket ? section(lines, 'Contexto') : null;
  if (context) { lines.splice(context.start, context.end - context.start); changed = true; }
  // Nomes anteriores da seção: o da 6.4.26 e o da 7.0.0.
  for (const nome of ['Alterações na spec, por Feature Set', 'Alterações na spec, por Agrupamento Funcional']) {
    const oldAlterations = section(lines, nome);
    if (oldAlterations) { lines[oldAlterations.start] = '## Alterações em funcionalidades por Agrupamento Funcional'; changed = true; }
  }
  const oldDecisions = section(lines, 'Decisões de produto pendentes');
  if (oldDecisions) { lines[oldDecisions.start] = '## Decisões pendentes'; changed = true; }
  const alterations = ticket ? section(lines, 'Alterações em funcionalidades por Agrupamento Funcional') : null;
  if (alterations) {
    const headerIndex = lines.findIndex((line, index) => index > alterations.start && index < alterations.end && line.trim().startsWith('|') && !isSeparator(line));
    if (headerIndex >= 0) {
      const header = cells(lines[headerIndex]);
      const pfb = column(header, 'pfb'), pfl = column(header, 'pfl'), feature = Math.max(column(header, 'funcionalidade'), column(header, 'feature'));
      if (pfb >= 0 || pfl >= 0) {
        const remove = [pfb, pfl].filter(index => index >= 0).sort((a, b) => b - a);
        for (let index = headerIndex; index < alterations.end; index++) {
          if (!lines[index].trim().startsWith('|')) continue;
          const row = cells(lines[index]);
          for (const at of remove) row.splice(at, 1);
          lines[index] = tableLine(row);
        }
        changed = true;
      }
      if (feature >= 0) {
        for (let index = headerIndex + 2; index < alterations.end; index++) {
          if (!lines[index].trim().startsWith('|') || isSeparator(lines[index])) continue;
          const row = cells(lines[index]);
          if (feature < row.length) {
            const updated = withFeatureNameBelow(row[feature]);
            if (updated !== row[feature]) { row[feature] = updated; lines[index] = tableLine(row); changed = true; }
          }
        }
      }
    }
  }
  const oldEntities = ticket ? section(lines, 'Funções de dados alteradas') : null;
  if (oldEntities) {
    lines[oldEntities.start] = '## Entidades alteradas';
    for (let index = oldEntities.start + 1; index < oldEntities.end; index++) {
      const heading = lines[index].match(/^###\s+(?:ALI|AIE):\s*(.+?)(?:\s+[—–]\s+.*)?$/i);
      if (heading) { lines[index] = `### ${heading[1].trim()}`; changed = true; }
      if (lines[index].trim().startsWith('|')) {
        const row = cells(lines[index]);
        const at = column(row, 'tabela / coluna');
        if (at >= 0) { row[at] = 'Tabela / atributo'; lines[index] = tableLine(row); changed = true; }
      }
    }
    changed = true;
  }
  if (!changed) return text;
  const changelog = section(lines, 'Changelog');
  if (changelog) {
    const separator = lines.findIndex((line, index) => index > changelog.start && index < changelog.end && isSeparator(line));
    if (separator >= 0) {
      const header = cells(lines[separator - 1]);
      const row = header.map(value => /^data$/i.test(value) ? date
        : /^autor$/i.test(value) ? 'Docqui Caixa'
          : /^tipo$/i.test(value) ? 'Ajuste'
            : /^descri|mudan/i.test(value) ? (ticket ? 'Layout da AIMM do ticket: sem Contexto, alterações por Agrupamento Funcional, Decisões pendentes, nome abaixo do ID, entidades sem PF.'
              : 'Seções renomeadas: Alterações em funcionalidades por Agrupamento Funcional e Decisões pendentes.') : '—');
      lines.splice(separator + 1, 0, tableLine(row));
    }
  }
  if (/^<!-- docqui: [^|]+\|/.test(lines[0])) {
    lines[0] = lines[0].replace(/^<!-- docqui: [^|]+\|/, `<!-- docqui: ${version} |`).replace(/atualizado: \d{4}-\d{2}-\d{2}/, `atualizado: ${date}`);
  }
  if ((original.match(/^## /gm) || []).length - (context ? 1 : 0) !== (lines.join('\n').match(/^## /gm) || []).length) throw new Error('A migração alterou a quantidade de seções.');
  return lines.join(eol);
}

const version = readFileSync(join(ROOT, 'VERSION'), 'utf8').trim();
const date = new Date().toISOString().slice(0, 10);
const dir = join(ROOT, 'analise-impacto');
const changes = impactFiles(dir).map(name => {
  const file = join(dir, name), before = readFileSync(file, 'utf8'), after = migrate(before, version, date);
  return { file, before, after };
}).filter(change => change.before !== change.after);
console.log(`${WRITE ? 'Migração' : 'Modo seco'}: ${changes.length} AIMM(s) no layout atual.`);
for (const change of changes) console.log(`  ${change.file.slice(ROOT.length + 1)}`);
if (!WRITE) {
  console.log('Nenhum arquivo alterado. Confira a lista e aplique com --write.');
} else {
  for (const change of changes) {
    if (readFileSync(change.file, 'utf8') !== change.before) throw new Error(`Arquivo mudou durante a análise: ${change.file}.`);
    writeFileSync(change.file, change.after);
  }
  console.log('✓ Migração aplicada. Regenere os HTML das AIMMs e a árvore do site.');
}

export { migrate };
