#!/usr/bin/env node
// verifica-texto-corrido.mjs — acusa prosa com quebra de linha no meio do parágrafo
// ("hard wrap"). Regra do CLAUDE.md: parágrafo = uma linha contínua.
//
// Uso:  node scripts/verifica-texto-corrido.mjs [arquivo.md | pasta] ...
//       (sem argumentos: varre global/ e modules/)
//
// Heurística: dentro de um bloco de prosa (fora de code fence, tabela, lista,
// cabeçalho ou HTML), uma linha que NÃO termina o parágrafo (sem linha em branco
// na sequência) é quebra dura — a continuação deveria estar na mesma linha.
// Blockquotes contam: "> texto" seguido de "> continuação" também é quebra dura.
// Item de lista também: "- texto" seguido de "  continuação" é o item quebrado.
//
// Pastas: ficam de fora `.git`, `.github`, `.claude` (ferramenta, não documento) e
// `node_modules`. As demais pastas com ponto entram — a `.specify/` do spec-kit é
// documento, e saía da conferência sem aviso (achado no siesa-doc, 2026-10-11).

import fs from 'node:fs';
import path from 'node:path';

const alvos = process.argv.slice(2).length ? process.argv.slice(2) : ['global', 'modules'];
const arquivos = [];
const FORA = new Set(['.git', '.github', '.claude', 'node_modules']);
for (const alvo of alvos) {
  const st = fs.statSync(alvo);
  if (st.isFile()) { arquivos.push(alvo); continue; }
  (function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (FORA.has(e.name)) continue;
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.md')) arquivos.push(p);
    }
  })(alvo);
}

const eEstrutural = (l) => {
  const t = l.trim();
  return t === '' || /^#{1,6} /.test(t) || /^(\||-{3,}|={3,}|\*{3,})/.test(t) ||
    /^([-*+] |\d+[.)] )/.test(t) || /^<!--/.test(t) || /-->$/.test(t) ||
    /^(```|~~~)/.test(t) || /^<\/?\w/.test(t) || /^\[.*\]:/.test(t) ||
    // `@caminho` sozinho na linha é import do Claude Code (CLAUDE.md da instância): um por linha
    /^@\S+$/.test(t);
};

// Ficha: linha `**Rótulo**: valor`. Duas seguidas são uma lista de campos, um por linha
// — não um parágrafo quebrado (REP-035 do portal-compras).
const eItemDeLista = (l) => /^\s*([-*+] |\d+[.)] )/.test(l);

const eCampoDeFicha = (l) => /^\s*\*\*[^*]+\*\*\s*:/.test(l);

let totalQuebras = 0, arquivosComQuebra = 0;
for (const arq of arquivos) {
  const linhas = fs.readFileSync(arq, 'utf-8').split('\n');
  let fence = false, fm = false, coment = false, quebras = [];
  for (let i = 0; i < linhas.length - 1; i++) {
    const l = linhas[i], prox = linhas[i + 1];
    // front-matter: '---' na 1ª ou 2ª linha (após o carimbo de versão)
    if (i <= 2 && l.trim() === '---' && !fm) { fm = true; continue; }
    if (fm) { if (l.trim() === '---') fm = false; continue; }
    // blockquotes ficam de fora: linhas '>' consecutivas são um parágrafo que o
    // markdown já junta na renderização (padrão GitHub) — chrome dos templates
    if (/^\s*>/.test(l)) continue;
    if (/^\s*(```|~~~)/.test(l)) { fence = !fence; continue; }
    if (fence) continue;
    // comentário HTML multilinha: invisível no documento renderizado, que é o que a
    // regra protege — o interior fica de fora (os templates explicam o preenchimento ali)
    if (coment) { if (l.includes('-->')) coment = false; continue; }
    if (l.includes('<!--') && !l.slice(l.lastIndexOf('<!--')).includes('-->')) { coment = true; continue; }
    // item de lista: a linha seguinte que não abre item, tabela, bloco nem cabeçalho é
    // continuação do mesmo item — o item quebrado (achado no siesa-doc, 2026-10-11)
    if (eItemDeLista(l)) {
      if (!eEstrutural(prox) && !/^\s*>/.test(prox)) quebras.push(i + 1);
      continue;
    }
    if (eEstrutural(l) || l.trim().length < 20) continue;
    // Exige as DUAS linhas no formato, para não abrir exceção a um parágrafo comum que
    // por acaso comece com rótulo em negrito.
    if (eCampoDeFicha(l) && eCampoDeFicha(prox)) continue;
    // linha de prosa: é quebra dura se a próxima linha CONTINUA o parágrafo
    if (!eEstrutural(prox) && !/^\s*>/.test(prox) && prox.trim().length > 0) {
      quebras.push(i + 1);
    }
  }
  if (quebras.length) {
    arquivosComQuebra++;
    totalQuebras += quebras.length;
    const amostra = quebras.slice(0, 5).join(', ') + (quebras.length > 5 ? ', …' : '');
    console.log(`✗ ${arq} — ${quebras.length} quebra(s) dura(s) (linhas ${amostra})`);
  }
}
console.log(totalQuebras
  ? `\n${totalQuebras} quebra(s) dura(s) em ${arquivosComQuebra} arquivo(s). Junte cada parágrafo numa linha única (CLAUDE.md → Markdown).`
  : '✓ Nenhuma quebra dura de parágrafo encontrada.');
process.exit(totalQuebras ? 1 : 0);
