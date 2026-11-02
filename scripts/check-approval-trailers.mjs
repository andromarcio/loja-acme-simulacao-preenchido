#!/usr/bin/env node
// check-approval-trailers.mjs — trilha de aprovação PORTÁTIL: a aprovação de uma
// mudança de especificação fica registrada no PRÓPRIO git (trailer no commit), não
// só no banco do GitHub. Migrou de forge? `git clone` leva a trilha junto.
//
// Convenção do framework:
//   Todo commit que ENTRA no branch principal tocando artefatos de especificação
//   (modules/ ou global/) carrega, no rodapé da mensagem, quem aprovou:
//
//     Approved-by: Nome Sobrenome <email@dominio>
//
//   • merge via PR      → no último parágrafo da mensagem do merge/squash commit: no fim
//                         da descrição do PR, se o repositório usa "Pull request title and
//                         description" como mensagem padrão; senão, editada na hora do merge;
//   • commit direto     → git commit --amend (ou -m com o trailer no rodapé);
//   • mais de um aprovador → um trailer por linha.
//
// Uso:
//   node scripts/check-approval-trailers.mjs                    # HEAD
//   node scripts/check-approval-trailers.mjs <sha>              # um commit
//   node scripts/check-approval-trailers.mjs --range A..B       # merge commits do intervalo
//   node scripts/check-approval-trailers.mjs --range A..B --all # todos os commits (fluxo squash)
//
// Por padrão só MERGE commits são exigidos (commits de trabalho não precisam de
// trailer), e só os da linha principal (--first-parent): o merge do PR já carrega o
// que os merges de dentro da branch trouxeram — o "Update branch" e a incorporação
// de outra branch não pedem aval próprio. Em fluxo squash-merge não há merge commit
// — use --all no intervalo do push. Commits que não tocam modules/|global/ são
// ignorados.
// Exit: 0 ok; 1 commit exigido sem trailer; 2 erro de uso/git.

import { execFileSync } from 'node:child_process';

const args = process.argv.slice(2);
const has = (f) => args.includes(f);
function argOf(flag) {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : null;
}
if (has('--help') || has('-h')) {
  console.log('Uso: node scripts/check-approval-trailers.mjs [<sha> | --range A..B [--all]]');
  process.exit(2);
}

function git(...a) {
  return execFileSync('git', a, { encoding: 'utf8' }).trim();
}
try { git('rev-parse', '--git-dir'); } catch {
  console.error('check-approval-trailers: fora de um repositório git.');
  process.exit(2);
}

const SPEC_PATH_RE = /^(modules|global)\//;

function isMerge(sha) {
  return git('rev-list', '--parents', '-n', '1', sha).split(/\s+/).length > 2;
}
function touchedSpecPaths(sha) {
  // No merge, o diff contra o 1º pai mostra o que o merge TROUXE para o branch.
  const base = isMerge(sha) ? `${sha}^1` : `${sha}^`;
  let files = '';
  try { files = git('diff', '--name-only', base, sha); } catch {
    // commit raiz (sem pai)
    files = git('show', '--name-only', '--format=', sha);
  }
  return files.split(/\r?\n/).filter((f) => SPEC_PATH_RE.test(f));
}
function approvers(sha) {
  const out = git('log', '-1', '--format=%(trailers:key=Approved-by,valueonly)', sha);
  return out.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
}

const range = argOf('--range');
let commits;
try {
  if (range) {
    const all = git('rev-list', '--reverse', ...(has('--all') ? [] : ['--first-parent']), range).split(/\r?\n/).filter(Boolean);
    commits = has('--all') ? all : all.filter(isMerge);
    if (!commits.length) {
      console.log(`✓ check-approval-trailers: nenhum ${has('--all') ? 'commit' : 'merge commit'} no intervalo ${range} — nada a exigir.`);
      process.exit(0);
    }
  } else {
    commits = [git('rev-parse', args.find((a) => !a.startsWith('-')) || 'HEAD')];
  }
} catch (e) {
  console.error(`check-approval-trailers: falha ao resolver commits — ${e.message}`);
  process.exit(2);
}

let failed = 0;
for (const sha of commits) {
  const short = sha.slice(0, 12);
  const subject = git('log', '-1', '--format=%s', sha);
  const spec = touchedSpecPaths(sha);
  if (!spec.length) {
    console.log(`· ${short} não toca modules/|global/ — dispensado. (${subject})`);
    continue;
  }
  const who = approvers(sha);
  if (who.length) {
    console.log(`✓ ${short} aprovado por: ${who.join('; ')} (${subject})`);
  } else {
    failed++;
    console.error(`✗ ${short} toca especificação (${spec.length} arquivo(s): ${spec.slice(0, 3).join(', ')}${spec.length > 3 ? ', …' : ''}) SEM trailer de aprovação. (${subject})`);
  }
}

if (failed) {
  console.error('');
  console.error(`✗ ${failed} commit(s) de especificação sem "Approved-by:".`);
  console.error('  Adicione no rodapé da mensagem do merge/squash commit (uma linha por aprovador):');
  console.error('    Approved-by: Nome Sobrenome <email@dominio>');
  process.exit(1);
}
console.log('✓ check-approval-trailers: trilha de aprovação em ordem.');
process.exit(0);
