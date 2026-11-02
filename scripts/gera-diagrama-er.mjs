#!/usr/bin/env node
// gera-diagrama-er.mjs — desenha o data model: um `erDiagram` Mermaid por domínio, em
// `global/DIAGRAMA-ER.md`, derivado dos fragmentos `global/data-models/*.md`.
//
// Por quê: o fragmento é tabela — campo a campo, ótimo para o modelo e para quem
// especifica, ruim para ver de relance quem aponta para quem. O diagrama é SAÍDA, não
// fonte: nasce dos fragmentos, nunca é editado à mão, e fica num arquivo próprio para
// não engordar o fragmento que se cola no contexto do LLM. O visualizador da instância
// já desenha blocos ```mermaid```; a CI (`--check`) acusa o diagrama desatualizado.
//
// O que lê, em cada fragmento:
//   - entidade: cabeçalho `## Nome` ou `## Entidade: \`Nome\` — NAME \`Nome lógico\``
//     (também `## Entidade associativa: …`) seguido de tabela cujo cabeçalho começa por
//     `Label PO` ou `Atributo` — seção sem essa tabela (Relacionamentos, Arquivos
//     Lógicos, Changelog, pendências) não é entidade;
//   - colunas pelo CABEÇALHO, não pela posição: o nome do atributo é o `Campo banco` /
//     `CODE` quando existe (fragmento físico) e o Label PO quando não (negocial);
//   - relacionamento: `FK → alvo` nas Notas e `seleção → alvo` no Tipo viram 1:N (o lado
//     do alvo é obrigatório quando o campo é); `seleção múltipla → alvo` e `M:N com
//     \`alvo\`` viram N:N. O alvo casa com a entidade pelo nome, pelo NAME lógico ou pela
//     tabela em snake_case, sem acento nem caixa — de qualquer domínio. Alvo de outro
//     domínio aparece como caixa vazia; alvo que nenhum fragmento modela, também.
//
// O que fica de fora: os campos globais implícitos (id, tenant, carimbos de data), como
// no próprio fragmento — senão toda entidade apontaria para a conta. A seção
// `## Relacionamentos` não é lida: ela repete, em prosa, o que os campos já dizem.
//
// Uso (a partir da raiz da instância):
//   node scripts/gera-diagrama-er.mjs            # escreve global/DIAGRAMA-ER.md
//   node scripts/gera-diagrama-er.mjs --check    # exit 1 se o arquivo está desatualizado
//   node scripts/gera-diagrama-er.mjs --root <dir>

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const args = process.argv.slice(2);
const CHECK = args.includes('--check');
const iRoot = args.indexOf('--root');
const ROOT = iRoot >= 0 ? args[iRoot + 1] : process.cwd();
const DIR = join(ROOT, 'global', 'data-models');
const SAIDA = join(ROOT, 'global', 'DIAGRAMA-ER.md');

const chave = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
// Token aceito pelo erDiagram: sem espaço nem aspas (acento, hífen e parênteses passam).
const token = (s) => s.replace(/`|⚠️|\*/g, '').trim().replace(/\s+/g, '_').replace(/[^\p{L}\p{N}_\-()[\]]/gu, '') || '_';
const celulas = (l) => l.split('|').slice(1, -1).map((c) => c.trim());

function leFragmento(arquivo) {
  const md = readFileSync(join(DIR, arquivo), 'utf8');
  const titulo = (md.match(/^# Data Model\s*[:—-]\s*(.+?)\s*$/m) || [])[1]?.replace(/\s*\(`[^`]*`\)\s*$/, '') || arquivo.replace(/\.md$/, '');
  const ents = [];
  let cab = null, cols = null;
  for (const linha of md.split('\n')) {
    const h = linha.match(/^## (.+?)\s*$/);
    if (h) {
      const m = h[1].match(/^Entidade(?: associativa)?:\s*`([^`]+)`(?:\s*—\s*NAME\s*`([^`]+)`)?/);
      cab = m ? { nome: m[1], logico: m[2] } : (/^[A-Za-z]\w*$/.test(h[1]) ? { nome: h[1] } : null);
      cols = null;
      continue;
    }
    if (!cab || !linha.startsWith('|')) continue;
    const c = celulas(linha);
    if (!cols) {
      if (!/^(Label PO|Atributo)/.test(c[0])) { cab = null; continue; }
      const idx = (re) => c.findIndex((x) => re.test(x));
      cols = { fis: idx(/^(Campo banco|CODE)/), tipo: idx(/^Tipo/), obrig: idx(/^Obrigat/), notas: idx(/^Notas/) };
      ents.push({ ...cab, attrs: [], rels: [] });
      continue;
    }
    if (/^:?-+/.test(c[0])) continue;
    const ent = ents[ents.length - 1];
    const tipo = c[cols.tipo] ?? '';
    const notas = cols.notas >= 0 ? c[cols.notas] ?? '' : '';
    const nome = token(cols.fis >= 0 && /\w/.test(c[cols.fis] ?? '') ? c[cols.fis] : c[0]);
    const obrig = /^(sim|automático)/i.test(c[cols.obrig] ?? '');
    const mn = notas.match(/M:N com `([^`]+)`/);
    if (mn) { ent.rels.push({ alvo: mn[1], nn: true, rotulo: token(c[0]) }); continue; }
    const fk = notas.match(/FK → (?:`([^`]+)`|(\w+))/) || tipo.match(/seleção(?: múltipla)? → (?:`([^`]+)`|([\p{L}\w]+))/u);
    if (fk) ent.rels.push({ alvo: fk[1] || fk[2], nn: /seleção múltipla/.test(tipo), obrig, rotulo: nome });
    ent.attrs.push({ tipo: token(tipo.split(/→| \(/)[0]), nome, fk: !!fk && !/seleção múltipla/.test(tipo) });
  }
  return { arquivo, titulo, ents };
}

const fragmentos = existsSync(DIR)
  ? readdirSync(DIR).filter((f) => f.endsWith('.md') && !f.startsWith('_')).sort().map(leFragmento)
  : [];

// Catálogo de todos os domínios: nome, NAME lógico e tabela snake_case → nome da entidade.
const catalogo = new Map();
for (const f of fragmentos) for (const e of f.ents) {
  for (const k of [e.nome, e.logico, e.nome.replace(/([a-z0-9])([A-Z])/g, '$1_$2')]) if (k) catalogo.set(chave(k), e.nome);
}
const resolve = (alvo) => catalogo.get(chave(alvo)) || token(alvo.split(/\s+/).map((p) => p[0].toUpperCase() + p.slice(1)).join(''));

const partes = [
  '<!-- gerado por scripts/gera-diagrama-er.mjs a partir de global/data-models/*.md — não editar à mão -->',
  '# Diagrama ER',
  '> Um diagrama por domínio, derivado dos fragmentos de `global/data-models/`. A fonte é o fragmento: mude lá e rode `node scripts/gera-diagrama-er.mjs`. Os campos globais implícitos ficam de fora, como no fragmento; entidade de outro domínio aparece como caixa vazia.',
];
for (const f of fragmentos) {
  partes.push('', `## ${f.titulo}`, '', `Fonte: [\`data-models/${f.arquivo}\`](./data-models/${f.arquivo})`, '');
  if (!f.ents.length) { partes.push('Sem entidades em tabela neste fragmento.'); continue; }
  const linhas = ['```mermaid', 'erDiagram'];
  for (const e of f.ents) {
    if (!e.attrs.length) { linhas.push(`  ${token(e.nome)}`); continue; }
    // O erDiagram desenha a primeira palavra da linha na primeira coluna: o nome vem antes do
    // tipo para a caixa ler "nome, tipo" (a sintaxe pede "tipo nome"; as duas aceitam o mesmo token).
    linhas.push(`  ${token(e.nome)} {`, ...e.attrs.map((a) => `    ${a.nome} ${a.tipo}${a.fk ? ' FK' : ''}`), '  }');
  }
  for (const e of f.ents) for (const r of e.rels) {
    const alvo = resolve(r.alvo);
    linhas.push(r.nn
      ? `  ${token(e.nome)} }o--o{ ${alvo} : "${r.rotulo}"`
      : `  ${alvo} ${r.obrig ? '||' : '|o'}--o{ ${token(e.nome)} : "${r.rotulo}"`);
  }
  partes.push(...linhas, '```');
}
const texto = `${partes.join('\n')}\n`;

if (!fragmentos.length) {
  console.log('gera-diagrama-er: nenhum fragmento em global/data-models/ — nada a desenhar.');
  process.exit(0);
}
const atual = existsSync(SAIDA) ? readFileSync(SAIDA, 'utf8') : null;
const resumo = `${fragmentos.length} domínio(s), ${fragmentos.reduce((n, f) => n + f.ents.length, 0)} entidade(s), ${fragmentos.reduce((n, f) => n + f.ents.reduce((m, e) => m + e.rels.length, 0), 0)} relacionamento(s)`;
if (CHECK) {
  if (atual === texto) { console.log(`gera-diagrama-er: global/DIAGRAMA-ER.md em dia — ${resumo}.`); process.exit(0); }
  console.error(`gera-diagrama-er: global/DIAGRAMA-ER.md ${atual === null ? 'não existe' : 'está desatualizado'}. Rode: node scripts/gera-diagrama-er.mjs  e commite.`);
  process.exit(1);
}
writeFileSync(SAIDA, texto);
console.log(`gera-diagrama-er: global/DIAGRAMA-ER.md ${atual === texto ? 'já estava em dia' : 'escrito'} — ${resumo}.`);
