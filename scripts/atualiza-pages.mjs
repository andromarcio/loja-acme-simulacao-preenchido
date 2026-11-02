#!/usr/bin/env node
// atualiza-pages.mjs — regenera, na ordem certa, tudo que o site de documentação deriva.
//
// Para quê: o visualizador não lê o repositório em tempo real — ele lê ARTEFATOS
// GERADOS (a árvore com o conteúdo embutido, o mapa de funcionalidades, o grafo de
// rastreabilidade, o espelho da esteira). Cada um tem o seu script, e esquecer um
// deixa o site mostrando um retrato velho sem nenhum aviso. Este script é o único
// comando a rodar depois de mexer nos .md.
//
// A ORDEM NÃO É ARBITRÁRIA — está declarada em PIPELINE e é o que este script
// entrega de mais valioso:
//   1. o espelho da esteira reescreve o modules/INDEX.md;
//   2. o HTML das AIMMs (analise-impacto/) nasce do .md;
//   3. o mapa de funcionalidades e o grafo leem os N3; o diagrama ER, os fragmentos do data-model;
//   4. a ÁRVORE vem depois de tudo, porque embute o CONTEÚDO dos .md — inclusive o
//      INDEX.md que o passo 1 acabou de reescrever. Rodar a árvore antes congela a
//      versão velha;
//   5. o standalone é um retrato do site inteiro, então é o último de todos.
//
// Uso (a partir da raiz da instância):
//   node scripts/atualiza-pages.mjs              # roda o que se aplica a esta instância
//   node scripts/atualiza-pages.mjs --dry        # só diz o que rodaria, sem escrever
//   node scripts/atualiza-pages.mjs --com-standalone  # inclui o site em arquivo único
//   node scripts/atualiza-pages.mjs --com-dicionarios  # inclui o índice de uso (ALTERA specs)
//
// As instâncias divergem: nem todas têm standalone ou grafo de rastreabilidade.
// Cada passo declara como se detecta, e o que não se aplica é PULADO COM MOTIVO — um
// passo silenciosamente ausente é indistinguível de um passo que falhou.

import { existsSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const RAIZ = process.cwd();
const args = new Set(process.argv.slice(2));
const invalidos = [...args].filter(arg => !['--dry', '-n', '--com-dicionarios', '--com-standalone'].includes(arg));
if (invalidos.length) {
  console.error(`✗ Opção desconhecida: ${invalidos.join(', ')}.`);
  process.exit(2);
}
const DRY = args.has('--dry') || args.has('-n');
const COM_DICIONARIOS = args.has('--com-dicionarios');
const COM_STANDALONE = args.has('--com-standalone');

const tem = (p) => existsSync(join(RAIZ, p));
const temPasta = (p) => tem(p) && statSync(join(RAIZ, p)).isDirectory();

const PIPELINE = [
  {
    nome: 'Espelho da esteira (gates) no modules/INDEX.md',
    quando: () => tem('scripts/gates.py') && tem('modules/INDEX.md'),
    porQueAqui: 'reescreve o INDEX.md que a árvore vai embutir mais adiante',
    cmd: ['python3', ['scripts/gates.py', 'promote', '--write']],
  },
  {
    nome: 'HTML das AIMMs (analise-impacto/)',
    quando: () => tem('scripts/gera-html-impacto.mjs') && temPasta('analise-impacto'),
    porQueAqui: 'o .md é a fonte; o HTML é derivado e circula fora do editor',
    cmd: ['node', ['scripts/gera-html-impacto.mjs', 'analise-impacto/']],
  },
  {
    nome: 'Mapa de funcionalidades (assets/mapa-data.js)',
    quando: () => tem('scripts/gera-mapa-funcionalidades.mjs'),
    porQueAqui: 'lê os N3; independe da árvore',
    cmd: ['node', ['scripts/gera-mapa-funcionalidades.mjs']],
  },
  {
    nome: 'Grafo de rastreabilidade (rastreabilidade/data.js)',
    quando: () => tem('scripts/build-trace-data.mjs') && tem('rastreabilidade/data.js'),
    porQueAqui: 'só existe nas instâncias que publicam o grafo',
    cmd: ['node', ['scripts/build-trace-data.mjs', '--root', '.', '-o', 'rastreabilidade/data.js']],
  },
  {
    nome: 'Diagrama ER (global/DIAGRAMA-ER.md)',
    quando: () => tem('scripts/gera-diagrama-er.mjs') && temPasta('global/data-models'),
    porQueAqui: 'escreve um .md que a árvore vai embutir',
    cmd: ['node', ['scripts/gera-diagrama-er.mjs']],
  },
  {
    nome: 'Índice de repositórios (repos/INDEX.md)',
    quando: () => tem('scripts/gera-indice-repos.mjs') && tem('repos/INDEX.md'),
    porQueAqui: 'escreve no repos/INDEX.md, que a árvore vai embutir',
    cmd: ['node', ['scripts/gera-indice-repos.mjs']],
  },
  {
    nome: 'Índice de uso nos dicionários',
    quando: () => COM_DICIONARIOS && tem('scripts/generate-usage-index.mjs'),
    porQueAqui: 'ALTERA os dicionários — por isso é opt-in, com --com-dicionarios',
    cmd: ['node', ['scripts/generate-usage-index.mjs', '--write']],
    puloPadrao: 'opt-in (--com-dicionarios) — altera conteúdo de spec, não só artefato gerado',
  },
  {
    nome: 'Dashboard de gestão (assets/dashboard-data.js)',
    quando: () => tem('scripts/gera-dashboard.py'),
    porQueAqui: 'lê os documentos e as refs do Git, sem alterar as specs ou os gates',
    cmd: [process.platform === 'win32' ? 'python' : 'python3', ['scripts/gera-dashboard.py']],
  },
  {
    nome: 'Árvore do visualizador (assets/tree.js)',
    quando: () => tem('assets/generate-tree.js'),
    porQueAqui: 'DEPOIS de tudo que escreve .md — a árvore embute o conteúdo, não o caminho',
    cmd: ['node', ['assets/generate-tree.js']],
  },
  {
    nome: 'Site standalone (arquivo único)',
    quando: () => COM_STANDALONE && tem('scripts/gera-standalone.mjs'),
    porQueAqui: 'retrato do site inteiro — tem de ser o último',
    cmd: ['node', ['scripts/gera-standalone.mjs']],
    puloPadrao: 'opt-in (--com-standalone) — a saída não é versionada; gere sob demanda para mandar por e-mail ou celular',
  },
];

console.log(`atualiza-pages — ${RAIZ}${DRY ? '  (modo seco)' : ''}\n`);

let rodados = 0, pulados = 0, falhas = 0;

for (const passo of PIPELINE) {
  const aplicavel = passo.quando();
  if (!aplicavel) {
    const motivo = passo.puloPadrao ?? 'não se aplica a esta instância';
    console.log(`  ⊘ ${passo.nome}\n      ${motivo}`);
    pulados++;
    continue;
  }
  const [bin, argv] = passo.cmd;
  if (DRY) {
    console.log(`  · ${passo.nome}\n      ${bin} ${argv.join(' ')}\n      ${passo.porQueAqui}`);
    rodados++;
    continue;
  }
  try {
    const saida = execFileSync(bin, argv, { cwd: RAIZ, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    const ultima = saida.trim().split('\n').filter(Boolean).pop() || '(sem saída)';
    console.log(`  ✓ ${passo.nome}\n      ${ultima}`);
    rodados++;
  } catch (e) {
    const msg = (e.stderr || e.stdout || e.message || '').toString().trim().split('\n').slice(-3).join('\n      ');
    console.log(`  ✗ ${passo.nome}\n      ${msg}`);
    falhas++;
  }
}

console.log(`\n${DRY ? 'Rodaria' : 'Rodados'}: ${rodados} · pulados: ${pulados}${falhas ? ` · FALHARAM: ${falhas}` : ''}`);
if (!DRY && !falhas) console.log('Confira o `git status` antes de commitar — os artefatos gerados entram no mesmo commit da mudança que os originou.');
process.exit(falhas ? 1 : 0);
