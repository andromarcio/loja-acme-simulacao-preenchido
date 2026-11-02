#!/usr/bin/env node
// reverte-ticket.mjs — tira da branch da sprint o ticket que não foi entregue.
//
// Por quê (decisão do PO, 2026-10-05): a `main` só recebe o que foi entregue. Na cadência
// `sprint`, a branch `sprint/<id>` junta as histórias planejadas; no fechamento, a que
// ficou para a próxima sprint sai dela antes do merge. Como todo commit de spec cita uma
// chave só (valida-commits-ticket), basta reverter os commits que citam a chave do ticket
// — a spec dele, a AIMM dele, as linhas dele no INDEX e nos dicionários —, e o resto da
// sprint fica intacto.
//
// Simulação por padrão: lista os commits do ticket e avisa os de OUTROS tickets que
// mexeram depois nos mesmos arquivos (o revert pode conflitar ali). Com --write, reverte
// do mais novo ao mais antigo — o assunto do revert carrega o do original, e com ele a
// chave. Conflito → desfaz o revert em andamento e para, sem deixar a branch pela metade.
//
// Depois do revert: regenere os artefatos (`node scripts/atualiza-pages.mjs`), tire o
// ticket da AIMM da sprint e, na próxima sprint, reaplique com `git cherry-pick` dos
// commits originais — o script imprime os SHAs.
//
// Uso: node scripts/reverte-ticket.mjs <CHAVE> [--root <inst>] [--base origin/main] [--write]
// Exit: 0 ok · 1 recusado (árvore suja, commit misturado, conflito) · 2 erro de uso/git.

import { resolve } from 'node:path';
import {
  cadenciaDa, unidadeDaBranch, branchAtual, commitsDaBranch, chavesDoAssunto, chavesDasAims, git, SPEC_RE,
} from './lib/instancia.mjs';

const args = process.argv.slice(2);
const opt = (n, d = null) => { const i = args.indexOf(n); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
const CHAVE = (args.find((a, k) => !a.startsWith('--') && !['--root', '--base'].includes(args[k - 1])) || '').toUpperCase();
const ROOT = resolve(opt('--root', '.'));
const BASE = opt('--base', 'origin/main');
const WRITE = args.includes('--write');
if (!CHAVE) {
  console.error('Uso: node scripts/reverte-ticket.mjs <CHAVE> [--root <inst>] [--base origin/main] [--write]');
  process.exit(2);
}

const recusa = (msg) => { console.log(`✗ ${msg}`); process.exit(1); };
if (cadenciaDa(ROOT) !== 'sprint') recusa('o reverte-ticket é da cadência `sprint` — o MASTER não a declara. Na cadência `história`, a história que não foi entregue simplesmente não é mesclada.');
const branch = branchAtual(ROOT);
const unidade = unidadeDaBranch(branch);
if (!unidade || unidade.tipo !== 'sprint') recusa(`\`${branch}\` não é a branch de uma sprint (sprint/<id>).`);
if (CHAVE === unidade.id.toUpperCase()) recusa(`\`${CHAVE}\` é a própria sprint — o reverte-ticket tira um ticket dela.`);

let commits;
try { commits = commitsDaBranch(ROOT, BASE); } catch (e) {
  console.error(`reverte-ticket: não consegui listar os commits contra \`${BASE}\` (${String(e.message).split('\n')[0]}).`);
  process.exit(2);
}
const conhecidas = chavesDasAims(ROOT);
const comChaves = commits.map((c) => ({ ...c, chaves: chavesDoAssunto(c.assunto, conhecidas) }));
const doTicket = comChaves.filter((c) => c.chaves.includes(CHAVE));
if (!doTicket.length) recusa(`nenhum commit em \`${branch}\` cita \`${CHAVE}\` — nada a reverter (a chave está certa?).`);
const misturados = doTicket.filter((c) => c.chaves.length > 1);
if (misturados.length) {
  recusa(`commit(s) que citam \`${CHAVE}\` junto com outra chave — o revert arrastaria o outro ticket:\n${misturados
    .map((c) => `    ${c.sha.slice(0, 8)} "${c.assunto}"`).join('\n')}\n  Separe-os antes (node scripts/valida-commits-ticket.mjs aponta todos).`);
}

// Depois do primeiro commit do ticket, quem mais mexeu nos mesmos arquivos?
const arquivos = new Set(doTicket.flatMap((c) => c.arquivos));
const primeiro = comChaves.indexOf(doTicket[0]);
const vizinhos = comChaves.slice(primeiro).filter((c) => !c.chaves.includes(CHAVE) && c.arquivos.some((f) => arquivos.has(f)));

console.log(`reverte-ticket ${CHAVE} em \`${branch}\` — ${doTicket.length} commit(s):`);
for (const c of doTicket) console.log(`  ${c.sha.slice(0, 8)} ${c.assunto}  (${c.arquivos.filter((f) => SPEC_RE.test(f)).length} arquivo(s) de spec)`);
if (vizinhos.length) {
  console.log(`\n⚠ ${vizinhos.length} commit(s) de outro ticket mexeram depois nos mesmos arquivos — o revert pode conflitar ali:`);
  for (const c of vizinhos) console.log(`  ${c.sha.slice(0, 8)} ${c.assunto}  → ${c.arquivos.filter((f) => arquivos.has(f)).join(', ')}`);
}
if (!WRITE) {
  console.log('\n(simulação — nada foi revertido; rode com --write)');
  process.exit(0);
}

if (git(ROOT, 'status', '--porcelain')) recusa('a árvore de trabalho tem mudança não commitada — commite ou guarde antes (o revert cria commits).');
const feitos = [];
for (const c of [...doTicket].reverse()) {
  try {
    git(ROOT, 'revert', '--no-edit', c.sha);
    feitos.push(c);
  } catch {
    try { git(ROOT, 'revert', '--abort'); } catch { /* nada em andamento */ }
    if (feitos.length) git(ROOT, 'reset', '--hard', `HEAD~${feitos.length}`);
    recusa(`conflito ao reverter ${c.sha.slice(0, 8)} "${c.assunto}" — nada foi revertido (a branch voltou ao que era). Resolva à mão: git revert ${c.sha}, ou reverta antes o commit vizinho listado acima.`);
  }
}
console.log(`\n✓ ${feitos.length} commit(s) de ${CHAVE} revertido(s) — a branch não tem mais a spec do ticket.`);
console.log(`Próximos passos:
  1. node scripts/atualiza-pages.mjs  (espelho da esteira, diagrama ER, árvore do site) — commit marcado [gerado]
  2. tire ${CHAVE} da AIMM da sprint (\`analise-impacto/AIMM-${unidade.id}.md\`) — commit com a chave ${unidade.id}
  3. na próxima sprint, reaplique na branch dela: git cherry-pick ${doTicket.map((c) => c.sha.slice(0, 12)).join(' ')}`);
