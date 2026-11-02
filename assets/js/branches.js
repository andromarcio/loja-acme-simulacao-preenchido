// Seletor de branch e faixa "requisitos ainda não entregues".
// O site publicado (.github/workflows/pages.yml → scripts/monta-site-preview.mjs) tem a main na
// raiz e cada branch de entrega aberta numa cópia, /sprint/<id>/ ou /historia/<CHAVE>/. A raiz traz
// previews.json com a lista; cada cópia, o seu preview.json (branch, commit, data). Aberto do disco
// ou num servidor local, nada disso existe e o seletor fica oculto.
(function () {
  const picker = document.getElementById('branchPicker');
  const sel = document.getElementById('branchSelect');
  const faixa = document.getElementById('branchBanner');
  // A estratégia da instância (MASTER → Cadência de entrega) decide o que vem primeiro no seletor.
  const master = (typeof repoFilesContent !== 'undefined' && repoFilesContent['global/MASTER.md']) || '';
  const cadencia = (master.match(/\*\*Cad[êe]ncia\*\*\s*:\s*`([^`]+)`/i) || [])[1] || '';
  const porHistoria = /^hist/i.test(cadencia);
  const GRUPO = { sprint: 'Sprints em andamento', historia: 'Histórias em andamento' };

  async function json(url) {
    try { const r = await fetch(url, { cache: 'no-store' }); return r.ok ? await r.json() : null; } catch (e) { return null; }
  }
  function opcao(valor, texto, atual) {
    const o = document.createElement('option'); o.value = valor; o.textContent = texto; o.selected = !!atual; return o;
  }

  function mostraFaixa(p, raiz) {
    const t = document.createElement('span');
    const b = document.createElement('b'); b.textContent = `Branch ${p.branch}`;
    const c = document.createElement('code'); c.textContent = p.commit;
    t.append(b, ` — requisitos ${p.tipo === 'historia' ? 'da história' : 'da sprint'} ainda não entregues (commit `, c, `, ${p.data}). A main só recebe o que foi entregue.`);
    const a = document.createElement('a'); a.textContent = 'Ver este arquivo na main';
    const atualiza = () => { a.href = raiz + location.hash; };
    atualiza(); window.addEventListener('hashchange', atualiza);
    faixa.replaceChildren(t, a); faixa.hidden = false;
  }

  async function iniciar() {
    // a cópia de uma branch mora em …/sprint/<id>/ ou …/historia/<CHAVE>/ — só ela tem preview.json
    const naBranch = /\/(sprint|historia)\/[^/]+\/(index\.html)?$/.test(location.pathname);
    const aqui = naBranch ? await json('preview.json') : null;
    const raiz = naBranch ? '../../' : './';
    if (aqui) mostraFaixa(aqui, raiz);
    const lista = await json(raiz + 'previews.json');
    if (!Array.isArray(lista)) return;
    sel.appendChild(opcao(raiz, 'main — entregue', !aqui));
    for (const tipo of porHistoria ? ['historia', 'sprint'] : ['sprint', 'historia']) {
      const itens = lista.filter((p) => p.tipo === tipo);
      if (!itens.length) continue;
      const g = document.createElement('optgroup'); g.label = GRUPO[tipo];
      for (const p of itens) g.appendChild(opcao(raiz + p.caminho, `${p.branch} · ${p.data}`, aqui && aqui.caminho === p.caminho));
      sel.appendChild(g);
    }
    if (!lista.length) {
      const o = opcao('', porHistoria ? 'nenhuma história em andamento' : 'nenhuma sprint em andamento'); o.disabled = true; sel.appendChild(o);
    }
    // troca de branch mantendo o arquivo aberto (o hash), para comparar a mesma spec
    sel.addEventListener('change', () => { if (sel.value) location.href = sel.value + location.hash; });
    picker.hidden = false;
  }
  iniciar();
})();
