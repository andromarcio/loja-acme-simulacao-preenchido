> ⚠️ **ARQUIVO FICTÍCIO — NÃO É UM TICKET REAL DO PROJETO.** Isto é uma fixture de teste da skill `analise-impacto`. A "Sprint 6", as HUs 041 a 043, as migrações V00034 a V00036 e as tabelas citadas **não existem**: foram inventadas para exercitar a skill contra a spec real do repositório. Não use como insumo de trabalho, não mova para `analise-impacto/` e não conte nada daqui em nenhuma contagem.

# Sprint 6 — novas vs. alteradas

> Levantamento do que a Sprint 6 entregou, para envio à área negocial. Migrações envolvidas: V00034 a V00036. Release de 20/09/2026.

---

## 1. HU-041 — Configurar Formulário de Inscrição — **ALTERADA**

Funcionalidade existente desde março/2026 (aba "Formulário" do tipo de participante). O delta da Sprint 6 corresponde à versão interna 2.1 do documento.

### O que foi alterado

- **Campo condicional**: cada campo do formulário pode agora declarar uma **condição de exibição**, que o vincula à resposta de outro campo do mesmo formulário. Quando a condição não é satisfeita, o campo não é apresentado ao participante e deixa de ser exigido, mesmo que marcado como obrigatório. Introduzido pela migração **V00034** (`CD_CAMPO_CONDICIONANTE` e `DS_VALOR_CONDICAO` em `TB_FORMULARIO_CAMPO`).
- **Prévia do formulário** ganhou alternância entre "como o administrador vê" e "como o participante vê", esta última já aplicando as condições.
- **Bloqueio de alteração da condição** depois que a premiação abriu inscrições — mudar a condição com inscrições em andamento deixaria respostas órfãs.

**Código:** `formulario-config`, `campo-editor-dialog`, `formulario-preview` (front); `FormularioCampoServiceImpl`, V00034 (back).

---

## 2. HU-042 — Autossalvamento da Inscrição — **NOVA** (primeiro envio à área negocial)

> **Por que "NOVA":** a funcionalidade existe tecnicamente desde maio/2026 e está em produção desde o release de 12/06, mas a especificação nunca havia sido enviada à área negocial. É o primeiro envio.

### O que a funcionalidade entrega

- **Rascunho autossalvo** a cada 30 segundos e a cada troca de etapa, sem ação do participante, preservando o que já foi digitado.
- **Indicador de salvamento** no topo do formulário, com a hora do último salvamento.
- **Retomada**: ao reabrir o link de inscrição, o participante volta à etapa onde parou.
- **Conflito de sessão**: se a mesma inscrição estiver aberta em duas abas, a segunda a gravar recebe aviso e a gravação é recusada, para não sobrescrever o trabalho da outra. Introduzido pela migração **V00035** (`NR_VERSAO_RASCUNHO` em `TB_INSCRICAO`).

**Código:** `inscricao-form`, `autosave-indicator` (front); `InscricaoRascunhoService`, V00035 (back).

---

## 3. HU-043 — Relatório de Formulários por Tipo de Participante — **NOVA**

Nova tela em Configuração: relação dos formulários configurados por tipo de participante, com a contagem de campos, de anexos exigidos e de questões, e exportação em XLSX. Exclusiva do Administrador Nacional.

**Código:** `relatorio-formularios` (front); `RelatorioFormularioService` (back). Sem migração — lê o que já existe.

---

## 4. Aviso 1 — Auditoria de alteração de formulário

Passou a existir registro de quem alterou a configuração do formulário e quando, visível numa gaveta lateral na própria tela de configuração. Migração **V00036** (tabela nova `TB_FORMULARIO_AUDITORIA`, dependente de `TB_FORMULARIO_CONFIG`).

## 5. Aviso 2 — Exportação de administradores regionais

O botão "Exportar" da tela de administradores regionais passou a sair com a coluna "UFs vinculadas" concatenada, além das colunas já existentes. Sem migração.
