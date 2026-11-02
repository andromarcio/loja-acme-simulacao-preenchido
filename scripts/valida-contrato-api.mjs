#!/usr/bin/env node
// valida-contrato-api.mjs — o contrato da API do N3 é dado que o código copia: as partes
// que se espelham concordam, e o que é citado existe.
//
// Por quê (pedido do PO, 2026-10-10): o template diz que `endpoints` e `error_codes` do
// front-matter "espelham" `## API` e `## Mapeamento de erros`, e nada conferia. Medido no
// siesa-doc: os 77 N3 têm `## API`, mas só 66 preenchem `endpoints` e 33 `error_codes`;
// em 2 o front-matter e a API divergem, e em 11 o Mapeamento traz código que o
// front-matter não tem. É no contrato que o agente que gera o código inventa nome de
// campo, tipo e código de erro quando a fonte é exemplo e não dado.
//
// Reprova (exit 1), em N3 com `## API` (a passada técnica; no perfil `requisitos` não há):
//   E1 endpoint do front-matter sem `### MÉTODO /rota` em `## API`, ou o contrário;
//   E2 código de `error_codes` fora do `## Mapeamento de erros`, ou código do Mapeamento
//      fora de `error_codes` (os globais do ERROR-DICTIONARY — seção "Erros globais" —
//      podem ficar só no Mapeamento);
//   E3 código das tabelas de erro da `## API` fora do Mapeamento (e não global) — a API
//      devolve um código que não tem mensagem ao usuário;
//   E4 código citado que não existe no `global/ERROR-DICTIONARY.md`;
//   E5 nas tabelas de campos da `## API` (cabeçalho com "Campo" e "Label PO"), Label PO
//      que não está em `## Campos`, `## Campos automáticos` nem `## Colunas do resultado`
//      — campo técnico (id, versão) leva `—`;
//   E6 HTTP do código no `## Mapeamento de erros` ou nas tabelas de erro da `## API` diferente
//      do HTTP do mesmo código no ERROR-DICTIONARY — a fonte única do status (achado no
//      siesa-doc, 2026-10-11: `CONEXAO_GITHUB_INACTIVE` 409 no N3 e 422 no dicionário).
// Avisa (não reprova): `## API` com endpoint e sem nenhuma tabela de campos — o corpo
//   ainda é exemplo JSON/TypeScript, que este script não confere (formato anterior à 6.3.0).
//
// Uso:  node scripts/valida-contrato-api.mjs [arquivo f-*.md | pasta] …
//       (sem argumentos: todo `modules/**/f-*.md`)

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { frontMatterLista } from './lib/front-matter.mjs';
import { findInstanceRoot } from './lib/trace-index.mjs';
import { secao } from './lib/regras.mjs';

const ROOT = process.cwd();
const rel = (p) => p.replace(`${ROOT}/`, '').replace(/\\/g, '/');
const TOK = /\b[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+\b/g;
const METODO_RE = /^###\s+`?(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s+(\S+?)`?\s*$/;
const sep = (l) => /^\|[\s:|-]+\|?$/.test(l.trim());
const celulas = (l) => l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
const semAcento = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const norm = (s) => semAcento(String(s).replace(/[`*_]/g, '')).replace(/\s+/g, ' ').trim();
// Códigos de uma célula, sem os placeholders `[ENTIDADE_ERRO]` do template.
const codigos = (s) => (String(s).replace(/\[[^\]]*\]/g, '').match(TOK) || []);

// Tabelas de uma seção (linhas de `secao()`): [{ cab: [..], linhas: [{ c: [..], linha }] }].
function tabelas(sec) {
  const out = [];
  let atual = null;
  for (const { texto, linha } of sec || []) {
    if (!texto.trim().startsWith('|')) { atual = null; continue; }
    if (sep(texto)) continue;
    if (!atual) { atual = { cab: celulas(texto).map(norm), linhas: [] }; out.push(atual); continue; }
    atual.linhas.push({ c: celulas(texto), linha });
  }
  return out;
}

const dicionarios = new Map(); // raiz → { todos, globais, http } | null
// Os status de uma célula (`401 · 403` vale como dois).
const httpsDe = (s) => String(s || '').match(/\b[1-5]\d\d\b/g) || [];
function dicionarioDe(raiz) {
  if (dicionarios.has(raiz)) return dicionarios.get(raiz);
  const arq = raiz && join(raiz, 'global', 'ERROR-DICTIONARY.md');
  let d = null;
  if (arq && existsSync(arq)) {
    d = { todos: new Set(), globais: new Set(), http: new Map() };
    let global = false, iHttp = -1;
    for (const l of readFileSync(arq, 'utf8').split(/\r?\n/)) {
      if (/^##\s/.test(l)) global = /globa/i.test(l);
      if (!l.trim().startsWith('|')) { iHttp = -1; continue; }
      if (sep(l)) continue;
      const c = celulas(l);
      if (iHttp < 0 && c.some((h) => /^http$/.test(norm(h)))) { iHttp = c.findIndex((h) => /^http$/.test(norm(h))); continue; }
      for (const t of codigos(c[0])) {
        d.todos.add(t); if (global) d.globais.add(t);
        const h = iHttp >= 0 && httpsDe(c[iHttp])[0];
        if (h && !d.http.has(t)) d.http.set(t, h);
      }
    }
  }
  dicionarios.set(raiz, d);
  return d;
}

function confere(arq) {
  const texto = readFileSync(arq, 'utf8');
  const lines = texto.split(/\r?\n/);
  const api = secao(lines, 'API');
  const erros = [], avisos = [];
  if (!api) return { erros, avisos };
  const dic = dicionarioDe(findInstanceRoot(dirname(arq)));
  const globais = dic ? dic.globais : new Set();

  // E1 — endpoints
  const rotas = new Map();
  for (const { texto: t, linha } of api) {
    const m = t.match(METODO_RE);
    if (m) rotas.set(`${m[1]} ${m[2]}`, linha);
  }
  const fmEnd = frontMatterLista(lines, 'endpoints') || [];
  for (const e of fmEnd) if (!rotas.has(e.replace(/\s+/, ' '))) erros.push(`E1 endpoints: "${e}" está no front-matter e não tem \`### ${e}\` em \`## API\`.`);
  const fmSet = new Set(fmEnd.map((e) => e.replace(/\s+/, ' ')));
  for (const [r, linha] of rotas) if (!fmSet.has(r)) erros.push(`E1 linha ${linha}: \`### ${r}\` está em \`## API\` e falta em \`endpoints\` do front-matter.`);

  // E2/E3 — códigos de erro
  const mapa = new Set();
  const httpN3 = []; // [código, http, onde]
  for (const tb of tabelas(secao(lines, 'Mapeamento de erros'))) {
    const iH = tb.cab.findIndex((h) => /^http/.test(h));
    for (const { c, linha } of tb.linhas) for (const t of codigos(c[0])) {
      mapa.add(t);
      if (iH >= 0 && httpsDe(c[iH]).length) httpN3.push([t, httpsDe(c[iH]), `linha ${linha} (Mapeamento de erros)`]);
    }
  }
  const fmCod = new Set(frontMatterLista(lines, 'error_codes') || []);
  for (const t of fmCod) if (!mapa.has(t)) erros.push(`E2 error_codes: ${t} está no front-matter e não no \`## Mapeamento de erros\`.`);
  for (const t of mapa) if (!fmCod.has(t) && !globais.has(t)) erros.push(`E2 ${t} está no \`## Mapeamento de erros\` e falta em \`error_codes\` do front-matter.`);
  const daApi = new Map();
  const tabsApi = tabelas(api);
  for (const tb of tabsApi) {
    const i = tb.cab.findIndex((h) => /^(code|codigo)$/.test(h));
    if (i < 0) continue;
    const iH = tb.cab.findIndex((h) => /^(http|status)/.test(h));
    for (const { c, linha } of tb.linhas) for (const t of codigos(c[i])) {
      if (!daApi.has(t)) daApi.set(t, linha);
      if (iH >= 0 && httpsDe(c[iH]).length) httpN3.push([t, httpsDe(c[iH]), `linha ${linha} (API)`]);
    }
  }
  for (const [t, linha] of daApi) if (!mapa.has(t) && !globais.has(t)) erros.push(`E3 linha ${linha}: a API devolve ${t}, que não está no \`## Mapeamento de erros\` — sem mensagem ao usuário.`);

  // E4 — existe no dicionário
  if (dic) {
    for (const t of new Set([...mapa, ...fmCod, ...daApi.keys()])) if (!dic.todos.has(t)) erros.push(`E4 ${t} não existe no global/ERROR-DICTIONARY.md — registre-o lá (código novo é proposto com ⚠️ e aprovado).`);
    // E6 — o HTTP do código é o do dicionário
    const vistos = new Set();
    for (const [t, h, onde] of httpN3) {
      const hd = dic.http.get(t);
      if (!hd || h.includes(hd) || vistos.has(`${t} ${onde}`)) continue;
      vistos.add(`${t} ${onde}`);
      erros.push(`E6 ${onde}: ${t} com HTTP ${h.join(' · ')}, e o ERROR-DICTIONARY diz ${hd} — o status do código é um só; corrija o N3 ou o dicionário.`);
    }
  }

  // E5 — campo da API aponta para campo da funcionalidade
  const labels = new Set();
  for (const [nomeSec, re] of [['Campos', /^label po/], ['Campos automáticos', /^label po/], ['Colunas do resultado', /^coluna/]]) {
    for (const tb of tabelas(secao(lines, nomeSec))) {
      const i = tb.cab.findIndex((h) => re.test(h));
      if (i < 0) continue;
      for (const { c } of tb.linhas) {
        const cel = c[i] || '';
        labels.add(norm(cel.replace(/→.*$/, '')));
        const canon = cel.match(/→\s*ver\s+FIELD-DICTIONARY:\s*([^|(]+)/i);
        if (canon) labels.add(norm(canon[1]));
      }
    }
  }
  let tabelasDeCampo = 0;
  for (const tb of tabsApi) {
    const iL = tb.cab.findIndex((h) => /^label po/.test(h));
    if (iL < 0 || !tb.cab.some((h) => /^campo/.test(h))) continue;
    tabelasDeCampo++;
    for (const { c, linha } of tb.linhas) {
      const v = (c[iL] || '').trim();
      if (!v || /^[—–-]+$/.test(v) || /^\[[^\]]*\]$/.test(v)) continue;
      if (!labels.has(norm(v.replace(/→.*$/, '')))) erros.push(`E5 linha ${linha}: o campo da API aponta para "${v}", que não está em \`## Campos\`, \`## Campos automáticos\` nem \`## Colunas do resultado\` — corrija o Label PO ou use \`—\` se o campo é técnico.`);
    }
  }
  if (rotas.size && !tabelasDeCampo) avisos.push('`## API` sem tabela de campos (Campo | Tipo | … | Label PO): o corpo ainda é exemplo, e o tipo de cada campo fica por conta de quem lê. Formato: template do N3, 6.3.0.');
  return { erros, avisos };
}

function n3s(alvos) {
  const out = [];
  const anda = (p) => {
    if (statSync(p).isDirectory()) { for (const n of readdirSync(p)) if (!n.startsWith('.')) anda(join(p, n)); }
    else if (/^f-.+\.md$/.test(p.split(/[\\/]/).pop())) out.push(p);
  };
  for (const a of alvos) { try { anda(a); } catch { /* alvo ausente */ } }
  return out.sort();
}

const args = process.argv.slice(2);
const arquivos = n3s(args.length ? args : [join(ROOT, 'modules')]);
let total = 0, comErro = 0, semTabela = 0;
for (const a of arquivos) {
  const { erros, avisos } = confere(a);
  if (avisos.length) { semTabela++; if (arquivos.length <= 5) console.log(`⚠ ${rel(a)}\n    ${avisos.join('\n    ')}`); }
  if (!erros.length) continue;
  comErro++; total += erros.length;
  console.log(`✗ ${rel(a)}`);
  for (const e of erros) console.log(`    ${e}`);
}
const nota = semTabela ? ` ${semTabela} N3 com a API ainda em exemplo, sem tabela de campos (aviso).` : '';
if (total) {
  console.log(`\n${total} problema(s) em ${comErro} N3. O front-matter espelha \`## API\` e \`## Mapeamento de erros\`; todo código existe no ERROR-DICTIONARY; todo campo da API aponta para um campo da funcionalidade.${nota}`);
  process.exit(1);
}
console.log(`✓ ${arquivos.length} N3 conferido(s): o contrato da API concorda com o front-matter, o Mapeamento de erros, o ERROR-DICTIONARY e os campos da funcionalidade.${nota}`);
