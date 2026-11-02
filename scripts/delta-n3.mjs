#!/usr/bin/env node
// delta-n3.mjs — o que mudou em cada N3 entre a base (main) e a branch do ticket, por
// seção. É a entrada do PROMPT_SDD em modo alteração.
//
// Por quê: o N3 é a foto atual e completa da funcionalidade, e o SDD lê o N3 inteiro. Numa
// alteração pequena — um campo novo no filtro de uma pesquisa — o SDD redesenharia a
// pesquisa toda. O delta não se escreve à mão (divergiria do N3 na primeira correção):
// deriva-se do git. O "antes" é o N3 na base; o "depois", o N3 na árvore de trabalho.
//
// Quais N3: os da AIMM do ticket (`--aim`, linhas `N3` do `## Artefatos impactados`) ou os
// caminhos passados. Linha `criar` (ou N3 que não existe na base) é funcionalidade nova → SDD
// completo, sem delta. Linha `deprecar` só é listada.
//
// O que fica de fora do diff, por ser ruído para o design: comentários HTML, a seção
// `## Changelog` e, no front-matter, o `estado`, os `gates` e a `contagem` (a esteira).
// Os demais campos do front-matter (endpoints, error_codes, depende_de…) contam.
//
// A base é comparada pelo merge-base com o HEAD, como o `validate-impact --git-base`:
// o que entrou na main depois que a branch saiu não aparece como mudança do ticket.
//
// Uso (a partir da raiz da instância):
//   node scripts/delta-n3.mjs --aim analise-impacto/AIMM-<CHAVE>.md [--base main]
//   node scripts/delta-n3.mjs modules/<dom>/<fs>/f-<slug>.md … [--base main]
//   (--root <inst> para rodar de fora da instância)

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { resolveImpactFile } from './lib/impact-files.mjs';

const args = process.argv.slice(2);
const opt = (n, d = null) => { const i = args.indexOf(n); return i !== -1 && args[i + 1] ? args[i + 1] : d; };
const ROOT = opt('--root', process.cwd());
const BASE = opt('--base', 'main');
const AIMM = opt('--aimm') || opt('--aim');
const COM_VALOR = ['--root', '--base', '--aimm', '--aim'];
const caminhos = args.filter((a, k) => !a.startsWith('--') && !COM_VALOR.includes(args[k - 1]));

const uso = () => {
  console.error('Uso: node scripts/delta-n3.mjs --aim analise-impacto/AIMM-<CHAVE>.md [--base main] [--root <inst>]\n' +
    '     node scripts/delta-n3.mjs <N3.md> … [--base main] [--root <inst>]');
  process.exit(2);
};
if (!AIMM && !caminhos.length) uso();

const git = (...a) => spawnSync('git', ['-C', ROOT, ...a], { encoding: 'utf8' });
const splitRow = (r) => r.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());

// ---- quais N3 ----------------------------------------------------------------
const alvos = []; // { path, operacao }
if (AIMM) {
  const f = resolveImpactFile(join(ROOT, AIMM));
  if (!existsSync(f)) { console.error(`✗ AIMM não encontrada: ${AIMM}`); process.exit(2); }
  const ls = readFileSync(f, 'utf8').split(/\r?\n/);
  const i = ls.findIndex((l) => l.trim() === '## Artefatos impactados');
  let cab = null;
  for (let k = i + 1; i >= 0 && k < ls.length && !/^##\s/.test(ls[k]); k++) {
    const l = ls[k].trim();
    if (!l.startsWith('|')) { cab = null; continue; }
    if (/^\|[\s:|-]+\|?$/.test(l)) continue;
    const c = splitRow(l);
    if (!cab) { cab = c.map((x) => x.toLowerCase()); continue; }
    const col = (n) => c[cab.indexOf(n)] || '';
    if (col('tipo').toUpperCase() !== 'N3') continue;
    const path = col('artefato').replace(/`/g, '');
    if (/[<>[\]]/.test(path)) continue; // linha de exemplo do template
    alvos.push({ path, operacao: col('operação').toLowerCase() || col('operacao').toLowerCase() });
  }
  if (!alvos.length) { console.error(`✗ a AIMM não tem linha \`N3\` no \`## Artefatos impactados\`: ${AIMM}`); process.exit(2); }
}
for (const p of caminhos) alvos.push({ path: p, operacao: '' });

// ---- base: merge-base com o HEAD ----------------------------------------------
const mb = git('merge-base', BASE, 'HEAD');
if (mb.status !== 0) { console.error(`✗ não consegui achar a base \`${BASE}\` no git de ${ROOT}: ${(mb.stderr || '').trim()}`); process.exit(2); }
const BASE_SHA = mb.stdout.trim();
const naBase = (p) => { const s = git('show', `${BASE_SHA}:${p}`); return s.status === 0 ? s.stdout : null; };

// ---- N3 em seções -------------------------------------------------------------
const RUIDO_FM = /^(estado|gates|contagem):/;
function secoes(md) {
  const ls = md.replace(/<!--[\s\S]*?-->/g, '').split(/\r?\n/);
  const out = new Map();
  let i = 0;
  while (i < ls.length && !ls[i].trim()) i++;
  if (ls[i] && ls[i].trim() === '---') {
    const fm = [];
    let ruido = false;
    for (i++; i < ls.length && ls[i].trim() !== '---'; i++) {
      if (/^\S/.test(ls[i])) ruido = RUIDO_FM.test(ls[i]);
      if (!ruido) fm.push(ls[i]);
    }
    out.set('front-matter', fm);
    i++;
  }
  let nome = '(cabeçalho)';
  out.set(nome, []);
  for (; i < ls.length; i++) {
    const h = ls[i].match(/^## (.+?)\s*$/);
    if (h) { nome = h[1]; out.set(nome, []); continue; }
    out.get(nome).push(ls[i]);
  }
  out.delete('Changelog');
  for (const [k, v] of out) {
    while (v.length && !v[v.length - 1].trim()) v.pop();
    while (v.length && !v[0].trim()) v.shift();
    if (!v.length) out.delete(k);
  }
  return out;
}

// Diff por linhas (LCS): devolve [{op: '=', '-', '+', linha}].
function diff(a, b) {
  const n = a.length, m = b.length, w = m + 1;
  const dp = new Int32Array((n + 1) * w);
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--)
    dp[i * w + j] = a[i] === b[j] ? dp[(i + 1) * w + j + 1] + 1 : Math.max(dp[(i + 1) * w + j], dp[i * w + j + 1]);
  const ops = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) { ops.push({ op: '=', linha: a[i], j }); i++; j++; }
    else if (dp[(i + 1) * w + j] >= dp[i * w + j + 1]) ops.push({ op: '-', linha: a[i++] });
    else { ops.push({ op: '+', linha: b[j], j }); j++; }
  }
  while (i < n) ops.push({ op: '-', linha: a[i++] });
  while (j < m) { ops.push({ op: '+', linha: b[j], j }); j++; }
  return ops;
}

// Só as linhas que mudaram; linha de tabela leva o cabeçalho da tabela como contexto.
function blocoDiff(antes, depois) {
  const ops = diff(antes, depois);
  const cabDe = (ls, k) => { while (k > 0 && ls[k - 1].trim().startsWith('|')) k--; return ls[k]; };
  const out = [];
  const vistos = new Set();
  ops.forEach((o, k) => {
    if (o.op === '=') return;
    if (o.linha.trim().startsWith('|')) {
      // posição da linha na versão de origem, para achar o cabeçalho da tabela dela
      const ls = o.op === '+' ? depois : antes;
      const pos = o.op === '+' ? o.j : ops.slice(0, k).filter((x) => x.op !== '+').length;
      const cab = cabDe(ls, pos);
      if (cab !== o.linha && !vistos.has(cab)) { vistos.add(cab); out.push(`  ${cab}`); }
    }
    if (o.linha.trim() || out.length) out.push(`${o.op} ${o.linha}`);
  });
  return out;
}

// ---- relatório ------------------------------------------------------------------
const head = git('rev-parse', '--short', 'HEAD').stdout.trim();
const sujo = git('status', '--porcelain', '--', ...alvos.map((a) => a.path)).stdout.trim();
console.log(`# Delta dos N3 — \`${BASE}\` (${BASE_SHA.slice(0, 7)}) → ${head}${sujo ? ' + árvore de trabalho' : ''}`);
if (AIMM) console.log(`\nAIMM: \`${AIMM}\``);

let alterados = 0, novos = 0;
for (const { path, operacao } of alvos) {
  const depoisMd = existsSync(join(ROOT, path)) ? readFileSync(join(ROOT, path), 'utf8') : null;
  const antesMd = naBase(path);
  const fonte = depoisMd || antesMd || '';
  const id = (fonte.match(/^id:\s*(\S+)/m) || [])[1] || '';
  const nome = (fonte.match(/^# (.+)$/m) || [])[1] || '';
  console.log(`\n## \`${path}\`${id ? ` — ${id}` : ''}${nome ? ` — ${nome}` : ''}\n`);

  if (operacao === 'deprecar') { console.log('Deprecada na AIMM — sem design de alteração.'); continue; }
  if (!depoisMd) { console.log('✗ Não existe na árvore de trabalho.'); continue; }
  if (operacao === 'criar' || antesMd === null) {
    novos++;
    console.log(`Funcionalidade **nova** (${antesMd === null ? 'não existe na base' : 'linha `criar` na AIMM'}) → SDD completo, sem delta.`);
    continue;
  }

  const A = secoes(antesMd), D = secoes(depoisMd);
  const nomes = [...new Set([...A.keys(), ...D.keys()])];
  const iguais = [], mudou = [];
  for (const s of nomes) {
    const a = A.get(s) || [], d = D.get(s) || [];
    if (a.join('\n') === d.join('\n')) iguais.push(s);
    else mudou.push({ s, estado: !a.length ? 'incluída' : !d.length ? 'removida' : 'alterada', linhas: blocoDiff(a, d) });
  }
  if (!mudou.length) { console.log('Nenhuma seção mudou em relação à base (fora o Changelog e a esteira).'); continue; }
  alterados++;
  console.log(`Modo **alteração** — ${mudou.length} seção(ões) mudaram.\n`);
  console.log(`Sem alteração: ${iguais.join(' · ') || '—'}`);
  for (const { s, estado, linhas } of mudou) {
    console.log(`\n### ${s} (${estado})\n\n\`\`\`diff\n${linhas.join('\n')}\n\`\`\``);
  }
}
console.log(`\n---\n${alterados} N3 com delta · ${novos} nova(s) (SDD completo) · ${alvos.length} no total.`);
