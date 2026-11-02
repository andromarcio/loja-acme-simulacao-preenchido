#!/usr/bin/env node
// valida-commits-ticket.mjs — na branch de uma unidade de entrega, cada commit que toca a
// spec é de UM ticket só.
//
// Por quê (decisão do PO, 2026-10-05): a `main` só recebe o que foi entregue. Na cadência
// `sprint`, a branch `sprint/<id>` junta as histórias planejadas, e a que não for entregue
// sai dela antes do merge — pelo `reverte-ticket.mjs`, que reverte os commits que citam a
// chave dela. Isso só funciona se nenhum commit misturar duas histórias: o revert de uma
// arrastaria a outra. Esta checagem é a garantia, commit a commit, enquanto a sprint anda
// — no fechamento já seria tarde para separar.
//
// A regra, no ASSUNTO do commit (a primeira linha — o corpo pode citar o que quiser):
//   cadência `sprint`   → exatamente uma chave: a de um ticket, ou o id da sprint nos
//                         commits da AIMM da sprint (`AIMM-<id>.md`);
//   cadência `história` → exatamente a chave da própria branch (`historia/<CHAVE>`).
// Vale para commit que toca `modules/`, `global/`, `qa/`, `prototypes/` ou
// `analise-impacto/`. Exceção: commit marcado `[gerado]` no assunto que só toca artefato
// regenerado por script (espelho da esteira no INDEX, diagrama ER, índice de uso dos
// dicionários) — esse não é de ticket nenhum, e o reverte-ticket manda regenerá-lo.
//
// Chave reconhecida: os formatos de ticket conhecidos (STRY…, ISSUE-…, PDTIC…, EXP-…) e a
// de toda AIMM da instância (`analise-impacto/AIMM-<CHAVE>.md`) — o que cobre ferramenta
// nova e o id da sprint.
//
// No PR de checkpoint — de uma branch de trabalho (`checkpoint/<CHAVE>-<etapa>`, por exemplo) para a
// `sprint/<id>` ou a `historia/<CHAVE>` —, a unidade é a da BASE: os commits que entram
// nela seguem a regra dela. Assim o commit sem chave é recusado no próprio PR de
// checkpoint, e não só no PR da sprint para a `main`, depois do merge.
//
// Fora de uma branch de unidade de entrega (`main`, outra qualquer), com a base também
// fora, ou sem a linha **Cadência** no MASTER, não há o que conferir: sai 0 dizendo por quê.
//
// Uso: node scripts/valida-commits-ticket.mjs [--root <inst>] [--base origin/main] [--branch <nome>]
// Exit: 0 ok · 1 commit fora da regra · 2 erro de uso/git.

import { resolve } from 'node:path';
import {
  cadenciaDa, unidadeDaBranch, branchAtual, commitsDaBranch, chavesDoAssunto, chavesDasAims,
  SPEC_RE, GERADO_RE,
} from './lib/instancia.mjs';

const args = process.argv.slice(2);
const opt = (n, d = null) => { const i = args.indexOf(n); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
const ROOT = resolve(opt('--root', '.'));
const BASE = opt('--base', 'origin/main');

const cadencia = cadenciaDa(ROOT);
if (!cadencia) {
  console.log('valida-commits-ticket: o MASTER não declara a **Cadência** — nenhuma regra de branch vale nesta instância.');
  process.exit(0);
}
const branch = opt('--branch') || branchAtual(ROOT);
const unidade = unidadeDaBranch(branch) || unidadeDaBranch(BASE);
if (!unidade) {
  console.log(`valida-commits-ticket: nem \`${branch}\` nem a base \`${BASE}\` é branch de unidade de entrega (sprint/<id> ou historia/<CHAVE>) — nada a conferir.`);
  process.exit(0);
}
if ((unidade.tipo === 'sprint') !== (cadencia === 'sprint')) {
  console.log(`✗ \`${branch}\` é branch de ${unidade.tipo === 'sprint' ? 'sprint' : 'história'}, mas a cadência da instância é \`${cadencia === 'sprint' ? 'sprint' : 'história'}\` — use ${cadencia === 'sprint' ? '`sprint/<id>`' : '`historia/<CHAVE>`'}.`);
  process.exit(1);
}

let commits;
try { commits = commitsDaBranch(ROOT, BASE); } catch (e) {
  console.error(`valida-commits-ticket: não consegui listar os commits contra \`${BASE}\` (${String(e.message).split('\n')[0]}).`);
  process.exit(2);
}
const conhecidas = chavesDasAims(ROOT);
const erros = [];
let conferidos = 0;
for (const c of commits) {
  const spec = c.arquivos.filter((f) => SPEC_RE.test(f));
  if (!spec.length) continue;
  conferidos++;
  const curto = `${c.sha.slice(0, 8)} "${c.assunto}"`;
  if (/\[gerado\]/i.test(c.assunto)) {
    const fora = spec.filter((f) => !GERADO_RE.test(f));
    if (fora.length) erros.push(`${curto}: marcado [gerado], mas toca spec que não é regenerada por script — ${fora.slice(0, 3).join(', ')}${fora.length > 3 ? '…' : ''}. Separe: o que é do ticket vai num commit com a chave dele.`);
    continue;
  }
  const chaves = chavesDoAssunto(c.assunto, conhecidas);
  if (unidade.tipo === 'historia') {
    const outras = chaves.filter((k) => k !== unidade.id.toUpperCase());
    if (!chaves.includes(unidade.id.toUpperCase())) erros.push(`${curto}: toca a spec sem citar \`${unidade.id}\`, a chave desta branch.`);
    else if (outras.length) erros.push(`${curto}: cita também ${outras.map((k) => `\`${k}\``).join(', ')} — numa branch de história, o commit é só dela.`);
    continue;
  }
  if (!chaves.length) erros.push(`${curto}: toca a spec sem citar a chave do ticket (ou \`${unidade.id}\`, nos commits da AIMM da sprint).`);
  else if (chaves.length > 1) erros.push(`${curto}: cita ${chaves.map((k) => `\`${k}\``).join(', ')} — um commit, um ticket: separe, senão o revert de um arrasta o outro.`);
}

if (erros.length) {
  console.log(`✗ ${erros.length} commit(s) fora da regra em \`${branch}\`:`);
  for (const e of erros) console.log(`  - ${e}`);
  console.log('\nCada commit que toca a spec cita UMA chave no assunto. Para corrigir antes do push: git rebase -i (edite a mensagem ou divida o commit).');
  process.exit(1);
}
console.log(`✓ ${conferidos} commit(s) de spec em \`${branch}\`, cada um de um ticket só (cadência ${cadencia}).`);
