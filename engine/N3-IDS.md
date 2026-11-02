# Identidade imutável das funcionalidades

O ID `[SIGLA]-[SAF]-NN` identifica a funcionalidade, não sua posição atual na jornada. A primeira atribuição segue a ordem da tabela `## Funcionalidades` do N2, depois de a jornada do usuário ser confirmada. Em ramificações, o PO confirma a ordem entre alternativas; a ordem das linhas, não a posição visual dos nós Mermaid nem a prioridade de implementação, determina a primeira sequência.

## Primeira atribuição

Antes de escrever N3s, organize as funcionalidades na tabela do N2 conforme a jornada confirmada, com nomes e links reais. Para entradas ainda sem ID, omita o `<small>` ou mantenha o placeholder do molde. Rode `node scripts/ids-n3.mjs modules\<domínio>\<agrupamento-funcional>\README.md`: é modo seco e mostra a reserva proposta. Depois de conferir, rode o mesmo comando com `--write`. Ele atribui `01`, `02`, `03`… às entradas sem ID, grava o registro invisível `<!-- docqui:n3-ids {...} -->` no N2 e atualiza as referências da seção Telas, o carimbo e o Changelog. Os N3s copiam o ID exato do N2, mesmo quando são escritos em outra ordem.

O registro guarda as reservas por ID e caminho do N3. Não é uma lista de apresentação: preserve-o ao regenerar o N2. Ele também mantém os números das funcionalidades retiradas. O script lê N2, N3, INDEX e histórico Git local para não reutilizar um número conhecido; numa adoção com histórico raso, complete o histórico antes de registrar as reservas. Sem acesso ao disco, aplique a mesma regra ao N2 fornecido e mantenha as reservas no comentário; não declare a verificação determinística como executada.

## IDs já usados

Qualquer ID existente no N2 ou no N3 é preservado, inclusive em rascunho e no fluxo bottom-up. Uma numeração legada fora da ordem atual da jornada não é corrigida nem compactada. Reorganizar a jornada pode mudar a ordem de apresentação da tabela e do diagrama, nunca os IDs. Se o N2 ainda não existe e os N3s já têm IDs, a síntese do N2 conserva-os; para uma primeira especificação sem IDs, confirme a jornada e registre o N2 antes de numerar.

Funcionalidades novas recebem números após o maior reservado, sem preencher lacunas. Por exemplo, se já existem `CAD-CLI-01 — Pesquisar Cliente` e `CAD-CLI-02 — Cadastrar Cliente`, a nova `CAD-CLI-03 — Visualizar Cliente` mantém `03` mesmo quando sua linha entra antes da edição ou do cadastro na jornada. Números retirados não voltam a ficar livres. O formato atual comporta `01` a `99`; esgotá-lo é erro explícito, não autorização para reciclar números ou gerar um ID com três dígitos.

## Conferência

`node scripts/ids-n3.mjs --check` confere a instância; um N2 ou N3 pode ser passado como alvo. `--base <ref>` compara também com a base do PR. O comando acusa renumeração, duplicidade, divergência entre N2/N3, reserva removida e reaproveitamento de ID; não reescreve um conflito para fazê-lo passar. Um `git mv` detectado como renomeação pode mudar o caminho reservado, mantendo o ID. Um N3 legado sem N2 continua tendo sua identidade conferida, sem receber uma nova sequência.

O preflight inclui as reservas do N2, não apenas os N3s já escritos. O hook `spec-guard` confere a identidade ao gravar N2/N3; o template de CI `spec-guard.yml` faz a mesma conferência com histórico completo e a base do PR ou do push. Em instâncias existentes, `sync-instance` leva os scripts e o engine, mas não atualiza o workflow herdado: integre a nova etapa preservando as customizações.
