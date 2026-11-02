#!/usr/bin/env node
// valida-fluxo-principal.mjs — acusa N2 cujo "## Fluxo Principal" (diagrama mermaid)
// não contempla todas as funcionalidades da própria tabela "## Funcionalidades".
//
// Por quê: o diagrama e a tabela nascem juntos no PROMPT_2A, mas nada trava os dois
// sincronizados depois — uma funcionalidade nova (`PROMPT_3A`) entra na tabela e o diagrama
// não é revisitado, ou uma funcionalidade nasce direto pela fonte (documento de brainstorm,
// card avulso) sem passar pela tabela+diagrama do mesmo jeito. O `modules/INDEX.md`
// e o `modules/*/README.md` (N1) citam a funcionalidade; só o Fluxo Principal do próprio N2
// fica capenga, e nada mais no repositório acusa isso. Achado real (portal-compras,
// onde este validador nasceu — REP-055 do ledger de replicação de lá): `SDC-SOL`
// (Elaboração de SC) tinha 3 das 10 funcionalidades de fora do fluxo — `SDC-SOL-02`
// (Múltiplas Unidades), `SDC-SOL-09` (Compartilhada) e `SDC-SOL-10` (a partir de Ata
// de Registro de Preços).
//
// Como decide "está no fluxo": cada funcionalidade da tabela "## Funcionalidades" aparece como
// `**Nome da Funcionalidade**` (mesmo texto usado no rótulo do link); o validador confere se
// esse nome aparece ENTRE ASPAS dentro do bloco ```mermaid``` de "## Fluxo Principal"
// — é assim que um nó de funcionalidade se escreve (`ID["Nome da Funcionalidade"]`), e exigir as
// aspas evita falso-positivo por substring: "Cadastrar Solicitação de Compras" não
// pode "passar" só porque "Cadastrar Solicitação de Compras de Múltiplas Unidades"
// está no diagrama — os dois têm nós próprios, com aspas fechando em pontos
// diferentes.
//
// O que NÃO é erro: nós que não são funcionalidade (ator, estado final, decisão pendente,
// referência a funcionalidade de OUTRO Agrupamento Funcional como gatilho externo) — o validador só
// varre o sentido tabela → diagrama, nunca o inverso.
//
// Uso:  node scripts/valida-fluxo-principal.mjs [arquivo README.md | pasta] ...
//       (sem argumentos: varre todo `modules/<dominio>/<agrupamento-funcional>/README.md`)

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { nomesDaSecao } from './lib/niveis.mjs';

const ROOT = process.cwd();
const rel = (p) => p.replace(`${ROOT}/`, '').replace(/\\/g, '/');

// Corta uma seção "## Título" até a próxima "## " ou "---" (regra compartilhada com
// os demais N2/N3 — parágrafo de prosa é uma linha só, seção termina em cabeçalho ou
// régua). Devolve null quando o título não existe no documento.
function extraiSecao(md, tituloExato) {
  const re = new RegExp(`^##\\s+(?:${nomesDaSecao(tituloExato).join('|')})\\s*$`, 'm');
  const m = md.match(re);
  if (!m) return null;
  const resto = md.slice(m.index + m[0].length);
  const fimM = resto.match(/\n(?:---\s*\n|##\s)/);
  return fimM ? resto.slice(0, fimM.index) : resto;
}

function featuresDaTabela(md) {
  const secao = extraiSecao(md, 'Funcionalidades');
  if (secao == null) return null;
  const nomes = [];
  for (const linhaBruta of secao.split('\n')) {
    const linha = linhaBruta.trim();
    if (!linha.startsWith('|') || /^\|\s*-+/.test(linha)) continue;
    const m = linha.match(/\*\*(.+?)\*\*/);
    if (m) nomes.push(m[1].trim());
  }
  return nomes;
}

function blocoMermaidDoFluxo(md) {
  const secao = extraiSecao(md, 'Fluxo Principal');
  if (secao == null) return undefined; // seção ausente — distinto de "presente e vazia"
  const m = secao.match(/```mermaid([\s\S]*?)```/);
  return m ? m[1] : '';
}

function diagnostica(path) {
  const md = readFileSync(path, 'utf8');
  const nomes = featuresDaTabela(md);
  if (nomes == null || nomes.length === 0) return { semFeatures: true };

  const fluxo = blocoMermaidDoFluxo(md);
  if (fluxo === undefined) return { semFluxo: true, nomes };

  const faltando = nomes.filter((n) => !fluxo.includes(`"${n}"`));
  return { faltando, total: nomes.length };
}

// N2 = `modules/<dominio>/<agrupamento-funcional>/README.md`, exatamente esse nível — o N1
// (`modules/<dominio>/README.md`) não tem "## Funcionalidades"/"## Fluxo Principal", e o
// próprio featuresDaTabela/blocoMermaidDoFluxo devolveriam null nele mesmo sem este
// filtro; o filtro só evita abrir arquivo à toa.
function alvosPadrao() {
  const alvos = [];
  let dominios;
  try { dominios = readdirSync(join(ROOT, 'modules'), { withFileTypes: true }); }
  catch { return alvos; }
  for (const dom of dominios) {
    if (!dom.isDirectory() || dom.name.startsWith('_')) continue;
    const domDir = join(ROOT, 'modules', dom.name);
    let featureSets;
    try { featureSets = readdirSync(domDir, { withFileTypes: true }); }
    catch { continue; }
    for (const fs of featureSets) {
      if (!fs.isDirectory() || fs.name.startsWith('_')) continue;
      const readme = join(domDir, fs.name, 'README.md');
      try { if (statSync(readme).isFile()) alvos.push(readme); } catch { /* sem N2 aqui */ }
    }
  }
  return alvos;
}

function resolveArgumentos(args) {
  const arquivos = [];
  for (const a of args) {
    let st;
    try { st = statSync(a); } catch { continue; }
    if (st.isFile()) { arquivos.push(a); continue; }
    // pasta: aceita apontar direto pro README de um Agrupamento Funcional, ou uma pasta acima
    const direto = join(a, 'README.md');
    try { if (statSync(direto).isFile()) { arquivos.push(direto); continue; } } catch { /* não é um N2 */ }
    for (const nome of readdirSync(a)) {
      const candidato = join(a, nome, 'README.md');
      try { if (statSync(candidato).isFile()) arquivos.push(candidato); } catch { /* não é um N2 */ }
    }
  }
  return arquivos;
}

const args = process.argv.slice(2);
const arquivos = args.length ? resolveArgumentos(args) : alvosPadrao();

if (!arquivos.length) {
  console.log('Nenhum README.md de Agrupamento Funcional (N2) encontrado.');
  process.exit(0);
}

let reprovados = 0;
for (const path of arquivos) {
  const r = diagnostica(path);
  if (r.semFeatures) continue; // nada na tabela — não é este validador que resolve

  if (r.semFluxo) {
    reprovados++;
    console.log(`✗ ${rel(path)}`);
    console.log(`    sem seção "## Fluxo Principal" — ${r.nomes.length} funcionalidade(s) na tabela, nenhuma diagramada.`);
    continue;
  }

  if (r.faltando.length) {
    reprovados++;
    console.log(`✗ ${rel(path)} — ${r.faltando.length} de ${r.total} funcionalidade(s) fora do "## Fluxo Principal":`);
    for (const nome of r.faltando) console.log(`    - ${nome}`);
  }
}

console.log(reprovados
  ? `\n${reprovados} Agrupamento Funcional(s) com o diagrama desatualizado. Acrescente um nó com o nome EXATO da funcionalidade (mesmo texto de "## Funcionalidades") em "## Fluxo Principal" e rode de novo.`
  : `✓ ${arquivos.length} Agrupamento Funcional(s) conferido(s) — todo "## Fluxo Principal" contempla as funcionalidades da própria tabela.`);
process.exit(reprovados ? 1 : 0);
