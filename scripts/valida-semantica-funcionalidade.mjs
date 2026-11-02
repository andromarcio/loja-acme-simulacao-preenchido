#!/usr/bin/env node
// valida-semantica-funcionalidade.mjs — gate SEMÂNTICO determinístico de N3: verifica se o
// artefato é mesmo uma FUNCIONALIDADE segundo a definição canônica (engine/DEFINICAO-FUNCIONALIDADE.md,
// critérios FD-1…FD-12). Complementa o validate-doc.mjs (estrutura): lá se checa se as
// seções existem; aqui, se o que foi nomeado como funcionalidade é uma ação atômica com
// resultado observável — sem LLM, independe do modelo/harness que produziu o arquivo.
//
// O vocabulário (verbos canônicos + termos bloqueados) NÃO vive neste script: é lido
// das tabelas máquina-legíveis do DEFINICAO-FUNCIONALIDADE.md — fonte única; estender o
// vocabulário é editar a tabela, não o código.
//
// OVERRIDES POR INSTÂNCIA (1.6.0): a instância pode ajustar o vocabulário sem tocar no
// engine, via `global/VOCABULARY-OVERRIDES.md` (modelo em engine/templates/global/).
// Um termo é "técnico" ou "de domínio" conforme o produto: `cache` vaza camada técnica
// num CRM, mas é a entidade central de um pipeline de ML. Seções máquina-legíveis:
//   ## Verbos adicionais da instância           → entram no vocabulário (FD-1/FD-3)
//   ## Termos liberados na posição do verbo     → saem dos bloqueados (FD-4)
//   ## Termos liberados na Descrição            → saem dos proibidos da Descrição (FD-8)
//   ## Termos adicionais proibidos na Descrição → entram nos proibidos (FD-8)
//
// Uso:
//   node scripts/valida-semantica-funcionalidade.mjs <modules/.../f-….md> [outro.md …]
//
// Saída: erros (reprovam) e avisos (não reprovam) por arquivo. Código 0 se todos
// passarem (avisos permitidos); 1 se algum reprovar; 2 em erro de uso/configuração.
//
// Checks (IDs espelham a tabela de critérios do DEFINICAO-FUNCIONALIDADE.md):
//   FD-1  primeiro segmento do arquivo é verbo no infinitivo (canônico → ✓; forma de
//         infinitivo não catalogada → aviso; termo bloqueado ou não-verbo → erro)
//   FD-2  título começa com o MESMO verbo do arquivo (acentos ignorados)
//   FD-3  atomicidade: nome/título não encadeiam dois verbos canônicos
//   FD-4  termo bloqueado na posição do verbo (agrupador/nominalização/artefato/NFR)
//         → erro com o encaminhamento da tabela
//   FD-5  (via FD-4) não é campo/regra/tela/mensagem/NFR nomeado como funcionalidade
//   FD-6  resultado observável: ## Cenários com ≥1 cenário Gherkin e todo cenário
//         com Então/Then; coerência entidade↔título/descrição (aviso)
//   FD-7  regras são invariantes: nenhum item de ## Regras de negócio carrega reação
//         do sistema ("não salva", "exibe mensagem", "conforme o Design System");
//         item que descreve estrutura/comportamento de tela gera AVISO
//   FD-8  Descrição declara a ENTREGA: sem placeholder, 1–2 frases, sem termos vagos
//         ("etc.", "de forma eficiente") ou técnicos (tabela do DEFINICAO-FUNCIONALIDADE),
//         menção a uma ação do vocabulário (aviso se ausente) e não duplicada — varre
//         os demais N3 da instância: descrição idêntica reprova; quase idêntica avisa
//   FD-9  quantidade nomeada: menção a "as/os N [substantivo enumerável]" (ou a contração:
//         "dos/nas/aos/pelos N …") tem os N itens nomeados — na própria frase, em
//         subitens logo abaixo, em tabela/lista da seção que não seja a da própria frase,
//         ou na seção ## Campos do documento (para substantivos de campo)
//
// FD-1…FD-9 dizem se o artefato é uma funcionalidade (erro reprova). FD-10…FD-12 dizem se o
// N3 sustenta a contagem de pontos de função — são AVISOS e rodam mesmo quando a
// Descrição reprova no FD-8:
//   FD-10 proveniência dos campos: ## Campos sem a coluna Entidade; campo de lista
//         (`lista de opções`, `lista (A, B)`, `seleção → X`) sem entidade de origem;
//         `seleção → X` diferente da coluna Entidade
//   FD-11 memória de cálculo: linha já contada em ## Métricas de tamanho (EE/SE/CE com
//         ALR e DER numéricos) sem "### Memória de cálculo"
//   FD-12 entidade tocada e não declarada: entidade de global/data-models citada em
//         ## Regras de negócio / ## Campos automáticos e ausente de toda fonte que a
//         contagem lê (coluna Entidade, `seleção → X`, ## Derivações, ## Dados lidos e
//         gravados) — heurística por nome; não conta a menção dentro de rótulo de campo
//         da própria funcionalidade, a precedida de "Tipo de" nem a de referência `→ ver`

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));

const norm = (s) =>
  String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
// Tipo que nomeia a entidade origem da lista: `seleção → X`, `seleção múltipla → X`
// (as relações N:N) e `lista → X`. O qualificador entre parênteses — `Contrato (CTR-CON)`
// — não faz parte do nome da entidade e fica de fora da comparação.
const SELECAO_RE = /(?:sele[çc][aã]o(?:\s+m[úu]ltipla)?|lista)\s*→\s*(.+)$/i;
const nomeEntidade = (s) => String(s).replace(/[[\]`]/g, '').replace(/\s*\([^()]*\)\s*$/, '').trim();
const trunc = (s) => (s.length > 70 ? `${s.slice(0, 70)}…` : s).trim();

// ---------------------------------------------------------------- vocabulário
// Localiza o DEFINICAO-FUNCIONALIDADE.md: primeiro relativo ao script (repo do engine ou
// instância que embarca engine/), senão subindo a partir do arquivo validado.
function findDefinition(sampleFile) {
  const local = join(HERE, '..', 'engine', 'DEFINICAO-FUNCIONALIDADE.md');
  if (existsSync(local)) return local;
  let dir = dirname(resolve(sampleFile));
  for (let i = 0; i < 15; i++) {
    const cand = join(dir, 'engine', 'DEFINICAO-FUNCIONALIDADE.md');
    if (existsSync(cand)) return cand;
    const up = dirname(dir);
    if (up === dir) break;
    dir = up;
  }
  return null;
}

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

function tableFirstCells(lines, name) {
  const slice = sectionSlice(lines, name);
  if (!slice) return null;
  const rows = slice
    .map((l) => l.trim())
    .filter((l) => l.startsWith('|') && !/^\|[\s:|-]+\|$/.test(l))
    .slice(1); // sem o header
  return rows.map((r) => {
    const cells = r.replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
    return cells.map((c) => c.replace(/`/g, ''));
  });
}

// Cabeçalho (primeira linha `|`) da tabela de uma seção, sem crases.
function headerCells(lines, name) {
  const slice = sectionSlice(lines, name);
  const l = slice && slice.map((x) => x.trim()).find((x) => x.startsWith('|'));
  return l ? l.replace(/^\||\|$/g, '').split('|').map((c) => c.trim().replace(/`/g, '')) : null;
}

function loadVocabulary(sampleFile) {
  const defFile = findDefinition(sampleFile);
  if (!defFile) return { error: 'engine/DEFINICAO-FUNCIONALIDADE.md não encontrado (fonte do vocabulário).' };
  const lines = readFileSync(defFile, 'utf8').split(/\r?\n/);
  const verbRows = tableFirstCells(lines, 'Vocabulário de verbos canônicos');
  const blockRows = tableFirstCells(lines, 'Termos bloqueados na posição do verbo');
  if (!verbRows || !verbRows.length) {
    return { error: `Seção "## Vocabulário de verbos canônicos" ausente/vazia em ${defFile}.` };
  }
  if (!blockRows || !blockRows.length) {
    return { error: `Seção "## Termos bloqueados na posição do verbo" ausente/vazia em ${defFile}.` };
  }
  const descRows = tableFirstCells(lines, 'Termos proibidos na Descrição');
  if (!descRows || !descRows.length) {
    return { error: `Seção "## Termos proibidos na Descrição" ausente/vazia em ${defFile}.` };
  }
  const verbs = new Set(verbRows.map((c) => norm(c[0])));
  const blocked = new Map(blockRows.map((c) => [norm(c[0]), { what: c[1] || '?', where: c[2] || '?' }]));
  const descBlocked = new Map(descRows.map((c) => [norm(c[0]), { tipo: c[1] || '?', hint: c[2] || '?' }]));
  // Pares de alternância (toggle): antônimos de estado binário = UMA funcionalidade (isenta FD-3).
  const toggleRows = tableFirstCells(lines, 'Pares de alternância (toggle)') || [];
  const togglePairs = toggleRows
    .map((c) => [norm(c[0]), norm(c[1] || '')].filter(Boolean))
    .filter((p) => p.length === 2)
    .map((p) => new Set(p));
  return { verbs, blocked, descBlocked, togglePairs, defFile };
}

// ------------------------------------------------- overrides da instância (1.6.0)
// Raiz da instância = primeira pasta acima do arquivo validado que contém modules/
// ou global/. É onde vive o global/VOCABULARY-OVERRIDES.md (se a instância tiver um).
function instanceRootOf(file) {
  let dir = dirname(resolve(file));
  for (let i = 0; i < 15; i++) {
    if (existsSync(join(dir, 'modules')) || existsSync(join(dir, 'global'))) return dir;
    const up = dirname(dir);
    if (up === dir) break;
    dir = up;
  }
  return null;
}

const overridesCache = new Map(); // raiz da instância → overrides | null
// ── FD-12: catálogo de entidades da instância (global/data-models/*.md) ──────
// O ALR da APF sai de quatro fontes; as três primeiras são ancoradas em campo
// (coluna `Entidade`, `## Derivações`, `Tipo: seleção → X`). A quarta é a varredura
// das regras — é ela que pega a entidade que a funcionalidade toca sem exibir campo algum.
// Este catálogo dá o vocabulário dessa varredura.
const entidadesCache = new Map();
function loadEntidades(file) {
  const root = instanceRootOf(file);
  if (!root) return [];
  if (entidadesCache.has(root)) return entidadesCache.get(root);
  const out = [];
  const dir = join(root, 'global', 'data-models');
  if (existsSync(dir)) {
    try {
      for (const f of readdirSync(dir)) {
        if (!f.endsWith('.md') || f.startsWith('_')) continue;
        for (const l of readFileSync(join(dir, f), 'utf8').split(/\r?\n/)) {
          // Duas formas de cabeçalho de entidade em uso nas instâncias:
          //   `## Entidade: \`Contrato\` — NAME \`Contrato\``  e  `## Contrato`
          const mE = l.match(/^##\s+Entidade:\s*`?([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ ]*)`?/);
          if (mE) { out.push(mE[1].trim()); continue; }
          const m = l.match(/^##\s+([A-ZÀ-Ú][A-Za-zÀ-ÿ]*(?:\s*[A-ZÀ-Ú][A-Za-zÀ-ÿ]*)*)\s*$/);
          if (m) out.push(m[1].trim());
        }
      }
    } catch { /* data-models ilegível → varredura desliga (não inventa entidade) */ }
  }
  // Cabeçalhos estruturais do fragmento não são entidades — sem isso, `## Relacionamentos`
  // vira "entidade" e o catálogo passa a acusar qualquer regra que fale de relacionamento.
  const ESTRUTURAIS = /^(relacionamentos?|changelog|enums?|indice|[ií]ndice|notas?|observa[çc][õo]es|regras?|conven[çc][õo]es|glossario|gloss[áa]rio|refer[êe]ncias?|hist[óo]rico|vis[ãa]o geral|entidades?|campos globais|artefatos?)$/i;
  const uniq = [...new Set(out)].filter((e) => e.length > 3 && !ESTRUTURAIS.test(e.trim()));
  entidadesCache.set(root, uniq);
  return uniq;
}
// Chave de comparação: sem acento/caixa/pontuação e sem conectivos — para que
// "Cronograma de Publicação" (prosa) case com `CronogramaPublicacao` (entidade).
function entKey(s) {
  return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/\b(de|da|do|das|dos|e)\b/g, '').replace(/[^a-z0-9]/g, '');
}
// Regex que acha a entidade escrita como prosa: palavras na ordem, conectivos e
// plural opcionais entre elas.
function entRegex(nome) {
  const palavras = nome.replace(/([a-zà-ÿ])([A-ZÀ-Ú])/g, '$1 $2').split(/\s+/)
    .map((w) => w.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase())
    .filter(Boolean);
  if (!palavras.length) return null;
  return new RegExp('\\b' + palavras.map((w) => w + 's?').join('(?:\\s+(?:de|da|do|das|dos|e))*\\s+') + '\\b', 'i');
}

function loadOverrides(file) {
  const root = instanceRootOf(file);
  if (!root) return null;
  if (overridesCache.has(root)) return overridesCache.get(root);
  let result = null;
  const ovFile = join(root, 'global', 'VOCABULARY-OVERRIDES.md');
  if (existsSync(ovFile)) {
    try {
      const lines = readFileSync(ovFile, 'utf8').split(/\r?\n/);
      const rows = (name) => tableFirstCells(lines, name) || [];
      result = {
        file: ovFile,
        verbs: rows('Verbos adicionais da instância').map((c) => norm(c[0])).filter(Boolean),
        unblockVerbPos: rows('Termos liberados na posição do verbo').map((c) => norm(c[0])).filter(Boolean),
        allowDesc: rows('Termos liberados na Descrição').map((c) => norm(c[0])).filter(Boolean),
        blockDesc: rows('Termos adicionais proibidos na Descrição')
          .map((c) => [norm(c[0]), { tipo: c[1] || 'instancia', hint: c[2] || 'termo proibido pela instância' }])
          .filter((r) => r[0]),
      };
    } catch { /* overrides ilegíveis → ignora (usa só o vocabulário do engine) */ }
  }
  overridesCache.set(root, result);
  return result;
}

// ------------------------------------------- catálogo de mensagens da instância
// Textos entre aspas dos dicionários (MESSAGE- é a fonte das mensagens de UI;
// FIELD- e ERROR- têm precedência para textos de validação/erro que já vivem lá).
// Placeholders "[N]"/"[X]" viram curinga — "Máximo de [N] caracteres." casa com
// "Máximo de 255 caracteres.". Sem MESSAGE-DICTIONARY na instância (ex.: repo do
// engine, fixtures), a checagem de mensagens é pulada em silêncio.
const msgCatalogCache = new Map(); // raiz da instância → { exact:Set, patterns:[] } | null
function loadMsgCatalog(file) {
  const root = instanceRootOf(file);
  if (!root) return null;
  if (msgCatalogCache.has(root)) return msgCatalogCache.get(root);
  let result = null;
  if (existsSync(join(root, 'global', 'MESSAGE-DICTIONARY.md'))) {
    const exact = new Set();
    const patterns = [];
    const byKey = new Map(); // chave do MESSAGE-DICTIONARY → matcher do texto literal
    const matcherOf = (text) => {
      if (/\[[^\]]+\]/.test(text)) {
        const re = new RegExp(`^${text.replace(/[.*+?^$()|{}\\]/g, '\\$&').replace(/\\?\[[^\]]+\]/g, '.+')}$`);
        return (t) => re.test(t);
      }
      return (t) => t === text;
    };
    for (const dict of ['MESSAGE-DICTIONARY.md', 'FIELD-DICTIONARY.md', 'ERROR-DICTIONARY.md']) {
      const p = join(root, 'global', dict);
      if (!existsSync(p)) continue;
      const src = readFileSync(p, 'utf8');
      for (const m of src.matchAll(/"([^"\n]+)"/g)) {
        const text = m[1].trim();
        if (/\[[^\]]+\]/.test(text)) {
          const re = text.replace(/[.*+?^$()|{}\\]/g, '\\$&').replace(/\\?\[[^\]]+\]/g, '.+');
          patterns.push(new RegExp(`^${re}$`));
        } else {
          exact.add(text);
        }
      }
      if (dict === 'MESSAGE-DICTIONARY.md') {
        // Linhas de tabela | `CHAVE` | … | "Texto literal" | — para conferir marcadores.
        for (const row of src.matchAll(/^\|\s*`([A-Z0-9_]+)`\s*\|[^\n]*"([^"\n]+)"/gm)) {
          byKey.set(row[1], matcherOf(row[2].trim()));
        }
      }
    }
    result = { exact, patterns, byKey };
  }
  msgCatalogCache.set(root, result);
  return result;
}

// Vocabulário efetivo do arquivo = tabelas do engine + overrides da instância dele.
function effectiveVocab(base, ov) {
  if (!ov) return base;
  const verbs = new Set(base.verbs);
  for (const v of ov.verbs) verbs.add(v);
  const blocked = new Map(base.blocked);
  for (const t of ov.unblockVerbPos) blocked.delete(t);
  for (const v of ov.verbs) blocked.delete(v); // verbo adicionado prevalece sobre bloqueio
  const descBlocked = new Map(base.descBlocked);
  for (const t of ov.allowDesc) descBlocked.delete(t);
  for (const [t, meta] of ov.blockDesc) descBlocked.set(t, meta);
  return { ...base, verbs, blocked, descBlocked };
}

// ------------------------------------------------------------------- helpers
// Forma de infinitivo pt-BR (heurística p/ verbo ainda não catalogado → aviso).
const looksInfinitive = (t) => /^[a-z]{2,}(ar|er|ir)$/.test(t);

// Conjunto de verbos distintos = exatamente um par de alternância catalogado?
// (toggle de estado binário — ativar/desativar — é UMA funcionalidade; isenta FD-3.)
function isTogglePair(distinctVerbs, togglePairs) {
  if (distinctVerbs.size !== 2 || !togglePairs) return false;
  return togglePairs.some((pair) => [...distinctVerbs].every((v) => pair.has(v)));
}

const stripHtmlComments = (raw) => raw.replace(/<!--[\s\S]*?-->/g, '');

function titleOf(lines) {
  const l = lines.find((x) => x.trim().startsWith('# '));
  return l ? l.trim().replace(/^#\s*/, '').trim() : null;
}

// Palavras "de conteúdo" do título (sem pontuação/markdown).
const titleWords = (title) =>
  norm(title).replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/).filter(Boolean);

// Padrões de REAÇÃO do sistema dentro de regra de negócio (regra absoluta #9:
// regra é invariante; reação é cenário).
const REACTION_PATTERNS = [
  /exib\w*[^.;]{0,40}\b(mensagem|erro|toast|alerta|aviso)\b/i,
  /\bmostra\w*[^.;]{0,40}\b(mensagem|erro|toast|alerta|aviso)\b/i,
  /\bmensagem\s+de\s+(erro|sucesso|valida)/i,
  /conforme\s+o\s+design\s+system/i,
  /n[ãa]o\s+(salva|grava|deixa\s+salvar|permite\s+salvar)\b/i,
  /bloqueia\s+(o\s+)?(bot[ãa]o|salvamento|a\s+tela)/i,
  /\btoast\b/i,
];

// Padrões de SUPERFÍCIE/ESTRUTURA DE TELA dentro de regra de negócio (mesma regra
// absoluta #9, outro sintoma): organização em abas, ordem/carga da listagem, filtros,
// colunas, rotas etc. não são invariantes de negócio — vivem em "## Comportamento de
// tela" (apresentação) ou na tabela "## Campos" (filtros). Regra de negócio precisa
// continuar verdadeira mesmo que a interface seja outra (uma API, um lote).
// Nascido como ERRO na instância SIMPF (corpus limpo lá); no canônico entra como
// AVISO — no corpus AVAL os mesmos padrões acertam 18 linhas em 14 N3 já aprovados,
// misturando débito real com menção legítima ("a sigla identifica o sistema em telas
// e relatórios"). Promover a erro só depois de calibrar contra os corpora.
const UI_SURFACE_PATTERNS = [
  /\btelas?\b/i,
  /\babas?\b/i,
  /\bbot([ãa]o|[õo]es)\b/i,
  /\bmodal\b/i,
  /\bformul[áa]rios?\b/i,
  /\blistagem\b/i,
  /\bcarga\s+inicial\b/i,
  /\bordena[çc][ãa]o\b/i,
  /\bfiltros?\b/i,
  /\bcolunas?\s+(do|de|da)\s+(resultado|lista|grade)\b/i,
  /\bpainel\b/i,
  /\brota\b/i,
  /\bclique\b/i,
  /\bdropdown\b|\bcheckbox\b|\bchip\b/i,
];

// Cenários do(s) bloco(s) gherkin de uma seção: [{ name, hasThen }].
function gherkinScenarios(sectionLines) {
  if (!sectionLines) return null;
  const text = sectionLines.join('\n');
  const blocks = [...text.matchAll(/```gherkin\s*([\s\S]*?)```/g)].map((m) => m[1]);
  if (!blocks.length) return null;
  const scenarios = [];
  for (const block of blocks) {
    let current = null;
    for (const line of block.split(/\r?\n/)) {
      const s = line.trim();
      const m = s.match(/^(?:Scenario(?:\s+Outline)?|Cen[aá]rio|Esquema do Cen[aá]rio)\s*:\s*(.*)$/i);
      if (m) {
        if (current) scenarios.push(current);
        current = { name: m[1] || '(sem nome)', hasThen: false };
        continue;
      }
      if (current && /^(Then|Ent[aã]o)\b/i.test(s)) current.hasThen = true;
    }
    if (current) scenarios.push(current);
  }
  return scenarios;
}

// Radical de um verbo p/ casar flexões e nominalizações na Descrição
// ("cadastrar" → "cadastr" casa "cadastro/cadastra"; "pagar" → "paga" casa "pagamento").
const stemOf = (v) => (v.length >= 7 ? v.slice(0, -2) : v.slice(0, -1));

// Texto corrido do PRIMEIRO PARÁGRAFO da seção ## Descrição.
// A Descrição tem duas camadas em parágrafos consecutivos: o 1º é o contrato de
// ENTREGA (o que o FD-8 mede — cabe em 1–2 frases) e o 2º diz COMO SE USA. Ler a
// seção inteira faria o FD-8 acusar toda funcionalidade de descrição longa, medindo as
// duas camadas como se fossem uma.
function descriptionText(lines) {
  const slice = sectionSlice(lines, 'Descrição');
  if (!slice) return null;
  const primeiro = [];
  for (const l of slice) {
    const t = l.trim();
    if (t === '---') break;
    if (!t) { if (primeiro.length) break; continue; }
    primeiro.push(t);
  }
  return primeiro.join(' ');
}

// Palavras de conteúdo p/ comparação de descrições (sem acento, sem stopwords).
const DESC_STOPWORDS = new Set([
  'que', 'para', 'com', 'uma', 'dos', 'das', 'este', 'esta', 'esse', 'essa', 'seu', 'sua',
  'ser', 'sao', 'nao', 'mais', 'pelo', 'pela', 'por', 'aos', 'sem', 'apos', 'quando',
  'como', 'todos', 'todas', 'cada', 'novo', 'nova', 'seus', 'suas', 'permite', 'permitir',
  'possibilita', 'sistema', 'usuario', 'usuarios', 'feature', 'dado', 'dados',
]);
const contentWords = (text) =>
  new Set(norm(text).split(/[^a-z0-9]+/).filter((w) => w.length >= 3 && !DESC_STOPWORDS.has(w)));

function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const w of a) if (b.has(w)) inter++;
  return inter / (a.size + b.size - inter);
}

// Demais N3 da instância (modules/**/f-*.md), p/ o check de descrição duplicada.
function siblingN3s(file) {
  let root = dirname(resolve(file));
  for (let i = 0; i < 15; i++) {
    if (existsSync(join(root, 'modules'))) break;
    const up = dirname(root);
    if (up === root) return [];
    root = up;
  }
  if (!existsSync(join(root, 'modules'))) return [];
  const out = [];
  (function walk(dir) {
    let entries;
    try { entries = readdirSync(dir); } catch { return; }
    for (const name of entries) {
      if (name === 'node_modules' || name === '.git' || name === 'engine') continue;
      const p = join(dir, name);
      let st;
      try { st = statSync(p); } catch { continue; }
      if (st.isDirectory()) walk(p);
      else if (/^f-.+\.md$/.test(name) && resolve(p) !== resolve(file)) out.push(p);
    }
  })(join(root, 'modules'));
  return out;
}

// ------------------------------------------------------------------ validação
function validate(file, vocab) {
  const errors = [];
  const warnings = [];
  const raw = stripHtmlComments(readFileSync(file, 'utf8'));
  const lines = raw.split(/\r?\n/);

  // Só N3 (detecção idêntica ao validate-doc). Outros artefatos passam batido.
  if (!lines.some((l) => /> \*\*Nível 3\*\*/.test(l))) return { skip: true, errors, warnings };

  const { verbs, blocked, descBlocked } = vocab;

  // --- FD-1/FD-4 — nome do arquivo -------------------------------------------
  const base = basename(file);
  const slugMatch = base.match(/^f-(.+)\.md$/);
  let fileVerb = null;
  let entityTokens = [];
  if (!slugMatch) {
    errors.push(`[FD-1] Arquivo "${base}" fora do padrão \`f-[verbo]-[entidade].md\`.`);
  } else {
    const tokens = slugMatch[1].split('-').filter(Boolean);
    fileVerb = norm(tokens[0] || '');
    entityTokens = tokens.slice(1);
    if (blocked.has(fileVerb)) {
      const b = blocked.get(fileVerb);
      errors.push(
        `[FD-4] "${fileVerb}" na posição do verbo não nomeia uma funcionalidade — provavelmente é ${b.what}. Encaminhamento: ${b.where}.`,
      );
    } else if (!verbs.has(fileVerb)) {
      if (looksInfinitive(fileVerb)) {
        warnings.push(
          `[FD-1] Verbo "${fileVerb}" não consta do vocabulário canônico (engine/DEFINICAO-FUNCIONALIDADE.md). Se é mesmo uma ação de negócio, adicione-o à tabela de verbos do engine (vale para todas as instâncias) ou à seção "## Verbos adicionais da instância" do global/VOCABULARY-OVERRIDES.md (vale só para esta).`,
        );
      } else {
        errors.push(
          `[FD-1] Primeiro segmento "${fileVerb}" não é um verbo no infinitivo — o nome da funcionalidade é \`f-[verbo]-[entidade]\` (ex.: f-cadastrar-cliente).`,
        );
      }
    }
    if (!entityTokens.length) {
      errors.push('[FD-1] Nome sem entidade após o verbo — a funcionalidade é um verbo + UMA entidade (`f-[verbo]-[entidade]`).');
    }
    // FD-3 — dois verbos canônicos no slug = duas ações num arquivo só.
    // Exceção: um par de alternância (ativar/desativar) é UM toggle, uma funcionalidade.
    const slugVerbSet = new Set(tokens.map(norm).filter((t) => verbs.has(t)));
    if (slugVerbSet.size > 1 && !isTogglePair(slugVerbSet, vocab.togglePairs)) {
      errors.push(
        `[FD-3] Nome encadeia mais de uma ação (${[...slugVerbSet].join(', ')}) — cada verbo é uma funcionalidade própria (um N3 por ação).`,
      );
    }
  }

  // --- FD-2/FD-3/FD-4 — título ------------------------------------------------
  const title = titleOf(lines);
  if (!title) {
    errors.push('[FD-2] Sem título "# …" para verificar a ação.');
  } else {
    const words = titleWords(title);
    const first = words[0] || '';
    if (blocked.has(first)) {
      const b = blocked.get(first);
      errors.push(
        `[FD-4] Título "${trunc(title)}" começa com "${first}" — provavelmente é ${b.what}, não uma funcionalidade. Encaminhamento: ${b.where}.`,
      );
    } else if (fileVerb && first && first !== fileVerb) {
      errors.push(
        `[FD-2] Verbo do título ("${first}") difere do verbo do arquivo ("${fileVerb}") — título e arquivo contam a mesma ação.`,
      );
    } else if (first && !verbs.has(first) && !looksInfinitive(first)) {
      errors.push(
        `[FD-2] Título "${trunc(title)}" não começa com verbo no infinitivo — o nome de uma funcionalidade é "[Verbo] [entidade]" (ex.: "Cadastrar cliente").`,
      );
    }
    const titleVerbSet = new Set(words.filter((w) => verbs.has(w)));
    if (titleVerbSet.size > 1 && !isTogglePair(titleVerbSet, vocab.togglePairs)) {
      errors.push(
        `[FD-3] Título encadeia mais de uma ação (${[...titleVerbSet].join(', ')}) — se cada parte entrega valor sozinha, são funcionalidades separadas.`,
      );
    }
    // FD-6 (coerência, aviso) — a entidade do arquivo aparece no título/descrição?
    if (entityTokens.length) {
      const ent = norm(entityTokens[0]);
      const desc = sectionSlice(lines, 'Descrição') || [];
      const hay = norm([title, ...desc].join(' '));
      const stems = [ent, ent.replace(/s$/, ''), ent.length > 5 ? ent.slice(0, ent.length - 2) : ent];
      if (!stems.some((s) => s && hay.includes(s))) {
        warnings.push(
          `[FD-6] Entidade do arquivo ("${entityTokens.join(' ')}") não aparece no título nem na Descrição — confirme se o nome do arquivo e o conteúdo falam da mesma coisa.`,
        );
      }
    }
  }

  // --- FD-6 — resultado observável (Cenários com Então/Then) ------------------
  const cen = sectionSlice(lines, 'Cenários');
  const scenarios = gherkinScenarios(cen);
  if (!cen || scenarios === null) {
    errors.push('[FD-6] Sem bloco ```gherkin``` em "## Cenários" — sem cenário não há resultado observável (e sem resultado observável não há funcionalidade).');
  } else if (!scenarios.length) {
    errors.push('[FD-6] Bloco gherkin sem nenhum "Scenario:" — descreva ao menos o caminho feliz com resultado observável.');
  } else {
    for (const sc of scenarios.filter((s) => !s.hasThen)) {
      errors.push(`[FD-6] Cenário sem "Então/Then" (resultado observável): "${trunc(sc.name)}".`);
    }
  }

  // --- FD-7 — regras são invariantes (sem cauda de reação, sem tela) ----------
  const rules = sectionSlice(lines, 'Regras de negócio') || [];
  for (const line of rules) {
    if (REACTION_PATTERNS.some((re) => re.test(line))) {
      errors.push(
        `[FD-7] Regra carrega REAÇÃO do sistema ("${trunc(line)}") — regra é invariante ("o quê"); a reação (mensagem/bloqueio) vira cenário em "## Cenários".`,
      );
      continue;
    }
    // Só itens de regra (não blockquotes/notas); ignora código inline (`…`), onde
    // "telas", "rota" etc. podem ser variáveis de fórmula ou identificadores.
    if (line.trim().startsWith('>')) continue;
    const bare = line.replace(/`[^`]*`/g, '');
    if (UI_SURFACE_PATTERNS.some((re) => re.test(bare))) {
      warnings.push(
        `[FD-7] Regra parece descrever COMPORTAMENTO/ESTRUTURA DE TELA ("${trunc(line)}") — se for apresentação, mova para "## Comportamento de tela" (ou "## Campos", se filtro); regra de negócio é invariante independente de interface.`,
      );
    }
  }

  // --- FD-8 — Descrição declara a entrega --------------------------------------
  // (seção ausente é reprovada pelo validate-doc; aqui validamos o CONTEÚDO)
  const desc = descriptionText(lines);
  if (desc !== null) {
    const dNorm = norm(desc);
    const dLen = dNorm.replace(/[^a-z0-9 ]/g, '').trim().length;
    if (/\[[^\]]{3,}\]/.test(desc)) {
      errors.push('[FD-8] Descrição ainda com placeholder de template — escreva o contrato de entrega em 1–2 frases de negócio.');
    } else if (dLen < 30) {
      errors.push('[FD-8] Descrição vazia ou curta demais para declarar uma entrega — diga o que a funcionalidade entrega quando concluída (fórmula: "Permite que [ator] [ação] [entidade], [resultado observável]").');
    } else {
      for (const [term, meta] of descBlocked) {
        const re = new RegExp(`\\b${term.replace(/[.*+?^$()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (re.test(dNorm)) {
          errors.push(`[FD-8] Descrição usa termo ${meta.tipo} "${term}" — ${meta.hint}.`);
        }
      }
      if (dNorm.length > 350) {
        warnings.push('[FD-8] Descrição longa (mais que ~2 frases) — sinal de escopo demais ou de mistura com regras/cenários; a entrega cabe em 1–2 frases.');
      }
      if (![...verbs].some((v) => dNorm.includes(stemOf(v)))) {
        warnings.push('[FD-8] Descrição não menciona nenhuma ação do vocabulário canônico — confirme que ela declara o que a funcionalidade ENTREGA (não uma intenção).');
      }
      // Entrega ÚNICA: descrição idêntica à de outro N3 reprova; quase idêntica avisa.
      // Fica aqui dentro de propósito: comparar placeholders acusaria todos de idênticos.
      const mine = contentWords(desc);
      const flat = dNorm.replace(/\s+/g, ' ').trim();
      for (const other of siblingN3s(file)) {
        let otherDesc;
        try { otherDesc = descriptionText(stripHtmlComments(readFileSync(other, 'utf8')).split(/\r?\n/)); } catch { continue; }
        if (!otherDesc) continue;
        const rel = other.replace(/\\/g, '/').split('/modules/').pop();
        if (norm(otherDesc).replace(/\s+/g, ' ').trim() === flat) {
          errors.push(`[FD-8] Descrição IDÊNTICA à de modules/${rel} — a entrega de cada funcionalidade é única; ou é duplicata, ou a descrição é genérica demais.`);
        } else if (jaccard(mine, contentWords(otherDesc)) >= 0.8) {
          warnings.push(`[FD-8] Descrição quase idêntica à de modules/${rel} — confirme que as duas funcionalidades entregam coisas diferentes (e que a descrição diz qual é a diferença).`);
        }
      }
    }
  }

  // FD-10, FD-11 e FD-12 dizem se o N3 sustenta a contagem, não se a Descrição está
  // boa: rodam mesmo quando o FD-8 reprova. Dentro do `else` do FD-8, uma funcionalidade com
  // Descrição curta ou placeholder saía sem nenhum aviso de proveniência ou de memória.

  // ── Proveniência dos campos (coluna "Entidade" de ## Campos) ───────────────
  // É de onde a contagem lê o ALR: as entidades distintas da coluna são os arquivos
  // lógicos que a transação referencia. Sem a coluna, uma combo que lê uma entidade e
  // uma combo de valores fixos ficam idênticas na tabela, e o ALR vira leitura de prosa.
  // AVISO, não erro: a migração dos N3 existentes é por Agrupamento Funcional, na contagem.
  {
    const cab = (function () {
      const s = sectionSlice(lines, 'Campos');
      if (!s) return null;
      const l = s.map((x) => x.trim()).find((x) => x.startsWith('|'));
      return l ? l.replace(/^\||\|$/g, '').split('|').map((c) => c.trim()) : null;
    })();
    if (cab) {
      const iEnt = cab.findIndex((c) => /^entidade$/i.test(c));
      const iTipo = cab.findIndex((c) => /^tipo$/i.test(c));
      const iLabel = cab.findIndex((c) => /label po/i.test(c));
      if (iEnt < 0) {
        warnings.push('[FD-10] Tabela "## Campos" sem a coluna "Entidade" — é dela que sai o ALR da contagem (as entidades distintas = arquivos lógicos referenciados). Sem ela, combo que lê entidade e combo de valores fixos ficam iguais.');
      } else {
        const linhas = (tableFirstCells(lines, 'Campos') || []);
        const semFonte = [];
        const divergentes = [];
        for (const cs of linhas) {
          const ent = (cs[iEnt] || '').trim();
          const tipo = iTipo >= 0 ? (cs[iTipo] || '').trim() : '';
          const label = iLabel >= 0 ? (cs[iLabel] || '').trim() : '?';
          if (!label || label.startsWith('[')) continue;
          // Três grafias de lista em uso: `lista de opções` (template), `lista (A, B)`
          // (PROMPT_3A e engenharia reversa) e `lista de opções (A, B)`; mais a seleção
          // de outra entidade. "lista de itens" (grupo repetido) não é lista de opções.
          const ehLista = /\blista\s*(?:de\s+op|\(|→)|sele[çc][aã]o/i.test(tipo);
          // Placeholder não vale como resposta: `⚠️ a definir` (ou vazio) é gap aberto,
          // e uma checagem que um placeholder cala não é checagem.
          const semEnt = !ent || ent === '—' || ent === '-' || /^⚠️|a definir/i.test(ent);
          if (ehLista && semEnt) semFonte.push(label);
          // Divergência só entre duas respostas: contra um placeholder, o gap já saiu
          // acima como "sem entidade de origem" — repeti-lo aqui é o mesmo aviso duas vezes.
          const m = tipo.match(SELECAO_RE);
          if (m && !semEnt && norm(nomeEntidade(m[1])) !== norm(nomeEntidade(ent))) {
            divergentes.push(`${label} (Tipo diz "${m[1].trim()}", Entidade diz "${ent}")`);
          }
        }
        if (semFonte.length) {
          warnings.push(`[FD-10] Campo(s) de lista sem entidade de origem declarada: ${semFonte.slice(0, 6).join(', ')}${semFonte.length > 6 ? '…' : ''}. Diga de qual entidade a lista é populada — ou "dado de código" se for de valores fixos (CPM 5.4.2d: não entra no ALR).`);
        }
        if (divergentes.length) {
          warnings.push(`[FD-10] Tipo "seleção → X" e coluna Entidade discordam em: ${divergentes.slice(0, 4).join(' · ')}. As duas nomeiam a mesma entidade origem.`);
        }
      }
    }
  }

  // ── Memória de cálculo da contagem (## Métricas de tamanho) ───────────────
  // Número sem memória não é auditável nem comparável entre recontagens: não dá para
  // dizer se o ALR esqueceu um arquivo lógico ou se o DER contou o mesmo campo duas
  // vezes. Só cobra de linha JÁ CONTADA — linha com `—` ainda não foi medida.
  {
    const met = sectionSlice(lines, 'Métricas de tamanho');
    if (met) {
      const corpo = met.join('\n');
      // Colunas pelo CABEÇALHO, nunca por posição: a coluna Papel entrou depois da
      // primeira, e ler Tipo/ALR/DER por posição passaria a olhar a coluna errada.
      const tab = met.map((l) => l.trim()).filter((l) => l.startsWith('|') && !/^\|[\s:|-]+\|$/.test(l))
        .map((l) => l.replace(/^\||\|$/g, '').split('|').map((c) => c.trim()));
      const cab = tab[0] || [];
      const iT = cab.findIndex((c) => /^Tipo$/i.test(c));
      const iA = cab.findIndex((c) => /^ALR$/i.test(c));
      const iD = cab.findIndex((c) => /^DER$/i.test(c));
      const contadas = iT < 0 || iA < 0 || iD < 0 ? [] : tab.slice(1)
        .filter((cs) => /^(EE|SE|CE)$/i.test(cs[iT] || '') && /\d/.test(cs[iA] || '') && /\d/.test(cs[iD] || ''));
      if (contadas.length && !/###\s*Mem[óo]ria de c[áa]lculo/i.test(corpo)) {
        warnings.push(`[FD-11] ${contadas.length} linha(s) contada(s) em "## Métricas de tamanho" sem "### Memória de cálculo" — registre a quantidade e a descrição dos ALR e DER (cada arquivo lógico nomeado com o motivo, cada campo nomeado e agrupado). Número sem memória não é auditável nem comparável entre recontagens.`);
      }
    }
  }

  // ── Entidade tocada e não declarada (## Dados lidos e gravados) ───────────
  // As fontes de ALR ancoradas em campo descrevem A TELA; o ALR descreve A TRANSAÇÃO.
  // Entidade que a funcionalidade lê ou grava sem exibir campo algum (o registro de execução
  // que recebe o status, o cronograma que define a janela) só aparece nas regras — e sai
  // de fora da conta. Heurística por nome: pega o que está escrito por extenso, não
  // garante ausência. É rede de segurança da varredura que o agente de contagem faz.
  {
    const conhecidas = loadEntidades(file);
    // Sem a coluna `Entidade` preenchida, TODA entidade citada nas regras apareceria aqui
    // — o que o FD-10 já diz, melhor. FD-12 só fala onde a proveniência dos campos já foi
    // migrada: aí um nome que sobra nas regras é leitura de verdade, não coluna vazia.
    const temColunaEnt = (function () {
      const s = sectionSlice(lines, 'Campos');
      if (!s) return false;
      const l = s.map((x) => x.trim()).find((x) => x.startsWith('|'));
      if (!l) return false;
      const cab = l.replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
      const i = cab.findIndex((c) => /^entidade$/i.test(c));
      if (i < 0) return false;
      return (tableFirstCells(lines, 'Campos') || []).some((cs) => {
        const v = (cs[i] || '').trim();
        return v && v !== '—' && v !== '-' && !/^⚠️|a definir/i.test(v) && !v.startsWith('[');
      });
    })();
    if (conhecidas.length && temColunaEnt) {
      const declarado = new Set();
      const add = (v) => { const k = entKey(v); if (k) declarado.add(k); };
      const cabC = (function () {
        const s = sectionSlice(lines, 'Campos');
        if (!s) return null;
        const l = s.map((x) => x.trim()).find((x) => x.startsWith('|'));
        return l ? l.replace(/^\||\|$/g, '').split('|').map((c) => c.trim()) : null;
      })();
      const iEntCampos = cabC ? cabC.findIndex((c) => /^entidade$/i.test(c)) : -1;
      const iTipoCampos = cabC ? cabC.findIndex((c) => /^tipo$/i.test(c)) : -1;
      for (const cs of tableFirstCells(lines, 'Campos') || []) {
        if (iEntCampos >= 0) add(cs[iEntCampos] || '');
        // `seleção → X` também declara X — é a entidade de onde a lista é lida, mesmo
        // com a coluna Entidade ainda em aberto (esse gap o FD-10 já cobra).
        const sel = iTipoCampos >= 0 ? (cs[iTipoCampos] || '').match(SELECAO_RE) : null;
        if (sel) add(nomeEntidade(sel[1]));
      }
      // `Campos-fonte (Entidade)` no formato do template — `Campo A (Entidade X), Campo B
      // (Entidade Y)`: a entidade é o que está entre parênteses. Lida inteira, a célula
      // virava um nome só, que não casava com entidade nenhuma, e a entidade declarada
      // só ali voltava como "não declarada". Célula sem parênteses é lista de entidades.
      const cabD = headerCells(lines, 'Derivações');
      const iFonte = cabD ? cabD.findIndex((c) => /fonte/i.test(c)) : -1;
      for (const cs of tableFirstCells(lines, 'Derivações') || []) {
        const cel = cs[iFonte >= 0 ? iFonte : 2] || '';
        const grupos = [...cel.matchAll(/\(([^()]+)\)/g)].map((m) => m[1]);
        for (const e of (grupos.length ? grupos : [cel]).flatMap((g) => g.split(/[,;]/))) add(e);
      }
      for (const cs of tableFirstCells(lines, 'Dados lidos e gravados') || []) add(cs[0] || '');
      // A referência `→ ver <artefato>: <seção>` cita um documento, não lê entidade: "→ ver
      // N1 Contratos e Fábricas" não é leitura de Contrato. Sai antes da varredura.
      const varrido = [
        ...(sectionSlice(lines, 'Regras de negócio') || []),
        ...(sectionSlice(lines, 'Campos automáticos') || []),
      ].map((l) => l.replace(/→\s*ver\b.*$/, '')).join(' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      // O rótulo agrupado ("Parâmetros Gerais · Indisponibilizar sistema") vale por parte.
      const rotulos = (tableFirstCells(lines, 'Campos') || []).flatMap((cs) => (cs[0] || '').replace(/[`*]/g, '').split(/\s*·\s*/))
        .map((r) => r.trim()).filter((r) => r.length > 3).map((r) => r.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
        .sort((a, b) => b.length - a.length);
      const esc = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const semRotulos = rotulos.reduce((t, r) => t.replace(new RegExp(`\\b${esc(r)}\\b`, 'gi'), ' '), varrido);
      const faltando = [];
      for (const ent of conhecidas) {
        if (declarado.has(entKey(ent))) continue;
        const re = entRegex(ent);
        if (!re) continue;
        // Conta só a menção que nomeia a entidade. Não nomeiam, achadas nas instâncias
        // (simpf-doc, 2026-10-04): a que está dentro de um rótulo de campo da própria funcionalidade
        // — "Mensagem de sistema indisponível", "Tipo de Contrato" são Label PO de ## Campos,
        // e a entidade desses campos já está na coluna Entidade — e a precedida de "Tipo de",
        // que é a classificação (lista de domínio fechado), não a entidade.
        const vale = [...semRotulos.matchAll(new RegExp(re.source, 'gi'))].some((m) =>
          !/\btipos?\s+d[aeo]s?\s*$/i.test(semRotulos.slice(0, m.index)));
        if (vale) faltando.push(ent);
      }
      if (faltando.length) {
        warnings.push(`[FD-12] Entidade(s) citada(s) nas regras/campos automáticos e não declarada(s) em lugar nenhum que a contagem leia: ${faltando.slice(0, 6).join(', ')}${faltando.length > 6 ? '…' : ''}. Se a funcionalidade a lê ou grava, declare em "## Dados lidos e gravados" (é ALR); se a menção é só de contexto, ignore este aviso.`);
      }
    }
  }

  // --- FD-9 — quantificador vago (menciona "N itens" sem nomeá-los) -----------
  // Sintoma real capturado em produção: "exibe as cinco configurações" sem que
  // as 5 configurações apareçam em nenhuma tabela/lista/enumeração do arquivo —
  // o leitor não descobre quais são sem abrir outro N3. Regra: toda vez que o
  // texto quantifica um substantivo especificável ("as/os N campos/grupos/...")
  // os N itens têm de estar nomeados — na própria frase (":  a, b e c") ou em
  // tabela/lista da mesma seção "## ".
  {
    const QUANT = {
      dois: 2, duas: 2, tres: 3, quatro: 4, cinco: 5, seis: 6, sete: 7, oito: 8, nove: 9, dez: 10,
    };
    // A contração também quantifica: "um dos dois motivos", "nas três abas", "pelas cinco regras".
    const QUANT_RE = /\b((?:d|n|a|pel)?(?:as|os))\s+(duas|dois|tr[êe]s|quatro|cinco|seis|sete|oito|nove|dez)\s+([a-zà-úA-ZÀ-Ú]+)/g;
    const COUNTABLE_NOUN_RE = /^(configuraco|campo|opco|grupo|aba|parametro|coluna|item|regra|cenario|tela|estado|situaco|perfil|funcionalidade|motivo)/;

    const sectionOfLine = [];
    let curSec = '';
    for (const l of lines) {
      const m = l.match(/^##\s+(.+)$/);
      if (m) curSec = m[1].trim();
      sectionOfLine.push(curSec);
    }
    const inCode = [];
    let open = false;
    for (const l of lines) {
      if (/^```/.test(l.trim())) { inCode.push(open); open = !open; continue; }
      inCode.push(open);
    }

    // Bloco de cada linha: tabela (linhas `|` seguidas) ou lista (itens e suas continuações,
    // atravessando linha em branco quando a lista segue). Os itens irmãos da lista em que a
    // frase está não nomeiam o conjunto que ela quantifica: "3. … os dois motivos aceitos"
    // numa seção de três regras não diz quais são os motivos. A tabela não entra nessa
    // exclusão: numa tabela de colunas ou de campos, as linhas irmãs costumam ser os itens
    // citados ("ordena pelas duas colunas de data", com as duas colunas na tabela).
    const LIST_ITEM_RE = /^\s*(?:[-*]|\d+\.)\s+\S/;
    const indentOf = (l) => l.match(/^\s*/)[0].length;
    const blockOf = [];
    let blockId = 0;
    for (let j = 0; j < lines.length; j++) {
      const t = lines[j].trim();
      const prev = j > 0 ? blockOf[j - 1] : null;
      if (/^\|.*\|$/.test(t)) {
        blockOf.push(prev && prev.kind === 'table' ? prev : { kind: 'table', id: ++blockId });
      } else if (LIST_ITEM_RE.test(lines[j]) || (prev && prev.kind === 'list' && t && indentOf(lines[j]) > 0)) {
        let lastList = null;
        for (let k = j - 1; k >= 0 && !lastList; k--) {
          if (blockOf[k] && blockOf[k].kind === 'list') lastList = blockOf[k];
          else if (lines[k].trim()) break;
        }
        blockOf.push(lastList || { kind: 'list', id: ++blockId });
      } else {
        blockOf.push(null);
      }
    }
    // Subitens logo abaixo do item da frase ("…os dois motivos:" seguido de "   - A" / "   - B").
    const childItems = (i) => {
      let count = 0;
      for (let j = i + 1; j < lines.length; j++) {
        if (!lines[j].trim()) continue;
        if (indentOf(lines[j]) <= indentOf(lines[i])) break;
        if (LIST_ITEM_RE.test(lines[j])) count++;
      }
      return count;
    };

    for (let i = 0; i < lines.length; i++) {
      if (inCode[i]) continue;
      const rawLine = lines[i];
      const line = rawLine.replace(/`[^`]*`/g, ''); // ignora código inline
      QUANT_RE.lastIndex = 0;
      let m;
      while ((m = QUANT_RE.exec(line))) {
        const n = QUANT[norm(m[2])];
        const noun = m[3];
        if (!COUNTABLE_NOUN_RE.test(norm(noun))) continue;

        // Satisfeito inline: a frase traz ":" ou "(...)" com lista de >= n itens
        // logo após o quantificador (ex.: "os dois campos (Tipo A e Tipo B)").
        let satisfied = false;
        const tail = line.slice(m.index + m[0].length, m.index + m[0].length + 160);
        const afterColon = tail.startsWith(':') ? tail.slice(1) : (line.split(':')[1] || '');
        const parenMatch = tail.match(/^[^(]{0,40}\(([^)]+)\)/);
        for (const candidate of [afterColon, parenMatch && parenMatch[1]]) {
          if (!candidate) continue;
          const items = candidate.split(/,|\se\s(?=[A-ZÀ-Ú])/).map((s) => s.trim()).filter(Boolean);
          if (items.length >= n) { satisfied = true; break; }
        }

        // Satisfeito por tabela/lista na mesma seção "## " — menos a lista ou tabela em
        // que a própria frase está, cujos itens irmãos são outra coisa; ou pelos
        // subitens logo abaixo dela. Quando o substantivo é de campo/configuração/
        // parâmetro, vale também a seção "## Campos" em qualquer parte do documento (é lá
        // que a tabela de campos mora; outras seções podem se referir a ela só pela contagem).
        const ownBlock = blockOf[i] && blockOf[i].kind === 'list' ? blockOf[i] : null;
        const countInSection = (secName) => {
          let tableDataRows = 0;
          let listItems = 0;
          for (let j = 0; j < lines.length; j++) {
            if (sectionOfLine[j] !== secName) continue;
            if (ownBlock && blockOf[j] === ownBlock) continue;
            const t = lines[j].trim();
            const isSep = /^\|[\s:|-]+\|$/.test(t);
            const isPipeRow = /^\|.*\|$/.test(t);
            if (isSep) continue;
            if (isPipeRow) {
              const nextIsSep = j + 1 < lines.length && /^\|[\s:|-]+\|$/.test(lines[j + 1].trim());
              if (!nextIsSep) tableDataRows++; // header é sempre seguido de separador — não conta
              continue;
            }
            if (/^[-*]\s+\S/.test(t) || /^\d+\.\s+\S/.test(t)) listItems++;
          }
          return tableDataRows + listItems;
        };
        if (!satisfied && ownBlock && childItems(i) >= n) satisfied = true;
        if (!satisfied && countInSection(sectionOfLine[i]) >= n) satisfied = true;
        if (!satisfied && /^(campo|configuraco|parametro)/.test(norm(noun)) && countInSection('Campos') >= n) {
          satisfied = true;
        }

        if (!satisfied) {
          errors.push(
            `[FD-9] Menciona "${m[1]} ${m[2]} ${noun}" sem nomear os ${n} itens — enumere-os na mesma frase ("… : a, b e c") ou numa tabela/lista da seção "## ${sectionOfLine[i] || '(sem seção)'}" (quem lê só este arquivo precisa saber quais são).`,
          );
        }
      }
    }
  }

  // --- MSG — mensagens de UI fora do MESSAGE-DICTIONARY (aviso) ---------------
  // Sintoma real capturado em produção (SIMPF): mensagens escritas literalmente no
  // Gherkin, sem entrada no catálogo — o mesmo texto reescrito em vários N3 sem
  // fonte única. A regra já existia (SYSTEM_PROMPT + instrução do próprio
  // MESSAGE-DICTIONARY); faltava o gate. AVISO, não erro: o legado tem dezenas de
  // ocorrências em N3 já aprovados — o aviso corrige o comportamento na geração,
  // que é onde o problema nasce, sem reprovar artefatos publicados.
  {
    const catalog = loadMsgCatalog(file);
    if (catalog) {
      const dom = (raw.match(/^dominio:\s*(\S+)/m) || [])[1] || '<DOMINIO>';
      const inCatalog = (t) => catalog.exact.has(t) || catalog.patterns.some((re) => re.test(t));
      const seen = new Set();
      const badKeys = new Set();
      let inGherkin = false;
      // Marcador com CHAVE específica é CONFERIDO: a chave precisa existir no
      // MESSAGE-DICTIONARY e o texto do cenário precisa ser o texto dela — pega
      // typo, chave inexistente e marcador copiado com o cenário errado. BASELINE
      // é confiado POR DESENHO: cobre legitimamente vários textos distintos
      // (REQUIRED, SAVE_SUCCESS, EMPTY…) e conferi-lo quebraria o uso mais comum.
      let pendingKeys = [];
      let pendingBaseline = false;
      let curKeys = [];
      let curBaseline = false;
      for (const line of lines) {
        const t = line.trim();
        if (/^```/.test(t)) {
          inGherkin = !inGherkin && /^```\s*gherkin/i.test(t);
          pendingKeys = []; pendingBaseline = false;
          curKeys = []; curBaseline = false;
          continue;
        }
        if (!inGherkin) continue;
        if (/^#/.test(t)) {
          const mk = t.match(/MESSAGE-DICTIONARY\s*:\s*([A-Z0-9_]+)/);
          if (mk) {
            const key = mk[1];
            if (key === 'BASELINE') { pendingBaseline = true; curBaseline = true; }
            else if (catalog.byKey.has(key)) { pendingKeys.push(key); curKeys.push(key); }
            else if (!badKeys.has(key)) {
              badKeys.add(key);
              warnings.push(
                `[MSG] Marcador aponta para chave inexistente no MESSAGE-DICTIONARY ("${key}") — corrija a chave ou acrescente a entrada ao catálogo.`,
              );
            }
          }
          continue;
        }
        if (/^Scenario\b|^Cen[áa]rio\b/i.test(t)) {
          curKeys = pendingKeys; curBaseline = pendingBaseline;
          pendingKeys = []; pendingBaseline = false;
          continue;
        }
        if (curBaseline || !/\bexibe\b/i.test(t)) continue;
        for (const m of t.matchAll(/"([^"]+)"/g)) {
          const text = m[1].trim();
          // Só mensagem que a pessoa usuária lê: inicia em maiúscula, termina em .?!
          if (!/^[A-ZÀ-Ú]/.test(text) || !/[.?!]$/.test(text)) continue;
          if (seen.has(text)) continue;
          if (curKeys.length) {
            if (curKeys.some((k) => catalog.byKey.get(k)(text))) continue;
            seen.add(text);
            warnings.push(
              `[MSG] Texto do cenário não corresponde à chave do marcador (${curKeys.join('/')}): "${trunc(text)}" — atualize o texto ou o marcador (o catálogo é a fonte única).`,
            );
            continue;
          }
          if (inCatalog(text)) continue;
          seen.add(text);
          warnings.push(
            `[MSG] Mensagem de UI fora do MESSAGE-DICTIONARY ("${trunc(text)}") — catalogue com chave ${dom}_<SITUACAO> e marcador "# ← MESSAGE-DICTIONARY: <CHAVE>" no cenário (mensagem genérica do baseline → BASELINE).`,
          );
        }
      }
    }
  }

  return { skip: false, errors, warnings };
}

// ------------------------------------------------------------------------ CLI
const files = process.argv.slice(2);
if (!files.length) {
  console.error('Uso: node scripts/valida-semantica-funcionalidade.mjs <f-….md> [outro.md …]');
  process.exit(2);
}

const vocab = loadVocabulary(files[0]);
if (vocab.error) {
  console.error(`✗ configuração: ${vocab.error}`);
  process.exit(2);
}

let failed = 0;
for (const f of files) {
  const path = resolve(f).replace(/\\/g, '/');
  if (/(^|\/)engine\//.test(path)) {
    console.log(`- [N3-sem] ${f}: engine/ (template) — isento.`);
    continue;
  }
  let res;
  try {
    res = validate(f, effectiveVocab(vocab, loadOverrides(f)));
  } catch (e) {
    console.error(`✗ ${f}: erro ao ler — ${e.message}`);
    failed++;
    continue;
  }
  if (res.skip) {
    console.log(`- [N3-sem] ${f}: não é N3 — fora do escopo deste gate.`);
    continue;
  }
  if (res.errors.length) {
    failed++;
    console.error(`✗ [N3-sem] ${f}`);
    for (const e of res.errors) console.error(`    - ${e}`);
  } else {
    console.log(`✓ [N3-sem] ${f}`);
  }
  for (const w of res.warnings) console.error(`    ! ${w}`);
}
process.exit(failed ? 1 : 0);
