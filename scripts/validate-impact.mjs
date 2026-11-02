#!/usr/bin/env node
// validate-impact.mjs — valida uma AIMM (Análise de Impacto) e suas invariantes.
//
// A AIMM é o artefato do ticket (decisão do PO, 2026-09-28): um arquivo por ticket em
// `analise-impacto/AIMM-<CHAVE>.md`, versionado à medida que o ticket avança — aberto pelo
// PROMPT_AIMM com o ticket, o que ele VAI alterar e o aval do PO; fechado depois da entrega
// pela skill analise-impacto com o que ele ALTEROU. A AIMM da sprint
// (`analise-impacto/AIMM-<sprint>.md`) consolida os tickets entregues na sprint. Este
// validador é o contrato determinístico das duas: estrutura + cobertura + reconciliação.
// Não julga o conteúdo.
//
// AIMM do ticket (`tipo: ticket`):
//   front-matter  `ticket` (a mesma chave do nome do arquivo) e `estado` da esteira:
//                 em-análise → escopo-aprovado → em-execução → concluído
//                 A AIMM do ticket nasce completa: `rascunho` reprova, com a instrução de
//                 preencher, e nenhuma seção de impacto guarda o exemplo do template.
//   seções        Descrição do ticket · Critérios de aceite · Funcionalidades · Artefatos
//                 impactados · Alterações em funcionalidades por Agrupamento Funcional · Reconciliação ·
//                 Changelog
//   sempre: a `## Funcionalidades` com ao menos uma funcionalidade, e o changeset sem
//                 linha de exemplo do template e com as invariantes de cobertura:
//     C1  ao menos uma linha N3 (a funcionalidade-âncora)
//     C2  linha `funcional`     → linha `QA`   (mudança funcional é testada)
//     C3  linha `não-funcional` → linha `NFR` E linha `QA` (NFR verificável)
//     AIMM aberta na entrega (`aberta-na-entrega: true`): C2 e C3 viram aviso — não houve
//     escopo prévio a cobrir. No perfil `requisitos`, a falta da linha QA (C2 e a metade
//     QA do C3) é aviso: a esteira dele não tem o checkpoint de testes.
//     Existência: `alterar` sobre arquivo que não existe é erro; `criar` sobre arquivo que
//     já existe é aviso só até `escopo-aprovado` — depois, a execução o criou.
//   escopo-aprovado|em-execução|concluído → `avalizado-por`
//   sempre (ticket e sprint): `estado-por` (quem levou a AIMM ao estado atual) e `estado-em`
//                 (`AAAA-MM-DD HH:MM ±HH:MM`). Sem os dois campos, a AIMM anterior à 9.1.0
//                 só recebe aviso; com eles, vazio ou fora do formato reprova.
//   Status dos artefatos (9.2.0): a coluna Status de `## Artefatos impactados` aceita
//                   Pendente, Especificado (o agente gravou; falta a revisão), Validado (a
//                   pessoa revisou e aprovou) e Não se aplica. Valor fora disso reprova; sem a
//                   coluna, a AIMM anterior à 9.2.0 só recebe aviso.
//   concluído     → todo artefato Validado ou Não se aplica — e só isso (decisão do PO,
//                   2026-11-01): sprint e Reconciliação deixam de ser exigidas aqui.
//   --entrega     → (o valida-entrega passa) cada funcionalidade da `## Funcionalidades` com N3
//                   no ESTADO FINAL da esteira da instância — `implementado` no perfil
//                   `completo`, `especificado` no `requisitos` — ou `deprecado`. A AIMM e
//                   o N3 têm máquinas de estado próprias (o ticket e a funcionalidade são N:N);
//                   é no portão da entrega que elas se encontram: o ticket não entra na main
//                   enquanto uma funcionalidade dele está em `revisao-necessaria`, em
//                   desenvolvimento ou por especificar.
//
// AIMM da sprint (`tipo: sprint`): `sprint` no front-matter; `## Tickets da sprint` e
// `## Alterações em funcionalidades por Agrupamento Funcional` com linhas; e conferida com as AIMMs dos tickets
// da pasta (em `concluído` reprova; em `rascunho`, avisa):
//     S1  os mesmos tickets — cada listado com a sua AIMM, de `sprint:` igual; e toda AIMM
//         com `sprint:` igual, listada — com a AIMM concluída;
//     S2  cada funcionalidade UMA vez; a coluna Ticket só com tickets listados;
//     S3  a visão final de cada ticket dentro da sprint, nos dois sentidos: a funcionalidade
//         que ele alterou está na linha que cita a chave dele, e a linha que cita a chave
//         está na visão final dele; natureza incluída se algum ticket a incluiu, alterada
//         se não.
// A AIMM não traz PF (8.0.0): a medição é do agente de contagem, fora do Docqui. Numa AIMM
// anterior, `## Funções de dados alteradas`, `## Apurável da sprint` e as colunas PFB/PFL
// ficam sem conferência — não reprovam nem avisam.
//
// Formato anterior à AIMM única — registro `demandas/<chave>.md`, `impactos/AIMM-AAAA-NNN.md`
// do PROMPT_IMPACTO, relatório `ANALISE_IMPACTO_*.md` — reprova, com a instrução de migrar.
//
// Reconciliação (opcional):
//   --touched "a,b,c"    compara os artefatos declarados (caminhos) com esta lista
//   --git-base <ref>     usa `git -C <root> diff --name-only <ref>...HEAD`
//   → declarado e não tocado = escopo não cumprido; tocado e não declarado = desvio.
//     Artefato com Status Não se aplica não conta como declarado.
//
// Uso:
//   node scripts/validate-impact.mjs <analise-impacto/AIMM-….md> [--root <inst>] [--touched …|--git-base …] [--entrega]

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { execFileSync } from 'node:child_process';
import { scanInstance, featureById } from './lib/trace-index.mjs';
import { ehSecao, secaoAtual } from './lib/niveis.mjs';
import { perfilDa, ESTADO_FINAL } from './lib/instancia.mjs';
import { impactFiles, impactKey, resolveImpactFile } from './lib/impact-files.mjs';

const args = process.argv.slice(2);
const opt = (n, d = null) => { const i = args.indexOf(n); return i !== -1 && args[i + 1] ? args[i + 1] : d; };
const requested = args.find((a, k) => !a.startsWith('--') && a.endsWith('.md') && !['--root', '--touched', '--git-base'].includes(args[k - 1]));
const FILE = requested && resolveImpactFile(requested);
if (!FILE || !existsSync(FILE)) {
  console.error('Uso: node scripts/validate-impact.mjs <analise-impacto/AIMM-….md> [--root <inst>] [--touched …|--git-base …]');
  process.exit(2);
}
const ROOT = opt('--root', dirname(dirname(FILE)) || '.');
const raw = readFileSync(FILE, 'utf8');
const lines = raw.split(/\r?\n/);
const errors = [];
const warns = [];
const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

const sai = () => {
  console.log(`validate-impact — ${FILE}`);
  for (const w of warns) console.log(`  ⚠️  ${w}`);
  if (errors.length) {
    for (const e of errors) console.log(`  ✗ ${e}`);
    console.log(`\n${errors.length} erro(s), ${warns.length} aviso(s).`);
    process.exit(1);
  }
};

/* ------------------------- front-matter ------------------------- */
// Carimbo e linhas em branco antes do `---`, como o leitor único (lib/front-matter.mjs);
// o comentário de fim de linha (`campo: valor  # …`) não faz parte do valor.
function frontMatter(ls) {
  const out = {};
  let i = 0;
  while (i < ls.length && (!ls[i].trim() || /^\s*<!--.*-->\s*$/.test(ls[i]))) i++;
  if (ls[i] && ls[i].trim() === '---') {
    for (i++; i < ls.length && ls[i].trim() !== '---'; i++) {
      const m = ls[i].match(/^([a-z][\w-]*):\s*(.*)$/i);
      if (m) out[m[1].toLowerCase()] = m[2].replace(/\s+#.*$/, '').trim().replace(/^(["'])(.*)\1$/, '$2');
    }
  }
  return out;
}
const fm = frontMatter(lines);

/* --------------------- formato anterior --------------------- */
const MIGRE = 'o ticket agora tem uma AIMM só, em `analise-impacto/AIMM-<CHAVE>.md` — migre (CHANGELOG → 3.0.0, "AIMM única")';
if (basename(FILE).startsWith('ANALISE_IMPACTO_')) {
  errors.push(`relatório pós-entrega no formato anterior (\`ANALISE_IMPACTO_*\`): ${MIGRE}.`);
  sai();
}
if (/(^|[\\/])demandas[\\/]/.test(FILE)) {
  errors.push(`registro do ticket no formato anterior (\`demandas/\`): ${MIGRE}.`);
  sai();
}
if (!fm.tipo && (fm['feature-ancora'] || fm['feature-âncora'] || fm.origem)) {
  errors.push(`AIMM no formato anterior (PROMPT_IMPACTO, \`feature-ancora\`/\`origem\`, sem \`tipo\`): ${MIGRE}.`);
  sai();
}

const tipo = norm(fm.tipo);
if (!['ticket', 'sprint'].includes(tipo)) {
  errors.push('front-matter sem `tipo: ticket` ou `tipo: sprint`.');
  sai();
}

/* ----------------------------- apoio ----------------------------- */
const ID_RE = /\b[A-Z]{3}-[A-Z]{3}-\d{2}\b/;
const splitRow = (r) => r.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
// Os nomes anteriores das seções valem como os atuais (lib/niveis.mjs); os da AIMM pedem o migra-aimm-ticket-layout.
const temSecao = (s) => lines.some((l) => ehSecao(l, s));
const corpoDe = (s, ls = lines) => {
  const i = ls.findIndex((l) => ehSecao(l, s));
  if (i < 0) return [];
  const out = [];
  for (let k = i + 1; k < ls.length && !/^##\s/.test(ls[k].trim()); k++) out.push(ls[k]);
  return out;
};
// Tabelas de uma seção: [{ cab: [...], linhas: [[...]] }] — sem o separador.
const tabelasDe = (s, ls = lines) => {
  const out = [];
  let atual = null;
  for (const l of corpoDe(s, ls).map((x) => x.trim())) {
    if (!l.startsWith('|')) { atual = null; continue; }
    if (/^\|[\s:|-]+\|?$/.test(l)) continue;
    if (!atual) { atual = { cab: splitRow(l).map(norm), linhas: [] }; out.push(atual); continue; }
    atual.linhas.push(splitRow(l));
  }
  return out;
};
const ANTERIORES_AIMM = ['Alterações na spec, por Feature Set', 'Alterações na spec, por Agrupamento Funcional', 'Decisões de produto pendentes'];
for (const l of lines.filter((x) => /^## /.test(x) && ANTERIORES_AIMM.includes(x.trim().slice(3))))
  warns.push(`\`${l.trim()}\` é o nome anterior de \`## ${secaoAtual(l.trim().slice(3))}\` — rode \`node scripts/migra-aimm-ticket-layout.mjs\`.`);
const EXEMPLO = /\[[^\]]*\]|<(?:dom|fs|slug|CHAVE)>|SIGLA-S(?:AF|FS)-NN/i; // placeholder do template
const conteudoForaDaCitacao = (s) => corpoDe(s).join('\n').replace(/<!--[\s\S]*?-->/g, '').split('\n')
  .filter((l) => l.trim() && !/^\s*>/.test(l));

/* -------------------- quem e quando do estado -------------------- */
const ESTADO_EM = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2} [+-]\d{2}:\d{2}$/;
if (!('estado-por' in fm) && !('estado-em' in fm)) {
  warns.push('front-matter sem `estado-por`/`estado-em` (quem levou a AIMM ao estado atual, e quando) — rode `node scripts/migra-aimm-estado.mjs`.');
} else {
  if (!fm['estado-por'] || EXEMPLO.test(fm['estado-por']))
    errors.push('front-matter `estado-por` vazio — o nome de quem levou a AIMM ao estado atual.');
  if (!ESTADO_EM.test(fm['estado-em'] || ''))
    errors.push(`front-matter \`estado-em\` deve ser \`AAAA-MM-DD HH:MM ±HH:MM\` (data, hora e fuso)${fm['estado-em'] ? `, não \`${fm['estado-em']}\`` : ''}.`);
}

/* =========================== AIMM da sprint =========================== */
if (tipo === 'sprint') {
  if (!fm.sprint || EXEMPLO.test(fm.sprint)) errors.push('front-matter sem `sprint:` (o rótulo da sprint).');
  for (const s of ['Tickets da sprint', 'Alterações em funcionalidades por Agrupamento Funcional']) {
    if (!temSecao(s)) errors.push(`falta a seção \`## ${s}\`.`);
  }
  const tickets = tabelasDe('Tickets da sprint').flatMap((t) => t.linhas).filter((c) => !EXEMPLO.test(c[0] || ''));
  const feats = tabelasDe('Alterações em funcionalidades por Agrupamento Funcional').flatMap((t) => t.linhas)
    .filter((c) => ID_RE.test(c[0] || '') && !EXEMPLO.test(c.join(' ')));
  if (temSecao('Alterações em funcionalidades por Agrupamento Funcional') && !feats.length)
    errors.push('`## Alterações em funcionalidades por Agrupamento Funcional` sem linha de funcionalidade — a AIMM da sprint consolida as funcionalidades entregues.');
  const conferidas = confereSprint(tickets);
  sai();
  console.log(`  ✓ AIMM da sprint bem-formada — ${tickets.length} ticket(s), ${feats.length} funcionalidade(s), conferida com ${conferidas} AIMM(s) de ticket${warns.length ? `, ${warns.length} aviso(s)` : ''}.`);
  process.exit(0);
}

// A AIMM da sprint consolida as AIMMs dos tickets (decisão do PO, 2026-09-28): os mesmos
// tickets — os de `sprint:` igual, cada um com a sua AIMM —, cada funcionalidade UMA vez e a
// visão final de cada ticket concluído dentro dela. Na AIMM `concluído`, divergência reprova;
// em `rascunho`, a consolidação está em curso e ela é aviso. Devolve quantas AIMMs de ticket da
// sprint foram conferidas.
function confereSprint(tickets) {
  const fechada = norm(fm.estado) === 'concluido';
  const acusa = (msg) => (fechada ? errors : warns).push(msg);
  const rotulo = String(fm.sprint || '').trim();
  const natureza = (c) => { const v = norm(c).replace(/[`*]/g, '').trim(); return v === 'nova' ? 'incluida' : v; };
  const col = (t, re) => t.cab.findIndex((h) => re.test(h));
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const listados = [...new Set(tickets.map((c) => ((c[0] || '').match(/`([^`]+)`/) || [])[1])
    .filter(Boolean).map((k) => k.trim().toUpperCase()))];
  // A coluna Ticket: as chaves em crase (um ID de funcionalidade citado não é chave) e, sem
  // crase, as dos tickets listados — "⚠️ sem ticket" não traz nenhuma.
  const chavesDe = (cel) => {
    const s = String(cel || '');
    const out = (s.match(/`([^`]+)`/g) || []).map((x) => x.replace(/`/g, '').trim().toUpperCase())
      .filter((k) => k && !/^[A-Z]{3}-[A-Z]{3}-\d{2}$/.test(k));
    for (const k of listados)
      if (!out.includes(k) && new RegExp(`(?<![\\w-])${esc(k)}(?![\\w-])`, 'i').test(s)) out.push(k);
    return out;
  };
  const alteracoesDe = (ls) => tabelasDe('Alterações em funcionalidades por Agrupamento Funcional', ls).flatMap((t) => {
    const iF = Math.max(col(t, /^(?:funcionalidade|feature)$/), 0);
    const iT = col(t, /^(ticket|item do jira)$/);
    const iN = col(t, /^natureza$/);
    return t.linhas.map((c) => ({ c, m: (c[iF] || '').match(ID_RE) }))
      .filter(({ c, m }) => m && !EXEMPLO.test(c.join(' ')))
      .map(({ c, m }) => ({
        id: m[0], chaves: iT >= 0 ? chavesDe(c[iT]) : [], natureza: iN >= 0 ? natureza(c[iN]) : '',
      }));
  });

  // O que a sprint diz.
  const linhas = alteracoesDe(lines);
  const repetidos = (arr) => [...arr.reduce((m, x) => m.set(x, (m.get(x) || 0) + 1), new Map())].filter(([, n]) => n > 1);
  for (const [id, n] of repetidos(linhas.map((l) => l.id)))
    acusa(`\`${id}\` aparece ${n} vezes em \`## Alterações em funcionalidades por Agrupamento Funcional\` — na AIMM da sprint, cada funcionalidade entra uma vez (a coluna Ticket junta as chaves).`);
  for (const l of linhas) for (const k of l.chaves)
    if (!listados.includes(k)) acusa(`\`${l.id}\` cita o ticket \`${k}\`, que não está em \`## Tickets da sprint\`.`);

  // O que as AIMMs dos tickets dizem: os mesmos tickets, nos dois sentidos.
  const dir = dirname(FILE);
  const aims = impactFiles(dir).map((n) => {
    const ls = readFileSync(join(dir, n), 'utf8').split(/\r?\n/);
    const f = frontMatter(ls);
    return { n, ls, fm: f, k: String(f.ticket || '').trim().toUpperCase() };
  }).filter((a) => norm(a.fm.tipo) === 'ticket' && a.k);
  const daSprint = rotulo ? aims.filter((a) => norm(a.fm.sprint) === norm(rotulo)) : [];
  for (const a of daSprint)
    if (!listados.includes(a.k)) acusa(`o ticket \`${a.k}\` tem \`sprint: ${rotulo}\` (\`${a.n}\`), mas não está em \`## Tickets da sprint\`.`);
  for (const k of listados) {
    const a = aims.find((x) => x.k === k);
    if (!a) acusa(`ticket \`${k}\` sem AIMM em \`${dir}/\` — a sprint consolida as AIMMs dos tickets.`);
    else if (norm(a.fm.sprint) !== norm(rotulo))
      acusa(`o ticket \`${k}\` está em \`## Tickets da sprint\`, mas a AIMM dele ${a.fm.sprint ? `diz \`sprint: ${a.fm.sprint}\`` : 'não diz a sprint'}.`);
  }

  // A visão final de cada ticket concluído, dentro da sprint.
  const porFeature = new Map(); // id → [{ k, natureza }]
  for (const a of daSprint) {
    if (norm(a.fm.estado) !== 'concluido') {
      acusa(`a AIMM do ticket \`${a.k}\` está em \`${a.fm.estado || '—'}\` — a sprint consolida a visão final dos tickets concluídos.`);
      continue;
    }
    const finais = alteracoesDe(a.ls);
    for (const f of finais) {
      if (!porFeature.has(f.id)) porFeature.set(f.id, []);
      porFeature.get(f.id).push({ ...f, k: a.k });
      const l = linhas.find((x) => x.id === f.id);
      if (!l) acusa(`\`${f.id}\` está na visão final da AIMM de \`${a.k}\`, mas não em \`## Alterações em funcionalidades por Agrupamento Funcional\` da sprint.`);
      else if (!l.chaves.includes(a.k)) acusa(`\`${f.id}\`: a coluna Ticket da sprint não cita \`${a.k}\`, que alterou a funcionalidade.`);
    }
    for (const l of linhas.filter((x) => x.chaves.includes(a.k)))
      if (!finais.some((f) => f.id === l.id)) acusa(`\`${l.id}\` cita \`${a.k}\`, mas a visão final da AIMM de \`${a.k}\` não tem a funcionalidade.`);
  }
  // Natureza da linha da sprint × as AIMMs dos tickets. Incluída por um ticket da
  // sprint, a funcionalidade entra nela como incluída, ainda que outro a tenha alterado depois.
  for (const l of linhas) {
    const fs = (porFeature.get(l.id) || []).filter((f) => l.chaves.includes(f.k));
    if (!fs.length) continue;
    if (l.natureza && fs.every((f) => f.natureza)) {
      const espera = fs.some((f) => f.natureza === 'incluida') ? 'incluida' : 'alterada';
      const mostra = (v) => `\`${v === 'incluida' ? 'incluída' : v}\``;
      if (l.natureza !== espera)
        acusa(`\`${l.id}\`: natureza ${mostra(l.natureza)} na sprint, mas ${fs.map((f) => `${mostra(f.natureza)} na AIMM de \`${f.k}\``).join(', ')}${fs.length > 1 ? ` — a sprint diz ${mostra(espera)}` : ''}.`);
    }
  }

  return daSprint.length;
}

/* =========================== AIMM do ticket =========================== */
const ESTADOS = ['em-analise', 'escopo-aprovado', 'em-execucao', 'concluido'];
const est = norm(fm.estado);
if (!fm.estado) errors.push('front-matter sem `estado:` (em-análise|escopo-aprovado|em-execução|concluído).');
else if (est === 'rascunho') errors.push('`estado: rascunho` não existe mais na AIMM do ticket — ela nasce completa: execute os passos 1 a 5 do PROMPT_AIMM e grave `em-análise`.');
else if (!ESTADOS.includes(est)) errors.push(`\`estado: ${fm.estado}\` não é um estado válido da esteira da AIMM.`);
const depoisDe = (e) => ESTADOS.indexOf(est) >= ESTADOS.indexOf(e);

if (!fm.ticket || EXEMPLO.test(fm.ticket)) errors.push('front-matter sem `ticket:` (a chave na ferramenta de origem).');
else {
  const doNome = impactKey(basename(FILE));
  if (!doNome || doNome.toLowerCase() !== fm.ticket.toLowerCase())
    errors.push(`o arquivo deve se chamar \`AIMM-${fm.ticket}.md\` (a chave do \`ticket:\`), não \`${basename(FILE)}\`.`);
}
const naEntrega = norm(fm['aberta-na-entrega']) === 'true';

for (const s of ['Descrição do ticket', 'Critérios de aceite', 'Funcionalidades', 'Artefatos impactados',
  'Alterações em funcionalidades por Agrupamento Funcional', 'Reconciliação', 'Changelog']) {
  if (!temSecao(s)) errors.push(`falta a seção \`## ${s}\`.`);
}

// Funcionalidades: o elo recíproco da `## Origem` dos N3.
const features = tabelasDe('Funcionalidades').flatMap((t) => t.linhas).filter((c) => ID_RE.test(c[0] || '') && !/SIGLA-S(?:AF|FS)-NN/.test(c[0]));
if (depoisDe('em-analise') && temSecao('Funcionalidades') && !features.length)
  errors.push('`## Funcionalidades` sem funcionalidade — de `em-análise` em diante, a AIMM diz quais N3 realizam o ticket.');

/* ---------------------- changeset ---------------------- */
const TIPOS = new Set(['N1', 'N2', 'N3', 'QA', 'DATA-MODEL', 'FIELD-DICT', 'RULES-DICT', 'MESSAGE-DICT', 'ERROR-DICT',
  'NFR', 'PATTERNS', 'API-PATTERNS', 'MÉTRICA', 'METRICA', 'PROTÓTIPO', 'PROTOTIPO', 'REPOSITÓRIO', 'REPOSITORIO']);
const tabCs = tabelasDe('Artefatos impactados')[0] || { cab: [], linhas: [] };
const iStatus = tabCs.cab.indexOf('status');
const rows = tabCs.linhas.map((c) => ({
  artefato: (c[0] || '').replace(/`/g, ''), tipo: (c[1] || '').toUpperCase(), operacao: norm(c[2]),
  secao: c[3] || '', natureza: norm(c[4]), oque: c[5] || '', prov: c[6] || '', bruta: c.join(' | '),
  status: iStatus >= 0 ? norm(c[iStatus]).replace(/\s+/g, ' ') : null,
}));
// Status de cada artefato (9.2.0): o agente grava e marca Especificado; a pessoa revisa e o
// artefato vira Validado. A AIMM só conclui com todos Validado ou Não se aplica.
const STATUS = { pendente: 'Pendente', especificado: 'Especificado', validado: 'Validado', 'nao se aplica': 'Não se aplica' };
const naoSeAplica = (r) => r.status === 'nao se aplica';
if (depoisDe('em-analise') && temSecao('Artefatos impactados')) {
  if (!rows.length) errors.push('a seção `## Artefatos impactados` não tem tabela de linhas.');
  if (rows.length && !(tabCs.cab.includes('artefato') && tabCs.cab.includes('tipo') && tabCs.cab.includes('natureza')))
    errors.push('cabeçalho da tabela de artefatos deve ter ao menos: Artefato, Tipo, Natureza.');
  const exemplos = rows.filter((r) => /<(?:dom|fs|slug)>|\[[^\]]*\]/.test(r.bruta));
  for (const r of exemplos) errors.push(`linha de exemplo do template no changeset: \`${r.artefato}\` — troque pelo artefato real ou apague.`);
  for (const r of rows) {
    if (r.tipo && !TIPOS.has(r.tipo)) warns.push(`Tipo desconhecido "${r.tipo}" (${r.artefato}).`);
    const isPath = /^(modules|global|qa|prototypes|analise-impacto)\//.test(r.artefato) || /\.md$/.test(r.artefato);
    const looksConcrete = isPath && !/[()<>[\]]| de /.test(r.artefato); // ignora "qa/ de X", "prototypes/ (tela…)"
    if (looksConcrete) {
      const exists = existsSync(join(ROOT, r.artefato));
      if (r.operacao === 'alterar' && !exists) errors.push(`\`${r.artefato}\` marcado \`alterar\` mas não existe — é \`criar\`?`);
      // Até o aval, `criar` sobre arquivo existente é suspeito — a linha devia ser `alterar`?
      // Da execução em diante, a passada criou o arquivo: em `em-execução` e `concluído` ele
      // existe por construção, e o aviso seria ruído em toda AIMM que criou algo.
      if (r.operacao === 'criar' && exists && !depoisDe('em-execucao')) warns.push(`\`${r.artefato}\` marcado \`criar\` mas já existe — é \`alterar\`?`);
    }
  }
  if (rows.length && iStatus < 0)
    warns.push('`## Artefatos impactados` sem a coluna Status (Pendente, Especificado, Validado, Não se aplica) — AIMM anterior à 9.2.0: acrescente-a.');
  for (const r of rows) {
    if (iStatus >= 0 && !STATUS[r.status])
      errors.push(`\`${r.artefato}\`: Status "${r.status || '—'}" — use Pendente, Especificado, Validado ou Não se aplica.`);
  }
  const has = (pred) => rows.some(pred);
  const isFunc = (n) => n.startsWith('funcional');
  const isNF = (n) => n.includes('nao-funcional') || n.startsWith('nao');
  const cobertura = (msg) => (naEntrega ? warns : errors).push(msg + (naEntrega ? ' (AIMM aberta na entrega: aviso)' : ''));
  // No perfil `requisitos` a esteira não tem o checkpoint de testes nem a opção 5B, e o
  // plano de testes fica com quem constrói: a falta da linha QA avisa. O NFR do C3
  // continua exigido nos dois perfis.
  const semQA = perfilDa(ROOT) === 'requisitos';
  const faltaQA = (achado, completo, requisitos) => (semQA
    ? warns.push(`${achado} — no perfil \`requisitos\`, aviso: ${requisitos}`)
    : cobertura(achado + completo));
  if (!has((r) => r.tipo === 'N3')) errors.push('C1: nenhuma linha `N3` — todo ticket ancora em ao menos uma funcionalidade.');
  if (has((r) => isFunc(r.natureza)) && !has((r) => r.tipo === 'QA'))
    faltaQA('C2: há mudança `funcional` sem linha `QA`', ' — mudança funcional deve ser testada (gate CP3).', 'o plano de testes fica com quem constrói.');
  if (has((r) => isNF(r.natureza))) {
    if (!has((r) => r.tipo === 'NFR')) cobertura('C3: há mudança `não-funcional` sem linha `NFR`.');
    if (!has((r) => r.tipo === 'QA'))
      faltaQA('C3: há mudança `não-funcional` sem linha `QA`', ' (teste não-funcional que a verifique).', 'o teste do NFR fica com quem constrói.');
  }
}

// A AIMM nasce completa: nenhuma seção de impacto guarda o exemplo do template. O padrão é o
// texto do próprio template, não o EXEMPLO genérico, porque aqui a prosa real traz links.
const EXEMPLOS_DE_SECAO = {
  'Alterações em funcionalidades por Agrupamento Funcional': /SIGLA-S(?:AF|FS)-NN|^### \[|\[Nome da Funcionalidade\]/m,
  'Entidades alteradas': /^\[`### <Entidade>`/m,
  'Impacto em dicionários': /^- \[ou "/m,
  'Decisões pendentes': /^- \[ou "/m,
};
for (const [s, re] of Object.entries(EXEMPLOS_DE_SECAO)) {
  if (!temSecao(s)) continue;
  const corpo = corpoDe(s).join('\n').replace(/<!--[\s\S]*?-->/g, '');
  if (re.test(corpo)) errors.push(`\`## ${s}\` ainda tem o exemplo do template — a AIMM nasce completa: preencha a seção, ou escreva "Nenhuma."/"Nenhum.".`);
  else if (!conteudoForaDaCitacao(s).length) errors.push(`\`## ${s}\` está vazia — a AIMM nasce completa: preencha a seção, ou escreva "Nenhuma."/"Nenhum.".`);
}

/* --------------------- portões por estado --------------------- */
if (depoisDe('escopo-aprovado') && !fm['avalizado-por'])
  errors.push(`estado \`${fm.estado}\` exige front-matter \`avalizado-por\` (o aval do PO no escopo).`);
if (est === 'concluido' && iStatus >= 0) {
  const abertos = rows.filter((r) => STATUS[r.status] && !['validado', 'nao se aplica'].includes(r.status));
  for (const r of abertos)
    errors.push(`estado \`concluído\` exige todo artefato Validado ou Não se aplica — \`${r.artefato}\` está ${STATUS[r.status]}.`);
}
if (args.includes('--entrega')) {
  // Cada funcionalidade no estado final da esteira do perfil (lib/instancia.mjs).
  const perfil = perfilDa(ROOT);
  const alvo = ESTADO_FINAL[perfil];
  const n3 = featureById(scanInstance(ROOT));
  for (const c of features) {
    const id = c[0].match(ID_RE)[0];
    const f = n3.get(id);
    if (!f) {
      errors.push(`\`${id}\` (## Funcionalidades) não tem N3 — o ticket não fecha com funcionalidade por especificar.`);
      continue;
    }
    if (f.estado === alvo || f.estado === 'deprecado') continue;
    const como = f.estado === 'revisao-necessaria'
      ? ' A alteração foi entregue? Volte o `estado` ao derivado dos gates, rode `python3 scripts/gates.py promote --write` e atualize o Status aqui.'
      : '';
    errors.push(`\`${id}\` está em \`${f.estado || '—'}\` (${f.path}) — a AIMM só fecha com cada funcionalidade no estado final da esteira desta instância, \`${alvo}\` (perfil \`${perfil}\`), ou \`deprecado\`.${como}`);
  }
}

/* ----------------------- reconciliação ------------------------ */
const touchedOpt = opt('--touched');
const gitBase = opt('--git-base');
let touched = null;
if (touchedOpt) touched = touchedOpt.split(',').map((s) => s.trim()).filter(Boolean);
else if (gitBase) {
  try {
    touched = execFileSync('git', ['-C', ROOT, 'diff', '--name-only', `${gitBase}...HEAD`], { encoding: 'utf8' })
      .split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  } catch (e) { warns.push(`reconciliação: git diff falhou (${String(e.message).split('\n')[0]}).`); }
}
if (touched) {
  const declared = rows.filter((r) => !naoSeAplica(r) && /^(modules|global|qa|prototypes)\//.test(r.artefato) && !/[()]| de /.test(r.artefato))
    .map((r) => r.artefato);
  const inSpec = (p) => /^(modules|global|qa|prototypes)\//.test(p);
  const notTouched = declared.filter((d) => !touched.includes(d));
  const notDeclared = touched.filter((t) => inSpec(t) && !declared.includes(t));
  for (const d of notTouched) errors.push(`reconciliação: \`${d}\` foi declarado mas NÃO tocado (escopo não cumprido).`);
  for (const t of notDeclared) errors.push(`reconciliação: \`${t}\` foi tocado mas NÃO declarado (desvio de escopo).`);
}

/* ------------------------------ saída ------------------------------ */
sai();
console.log(`  ✓ AIMM bem-formada — ${fm.estado}, ${features.length} funcionalidade(s), ${rows.length} linha(s) no changeset${warns.length ? `, ${warns.length} aviso(s)` : ''}.`);
