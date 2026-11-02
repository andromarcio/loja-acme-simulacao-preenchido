#!/usr/bin/env node
/**
 * Gera a versão autocontida de um relatório HTML: baixa as fontes declaradas
 * no <link> do Google Fonts, embute em base64 e remove as referências externas.
 *
 *   node build-standalone.mjs <entrada.html> <saida.html> [--subsets=latin]
 *
 * Por que filtrar subset: o Google devolve todos (cirílico, grego, vietnamita…).
 * Em português só `latin` é necessário — a diferença medida foi 1,2 MB → 390 KB.
 * Use `--subsets=latin,latin-ext` se o texto tiver acentuação do leste europeu.
 *
 * Depois de gerar, prove que é autocontido:
 *   node checa-render.mjs <saida.html> --offline
 */
import { writeFileSync, readFileSync, existsSync, statSync } from 'fs';

const args = process.argv.slice(2);
const [entrada, saida] = args.filter((a) => !a.startsWith('--'));
const subsets = (args.find((a) => a.startsWith('--subsets='))?.split('=')[1] ?? 'latin')
  .split(',')
  .map((s) => s.trim());

if (!entrada || !saida || !existsSync(entrada)) {
  console.error('Uso: node build-standalone.mjs <entrada.html> <saida.html> [--subsets=latin]');
  process.exit(2);
}

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36';

let html = readFileSync(entrada, 'utf8');

// 1. localiza os stylesheets de fonte
const links = [...html.matchAll(/<link[^>]+href="(https:\/\/fonts\.googleapis\.com\/css2[^"]+)"[^>]*>/g)];
if (!links.length) {
  console.log('Nenhum <link> do Google Fonts encontrado — o arquivo já pode ser autocontido.');
}

let faces = '';
let bytesFonte = 0;

for (const [, cssUrl] of links) {
  const css = await (await fetch(cssUrl.replace(/&amp;/g, '&'), { headers: { 'User-Agent': UA } })).text();

  // cada @font-face vem precedido de um comentário com o nome do subset
  const blocos = css
    .split(/(?=\/\*)/)
    .filter((b) => /@font-face/.test(b) && subsets.some((s) => new RegExp(`\\/\\*\\s*${s}\\s*\\*\\/`).test(b)));

  const totalBlocos = (css.match(/@font-face/g) || []).length;
  console.log(`  ${cssUrl.slice(0, 60)}… → ${blocos.length} de ${totalBlocos} blocos (subsets: ${subsets.join(', ')})`);

  for (const bloco of blocos) {
    const woff2 = bloco.match(/url\((https:\/\/[^)]+\.woff2)\)/)?.[1];
    if (!woff2) continue;
    const buf = Buffer.from(await (await fetch(woff2)).arrayBuffer());
    bytesFonte += buf.length;
    faces += bloco.replace(woff2, `data:font/woff2;base64,${buf.toString('base64')}`);
  }
}

// 2. remove preconnect e os stylesheets externos
html = html
  .replace(/<link rel="preconnect"[^>]*>\n?/g, '')
  .replace(/<link[^>]+href="https:\/\/fonts\.googleapis\.com\/css2[^"]+"[^>]*>\n?/g, '');

// 3. injeta as @font-face no topo do primeiro <style>
const i = html.indexOf('<style>');
if (i === -1) {
  console.error('Não achei um bloco <style> onde injetar as fontes.');
  process.exit(1);
}
const corte = i + '<style>'.length;
html =
  html.slice(0, corte) +
  '\n/* ===== Fontes embutidas — arquivo autocontido, funciona sem internet ===== */\n' +
  faces +
  '\n' +
  html.slice(corte);

writeFileSync(saida, html);

const restantes = [...html.matchAll(/(?:src|href)="(https?:\/\/[^"]+)"/g)].map((m) => m[1]);
console.log(`\n✓ ${saida} — ${Math.round(statSync(saida).size / 1024)} KB (fontes: ${Math.round(bytesFonte / 1024)} KB)`);
if (restantes.length) {
  console.warn(`⚠ ainda há ${restantes.length} referência(s) externa(s):`);
  [...new Set(restantes)].slice(0, 5).forEach((u) => console.warn(`  - ${u}`));
  console.warn('  O arquivo não é totalmente autocontido. Embuta ou remova antes de entregar.');
} else {
  console.log('✓ nenhuma referência externa restante.');
}
