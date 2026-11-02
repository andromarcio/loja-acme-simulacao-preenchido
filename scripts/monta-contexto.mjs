#!/usr/bin/env node
// monta-contexto.mjs — o pacote de contexto de uma funcionalidade (ou de um Agrupamento Funcional): o N3 e,
// de cada artefato global, só o que ele usa. É o insumo de quem desenha, implementa ou
// testa a funcionalidade.
//
// Por quê (pedido do PO, 2026-10-10): 32 prompts pedem "cole aqui o conteúdo de…". Ou o
// agente recebe os dicionários inteiros — ruído, e a entrada certa disputa atenção com
// as outras —, ou recebe menos do que precisa e preenche a falta por dedução. Lendo do
// disco, o agente ainda escolhe o que abrir. Aqui a escolha é determinística: o que o N3
// cita entra; o que ele cita e não existe aparece como ❓, em vez de sumir.
//
// O que entra, nesta ordem:
//   1. o N3 inteiro (no modo --agrupamento, cada N3 do Agrupamento Funcional);
//   2. o N2: a matriz "Permissões por perfil" (quem pode vive só nela) e as dependências;
//   3. o N1: as regras transversais do domínio (valem para toda funcionalidade dele);
//   4. as entidades do data-model que a funcionalidade toca — front-matter `entidade`, coluna
//      Entidade de `## Campos`, `## Dados lidos e gravados` — com a seção inteira;
//   5. as entradas citadas do RULES (`RC-NN`), FIELD, MESSAGE e ERROR-DICTIONARY — e os
//      códigos do `## Mapeamento de erros`, do `error_codes` e, desde a 6.4.0, todo código
//      do dicionário que o N3 cita em qualquer lugar (o `error.code "AUTH_FORBIDDEN"` de um
//      cenário técnico ficava de fora — achado na validação do modelo no siesa-doc);
//   6. os NFR citados pelo ID (a herança dos demais fica dita, não repetida);
//   7. as funcionalidades de `depende_de` e, desde a 6.4.0, as citadas no texto (`→ ver
//      XXX-YYY-NN`, menção na Descrição ou num cenário): título, Descrição e as rotas da API;
//   8. os protótipos citados;
//   9. desde a 6.4.0, as decisões de percurso que citam a funcionalidade — os parágrafos de
//      `global/PLANO-IMPLEMENTACAO.md` e de `decisions/*.md` com o ID. Decisão que só
//      existia ali (ordem de prioridade, cache, código de erro) era deduzida por quem lia
//      só o N3;
//  10. com `--base <ref>`: o delta do N3 desde a base (scripts/delta-n3.mjs) — o que muda
//      neste ticket.
//
// Uso (a partir da raiz da instância):
//   node scripts/monta-contexto.mjs <ID | caminho do N3> [--base main] [--out <arquivo>]
//   node scripts/monta-contexto.mjs --agrupamento <SIGLA-SAF | pasta do N2> [--out <arquivo>]
//   (sem --out, escreve na saída padrão). O --agrupamento junta as funcionalidades do Agrupamento Funcional num
//   pacote só: N1, N2, entidades e dicionários uma vez, em vez de repetidos por funcionalidade.

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join, resolve, relative, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { frontMatter, frontMatterLista } from './lib/front-matter.mjs';
import { arquivosN3 } from './lib/repos.mjs';
import { secao } from './lib/regras.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const alvo = args.find((a, i) => !a.startsWith('--') && !['--base', '--out', '--root', '--agrupamento', '--fs'].includes(args[i - 1]));
const FS = opt('--agrupamento') || opt('--fs');
const ROOT = resolve(opt('--root') || '.');
const USO = 'uso: node scripts/monta-contexto.mjs <ID | caminho do N3> [--base main] [--out <arquivo>]\n     node scripts/monta-contexto.mjs --agrupamento <SIGLA-SAF | pasta do N2> [--out <arquivo>]';
if (!alvo && !FS) { console.error(USO); process.exit(2); }

const chave = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
const ler = (p) => (existsSync(p) ? readFileSync(p, 'utf8') : null);
const rel = (p) => relative(ROOT, p).replace(/\\/g, '/');
const celulas = (l) => l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
const sep = (l) => /^\|[\s:|-]+\|?$/.test(l.trim());
const idDe = (texto) => (frontMatter(texto.split(/\r?\n/)) || {}).id || (texto.match(/`([A-Z]{3}-[A-Z]{3}-\d{2})`/) || [])[1];
const tituloDe = (texto, id) => ((texto.match(/^# (.+)$/m) || [])[1] || id).trim();
const semChangelog = (t) => t.replace(/^## Changelog\b[\s\S]*?(?=^## |(?![\s\S]))/m, '');
const ID_RE = /\b[A-Z]{3}-[A-Z]{3}-\d{2}\b/g;
const TOK = /\b[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+\b/g;

// Cada trecho vai literal, num bloco ````markdown: os cabeçalhos dele não se confundem
// com os do pacote.
const literal = (origem, corpo) => `> Fonte: ${origem}\n\n\`\`\`\`markdown\n${corpo.trim()}\n\`\`\`\``;

// Seção `##`/`###` de um arquivo, pelo cabeçalho exato (sem o prefixo de nível), até o
// próximo cabeçalho do mesmo nível ou acima.
function trecho(txt, casa, nivel) {
  const ls = txt.split(/\r?\n/);
  const re = new RegExp(`^#{${nivel}}\\s+(.*)$`);
  const ini = ls.findIndex((l) => { const m = l.match(re); return m && casa(m[1].trim()); });
  if (ini < 0) return null;
  let fim = ls.length;
  for (let i = ini + 1; i < ls.length; i++) if (new RegExp(`^#{1,${nivel}}\\s`).test(ls[i])) { fim = i; break; }
  return ls.slice(ini, fim).join('\n').trim();
}

// ── as funcionalidades do pacote ────────────────────────────────────────────────────
const n3s = arquivosN3(ROOT);
const porId = new Map(n3s.map((f) => [idDe(readFileSync(f, 'utf8')), f]));
let arquivos;
if (FS) {
  const pasta = existsSync(resolve(FS)) ? resolve(FS) : null;
  arquivos = n3s.filter((f) => (pasta ? dirname(f) === pasta : (idDe(readFileSync(f, 'utf8')) || '').startsWith(`${FS}-`)))
    .sort((a, b) => (idDe(readFileSync(a, 'utf8')) || '').localeCompare(idDe(readFileSync(b, 'utf8')) || ''));
  if (!arquivos.length) { console.error(`monta-contexto: nenhum N3 do Agrupamento Funcional ${FS} em modules/.`); process.exit(2); }
} else {
  const arq = existsSync(resolve(alvo)) ? resolve(alvo) : porId.get(alvo);
  if (!arq) { console.error(`monta-contexto: nenhum N3 com o ID ${alvo} em modules/.`); process.exit(2); }
  arquivos = [arq];
}
const features = arquivos.map((arq) => {
  const texto = readFileSync(arq, 'utf8');
  const ID = idDe(texto);
  return { arq, texto, lines: texto.split(/\r?\n/), ID, titulo: tituloDe(texto, ID) };
});
const doPacote = new Set(features.map((f) => f.ID));

const faltas = [];
const falta = (f) => { if (!faltas.includes(f)) faltas.push(f); };
const partes = [];
const bloco = (t, corpo, origem) => partes.push(`## ${t}\n\n${literal(origem, corpo)}\n`);

for (const f of features) bloco(`A funcionalidade — ${f.ID} — ${f.titulo}`, f.texto.replace(/^<!--.*?-->\s*/, ''), rel(f.arq));

// ── N2 e N1 ──────────────────────────────────────────────────────────────────
for (const pasta of [...new Set(features.map((f) => dirname(f.arq)))]) {
  const n2 = ler(join(pasta, 'README.md'));
  if (n2) {
    const perm = trecho(n2, (h) => /^Permiss/.test(h), 2);
    const dep = trecho(n2, (h) => /^Depend/.test(h), 2);
    if (perm || dep) bloco('O Agrupamento Funcional (N2) — quem pode e de quem depende', [perm, dep].filter(Boolean).join('\n\n'), rel(join(pasta, 'README.md')));
    else falta('N2 sem "## Permissões por perfil"');
  } else falta(`N2 ausente (${rel(join(pasta, 'README.md'))})`);
}
for (const pasta of [...new Set(features.map((f) => dirname(dirname(f.arq))))]) {
  const n1 = ler(join(pasta, 'README.md'));
  const rt = n1 && trecho(n1, (h) => /^Regras transversais/.test(h), 2);
  if (rt) bloco('O domínio (N1) — regras transversais, valem para toda funcionalidade dele', rt, rel(join(pasta, 'README.md')));
}

// ── data-model ───────────────────────────────────────────────────────────────
const entidades = new Set();
for (const { lines } of features) {
  const fm = frontMatter(lines) || {};
  if (fm.entidade && !/^\[/.test(fm.entidade)) entidades.add(fm.entidade);
  for (const [nome, re] of [['Campos', /^entidade/], ['Dados lidos e gravados', /^entidade/]]) {
    let cab = null;
    for (const { texto: l } of secao(lines, nome) || []) {
      if (!l.trim().startsWith('|')) { cab = null; continue; }
      if (sep(l)) continue;
      const c = celulas(l);
      if (!cab) { cab = c.map(chave); continue; }
      const i = cab.findIndex((h) => re.test(h));
      const v = i >= 0 ? c[i].replace(/[`*]/g, '').replace(/→.*$/, '').trim() : '';
      if (v && !/^(dado de c[oó]digo|externo|derivado|—|-|\[)/i.test(v)) entidades.add(v);
    }
  }
}
const fragmentos = [join(ROOT, 'global', 'DATA-MODEL.md'),
  ...(existsSync(join(ROOT, 'global', 'data-models')) ? readdirSync(join(ROOT, 'global', 'data-models')).filter((n) => n.endsWith('.md')).map((n) => join(ROOT, 'global', 'data-models', n)) : [])]
  .filter(existsSync);
const nomeDoCab = (h) => chave(h.replace(/^Entidade( associativa)?:\s*/i, '').replace(/—.*$/, ''));
const achadas = [];
for (const e of entidades) {
  let achou = false;
  for (const f of fragmentos) {
    const t = trecho(readFileSync(f, 'utf8'), (h) => nomeDoCab(h) === chave(e), 2);
    if (t) { achadas.push(literal(rel(f), t)); achou = true; break; }
  }
  if (!achou) falta(`entidade "${e}" sem seção no data-model`);
}
if (achadas.length) partes.push(`## As entidades que a funcionalidade toca (data-model)\n\n${achadas.join('\n\n')}\n`);

// ── dicionários ──────────────────────────────────────────────────────────────
const dic = (n) => join(ROOT, 'global', `${n}-DICTIONARY.md`);
// Os códigos do ERROR-DICTIONARY (fora do índice reverso), para achar os citados soltos.
const codigosDoDicionario = (() => {
  const t = ler(dic('ERROR'));
  if (!t) return new Set();
  const ls = t.split(/\r?\n/);
  const fim = ls.findIndex((l) => /^##\s+Usado em/i.test(l));
  return new Set(ls.slice(0, fim < 0 ? ls.length : fim).filter((l) => l.trim().startsWith('|') && !sep(l)).flatMap((l) => celulas(l)[0].replace(/`/g, '').match(TOK) || []));
})();
const CIT = /(?:→\s*ver\s+|←\s*)(FIELD|RULES|ERROR|MESSAGE)-DICTIONARY\s*:\s*([^\n]*)/g;
const citados = { FIELD: new Set(), RULES: new Set(), ERROR: new Set(), MESSAGE: new Set() };
for (const { texto, lines } of features) {
  for (const m of texto.matchAll(CIT)) {
    const cauda = m[2];
    if (m[1] === 'RULES') { for (const r of cauda.match(/RC-\d{2,}/g) || []) citados.RULES.add(r); continue; }
    const corte = cauda.split(/[;(|]|⚠|←|→|\.\s|\.$|\s+se\s+|\s+—\s+/)[0];
    const tic = [...corte.matchAll(/`([^`]+)`/g)].map((x) => x[1]);
    for (const a of (tic.length ? tic : corte.split(/\s*[,/·]\s*/))) {
      const v = a.trim().replace(/^["']|["'\]]+$/g, '').trim();
      if (v && !v.startsWith('[')) citados[m[1]].add(v);
    }
  }
  for (const c of frontMatterLista(lines, 'error_codes') || []) citados.ERROR.add(c);
  for (const { texto: l } of secao(lines, 'Mapeamento de erros') || []) {
    if (l.trim().startsWith('|') && !sep(l)) for (const t of celulas(l)[0].replace(/\[[^\]]*\]/g, '').match(TOK) || []) citados.ERROR.add(t);
  }
  for (const t of semChangelog(texto).match(TOK) || []) if (codigosDoDicionario.has(t)) citados.ERROR.add(t);
}
const entradas = [];
for (const [sigla, set] of Object.entries(citados)) {
  if (!set.size) continue;
  const t = ler(dic(sigla));
  if (!t) { falta(`${sigla}-DICTIONARY ausente (citado: ${[...set].join(', ')})`); continue; }
  const achados = [];
  for (const alvoDic of set) {
    let e = null;
    if (sigla === 'RULES') e = trecho(t, (h) => h.startsWith(`${alvoDic} `) || h === alvoDic, 3);
    else if (sigla === 'FIELD') e = trecho(t, (h) => chave(h) === chave(alvoDic), 3);
    else {
      // A entrada é a linha cuja PRIMEIRA coluna é o código; o índice reverso gerado
      // ("## Usado em") fica de fora — ele diz quem cita, não o que o código é.
      const todas = t.split(/\r?\n/);
      const fimUso = todas.findIndex((l) => /^##\s+Usado em/i.test(l));
      // `AUTH_*` é curinga: traz as entradas com o prefixo.
      const casa = alvoDic.endsWith('*') ? (c) => c.startsWith(alvoDic.slice(0, -1)) : (c) => c === alvoDic;
      const is = todas.slice(0, fimUso < 0 ? todas.length : fimUso).map((l, i) => i)
        .filter((i) => todas[i].trim().startsWith('|') && !sep(todas[i]) && casa(celulas(todas[i])[0].replace(/`/g, '')));
      if (is.length) {
        let k = is[0]; while (k > 0 && todas[k - 1].trim().startsWith('|')) k--;
        e = [todas[k], todas[k + 1], ...is.map((i) => todas[i])].join('\n');
      }
    }
    if (e) achados.push(e); else falta(`${sigla}-DICTIONARY sem a entrada "${alvoDic}"`);
  }
  if (achados.length) entradas.push(`### ${sigla}-DICTIONARY\n\n${literal(rel(dic(sigla)), achados.join('\n\n'))}`);
}
if (entradas.length) partes.push(`## As entradas de dicionário que a funcionalidade cita\n\n${entradas.join('\n\n')}\n`);

// ── NFR ──────────────────────────────────────────────────────────────────────
const nfr = ler(join(ROOT, 'global', 'NFR.md'));
if (nfr) {
  const ids = [...nfr.matchAll(/^###\s+([A-Z]{2,5}-\d{2,})\b/gm)].map((m) => m[1]);
  const usados = ids.filter((id) => features.some((f) => new RegExp(`\\b${id}\\b`).test(f.texto)));
  const ts = usados.map((id) => trecho(nfr, (h) => h.startsWith(id), 3)).filter(Boolean);
  partes.push(`## Os NFR citados\n\nOs demais valem por herança e não se repetem aqui.\n\n${ts.length ? literal('global/NFR.md', ts.join('\n\n')) : '_O N3 não cita NFR pelo ID._'}\n`);
}

// ── dependências, funcionalidades citadas e protótipos ──────────────────────────────
const resumo = (d) => {
  const f = porId.get(d);
  const t = readFileSync(f, 'utf8');
  const ls = t.split(/\r?\n/);
  const desc = (secao(ls, 'Descrição') || []).map((x) => x.texto).join('\n').trim();
  const rotas = ls.filter((l) => /^###\s+`?(GET|POST|PUT|PATCH|DELETE)\s/.test(l)).map((l) => `- ${l.replace(/^###\s+/, '')}`);
  return `### ${d} — ${tituloDe(t, d)}\n\n${literal(rel(f), `${desc}${rotas.length ? `\n\nAPI:\n${rotas.join('\n')}` : ''}`)}`;
};
const deps = [...new Set(features.flatMap((f) => (frontMatterLista(f.lines, 'depende_de') || []).filter((d) => !d.startsWith('['))))].filter((d) => !doPacote.has(d));
const ds = [];
for (const d of deps) { if (porId.has(d)) ds.push(resumo(d)); else falta(`depende_de: ${d} sem N3`); }
if (ds.length) partes.push(`## As funcionalidades de que esta depende\n\n${ds.join('\n\n')}\n`);
// Citadas no texto (fora do front-matter e do Changelog) — só as que existem: um ID
// inexistente no texto pode ser exemplo; o de `depende_de` é contrato e falta como ❓.
const citadas = [...new Set(features.flatMap((f) => semChangelog(f.texto.replace(/^---[\s\S]*?\n---\n/, '')).match(ID_RE) || []))]
  .filter((d) => !doPacote.has(d) && !deps.includes(d) && porId.has(d)).sort();
if (citadas.length) partes.push(`## As funcionalidades citadas no texto\n\n${citadas.map(resumo).join('\n\n')}\n`);
// O protótipo da funcionalidade é o da linha "Fidelidade ao protótipo" e o de link markdown —
// caminho que aparece como VALOR num exemplo da API não é protótipo desta funcionalidade.
const linhasProto = features.flatMap((f) => f.lines.filter((l) => /Fidelidade ao prot[oó]tipo/i.test(l) || /\]\([^)]*prototypes\//.test(l)));
const protos = [...new Set(linhasProto.flatMap((l) => [...l.matchAll(/prototypes\/[^\s)`'"\]]+\.html/g)].map((m) => m[0].replace(/^(\.\.\/)+/, ''))))]
  .filter((p) => !/[[#]/.test(p));
if (protos.length) {
  partes.push(`## Os protótipos\n\n${protos.map((p) => `- \`${p}\`${existsSync(join(ROOT, p)) ? '' : ' — ❓ não existe no disco'}`).join('\n')}\n`);
  for (const p of protos) if (!existsSync(join(ROOT, p))) falta(`protótipo ${p} não existe`);
}

// ── decisões de percurso ─────────────────────────────────────────────────────
const registros = [join(ROOT, 'global', 'PLANO-IMPLEMENTACAO.md'),
  ...(existsSync(join(ROOT, 'decisions')) ? readdirSync(join(ROOT, 'decisions')).filter((n) => n.endsWith('.md')).map((n) => join(ROOT, 'decisions', n)) : [])]
  .filter(existsSync);
const decisoes = [];
for (const r of registros) {
  // Parágrafo = linhas seguidas sem linha em branco (item de lista e linha de tabela contam
  // sozinhos), fora de bloco de código.
  const pars = []; let atual = [], cerca = false;
  const fecha = () => { if (atual.length) pars.push(atual.join('\n')); atual = []; };
  for (const l of readFileSync(r, 'utf8').split(/\r?\n/)) {
    if (/^\s*(```|~~~)/.test(l)) cerca = !cerca;
    if (!l.trim() || /^#{1,6}\s/.test(l)) { fecha(); continue; }
    if (!cerca && /^\s*([-*+] |\d+[.)] |\|)/.test(l)) { fecha(); pars.push(l); continue; }
    atual.push(l);
  }
  fecha();
  const comId = pars.filter((p) => features.some((f) => new RegExp(`\\b${f.ID}\\b`).test(p)));
  if (comId.length) decisoes.push(literal(rel(r), comId.join('\n\n')));
}
if (decisoes.length) partes.push(`## As decisões de percurso que citam a funcionalidade\n\nO que foi decidido fora do N3 (plano de implementação, ADR). Decisão que só existe aqui e muda o comportamento é defeito da especificação: leve-a ao N3.\n\n${decisoes.join('\n\n')}\n`);

// ── delta ────────────────────────────────────────────────────────────────────
const BASE = opt('--base');
if (BASE) {
  for (const f of features) {
    const r = spawnSync('node', [join(HERE, 'delta-n3.mjs'), rel(f.arq), '--base', BASE], { cwd: ROOT, encoding: 'utf8' });
    partes.push(`## O que muda neste ticket (delta desde ${BASE})\n\n${literal(`node scripts/delta-n3.mjs ${rel(f.arq)} --base ${BASE}`, r.stdout || r.stderr || '')}\n`);
  }
}

const umaSo = features.length === 1 && !FS;
const nomeFs = FS && ((ler(join(dirname(features[0].arq), 'README.md')) || '').match(/^# (?:(?:Agrupamento Funcional|Feature Set):\s*)?(.+)$/m) || [])[1];
const titulo = umaSo ? `${features[0].ID} — ${features[0].titulo}` : `Agrupamento Funcional ${nomeFs ? `${nomeFs.trim()} ` : ''}(${features.map((f) => f.ID).join(' · ')})`;
const comando = umaSo ? `${features[0].ID}${BASE ? ` --base ${BASE}` : ''}` : `--agrupamento ${FS}${BASE ? ` --base ${BASE}` : ''}`;
const cab = [`# Contexto — ${titulo}`, '',
  `> Gerado por \`node scripts/monta-contexto.mjs ${comando}\` — não editar: a fonte é a instância. Traz o N3 e, de cada artefato global, só o que ele usa. A regra da funcionalidade se cita como \`${umaSo ? features[0].ID : '<ID>'}/RN-NN\`.`, ''];
if (faltas.length) cab.push('**❓ Citado e não encontrado** — resolver antes de usar o pacote; nada aqui é para ser deduzido:', '', ...faltas.map((f) => `- ❓ ${f}`), '');
const saida = `${cab.join('\n')}\n${partes.join('\n---\n\n')}`;
const OUT = opt('--out');
if (OUT) { writeFileSync(OUT, saida); console.error(`✓ ${OUT}: contexto de ${umaSo ? features[0].ID : FS} — ${partes.length} parte(s)${faltas.length ? `, ${faltas.length} ❓` : ''}.`); }
else process.stdout.write(saida);
