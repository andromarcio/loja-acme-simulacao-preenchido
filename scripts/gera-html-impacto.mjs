#!/usr/bin/env node
// gera-html-impacto.mjs — renderiza uma análise de impacto (.md) como HTML autocontido.
//
// Para quê: a análise de impacto circula fora do editor — vai para o PO, para a
// equipe de métricas, para a chefia, muitas vezes por e-mail ou celular. O .md é a
// fonte; este script produz o HTML de leitura, com o MESMO layout que o visualizador
// usa para renderizar um N3: uma seção por título `##`, cartão por seção, tabelas com
// o tratamento de changelog. As seções saem recolhíveis (<details>) e TODAS ABERTAS —
// quem abre o documento vê tudo; quem quer navegar recolhe o que já leu.
//
// Antes existia o trabalho manual de manter .md e .html em sincronia à mão, que é a
// falha mais comum e a mais constrangedora, porque o HTML é o que circula. Aqui o
// HTML deixa de ser artefato editável: é derivado, e se regenera.
//
// Uso (a partir da raiz da instância):
//   node scripts/gera-html-impacto.mjs <arquivo.md> [saida.html]
//   node scripts/gera-html-impacto.mjs analise-impacto/     # todos os .md da pasta
//
// A paleta sai do :root do index.html da instância, então o documento gerado herda a
// identidade visual daquele repositório sem configuração.

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, basename, extname, resolve } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const RAIZ = process.cwd();

// ── marked: usa o vendorizado da instância, para render igual ao do visualizador ──
function carregaMarked() {
  const vendor = join(RAIZ, 'assets', 'vendor', 'marked.min.js');
  if (!existsSync(vendor)) {
    console.error('✗ assets/vendor/marked.min.js não encontrado — rode a partir da raiz da instância.');
    process.exit(1);
  }
  const mod = require(vendor);
  return mod.marked ?? mod;
}

// ── paleta: herda o :root do visualizador da instância ──
function tokensDaInstancia() {
  const idx = join(RAIZ, 'index.html');
  if (!existsSync(idx)) return '';
  const m = readFileSync(idx, 'utf8').match(/:root\s*\{([\s\S]*?)\}/);
  return m ? m[1].trim() : '';
}

const escapa = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'secao';

// ── data no padrão brasileiro dentro das tabelas, como o visualizador faz ──
const dataBR = (md) => md.replace(/\| (\d{4})-(\d{2})-(\d{2}) \|/g, (_, a, m, d) => `| ${d}/${m}/${a} |`);

// ── Tabela de indicadores vira KPI, não linha de tabela ──────────────────────
// Uma tabela de duas colunas com cabeçalho "Indicador | Valor" é um painel de
// números, não dado tabular: o leitor quer o valor de longe. Extrai-se o número da
// frente do valor e o que sobra vira a linha de apoio ("+1 opcional", "CHGA",
// "1 tabela + 5 colunas"). Qualquer outra tabela segue como tabela.
const ACENTOS = ['var(--_marca)', '#6D28D9', 'var(--_marca)', '#047857', '#B45309', 'var(--_marca)'];

function kpiDaTabela(bloco) {
  const linhas = bloco.trim().split('\n').map(l => l.trim()).filter(Boolean);
  if (linhas.length < 3) return null;
  const cab = linhas[0].split('|').map(c => c.trim()).filter(Boolean);
  if (cab.length !== 2 || !/indicador/i.test(cab[0]) || !/valor/i.test(cab[1])) return null;

  // O cartão mostra DUAS coisas: o valor e o que ele é. Nada além — o detalhamento de
  // cada item ("+1 opcional", "1 tabela + 5 colunas", a lista de ALIs) é o que
  // transformava o painel em prosa e desfazia a razão de existir do cartão, que é ser
  // lido de relance. Esse detalhe vive nas seções, onde há espaço para ele.
  //
  // Daí o valor precisar ser extraível como valor. Aceita-se um número — inclusive
  // composto, "58 · 29" — ou uma palavra curta ("nenhuma"). O que não se resolve nessas
  // duas formas não é KPI: é linha de tabela, e a tabela fica como está. O corte vale
  // para a tabela inteira, porque meio painel de cartão e meio de tabela é pior que
  // qualquer um dos dois inteiro.
  const valorDe = (bruto) => {
    const v = bruto.replace(/[`*]/g, '').trim();
    const num = v.match(/^([+-]?[\d.,]+(?:\s*·\s*[+-]?[\d.,]+)*(?:\s*\(E\))?(?:\s*·\s*[\d.,]+\s*\(E\))*)/);
    if (num) return num[1].trim();
    const palavra = v.split(/\s*[—–·(]\s*/)[0].trim();
    return palavra.length <= 12 ? palavra : null;
  };

  const valores = linhas.slice(2).map(l => valorDe(l.split('|')[2] ?? ''));
  if (valores.some(v => !v)) return null;

  const cartoes = linhas.slice(2).map((l, i) => {
    const rotulo = (l.split('|')[1] ?? '').trim();
    if (!rotulo) return '';
    return `      <div class="stat" style="--acento:${ACENTOS[i % ACENTOS.length]}">
        <div class="stat-n">${escapa(valores[i])}</div>
        <div class="stat-k">${escapa(rotulo.replace(/[`*]/g, ''))}</div>
      </div>`;
  }).filter(Boolean);

  return cartoes.length ? `    <div class="kpi-grid">\n${cartoes.join('\n')}\n    </div>` : null;
}

// ── Título de item vira chave em chip + título + badge de natureza ──────────
// Um `### \`CHAVE\` · HU-0NN — Título (alteração + novas)` carrega três coisas com
// pesos diferentes: a CHAVE, que se procura e se copia; o TÍTULO, que se lê; e a
// NATUREZA, que decide quem faz o trabalho e quanto se conta. Renderizadas em linha
// corrida elas se confundem; separadas, cada uma se acha de relance.
const NATUREZAS = [
  { re: /altera[çc][ãa]o\s*\+\s*nova?s?|nova?s?\s*\+\s*altera[çc][ãa]o/i, rotulo: 'alterada + nova', tipo: 'mista' },
  { re: /^\s*nova?s?\s*$/i,                                                    rotulo: 'nova',            tipo: 'nova' },
  { re: /altera[çc][ãa]o|alterada?s?/i,                                       rotulo: 'alterada',        tipo: 'alterada' },
];

function tituloDeItem(texto) {
  // (natureza) no fim do título — opcional
  let natureza = null;
  const semNat = texto.replace(/\s*\(([^()]*)\)\s*$/, (m, dentro) => {
    const achou = NATUREZAS.find(n => n.re.test(dentro));
    if (!achou) return m;
    natureza = achou;
    return '';
  }).trim();

  // chaves em crase no começo, com os separadores que a fonte usa (· + —)
  const mChaves = semNat.match(/^((?:`[^`]+`(?:\s*[·+,]\s*|\s*))+)(?:[·—–-]\s*)?(.*)$/);
  if (!mChaves && !natureza) return null;

  const chaves = mChaves ? [...mChaves[1].matchAll(/`([^`]+)`/g)].map(m => m[1]) : [];
  let resto = (mChaves ? mChaves[2] : semNat).replace(/^\s*[·—–-]\s*/, '').trim();

  const chips = chaves.map(c => `<span class="chave">${escapa(c)}</span>`).join('');
  const badge = natureza ? `<span class="badge badge--${natureza.tipo}">${natureza.rotulo}</span>` : '';
  if (!chips && !badge) return null;

  return `<h3 class="item-titulo">${chips}<span class="item-nome">${resto ? escapa(resto) : escapa(texto)}</span>${badge}</h3>`;
}

// Colunas cujo conteúdo é um átomo: uma contagem ou um identificador. Quebrá-las no
// meio ("PDTIC25093-" / "49", "4" / "(E)") produz duas linhas que o olho lê como dois
// valores. A tabela é de largura automática e reparte o espaço por volume de texto,
// então a coluna estreita é a primeira a ser espremida — daí a largura pelo conteúdo
// (width:1% num layout automático encolhe até caber) mais o nowrap.
// Duas famílias, com tratamentos diferentes. IDENTIFICADOR encolhe até o conteúdo
// (width:1%): a chave tem largura conhecida e nada ganha com folga. NUMÉRICA recebe um
// PISO, não uma largura: o valor é curto mas o rótulo não ("PFB" cabe, "Cenários" não),
// e travar na largura do conteúdo deixaria a coluna espremida contra o cabeçalho.
const COLUNAS_IDENTIFICADOR = new Set(['jira', 'item do jira', 'chave', 'ticket', 'ca-n', 'natureza', 'regras', 'cenários', 'cenarios', 'operação', 'status']);
const COLUNAS_NUMERICAS = new Set(['pfb', 'pfl', 'pf', 'cfp', 'pfb no baseline']);
// A coluna narrativa é a que o leitor de fato lê, e numa tabela de largura automática
// ela é a que perde: o navegador reparte por volume de texto e as oito colunas curtas
// ao lado somam mais que ela. Recebe um piso generoso para reclamar o espaço de volta.
const COLUNAS_PROSA = new Set(['o que mudou em relação ao comportamento anterior', 'o que mudou', 'o que muda', 'mudança']);
// A coluna de nome tem largura de conteúdo grande — "Gerar Solicitação de Compras a
// partir de Ata de Registro de Preços" pede 680px de max-content — e, numa tabela mais
// larga que o contêiner, o navegador lhe dá tudo isso, espremendo a narrativa ao lado.
// Recebe um teto: o nome quebra em duas linhas, que é barato, e a prosa fica legível.
const COLUNAS_NOME = new Set(['feature', 'processo elementar', 'entidade', 'evidência']);

function fixaColunasAtomicas(html) {
  return html.replace(/<table>([\s\S]*?)<\/table>/g, (tabela) => {
    const cabecalho = tabela.match(/<tr>([\s\S]*?)<\/tr>/);
    if (!cabecalho) return tabela;
    const rotulos = [...cabecalho[1].matchAll(/<th[^>]*>([\s\S]*?)<\/th>/g)]
      .map((m) => m[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim().toLowerCase());
    const classe = new Map();
    rotulos.forEach((r, i) => {
      if (COLUNAS_PROSA.has(r)) classe.set(i, 'col-prosa');
      else if (COLUNAS_NOME.has(r)) classe.set(i, 'col-nome');
      else if (COLUNAS_IDENTIFICADOR.has(r)) classe.set(i, 'col-id');
      else if (COLUNAS_NUMERICAS.has(r)) classe.set(i, 'col-num');
    });
    if (!classe.size) return tabela;
    return tabela.replace(/<tr>([\s\S]*?)<\/tr>/g, (linha, dentro) => {
      let i = -1;
      const nova = dentro.replace(/<(th|td)([^>]*)>/g, (bruto, tag, attrs) => {
        i++;
        return classe.has(i) ? `<${tag}${attrs} class="${classe.get(i)}">` : bruto;
      });
      return `<tr>${nova}</tr>`;
    });
  });
}

function renderSecao(marked, titulo, corpo) {
  const eChangelog = /changelog|hist[óo]rico/i.test(titulo);

  // tira as tabelas de indicadores da frente do marked e guarda o KPI gerado
  const kpis = [];
  let md = dataBR(corpo).trim().replace(/(?:^\|.*\|[ \t]*\n)+/gm, (bloco) => {
    const k = kpiDaTabela(bloco);
    if (!k) return bloco;
    kpis.push(k);
    return `\n@@KPI${kpis.length - 1}@@\n`;
  });

  let html = marked.parse(md);
  html = html.replace(/<p>@@KPI(\d+)@@<\/p>/g, (_, i) => kpis[Number(i)] ?? '');
  html = html.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/g, (bruto, dentro) => {
    const cru = dentro.replace(/<code>/g, '`').replace(/<\/code>/g, '`').replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
    return tituloDeItem(cru) ?? bruto;
  });
  html = fixaColunasAtomicas(html);
  html = html
    .replace(/<table>/g, `<div class="table-container"><table class="custom-table${eChangelog ? ' changelog-table' : ''}">`)
    .replace(/<\/table>/g, '</table></div>')
    .replace(/<td>Sim<\/td>/g, '<td><span class="req-tag">Sim</span></td>')
    .replace(/<td>Não<\/td>/g, '<td><span class="opt-tag">Não</span></td>')
    .replace(/<hr\s*\/?>/g, '');

  return `  <details class="doc-section" id="${slug(titulo)}" open>
    <summary class="section-header">
      <span class="section-title">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="3" y1="9" x2="21" y2="9"></line>
          <line x1="9" y1="21" x2="9" y2="9"></line>
        </svg>
        ${escapa(titulo)}
      </span>
      <svg class="chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
    </summary>
    <div class="section-body markdown-body">
${html}
    </div>
  </details>`;
}

function gera(caminhoMd, saida) {
  const marked = carregaMarked();
  const bruto = readFileSync(caminhoMd, 'utf8');

  // tira o carimbo docqui e o front-matter — metadados internos, não conteúdo. Na AIMM,
  // o front-matter é a fonte única da ficha (ticket, ferramenta, link, sprint, estado):
  // ele vira as linhas `**Rótulo**: valor` que a ficha abaixo renderiza.
  let md = bruto.replace(/^﻿?(?:\s*<!--[\s\S]*?-->\s*)*/, '');
  const fmM = md.match(/^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*\r?\n/);
  const fm = {};
  if (fmM) {
    for (const l of fmM[1].split(/\r?\n/)) {
      const m = l.match(/^([a-z][\w-]*):\s*(.*)$/i);
      if (m) fm[m[1].toLowerCase()] = m[2].replace(/\s+#.*$/, '').trim().replace(/^(["'])(.*)\1$/, '$2');
    }
    md = md.slice(fmM[0].length);
  }
  const ESTADO = { rascunho: 'Rascunho', 'em-análise': 'Em análise', 'em-analise': 'Em análise',
    'escopo-aprovado': 'Escopo aprovado', 'em-execução': 'Em execução', 'em-execucao': 'Em execução',
    'concluído': 'Concluída', concluido: 'Concluída' };
  const fichaFm = [];
  if (/^(ticket|sprint)$/i.test(fm.tipo || '')) {
    const vale = (v) => v && !/^\[.*\]$/.test(v);
    if (fm.tipo.toLowerCase() === 'ticket') {
      if (vale(fm.ticket)) fichaFm.push(`**Ticket**: ${vale(fm.ferramenta) ? `${fm.ferramenta} ` : ''}\`${fm.ticket}\`${vale(fm.titulo) ? ` — ${fm.titulo}` : ''}`);
      if (vale(fm.link)) fichaFm.push(`**Link**: ${fm.link}`);
      if (vale(fm.sprint)) fichaFm.push(`**Sprint**: ${fm.sprint}`);
    } else {
      if (vale(fm.sprint)) fichaFm.push(`**Sprint**: ${fm.sprint}`);
      if (vale(fm.entrega)) fichaFm.push(`**Entrega**: ${fm.entrega}`);
    }
    if (ESTADO[(fm.estado || '').toLowerCase()]) {
      // quem levou a AIMM ao estado atual, e quando (9.1.0): `2026-10-31 16:19 -03:00` → `31/10/2026 16:19` (o fuso fica só no front-matter, 9.1.1)
      const em = (fm['estado-em'] || '').match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}:\d{2}) ([+-]\d{2}:\d{2})$/);
      const por = vale(fm['estado-por']) ? ` — por ${fm['estado-por']}` : '';
      fichaFm.push(`**Estado**: ${ESTADO[fm.estado.toLowerCase()]}${por}${em ? `, em ${em[3]}/${em[2]}/${em[1]} ${em[4]}` : ''}`);
    }
  }

  const tituloM = md.match(/^#\s+(.+)$/m);
  const titulo = tituloM ? tituloM[1].trim() : basename(caminhoMd, '.md');

  // Entre o H1 e o primeiro ## cabem duas coisas diferentes, e só uma delas sai no HTML.
  //
  // Um LEDE em prosa (resumo do relatório) é redundante: o título já entrega e o
  // Sumário logo abaixo repete. Esse é descartado — fica só no .md.
  //
  // Uma FICHA (`**Ticket**`, `**Link**`, `**Sprint**`, `**Estado**`…) é o oposto: é o
  // elo com a ferramenta de origem e o ÚNICO lugar do documento onde o link do
  // Jira/ServiceNow aparece. Descartá-la deixaria o HTML sem a rastreabilidade que
  // justifica o arquivo existir. Essa é renderizada.
  //
  // Na AIMM, a ficha sai do front-matter (acima). Nos demais documentos, distingue-se
  // pela forma: duas ou mais linhas `**Rótulo**: valor` entre o título e o primeiro `##`.
  const iPrimeira = md.search(/\n##\s+/);
  const iH1 = tituloM ? md.indexOf(tituloM[0]) + tituloM[0].length : 0;
  const cabecalhoMd = (iPrimeira === -1 ? md.slice(iH1) : md.slice(iH1, iPrimeira)).replace(/^\s*-{3,}\s*$/gm, '').trim();
  // cada linha da ficha é um campo — o markdown juntaria tudo num parágrafo só,
  // então força a quebra dura (dois espaços no fim) para sair um campo por linha.
  const fichaMd = fichaFm.length
    ? fichaFm.map((l) => `${l}  `).join('\n')
    : (cabecalhoMd.match(/^>?\s*\*\*[^*]+\*\*\s*:/gm) || []).length >= 2
      ? cabecalhoMd.split('\n').map((l) => (l.trim() ? l.replace(/\s*$/, '  ') : l)).join('\n')
      : '';

  const corpo = iPrimeira === -1 ? '' : md.slice(iPrimeira + 1);
  const secoes = corpo ? corpo.split(/\n(?=##\s+)/) : [];

  let secoesHtml = '';
  for (const sec of secoes) {
    if (!sec.trim()) continue;
    const t = sec.match(/^##\s+(.+)$/m);
    if (!t) continue;
    const titSec = t[1].trim();
    const body = sec.replace(/^##\s+.*?(\n|$)/, '').replace(/^\s*-{3,}\s*$/gm, '');
    secoesHtml += renderSecao(marked, titSec, body) + '\n';
  }

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapa(titulo)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@600;700&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap">
<style>
:root {
${tokensDaInstancia()}
}
:root {
  --_bg: var(--bg-app, #F6FAFD);
  --_card: var(--bg-card, #FFFFFF);
  --_borda: var(--border-color, #D6E3F0);
  --_borda-sutil: var(--border-subtle, #E8F0F8);
  --_hover: var(--bg-hover, #EDF3F9);
  --_texto: var(--text-main, var(--text-color, #0A2440));
  --_texto2: var(--text-secondary, #526981);
  --_marca: var(--brand-blue, var(--primary-color, #005CA9));
  --_marca-clara: var(--brand-blue-light, #E5F2FC);
  --_titulo: var(--dsc-font-title, 'Archivo', 'Segoe UI', system-ui, sans-serif);
  --_corpo: var(--dsc-font-family-1, 'IBM Plex Sans', 'Segoe UI', system-ui, sans-serif);
  --_mono: 'IBM Plex Mono', ui-monospace, Menlo, Consolas, monospace;
}
* { box-sizing: border-box; }
body { margin:0; background: var(--_bg); color: var(--_texto); font-family: var(--_corpo); font-size:14px; line-height:1.6; -webkit-font-smoothing:antialiased; }
.wrap { width: 100%; margin: 0; padding: 32px 40px 80px; }
/* O conteúdo destes documentos é majoritariamente tabela larga — a tela inteira é
   trabalho útil, não desperdício. A prosa corrida fica com medida de leitura própria
   para não virar linha de 200 caracteres em monitor grande. */
@media (max-width: 720px) { .wrap { padding: 24px 16px 60px; } }
.doc-head { margin-bottom: 26px; }
.eyebrow { font-size:11px; font-weight:700; letter-spacing:.12em; text-transform:uppercase; color: var(--_marca); margin-bottom:10px; }
h1 { font-family: var(--_titulo); font-size: clamp(24px,3.4vw,32px); font-weight:700; line-height:1.2; margin:0 0 14px; color: var(--_texto); text-wrap: balance; }
.doc-section { background: var(--_card); border:1px solid var(--_borda); border-radius:10px; padding: 0; margin-bottom:20px; box-shadow: 0 1px 3px rgba(10,36,64,.06); }
.section-header { display:flex; align-items:center; justify-content:space-between; gap:12px; padding: 20px 28px; cursor:pointer; list-style:none; }
.section-header::-webkit-details-marker { display:none; }
.section-title { font-family: var(--_titulo); font-size:18px; font-weight:700; color: var(--_texto); display:flex; align-items:center; gap:10px; }
.section-title svg { color: var(--_marca); flex:none; }
.chevron { color: var(--_texto2); transition: transform .18s; flex:none; }
details[open] > .section-header .chevron { transform: rotate(180deg); }
.section-body { padding: 18px 28px 24px; border-top:1px solid var(--_borda-sutil); }
.markdown-body > :first-child { margin-top:0; }
.markdown-body > :last-child { margin-bottom:0; }
.markdown-body h3 { font-family: var(--_titulo); font-size:15.5px; font-weight:700; margin:26px 0 10px; color: var(--_texto); }
.markdown-body h4 { font-size:14px; font-weight:700; margin:20px 0 8px; }
.markdown-body p { margin: 0 0 12px; }
.markdown-body ul, .markdown-body ol { margin:0 0 12px; padding-left:22px; }
.markdown-body li { margin-bottom:6px; }
.markdown-body code { font-family: var(--_mono); font-size:.86em; background: var(--_hover); border:1px solid var(--_borda-sutil); border-radius:4px; padding:1px 5px; overflow-wrap:anywhere; }
/* caminho de arquivo e chave longa não têm espaço para quebrar: sem isto, um code
   comprido empurra o corpo inteiro e a página ganha rolagem horizontal no celular */
.markdown-body { overflow-wrap: break-word; }
.custom-table .col-id  { white-space: nowrap; width: 1%; }
.custom-table .col-num { white-space: nowrap; min-width: 5.5rem; }
.custom-table .col-prosa { min-width: 38rem; }
.custom-table .col-nome  { min-width: 15rem; max-width: 22rem; }
.ficha { margin: 2px 0 22px; font-size: 13px; color: var(--_texto2); }
.ficha blockquote { margin:0; border:0; padding:0; }
.ficha p { margin: 0; line-height: 1.9; }
.markdown-body pre { background: var(--_hover); border:1px solid var(--_borda); border-radius:8px; padding:14px 16px; overflow-x:auto; }
.markdown-body pre code { background:none; border:0; padding:0; }
.markdown-body blockquote { margin:0 0 14px; padding:12px 18px; border-left:3px solid var(--_marca); background: var(--_bg); border-radius:0 6px 6px 0; color: var(--_texto2); }
.markdown-body blockquote > :first-child { margin-top:0; } .markdown-body blockquote > :last-child { margin-bottom:0; }
.markdown-body a { color: var(--_marca); }
.item-titulo { display:flex; align-items:center; flex-wrap:wrap; gap:10px; margin:30px 0 12px; font-family: var(--_titulo); font-size:17px; font-weight:700; color: var(--_texto); }
.item-nome { flex:0 1 auto; min-width:0; }
.chave { font-family: var(--_mono); font-size:12px; font-weight:600; letter-spacing:.01em; color: var(--_texto2); background: var(--_hover); border:1px solid var(--_borda); border-radius:999px; padding:4px 12px; white-space:nowrap; }
.badge { font-size:11px; font-weight:700; letter-spacing:.04em; text-transform:uppercase; border-radius:999px; padding:3px 11px; white-space:nowrap; }
.badge--alterada { background:#DBEAFE; color:#1D4ED8; }
.badge--nova     { background:#EDE9FE; color:#6D28D9; }
.badge--mista    { background:#FEF3C7; color:#B45309; }
.kpi-grid { display:grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap:14px; margin:16px 0 20px; }
.stat { background: var(--_card); border:1px solid var(--_borda); border-left:4px solid var(--acento, var(--_marca)); border-radius:8px; padding:16px 20px; box-shadow:0 1px 3px rgba(10,36,64,.06); }
.stat-n { font-family: var(--_titulo); font-size:30px; font-weight:700; line-height:1.05; color: var(--_texto); font-variant-numeric: tabular-nums; }
.stat-k { margin-top:8px; font-size:13px; color: var(--_texto2); line-height:1.45; }
.stat-k span { display:block; margin-top:3px; color: var(--_texto2); opacity:.85; }
.table-container { width:100%; overflow-x:auto; margin: 12px 0; border:1px solid var(--_borda); border-radius:8px; }
.custom-table { width:100%; border-collapse:collapse; text-align:left; font-size:13px; }
.custom-table th { background: var(--_hover); color: var(--_texto); font-weight:600; font-family: var(--_titulo); padding:12px 16px; border-bottom:1px solid var(--_borda); white-space:nowrap; }
.custom-table td { padding:12px 16px; border-bottom:1px solid var(--_borda-sutil); color: var(--_texto); vertical-align:top; line-height:1.5; }
// A primeira coluna costuma ser um ID curto, que não deve partir. Mas quando ela é
// um NOME ou a própria narrativa, o nowrap faz o texto transbordar por cima da
// coluna vizinha — 665px de conteúdo numa célula de 304px. Essas ficam de fora.
.custom-table th:first-child, .custom-table td:first-child:not(.col-nome):not(.col-prosa) { white-space:nowrap; }
.custom-table tbody tr:last-child td { border-bottom:none; }
.custom-table tbody tr:hover { background: var(--_hover); }
.changelog-table td { font-size:12.5px; }
.changelog-table th:first-child, .changelog-table td:first-child { width:120px; min-width:110px; }
.req-tag { font-weight:600; color:#E11D48; font-size:11px; background:#FFE4E6; padding:2px 6px; border-radius:4px; display:inline-block; }
.opt-tag { font-weight:500; color: var(--_texto2); font-size:11px; background: var(--_hover); padding:2px 6px; border-radius:4px; display:inline-block; }
.rodape { margin-top:34px; padding-top:18px; border-top:1px solid var(--_borda); font-size:12.5px; color: var(--_texto2); }
@media print { .doc-section { break-inside: avoid; border:1px solid #ccc; } }
</style>
</head>
<body>
<div class="wrap">
  <header class="doc-head">
    <div class="eyebrow">Análise de impacto</div>
    <h1>${escapa(titulo)}</h1>
  </header>
${fichaMd ? `  <div class="ficha markdown-body">${marked.parse(fichaMd)}</div>` : ''}

${secoesHtml}
  <footer class="rodape">
    Gerado de <code>${escapa(caminhoMd)}</code> por <code>scripts/gera-html-impacto.mjs</code>.
    O <strong>.md é a fonte</strong> — edite lá e regenere; alterações feitas neste HTML se perdem.
  </footer>
</div>
</body>
</html>
`;

  writeFileSync(saida, html);
  return { titulo, secoes: secoes.filter(s => s.trim()).length };
}

// ── entrada ──
const args = process.argv.slice(2);
if (!args.length) {
  console.error('Uso: node scripts/gera-html-impacto.mjs <arquivo.md | pasta> [saida.html]');
  process.exit(1);
}

const alvo = args[0];
if (!existsSync(alvo)) { console.error(`✗ não encontrado: ${alvo}`); process.exit(1); }

const arquivos = statSync(alvo).isDirectory()
  ? readdirSync(alvo).filter(n => n.endsWith('.md') && !n.startsWith('_') && n !== 'INDEX.md').map(n => join(alvo, n))
  : [alvo];

if (!arquivos.length) { console.log('Nenhum .md a gerar.'); process.exit(0); }

let n = 0;
for (const f of arquivos) {
  const saida = args[1] && arquivos.length === 1 ? args[1] : join(dirname(f), basename(f, extname(f)) + '.html');
  const r = gera(f, saida);
  console.log(`  ${saida} — ${r.secoes} seção(ões)`);
  n++;
}
console.log(`✓ ${n} arquivo(s) gerado(s).`);
