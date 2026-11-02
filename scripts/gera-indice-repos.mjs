#!/usr/bin/env node
// gera-indice-repos.mjs — o índice reverso: para cada repositório, as funcionalidades que ele
// implementa. Seção gerada em `repos/INDEX.md`.
//
// Por quê (pedido do PO, 2026-10-07): num sistema de microsserviços — uma sigla da Caixa
// tem mais de 200 —, a pergunta de impacto mais comum vem do código: "se eu mexer no
// serviço X, que funcionalidades mudam?". A especificação responde no sentido contrário
// (o `## Implementação` de cada N3 lista os repositórios que a realizam), e ninguém
// varre centenas de N3 à mão. Este script inverte a ligação e a deixa à vista no
// inventário, que é onde se procura um repositório.
//
// O índice é SAÍDA, não fonte: nasce do `## Implementação` dos N3 e do inventário
// (`repos/INDEX.md`, a primeira tabela), entre os marcadores
// `<!-- REPOS-FEATURES:INICIO -->` e `<!-- REPOS-FEATURES:FIM -->` — o resto do arquivo
// não é tocado. Vale nos dois perfis: no `completo`, o 3B preenche o repositório; no
// `requisitos`, o 3A o preenche quando o inventário existe.
//
// O que a seção traz:
//   - uma linha por repositório que implementa ao menos uma funcionalidade, com o domínio (do
//     inventário, ou o dos N1 das funcionalidades) e as funcionalidades como `ID — Nome`, com link;
//   - os repositórios do inventário que nenhum N3 cita (o de doc fica de fora);
//   - os repositórios citados em N3 que não estão no inventário — nome errado ou
//     inventário incompleto (o validate-doc reprova isso só em `em-desenvolvimento` e
//     `implementado`; aqui aparece em qualquer estado).
//
// Uso (a partir da raiz da instância):
//   node scripts/gera-indice-repos.mjs            # escreve a seção em repos/INDEX.md
//   node scripts/gera-indice-repos.mjs --check    # exit 1 se a seção está desatualizada
//   node scripts/gera-indice-repos.mjs --root <dir>

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';
import { inventario, ehRepoDeDoc, reposDaImplementacao, arquivosN3 } from './lib/repos.mjs';
import { frontMatter } from './lib/front-matter.mjs';

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
const ROOT = resolve(opt('--root', '.'));
const CHECK = args.includes('--check');
const INDEX = join(ROOT, 'repos', 'INDEX.md');
const INI = '<!-- REPOS-FEATURES:INICIO -->';
const FIM = '<!-- REPOS-FEATURES:FIM -->';

if (!existsSync(INDEX)) {
  console.log('gera-indice-repos: a instância não tem repos/INDEX.md — nada a indexar.');
  process.exit(0);
}
const inv = (inventario(ROOT) || []).filter((r) => !ehRepoDeDoc(r, ROOT));
const noInv = new Map(inv.map((r) => [r.nome.toLowerCase(), r]));

// repositório (minúsculo) → { nome, funcionalidades: [{ id, titulo, link, dominio }] }
const porRepo = new Map();
for (const arq of arquivosN3(ROOT)) {
  const texto = readFileSync(arq, 'utf8');
  const fm = frontMatter(texto.split(/\r?\n/)) || {};
  const id = fm.id || (texto.match(/`([A-Z]{3}-[A-Z]{3}-\d{2})`/) || [])[1];
  if (!id) continue;
  const titulo = ((texto.match(/^# (.+)$/m) || [])[1] || id).trim();
  const link = relative(join(ROOT, 'repos'), arq).replace(/\\/g, '/');
  const vistos = new Set();
  for (const { nome } of reposDaImplementacao(texto)) {
    const k = nome.toLowerCase();
    if (vistos.has(k)) continue;
    vistos.add(k);
    if (!porRepo.has(k)) porRepo.set(k, { nome: (noInv.get(k) || {}).nome || nome, features: [] });
    porRepo.get(k).features.push({ id, titulo, link, dominio: fm.dominio || id.slice(0, 3) });
  }
}

const linhas = [];
const comFeature = [...porRepo.entries()].filter(([k]) => noInv.has(k)).sort((a, b) => a[1].nome.localeCompare(b[1].nome));
const foraDoInv = [...porRepo.entries()].filter(([k]) => !noInv.has(k)).sort((a, b) => a[1].nome.localeCompare(b[1].nome));
const semFeature = inv.filter((r) => !porRepo.has(r.nome.toLowerCase())).map((r) => r.nome).sort();
const lista = (fs) => fs.sort((a, b) => a.id.localeCompare(b.id)).map((f) => `[${f.id} — ${f.titulo}](${f.link})`).join(' · ');

linhas.push(INI, '## Funcionalidades por repositório', '');
linhas.push('> ⚙️ **Seção gerada por `scripts/gera-indice-repos.mjs` — não editar à mão.** O índice reverso do `## Implementação` dos N3: as funcionalidades que cada repositório implementa — o que muda se ele mudar. A fonte é o N3; corrija lá e regenere.', '');
if (comFeature.length) {
  linhas.push('| Repositório | Domínio | Funcionalidades |', '|---|---|---|');
  for (const [k, r] of comFeature) {
    const dom = noInv.get(k).dominio || [...new Set(r.features.map((f) => f.dominio))].sort().join(' · ');
    linhas.push(`| \`${r.nome}\` | ${dom} | ${r.features.length}: ${lista(r.features)} |`);
  }
} else {
  linhas.push('_Nenhum N3 declara repositório do inventário no `## Implementação` ainda._');
}
linhas.push('');
linhas.push(`**Sem funcionalidade declarada** (${semFeature.length}): ${semFeature.length ? semFeature.map((n) => `\`${n}\``).join(' · ') : '—'}`, '');
if (foraDoInv.length) {
  linhas.push(`**Fora do inventário** — citados no \`## Implementação\` e ausentes da tabela acima; corrija o nome no N3 ou registre o repositório (${foraDoInv.length}):`, '');
  for (const [, r] of foraDoInv) linhas.push(`- \`${r.nome}\` — ${lista(r.features)}`);
  linhas.push('');
}
linhas.push(FIM);
const bloco = linhas.join('\n');

const atual = readFileSync(INDEX, 'utf8');
const novo = atual.includes(INI) && atual.includes(FIM)
  ? atual.slice(0, atual.indexOf(INI)) + bloco + atual.slice(atual.indexOf(FIM) + FIM.length)
  : `${atual.replace(/\s*$/, '')}\n\n---\n\n${bloco}\n`;

const resumo = `${comFeature.length} repositório(s) com funcionalidade · ${semFeature.length} sem · ${foraDoInv.length} fora do inventário`;
if (CHECK) {
  if (novo !== atual) {
    console.log(`✗ repos/INDEX.md: a seção "Funcionalidades por repositório" está desatualizada (${resumo}). Rode: node scripts/gera-indice-repos.mjs`);
    process.exit(1);
  }
  console.log(`✓ repos/INDEX.md: índice de repositórios em dia (${resumo}).`);
  process.exit(0);
}
if (novo === atual) console.log(`repos/INDEX.md já está em dia — ${resumo}.`);
else { writeFileSync(INDEX, novo); console.log(`✓ repos/INDEX.md: "Funcionalidades por repositório" escrita — ${resumo}.`); }
