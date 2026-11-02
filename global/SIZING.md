<!-- docqui: 7.0.0 | prompt: MIGRA_NIVEIS | atualizado: 2026-10-21 -->
# SIZING.md
> Convenções de medição de tamanho funcional do sistema.
> Fonte única de critérios para contagem APF e COSMIC.
> Atualizar sempre que uma nova convenção for adotada.
>
> ℹ️ **Template do kit** — a metodologia APF/COSMIC é reutilizável. A seção
> **"Regras de medição de serviços (CAIXA)"** e as menções a stack (Angular/Java)
> são específicas de organização/projeto — revise ou substitua conforme o seu caso.

---

## Normas adotadas

| Método | Norma | Versão |
|---|---|---|
| APF | IFPUG CPM | 4.3.1 |
| COSMIC | COSMIC FSM | 5.0 |

> ⚠️ Registre aqui a versão exata adotada pela organização antes de iniciar qualquer contagem.

---

## APF — Análise de Pontos de Função

> **Princípio — a contagem reflete o que está documentado.** Cada DER, ALR, RLR,
> tipo (EE/SE/CE/ALI/AIE) e complexidade deve ser **rastreável** ao que o N3 e o
> `DATA-MODEL.md` registram (tabela `## Campos`, dependências, entidades/ALIs). A
> contagem **não antecipa nem inventa** o que não está especificado: se um campo,
> leitura ou entidade for necessário ao número mas não estiver documentado, **registre
> a lacuna com ⚠️ e ajuste a fonte antes de fechar a contagem** — em vez de estimar.
> Sempre que o que está documentado mudar, **reconte**. Regra de ouro: **a fonte
> manda; a contagem a espelha.**

### Mapeamento da estrutura de documentação → elementos APF

| Elemento APF | Definição | Onde identificar nesta estrutura |
|---|---|---|
| ALI (Arquivo Lógico Interno) | Grupo de dados mantido pelo sistema | `global/DATA-MODEL.md` — uma entidade principal = um ALI candidato; registro em `global/ALI-AIE-MAP.md` |
| AIE (Arquivo de Interface Externa) | Grupo de dados de sistema externo usado mas não mantido | `global/DATA-MODEL.md` (tabela de AIEs) e `global/ALI-AIE-MAP.md`; as candidatas surgem da seção "Integrações" do N1 e dos campos `externo: [Sistema]` do N3 |
| EE (Entrada Externa) | Transação que processa dados de fora para dentro — intenção primária: **manter** ALI ou **alterar o comportamento** do sistema | a funcionalidade (N3) inteira, front + BFF (ver *Arquitetura BFF*); no perfil `completo`, o `## API` confere — verbos POST / PUT / PATCH / DELETE |
| SE (Saída Externa) | Transação que envia dados com lógica de processamento — cálculo, dado derivado, manutenção de ALI ou alteração de comportamento | a funcionalidade (N3) inteira; no perfil `completo`, o `## API` confere — GET com cálculo, relatório ou transformação |
| CE (Consulta Externa) | Transação que recupera dados de ALI/AIE sem lógica adicional | a funcionalidade (N3) inteira; no perfil `completo`, o `## API` confere — GET simples de listagem ou detalhe |

> **A transação se classifica pela intenção primária**, com as formas de lógica da skill `apf-cpm` — não pelo verbo HTTP nem pela exposição do endpoint. Uma funcionalidade atendida só pelo BFF interno conta se for processo elementar (ver *Arquitetura BFF*), e um GET que calcula totais é SE. O `## API` só existe no perfil `completo` e serve de conferência; no perfil `requisitos`, a classificação sai das seções negociais do N3.

> **Todo número contado vem com memória de cálculo.** Cada linha — de transação ou de função de dados — registra a **quantidade e a descrição** dos seus ALR e DER: cada arquivo lógico nomeado com o motivo da leitura, cada campo nomeado e agrupado, e o que ficou de fora com o porquê. Número sem memória não é auditável (não dá para dizer se o ALR esqueceu um arquivo ou se o DER contou o mesmo campo duas vezes) nem comparável entre recontagens (não dá para saber o que mudou). A memória mora junto do número: na `## Métricas de tamanho` do N3, para transações, e no `CONTAGEM-PF.md`, para funções de dados.

### Critério de complexidade — Funções de Dados (ALI / AIE)

| RLR \ DER | 1–19 | 20–50 | 51+ |
|---|---|---|---|
| 1 | Baixa | Baixa | Média |
| 2–5 | Baixa | Média | Alta |
| 6+ | Média | Alta | Alta |

> **RLR** (Registro Lógico Referenciado) = IFPUG RET · **DER** (Dado Elementar Referenciado) = IFPUG DET. Ver glossário.

**Como contar DER**: cada campo das entidades que formam o ALI/AIE, no fragmento `global/data-models/[dominio].md` = 1 DER — a função de dados se conta pelo data-model, não pela tela de uma funcionalidade. Campos globais técnicos (createdAt, updatedAt, deletedAt) e organizationId = **não contam**. **O identificador (`id`) conta como 1 DER, mas uma única vez por ALI** — não por tabela: quando o ALI agrupa mais de uma entidade (1:N com a filha dependente), o `id` da entidade-mãe **não** conta de novo como chave estrangeira na filha, porque é o mesmo dado reconhecido pelo usuário. Chave estrangeira que aponta para **outro** ALI continua valendo 1 DER (relacionamento requerido pelo usuário — CPM 5.4.4c).
**Como contar RLR**: subgrupos lógicos dentro da entidade. Na ausência de subgrupos explícitos, considerar RLR = 1.

### Critério de complexidade — Funções de Transação

O CPM tem **duas** tabelas de complexidade para transações, com faixas diferentes: uma para Entrada Externa e outra para Saída Externa e Consulta Externa. Uma tabela única para os três tipos **não existe** no padrão — ela subdimensiona a EE com 3 ALR e superdimensiona SE e CE, que toleram mais DER antes de subir de faixa.

**Entrada Externa (EE)** — CPM 4.3.1, Tabela 6:

| ALR \ DER | 1–4 | 5–15 | 16+ |
|---|---|---|---|
| 0–1 | Baixa | Baixa | Média |
| 2 | Baixa | Média | Alta |
| 3+ | Média | Alta | Alta |

**Saída Externa (SE) e Consulta Externa (CE)** — CPM 4.3.1, Tabela 7:

| ALR \ DER | 1–5 | 6–19 | 20+ |
|---|---|---|---|
| 0–1 | Baixa | Baixa | Média |
| 2–3 | Baixa | Média | Alta |
| 4+ | Média | Alta | Alta |

> **ALR** (Arquivo Lógico Referenciado) = IFPUG FTR · **DER** = IFPUG DET. Ver glossário.

> ⚠️ **Correção de 2026-08-29.** Até esta data havia aqui **uma tabela só** para os três tipos, que combinava as faixas de DER da EE (1–4 / 5–15 / 16+) com as faixas de ALR da SE/CE (0–1 / 2–3 / 4+) — errada para os dois lados. **Contagens fechadas antes desta data precisam ser reconferidas**: pela tabela única, EE com 3 ALR caía na linha do meio e ficava uma faixa **abaixo** do devido, e SE/CE com 6 a 19 DER subiam uma faixa **acima**.

**Como contar ALR**: número de ALIs ou AIEs lidos ou mantidos pela transação, apurado em **quatro fontes**: (a) a coluna **Entidade** da tabela `## Campos` do N3 — as entidades distintas ali são arquivos lógicos referenciados; (b) as **entidades-fonte** dos campos calculados em `## Derivações`; (c) a seção **`## Dados lidos e gravados`**; (d) uma **varredura de `## Regras de negócio` e `## Campos automáticos`** atrás de entidade citada que não apareça nas três primeiras. As fontes (a)–(c) traduzem-se assim: nome de entidade = ALI · `externo: [Sistema]` = AIE · **`dado de código` não conta** (lista de valores fixos, sem cadastro por trás — CPM 5.4.2d) · `derivado ↓` = as entidades citadas em `## Derivações`. A quarta fonte existe porque as outras são **ancoradas em campo**: a tabela de campos descreve *a tela*, o ALR descreve *a transação* — entidade que a funcionalidade toca sem exibir campo algum (o registro de execução que recebe o status, o cronograma que define a janela válida) só aparece nas regras. Achou uma lá? Declare-a em `## Dados lidos e gravados` antes de contar — o número tem de estar sustentado pela fonte. Confronte com o data-model; nas instâncias de perfil `completo`, a seção `## Dependências` (libs/serviços) e o `## API` servem só de conferência — **nenhuma das duas declara arquivo lógico**, e no perfil `requisitos` elas nem existem no artefato.
**Como contar DER**: campos que cruzam a fronteira — os que entram (informados na tela, no comando ou no body/query da requisição) e os que saem (exibidos, ou devolvidos na resposta de sucesso), rastreáveis a `## Campos`, `## Campos automáticos` e `## Colunas do resultado` do N3. Conte cada campo distinto **uma vez** (entrada ∪ saída) e some **+1 DER para a capacidade de mensagens** (erro/confirmação) e **+1 DER para a ação/comando** que dispara a transação (padrão IFPUG). Campos de controle (HTTP status, organizationId, cursor de paginação) = **não contam**.

### Tabela de pontos por complexidade

| Tipo | Baixa | Média | Alta |
|---|---|---|---|
| ALI | 7 | 10 | 15 |
| AIE | 5 | 7 | 10 |
| EE | 3 | 4 | 6 |
| SE | 4 | 5 | 7 |
| CE | 3 | 4 | 6 |

---

## APF — Regras de medição de serviços (CAIXA)

> Orientações específicas para a medição de serviços em APF, adaptadas à estrutura
> de documentação deste template (N1, N3, fronteira BFF, `DATA-MODEL.md`).
> Origem: *Guia de Orientação de Métricas* — Capítulo 2, "Medição de Serviços em APF".
> Estas regras **prevalecem sobre o critério genérico** das seções anteriores quando houver conflito.

### 1. Fronteira da aplicação e escopo

- A fronteira de uma aplicação é definida, por padrão, **a nível da sigla do sistema** — o equivalente, neste template, ao domínio/sistema documentado no N0/N1.
- Uma sigla pode conter **mais de um módulo**. Quando um módulo for tratado como fronteira separada, isso **deve estar explícito** na documentação (N1 do módulo) e no formulário de contagem.
- A definição de fronteira e de escopo é **prerrogativa da CAIXA** e pode ser ajustada a qualquer momento conforme a visão de negócio; o escopo da medição sempre considera os objetivos da organização, não a conveniência técnica.

> **Aplicação neste template**: alinhe a fronteira de contagem com a granularidade declarada no N0/N1. Se um domínio em `modules/` representa um módulo com fronteira própria, registre essa decisão no N1 antes de contar.

### 2. Migração de base de dados

Migração pressupõe um sistema/funcionalidade novo substituindo um existente, exigindo extração dos dados antigos e carga no novo.

| Elemento | Conta? | Como tratar |
|---|---|---|
| Carga/conversão e gravação dos dados no novo sistema | **Sim** | EE — normalmente **uma EE por grupo de dados migrado**, mas não é regra: contar conforme a visão do usuário. Cada EE engloba extração/leitura do antigo, conversão e carga no novo |
| Relatórios sobre a conversão solicitados pelo gestor | **Sim** | CE ou SE conforme houver lógica de processamento |
| Arquivos/tabelas do sistema antigo (origem) | **Não** | Não contar como AIE |
| Extrações de leitura do sistema antigo | **Não** | Não contar como CE nem SE |

- A CAIXA pode classificar o esforço como **Projeto de Migração de Base de Dados** (escopo específico), aplicando integralmente os conceitos IFPUG. Sem essa classificação, vale a regra geral acima.
- **Não recomendado** adotar Projeto de Migração de Base de Dados em soluções de Portal de Conteúdo.
- No artefato de contagem do projeto de migração, as **funções de dados são obrigatórias e oriundas do projeto de desenvolvimento**; quando a função já tiver sido contada no desenvolvimento, registrá-la com status **"não se aplica"**. Pré-requisito: modelo de dados do sistema (ou artefato similar).
- Situações não previstas → encaminhar ao **GT de Métricas**.

### 3. Fator de ajuste (VAF) — não adotado

- A aplicação das CGSs, o cálculo do VAF e o tamanho funcional **ajustado** são opcionais no CPM do IFPUG.
- **A CAIXA não adota Pontos de Função Ajustados.** Toda contagem registrada neste template é em **PF não ajustado** (FSM puro). Não preencher campos de VAF.

### 4. Contagem de AIE pela visão do usuário

- Contar os **grupos de dados distintos segundo a visão do usuário da aplicação que está sendo contada** — a fronteira depende da visão de negócio externa, **independente de considerações técnicas ou de implementação**.
- Quando um sistema externo organiza internamente um dado em vários grupos lógicos, conte **apenas o AIE que o negócio do sistema contado reconhece**, não os grupos técnicos subjacentes.

> **Exemplo (Guia)**: o SIXXX recupera dados de "Unidade CAIXA" que, no sistema de origem (SIICO), vêm de três ALIs ("Unidade", "Imóvel", "Tipo de Meio de Comunicação"). Como o gestor do SIXXX só reconhece o grupo lógico **Unidade**, conta-se **somente o AIE "Unidade"**.
>
> **Aplicação neste template**: ao registrar AIEs em `global/DATA-MODEL.md`, descreva-os pela ótica de negócio do sistema consumidor, não pela modelagem física do sistema externo.

### 5. Alterações técnicas em ALI e nas funções que o mantêm (CPM 4.3.1)

- Manutenções evolutivas e alterações de escopo que mexem em **características de campos** (tabelas/telas) **não são medidas por APF quando a motivação é puramente técnica**.
- Alteração de atributo só é medida quando atende a uma **necessidade de negócio**, comprovada por evidência da solicitação do gestor e aprovação de suporte/qualidade (CPM 4.3.1, Parte 2).
- O simples fato de um DER alterado **cruzar a fronteira** nas transações que o mantêm/referenciam **não basta** para pontuá-las como alteradas. Pontuar **apenas as transações cuja lógica de processamento mudou** (ex.: nova regra de validação do DER).

> **Exemplo (Guia)**: campo de telefone passa a aceitar 8 dígitos e, no DF, exige o dígito "3" inicial. As EE de inclusão e alteração de cliente mudam de lógica → pontuadas como "alteradas". Exclusão e consulta de cliente não mudam → **não pontuadas**.
>
> **Aplicação neste template**: ao alterar um campo no N3, registre na seção de métricas **se a mudança altera a lógica de processamento**; mudanças apenas técnicas (tamanho, tipo físico, otimização de banco) não geram pontos.

### 6. Integração de sistemas e middleware

- Para integração entre sistemas, aplicar os **cenários de compartilhamento de dados do CPM 4.3.1**.
- Quando a integração de dados é **provida por outra aplicação (middleware)**, adotar o white paper do IFPUG *Pontos de Função & Contagem de Software Aplicativo Middleware* (ex.: SICLI – IPPO, Interface Padrão Parametrizada Online).

### 7. Integração com sistema de segurança (LOGON)

- As unidades possuem **estruturas de segurança distintas**; avaliar o cenário concreto na contagem.
- Os **ALR** (Arquivos Lógicos Referenciados) devem ser avaliados para determinar a complexidade da função de transação **LOGON**, e precisam estar registrados nos insumos de contagem apresentados.
- Em funções de transação que referenciam o sistema de segurança (ex.: SISGR), contar com base na **necessidade de negócio**, não na restrição tecnológica.

### 8. Consultas dinâmicas

- Uma consulta dinâmica é **uma única função transacional CE ou SE**, independentemente da quantidade de resultados que produz.
- A complexidade é determinada pelo **cenário mais abrangente**, considerando todos os DER e ALR possíveis.

### 9. Funcionalidades iguais em formatos de saída diferentes

- A mesma funcionalidade apresentada em **formatos de saída diferentes** é contada **uma única vez**. Formato diferente não caracteriza quebra da lógica de processamento sob a ótica do usuário.
- **A CAIXA não adota o conceito de *Multiple Media*** (alinhado ao Capítulo 1, item 5.6).

### 10. Desenvolvimento em múltiplas camadas (mainframe, web)

- Quando a **mesma transação** é disponibilizada em duas plataformas (ex.: mainframe e web), há **um único processo elementar** sob a APF — ambas implementam a mesma funcionalidade. **Não adotar *Multiple Media*.**
- Sob o **SNAP**, esse item **pode ser medido e remunerado** (havendo previsão contratual) pela subcategoria *Múltiplos Métodos de Saída* (Capítulo 8 do Guia).

### 11. Medição de componentes

- O desenvolvimento/manutenção de **componentes** é avaliado sob a **perspectiva funcional** (CPM 4.3.1).
- Considera-se **Componente de Software Reutilizável** o executável que oferece um serviço pré-definido e se comunica por interfaces padronizadas, com **todas** as características:

  - realiza uma funcionalidade específica;
  - tem capacidade de execução paralela (multiuso);
  - é intercambiável (não específico ao contexto);
  - é combinável com outros componentes;
  - é encapsulado (não investigável por suas interfaces);
  - é unidade de instalação e versionamento independente, comunicando-se somente via interfaces bem definidas;
  - adere a um modelo de componentes (.COM, CORBA, Java, etc.).

### 12. Funcionalidades batch

- Processos batch disparados pelo **relógio do sistema (clock)**, em que **nenhuma informação cruza a fronteira**, **não são processos elementares** (apenas complementam outro PE) — regra geral do IFPUG-CPC.
- **Exceção CAIXA**: reconhece-se a rotina batch como **função transacional** quando ela automatiza algo que poderia ser online e **todas** as condições abaixo se verificam:

  1. é a **menor unidade de atividade significativa** para o usuário e não é parte de outro processo elementar;
  2. a intenção primária é classificada **exclusivamente como EE**;
  3. ao final da execução a aplicação fica em **estado consistente**.

  Nesses casos conta-se como processo elementar — a forma de implementação (batch) é fator meramente tecnológico.

### 13. Terceira contagem (contagem final)

- Se **não houver alteração funcional**, a terceira contagem **não é necessária**.
- A equipe deve verificar se a contagem detalhada anterior não deixou de incluir funções (ex.: de conversão); nesse caso a **contagem final (terceira) é necessária**.
- Quando se adota a segunda contagem como final, **formalizar** a inexistência de alterações funcionais.

---

## COSMIC — Common Software Measurement International Consortium

### Mapeamento da estrutura de documentação → movimentos COSMIC

| Movimento | Definição | Onde identificar nesta estrutura |
|---|---|---|
| Entry (E) | Dado movendo-se de fora do processo para dentro | Campo no body/query do `## API` do N3 |
| Exit (X) | Dado movendo-se de dentro do processo para fora | Campo na resposta do `## API` do N3 |
| Read (R) | Leitura de dado persistido | Cada ALI/AIE consultado pela transação |
| Write (W) | Escrita de dado persistido | Cada ALI criado, alterado ou removido pela transação |

**1 CFP = 1 movimento (E, X, R ou W)**

### Convenções de contagem COSMIC nesta estrutura

- **Granularidade**: contar por endpoint documentado no `## API` do N3.
- **Entry**: cada campo distinto no body ou query params = 1 E. Campos de controle (authorization header, organizationId via JWT, cursor) = **não contam**.
- **Exit**: cada campo distinto na resposta de sucesso = 1 X. Envelope padrão (`data`, `meta`, `error`) = **não conta**, apenas os campos de negócio internos.
- **Read**: cada entidade/ALI lida para processar ou responder = 1 R. Leituras de validação (verificar duplicata, checar permissão) = **contam**.
- **Write**: cada entidade/ALI criada, atualizada ou removida = 1 W. Soft delete = 1 W.
- **Eventos publicados** (`## Eventos` do N3): cada evento publicado implica 1 X adicional.
- **Eventos consumidos** (`## Eventos` do N3): cada evento consumido implica 1 E adicional por campo relevante no payload.

---

## Convenções de registro no N3

Toda funcionalidade especificada no N3 deve ter a seção `## Métricas de tamanho` preenchida **após** a aprovação do N3 negocial e **antes** do início do desenvolvimento.

A contagem é responsabilidade do Dev, revisada pelo Tech Lead, e pode ser auditada pelo PO com base nos campos e endpoints documentados no mesmo N3.

### Arquitetura BFF (Java + Angular) — a unidade de contagem é a funcionalidade, não o endpoint

A fronteira da aplicação (CPM) é a interface conceitual entre o sistema e seus **usuários** — **não** a divisão técnica entre o Angular e o Java. Nesta arquitetura, o frontend Angular e o backend BFF são **camadas internas de uma mesma funcionalidade**: o BFF é apenas o backend.

Por isso, **a unidade de análise é a funcionalidade (N3) inteira**, não o endpoint isolado. Uma funcionalidade começa na interação do usuário no front, percorre o BFF e devolve um resultado — isso é **uma transação completa** que cruza a fronteira usuário↔sistema. Logo, **cada funcionalidade (N3) é candidata a um processo elementar (PE)** e, se qualificada, conta como EE, SE ou CE.

- ✅ **Correto:** avaliar a funcionalidade (front + BFF) como um PE candidato.
- ❌ **Errado:** olhar o endpoint do BFF isoladamente e descartá-lo por ser "interno". O BFF sozinho não é um PE — mas isso **não zera** a funcionalidade que ele atende.

| Situação | Conta? |
|---|---|
| Funcionalidade (N3) que satisfaz os critérios de PE e se classifica como EE/SE/CE | **Sim** — pelo tipo |
| Funcionalidade disparada por/integrada a outro sistema, API pública, parceiro ou arquivo externo | **Sim** — pelo tipo |
| Endpoint do BFF olhado isoladamente (sem ser a funcionalidade completa) | **Não** — não é a unidade de contagem |
| Navegação, menus e telas que são apenas passos de outro PE | **Não** — não é PE |

> **Importante:** ter o backend em BFF interno **não** é, por si só, motivo para não
> contar. O que decide é se a **funcionalidade** satisfaz as regras de PE do CPM.

**Funções de Dados (ALI / AIE)** não são registradas na seção `## Métricas de tamanho` do N3 — vivem centralmente em `global/DATA-MODEL.md` e nos fragmentos `global/data-models/[dominio].md`. Ver seção *Como manter o registro de ALIs sincronizado*.

### O que contar e o que não contar no N3

Cada artefato N3 corresponde a uma única funcionalidade. Registre nele apenas as funções de transação geradas por essa funcionalidade:

| O que encontrar no N3 | Contar? | Como contar |
|---|---|---|
| ALI — entidade mantida por este sistema | **Não** | Contado centralmente no DATA-MODEL.md |
| AIE — entidade de sistema externo referenciada | **Não** | Contado centralmente no DATA-MODEL.md |
| Endpoint exposto a sistema externo (POST/PUT/PATCH/DELETE) | **Sim** | EE |
| Endpoint exposto a sistema externo (GET com transformação) | **Sim** | SE |
| Endpoint exposto a sistema externo (GET simples) | **Sim** | CE |
| Funcionalidade 100% atendida por BFF interno (sem exposição externa) | **Sim, se for PE** | EE/SE/CE pelo tipo — BFF interno não zera a funcionalidade |
| Componente que apresenta uma lista lida de um ALI ou AIE — combo, dropdown, autocomplete, carrossel, botões de categoria, chips | **Sim** | CE (sem lógica) ou SE (com lógica de filtro ou transformação) — ver *Regra da lista consultada* |
| Consulta *implícita* — a leitura que abre o formulário de edição preenchido | **Depende** | CE/SE **se** o formulário trouxer dado que a pesquisa não mostrava; **não conta** se a lista já exibia tudo |

> **Regra da lista consultada** *(antes chamada "Regra do combobox" — o nome mudou porque a combo é o exemplo, não a regra)*: sempre que um componente apresenta ao usuário uma **lista de valores lida de uma entidade marcada como ALI ou AIE**, essa recuperação é um **processo elementar** — tem início (o disparo), meio (a consulta ao arquivo lógico) e fim (a lista apresentada), e entrega valor ao usuário. O componente não importa: combo, dropdown, autocomplete, lookup, um **carrossel** que recupera e exibe uma lista, **botões de categoria** que, ao clicar, filtram outra lista, chips, árvore ou menu carregado de dados. O que decide é a **origem dos valores** — uma consulta a ALI/AIE —, não a forma de exibi-los; vale ainda que a leitura venha por endpoint BFF interno. Classifique como **CE** (sem lógica) ou **SE** (com filtro, cálculo ou transformação) e conte **uma vez na aplicação** — registrada na funcionalidade **dona da tela** onde ela foi contada primeiro (Superfície *Tela própria* ou *Modal* — o modal com conteúdo próprio: detalhe de um registro, consulta ou formulário que não é subformulário de outro), nunca numa funcionalidade de *Ação em tela*, que não tem formulário próprio. A mesma lista noutra tela não conta de novo: a linha **referencia** o PE contado (ver *PE reutilizado*, abaixo). Conferência: `node scripts/valida-acessorio-tela.mjs`. *(definição do PO, 2026-09-03; dona da tela, 2026-09-23; uma vez na aplicação, 2026-09-27)*
>
> **Nome do PE**: `Consultar <rótulo do campo> (<componente>)` — o **rótulo que a tela mostra** para a lista (o Label PO do campo na tabela `## Campos` do N3), não o nome da entidade consultada nem o da tela que a exibe; o componente entre parênteses (`combo`, `carrossel`, `botões`) é só marcação de conferência. Ex.: `Consultar Ata sob minha gestão (combo)`, `Consultar Categorias (botões)`. A entidade lida fica no ALR da memória de cálculo e na `Observação` do consolidado. *(decisão do PO, 2026-09-23 — até então o nome era o da entidade)*: duas listas sobre a mesma entidade com filtros diferentes — as atas vigentes com item elegível numa tela, as atas sob gestão do usuário noutra — saíam com o mesmo nome, e nome igual se lê como o mesmo PE. Com o rótulo, nome igual passa a dizer **a mesma lista** (mesmo rótulo, mesmo filtro), que é o que a conferência de duplicidade do CPM 4.3.1 (5.5.1) procura — e o `valida-acessorio-tela` confere: o mesmo nome contado em duas funcionalidades é erro (ver *PE reutilizado*). Rótulo igual com filtro diferente é exceção: as duas contam, a diferença vai para a `Observação` do consolidado, e uma delas a declara na memória de cálculo — `> Distinto de <ID> · <PE>: <o que difere>`. Linhas vindas de baseline externo mantêm o nome da planilha de origem. Lista alimentada por valores fixos no código, por enum ou por valores já presentes na própria tela **não** consulta ALI/AIE e **não** é PE; e o clique que só filtra, em memória, o que já está em tela também não — nada atravessa a fronteira (ver *Regra da consulta implícita*). Se o clique dispara nova consulta ao arquivo lógico com o filtro, esse é o PE da própria lista filtrada, não um segundo PE dos botões.

> **PE reutilizado** *(decisão do PO, 2026-09-27)*: um processo elementar conta **uma vez na aplicação** — pelo CPM, os mesmos DER, os mesmos arquivos lógicos e a mesma lógica são o mesmo PE, em quantas telas ele aparecer. A funcionalidade que usa um PE já contado noutra — a mesma lista noutra tela, o mesmo relatório por outro caminho — grava a linha na sua `## Métricas de tamanho` com o **nome do PE contado** e, na coluna Tipo, `↪` seguido do ID da funcionalidade onde ele conta, **com link para o N3 dela** (caminho relativo a este N3: quem lê chega ao PE contado num clique; sem o link, ou com link para outro arquivo, o `valida-acessorio-tela` reprova e diz o link a gravar); ALR, DER, Complexidade e PF ficam `—`, e a memória de cálculo não se repete:
>
> `| Consultar Empresa (combo) | — | ↪ [CRM-CTT-01](../contatos/f-pesquisar-contato.md) | — | — | — | — | 2026-09-27 |`
>
> O componente entre parênteses não entra na comparação: a mesma lista em combo numa tela e em autocomplete noutra é o mesmo PE. **A alteração vai para o PE:** a mudança na lista, venha do ticket de qualquer funcionalidade que a usa, é feita na linha contada — a recontagem, a `## Origem` e o Changelog são da funcionalidade onde o PE conta, que fica com a contagem pendente —, e as funcionalidades que o reutilizam entram na AIMM como regressão (o `generate-impact-draft` segue o `↪` nos dois sentidos). Se a mudança vale só para uma das telas, as listas deixam de ser iguais: a que mudou passa a contar a sua e declara a diferença (`> Distinto de …`). Se a funcionalidade onde o PE conta for deprecada, a contagem passa para uma das que o reutilizam. **Para saber se um PE já é contado:** `node scripts/valida-acessorio-tela.mjs --pe "<nome do PE>"` responde onde ele conta e quem o reutiliza; sem o `--pe`, a mesma checagem reprova o PE contado duas vezes e a referência que não acha o PE contado.

> **Regra da consulta implícita**: um processo elementar exige que os dados
> **atravessem a fronteira da aplicação**. Ao acionar *Editar* em uma linha da
> pesquisa, o formulário abre com todos os campos preenchidos — essa leitura é a
> consulta *implícita*. Ela é PE **quando traz dado que a tela de pesquisa não
> mostrava**; quando a lista tem poucas colunas e já exibe tudo o que o formulário
> edita, **nada cruza a fronteira de novo e não há o que contar**. O nome
> *(implícita)* na planilha marca a linha para conferência, nunca decide o
> resultado. Registre a decisão na coluna **Observação** do `CONTAGEM-PF.md` — uma
> linha com 0 PF sem justificativa é indistinguível de linha por preencher.
> *(critério informado por equipe de métricas, 2026-09-02)*
> **Fica sempre com a funcionalidade Editar** *(decisão do PO, 2026-09-23)*: é a leitura que abre o formulário de edição preenchido, e conta-se em `Editar <Entidade>` mesmo quando o Editar abre sobre a pesquisa, num *Modal* — nunca na Cadastrar, que abre o formulário vazio, nem na Pesquisar ou Visualizar que só a hospeda; sem funcionalidade Editar no Agrupamento Funcional, vale a regra geral (dona da tela). `scripts/valida-acessorio-tela.mjs` confere.


### Papel do PE em relação à funcionalidade — `principal` × `acessório`

*(decisão do PO, 2026-09-28 — trazida do portal-compras, REP-030 e REP-053 do ledger de replicação de lá)*

A tabela de `## Métricas de tamanho` do N3 traz a coluna **Papel**, logo depois do nome do PE, que diz o que cada processo elementar é **em relação à funcionalidade**:

| Papel | O que é | Exemplo |
|---|---|---|
| `principal` | O PE que **realiza** a funcionalidade — mesma intenção primária e mesmo objeto que o nome dela. Contam como principais também as variantes do **mesmo** processo por canal (tela e API) ou por tipo do objeto (PJ, PF, estrangeiro): é a mesma função cruzando a fronteira por outro caminho. | `Pesquisar Contato`, em `CRM-CTT-01` — Pesquisar Contato |
| `acessório` | PE com intenção primária **própria**, que a funcionalidade apenas hospeda ou consome: lista consultada (combo, autocomplete, carrossel), consulta implícita que carrega a tela, exportação/impressão do mesmo conteúdo, ação vizinha na mesma tela — **desde que a ação vizinha seja principal da funcionalidade dona dela** (a tela não é a unidade: uma tela atende várias funcionalidades). | `Consultar Empresa (combo)` e `Exportar Contatos Excel`, em `CRM-CTT-01` — Pesquisar Contato |

**Para que serve.** Quando a funcionalidade muda, a análise de impacto mede **os principais por padrão**. Os acessórios entram na medição **só quando o analista de métricas apontar** que aquele PE foi tocado — é ele quem identifica, caso a caso, o acessório atingido. Sem a coluna, cada análise refaz essa separação a partir do nome do PE, e o mesmo conjunto sai medido de um jeito numa sprint e de outro na seguinte.

**O papel não muda a contagem.** Ele classifica PE **já contados**: o total da funcionalidade soma principais e acessórios, como sempre. Papel responde *o que medir quando algo muda* — não *quanto vale*.

**Regras de preenchimento:**

- Toda linha **medida** (PF numérico, inclusive 0) diz `principal` ou `acessório`. A linha `↪` (PE reutilizado) e a ainda não medida (PF `—`) levam `—`: a primeira conta noutra funcionalidade, a segunda ainda não tem papel a declarar.
- Toda funcionalidade com PE contado tem **ao menos um** `principal`. Funcionalidade sem principal é sinal de que o PE que a realiza não foi contado — registre a lacuna com ⚠️ em vez de promover um acessório a principal.
- Pode haver **mais de um** principal: quando o mesmo processo aparece em mais de um canal ou variante, ou quando a tela serve a dois objetos (uma pesquisa que lista Pedidos **e** Itens, os dois principais).
- O papel é do PE **naquela funcionalidade**: o mesmo PE pode ser principal numa e acessório noutra.
- **Ação vizinha é acessório só se for principal de outra funcionalidade.** Um EE com verbo próprio, "pronto" próprio e mudança de estado própria passa nos testes do `engine/DEFINICAO-FUNCIONALIDADE.md` (teste 3: grava, atualiza ou cancela dado de negócio); se nenhuma funcionalidade o tem como principal, o que falta é a funcionalidade — ou o papel está errado —, não o registro como acessório. **EE acessório é cheiro**: o acessório legítimo é quase sempre SE ou CE (lista consultada, consulta implícita, exportação).
- **Variante por completude também é principal.** Salvar rascunho da mesma tela, com validação relaxada, tem o mesmo objeto e a mesma intenção primária (manter o ALI) do PE principal; quando a funcionalidade o especifica (regra de retomada, cenário de rascunho), ela o realiza — classifique-o principal, como as variantes por canal e por tipo do objeto.
- **O acessório mora na funcionalidade dona da tela** — ver a *Regra da lista consultada* acima e o `scripts/valida-acessorio-tela.mjs`.

**Consolidado.** O `global/CONTAGEM-PF.md` espelha a coluna em `## 1. Funções de Transação`; PE que não pertence a funcionalidade nenhuma (workflow, integração, notificação) sai com `—`.

**Conferência** — `node scripts/valida-contagem-consolidada.mjs`: **reprova** o N3 cuja tabela não tem a coluna Papel, a linha medida sem `principal` ou `acessório`, o consolidado sem a coluna e a funcionalidade cuja soma de PF dos principais diverge entre o N3 e o consolidado; **avisa** a funcionalidade contada sem nenhum `principal` (a lacuna se resolve com a equipe de métricas, não editando o arquivo) e o EE `acessório` que não é principal em funcionalidade nenhuma.

### Quem conta e quando

| Etapa | Responsável | Momento |
|---|---|---|
| Contagem inicial | Dev que especificou o N3 técnico | Após PROMPT_3B |
| Revisão | Tech Lead do domínio | Antes de mover para `🔄 Em desenvolvimento` |
| Auditoria | Papel externo (se contratual) | Pontual, baseado nos N3 com status `✅ Implementado` |

---

## Consolidação no INDEX.md

O `modules/INDEX.md` deve manter os totais acumulados por funcionalidade, domínio e sistema:

```markdown
| Funcionalidade | Domínio | Status | PF | CFP |
|---|---|---|---|---|
| [Funcionalidade] | [Domínio] | ✅ Implementado | 12 | 18 |
```

Totais de domínio e sistema são calculados por soma das funcionalidades com status `📋 Especificado`, `🔄 Em desenvolvimento` e `✅ Implementado`. Funcionalidades `❌ Deprecadas` são excluídas do total vigente mas mantidas no histórico.

---

## Glossário rápido

| Sigla | Significado |
|---|---|
| APF | Análise de Pontos de Função |
| PF | Ponto de Função |
| ALI | Arquivo Lógico Interno |
| AIE | Arquivo de Interface Externa |
| EE | Entrada Externa |
| SE | Saída Externa |
| CE | Consulta Externa |
| DER | Dado Elementar Referenciado — campo (IFPUG: **DET**, *Data Element Type*) |
| RLR | Registro Lógico Referenciado — subgrupo lógico de uma função de dados (IFPUG: **RET**, *Record Element Type*) |
| ALR | Arquivo Lógico Referenciado — ALI/AIE lido ou mantido por uma transação (IFPUG: **FTR**, *File Type Referenced*) |
| COSMIC | Common Software Measurement International Consortium |
| CFP | COSMIC Function Point |
| E | Entry (movimento COSMIC) |
| X | Exit (movimento COSMIC) |
| R | Read (movimento COSMIC) |
| W | Write (movimento COSMIC) |

---

*Última revisão: 2026-06-05 — incorporadas as orientações do Capítulo 2 (Medição de Serviços em APF) do Guia de Orientação de Métricas.*

*Links: [MASTER.md](./MASTER.md) · [DATA-MODEL.md](./DATA-MODEL.md) · [INDEX geral](../modules/INDEX.md)*

---

## Como manter o registro de ALIs sincronizado

O registro central de ALIs vive em `global/DATA-MODEL.md → ## Arquivos Lógicos (APF)`. A fonte de cálculo vive nos fragmentos `global/data-models/[dominio].md → ## Arquivos Lógicos deste domínio`.

Fluxo de atualização:

```
Nova entidade criada (PROMPT_3B)
          │
          ├─→ Definir a qual ALI pertence
          │        ├─ ALI existente → anotar cabeçalho da entidade + recalcular DER/RLR
          │        └─ ALI novo      → criar linha no fragmento + anotar cabeçalho
          │
          ├─→ Atualizar seção "## Arquivos Lógicos" no fragmento data-models/[dominio].md
          │
          └─→ Atualizar linha correspondente em DATA-MODEL.md → ## Arquivos Lógicos (APF)
```

Regra de ouro: **DATA-MODEL.md é o índice; os fragmentos são a fonte de cálculo.** Nunca atualizar um sem atualizar o outro.
