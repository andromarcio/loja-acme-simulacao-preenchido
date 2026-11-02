// trace-index.mjs — modelo compartilhado da rastreabilidade ticket ↔ funcionalidade ↔ código.
// Varre uma instância (modules/ + analise-impacto/) e devolve, em memória, o que está
// registrado nas três fontes do elo:
//
//   1. `## Origem` de cada N3            (funcionalidade → tickets)
//   2. `## Funcionalidades` da AIMM de cada      (ticket → funcionalidades)
//      ticket, `analise-impacto/AIMM-<CHAVE>.md` (`tipo: ticket`)
//   3. `## Rastreabilidade: ticket → spec → código` do `modules/INDEX.md`
//
// Consumido por: audit-trace-links.mjs (consistência), suspect-links.mjs (carimbos
// trace-verified) e build-trace-data.mjs (mapa visual). Determinístico: só leitura
// de disco, sem git e sem rede. Placeholders de template (STRYxxxxxxx, [SIGLA]-…)
// são filtrados pelos próprios regex de ID (exigem dígitos reais).

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';
import { createHash } from 'node:crypto';
import { frontMatterEstado } from './front-matter.mjs';
import { impactFiles, impactKey, resolveImpactFile } from './impact-files.mjs';
import { nomesDaSecao } from './niveis.mjs';

// Chave do ticket de origem — plugável (1.6.0): ServiceNow (STRY…), issue (ISSUE-123)
// ou experimento (EXP-…, letras/dígitos/hífen/underscore — sem ponto, para a chave não
// engolir a extensão do arquivo). Prefixos fixos mantêm a detecção determinística; não
// use `EXP` como SIGLA de domínio. Prefixos estreitos de propósito — um padrão Jira
// genérico ([A-Z]+-\d+) colidiria com os IDs de funcionalidade (ex.: CAR-01). Chave em outro
// formato (Jira `PRJ25001-49`) é reconhecida pelo link para a AIMM do ticket
// (`AIMM-<CHAVE>.md` — ver `keyOf`). Projeto novo com prefixo próprio se acrescenta aqui.
export const STORY_KEY_RE = /\b(?:STRY\d{4,}|ISSUE-\d{1,7}|PDTIC\d+-\d{1,7}|EXP-[A-Za-z0-9][A-Za-z0-9_-]*)\b/i;
export const FEATURE_ID_RE = /\b[A-Z]{3}-[A-Z]{3}-\d{2}\b/;
// Os ícones da legenda da esteira (modules/INDEX.md) — também os estados anteriores a
// 📋 especificado: sem eles, "✏️ Rascunho" na AIMM e "📝 …" no INDEX não se comparam.
export const STATUS_ICONS = ['✏️', '📝', '🧱', '📋', '🔄', '✅', '⚠️', '❌'];
// Estado do N3 → ícone (o mesmo ICONES do gates.py): é por ele que o Status da AIMM se
// compara com a fonte do ciclo de vida, o `estado` no front-matter do N3.
export const ICONE_DO_ESTADO = {
  rascunho: '✏️', 'requisitos-aprovados': '📝', 'modelo-validado': '🧱', especificado: '📋',
  'em-desenvolvimento': '🔄', implementado: '✅', 'revisao-necessaria': '⚠️', deprecado: '❌',
};
// Funcionalidade que o ticket cria e que ainda não tem N3: o roteamento do PROMPT_AIMM (passo 3)
// a registra na `## Funcionalidades` com o Status "📋 A especificar", e o 3A troca o Status ao
// criá-la. Enquanto não existe N3 com o ID, é pendência, não inconsistência.
export const A_ESPECIFICAR_RE = /\ba\s+especificar\b/i;
export const STAMP_RE = /<!--\s*trace-verified:\s*(\S+)\s*@\s*([0-9a-f]{7,40})\s*-->/g;

const read = (p) => readFileSync(p, 'utf8');
const isDir = (p) => existsSync(p) && statSync(p).isDirectory();

export function normalizeStoryKey(s) {
  const m = String(s || '').match(STORY_KEY_RE);
  return m ? m[0].toUpperCase() : null;
}

// Chave de uma célula da `## Origem` ou do INDEX: a do regex canônico ou, em qualquer
// formato, a do link para a AIMM do ticket (`…/analise-impacto/AIMM-<CHAVE>.md`).
export const AIMM_LINK_RE = /(?:^|[\\/(])AIMM?-([A-Za-z0-9][A-Za-z0-9_.-]*?)\.md\b/;
export const AIM_LINK_RE = AIMM_LINK_RE;
export function keyOf(cell) {
  const k = normalizeStoryKey(cell);
  if (k) return k;
  const m = String(cell || '').match(AIMM_LINK_RE);
  return m && !/^\[/.test(m[1]) ? m[1].toUpperCase() : null;
}

// Sobe a partir de `start` até achar a raiz da instância (pasta que contém modules/).
export function findInstanceRoot(start) {
  let dir = resolve(start);
  for (let i = 0; i < 15; i++) {
    if (isDir(join(dir, 'modules'))) return dir;
    const up = dirname(dir);
    if (up === dir) break;
    dir = up;
  }
  return null;
}

// Linhas (cruas) da seção cujo título `## …` começa com `prefix`, até o próximo `## `.
// Devolve { start, end, lines } com índices no array original, ou null.
export function sectionSlice(lines, prefix) {
  const nomes = nomesDaSecao(prefix);
  const start = lines.findIndex((l) => nomes.some((n) => l.trim().startsWith(`## ${n}`)));
  if (start === -1) return null;
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (lines[i].trim().startsWith('## ')) { end = i; break; }
  }
  return { start, end, lines: lines.slice(start + 1, end) };
}

export function splitRow(row) {
  return row.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
}

// Linhas de dados de uma tabela dentro de um slice (sem header e sem separador).
export function tableRowsOf(sliceLines) {
  const rows = sliceLines.map((l) => l.trim()).filter((l) => l.startsWith('|'));
  return rows.filter((r) => !/^\|[\s:|-]+\|$/.test(r)).slice(1);
}

// Links markdown [texto](alvo) de um slice — para checagem de referência quebrada.
export function linksOf(sliceLines) {
  const out = [];
  for (const l of sliceLines) {
    for (const m of l.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) out.push(m[1].trim());
  }
  return out;
}

export function stampsOf(sliceLines) {
  const out = [];
  for (const l of sliceLines) {
    for (const m of l.matchAll(STAMP_RE)) out.push({ target: m[1].toUpperCase(), hash: m[2] });
  }
  return out;
}

// Fingerprint do carimbo trace-verified (suspect-links): sha256 do conteúdo sem as linhas
// de carimbo — carimbar um artefato não muda o fingerprint dele. Da AIMM do ticket entram
// só a `## Descrição do ticket` e os `## Critérios de aceite`: o resto dela muda a cada
// versão sem mudar o que o ticket pede. Compartilhado com o migra-aim, que recarimba os
// elos válidos depois de mudar o conteúdo dos arquivos.
export const FINGERPRINT_SHORT = 12;
export function fingerprintText(file, text) {
  let lines = String(text).split(/\r?\n/);
  if (/(^|[\\/])analise-impacto[\\/]AIMM?-[^\\/]+\.md$/.test(file)) {
    lines = ['Descrição do ticket', 'Critérios de aceite'].flatMap((s) => (sectionSlice(lines, s) || { lines: [] }).lines);
  }
  const clean = lines.filter((l) => !new RegExp(STAMP_RE.source).test(l.trim()));
  return createHash('sha256').update(clean.join('\n')).digest('hex').slice(0, FINGERPRINT_SHORT);
}
export function fingerprintOf(file) {
  return fingerprintText(file, readFileSync(file, 'utf8'));
}

export function statusIconOf(cell) {
  for (const icon of STATUS_ICONS) if (String(cell || '').includes(icon)) return icon;
  return null;
}

function firstLine(lines, re) {
  return lines.find((l) => re.test(l)) || null;
}

// Campos simples (`campo: valor`) do front-matter — carimbo e linhas em branco antes do
// `---`, como o leitor único; o comentário de fim de linha não faz parte do valor.
export function frontMatterCampos(lines) {
  const out = {};
  let i = 0;
  while (i < lines.length && (!lines[i].trim() || /^\s*<!--.*-->\s*$/.test(lines[i]))) i++;
  if ((lines[i] || '').trim() !== '---') return out;
  for (i++; i < lines.length && lines[i].trim() !== '---'; i++) {
    const m = lines[i].match(/^([a-z][\w-]*):\s*(.*)$/i);
    if (m) out[m[1].toLowerCase()] = m[2].replace(/\s+#.*$/, '').trim().replace(/^(["'])(.*)\1$/, '$2');
  }
  return out;
}

// `estado` da esteira de checkpoints no front-matter do N3 (1.4.0+) — a fonte
// do ciclo de vida. Vem do leitor único (./front-matter.mjs), que tolera o carimbo
// de versão e linhas em branco antes do `---`, como o gates.py.
export { frontMatterEstado };

export function levelId(lines) {
  const line = firstLine(lines, /> \*\*Nível [0-3]\*\*/);
  if (!line) return null;
  const m = line.match(/`([A-Z]{2,6}(?:-[A-Z]{3})?(?:-\d{2})?)`/);
  return m ? m[1] : null;
}

export function titleOf(lines) {
  const line = (firstLine(lines, /^#\s+/) || '').trim();
  const m = line.match(/^#\s+[^:]*:\s*(.+)$/);
  return (m ? m[1] : line.replace(/^#\s+/, '')).trim() || null;
}

function collect(dir, pred, out) {
  let entries;
  try { entries = readdirSync(dir); } catch { return; }
  for (const name of entries) {
    if (name === 'node_modules' || name === '.git' || name === 'engine') continue;
    const p = join(dir, name);
    let st;
    try { st = statSync(p); } catch { continue; }
    if (st.isDirectory()) collect(p, pred, out);
    else if (pred(p)) out.push(p);
  }
}

// Placeholder de template: célula/linha ainda não preenchida.
const isPlaceholderCell = (s) => /\[(chave|dominio|funcionalidade|feature|SIGLA|SAF|SFS|NN)\b/i.test(s) || /STRYx|ISSUE-NNN|EXP-…/i.test(s);

// ---------------------------------------------------------------------------
// Varredura da instância
// ---------------------------------------------------------------------------
export function scanInstance(root) {
  const rel = (p) => relative(root, p).replace(/\\/g, '/');
  const model = { root, features: [], stories: [], index: null, problems: [] };

  // --- N3 (funcionalidades) --------------------------------------------------------
  const n3Files = [];
  collect(join(root, 'modules'), (p) => /(^|\/)modules\/[^/]+\/[^/]+\/f-[^/]+\.md$/.test(p.replace(/\\/g, '/')), n3Files);
  for (const file of n3Files.sort()) {
    let raw;
    try { raw = read(file); } catch { continue; }
    const lines = raw.split(/\r?\n/);
    const id = levelId(lines);
    const feat = {
      kind: 'feature', id, file, path: rel(file), title: titleOf(lines),
      origem: [], links: [], stamps: [], implRepos: [],
      estado: frontMatterEstado(lines), statusImpl: null,
    };
    const orig = sectionSlice(lines, 'Origem');
    if (orig) {
      for (const row of tableRowsOf(orig.lines)) {
        const cells = splitRow(row);
        if (!cells.length || isPlaceholderCell(cells[0])) continue;
        const key = keyOf(cells[0]);
        if (key) feat.origem.push({ key, tipo: cells[1] || '', note: cells[2] || '' });
      }
      feat.links.push(...linksOf(orig.lines).map((t) => ({ target: t, section: 'Origem' })));
      feat.stamps.push(...stampsOf(orig.lines));
    }
    const impl = sectionSlice(lines, 'Implementação');
    if (impl) {
      for (const row of tableRowsOf(impl.lines)) {
        const cells = splitRow(row);
        const repo = (cells[1] || '').replace(/[`[\]]/g, '').trim();
        if (repo && !/^[—–-]+$/.test(repo) && !/^\[?repo\]?$/i.test(repo) && !isPlaceholderCell(cells[1] || '')) feat.implRepos.push(repo);
      }
      const st = impl.lines.find((l) => /\*\*Status\*\*/.test(l));
      if (st) {
        const m = st.match(/\[x\]\s*(Especificado|Em desenvolvimento|Implementado|Deprecado)/i);
        if (m) feat.statusImpl = m[1];
      }
    }
    model.features.push(feat);
  }

  // --- AIMMs dos tickets (analise-impacto/AIMM-<CHAVE>.md, tipo: ticket) --------------
  // A AIMM da sprint (tipo: sprint) consolida tickets e não é um lado do elo; o '_'
  // exclui os templates.
  const aimDir = join(root, 'analise-impacto');
  if (isDir(aimDir)) {
    for (const name of impactFiles(aimDir)) {
      const file = join(aimDir, name);
      let raw;
      try { raw = read(file); } catch { continue; }
      const lines = raw.split(/\r?\n/);
      const fm = frontMatterCampos(lines);
      if ((fm.tipo || '').toLowerCase() !== 'ticket') continue;
      const key = (fm.ticket || impactKey(name)).toUpperCase();
      const story = {
        kind: 'story', key, file, path: rel(file), title: fm.titulo || titleOf(lines),
        feats: [], links: [], stamps: [],
      };
      const sec = sectionSlice(lines, 'Funcionalidades');
      if (sec) {
        // Status pela coluna de nome "Status" — a tabela tem Operação e Critérios no meio.
        const cab = splitRow(sec.lines.map((l) => l.trim()).find((l) => l.startsWith('|')) || '').map((c) => c.toLowerCase());
        const iSt = Math.max(cab.findIndex((c) => /^status$/.test(c)), 0);
        const aEspecificar = new Map(); // alvo do link → ID da funcionalidade a especificar
        for (const row of tableRowsOf(sec.lines)) {
          const cells = splitRow(row);
          if (!cells.length || isPlaceholderCell(cells[0])) continue;
          const m = cells[0].match(FEATURE_ID_RE);
          if (!m) continue;
          const pendente = A_ESPECIFICAR_RE.test(cells[iSt] || '');
          story.feats.push({ id: m[0], status: statusIconOf(cells[iSt]), aEspecificar: pendente });
          if (pendente) for (const t of linksOf([row])) aEspecificar.set(t, m[0]);
        }
        story.links.push(...linksOf(sec.lines).map((t) => ({
          target: t, section: 'Funcionalidades', ...(aEspecificar.has(t) ? { aEspecificar: aEspecificar.get(t) } : {}),
        })));
        story.stamps.push(...stampsOf(sec.lines));
      }
      model.stories.push(story);
    }
  }

  // --- INDEX.md ---------------------------------------------------------------
  const indexFile = join(root, 'modules', 'INDEX.md');
  if (existsSync(indexFile)) {
    const lines = read(indexFile).split(/\r?\n/);
    const idx = { file: indexFile, path: rel(indexFile), rows: [], links: [] };
    const sec = sectionSlice(lines, 'Rastreabilidade');
    if (sec) {
      // Colunas pelo CABEÇALHO: a coluna "Contagem" entrou entre Status e PF (commit
      // 36c15dc), e a leitura por posição passou a pegar o ícone da Contagem como PF —
      // o mapa recebia PF nulo. Sem o nome no cabeçalho, vale a posição do formato antigo.
      const cab = splitRow(sec.lines.map((l) => l.trim()).find((l) => l.startsWith('|')) || '')
        .map((c) => c.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase());
      const col = (re, padrao) => { const i = cab.findIndex((c) => re.test(c)); return i >= 0 ? i : padrao; };
      const iDom = col(/^dominio$/, 2), iSt = col(/^status$/, 3), iPF = col(/^pf$/, 4), iCFP = col(/^cfp$/, 5);
      for (const row of tableRowsOf(sec.lines)) {
        const cells = splitRow(row);
        if (!cells.length || isPlaceholderCell(cells[0]) || isPlaceholderCell(cells[1] || '')) continue;
        const key = keyOf(cells[0]);
        const fm = (cells[1] || '').match(FEATURE_ID_RE);
        if (key && fm) {
          idx.rows.push({
            key, featId: fm[0], domain: cells[iDom] || '', status: statusIconOf(cells[iSt]),
            pf: cells[iPF] || '', cfp: cells[iCFP] || '',
          });
        }
      }
      idx.links.push(...linksOf(sec.lines).map((t) => ({ target: t, section: 'Rastreabilidade (INDEX)' })));
    }
    model.index = idx;
  }

  return model;
}

// Resolve um alvo de link markdown relativo ao arquivo de origem; devolve
// { target, abs, exists } — alvos http(s) e âncoras puras são ignorados (null).
export function resolveLink(fromFile, target) {
  const t = String(target).trim();
  if (/^(https?:)?\/\//i.test(t) || t.startsWith('#') || t.startsWith('mailto:')) return null;
  if (/[[\]]/.test(t)) return null; // placeholder de template
  const clean = t.split('#')[0];
  if (!clean) return null;
  const abs = resolveImpactFile(resolve(dirname(fromFile), clean));
  return { target: t, abs, exists: existsSync(abs) };
}

// Índices auxiliares
export function featureById(model) {
  const map = new Map();
  for (const f of model.features) if (f.id) map.set(f.id, f);
  return map;
}
export function storyByKey(model) {
  const map = new Map();
  for (const s of model.stories) if (s.key) map.set(s.key, s);
  return map;
}
