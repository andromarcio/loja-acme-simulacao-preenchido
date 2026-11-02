// repos.mjs — o inventário de repositórios da instância (`repos/INDEX.md`) e a ligação
// funcionalidade → repositório declarada no `## Implementação` de cada N3.
//
// Por quê (pedido do PO, 2026-10-07): um sistema pode ter centenas de repositórios — na
// Caixa, uma sigla com mais de 200 microsserviços. A especificação continua organizada
// por negócio (N1 → N2 → N3); o microsserviço é ONDE a funcionalidade vive, e entra pelo
// inventário (uma linha por repositório) e pela tabela `## Implementação` do N3 (uma
// linha por repositório que realiza a funcionalidade). Daqui saem o índice reverso
// repositório → funcionalidades (gera-indice-repos.mjs) e a descoberta dos repositórios de
// código que o mapa-codigo varre.
//
// O inventário é a PRIMEIRA tabela do arquivo cujo cabeçalho começa por "Repositório";
// as colunas são lidas pelo nome (Domínio e Tipo são opcionais). Nome entre crases ou
// em link (`[nome](url)`) vale; placeholder (`[nome-backend]`, `—`) não.

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, basename } from 'node:path';

const semAcento = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const celulas = (l) => l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
const separador = (l) => /^\|[\s:|-]+\|?$/.test(l.trim());

// Célula de repositório real: nem vazia, nem placeholder `[…]`, nem traço.
export function repoReal(celula) {
  const t = String(celula || '').trim();
  if (!t || /^\[[^\]]*\]$/.test(t)) return null;
  const link = t.match(/^\[([^\]]+)\]\([^)]*\)$/);
  const v = (link ? link[1] : t).replace(/[`*]/g, '').trim();
  if (!v || /^[—–-]+$/.test(v) || /^repo$/i.test(v)) return null;
  return v;
}

// [{ nome, dominio, tipo, responsabilidade, stack }] ou null sem inventário.
export function inventario(root) {
  const arq = join(root, 'repos', 'INDEX.md');
  if (!existsSync(arq)) return null;
  const linhas = readFileSync(arq, 'utf8').split(/\r?\n/);
  for (let i = 0; i < linhas.length; i++) {
    if (!linhas[i].trim().startsWith('|')) continue;
    const cab = celulas(linhas[i]).map(semAcento);
    if (!/^repositorio/.test(cab[0] || '')) { while (i < linhas.length && linhas[i].trim().startsWith('|')) i++; continue; }
    const col = (re) => cab.findIndex((c) => re.test(c));
    const iDom = col(/^dominio/), iTipo = col(/^tipo/), iResp = col(/^responsabilidade/), iStack = col(/^stack/);
    const out = [];
    for (i++; i < linhas.length && linhas[i].trim().startsWith('|'); i++) {
      if (separador(linhas[i])) continue;
      const c = celulas(linhas[i]);
      const nome = repoReal(c[0]);
      if (!nome) continue;
      const v = (k) => (k >= 0 ? (c[k] || '').replace(/[`*]/g, '').trim() : '');
      out.push({ nome, dominio: v(iDom), tipo: v(iTipo), responsabilidade: v(iResp), stack: v(iStack) });
    }
    return out;
  }
  return null;
}

// O próprio repositório de documentação não é repositório de código: o de nome igual à
// pasta da instância, ou o que se declara "documentação".
export function ehRepoDeDoc(repo, root) {
  return repo.nome.toLowerCase() === basename(root).toLowerCase()
    || /documenta[çc][ãa]o|especifica[çc][ãa]o/i.test(repo.responsabilidade || '') && /markdown|docs?\b/i.test(`${repo.stack} ${repo.tipo}`);
}

// Repositórios declarados no `## Implementação` de um N3 (texto do arquivo). A célula
// combinada ("a / b") vira dois repositórios.
export function reposDaImplementacao(texto) {
  const linhas = texto.split(/\r?\n/);
  const ini = linhas.findIndex((l) => l.trim() === '## Implementação');
  if (ini < 0) return [];
  const out = [];
  let cab = null;
  for (let i = ini + 1; i < linhas.length && !/^##\s/.test(linhas[i].trim()); i++) {
    const l = linhas[i].trim();
    if (!l.startsWith('|') || separador(l)) continue;
    const c = celulas(l);
    if (!cab) { cab = c.map(semAcento); continue; }
    const iRepo = cab.findIndex((x) => /^repositorio/.test(x));
    const iItem = cab.findIndex((x) => /^item/.test(x));
    const iCam = cab.findIndex((x) => /^caminho/.test(x));
    for (const parte of String(c[iRepo >= 0 ? iRepo : 1] || '').split(/\s*[/,]\s*/)) {
      const nome = repoReal(parte);
      if (nome) out.push({ nome, item: iItem >= 0 ? (c[iItem] || '') : '', caminho: iCam >= 0 ? (c[iCam] || '') : '' });
    }
  }
  return out;
}

// Todos os N3 da instância (modules/**/f-*.md).
export function arquivosN3(root) {
  const out = [];
  const anda = (d) => {
    let ents;
    try { ents = readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of ents) {
      if (e.name.startsWith('.') || e.name === 'node_modules') continue;
      const p = join(d, e.name);
      if (e.isDirectory()) anda(p);
      else if (/^f-.+\.md$/.test(e.name)) out.push(p);
    }
  };
  anda(join(root, 'modules'));
  return out.sort();
}
