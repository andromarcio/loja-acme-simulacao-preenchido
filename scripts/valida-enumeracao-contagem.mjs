#!/usr/bin/env node
// valida-enumeracao-contagem.mjs — a enumeração de ALR e DER de cada processo elementar
// do N3 é DADO, não prosa: um bloco ```json``` na `### Memória de cálculo`.
//
// Por quê: a planilha de entrega copia a enumeração para as colunas Descrição de DER e
// ALR, e a equipe de métricas confere item a item. Escrita em prosa, a lista misturava
// campo com comentário — "Ata (Número do Contrato + Nome + Fornecedor, coluna combinada
// de ## Colunas do resultado)", "(mesmos campos)", a explicação do CPM antes do primeiro
// arquivo lógico —, e o script que a lia não tinha como separar um do outro. Achado real:
// a planilha do portal-compras de 2026-10-02 (`RPR-GES-01`, "Consultar Ata sob minha
// gestão (combo)"). No bloco, o item é o NOME, e o número da tabela tem de ser o tamanho
// da lista: o que antes eram duas coisas escritas à mão passa a ser uma.
//
// O bloco, um por linha da tabela com PF numérico, logo abaixo do cabeçalho do PE:
//
//   **<PE>** — SE · ALR 2 · DER 5 · Baixa · 4 PF
//
//   ```json
//   {"pe": "<PE>", "alr": ["Ata de Registro de Preços", "…"], "der": ["Ata", "…", "Mensagem", "Ação"]}
//   ```
//
//   chaves: pe (o nome da linha da tabela) · alr · der (listas de nomes) ·
//           nao_contados (opcional: o que ficou de fora — vira comentário da célula) ·
//           motivo (obrigatório na linha de 0 PF, e só nela: por que não conta)
//
// O que reprova: bloco ausente ou órfão (sem linha na tabela), JSON inválido, chave fora
// da lista, ALR/DER da tabela diferente do tamanho da lista, item repetido e item que não
// é nome — vazio, longo (> 60), com `: ; — → + * # ? !` ou crase, só parêntese, ou
// parêntese com vírgula. Parêntese curto passa: "Valor unitário (R$)" é nome de campo.
// A justificativa — o motivo de cada leitura, o artigo do CPM — continua em prosa, fora
// do bloco.
//
// Linha com `—` no PF (ainda não medida) e o PE reutilizado (`↪`) não têm bloco.
//
// Uso:  node scripts/valida-enumeracao-contagem.mjs [arquivo f-*.md | pasta] …
//       (sem argumentos: todo `modules/**/f-*.md`)

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const rel = (p) => p.replace(`${ROOT}/`, '').replace(/\\/g, '/');
const CHAVES = new Set(['pe', 'alr', 'der', 'nao_contados', 'motivo']);
const norm = (s) => String(s).replace(/[`*]/g, '').normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/\s+/g, ' ').trim();
const celulas = (l) => l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());

function problemaDoItem(s) {
  if (typeof s !== 'string' || !s.trim()) return 'vazio';
  if (s.length > 60) return 'longo demais — é nome, não explicação';
  if (/[:;—–→+*#?!`\n]/.test(s)) return 'tem anotação (`: ; — → + * # ? !` ou crase)';
  if (/^\s*\(.*\)\s*$/.test(s)) return 'só parêntese — é comentário, não campo';
  if (/\([^)]*,[^)]*\)/.test(s)) return 'parêntese com vírgula — é anotação';
  return null;
}

function n3s(alvos) {
  const out = [];
  const anda = (p) => {
    if (statSync(p).isDirectory()) { for (const n of readdirSync(p)) if (!n.startsWith('.')) anda(join(p, n)); }
    else if (/(^|[\\/])f-[^\\/]+\.md$/.test(p)) out.push(p);
  };
  for (const a of alvos) if (existsSync(a)) anda(a);
  return out;
}

function confere(arq) {
  const linhas = readFileSync(arq, 'utf8').split(/\r?\n/);
  const ini = linhas.findIndex((l) => /^##\s+Métricas de tamanho\s*$/.test(l.trim()));
  if (ini < 0) return [];
  let fim = linhas.findIndex((l, k) => k > ini && /^##\s/.test(l));
  if (fim < 0) fim = linhas.length;
  const sec = linhas.slice(ini + 1, fim);

  // a tabela: a primeira da seção, lida pelo cabeçalho
  const tab = [];
  for (const l of sec) {
    if (l.trim().startsWith('|')) { if (!/^\|[\s:|-]+\|?$/.test(l.trim())) tab.push(celulas(l)); }
    else if (tab.length) break;
  }
  if (!tab.length) return [];
  const cab = tab[0];
  const col = (re) => cab.findIndex((c) => re.test(c));
  const iPE = col(/^(Fun[çc][ãa]o de Transa[çc][ãa]o|Processo elementar)$/i);
  const iT = col(/^Tipo$/i), iA = col(/^ALR$/i), iD = col(/^DER$/i), iPF = col(/^PF$/i);
  if (iPE < 0 || iPF < 0) return [];
  const medidas = tab.slice(1).filter((c) => /^\d+$/.test(c[iPF] || '') && !(c[iT] || '').includes('↪'));

  // os blocos, só dentro da `### Memória de cálculo`
  const erros = [];
  const blocos = new Map();
  const iMem = sec.findIndex((l) => /^###\s+Mem[óo]ria de c[áa]lculo/i.test(l.trim()));
  for (let k = iMem < 0 ? sec.length : iMem + 1; k < sec.length; k++) {
    if (sec[k].trim() !== '```json') continue;
    const corpo = [];
    for (k++; k < sec.length && sec[k].trim() !== '```'; k++) corpo.push(sec[k]);
    let b;
    try { b = JSON.parse(corpo.join('\n')); }
    catch (e) { erros.push(`bloco JSON inválido (${e.message.split('\n')[0]}): ${corpo.join(' ').slice(0, 70)}`); continue; }
    if (!b || typeof b !== 'object' || Array.isArray(b) || typeof b.pe !== 'string') {
      erros.push(`bloco sem \`"pe"\` (o nome do processo elementar, como na tabela): ${corpo.join(' ').slice(0, 70)}`);
      continue;
    }
    if (blocos.has(norm(b.pe))) erros.push(`"${b.pe}": dois blocos para o mesmo processo elementar.`);
    blocos.set(norm(b.pe), b);
  }

  const repetidos = medidas.map((c) => norm(c[iPE])).filter((n, k, a) => a.indexOf(n) !== k);
  for (const n of new Set(repetidos)) erros.push(`"${medidas.find((c) => norm(c[iPE]) === n)[iPE]}": o mesmo nome em mais de uma linha da tabela — cada processo elementar tem nome próprio, que é como o bloco o encontra.`);
  for (const c of medidas) {
    const pe = c[iPE].replace(/[`*]/g, '').trim();
    const pf = Number(c[iPF]);
    const b = blocos.get(norm(pe));
    blocos.delete(norm(pe));
    if (!b) {
      erros.push(`"${pe}": sem o bloco \`\`\`json da enumeração na \`### Memória de cálculo\`${pf ? '' : ' (na linha de 0 PF, com o `motivo`)'}.`);
      continue;
    }
    const fora = Object.keys(b).filter((k) => !CHAVES.has(k));
    if (fora.length) erros.push(`"${pe}": chave(s) fora do formato: ${fora.join(', ')} — use pe, alr, der, nao_contados, motivo.`);
    if (b.nao_contados !== undefined && typeof b.nao_contados !== 'string') erros.push(`"${pe}": \`nao_contados\` é texto.`);
    if (pf === 0) {
      if (typeof b.motivo !== 'string' || !b.motivo.trim()) erros.push(`"${pe}": linha de 0 PF sem \`motivo\` — é ele que a planilha mostra.`);
      if ((b.alr || []).length || (b.der || []).length) erros.push(`"${pe}": linha de 0 PF com \`alr\`/\`der\` — o que não conta não se enumera.`);
      continue;
    }
    if (b.motivo !== undefined) erros.push(`"${pe}": \`motivo\` só vale na linha de 0 PF — o que ficou de fora vai em \`nao_contados\`.`);
    for (const [lado, i] of [['alr', iA], ['der', iD]]) {
      const lista = b[lado];
      if (!Array.isArray(lista)) { erros.push(`"${pe}": \`${lado}\` tem de ser lista de nomes.`); continue; }
      const n = Number(c[i]);
      if (i >= 0 && lista.length !== n) erros.push(`"${pe}": a tabela diz ${lado.toUpperCase()} ${c[i]}, a lista tem ${lista.length}.`);
      const vistos = new Set();
      for (const item of lista) {
        const p = problemaDoItem(item);
        if (p) { erros.push(`"${pe}": ${lado.toUpperCase()} "${String(item).slice(0, 70)}" — ${p}.`); continue; }
        if (vistos.has(norm(item))) erros.push(`"${pe}": ${lado.toUpperCase()} "${item}" repetido — conta uma vez.`);
        vistos.add(norm(item));
      }
    }
  }
  for (const b of blocos.values()) erros.push(`bloco de "${b.pe}" sem linha com esse nome na tabela de \`## Métricas de tamanho\`.`);
  return erros;
}

const args = process.argv.slice(2);
const arquivos = n3s(args.length ? args : [join(ROOT, 'modules')]);
let total = 0, comErro = 0;
for (const a of arquivos) {
  const erros = confere(a);
  if (!erros.length) continue;
  comErro++; total += erros.length;
  console.log(`✗ ${rel(a)}`);
  for (const e of erros) console.log(`    ${e}`);
}
if (total) {
  console.log(`\n${total} problema(s) em ${comErro} N3. A enumeração de ALR e DER é um bloco \`\`\`json por processo elementar na \`### Memória de cálculo\` — o item é o nome do campo ou do arquivo lógico, sem comentário; o porquê fica em prosa. Migrar a memória antiga: python3 scripts/migra-enumeracao.py`);
  process.exit(1);
}
console.log(`✓ ${arquivos.length} N3 conferido(s): a enumeração de ALR e DER de cada processo elementar medido é um bloco válido, do tamanho da tabela.`);
