#!/usr/bin/env node
// migra-aim.mjs — leva uma instância do formato anterior à AIMM única (3.0.0).
//
// Antes da 3.0.0, o ticket vivia em três artefatos, cada um com o seu formato: o registro
// `demandas/<chave>.md` do PROMPT_BACKLOG (ou `modules/_backlog/`, mais antigo), a AIMM
// `impactos/AIMM-AAAA-NNN.md` do PROMPT_IMPACTO e o relatório `ANALISE_IMPACTO_<chave>.md`
// da skill analise-impacto — mais o relatório agregado da sprint. Agora o ticket tem uma
// AIMM só, versionada (decisões do PO, 2026-09-28). Este script junta os três numa AIMM por
// ticket, `analise-impacto/AIMM-<CHAVE>.md`, e o agregado na AIMM da sprint, e troca os
// elos: a `## Origem` dos N3, o INDEX (título, coluna e links) e o CONTAGEM-PF.
//
// SIMULAÇÃO por padrão: aplica a migração numa cópia temporária da instância, roda lá o
// validate-impact em cada AIMM, o audit-trace-links e o suspect-links, e relata — nada muda
// na instância. `--write` aplica de verdade e apaga os arquivos do formato anterior (com o
// .html gerado de cada um): o conteúdo continua no histórico do git. Rodar de novo depois
// do --write não faz nada — não sobra formato anterior para migrar.
//
// Uso (da raiz da instância, ou com --root):
//   node scripts/migra-aim.mjs [--root <instância>] [--write] [--avalizado-por "<quem>"]
//                              [--relatorios <pasta>]… [--hoje AAAA-MM-DD]
//
//   --avalizado-por  quem avaliza as AIMMs que nascem concluídas de um relatório sem AIMM
//                    anterior. O validador exige `avalizado-por` em `concluído`, e a
//                    migração não tem como saber quem avalizou (decisão do PO, 2026-09-28):
//                    quem roda a migração declara — ex.: "PO Ana, migração 2026-10-01".
//                    Sem a opção, o campo fica vazio e o validador acusa cada uma.
//   --relatorios     outra pasta onde a instância guarda relatórios ANALISE_IMPACTO_*
//                    (padrão: demandas/, arquivos/demandas/ e impactos/). Repetível.
//   --hoje           a data do Changelog da migração (padrão: hoje).
//
// De onde vem cada parte da AIMM do ticket:
//   registro   → Descrição do ticket (transcrição intacta), Critérios de aceite,
//                Features (Operação e Critérios lidos da `## Origem` do N3), Changelog
//   AIMM antiga (`origem:` = a chave) → Artefatos impactados, Reconciliação,
//                `avalizado-por`, estado, Changelog
//   relatório  → Alterações em funcionalidades, Funções de dados, Dicionários, Decisões, `sprint`;
//                a seção 1 (detalhe por item) vai para debaixo das Features
//   Estado: com relatório, `concluído` (`aberta-na-entrega: true` se não havia AIMM
//   antiga); só com a AIMM antiga, o estado dela; só com o registro, `rascunho`.
//   Seção que não tem lugar na AIMM (ex.: `## Impactos` do registro) fica, com o título,
//   antes da Reconciliação.
//
// Carimbos trace-verified: a migração muda o conteúdo dos arquivos carimbados. O elo que
// estava válido antes é recarimbado com o fingerprint novo; o suspeito continua suspeito.
//
// Não migra (e não apaga): AIMM antiga sem `origem:`, ticket que já tem AIMM no formato
// novo, chave inválida (placeholder) e fonte em dobro (dois registros ou dois relatórios
// do mesmo ticket) — saem como pendência, para juntar à mão.

import {
  readFileSync, writeFileSync, existsSync, readdirSync, statSync, mkdirSync, rmSync, cpSync, mkdtempSync, copyFileSync,
} from 'node:fs';
import { join, dirname, basename, relative, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { impactPath } from './lib/impact-files.mjs';
import {
  scanInstance, sectionSlice, splitRow, STAMP_RE, STORY_KEY_RE, FEATURE_ID_RE, frontMatterCampos, fingerprintText,
} from './lib/trace-index.mjs';

const SCRIPTS = dirname(fileURLToPath(import.meta.url));
const MOLDES_AIMM = join(SCRIPTS, '..', 'engine', 'templates', 'analise-impacto');
const USO = 'Uso: node scripts/migra-aim.mjs [--root <instância>] [--write] [--avalizado-por "<quem>"] [--relatorios <pasta>]… [--hoje AAAA-MM-DD]';

const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const argOf = (f) => { const i = args.indexOf(f); return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : null; };
const argsOf = (f) => args.flatMap((a, i) => (a === f && args[i + 1] !== undefined ? [args[i + 1]] : []));
if (has('--help') || has('-h')) { console.log(USO); process.exit(0); }

const RAIZ = resolve(argOf('--root') || process.cwd());
if (!existsSync(join(RAIZ, 'modules'))) {
  console.error(`✗ ${RAIZ} não é uma instância (falta modules/).\n${USO}`);
  process.exit(2);
}
const OPCOES = {
  avalizadoPor: (argOf('--avalizado-por') || '').trim(),
  // Relativas à raiz: a simulação roda numa cópia da instância, e uma pasta de fora
  // dela seria a original — o que a simulação apagaria.
  relatoriosExtras: argsOf('--relatorios').map((p) => relative(RAIZ, resolve(RAIZ, p))),
  hoje: argOf('--hoje') || new Date().toISOString().slice(0, 10),
};
const fora = OPCOES.relatoriosExtras.find((p) => !p || p.startsWith('..') || resolve(p) === p);
if (fora !== undefined) {
  console.error(`✗ --relatorios precisa ser uma pasta dentro da instância (${RAIZ}).`);
  process.exit(2);
}

// ───────────────────────────── apoio ─────────────────────────────
const posix = (p) => p.replace(/\\/g, '/');
const rel = (raiz, p) => posix(relative(raiz, p));
const ler = (p) => readFileSync(p, 'utf8');
const semAcento = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const listaMd = (dir) => (existsSync(dir) && statSync(dir).isDirectory()
  ? readdirSync(dir).filter((n) => n.endsWith('.md')).sort().map((n) => join(dir, n)) : []);
const ehChaveInteira = (s) => new RegExp(`^(?:${STORY_KEY_RE.source})$`, 'i').test(s) || /^[A-Za-z]+\d*-\d+$/.test(s);
// Chave que vira nome de arquivo: sem placeholder, espaço ou barra.
const ehChaveValida = (s) => /^[A-Za-z0-9][A-Za-z0-9_.-]*$/.test(String(s || ''));

// Corpo de um artefato em Markdown: o H1, o cabeçalho (entre o H1 e o primeiro `##`) e as
// seções `##`, na ordem. Front-matter e carimbo saem; cerca de código não é quebrada.
function partes(texto) {
  const linhas = texto.replace(/^\uFEFF/, '').split(/\r?\n/);
  let i = 0;
  while (i < linhas.length && (!linhas[i].trim() || /^\s*<!--.*-->\s*$/.test(linhas[i]))) i++;
  if ((linhas[i] || '').trim() === '---') {
    for (i++; i < linhas.length && linhas[i].trim() !== '---'; i++);
    i++;
  }
  const out = { h1: '', cabecalho: [], secoes: [] };
  let atual = null;
  let cerca = false;
  for (const l of linhas.slice(i)) {
    if (/^\s*(```|~~~)/.test(l)) cerca = !cerca;
    if (!cerca && /^##\s+\S/.test(l)) { atual = { titulo: l.replace(/^##\s+/, '').trim(), linhas: [] }; out.secoes.push(atual); continue; }
    if (atual) { atual.linhas.push(l); continue; }
    if (!out.h1 && /^#\s+\S/.test(l)) out.h1 = l.replace(/^#\s+/, '').trim();
    else out.cabecalho.push(l);
  }
  return out;
}

// Tira as instruções do template antigo (comentários HTML — menos os carimbos
// trace-verified), os separadores `---` e as linhas em branco repetidas.
function limpa(linhas) {
  const t = linhas.join('\n').replace(/<!--(?!\s*trace-verified)[\s\S]*?-->/g, '');
  const out = [];
  for (const l0 of t.split('\n')) {
    const l = l0.replace(/\s+$/, '');
    if (l.trim() === '---') continue;
    if (!l.trim() && (!out.length || !out[out.length - 1].trim())) continue;
    out.push(l);
  }
  while (out.length && !out[out.length - 1].trim()) out.pop();
  return out;
}

const semBrancoNoInicio = (linhas) => { const out = [...linhas]; while (out.length && !out[0].trim()) out.shift(); return out; };
// Conteúdo fora da citação de instrução (`> …`) — o que a pessoa escreveu.
const foraDaCitacao = (linhas) => semBrancoNoInicio(limpa(linhas).filter((l) => !/^\s*>/.test(l)));

// Campo `**Rótulo**: valor` do cabeçalho (com ou sem `>` na frente).
function campo(linhas, rotulo) {
  const re = new RegExp(`^\\s*>?\\s*\\*\\*${rotulo}\\*\\*\\s*:\\s*(.*)$`, 'i');
  for (const l of linhas) { const m = semAcento(l).match(re); if (m) return l.slice(l.length - m[1].length).trim(); }
  return '';
}

// Blocos de uma seção: tabelas e o texto entre elas.
function blocos(linhas) {
  const out = [];
  for (const l of linhas) {
    const ehTab = /^\s*\|/.test(l);
    const ult = out[out.length - 1];
    if (ult && ult.tabela === ehTab) ult.linhas.push(l);
    else out.push({ tabela: ehTab, linhas: [l] });
  }
  return out;
}
const ehSeparador = (l) => /^\s*\|[\s:|-]+\|?\s*$/.test(l);
const chavesDe = (celula) => (String(celula || '').match(/`([^`]+)`/g) || []).map((x) => x.replace(/`/g, '').toUpperCase());
function tabela(linhas) {
  const ls = linhas.filter((l) => !ehSeparador(l));
  return { cab: splitRow(ls[0] || ''), linhas: ls.slice(1).map(splitRow) };
}
const linhaTab = (cells) => `| ${cells.join(' | ')} |`;
const renderTabela = (cab, linhas) => [linhaTab(cab), `|${cab.map(() => '---').join('|')}|`, ...linhas.map(linhaTab)];
const indiceCol = (cab, re) => cab.findIndex((c) => re.test(semAcento(c).trim()));

// Reescreve as tabelas de uma seção: renomeia colunas e, se pedido, tira a da chave.
const COL_CHAVE = /^(demanda|item do jira|ticket|historia|chave)$/i;
function converteTabelas(linhas, { tiraChave = false, chaveVira = null } = {}) {
  const out = [];
  for (const b of blocos(linhas)) {
    if (!b.tabela) { out.push(...b.linhas); continue; }
    const t = tabela(b.linhas);
    let cab = t.cab.map((c) => (/^o que mudou$/i.test(semAcento(c)) ? 'Mudança' : c));
    let rows = t.linhas;
    const iChave = indiceCol(cab, COL_CHAVE);
    if (iChave >= 0 && tiraChave) {
      cab = cab.filter((_, i) => i !== iChave);
      rows = rows.map((r) => r.filter((_, i) => i !== iChave));
    } else if (iChave >= 0 && chaveVira) {
      cab = cab.map((c, i) => (i === iChave ? chaveVira : c));
      rows = rows.map((r) => r.map((c, i) => (i === iChave ? c.replace(/sem item/i, 'sem ticket') : c)));
    }
    out.push(...renderTabela(cab, rows));
  }
  return out;
}

// O layout atual da AIMM do ticket é narrativo: tamanho fica no N3/consolidado,
// enquanto a AIMM registra a feature e a entidade alterada para auditoria do escopo.
function layoutTicket(linhas) {
  const out = [];
  for (const b of blocos(linhas)) {
    if (!b.tabela) {
      out.push(...b.linhas.map(linha => linha.replace(/^###\s+(?:ALI|AIE):\s*(.+?)(?:\s+[—–]\s+.*)?$/i, '### $1')));
      continue;
    }
    const t = tabela(b.linhas);
    let cab = t.cab.map(c => /^tabela \/ coluna$/i.test(c) ? 'Tabela / atributo' : c);
    let rows = t.linhas;
    const iFeature = indiceCol(cab, /^feature$/i);
    if (iFeature >= 0) {
      const remove = [indiceCol(cab, /^pfb$/i), indiceCol(cab, /^pfl$/i)].filter(i => i >= 0).sort((a, b) => b - a);
      cab = cab.filter((_, i) => !remove.includes(i));
      rows = rows.map(row => row.filter((_, i) => !remove.includes(i)).map((cell, i) => {
        if (i !== iFeature) return cell;
        return cell.replace(/^(`?[A-Z]{3}-[A-Z]{3}-\d{2}`?)\s+(\*\*[^*]+\*\*)$/, '$1<br>$2');
      }));
    }
    out.push(...renderTabela(cab, rows));
  }
  return out;
}

// Linhas de feature (`ID` **Nome**) das tabelas de uma seção de alterações.
function featuresDasAlteracoes(linhas) {
  const out = [];
  let fs = '';
  for (const b of blocos(linhas)) {
    if (!b.tabela) {
      for (const l of b.linhas) { const m = l.match(/^###\s+(.+)$/); if (m) fs = m[1].trim(); }
      continue;
    }
    const t = tabela(b.linhas);
    const iF = indiceCol(t.cab, /^feature$/i);
    const iN = indiceCol(t.cab, /^natureza$/i);
    const iCa = indiceCol(t.cab, /^ca-n$/i);
    const iCh = indiceCol(t.cab, COL_CHAVE);
    const iM = indiceCol(t.cab, /^(mudanca|o que mudou)$/i);
    if (iF < 0) continue;
    for (const r of t.linhas) {
      const m = (r[iF] || '').match(/`([A-Z]{3}-[A-Z]{3}-\d{2})`\s*(?:\*\*([^*]+)\*\*)?/);
      if (!m) continue;
      out.push({
        id: m[1], nome: (m[2] || '').trim(), fs, natureza: iN >= 0 ? (r[iN] || '') : '',
        ca: iCa >= 0 ? (r[iCa] || '') : '', chaves: iCh >= 0 ? (r[iCh] || '') : '', mudanca: iM >= 0 ? (r[iM] || '') : '',
      });
    }
  }
  return out;
}

// Linhas de tabela de Changelog (Data | Autor | Tipo | Descrição).
function linhasDeChangelog(linhas) {
  const out = [];
  for (const b of blocos(linhas)) {
    if (!b.tabela) continue;
    const t = tabela(b.linhas);
    if (indiceCol(t.cab, /^data$/i) !== 0) continue;
    for (const r of t.linhas) if (r.length >= 4 && !/\[AAAA-MM-DD\]|\[autor\]/i.test(r.join(' '))) out.push(r.slice(0, 4));
  }
  return out;
}

const ROTULO_ESTADO = {
  rascunho: '✏️ Rascunho', 'requisitos-aprovados': '📝 Requisitos aprovados', 'modelo-validado': '🧱 Modelo validado',
  especificado: '📋 Especificado', 'em-desenvolvimento': '🔄 Em desenvolvimento', implementado: '✅ Implementado',
  'revisao-necessaria': '⚠️ Revisão necessária', deprecado: '❌ Deprecado',
};
const ESTADOS_AIMM = ['rascunho', 'em-análise', 'escopo-aprovado', 'em-execução', 'concluído'];
const estadoAim = (e) => ESTADOS_AIMM.find((x) => semAcento(x) === semAcento(String(e || '').trim().toLowerCase())) || null;
const operacao = (tipo) => (/alter/i.test(tipo) ? 'Alteração' : /cria|inclu|nova/i.test(semAcento(tipo)) ? 'Criação' : (tipo || '—'));
function criterios(nota) {
  const m = String(nota || '').replace(/`/g, '').match(/^\s*(CA-\d+(?:\s*,\s*CA-\d+)*)/i);
  return m ? `\`${m[1].replace(/\s*,\s*/g, ', ')}\`` : '—';
}
const valorFm = (v) => {
  const s = String(v ?? '').replace(/\s#/g, ' nº').trim();
  if (!s) return '""';
  return /[:"'[\]{}]|^[>|&*!%@`]/.test(s) ? JSON.stringify(s) : s;
};

// ─────────────────────────── a migração ───────────────────────────
function migrar(raiz, { avalizadoPor, relatoriosExtras, hoje }) {
  const r = {
    tickets: [], sprints: [], n3: [], outros: [], apagados: [], moldes: [], pendencias: [],
    recarimbados: 0, suspeitosMantidos: 0, aims: [],
  };
  const pend = (p) => r.pendencias.push(p);

  // 1. As fontes do formato anterior.
  const registros = [];
  const moldesAntigos = [];
  for (const pasta of ['demandas', join('modules', '_backlog')]) {
    for (const f of listaMd(join(raiz, pasta))) {
      const n = basename(f);
      if (n.startsWith('ANALISE_IMPACTO_')) continue;
      // INDEX.md é o índice do diretório, não um registro: sai com o formato anterior.
      (n.startsWith('_') || n === 'INDEX.md' ? moldesAntigos : registros).push(f);
    }
  }
  const aimsAntigas = [];
  for (const f of listaMd(join(raiz, 'impactos'))) {
    const n = basename(f);
    if (n.startsWith('ANALISE_IMPACTO_')) continue;
    (n.startsWith('_') ? moldesAntigos : aimsAntigas).push(f);
  }
  const relatorios = [...new Set(['demandas', join('arquivos', 'demandas'), 'impactos', ...relatoriosExtras]
    .flatMap((p) => listaMd(resolve(raiz, p)).filter((f) => basename(f).startsWith('ANALISE_IMPACTO_'))))];

  if (!registros.length && !aimsAntigas.length && !relatorios.length && !moldesAntigos.length) return null;

  // 2. O modelo atual dos N3 (caminhos e `## Origem`), antes de qualquer mudança.
  const modelo = scanInstance(raiz);
  const n3PorId = new Map(modelo.features.filter((f) => f.id).map((f) => [f.id, f]));
  const textoN3 = new Map(modelo.features.map((f) => [f.file, ler(f.file)]));
  const origemDoN3 = (f) => {
    const sec = sectionSlice(textoN3.get(f.file).split(/\r?\n/), 'Origem');
    if (!sec) return [];
    const t = blocos(sec.lines.map((l) => l.trim())).find((b) => b.tabela);
    if (!t) return [];
    return tabela(t.linhas).linhas.map((c) => {
      const k = (c[0] || '').match(/`([^`]+)`/) || (c[0] || '').match(/\/([^/()]+)\.md\)/) || (c[0] || '').match(STORY_KEY_RE);
      return { chave: k ? String(k[1] || k[0]).replace(/^AIMM?-/i, '').toUpperCase() : null, tipo: c[1] || '', nota: c[2] || '' };
    });
  };

  // 3. Por ticket: o que cada fonte traz.
  const tickets = new Map(); // CHAVE (maiúscula) → plano
  const apelido = new Map(); // nome do arquivo do registro (minúsculo) → CHAVE
  const ticket = (k, confiavel) => {
    const K = k.toUpperCase();
    if (!tickets.has(K)) tickets.set(K, { chave: confiavel ? k : K, registro: null, aims: [], relatorio: null });
    else if (confiavel) tickets.get(K).chave = k;
    return tickets.get(K);
  };

  const invalida = (f, k) => pend(`${rel(raiz, f)}: chave \`${k}\` inválida (placeholder?) — não migrado nem apagado; corrija a chave e rode de novo.`);
  for (const f of registros) {
    const p = partes(ler(f));
    const origem = campo(p.cabecalho, 'Origem');
    const k = (origem.match(/`([^`]+)`/) || [])[1];
    if (!ehChaveValida(k || basename(f, '.md'))) { invalida(f, k || basename(f, '.md')); continue; }
    const t = ticket(k || basename(f, '.md'), Boolean(k));
    if (t.registro) { pend(`${rel(raiz, f)}: segundo registro de \`${t.chave}\` (o primeiro é \`${rel(raiz, t.registro.file)}\`) — não migrado nem apagado; junte à mão.`); continue; }
    t.registro = { file: f, partes: p, ferramenta: origem.replace(/`[^`]*`/g, '').trim(), link: campo(p.cabecalho, 'Link') };
    apelido.set(basename(f, '.md').toLowerCase(), t.chave.toUpperCase());
  }
  for (const f of aimsAntigas) {
    const txt = ler(f);
    const fm = frontMatterCampos(txt.split(/\r?\n/));
    const ks = String(fm.origem || '').replace(/[`[\]]/g, ' ').trim().split(/[\s|,;]+/).filter(Boolean);
    const k = ks[0];
    if (!k || /x{3,}|n{3,}/i.test(k) || !ehChaveValida(k)) { pend(`${rel(raiz, f)}: AIMM antiga sem \`origem:\` — não migrada nem apagada; junte à AIMM do ticket à mão.`); continue; }
    if (ks.length > 1) pend(`${rel(raiz, f)}: AIMM antiga com mais de uma origem (${ks.join(', ')}) — juntada à de \`${k}\`; confira as outras.`);
    ticket(k, false).aims.push({ file: f, fm, partes: partes(txt) });
  }
  const agregados = [];
  for (const f of relatorios) {
    const p = partes(ler(f));
    const nome = basename(f, '.md').replace(/^ANALISE_IMPACTO_/, '');
    const origem = campo(p.cabecalho, 'Origem');
    const kOrigem = (origem.match(/`([^`]+)`/) || [])[1];
    const entrega = campo(p.cabecalho, 'Entrega');
    const rr = { file: f, partes: p, nome, sprint: campo(p.cabecalho, 'Sprint'), entrega, status: campo(p.cabecalho, 'Status'), link: campo(p.cabecalho, 'Link'), ferramenta: origem.replace(/`[^`]*`/g, '').trim() };
    const k = kOrigem || (!entrega && ehChaveInteira(nome) ? nome : null);
    if (!k) {
      if (!ehChaveValida(rr.sprint || nome)) { invalida(f, rr.sprint || nome); continue; }
      agregados.push(rr);
      continue;
    }
    if (!ehChaveValida(k)) { invalida(f, k); continue; }
    const t = ticket(k, true);
    if (t.relatorio) { pend(`${rel(raiz, f)}: segundo relatório de \`${t.chave}\` (o primeiro é \`${rel(raiz, t.relatorio.file)}\`) — não migrado nem apagado; junte à mão.`); continue; }
    t.relatorio = rr;
  }

  const secaoDe = (p, re) => p.secoes.filter((s) => re.test(semAcento(s.titulo).toLowerCase().replace(/^\d+\.\s*/, '')));
  const juntaSecoes = (lst) => lst.flatMap((s) => limpa(s.linhas));
  const DIR_AIMM = join(raiz, 'analise-impacto');
  const alvoFeature = (id, alvoAntigo) => {
    const n3 = n3PorId.get(id);
    if (n3) return rel(DIR_AIMM, n3.file);
    const resto = posix(alvoAntigo).replace(/^(\.\.?\/)+/, '').replace(/^modules\//, '');
    return `../modules/${resto}`;
  };
  // Domínio · Feature Set: da linha `> **Nível 3**` do N3; sem ela, das pastas.
  const dirsDoN3 = (id) => {
    const n3 = n3PorId.get(id);
    if (!n3) return '—';
    const nivel = textoN3.get(n3.file).match(/\*\*N[íi]vel 3\*\*\s*-\s*Feature Set:\s*(.+?)\s+[—–]\s+(?:Major Feature Set|Dom[íi]nio):\s*(.+?)\s+-\s+`/);
    if (nivel) return `${nivel[2].trim()} · ${nivel[1].trim()}`;
    const m = posix(n3.path).match(/^modules\/([^/]+)\/([^/]+)\//);
    return m ? `${m[1]} · ${m[2]}` : '—';
  };

  // Datas para o `aberta-em`.
  const datasDe = (linhas) => linhasDeChangelog(linhas).map((c) => c[0]).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d));

  // 4. A AIMM de cada ticket.
  const carimbosN3 = new Map(); // CHAVE → { validoAntes: Set(hash) }
  const planosAim = [];
  for (const t of [...tickets.values()].sort((a, b) => a.chave.localeCompare(b.chave))) {
    const K = t.chave;
    const arqAim = join(raiz, impactPath(raiz, K));
    const fontes = [
      ...(t.registro ? [`registro \`${rel(raiz, t.registro.file)}\``] : []),
      ...t.aims.map((a) => `AIMM \`${rel(raiz, a.file)}\``),
      ...(t.relatorio ? [`relatório \`${rel(raiz, t.relatorio.file)}\``] : []),
    ];
    if (existsSync(arqAim)) {
      pend(`${rel(raiz, arqAim)} já existe — ${fontes.join(' + ')} não migrado(s) nem apagado(s); junte à mão.`);
      continue;
    }
    const reg = t.registro;
    const rp = t.relatorio;
    const secReg = (re) => (reg ? juntaSecoes(secaoDe(reg.partes, re)) : []);
    const secRel = (re) => (rp ? juntaSecoes(secaoDe(rp.partes, re)) : []);

    // Front-matter.
    const estadoAntigo = t.aims.map((a) => estadoAim(a.fm.estado)).filter(Boolean)
      .sort((a, b) => ESTADOS_AIMM.indexOf(b) - ESTADOS_AIMM.indexOf(a))[0];
    const estado = rp ? 'concluído' : (estadoAntigo || 'rascunho');
    const abertaNaEntrega = Boolean(rp) && !t.aims.length;
    let sprint = rp ? rp.sprint : '';
    if (rp && !sprint) {
      const ag = agregados.find((a) => featuresDasAlteracoes(juntaSecoes(secaoDe(a.partes, /alteracoes (aplicadas|na spec)/)))
        .some((f) => chavesDe(f.chaves).includes(K.toUpperCase())));
      if (ag) sprint = ag.sprint || ag.nome;
    }
    const avalAntigo = t.aims.map((a) => String(a.fm['avalizado-por'] || '').trim()).find((v) => v && !/^\[/.test(v));
    const aval = avalAntigo || (estado === 'concluído' ? avalizadoPor : '');
    const tituloReg = reg ? reg.partes.h1.replace(/^(hist[óo]ria de usu[áa]rio|demanda|ticket)\s*[—–:-]\s*/i, '')
      .replace(new RegExp(`^\`?${K.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\`?\\s*[—–:-]\\s*`, 'i'), '').trim() : '';
    const tituloAim = t.aims.map((a) => a.partes.h1.replace(/^AIMM?-[\w-]+\s*[—–-]\s*/i, '').trim()).find(Boolean) || '';
    const detalhe = secRel(/detalhe por item/);
    const tituloRel = ((detalhe.find((l) => /^###\s/.test(l)) || '').match(/\s[—–-]\s+(.+?)(\s*\([^)]*\))?\s*$/) || [])[1] || '';
    const titulo = tituloReg || tituloAim || tituloRel || '';
    const datas = [...(reg ? datasDe(secReg(/^changelog/)) : []), ...t.aims.map((a) => a.fm.data).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d || '')),
      ...((rp && rp.status.match(/\d{4}-\d{2}-\d{2}/)) || [])].sort();
    const abertaEm = datas[0] || hoje;
    const ferramenta = (reg && reg.ferramenta) || (rp && rp.ferramenta) || '';
    const link = (reg && reg.link) || (rp && rp.link) || '';

    // Descrição e Critérios — a transcrição fica intacta.
    let descricao = semBrancoNoInicio(secReg(/^(historia|descricao)/).filter((l) => !/^\s*>\s*Transcri[çc][ãa]o da descri[çc][ãa]o/i.test(l)));
    descricao = descricao.length
      ? [`> Transcrição da descrição do ticket \`${K}\` na ferramenta de origem.`, '', ...descricao]
      : ['> ⚠️ Migrada sem o registro do ticket: transcreva aqui a descrição como está na ferramenta de origem.'];
    if (!reg) pend(`${rel(raiz, arqAim)}: sem registro do ticket — transcreva a Descrição e os Critérios de aceite da ferramenta de origem.`);
    let crits = secReg(/^criterios de aceite/).map((l) => (/^\s*>\s*\*\*Numera/.test(l) ? l.replace(/chave da demanda/g, 'chave do ticket') : l));
    if (!crits.length) crits = ['> ⚠️ Migrada sem o registro do ticket: transcreva aqui os critérios de aceite da ferramenta de origem.'];

    // Features.
    const cabFeat = ['Feature (N3)', 'Domínio · Feature Set', 'Operação', 'Critérios cobertos', 'Status'];
    const linhasFeat = [];
    const carimbosFeat = []; // { id, hash, textoN3Antes }
    const textoFeatures = [];
    const doN3 = (id) => { const n3 = n3PorId.get(id); return n3 ? origemDoN3(n3).find((o) => o.chave === K.toUpperCase()) : null; };
    const secFeat = reg ? secaoDe(reg.partes, /^rastreabilidade/) : [];
    for (const b of blocos(juntaSecoes(secFeat))) {
      if (!b.tabela) {
        for (const l of b.linhas) {
          const m = l.trim().match(new RegExp(STAMP_RE.source));
          if (m) carimbosFeat.push({ id: m[1].toUpperCase(), hash: m[2] });
          else textoFeatures.push(l);
        }
        continue;
      }
      const tb = tabela(b.linhas);
      const iD = indiceCol(tb.cab, /dominio|feature set/i);
      const iS = indiceCol(tb.cab, /^status$/i);
      for (const c of tb.linhas) {
        const m = (c[0] || '').match(FEATURE_ID_RE);
        if (!m) continue;
        const status = iS >= 0 ? c[iS] : '—';
        const o = doN3(m[0]);
        linhasFeat.push([
          c[0].replace(/\]\(([^)]+)\)/, (_, alvo) => `](${alvoFeature(m[0], alvo)})`),
          iD >= 0 ? c[iD] : dirsDoN3(m[0]),
          o ? operacao(o.tipo) : (/especificar/i.test(status) ? 'Criação' : '—'),
          o ? criterios(o.nota) : '—',
          status,
        ]);
      }
    }
    const featsRel = rp ? featuresDasAlteracoes(secRel(/alteracoes (aplicadas|na spec)/)) : [];
    if (!linhasFeat.length) {
      const ancoras = [...new Set([
        ...featsRel.map((f) => f.id),
        ...t.aims.flatMap((a) => [String(a.fm['feature-ancora'] || ''), ...juntaSecoes(secaoDe(a.partes, /^features/))].join(' ').match(new RegExp(FEATURE_ID_RE.source, 'g')) || []),
      ])];
      for (const id of ancoras) {
        const n3 = n3PorId.get(id);
        const fr = featsRel.find((f) => f.id === id);
        const o = doN3(id);
        const nome = (fr && fr.nome) || (n3 && n3.title) || id;
        linhasFeat.push([
          n3 ? `[\`${id}\`: ${nome}](${rel(DIR_AIMM, n3.file)})` : `\`${id}\`: ${nome} *(sem N3)*`,
          dirsDoN3(id),
          o ? operacao(o.tipo) : (fr ? (/inclu/i.test(semAcento(fr.natureza)) ? 'Criação' : 'Alteração') : '—'),
          o ? criterios(o.nota) : (fr && /CA-\d/i.test(fr.ca) ? `\`${fr.ca}\`` : '—'),
          n3 ? (ROTULO_ESTADO[n3.estado] || '—') : '📋 A especificar',
        ]);
        if (!n3) pend(`${rel(raiz, arqAim)}: \`${id}\` não tem N3 — confira o link da feature.`);
      }
    }
    // O ticket só fecha com cada feature no estado final da esteira (validate-impact). A
    // AIMM antiga podia fechar com uma feature adiada; aqui ela vira decisão, não migração.
    if (estado === 'concluído') {
      for (const l of linhasFeat.filter((c) => /a especificar/i.test(c[c.length - 1] || ''))) {
        const id = (l[0].match(FEATURE_ID_RE) || [''])[0];
        pend(`${rel(raiz, arqAim)}: concluída com \`${id}\` ainda a especificar — o ticket não fecha com feature sem N3: tire-a da \`## Features\` (ela vai para outro ticket) ou volte a AIMM a \`em-execução\` (o validador cobra).`);
      }
    }

    // Changeset.
    const cabCs = ['Artefato', 'Tipo', 'Operação', 'Seção', 'Natureza', 'O quê', 'Proveniência'];
    const cs = [];
    const vistos = new Set();
    for (const a of t.aims) {
      for (const b of blocos(juntaSecoes(secaoDe(a.partes, /^artefatos impactados/)))) {
        if (!b.tabela) continue;
        const tb = tabela(b.linhas);
        const idx = cabCs.map((h) => indiceCol(tb.cab, new RegExp(`^${semAcento(h)}$`, 'i')));
        if (idx[0] < 0) continue;
        for (const c of tb.linhas) {
          const row = idx.map((i) => (i >= 0 ? c[i] || '—' : '—'));
          if (/<(?:dom|fs|slug)>|\[[^\]]*\]/.test(row.join(' '))) continue;
          const chave = `${row[0]}::${row[3]}`;
          if (vistos.has(chave)) continue;
          vistos.add(chave);
          cs.push(row);
        }
      }
    }
    if (!cs.length && rp) {
      for (const f of featsRel) {
        const n3 = n3PorId.get(f.id);
        if (!n3) continue;
        const oque = f.mudanca.replace(/\*+/g, '').replace(/\s+/g, ' ').trim();
        cs.push([`\`${n3.path}\``, 'N3', /inclu/i.test(semAcento(f.natureza)) ? 'criar' : 'alterar', '—', 'funcional',
          oque.length > 120 ? `${oque.slice(0, 119)}…` : (oque || '—'), 'migrado: relatório']);
      }
    }

    // O resto do relatório.
    const alteracoes = converteTabelas(secRel(/alteracoes (aplicadas|na spec)/), { tiraChave: true });
    const dados = layoutTicket(converteTabelas(secRel(/tabelas alteradas|funcoes de dados/)));
    const dicionarios = secRel(/dicionario/);
    const decisoes = secRel(/decis/);

    // Seções sem lugar na AIMM ficam, com o título.
    const conhecidas = [/^(historia|descricao)/, /^contexto/, /^criterios de aceite/, /^rastreabilidade/, /^changelog/,
      /^necessidade/, /^features/, /^artefatos impactados/, /^reconciliacao/, /detalhe por item/,
      /alteracoes (aplicadas|na spec)/, /tabelas alteradas|funcoes de dados/, /dicionario/, /decis/];
    const extras = [];
    for (const [p, origem] of [[reg && reg.partes, reg && reg.file], ...t.aims.map((a) => [a.partes, a.file]), [rp && rp.partes, rp && rp.file]]) {
      if (!p) continue;
      for (const s of p.secoes) {
        const tt = semAcento(s.titulo).toLowerCase().replace(/^\d+\.\s*/, '');
        if (conhecidas.some((re) => re.test(tt))) continue;
        const corpo = /^dimensionamento/.test(tt) ? foraDaCitacao(s.linhas) : limpa(s.linhas);
        if (!corpo.length) continue;
        extras.push({ titulo: s.titulo.replace(/^\d+\.\s*/, ''), corpo, origem: rel(raiz, origem) });
      }
    }

    // Reconciliação.
    let reconc = t.aims.flatMap((a) => foraDaCitacao(juntaSecoes(secaoDe(a.partes, /^reconciliacao/))));
    if (!reconc.length && estado === 'concluído') {
      reconc = [abertaNaEntrega
        ? `Aberta na entrega — migrada do relatório \`${rel(raiz, rp.file)}\`: não houve escopo prévio a reconciliar.`
        : `Migrada da AIMM ${t.aims.map((a) => `\`${rel(raiz, a.file)}\``).join(', ')} e do relatório \`${rel(raiz, rp.file)}\`: a AIMM anterior não registrava a reconciliação.`];
    }

    // Changelog.
    const vistosCl = new Set();
    const cl = [
      [hoje, 'migra-aim', 'AIMM migrada', `${fontes.join(' + ')} → AIMM única`],
      ...[...(reg ? linhasDeChangelog(secReg(/^changelog/)) : []), ...t.aims.flatMap((a) => linhasDeChangelog(juntaSecoes(secaoDe(a.partes, /^changelog/))))]
        .sort((a, b) => String(b[0]).localeCompare(String(a[0]))),
    ].filter((c) => { const k = c.join('|'); if (vistosCl.has(k)) return false; vistosCl.add(k); return true; });

    if (estado === 'concluído' && !aval) pend(`${rel(raiz, arqAim)}: concluída sem \`avalizado-por\` — use --avalizado-por "<quem>" ou preencha à mão (o validador cobra).`);
    if (estado === 'concluído' && !rp) pend(`${rel(raiz, arqAim)}: concluída na AIMM antiga, sem relatório — falta a visão final (\`## Alterações em funcionalidades por Agrupamento Funcional\`), que a skill analise-impacto escreve.`);
    if (estado === 'concluído' && !sprint) pend(`${rel(raiz, arqAim)}: concluída sem \`sprint\` — o relatório não dizia; preencha à mão (o validador cobra).`);

    const texto = [
      '---', 'tipo: ticket', `ticket: ${K}`, `ferramenta: ${valorFm(ferramenta)}`, `link: ${valorFm(link)}`, `titulo: ${valorFm(titulo)}`,
      `estado: ${estado}`, `aberta-na-entrega: ${abertaNaEntrega}`, `sprint: ${valorFm(sprint)}`, `avalizado-por: ${valorFm(aval)}`,
      `aberta-em: ${abertaEm}`, '---', '', `# AIMM ${K}`, '',
      '## Descrição do ticket', '', ...descricao, '',
      '## Critérios de aceite', '', ...crits, '',
      '## Features', '', ...renderTabela(cabFeat, linhasFeat), '@@CARIMBOS_FEATURES@@',
      ...(textoFeatures.length ? ['', ...textoFeatures] : []), ...(detalhe.length ? ['', ...detalhe] : []), '',
      '## Artefatos impactados', '', ...renderTabela(cabCs, cs), '',
      '## Alterações em funcionalidades por Agrupamento Funcional', '', ...layoutTicket(alteracoes), ...(alteracoes.length ? [''] : []),
      '## Entidades alteradas', '', ...dados, ...(dados.length ? [''] : []),
      '## Impacto em dicionários', '', ...dicionarios, ...(dicionarios.length ? [''] : []),
      '## Decisões pendentes', '', ...decisoes, ...(decisoes.length ? [''] : []),
      ...extras.flatMap((x) => [`## ${x.titulo}`, '', `> Migrada de \`${x.origem}\`.`, '', ...x.corpo, '']),
      '## Reconciliação', '', ...reconc, ...(reconc.length ? [''] : []),
      '## Changelog', '', ...renderTabela(['Data', 'Autor', 'Tipo', 'Descrição'], cl), '',
    ].join('\n');

    carimbosN3.set(K.toUpperCase(), { registro: reg ? { file: reg.file, texto: ler(reg.file) } : null, arqAim });
    planosAim.push({ K, arqAim, texto, carimbosFeat, fontes, estado, abertaNaEntrega, sprint, titulo, featsRel, t });
  }

  // 5. A AIMM de cada sprint (relatório agregado).
  const planosSprint = [];
  for (const ag of agregados) {
    const label = ag.sprint || ag.nome;
    const arq = join(DIR_AIMM, `AIMM-${label}.md`);
    if (existsSync(arq)) { pend(`${rel(raiz, arq)} já existe — o relatório \`${rel(raiz, ag.file)}\` não foi migrado nem apagado; junte à mão.`); continue; }
    const alt = juntaSecoes(secaoDe(ag.partes, /alteracoes (aplicadas|na spec)/));
    const feats = featuresDasAlteracoes(alt);
    const chavesAg = feats.flatMap((f) => (f.chaves.match(/`([^`]+)`/g) || []).map((x) => x.replace(/`/g, '')))
      .map((k) => (tickets.get(k.toUpperCase()) || {}).chave || k);
    const doSprint = planosAim.filter((p) => p.sprint && p.sprint === label).map((p) => p.K);
    const ks = [...new Set([...doSprint, ...chavesAg])].sort();
    const linhasTk = ks.map((k) => {
      const plano = planosAim.find((p) => p.K.toUpperCase() === k.toUpperCase());
      const fs = feats.filter((f) => chavesDe(f.chaves).includes(k.toUpperCase()));
      const lista = (fs.length ? fs : (plano ? plano.featsRel : [])).map((f) => `\`${f.id}\`${f.nome ? ` **${f.nome}**` : ''}`);
      return [`\`${k}\``, `[AIMM-${k}](AIMM-${k}.md)`, lista.join(' · ') || '—', (plano && plano.titulo) || '—'];
    });
    const conhecidas = [/alteracoes (aplicadas|na spec)/, /tabelas alteradas|funcoes de dados/, /decis/, /^changelog/];
    const extras = ag.partes.secoes.filter((s) => !conhecidas.some((re) => re.test(semAcento(s.titulo).toLowerCase().replace(/^\d+\.\s*/, ''))))
      .map((s) => ({
        titulo: /apur/i.test(s.titulo) ? 'Apurável da sprint' : /detalhe por item/i.test(s.titulo) ? 'Detalhe por ticket' : s.titulo.replace(/^\d+\.\s*/, ''),
        corpo: limpa(s.linhas),
      }))
      .filter((x) => x.corpo.length);
    const dados = converteTabelas(juntaSecoes(secaoDe(ag.partes, /tabelas alteradas|funcoes de dados/)));
    const decisoes = juntaSecoes(secaoDe(ag.partes, /decis/));
    const alteracoes = converteTabelas(alt, { chaveVira: 'Ticket' });
    const texto = [
      '---', 'tipo: sprint', `sprint: ${valorFm(label)}`, `entrega: ${valorFm(ag.entrega)}`, 'estado: concluído', '---', '',
      `# AIMM ${label}`, '',
      '## Tickets da sprint', '', ...renderTabela(['Ticket', 'AIMM', 'Features', 'Resumo'], linhasTk), '',
      '## Alterações em funcionalidades por Agrupamento Funcional', '', ...alteracoes, '',
      '## Funções de dados alteradas', '', ...dados, ...(dados.length ? [''] : []),
      ...extras.flatMap((x) => [`## ${x.titulo}`, '', ...x.corpo, '']),
      '## Decisões pendentes', '', ...decisoes, ...(decisoes.length ? [''] : []),
      '## Changelog', '', ...renderTabela(['Data', 'Autor', 'Tipo', 'Descrição'],
        [[OPCOES.hoje, 'migra-aim', 'AIMM da sprint migrada', `relatório agregado \`${rel(raiz, ag.file)}\` → AIMM da sprint`]]), '',
    ].join('\n');
    planosSprint.push({ label, arq, texto, ag, tickets: ks.length });
  }

  // 6. Os N3: `## Origem` com o cabeçalho novo, os links para a AIMM e os carimbos.
  const chaveDoAlvo = (nome) => {
    const K = apelido.get(nome.toLowerCase()) || nome.toUpperCase();
    return (tickets.get(K) || {}).chave || K;
  };
  const aimPorChave = new Map(planosAim.map((p) => [p.K.toUpperCase(), p]));
  const LINK_ANTIGO = /\]\(([^)]*?(?:demandas|_backlog)\/([^)/]+?)\.md)\)/g;
  const COMENTARIOS = [
    ['Incluir apenas se houver demanda de origem (história/issue/experimento)', 'Incluir apenas se houver ticket de origem (ServiceNow, issue, experimento)'],
    ['quando a demanda numera os critérios', 'quando o ticket numera os critérios'],
    ['(linha de Numeração do artefato do backlog)', '(linha de Numeração da AIMM do ticket)'],
    ['Só se a extração atende a uma demanda registrada (ex.: a história que pediu a documentação do sistema)', 'Só se a extração atende a um ticket registrado (ex.: o ticket que pediu a documentação do sistema, com a sua AIMM)'],
  ];
  const novoN3 = new Map(); // arquivo → texto novo
  for (const f of modelo.features) {
    const antes = textoN3.get(f.file);
    const eol = antes.includes('\r\n') ? '\r\n' : '\n';
    const linhas = antes.split(/\r?\n/);
    const sec = sectionSlice(linhas, 'Origem');
    if (!sec) continue;
    let mudou = false;
    let cabFeito = false;
    for (let i = sec.start + 1; i < sec.end; i++) {
      let l = linhas[i];
      if (!cabFeito && /^\s*\|/.test(l)) {
        cabFeito = true;
        const cells = splitRow(l);
        if (/demanda|hist[óo]ria/i.test(cells[0] || '')) { cells[0] = 'Ticket (AIMM)'; l = linhaTab(cells); }
      }
      l = l.replace(LINK_ANTIGO, (_, _alvo, nome) => `](${rel(dirname(f.file), join(DIR_AIMM, `AIMM-${chaveDoAlvo(nome)}.md`))})`);
      for (const [a, b] of COMENTARIOS) l = l.split(a).join(b);
      const st = l.trim().match(new RegExp(STAMP_RE.source));
      if (st) {
        const K = st[1].toUpperCase();
        const c = carimbosN3.get(K);
        const plano = aimPorChave.get(K);
        if (c && c.registro && plano && st[2] === fingerprintText(c.registro.file, c.registro.texto)) {
          l = l.replace(st[2], fingerprintText(plano.arqAim, plano.texto));
          r.recarimbados++;
        } else if (plano) r.suspeitosMantidos++;
      }
      if (l !== linhas[i]) { linhas[i] = l; mudou = true; }
    }
    if (mudou) { novoN3.set(f.file, linhas.join(eol)); r.n3.push(rel(raiz, f.file)); }
  }

  // 7. Os carimbos da `## Features` (feature → fingerprint do N3, já com a Origem nova).
  for (const p of planosAim) {
    const linhas = [];
    for (const c of p.carimbosFeat) {
      const n3 = n3PorId.get(c.id);
      if (n3 && c.hash === fingerprintText(n3.file, textoN3.get(n3.file))) {
        linhas.push(`<!-- trace-verified: ${c.id} @ ${fingerprintText(n3.file, novoN3.get(n3.file) ?? textoN3.get(n3.file))} -->`);
        r.recarimbados++;
      } else {
        linhas.push(`<!-- trace-verified: ${c.id} @ ${c.hash} -->`);
        r.suspeitosMantidos++;
      }
    }
    p.texto = p.texto.replace('@@CARIMBOS_FEATURES@@\n', linhas.length ? `${linhas.join('\n')}\n` : '');
  }

  // 8. INDEX e CONTAGEM-PF.
  const outros = [];
  const idx = join(raiz, 'modules', 'INDEX.md');
  if (existsSync(idx)) {
    const antes = ler(idx);
    const linhas = antes.split(/\r?\n/);
    const eol = antes.includes('\r\n') ? '\r\n' : '\n';
    let naRastreab = false;
    let cabFeito = false;
    for (let i = 0; i < linhas.length; i++) {
      let l = linhas[i];
      if (/^##\s/.test(l)) { naRastreab = /^##\s+Rastreabilidade/.test(l); cabFeito = false; }
      l = l.replace(/^(##\s+Rastreabilidade:\s*)(hist[óo]ria|demanda)(\s*→)/i, '$1ticket$3');
      if (naRastreab && !cabFeito && /^\s*\|/.test(l)) {
        cabFeito = true;
        const cells = splitRow(l);
        if (/demanda|hist[óo]ria/i.test(cells[0] || '')) { cells[0] = 'Ticket (AIMM)'; l = linhaTab(cells); }
      }
      l = l.replace(LINK_ANTIGO, (_, _alvo, nome) => `](../analise-impacto/AIMM-${chaveDoAlvo(nome)}.md)`);
      linhas[i] = l;
    }
    const depois = linhas.join(eol);
    if (depois !== antes) outros.push([idx, depois]);
  }
  const cpf = join(raiz, 'global', 'CONTAGEM-PF.md');
  if (existsSync(cpf)) {
    const antes = ler(cpf);
    const depois = antes.split('Alteração pendente (demanda)').join('Alteração pendente (ticket)');
    if (depois !== antes) outros.push([cpf, depois]);
  }

  // 9. Grava.
  mkdirSync(DIR_AIMM, { recursive: true });
  for (const p of planosAim) {
    writeFileSync(p.arqAim, p.texto);
    r.aims.push(p.arqAim);
    r.tickets.push({ aim: rel(raiz, p.arqAim), estado: p.estado, abertaNaEntrega: p.abertaNaEntrega, fontes: p.fontes });
  }
  for (const p of planosSprint) {
    writeFileSync(p.arq, p.texto);
    r.aims.push(p.arq);
    r.sprints.push({ aim: rel(raiz, p.arq), fonte: rel(raiz, p.ag.file), tickets: p.tickets });
  }
  for (const [f, txt] of novoN3) writeFileSync(f, txt);
  for (const [f, txt] of outros) { writeFileSync(f, txt); r.outros.push(rel(raiz, f)); }
  for (const n of ['_TEMPLATE_AIMM.md', '_TEMPLATE_AIMM_SPRINT.md']) {
    const dest = join(DIR_AIMM, n);
    if (existsSync(dest)) continue;
    if (existsSync(join(MOLDES_AIMM, n))) { copyFileSync(join(MOLDES_AIMM, n), dest); r.moldes.push(rel(raiz, dest)); } else pend(`molde ${n} não encontrado no engine — copie de engine/templates/analise-impacto/.`);
  }

  // 10. Apaga o formato anterior migrado (e o .html gerado de cada um).
  const migrados = new Set([
    ...moldesAntigos,
    ...planosAim.flatMap((p) => [p.t.registro && p.t.registro.file, ...p.t.aims.map((a) => a.file), p.t.relatorio && p.t.relatorio.file]),
    ...planosSprint.map((p) => p.ag.file),
  ].filter(Boolean));
  for (const f of [...migrados].sort()) {
    for (const x of [f, f.replace(/\.md$/, '.html')]) {
      if (existsSync(x)) { rmSync(x); r.apagados.push(rel(raiz, x)); }
    }
  }
  for (const d of [join('arquivos', 'demandas'), 'arquivos', 'demandas', 'impactos', join('modules', '_backlog')]) {
    const dir = join(raiz, d);
    if (existsSync(dir) && statSync(dir).isDirectory() && !readdirSync(dir).length) rmSync(dir, { recursive: true });
  }
  return r;
}

// ─────────────────────────── conferência ───────────────────────────
function roda(script, argumentos) {
  const x = spawnSync(process.execPath, [join(SCRIPTS, script), ...argumentos], { encoding: 'utf8' });
  return { ok: x.status === 0, out: `${x.stdout || ''}${x.stderr || ''}`.trim() };
}
function confere(raiz, aims) {
  return {
    aims: aims.map((f) => ({ f: rel(raiz, f), ...roda('validate-impact.mjs', [f, '--root', raiz]) })),
    audit: roda('audit-trace-links.mjs', ['--root', raiz]),
    suspeitos: roda('suspect-links.mjs', ['--root', raiz]),
    antigos: citamFormatoAnterior(raiz),
  };
}
// Arquivos da instância que ainda citam o formato anterior — revisão à mão (o CLAUDE.md,
// o MASTER, o spec-guard.yml copiado do template antigo…). O engine e as AIMMs, que citam
// as fontes no Changelog de propósito, ficam de fora.
function citamFormatoAnterior(raiz) {
  const out = [];
  const pula = /^(\.git|node_modules|engine|scripts|\.claude|analise-impacto)(\/|$)/;
  (function anda(dir) {
    for (const n of readdirSync(dir)) {
      const p = join(dir, n);
      const r = rel(raiz, p);
      if (pula.test(r)) continue;
      if (statSync(p).isDirectory()) { anda(p); continue; }
      if (!/\.(md|ya?ml|json)$/.test(n)) continue;
      if (/\bdemandas\/|\bimpactos\/|ANALISE_IMPACTO_|PROMPT_BACKLOG|PROMPT_IMPACTO/.test(ler(p))) out.push(r);
    }
  })(raiz);
  return out.sort();
}

// ─────────────────────────── relatório ───────────────────────────
function relata(r, c, simulacao) {
  console.log(`migra-aim — ${RAIZ}${simulacao ? '  (simulação: nada foi gravado — --write aplica)' : ''}\n`);
  const nada = !r || ![r.tickets, r.sprints, r.n3, r.outros, r.apagados, r.moldes].some((x) => x.length);
  if (nada) {
    console.log('✓ Nada a migrar: não há registro, AIMM antiga nem relatório no formato anterior que a migração junte.');
    for (const p of (r ? r.pendencias : [])) console.log(`  ⚠️  ${p}`);
    return;
  }
  console.log(`AIMMs dos tickets (${r.tickets.length}):`);
  for (const t of r.tickets) console.log(`  + ${t.aim}  ${t.estado}${t.abertaNaEntrega ? ' · aberta na entrega' : ''}\n      ← ${t.fontes.join(' + ')}`);
  console.log(`AIMMs das sprints (${r.sprints.length}):`);
  for (const s of r.sprints) console.log(`  + ${s.aim}  ${s.tickets} ticket(s) ← relatório \`${s.fonte}\``);
  if (r.moldes.length) console.log(`Moldes: ${r.moldes.map((m) => `+ ${m}`).join(' · ')}`);
  console.log(`N3 com a ## Origem atualizada (${r.n3.length}):${r.n3.length ? `\n  ~ ${r.n3.join('\n  ~ ')}` : ' nenhum'}`);
  if (r.outros.length) console.log(`Outros: ${r.outros.map((o) => `~ ${o}`).join(' · ')}`);
  console.log(`Carimbos trace-verified: ${r.recarimbados} recarimbado(s) — válidos antes; ${r.suspeitosMantidos} mantido(s) como estavam — já suspeitos.`);
  console.log(`${simulacao ? 'Seriam apagados' : 'Apagados'} (${r.apagados.length}):${r.apagados.length ? `\n  - ${r.apagados.join('\n  - ')}` : ' nenhum'}`);
  if (r.pendencias.length) {
    console.log(`\nPendências manuais (${r.pendencias.length}):`);
    for (const p of r.pendencias) console.log(`  ⚠️  ${p}`);
  }
  console.log(`\nConferência${simulacao ? ' (na cópia simulada)' : ''}:`);
  const ruins = c.aims.filter((a) => !a.ok);
  console.log(`  validate-impact: ${c.aims.length - ruins.length}/${c.aims.length} AIMM(s) bem-formada(s)`);
  for (const a of ruins) console.log(`    ✗ ${a.f}\n${a.out.split('\n').slice(1).map((l) => `      ${l.trim()}`).filter((l) => l.trim()).join('\n')}`);
  const resumo = (x) => x.out.split('\n').filter((l) => /^[✓✗]/.test(l.trim()))[0] || x.out.split('\n')[0];
  console.log(`  audit-trace-links: ${resumo(c.audit)}`);
  if (!c.audit.ok) console.log(c.audit.out.split('\n').filter((l) => /^\s+- /.test(l)).slice(0, 12).map((l) => `    ${l.trim()}`).join('\n'));
  console.log(`  suspect-links: ${resumo(c.suspeitos)}`);
  if (c.antigos.length) {
    console.log(`\nAinda citam o formato anterior (revise à mão):\n  ${c.antigos.slice(0, 15).join('\n  ')}${c.antigos.length > 15 ? `\n  … e mais ${c.antigos.length - 15}` : ''}`);
  }
  console.log(simulacao
    ? '\nPara aplicar: node scripts/migra-aim.mjs --write [--avalizado-por "<quem>"]'
    : '\nDepois: recopie o spec-guard.yml de engine/templates/ci/ para .github/workflows/, rode `node scripts/atualiza-pages.mjs` e faça o commit.');
}

// ─────────────────────────── principal ───────────────────────────
if (has('--write')) {
  const r = migrar(RAIZ, OPCOES);
  relata(r, r ? confere(RAIZ, r.aims) : null, false);
} else {
  const tmp = mkdtempSync(join(tmpdir(), 'migra-aim-'));
  try {
    cpSync(RAIZ, tmp, { recursive: true, filter: (src) => !/(^|\/)(\.git|node_modules)(\/|$)/.test(rel(RAIZ, src)) });
    const r = migrar(tmp, OPCOES);
    relata(r, r ? confere(tmp, r.aims) : null, true);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}
