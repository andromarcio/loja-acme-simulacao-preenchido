#!/usr/bin/env node
// valida-contagem-consolidada.mjs — o consolidado espelha a fonte, ou não vale.
//
// A contagem se faz no N3 (`## Métricas de tamanho`) e no DATA-MODEL; o
// `global/CONTAGEM-PF.md` é espelho. Regra em texto é sugestão — esta checagem a
// torna garantia em duas frentes:
//
//   1. O NÚMERO: confronta cada linha contada do N3 com a linha correspondente do
//      consolidado e acusa PF divergente, PE contado que o consolidado ignora e linha
//      do consolidado sem fonte no N3. Funcionalidade com a contagem PENDENTE é exceção: só o
//      CT espelha no consolidado, então a diferença é esperada até ele — sai como
//      "aguardando a revisão", não como erro.
//   2. A PENDÊNCIA: o status de contagem mora no front-matter (`contagem.pendente`) e
//      tem dois espelhos — `## Pendências de contagem` do consolidado e a coluna
//      Contagem da rastreabilidade do `modules/INDEX.md` (📋 pendente · ✅ revisada). O
//      passo 5 do PROMPT_CONTAGEM reconcilia os três; esta checagem acusa o que ficou
//      para trás. N3 sem o bloco `contagem` (anteriores a ele) ficam de fora, contados.
//   3. O PAPEL (SIZING.md → Papel do PE em relação à funcionalidade): a tabela de `## Métricas
//      de tamanho` tem a coluna Papel, e toda linha medida diz `principal` ou `acessório`
//      — a linha `↪` e a ainda não medida (PF `—`) saem com `—`. O consolidado espelha
//      a coluna: por funcionalidade, a soma de PF dos PE `principal` tem de bater com a da
//      fonte. Avisos, não erros: funcionalidade contada sem nenhum `principal` (o PE que a
//      realiza não foi contado) e EE `acessório` que não é principal em funcionalidade nenhuma.
//
// Uso: node scripts/valida-contagem-consolidada.mjs [raiz-da-instância]
// Saída: 0 se espelham; 1 se houver divergência; 2 em erro de uso.

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';
import { frontMatterBloco } from './lib/front-matter.mjs';

const ROOT = resolve(process.argv[2] || '.');
const CONS = join(ROOT, 'global', 'CONTAGEM-PF.md');
const INDEX = join(ROOT, 'modules', 'INDEX.md');
if (!existsSync(join(ROOT, 'modules'))) {
  console.error(`✗ Não parece uma instância (sem modules/): ${ROOT}`);
  process.exit(2);
}
if (!existsSync(CONS)) {
  console.log('- global/CONTAGEM-PF.md não existe — nada a conferir.');
  process.exit(0);
}

const walk = (d, out = []) => {
  for (const n of readdirSync(d)) {
    if (n === '.git' || n === 'node_modules') continue;
    const p = join(d, n);
    statSync(p).isDirectory() ? walk(p, out) : out.push(p);
  }
  return out;
};

const ID_RE = /\b([A-Z]{3}-[A-Z]{3}-\d{2})\b/;
const idOf = (raw) => {
  const l = raw.split(/\r?\n/).find((x) => /N[íi]vel 3/.test(x));
  return (l && (l.match(/`([A-Z]{3}-[A-Z]{3}-\d{2})`/) || [])[1]) || null;
};

// Toda leitura de tabela é guiada pelo CABEÇALHO, nunca por posição: instâncias
// diferentes têm colunas diferentes, e adivinhar posição faz uma linha com PF `—`
// devolver o DER como se fosse PF — número errado com cara de número certo.
const celulas = (l) => l.trim().replace(/^\||\|$/g, '').split('|').map((x) => x.trim());
const ehSeparador = (l) => /^\|[\s\-:|]+\|$/.test(l.trim());

// Percorre uma tabela markdown a partir de `linhas`, devolvendo {cab, linhas:[cells]}.
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
const idxPF = (cab) => (cab || []).findIndex((c) => /^PF$/i.test(c));
const idxPapel = (cab) => (cab || []).findIndex((c) => /^Papel$/i.test(c));
const idxTipo = (cab) => (cab || []).findIndex((c) => /^Tipo$/i.test(c));
const PAPEIS = new Set(['principal', 'acessório']);
const medida = (v) => /^\d+$/.test(v || '');

// Papel de cada PE da tabela de `## Métricas de tamanho`: `undefined` sem a tabela,
// `null` com a tabela e sem a coluna; senão { linhas: [{ nome, papel, tipo, pf }] }.
function papeisDoN3(raw) {
  const ls = raw.split(/\r?\n/);
  const i = ls.findIndex((l) => /^##\s+Métricas de tamanho\s*$/.test(l));
  if (i < 0) return undefined;
  const { cab, linhas } = tabela(ls, i + 1, (l) => /^#{2,3}\s/.test(l));
  if (!cab || !linhas.length) return undefined;
  const iPapel = idxPapel(cab);
  if (iPapel < 0) return null;
  const iTipo = idxTipo(cab), iPF = idxPF(cab);
  return {
    linhas: linhas.map((c) => ({
      nome: (c[0] || '').replace(/[`*]/g, '').trim(),
      papel: (c[iPapel] || '').trim(),
      tipo: iTipo >= 0 ? (c[iTipo] || '').trim() : '',
      pf: iPF >= 0 ? (c[iPF] || '').trim() : '',
    })),
  };
}
const pfPrincipal = (ls) => ls.filter((l) => l.papel === 'principal' && medida(l.pf)).reduce((a, l) => a + Number(l.pf), 0);

// PF total de um N3: soma a coluna PF da PRIMEIRA tabela de `## Métricas de tamanho`
// (a `### Memória de cálculo` mora na mesma seção e também tem números).
function pfDoN3(raw) {
  const ls = raw.split(/\r?\n/);
  const i = ls.findIndex((l) => /^##\s+Métricas de tamanho\s*$/.test(l));
  if (i < 0) return null;
  const { cab, linhas } = tabela(ls, i + 1, (l) => /^#{2,3}\s/.test(l));
  const iPF = idxPF(cab);
  if (iPF < 0) return null;
  let total = 0, contou = false;
  for (const c of linhas) {
    const v = c[iPF];
    if (/^\d+$/.test(v)) { total += Number(v); contou = true; }
  }
  return contou ? total : null;
}

const n3 = walk(join(ROOT, 'modules')).filter((p) => /(?:^|[\\/])f-[^\\/]+\.md$/.test(p));
const fonte = new Map(); // ID -> { pf, arquivo }
const papeisFonte = new Map(); // ID -> { linhas | null, arquivo }
const status = new Map(); // ID -> { pendente: 'true' | 'false', arquivo } — só com o bloco `contagem`
const idsN3 = new Set();
let semBloco = 0;
for (const p of n3) {
  const raw = readFileSync(p, 'utf8');
  const id = idOf(raw);
  if (!id) continue;
  idsN3.add(id);
  const arquivo = relative(ROOT, p);
  const pf = pfDoN3(raw);
  if (pf !== null) fonte.set(id, { pf, arquivo });
  const pt = papeisDoN3(raw);
  if (pt !== undefined) papeisFonte.set(id, { linhas: pt && pt.linhas, arquivo });
  const bloco = frontMatterBloco(raw.split(/\r?\n/), 'contagem');
  if (bloco && /^(true|false)$/.test(bloco.pendente || '')) status.set(id, { pendente: bloco.pendente, arquivo });
  else semBloco++;
}

// Consolidado: soma a coluna PF por ID (um ID pode render várias linhas — ex.: um PE
// por formato de saída). O ID pode estar em qualquer célula da linha. De quebra, os IDs
// listados em `## Pendências de contagem` (a tabela da seção, sem coluna PF).
const consolidado = new Map();
const principalCons = new Map(); // ID -> soma de PF das linhas `principal`
let consTemPapel = false;
let pendentesCons = null; // Set de IDs, ou null se o consolidado não tem a seção
{
  const ls = readFileSync(CONS, 'utf8').split(/\r?\n/);
  for (let i = 0; i < ls.length; i++) {
    if (!ls[i].trim().startsWith('|')) continue;
    const { cab, linhas } = tabela(ls, i, (l) => /^#{1,3}\s/.test(l));
    const iPF = idxPF(cab);
    const iPap = idxPapel(cab);
    if (iPF >= 0 && idxTipo(cab) >= 0) consTemPapel = consTemPapel || iPap >= 0; // tabela de PE, não a de ALI/AIE
    if (iPF >= 0) {
      for (const c of linhas) {
        const id = (c.join(' ').match(ID_RE) || [])[1];
        const v = c[iPF];
        if (!id || !/^\d+$/.test(v)) continue;
        consolidado.set(id, (consolidado.get(id) || 0) + Number(v));
        if (iPap >= 0 && (c[iPap] || '').trim() === 'principal') principalCons.set(id, (principalCons.get(id) || 0) + Number(v));
      }
    }
    while (i < ls.length && ls[i].trim().startsWith('|')) i++;
  }
  const iPend = ls.findIndex((l) => /^##\s+Pendências de contagem\s*$/.test(l));
  if (iPend >= 0) {
    pendentesCons = new Set();
    const { linhas } = tabela(ls, iPend + 1, (l) => /^#{1,2}\s/.test(l));
    for (const c of linhas) {
      const id = (c.join(' ').match(ID_RE) || [])[1]; // a linha-exemplo `[ID](…)` não tem ID
      if (id) pendentesCons.add(id);
    }
  }
}

// Coluna Contagem da rastreabilidade do INDEX.md: ID → 'true' (📋) | 'false' (✅).
// Um ID pode ter várias linhas (uma por ticket); todas têm de concordar.
const contagemIndex = new Map(); // ID -> Set de 'true'|'false'
let indexTemColuna = false;
if (existsSync(INDEX)) {
  const ls = readFileSync(INDEX, 'utf8').split(/\r?\n/);
  for (let i = 0; i < ls.length; i++) {
    if (!ls[i].trim().startsWith('|')) continue;
    const { cab, linhas } = tabela(ls, i, (l) => /^#{1,3}\s/.test(l));
    const iCont = (cab || []).findIndex((c) => /^Contagem$/i.test(c));
    const iFeat = (cab || []).findIndex((c) => /^(?:Funcionalidade|Feature)/i.test(c));
    if (iCont >= 0 && iFeat >= 0) {
      indexTemColuna = true;
      for (const c of linhas) {
        const id = ((c[iFeat] || '').match(ID_RE) || [])[1];
        const cel = c[iCont] || '';
        const v = cel.includes('📋') ? 'true' : cel.includes('✅') ? 'false' : null;
        if (!id || !v) continue;
        if (!contagemIndex.has(id)) contagemIndex.set(id, new Set());
        contagemIndex.get(id).add(v);
      }
    }
    while (i < ls.length && ls[i].trim().startsWith('|')) i++;
  }
}

// Funcionalidade com a contagem PENDENTE ainda não passou pelo CT, o único que espelha no
// consolidado: diferença de PF é o estado esperado (a passada técnica contou, o 4B
// recontou), não erro. Vira `aguardando`; o erro fica para a funcionalidade já revisada.
const aguardando = new Set();
const erros = [];
const divergePF = (id, msg) => (status.get(id)?.pendente === 'true' ? aguardando.add(id) : erros.push(msg));
for (const [id, { pf, arquivo }] of fonte) {
  if (!consolidado.has(id)) {
    divergePF(id, `${id} — contado no N3 (${pf} PF) e ausente do consolidado · ${arquivo}`);
  } else if (consolidado.get(id) !== pf) {
    divergePF(id, `${id} — N3 diz ${pf} PF, consolidado diz ${consolidado.get(id)} PF · ${arquivo}`);
  }
}
for (const id of consolidado.keys()) {
  if (!fonte.has(id)) {
    divergePF(id, `${id} — linha no consolidado sem contagem no N3 (o consolidado não inventa número)`);
  }
}

const pendencias = [];
const avisos = [];
const errosPapel = [];

// Papel — a coluna existe no N3, toda linha medida tem papel válido, e o consolidado a
// espelha (soma de PF dos principais por funcionalidade).
const principais = new Set();
for (const { linhas } of papeisFonte.values()) for (const l of linhas || []) if (l.papel === 'principal') principais.add(l.nome);
for (const [id, { linhas, arquivo }] of papeisFonte) {
  if (linhas === null) { errosPapel.push(`${id} — \`## Métricas de tamanho\` sem a coluna Papel (principal · acessório) · ${arquivo}`); continue; }
  const maus = linhas.filter((l) => medida(l.pf) && !PAPEIS.has(l.papel)).map((l) => l.papel || '(vazio)');
  if (maus.length) errosPapel.push(`${id} — Papel inválido em linha medida: ${[...new Set(maus)].map((v) => `"${v}"`).join(', ')} (use principal ou acessório) · ${arquivo}`);
  if (linhas.some((l) => medida(l.pf)) && !linhas.some((l) => l.papel === 'principal' && medida(l.pf))) {
    avisos.push(`${id} — nenhum PE \`principal\` contado: o PE que realiza a funcionalidade não está contado. Registre a lacuna com ⚠️; não promova um acessório · ${arquivo}`);
  }
  for (const l of linhas) {
    if (l.papel === 'acessório' && /^EE$/i.test(l.tipo) && !principais.has(l.nome)) {
      avisos.push(`${id} · ${l.nome} — EE \`acessório\` que não é principal em funcionalidade nenhuma: ação que grava ou altera dado de negócio sem funcionalidade que a realize — ou é principal desta, ou é funcionalidade própria (SIZING.md → Papel do PE) · ${arquivo}`);
    }
  }
  if (consTemPapel && consolidado.has(id) && linhas.length && !maus.length) {
    const fontePrin = pfPrincipal(linhas), consPrin = principalCons.get(id) || 0;
    if (fontePrin !== consPrin) divergePF(id, `${id} — PF dos PE principal: N3 diz ${fontePrin}, consolidado diz ${consPrin} (coluna Papel) · ${arquivo}`);
  }
}
if (consolidado.size && !consTemPapel) errosPapel.push('global/CONTAGEM-PF.md — a tabela de Funções de Transação não tem a coluna Papel (espelho da fonte; ver o template).');
if (pendentesCons) {
  for (const [id, { pendente, arquivo }] of status) {
    if (pendente === 'true' && !pendentesCons.has(id)) {
      pendencias.push(`${id} — contagem.pendente: true no front-matter, mas fora de ## Pendências de contagem · ${arquivo}`);
    } else if (pendente === 'false' && pendentesCons.has(id)) {
      pendencias.push(`${id} — em ## Pendências de contagem, mas o front-matter diz revisada (pendente: false) · ${arquivo}`);
    }
  }
  for (const id of pendentesCons) {
    if (!idsN3.has(id)) pendencias.push(`${id} — em ## Pendências de contagem, mas nenhum N3 tem esse ID`);
  }
} else {
  avisos.push('global/CONTAGEM-PF.md sem a seção ## Pendências de contagem — crie-a a partir do template para conferir as pendências.');
}
for (const [id, vals] of contagemIndex) {
  const s = status.get(id);
  if (!s) continue; // N3 sem o bloco contagem: nada a comparar
  const icone = (v) => (v === 'true' ? '📋 pendente' : '✅ revisada');
  for (const v of vals) {
    if (v !== s.pendente) {
      pendencias.push(`${id} — coluna Contagem do INDEX.md diz ${icone(v)}, o front-matter diz ${icone(s.pendente)} · ${s.arquivo}`);
    }
  }
}

const nPend = [...status.values()].filter((s) => s.pendente === 'true').length;
console.log(`${fonte.size} funcionalidade(s) contada(s) no N3 · ${consolidado.size} no consolidado`);
console.log(`${nPend} pendente(s) no front-matter · ${pendentesCons ? pendentesCons.size : '—'} em ## Pendências de contagem` +
  `${indexTemColuna ? '' : ' · INDEX.md sem a coluna Contagem'}${semBloco ? ` · ${semBloco} N3 sem o bloco contagem (fora desta conferência)` : ''}`);
for (const a of avisos) console.log(`- ${a}`);
if (aguardando.size) {
  console.log(`- ${aguardando.size} funcionalidade(s) aguardando a revisão pelo CT — contagem pendente, número ainda fora do consolidado: ${[...aguardando].sort().join(', ')}`);
}
if (!erros.length && !pendencias.length && !errosPapel.length) {
  console.log(aguardando.size
    ? '✓ O consolidado espelha a fonte nas funcionalidades revisadas; as pendentes esperam o CT.'
    : '✓ O consolidado espelha a fonte.');
  process.exit(0);
}
if (erros.length) {
  console.error(`\n✗ ${erros.length} divergência(s) de PF — a fonte manda; o consolidado a espelha:`);
  for (const e of erros) console.error(`  - ${e}`);
  console.error('\nCorrija na FONTE (## Métricas de tamanho do N3) e reflita no consolidado.');
}
if (errosPapel.length) {
  console.error(`\n✗ ${errosPapel.length} problema(s) na coluna Papel — toda linha medida diz principal ou acessório, e o consolidado a espelha:`);
  for (const e of errosPapel) console.error(`  - ${e}`);
  console.error('\nVer SIZING.md → Papel do PE em relação à funcionalidade.');
}
if (pendencias.length) {
  console.error(`\n✗ ${pendencias.length} divergência(s) de pendência de contagem — o front-matter manda:`);
  for (const e of pendencias) console.error(`  - ${e}`);
  console.error('\nAcerte ## Pendências de contagem e a coluna Contagem do INDEX.md pelo contagem.pendente de cada N3 (passo 5 do PROMPT_CONTAGEM).');
}
process.exit(1);
