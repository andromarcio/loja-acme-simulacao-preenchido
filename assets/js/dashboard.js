(() => {
  const states = {
    rascunho: 'Aguardando requisitos',
    'requisitos-aprovados': 'Requisitos aprovados',
    'modelo-validado': 'Modelo validado',
    especificado: 'Especificado',
    'em-desenvolvimento': 'Em desenvolvimento',
    implementado: 'Implementado',
    'revisao-necessaria': 'Revisão necessária',
    deprecado: 'Deprecado',
    'sem-governanca': 'Sem gates registrados',
    'governanca-invalida': 'Governança inconsistente',
  };
  const gates = { requisitos: 'Requisitos (PO)', 'modelo-dados': 'Modelo de dados', testes: 'Testes', codigo: 'Código' };
  const tones = {
    n2: 'cyan', n3: 'navy', branches: 'sky', delivery: 'orange',
    specified: 'cyan', waiting: 'orange', inconsistent: 'orange', ungoverned: 'navy', missing: 'orange',
    countPending: 'orange', countReviewed: 'cyan', countUnknown: 'navy', prototypes: 'sky',
  };
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const link = (path, label) => `<a href="#${esc(path)}">${esc(label)}</a>`;
  const card = (key, label, value, note) => `<div class="dashboard-stat" data-metric="${key}" data-tone="${tones[key] || 'blue'}">
    <span>${label}</span><strong>${value}</strong><small>${note}</small></div>`;
  const table = (columns, rows, empty) => rows.length
    ? `<div class="table-container"><table class="custom-table"><thead><tr>${columns.map(column => `<th>${column}</th>`).join('')}</tr></thead>
      <tbody>${rows.map(row => `<tr>${row.map((cell, index) => `<td data-label="${esc(columns[index])}">${cell}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`
    : `<p class="dashboard-empty">${esc(empty)}</p>`;
  const section = (title, body) => `<section class="dashboard-panel"><h2>${title}</h2>${body}</section>`;

  // Visão da sprint (ou da história): nos previews de branch de entrega, o gera-dashboard.py
  // recebe a base e grava em `delivery` o que a branch mudou — documentos, funcionalidades com o
  // estado antes e agora, tickets pelas chaves dos commits e pelas AIMMs.
  const aimStates = {
    rascunho: 'Rascunho', 'em-análise': 'Em análise', 'escopo-aprovado': 'Escopo aprovado',
    'em-execução': 'Em execução', 'concluído': 'Concluído',
  };
  const changes = { A: 'Incluída', M: 'Alterada', D: 'Excluída', R: 'Renomeada', C: 'Incluída', T: 'Alterada' };
  const fileChanges = { A: 'Incluído', M: 'Alterado', D: 'Excluído', R: 'Renomeado', C: 'Copiado', T: 'Alterado' };
  const categories = [
    ['n3', 'Funcionalidades (N3)'], ['n2', 'Agrupamentos Funcionais (N2)'], ['n1', 'Domínios (N1)'], ['aim', 'Análises de impacto'],
    ['modelo', 'Modelo de dados'], ['dicionario', 'Dicionários'], ['global', 'Outros documentos globais'],
    ['prototipo', 'Protótipos'], ['qa', 'Planos de teste'], ['modulos', 'Índices dos módulos'],
  ];
  const unitName = delivery => delivery.unit
    ? `${delivery.unit.type === 'historia' ? 'História' : 'Sprint'} ${delivery.unit.id}` : `Branch ${delivery.branch}`;
  const views = (data, current) => data.delivery ? `<div class="dashboard-views" role="group" aria-label="Recorte do painel">
      ${[['entrega', `Esta ${data.delivery.unit?.type === 'historia' ? 'história' : 'sprint'}`], ['repositorio', 'Repositório inteiro']]
        .map(([view, label]) => `<button type="button" data-view="${view}" aria-pressed="${view === current}">${label}</button>`).join('')}
    </div>` : '';
  const shift = (before, after, label) => {
    if (before === after) return esc(label(after));
    if (before == null) return `${esc(label(after))} <small>(nova)</small>`;
    if (after == null) return `${esc(label(before))} → <small>excluída</small>`;
    return `${esc(label(before))} → <strong>${esc(label(after))}</strong>`;
  };

  function renderDelivery(data) {
    const container = document.getElementById('documentContainer');
    const delivery = data.delivery;
    const word = delivery.unit?.type === 'historia' ? 'história' : 'sprint';
    const titles = new Map(data.artifacts.map(item => [item.id, item]));
    const named = id => titles.has(id) ? link(titles.get(id).path, `${id} — ${titles.get(id).title}`) : esc(id);
    const spec = delivery.files.filter(file => file.category !== 'site');
    const site = delivery.files.filter(file => file.category === 'site');
    const touched = delivery.features;
    const alive = touched.filter(item => item.after);
    const stateOf = item => item ? states[item.state] || item.state : '—';
    const count = change => touched.filter(item => item.change === change).length;
    const ticketsCell = keys => keys.length ? keys.map(esc).join(', ') : '<small>sem chave de ticket</small>';
    const lines = file => file.added == null ? 'binário' : `+${file.added} / −${file.removed}`;
    const documentRow = file => [
      file.status === 'D' ? `<s>${esc(file.path)}</s>` : /\.md$/i.test(file.path) ? link(file.path, file.path) : `<code>${esc(file.path)}</code>`,
      `${fileChanges[file.status] || esc(file.status)}${file.status === 'R' ? `<br><small>antes: ${esc(file.oldPath)}</small>` : ''}`,
      lines(file), ticketsCell(file.tickets)];
    const featureRows = touched.map(item => [
      item.after ? link(item.path, `${item.id} — ${item.title}`) : `<s>${esc(`${item.id} — ${item.title}`)}</s>`,
      ticketsCell(item.tickets), changes[item.change] || esc(item.change),
      shift(item.before?.state, item.after?.state, state => states[state] || state),
      item.after ? (item.after.nextGate ? esc(gates[item.after.nextGate]) : 'Esteira concluída') : '—']);
    const ticketRows = delivery.tickets.map(item => [
      item.path ? link(item.path, `${item.key}${item.title ? ` — ${item.title}` : ''}`) : `${esc(item.key)}<br><small>sem AIMM nesta branch</small>`,
      item.after == null && item.before == null ? '—' : shift(item.before, item.after, state => aimStates[state] || state),
      item.features.length ? item.features.map(named).join('<br>') : '—', item.commits]);
    const sprintAim = delivery.unit?.type !== 'sprint' ? ''
      : delivery.sprintAim ? `<p>AIMM da sprint: ${link(delivery.sprintAim.path, `AIMM-${delivery.unit.id}`)} —
          ${shift(delivery.sprintAim.before, delivery.sprintAim.after, state => aimStates[state] || state)} · ${delivery.sprintAim.commits} commit(s).</p>`
      : `<p>Ainda não há AIMM da sprint (<code>analise-impacto/AIMM-${esc(delivery.unit.id)}.md</code>); ela é aberta no planejamento.</p>`;
    const groups = categories.map(([key, label]) => [label, spec.filter(file => file.category === key)])
      .filter(([, files]) => files.length).map(([label, files]) =>
        `<h3>${label} <small>(${files.length})</small></h3>${table(['Documento', 'Mudança', 'Linhas', 'Ticket'], files.map(documentRow), '')}`).join('');
    const review = document.querySelector('.docqui-preview[data-preview-commit]')
      ? ' · <a href="_docqui/changes.html">Ver alterações</a>' : '';
    container.classList.add('dashboard-view');
    container.innerHTML = `<div class="dashboard-delivery">
      <div class="dashboard-toolbar dashboard-toolbar--views">${views(data, 'entrega')}</div>
      <p class="dashboard-lead"><strong>${esc(unitName(delivery))}</strong> · branch <code>${esc(delivery.branch)}</code>,
        comparada com a base desde o ancestral comum <code>${esc(delivery.base)}</code> · ${delivery.commits} commit(s)${review}</p>
      <div class="dashboard-stats">
        ${card('deliveryDocs', 'Documentos alterados', spec.length, `${site.length} arquivo(s) do site e de scripts à parte`)}
        ${card('deliveryFeatures', 'Funcionalidades tocadas', touched.length, `${count('A') + count('C')} incluída(s) · ${count('M') + count('R') + count('T')} alterada(s) · ${count('D')} excluída(s)`)}
        ${card('deliveryTickets', 'Tickets', delivery.tickets.length, `${delivery.tickets.filter(item => item.path).length} com AIMM nesta branch`)}
        ${card('deliveryWaiting', 'Aguardando checkpoint', alive.filter(item => item.after.nextGate).length, 'Entre as funcionalidades tocadas')}
        ${card('deliveryReady', 'Prontas para desenvolvimento', alive.filter(item => ['especificado', 'em-desenvolvimento', 'implementado'].includes(item.after.state)).length, 'Entre as funcionalidades tocadas')}
        ${card('deliveryCommits', 'Commits', delivery.commits, `${delivery.commitsWithoutKey} sem chave de ticket`)}
      </div>
      ${section(`Funcionalidades da ${word}`, table(['Funcionalidade', 'Ticket', 'Mudança', 'Estado', 'Próximo checkpoint'], featureRows,
        'Esta branch ainda não mexe em nenhum N3.'))}
      ${section('Tickets', `${sprintAim}${table(['Ticket', 'AIMM', 'Funcionalidades', 'Commits'], ticketRows,
        'Nenhum ticket citado nos commits, nas AIMMs da branch ou na AIMM da sprint.')}`)}
      ${section('Documentos alterados', `${groups || '<p class="dashboard-empty">Nenhum documento de especificação alterado.</p>'}
        ${site.length ? `<details class="dashboard-more"><summary>Site, scripts e engine (${site.length})</summary>
          ${table(['Arquivo', 'Mudança', 'Linhas', 'Ticket'], site.map(documentRow), '')}</details>` : ''}`)}
      ${section('Estados das funcionalidades tocadas', alive.length ? `<div class="dashboard-state-list">${Object.entries(states).map(([state, label]) => {
        const total = alive.filter(item => item.after.state === state).length;
        return total ? `<div><span>${label}</span><strong>${total}</strong><progress value="${total}" max="${alive.length}" aria-label="${label}: ${total}"></progress></div>` : '';
      }).join('')}</div>` : '<p class="dashboard-empty">Nenhuma funcionalidade tocada continua na branch.</p>')}
      ${section('Como ler esta visão', `
        <p><strong>Base:</strong> a mesma do Ver alterações — o ancestral comum com a base do PR (sem PR, a main). O que chegou à base depois que a branch saiu não conta como mudança desta ${word}.</p>
        <p><strong>Ticket:</strong> a chave que os commits citam no assunto (na cadência sprint, todo commit de spec cita uma). A coluna mostra os tickets dos commits que tocaram o documento; a origem do N3 guarda o ticket que criou a funcionalidade e não entra aqui.</p>
        <p><strong>Estado:</strong> o da esteira na base e na branch, lido dos gates de cada N3. O painel não concede aprovações.</p>`)}
      </div>`;
    container.querySelectorAll('.dashboard-views button').forEach(button => button.addEventListener('click', () => render(data, '', button.dataset.view)));
  }

  function render(data, selectedDomain, view) {
    if ((view || (data.delivery ? 'entrega' : 'repositorio')) === 'entrega') {
      renderDelivery(data);
      return;
    }
    const container = document.getElementById('documentContainer');
    const domains = data.artifacts.filter(item => item.level === 1);
    const artifacts = data.artifacts.filter(item => !selectedDomain || item.domain === selectedDomain);
    const features = artifacts.filter(item => item.level === 3);
    const active = features.filter(item => item.state !== 'deprecado');
    const specified = active.filter(item => ['especificado', 'em-desenvolvimento', 'implementado'].includes(item.state));
    const approved = active.filter(item => item.approved);
    const waiting = active.filter(item => item.nextGate);
    const missing = data.missingFeatures.filter(item => !selectedDomain || item.domain === selectedDomain);
    const inconsistent = features.filter(item => item.state === 'governanca-invalida');
    const ungoverned = features.filter(item => item.state === 'sem-governanca');
    const countPending = active.filter(item => item.countPending === true);
    const noCountStatus = active.filter(item => item.countPending === null);
    const branches = data.repository.branches;
    const local = branches.filter(item => item.local).length;
    const remote = branches.filter(item => item.remotes.length).length;
    const delivery = branches.filter(item => /^(sprint|historia)\//.test(item.name)).length;
    const queued = [...waiting, ...inconsistent, ...ungoverned];
    const featureLink = item => link(item.path, `${item.id} — ${item.title}`);
    const pendingReason = item => item.issues.length ? item.issues.join(' ')
      : item.nextGate ? `Aguardando ${gates[item.nextGate]}.` : 'Sem registro formal de gates; aprovação não inferida.';
    const byDomain = domains.filter(item => !selectedDomain || item.domain === selectedDomain).map(domain => {
      const children = artifacts.filter(item => item.domain === domain.domain);
      const n3 = children.filter(item => item.level === 3);
      return [link(domain.path, `${domain.id} — ${domain.title}`),
        children.filter(item => item.level === 2).length, n3.length,
        n3.filter(item => item.approved && item.state !== 'deprecado').length,
        n3.filter(item => specified.includes(item)).length,
        missing.filter(item => item.domain === domain.domain).length];
    });
    const definitions = `
      <p><strong>Artefatos:</strong> arquivos N1/N2/N3 efetivamente existentes, identificados pelo subtítulo. Templates, relatórios, exemplos e índices não entram nesse total.</p>
      <p><strong>Aprovação:</strong> formal somente para N3, pelos gates da fonte. “Requisitos aprovados” é CP1; não significa modelo aprovado nem especificação pronta. “Especificado” inclui etapas posteriores e exige os gates de especificação do perfil. Deprecados não entram nesses indicadores.</p>
      <p><strong>Pendentes:</strong> N3 com próximo checkpoint definido. Sem gates e registros inconsistentes são mostrados separadamente, nunca tratados como aprovados. As contagens de pendências de aprovação e revisão de contagem podem se sobrepor. “N3 sem arquivo” mede os caminhos declarados nas tabelas de Funcionalidades dos N2; um caminho desatualizado também aparece e deve ser inspecionado antes de concluir que falta especificar.</p>
      <p><strong>Branches:</strong> nomes únicos das refs locais e remotas disponíveis no checkout; uma branch local rastreada no remoto conta uma vez no total. Não é consulta em tempo real ao GitHub; execute fetch antes de regenerar localmente. Branches de entrega existentes não significam necessariamente previews abertos.</p>
      <p><strong>Recorte:</strong> os documentos e seu perfil correspondem ao checkout usado na geração. O filtro por domínio não muda os indicadores de branches, protótipos e modelos de dados, que são do repositório inteiro.</p>`;
    // Lista própria, não <select>: a nativa do macOS abre por cima do campo (como no seletor
    // Branch dos previews, engine/publication/preview.css).
    const domainName = item => item.domain ? `${item.id} — ${item.title}` : 'Todos os domínios';
    const options = [{ domain: '' }, ...domains];
    const chosen = options.find(item => item.domain === (selectedDomain || '')) || options[0];
    container.classList.add('dashboard-view');
    container.innerHTML = `
      <div class="dashboard-toolbar${data.delivery ? ' dashboard-toolbar--views' : ''}">${views(data, 'repositorio')}
        <div class="dashboard-filter">Domínio<details class="dashboard-filter__menu" id="dashboardDomain">
          <summary aria-label="Domínio: ${esc(domainName(chosen))}"><span>${esc(domainName(chosen))}</span></summary>
          <ul aria-label="Domínio">${options.map(item => `<li><button type="button" data-domain="${esc(item.domain)}"${item === chosen ? ' aria-current="true"' : ''}>${esc(domainName(item))}</button></li>`).join('')}</ul>
        </details></div></div>
      <div class="dashboard-stats">
        ${card('n1', 'Domínios (N1)', artifacts.filter(item => item.level === 1).length, 'Documentos presentes')}
        ${card('n2', 'Agrupamentos Funcionais (N2)', artifacts.filter(item => item.level === 2).length, 'Documentos presentes')}
        ${card('n3', 'Funcionalidades (N3)', features.length, 'Inclui deprecados, quando existentes')}
        ${card('artifacts', 'Artefatos de especificação', artifacts.length, 'Soma de N1 + N2 + N3')}
        ${card('branches', 'Branches conhecidas', branches.length, `${local} locais · ${remote} com referência remota`)}
        ${card('delivery', 'Branches de entrega', delivery, 'sprint/ e historia/ — recorte do Git')}
      </div>
      ${section('Aprovações e prontidão dos N3', `<div class="dashboard-stats">
        ${card('approved', 'Requisitos aprovados', approved.length, 'CP1 registrado, sem inconsistências')}
        ${card('specified', 'Especificados', specified.length, 'Prontos ou em etapas posteriores')}
        ${card('waiting', 'Pendentes de aprovação', waiting.length, 'Aguardam o próximo checkpoint')}
        ${card('inconsistent', 'Governança inconsistente', inconsistent.length, 'Gates ou estado precisam de revisão')}
        ${card('ungoverned', 'Sem gates', ungoverned.length, 'Sem aprovação formal mensurável')}
        ${card('missing', 'N3 previstos sem arquivo', missing.length, 'Caminhos declarados no N2 ausentes no retrato')}
      </div><div class="dashboard-state-list">${Object.entries(states).map(([state, label]) => {
        const count = features.filter(item => item.state === state).length;
        return `<div><span>${label}</span><strong>${count}</strong><progress value="${count}" max="${features.length || 1}" aria-label="${label}: ${count}"></progress></div>`;
      }).join('')}</div>`)}
      ${section('Cobertura por domínio', table(['Domínio', 'N2', 'N3', 'CP1 aprovado', 'Especificados', 'N3 sem arquivo'], byDomain, 'Nenhum domínio neste recorte.'))}
      ${section('Fila de aprovação e governança', `<p>Abra a especificação para revisar o próximo checkpoint. Este painel não concede aprovações.</p>
        ${table(['Funcionalidade', 'Estado', 'Próxima ação'], queued.map(item => [featureLink(item), esc(states[item.state] || item.state), esc(pendingReason(item))]), 'Nenhuma pendência de aprovação registrada neste recorte.')}`)}
      ${section('Pendências de especificação', table(['Funcionalidade prevista', 'Agrupamento Funcional'], missing.map(item =>
        [esc(item.title), link(item.path, item.featureSet)]), 'Todos os N3 declarados nas tabelas de Funcionalidades dos N2 possuem arquivo.'))}
      ${section('Revisão de contagem', `<div class="dashboard-stats">
        ${card('countPending', 'Revisões pendentes', countPending.length, 'contagem.pendente = true')}
        ${card('countReviewed', 'Revisões registradas', active.filter(item => item.countPending === false).length, 'contagem.pendente = false')}
        ${card('countUnknown', 'Sem status de contagem', noCountStatus.length, 'Ausência não significa contagem revisada')}
      </div><p>Não soma PF nem transforma os valores históricos em medição aprovada.</p>
        ${table(['Funcionalidade', 'Situação'], countPending.map(item => [featureLink(item), 'Revisão de contagem pendente']), 'Nenhuma revisão de contagem pendente registrada neste recorte.')}`)}
      ${section('Branches do repositório', `<p>${branches.length} nomes únicos. Referências locais/remotas podem coexistir; não são somadas em duplicidade.</p>
        ${table(['Branch', 'Local', 'Remotos', 'Último commit'], branches.map(item =>
          [esc(item.name), item.local ? 'Sim' : 'Não', esc(item.remotes.join(', ') || '—'), `<code>${esc(item.commit)}</code><br>${esc(item.updated)}`]), 'Nenhuma branch encontrada no checkout.')}`)}
      ${section('Artefatos de apoio', `<div class="dashboard-stats">
        ${card('prototypes', 'Protótipos HTML', data.prototypes, 'Exclui a biblioteca de componentes')}
        ${card('dataModels', 'Fragmentos de dados', data.dataModels, 'global/data-models — sem o índice')}
      </div><p>${link('analise-impacto/INDEX.md', 'AIMMs dos tickets')} · ${link('global/CONTAGEM-PF.md', 'Consolidado de contagem')} · ${link('modules/INDEX.md', 'Índice dos módulos')}</p>`)}
      ${section('Como interpretar o painel', definitions)}`;
    document.querySelectorAll('#dashboardDomain button[data-domain]').forEach(button => button.addEventListener('click', () => {
      render(data, button.dataset.domain, 'repositorio');
      document.querySelector('#dashboardDomain > summary').focus();
    }));
    container.querySelectorAll('.dashboard-views button').forEach(button => button.addEventListener('click', () => render(data, '', button.dataset.view)));
  }

  // A lista do filtro fecha com Esc (o foco volta ao campo) ou com um clique fora dela.
  document.addEventListener('click', event => {
    const menu = document.querySelector('#dashboardDomain[open]');
    if (menu && !menu.contains(event.target)) menu.open = false;
  });
  document.addEventListener('keydown', event => {
    const menu = document.querySelector('#dashboardDomain[open]');
    if (event.key !== 'Escape' || !menu) return;
    menu.open = false;
    menu.querySelector('summary').focus();
  });

  window.renderDashboard = () => {
    const container = document.getElementById('documentContainer');
    const data = window.DASHBOARD_DATA;
    if (!data || data.schema !== 1 || !Array.isArray(data.artifacts) ||
        !Array.isArray(data.missingFeatures) || !Array.isArray(data.repository?.branches) ||
        !data.generatedAt || !data.profile) {
      container.classList.add('dashboard-view');
      container.innerHTML = `<h1>Dashboard indisponível</h1><p role="alert">O retrato de gestão não foi gerado ou está inválido.
        Execute <code>python scripts/gera-dashboard.py</code> com PyYAML instalado e atualize o site.</p>`;
      console.error('Dashboard: dados ausentes ou inválidos.');
      return;
    }
    render(data, '');
  };
})();
