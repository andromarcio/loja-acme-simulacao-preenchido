#!/usr/bin/env node
// Migra os nomes dos níveis para o português (7.0.0): Major Feature Set → Domínio,
// Feature Set → Agrupamento Funcional, Feature → Funcionalidade, [SFS] → [SAF].
// Preserva o histórico (## Changelog, CHANGELOG.md, Novidades), a transcrição do ticket,
// a palavra-chave Gherkin `Feature:` e identificadores de código (features.json, feature_id).
// Uso: node scripts/migra-niveis.mjs [--root <instância>] [--write]

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scanInstance, fingerprintText, STAMP_RE } from './lib/trace-index.mjs';

// Palavra solta: não faz parte de identificador (features.json, featureSet, model.features, mapa-features).
const solta = (palavra) => new RegExp(`(?<![\\w.$-])${palavra}(?![\\w-]|\\.\\w)`, 'g');
const REGRAS = [
  // A seção da AIMM vai direto ao nome da 7.1.0 (a 7.0.0 a chamou de "Alterações na spec, por Agrupamento Funcional").
  [/Alterações na spec, por (?:Feature Set|Agrupamento Funcional)/g, 'Alterações em funcionalidades por Agrupamento Funcional'],
  [/FEATURE-DEFINITION/g, 'DEFINICAO-FUNCIONALIDADE'],
  [/_template-feature-set/g, '_template-agrupamento-funcional'],
  [/_template-feature\b/g, '_template-funcionalidade'],
  [/([[<])feature-set([\]>])/g, '$1agrupamento-funcional$2'],
  [/\b([Ff])eature-pai\b/g, (_, f) => (f === 'F' ? 'Funcionalidade-pai' : 'funcionalidade-pai')],
  [/gera-mapa-features/g, 'gera-mapa-funcionalidades'],
  [/validate-feature-semantics/g, 'valida-semantica-funcionalidade'],
  [/--out-features\b/g, '--out-funcionalidades'],
  [/--feature\b(?!-)/g, '--funcionalidade'],
  [/--fs\b(?!-)/g, '--agrupamento'],
  [/(?<!["\w])feature_set(?!["\w])/g, 'agrupamento_funcional'],
  [/\bSFS\b/g, 'SAF'],
  [/\bMajor Feature Sets\b/g, 'Domínios'],
  [/\bMajor Feature Set\b/g, 'Domínio'],
  [/\bmajor feature sets\b/g, 'domínios'],
  [/\bmajor feature set\b/g, 'domínio'],
  [/\bFeature Sets\b/g, 'Agrupamentos Funcionais'],
  [/\bFeature Set\b/g, 'Agrupamento Funcional'],
  [/\bFeature sets\b/g, 'Agrupamentos funcionais'],
  [/\bFeature set\b/g, 'Agrupamento funcional'],
  [/\bfeature sets\b/g, 'agrupamentos funcionais'],
  [/\bfeature set\b/g, 'agrupamento funcional'],
  [solta('FEATURES'), 'FUNCIONALIDADES'],
  [solta('FEATURE'), 'FUNCIONALIDADE'],
  [solta('Features'), 'Funcionalidades'],
  [solta('Feature'), 'Funcionalidade'],
  [solta('features'), 'funcionalidades'],
  [solta('feature'), 'funcionalidade'],
];
const GHERKIN = /^([ \t]*)Feature:(?=[ \t])|`Feature:`/gm;

export function converteTexto(text) {
  const guardados = [];
  let out = text.replace(GHERKIN, (m) => { guardados.push(m); return `\u0000${guardados.length - 1}\u0000`; });
  for (const [de, para] of REGRAS) out = out.replace(de, para);
  return out.replace(/\u0000(\d+)\u0000/g, (_, i) => guardados[Number(i)]);
}

// Trechos que não se convertem: as seções de histórico e, na AIMM, a transcrição do ticket.
// O cabeçalho só conta fora de bloco de código, e o trecho vai até o próximo `## `.
function trechosProtegidos(text, name) {
  const secoes = ['Changelog', ...(/^AIMM?-/.test(name) ? ['Descrição do ticket', 'Critérios de aceite'] : [])];
  const linhas = text.split('\n');
  const trechos = [];
  let cerca = false, aberto = null, pos = 0;
  for (const linha of linhas) {
    if (/^\s*(```|~~~)/.test(linha)) cerca = !cerca;
    else if (!cerca && /^## /.test(linha)) {
      if (aberto !== null) { trechos.push([aberto, pos]); aberto = null; }
      if (secoes.some((s) => new RegExp(`^## ${s}\\s*$`).test(linha))) aberto = pos;
    }
    pos += linha.length + 1;
  }
  if (aberto !== null) trechos.push([aberto, text.length]);
  return trechos;
}

// Converte o documento fora dos trechos protegidos, sem carimbo nem linha de Changelog.
export function converteDocumento(text, name) {
  let output = '', inicio = 0;
  for (const [de, ate] of trechosProtegidos(text, name)) {
    output += converteTexto(text.slice(inicio, de)) + text.slice(de, ate);
    inicio = ate;
  }
  return output + converteTexto(text.slice(inicio));
}

export function convertDocument(text, name, version, date) {
  const nl = text.includes('\r\n') ? '\r\n' : '\n';
  const original = text.replace(/\r\n/g, '\n');
  let output = converteDocumento(original, name);
  if (output === original) return text;
  const changelog = output.match(/^## Changelog\s*$/m);
  // Uma linha por artefato: rodar de novo (depois de um merge que trouxe texto antigo) não repete o registro.
  if (changelog && !output.slice(changelog.index).includes('| Terminologia | Níveis em português:')) {
    const lines = output.split('\n');
    const head = output.slice(0, changelog.index).split('\n').length - 1;
    const sep = lines.findIndex((line, i) => i > head && /^\|[\s:|-]+\|$/.test(line.trim()));
    if (sep >= 0 && lines[sep].split('|').length === 6) {
      let end = sep + 1;
      while (end < lines.length && lines[end].trim().startsWith('|')) end++;
      const dates = lines.slice(sep + 1, end).map((line) => line.match(/\d{4}-\d{2}-\d{2}/)?.[0]).filter(Boolean);
      const ascending = dates.length < 2 || dates[0] <= dates[dates.length - 1];
      lines.splice(ascending ? end : sep + 1, 0, `| ${date} | Docqui Caixa | Terminologia | Níveis em português: Domínio, Agrupamento Funcional e Funcionalidade; histórico preservado. |`);
      output = lines.join('\n');
    }
  }
  if (/^<!-- docqui:/.test(output)) output = output.replace(/^<!-- docqui:.*?-->/, `<!-- docqui: ${version} | prompt: MIGRA_NIVEIS | atualizado: ${date} -->`);
  if ((output.match(/^## /gm) || []).length !== (original.match(/^## /gm) || []).length) throw new Error(`${name}: a quantidade de seções mudou.`);
  return output.replace(/\n/g, nl);
}

const skipped = new Set(['.git', '.claude', 'engine', 'scripts', 'node_modules', 'vendor', '_site']);
const ANTIGOS = /Major Feature Set|Feature Set|\b[Ff]eatures?\b|\bSFS\b/;

function main() {
  const args = process.argv.slice(2);
  const index = args.indexOf('--root');
  if (index >= 0 && (!args[index + 1] || args[index + 1].startsWith('--'))) throw new Error('Falta o valor de --root.');
  for (const option of args.filter((value) => value.startsWith('--'))) if (!['--root', '--write'].includes(option)) throw new Error(`Opção desconhecida: ${option}.`);
  const root = resolve(index >= 0 ? args[index + 1] : process.cwd());
  const write = args.includes('--write');
  if (!existsSync(join(root, 'modules'))) throw new Error('Informe uma instância com modules/.');
  const version = readFileSync(join(root, 'VERSION'), 'utf8').trim();
  const date = new Date().toISOString().slice(0, 10);
  const model = scanInstance(root);
  const files = [], revisar = [];
  (function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (skipped.has(entry.name) || entry.isSymbolicLink()) continue;
      const path = join(dir, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (entry.name.endsWith('.md')) files.push(path);
      else if (/\.(html|js|json|yml|yaml|txt)$/.test(entry.name)) revisar.push(path);
    }
  })(root);
  const changes = [];
  for (const file of files) {
    const rel = relative(root, file).replace(/\\/g, '/');
    if (basename(file) === 'CHANGELOG.md' || /(?:^|\/)novidades\.md$/.test(rel)) continue;
    const before = readFileSync(file, 'utf8');
    // Molde (_TEMPLATE_*, _template-*): o Changelog dele é linha-modelo, não histórico — converte
    // inteiro, sem carimbo nem linha nova, como os moldes do engine.
    const after = /^_template/i.test(basename(file)) ? converteTexto(before) : convertDocument(before, basename(file), version, date);
    if (after !== before) changes.push({ file, before, after });
  }
  // O texto do N3 mudou: o carimbo trace-verified que batia com a impressão antiga passa à nova.
  const changed = new Map(changes.map((change) => [change.file, change]));
  const fingerprints = new Map([...model.features, ...model.stories].map((node) => {
    const change = changed.get(node.file);
    const before = change?.before ?? readFileSync(node.file, 'utf8');
    return [node.id || node.key, { before: fingerprintText(node.file, before), after: fingerprintText(node.file, change?.after ?? before) }];
  }));
  for (const file of files.filter((f) => basename(f) !== 'CHANGELOG.md')) {
    const change = changed.get(file), before = change?.before ?? readFileSync(file, 'utf8');
    const text = change?.after ?? before;
    const after = text.replace(new RegExp(STAMP_RE.source, 'g'), (stamp, key, hash) => {
      const target = fingerprints.get(key.toUpperCase());
      return target && hash === target.before ? stamp.replace(hash, target.after) : stamp;
    });
    if (after !== text) {
      if (change) change.after = after;
      else changes.push({ file, before, after });
    }
  }
  console.log(`${write ? 'Migração' : 'Modo seco'}: ${changes.length} arquivo(s) Markdown; níveis Domínio, Agrupamento Funcional e Funcionalidade.`);
  for (const change of changes) console.log(`  ${relative(root, change.file)}`);
  const pendentes = revisar.filter((file) => ANTIGOS.test(readFileSync(file, 'utf8'))).map((file) => relative(root, file));
  if (pendentes.length) {
    console.log(`\nFora do Markdown, ${pendentes.length} arquivo(s) ainda citam os nomes antigos. Saídas geradas se regeneram pelos scripts da instância; o resto se revisa à mão:`);
    for (const rel of pendentes) console.log(`  ${rel}`);
  }
  if (!write) { console.log('\nNenhum arquivo alterado. Confira a lista e aplique com --write.'); return; }
  for (const change of changes) if (readFileSync(change.file, 'utf8') !== change.before) throw new Error(`Arquivo mudou durante a análise: ${change.file}.`);
  for (const change of changes) writeFileSync(change.file, change.after);
  console.log('✓ Migração aplicada. Regenere o HTML e o Pages pelos scripts da instância; confira os validadores antes do commit.');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch (error) { console.error(`✗ migra-niveis: ${error.message}`); process.exitCode = 1; }
}
