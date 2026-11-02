#!/usr/bin/env node
// audit-trace-links.mjs — gate DETERMINÍSTICO da consistência dos elos ticket ↔ funcionalidade.
// É a metade estrutural do PROMPT_AUDIT_TRACE_LINKS (AT): o script prova que os três
// lugares concordam; o prompt continua responsável pela parte semântica (o elo faz
// sentido? os critérios cobertos batem?).
//
// As três fontes que precisam concordar (convenção do framework):
//   1. `## Origem` de cada N3                          (funcionalidade → ticket)
//   2. `## Funcionalidades` da AIMM do ticket, `analise-impacto/AIMM-<CHAVE>.md` (ticket → funcionalidade)
//   3. tabela `## Rastreabilidade: …` do `modules/INDEX.md` (uma linha por par)
//
// Uso (a partir da raiz da instância, ou com --root):
//   node scripts/audit-trace-links.mjs                 # instância inteira
//   node scripts/audit-trace-links.mjs --file <caminho.md>  # só pares que tocam o arquivo
//   node scripts/audit-trace-links.mjs --root <dir>
//
// Achados que REPROVAM (exit 1): elo unilateral, par fora do INDEX, linha do INDEX
// sem respaldo nos artefatos, status divergente, referência quebrada.
// Informativos (não reprovam): AIMM sem funcionalidade; funcionalidade da `## Funcionalidades` com o Status
// "📋 A especificar" e ainda sem N3 — o roteamento a propõe e o 3A a cria: enquanto
// não existe N3 com o ID, nem o par nem o link para o caminho proposto reprovam; com o
// N3 criado, valem as regras de sempre —; funcionalidade sem `## Origem` (legítimo no
// bottom-up/legado).
// Exit 0 se consistente; 2 em erro de uso. Sem modules/ no caminho → exit 0 (não é instância).

import { resolve } from 'node:path';
import {
  scanInstance, findInstanceRoot, featureById, storyByKey, resolveLink, ICONE_DO_ESTADO,
} from './lib/trace-index.mjs';

const args = process.argv.slice(2);
function argOf(flag) {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : null;
}
if (args.includes('--help') || args.includes('-h')) {
  console.log('Uso: node scripts/audit-trace-links.mjs [--root <dir>] [--file <artefato.md>]');
  process.exit(2);
}

const root = findInstanceRoot(argOf('--root') || process.cwd());
if (!root) {
  console.log('audit-trace-links: nenhuma instância (pasta modules/) encontrada — nada a auditar.');
  process.exit(0);
}
const onlyFile = argOf('--file') ? resolve(argOf('--file')).replace(/\\/g, '/') : null;

const model = scanInstance(root);
const feats = featureById(model);
const stories = storyByKey(model);

const hard = [];   // reprovam
const info = [];   // informativos

// Par (chave, featId) → presença em cada fonte.
const pairs = new Map();
const pairKey = (k, f) => `${k}::${f}`;
function pair(k, f) {
  const id = pairKey(k, f);
  if (!pairs.has(id)) pairs.set(id, { key: k, featId: f, inOrigem: false, inStory: false, inIndex: false, storyStatus: null, indexStatus: null, aEspecificar: false });
  return pairs.get(id);
}

for (const f of model.features) {
  if (!f.id) continue;
  for (const o of f.origem) pair(o.key, f.id).inOrigem = true;
}
for (const s of model.stories) {
  if (!s.key) continue;
  for (const fe of s.feats) {
    const p = pair(s.key, fe.id);
    p.inStory = true;
    p.storyStatus = fe.status;
    if (fe.aEspecificar) p.aEspecificar = true;
  }
}
if (model.index) {
  for (const r of model.index.rows) {
    const p = pair(r.key, r.featId);
    p.inIndex = true;
    p.indexStatus = r.status;
  }
}

// Escopo --file: só pares que envolvem o artefato gravado (INDEX → tudo).
function inScope(p) {
  if (!onlyFile) return true;
  if (model.index && resolve(model.index.file).replace(/\\/g, '/') === onlyFile) return true;
  const f = feats.get(p.featId);
  if (f && resolve(f.file).replace(/\\/g, '/') === onlyFile) return true;
  const s = stories.get(p.key);
  if (s && resolve(s.file).replace(/\\/g, '/') === onlyFile) return true;
  return false;
}

for (const p of [...pairs.values()].filter(inScope)) {
  const feat = feats.get(p.featId);
  const story = stories.get(p.key);

  // Lado citado mas artefato inexistente → referência quebrada de fato.
  if ((p.inOrigem || p.inIndex) && !story) {
    hard.push(`⚠️ ${p.key} ↔ ${p.featId}: ticket citado ${p.inOrigem ? `na ## Origem de ${feat ? feat.path : p.featId}` : 'no INDEX.md'}, mas não existe a AIMM analise-impacto/AIMM-${p.key}.md.`);
    continue;
  }
  if ((p.inStory || p.inIndex) && !feat) {
    // Funcionalidade que o ticket cria, ainda por especificar: pendência da rota 3A. Linha do
    // INDEX para ela, não — o INDEX só recebe o par quando o N3 nasce.
    if (p.aEspecificar && !p.inIndex) {
      info.push(`⚫ ${p.key} ↔ ${p.featId}: funcionalidade a especificar na ## Funcionalidades de ${story.path} — ainda sem N3 (rota 3A); o elo fecha quando o 3A a criar.`);
      continue;
    }
    hard.push(`⚠️ ${p.key} ↔ ${p.featId}: funcionalidade citada ${p.inStory ? `na ## Funcionalidades de ${story ? story.path : p.key}` : 'no INDEX.md'}, mas nenhum N3 tem esse ID.`);
    continue;
  }

  // Elo unilateral (o achado central).
  if (p.inOrigem && !p.inStory) {
    hard.push(`🔴 ${p.key} ↔ ${p.featId}: elo UNILATERAL — consta na ## Origem de ${feat.path}, falta na ## Funcionalidades de ${story.path}.`);
  }
  if (p.inStory && !p.inOrigem) {
    hard.push(`🔴 ${p.key} ↔ ${p.featId}: elo UNILATERAL — consta na ## Funcionalidades de ${story.path}, falta na ## Origem de ${feat.path}.`);
  }

  // INDEX fora de sincronia.
  if (model.index) {
    if (p.inOrigem && p.inStory && !p.inIndex) {
      hard.push(`🟠 ${p.key} ↔ ${p.featId}: par consistente nos dois artefatos, mas SEM linha na tabela de rastreabilidade do INDEX.md.`);
    }
    if (p.inIndex && !p.inOrigem && !p.inStory) {
      hard.push(`🟠 ${p.key} ↔ ${p.featId}: linha do INDEX.md sem respaldo — o par não consta nem na ## Origem nem na ## Funcionalidades da AIMM.`);
    }
  }

  // Status divergente (AIMM × INDEX — a ## Origem não carrega status).
  // ⚠️ no INDEX é tolerado: é a SINALIZAÇÃO de elo suspeito (suspect-links --mark),
  // que diverge de propósito até alguém reverificar — não é inconsistência de registro.
  if (p.storyStatus && p.indexStatus && p.indexStatus !== '⚠️' && p.storyStatus !== p.indexStatus) {
    hard.push(`🟡 ${p.key} ↔ ${p.featId}: status divergente — ${p.storyStatus} na AIMM, ${p.indexStatus} no INDEX.md.`);
  }
  // Status da AIMM × `estado` do N3 — a fonte. A tolerância ao ⚠️ acima vale para o
  // INDEX, onde o suspect-links marca; o N3 o suspect-links não toca, então ali o ⚠️ só
  // aparece declarado (PROMPT_4B), e a AIMM tem de dizer o mesmo. Sem esta conferência, a
  // funcionalidade alterada pelo ticket — ⚠️ no N3 e no INDEX, ✅ esquecido na AIMM — passava.
  const icone = feat && ICONE_DO_ESTADO[feat.estado];
  if (p.storyStatus && icone && p.storyStatus !== icone) {
    hard.push(`🟡 ${p.key} ↔ ${p.featId}: status divergente — ${p.storyStatus} na AIMM, ${icone} ${feat.estado} no N3 (${feat.path}).`);
  }
}

// Referências quebradas nas seções de rastreabilidade.
const refSources = [
  ...model.features.map((f) => ({ file: f.file, path: f.path, links: f.links })),
  ...model.stories.map((s) => ({ file: s.file, path: s.path, links: s.links })),
  ...(model.index ? [{ file: model.index.file, path: model.index.path, links: model.index.links }] : []),
];
for (const src of refSources) {
  if (onlyFile && resolve(src.file).replace(/\\/g, '/') !== onlyFile) continue;
  for (const l of src.links) {
    const r = resolveLink(src.file, l.target);
    if (!r || r.exists) continue;
    // O caminho proposto do N3 de uma funcionalidade a especificar só existe depois do 3A — o
    // par já saiu como informativo acima. Com o N3 criado noutro caminho, o link reprova.
    if (l.aEspecificar && !feats.get(l.aEspecificar)) continue;
    hard.push(`⚠️ ${src.path}: link quebrado na seção ${l.section} → "${l.target}" (arquivo não existe).`);
  }
}

// Órfãos (informativo).
for (const s of model.stories) {
  if (onlyFile && resolve(s.file).replace(/\\/g, '/') !== onlyFile) continue;
  if (!s.feats.length) info.push(`⚫ ${s.path}: AIMM ainda sem funcionalidade (ok enquanto o roteamento não termina — PROMPT_AIMM, passo 3).`);
}
for (const f of model.features) {
  if (onlyFile && resolve(f.file).replace(/\\/g, '/') !== onlyFile) continue;
  if (f.id && !f.origem.length) info.push(`⚫ ${f.path}: funcionalidade sem ## Origem preenchida (legítimo no bottom-up/legado).`);
}

// Relatório.
const scoped = onlyFile ? ` (escopo: ${onlyFile})` : '';
if (hard.length) {
  console.error(`✗ audit-trace-links: ${hard.length} inconsistência(s) de rastreabilidade${scoped}`);
  for (const h of hard) console.error(`    - ${h}`);
  if (info.length) {
    console.error('  Informativos (não reprovam):');
    for (const i of info) console.error(`    - ${i}`);
  }
  console.error('  Regra: todo par ticket↔funcionalidade fecha nos TRÊS lugares na mesma passada');
  console.error('  (## Origem do N3 + ## Funcionalidades da AIMM do ticket + linha do INDEX.md).');
  process.exit(1);
}
console.log(`✓ audit-trace-links: elos ticket↔funcionalidade consistentes nas três fontes${scoped} — ${pairs.size} par(es), ${model.stories.length} AIMM(s), ${model.features.length} funcionalidade(s).`);
for (const i of info) console.log(`    - ${i}`);
process.exit(0);
