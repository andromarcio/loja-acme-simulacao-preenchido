#!/usr/bin/env node
// suspect-links.mjs — "suspect links" no paradigma docs-as-code: detecta elos de
// rastreabilidade cujo ALVO mudou depois da última verificação.
//
// Mecanismo (o estado vive nos próprios .md — portátil junto com o repositório):
//   Ao fechar/rever um elo, um carimbo invisível é gravado no FIM da seção do elo,
//   registrando o FINGERPRINT do artefato do OUTRO lado (sha256 do conteúdo, ignorando
//   os próprios carimbos — assim carimbar A↔B não invalida B↔A):
//
//     N3, seção ## Origem:
//       <!-- trace-verified: STRY0012345 @ a1b2c3d4e5f6 -->   (fingerprint da AIMM do ticket)
//     AIMM do ticket, seção ## Funcionalidades:
//       <!-- trace-verified: USR-PRM-01 @ f6e5d4c3b2a1 -->    (fingerprint do N3)
//
//   Na AIMM, o fingerprint é só do que o ticket PEDE — a `## Descrição do ticket` e os
//   `## Critérios de aceite`. O resto da AIMM muda ao longo do processo (o changeset, a
//   visão final, a reconciliação) e não torna suspeito o elo da funcionalidade com o ticket.
//
//   Se o conteúdo do alvo mudar (commitado ou não), o fingerprint atual diverge do
//   carimbado e o elo fica SUSPEITO: o outro lado mudou e ninguém reverificou. O
//   PROMPT_4A/4B, ao atualizar a funcionalidade, re-carimba — o que limpa a suspeita.
//   Quando há git disponível, o relatório indica o último commit que tocou o alvo.
//
// Uso (a partir da raiz da instância, ou com --root):
//   node scripts/suspect-links.mjs                  # relatório; exit 1 se houver suspeito
//   node scripts/suspect-links.mjs --stamp          # (re)carimba todos os elos com o fingerprint atual do alvo
//   node scripts/suspect-links.mjs --stamp --file <artefato.md>   # carimba só um artefato
//   node scripts/suspect-links.mjs --mark           # relatório + marca ⚠️ no INDEX.md os pares suspeitos
//
// Elo sem carimbo é INFORMATIVO (instâncias anteriores ao mecanismo não reprovam).

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import {
  scanInstance, findInstanceRoot, featureById, storyByKey, sectionSlice, STAMP_RE, fingerprintOf,
} from './lib/trace-index.mjs';

const args = process.argv.slice(2);
const has = (f) => args.includes(f);
function argOf(flag) {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : null;
}
if (has('--help') || has('-h')) {
  console.log('Uso: node scripts/suspect-links.mjs [--root <dir>] [--stamp [--file <artefato.md>]] [--mark]');
  process.exit(2);
}

const root = findInstanceRoot(argOf('--root') || process.cwd());
if (!root) {
  console.log('suspect-links: nenhuma instância (pasta modules/) encontrada — nada a verificar.');
  process.exit(0);
}

// O fingerprint vem da lib (fingerprintOf): o mesmo que o migra-aim usa para recarimbar.

// Contexto opcional via git (último commit que tocou o alvo) — só enriquece a mensagem.
function lastCommitOf(file) {
  try {
    return execFileSync('git', ['-C', root, 'log', '-1', '--format=%h %ad', '--date=short', '--', file], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() || null;
  } catch { return null; }
}

const model = scanInstance(root);
const feats = featureById(model);
const stories = storyByKey(model);
const onlyFile = argOf('--file') ? resolve(argOf('--file')).replace(/\\/g, '/') : null;
const scopeOk = (file) => !onlyFile || resolve(file).replace(/\\/g, '/') === onlyFile;

// Elos a verificar: cada lado carimba o artefato do lado OPOSTO.
// { holder: artefato que carrega o carimbo, target: artefato observado }
const links = [];
for (const f of model.features) {
  if (!f.id) continue;
  for (const o of f.origem) {
    links.push({ holder: f, section: 'Origem', targetId: o.key, target: stories.get(o.key) || null });
  }
}
for (const s of model.stories) {
  if (!s.key) continue;
  for (const fe of s.feats) {
    links.push({ holder: s, section: 'Funcionalidades', targetId: fe.id, target: feats.get(fe.id) || null });
  }
}

// ---------------------------------------------------------------------------
// --stamp: (re)grava os carimbos com o fingerprint atual de cada alvo
// ---------------------------------------------------------------------------
if (has('--stamp')) {
  const byHolder = new Map();
  for (const l of links) {
    if (!scopeOk(l.holder.file)) continue;
    if (!byHolder.has(l.holder.file)) byHolder.set(l.holder.file, { holder: l.holder, entries: [] });
    byHolder.get(l.holder.file).entries.push(l);
  }

  let stamped = 0;
  const warns = [];
  for (const { holder, entries } of byHolder.values()) {
    const stampLines = [];
    for (const l of entries.sort((a, b) => a.targetId.localeCompare(b.targetId))) {
      if (!l.target) { warns.push(`⚠ ${holder.path}: alvo ${l.targetId} não encontrado na instância — elo não carimbado (feche o elo antes).`); continue; }
      stampLines.push(`<!-- trace-verified: ${l.targetId.toUpperCase()} @ ${fingerprintOf(l.target.file)} -->`);
    }
    if (!stampLines.length) continue;

    const raw = readFileSync(holder.file, 'utf8');
    const lines = raw.split(/\r?\n/);
    const sec = sectionSlice(lines, entries[0].section);
    if (!sec) continue;
    // Remove carimbos antigos da seção e insere os novos após a última linha de tabela.
    const kept = [];
    let lastTableIdx = -1;
    for (const line of sec.lines) {
      if (new RegExp(STAMP_RE.source).test(line.trim())) continue;
      kept.push(line);
      if (line.trim().startsWith('|')) lastTableIdx = kept.length - 1;
    }
    const insertAt = lastTableIdx >= 0 ? lastTableIdx + 1 : kept.length;
    kept.splice(insertAt, 0, ...stampLines);
    lines.splice(sec.start + 1, sec.end - sec.start - 1, ...kept);
    writeFileSync(holder.file, lines.join('\n'));
    stamped += stampLines.length;
    console.log(`✓ ${holder.path}: ${stampLines.length} carimbo(s) trace-verified atualizado(s).`);
  }
  for (const w of warns) console.log(`    ${w}`);
  console.log(`suspect-links --stamp: ${stamped} carimbo(s) gravado(s).`);
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Relatório (padrão) e --mark
// ---------------------------------------------------------------------------
const suspects = [];  // reprovam
const info = [];      // sem carimbo

for (const l of links) {
  if (!scopeOk(l.holder.file) && !(l.target && scopeOk(l.target.file))) continue;
  if (!l.target) continue; // par com alvo inexistente é achado do audit-trace-links, não daqui
  const stamp = l.holder.stamps.find((s) => s.target === l.targetId.toUpperCase());
  if (!stamp) {
    info.push(`◻ ${l.holder.path}: elo com ${l.targetId} sem carimbo trace-verified (rode --stamp após verificar o elo).`);
    continue;
  }
  const current = fingerprintOf(l.target.file);
  if (current !== stamp.hash) {
    const commit = lastCommitOf(l.target.path);
    suspects.push({
      msg: `🔶 ${l.holder.path}: elo com ${l.targetId} SUSPEITO — ${l.target.path} mudou depois da verificação` +
        `${commit ? ` (último commit no alvo: ${commit})` : ''}. Reverifique o elo e rode --stamp.`,
      link: l,
    });
  }
}

// --mark: persiste ⚠️ no INDEX.md para os pares suspeitos.
if (has('--mark') && suspects.length && model.index) {
  const raw = readFileSync(model.index.file, 'utf8');
  const lines = raw.split(/\r?\n/);
  const sec = sectionSlice(lines, 'Rastreabilidade');
  let marked = 0;
  if (sec) {
    for (const { link } of suspects) {
      const key = link.holder.kind === 'story' ? link.holder.key : link.targetId;
      const featId = link.holder.kind === 'feature' ? link.holder.id : link.targetId;
      for (let i = sec.start + 1; i < sec.end; i++) {
        const line = lines[i];
        if (!line.trim().startsWith('|')) continue;
        if (!line.includes(key) || !line.includes(featId)) continue;
        if (line.includes('❌') || line.includes('⚠️')) continue;
        const cells = line.split('|');
        // célula de status = 4ª coluna de dados (índice 4 com as bordas | … |)
        if (cells.length > 4) {
          cells[4] = ' ⚠️ Revisão necessária ';
          lines[i] = cells.join('|');
          marked++;
        }
      }
    }
    if (marked) {
      writeFileSync(model.index.file, lines.join('\n'));
      console.log(`✓ INDEX.md: ${marked} linha(s) marcada(s) como ⚠️ Revisão necessária.`);
    }
  }
}

if (suspects.length) {
  console.error(`✗ suspect-links: ${suspects.length} elo(s) suspeito(s) — o outro lado mudou após a última verificação.`);
  for (const s of suspects) console.error(`    - ${s.msg}`);
  if (info.length) for (const i of info) console.error(`    ${i}`);
  process.exit(1);
}
console.log(`✓ suspect-links: nenhum elo suspeito (${links.length} elo(s) verificado(s)).`);
for (const i of info) console.log(`    ${i}`);
process.exit(0);
