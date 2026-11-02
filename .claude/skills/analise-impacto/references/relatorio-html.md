# A AIMM em HTML

O Markdown vive no repositório, em `analise-impacto/`, e é a versão versionada. O HTML é o que circula — é o que o PO abre, o que a métrica lê e o que vai para a chefia. Trate-o como entrega, não como subproduto.

## O HTML é gerado, não escrito

`scripts/gera-html-impacto.mjs` converte o `.md` em HTML no layout dos N3 — uma seção recolhível por `##`, paleta herdada do `index.html` da instância, KPI em cartão, título de item com chip de chave e badge de natureza, colunas de chave e de PF que não partem o valor. Rode-o, não reescreva à mão:

```bash
node scripts/gera-html-impacto.mjs analise-impacto/AIMM-SP05.md   # um arquivo
node scripts/gera-html-impacto.mjs analise-impacto/               # a pasta
```

Na prática, chame `node scripts/atualiza-pages.mjs`: ele roda o gerador **e** os outros derivados do site na ordem certa — o espelho da esteira antes, a árvore por último, porque ela embute o conteúdo dos `.md`. Gerar o HTML e esquecer a árvore deixa o site mostrando o documento velho, sem nenhum aviso.

O gerador é canônico (`scripts/**` do engine). Se ele não faz o que este relatório precisa, **conserte o gerador** e propague — não faça um HTML artesanal ao lado, que é como se perde a uniformidade entre instâncias.

A seção seguinte vale para o que fica **fora** do gerador: uma carta de questionamento à métrica, uma página avulsa. Vale também para calibrar o próprio gerador ao design system de uma instância nova.

## Adote o design system da instância

Um relatório com identidade própria destoa do resto e parece vir de fora. Antes de escrever CSS, leia os tokens do site de documentação da instância (normalmente o `index.html` do GitHub Pages) e espelhe:

- **Paleta** — cores de marca, superfícies, bordas, texto em três níveis, tintas de status
- **Tipografia** — família de títulos, de texto e monoespaçada, com os pesos usados
- **Régua** — raios de borda, sombras, espaçamentos

Construa o relatório inteiro sobre variáveis CSS. Assim a adoção do design system vira uma troca de bloco `:root` mais os ajustes de peso e tracking dos títulos, em vez de uma reescrita.

Ao trocar de família tipográfica, ajuste tamanho e peso junto: uma serifada de display em peso 400 e 58px não vira uma sans de título em 700 no mesmo tamanho sem ficar estranha.

## Largura

Relatórios com tabelas largas pedem a página inteira (`max-width: none` no contêiner, com as margens laterais preservadas). Documentos de correspondência — uma carta de questionamento, por exemplo — leem melhor limitados.

Se optar pela página inteira, **tire também os limites de largura da prosa**. Parágrafos travados em 70 caracteres enquanto as tabelas vão até a borda parecem quebra de linha errada, e é a primeira coisa que o leitor reclama.

## Checagens antes de dar por pronto

Rode `scripts/checa-render.mjs`. Ele abre o arquivo no Chromium e verifica o que revisão visual não pega:

- **Alinhamento de colunas** — linhas com número de células diferente do cabeçalho. Isso acontece com facilidade quando as tabelas são geradas por script e uma coluna é acrescentada depois.
- **Estouro horizontal**, em largura de desktop e de celular. Caminhos de arquivo e identificadores em fonte monoespaçada não têm ponto de quebra e furam a viewport.
- **Blocos grudados** — elementos irmãos com folga quase nula, o que costuma sobrar quando se remove um bloco intermediário que carregava a margem.
- **Coluna atômica com o valor partido** — `PDTIC25093-` numa linha e `49` na seguinte, `4` e `(E)` em linhas diferentes. Numa tabela de largura automática o navegador reparte o espaço por volume de texto, e a coluna estreita é a primeira a ser espremida.
- **Recursos externos que falham** e erros de página.

Ao medir linha visual, conte os topos distintos dos retângulos de cada **nó de texto**. Altura da célula dividida pelo `line-height` inclui o padding; `getClientRects` do elemento conta o retângulo de um `<code>` filho como linha. As duas medidas erradas dão falso positivo com cara de achado — uma delas rendeu 147.

Verifique no navegador, não no regex. Contar tags com expressão regular dá falso positivo sempre que o HTML é montado por concatenação; o DOM já resolveu isso.

## A versão standalone

Quando o usuário quiser baixar e encaminhar — por celular, por e-mail, para quem não tem acesso ao repositório —, gere um arquivo único com `scripts/build-standalone.mjs`. Ele embute as fontes em base64 e remove as referências externas.

Um detalhe que decide o tamanho: fontes do Google vêm com todos os subsets (cirílico, grego, vietnamita…). Filtre para o que o idioma usa. Em português, só `latin` — a diferença foi de 1,2 MB para 390 KB numa medição real.

Prove que é autocontido bloqueando **toda** a rede e reabrindo: se nenhuma requisição externa for tentada e as fontes continuarem certas, está pronto. `checa-render.mjs --offline` faz isso.

## Manter os dois formatos em sincronia

A divergência entre Markdown e HTML é a falha mais comum e a mais constrangedora, porque o HTML é o que circula. Ao alterar um número, altere nos dois na mesma passagem e confira o total nos dois. Quando o mesmo trecho existe nos dois arquivos, edite ambos por substituição exata e falhe alto se o texto procurado não aparecer — é assim que se percebe que um dos lados já tinha divergido.
