# DEFINICAO-FUNCIONALIDADE.md — o que é uma Funcionalidade (N3)

> **Fonte única da definição de funcionalidade** no Docqui Caixa. O skill
> (`analista-requisitos`), os prompts (3A/CRUD/WIZARD/TRIAGEM) e o validador semântico
> determinístico (`scripts/valida-semantica-funcionalidade.mjs`) derivam **deste arquivo** —
> não redefina "funcionalidade" em outro lugar; referencie aqui.
>
> ⚠️ **Contrato máquina-legível**: as tabelas das seções
> `## Vocabulário de verbos canônicos`, `## Pares de alternância (toggle)`,
> `## Termos bloqueados na posição do verbo` e `## Termos proibidos na Descrição`
> são **lidas programaticamente** pelo validador.
> Não renomeie esses títulos de seção nem mude o formato das tabelas
> (primeira coluna = termo).
>
> 🔧 **Ajuste por instância**: o vocabulário pode ser estendido/relaxado **sem editar
> este arquivo** via `global/VOCABULARY-OVERRIDES.md` da instância — ver a seção
> *Como estender o vocabulário → Overrides por instância*.

---

## Definição

Uma **funcionalidade (N3)** é a **unidade atômica de especificação**: uma **ação de negócio**
que um ator executa (ou dispara) no sistema, com **começo, meio, fim e resultado
observável**. A forma canônica do nome é **um verbo no infinitivo + uma entidade**:
*cadastrar cliente*, *calcular frete*, *aprovar solicitação*.

Decomposição da definição — cada parte é um teste:

- **Uma ação** — um único verbo. Se o nome precisa de "e"/"ou" para ligar dois verbos
  ("cadastrar **e** editar cliente"), são **duas** funcionalidades.
- **De negócio** — alguém de negócio raciocina sobre ela e a reconhece como algo que o
  sistema *faz por ele*. "Criar índice no banco" não passa; "importar arquivo de
  retorno" passa.
- **Um ator executa ou dispara** — dá para completar a frase *"O [ator] consegue
  [verbo] [entidade]"*. Vale também para ações disparadas por tempo/evento
  (*gerar cobrança mensal* — o ator é o próprio sistema, agindo pelo negócio).
- **Começo, meio, fim** — a ação termina; existe um momento claro de "pronto".
  "Monitorar" contínuo sem desfecho é tela/painel (N2 + comportamento de tela), não
  funcionalidade — a funcionalidade é *consultar/acompanhar [entidade]* com resultado exibido.
- **Resultado observável** — dá para escrever pelo menos um cenário Gherkin com
  **Então/Then** que passa ou falha. Sem resultado observável não há como aceitar a
  entrega — e não há funcionalidade.

## Critérios objetivos (FD-1 … FD-12)

Cada critério abaixo é **testável**. A coluna "Verificação" indica o que o gate
determinístico (`scripts/valida-semantica-funcionalidade.mjs`) checa sozinho e o que fica
para revisão humana (`PROMPT_REVIEW`). **FD-1 a FD-9** dizem se o artefato é uma
funcionalidade, e reprovam. **FD-10 a FD-12** dizem se o N3 sustenta a contagem de pontos de
função — de onde sai o ALR e se o número tem memória — e são **avisos**: não reprovam,
e rodam mesmo quando a Descrição reprova no FD-8.

| ID | Critério | Teste concreto | Verificação |
|---|---|---|---|
| FD-1 | **Nomeada por verbo no infinitivo** | Arquivo `f-[verbo]-[entidade](-[adjetivo]).md`; o primeiro segmento consta do vocabulário canônico (ou é infinitivo bem-formado ainda não catalogado → aviso) | Automática |
| FD-2 | **Título conta a mesma ação** | Título `# [Verbo] [entidade…]` começa com o **mesmo verbo** do nome do arquivo (acentos ignorados) | Automática |
| FD-3 | **Atômica — uma ação só** | Nome do arquivo e título não encadeiam **dois** verbos canônicos ("gerar e enviar boleto" → duas funcionalidades). **Exceção: pares de alternância** (`ativar/desativar`, `bloquear/desbloquear`) são **um** toggle — uma funcionalidade (ver "Pares de alternância (toggle)") | Automática |
| FD-4 | **Não é agrupador** | O termo na posição do verbo não é substantivo de área ("cadastro", "gestão", "painel" → isso é **Agrupamento Funcional/N2**) | Automática |
| FD-5 | **Não é outro artefato** | Não é campo, regra, tela, mensagem ou NFR nomeado como funcionalidade (ver tabela de bloqueados e encaminhamentos) | Automática + humana |
| FD-6 | **Resultado observável** | `## Cenários` tem pelo menos um cenário Gherkin e **todo** cenário tem `Então/Then` | Automática (presença) + humana (qualidade) |
| FD-7 | **Regras são invariantes** | Nenhum item de `## Regras de negócio` carrega reação do sistema ("não salva", "exibe mensagem", "conforme o Design System") — reação é cenário. Item que descreve estrutura/comportamento de tela (abas, botões, filtros, ordenação) gera **aviso**: apresentação vive em `## Comportamento de tela` | Automática (padrões) + humana |
| FD-8 | **Descrição declara a entrega** | `## Descrição` diz, em 1–2 frases de negócio, **o que a funcionalidade entrega** — sem placeholder, sem termo vago ("etc.", "de forma eficiente"), sem termo técnico, sem copiar a descrição de outra funcionalidade | Automática (padrões + duplicidade) + humana (sentido de negócio) |
| FD-9 | **Quantidade nomeada** | Toda menção a "as/os N [substantivo enumerável]" — também na contração: "dos/das", "nos/nas", "aos", "pelos/pelas" — (campos, configurações, grupos, abas, parâmetros, colunas, itens, regras, cenários, telas, estados, situações, perfis, funcionalidades, motivos) tem os N itens nomeados — na mesma frase, em subitens logo abaixo, em tabela/lista da seção que não seja a lista da própria frase, ou na seção `## Campos` do documento (para substantivos de campo) | Automática |
| FD-10 | **Proveniência dos campos** | `## Campos` tem a coluna `Entidade`; todo campo de lista ou seleção (`lista de opções`, `lista (A, B)`, `seleção → [Entidade]`) diz de onde vêm as opções — a entidade de origem, ou `dado de código` para valores fixos (fora do ALR, CPM 5.4.2d); vazio, `—` e `⚠️ a definir` não valem. Em `seleção → X`, o X é a mesma entidade da coluna `Entidade` | Automática (aviso) |
| FD-11 | **Contagem com memória** | Toda linha **já contada** de `## Métricas de tamanho` (EE/SE/CE com ALR e DER numéricos) tem `### Memória de cálculo` na seção; linha com `—` não é cobrada | Automática (aviso) |
| FD-12 | **Entidade tocada declarada** | Entidade de `global/data-models/` citada em `## Regras de negócio` ou `## Campos automáticos` aparece numa fonte que a contagem lê: coluna `Entidade`, `seleção → X`, a entidade entre parênteses em `Campos-fonte (Entidade)` de `## Derivações`, ou `## Dados lidos e gravados`. Casa nomes sem acento, caixa e conectivos; não conta a menção dentro de um rótulo de campo da própria funcionalidade (`## Campos`, cada parte do rótulo agrupado), a precedida de "Tipo de" nem a que está numa referência `→ ver …`; só roda com a coluna `Entidade` preenchida | Automática (aviso, heurística por nome) + humana |

## Teste rápido (para o analista, antes de abrir o PROMPT_3A)

1. Complete: *"O usuário consegue **[verbo]** **[entidade]**"*. Não conseguiu? Não é
   funcionalidade (ainda).
2. Existe um momento claro de **"pronto"**, com resultado que dá para verificar? Se
   não, você está descrevendo uma tela, um painel ou um processo — não uma ação.
3. A ação **grava, atualiza, cancela, calcula ou recupera dados de negócio**? Um passo
   puramente de tela (abrir modal, alternar aba, preencher campo) não faz nenhum dos
   dois — é `## Comportamento de tela` de alguma funcionalidade, não uma funcionalidade. (Consulta
   conta: *pesquisar/visualizar* recuperam dados de negócio.)
4. Se dividir em duas partes, **cada parte entrega valor sozinha**? Se sim, são duas
   funcionalidades. E o teste inverso ("E daí?"): se o usuário executar **apenas esta ação** e
   sair do sistema, ele resolveu algo real de negócio? Preencheu um campo e saiu — nada
   aconteceu, não é funcionalidade; emitiu o pedido e saiu — o pedido existe, é funcionalidade.
5. É um **item de uma lista dentro de outro registro**? Então pergunte *quando ele é
   gravado*: se o item é persistido no instante em que é confirmado, sobre um pai que já
   existe, ele tem "pronto" próprio → **é funcionalidade**. Se só é persistido quando o pai é
   salvo, é **campo** da funcionalidade do pai (ex.: `CTR-FAB-03`, que grava analistas e
   gerentes junto com a fábrica).

   **Terceiro caso — o item nunca é persistido.** Ele vive só na sessão até que outra funcionalidade o transforme: carrinho de compra, seleção acumulada, rascunho em memória. A pergunta "quando é gravado" não decide, porque a resposta é "nunca" — e ler isso como "campo do pai" apaga da especificação ações que têm regra e teste próprios. Quem decide é o teste 4: se a ação tem **regra de negócio própria** (validação, unicidade, cálculo) e um **resultado que o ator declara pronto**, é funcionalidade — e uma funcionalidade que **não gera Ponto de Função** (ver *Granularidade e contagem são decisões independentes*). Não confunda com "abrir modal" ou "alternar aba", que não têm nem regra nem "pronto" e seguem em `## Comportamento de tela`.

6. **Nenhuma validação ou decisão de negócio** acontece durante a ação? Desconfie —
   ação puramente mecânica ("rolar a página") não é funcionalidade. Mas é um cheiro, não um
   gate: funcionalidade simples pode ter poucas regras; **não invente regras para "passar"**
   (regra é consequência do negócio, não pré-requisito da funcionalidade).
7. O nome é um **substantivo** ("Cadastro de Clientes", "Gestão de Contratos")? Então é
   um **Agrupamento Funcional (N2)** — as funcionalidades são as ações dentro dele.

## O que NÃO é uma funcionalidade — e para onde vai

| Isto… | …não é funcionalidade porque | Encaminhamento |
|---|---|---|
| Um **campo** ("CPF do cliente") | é um dado, não uma ação | tabela de Campos do N3 + `global/data-models/[dominio].md` |
| Uma **regra de negócio** ("CPF é único") | é uma invariante, não uma ação | `## Regras de negócio` do N3 ou `RULES-DICTIONARY` |
| Uma **tela** ("Tela de clientes") | uma tela atende **várias** funcionalidades | N2 (seção Telas) + `## Comportamento de tela` dos N3 |
| Uma **mensagem** ("Aviso de duplicidade") | é reação do sistema dentro de um cenário | `MESSAGE-DICTIONARY` + `## Cenários` |
| Um **requisito não-funcional** ("Responder em 2s") | descreve *quão bem*, não *o quê* | `global/NFR.md` |
| Um **agrupador** ("Cadastro de Clientes") | agrupa várias ações | **Agrupamento Funcional (N2)** — cada ação vira um N3 |
| Uma **etapa de wizard** ("Passo 2 — endereço") | não entrega valor sozinha | parte da funcionalidade principal do wizard (`PROMPT_WIZARD`) |
| Uma **melhoria/ajuste** ("Melhorar a pesquisa") | é manutenção de funcionalidade existente | `PROMPT_4A`/`PROMPT_4B` sobre o N3 já existente |
| Uma **diferença de permissão** ("só o gestor pode aprovar") | permissão é atributo de quem executa, não uma ação nova | matriz `## Permissões por perfil` do N2 |
| Um **passo de interação de tela** ("abrir modal", "alternar aba", "preencher campo") | não altera estado nem recupera dados de negócio | `## Comportamento de tela` do N3 da funcionalidade a que o passo serve |
| Um **modal que é subformulário** de outro formulário ("incluir item" num modal que só grava junto com o pedido) | não tem "pronto" próprio: os dados só são gravados com o registro-pai (teste 5) | `## Comportamento de tela` e `## Campos` da funcionalidade do pai. O modal com conteúdo próprio — detalhe de um registro, consulta, formulário que não é subformulário de outro — **é** N3, com a Superfície **Modal** *(decisão do PO, 2026-09-27)* |
| Uma **exportação em outro formato** da mesma saída ("Exportar relatório em PDF/Excel") | formato diferente não quebra a lógica de processamento — é a mesma funcionalidade noutro invólucro (`SIZING.md` §9: conta **1×** na APF) | ação em tela no `## Comportamento de tela` do relatório. **Exceção**: exportação com lógica/dados próprios (colunas, agregações ou cálculos que a tela não faz) é funcionalidade/PE distinto |

## Granularidade e contagem são decisões independentes

Este arquivo decide **o que é uma funcionalidade** — a unidade de especificação, de teste e de rastreabilidade. Quem decide **o que tem tamanho funcional** é o CPM do IFPUG: processo elementar contável exige dado mantido em Arquivo Lógico Interno ou recuperado de arquivo lógico. São dois testes com propósitos distintos, e um não implica o outro. Daí duas proibições, nas duas direções:

- **Não apague uma funcionalidade porque ela dá zero PF.** Uma funcionalidade legítima pode ter tamanho funcional nulo — é o caso das ações sobre estado efêmero de sessão (terceiro caso do teste 5). Zero ali é o resultado correto da contagem, não uma lacuna a corrigir: a `## Métricas de tamanho` registra `0 PF` e a memória de cálculo diz por quê; a funcionalidade segue especificada, porque teste e rastreabilidade continuam precisando dela.
- **Não invente persistência porque decidiu que é funcionalidade.** Se um dado é gravado ou não é **fato do sistema** — apura-se no código, na migration ou com o PO —, nunca conclusão tirada da granularidade da spec. Inverter a direção cria entidade no data-model, ALI na contagem e DER nas transações vizinhas em cima de uma inferência; e o desmonte não sai de graça, porque `## Changelog` é histórico e não se reescreve.

## Vocabulário de verbos canônicos

Verbos aceitos na **posição do verbo** — o primeiro segmento do arquivo
`f-[verbo]-…` e a primeira palavra do título. No arquivo a grafia é kebab-case **sem
acento** (`lancar`); no título pode acentuar (`Lançar`) — a comparação ignora acentos.
A lista vale para o **slot do verbo**: os mesmos termos são livres como entidade
(`f-lancar-pagamento` ✓; `f-pagamento-cliente` ✗).

| Verbo | Categoria |
|---|---|
| `cadastrar` | CRUD e ciclo de vida |
| `criar` | CRUD e ciclo de vida |
| `registrar` | CRUD e ciclo de vida |
| `incluir` | CRUD e ciclo de vida |
| `adicionar` | CRUD e ciclo de vida |
| `editar` | CRUD e ciclo de vida |
| `alterar` | CRUD e ciclo de vida |
| `atualizar` | CRUD e ciclo de vida |
| `excluir` | CRUD e ciclo de vida |
| `remover` | CRUD e ciclo de vida |
| `desativar` | CRUD e ciclo de vida |
| `ativar` | CRUD e ciclo de vida |
| `inativar` | CRUD e ciclo de vida |
| `reativar` | CRUD e ciclo de vida |
| `arquivar` | CRUD e ciclo de vida |
| `restaurar` | CRUD e ciclo de vida |
| `duplicar` | CRUD e ciclo de vida |
| `clonar` | CRUD e ciclo de vida |
| `renomear` | CRUD e ciclo de vida |
| `reordenar` | CRUD e ciclo de vida |
| `pesquisar` | Consulta |
| `listar` | Consulta |
| `consultar` | Consulta |
| `buscar` | Consulta |
| `visualizar` | Consulta |
| `detalhar` | Consulta |
| `filtrar` | Consulta |
| `acompanhar` | Consulta |
| `monitorar` | Consulta |
| `comparar` | Consulta |
| `auditar` | Consulta |
| `aprovar` | Fluxo e decisão |
| `reprovar` | Fluxo e decisão |
| `rejeitar` | Fluxo e decisão |
| `devolver` | Fluxo e decisão |
| `revisar` | Fluxo e decisão |
| `submeter` | Fluxo e decisão |
| `enviar` | Fluxo e decisão |
| `reenviar` | Fluxo e decisão |
| `cancelar` | Fluxo e decisão |
| `suspender` | Fluxo e decisão |
| `retomar` | Fluxo e decisão |
| `concluir` | Fluxo e decisão |
| `finalizar` | Fluxo e decisão |
| `encerrar` | Fluxo e decisão |
| `iniciar` | Fluxo e decisão |
| `agendar` | Fluxo e decisão |
| `reagendar` | Fluxo e decisão |
| `atribuir` | Fluxo e decisão |
| `reatribuir` | Fluxo e decisão |
| `transferir` | Fluxo e decisão |
| `delegar` | Fluxo e decisão |
| `priorizar` | Fluxo e decisão |
| `homologar` | Fluxo e decisão |
| `autorizar` | Fluxo e decisão |
| `liberar` | Fluxo e decisão |
| `bloquear` | Fluxo e decisão |
| `desbloquear` | Fluxo e decisão |
| `publicar` | Fluxo e decisão |
| `despublicar` | Fluxo e decisão |
| `assinar` | Fluxo e decisão |
| `confirmar` | Fluxo e decisão |
| `contestar` | Fluxo e decisão |
| `justificar` | Fluxo e decisão |
| `calcular` | Cálculo e processamento |
| `recalcular` | Cálculo e processamento |
| `gerar` | Cálculo e processamento |
| `emitir` | Cálculo e processamento |
| `processar` | Cálculo e processamento |
| `reprocessar` | Cálculo e processamento |
| `validar` | Cálculo e processamento |
| `verificar` | Cálculo e processamento |
| `conciliar` | Cálculo e processamento |
| `consolidar` | Cálculo e processamento |
| `apurar` | Cálculo e processamento |
| `simular` | Cálculo e processamento |
| `converter` | Cálculo e processamento |
| `classificar` | Cálculo e processamento |
| `estimar` | Cálculo e processamento |
| `projetar` | Cálculo e processamento |
| `ratear` | Cálculo e processamento |
| `distribuir` | Cálculo e processamento |
| `lancar` | Cálculo e processamento |
| `importar` | Dados e integração |
| `exportar` | Dados e integração |
| `sincronizar` | Dados e integração |
| `notificar` | Dados e integração |
| `anexar` | Dados e integração |
| `desanexar` | Dados e integração |
| `baixar` | Dados e integração |
| `carregar` | Dados e integração |
| `imprimir` | Dados e integração |
| `compartilhar` | Dados e integração |
| `migrar` | Dados e integração |
| `autenticar` | Conta, acesso e parametrização |
| `recuperar` | Conta, acesso e parametrização |
| `redefinir` | Conta, acesso e parametrização |
| `vincular` | Conta, acesso e parametrização |
| `desvincular` | Conta, acesso e parametrização |
| `associar` | Conta, acesso e parametrização |
| `desassociar` | Conta, acesso e parametrização |
| `configurar` | Conta, acesso e parametrização |
| `definir` | Conta, acesso e parametrização |
| `parametrizar` | Conta, acesso e parametrização |
| `conceder` | Conta, acesso e parametrização |
| `revogar` | Conta, acesso e parametrização |
| `solicitar` | Conta, acesso e parametrização |
| `responder` | Conta, acesso e parametrização |
| `avaliar` | Conta, acesso e parametrização |
| `comentar` | Conta, acesso e parametrização |
| `pagar` | Financeiro |
| `estornar` | Financeiro |
| `faturar` | Financeiro |
| `cobrar` | Financeiro |
| `renovar` | Financeiro |
| `quitar` | Financeiro |
| `parcelar` | Financeiro |
| `provisionar` | Financeiro |
| `treinar` | Engenharia e dados |
| `retreinar` | Engenharia e dados |
| `refinar` | Engenharia e dados |
| `destilar` | Engenharia e dados |
| `calibrar` | Engenharia e dados |
| `quantizar` | Engenharia e dados |
| `servir` | Engenharia e dados |
| `implantar` | Engenharia e dados |
| `inferir` | Engenharia e dados |
| `preparar` | Engenharia e dados |
| `preprocessar` | Engenharia e dados |
| `transformar` | Engenharia e dados |
| `normalizar` | Engenharia e dados |
| `amostrar` | Engenharia e dados |
| `particionar` | Engenharia e dados |
| `rotular` | Engenharia e dados |
| `anotar` | Engenharia e dados |
| `versionar` | Engenharia e dados |
| `indexar` | Engenharia e dados |
| `empacotar` | Engenharia e dados |
| `extrair` | Engenharia e dados |

> **Engenharia e dados** — ações de negócio de produtos cujo usuário é engenheiro/
> pesquisador e cuja entrega é um artefato processado (modelo, dataset, cache,
> índice): *treinar draft model*, *preparar dados de treino*, *servir modelo*.
> Pela Regra 10 da skill, quando o produto da funcionalidade É o artefato, os atributos
> dele são negociais — esses verbos passam no teste "o [ator] consegue [verbo]
> [entidade]" com ator pesquisador/operador de pipeline. Grafia de `preprocessar`:
> colada, sem hífen, no arquivo **e** no título (`f-preprocessar-corpus` /
> "Preprocessar corpus") — o slot do verbo é o primeiro segmento do kebab-case,
> então verbo hifenizado quebraria a detecção (mesma lógica de `lancar`).

## Pares de alternância (toggle)

Um par de **verbos antônimos** que descreve a **alternância de um estado binário**
é **uma funcionalidade**, não duas — o botão é contextual (mostra "Desativar" quando ativo,
"Ativar" quando inativo), o endpoint é um só, e a ação tem começo/meio/fim e resultado
observável (o estado inverteu). Por isso a FD-3 **não** reprova o encadeamento dos dois
verbos **quando eles formam exatamente um dos pares abaixo** (e nenhum terceiro verbo).

O nome canônico do arquivo é `f-[verbo-a]-[verbo-b]-[entidade]` e o título espelha
(`[Verbo-a]/[Verbo-b] [Entidade]`) — ex.: `f-ativar-desativar-contrato` /
"Ativar/Desativar Contrato". Muitas organizações adotam esse par como **padrão de
nomenclatura** da baixa reversível.

| Verbo A | Verbo B | Justificativa (estado binário alternado) |
|---|---|---|
| `ativar` | `desativar` | Situação Ativo ⟷ Inativo (baixa reversível — o padrão mais comum) |
| `ativar` | `inativar` | Variante lexical de Ativo ⟷ Inativo |
| `bloquear` | `desbloquear` | Acesso/uso liberado ⟷ bloqueado |
| `habilitar` | `desabilitar` | Recurso habilitado ⟷ desabilitado |

> Só o **par exato** é isento. "Pesquisar e Exportar" continua reprovando (não são
> antônimos de um estado — são duas ações de valor próprio). Se a sua organização usa
> outro par de antônimos, acrescente uma linha aqui (o gate lê esta tabela).

## Termos bloqueados na posição do verbo

Termos que, aparecendo como primeiro segmento do `f-…` ou primeira palavra do título,
**denunciam que aquilo não é uma funcionalidade**. O validador reprova com o encaminhamento
da terceira coluna. (Grafia sem acento — a comparação normaliza acentos.)

| Termo | O que provavelmente é | Encaminhamento |
|---|---|---|
| `cadastro` | agrupador de ações CRUD | Agrupamento Funcional (N2); as ações viram `f-cadastrar-…`, `f-pesquisar-…` etc. (`PROMPT_CRUD`) |
| `cadastramento` | agrupador de ações CRUD | Agrupamento Funcional (N2) + funcionalidades por ação |
| `gestao` | área/agrupador | Agrupamento Funcional (N2) ou Domínio (N1) |
| `gerenciamento` | área/agrupador | Agrupamento Funcional (N2) ou Domínio (N1) |
| `manutencao` | área/agrupador | Agrupamento Funcional (N2); cada ação vira uma funcionalidade |
| `controle` | área/agrupador | Agrupamento Funcional (N2) |
| `administracao` | área/agrupador | Agrupamento Funcional (N2) ou Domínio (N1) |
| `modulo` | agrupador | Domínio (N1) ou Agrupamento Funcional (N2) |
| `area` | agrupador | Domínio (N1) ou Agrupamento Funcional (N2) |
| `painel` | tela que atende várias funcionalidades | N2 (Telas) + uma funcionalidade `consultar/acompanhar` por ação |
| `dashboard` | tela que atende várias funcionalidades | N2 (Telas) + funcionalidades de consulta |
| `portal` | agrupador | Domínio (N1) |
| `central` | agrupador | Agrupamento Funcional (N2) |
| `fluxo` | processo com várias ações | Agrupamento Funcional (N2) ou `PROMPT_WIZARD` |
| `processo` | processo com várias ações | Agrupamento Funcional (N2) ou `PROMPT_WIZARD` |
| `esteira` | processo com várias ações | Agrupamento Funcional (N2) |
| `jornada` | processo com várias ações | Agrupamento Funcional (N2) |
| `pesquisa` | nominalização de ação | use o verbo: `f-pesquisar-…` |
| `consulta` | nominalização de ação | use o verbo: `f-consultar-…` |
| `listagem` | nominalização de ação | use o verbo: `f-listar-…` |
| `busca` | nominalização de ação | use o verbo: `f-buscar-…` |
| `edicao` | nominalização de ação | use o verbo: `f-editar-…` |
| `exclusao` | nominalização de ação | use o verbo: `f-excluir-…` |
| `criacao` | nominalização de ação | use o verbo: `f-criar-…` |
| `inclusao` | nominalização de ação | use o verbo: `f-incluir-…` |
| `alteracao` | nominalização de ação | use o verbo: `f-alterar-…` |
| `atualizacao` | nominalização de ação | use o verbo: `f-atualizar-…` |
| `visualizacao` | nominalização de ação | use o verbo: `f-visualizar-…` |
| `importacao` | nominalização de ação | use o verbo: `f-importar-…` |
| `exportacao` | nominalização de ação | use o verbo: `f-exportar-…` |
| `emissao` | nominalização de ação | use o verbo: `f-emitir-…` |
| `geracao` | nominalização de ação | use o verbo: `f-gerar-…` |
| `aprovacao` | nominalização de ação | use o verbo: `f-aprovar-…` |
| `envio` | nominalização de ação | use o verbo: `f-enviar-…` |
| `cancelamento` | nominalização de ação | use o verbo: `f-cancelar-…` |
| `agendamento` | nominalização de ação | use o verbo: `f-agendar-…` |
| `configuracao` | nominalização de ação | use o verbo: `f-configurar-…` |
| `autenticacao` | nominalização de ação | use o verbo: `f-autenticar-…` |
| `integracao` | nominalização de ação | use o verbo (`f-sincronizar-…`, `f-importar-…`) ou N2 se agrupar várias |
| `sincronizacao` | nominalização de ação | use o verbo: `f-sincronizar-…` |
| `cobranca` | nominalização de ação | use o verbo: `f-cobrar-…` / `f-gerar-cobranca` |
| `faturamento` | nominalização de ação | use o verbo: `f-faturar-…` |
| `pagamento` | nominalização de ação | use o verbo: `f-pagar-…` / `f-lancar-pagamento` |
| `campo` | dado, não ação | tabela de Campos + `global/data-models/[dominio].md` |
| `tela` | tela atende várias funcionalidades | N2 (Telas) + `## Comportamento de tela` |
| `formulario` | tela/componente | N2 (Telas); a ação é a funcionalidade |
| `modal` | componente de tela | `## Comportamento de tela` da funcionalidade dona da ação |
| `botao` | componente de tela | `## Comportamento de tela` da funcionalidade dona da ação |
| `tabela` | componente de tela | `## Colunas do resultado` da funcionalidade de pesquisa |
| `grid` | componente de tela | `## Colunas do resultado` da funcionalidade de pesquisa |
| `relatorio` | saída de uma ação | use o verbo: `f-gerar-relatorio-…` / `f-emitir-…` |
| `grafico` | componente de tela | `## Comportamento de tela` da funcionalidade de consulta |
| `regra` | invariante, não ação | `## Regras de negócio` ou `RULES-DICTIONARY` |
| `validacao` | regra/reação | regra (invariante) + cenário (reação) |
| `mensagem` | reação do sistema | `MESSAGE-DICTIONARY` + `## Cenários` |
| `erro` | reação do sistema | `ERROR-DICTIONARY` + `## Cenários` |
| `alerta` | reação do sistema | `MESSAGE-DICTIONARY` + `## Cenários` |
| `api` | camada técnica | seção `dev-only` do N3 dono da ação |
| `endpoint` | camada técnica | seção `dev-only` do N3 dono da ação |
| `servico` | camada técnica | seção `dev-only` / SDD |
| `crud` | agrupador de ações | `PROMPT_CRUD` (gera N2 + os 5 N3) |
| `wizard` | processo multi-etapas | `PROMPT_WIZARD` (gera N2 + funcionalidade principal e auxiliares) |
| `login` | nominalização | use o verbo: `f-autenticar-usuario` |
| `logout` | nominalização | use o verbo: `f-encerrar-sessao` |
| `desempenho` | NFR (*quão bem*) | `global/NFR.md` |
| `performance` | NFR (*quão bem*) | `global/NFR.md` |
| `seguranca` | NFR (*quão bem*) | `global/NFR.md` |
| `disponibilidade` | NFR (*quão bem*) | `global/NFR.md` |
| `escalabilidade` | NFR (*quão bem*) | `global/NFR.md` |
| `usabilidade` | NFR (*quão bem*) | `global/NFR.md` |
| `auditoria` | NFR transversal | `global/NFR.md`; a consulta da trilha é uma funcionalidade de consulta: `f-consultar-trilha-auditoria` |
| `backup` | NFR/operação técnica | `global/NFR.md` |
| `log` | efeito técnico | `dev-only` (AuditLog) ou `global/NFR.md` |
| `monitoramento` | NFR/operação | `global/NFR.md`; consulta de indicadores é `f-acompanhar-…` |
| `infraestrutura` | técnico | fora do escopo de N3 (SDD/NFR) |
| `melhoria` | manutenção de funcionalidade existente | `PROMPT_4A`/`PROMPT_4B` no N3 existente |
| `ajuste` | manutenção de funcionalidade existente | `PROMPT_4A`/`PROMPT_4B` no N3 existente |
| `correcao` | manutenção/bug | `PROMPT_4A`/`PROMPT_4B` no N3 existente |
| `refatoracao` | técnico | fora do escopo de N3 |
| `suporte` | área/agrupador | Domínio (N1) ou Agrupamento Funcional (N2) |

## Descrição — o contrato de entrega (FD-8)

> A `## Descrição` tem **duas camadas em parágrafos consecutivos**: o **1º é o contrato de entrega** (esta seção) e o **2º é o "como se usa"** — por onde se chega, o que se informa, o que se aciona (ou, em Job/CLI, o que dispara a execução). O **FD-8 mede apenas o 1º parágrafo**; o 2º não é medido. A regra por extenso do 2º parágrafo vive no gabarito do `PROMPT_3A` e no comentário do template N3; o validador (`valida-semantica-funcionalidade → descriptionText`) recorta o 1º parágrafo justamente para não acusar toda funcionalidade de "Descrição longa".

A `## Descrição` do N3 é o **contrato de entrega** da funcionalidade: em **1–2 frases de
negócio**, para alguém que nunca viu o sistema, ela responde *"o que eu ganho quando
esta funcionalidade estiver pronta?"*. Três qualidades, na linguagem do analista:

- **Tangível** — nomeia a **ação e o resultado**, não uma intenção. Se a frase não
  contém nenhum verbo de ação (só "facilita", "melhora", "otimiza"), não há entrega.
- **Única** — em dois sentidos: a funcionalidade entrega **uma** coisa (se a descrição precisa
  de "e também…", provavelmente são duas funcionalidades — ver FD-3); e a entrega é **dela**
  (duas funcionalidades com a mesma descrição são a mesma funcionalidade duplicada ou uma descrição
  genérica demais).
- **Negocial** — linguagem de negócio pura (Modo PO): nada de endpoint, API, banco,
  JSON. E alguém de negócio reconhece valor na frase — este último julgamento é humano.

**Fórmula sugerida** (não obrigatória, mas resolve 90% dos casos):

> *"Permite que [ator] [ação] [entidade], [resultado/efeito observável]."*

| ❌ Não passa | Por quê | ✅ Passa |
|---|---|---|
| "Cadastro de clientes." | não é frase de entrega — é o nome de um agrupador | "Permite registrar um novo cliente com seus dados básicos, deixando-o disponível para os demais processos." |
| "Facilita a gestão de contratos de forma eficiente." | intenção vaga, sem ação nem resultado | "Permite suspender um contrato vigente, interrompendo as cobranças até a reativação." |
| "Endpoint que grava o cliente na tabela `clients`." | técnico — Modo PO não fala de endpoint/tabela | "Permite registrar um novo cliente…" (o técnico vai para o `dev-only`/3B) |
| (mesma descrição em dois N3) | a entrega não é única — ou é duplicata, ou é genérica | cada N3 descreve **a sua** entrega |

## Termos proibidos na Descrição

Termos que reprovam a Descrição no gate (comparação sem acento, palavra/frase
inteira). `vago` = não declara entrega tangível; `tecnico` = vaza camada técnica no
Modo PO.

| Termo | Tipo | Orientação |
|---|---|---|
| `etc` | vago | liste o que entra — ou corte; "etc." esconde escopo |
| `entre outros` | vago | idem: escopo escondido |
| `entre outras` | vago | idem: escopo escondido |
| `e afins` | vago | idem: escopo escondido |
| `e assim por diante` | vago | idem: escopo escondido |
| `diversas funcionalidades` | vago | cada funcionalidade é uma funcionalidade — nomeie a desta |
| `varias funcionalidades` | vago | cada funcionalidade é uma funcionalidade — nomeie a desta |
| `de forma eficiente` | vago | eficiência é NFR (`global/NFR.md`); a descrição diz a entrega |
| `de maneira eficiente` | vago | idem |
| `de forma agil` | vago | idem |
| `de forma rapida` | vago | idem (se for requisito de tempo, é NFR) |
| `de forma facil` | vago | facilidade é NFR/UX; a descrição diz a entrega |
| `de forma simples` | vago | idem |
| `melhorar a experiencia` | vago | intenção, não entrega — diga o que muda para o usuário |
| `otimizar o processo` | vago | intenção, não entrega — diga o que a funcionalidade faz |
| `facilitar o dia a dia` | vago | intenção, não entrega |
| `endpoint` | tecnico | Modo PO: "operação de API" — e só no `dev-only`/3B |
| `api` | tecnico | camada técnica — `dev-only`/3B |
| `backend` | tecnico | camada técnica — `dev-only`/3B |
| `frontend` | tecnico | camada técnica — `dev-only`/3B |
| `banco de dados` | tecnico | Modo PO: a estrutura física vive no data-model |
| `sql` | tecnico | camada técnica — data-model |
| `json` | tecnico | camada técnica — `dev-only`/3B |
| `http` | tecnico | camada técnica — `dev-only`/3B |
| `payload` | tecnico | camada técnica — `dev-only`/3B |
| `request` | tecnico | camada técnica — `dev-only`/3B |
| `webhook` | tecnico | Modo PO: "notificação automática entre sistemas" |
| `microsservico` | tecnico | camada técnica — SDD |
| `microservico` | tecnico | camada técnica — SDD |
| `uuid` | tecnico | Modo PO: "identificador único" |
| `enum` | tecnico | Modo PO: "lista de opções" |
| `cache` | tecnico | camada técnica — `dev-only`/3B |
| `deploy` | tecnico | fora do escopo do N3 |
| `migration` | tecnico | Modo PO: "estrutura do banco de dados" — e no data-model |
| `crud` | tecnico | nomeie a ação desta funcionalidade; o conjunto é o N2 (`PROMPT_CRUD`) |

## Quantidade nomeada (FD-9)

Cada N3 é **autocontido** (Modo PO) — quem lê só ele não deve precisar abrir
outro artefato para saber do que a spec fala. Por isso, toda vez que o texto
**quantifica** um conjunto ("as cinco configurações", "os dois grupos", "as
três abas"), os itens do conjunto precisam estar **nomeados** — a contagem
sozinha não basta.

| ❌ Não passa | Por quê | ✅ Passa |
|---|---|---|
| "exibe as cinco configurações em formato rótulo-valor" | quem lê só este arquivo não sabe quais são as 5 | "exibe as cinco configurações: Prazo para abertura de divergência, Apresentar mensagem informativa, Mensagem informativa, Indisponibilizar sistema, Mensagem de sistema indisponível" (ou tabela ao lado, na mesma seção) |
| "os dois campos de contexto" (sem nomear) | idem | "os dois campos de contexto (Tipo de Fluxo e Tipo de Contrato)" |
| "3. O cancelamento exige um dos dois motivos aceitos." (numa lista de três regras) | as outras regras da lista não são os motivos | "3. O cancelamento exige um dos dois motivos aceitos (Desistência e Atraso)." |

Formas aceitas de nomear os itens:
- **Na própria frase** — com `:` seguido de lista, ou entre parênteses
  (`"... (A e B)"`, `"... (A, B e C)"`).
- **Em subitens logo abaixo** — o item da frase termina em `:` e os N itens vêm numa sublista indentada embaixo dele.
- **Em tabela/lista da mesma seção `## `** — o gate conta linhas de tabela (exceto cabeçalho) e itens de lista/numerados da seção onde a frase está, **menos os itens irmãos da lista em que a própria frase está**: numa seção de regras numeradas, as outras regras não nomeiam os motivos citados na regra 3. Numa tabela, as linhas irmãs contam — numa tabela de colunas ou de campos, costumam ser os itens citados.
- **Na seção `## Campos` do documento** — só para substantivos de campo
  (`campo`, `configuração`, `parâmetro`): é ali que a tabela de campos mora
  por convenção; outra seção pode se referir a ela só pela contagem.

Isto não é duplicação proibida (regra "não repetir NFR/regra canônica") —
essa regra vale para conteúdo **compartilhado entre funcionalidades** (RULES-
DICTIONARY, NFR). Aqui o conjunto pertence **à própria funcionalidade**; resumir
sem nomear é omissão, não DRY.

## Como estender o vocabulário

- **Verbo legítimo que não está na tabela** (ex.: um verbo específico do domínio do
  produto): o validador emite **aviso** (não erro) quando o termo tem forma de
  infinitivo (`…ar`/`…er`/`…ir`). Confirme que é uma ação de negócio e **adicione a
  linha** na tabela de verbos — o aviso desaparece e o verbo passa a valer para todas
  as instâncias.
- **Termo que denuncia não-funcionalidade** e ainda não está bloqueado: adicione à tabela de
  bloqueados com o encaminhamento correto.
- Mudanças aqui são mudanças de **contrato do framework**: registre no `CHANGELOG.md`.

### Overrides por instância (sem editar o engine)

Um termo não é técnico ou negocial *por natureza* — depende do produto (Regra 10 da
skill): `cache` vaza camada técnica num CRM, mas é a **entidade central** de um
pipeline de ML (*target cache*); `dashboard` é componente de tela num ERP, mas pode
ser o produto de uma ferramenta de BI. Para esses casos a instância mantém um
`global/VOCABULARY-OVERRIDES.md` (modelo em `engine/templates/global/`), lido
automaticamente pelo `valida-semantica-funcionalidade.mjs` junto com as tabelas deste
arquivo. Seções máquina-legíveis (primeira coluna = termo, mesmo formato daqui):

| Seção do VOCABULARY-OVERRIDES.md | Efeito no gate |
|---|---|
| `## Verbos adicionais da instância` | o verbo entra no vocabulário canônico (FD-1 sem aviso; conta para a atomicidade FD-3) |
| `## Termos liberados na posição do verbo` | o termo sai da tabela de bloqueados (FD-4) **nesta instância** |
| `## Termos liberados na Descrição` | o termo sai dos proibidos da Descrição (FD-8) **nesta instância** |
| `## Termos adicionais proibidos na Descrição` | o termo passa a reprovar a Descrição nesta instância |

O override é **da instância**: não altera o contrato do framework nem as demais
instâncias. Todo termo liberado deve trazer a justificativa na segunda coluna —
é ela que o revisor humano confere (o gate não julga o motivo).

## Verificação automática — o que o gate cobre (e o que não cobre)

```
node scripts/valida-semantica-funcionalidade.mjs <modules/.../f-….md>
```

Roda também automaticamente no hook `PostToolUse` (`scripts/hooks/spec-guard.mjs`) a
cada N3 gravado, junto com o gate estrutural (`validate-doc.mjs`).

**Coberto deterministicamente** (independe de LLM): FD-1 a FD-9 conforme a tabela de
critérios — verbo no infinitivo catalogado, título coerente com o arquivo, atomicidade
(um verbo só), termos bloqueados (agrupador/nominalização/artefato/NFR), presença de
cenário com `Então/Then` em todos os cenários, regras sem cauda de reação e Descrição
com entrega declarada: sem placeholder, tamanho de 1–2 frases, sem termos vagos ou
técnicos (tabela acima), com menção a uma ação do vocabulário (aviso quando ausente) e
**não duplicada** — o gate varre os demais N3 da instância e reprova descrição idêntica
(quase idêntica gera aviso); e FD-9 — nenhuma menção a "as/os N X" (ou "dos/nas/aos/pelos N X")
sem os N itens nomeados na mesma frase, nos subitens, na seção (fora da lista da própria frase) ou
em `## Campos`. Como **aviso**, FD-10 a FD-12 — a
proveniência dos campos, a memória de cálculo das linhas contadas e a entidade citada
nas regras sem fonte declarada. O hook só devolve a saída do gate quando há
reprovação: aviso sozinho só aparece rodando o validador à mão.

**Não coberto** (fica para `PROMPT_REVIEW` e revisão humana): se a ação tem valor de
negócio real ("faz sentido negocialmente" — o gate garante a **forma** da entrega, não
o seu valor), se a entidade escolhida é a correta, se a granularidade está boa além da
heurística (ex.: duas funcionalidades que só fazem sentido juntas), e a qualidade dos
cenários (um `Então` genérico passa no gate, mas não na revisão).
