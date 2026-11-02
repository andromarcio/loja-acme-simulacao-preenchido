#!/usr/bin/env node
// validate-doc.mjs — valida a conformidade estrutural de artefatos N0/N1/N2/N3 e do
// DATA-MODEL (índice global + fragmentos de domínio). Determinístico: independe do
// modelo/harness que produziu o arquivo. N0–N3 são detectados pela linha "**Nível X**"
// do subtítulo; o data-model, pelo título "# DATA-MODEL.md" (índice) ou "# Data Model:"
// (fragmento).
//
// Uso:
//   node scripts/validate-doc.mjs <arquivo.md> [outro.md …]
//
// Saída: violações por arquivo. Código 0 se todos passarem; 1 se algum violar;
// 2 em erro de uso.
//
// Notas de calibração (ver CHANGELOG 1.1.0):
//   - N2 é integralmente negocial (prompt único 2A) → lista FECHADA de seções + ordem.
//   - N1 e N3 são compostos por múltiplos prompts (1A+1B; 3A+3B+CONTAGEM) → valida
//     seções OBRIGATÓRIAS presentes + proibições, não lista fechada.
//   - O caractere separador do subtítulo (- vs —) NÃO é enforçado (cosmético e
//     inconsistente no acervo); valida-se só "**Nível X**" + ID em crase.
//   - DATA-MODEL (fragmento): cada entidade exige anotação ALI/AIE + o cabeçalho
//     canônico (Label PO | Label Dev | Campo banco | Tipo SQL | Obrigatório | Notas) e
//     não pode repetir os campos globais implícitos. Caixa (snake_case/camelCase) NÃO é
//     enforçada aqui — fica para a revisão semântica (PROMPT_REVIEW).
//   - PATTERNS (1.10.0): o catálogo `global/PATTERNS.md` valida bem-formação —
//     seções de governança + cada entrada de padrão com Intenção/Realização/Exemplo
//     (código)/Verificação/Quando NÃO usar. NÃO afere se o código segue o padrão
//     (isso é fitness function na CI do repo de produto / CP4) — só o catálogo.
//   - CONFORMIDADE DE API (1.20.0): a seção ## API do N3 é validada contra a diretriz
//     MÁQUINA-LEGÍVEL `versao-em-rota-interna: sim|nao` do global/API-PATTERNS.md da
//     instância (seed do mecanismo "validador lê diretriz global"). Aval → sem versão;
//     SIMPF → com versão. Sem a diretriz declarada, nada é enforçado (compatível).
//   - REPOSITÓRIO DE DESTINO (1.7.0): N3 com `estado: em-desenvolvimento` ou
//     `implementado` exige ≥1 linha real (não placeholder) na coluna Repositório de
//     "## Implementação"; nomes cruzados com repos/INDEX.md quando o inventário existe.
//   - LOCALIZAÇÃO: o tipo detectado precisa bater com a pasta (N3 → modules/<dom>/<fs>/
//     f-*.md; N1/N2 → README.md; N0/DATA-MODEL → global/). Pega o caso do arquivo gerado
//     na pasta errada. Agnóstico ao prefixo da pasta do Agrupamento Funcional (g- ou sem g-).
//     Isenta o engine/ (templates com nomes de placeholder) e caminhos fora da instância.
//   - ARQUÉTIPO (1.6.0): a linha "**Arquétipo**: `…`" do global/MASTER.md da instância
//     modula as exigências — em `ml-dados`/`cli-biblioteca`, as seções "Telas" e
//     "Permissões por perfil" do N2 tornam-se OPCIONAIS (sem UI não há tela nem matriz
//     de perfil). Ausente/ilegível → `transacional` (comportamento 1.5.x).
//   - SUPERFÍCIE (1.6.0): o N3 declara em "## Superfície" como a funcionalidade se manifesta.
//     Tela própria/Modal/Ação em tela → exige "## Comportamento de tela" (como sempre);
//     CLI/Job/Pipeline/API → exige "## Execução e operação" no lugar. Sem marcador
//     reconhecível → trata como tela (comportamento 1.5.x).
//   - FLUXO N2 (1.6.0): ciclo ANOTADO como iteração é permitido — aresta com rótulo
//     que começa com "itera" (convenção: tracejada `-.->|itera: motivo|`). O DFS segue
//     reprovando qualquer caminho de volta NÃO anotado (ciclo acidental).
//   - DATA-MODEL de ARTEFATOS (1.6.0): fragmento com o marcador
//     "> **Modelo de artefatos (dados persistidos)**" descreve datasets/caches/
//     checkpoints (formato, estrutura, ciclo de vida, invariantes) — sem camada SQL.

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { frontMatterEstado } from './lib/front-matter.mjs';
import { ordemN3 } from './lib/ordem-n3.mjs';
import { ehSecao, nomesDaSecao, secaoAtual, TITULO_N1, TITULO_N2 } from './lib/niveis.mjs';

const trunc = (s) => (s.length > 60 ? `${s.slice(0, 60)}…` : s).trim();

function splitRow(row) {
  return row.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
}

// Linhas (cruas) de uma seção `## nome` até o próximo `## `.
function sectionSlice(lines, name) {
  const start = lines.findIndex((l) => ehSecao(l, name));
  if (start === -1) return null;
  const out = [];
  for (let i = start + 1; i < lines.length; i++) {
    if (lines[i].trim().startsWith('## ')) break;
    out.push(lines[i]);
  }
  return out;
}

// Linhas de dados de uma tabela numa seção (sem header e sem separador).
function tableRows(lines, name) {
  const slice = sectionSlice(lines, name);
  if (!slice) return [];
  const rows = slice.map((l) => l.trim()).filter((l) => l.startsWith('|'));
  return rows.filter((r) => !/^\|[\s:|-]+\|$/.test(r)).slice(1);
}

// Header (primeira linha `|`) de uma tabela numa seção.
function tableHeader(lines, name) {
  const slice = sectionSlice(lines, name);
  if (!slice) return null;
  const first = slice.map((l) => l.trim()).find((l) => l.startsWith('|'));
  return first ? splitRow(first) : null;
}

function extractMermaid(raw) {
  const m = raw.match(/```mermaid\s*([\s\S]*?)```/);
  return m ? m[1] : null;
}

// Arestas do flowchart. Cobre setas sólidas (-->), tracejadas (-.->) e grossas (==>).
// Aresta com rótulo iniciado em "itera" é uma ITERAÇÃO ANOTADA (convenção 1.6.0:
// `-.->|itera: motivo|`) — retorno intencional de processo iterativo (ex.: treinar ↔
// avaliar ↔ ajustar). Ela fica FORA do grafo do DFS: só o ciclo não anotado reprova.
function parseEdges(mermaid) {
  const edgeRe =
    /([A-Za-z0-9_]+)(?:\[[^\]]*\]|\(\[[^\]]*\]\)|\{[^}]*\}|\([^)]*\))?\s*(?:-{2,}>|-\.+->|={2,}>)\s*(?:\|([^|]*)\|)?\s*([A-Za-z0-9_]+)/;
  const adj = new Map();
  for (const line of mermaid.split(/\r?\n/)) {
    const m = line.match(edgeRe);
    if (!m) continue;
    const [, from, label, to] = m;
    if (label && /^\s*itera/i.test(label)) continue; // iteração anotada — permitida
    if (!adj.has(from)) adj.set(from, []);
    adj.get(from).push(to);
    if (!adj.has(to)) adj.set(to, []);
  }
  return adj;
}

function findCycle(adj) {
  const WHITE = 0;
  const GRAY = 1;
  const BLACK = 2;
  const color = new Map([...adj.keys()].map((n) => [n, WHITE]));
  const stack = [];
  function dfs(node) {
    color.set(node, GRAY);
    stack.push(node);
    for (const next of adj.get(node) || []) {
      if (color.get(next) === GRAY) return [...stack.slice(stack.indexOf(next)), next];
      if (color.get(next) === WHITE) {
        const cyc = dfs(next);
        if (cyc) return cyc;
      }
    }
    stack.pop();
    color.set(node, BLACK);
    return null;
  }
  for (const node of adj.keys()) {
    if (color.get(node) === WHITE) {
      const cyc = dfs(node);
      if (cyc) return cyc;
    }
  }
  return null;
}

const N2_SECTIONS = [
  'Descrição',
  'Funcionalidades',
  'Fluxo Principal',
  'Dependências entre funcionalidades',
  'Telas',
  'Permissões por perfil',
  'Changelog',
];

// Seções do N2 que deixam de ser obrigatórias quando o produto não tem UI
// (arquétipos ml-dados e cli-biblioteca). Continuam PERMITIDAS (lista fechada).
const N2_OPTIONAL_NO_UI = new Set(['Telas', 'Permissões por perfil']);

// ── Arquétipo do produto (global/MASTER.md da instância) ────────────────────
// Linha machine-readable "- **Arquétipo**: `transacional | ml-dados | cli-biblioteca`".
// Modula as exigências dos validadores; ausente/ilegível → transacional (1.5.x).
const ARCHETYPES = new Set(['transacional', 'ml-dados', 'cli-biblioteca']);

function readArchetype(file) {
  const root = instanceRoot(file);
  if (!root) return 'transacional';
  const master = join(root, 'global', 'MASTER.md');
  if (!existsSync(master)) return 'transacional';
  try {
    const m = readFileSync(master, 'utf8').match(/\*\*Arqu[eé]tipo\*\*\s*:?\s*`?([a-z][a-z-]*)`?/i);
    const val = m ? m[1].toLowerCase() : null;
    return ARCHETYPES.has(val) ? val : 'transacional';
  } catch {
    return 'transacional';
  }
}

function checkCommon(lines, errors) {
  const titleLine = lines.find((l) => l.trim().startsWith('# '));
  if (!titleLine) errors.push('Falta o título "# …".');
  if (!lines.some((l) => l.trim() === '## Changelog')) errors.push('Falta a seção "## Changelog".');
  return titleLine;
}

// Uma entrada pode ser uma lista de nomes aceitos: o primeiro é o atual, os demais
// são legados que artefatos já existentes nas instâncias continuam usando.
function requireSections(lines, names, errors) {
  const present = new Set(lines.filter((l) => /^## /.test(l)).map((l) => l.replace(/^##\s+/, '').trim()));
  const missing = names.filter((n) => ![].concat(n).some((alt) => present.has(alt))).map((n) => [].concat(n)[0]);
  if (missing.length) {
    errors.push(`Seção(ões) obrigatória(s) ausente(s): ${missing.map((s) => `"${s}"`).join(', ')}.`);
  }
}

const N0_SECTIONS = [
  'Propósito',
  'Proposta de valor',
  'Público-alvo e personas',
  'Objetivos do produto',
  'Métricas de sucesso (KPIs)',
  'Escopo',
  nomesDaSecao('Domínios previstos (N1)'),
  'Tom de voz e princípios de experiência',
  'Restrições e premissas',
];

// Sigla do sistema no global/MASTER.md — a fonte única da identidade (o N0 a repete no
// subtítulo, mas a lê de lá). Placeholder ou MASTER ausente → null (nada a conferir).
function readMasterSigla(file) {
  const root = instanceRoot(file);
  const master = root && join(root, 'global', 'MASTER.md');
  if (!master || !existsSync(master)) return null;
  const m = readFileSync(master, 'utf8').match(/\*\*Sigla\*\*\s*:\s*\**`?([A-Z]{2,6})\b/);
  return m ? m[1] : null;
}

function validateN0(lines, raw, errors, file) {
  const title = checkCommon(lines, errors);
  if (title && !/^# Visão de Produto: .+/.test(title.trim())) {
    errors.push('Título deve ser "# Visão de Produto: [Nome]".');
  }
  const sub = lines.find((l) => l.trim().startsWith('> **Nível 0**'));
  if (sub && !/`[A-Z]{2,6}`/.test(sub)) {
    errors.push('Subtítulo N0 sem SIGLA do produto em crase (ex.: `SIGEF`).');
  }
  const siglaN0 = sub && (sub.match(/`([A-Z]{2,6})`/) || [])[1];
  const siglaMaster = siglaN0 && readMasterSigla(file);
  if (siglaMaster && siglaN0 !== siglaMaster) {
    errors.push(`Sigla do N0 (\`${siglaN0}\`) diverge da do global/MASTER.md (\`${siglaMaster}\`) — a identidade do sistema tem fonte única no MASTER; o N0 a repete.`);
  }
  requireSections(lines, N0_SECTIONS, errors);
  if (!lines.some((l) => l.trim() === '### Está dentro')) {
    errors.push('Falta a subseção "### Está dentro" em "## Escopo".');
  }
  if (!lines.some((l) => l.trim() === '### Está fora (não-objetivos)')) {
    errors.push('Falta a subseção "### Está fora (não-objetivos)" em "## Escopo".');
  }
}

function validateN1(lines, raw, errors) {
  const title = checkCommon(lines, errors);
  if (title && !new RegExp(TITULO_N1.source + '.+').test(title.trim())) {
    errors.push('Título deve ser "# Domínio: [Nome]" (legado aceito: "# Major Feature Set: [Nome]").');
  }
  const sub = lines.find((l) => l.trim().startsWith('> **Nível 1**'));
  if (sub && !/`[A-Z]{3}`/.test(sub)) errors.push('Subtítulo N1 sem SIGLA `XXX` (3 maiúsculas) em crase.');
  requireSections(lines, ['Descrição', nomesDaSecao('Agrupamentos Funcionais'), 'Regras transversais de negócio'], errors);
  if (!lines.some((l) => l.trim() === '### O que este domínio NÃO faz')) {
    errors.push('Falta a subseção "### O que este domínio NÃO faz".');
  }
}

function validateN2(lines, raw, errors, file) {
  const title = checkCommon(lines, errors);
  if (title && !new RegExp(TITULO_N2.source + '.+').test(title.trim())) errors.push('Título deve ser "# Agrupamento Funcional: [Nome]" (legado aceito: "# Feature Set: [Nome]").');
  const sub = lines.find((l) => l.trim().startsWith('> **Nível 2**'));
  if (sub) {
    if (sub.includes('—')) errors.push('Subtítulo N2 usa em-dash (—); o contrato 2A pede hífen (-).');
    if (!/`[A-Z]{3}-[A-Z]{3}`/.test(sub)) errors.push('Subtítulo N2 sem ID `SIGLA-SAF` em crase.');
  }

  // Lista FECHADA de seções + ordem. No arquétipo sem UI (ml-dados/cli-biblioteca),
  // "Telas" e "Permissões por perfil" são opcionais — permitidas, não exigidas.
  const archetype = readArchetype(file || '.');
  const optional = archetype === 'transacional' ? new Set() : N2_OPTIONAL_NO_UI;
  const sections = lines.filter((l) => /^## /.test(l)).map((l) => secaoAtual(l.replace(/^##\s+/, '').trim()));
  const extras = sections.filter((s) => !N2_SECTIONS.includes(s));
  if (extras.length) errors.push(`Seção(ões) não permitida(s) no N2: ${extras.map((s) => `"${s}"`).join(', ')}.`);
  const missing = N2_SECTIONS.filter((s) => !sections.includes(s) && !optional.has(s));
  if (missing.length) errors.push(`Seção(ões) obrigatória(s) ausente(s): ${missing.map((s) => `"${s}"`).join(', ')}.`);
  const present = sections.filter((s) => N2_SECTIONS.includes(s));
  const expected = N2_SECTIONS.filter((s) => sections.includes(s));
  if (present.join('|') !== expected.join('|')) errors.push('Seções do N2 fora da ordem canônica.');

  if (!/\*\*Não faz\*\*:/.test(raw)) errors.push('Falta a linha "**Não faz**:" na Descrição.');

  for (const row of tableRows(lines, 'Funcionalidades')) {
    const cells = splitRow(row);
    if (cells.length < 2) continue;
    const [feat] = cells;
    if (!/^\[\*\*.+\*\*\]\([^)]+\.md\)\s*<small>[A-Z]{3}-[A-Z]{3}-\d{2}<\/small>/.test(feat)) {
      errors.push(`Funcionalidade mal formatada (esperado "[**Nome**](f-….md) <small>SIGLA-SAF-NN</small>"): ${trunc(feat)}`);
    }
  }

  const mermaid = extractMermaid(raw);
  if (!mermaid) {
    errors.push('Fluxo Principal sem bloco ```mermaid```.');
  } else {
    if (!/flowchart\s+TD/.test(mermaid)) errors.push('Mermaid deve usar "flowchart TD".');
    const cyc = findCycle(parseEdges(mermaid));
    if (cyc) {
      errors.push(
        `Fluxo Principal tem caminho de volta (ciclo) NÃO anotado: ${cyc.join(' -> ')}. ` +
        'Se o retorno é iteração intencional do processo (ex.: treinar ↔ avaliar ↔ ajustar), ' +
        'anote a aresta de volta como `-.->|itera: motivo|`; senão, remova o retorno (happy path avança).',
      );
    }
  }

  if (sections.includes('Permissões por perfil')) {
    if (!/Fonte única de permissões/.test(raw)) errors.push('Permissões sem a nota de "Fonte única de permissões".');
    if (!/^Perfis:\s*\*\*/m.test(raw)) errors.push('Permissões sem a linha "Perfis: **…**".');
  }
}

// Classifica a superfície declarada em "## Superfície" pelo PRIMEIRO marcador em
// negrito da seção. Telas primeiro (o placeholder de template lista todos os tipos e
// deve degradar para o comportamento clássico); depois CLI/Job/API. null = sem
// marcador reconhecível → tratar como tela (comportamento 1.5.x).
function surfaceOf(lines) {
  const slice = sectionSlice(lines, 'Superfície');
  if (!slice) return null;
  const bold = slice.map((l) => l.match(/\*\*([^*]+)\*\*/)).find(Boolean);
  if (!bold) return null;
  const v = bold[1].normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (/acao em tela|tela propria|\btela\b|\bmodal\b/.test(v)) return 'tela';
  if (/\bcli\b|linha de comando|terminal/.test(v)) return 'cli';
  if (/job|pipeline|batch|agendad/.test(v)) return 'job';
  if (/\bapi\b/.test(v)) return 'api';
  return null;
}

// --- Gate de repositório de destino (1.7.0) ---------------------------------
// A partir de `estado: em-desenvolvimento` (e em `implementado`), a funcionalidade precisa
// declarar ONDE o código vive: ≥1 linha na tabela de "## Implementação" com a coluna
// Repositório real (não placeholder). Quando a instância possui repos/INDEX.md com
// repositórios reais, cada nome declarado precisa constar lá (inventário canônico).
// Isenta o engine/ (templates). O preenchimento acontece no 3B (PASSO 5).
// O `estado` vem do leitor único (lib/front-matter.mjs): a cópia que vivia aqui exigia
// o `---` na linha 1 e, como o carimbo vem antes, este gate nunca rodou num N3 carimbado.

function isRealRepoCell(cell) {
  const t = (cell || '').trim();
  if (!t || /^\[.*\]$/.test(t)) return false; // vazio ou placeholder [repo]/[nome-…]
  const v = t.replace(/[`[\]]/g, '').trim();
  return Boolean(v) && !/^[—–-]+$/.test(v) && !/^repo$/i.test(v);
}

// Nomes de repositório do inventário repos/INDEX.md (1ª coluna das linhas de dados).
function reposFromIndex(root) {
  const idx = join(root, 'repos', 'INDEX.md');
  if (!existsSync(idx)) return null; // sem inventário — pula o cruzamento de nomes
  let raw;
  try { raw = readFileSync(idx, 'utf8'); } catch { return null; }
  const names = new Set();
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (!t.startsWith('|') || /^\|[\s:|-]+\|$/.test(t)) continue;
    let first = splitRow(t)[0] || '';
    if (/reposit[óo]rio/i.test(first)) continue; // header
    const link = first.match(/\[([^\]]+)\]\([^)]*\)/); // [nome](url) → nome
    first = (link ? link[1] : first).replace(/`/g, '').trim();
    if (isRealRepoCell(first)) names.add(first.toLowerCase());
  }
  return names.size ? names : null;
}

function checkImplementationRepos(lines, file, errors) {
  const estado = frontMatterEstado(lines);
  if (estado !== 'em-desenvolvimento' && estado !== 'implementado') return;
  const path = resolve(String(file || '')).replace(/\\/g, '/');
  if (/(^|\/)engine\//.test(path)) return; // templates do engine — isentos
  const declared = [];
  for (const row of tableRows(lines, 'Implementação')) {
    const cell = splitRow(row)[1] || '';
    if (isRealRepoCell(cell)) declared.push(cell.replace(/[`[\]]/g, '').trim());
  }
  if (!declared.length) {
    errors.push(
      `Funcionalidade em \`estado: ${estado}\` sem repositório de destino: a tabela de "## Implementação" ` +
      'precisa de ao menos uma linha com a coluna Repositório real (definida no 3B — PASSO 5; ' +
      'Caminho/Branch podem seguir como placeholder até o dev).',
    );
    return;
  }
  const root = instanceRoot(file);
  const inventory = root ? reposFromIndex(root) : null;
  if (!inventory) return;
  for (const r of declared) {
    if (!inventory.has(r.toLowerCase())) {
      errors.push(
        `Repositório "${r}" (## Implementação) não consta em repos/INDEX.md — registre-o no ` +
        'inventário (PROMPT_REPO_MAPPING) ou corrija o nome.',
      );
    }
  }
}

// Funcionalidade de edição/alteração? (verbos: editar, alterar, atualizar). A editabilidade
// dos campos precisa ser explícita nessas funcionalidades (coluna "Edição" em ## Campos).
// Portado do simpf-doc (evolução nascida na instância — upstream em 1.17.0).
function isEditFeature(lines, file) {
  const title = (lines.find((l) => l.trim().startsWith('# ')) || '').replace(/^#\s*/, '').trim();
  const verb = (title.split(/\s+/)[0] || '').toLowerCase();
  const byTitle = /^(editar|alterar|atualizar)$/.test(verb);
  const byFile = /(^|\/)f-(editar|alterar|atualizar)-/.test(String(file || '').replace(/\\/g, '/').toLowerCase());
  return byTitle || byFile;
}

// Funcionalidade de pesquisa/listagem? Detecta pelo verbo do título ou pelo prefixo do arquivo
// (verbos de busca no framework: pesquisar, listar, consultar, buscar).
function isSearchFeature(lines, file) {
  const title = (lines.find((l) => l.trim().startsWith('# ')) || '').replace(/^#\s*/, '').trim();
  const verb = (title.split(/\s+/)[0] || '').toLowerCase();
  const byTitle = /^(pesquisar|listar|consultar|buscar)$/.test(verb);
  const byFile = /(^|\/)f-(pesquisar|listar|consultar|buscar)-/.test(String(file || '').replace(/\\/g, '/').toLowerCase());
  return byTitle || byFile;
}

// --- Conformidade da seção ## API com o API-PATTERNS da instância (1.20.0) ---
// Diretriz MÁQUINA-LEGÍVEL lida do global/API-PATTERNS.md da instância (o validador é
// código genérico do engine; a regra é dado da instância — mesmo padrão do Arquétipo do
// MASTER e das tabelas do DEFINICAO-FUNCIONALIDADE). Determinístico: (N3 + API-PATTERNS) → saída fixa.
// Seed do mecanismo "validador obedece diretriz global": aqui, versão em rota interna.
const API_VERBS = /\b(GET|POST|PUT|PATCH|DELETE)\s+(\/[^\s)?"'`]+)/g;

function readApiDirectives(file) {
  const root = instanceRoot(file);
  if (!root) return null;
  const ap = join(root, 'global', 'API-PATTERNS.md');
  if (!existsSync(ap)) return null;
  let raw;
  try { raw = readFileSync(ap, 'utf8'); } catch { return null; }
  const m = raw.match(/versao-em-rota-interna[^\n]{0,24}?\b(sim|n[aã]o)\b/i);
  if (!m) return null; // sem diretriz declarada → nada a enforçar (compatível)
  const v = m[1].normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  return { versionInternal: v === 'sim' };
}

function checkApiRoutes(lines, file, errors) {
  const dir = readApiDirectives(file);
  if (!dir) return;
  const slice = sectionSlice(lines, 'API');
  if (!slice) return; // funcionalidade sem seção ## API
  const paths = new Set();
  for (const line of slice) {
    let m;
    API_VERBS.lastIndex = 0;
    while ((m = API_VERBS.exec(line))) paths.add(m[2]);
  }
  const hasVersion = (p) => /\/v\d+(\/|$|\?)/.test(p);
  for (const p of paths) {
    if (dir.versionInternal && !hasVersion(p)) {
      errors.push(`Rota "${p}" sem versão \`/vN/\` — o \`API-PATTERNS.md\` desta instância exige versão na rota interna (\`versao-em-rota-interna: sim\`).`);
    } else if (!dir.versionInternal && hasVersion(p)) {
      errors.push(`Rota "${p}" com versão \`/vN/\` — a API interna desta instância é **sem versão** (\`API-PATTERNS.md\`: \`versao-em-rota-interna: nao\`); versão só na fronteira externa.`);
    }
  }
}

function validateN3(lines, raw, errors, file) {
  checkCommon(lines, errors);
  const sub = lines.find((l) => l.trim().startsWith('> **Nível 3**'));
  if (sub && !/`[A-Z]{3}-[A-Z]{3}-\d{2}`/.test(sub)) errors.push('Subtítulo N3 sem ID `SIGLA-SAF-NN` em crase.');
  requireSections(
    lines,
    ['Descrição', 'Superfície', 'Regras de negócio', 'Cenários', 'Campos', 'Campos automáticos'],
    errors,
  );
  // Ordem das seções (6.4.16): só as do molde, na ordem de scripts/lib/ordem-n3.mjs —
  // a Superfície logo antes da seção de manifestação e a Origem logo antes do Changelog.
  const ordem = ordemN3(lines);
  if (!ordem.emOrdem) {
    errors.push(
      `Seções do N3 fora da ordem canônica — esperado: ${ordem.esperada.join(' → ')}. ` +
      'O N3 anterior à 6.4.16 se migra com node scripts/migra-ordem-n3.mjs <arquivo> --aplicar.',
    );
  }
  // Seção de manifestação condicionada à Superfície declarada (1.6.0):
  // tela → "Comportamento de tela"; CLI/Job/Pipeline/API → "Execução e operação".
  const surface = surfaceOf(lines);
  if (surface === 'cli' || surface === 'job' || surface === 'api') {
    if (!lines.some((l) => l.trim() === '## Execução e operação')) {
      errors.push(
        'Superfície CLI/Job/API sem a seção "## Execução e operação" (como executa/dispara, ' +
        'parâmetros, reexecução/resumibilidade, saídas geradas e como acompanhar o resultado). ' +
        '"## Comportamento de tela" é opcional para essas superfícies.',
      );
    }
  } else if (!lines.some((l) => l.trim() === '## Comportamento de tela')) {
    errors.push(
      'Falta a seção "## Comportamento de tela" (obrigatória quando a Superfície é ' +
      'Tela própria/Modal/Ação em tela; se a funcionalidade é CLI/Job/Pipeline/API, declare isso em ' +
      '"## Superfície" e use "## Execução e operação").',
    );
  }
  // Anti-vazamento técnico: a tabela de Campos é só Label PO — nunca Label Dev / campo banco.
  const header = tableHeader(lines, 'Campos');
  if (header) {
    if (!header.some((c) => /label po/i.test(c))) errors.push('Tabela "## Campos" sem a coluna "Label PO".');
    if (header.some((c) => /label dev/i.test(c) || /banco/i.test(c))) {
      errors.push('Tabela "## Campos" vaza camada técnica (Label Dev / campo banco) — proibido no N3.');
    }
  }
  // Gate de editabilidade: funcionalidade de edição exige a coluna "Edição" em ## Campos
  // (quais campos são editáveis, somente leitura ou imutáveis — explícito, não inferido).
  if (isEditFeature(lines, file) && header && !header.some((c) => /edi[çc][aã]o/i.test(c))) {
    errors.push('Funcionalidade de edição sem a coluna "Edição" na tabela "## Campos" — marque cada campo como editável / somente leitura / imutável.');
  }
  // Gate de resultado: funcionalidade de pesquisa/listagem exige a tabela das colunas do resultado.
  if (isSearchFeature(lines, file)) {
    if (!lines.some((l) => l.trim() === '## Colunas do resultado')) {
      errors.push('Funcionalidade de pesquisa/listagem sem a seção "## Colunas do resultado" (tabela dos campos exibidos no resultado da busca).');
    } else {
      const rh = tableHeader(lines, 'Colunas do resultado');
      if (!rh) errors.push('Seção "## Colunas do resultado" sem tabela.');
      else if (!rh.some((c) => /coluna|label po/i.test(c))) {
        errors.push('Tabela "## Colunas do resultado" sem a coluna "Coluna (Label PO)".');
      }
    }
  }
  // Gate de fidelidade: se a Superfície declara "Fidelidade ao protótipo: obrigatória",
  // precisa apontar o caminho do protótipo (prototypes/… ou um link .html).
  const fid = lines.find((l) => /fidelidade ao prot[óo]tipo/i.test(l));
  if (fid && /obrigat[óo]ri/i.test(fid) && !/(prototypes\/|\.html)/i.test(fid)) {
    errors.push('Fidelidade ao protótipo "obrigatória" sem o caminho do protótipo (aponte o arquivo em `prototypes/…`).');
  }
  // Gate de repositório de destino (1.7.0): em-desenvolvimento/implementado exigem
  // Repositório real em "## Implementação" (e existente em repos/INDEX.md, se houver).
  checkImplementationRepos(lines, file, errors);
  checkApiRoutes(lines, file, errors);
}

// Campos globais implícitos — não devem ser repetidos nas tabelas de entidade.
const DM_GLOBAL_FIELDS = new Set(['id', 'organization_id', 'created_at', 'updated_at', 'deleted_at']);
// Cabeçalho canônico da tabela de campos de uma entidade no fragmento.
const DM_ENTITY_HEADER = ['Label PO', 'Label Dev', 'Campo banco', 'Tipo SQL', 'Obrigatório', 'Notas'];

// Detecta se o arquivo é um data-model (índice global ou fragmento de domínio).
function dataModelKind(titleLine) {
  if (!titleLine) return null;
  const t = titleLine.trim();
  if (/^# DATA-MODEL\.md\b/.test(t)) return 'index';
  if (/^# Data Model:/.test(t)) return 'fragment';
  return null;
}

function validateDataModel(lines, raw, kind, errors) {
  if (kind === 'index') {
    // Índice: só as seções-âncora obrigatórias (a estrutura completa varia por instância).
    requireSections(
      lines,
      ['Convenção de nomenclatura', 'Campos globais (presentes em todas as tabelas)', 'Modelos por domínio'],
      errors,
    );
    return;
  }

  // Fragmento de domínio (global/data-models/[dominio].md).
  const headings = [];
  lines.forEach((l, i) => {
    if (/^## /.test(l)) headings.push({ name: l.replace(/^##\s+/, '').trim(), idx: i });
  });
  const isLogical = (name) => /^Arquivos Lógicos/i.test(name);
  const entities = headings.filter((h) => !isLogical(h.name));

  if (!entities.length) errors.push('Nenhuma entidade (seção "## [Entidade]") encontrada no fragmento.');
  if (!headings.some((h) => isLogical(h.name))) {
    errors.push('Falta a seção "## Arquivos Lógicos deste domínio" (contagem ALI/AIE).');
  }

  for (const ent of entities) {
    const next = headings.find((h) => h.idx > ent.idx);
    const slice = lines.slice(ent.idx + 1, next ? next.idx : lines.length);

    // Anotação de ALI/AIE logo abaixo do título da entidade.
    if (!slice.some((l) => /^>\s*\*\*(ALI|AIE):/.test(l.trim()))) {
      errors.push(`Entidade "${ent.name}" sem anotação de ALI/AIE ("> **ALI: …**").`);
    }

    // Tabela de campos com o cabeçalho canônico.
    const headerRow = slice.map((l) => l.trim()).find((l) => l.startsWith('|'));
    if (!headerRow) {
      errors.push(`Entidade "${ent.name}" sem tabela de campos.`);
      continue;
    }
    const cells = splitRow(headerRow);
    const missing = DM_ENTITY_HEADER.filter((c) => !cells.some((x) => x.toLowerCase() === c.toLowerCase()));
    if (missing.length) {
      errors.push(`Tabela da entidade "${ent.name}" sem coluna(s): ${missing.map((s) => `"${s}"`).join(', ')}.`);
    }

    // Campos globais implícitos não podem ser listados na entidade.
    const bancoIdx = cells.findIndex((x) => /campo banco/i.test(x));
    if (bancoIdx >= 0) {
      const dataRows = slice
        .map((l) => l.trim())
        .filter((l) => l.startsWith('|') && !/^\|[\s:|-]+\|$/.test(l))
        .slice(1);
      for (const row of dataRows) {
        const banco = (splitRow(row)[bancoIdx] || '').trim().toLowerCase();
        if (DM_GLOBAL_FIELDS.has(banco)) {
          errors.push(`Entidade "${ent.name}" repete o campo global "${banco}" (id/organization_id/created_at/updated_at/deleted_at são implícitos — não listar).`);
        }
      }
    }
  }
}

// Variante NEGOCIAL do data-model (usada pelo docqui-caixa): só a parte
// das ENTIDADES, sem a camada física de banco. Detectada pelo marcador
// "> **Modelo de entidades (negocial)**". Valida a estrutura reduzida e PROÍBE
// vazamento físico (Label Dev / Campo banco / Tipo SQL).
function validateDataModelNegocial(lines, raw, kind, errors) {
  if (kind === 'index') {
    requireSections(lines, ['Modelos por domínio'], errors);
    if (/^\|[^\n]*Endpoint origem[^\n]*\|/m.test(raw) || /^## (?:Campos globais|Enums do sistema|Índices e restrições)/m.test(raw)) {
      errors.push('Índice negocial contém estrutura física de banco ou API; mantenha entidades e atributos em Label PO.');
    }
  } else {
    // "Arquivos Lógicos (APF)" é seção de contagem, não entidade: o agente de contagem,
    // fora do Docqui, a grava no fragmento do domínio, e sem esta exceção o gate a cobrava
    // como se fosse uma entidade (exigindo coluna "Label PO").
    const NON_ENTITY = new Set(['Relacionamentos', 'Enums', 'Changelog', 'Arquivos Lógicos (APF)']);
    const headings = lines.filter((l) => /^## /.test(l)).map((l) => l.replace(/^##\s+/, '').trim());
    const entities = headings.filter((h) => !NON_ENTITY.has(h));
    if (!entities.length) errors.push('Fragmento negocial sem nenhuma entidade ("## [Entidade]").');
    for (const ent of entities) {
      const header = tableHeader(lines, ent);
      if (!header) { errors.push(`Entidade "${ent}" sem tabela de atributos.`); continue; }
      if (!header.some((c) => /label po/i.test(c) || /atributo/i.test(c))) {
        errors.push(`Tabela da entidade "${ent}" sem a coluna "Label PO"/"Atributo".`);
      }
    }
  }
  // Anti-vazamento físico: o modelo negocial NÃO carrega nomes de banco.
  if (/\bcampo banco\b/i.test(raw)) errors.push('Modelo negocial vaza camada física: "Campo banco" — nomes de banco vivem só no data-model técnico.');
  if (/\btipo sql\b/i.test(raw)) errors.push('Modelo negocial vaza camada física: "Tipo SQL".');
  if (/\blabel dev\b/i.test(raw)) errors.push('Modelo negocial vaza camada física: "Label Dev".');
}

// Variante de ARTEFATOS do data-model (1.6.0): descreve dados persistidos que NÃO são
// tabelas de banco — dataset, cache, checkpoint, índice, relatório — com formato,
// estrutura (schema dos metadados/manifest), ciclo de vida e invariantes de
// compatibilidade. Detectada pelo marcador "> **Modelo de artefatos (dados persistidos)**".
// Sem camada SQL: o cabeçalho canônico de entidade (Label Dev/Campo banco/Tipo SQL)
// não se aplica aqui.
function validateDataModelArtefatos(lines, raw, kind, errors) {
  if (kind === 'index') {
    requireSections(lines, ['Modelos por domínio'], errors);
    return;
  }
  const NON_ARTIFACT = new Set(['Convenções', 'Relacionamentos', 'Changelog']);
  const artifacts = lines
    .filter((l) => /^## /.test(l))
    .map((l) => l.replace(/^##\s+/, '').trim())
    .filter((h) => !NON_ARTIFACT.has(h));
  if (!artifacts.length) errors.push('Fragmento de artefatos sem nenhum artefato ("## [Artefato]").');
  for (const art of artifacts) {
    const slice = sectionSlice(lines, art) || [];
    if (!slice.some((l) => /^>\s*\*\*Artefato\b/i.test(l.trim()))) {
      errors.push(`Artefato "${art}" sem anotação de tipo ("> **Artefato**: dataset | cache | checkpoint | índice | relatório — formato: …").`);
    }
    const headerRow = slice.map((l) => l.trim()).find((l) => l.startsWith('|'));
    if (!headerRow) {
      errors.push(`Artefato "${art}" sem tabela de estrutura (colunas "Campo/Atributo | Tipo | Obrigatório | Notas").`);
    } else if (!splitRow(headerRow).some((c) => /campo|atributo/i.test(c))) {
      errors.push(`Tabela do artefato "${art}" sem a coluna "Campo"/"Atributo".`);
    }
    if (!slice.some((l) => /^###\s+Ciclo de vida/i.test(l.trim()))) {
      errors.push(`Artefato "${art}" sem a subseção "### Ciclo de vida" (produção → consumo → retenção/descarte).`);
    }
    if (!slice.some((l) => /^###\s+Invariantes/i.test(l.trim()))) {
      errors.push(`Artefato "${art}" sem a subseção "### Invariantes de compatibilidade" (o que quebra consumidores se mudar; escreva "nenhum além do formato" se for o caso).`);
    }
  }
  // Anti-vazamento: artefato não é tabela de banco.
  if (/\btipo sql\b/i.test(raw)) errors.push('Modelo de artefatos vaza camada de banco: "Tipo SQL" — se a estrutura é tabela relacional, use o fragmento de domínio padrão.');
  if (/\bcampo banco\b/i.test(raw)) errors.push('Modelo de artefatos vaza camada de banco: "Campo banco".');
}

// --- PATTERNS.md — catálogo de padrões de projeto (1.10.0) -------------------
// Valida a BEM-FORMAÇÃO do catálogo (não que o código o siga — isso é fitness
// function na CI do repo de produto / CP4). Determinístico: seções de governança
// presentes + cada entrada de padrão (### sob um "## … Catálogo …") com os campos
// obrigatórios, incluindo o Exemplo (código) com bloco cercado e a Verificação.
function patternsEntries(lines) {
  // Coleta as entradas `### …` sob seções de Catálogo, ciente de blocos de código.
  const entries = [];
  let inFence = false, inCatalog = false, cur = null;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (/^```/.test(l.trim())) { inFence = !inFence; if (cur) cur.body.push(l); continue; }
    if (inFence) { if (cur) cur.body.push(l); continue; }
    if (/^##\s/.test(l)) { if (cur) { entries.push(cur); cur = null; } inCatalog = /Catálogo/i.test(l); continue; }
    if (inCatalog && /^###\s/.test(l)) { if (cur) entries.push(cur); cur = { name: l.replace(/^###\s+/, '').trim(), body: [] }; continue; }
    if (cur) cur.body.push(l);
  }
  if (cur) entries.push(cur);
  return entries;
}

function validatePatterns(lines, raw, errors) {
  if (!lines.some((l) => /^##\s.*O que entra/i.test(l))) {
    errors.push('PATTERNS sem a seção "## … O que entra — e o que NÃO entra" (fronteira padrão × convenção × idioma).');
  }
  if (!lines.some((l) => /^##\s.*Como o SDD consome/i.test(l))) {
    errors.push('PATTERNS sem a seção "## … Como o SDD consome este catálogo".');
  }
  if (!lines.some((l) => /^##\s.*Catálogo/i.test(l))) {
    errors.push('PATTERNS sem nenhuma seção "## … Catálogo — …" (por camada).');
    return;
  }
  const entries = patternsEntries(lines);
  if (!entries.length) {
    errors.push('PATTERNS sem nenhuma entrada de padrão ("### …" sob uma seção de Catálogo).');
    return;
  }
  // Isenta a entrada-esqueleto do template (nome entre colchetes: "### [Nome do Padrão]…").
  const isPlaceholder = (name) => /^\[.*\]/.test(name);
  for (const e of entries) {
    if (isPlaceholder(e.name)) continue;
    const body = e.body.join('\n');
    const miss = [];
    if (!/\*\*Intenção\*\*/.test(body)) miss.push('Intenção');
    if (!/\*\*Realização na stack\*\*/.test(body)) miss.push('Realização na stack');
    if (!/\*\*Exemplo \(código\)\*\*/.test(body)) miss.push('Exemplo (código)');
    if (!/\*\*Verificação\*\*/.test(body)) miss.push('Verificação');
    if (!/\*\*Quando NÃO usar\*\*/.test(body)) miss.push('Quando NÃO usar');
    if (miss.length) {
      errors.push(`Entrada "${e.name}" sem campo(s) obrigatório(s): ${miss.map((s) => `"${s}"`).join(', ')}.`);
    }
    // "Exemplo (código)" exige bloco de código cercado dentro da entrada.
    if (!miss.includes('Exemplo (código)') && !e.body.some((l) => /^```/.test(l.trim()))) {
      errors.push(`Entrada "${e.name}" declara "Exemplo (código)" mas não traz um bloco de código (\`\`\` … \`\`\`).`);
    }
  }
}

// Local esperado por tipo de artefato (g-/sem-g- agnóstico: a pasta do Agrupamento Funcional é
// [^/]+, com ou sem prefixo). Ancoradas ao FIM do caminho.
const LOCATION_RULES = {
  N0: { re: /(^|\/)global\/N0_PRODUCT_VISION\.md$/, hint: 'global/N0_PRODUCT_VISION.md' },
  PATTERNS: { re: /(^|\/)global\/PATTERNS\.md$/, hint: 'global/PATTERNS.md' },
  N1: { re: /(^|\/)modules\/[^/]+\/README\.md$/, hint: 'modules/[dominio]/README.md' },
  N2: { re: /(^|\/)modules\/[^/]+\/[^/]+\/README\.md$/, hint: 'modules/[dominio]/[agrupamento-funcional]/README.md' },
  N3: { re: /(^|\/)modules\/[^/]+\/[^/]+\/f-[^/]+\.md$/, hint: 'modules/[dominio]/[agrupamento-funcional]/f-….md' },
  DM: { re: /(^|\/)global\/data-models\/[^/]+\.md$/, hint: 'global/data-models/[dominio].md' },
  'DM-idx': { re: /(^|\/)global\/DATA-MODEL\.md$/, hint: 'global/DATA-MODEL.md' },
};

// Guarda determinística de LOCALIZAÇÃO: o tipo do artefato precisa bater com a pasta.
// Só se aplica a artefatos de instância (caminho sob modules/ ou global/) e ISENTA o
// motor (engine/ — onde ficam os templates com nomes de placeholder).
function checkLocation(file, tag, errors) {
  const path = file.replace(/\\/g, '/');
  if (/(^|\/)engine\//.test(path)) return; // templates do engine — isentos
  const instanceScoped = /(^|\/)(modules|global)\//.test(path);
  if (!instanceScoped) return; // arquivo avulso/scratchpad — valida só o conteúdo
  const rule = LOCATION_RULES[tag];
  if (rule && !rule.re.test(path)) {
    errors.push(`Artefato ${tag} em local inesperado: esperado \`${rule.hint}\` (o arquivo não está na pasta correta).`);
  }
}

// --- Cross-artifact: ID duplicado na mesma instância (determinístico) -------
// IDs (SIGLA / SIGLA-SAF / SIGLA-SAF-NN) são únicos e nunca reutilizados. Este
// check varre a instância (modules/ + global/) e reprova se o ID deste artefato
// já aparece em outro. Isenta o engine/ (templates com IDs de placeholder).
function artifactId(lines) {
  const line = lines.find((l) => /> \*\*Nível [0-3]\*\*/.test(l));
  if (!line) return null;
  const m = line.match(/`([A-Z]{2,3}(?:-[A-Z]{3})?(?:-\d{2})?)`/);
  return m ? m[1] : null;
}
function instanceRoot(file) {
  let dir = dirname(resolve(file));
  for (let i = 0; i < 15; i++) {
    if (existsSync(join(dir, 'modules')) || existsSync(join(dir, 'global'))) return dir;
    const up = dirname(dir);
    if (up === dir) break;
    dir = up;
  }
  return null;
}
function collectMd(dir, out) {
  let entries;
  try { entries = readdirSync(dir); } catch { return; }
  for (const name of entries) {
    if (name === 'node_modules' || name === '.git' || name === 'engine') continue;
    const p = join(dir, name);
    let st;
    try { st = statSync(p); } catch { continue; }
    if (st.isDirectory()) collectMd(p, out);
    else if (name.endsWith('.md')) out.push(p);
  }
}
function checkDuplicateId(file, id, errors) {
  const abs = resolve(file).replace(/\\/g, '/');
  if (/(^|\/)engine\//.test(abs) || !id) return; // templates isentos / sem ID detectável
  const root = instanceRoot(file);
  if (!root) return;
  const found = [];
  for (const d of ['modules', 'global']) collectMd(join(root, d), found);
  const clashes = [];
  for (const f of found) {
    if (resolve(f).replace(/\\/g, '/') === abs) continue;
    try {
      if (artifactId(readFileSync(f, 'utf8').split(/\r?\n/)) === id) {
        clashes.push(resolve(f).replace(/\\/g, '/').replace(`${root.replace(/\\/g, '/')}/`, ''));
      }
    } catch { /* arquivo ilegível — ignora */ }
  }
  if (clashes.length) {
    errors.push(`ID "${id}" duplicado — já usado em: ${clashes.join(', ')} (IDs são únicos e não se reutilizam).`);
  }
}

// SDD (PROMPT_SDD): as seções numeradas do template, na ordem — 15 no SDD completo, 7 no
// de alteração — e o ❓/🏛️ usado no corpo com a seção que os consolida preenchida. Antes,
// o SDD caía em "tipo não detectado" ou, com um "> **Nível 2**" citado, era lido como N2
// (achado no siesa-doc, 2026-10-11).
const SDD_SECOES = {
  completo: ['Escopo deste documento', 'Visão geral da arquitetura', 'Modelo de dados', 'Design da API', 'Design dos serviços', 'Design dos repositórios', 'Design dos componentes de frontend', 'Design de jobs assíncronos', 'Design de eventos internos', 'Estrutura de arquivos', 'Sequência de implementação', 'Design de testes', 'Checklist de implementação', 'Pontos a resolver antes de implementar', 'Decisões de arquitetura registradas'],
  alteracao: ['Escopo', 'O que muda, por camada', 'O que NÃO muda', 'Testes', 'Arquivos a alterar', 'Pontos a resolver antes de implementar', 'Decisões de arquitetura'],
};
function sddKind(titleLine) {
  const t = (titleLine || '').trim();
  if (/^#\s+SDD de alteração\b/.test(t)) return 'alteracao';
  if (/^#\s+SDD\s+[—–-]/.test(t)) return 'completo';
  return null;
}
function validateSDD(lines, kind, errors) {
  const esperadas = SDD_SECOES[kind];
  const achadas = [];
  let cerca = false;
  for (const [i, l] of lines.entries()) {
    if (/^\s*(```|~~~)/.test(l)) cerca = !cerca;
    const m = !cerca && l.match(/^##\s+(\d+)\.\s+(.+?)\s*$/);
    if (m) achadas.push({ n: Number(m[1]), titulo: m[2], i });
  }
  esperadas.forEach((t, k) => {
    const s = achadas.find((a) => a.n === k + 1);
    if (!s) errors.push(`SDD sem a seção "## ${k + 1}. ${t}".`);
    else if (!s.titulo.toLowerCase().startsWith(t.toLowerCase())) errors.push(`SDD: a seção ${k + 1} deveria ser "${t}" (está "${s.titulo}").`);
  });
  const nums = achadas.map((a) => a.n);
  if (nums.some((n, k) => k && n <= nums[k - 1])) errors.push('SDD: seções numeradas fora de ordem.');
  const corpoDe = (k) => {
    const s = achadas.find((a) => a.n === k);
    if (!s) return null;
    const fim = achadas.find((a) => a.i > s.i);
    return lines.slice(s.i + 1, fim ? fim.i : lines.length).filter((l) => l.trim() && !/^<!--/.test(l.trim()));
  };
  const nPend = esperadas.length - 1, nDec = esperadas.length;
  const foraDe = (k) => { const s = achadas.find((a) => a.n === k); const fim = s && achadas.find((a) => a.i > s.i); return lines.filter((_, i) => !s || i <= s.i || (fim && i >= fim.i)); };
  if (foraDe(nPend).some((l) => l.includes('❓')) && !(corpoDe(nPend) || []).length) errors.push(`SDD usa ❓ no corpo e a seção ${nPend} (Pontos a resolver) está vazia — todo ❓ é consolidado nela.`);
  if (foraDe(nDec).some((l) => l.includes('🏛️')) && !(corpoDe(nDec) || []).length) errors.push(`SDD usa 🏛️ no corpo e a seção ${nDec} (Decisões) está vazia — toda decisão é registrada nela.`);
}

function validate(file) {
  const errors = [];
  const raw = readFileSync(file, 'utf8');
  const lines = raw.split(/\r?\n/);

  const levelLine = lines.find((l) => /> \*\*Nível [0123]\*\*/.test(l));
  const level = levelLine ? levelLine.match(/Nível ([0123])/)[1] : null;
  const titleLine = lines.find((l) => l.trim().startsWith('# '));
  const dmKind = dataModelKind(titleLine);
  const isPatterns = titleLine && /^#\s+PATTERNS\.md\b/.test(titleLine.trim());
  const sdd = sddKind(titleLine);

  if (sdd) validateSDD(lines, sdd, errors);
  else if (level === '0') validateN0(lines, raw, errors, file);
  else if (level === '1') validateN1(lines, raw, errors);
  else if (level === '2') validateN2(lines, raw, errors, file);
  else if (level === '3') validateN3(lines, raw, errors, file);
  else if (dmKind) {
    if (/Modelo de artefatos \(dados persistidos\)/.test(raw)) validateDataModelArtefatos(lines, raw, dmKind, errors);
    else if (/Modelo de entidades \(negocial\)/.test(raw) &&
      !(/(?:^|[\\/])engine[\\/]templates[\\/]/.test(file) && /^<!-- perfil:/m.test(raw))) validateDataModelNegocial(lines, raw, dmKind, errors);
    else validateDataModel(lines, raw, dmKind, errors);
  }
  else if (isPatterns) validatePatterns(lines, raw, errors);
  else errors.push('Tipo não detectado (falta o subtítulo "> **Nível 0|1|2|3**" ou o título "# Data Model: …" / "# PATTERNS.md" / "# SDD — …").');

  const tag = sdd ? 'SDD' : level ? `N${level}` : dmKind ? (dmKind === 'index' ? 'DM-idx' : 'DM') : isPatterns ? 'PATTERNS' : '??';
  if (tag !== '??' && tag !== 'SDD') checkLocation(file, tag, errors);
  if (!sdd && ['1', '2', '3'].includes(level)) checkDuplicateId(file, artifactId(lines), errors);
  return { tag, errors };
}

const files = process.argv.slice(2);
if (!files.length) {
  console.error('Uso: node scripts/validate-doc.mjs <arquivo.md> [outro.md …]');
  process.exit(2);
}

let failed = 0;
for (const f of files) {
  let res;
  try {
    res = validate(f);
  } catch (e) {
    console.error(`✗ ${f}: erro ao ler — ${e.message}`);
    failed++;
    continue;
  }
  const tag = res.tag;
  if (res.errors.length) {
    failed++;
    console.error(`✗ [${tag}] ${f}`);
    for (const e of res.errors) console.error(`    - ${e}`);
  } else {
    console.log(`✓ [${tag}] ${f}`);
  }
}
process.exit(failed ? 1 : 0);
