#!/usr/bin/env node
// valida-regras-cenarios.mjs — toda regra de negócio do N3 tem ID (`RN-NN`) e ao menos
// um cenário que a verifica (tag Gherkin `@RN-NN`).
//
// Por quê (pedido do PO, 2026-10-10): o objetivo do método é um artefato que o agente de
// IA leia sem deduzir. A regra numerada pela posição não tinha como ser citada pelo
// cenário, pelo código nem pelo teste, e "qual cenário cobre esta regra?" ficava por
// conta de quem lia. Medido no siesa-doc: nenhuma das regras dos 77 N3 tinha ID. Com o ID
// e a tag, a cadeia regra → cenário → teste é dado, e a regra sem cenário aparece aqui.
// Formato e leitura: scripts/lib/regras.mjs.
//
// Reprova (exit 1):
//   • regra sem ID num N3 que já usa `RN-NN` — o ID é de toda regra, não de algumas;
//   • ID repetido;
//   • tag `@RN-NN` em cenário sem regra com esse ID (regra removida ou ID errado);
//   • regra sem nenhum cenário com a tag dela.
// Avisa (não reprova): N3 cujas regras ainda não têm ID nenhum — anterior à 6.3.0; e
//   regra verificada só por cenário de `## Cenários técnicos adicionais` — o PO aprova o
//   comportamento pelos `## Cenários`, e a exportação para o spec-kit (Acceptance
//   Scenarios) a perde (achado no siesa-doc, 2026-10-11: 8 regras do domínio Sistemas).
// A migração dá o ID (`node scripts/migra-regras-rn.mjs <N3>`); a tag no cenário é
// análise, não mecânica, e vem junto, funcionalidade a funcionalidade.
//
// Uso:  node scripts/valida-regras-cenarios.mjs [arquivo f-*.md | pasta] …
//       (sem argumentos: todo `modules/**/f-*.md`)

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { regrasDoN3, cenariosDoN3 } from './lib/regras.mjs';

const ROOT = process.cwd();
const rel = (p) => p.replace(`${ROOT}/`, '').replace(/\\/g, '/');

function n3s(alvos) {
  const out = [];
  const anda = (p) => {
    if (statSync(p).isDirectory()) { for (const n of readdirSync(p)) if (!n.startsWith('.')) anda(join(p, n)); }
    else if (/^f-.+\.md$/.test(p.split(/[\\/]/).pop())) out.push(p);
  };
  for (const a of alvos) { try { anda(a); } catch { /* alvo ausente */ } }
  return out.sort();
}

function confere(texto) {
  const lines = texto.split(/\r?\n/);
  const regras = regrasDoN3(lines);
  const cenarios = cenariosDoN3(lines);
  const erros = [], avisos = [];
  if (!regras.length) return { erros, avisos };
  const comId = regras.filter((r) => r.id);
  if (!comId.length) {
    avisos.push(`${regras.length} regra(s) sem ID \`RN-NN\` — o cenário não tem como dizer qual verifica. Migrar: node scripts/migra-regras-rn.mjs <N3>, e marcar cada cenário com a tag @RN-NN da regra que ele verifica.`);
    return { erros, avisos };
  }
  for (const r of regras.filter((x) => !x.id)) erros.push(`linha ${r.linha}: regra sem ID — "${r.texto.slice(0, 70)}". Toda regra do N3 leva \`**RN-NN** —\`, com o próximo número livre.`);
  const ids = new Set();
  for (const r of comId) {
    if (ids.has(r.id)) erros.push(`linha ${r.linha}: ${r.id} repetido — o ID é único na funcionalidade e nunca reaproveitado.`);
    ids.add(r.id);
  }
  const cobertas = new Set(), deNegocio = new Set();
  for (const c of cenarios) {
    for (const t of c.tags) {
      if (ids.has(t)) { cobertas.add(t); if (!/t[eé]cnic/i.test(c.secao)) deNegocio.add(t); }
      else erros.push(`linha ${c.linha}: o cenário "${c.titulo.slice(0, 60)}" cita @${t}, e não há regra ${t} em \`## Regras de negócio\`.`);
    }
  }
  for (const r of comId) {
    if (!cobertas.has(r.id)) erros.push(`linha ${r.linha}: ${r.id} sem cenário — marque com @${r.id} o cenário que a verifica (ou escreva um). "${r.texto.slice(0, 60)}"`);
    else if (!deNegocio.has(r.id)) avisos.push(`linha ${r.linha}: ${r.id} só tem cenário técnico — o PO não a vê em \`## Cenários\`. "${r.texto.slice(0, 60)}"`);
  }
  return { erros, avisos };
}

const args = process.argv.slice(2);
const arquivos = n3s(args.length ? args : [join(ROOT, 'modules')]);
let total = 0, comErro = 0, legado = 0, soTecnico = 0;
for (const a of arquivos) {
  const { erros, avisos } = confere(readFileSync(a, 'utf8'));
  const tec = avisos.filter((x) => /só tem cenário técnico/.test(x));
  soTecnico += tec.length;
  if (avisos.length && !erros.length) { if (tec.length < avisos.length) legado++; if (arquivos.length <= 5 || tec.length) console.log(`⚠ ${rel(a)}\n    ${avisos.join('\n    ')}`); }
  if (!erros.length) continue;
  comErro++; total += erros.length;
  console.log(`✗ ${rel(a)}`);
  for (const e of erros) console.log(`    ${e}`);
}
const nota = (legado ? ` ${legado} N3 ainda sem ID nas regras (aviso) — node scripts/migra-regras-rn.mjs lista e migra.` : '')
  + (soTecnico ? ` ${soTecnico} regra(s) só com cenário técnico (aviso) — escreva o cenário de negócio que o PO aprova.` : '');
if (total) {
  console.log(`\n${total} problema(s) em ${comErro} N3. Cada regra de \`## Regras de negócio\` tem ID \`RN-NN\`, e ao menos um cenário a verifica com a tag @RN-NN.${nota}`);
  process.exit(1);
}
console.log(`✓ ${arquivos.length} N3 conferido(s): toda regra com ID tem cenário que a verifica.${nota}`);
