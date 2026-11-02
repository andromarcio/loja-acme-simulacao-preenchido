<!-- docqui: 7.0.0 | prompt: MIGRA_NIVEIS | atualizado: 2026-10-21 -->

# Loja ACME — demonstração do Docqui Caixa

> **Simulação.** Cópia da [`loja-acme-doc`](https://github.com/andromarcio/loja-acme-doc), sincronizada com o docqui-caixa-engine (a versão está no `VERSION`), para testar o agente do Copilot Studio ou do Copilot CLI e o workflow `regenera-gerados` sem mexer na instância dos exercícios. Só conteúdo fictício. O passo a passo está em `engine/copilot-studio/LEIA-ME.html`.

Instância de demonstração de uma **loja virtual fictícia**, no perfil **requisitos** e cadência **história**. O exemplo preenchido cobre quatro domínios — Catálogo, Vitrine, Vendas e Administração —, com 31 funcionalidades — 25 especificadas e 6 em rascunho —, cada uma ligada ao ticket fictício, à AIMM, ao modelo de entidades e ao protótipo do seu Agrupamento Funcional; **VND-CHK-01 — Calcular Frete** continua sendo o fio do roteiro. Os dados, tickets e valores são didáticos; não representam sistemas ou atendimentos reais da CAIXA.

**AIMM — Análise de Impacto de Mudança para Manutenção** é o nome adotado na CAIXA para o artefato, com arquivos `AIMM-*`. A compatibilidade com o formato anterior e com os endereços antigos dos relatórios e do visualizador é preservada. Chaves, estados, gates e branches `historia/*` e `sprint/*` não mudam.

No menu principal do Pages, **Análises de impacto (AIMM)** abre o [índice das análises](analise-impacto/INDEX.md), com acesso aos relatórios dos tickets da instância.

A geração Excel da contagem e a geração DOCX das especificações foram removidas. A contagem permanece nos N3, no DATA-MODEL, no consolidado Markdown e nas AIMMs, com os mesmos validadores. O HTML das AIMMs, o Pages e o simulador standalone continuam disponíveis.

**Comece pelo [roteiro da demonstração](mentoria/README.md)** ou abra o [simulador](mentoria/simulador.html). A estrutura do Pages vem do `simpf-doc`, mas os requisitos, mapas e índices são exclusivos da Loja ACME.

O Pages segue o modelo visual atual do SIMPF: marca Docqui no cabeçalho, busca no menu lateral, breadcrumb no topo, documentos em painel único e menu móvel. Os temas claro/escuro, **Inter** no texto e **JetBrains Mono** no código são definidos em `assets/css/docqui-theme.css`. A navegação da demonstração e o simulador são preservados. Os diagramas Mermaid usam o layout ELK, que vem no próprio `assets/vendor/mermaid.min.js` desde o Mermaid 12 (a loja usa a 12.1.0); o `index.html` fixa o estilo `classic` e a quebra de texto do fluxograma, que a 12 mudou, para manter o desenho de antes. As fontes têm alternativas locais caso o Google Fonts esteja indisponível.

O **Dashboard de gestão** (`#__dashboard__`) mostra artefatos N1–N3, próximos checkpoints, revisão de contagem, branches e apoio, com filtro por domínio. Seus dados são gerados a partir **desta instância** por `python scripts/gera-dashboard.py` (PyYAML), integrado ao pipeline do Pages e aos previews de entrega. Nos previews de `sprint/*` e `historia/*`, o dashboard abre na visão **Esta sprint** (ou **Esta história**): os documentos que a branch mudou desde o ancestral comum com a base do PR, as funcionalidades tocadas com o estado antes e agora e o próximo checkpoint, e os tickets, pelas chaves que os commits citam e pelas AIMMs; a aba **Repositório inteiro** volta ao painel geral. Para gerá-la localmente numa branch de entrega: `python scripts/gera-dashboard.py --base origin/main`. O exemplo tem quatro N1, oito N2 e 31 N3 em rascunho: o painel não concede aprovação, não soma PF pendentes nem copia indicadores do SIMPF. Branches representam as refs do checkout, não uma consulta em tempo real ao GitHub.

Confira o visual com `python scripts/testa-visual-pages.py` (Playwright e Chromium/Edge, ou `SIM_BROWSER`): valida identidade, layout, temas, busca, menu móvel, diagramas, preservação do simulador e os destaques do preview de branch, com controles negativos.

Nos previews, **Ver alterações** abre `index.html#__changes__`, dentro da mesma casca do Pages, com cabeçalho, menu, breadcrumb e tema. Na lista, o nome de um arquivo Markdown abre o documento no visualizador da mesma branch; **Ver diferença** rola até o diff correspondente. Arquivos excluídos não oferecem link para uma versão inexistente. Links antigos de `_docqui/changes.html` redirecionam para a rota nova, preservando a âncora. A comparação não concede aprovação e uma falha de carregamento é explicitamente informada.

O contrato de links do comparador é conferido por `node --test scripts/test-pages-review.mjs`, e a regressão `test_branch_preview_highlights_inside_cards` confere a página integrada, a mesma branch, o redirecionamento antigo e o erro de carregamento no navegador.

| Artefato | O que demonstra |
|---|---|
| [Visão de Produto](global/N0_PRODUCT_VISION.md) | Propósito, personas, escopo e áreas previstas |
| [Vendas](modules/vendas/README.md) → [Checkout](modules/vendas/checkout/README.md) | N1 e N2, jornada e permissões |
| [Calcular Frete](modules/vendas/checkout/f-calcular-frete.md) | Campos, regras RN-NN, cenários e comportamento de tela |
| [Categorias](modules/catalogo/categorias/README.md) e [Faixas de Frete](modules/administracao/faixas-frete/README.md) | CRUD completo, em modal e em telas próprias, com exclusão bloqueada por vínculo |
| [Usuários](modules/administracao/usuarios/README.md) | CRUD com inativação no lugar da exclusão |
| [Navegação](modules/vitrine/navegacao/README.md) → [Carrinho](modules/vendas/carrinho/README.md) → [Checkout](modules/vendas/checkout/README.md) | A jornada de compra atravessando domínios |
| [Destaques](modules/vitrine/destaques/README.md) e [Gestão de Pedidos](modules/vendas/gestao-pedidos/README.md) | Período de vigência (RC-03) e cancelamento com motivo |
| [Modelo de entidades](global/DATA-MODEL.md) e [diagrama ER](global/DIAGRAMA-ER.md) | Sete entidades em quatro domínios, sem camada física |
| [AIMMs](analise-impacto/INDEX.md) | Oito tickets fictícios, critérios e elos recíprocos |
| [Protótipos](prototypes/INDEX.md) | Um fluxo navegável por Agrupamento Funcional |
| [Índice geral](modules/INDEX.md) | Rastreabilidade e esteira dos checkpoints |
| [Backlog](mentoria/backlog.md) | Tickets do simulador para praticar a evolução |
| [Mapa de rastreabilidade](rastreabilidade/index.html) | Visão dos elos N0 → N1 → N2 → N3 → ticket |

## Estado da demonstração

O exemplo está **preenchido e, em parte, especificado**: 25 das 31 funcionalidades têm o CP1 e o CP2 aprovados juntos por Andro Márcio em 2026-10-21 (📋 especificado). Ficam em rascunho **VND-CHK-01 — Calcular Frete**, o fio do roteiro, e as cinco alteradas pela proposta STRY0013205, CAT-CTG-02 a CAT-CTG-05 e VIT-NAV-02. Nenhuma implementação foi declarada e a contagem de Pontos de Função continua pendente. As personas Ana, Rui e Bruno do simulador não são aprovadores reais deste repositório. A cópia didática da `main` não é um registro de specs entregues; nesta história, use `historia/STRY0013205`, conforme a cadência `história` declarada no MASTER, e siga a esteira real.

## Executar e atualizar o Pages

Na raiz do repositório:

```powershell
python -m pip install pyyaml
python scripts\gates.py promote --write
node scripts\atualiza-pages.mjs --dry
node scripts\atualiza-pages.mjs --com-dicionarios
python -m http.server 8080 --bind 127.0.0.1
```

Abra `http://127.0.0.1:8080`. O pipeline canônico usa o comando `python3`; no Windows, disponibilize esse comando apontando para a instalação de Python com PyYAML antes de executar `atualiza-pages`.

No GitHub, configure **Settings → Pages → Source: GitHub Actions**. O workflow publica a `main` e os previews de branches de entrega; no ambiente `github-pages`, permita `main`, `sprint/*` e `historia/*`. No topo de cada versão do site, o seletor **Branch** troca entre a `main` e as branches abertas, mantendo o documento aberto; nos previews, **Ver alterações** lista o que a branch muda em relação à base do PR, e **Destacar alterações** marca, dentro de cada card, só o que mudou — o removido riscado, o incluído destacado. O repositório é [CAIXA-EFRS/loja-acme-doc](https://github.com/CAIXA-EFRS/loja-acme-doc).

Os arquivos de `engine/`, `scripts/` e `.claude/skills/` são sincronizados pelo `scripts/sync-instance.mjs` do engine, não por cópia manual. Depois de alterar Markdown, regenere os derivados; nunca copie `assets/tree.js`, `assets/mapa-data.js` ou `rastreabilidade/data.js` de outro sistema.

**Recuperação das ferramentas (STRY0013205)**: os scripts de validação e publicação e os recursos de `engine/publication/` foram restaurados do commit `7569391913fca2e3776f55441ed54907655a9e2b` desta instância, anterior à remoção no commit `4efbe47`. Eles devem permanecer versionados: os workflows dependem deles. Essa recuperação preserva as adaptações locais abaixo e não substitui a sincronização pelo engine em atualizações futuras.

**Adaptações locais de publicação**: `atualiza-pages.mjs` usa o `build-trace-data.mjs` existente para preservar os caminhos dos N2. Preserve esse ajuste ao sincronizar enquanto não estiver incorporado ao engine. A interface do grafo abre os documentos no visualizador local, inclusive nos previews.

O gerador e o renderer do dashboard são extensões de publicação reaproveitadas do SIMPF. Preserve também a integração local do dashboard em `atualiza-pages.mjs` e `monta-site-preview.mjs` — que regenera os derivados e o dashboard em cada versão do site — ao sincronizar o engine. Os destaques nos cards são do `index.html` da loja (`comparaNosCards`): a base é desenhada pelos mesmos templates e o comparador do engine corre card a card. O contrato de contagem dos indicadores roda com `python -m unittest discover -s scripts -p test_dashboard.py`.
