#!/usr/bin/env node
// Reserva IDs na ordem da tabela Funcionalidades do N2, sem renumerar identificadores usados.
// Uso: node scripts/ids-n3.mjs modules\<domínio>\<agrupamento-funcional>\README.md [--write|--check] [--base ref]
// Sem alvo, --check confere todos os Agrupamentos Funcionais da instância.

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { findInstanceRoot } from './lib/trace-index.mjs';
import { planN3Ids, applyN3IdPlan, checkN3Identity } from './lib/n3-ids.mjs';

const args = process.argv.slice(2);
const check = args.includes('--check'), write = args.includes('--write');
const option = name => {
  const index = args.indexOf(name);
  if (index < 0) return null;
  if (!args[index + 1] || args[index + 1].startsWith('--')) throw new Error(`Falta o valor de ${name}.`);
  return args[index + 1];
};

try {
  if (check && write) throw new Error('Escolha --check ou --write.');
  const base = option('--base'), rootArg = option('--root');
  const targets = args.filter((value, index) => !value.startsWith('--') && !['--base', '--root'].includes(args[index - 1]));
  const unknown = args.find(value => value.startsWith('--') && !['--write', '--check', '--base', '--root'].includes(value));
  if (unknown) throw new Error(`Opção desconhecida: ${unknown}.`);
  const root = resolve(rootArg || (targets[0] && findInstanceRoot(dirname(resolve(targets[0])))) || process.cwd());
  const readmes = new Set(), orphanN3 = new Set();
  for (const target of targets) {
    const path = rootArg ? resolve(root, target) : resolve(target);
    if (!existsSync(path)) throw new Error(`Alvo inexistente: ${path}.`);
    const readme = path.endsWith('.md') ? path.endsWith('README.md') ? path : join(dirname(path), 'README.md') : join(path, 'README.md');
    if (check && /^f-.*\.md$/.test(path.split(/[\\/]/).pop()) && !existsSync(readme)) orphanN3.add(path);
    else readmes.add(readme);
  }
  if (!targets.length && check) {
    const modules = join(root, 'modules');
    for (const dom of existsSync(modules) ? readdirSync(modules, { withFileTypes: true }) : []) {
      if (!dom.isDirectory() || dom.name.startsWith('_')) continue;
      for (const fs of readdirSync(join(modules, dom.name), { withFileTypes: true })) {
        if (!fs.isDirectory() || fs.name.startsWith('_')) continue;
        const folder = join(modules, dom.name, fs.name), readme = join(folder, 'README.md');
        if (existsSync(readme)) readmes.add(readme);
        else for (const file of readdirSync(folder).filter(name => /^f-.*\.md$/.test(name))) orphanN3.add(join(folder, file));
      }
    }
  }
  if (!readmes.size && !check) throw new Error('Informe o N2 cuja jornada já foi confirmada. Sem --write, o comando é modo seco.');
  const outputs = [];
  let failed = false;
  for (const file of orphanN3) {
    try { console.log(`✓ ${checkN3Identity(root, file, base)} preservado em ${file} (N2 ainda não existe; nenhuma nova sequência atribuída).`); }
    catch (error) { failed = true; console.error(`✗ ${file}: ${error.message}`); }
  }
  for (const readme of readmes) {
    try {
      const plan = planN3Ids(root, readme, { base });
      console.log(`${plan.id}: ${plan.rows.length} funcionalidade(s) na ordem da tabela; IDs existentes preservados.`);
      for (const row of plan.rows) console.log(`  ${row.id} — ${row.name}${plan.pending.some(p => p.path === row.path) ? ' [reservar no N2]' : ' [preservado]'}`);
      if (check && (plan.pending.length || plan.missingN3Ids.length)) {
        failed = true;
        console.error(`✗ ${readme}: ${plan.pending.length} funcionalidade(s) sem a reserva correta; ${plan.missingN3Ids.length} N3(s) ainda sem ID. Reserve no N2 em modo seco e, conferido, --write; copie o ID reservado para cada N3.`);
      } else if (write && (plan.pending.length || plan.registration)) {
        const version = readFileSync(join(root, 'VERSION'), 'utf8').trim();
        if (!/^\d+\.\d+\.\d+(?:[-+].*)?$/.test(version)) throw new Error('VERSION inválido.');
        outputs.push({ readme, before: plan.text, text: applyN3IdPlan(plan, version, new Date().toISOString().slice(0, 10)) });
      }
      if (!check) console.log(plan.next <= 99 ? `  Próximo número: ${plan.id}-${String(plan.next).padStart(2, '0')} (sem reutilizar lacunas).` : '  Sequência esgotada: não reutilize nem renumere.');
    } catch (error) {
      failed = true;
      console.error(`✗ ${readme}: ${error.message}`);
    }
  }
  if (!failed && write) {
    for (const output of outputs) if (readFileSync(output.readme, 'utf8') !== output.before) throw new Error(`${output.readme} mudou durante a análise; nada foi aplicado.`);
    for (const output of outputs) writeFileSync(output.readme, output.text);
    console.log(`✓ ${outputs.length} N2 atualizado(s); nenhum N3 renumerado. Confira o diff antes do commit.`);
  } else if (!failed) console.log(check ? `✓ ${readmes.size} Agrupamento Funcional(s) conferido(s).` : 'Modo seco: nenhum arquivo alterado. Após conferir a jornada e o diff previsto, aplique com --write.');
  process.exitCode = failed ? 1 : 0;
} catch (error) {
  console.error(`✗ ids-n3: ${error.message}`);
  process.exitCode = 2;
}
