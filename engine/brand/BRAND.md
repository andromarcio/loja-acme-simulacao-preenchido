# Docqui Caixa — guia da marca

Identidade visual do framework **Docqui Caixa** (Docqui = doc + aqui). Conceito: **preto no
branco, com grifo** — a spec é tinta sobre papel; o marca-texto amarelo destaca
o que importa. Aprovada em 2026-07-10; a apresentação completa da proposta está
arquivada em [`proposta-v1.html`](proposta-v1.html) (autocontida — claro por
padrão, modo Planta no botão do canto).

## Nome

- Nome oficial do framework na Caixa: **Docqui Caixa**.
- Nome técnico do engine: `docqui-caixa-engine`. O repositório remoto permanece `CAIXA-EFRS/docqui-engine`.
- O lettering do logotipo mantém **docqui** em caixa baixa; isso não altera o nome oficial do framework. Nunca "Doqui", "Doki" ou "DocQui".
- Tagline: **especificação tintim por tintim** (por extenso, minúscula, nunca
  abreviada).
- Bordão: *"Tá no Docqui."*

## Símbolo — o doc-pin

Um documento que afunila em ponta de pin. Três leituras: **documento** (o
artefato), **pin de mapa** (o "aqui") e **balão de conversa** (os prompts
guiados). Dentro, quatro barras em escada = níveis **N0→N3**; a última barra é
sempre **grifada** (o nível fino, onde o dev trabalha).

| Arquivo | Uso |
|---|---|
| `simbolo.svg` | versão positiva (fundos claros) |
| `simbolo-negativo.svg` | fundos escuros (Tinta/Planta) |
| `simbolo-16.svg` | ≤ 24 px: só duas barras (favicon) |

## Logotipo

`logotipo.svg` — "docqui" monolinear em geometria própria (círculos e hastes,
sem fonte licenciada). Assinatura escondida: **o rabo do "q" é uma agulha de
pin**. `logotipo-grifo.svg` é a versão com marca-texto sobre o "qui" (capas,
hero, social — não usar em tamanhos pequenos). `lockup.svg` combina símbolo +
logotipo.

- Área de respiro: a altura do "o" em todo o perímetro.
- Mínimo do logotipo: 96 px de largura; abaixo disso, use só o símbolo.

### Variação institucional Caixa

`lockup-caixa.svg` é a assinatura horizontal **Docqui Caixa**. Ela preserva a
geometria do doc-pin e do logotipo docqui, adotando o azul Caixa `#005CA9` como
cor principal e o laranja Caixa `#F39200` como acento. O lettering Caixa vem do
ativo oficial `CAIXA/CAIXA_2cores_positiva.png`; não o substitua por fonte
genérica ou redesenho. Use-a apenas em materiais destinados à Caixa; não
substitui a assinatura institucional oficial da Caixa.

`lockup-caixa-acento.svg` é a variação da assinatura com o ponto do **i** de
docqui em laranja Caixa. Use-a quando o acento precisa ganhar mais presença,
sem alterar a geometria do logotipo.

`lockup-caixa-q-acento.svg` é a variação com a perna do **q** em laranja Caixa.
Ela dá mais protagonismo ao acento e preserva o restante do lettering docqui em
azul.

`lockup-caixa-c-acento.svg` é a variação com a letra **c** de docqui em laranja
Caixa. Use-a quando o acento deve ocupar uma letra inteira, sem mudar a
composição da assinatura.

## Cores

| Nome | Hex | Papel |
|---|---|---|
| **Tinta** | `#1B2B4B` | primária: texto, símbolo, traço |
| **Papel** | `#FBF8F0` | fundo do modo claro (padrão) |
| **Grifo** | `#FFD94A` | acento único — **só fundo de destaque, nunca cor de texto**; texto por cima sempre Tinta (`#14213D` em peças escuras) |
| **Planta** | `#0F1B33` | fundo do modo escuro (alternável), com grade heliográfica discreta |
| **Validado** | `#1E7F5C` (escuro `#4CC495`) | semântica de gate aprovado |
| **Pendência** | `#BE4B33` (escuro `#E8836B`) | semântica de lacuna/⚠️ |

O **modo claro (Papel) é o padrão** em todas as superfícies; o modo escuro
(Planta) fica disponível por alternância explícita.

## Tipografia

| Papel | Fonte | Fallback |
|---|---|---|
| Display | **Sora** 700–800 | `ui-rounded, "SF Pro Rounded", "Segoe UI", system-ui` |
| Texto | **Inter** 400–600 | `system-ui, "Segoe UI", Roboto` |
| Técnica (IDs, carimbos, Gherkin) | **JetBrains Mono** | `ui-monospace, Consolas` |

## Elementos de sistema

- **Carimbo**: o carimbo de versão dos artefatos vira selo visível — borda
  tracejada, mono, caixa alta, rotação de −2°. Ex.: `DOCQUI · V2.0.0 · PROMPT_3A`.
- **Barras N0→N3**: quatro barras em escada; a última sempre em Grifo.
- **Badges**: `badge-versao.svg` (docqui + versão) e `badge-specado.svg`
  (estado da especificação), para READMEs de instâncias.
- **Social card**: `social-card.svg` (1200×630, fundo Planta).

## Uso correto

- ✅ Um grifo por tela, no máximo — como num texto bem marcado.
- ✅ Texto sobre Grifo sempre em Tinta; sobre Planta, sempre em Papel.
- ✅ Símbolo sozinho quando o logotipo ficaria menor que 96 px.
- ❌ Nada de referências visuais ao personagem de Hergé (topete, cachorro,
  *ligne claire*) — a tagline usa a expressão idiomática, e só.
- ❌ Não imitar o pin do Google Maps (gota com furo); o nosso pin é o documento.
- ❌ Grifo em texto corrido, ícones pequenos ou como cor de fonte.
- ❌ Recolorir as barras N0→N3 fora do sistema (a grifada é sempre a última).
