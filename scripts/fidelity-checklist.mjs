#!/usr/bin/env node
// fidelity-checklist.mjs — anda o ESQUELETO da checklist de fidelidade protótipo↔implementação.
// Universal: a checklist é texto (qualquer LLM/humano preenche); o script só lista os estados
// (arquivos HTML) do protótipo e a fidelidade declarada no N3, para não faltar nenhum.
//
// Uso:  node scripts/fidelity-checklist.mjs <pasta-do-protótipo> [caminho-do-N3.md]
//
// Saída: uma tabela markdown (protótipo → implementado?) em stdout. Sai 0.

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';

const [dir, n3] = process.argv.slice(2);
if (!dir) { console.error('Uso: node scripts/fidelity-checklist.mjs <pasta-do-protótipo> [N3.md]'); process.exit(2); }

const htmls = [];
(function walk(d) {
  let e; try { e = readdirSync(d); } catch { return; }
  for (const n of e) { const p = join(d, n); let s; try { s = statSync(p); } catch { continue; }
    if (s.isDirectory()) walk(p); else if (n.endsWith('.html')) htmls.push(p); }
})(dir);

let fid = '—', feat = '—';
if (n3 && existsSync(n3)) {
  const raw = readFileSync(n3, 'utf8');
  const fl = raw.split(/\r?\n/).find((l) => /fidelidade ao prot[óo]tipo/i.test(l));
  if (fl) fid = (fl.match(/obrigat[óo]ria|refer[êe]ncia|n\/a/i) || ['—'])[0];
  const idl = raw.split(/\r?\n/).find((l) => /> \*\*Nível 3\*\*/.test(l));
  if (idl) feat = (idl.match(/`([A-Z]{3}-[A-Z]{3}-\d{2})`/) || [null, '—'])[1];
}

const out = [];
out.push(`# Checklist de fidelidade — ${feat}`);
out.push(`> Protótipo: \`${dir}\` · N3: \`${feat}\` · **Fidelidade: ${fid}**`);
out.push('> Marque cada estado: ✅ reproduzido fielmente · ⚠️ desvio (descrever + aprovar) · ❌ não implementado.');
out.push('');
out.push('| Estado / tela (protótipo) | Implementado? | Observação / desvio |');
out.push('|---|---|---|');
if (htmls.length) for (const h of htmls) out.push(`| ${basename(h)} |  |  |`);
else out.push('| _(nenhum .html encontrado na pasta)_ |  |  |');
out.push('');
out.push(`> Cobertura exigida quando fidelidade = **obrigatória**: todos os estados ✅ (ou ⚠️ com desvio aprovado). Nenhum ❌.`);
console.log(out.join('\n'));
