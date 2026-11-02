#!/usr/bin/env node
// generate-impact-draft.mjs — o changeset derivado da AIMM do ticket (PROMPT_AIMM, passo 5).
//
// A partir das funcionalidades-âncora — as da `## Funcionalidades` da AIMM, ou as passadas com
// `--funcionalidade` —, DERIVA dos elos que já vivem nos artefatos a lista de documentos que o
// ticket vai tocar: o changeset que o PO aprova ANTES de qualquer spec mudar. O que não
// é derivável (sobretudo NFR e os limiares dos testes não-funcionais) fica como linha
// `elicitar` para a passada do analista. Determinístico onde dá, humano onde não dá.
//
// Elos usados (todos já presentes nos artefatos):
//   N3 âncora            → o próprio arquivo (cabeçalho `Nível 3` + `SIGLA-SAF-NN`)
//   QA (plano E2E)       → espelho de path do N3: qa/<dom>/<fs>/<funcionalidade>.md (não no perfil `requisitos`)
//   DATA-MODEL           → seção `## Campos` toca coluna → data-model do domínio
//   dicionários          → refs `→ ver/← (RULES|FIELD|MESSAGE|ERROR)-DICTIONARY`
//   protótipo            → seção `## Superfície` (Tela própria ou Modal)
//   API-PATTERNS         → seção `## API` (rotas)
//   repositório          → seção `## Implementação` (tabela de repos)
//   regressão            → "usado em" reverso: quem mais usa a mesma regra canônica
//   PE reutilizado       → `↪ [ID](…)` na `## Métricas de tamanho` (lib/pe.mjs): a alteração do PE é
//                          feita onde ele conta; quem mais o usa é regressão (nos dois sentidos)
//   NFR / teste NF       → NÃO derivável — linha `elicitar`
//
// Com `--aim`, grava as linhas na `## Artefatos impactados` da AIMM: as que já estão lá
// (elicitadas ou ajustadas à mão) ficam, as derivadas que faltam entram, e as linhas de
// exemplo do template saem. Sem `--aim`, imprime a tabela na saída padrão.
//
// Uso:
//   node scripts/generate-impact-draft.mjs --root <inst> --aim analise-impacto/AIMM-<CHAVE>.md [--funcionalidade <ID|caminho>]…
//   node scripts/generate-impact-draft.mjs --root <inst> --funcionalidade <ID|caminho> [--funcionalidade …]

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, relative, basename, isAbsolute } from 'node:path';
import { pesDoN3, chavePE, contado } from './lib/pe.mjs';
import { perfilDa } from './lib/instancia.mjs';
import { resolveImpactFile } from './lib/impact-files.mjs';
import { ehSecao } from './lib/niveis.mjs';

const args = process.argv.slice(2);
const opt = (n, d = null) => { const i = args.indexOf(n); return i !== -1 && args[i + 1] ? args[i + 1] : d; };
const opts = (n) => args.flatMap((a, i) => (a === n && args[i + 1] ? [args[i + 1]] : []));
const ROOT = opt('--root', '.');
const AIMM = opt('--aimm') || opt('--aim');
let FEATURES = [...opts('--funcionalidade'), ...opts('--feature')];
const USO = 'Uso: node scripts/generate-impact-draft.mjs --root <inst> --aim analise-impacto/AIMM-<CHAVE>.md [--funcionalidade <ID|caminho>]…\n' +
  '     node scripts/generate-impact-draft.mjs --root <inst> --funcionalidade <ID|caminho> [--funcionalidade …]';
if (args.includes('--out') || args.includes('--id') || args.includes('--need')) {
  console.error('✗ --out, --id e --need eram do PROMPT_IMPACTO: o changeset agora vai para a AIMM do ticket (--aim).\n' + USO);
  process.exit(2);
}
const aimPath = AIMM ? resolveImpactFile(isAbsolute(AIMM) ? AIMM : join(ROOT, AIMM)) : null;
if (AIMM && !existsSync(aimPath)) { console.error(`✗ AIMM não encontrada: ${AIMM}`); process.exit(2); }
if (!existsSync(join(ROOT, 'modules')) || (!AIMM && !FEATURES.length)) { console.error(USO); process.exit(2); }

/* --------------------------- helpers --------------------------- */
const splitRow = (r) => r.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
function walk(dir, acc = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.') || e.name === 'node_modules') continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (e.isFile() && e.name.endsWith('.md')) acc.push(p);
  }
  return acc;
}
function sectionSlice(lines, name) {
  const start = lines.findIndex((l) => ehSecao(l, name));
  if (start === -1) return null;
  const out = [];
  for (let i = start + 1; i < lines.length; i++) {
    if (/^##\s/.test(lines[i].trim())) break;
    out.push(lines[i]);
  }
  return out;
}
const idOf = (raw) => {
  const lvl = raw.split(/\r?\n/).find((l) => /N[íi]vel 3/.test(l));
  return (lvl && (lvl.match(/`([A-Z]{3}-[A-Z]{3}-\d{2})`/) || [])[1]) || null;
};
// Título do N3 (a linha `# …`) — é o nome canônico da funcionalidade, não uma paráfrase.
const nomeOf = (raw) => (raw.split(/\r?\n/).find((l) => /^#\s/.test(l)) || '').replace(/^#\s+/, '').trim();
// `SIGLA-SAF-NN Nome da funcionalidade`: código sozinho não diz nada a quem lê a AIMM,
// e obriga a abrir os N3 um a um só para saber do que se trata.
const rotulo = (id) => (NOMES.get(id) ? `${id} — ${NOMES.get(id)}` : id);

/* --------------------- resolve as funcionalidades-âncora --------------------- */
const allN3 = walk(join(ROOT, 'modules')).filter((p) => /\/f-[^/]+\.md$/.test(p));
// Lido de uma vez: o conteúdo serve tanto ao índice de nomes quanto à busca de
// regressão adiante, que antes relia cada arquivo três vezes.
const N3RAW = new Map(allN3.map((p) => [p, readFileSync(p, 'utf8')]));
const NOMES = new Map();
for (const [p, r] of N3RAW) { const i = idOf(r); if (i) NOMES.set(i, nomeOf(r)); }
const aimRaw = aimPath ? readFileSync(aimPath, 'utf8') : '';
if (aimPath && !FEATURES.length) {
  // As funcionalidades da `## Funcionalidades` da AIMM — o elo recíproco da `## Origem` dos N3.
  FEATURES = [...new Set((sectionSlice(aimRaw.split(/\r?\n/), 'Funcionalidades') || [])
    .filter((l) => l.trim().startsWith('|'))
    .map((l) => (splitRow(l)[0] || '').match(/\b[A-Z]{3}-[A-Z]{3}-\d{2}\b/))
    .filter((m) => m && !/^SIGLA-S(?:AF|FS)-NN$/.test(m[0])).map((m) => m[0]))];
  if (!FEATURES.length) { console.error(`✗ ${AIMM}: a \`## Funcionalidades\` não tem funcionalidade — preencha o roteamento (PROMPT_AIMM, passo 3) ou passe --funcionalidade.`); process.exit(1); }
}
const ancoras = [];
const semN3 = [];
for (const f of FEATURES) {
  let p = null;
  if (existsSync(join(ROOT, f))) p = join(ROOT, f);
  else if (existsSync(f)) p = f;
  else p = allN3.find((x) => idOf(N3RAW.get(x)) === f.toUpperCase());
  if (p) ancoras.push(p); else semN3.push(f);
}
if (!ancoras.length) { console.error(`✗ Nenhuma funcionalidade-âncora com N3: ${FEATURES.join(', ')}`); process.exit(1); }

/* --------------------------- deriva linhas --------------------------- */
// row: { artefato, tipo, operacao, secao, natureza, oque, proveniencia }
const rows = [];
const jaTem = (artefato, secao) => rows.some((r) => r.artefato === artefato && r.secao === secao);
// No perfil `requisitos` não há plano de testes na instância (sem CP3 nem opção 5B; o plano
// fica com quem constrói): as linhas QA — espelho e regressão — não são propostas.
const semQA = perfilDa(ROOT) === 'requisitos';
const push = (r) => { const x = { secao: '—', ...r }; if (semQA && x.tipo === 'QA') return; if (!jaTem(x.artefato, x.secao)) rows.push(x); };
const opOf = (p) => (existsSync(join(ROOT, p)) ? 'alterar' : 'criar');
const PES = new Map([...N3RAW].map(([p, r]) => [p, { id: idOf(r), pes: pesDoN3(r) }]));
const caminhoDe = new Map([...PES].filter(([, v]) => v.id).map(([p, v]) => [v.id, p]));

for (const n3path of ancoras) {
  const raw = readFileSync(n3path, 'utf8');
  const lines = raw.split(/\r?\n/);
  const fid = idOf(raw) || relative(ROOT, n3path);
  const rel = relative(ROOT, n3path);                       // modules/<dom>/<fs>/f-*.md
  const parts = rel.split('/');                              // [modules, dom, fs, f-*.md]
  const dom = parts[1], fs = parts[2], file = basename(n3path);

  // 1) N3 âncora
  push({ artefato: rel, tipo: 'N3', operacao: 'alterar', secao: 'Campos/Regras/Cenários',
    natureza: 'funcional', oque: `o que muda em ${rotulo(fid)}`, proveniencia: 'derivado: âncora' });

  // 2) QA — espelho de path (qa/<dom>/<fs>/<funcionalidade sem f->.md)
  const qa = `qa/${dom}/${fs}/${file.replace(/^f-/, '')}`;
  push({ artefato: qa, tipo: 'QA', operacao: opOf(qa), natureza: 'funcional',
    oque: 'plano E2E: smoke + negativos + permissão (converte os Cenários do N3)',
    proveniencia: 'derivado: espelho do N3' });

  // 3) DATA-MODEL do domínio (se a funcionalidade persiste dados)
  const dmCandidates = [`global/data-models/${dom}.md`, `global/data-models/${fs}.md`];
  const dm = dmCandidates.find((p) => existsSync(join(ROOT, p)));
  if (dm && sectionSlice(lines, 'Campos')) {
    push({ artefato: dm, tipo: 'DATA-MODEL', operacao: 'alterar', natureza: 'dados',
      oque: 'coluna ou entidade nova/alterada',
      proveniencia: 'derivado: ## Campos → coluna' });
  }

  // 4) dicionários referenciados no N3 (candidatos — só mudam se houver entrada nova)
  const DICT_RE = /(?:→\s*ver\s+|←\s*|→\s*)(RULES|FIELD|MESSAGE|ERROR)-DICTIONARY/g;
  const dicts = new Set();
  let dm2; DICT_RE.lastIndex = 0; while ((dm2 = DICT_RE.exec(raw))) dicts.add(dm2[1]);
  for (const d of [...dicts].sort()) {
    push({ artefato: `global/${d}-DICTIONARY.md`, tipo: `${d}-DICT`, operacao: opOf(`global/${d}-DICTIONARY.md`),
      natureza: d === 'RULES' ? 'funcional' : 'dados',
      oque: `revisar entrada (candidato — só toca se surgir ${d === 'RULES' ? 'regra' : 'campo/chave'} canônica)`,
      proveniencia: 'derivado: referência no N3' });
  }

  // 5) protótipo (Tela própria ou Modal — o primeiro negrito da Superfície)
  const surf = (sectionSlice(lines, 'Superfície') || []).join(' ');
  const neg = (surf.match(/\*\*([^*]+)\*\*/) || [])[1] || '';
  if (/^(tela pr[óo]pria|modal)\b/i.test(neg.trim())) {
    push({ artefato: `prototypes/ (tela de ${rotulo(fid)})`, tipo: 'PROTÓTIPO', operacao: 'alterar', natureza: 'funcional',
      oque: 'ajustar o protótipo navegável da tela', proveniencia: `derivado: ## Superfície (${neg.trim()})` });
  }

  // 6) API-PATTERNS (há rotas na seção API)
  if ((sectionSlice(lines, 'API') || []).some((l) => /\b(GET|POST|PUT|PATCH|DELETE)\s+\//.test(l))) {
    push({ artefato: 'global/API-PATTERNS.md', tipo: 'API-PATTERNS', operacao: opOf('global/API-PATTERNS.md'), natureza: 'derivado',
      oque: 'conferir conformidade da(s) rota(s) nova(s) com as diretrizes',
      proveniencia: 'derivado: ## API' });
  }

  // 7) repositório(s) de destino (## Implementação — ignora placeholders)
  for (const r of (sectionSlice(lines, 'Implementação') || [])) {
    const t = r.trim();
    if (!t.startsWith('|') || /^\|[\s:|-]+\|?$/.test(t)) continue;   // pula não-tabela e separador
    const repo = splitRow(r)[1] || '';
    if (!repo || /^-+$/.test(repo) || /^\[.*\]$/.test(repo) || repo === 'Repositório') continue;
    push({ artefato: repo, tipo: 'REPOSITÓRIO', operacao: 'alterar', natureza: 'derivado',
      oque: 'código-fonte impactado (fora do escopo de aval do PO — técnico)',
      proveniencia: 'derivado: ## Implementação' });
  }

  // 8) regressão — quem mais usa as MESMAS regras canônicas (usado em reverso)
  const rulesRefs = [...raw.matchAll(/(?:→\s*ver\s+|←\s*|→\s*)RULES-DICTIONARY:\s*([^\n;(|]+)/g)]
    .map((m) => m[1].trim().toLowerCase());
  if (rulesRefs.length) {
    const regr = new Set();
    for (const p of allN3) {
      if (ancoras.includes(p)) continue;
      const outro = N3RAW.get(p);
      if (rulesRefs.some((r) => outro.toLowerCase().includes(r))) regr.add(idOf(outro) || relative(ROOT, p));
    }
    for (const g of [...regr].filter(Boolean).sort().slice(0, 12)) {
      push({ artefato: `qa/ de ${rotulo(g)}`, tipo: 'QA', operacao: 'alterar', secao: 'regressão', natureza: 'funcional',
        oque: 're-teste: usa a mesma regra canônica alterada', proveniencia: 'derivado: usado-em (reverso)' });
    }
  }

  // 8b) PE reutilizado (SIZING.md → PE reutilizado): o PE conta uma vez na aplicação.
  //     (a) A âncora reutiliza um PE (`↪ [ID](…)`): se a mudança o tocar, ele é alterado e
  //         recontado onde conta — o ticket vai para a Origem e o Changelog daquela
  //         funcionalidade —, e a tela dela é re-testada.
  //     (b) Toda funcionalidade que reutiliza um PE contado (ou reutilizado) pela âncora é regressão.
  //     São candidatos: só entram se a mudança tocar o PE — o rascunho não sabe, o PO decide.
  const minhas = pesDoN3(raw);
  const ondeConta = new Map(); // chave do PE -> ID da funcionalidade onde ele conta
  for (const pe of minhas) {
    if (contado(pe)) ondeConta.set(chavePE(pe.nome), fid);
    else if (pe.reuso) ondeConta.set(chavePE(pe.nome), pe.reuso);
  }
  for (const pe of minhas.filter((x) => x.reuso && x.reuso !== fid)) {
    const alvo = caminhoDe.get(pe.reuso);
    const art = alvo ? relative(ROOT, alvo) : pe.reuso;
    push({ artefato: art, tipo: 'N3', operacao: 'alterar', secao: 'Métricas de tamanho', natureza: 'derivado',
      oque: `candidato — se a mudança toca o PE "${pe.nome}": é alterado e recontado aqui, onde conta (${rotulo(pe.reuso)}); o ticket entra na Origem e no Changelog desta funcionalidade`,
      proveniencia: 'derivado: ↪ PE reutilizado' });
    push({ artefato: `qa/ de ${rotulo(pe.reuso)}`, tipo: 'QA', operacao: 'alterar', secao: 'regressão', natureza: 'funcional',
      oque: `re-teste — candidato: a tela onde o PE "${pe.nome}" é contado`, proveniencia: 'derivado: ↪ PE reutilizado' });
  }
  const quemReusa = new Map(); // ID -> nome do PE reutilizado
  for (const [p, v] of PES) {
    if (ancoras.includes(p) || !v.id || v.id === fid) continue;
    for (const pe of v.pes.filter((x) => x.reuso)) {
      if (ondeConta.get(chavePE(pe.nome)) === pe.reuso && !quemReusa.has(v.id)) quemReusa.set(v.id, pe.nome);
    }
  }
  for (const [g, nome] of [...quemReusa].sort()) {
    push({ artefato: `qa/ de ${rotulo(g)}`, tipo: 'QA', operacao: 'alterar', secao: 'regressão', natureza: 'funcional',
      oque: `re-teste — candidato: usa o PE "${nome}" (↪), se a mudança o tocar`, proveniencia: 'derivado: ↪ PE reutilizado (reverso)' });
  }
}

// 9) NFR + teste NF — NÃO derivável: lembrete de elicitação
push({ artefato: 'global/NFR.md', tipo: 'NFR', operacao: opOf('global/NFR.md'), natureza: 'não-funcional',
  oque: '⚠️ elicitar: a mudança tem impacto de desempenho/segurança/auditoria/disponibilidade?',
  proveniencia: 'elicitar (analista)' });

/* ------------------------ emite o changeset ------------------------ */
const cell = (s) => String(s).replace(/\|/g, '\\|');
// Status (9.2.0): a linha nasce Pendente; o agente a passa a Especificado ao gravar o artefato,
// e a pessoa, ao revisar e aprovar, a Validado (ou Não se aplica).
const CAB = ['| Artefato | Tipo | Operação | Seção | Natureza | O quê | Proveniência | Status |', '|---|---|---|---|---|---|---|---|'];
const linha = (r) => `| \`${cell(r.artefato)}\` | ${r.tipo} | ${r.operacao} | ${cell(r.secao)} | ${r.natureza} | ${cell(r.oque)} | ${r.proveniencia} | Pendente |`;
for (const f of semN3) console.error(`⚠️  ${f}: sem N3 ainda — acrescente à mão as linhas de criação (${semQA ? 'N3' : 'N3 e QA'} \`criar\`).`);

if (!aimPath) {
  process.stdout.write([...CAB, ...rows.map(linha)].join('\n') + '\n');
  process.exit(0);
}

// Grava na `## Artefatos impactados` da AIMM: o que já está lá fica (menos o exemplo do
// template), e entra o que falta — a chave é artefato + seção.
const ls = aimRaw.split(/\r?\n/);
const ini = ls.findIndex((l) => l.trim() === '## Artefatos impactados');
if (ini < 0) { console.error(`✗ ${AIMM}: sem a seção \`## Artefatos impactados\`.`); process.exit(1); }
let fim = ls.findIndex((l, k) => k > ini && /^##\s/.test(l.trim()));
if (fim < 0) fim = ls.length;
const tIni = ls.findIndex((l, k) => k > ini && k < fim && /^\|\s*Artefato\s*\|/.test(l.trim()));
let tFim = tIni;
if (tIni >= 0) while (tFim + 1 < fim && ls[tFim + 1].trim().startsWith('|')) tFim++;
const EXEMPLO = /<(?:dom|fs|slug)>|\[[^\]]*\]/;
// Tabela anterior à 9.2.0, sem a coluna Status: as linhas que já estavam entram como Pendente.
const semStatus = tIni >= 0 && !splitRow(ls[tIni]).some((c) => /^status$/i.test(c.trim()));
const existentes = (tIni >= 0 ? ls.slice(tIni + 2, tFim + 1) : []).filter((l) => !EXEMPLO.test(l))
  .map((l) => (semStatus ? `${l.trimEnd()} Pendente |` : l));
const chave = (l) => { const c = splitRow(l); return `${(c[0] || '').replace(/`/g, '')}|${c[3] || '—'}`; };
const ja = new Set(existentes.map(chave));
const novas = rows.filter((r) => !ja.has(`${r.artefato}|${r.secao}`)).map(linha);
const tabela = [...CAB, ...existentes, ...novas];
const saida = tIni >= 0
  ? [...ls.slice(0, tIni), ...tabela, ...ls.slice(tFim + 1)]
  : [...ls.slice(0, fim), ...tabela, '', ...ls.slice(fim)];
writeFileSync(aimPath, saida.join('\n'));
console.error(`✓ ${AIMM}: ${novas.length} linha(s) derivada(s) gravada(s) em \`## Artefatos impactados\` (${existentes.length} já estavam; âncoras: ${ancoras.map((p) => rotulo(idOf(N3RAW.get(p)) || relative(ROOT, p))).join(', ')}).`);
