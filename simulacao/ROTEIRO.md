# Roteiro da simulação — um ticket do começo ao fim

Você vai atender um ticket como um analista da CAIXA atenderia com o agente do Copilot Studio: conversando, sem abrir o GitHub. O agente é o GitHub Copilot (CLI ou VS Code), com as instruções do `AGENTS.md` deste repositório. Quem revisa é a conta `@androlouredo`, que faz o papel da PO e do DBA.

| Papel | Conta | Onde age |
|---|---|---|
| Analista | `@andromarcio` | Na conversa com o agente |
| PO e DBA (revisão) | `@androlouredo` | Na conversa com o agente, com a conta dele ativa no `gh` |
| Code owner (merge) | `@androlouredo` | No site do GitHub, no fim |

O ticket é o **STRY0013150 — Cadastro de produtos**, do `mentoria/backlog.md`. Foi escolhido porque começa do zero (o Agrupamento Funcional Produtos, `CAT-PRD`, está só planejado no N1 Catálogo), passa por um CRUD inteiro e mexe no modelo de entidades, o que leva o CP1 e o CP2 à mesma revisão.

## Antes de começar

### No GitHub, uma vez

1. **Colaborador.** Em *Settings → Collaborators*, convide `androlouredo` com papel **Write**. Entre com a conta `androlouredo` e aceite o convite (chega por e-mail e aparece em github.com/notifications). Sem isso, o CODEOWNERS não vale e a revisão não pode ser pedida a ele.
2. **Merge com a descrição.** Em *Settings → General → Pull Requests*: deixe marcado **Allow merge commits** e, em *Default commit message*, escolha **Pull request title and description**. É o que leva a linha `Approved-by:` da descrição do PR para a mensagem do merge.
3. **Proteção da `main`.** Em *Settings → Branches → Add branch protection rule* (ou *Rules → Rulesets*), para `main`:
   - **Require a pull request before merging**, com **Require approvals** (1), **Dismiss stale pull request approvals when new commits are pushed** e **Require review from Code Owners**;
   - **Require status checks to pass**, com `Esteira de gates — check`, `estrutura`, `rastreabilidade` e `entrega` (eles só aparecem na busca depois de rodar uma vez — rodaram no PR de teste);
   - **Do not allow bypassing the above settings**, para que nem a conta dona passe por cima.
4. **PR de teste antigo.** O PR do `historia/STRY0000001` (o Peso do produto) foi só teste do workflow e mexe no mesmo Produto deste ticket. Feche sem merge e apague a branch.

### Na sua máquina

1. Instale o `git`, o GitHub CLI (`gh`) e uma das duas opções:
   - **Copilot CLI:** `npm install -g @github/copilot` (pede Node 22 ou mais novo) e, na primeira vez, `copilot` e `/login`;
   - **VS Code:** a extensão GitHub Copilot Chat, com o chat no modo **Agent**.
2. Entre nas duas contas no `gh` (uma de cada vez, no navegador):

```bash
gh auth login
```

3. Clone o repositório e entre nele:

```bash
gh repo clone andromarcio/loja-acme-simulacao
```

```bash
cd loja-acme-simulacao
```

4. Antes de cada parte, confira qual conta está ativa e troque quando o roteiro mandar:

```bash
gh auth status
```

```bash
gh auth switch --user andromarcio
```

O Copilot continua com a sua licença nas duas partes. Quem age no GitHub é a conta ativa do `gh` — como na CAIXA, onde a ferramenta do GitHub usa a conta de quem conversa.

5. Abra o agente na pasta do repositório (`copilot`, ou o VS Code com a pasta aberta). Na primeira conversa, confira que ele leu o `AGENTS.md`: ele deve começar confirmando o sistema. Se não confirmar, diga "leia o AGENTS.md e siga".

## Parte 1 — Analista: abrir o ticket

Conta ativa: `andromarcio`. Uma conversa nova.

> **1.1** Quero documentar a Loja ACME.

Esperado: "Sistema: LACME — Loja ACME, Docqui 8.3.1. É este?" (a versão é a do arquivo `VERSION`), sem falar em perfil.

> **1.2** Sim.

Esperado: os domínios e Agrupamentos Funcionais documentados e o menu.

> **1.3** Chegou um ticket novo para mim: STRY0013150 — Cadastro de produtos. Está no ServiceNow assim:
>
> "A equipe de vendas precisa manter o catálogo de produtos no próprio site: cadastrar, consultar, editar e retirar de venda os produtos, com nome, preço e quantidade em estoque."
>
> Critérios de aceite:
> CA-1 O produto é cadastrado com nome, preço e quantidade em estoque; os três são obrigatórios.
> CA-2 Não pode haver dois produtos com o mesmo nome.
> CA-3 O produto retirado de venda não aparece mais na loja, mas continua nos pedidos antigos.

Esperado: o agente segue o `PROMPT_AIMM`, uma pergunta por vez. Responda como analista; o que você não souber, diga "não sei, marque para a PO". Pontos em que ele deve parar e perguntar:

- se "retirar de venda" é excluir ou inativar (é inativar: o CA-3 diz que continua nos pedidos);
- quais funcionalidades já especificadas o CA-3 altera — a busca e a página do produto na Vitrine, os Destaques e o Carrinho leem o Produto;
- que o `VIT-NAV-02 — Pesquisar Produtos na Vitrine` já está sendo alterado por outro ticket, o STRY0013205 (Subcategorias). Um bom agente avisa do conflito em vez de seguir calado.

> **1.4** Pode gravar.

Esperado: antes de gravar, ele diz em uma frase o que vai gravar. Depois, cria a AIMM em `em-análise`, grava, abre o PR em rascunho e diz que as conferências estão rodando. Ele não deve falar em branch, commit nem PR. Depois de um ou dois minutos, peça "pode conferir?".

> **1.5** Como está o meu ticket?

Esperado: "em especificação", o que falta (o aval da PO no escopo) e o link da prévia (`https://andromarcio.github.io/loja-acme-simulacao/historia/STRY0013150/`).

## Parte 2 — PO: avalizar o escopo

Troque a conta: `gh auth switch --user androlouredo`. Conversa nova.

> **2.1** Sou a PO da Loja ACME. Quero ver o escopo do ticket STRY0013150 antes de liberar a especificação.

Esperado: o agente reconhece que a conta não é a autora, entra na parte de revisão, resume a AIMM em linguagem de negócio e não grava nada.

> **2.2** O escopo está de acordo. Registre um comentário dizendo: "Escopo avalizado pela PO. Retirar de venda é inativar; o produto continua nos pedidos."

Esperado: mostra o texto, pede o "sim" e registra um comentário (não uma aprovação: o ticket ainda nem foi especificado).

## Parte 3 — Analista: especificar

Volte: `gh auth switch --user andromarcio`. Conversa nova — o agente não lembra da anterior.

> **3.1** Continue o ticket STRY0013150 de onde parou.

Esperado: ele lê o que está gravado, encontra o comentário da PO e propõe registrar o aval na AIMM (`escopo-aprovado`, `avalizado-por`) antes de qualquer especificação.

> **3.2** Sim, registre o aval e siga.

> **3.3** Pode especificar o cadastro de produtos pelo CRUD padrão.

Esperado: o N2 de Produtos (`CAT-PRD`), os N3 do CRUD (Pesquisar, Cadastrar, Editar, Retirar de venda ou Inativar, Visualizar), a mudança no modelo de entidades (a situação do Produto) e os dicionários. Um artefato por vez, com o "sim" antes de cada gravação. Depois, as alterações das funcionalidades que o CA-3 atinge, pelo `PROMPT_4A`. Isso leva tempo: siga até ele dizer que acabou.

Durante a especificação, pergunte de vez em quando:

> **3.4** O que falta para mandar para a revisão?

Depois de cada gravação, ele deve dizer que as conferências estão rodando e parar. Espere um ou dois minutos e peça:

> **3.5** Pode conferir?

Esperado: o resultado das conferências. Se alguma reprovar por forma, ele corrige e diz o que corrigiu.

## Parte 4 — Analista: mandar para a revisão

> **4.1** Pode mandar para a revisão.

Esperado, num passo só: fecha a AIMM (`concluído`, com a Reconciliação), grava os checkpoints CP1 e CP2 nos N3 com o nome de quem revisa, põe a linha `Approved-by:` no fim da descrição e diz que as conferências estão rodando. Depois de um ou dois minutos, peça "pode conferir e mandar?": com tudo verde, ele tira do rascunho, pede a revisão ao `@androlouredo` e diz para quem foi.

> **4.2** Quais tickets estão comigo?

Esperado: o STRY0013150, "em revisão", com `@androlouredo`.

## Parte 5 — Revisão: pedir um ajuste

Troque: `gh auth switch --user androlouredo`. Conversa nova.

> **5.1** Quero revisar o ticket STRY0013150.

Esperado: o resumo do que mudou, por documento, com as funcionalidades como "ID — Nome", e a situação das conferências.

> **5.2** Peça para ajustar: o preço do produto tem de ser maior que zero, e isso não está nas regras do cadastro.

(Se a regra já estiver lá, invente outro ajuste pequeno, como uma mensagem mais clara para o nome repetido.)

Esperado: escreve o pedido em linguagem de negócio, apontando o documento e o trecho, mostra o texto, pede o "sim" e registra o pedido de mudanças.

## Parte 6 — Analista: ajustar

Volte: `gh auth switch --user andromarcio`. Conversa nova.

> **6.1** Como está o meu ticket?

Esperado: "ajuste pedido", com o resumo do que a PO pediu.

> **6.2** Vamos fazer o ajuste.

Esperado: ele conduz a correção e grava. Depois de um ou dois minutos, peça "pode conferir e mandar de novo?": com tudo verde, ele pede a revisão outra vez.

## Parte 7 — Revisão: aprovar

Troque: `gh auth switch --user androlouredo`. Conversa nova.

> **7.1** O ticket STRY0013150 voltou para mim. O que mudou desde a minha última revisão?

Esperado: só o ajuste, e as conferências.

> **7.2** Aprovo.

Esperado: confere que a conta não é a autora e que as conferências estão verdes, pede a confirmação e registra a aprovação.

## Parte 8 — Entrega (merge, à mão)

No site do GitHub, com a conta `androlouredo`, abra o PR e clique em **Merge pull request** (*Create a merge commit*). Confira que a mensagem termina com a linha `Approved-by:`. O agente não faz merge: na CAIXA, a entrega é do code owner.

Depois do merge, confira na aba *Actions* que o `spec-guard` do push na `main` passou, inclusive o job `aprovacao`, e que o `modules/INDEX.md` da `main` mostra as funcionalidades do Produto como 📋 especificadas.

## Parte 9 — Analista: retro

Volte: `gh auth switch --user andromarcio`. Na última conversa do analista:

> **9.1** Quer registrar o que aprendemos?

(Ou espere ele propor.) O que for do método vira uma issue no `docqui-caixa-engine`; o que for da Loja ACME vai para as regras do `CLAUDE.md`.

## O que observar

Anote, para cada parte, o que saiu diferente do esperado. O mais importante:

| # | Pergunta | Onde |
|---|---|---|
| O1 | Ele falou de branch, commit, PR ou check sem você usar esses termos? | Todas |
| O2 | Fez mais de uma pergunta por mensagem, ou gravou sem o "sim"? | 1, 3, 6 |
| O3 | Depois da gravação, disse que as conferências estavam rodando e esperou você pedir "pode conferir?", sem dizer que terminou? | 1.4, 3, 6 |
| O4 | Corrigiu sozinho o que era de forma e trouxe a você só o que era de negócio? | 3, 6 |
| O5 | Rodou algum script do repositório? (não devia: no Copilot Studio, nenhum roda) | Todas |
| O6 | Percebeu o conflito com o STRY0013205 no `VIT-NAV-02 — Pesquisar Produtos na Vitrine`? | 1.3 |
| O7 | Na revisão, resumiu em linguagem de negócio e recusou aprovar com conferência vermelha? | 5, 7 |
| O8 | O registro do checkpoint e o `Approved-by` antes da aprovação fizeram sentido para quem revisa? | 4.1, 7, 8 |
| O9 | Quanto tempo levou cada parte, e onde você se perdeu? | Todas |

O O8 é o ponto em aberto: hoje, quem manda para a revisão grava o nome de quem vai aprovar, e a aprovação do PR é que confirma. É essa a parte que ainda vamos decidir se automatizamos.

## Se der errado

| O que acontece | O que fazer |
|---|---|
| O agente não confirma o sistema no começo | Diga "leia o AGENTS.md e siga". No VS Code, confira que o chat está no modo Agent |
| Ele não consegue pedir a revisão ao `@androlouredo` | O convite de colaborador não foi aceito |
| O commit do `docqui-bot` não chega | Veja a aba *Actions*: o *Regenera arquivos gerados* precisa dos segredos do GitHub App |
| O check `entrega` fica vermelho durante a especificação | É esperado até o passo 4.1: ele só passa com a AIMM `concluído` e os N3 especificados |
| O merge está bloqueado | A caixa de merge diz o que falta: aprovação, check ou atualização com a `main` |
| Quer recomeçar do zero | Feche o PR sem merge, apague a branch `historia/STRY0013150` e comece pela Parte 1 |
