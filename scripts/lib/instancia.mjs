// instancia.mjs — o que o MASTER declara sobre o jeito de trabalhar da instância, e o
// que daí se deriva para a esteira e para as branches.
//
// Duas linhas do `global/MASTER.md`, lidas como o gates.py lê o Perfil:
//   - **Perfil**: `completo` | `requisitos`   → até onde vai a esteira do N3
//   - **Cadência**: `história` | `sprint`      → a unidade de entrega, e a branch dela
//
// A `main` só recebe o que foi ENTREGUE (decisão do PO, 2026-10-05). O trabalho em
// andamento vive na branch da unidade de entrega:
//   cadência `história` → `historia/<CHAVE>`  — a AIMM do ticket; merge = a história entregue
//   cadência `sprint`   → `sprint/<id>`       — a AIMM da sprint (`AIMM-<id>.md`) e as dos
//                                                tickets planejados; merge = a sprint
//                                                fechada, só com o que foi entregue
// Sem a linha Cadência, nada disso é exigido (instâncias anteriores à 6.0.0).

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { STORY_KEY_RE } from './trace-index.mjs';
import { impactFiles, impactKey } from './impact-files.mjs';

const semAcento = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

function linhaDoMaster(root, rotulo) {
  let texto = '';
  try { texto = readFileSync(join(root, 'global', 'MASTER.md'), 'utf8'); } catch { return null; }
  const m = texto.match(new RegExp(`\\*\\*${rotulo}\\*\\*\\s*:?\\s*\`?([^\`\\n|]+?)\`?\\s*(?:$|\\n|—|\\|)`, 'im'));
  return m ? semAcento(m[1]) : null;
}

// Ausente ou desconhecido → `requisitos` (o mesmo default do gates.py).
export function perfilDa(root) {
  const v = linhaDoMaster(root, 'Perfil');
  return v === 'completo' ? 'completo' : 'requisitos';
}

// `historia` | `sprint` | null (não declarada).
export function cadenciaDa(root) {
  const v = linhaDoMaster(root, 'Cad[êe]ncia');
  return v === 'historia' || v === 'sprint' ? v : null;
}

// O estado em que a esteira do N3 termina — espelho do `estado_final()` do gates.py
// (ESTEIRA_POR_PERFIL + ESTADO_POR_PERFIL), que exige PyYAML; os scripts JS rodam no
// hook, onde ele pode faltar. O eval 46 confere que os dois concordam.
export const ESTADO_FINAL = { completo: 'implementado', requisitos: 'especificado' };

// A branch é de uma unidade de entrega? `sprint/42` → { tipo: 'sprint', id: '42' };
// `historia/STRY0012345` → { tipo: 'historia', id: 'STRY0012345' }; outra → null.
export function unidadeDaBranch(nome) {
  const m = String(nome || '').replace(/^refs\/heads\//, '').replace(/^origin\//, '').match(/^(sprint|historia)\/(.+)$/);
  return m ? { tipo: m[1], id: m[2] } : null;
}

// ── commits da unidade de entrega ────────────────────────────────────────────
// Na cadência `sprint`, todo commit que toca a spec cita UMA chave no assunto — a do
// ticket, ou o id da sprint nos commits da AIMM da sprint. É o que deixa o reverte-ticket
// tirar uma história da branch sem arrastar outra.

// Caminhos de spec: o que vai para a `main` como o retrato do que foi entregue.
export const SPEC_RE = /^(modules|global|qa|prototypes|analise-impacto)\//;
// Artefatos regenerados por script (espelho da esteira, diagrama ER, índice de uso dos
// dicionários): um commit só com eles pode vir marcado `[gerado]`, sem chave — o
// reverte-ticket manda regenerá-los depois do revert.
export const GERADO_RE = /^(modules\/INDEX\.md|global\/DIAGRAMA-ER\.md|global\/[A-Z-]+-DICTIONARY\.md)$/;

// Chaves que o assunto cita: as do formato de ticket conhecido (STORY_KEY_RE) e as de toda
// AIMM que existe na instância — o que cobre chave de ferramenta nova e o id da sprint.
export function chavesDoAssunto(assunto, chavesConhecidas = []) {
  const achadas = new Set();
  for (const m of String(assunto).matchAll(new RegExp(STORY_KEY_RE.source, 'gi'))) achadas.add(m[0].toUpperCase());
  for (const k of chavesConhecidas) {
    const re = new RegExp(`(^|[^\\w-])${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[^\\w-])`, 'i');
    if (re.test(assunto)) achadas.add(k.toUpperCase());
  }
  return [...achadas];
}

// As chaves das AIMMs da instância (`analise-impacto/AIMM-<CHAVE>.md`, sem os templates).
export function chavesDasAims(root) {
  return impactFiles(join(root, 'analise-impacto')).map(impactKey);
}

export function git(root, ...a) {
  return execFileSync('git', ['-C', root, ...a], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

// A branch atual do repositório em `root`. O GITHUB_HEAD_REF só vale com o HEAD destacado
// — o checkout do PR no CI —: ele diz a branch do PR que disparou o job, não a de qualquer
// repositório que o processo consulte (o eval 47, rodando no CI do engine, monta o seu).
export function branchAtual(root) {
  let b = null;
  try { b = git(root, 'rev-parse', '--abbrev-ref', 'HEAD'); } catch { /* fora do git */ }
  return b && b !== 'HEAD' ? b : (process.env.GITHUB_HEAD_REF || b);
}

// Commits próprios da branch, do mais antigo ao mais novo, sem os de merge — o que entrou
// na base depois que a branch saiu não conta. Cada um: { sha, assunto, arquivos }.
export function commitsDaBranch(root, base) {
  const mb = git(root, 'merge-base', base, 'HEAD');
  const shas = git(root, 'rev-list', '--reverse', '--no-merges', `${mb}..HEAD`).split('\n').filter(Boolean);
  return shas.map((sha) => ({
    sha,
    assunto: git(root, 'log', '-1', '--format=%s', sha),
    arquivos: git(root, 'diff-tree', '--no-commit-id', '--name-only', '-r', sha).split('\n').filter(Boolean),
  }));
}
