#!/usr/bin/env node
// valida-artefatos-previstos.mjs — CP4: o que a spec PREVIU foi implementado?
//
// Fase 1 (repo + presença de ID). Para cada N3 `estado: implementado`, cruza os
// repositórios declarados na tabela "## Implementação" com o que o código
// REALMENTE referencia — o token do ID da funcionalidade no conteúdo (mesma convenção
// do mapa-codigo: `@ExigeFuncionalidade("EST-APR-06")`, semente do catálogo,
// migração, cabeçalho de contrato). Reprova (exit 1):
//   • repositório declarado que ESTÁ presente no checkout mas não tem NENHUM
//     arquivo referenciando o ID — previu no repo X, o repo X está aqui, e nada
//     nele aponta para a funcionalidade.
// Avisa (não reprova):
//   • repo que referencia o ID mas não está declarado na "## Implementação"
//     (implementou onde a spec não previu — mantém a tabela honesta);
//   • repositório declarado AUSENTE deste checkout — não dá para verificar aqui.
//
// Fase 2 (semeada, inativa hoje): se a coluna Caminho trouxer um caminho de
// arquivo concreto (não prosa/placeholder), confere a existência do arquivo sob
// o repo mapeado. Como os N3 de hoje usam "mergeado na main", nada dispara —
// vira checagem de nível de arquivo quando as specs passarem a declarar paths.
//
// Fase 3 (6.3.0) — o caminho de volta: o que a spec declara como dado chegou ao código.
//   • toda regra `RN-NN` da funcionalidade aparece como `<ID>/RN-NN` em algum arquivo de TESTE
//     (tag Cucumber `@ADM-USR-04/RN-02`, nome do teste, comentário) — o PROMPT_QA manda
//     o teste herdar a tag do cenário;
//   • todo código de `error_codes` aparece em algum arquivo de código.
// Reprova só quando TODOS os repositórios declarados na "## Implementação" estão no
// checkout — com algum ausente, o que falta pode estar nele: avisa. N3 cujas regras
// ainda não têm ID (anterior à 6.3.0) não tem regra a conferir.
//
// ONDE RODA: na CI do repo de CÓDIGO (é quando o código entra), com o repo de
// doc em checkout ao lado. Cada CI enxerga só o seu repo — por isso a checagem
// é POR REPO ACESSÍVEL: repo declarado ausente não reprova, só avisa. Num sistema de
// microsserviços, a CI de cada um diz quem ela é: `--repo <nome>=<dir>` (o nome como
// está no inventário e na `## Implementação`). Também acha o par backend/frontend
// (MAPA_BACKEND_DIR / MAPA_FRONTEND_DIR ou irmãos por prefixo) e os repositórios do
// inventário `repos/INDEX.md` que estiverem no disco (ao lado do doc, ou em
// `--repos-dir` / MAPA_REPOS_DIR) — ver lib/mapa-codigo. Se NENHUM repo de código
// estiver acessível, PULA.
//
// Uso:
//   node scripts/valida-artefatos-previstos.mjs [--doc-root <dir>]
//        [--repo <nome>=<dir> …] [--repos-dir <dir>]
//        [--backend <dir>] [--frontend <dir>] [--estado implementado,em-desenvolvimento]
//   exit 0 = ok/pulado · 1 = funcionalidade previu e não entregou · 2 = erro de uso

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { ligarCodigo } from './lib/mapa-codigo.mjs';
import { frontMatter as lerFrontMatter, frontMatterLista } from './lib/front-matter.mjs';
import { regrasDoN3 } from './lib/regras.mjs';
import { reposDaImplementacao } from './lib/repos.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));

function argOf(flag) {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : null;
}

const DOC_ROOT = resolve(argOf('--doc-root') || process.cwd());
const ESTADOS = new Set((argOf('--estado') || 'implementado').split(',').map((s) => s.trim()).filter(Boolean));

// ---- helpers de leitura de N3 (espelham o validate-doc) ----------------------
// Leitor único (lib/front-matter.mjs): tolera o carimbo antes do `---` e tira as aspas
// do valor — `estado: "implementado"` deixava de ser reconhecido e a funcionalidade era pulada.
const frontMatter = (lines) => lerFrontMatter(lines) || {};
function sectionSlice(lines, name) {
  const start = lines.findIndex((l) => l.trim() === `## ${name}`);
  if (start === -1) return null;
  const out = [];
  for (let i = start + 1; i < lines.length; i++) {
    if (lines[i].trim().startsWith('## ')) break;
    out.push(lines[i]);
  }
  return out;
}
function splitRow(row) {
  return row.replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
}
function tableRows(lines, name) {
  const slice = sectionSlice(lines, name);
  if (!slice) return [];
  const rows = slice.map((l) => l.trim()).filter((l) => l.startsWith('|'));
  return rows.filter((r) => !/^\|[\s:|-]+\|$/.test(r)).slice(1);
}
// Fase 2: a célula Caminho é um caminho de arquivo concreto (não prosa/placeholder)?
function looksLikePath(cell) {
  const t = (cell || '').replace(/[`[\]]/g, '').trim();
  return /\//.test(t) && /\.[a-z0-9]{1,5}$/i.test(t) && !/\s/.test(t);
}

function walkN3(dir, out) {
  let ents;
  try { ents = readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of ents) {
    if (e.name.startsWith('.') || e.name === 'node_modules' || e.name === 'engine') continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) walkN3(p, out);
    else if (e.name.startsWith('f-') && e.name.endsWith('.md')) out.push(p);
  }
}

// ---- coleta os N3 alvo -------------------------------------------------------
const modulesDir = join(DOC_ROOT, 'modules');
const files = [];
walkN3(modulesDir, files);

const alvos = [];
for (const f of files) {
  const texto = readFileSync(f, 'utf8');
  const lines = texto.split(/\r?\n/);
  const fm = frontMatter(lines);
  if (!fm.id || !ESTADOS.has(fm.estado)) continue;
  // A mesma leitura do gera-indice-repos: a célula combinada ("a / b") são dois
  // repositórios, e o citado em mais de uma linha conta uma vez.
  const declaradosRepo = [...new Map(reposDaImplementacao(texto).map(({ nome }) => [nome.toLowerCase(), nome])).values()];
  const declaradosPath = [];
  for (const row of tableRows(lines, 'Implementação')) {
    const cells = splitRow(row);
    if (looksLikePath(cells[2])) declaradosPath.push({ repo: (cells[1] || '').replace(/[`[\]]/g, '').trim(), path: cells[2].replace(/[`[\]]/g, '').trim() });
  }
  const rns = regrasDoN3(lines).map((r) => r.id).filter(Boolean);
  const codigos = (frontMatterLista(lines, 'error_codes') || []).filter((c) => !c.startsWith('['));
  alvos.push({ file: f, id: fm.id, estado: fm.estado, declaradosRepo, declaradosPath, rns, codigos });
}

if (!alvos.length) {
  console.log(`✓ Nenhum N3 em estado {${[...ESTADOS].join(', ')}} — nada a verificar.`);
  process.exit(0);
}

// ---- liga cada funcionalidade ao código real (por token do ID) ----------------------
// `--repo nome=dir` pode vir várias vezes: a CI de um microsserviço passa o dela.
const explicitos = process.argv.flatMap((a, i) => (process.argv[i - 1] === '--repo' ? [a] : []))
  .map((v) => { const k = v.indexOf('='); return k > 0 ? { nome: v.slice(0, k), dir: resolve(v.slice(k + 1)) } : null; })
  .filter(Boolean);
const cod = ligarCodigo({
  docRoot: DOC_ROOT,
  repos: explicitos,
  reposDir: argOf('--repos-dir') || undefined,
  backendRoot: argOf('--backend') || undefined,
  frontendRoot: argOf('--frontend') || undefined,
  featIds: alvos.map((a) => a.id),
});

if (!cod.ok) {
  console.log('↷ Nenhum repositório de código acessível — verificação pulada.');
  console.log('  (rode na CI do repo de código, com o repo de doc ao lado: --repo <nome>=<dir>; ou aponte MAPA_REPOS_DIR, MAPA_BACKEND_DIR/MAPA_FRONTEND_DIR.)');
  process.exit(0);
}

// repo declarado → o repositório acessível de mesmo nome (sem diferença de caixa)
const presentes = new Map(cod.repos.map((r) => [r.nome.toLowerCase(), r]));

// Fase 3 — o texto dos repositórios acessíveis, lido uma vez: [{ repo, rel, teste, txt }].
const EXT_TEXTO = /\.(java|kt|scala|go|py|cs|ts|tsx|js|jsx|vue|rb|php|sql|ya?ml|properties|feature|html)$/;
const TESTE_RE = /(^|\/)(tests?|spec|specs|e2e|__tests__|cypress|features)\/|\.(spec|test|cy)\.[jt]sx?$|Tests?\.(java|kt|cs)$|_test\.(go|py)$|\.feature$/;
const IGNORAR = new Set(['node_modules', 'target', 'build', 'dist', '.git', 'vendor', 'coverage']);
const fontes = [];
const precisaFase3 = alvos.some((a) => a.rns.length || a.codigos.length);
for (const r of precisaFase3 ? cod.repos : []) {
  const anda = (d) => {
    let ents;
    try { ents = readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of ents) {
      if (e.name.startsWith('.') || IGNORAR.has(e.name)) continue;
      const p = join(d, e.name);
      if (e.isDirectory()) anda(p);
      else if (EXT_TEXTO.test(e.name)) {
        const rel = p.slice(r.root.length + 1).replace(/\\/g, '/');
        try { fontes.push({ repo: r.nome, rel, teste: TESTE_RE.test(rel), txt: readFileSync(p, 'utf8') }); } catch { /* ilegível */ }
      }
    }
  };
  anda(r.root);
}

const textoDeCodigo = fontes.filter((f) => !f.teste).map((f) => f.txt).join('\n');

let erros = 0, avisos = 0;
console.log(`Verificando ${alvos.length} funcionalidade(s) contra: ${cod.repos.map((r) => r.nome).join(', ')}\n`);

for (const a of alvos) {
  const porRepo = (cod.byFeat[a.id] || {}).porRepo || {};
  const refs = (repo) => (porRepo[repo.nome] || []).length;
  const linhas = [];

  // A/B — cada repo DECLARADO e ACESSÍVEL precisa ter ≥1 arquivo referenciando o ID.
  for (const nome of a.declaradosRepo) {
    const repo = presentes.get(nome.toLowerCase());
    if (!repo) { linhas.push(`  · ${nome}: declarado, ausente deste checkout — não verificado (aviso).`); avisos++; continue; }
    if (refs(repo) === 0) {
      linhas.push(`  ✗ ${nome}: declarado em "## Implementação", presente no checkout, mas NENHUM arquivo referencia o ID ${a.id}.`);
      erros++;
    }
  }

  // C — repo ACESSÍVEL que referencia o ID mas NÃO foi declarado (aviso).
  for (const [nome, repo] of presentes) {
    if (refs(repo) > 0 && !a.declaradosRepo.some((r) => r.toLowerCase() === nome)) {
      linhas.push(`  ! ${repo.nome}: referencia ${a.id} mas não está declarado na "## Implementação".`);
      avisos++;
    }
  }

  // Fase 2 (semeada) — caminho concreto declarado precisa existir sob o repo mapeado.
  for (const { repo: nome, path } of a.declaradosPath) {
    const repo = presentes.get(nome.toLowerCase());
    if (!repo) continue; // repo ausente — não verificável aqui
    const root = repo.root;
    let existe = false;
    try { statSync(join(root, path)); existe = true; } catch { /* não existe */ }
    if (!existe) { linhas.push(`  ✗ ${repo}:${path} — caminho declarado não existe no repositório.`); erros++; }
  }

  // Fase 3 — regra até o teste, código de erro até o código.
  const todosPresentes = a.declaradosRepo.length > 0 && a.declaradosRepo.every((n) => presentes.has(n.toLowerCase()));
  const falta = (msg) => {
    if (todosPresentes) { linhas.push(`  ✗ ${msg}`); erros++; }
    else { linhas.push(`  · ${msg} — algum repositório declarado está fora deste checkout (aviso).`); avisos++; }
  };
  for (const rn of a.rns) {
    const tok = `${a.id}/${rn}`;
    if (!fontes.some((f) => f.teste && f.txt.includes(tok))) falta(`${tok}: nenhum teste cita a regra — o teste do cenário @${rn} leva \`${tok}\` na tag ou no nome.`);
  }
  for (const c of a.codigos) {
    if (!new RegExp(`\\b${c}\\b`).test(textoDeCodigo)) falta(`${c}: código de erro de \`error_codes\` que nenhum arquivo de código usa.`);
  }

  if (linhas.length) console.log(`${a.id} (${a.file.replace(DOC_ROOT + '/', '')}):\n${linhas.join('\n')}`);
}

console.log('');
if (erros) {
  console.log(`❌ ${erros} artefato(s) previsto(s) sem implementação correspondente${avisos ? ` · ${avisos} aviso(s)` : ''}.`);
  console.log('   Cada funcionalidade `implementado` precisa que o código referencie o ID dela nos repositórios declarados, que toda regra RN-NN tenha teste (`<ID>/RN-NN`) e que todo código de error_codes esteja no código.');
  process.exit(1);
}
console.log(`✓ Todo artefato previsto tem código correspondente${avisos ? ` · ${avisos} aviso(s)` : ''}.`);
process.exit(0);
