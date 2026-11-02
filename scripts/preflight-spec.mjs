#!/usr/bin/env node
// preflight-spec.mjs — reporta o ESTADO ATUAL da instância antes de especificar
// (F1: "sempre verificar o que já existe"). Determinístico: varre o disco e imprime
// o que existe — N0, Domínios (N1), Agrupamentos Funcionais (N2) e Funcionalidades (N3) com seus IDs —
// para o modelo confrontar ANTES de gerar, em vez de assumir. Não escreve nada.
//
// Uso (a partir da raiz da instância):
//   node scripts/preflight-spec.mjs                     # panorama geral
//   node scripts/preflight-spec.mjs <dominio>           # foca 1 domínio (sigla ou pasta)
//   node scripts/preflight-spec.mjs <dominio> <agrupamento-funcional>  # foca 1 Agrupamento Funcional
//
// Saída: relatório legível em stdout. Sempre sai 0 (é informativo, não um gate).

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { planN3Ids } from './lib/n3-ids.mjs';

const ROOT = process.cwd();
const [domArg, fsArg] = process.argv.slice(2);

const read = (p) => (existsSync(p) ? readFileSync(p, 'utf8') : null);
const isDir = (p) => existsSync(p) && statSync(p).isDirectory();
const subdirs = (p) => (isDir(p) ? readdirSync(p).filter((n) => isDir(join(p, n))) : []);
const mdFiles = (p) => (isDir(p) ? readdirSync(p).filter((n) => n.endsWith('.md')) : []);

// Extrai o ID em crase do subtítulo "> **Nível N** … `ID`".
function levelId(raw) {
  if (!raw) return null;
  const line = raw.split(/\r?\n/).find((l) => /> \*\*Nível [0-3]\*\*/.test(l));
  if (!line) return null;
  const m = line.match(/`([A-Z]{2,3}(?:-[A-Z]{3})?(?:-\d{2})?)`/);
  return m ? m[1] : null;
}
// Extrai o título "# … : Nome".
function titleName(raw) {
  if (!raw) return null;
  const line = (raw.split(/\r?\n/).find((l) => l.trim().startsWith('# ')) || '').trim();
  const m = line.match(/^#\s+[^:]+:\s*(.+)$/);
  return m ? m[1].trim() : line.replace(/^#\s+/, '') || null;
}

const out = [];
const p = (s = '') => out.push(s);

p('══════════════════════════════════════════════════════════════');
p(' PREFLIGHT DE ESPECIFICAÇÃO — estado atual da instância');
p(' (confronte ISTO antes de gerar; não recrie IDs/pastas que já existem)');
p('══════════════════════════════════════════════════════════════');

// N0
const n0 = read(join(ROOT, 'global', 'N0_PRODUCT_VISION.md'));
p('');
p(`N0 (Visão de Produto): ${n0 ? '✔ existe (global/N0_PRODUCT_VISION.md)' : '✘ ainda não existe'}`);
if (n0) {
  // N1 previstos: linhas de tabela na seção "Domínios previstos (N1)"
  // (N0 de antes da 7.0.0 usam "Major Feature Sets previstos (N1)").
  const dom = [];
  const lines = n0.split(/\r?\n/);
  const start = lines.findIndex((l) => /##\s+(?:Major Feature Sets|Domínios) previstos/.test(l));
  if (start >= 0) {
    for (let i = start + 1; i < lines.length && !/^##\s/.test(lines[i]); i++) {
      const c = lines[i].trim();
      if (c.startsWith('|') && !/^\|[\s:|-]+\|$/.test(c)) {
        const cells = c.replace(/^\|/, '').replace(/\|$/, '').split('|').map((x) => x.trim());
        if (cells[1] && /^[A-Z]{3}$/.test(cells[1]) && !/SIGLA/i.test(cells[1])) dom.push(`${cells[1]} · ${cells[0]}`);
      }
    }
  }
  if (dom.length) { p('  Domínios previstos no N0:'); dom.forEach((d) => p(`    - ${d}`)); }
}

// INDEX
const hasIndex = existsSync(join(ROOT, 'modules', 'INDEX.md'));
p('');
p(`INDEX geral: ${hasIndex ? '✔ modules/INDEX.md — ATUALIZE-O ao concluir' : '✘ modules/INDEX.md ausente'}`);

// Domínios existentes (pastas com README.md = N1)
const modulesDir = join(ROOT, 'modules');
const domainFolders = subdirs(modulesDir).filter((n) => !n.startsWith('_'));
p('');
p(`Domínios especificados (N1) em modules/: ${domainFolders.length}`);

// Resolve o domínio-alvo (por pasta ou por sigla no subtítulo do N1).
function resolveDomain(arg) {
  if (!arg) return null;
  if (domainFolders.includes(arg)) return arg;
  const up = arg.toUpperCase();
  for (const f of domainFolders) {
    if (levelId(read(join(modulesDir, f, 'README.md'))) === up) return f;
  }
  return null;
}

const targetDomain = resolveDomain(domArg);

function reportFeatureSet(domFolder, fsFolder) {
  const n2 = read(join(modulesDir, domFolder, fsFolder, 'README.md'));
  const id = levelId(n2);
  p(`    Agrupamento Funcional: ${fsFolder}  ${n2 ? `[N2 ✔ ${id || '?'}]` : '[N2 ✘ ainda não existe]'}`);
  const feats = mdFiles(join(modulesDir, domFolder, fsFolder)).filter((n) => n.startsWith('f-'));
  for (const f of feats) {
    const fid = levelId(read(join(modulesDir, domFolder, fsFolder, f)));
    p(`        - ${f}  ${fid ? `\`${fid}\`` : '(sem ID no subtítulo ⚠)'}`);
  }
  if (id) {
    try {
      const plan = planN3Ids(ROOT, join(modulesDir, domFolder, fsFolder, 'README.md'));
      p('        Jornada registrada no N2 (não confundir posição com ID):');
      plan.rows.forEach(row => p(`          ${row.id} — ${row.name}${row.id && plan.pending.some(item => item.path === row.path) ? ' (reserva proposta; ainda não gravada)' : ''}`));
      p(plan.next <= 99 ? `        → próximo NN livre neste FS: ${id}-${String(plan.next).padStart(2, '0')} (reservas incluídas; nunca preencha lacunas)` : '        → sequência esgotada (99); não renumere.');
      if (plan.pending.length || plan.registration) p(`        → confira a jornada e rode node scripts/ids-n3.mjs modules/${domFolder}/${fsFolder}/README.md (modo seco), depois --write.`);
    } catch (error) {
      p(`        ⚠ sequência indisponível: ${error.message}`);
      p('        Corrija o conflito sem renumerar os IDs existentes.');
    }
  } else p('        → confirme a jornada e registre o N2 antes de atribuir novos IDs; IDs de N3 existentes são imutáveis.');
}

if (domArg && !targetDomain) {
  p('');
  p(`⚠ Domínio "${domArg}" não encontrado em modules/ (nem por pasta nem por sigla).`);
  p('  Fluxo bottom-up: o N1/N2 pode não existir ainda — confirme antes de criar pasta nova.');
}

if (targetDomain) {
  const n1 = read(join(modulesDir, targetDomain, 'README.md'));
  p('');
  p(`Domínio alvo: ${targetDomain}  ${n1 ? `[N1 ✔ ${levelId(n1) || '?'} — ${titleName(n1) || ''}]` : '[N1 ✘]'}`);
  const fsFolders = subdirs(join(modulesDir, targetDomain)).filter((n) => !n.startsWith('_'));
  if (fsArg) {
    const match = fsFolders.includes(fsArg) ? fsArg : fsFolders.find((f) => levelId(read(join(modulesDir, targetDomain, f, 'README.md'))) === fsArg.toUpperCase());
    if (match) reportFeatureSet(targetDomain, match);
    else { p(`    ⚠ Agrupamento Funcional "${fsArg}" não encontrado neste domínio — confirme antes de criar.`); }
  } else {
    p(`  Agrupamentos Funcionais neste domínio: ${fsFolders.length}`);
    fsFolders.forEach((f) => reportFeatureSet(targetDomain, f));
  }
} else if (!domArg) {
  // Panorama: lista domínios + contagem de FS.
  for (const f of domainFolders) {
    const n1 = read(join(modulesDir, f, 'README.md'));
    const fsCount = subdirs(join(modulesDir, f)).filter((n) => !n.startsWith('_')).length;
    p(`    - ${f}  ${n1 ? `\`${levelId(n1) || '?'}\`` : '(sem N1)'} — ${fsCount} Agrupamento Funcional(s)`);
  }
}

p('');
p('──────────────────────────────────────────────────────────────');
p(' Antes de gerar, produza o bloco "Contexto verificado" reconciliando:');
p('  • esta funcionalidade/FS/domínio já existe? (não duplicar ID nem pasta)');
p('  • quais regras/campos já são canônicos → referenciar, não reescrever');
p('  • o artefato cabe no escopo do N0 e do N1?');
p('──────────────────────────────────────────────────────────────');

console.log(out.join('\n'));
process.exit(0);
