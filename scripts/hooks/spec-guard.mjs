#!/usr/bin/env node
// spec-guard.mjs — hook do Claude Code que dá "dentes" ao protocolo de especificação.
// Um único script serve três eventos (despacha por hook_event_name):
//
//   • PostToolUse  (Write|Edit|MultiEdit) → roda os gates no artefato recém-gravado e
//     devolve TODOS os desvios combinados ao modelo (exit 2) para ele corrigir até sair ✓.
//     Model-agnostic: quem enforça é o harness, não o texto do prompt.
//       F2 — estrutura (validate-doc) em artefatos de nível (N0–N3, data-model);
//            + gate SEMÂNTICO (valida-semantica-funcionalidade) em N3: o artefato nomeado
//            como funcionalidade é mesmo uma funcionalidade? (engine/DEFINICAO-FUNCIONALIDADE.md, FD-1…FD-12;
//            só reprovação volta ao modelo — os avisos FD-10…FD-12 ficam de fora)
//       F3 — rastreabilidade (audit-trace-links) em N3, AIMM do ticket e INDEX.md:
//            elo ticket↔funcionalidade só fecha quando os TRÊS lugares concordam.
//       F6 — citação de dicionário (valida-citacoes-dicionario) em todo .md de global/ e
//            modules/: `→ ver <X>-DICTIONARY: alvo` só vale se a entrada existir.
//       F7 — Fluxo Principal (valida-fluxo-principal) em README.md de N2: toda funcionalidade
//            da tabela "## Funcionalidades" tem nó no diagrama.
//       F8 — enumeração da contagem (valida-enumeracao-contagem) em N3: cada processo
//            elementar medido tem o bloco ```json de ALR e DER na memória de cálculo,
//            com nomes (não comentários) e do tamanho da tabela.
//       F9 — regras × cenários (valida-regras-cenarios) em N3: toda regra tem ID `RN-NN`
//            e ao menos um cenário com a tag `@RN-NN` dela.
//       F10 — contrato da API (valida-contrato-api) em N3: `endpoints`/`error_codes` do
//            front-matter espelham `## API` e `## Mapeamento de erros`, todo código está
//            no ERROR-DICTIONARY e todo campo das tabelas da API está em `## Campos`.
//       Identidade — ids-n3 em N2/N3: primeira sequência pela jornada; ID já usado
//                    e reserva são imutáveis, inclusive após reorganizar a tabela.
//
//   • PreToolUse (Bash) → F5: bloqueia comando git destrutivo (reset --hard, checkout --,
//     restore, clean -f) enquanto houver alteração não commitada na árvore.
//
//   • UserPromptSubmit → F4: avisa quando o checkout está atrás de origin/main;
//     F1: ao detectar intenção de especificar, injeta no contexto um lembrete
//     obrigatório de rodar o preflight e confrontar o que já existe ANTES de gerar.
//
// Filosofia: fail-open. Qualquer erro interno do guard → exit 0 (nunca trava a sessão).
// Configuração em .claude/settings.json (ver README de hooks).

import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

const HERE = dirname(fileURLToPath(import.meta.url));
const VALIDATOR = join(HERE, '..', 'validate-doc.mjs'); // scripts/validate-doc.mjs
const SEM_VALIDATOR = join(HERE, '..', 'valida-semantica-funcionalidade.mjs'); // gate semântico de N3
const TRACE_AUDIT = join(HERE, '..', 'audit-trace-links.mjs'); // scripts/audit-trace-links.mjs
const N3_PATTERN = /(^|\/)modules\/[^/]+\/[^/]+\/f-[^/]+\.md$/;
const N2_PATTERN = /(^|\/)modules\/[^/]+\/[^/]+\/README\.md$/;
const CITACOES = join(HERE, '..', 'valida-citacoes-dicionario.mjs'); // `→ ver X-DICTIONARY:` que aponta para nada
const FLUXO_PRINCIPAL = join(HERE, '..', 'valida-fluxo-principal.mjs'); // Fluxo Principal do N2 sem alguma funcionalidade da tabela
const ENUMERACAO = join(HERE, '..', 'valida-enumeracao-contagem.mjs'); // ALR/DER do PE fora do bloco JSON da memória
const REGRAS_CENARIOS = join(HERE, '..', 'valida-regras-cenarios.mjs'); // regra sem RN-NN ou sem cenário @RN-NN
const CONTRATO_API = join(HERE, '..', 'valida-contrato-api.mjs'); // front-matter × API × ERROR-DICTIONARY × Campos
const IDS_N3 = join(HERE, '..', 'ids-n3.mjs');

// Só validamos artefatos de nível (N0–N3, DATA-MODEL). INDEX, AIMMs, prompts,
// scripts, README de projeto etc. passam batido. Padrões espelham LOCATION_RULES do validador.
const ARTIFACT_PATTERNS = [
  /(^|\/)global\/N0_PRODUCT_VISION\.md$/,
  /(^|\/)global\/DATA-MODEL\.md$/,
  /(^|\/)global\/data-models\/[^/]+\.md$/,
  /(^|\/)global\/PATTERNS\.md$/,                       // catálogo de padrões de projeto
  /(^|\/)modules\/[^/]+\/README\.md$/,               // N1
  N2_PATTERN,                                          // N2
  N3_PATTERN,                                          // N3
];

// Artefatos que participam do elo ticket↔funcionalidade — gravou um deles, o elo é auditado.
const TRACE_PATTERNS = [
  N3_PATTERN,                                          // N3 (## Origem)
  /(^|\/)analise-impacto\/AIMM?-[^/]+\.md$/,             // AIMM do ticket (## Funcionalidades)
  /(^|\/)modules\/INDEX\.md$/,                          // tabela consolidada
];

const SPEC_INTENT = /(especific|funcionalidad|feature|\bN1\b|\bN2\b|\bN3\b|feature\s?set|dom[ií]nio|cadastr|\bCRUD\b|requisito|engenharia\s+reversa|sistema\s+(existente|legado)|documentar\s+(o\s+)?(sistema|reposit[óo]rio|pipeline)|PROMPT_(0|1A|1B|2A|2B|3A|3B|4A|4B))/i;

const readStdin = () => { try { return readFileSync(0, 'utf8'); } catch { return ''; } };

function main() {
  let data = {};
  try { data = JSON.parse(readStdin() || '{}'); } catch { return 0; }
  const event = data.hook_event_name || '';

  if (event === 'PostToolUse') {
    const file = data.tool_input && data.tool_input.file_path;
    if (!file) return 0;
    const path = String(file).replace(/\\/g, '/');
    if (/(^|\/)engine\//.test(path)) return 0;               // templates do motor — isentos
    if (/(^|\/)__fixtures__\//.test(path)) return 0;         // fixtures de teste — violações intencionais

    const problems = [];

    if ((N2_PATTERN.test(path) || N3_PATTERN.test(path)) && existsSync(IDS_N3)) {
      const ids = spawnSync('node', [IDS_N3, file, '--check'], { encoding: 'utf8' });
      if (ids.status !== 0) problems.push(
        'GATE DE IDENTIDADE (ids-n3) reprovou: o ID de uma funcionalidade é imutável. Reserve novos IDs pela ordem da jornada na tabela Funcionalidades do N2, depois do maior número usado; nunca renumere nem reutilize lacunas.\n' +
        `${ids.stdout || ''}${ids.stderr || ids.error?.message || ''}`.trim(),
      );
    }

    // F2 — estrutura do artefato de nível (N0–N3, data-model). Validador ausente → fail-open.
    if (ARTIFACT_PATTERNS.some((re) => re.test(path)) && existsSync(VALIDATOR)) {
      const r = spawnSync('node', [VALIDATOR, file], { encoding: 'utf8' });
      if (r.status && r.status !== 0) {
        problems.push(
          'GATE DE ESTRUTURA (validate-doc) reprovou o artefato recém-gravado.\n' +
          'Corrija os desvios abaixo e reescreva o arquivo até o validador sair ✓ ' +
          '(node scripts/validate-doc.mjs <arquivo>).\n\n' +
          `${r.stdout || ''}${r.stderr || ''}`.trim(),
        );
      }
    }

    // Gate SEMÂNTICO de N3: o artefato nomeado como funcionalidade é mesmo uma funcionalidade?
    // (definição canônica: engine/DEFINICAO-FUNCIONALIDADE.md, critérios FD-1…FD-12)
    if (N3_PATTERN.test(path) && existsSync(SEM_VALIDATOR)) {
      const s = spawnSync('node', [SEM_VALIDATOR, file], { encoding: 'utf8' });
      if (s.status && s.status !== 0) {
        problems.push(
          'GATE SEMÂNTICO (valida-semantica-funcionalidade) reprovou: o artefato não passa na ' +
          'definição canônica de funcionalidade (engine/DEFINICAO-FUNCIONALIDADE.md). Corrija os critérios ' +
          'FD abaixo e reescreva até sair ✓ (node scripts/valida-semantica-funcionalidade.mjs <arquivo>).\n\n' +
          `${s.stdout || ''}${s.stderr || ''}`.trim(),
        );
      }
    }

    // F6 — citação de dicionário que aponta para nada. Vale para qualquer .md de
    // `global/` ou `modules/`: o data-model cita o canônico tanto quanto o N3.
    if (/\.md$/.test(path) && /(^|\/)(global|modules)\//.test(path) && existsSync(CITACOES)) {
      const c = spawnSync('node', [CITACOES, file], { encoding: 'utf8' });
      if (c.status && c.status !== 0) {
        problems.push(
          'GATE DE CITAÇÃO (valida-citacoes-dicionario) encontrou "→ ver <X>-DICTIONARY: …" sem entrada\n' +
          'do outro lado. Ou crie a entrada no dicionário (com ⚠️ no que depender de decisão do PO),\n' +
          'ou escreva a validação na própria funcionalidade — citação que não leva a lugar nenhum é pior que\n' +
          'validação inline, porque parece resolvida (node scripts/valida-citacoes-dicionario.mjs <arquivo>).\n\n' +
          `${c.stdout || ''}${c.stderr || ''}`.trim(),
        );
      }
    }

    // F7 — Fluxo Principal do N2 sem alguma funcionalidade da própria tabela "## Funcionalidades": a
    // funcionalidade nova entra na tabela e o diagrama não é revisitado; nada mais acusa.
    if (N2_PATTERN.test(path) && existsSync(FLUXO_PRINCIPAL)) {
      const fp = spawnSync('node', [FLUXO_PRINCIPAL, file], { encoding: 'utf8' });
      if (fp.status && fp.status !== 0) {
        problems.push(
          'GATE DE FLUXO (valida-fluxo-principal) encontrou funcionalidade(s) da tabela "## Funcionalidades" ausentes\n' +
          'do diagrama "## Fluxo Principal". Acrescente um nó com o nome EXATO da funcionalidade (mesmo texto\n' +
          'da tabela) e rode até sair ✓ (node scripts/valida-fluxo-principal.mjs <arquivo>).\n\n' +
          `${fp.stdout || ''}${fp.stderr || ''}`.trim(),
        );
      }
    }

    // F8 — a enumeração de ALR e DER sustenta a memória de cálculo;
    // nomes de dados não se confundem com comentários da contagem.
    if (N3_PATTERN.test(path) && existsSync(ENUMERACAO)) {
      const en = spawnSync('node', [ENUMERACAO, file], { encoding: 'utf8' });
      if (en.status && en.status !== 0) {
        problems.push(
          'GATE DE ENUMERAÇÃO (valida-enumeracao-contagem) reprovou a memória de cálculo: cada processo\n' +
          'elementar medido tem um bloco ```json {"pe", "alr", "der"} logo abaixo do seu cabeçalho na\n' +
          '"### Memória de cálculo" — o item é o NOME do campo ou do arquivo lógico, sem comentário, e as\n' +
          'listas têm o tamanho do ALR e do DER da tabela. O porquê fica em prosa, fora do bloco\n' +
          '(node scripts/valida-enumeracao-contagem.mjs <arquivo>).\n\n' +
          `${en.stdout || ''}${en.stderr || ''}`.trim(),
        );
      }
    }

    // F9 — a regra tem ID e um cenário que a verifica: é o que o teste herda. Sem isso,
    // quem gera o teste deduz qual cenário cobre qual regra.
    if (N3_PATTERN.test(path) && existsSync(REGRAS_CENARIOS)) {
      const rc = spawnSync('node', [REGRAS_CENARIOS, file], { encoding: 'utf8' });
      if (rc.status && rc.status !== 0) {
        problems.push(
          'GATE DE REGRAS × CENÁRIOS (valida-regras-cenarios) reprovou: toda regra de "## Regras de negócio"\n' +
          'começa por `**RN-NN** —` (sequencial, nunca reaproveitado) e ao menos um cenário a verifica, com a\n' +
          'tag `@RN-NN` na linha logo acima do `Scenario:`. Marque o cenário que já verifica a regra; se\n' +
          'nenhum verifica, escreva o cenário (node scripts/valida-regras-cenarios.mjs <arquivo>).\n\n' +
          `${rc.stdout || ''}${rc.stderr || ''}`.trim(),
        );
      }
    }

    // F10 — o contrato da API é dado que o código copia: o front-matter espelha o corpo, e
    // código de erro e campo da API apontam para o que existe.
    if (N3_PATTERN.test(path) && existsSync(CONTRATO_API)) {
      const ca = spawnSync('node', [CONTRATO_API, file], { encoding: 'utf8' });
      if (ca.status && ca.status !== 0) {
        problems.push(
          'GATE DE CONTRATO DA API (valida-contrato-api) reprovou: `endpoints` e `error_codes` do front-matter\n' +
          'espelham `## API` e `## Mapeamento de erros`; todo código de erro existe no ERROR-DICTIONARY (registre\n' +
          'o novo lá); todo campo das tabelas de requisição e resposta tem o Label PO de `## Campos` (ou `—` se\n' +
          'é técnico) (node scripts/valida-contrato-api.mjs <arquivo>).\n\n' +
          `${ca.stdout || ''}${ca.stderr || ''}`.trim(),
        );
      }
    }

    // F3 — consistência dos elos ticket↔funcionalidade nas três fontes.
    // exit 2 do audit = erro de uso, não achado → fail-open.
    if (TRACE_PATTERNS.some((re) => re.test(path)) && existsSync(TRACE_AUDIT)) {
      const a = spawnSync('node', [TRACE_AUDIT, '--root', dirname(file), '--file', file], { encoding: 'utf8' });
      if (a.status && a.status !== 0 && a.status !== 2) {
        problems.push(
          'GATE DE RASTREABILIDADE (audit-trace-links) encontrou elos inconsistentes envolvendo este artefato.\n' +
          'Se esta gravação faz parte de uma passada em andamento (3A/4A), termine de fechar o elo nos TRÊS\n' +
          'lugares (## Origem do N3 + ## Funcionalidades da AIMM do ticket + linha do INDEX.md) — o gate sai ✓ ao final.\n' +
          'Não declare a etapa concluída com elo unilateral.\n\n' +
          `${a.stdout || ''}${a.stderr || ''}`.trim(),
        );
      }
    }

    if (problems.length) {
      process.stderr.write(problems.join('\n\n') + '\nNão declare a etapa concluída antes de todos os gates saírem ✓.\n');
      return 2; // feedback ao modelo (não bloqueia a escrita já feita, mas força a correção)
    }
    return 0;
  }

  // F5 — comando destrutivo com trabalho não commitado na árvore.
  // `git reset --hard`, `checkout --`, `restore` e `clean -f` apagam o que ainda não
  // foi commitado, inclusive o que VOCÊ acabou de escrever. Simular um estado para
  // testar um guard já destruiu uma regra recém-escrita, e o `git status` fica limpo
  // justamente porque a edição sumiu — nada acusa depois. Bloqueia com feedback; a
  // saída é commitar ou dar `stash` antes, que é o que se queria de qualquer forma.
  if (event === 'PreToolUse') {
    const cmd = String(data.tool_input?.command || '');
    const DESTRUTIVO = /git\s+(reset\s+--hard|checkout\s+--\s|restore\s+(?!--staged)|clean\s+-[a-z]*f)/;
    if (!DESTRUTIVO.test(cmd)) return 0;
    try {
      const st = spawnSync('git', ['status', '--porcelain'], { encoding: 'utf8', timeout: 3000 });
      const sujos = (st.stdout || '').split('\n').filter((l) => l.trim()).length;
      if (sujos > 0) {
        process.stderr.write(
          [
            `⚠️ ${sujos} arquivo(s) com alteração não commitada, e este comando apaga o que não foi commitado:`,
            `    ${cmd.trim().slice(0, 120)}`,
            'Commite ou rode `git stash` antes — inclusive o que você mesmo acabou de escrever se perde,',
            'e o `git status` fica limpo depois justamente porque a edição sumiu.',
            'Para simular um estado sem custo, use um repositório onde você não tem trabalho pendente.',
            '',
          ].join('\n'),
        );
        return 2;
      }
    } catch { /* fail-open */ }
    return 0;
  }

  if (event === 'UserPromptSubmit') {
    // F4 — checkout atrasado. `origin/main..HEAD` responde o que falta subir; a pergunta
    // oposta, `HEAD..origin/main`, é a que diz se você está vendo o repositório como ele
    // está. Ler só a primeira já fez um .docx de Agrupamento Funcional criado no mesmo dia ser
    // relatado como órfão e quase apagado. Usa o ref local (sem fetch: instantâneo) — na
    // prática a sessão já fez fetch, e é justamente aí que o desencontro aparece.
    try {
      const atras = spawnSync('git', ['rev-list', '--count', 'HEAD..origin/main'],
        { encoding: 'utf8', timeout: 3000 });
      const n = parseInt((atras.stdout || '').trim(), 10);
      if (Number.isFinite(n) && n > 0) {
        process.stdout.write(
          [
            `⚠️ CHECKOUT ATRASADO: a origin/main tem ${n} commit(s) que este checkout não viu.`,
            'Rode `git fetch origin main && git merge --ff-only origin/main` ANTES de concluir',
            'qualquer coisa sobre o conteúdo do repositório — e obrigatoriamente antes de apagar',
            'algo ou de relatar que algo está ausente, órfão ou sem uso.',
            '',
            '',
          ].join('\n'),
        );
      }
    } catch { /* fail-open: guard nunca trava a sessão */ }

    const text = String(data.user_input || data.prompt || JSON.stringify(data) || '');
    if (!SPEC_INTENT.test(text)) return 0;
    process.stdout.write(
      '⚠️ PREFLIGHT DE ESPECIFICAÇÃO (obrigatório antes de gerar N1/N2/N3):\n' +
      '1. Rode `node scripts/preflight-spec.mjs <dominio> [agrupamento-funcional]` e leia o estado atual.\n' +
      '2. Confronte N0 (`global/N0_PRODUCT_VISION.md`) + `modules/INDEX.md` + o N1 do domínio + o N2 do Agrupamento Funcional.\n' +
      '3. Produza um bloco "Contexto verificado" (o que já existe, IDs tomados, próximo NN livre, ' +
      'regras/campos já canônicos a referenciar) ANTES de especificar — não recrie IDs nem pastas existentes.\n' +
      'Ao gravar, o hook roda `scripts/validate-doc.mjs` e devolve desvios estruturais para você corrigir até sair ✓.\n',
    );
    return 0;
  }

  return 0;
}

try { process.exit(main()); } catch { process.exit(0); }
