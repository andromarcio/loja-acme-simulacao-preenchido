#!/usr/bin/env node
// migra-ordem-n3.mjs — leva o N3 anterior à 6.4.16 para a ordem nova das seções.
//
// Mecânico (decisão do PO, 2026-10-18): a `## Superfície` sai do seu `dev-only` e vai para
// logo antes de `## Comportamento de tela` / `## Execução e operação`; a `## Origem` vai
// para logo antes do `## Changelog`, depois das seções técnicas. O texto das seções não
// muda, e os carimbos `trace-verified` vão junto com a Origem. O N3 migrado ganha uma
// linha nova no Changelog (no fim da tabela, ou no topo, conforme a ordem que ela já
// segue) e o carimbo `docqui:` da primeira linha passa à versão do VERSION e à data de hoje.
//
// O N3 que já está na ordem nova não muda. Uma seção do molde fora de ordem por outro
// motivo não é mexida: o script a aponta, e a correção é à mão.
//
// Uso:  node scripts/migra-ordem-n3.mjs <arquivo f-*.md | pasta> …            # modo seco
//       node scripts/migra-ordem-n3.mjs <…> --aplicar [--autor <nome>]          # grava

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { reordenaN3, ordemN3 } from './lib/ordem-n3.mjs';

const ROOT = process.cwd();
const rel = (p) => resolve(p).replace(`${ROOT}/`, '').replace(/\\/g, '/');
const args = process.argv.slice(2);
const APLICAR = args.includes('--aplicar');
const iAutor = args.indexOf('--autor');
const AUTOR = iAutor >= 0 ? args[iAutor + 1] : 'migra-ordem-n3';
const alvos = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--autor');
if (!alvos.length) { console.error('uso: node scripts/migra-ordem-n3.mjs <arquivo f-*.md | pasta> … [--aplicar] [--autor <nome>]'); process.exit(2); }

const n3s = [];
const anda = (p) => {
  if (statSync(p).isDirectory()) { for (const n of readdirSync(p)) if (!n.startsWith('.')) anda(join(p, n)); }
  else if (/^f-.+\.md$/.test(p.split(/[\\/]/).pop())) n3s.push(p);
};
for (const a of alvos) anda(a);

const arqVersao = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'VERSION');
const VERSAO = existsSync(arqVersao) ? readFileSync(arqVersao, 'utf8').trim() : null;
const hoje = new Date().toISOString().slice(0, 10);
function linhaDoChangelog(r) {
  const sup = r.destino['Superfície'];
  const ori = r.destino.Origem;
  const devOnly = r.motivos.includes('Superfície sai do dev-only');
  const partes = [];
  if (sup) partes.push(`a Superfície vai para antes da seção ${sup}${devOnly ? ', fora do dev-only' : ''}`);
  else if (devOnly) partes.push('a Superfície sai do dev-only');
  if (ori) partes.push(`a Origem vai para ${ori === 'o fim' ? 'o fim' : `antes da seção ${ori}`}`);
  const frase = partes.join(sup && devOnly ? ', e ' : ' e ');
  return `Seções reordenadas: ${frase}. Nenhuma regra, cenário ou campo muda.`;
}

// A linha nova do Changelog: no fim da tabela quando ela vai da data mais antiga para a
// mais nova, no topo quando vai da mais nova para a mais antiga.
function registraChangelog(lines, linha) {
  const iCl = lines.findIndex((l) => l.trim() === '## Changelog');
  if (iCl < 0) return false;
  const iSep = lines.findIndex((l, i) => i > iCl && /^\|[\s:|-]+\|$/.test(l.trim()));
  if (iSep < 0) return false;
  let fim = iSep + 1;
  while (fim < lines.length && lines[fim].trim().startsWith('|')) fim++;
  const datas = lines.slice(iSep + 1, fim).map((l) => (l.match(/\d{4}-\d{2}-\d{2}/) || [''])[0]).filter(Boolean);
  const crescente = datas.length < 2 || datas[0] <= datas[datas.length - 1];
  const cols = lines[iSep].trim().replace(/^\||\|$/g, '').split('|').length;
  const celulas = cols >= 4 ? [hoje, AUTOR, 'Ajuste', linha] : [hoje, linha];
  while (celulas.length < cols) celulas.push('');
  lines.splice(crescente ? fim : iSep + 1, 0, `| ${celulas.slice(0, cols).join(' | ')} |`);
  return true;
}

let migrados = 0;
let pendentes = 0;
for (const arq of n3s.sort()) {
  const texto = readFileSync(arq, 'utf8');
  const r = reordenaN3(texto);
  const ordem = ordemN3(r.texto.split('\n'));
  if (!r.mudou) {
    if (!ordem.emOrdem) { pendentes++; console.log(`⚠️ ${rel(arq)}: fora da ordem por outra seção, corrija à mão — esperado: ${ordem.esperada.join(' → ')}`); }
    continue;
  }
  const lines = r.texto.split('\n');
  const comLinha = registraChangelog(lines, linhaDoChangelog(r));
  if (VERSAO && /^<!-- docqui: [^|]+\|/.test(lines[0])) {
    lines[0] = lines[0].replace(/^<!-- docqui: [^|]+\|/, `<!-- docqui: ${VERSAO} |`).replace(/atualizado: \d{4}-\d{2}-\d{2}/, `atualizado: ${hoje}`);
  }
  migrados++;
  console.log(`${APLICAR ? '✓' : '·'} ${rel(arq)} — ${r.motivos.join('; ')}${comLinha ? '' : ' (sem tabela de Changelog: registre a mudança à mão)'}`);
  if (!ordem.emOrdem) { pendentes++; console.log(`    ⚠️ ainda fora da ordem por outra seção, corrija à mão — esperado: ${ordem.esperada.join(' → ')}`); }
  if (APLICAR) writeFileSync(arq, lines.join('\n'));
}
console.log(`\n${migrados} N3 ${APLICAR ? 'migrado(s)' : 'a migrar (modo seco — --aplicar grava)'}${pendentes ? `; ${pendentes} com seção fora de ordem a corrigir à mão` : ''}. Confira com node scripts/validate-doc.mjs.`);
process.exit(pendentes ? 1 : 0);
