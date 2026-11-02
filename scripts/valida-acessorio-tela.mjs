#!/usr/bin/env node
// valida-acessorio-tela.mjs — onde o PE mora: o acessório na funcionalidade dona da tela, e
// cada PE uma vez na aplicação.
//
// Combo, autocomplete, carrossel, consulta implícita, exportação e ação vizinha são PE
// DA TELA: contam-se junto com o PE principal da funcionalidade cuja `## Superfície` é *Tela
// própria*. Uma funcionalidade de *Ação em tela* (botão, formulário ou painel aberto sobre a
// tela de outra funcionalidade) não carrega acessório — a combo que o formulário dela usa é da
// tela, e vai para a funcionalidade dona da tela (SIZING.md → *Regra da lista consultada*,
// "registrada na funcionalidade dona da tela"). Caso que motivou a checagem (2026-09-23):
// `SDC-SOL-10`, ação sobre a vitrine de `SDC-VIT-01`, carregava as combos de UO e CR da
// vitrine — e a duplicidade dessas combos em `SDC-VIT-03` apontava para a funcionalidade errada.
//
// O que confere, em cada N3 (`modules/**/f-*.md`):
//   - o tipo da Superfície: o primeiro negrito de `## Superfície` ("Tela própria",
//     "Modal", "Ação em tela", "Job…");
//   - os PE acessórios da primeira tabela de `## Métricas de tamanho` — pela coluna
//     Papel quando ela existe; sem a coluna, pelo nome (lista consultada `(combo)`,
//     `(carrossel)`, `(botões)`…, `(implícita)`, exportação);
//   - acessório numa funcionalidade que NÃO é dona de tela (Ação em tela, Job, API) é
//     ERRO, com as candidatas a dona: as funcionalidades de Tela própria citadas na Superfície
//     (seguindo uma citação intermediária, ex.: SDC-SOL-10 → SDC-VIT-04 → SDC-VIT-01) ou
//     que declaram a mesma rota. O Modal é dona de tela como a Tela própria: superfície
//     oficial (decisão do PO, 2026-09-27; antes, 2026-09-23, sobre SDC-SOL-05) para o
//     modal com conteúdo próprio — detalhe de um registro, consulta ou formulário que não
//     é subformulário de outro —, e seus acessórios ficam nele. Caixa de diálogo não é
//     Modal: é parte da Ação em tela que a abre;
//   - a consulta implícita `(implícita)` fica SEMPRE com a funcionalidade Editar do Agrupamento Funcional
//     (`f-editar-*.md`), mesmo quando o Editar é Ação em tela — é a leitura que abre o
//     formulário de edição preenchido (decisão do PO, 2026-09-23); fora do Editar é ERRO,
//     com o Editar da pasta como candidato; sem Editar na pasta, vale a regra da tela.
//
// Cada PE conta UMA vez na aplicação (decisão do PO, 2026-09-27; SIZING.md → *PE
// reutilizado*): a mesma lista em duas telas é um PE só. A funcionalidade que usa um PE contado
// noutra grava a linha com `↪ [ID](caminho do N3)` na coluna Tipo, e esta checagem confere:
//   - o mesmo PE contado em duas funcionalidades é ERRO — o nome decide, sem o componente entre
//     parênteses (combo e autocomplete da mesma lista são o mesmo PE); mesmo rótulo com
//     filtro diferente passa quando um dos dois declara `> Distinto de <ID> · <PE>: …`;
//   - a referência `↪` precisa achar o PE contado: funcionalidade que existe, com a linha do
//     mesmo nome contada (não outra referência, nem linha sem PF), e não `deprecado`;
//   - o ID da referência é link para o N3 onde o PE conta (decisão do PO, 2026-09-27):
//     sem link, ou com link para outro arquivo, é ERRO — a mensagem traz o link certo,
//     relativo à funcionalidade que reutiliza;
//   - a linha `↪` não é contada aqui, então não entra na regra da dona da tela.
// `--pe "<nome>"` responde se um PE já é contado, onde, e quem o reutiliza — é a consulta
// do agente de contagem, fora do Docqui, antes de contar.
//
// Uso: node scripts/valida-acessorio-tela.mjs [raiz-da-instância] [--pe "<nome do PE>"]
// Saída: 0 sem erro; 1 com erro(s); 2 em erro de uso.

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, relative, dirname, basename, sep } from 'node:path';
import { pesDoN3, distintosDoN3, chavePE, contado } from './lib/pe.mjs';
import { frontMatterEstado } from './lib/front-matter.mjs';

const args = process.argv.slice(2);
const iPe = args.indexOf('--pe');
const CONSULTA = iPe >= 0 ? args[iPe + 1] : null;
if (iPe >= 0 && !CONSULTA) {
  console.error('Uso: node scripts/valida-acessorio-tela.mjs [raiz] [--pe "<nome do PE>"]');
  process.exit(2);
}
const ROOT = resolve(args.find((a, k) => !a.startsWith('--') && args[k - 1] !== '--pe') || '.');
if (!existsSync(join(ROOT, 'modules'))) {
  console.error(`✗ Não parece uma instância (sem modules/): ${ROOT}`);
  process.exit(2);
}

const walk = (d, out = []) => {
  for (const n of readdirSync(d)) {
    if (n === '.git' || n === 'node_modules') continue;
    const p = join(d, n);
    statSync(p).isDirectory() ? walk(p, out) : out.push(p);
  }
  return out;
};

const idOf = (raw) => {
  const l = raw.split(/\r?\n/).find((x) => /N[íi]vel 3/.test(x));
  return (l && (l.match(/`([A-Z]{3}-[A-Z]{3}-\d{2})`/) || [])[1]) || null;
};

// Seção `## Título` até o próximo `## ` (os `### ` internos ficam dentro).
function secao(raw, titulo) {
  const ls = raw.split(/\r?\n/);
  const i = ls.findIndex((l) => new RegExp(`^##\\s+${titulo}\\s*$`).test(l));
  if (i < 0) return null;
  const out = [];
  for (let k = i + 1; k < ls.length && !/^##\s/.test(ls[k]); k++) out.push(ls[k]);
  return out.join('\n');
}

// Tabela markdown guiada pelo CABEÇALHO, nunca por posição.
const celulas = (l) => l.trim().replace(/^\||\|$/g, '').split('|').map((x) => x.trim());
const ehSeparador = (l) => /^\|[\s\-:|]+\|$/.test(l.trim());
function tabela(ls, ini, parar) {
  let cab = null; const out = [];
  for (let k = ini; k < ls.length && !parar(ls[k]); k++) {
    const l = ls[k].trim();
    if (!l.startsWith('|')) { if (cab && out.length) break; continue; }
    if (ehSeparador(l)) continue;
    if (!cab) { cab = celulas(l); continue; }
    out.push(celulas(l));
  }
  return { cab, linhas: out };
}

// Sem a coluna Papel, o nome decide: lista consultada, consulta implícita, exportação.
const PADRAO_ACESSORIO = /\((combo|autocomplete|carrossel|bot[õo]es|chips|lookup|dropdown|lista|impl[íi]cita)\)|^exportar\b|\((excel|pdf|csv)\)$/i;
const ehAcessorio = (pe) => (pe.papel !== null ? pe.papel === 'acessório' : PADRAO_ACESSORIO.test(pe.nome));

function superficie(raw) {
  const s = secao(raw, 'Superfície');
  if (s === null) return null;
  const neg = s.match(/\*\*([^*]+)\*\*/);
  const rotas = [...new Set((s.match(/`\/[^`\s]+`/g) || []).map((r) => r.slice(1, -1).replace(/\?.*$/, '')))];
  const cita = [...new Set(s.match(/\b[A-Z]{3}-[A-Z]{3}-\d{2}\b/g) || [])];
  return { tipo: neg ? neg[1].trim() : '', rotas, cita };
}

const DONA = /^tela pr[óo]pria|^modal/i; // o Modal é dona de tela como a Tela própria
const IMPLICITA = /\(impl[íi]cita\)/i;
const SEM_TELA = /^(a[çc][ãa]o em tela|job|api|cli|integra[çc][ãa]o|rotina|processo)/i;

// ---------------------------------------------------------------------------
const n3 = walk(join(ROOT, 'modules')).filter((p) => /(?:^|[\\/])f-[^\\/]+\.md$/.test(p));
const feats = new Map(); // id -> { sup, pes, arquivo } — os que têm Superfície (regra da tela)
const todos = new Map(); // id -> { pes, distintos, estado, arquivo } — todo N3 com ID (uma vez na aplicação)
let semSuperficie = 0;
for (const p of n3) {
  const raw = readFileSync(p, 'utf8');
  const id = idOf(raw);
  if (!id) continue;
  const pes = pesDoN3(raw);
  todos.set(id, { pes, distintos: distintosDoN3(raw), estado: frontMatterEstado(raw.split(/\r?\n/)), arquivo: relative(ROOT, p), abs: p });
  const sup = superficie(raw);
  if (!sup) { semSuperficie++; continue; }
  feats.set(id, { sup, pes, arquivo: relative(ROOT, p), dir: dirname(p), base: basename(p) });
}

// Onde cada PE é contado (chave → [{ id, nome }]) e quem o reutiliza (chave → [{ id, alvo, nome }]).
const contadoEm = new Map();
const reusos = new Map();
for (const [id, t] of todos) {
  for (const pe of t.pes) {
    const k = chavePE(pe.nome);
    if (contado(pe)) contadoEm.set(k, [...(contadoEm.get(k) || []), { id, nome: pe.nome, pf: pe.pf, tipo: pe.tipo }]);
    else if (pe.reuso) reusos.set(k, [...(reusos.get(k) || []), { id, alvo: pe.reuso, nome: pe.nome }]);
  }
}

// --pe: responde e sai — é consulta, não conferência.
if (CONSULTA) {
  const k = chavePE(CONSULTA);
  const onde = contadoEm.get(k) || [];
  const quem = reusos.get(k) || [];
  if (!onde.length) console.log(`"${CONSULTA}" não é contado em nenhuma funcionalidade — conte-o na funcionalidade dona da tela.`);
  for (const o of onde) console.log(`"${o.nome}" é contado em ${o.id} (${o.tipo}, ${o.pf} PF) · ${todos.get(o.id).arquivo}`);
  if (quem.length) console.log(`reutilizado por: ${quem.map((r) => `${r.id} (↪ ${r.alvo})`).join(' · ')}`);
  if (onde.length) console.log('Não conte de novo: na funcionalidade nova, a linha leva o nome do PE e, na coluna Tipo, `↪ [<ID>](<caminho do N3 acima, relativo à funcionalidade nova>)` (SIZING.md → PE reutilizado).');
  process.exit(0);
}

// Funcionalidade Editar de cada pasta (Agrupamento Funcional): dona natural da consulta implícita.
const editarPorPasta = new Map();
for (const [id, f] of feats) if (/^f-editar-/.test(f.base)) editarPorPasta.set(f.dir, [...(editarPorPasta.get(f.dir) || []), id]);

const donas = new Set([...feats].filter(([, f]) => DONA.test(f.sup.tipo)).map(([id]) => id));
const donasPorRota = new Map();
for (const id of donas) for (const r of feats.get(id).sup.rotas) donasPorRota.set(r, [...(donasPorRota.get(r) || []), id]);

// Candidatas a dona da tela: citadas na Superfície (seguindo uma citação intermediária)
// ou com a mesma rota. Devolve [{ id, motivo }].
function candidatas(id) {
  const f = feats.get(id);
  const out = new Map();
  const cite = (ids, motivo) => { for (const c of ids) if (donas.has(c) && c !== id && !out.has(c)) out.set(c, motivo); };
  cite(f.sup.cita, 'citada na Superfície');
  for (const c of f.sup.cita) if (feats.has(c) && !donas.has(c)) cite(feats.get(c).sup.cita, `citada via ${c}`);
  for (const r of f.sup.rotas) cite(donasPorRota.get(r) || [], `mesma rota ${r}`);
  return [...out].map(([cid, motivo]) => ({ id: cid, motivo }));
}

const erros = [];
const avisos = [];
let totalAcessorios = 0;
for (const [id, f] of feats) {
  const acess = f.pes.filter((pe) => !pe.reuso && ehAcessorio(pe)); // ↪ não é contada aqui
  totalAcessorios += acess.length;
  if (!acess.length) continue;
  const tipo = f.sup.tipo || '(sem negrito na Superfície)';
  const souEditar = /^f-editar-/.test(f.base);
  const editares = (editarPorPasta.get(f.dir) || []).filter((e) => e !== id);
  let cands = null;
  for (const pe of acess) {
    const rot = `${pe.nome}${pe.tipo ? ` [${pe.tipo}]` : ''}`;
    if (IMPLICITA.test(pe.nome)) {
      if (souEditar) continue;
      if (editares.length) {
        erros.push(`${id} · ${rot} — consulta implícita fora da funcionalidade Editar: é a leitura que abre o formulário de edição preenchido e fica sempre com o Editar → candidata: ${editares.join(' · ')} (Editar do mesmo Agrupamento Funcional) · ${f.arquivo}`);
        continue;
      }
      // sem Editar na pasta: vale a regra da tela, abaixo
    }
    if (donas.has(id)) continue;
    if (cands === null) cands = candidatas(id);
    const onde = cands.length ? cands.map((c) => `${c.id} (${c.motivo})`).join(' · ') : 'nenhuma funcionalidade de Tela própria ou Modal citada nem com a mesma rota — declare a dona';
    if (SEM_TELA.test(tipo)) {
      // Ação em tela não tem formulário próprio: com lista, ou a Superfície é Modal, ou a lista é da tela de origem.
      const modal = /^a[çc][ãa]o em tela/i.test(tipo) ? ' (se a funcionalidade abre formulário próprio, a Superfície dela é Modal)' : '';
      erros.push(`${id} · ${rot} — acessório numa funcionalidade de "${tipo}": o acessório mora na funcionalidade dona da tela${modal} → candidata: ${onde} · ${f.arquivo}`);
    } else {
      avisos.push(`${id} · ${rot} — Superfície "${tipo}" não reconhecida (Tela própria / Modal / Ação em tela / Job); confira à mão · ${f.arquivo}`);
    }
  }
}

// Uma vez na aplicação: o mesmo PE contado em duas funcionalidades, sem `Distinto de` entre elas.
const unicidade = [];
const declarado = (a, b, k) => [a, b].some((x, i) => (todos.get(x).distintos || []).some((d) => d.id === [b, a][i] && d.chave === k));
for (const [k, lista] of contadoEm) {
  const ids = [...new Set(lista.map((o) => o.id))].sort();
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      if (declarado(ids[i], ids[j], k)) continue;
      const nome = lista.find((o) => o.id === ids[i]).nome;
      const [A, B] = [todos.get(ids[i]), todos.get(ids[j])];
      const link = (de, para) => relative(dirname(de.abs), para.abs).split(sep).join('/');
      unicidade.push(`"${nome}" contado em ${ids[i]} e em ${ids[j]} — se é o mesmo PE (mesmos DER, arquivos lógicos e lógica; numa lista, mesmo rótulo, entidade e filtro), conte em uma e, na outra, grave na coluna Tipo a referência com link: em ${ids[j]}, \`↪ [${ids[i]}](${link(B, A)})\`; ou em ${ids[i]}, \`↪ [${ids[j]}](${link(A, B)})\`. Se diferem, uma delas declara na memória \`> Distinto de <ID> · ${nome}: <o que difere>\` · ${A.arquivo} · ${B.arquivo}`);
    }
  }
}

// A referência `↪` acha o PE contado.
const referencias = [];
let totalReusos = 0;
for (const [id, t] of todos) {
  for (const pe of t.pes.filter((x) => x.reuso)) {
    totalReusos++;
    const k = chavePE(pe.nome);
    const onde = `${id} · ${pe.nome} [↪ ${pe.reuso}] · ${t.arquivo}`;
    const alvo = todos.get(pe.reuso);
    if (pe.reuso === id) { referencias.push(`${onde} — a referência aponta para a própria funcionalidade`); continue; }
    if (!alvo) { referencias.push(`${onde} — ${pe.reuso} não existe (nenhum N3 com esse ID)`); continue; }
    // O ID é link para o N3 onde o PE conta: sem ele, quem lê a funcionalidade não chega ao PE
    // contado. A mensagem traz o link certo, relativo a este N3.
    const grave = `grave \`↪ [${pe.reuso}](${relative(dirname(t.abs), alvo.abs).split(sep).join('/')})\``;
    if (!pe.reusoLink) referencias.push(`${onde} — sem link para o N3 de ${pe.reuso}: ${grave}`);
    else {
      let destino = null;
      try { destino = resolve(dirname(t.abs), decodeURI(pe.reusoLink.replace(/#.*$/, ''))); } catch { /* link malformado */ }
      if (destino !== resolve(alvo.abs)) {
        referencias.push(`${onde} — o link aponta para ${pe.reusoLink}, ${destino && existsSync(destino) ? `que não é o N3 de ${pe.reuso}` : 'que não existe'}: ${grave}`);
      }
    }
    const linhas = alvo.pes.filter((x) => chavePE(x.nome) === k);
    if (!linhas.length) { referencias.push(`${onde} — ${pe.reuso} não tem o PE "${pe.nome}": a referência leva o nome do PE contado (renomeado?)`); continue; }
    if (!linhas.some(contado)) {
      const r = linhas.find((x) => x.reuso);
      referencias.push(r
        ? `${onde} — em ${pe.reuso} esse PE também é referência (↪ ${r.reuso}): aponte para onde ele é contado`
        : `${onde} — em ${pe.reuso} esse PE não está contado (PF ${linhas[0].pf === null ? '—' : linhas[0].pf})`);
      continue;
    }
    if (alvo.estado === 'deprecado') referencias.push(`${onde} — ${pe.reuso} está deprecada: a contagem do PE passa para uma das funcionalidades que o reutilizam`);
  }
}
erros.push(...unicidade, ...referencias);

console.log(`${feats.size} N3 com Superfície (${semSuperficie} sem) · ${donas.size} dona(s) de tela (Tela própria ou Modal) · ${totalAcessorios} PE acessório(s) · ${totalReusos} PE reutilizado(s) (↪)`);
for (const a of avisos) console.log(`  ⚠️  ${a}`);
if (!erros.length) {
  console.log('✓ Todo acessório está numa funcionalidade dona de tela, e cada PE é contado uma vez na aplicação.');
  process.exit(0);
}
const naTela = erros.length - unicidade.length - referencias.length;
if (naTela) {
  console.error(`\n✗ ${naTela} acessório(s) fora da funcionalidade dona da tela:`);
  for (const e of erros.slice(0, naTela)) console.error(`  - ${e}`);
  console.error('\nMova o PE para a funcionalidade dona da tela — a consulta implícita, para o Editar — (N3 + memória de cálculo); ver SIZING.md → Regra da lista consultada e Regra da consulta implícita.');
}
if (unicidade.length) {
  console.error(`\n✗ ${unicidade.length} PE contado(s) mais de uma vez na aplicação:`);
  for (const e of unicidade) console.error(`  - ${e}`);
}
if (referencias.length) {
  console.error(`\n✗ ${referencias.length} referência(s) ↪ que não acham o PE contado ou não levam a ele:`);
  for (const e of referencias) console.error(`  - ${e}`);
}
if (unicidade.length || referencias.length) console.error('\nVer SIZING.md → PE reutilizado.');
process.exit(1);
