#!/usr/bin/env node
// migra-regras-rn.mjs — dá o ID `RN-NN` às regras de negócio de um N3 anterior à 6.3.0.
//
// Mecânico: cada item de primeiro nível de `## Regras de negócio` vira
// `- **RN-NN** — <texto>`, na ordem em que está (a regra 1 vira RN-01). Sub-itens e
// texto não mudam. O Changelog ganha uma linha nova no topo.
//
// O que ele NÃO faz: marcar os cenários com `@RN-NN`. Dizer qual cenário verifica qual
// regra é análise — é justamente a dedução que o ID existe para tirar do caminho, e um
// script que a "adivinhasse" a esconderia de novo. Por isso o script imprime, por N3, as
// regras e os cenários lado a lado: é a lista de trabalho de quem vai marcar. Até a
// marcação, o valida-regras-cenarios reprova o N3 migrado (regra sem cenário) — migre
// funcionalidade a funcionalidade, junto com a marcação, e não a instância de uma vez.
//
// Uso:  node scripts/migra-regras-rn.mjs <arquivo f-*.md | pasta> …   # modo seco: mostra
//       node scripts/migra-regras-rn.mjs <…> --aplicar [--autor <nome>]  # grava

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { regrasDoN3, cenariosDoN3 } from './lib/regras.mjs';

const ROOT = process.cwd();
const rel = (p) => p.replace(`${ROOT}/`, '').replace(/\\/g, '/');
const args = process.argv.slice(2);
const APLICAR = args.includes('--aplicar');
const iAutor = args.indexOf('--autor');
const AUTOR = iAutor >= 0 ? args[iAutor + 1] : 'migra-regras-rn';
const alvos = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--autor');
if (!alvos.length) { console.error('uso: node scripts/migra-regras-rn.mjs <arquivo f-*.md | pasta> … [--aplicar] [--autor <nome>]'); process.exit(2); }

const n3s = [];
const anda = (p) => {
  if (statSync(p).isDirectory()) { for (const n of readdirSync(p)) if (!n.startsWith('.')) anda(join(p, n)); }
  else if (/^f-.+\.md$/.test(p.split(/[\\/]/).pop())) n3s.push(p);
};
for (const a of alvos) anda(a);

const hoje = new Date().toISOString().slice(0, 10);
let migrados = 0;
for (const arq of n3s.sort()) {
  const texto = readFileSync(arq, 'utf8');
  const lines = texto.split('\n');
  const regras = regrasDoN3(lines);
  if (!regras.length || regras.some((r) => r.id)) continue;
  regras.forEach((r, k) => {
    const id = `RN-${String(k + 1).padStart(2, '0')}`;
    r.novoId = id;
    lines[r.linha - 1] = lines[r.linha - 1].replace(/^(?:\d+\.|[-*])\s+/, `- **${id}** — `);
  });
  const iCl = lines.findIndex((l) => l.trim() === '## Changelog');
  if (iCl >= 0) {
    const iSep = lines.findIndex((l, i) => i > iCl && /^\|[\s:|-]+\|$/.test(l.trim()));
    if (iSep >= 0) {
      const cols = lines[iSep].trim().replace(/^\||\|$/g, '').split('|').length;
      const celulas = [hoje, AUTOR, 'Regras com ID', `As ${regras.length} regras de negócio ganham ID estável (RN-01…RN-${String(regras.length).padStart(2, '0')}, na ordem em que estavam), para o cenário, o código e o teste as citarem. Sem mudança de conteúdo.`];
      while (celulas.length < cols) celulas.push('');
      lines.splice(iSep + 1, 0, `| ${celulas.slice(0, cols).join(' | ')} |`);
    }
  }
  migrados++;
  console.log(`${APLICAR ? '✓' : '·'} ${rel(arq)}`);
  for (const r of regras) console.log(`    ${r.novoId} — ${r.texto.slice(0, 90)}`);
  const cen = cenariosDoN3(lines);
  console.log(`    cenários a marcar com @RN-NN (${cen.length}):`);
  for (const c of cen) console.log(`      linha ${c.linha}: ${c.titulo.slice(0, 80)}`);
  if (APLICAR) writeFileSync(arq, lines.join('\n'));
}
console.log(`\n${migrados} N3 ${APLICAR ? 'migrado(s)' : 'a migrar (modo seco — --aplicar grava)'}. Próximo passo, por N3: marcar cada cenário com a tag @RN-NN da regra que ele verifica e rodar node scripts/valida-regras-cenarios.mjs <N3>.`);
