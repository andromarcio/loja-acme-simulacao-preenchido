#!/usr/bin/env node
/**
 * Checagens de renderização de um relatório HTML.
 *
 *   node checa-render.mjs <arquivo.html> [--offline] [--larguras 1600,390]
 *
 * Verifica, no Chromium:
 *   - linhas de tabela com número de células diferente do cabeçalho
 *   - estouro horizontal, em cada largura pedida
 *   - blocos irmãos grudados (folga < 8px)
 *   - célula de coluna atômica (chave, PFB/PFL) partida em duas linhas
 *   - recursos externos que falham e erros de página
 *
 * --offline bloqueia toda a rede: serve para provar que um arquivo standalone
 * é mesmo autocontido.
 *
 * Sai com código 1 se achar problema, para poder entrar em verificação automática.
 */
import { existsSync } from 'fs';
import { resolve } from 'path';
import { pathToFileURL } from 'url';

/**
 * O playwright raramente está instalado ao lado da skill. Procura, nesta ordem:
 * o resolvedor padrão, a variável PLAYWRIGHT_MODULE e o node_modules do diretório atual.
 */
async function carregaChromium() {
  const candidatos = [
    'playwright',
    process.env.PLAYWRIGHT_MODULE,
    resolve(process.cwd(), 'node_modules/playwright/index.js'),
  ].filter(Boolean);
  for (const c of candidatos) {
    try {
      const mod = await import(c.startsWith('/') ? pathToFileURL(c).href : c);
      // playwright é CommonJS: conforme o caminho de resolução, o named export
      // pode não ser detectado e tudo vem em `default`.
      const chromium = mod.chromium ?? mod.default?.chromium;
      if (chromium) return chromium;
    } catch { /* tenta o próximo */ }
  }
  console.error(
    'Playwright não encontrado. Instale com `npm i playwright` em algum diretório e rode a\n' +
    'partir dele, ou aponte PLAYWRIGHT_MODULE para o index.js do pacote.\n' +
    'Se o navegador do ambiente for outro, aponte CHROMIUM_PATH para o executável.'
  );
  process.exit(2);
}
const chromium = await carregaChromium();

const args = process.argv.slice(2);
const arquivo = args.find((a) => !a.startsWith('--'));
const offline = args.includes('--offline');
const larguras = (args.find((a) => a.startsWith('--larguras='))?.split('=')[1] ?? '1600,390')
  .split(',')
  .map(Number);

if (!arquivo || !existsSync(arquivo)) {
  console.error('Uso: node checa-render.mjs <arquivo.html> [--offline] [--larguras=1600,390]');
  process.exit(2);
}

// O Chromium do ambiente pode não bater com a versão do pacote playwright.
const executablePath = process.env.CHROMIUM_PATH || undefined;
const browser = await chromium.launch(executablePath ? { executablePath } : {});
const url = 'file://' + resolve(arquivo);
const problemas = [];

for (const width of larguras) {
  const ctx = await browser.newContext({ viewport: { width, height: 1000 }, isMobile: width < 600 });
  if (offline) {
    await ctx.route('**', (r) => (r.request().url().startsWith('file://') ? r.continue() : r.abort()));
  }
  const page = await ctx.newPage();
  const externasFalhadas = [];
  const errosPagina = [];
  // o evento requestfailed entrega um Request; o handler de route entrega um Route
  page.on('requestfailed', (req) => {
    if (!req.url().startsWith('file://')) externasFalhadas.push(req.url());
  });
  page.on('pageerror', (e) => errosPagina.push(e.message));

  await page.goto(url);
  await page.waitForTimeout(700);

  const r = await page.evaluate(() => {
    const vw = document.documentElement.clientWidth;

    const tabelas = [];
    document.querySelectorAll('table').forEach((t, i) => {
      const cols = t.querySelectorAll('thead th').length;
      if (!cols) return;
      t.querySelectorAll('tbody tr').forEach((tr, j) => {
        if (tr.children.length !== cols)
          tabelas.push(`tabela ${i}, linha ${j}: ${tr.children.length} células para ${cols} colunas`);
      });
    });

    // elementos que furam a viewport, ignorando o que está dentro de contêiner rolável
    const estouros = [];
    document.querySelectorAll('body *').forEach((e) => {
      const box = e.getBoundingClientRect();
      if (box.width > 0 && box.right > vw + 1 && !e.closest('[style*="overflow"],.scroll,.tw'))
        estouros.push(`${e.tagName}.${(e.className || '').toString().slice(0, 20)}: ${(e.textContent || '').slice(0, 40)}`);
    });

    // irmãos grudados dentro de cada seção
    const grudados = [];
    document.querySelectorAll('section, main, article').forEach((sec) => {
      const kids = [...sec.children];
      for (let i = 1; i < kids.length; i++) {
        const a = kids[i - 1].getBoundingClientRect();
        const b = kids[i].getBoundingClientRect();
        const folga = Math.round(b.top - a.bottom);
        if (folga < 8 && a.height > 0 && b.height > 0)
          grudados.push(`${kids[i - 1].className || kids[i - 1].tagName} → ${kids[i].className || kids[i].tagName}: ${folga}px`);
      }
    });

    // Célula de coluna atômica partida no meio. "PDTIC25093-" / "49" e "4" / "(E)" são
    // duas linhas que o olho lê como dois valores — numa tabela de largura automática o
    // navegador reparte o espaço por volume de texto, e a coluna estreita é a primeira a
    // ser espremida.
    //
    // ARMADILHA DE MEDIÇÃO, custou 147 falsos positivos: não conte linha pela altura da
    // célula dividida pelo line-height (o padding entra na conta), nem por getClientRects
    // do elemento (o retângulo de um <code> filho conta como linha). Conte os topos
    // distintos dos retângulos de cada NÓ DE TEXTO — é o que o leitor vê.
    const linhasDoTexto = (el) => {
      let n = 0;
      const anda = (no) => {
        if (no.nodeType === 3 && no.textContent.trim()) {
          const rg = document.createRange();
          rg.selectNodeContents(no);
          n = Math.max(n, new Set([...rg.getClientRects()].map((x) => Math.round(x.top))).size);
        }
        no.childNodes.forEach(anda);
      };
      anda(el);
      return n;
    };
    const partidas = [];
    document.querySelectorAll('.col-id, .col-num').forEach((c) => {
      const txt = c.textContent.trim();
      if (txt && linhasDoTexto(c) > 1) partidas.push(`"${txt}" (${c.className}) em ${linhasDoTexto(c)} linhas`);
    });

    return {
      partidas: [...new Set(partidas)].slice(0, 10),
      overflowPagina: document.documentElement.scrollWidth > vw,
      tabelas,
      estouros: [...new Set(estouros)].slice(0, 10),
      grudados: [...new Set(grudados)].slice(0, 10),
    };
  });

  const rotulo = `${width}px`;
  if (r.tabelas.length) problemas.push(`[${rotulo}] colunas desalinhadas:\n  - ${r.tabelas.join('\n  - ')}`);
  if (r.overflowPagina) problemas.push(`[${rotulo}] a página rola horizontalmente`);
  if (r.estouros.length) problemas.push(`[${rotulo}] elementos furam a viewport:\n  - ${r.estouros.join('\n  - ')}`);
  if (r.grudados.length) problemas.push(`[${rotulo}] blocos grudados:\n  - ${r.grudados.join('\n  - ')}`);
  if (r.partidas.length)
    problemas.push(`[${rotulo}] coluna atômica com o valor partido em duas linhas:\n  - ${r.partidas.join('\n  - ')}`);
  if (externasFalhadas.length)
    problemas.push(`[${rotulo}] recursos externos que falharam:\n  - ${[...new Set(externasFalhadas)].join('\n  - ')}`);
  if (errosPagina.length) problemas.push(`[${rotulo}] erros de página:\n  - ${errosPagina.join('\n  - ')}`);

  console.log(`✓ verificado em ${rotulo}${offline ? ' (sem rede)' : ''}`);
  await ctx.close();
}

await browser.close();

if (problemas.length) {
  console.error('\n✗ problemas encontrados:\n\n' + problemas.join('\n\n'));
  process.exit(1);
}
console.log('\n✓ nenhum problema de renderização encontrado.');
