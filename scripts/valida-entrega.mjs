#!/usr/bin/env node
// valida-entrega.mjs — o portão do merge da unidade de entrega na `main`.
//
// Por quê (decisões do PO, 2026-10-04/05): a `main` só recebe o que foi ENTREGUE — é o
// retrato do sistema em produção (no perfil `requisitos`, das specs entregues). O
// trabalho em andamento vive na branch da unidade de entrega (lib/instancia.mjs):
// `historia/<CHAVE>` ou `sprint/<id>`. O merge dela é a entrega, e é aqui que se confere
// que a branch só leva o que foi entregue, e inteiro:
//
//   1. a AIMM da unidade (`AIMM-<CHAVE>.md` na história, `AIMM-<id>.md` na sprint) existe,
//      está `concluído` e passa no validate-impact — na sprint, conferida com as AIMMs dos
//      tickets (S1–S4); na história, com a reconciliação contra a base (--git-base);
//   2. toda AIMM de ticket que a branch trouxe está `concluído` e válida — o validate-impact,
//      com `--entrega`, exige cada funcionalidade dela no ESTADO FINAL da esteira (`implementado`; `especificado`
//      no perfil `requisitos`) ou deprecada. AIMM aberta é ticket não entregue: sai da
//      branch pelo `reverte-ticket.mjs` antes do merge;
//   3. (sprint) todo arquivo de spec que a branch altera foi declarado por um ticket
//      entregue (`## Artefatos impactados`), e todo artefato declarado foi alterado — o
//      reconcilia do validate-impact, feito sobre a UNIÃO dos tickets: ticket a ticket,
//      o arquivo de um seria desvio do outro. Ficam de fora as próprias AIMMs e os
//      artefatos regenerados por script.
//
// Fora de uma branch de unidade de entrega, ou sem a linha **Cadência** no MASTER: sai 0
// dizendo por quê. Uso típico: no CI do PR da branch para a main (spec-guard, job entrega).
//
// Uso: node scripts/valida-entrega.mjs [--root <inst>] [--base origin/main] [--branch <nome>]
// Exit: 0 pode mesclar · 1 não pode · 2 erro de uso/git.

import { existsSync, readFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { cadenciaDa, unidadeDaBranch, branchAtual, git, SPEC_RE, GERADO_RE } from './lib/instancia.mjs';
import { frontMatterCampos } from './lib/trace-index.mjs';
import { impactPath } from './lib/impact-files.mjs';

const args = process.argv.slice(2);
const opt = (n, d = null) => { const i = args.indexOf(n); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
const ROOT = resolve(opt('--root', '.'));
const BASE = opt('--base', 'origin/main');
const SCRIPTS = dirname(fileURLToPath(import.meta.url));
const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

const cadencia = cadenciaDa(ROOT);
if (!cadencia) { console.log('valida-entrega: o MASTER não declara a **Cadência** — nenhuma regra de entrega vale nesta instância.'); process.exit(0); }
const branch = opt('--branch') || branchAtual(ROOT);
const unidade = unidadeDaBranch(branch);
if (!unidade) { console.log(`valida-entrega: \`${branch}\` não é branch de unidade de entrega — nada a conferir.`); process.exit(0); }

let alterados;
try {
  const mb = git(ROOT, 'merge-base', BASE, 'HEAD');
  alterados = git(ROOT, 'diff', '--name-only', '--diff-filter=d', `${mb}...HEAD`).split('\n').filter(Boolean);
} catch (e) {
  console.error(`valida-entrega: não consegui comparar com \`${BASE}\` (${String(e.message).split('\n')[0]}).`);
  process.exit(2);
}

const erros = [];
const valida = (rel, extra = []) => {
  const r = spawnSync('node', [join(SCRIPTS, 'validate-impact.mjs'), join(ROOT, rel), '--root', ROOT, '--entrega', ...extra], { encoding: 'utf8' });
  return { ok: r.status === 0, out: `${r.stdout || ''}${r.stderr || ''}` };
};
const fmDe = (rel) => frontMatterCampos(readFileSync(join(ROOT, rel), 'utf8').split(/\r?\n/));
const linhasDeErro = (out) => out.split('\n').filter((l) => /✗/.test(l)).map((l) => l.trim());

// 1. A AIMM da unidade.
const aimDaUnidade = impactPath(ROOT, unidade.id);
if (!existsSync(join(ROOT, aimDaUnidade))) {
  erros.push(`falta \`${aimDaUnidade}\` — a ${unidade.tipo === 'sprint' ? 'sprint' : 'história'} entra na main com a AIMM dela.`);
} else {
  const fm = fmDe(aimDaUnidade);
  if (norm(fm.estado) !== 'concluido') erros.push(`\`${aimDaUnidade}\` está em \`${fm.estado || '—'}\` — o merge é a entrega: a AIMM vai a \`concluído\` antes (skill analise-impacto).`);
  const v = valida(aimDaUnidade, unidade.tipo === 'historia' ? ['--git-base', BASE] : []);
  if (!v.ok) for (const l of linhasDeErro(v.out)) erros.push(`${aimDaUnidade}: ${l.replace(/^✗\s*/, '')}`);
}

// 2. As AIMMs de ticket que a branch trouxe (na história, só a dela, já conferida acima).
const aimsDeTicket = alterados.filter((f) => /^analise-impacto\/AIMM?-[^/]+\.md$/.test(f) && f !== aimDaUnidade)
  .filter((f) => norm(fmDe(f).tipo) === 'ticket');
if (unidade.tipo === 'historia') {
  for (const f of aimsDeTicket) erros.push(`\`${f}\` é de outro ticket — a branch \`${branch}\` leva só a história ${unidade.id}.`);
}
const entregues = [];
if (unidade.tipo === 'sprint') {
  for (const f of aimsDeTicket) {
    const fm = fmDe(f);
    if (norm(fm.estado) !== 'concluido') {
      erros.push(`\`${f}\` está em \`${fm.estado || '—'}\` — ticket não entregue não entra na main: tire-o da branch com \`node scripts/reverte-ticket.mjs ${fm.ticket || '<CHAVE>'} --write\`.`);
      continue;
    }
    const v = valida(f);
    if (!v.ok) for (const l of linhasDeErro(v.out)) erros.push(`${f}: ${l.replace(/^✗\s*/, '')}`);
    entregues.push(f);
  }

  // 3. A união dos changesets dos tickets entregues × o que a branch altera.
  const declarados = new Set();
  for (const f of entregues) {
    const ls = readFileSync(join(ROOT, f), 'utf8').split(/\r?\n/);
    const i = ls.findIndex((l) => l.trim() === '## Artefatos impactados');
    let iStatus = -1; // coluna Status (9.2.0): artefato Não se aplica não é declarado
    for (let k = i + 1; i >= 0 && k < ls.length && !/^##\s/.test(ls[k]); k++) {
      const celulas = ls[k].trim().replace(/^\||\|$/g, '').split('|').map((c) => norm(c));
      if (/^\|\s*artefato\s*\|/i.test(ls[k].trim())) { iStatus = celulas.indexOf('status'); continue; }
      if (iStatus >= 0 && /^nao se aplica$/.test(celulas[iStatus] || '')) continue;
      const cel = (ls[k].trim().match(/^\|\s*`?([^`|]+?)`?\s*\|/) || [])[1];
      if (cel && SPEC_RE.test(cel) && !/[()<>[\]]| de /.test(cel)) declarados.add(cel.trim());
    }
  }
  const tocados = alterados.filter((f) => SPEC_RE.test(f) && !GERADO_RE.test(f) && !f.startsWith('analise-impacto/'));
  for (const f of tocados.filter((t) => !declarados.has(t))) {
    erros.push(`\`${f}\` foi alterado na branch, mas nenhum ticket entregue o declara — é de um ticket que ficou (reverte-ticket) ou falta a linha no changeset de quem o alterou.`);
  }
  for (const d of [...declarados].filter((x) => !alterados.includes(x))) {
    erros.push(`\`${d}\` foi declarado por um ticket entregue, mas a branch não o altera — escopo não cumprido.`);
  }
}

if (erros.length) {
  console.log(`✗ \`${branch}\` ainda não pode entrar na main — ${erros.length} pendência(s):`);
  for (const e of erros) console.log(`  - ${e}`);
  console.log('\nA main só recebe o que foi entregue (MASTER → ## Cadência de entrega).');
  process.exit(1);
}
console.log(`✓ \`${branch}\` pode entrar na main: ${unidade.tipo === 'sprint' ? `AIMM da sprint e ${entregues.length} ticket(s) entregue(s) concluídos, com a branch alterando só o que eles declaram` : `AIMM ${unidade.id} concluída e reconciliada`}.`);
