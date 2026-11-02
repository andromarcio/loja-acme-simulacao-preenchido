import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { frontMatter } from './front-matter.mjs';
import { FEATURE_ID_RE, splitRow } from './trace-index.mjs';
import { ehSecao } from './niveis.mjs';
import { impactFiles } from './impact-files.mjs';

const LEDGER = /^<!-- docqui:n3-ids (.+) -->\r?$/gm;
const validId = value => new RegExp(`^${FEATURE_ID_RE.source}$`).test(value) && !value.endsWith('-00');
const read = path => existsSync(path) ? readFileSync(path, 'utf8') : null;
const plain = value => value.replace(/[*`]/g, '').trim();
const idsIn = text => [...String(text || '').matchAll(new RegExp(FEATURE_ID_RE.source, 'g'))].map(m => m[0]);

export function artifactId(text, level) {
  if (!text) return null;
  const line = text.split(/\r?\n/).find(l => new RegExp(`^>\\s*\\*\\*Nível ${level}\\*\\*`).test(l));
  return line?.match(level === 2 ? /`([A-Z]{3}-[A-Z]{3})`/ : /`([A-Z]{3}-[A-Z]{3}-\d{2})`/)?.[1] || null;
}

export function readN2(text) {
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex(line => ehSecao(line, 'Funcionalidades'));
  if (start < 0) throw new Error('N2 sem seção ## Funcionalidades.');
  let end = lines.findIndex((line, index) => index > start && /^## /.test(line));
  if (end < 0) end = lines.length;
  let header = null;
  const rows = [];
  for (let index = start + 1; index < end; index++) {
    const line = lines[index];
    if (!line.trim().startsWith('|') || /^\|[\s:|-]+\|$/.test(line.trim())) continue;
    const cells = splitRow(line);
    if (!header) { header = cells; continue; }
    const column = header.findIndex(name => /^(?:Funcionalidade|Feature)(?:\s|\(|$)/i.test(name));
    if (column < 0) throw new Error('Tabela Funcionalidades sem coluna Funcionalidade.');
    const cell = cells[column];
    const link = cell?.match(/\[([^\]]+)\]\(([^)]+)\)/);
    if (!link) throw new Error(`Linha ${index + 1}: funcionalidade sem link para o N3.`);
    const path = link[2].replace(/^\.\//, '');
    if (!/^f-[^/\\<>[\]#?]+\.md$/.test(path)) throw new Error(`Linha ${index + 1}: caminho de N3 inválido: ${path}.`);
    const idColumn = header.findIndex(name => /^ID(?:\s|$)/i.test(plain(name)));
    const declared = [...cell.matchAll(/<small>(.*?)<\/small>/g)].map(match => plain(match[1]));
    if (idColumn >= 0) declared.push(plain(cells[idColumn]));
    for (const value of declared) {
      if (!value || value === '—' || /[\[\]<>]|\b(?:SIGLA|SAF|SFS|NN)\b/.test(value)) continue;
      if (!validId(value)) throw new Error(`Linha ${index + 1}: ID declarado inválido: ${value}; não será renumerado.`);
    }
    const ids = [...new Set([...idsIn(cell), ...(idColumn >= 0 ? idsIn(cells[idColumn]) : [])])];
    if (ids.length > 1) throw new Error(`Linha ${index + 1}: mais de um ID na funcionalidade.`);
    rows.push({ path, name: plain(link[1]), id: ids[0] || null, index, column, idColumn });
  }
  const ledgers = [...text.matchAll(LEDGER)];
  if (lines.filter(line => /^<!-- docqui:n3-ids/.test(line)).length !== ledgers.length) throw new Error('Registro docqui:n3-ids malformado.');
  if (ledgers.length > 1) throw new Error('Registro docqui:n3-ids duplicado.');
  const ledger = ledgers.length ? JSON.parse(ledgers[0][1]) : null;
  if (ledgers.length && (!ledger || ledger.version !== 1 || !ledger.ids || typeof ledger.ids !== 'object' || Array.isArray(ledger.ids))) {
    throw new Error('Registro docqui:n3-ids inválido.');
  }
  for (const [id, path] of Object.entries(ledger?.ids || {})) {
    if (!validId(id) || (path !== null && (typeof path !== 'string' || !/^f-[^/\\<>[\]#?]+\.md$/.test(path)))) {
      throw new Error(`Reserva inválida no registro docqui:n3-ids: ${id}.`);
    }
  }
  if (!header || (!rows.length && !ledger)) throw new Error('Tabela Funcionalidades vazia; confirme a jornada antes de numerar.');
  const telas = lines.findIndex(line => /^## Telas\s*$/.test(line));
  const references = [];
  if (telas >= 0) for (let i = telas + 1; i < lines.length && !/^## /.test(lines[i]); i++) {
    for (const row of rows) {
      const name = row.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      for (const match of lines[i].matchAll(new RegExp(`\\*\\*${name}\\*\\*\\s*<small>(.*?)</small>`, 'g'))) {
        const id = idsIn(match[1])[0];
        if (id) references.push({ id, path: row.path });
      }
    }
  }
  return { id: artifactId(text, 2), rows, ledger, lines, references };
}

function git(root, args, input) {
  const result = spawnSync('git', ['-C', root, ...args], {
    input, encoding: input ? undefined : 'utf8', maxBuffer: 64 * 1024 * 1024,
  });
  if (result.status !== 0) throw new Error(result.error?.message || String(result.stderr || '').trim() || 'Falha ao consultar o histórico Git.');
  return result.stdout;
}

function baseline(root, folder, base) {
  const repository = spawnSync('git', ['-C', root, 'rev-parse', '--is-inside-work-tree'], { encoding: 'utf8' });
  if (repository.status !== 0) {
    if (base) throw new Error('--base exige um repositório Git.');
    if (repository.error && repository.error.code !== 'ENOENT') throw repository.error;
    return { files: new Map(), used: [], renames: new Map(), shallow: false };
  }
  const head = base || 'HEAD';
  const commits = git(root, ['rev-list', '--all', '--max-count=1']).trim();
  if (!commits) {
    if (base) throw new Error(`Base Git inexistente: ${base}.`);
    return { files: new Map(), used: [], renames: new Map(), shallow: false };
  }
  git(root, ['rev-parse', '--verify', `${head}^{commit}`]);
  const paths = git(root, ['ls-tree', '-r', '--name-only', '-z', head, '--', folder])
    .split('\0').filter(path => path.endsWith('.md') && dirname(path).replace(/\\/g, '/') === folder);
  const files = new Map();
  if (paths.length) {
    const blobs = git(root, ['cat-file', '--batch'], Buffer.from(paths.map(path => `${head}:${path}`).join('\n') + '\n'));
    let offset = 0;
    for (const path of paths) {
      const end = blobs.indexOf(10, offset);
      const header = blobs.subarray(offset, end).toString('utf8').match(/^[0-9a-f]+ blob (\d+)$/);
      if (!header) throw new Error(`Não foi possível ler a base de ${path}.`);
      const size = Number(header[1]);
      files.set(path.slice(folder.length + 1), blobs.subarray(end + 1, end + size + 1).toString('utf8'));
      offset = end + size + 2;
    }
  }
  const changes = git(root, ['diff', '--no-ext-diff', '--no-textconv', '--find-renames', '--name-status', '-z', head, '--', folder]).split('\0');
  const renames = new Map();
  for (let i = 0; changes[i];) {
    const status = changes[i++], old = changes[i++];
    if (/^[RC]/.test(status)) {
      const path = changes[i++];
      if (status[0] === 'R') renames.set(old.slice(folder.length + 1), path.slice(folder.length + 1));
    }
  }
  const history = git(root, ['log', head, '--format=', '--no-ext-diff', '--no-textconv', '-p', '--', folder]);
  return { files, used: idsIn(history), renames, shallow: git(root, ['rev-parse', '--is-shallow-repository']).trim() === 'true' };
}

export function planN3Ids(root, readme, { base = null } = {}) {
  root = resolve(root);
  readme = resolve(readme);
  const folder = relative(root, dirname(readme)).replace(/\\/g, '/');
  if (!/^modules\/[^/]+\/[^/]+$/.test(folder) || basename(readme) !== 'README.md') throw new Error('Informe o README.md de um Agrupamento Funcional em modules\\<domínio>\\<agrupamento-funcional>.');
  const text = read(readme);
  if (!text) throw new Error(`N2 não encontrado: ${readme}. Confirme e registre a jornada antes de atribuir IDs.`);
  const current = readN2(text);
  if (!current.id) throw new Error('N2 sem ID de Agrupamento Funcional válido no subtítulo.');
  const previous = baseline(root, folder, base);
  const oldText = previous.files.get('README.md');
  const old = oldText ? readN2(oldText) : null;
  if (old?.id && old.id !== current.id) throw new Error(`ID do Agrupamento Funcional imutável: ${old.id}; recebido ${current.id}.`);
  if (old?.ledger && !current.ledger) throw new Error('Registro docqui:n3-ids removido: restaure as reservas da base, sem renumerar.');
  if (previous.shallow && !current.ledger) throw new Error('Histórico Git raso: complete o histórico antes de registrar reservas (git fetch --unshallow).');
  const reserved = new Map(), owners = new Map(), errors = [];
  const maxKnown = new Set();
  function reserve(id, path, source) {
    if (!validId(id) || !id.startsWith(current.id + '-')) { errors.push(`${source}: ID inválido ou de outro Agrupamento Funcional: ${id}.`); return; }
    maxKnown.add(id);
    const renamed = previous.renames.get(path) || path;
    const existing = reserved.get(id);
    if (reserved.has(id) && existing !== renamed) {
      errors.push(`${source}: ID imutável ${id} já reservado para ${existing || 'funcionalidade retirada'}.`); return;
    }
    if (renamed && owners.has(renamed) && owners.get(renamed) !== id) {
      errors.push(`${source}: ${renamed} já tem o ID imutável ${owners.get(renamed)}, não ${id}.`); return;
    }
    reserved.set(id, renamed);
    if (renamed) owners.set(renamed, id);
  }
  for (const [id, path] of Object.entries(old?.ledger?.ids || {})) reserve(id, path, 'Reserva na base');
  for (const row of old?.rows || []) if (row.id) reserve(row.id, row.path, 'N2 na base');
  for (const reference of old?.references || []) reserve(reference.id, reference.path, 'Telas na base');
  for (const [path, md] of previous.files) {
    if (!path.startsWith('f-')) continue;
    const id = artifactId(md, 3) || frontMatter(md.split(/\r?\n/))?.id;
    if (id) reserve(id, path, 'N3 na base');
  }
  for (const id of previous.used) if (id.startsWith(current.id + '-') && validId(id)) {
    maxKnown.add(id);
    if (!reserved.has(id)) reserved.set(id, null);
  }
  for (const [id, path] of Object.entries(current.ledger?.ids || {})) reserve(id, path, 'Reserva atual');
  for (const row of current.rows) if (row.id) reserve(row.id, row.path, 'N2 atual');
  for (const reference of current.references) reserve(reference.id, reference.path, 'Telas atuais');
  const missingN3Ids = [];
  for (const name of readdirSync(dirname(readme)).filter(name => /^f-.*\.md$/.test(name))) {
    const md = read(join(dirname(readme), name));
    const subtitle = artifactId(md, 3), fm = frontMatter(md.split(/\r?\n/))?.id;
    if (subtitle && fm && subtitle !== fm) errors.push(`${name}: ID do front-matter ${fm} difere do subtítulo ${subtitle}.`);
    const id = subtitle || fm;
    if (!id) {
      if (current.rows.some(row => row.path === name)) missingN3Ids.push(name);
      else errors.push(`${name}: N3 sem ID e fora da tabela Funcionalidades do N2.`);
    }
    else reserve(id, name, 'N3 atual');
  }
  // Referências e histórico reservam números mesmo quando o N3 já foi retirado.
  const aims = join(root, 'analise-impacto');
  const aimIds = impactFiles(aims).flatMap(name => idsIn(read(join(aims, name))));
  for (const id of [...idsIn(text), ...idsIn(read(join(root, 'modules', 'INDEX.md'))), ...aimIds]) {
    if (id.startsWith(current.id + '-') && validId(id)) {
      maxKnown.add(id);
      if (!reserved.has(id)) reserved.set(id, null);
    }
  }
  if (current.ledger && old?.ledger) for (const id of Object.keys(old.ledger.ids)) {
    if (!Object.hasOwn(current.ledger.ids, id)) errors.push(`Reserva imutável ${id} foi removida do registro docqui:n3-ids.`);
  }
  const paths = new Set(), names = new Set(), pending = [];
  let next = Math.max(0, ...[...maxKnown].map(id => Number(id.slice(-2)))) + 1;
  const rows = current.rows.map(row => {
    if (paths.has(row.path)) errors.push(`Funcionalidade duplicada na tabela: ${row.path}.`);
    if (names.has(row.name)) errors.push(`Nome repetido na tabela: ${row.name}.`);
    paths.add(row.path); names.add(row.name);
    let id = owners.get(row.path);
    if (!id) {
      if (next > 99) { errors.push(`Sequência ${current.id} esgotada (99): não renumere nem reutilize IDs.`); return row; }
      id = `${current.id}-${String(next++).padStart(2, '0')}`;
      reserve(id, row.path, 'Nova reserva');
    }
    if (row.id !== id) pending.push({ ...row, id });
    return { ...row, id };
  });
  const ledger = { version: 1, ids: Object.fromEntries([...reserved].sort(([a], [b]) => a.localeCompare(b))) };
  if (errors.length) throw new Error(errors.join('\n'));
  return { root, readme, text, ...current, rows, pending, ledger, next, missingN3Ids, registration: !current.ledger || JSON.stringify(current.ledger) !== JSON.stringify(ledger) };
}

export function checkN3Identity(root, file, base = null) {
  const folder = relative(root, dirname(file)).replace(/\\/g, '/');
  if (!/^modules\/[^/]+\/[^/]+$/.test(folder)) throw new Error('N3 fora de modules\\<domínio>\\<agrupamento-funcional>.');
  const current = read(file);
  if (!current) throw new Error(`N3 inexistente: ${file}.`);
  const id = artifactId(current, 3), fm = frontMatter(current.split(/\r?\n/))?.id;
  if (!validId(id || fm || '') || (id && fm && id !== fm)) throw new Error('ID do N3 ausente, inválido ou divergente entre front-matter e subtítulo.');
  const previous = baseline(root, folder, base);
  const name = relative(dirname(file), file);
  const oldPath = [...previous.renames].find(([, path]) => path === name)?.[0] || name;
  const old = previous.files.get(oldPath);
  const oldId = old && (artifactId(old, 3) || frontMatter(old.split(/\r?\n/))?.id);
  if (oldId && oldId !== (id || fm)) throw new Error(`ID imutável do N3: ${oldId}; recebido ${id || fm}.`);
  for (const path of readdirSync(dirname(file)).filter(path => /^f-.*\.md$/.test(path) && path !== name)) {
    const other = read(join(dirname(file), path));
    if ((artifactId(other, 3) || frontMatter(other.split(/\r?\n/))?.id) === (id || fm)) throw new Error(`ID duplicado ${(id || fm)} também em ${path}.`);
  }
  return id || fm;
}

export function applyN3IdPlan(plan, version, date) {
  const lines = [...plan.lines];
  for (const row of plan.pending) {
    const cells = splitRow(lines[row.index]);
    cells[row.column] = cells[row.column].replace(/\s*<small>.*?<\/small>/g, '').trim() + ` <small>${row.id}</small>`;
    if (row.idColumn >= 0) cells[row.idColumn] = row.id;
    lines[row.index] = `| ${cells.join(' | ')} |`;
  }
  // Referências em Telas são consumo do ID reservado, nunca a fonte da sequência.
  const start = lines.findIndex(line => /^## Telas\s*$/.test(line));
  if (start >= 0) for (let i = start + 1; i < lines.length && !/^## /.test(lines[i]); i++) {
    for (const row of plan.rows) {
      const name = row.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      lines[i] = lines[i].replace(new RegExp(`\\*\\*${name}\\*\\*(?:\\s*<small>(.*?)</small>)?`, 'g'), (match, existing) => {
        const id = idsIn(existing)[0];
        if (id && id !== row.id) throw new Error(`Telas: ${row.name} cita ${id}, mas o ID imutável é ${row.id}.`);
        return `**${row.name}** <small>${row.id}</small>`;
      });
    }
  }
  const comment = `<!-- docqui:n3-ids ${JSON.stringify(plan.ledger)} -->`;
  const existing = lines.findIndex(line => /^<!-- docqui:n3-ids /.test(line));
  if (existing >= 0) lines[existing] = comment;
  else {
    const section = lines.findIndex(line => ehSecao(line, 'Funcionalidades'));
    lines.splice(section + 1, 0, '', comment);
  }
  const changelog = lines.findIndex(line => /^## Changelog\s*$/.test(line));
  if (changelog < 0) throw new Error('N2 sem ## Changelog: registre a seção antes de aplicar a sequência.');
  const nextSection = lines.findIndex((line, index) => index > changelog && /^## /.test(line));
  const separator = lines.findIndex((line, index) => index > changelog && (nextSection < 0 || index < nextSection) && /^\|[\s:|-]+\|$/.test(line.trim()));
  if (separator < 0) throw new Error('Changelog do N2 sem tabela; não foi alterado.');
  lines.splice(separator + 1, 0, `| ${date} | ids-n3 | IDs reservados | ${plan.pending.length ? plan.pending.map(row => `${row.id} — ${row.name}`).join('; ') : 'Registro dos IDs existentes, sem renumeração'}; IDs imutáveis. |`);
  const stamp = `<!-- docqui: ${version} | prompt: IDS_N3 | atualizado: ${date} -->`;
  if (/^<!-- docqui:/.test(lines[0])) lines[0] = stamp;
  else lines.unshift(stamp);
  const output = lines.join(plan.text.includes('\r\n') ? '\r\n' : '\n');
  if ((output.match(/^## /gm) || []).length !== (plan.text.match(/^## /gm) || []).length) throw new Error('A aplicação alterou a quantidade de seções do N2.');
  return output;
}
