#!/usr/bin/env node
// proto-visual-diff.mjs — RECEITA de regressão visual (reforço OPCIONAL da fidelidade).
// Compara o protótipo aprovado com a tela implementada por SCREENSHOT-DIFF.
//
// ⚠️  Roda ONDE existem Playwright + o app renderizável — tipicamente o CI do
//     REPOSITÓRIO DE CÓDIGO (frontend), NÃO o repo de documentação. Requer:
//        npm i -D playwright        (o binário do Chromium já vem no ambiente padrão)
//     Sem playwright instalado, o script avisa e sai 2 (não trava nada).
//
// Uso:
//   node scripts/proto-visual-diff.mjs <protótipo.html|url> <implementado-url> \
//        [--threshold 0.03] [--viewport 1280x800]
//
// Sai 0 se a fração de pixels divergentes ≤ threshold; 1 se acima; 2 em erro/uso.
// A comparação roda no próprio navegador (canvas getImageData) — sem lib de imagem
// extra — com tolerância por canal para atenuar antialiasing/fonte fallback.

import { pathToFileURL } from 'node:url';

const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('Uso: proto-visual-diff.mjs <protótipo> <implementado-url> [--threshold n] [--viewport WxH]');
  process.exit(2);
}
const [proto, impl] = args;
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const threshold = parseFloat(opt('--threshold', '0.03'));
const [vw, vh] = opt('--viewport', '1280x800').split('x').map(Number);
const asUrl = (s) => (/^https?:\/\//.test(s) ? s : pathToFileURL(s).href);

let chromium;
try { ({ chromium } = await import('playwright')); }
catch {
  console.error('playwright não instalado neste repositório. Rode no CI do repositório de código: `npm i -D playwright` e execute lá.');
  process.exit(2);
}

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: vw, height: vh } });
  const shot = async (u) => {
    await page.goto(u, { waitUntil: 'networkidle' });
    return (await page.screenshot({ fullPage: true })).toString('base64');
  };
  const a = await shot(asUrl(proto));
  const b = await shot(asUrl(impl));
  const cmp = await page.evaluate(async ([a, b]) => {
    const load = (d) => new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.src = 'data:image/png;base64,' + d; });
    const [ia, ib] = await Promise.all([load(a), load(b)]);
    const w = Math.max(ia.width, ib.width), h = Math.max(ia.height, ib.height);
    const pixels = (im) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.drawImage(im, 0, 0); return x.getImageData(0, 0, w, h).data; };
    const da = pixels(ia), db = pixels(ib);
    const tol = 24; let diff = 0;
    for (let i = 0; i < da.length; i += 4) {
      if (Math.abs(da[i] - db[i]) > tol || Math.abs(da[i + 1] - db[i + 1]) > tol || Math.abs(da[i + 2] - db[i + 2]) > tol) diff++;
    }
    return { ratio: diff / (w * h), w, h };
  }, [a, b]);
  const pct = (cmp.ratio * 100).toFixed(2);
  if (cmp.ratio <= threshold) {
    console.log(`✓ fidelidade visual OK — ${pct}% de pixels divergentes (limite ${(threshold * 100).toFixed(2)}%).`);
    process.exit(0);
  }
  console.error(`✗ divergência visual ${pct}% > limite ${(threshold * 100).toFixed(2)}% (${cmp.w}×${cmp.h}) — revise a implementação contra o protótipo aprovado.`);
  process.exit(1);
} finally {
  await browser.close();
}
