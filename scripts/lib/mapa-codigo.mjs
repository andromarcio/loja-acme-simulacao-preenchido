#!/usr/bin/env node
// mapa-codigo.mjs — liga cada funcionalidade (ID N3) aos ARQUIVOS REAIS que a implementam
// nos repositórios de código da instância ([x]-backend, [x]-frontend), para o "Mapa
// de funcionalidades" descer de spec até código. Somente-leitura e determinístico.
//
// Vínculo: um arquivo implementa a funcionalidade X quando referencia o token do ID de X
// (`ADM-MOD-01`) no conteúdo — a mesma convenção que o próprio código já usa
// (`@ExigeFuncionalidade("X")`, semente do catálogo, migração, comentário de
// contrato, cabeçalho de spec). Duas fontes de ruído são removidas:
//   • Registro compartilhado: arquivo que cita muitas funcionalidades (catálogo, enum,
//     switch) não é específico de nenhuma — vai para `registros`, não para cada uma.
//   • Citação pedagógica "lição DEM-PAI-01": referência a uma lição, não
//     implementação — removida antes de casar os IDs.
//
// Quais repositórios: o par backend/frontend irmão do repo de doc, com o mesmo prefixo
// ("siesa-doc" → ../siesa-backend, ../siesa-frontend; MAPA_BACKEND_DIR /
// MAPA_FRONTEND_DIR) e, desde a 6.2.0, todo repositório do inventário `repos/INDEX.md`
// — um sistema de microsserviços tem dezenas ou centenas —, procurado ao lado do doc ou
// em MAPA_REPOS_DIR, mais os passados explicitamente (`repos: [{ nome, dir }]`). Se um
// repositório não existe (CI só com o doc), a varredura o ignora — o mapa continua
// gerando, só sem a camada de código daquele repositório.
//
// Uso direto (relatório de conferência):
//   node scripts/lib/mapa-codigo.mjs            # tabela funcionalidade × arquivos BE/FE
import { readdirSync, statSync, readFileSync, existsSync } from 'node:fs';
import { join, basename, resolve } from 'node:path';
import { inventario, ehRepoDeDoc } from './repos.mjs';

const ID_RE = /\b[A-Z]{3}-[A-Z]{3}-\d{2}\b/g;
// citação pedagógica ("lição DEM-PAI-01"), não implementação — tolera quebra de
// linha e prefixo de comentário entre "lição" e o ID (`lição\n * DEM-PAI-01`).
const LICAO_RE = /li[çc][ãa]o[\s*]+[A-Z]{3}-[A-Z]{3}-\d{2}/gi;
const LIMIAR_REGISTRO = 6; // arquivo que cita >= 6 funcionalidades é registro/catálogo compartilhado
const IGNORAR_DIR = new Set(['node_modules', 'target', 'dist', 'build', '.git', '.angular', 'coverage']);

// Prioridade de exibição das camadas do back-end (borda → dentro → schema → teste).
const ORDEM_CAMADA = ['api', 'aplicação', 'domínio', 'workers', 'infra', 'migração', 'config', 'outro', 'teste'];
const ORDEM_TIPO = ['rota', 'componente', 'template', 'estilo', 'serviço', 'spec', 'outro'];

function walk(dir, exts, acc = []) {
  let ents;
  try { ents = readdirSync(dir, { withFileTypes: true }); } catch { return acc; }
  for (const e of ents) {
    if (e.name.startsWith('.') || IGNORAR_DIR.has(e.name)) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, exts, acc);
    else if (exts.some((x) => e.name.endsWith(x))) acc.push(p);
  }
  return acc;
}

function camadaBackend(rel) {
  if (/\/db\/migration\//.test(rel)) return 'migração';
  if (/(^|\/)src\/test\//.test(rel)) return 'teste';
  if (/\/api\//.test(rel)) return 'api';
  if (/\/application\//.test(rel)) return 'aplicação';
  if (/\/dominio\//.test(rel)) return 'domínio';
  if (/\/workers\//.test(rel)) return 'workers';
  if (/\/infra\//.test(rel)) return 'infra';
  if (/\.(ya?ml|properties)$/.test(rel)) return 'config';
  return 'outro';
}
function tipoFrontend(rel) {
  if (rel.endsWith('.spec.ts')) return 'spec';
  if (/\.routes\.ts$/.test(rel) || /\/app\.routes\.ts$/.test(rel)) return 'rota';
  if (rel.endsWith('.service.ts')) return 'serviço';
  if (rel.endsWith('.html')) return 'template';
  if (rel.endsWith('.scss') || rel.endsWith('.css')) return 'estilo';
  if (rel.endsWith('.ts')) return 'componente';
  return 'outro';
}

// Varre um repositório e devolve { perFeat: Map<id,[{path,kind}]>, registros:[{path,nIds}] }.
function scanRepo(root, exts, classify) {
  const base = join(root, 'src');
  const dir = existsSync(base) ? base : root;
  const perFeat = new Map();
  const registros = [];
  for (const abs of walk(dir, exts)) {
    const rel = abs.slice(root.length + 1);
    let txt;
    try { txt = readFileSync(abs, 'utf8'); } catch { continue; }
    const ids = [...new Set(txt.replace(LICAO_RE, ' ').match(ID_RE) || [])];
    if (!ids.length) continue;
    if (ids.length >= LIMIAR_REGISTRO) { registros.push({ path: rel, nIds: ids.length }); continue; }
    const kind = classify(rel);
    for (const id of ids) {
      if (!perFeat.has(id)) perFeat.set(id, []);
      perFeat.get(id).push({ path: rel, kind });
    }
  }
  return { perFeat, registros };
}

function ordenar(arquivos, ordem) {
  return arquivos.slice().sort((a, b) => {
    const ia = ordem.indexOf(a.kind), ib = ordem.indexOf(b.kind);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.path.localeCompare(b.path);
  });
}

// Extensões varridas por papel do repositório. O par legado (backend Java, frontend
// Angular) mantém as de sempre; o microsserviço do inventário pode ser de qualquer
// stack — o ID da funcionalidade aparece no código, na migração ou na configuração.
const EXT = {
  back: ['.java', '.sql', '.yml', '.yaml', '.properties'],
  front: ['.ts', '.tsx', '.jsx', '.vue', '.html', '.scss', '.css'],
  servico: ['.java', '.kt', '.scala', '.go', '.py', '.cs', '.ts', '.js', '.rb', '.php', '.sql', '.yml', '.yaml', '.properties'],
};
const ehFront = (repo) => /front|web\b|\bui\b|spa|portal/i.test(repo.tipo || '') || /-(frontend|front|web|ui|spa)$/i.test(repo.nome);

// Os repositórios de código a varrer, sem repetição (pelo caminho), nesta precedência:
//   1. explícitos — opts.repos [{ nome, dir }] (CLI `--repo nome=dir`: a CI de cada
//      microsserviço diz quem ela é);
//   2. o par legado — backend/frontend irmãos do doc ("siesa-doc" → ../siesa-backend),
//      ou MAPA_BACKEND_DIR / MAPA_FRONTEND_DIR;
//   3. o inventário — cada repositório de `repos/INDEX.md` (menos o de doc), procurado
//      em opts.reposDir, MAPA_REPOS_DIR ou ao lado do doc. O que não está no disco fica
//      de fora: a CI de um repositório só enxerga ele mesmo.
function reposCandidatos(docRoot, opts) {
  const lista = [];
  const vistos = new Set();
  const poe = (nome, root, papel, legado = false) => {
    if (!root || !existsSync(root) || !statSync(root).isDirectory()) return;
    const chave = resolve(root);
    if (vistos.has(chave)) return;
    vistos.add(chave);
    lista.push({ nome, root, papel, legado });
  };
  for (const r of opts.repos || []) poe(r.nome, r.dir, r.papel || 'servico');
  const prefixo = basename(docRoot).replace(/-doc$/, '');
  const beRoot = opts.backendRoot || process.env.MAPA_BACKEND_DIR || join(docRoot, '..', `${prefixo}-backend`);
  const feRoot = opts.frontendRoot || process.env.MAPA_FRONTEND_DIR || join(docRoot, '..', `${prefixo}-frontend`);
  poe(basename(resolve(beRoot)), beRoot, 'back', true);
  poe(basename(resolve(feRoot)), feRoot, 'front', true);
  const base = opts.reposDir || process.env.MAPA_REPOS_DIR || join(docRoot, '..');
  for (const r of inventario(docRoot) || []) {
    if (ehRepoDeDoc(r, docRoot)) continue;
    poe(r.nome, join(base, r.nome), ehFront(r) ? 'front' : 'servico');
  }
  return lista;
}

// API principal: devolve o vínculo funcionalidade → código de cada repositório acessível.
//   byFeat[id].porRepo[nome] — os arquivos de cada repositório que citam o ID;
//   byFeat[id].back / .front — os do par legado, como antes (o mapa de funcionalidades e o
//   grafo da instância os leem).
export function ligarCodigo(opts = {}) {
  const docRoot = opts.docRoot || process.cwd();
  const repos = reposCandidatos(docRoot, opts).map((r) => ({
    ...r, scan: scanRepo(r.root, EXT[r.papel], r.papel === 'front' ? tipoFrontend : camadaBackend),
  }));
  const be = repos.find((r) => r.legado && r.papel === 'back');
  const fe = repos.find((r) => r.legado && r.papel === 'front');

  // Com featIds (as funcionalidades REAIS do modules/), só elas entram — IDs achados só em
  // fixtures de teste (XXX-YYY-99, CRE-PRO-*) não viram nó. Sem featIds, devolve tudo
  // o que foi achado (modo relatório). O limiar de registro usa TODOS os tokens do
  // arquivo, então isso não muda a detecção de registro compartilhado.
  const ids = opts.featIds && opts.featIds.length
    ? new Set(opts.featIds)
    : new Set(repos.flatMap((r) => [...r.scan.perFeat.keys()]));
  const byFeat = {};
  for (const id of ids) {
    const porRepo = {};
    for (const r of repos) {
      const arqs = r.scan.perFeat.get(id);
      if (arqs && arqs.length) porRepo[r.nome] = ordenar(arqs, r.papel === 'front' ? ORDEM_TIPO : ORDEM_CAMADA);
    }
    byFeat[id] = {
      back: be ? porRepo[be.nome] || [] : [],
      front: fe ? porRepo[fe.nome] || [] : [],
      porRepo,
    };
  }
  const porNome = (r) => r.scan.registros.sort((a, b) => a.path.localeCompare(b.path));
  return {
    ok: repos.length > 0,
    backend: be ? be.nome : null,
    frontend: fe ? fe.nome : null,
    repos: repos.map((r) => ({ nome: r.nome, papel: r.papel, root: r.root })),
    byFeat,
    registros: {
      back: be ? porNome(be) : [],
      front: fe ? porNome(fe) : [],
      porRepo: Object.fromEntries(repos.map((r) => [r.nome, porNome(r)])),
    },
  };
}

// ---- relatório de conferência (execução direta) -------------------------------
if (import.meta.url === `file://${process.argv[1]}`) {
  const docRoot = new URL('../..', import.meta.url).pathname;
  const featIds = walk(join(docRoot, 'modules'), ['.md'])
    .filter((p) => /\/f-[^/]+\.md$/.test(p))
    .flatMap((p) => (readFileSync(p, 'utf8').match(/^id:\s*([A-Z]{3}-[A-Z]{3}-\d{2})/m) || []).slice(1));
  const r = ligarCodigo({ docRoot, featIds });
  const ids = Object.keys(r.byFeat).sort();
  console.log(`backend=${r.backend || '—'}  frontend=${r.frontend || '—'}  funcionalidades=${ids.length}`);
  console.log(`registros compartilhados: back=${r.registros.back.length} front=${r.registros.front.length}\n`);
  let comBack = 0, comFront = 0, arqBE = 0, arqFE = 0;
  console.log('FUNCIONALIDADE         BE  (camadas)                          FE  (tipos)');
  for (const id of ids) {
    const b = r.byFeat[id].back, f = r.byFeat[id].front;
    if (b.length) comBack++; if (f.length) comFront++;
    arqBE += b.length; arqFE += f.length;
    const bc = [...new Set(b.map((x) => x.kind))].join(',');
    const fc = [...new Set(f.map((x) => x.kind))].join(',');
    console.log(`${id.padEnd(14)} ${String(b.length).padStart(2)}  ${bc.padEnd(34)} ${String(f.length).padStart(2)}  ${fc}`);
  }
  console.log(`\ncom back=${comBack} com front=${comFront} · arquivos BE=${arqBE} FE=${arqFE}`);
  console.log('registros back:', r.registros.back.map((x) => `${x.path}(${x.nIds})`).join(', '));
}
