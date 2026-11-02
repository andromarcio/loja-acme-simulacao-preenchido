"""Regressao visual: python scripts/testa-visual-pages.py (Playwright + Edge/Chromium)."""

from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
import os
import re
from pathlib import Path
import shutil
import subprocess
import tempfile
from threading import Thread
import unittest

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
FEATURE = "modules/vendas/checkout/f-calcular-frete.md"


# Contraste do primeiro link de tabela do dashboard com o fundo atrás dele (WCAG).
LINK_CONTRAST = """() => {
  const rgb = color => color.match(/[\\d.]+/g).map(Number);
  const luminance = ([r, g, b]) => [r, g, b].map(v => (v /= 255) <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4)
    .reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
  const link = document.querySelector('.dashboard-view .custom-table td a');
  let node = link, background;
  do { background = rgb(getComputedStyle(node).backgroundColor); node = node.parentElement; } while (node && background[3] === 0);
  const [a, b] = [luminance(rgb(getComputedStyle(link).color)), luminance(background)];
  return (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
}"""


class Handler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


class VisualPagesTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = ThreadingHTTPServer(
            ("127.0.0.1", 0), partial(Handler, directory=str(ROOT))
        )
        cls.thread = Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.base = f"http://127.0.0.1:{cls.server.server_port}"
        cls.pw = sync_playwright().start()
        executable = os.environ.get("SIM_BROWSER")
        edge = Path(r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe")
        if executable is None and edge.exists():
            executable = str(edge)
        cls.browser = cls.pw.chromium.launch(
            headless=True, **({"executable_path": executable} if executable else {})
        )

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.pw.stop()
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join()

    def setUp(self):
        self.context = self.browser.new_context()
        self.context.route("https://**", lambda route: route.abort())
        self.page = self.context.new_page()
        self.errors = []
        self.page.on("pageerror", lambda error: self.errors.append(str(error)))
        self.page.goto(self.base + "/index.html#global/N0_PRODUCT_VISION.md")
        self.page.locator("#documentContainer h1").wait_for()

    def tearDown(self):
        self.context.close()
        self.assertEqual(self.errors, [])

    def assert_visual(self, theme):
        actual = self.page.evaluate("""() => {
          const css = getComputedStyle(document.documentElement);
          const heading = getComputedStyle(document.querySelector('#documentContainer h1'));
          return {
            bg: css.getPropertyValue('--bg').trim(),
            primary: css.getPropertyValue('--primary').trim(),
            font: getComputedStyle(document.body).fontFamily,
            mono: css.getPropertyValue('--font-mono'),
            header: getComputedStyle(document.querySelector('.app-header')).height,
            border: heading.borderBottomWidth,
            gap: heading.paddingBottom,
            highlight: heading.borderBottomColor,
            panel: getComputedStyle(document.querySelector('#documentContainer')).paddingTop,
            section: getComputedStyle(document.querySelector('#documentContainer .doc-section')).borderWidth
          };
        }""")
        self.assertEqual(actual["bg"], "#f7fbfd" if theme == "light" else "#062b4b")
        self.assertEqual(actual["primary"], "#005ca9" if theme == "light" else "#3bb9eb")
        self.assertIn("Inter", actual["font"])
        self.assertIn("JetBrains Mono", actual["mono"])
        self.assertEqual(actual["header"], "68px")
        self.assertEqual(actual["border"], "4px")
        self.assertEqual(actual["gap"], "3px")
        self.assertEqual(actual["highlight"], "rgb(243, 146, 0)")
        # Em todo documento, cada seção é um card e o contêiner não é.
        self.assertEqual(actual["panel"], "0px")
        self.assertEqual(actual["section"], "1px")

    def test_shell_and_theme(self):
        self.assertEqual(self.page.locator("#brandSigla").inner_text(), "LACME")
        self.assertEqual(self.page.locator("#brandLink").get_attribute("aria-label"), "LACME — Loja ACME — Docqui Caixa — início")
        self.assertEqual(self.page.locator(".sidebar__search #searchInput").count(), 1)
        self.assertEqual(self.page.locator(".app-header #breadcrumbBar").count(), 1)
        self.assertEqual(self.page.locator(".header-center").count(), 0)
        for imagem in [".brand__docqui", ".brand__caixa--positiva", ".brand__caixa--negativa"]:
            self.assertTrue(self.page.locator(imagem).evaluate("el => el.complete && el.naturalWidth > 0"), imagem)
        github = self.page.locator(".app-header .header-right .btn-github")
        self.assertEqual(github.get_attribute("href"), "https://github.com/CAIXA-EFRS/loja-acme-doc")
        self.assertEqual(self.page.locator('#sidebar a[href*="github.com"]').count(), 0)
        self.assertEqual(self.page.locator('a[href="#mentoria/README.md"]').count(), 1)
        self.assertEqual(self.page.locator('a[href="mentoria/simulador.html"]').count(), 1)
        self.assertEqual(self.page.locator('#sidebar a[href="#__dashboard__"]').count(), 1)
        ids = self.page.evaluate("() => [...document.querySelectorAll('[id]')].map(el => el.id)")
        self.assertEqual(len(ids), len(set(ids)))
        for theme in ["light", "dark"]:
            self.page.evaluate("(theme) => document.documentElement.dataset.theme = theme", theme)
            self.assert_visual(theme)
        style = self.page.add_style_tag(content="#documentContainer h1 { border-bottom: 0 !important; }")
        with self.assertRaises(AssertionError):
            self.assert_visual("dark")
        style.evaluate("el => el.remove()")

    def test_local_styles_skip_stale_cache(self):
        # Todo CSS local entra com ?v=, como o JS do dashboard: um CSS em cache com o JS novo, depois
        # de um deploy, deixava o filtro de domínio sem estilo.
        stale = self.page.evaluate("""() => [...document.querySelectorAll('link[rel="stylesheet"]')]
          .map(link => link.getAttribute('href')).filter(href => href.startsWith('assets/') && !href.includes('?v='))""")
        self.assertEqual(stale, [])

    def test_header_sigla_and_docqui_caixa(self):
        # A sigla do MASTER em destaque; à direita, o docqui sobre a marca oficial da Caixa, os dois
        # alinhados à esquerda, com a marca positiva no tema claro e a negativa no escuro.
        medidas = """() => {
          const caixa = [...document.querySelectorAll('.brand__caixa')].filter(el => el.offsetParent);
          const r = el => el.getBoundingClientRect();
          return {caixa: caixa.map(el => el.getAttribute('src').split('/').pop()),
                  docqui: r(document.querySelector('.brand__docqui')).left, marca: caixa.map(el => r(el).left),
                  sigla: r(document.querySelector('.brand-sigla')).height, assinatura: r(document.querySelector('.brand__docqui')).height,
                  visivel: !!document.querySelector('.brand-marca').offsetParent};
        }"""
        for width in [1440, 390]:
            self.page.set_viewport_size({"width": width, "height": 900})
            for tema, arquivo in [("light", "CAIXA_2cores_positiva.png"), ("dark", "CAIXA_2cores_negativa.png")]:
                with self.subTest(width=width, tema=tema):
                    self.page.evaluate("(theme) => document.documentElement.dataset.theme = theme", tema)
                    m = self.page.evaluate(medidas)
                    self.assertEqual(m["caixa"], [arquivo])
                    self.assertAlmostEqual(m["marca"][0], m["docqui"], delta=0.5)
                    self.assertGreater(m["sigla"], m["assinatura"] * 0.8)
        # Na tela estreita, fica só a sigla.
        self.page.set_viewport_size({"width": 340, "height": 900})
        m = self.page.evaluate(medidas)
        self.assertFalse(m["visivel"])
        self.assertTrue(self.page.locator("#brandSigla").is_visible())
        # Com o MASTER ainda no template, sem a sigla, o header mostra o nome do sistema.
        def tree(route):
            corpo = route.fetch().text()
            self.assertIn("**Sigla**: LACME", corpo)
            route.fulfill(body=corpo.replace("**Sigla**: LACME", "**Sigla**: [SIGLA]"),
                          content_type="application/javascript; charset=utf-8")
        self.page.route("**/assets/tree.js*", tree)
        self.page.reload()
        self.page.locator("#documentContainer h1").wait_for()
        self.assertEqual(self.page.locator("#brandSigla").inner_text(), "Loja ACME")
        self.page.unroute("**/assets/tree.js*")

    def test_mode_toggle_only_in_complete_profile(self):
        # O botão Visão PO/Técnico só existe no perfil completo. No requisitos (o desta instância), a
        # página fica na Visão PO, mesmo com a preferência "Técnico" gravada no navegador.
        self.page.evaluate("localStorage.setItem('dev-only-pref', 'show')")
        def servir_tree(perfil):
            # Fábrica, não parâmetro padrão: o Playwright passa (route, request) ao handler.
            def tree(route):
                corpo = route.fetch().text()
                self.assertIn("**Perfil**: `requisitos`", corpo)
                route.fulfill(body=corpo.replace("**Perfil**: `requisitos`", f"**Perfil**: `{perfil}`"),
                              content_type="application/javascript; charset=utf-8")
            return tree

        for perfil in ["requisitos", "completo"]:
            with self.subTest(perfil=perfil):
                self.page.route("**/assets/tree.js*", servir_tree(perfil))
                # Só o hash muda em relação à página aberta: sem o reload, o tree.js não seria lido de novo.
                self.page.goto(self.base + "/index.html#" + FEATURE)
                self.page.reload()
                self.page.locator("#documentContainer h1").wait_for()
                botao = self.page.locator(".view-mode-toggle")
                tecnico = "document.documentElement.classList.contains('app-show-dev')"
                if perfil == "requisitos":
                    self.assertEqual(botao.count(), 0)
                    self.assertFalse(self.page.evaluate(tecnico))
                else:
                    self.assertEqual(botao.count(), 1)
                    self.assertTrue(self.page.evaluate(tecnico))
                    self.page.locator("#btnModePO").click()
                    self.assertFalse(self.page.evaluate(tecnico))
                self.page.unroute("**/assets/tree.js*")

    def test_search_mobile_and_diagrams(self):
        for width in [1440, 390, 320]:
            self.page.set_viewport_size({"width": width, "height": 900})
            if width < 820:
                # Entrar no móvel fecha o menu pelo `change` do matchMedia, que chega um quadro depois
                # do redimensionamento: o Ctrl+K antes dele abre o menu que o evento fecha em seguida.
                # O CSS já esconde o menu ao redimensionar; só o script muda o aria-expanded.
                self.page.locator('#toggleSidebarBtn[aria-expanded="false"]').wait_for()
            self.page.keyboard.press("Control+k")
            self.page.locator("#searchInput").fill("Calcular Frete")
            self.page.locator(f'.search-result-item[href="#{FEATURE}"]').click()
            self.page.locator("#documentContainer .doc-title").wait_for()
            self.assertLessEqual(self.page.evaluate("document.documentElement.scrollWidth"), width)
            for theme in ["light", "dark"]:
                self.page.evaluate("(theme) => document.documentElement.dataset.theme = theme", theme)
                self.assert_visual(theme)
            self.page.keyboard.press("Control+k")
            self.page.locator("#searchInput").fill("termo-inexistente-xyz")
            self.assertEqual(self.page.locator(".search-result-item").count(), 0)
            self.page.keyboard.press("Escape")
            if width < 820:
                self.assertFalse(self.page.locator("#sidebar").is_visible())
                self.page.locator("#toggleSidebarBtn").click()
                self.assertTrue(self.page.locator("#searchInput").is_visible())
                self.page.locator("#sidebarBackdrop").click(position={"x": width - 5, "y": 5})
                self.assertFalse(self.page.locator("#sidebar").is_visible())
        self.page.evaluate("navigateTo('modules/vendas/checkout/README.md')")
        self.page.locator(".mermaid .node rect.label-container").first.wait_for()
        self.page.evaluate("navigateTo('__mapa__')")
        self.page.locator(".mm-product-name").wait_for()
        self.assertIn("Loja ACME", self.page.locator(".mm-product-name").inner_text())

    def test_initial_load_and_menu(self):
        # Sem rota, o site abre no dashboard, com o menu recolhido.
        self.page.goto(self.base + "/index.html")
        self.page.locator("#dashboardDomain").wait_for()
        self.assertEqual(self.page.locator("#toggleSidebarBtn").get_attribute("aria-expanded"), "false")
        self.assertFalse(self.page.locator("#searchInput").is_visible())
        menu = self.page.evaluate("""() => ({
          fixos: [...document.querySelector('#sidebar .sidebar-section .nav-list').children].map(li => li.textContent.trim()),
          pastas: [...document.querySelectorAll('#sidebar .sidebar-navigation > .sidebar-section > details.nav-folder')].map(d => d.id),
          outros: [...document.querySelectorAll('#outrosFolder a')].map(a => a.textContent.trim()),
          texto: document.getElementById('sidebar').textContent,
        })""")
        self.assertEqual(menu["fixos"], ["Dashboard de gestão", "Visão do Produto (N0)", "Mapa de Funcionalidades (Árvore)",
                                       "Análises de impacto (AIMM)"])
        self.assertEqual(menu["pastas"], ["fddFolder", "globalFolder", "prototypesFolder", "outrosFolder"])
        self.assertEqual(menu["outros"], ["Insumos de levantamento", "Roteiro da demonstração",
                                          "Simulador Docqui Caixa ↗", "Grafo de Rastreabilidade ↗"])
        self.assertNotIn("Início / Visão Geral", menu["texto"])
        self.assertNotIn("Artefatos de Suporte", menu["texto"])
        # Abrir um item de Outros expande a pasta; o Ctrl+K abre o menu e a busca.
        self.page.evaluate("navigateTo('mentoria/README.md')")
        self.assertTrue(self.page.locator("#outrosFolder").evaluate("d => d.open"))
        self.page.keyboard.press("Control+k")
        self.assertTrue(self.page.locator("#searchInput").is_visible())
        # Com rota, abre a página pedida.
        self.page.goto(self.base + "/index.html#" + FEATURE)
        self.page.locator("#documentContainer .doc-title").wait_for()
        self.assertEqual(self.page.locator("#documentContainer .doc-title").inner_text(), "Calcular Frete")

    def test_impact_menu_opens_index_and_ticket_on_desktop_and_mobile(self):
        for width in [1440, 390, 320]:
            with self.subTest(width=width):
                self.page.set_viewport_size({"width": width, "height": 900})
                self.page.goto(self.base + "/index.html")
                self.page.locator("#dashboardDomain").wait_for()
                self.page.locator("#toggleSidebarBtn").click()
                link = self.page.locator('#sidebar a[data-path="analise-impacto/INDEX.md"]')
                self.assertEqual(link.count(), 1, "o acesso não pode ser duplicado em Outros")
                self.assertEqual(self.page.locator('#outrosFolder a[data-path="analise-impacto/INDEX.md"]').count(), 0)
                self.assertTrue(link.is_visible())
                self.assertEqual(link.inner_text().strip(), "Análises de impacto (AIMM)")
                link.click()
                self.page.wait_for_url("**#analise-impacto/INDEX.md")
                self.assertEqual(self.page.locator("#documentContainer h1").inner_text(), "Análises de Impacto — Loja ACME")
                self.assertIn("active", link.get_attribute("class") or "")
                reports = self.page.locator('#documentContainer a[href^="#analise-impacto/AIMM-"][href$=".md"]')
                self.assertEqual(reports.count(), 9)
                reports.first.click()
                self.page.wait_for_url("**#analise-impacto/AIMM-STRY0013101.md")
                # A URL muda antes de a AIMM renderizar: espera o título dela, não o do índice.
                self.page.wait_for_function("() => document.querySelector('#documentContainer h1')?.textContent === 'AIMM STRY0013101'", timeout=5000)
                self.assertEqual(self.page.locator("#documentContainer h1").inner_text(), "AIMM STRY0013101")
                self.assertLessEqual(self.page.evaluate("document.documentElement.scrollWidth"), width)

    def test_diagrams_use_elk_layout(self):
        # Os diagramas saem no layout ELK, que vem no próprio Mermaid 12: as arestas do fluxo do
        # N2 são ortogonais — só M, L e Q (cantos arredondados), cada L na horizontal ou na
        # vertical. No dagre elas são curvas (C), e com o site trocado para ele a checagem acusa.
        def orthogonal(path):
            if re.search(r"[^MLQ0-9.,\s-]", path):
                return False
            x = y = None
            for command, args in re.findall(r"([MLQ])([^MLQ]*)", path):
                numbers = [float(n) for n in re.findall(r"-?\d+(?:\.\d+)?", args)]
                if command == "L" and x is not None and abs(numbers[0] - x) > .5 and abs(numbers[1] - y) > .5:
                    return False
                x, y = numbers[-2], numbers[-1]
            return True

        def edges(layout=None):
            page = self.context.new_page()
            if layout:
                def swap(route):
                    response = route.fetch()
                    route.fulfill(response=response, body=response.text().replace("layout: 'elk'", f"layout: '{layout}'"))
                page.route("**/index.html", swap)
            page.goto(self.base + "/index.html#modules/vendas/checkout/README.md")
            page.locator("#documentContainer .mermaid svg").first.wait_for()
            paths = page.evaluate("() => [...document.querySelectorAll('#documentContainer .mermaid .edgePaths path')].map(p => p.getAttribute('d'))")
            page.close()
            return paths

        paths = edges()
        self.assertEqual(len(paths), 4)
        self.assertTrue(all(orthogonal(path) for path in paths), paths)
        self.assertFalse(all(orthogonal(path) for path in edges("dagre")))

    def test_menu_orders_features_by_id(self):
        # No menu, os N3 de um Feature Set seguem o ID, não o nome do arquivo; o N3 sem ID
        # vai para o fim. Os N3 extras só existem na página: pelo caminho, a ordem seria outra.
        def order():
            return self.page.evaluate("""() => [...document.querySelectorAll('#fs-vendas-checkout .feature-item')]
              .map(a => a.dataset.path.split('/').pop())""")
        self.assertEqual(order(), ["f-calcular-frete.md"])
        self.page.evaluate("""() => {
          const n3 = (id, nome) => `---\\nid: ${id}\\n---\\n\\n# ${nome}\\n`;
          Object.entries({
            'modules/vendas/checkout/f-aplicar-cupom.md': n3('VND-CHK-10', 'Aplicar Cupom'),
            'modules/vendas/checkout/f-exibir-prazo.md': n3('VND-CHK-02', 'Exibir Prazo'),
            'modules/vendas/checkout/f-a-sem-id.md': '# Sem ID\\n',
          }).forEach(([path, text]) => { repoFiles.push(path); repoFilesContent[path] = text; });
          repoFiles.sort();
          buildFDDTree();
        }""")
        self.assertEqual(order(), ["f-calcular-frete.md", "f-exibir-prazo.md", "f-aplicar-cupom.md", "f-a-sem-id.md"])

    def test_n3_scenarios_tags_and_background(self):
        # O esperado vem do .md: as tags e os comentários "# ←" logo acima de cada Scenario,
        # e os passos do Background.
        gherkin = (ROOT / FEATURE).read_text(encoding="utf-8").split("```gherkin")[1].split("```")[0]
        esperado, acima, fundo, no_fundo = [], [], [], False
        for linha in (l.strip() for l in gherkin.splitlines()):
            if linha.startswith("Background:"):
                no_fundo = True
            elif linha.startswith("Scenario:"):
                no_fundo = False
                esperado.append({
                    "titulo": linha.split(":", 1)[1].strip(),
                    "rn": [t for l in acima if l.startswith("@") for t in l.split()],
                    "dic": [l.split("←", 1)[1].strip() for l in acima if l.startswith("# ←")],
                })
                acima = []
            elif linha.startswith(("#", "@")):
                acima.append(linha)
            elif linha and no_fundo:
                fundo.append(linha.split(" ", 1)[1])
            elif linha:
                acima = []
        self.assertEqual(len(esperado), 7)
        self.assertIn(["@RN-03"], [e["rn"] for e in esperado])
        self.assertIn(["FIELD-DICTIONARY: CEP"], [e["dic"] for e in esperado])
        self.assertEqual(len(fundo), 2)

        self.page.goto(self.base + "/index.html#" + FEATURE)
        self.page.locator("#documentContainer .scenario-card").first.wait_for()
        cards = self.page.evaluate("""() => [...document.querySelectorAll('#documentContainer .scenario-card')].map(c => ({
          fundo: c.classList.contains('scenario-background'),
          titulo: c.querySelector('.scenario-title') ? c.querySelector('.scenario-title').textContent.replace(/^Cenário:\\s*/, '').trim() : null,
          rn: [...c.querySelectorAll('.scenario-header .rn-num')].map(b => '@' + b.textContent.trim()),
          dic: [...c.querySelectorAll('.scenario-header .rn-tag')].map(b => b.title),
          corpo: c.querySelector('.scenario-body').textContent,
        }))""")
        self.assertTrue(cards and cards[0]["fundo"], "o Background abre a seção de cenários")
        for passo in fundo:
            self.assertIn(passo, cards[0]["corpo"])
        self.assertEqual([{k: c[k] for k in ("titulo", "rn", "dic")} for c in cards[1:]], esperado)

    def test_n3_hides_uncounted_metrics(self):
        # A "Métricas de tamanho" sem nada contado não vira card; contada, com PF 0 ou com PE
        # reutilizado (↪), vira. O .md continua com a seção — é só a apresentação.
        self.assertIn("## Métricas de tamanho", (ROOT / FEATURE).read_text(encoding="utf-8"))
        self.page.evaluate("(rel) => navigateTo(rel)", FEATURE)
        self.page.locator("#documentContainer .doc-hero-card").wait_for()
        titulos = self.page.evaluate("""() => [...document.querySelectorAll('#documentContainer .section-title')]
          .map((t) => t.textContent.trim())""")
        self.assertIn("Campos", titulos)
        self.assertNotIn("Métricas de tamanho", titulos)

        def com_metricas(linha, memoria=False, filtro=True):
            return self.page.evaluate("""([path, linha, memoria, filtro]) => {
              const { data, content } = parseFrontMatter(repoFilesContent[path]);
              const tabela = '| Função de Transação | Papel | Tipo | ALR | DER | Complexidade | PF | Data |\\n|---|---|---|---|---|---|---|---|\\n' + linha + '\\n';
              const md = content.replace(/## Métricas de tamanho\\n[\\s\\S]*?(?=\\n## )/,
                '## Métricas de tamanho\\n\\n' + tabela + (memoria ? '\\n### Memória de cálculo\\n\\nx\\n' : ''));
              const original = window.metricasVazia;
              if (!filtro) window.metricasVazia = () => false;
              try { return renderN3FeatureTemplate(path, 'x', data, md).includes('Métricas de tamanho'); }
              finally { window.metricasVazia = original; }
            }""", [FEATURE, linha, memoria, filtro])

        pendente = "| Calcular Frete | principal | — | — | — | — | — | — |"
        self.assertFalse(com_metricas(pendente))
        self.assertTrue(com_metricas("| Calcular Frete | principal | SE | 2 | 5 | Baixa | 4 | 2026-10-18 |", memoria=True))
        self.assertTrue(com_metricas("| Calcular Frete | principal | — | — | — | — | 0 | 2026-10-18 |"))
        self.assertTrue(com_metricas("| Consultar Faixa | acessório | ↪ [ADM-FRT-01](x.md) | — | — | — | — | — |"))
        self.assertTrue(com_metricas(pendente, memoria=True))
        # Controle negativo: sem o filtro, a mesma seção pendente aparece — é ele que a oculta.
        self.assertTrue(com_metricas(pendente, filtro=False))

    def test_sections_as_cards(self):
        # Todo documento põe cada seção num card, como o N3. Nos genéricos, um card com título
        # por rubrica `## ` do .md (fora de cerca de código), com o título e a apresentação no
        # primeiro; N1 e N2 já montam hero e seções. Dashboard e mapa ficam como eram.
        def rubricas(rel):
            cerca, titulos = False, []
            for linha in (ROOT / rel).read_text(encoding="utf-8").splitlines():
                if linha.lstrip().startswith(("```", "~~~")):
                    cerca = not cerca
                elif not cerca and linha.startswith("## "):
                    titulos.append(linha[3:].strip())
            return titulos
        genericos = ["global/N0_PRODUCT_VISION.md", "global/DATA-MODEL.md", "global/NFR.md",
                     "analise-impacto/AIMM-STRY0013101.md", "mentoria/README.md"]
        espacos = []
        for rel in genericos + ["modules/vendas/README.md", "modules/vendas/checkout/README.md", FEATURE]:
            self.page.evaluate("(rel) => navigateTo(rel)", rel)
            self.page.wait_for_function("document.getElementById('documentContainer').classList.contains('doc-cards')")
            info = self.page.evaluate("""() => {
              const c = document.getElementById('documentContainer');
              const blocos = [...c.querySelectorAll('.doc-section, .doc-hero-card')];
              return {
                painel: getComputedStyle(c).borderTopWidth,
                semCard: blocos.filter((e) => getComputedStyle(e).borderTopWidth !== '1px').length,
                titulos: [...c.querySelectorAll('.doc-section > .section-header .section-title')].map((t) => t.textContent.trim()),
              };
            }""")
            self.assertEqual(info["painel"], "0px", rel)
            self.assertEqual(info["semCard"], 0, rel)
            if rel in genericos:
                self.assertEqual(info["titulos"], rubricas(rel), rel)
            else:
                # No hero do N1, do N2 e do N3, a Descrição tem o título das demais seções e a
                # mesma distância até a linha.
                espacos.append(self.page.evaluate("""() => {
                  const b = document.querySelector('.hero-description-block');
                  const t = b && b.querySelector(':scope > .section-header .section-title');
                  return t ? Math.round(t.getBoundingClientRect().top - b.getBoundingClientRect().top) : null;
                }"""))
        self.assertEqual(len(set(espacos)), 1, espacos)
        self.assertIsNotNone(espacos[0])
        self.assertGreater(len(rubricas("global/N0_PRODUCT_VISION.md")), 5)
        for rota in ["__dashboard__", "__mapa__"]:
            self.page.evaluate("(r) => navigateTo(r)", rota)
            self.page.wait_for_timeout(300)
            self.assertFalse(self.page.evaluate("document.getElementById('documentContainer').classList.contains('doc-cards')"), rota)

    def test_aimm_and_old_bookmarks(self):
        old = "analise-impacto/AIM-STRY0013101"
        current = "analise-impacto/AIMM-STRY0013101"
        self.page.goto(self.base + "/index.html#" + old + ".md")
        self.page.locator("#documentContainer h1").wait_for()
        self.page.wait_for_url("**#" + current + ".md")
        self.assertIn("AIMM STRY0013101", self.page.locator("#documentContainer h1").inner_text())
        self.page.goto(self.base + "/" + old + ".html")
        self.page.wait_for_url("**/" + current + ".html")
        self.assertIn("AIMM STRY0013101", self.page.locator("h1").inner_text())

    def test_graph_and_simulator_preserved(self):
        self.page.goto(self.base + "/rastreabilidade/index.html")
        self.page.wait_for_function("window.TRACE_DATA && document.querySelector('#graph').children.length")
        for theme, bg in [("light", "#f7fbfd"), ("dark", "#062b4b")]:
            self.page.evaluate("(theme) => document.documentElement.dataset.theme = theme", theme)
            self.assertEqual(self.page.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--bg').trim()"), bg)
        data = self.page.evaluate("window.TRACE_DATA")
        self.assertEqual(len(data["nodes"]), 54)
        self.assertEqual(len(data["edges"]), 84)
        self.assertTrue(any(n["id"] == "VND-CHK-01" for n in data["nodes"]))
        # O visualizador legado nao reconhece o no aim; erro confirmado no HEAD anterior.
        self.assertEqual(self.errors, ["Cannot read properties of undefined (reading 'r')"])
        self.errors.clear()
        self.page.goto(self.base + "/mentoria/simulador.html")
        self.page.locator("#prog-t").wait_for()
        self.page.locator("#p-requisitos").click()
        self.assertEqual(self.page.locator("#p-requisitos").get_attribute("aria-pressed"), "true")

    def test_dashboard_indicators_filter_and_navigation(self):
        self.page.evaluate("navigateTo('__dashboard__')")
        self.page.locator("#dashboardDomain").wait_for()

        def metric(name):
            return int(self.page.locator(f'[data-metric="{name}"] > strong').inner_text())

        expected = {"n1": 4, "n2": 8, "n3": 31, "artifacts": 43, "approved": 25,
                    "specified": 25, "waiting": 6, "inconsistent": 0, "ungoverned": 0,
                    "missing": 0, "countPending": 31, "countReviewed": 0, "dataModels": 4,
                    "prototypes": 8}
        for name, value in expected.items():
            self.assertEqual(metric(name), value, name)
        branches = metric("branches")
        self.assertGreaterEqual(branches, 1)
        # O filtro abre a lista abaixo do campo, sem cobri-lo, e a seta tem folga da borda; uma
        # lista posta sobre o campo reprova a checagem.
        def list_below_field():
            field = self.page.locator("#dashboardDomain > summary").bounding_box()
            items = self.page.locator("#dashboardDomain > ul").bounding_box()
            self.assertGreaterEqual(items["y"], field["y"] + field["height"])
            self.assertGreaterEqual(self.page.evaluate("""() => {
              const field = document.querySelector('#dashboardDomain > summary');
              return parseFloat(getComputedStyle(field).paddingRight) + parseFloat(getComputedStyle(field, '::after').marginRight);
            }"""), 8)
        self.page.locator("#dashboardDomain > summary").click()
        list_below_field()
        style = self.page.add_style_tag(content="#dashboardDomain > ul { top: 0 !important; }")
        with self.assertRaises(AssertionError):
            list_below_field()
        style.evaluate("el => el.remove()")
        self.page.keyboard.press("Escape")
        self.assertFalse(self.page.evaluate("document.getElementById('dashboardDomain').open"))
        self.page.locator("#dashboardDomain > summary").click()
        self.page.get_by_role("button", name="VND — Vendas", exact=True).click()
        self.assertEqual(self.page.locator("#dashboardDomain > summary").inner_text(), "VND — Vendas")
        self.assertEqual(metric("n3"), 8)
        self.assertEqual(metric("branches"), branches)
        for width in [1440, 390, 320]:
            self.page.set_viewport_size({"width": width, "height": 900})
            for theme in ["light", "dark"]:
                self.page.evaluate("(theme) => document.documentElement.dataset.theme = theme", theme)
                self.page.wait_for_function("document.documentElement.scrollWidth <= innerWidth")
                self.assertGreaterEqual(self.page.evaluate(LINK_CONTRAST), 4.5, theme)
                self.assertLessEqual(self.page.evaluate("document.documentElement.scrollWidth"), width)
        self.page.locator(f'.dashboard-view a[href="#{FEATURE}"]').first.click()
        self.page.locator("#documentContainer .doc-title").wait_for()
        self.assertFalse(self.page.locator("#documentContainer").evaluate("el => el.classList.contains('dashboard-view')"))

    def test_dashboard_missing_data_and_untrusted_label(self):
        self.page.evaluate("navigateTo('__dashboard__')")
        self.page.locator("#dashboardDomain").wait_for()
        self.page.evaluate("window.savedDashboard = DASHBOARD_DATA; delete window.DASHBOARD_DATA; renderDashboard()")
        self.assertTrue(self.page.locator('[role="alert"]').is_visible())
        self.assertEqual(self.page.locator('[data-metric="n3"]').count(), 0)
        self.page.evaluate("""() => {
          window.DASHBOARD_DATA = structuredClone(savedDashboard);
          DASHBOARD_DATA.artifacts[0].title = '<img src=x onerror="window.dashboardInjected=true">';
          renderDashboard();
        }""")
        self.assertEqual(self.page.locator('.dashboard-view img[src="x"]').count(), 0)
        # Sinal próprio: o Mermaid 12 deixa uma global `injected` na página.
        self.assertFalse(self.page.evaluate("Boolean(window.dashboardInjected)"))
        self.page.evaluate("window.DASHBOARD_DATA = savedDashboard; renderDashboard()")

    def test_branch_preview_highlights_inside_cards(self):
        # O site montado como no CI (monta-site-preview.mjs), com uma sprint que altera o N3:
        # "Destacar alterações" marca só o que mudou, dentro do card de cada mudança.
        with tempfile.TemporaryDirectory() as tmp:
            repo = Path(tmp, "repo")
            listed = subprocess.run(["git", "ls-files", "-co", "--exclude-standard", "-z"],
                                    cwd=ROOT, capture_output=True, check=True).stdout.decode("utf-8")
            for rel in filter(None, listed.split("\0")):
                if (ROOT / rel).is_file():
                    (repo / rel).parent.mkdir(parents=True, exist_ok=True)
                    shutil.copy2(ROOT / rel, repo / rel)

            def git(*args):
                return subprocess.run(["git", "-c", "user.name=teste", "-c", "user.email=teste@exemplo.invalid", *args],
                                      cwd=repo, capture_output=True, check=True, text=True).stdout.strip()

            git("init", "-q", "-b", "main")
            git("add", "-A")
            git("commit", "-qm", "main")
            git("checkout", "-qb", "sprint/demo")
            text = (repo / FEATURE).read_text(encoding="utf-8")
            for old, new in [("oito dígitos numéricos.", "oito algarismos, sem traço."),
                             ("| entrada do usuário |", "| entrada do cliente |")]:
                self.assertIn(old, text)
                text = text.replace(old, new, 1)
            (repo / FEATURE).write_text(text, encoding="utf-8")
            git("commit", "-qam", "STRY0013120: CEP sem traço")
            prs = Path(tmp, "prs.json")
            prs.write_text(json.dumps([{"branch": "sprint/demo", "head": git("rev-parse", "HEAD"), "base": "main",
                                        "number": 1, "url": "https://github.com/exemplo/loja/pull/1",
                                        "state": "open", "draft": False, "merged": False}]))
            git("update-ref", "refs/remotes/origin/sprint/demo", "HEAD")
            git("checkout", "-q", "main")
            git("update-ref", "refs/remotes/origin/main", "main")
            subprocess.run(["node", "scripts/monta-site-preview.mjs", "--out", "_site", "--pull-requests", str(prs)],
                           cwd=repo, capture_output=True, check=True)

            server = ThreadingHTTPServer(("127.0.0.1", 0), partial(Handler, directory=str(repo / "_site")))
            Thread(target=server.serve_forever, daemon=True).start()
            preview = f"http://127.0.0.1:{server.server_port}/sprint/demo/index.html"
            status = "() => (document.querySelector('[data-docqui-inline-status]') || {}).textContent || ''"

            def marks():
                return self.page.evaluate("""() => Object.fromEntries([...document.querySelectorAll('#documentContainer > .doc-section')]
                  .map(card => [card.querySelector('.section-title').textContent.trim(),
                    [...card.querySelectorAll('del.docqui-inline-word-removed, ins.docqui-inline-word-added')].map(n => n.textContent)])
                  .filter(([, found]) => found.length))""")

            def open_feature():
                self.page.goto(preview + "#" + FEATURE)
                self.page.wait_for_function(f"() => /com diferenças/.test(({status})())")
                self.assertEqual(marks(), {"Regras de Negócio": ["dígitos numéricos", "algarismos, sem traço"],
                                           "Campos": ["usuário", "cliente"]})

            try:
                open_feature()
                self.assertTrue(self.page.evaluate(status).startswith("1 célula(s) · 1 bloco(s) com diferenças"))
                self.assertEqual(self.page.locator("#documentContainer .doc-hero-card").count(), 1)
                highlighted = self.page.locator("#documentContainer").inner_html()
                self.page.locator("[data-docqui-inline-toggle]").uncheck()
                self.assertEqual(self.page.locator('#documentContainer [class*="docqui-inline"]').count(), 0)
                self.page.locator("[data-docqui-inline-toggle]").check()
                self.assertEqual(self.page.locator("#documentContainer").inner_html(), highlighted)
                self.page.evaluate("navigateTo('global/N0_PRODUCT_VISION.md')")
                self.page.wait_for_function(f"() => /não foi alterado/.test(({status})())")
                # O dashboard do preview abre na visão da sprint: a feature tocada, com o ticket do
                # commit, e o N3 entre os documentos alterados. A aba do repositório volta ao painel
                # geral, e o dashboard da main não tem a visão da sprint.
                self.page.evaluate("navigateTo('__dashboard__')")
                self.page.locator(".dashboard-views").wait_for()
                self.assertEqual(self.page.locator('.dashboard-views [aria-pressed="true"]').inner_text(), "Esta sprint")
                panel = lambda title: self.page.locator(".dashboard-panel", has=self.page.get_by_role("heading", name=title, exact=True))
                rows = panel("Funcionalidades da sprint").locator("tbody tr")
                self.assertEqual(rows.count(), 1)
                self.assertEqual(rows.first.locator("td").all_inner_texts()[:3], ["VND-CHK-01 — Calcular Frete", "STRY0013120", "Alterada"])
                self.assertEqual(self.page.locator('[data-metric="deliveryCommits"] > strong').inner_text(), "1")
                self.assertIn(FEATURE, panel("Documentos alterados").inner_text())
                self.page.get_by_role("button", name="Repositório inteiro").click()
                self.page.locator("#dashboardDomain").wait_for()
                main_page = self.context.new_page()
                main_page.goto(preview.replace("sprint/demo/", "") + "#__dashboard__")
                main_page.locator("#dashboardDomain").wait_for()
                self.assertEqual(main_page.locator(".dashboard-views").count(), 0)
                main_page.close()
                self.page.get_by_role("link", name="Ver alterações", exact=True).click()
                self.page.locator("#documentContainer.changes-view h1").wait_for()
                self.assertTrue(self.page.url.endswith("#__changes__"))
                self.assertTrue(self.page.locator(".brand__docqui").is_visible())
                self.assertEqual(self.page.locator(".sidebar__search #searchInput").count(), 1)
                self.assertEqual(self.page.locator("#breadcrumbBar").inner_text().split("/")[-1].strip(), "Alterações para aprovação")
                for width in [1440, 390, 320]:
                    self.page.set_viewport_size({"width": width, "height": 900})
                    for theme in ["light", "dark"]:
                        self.page.evaluate("(theme) => document.documentElement.dataset.theme = theme", theme)
                        self.page.wait_for_function("document.documentElement.scrollWidth <= innerWidth")
                        self.assertEqual(self.page.locator("#documentContainer h1").evaluate(
                            "el => getComputedStyle(el).borderBottomWidth"), "4px")
                self.page.locator("#documentContainer").get_by_role("link", name=FEATURE, exact=True).first.click()
                self.page.wait_for_url("**/sprint/demo/index.html#" + FEATURE)
                self.page.locator("#documentContainer .doc-title").wait_for()
                self.page.goto(preview.replace("index.html", "_docqui/changes.html") + "#file-0")
                self.page.wait_for_url("**/index.html#__changes__#file-0")
                self.page.locator("#documentContainer #file-0").wait_for()
                self.assertTrue(self.page.locator("#brandLink").is_visible())
                self.context.route("**/_docqui/changes.html", lambda route: route.fulfill(status=404, body="missing"))
                self.page.goto(preview + "#__changes__")
                self.page.locator("#documentContainer [role=alert]").wait_for()
                self.assertIn("HTTP 404", self.page.locator("#documentContainer").inner_text())
                self.assertNotIn("Nenhuma alteração", self.page.locator("#documentContainer").inner_text())
                self.context.unroute("**/_docqui/changes.html")
                # Controle negativo: sem a comparação card a card, o Markdown corrido da base não
                # alinha com os cards e as marcas saem do lugar.
                def without_cards(route):
                    response = route.fetch()
                    route.fulfill(response=response, body=response.text().replace(
                        "comparaNosCards(window.DOCQUI_INLINE_DIFF.apply)", "window.DOCQUI_INLINE_DIFF.apply"))
                self.context.route("**/sprint/demo/index.html", without_cards)
                self.page.goto("about:blank")  # só o hash mudaria, e a página não seria recarregada
                with self.assertRaises(AssertionError):
                    open_feature()
            finally:
                server.shutdown()
                server.server_close()


if __name__ == "__main__":
    unittest.main()
