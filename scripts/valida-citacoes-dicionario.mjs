#!/usr/bin/env node
// valida-citacoes-dicionario.mjs — acusa citação de dicionário que aponta para nada.
//
// Uso:  node scripts/valida-citacoes-dicionario.mjs [arquivo.md | pasta] ...
//       (sem argumentos: varre global/ e modules/)
//
// A convenção do framework é citar o canônico em vez de reescrevê-lo:
//   → ver FIELD-DICTIONARY: CPF          ·  # ← FIELD-DICTIONARY: CPF
//   → ver RULES-DICTIONARY: [RC-NN] — [regra]      ·  → ver ERROR-DICTIONARY: `CODIGO`
// A citação só vale se do outro lado existir a entrada. Quando não existe, o leitor
// segue o "→ ver" e não encontra validação nenhuma — e nada acusava, porque o
// `generate-usage-index` indexa A PARTIR das entradas: sem entrada, ele conta zero
// uso e sai ✓. Zero ali tinha a mesma cara de "nenhuma citação" e de "102 citações
// órfãs", que era o estado real do portal-compras em 2026-09-17 (onde este validador
// nasceu, REP-042/REP-044 do ledger de replicação de lá).
//
// O que conta como entrada:
//   RULES            → o ID de um cabeçalho `### RC-NN — Nome`: a regra se cita e se
//                      confere SÓ pelo ID (o nome é para quem lê); citação sem ID é achado
//   FIELD            → um cabeçalho `### <nome>` no dicionário
//   ERROR, MESSAGE   → o código/chave numa linha de tabela do dicionário
//                      (MESSAGE aceita ainda a chave especial BASELINE)

import fs from 'node:fs';
import path from 'node:path';

const DICIONARIOS = {
  FIELD: { arq: 'global/FIELD-DICTIONARY.md', tipo: 'heading' },
  RULES: { arq: 'global/RULES-DICTIONARY.md', tipo: 'heading' },
  ERROR: { arq: 'global/ERROR-DICTIONARY.md', tipo: 'tabela' },
  MESSAGE: { arq: 'global/MESSAGE-DICTIONARY.md', tipo: 'tabela' },
};

// Raiz da instância: o dicionário é procurado a partir dela, não do diretório do
// arquivo citante (o hook passa caminho absoluto de qualquer lugar da árvore).
const RAIZ = (() => {
  let d = process.cwd();
  for (let i = 0; i < 8; i++) {
    if (fs.existsSync(path.join(d, 'global', 'FIELD-DICTIONARY.md'))) return d;
    const pai = path.dirname(d);
    if (pai === d) break;
    d = pai;
  }
  return process.cwd();
})();

const normaliza = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

function entradasDe(sigla) {
  const cfg = DICIONARIOS[sigla];
  const p = path.join(RAIZ, cfg.arq);
  if (!fs.existsSync(p)) return null;               // dicionário ausente: não invente achado
  const txt = fs.readFileSync(p, 'utf-8');
  const set = new Set();
  if (cfg.tipo === 'heading') {
    for (const m of txt.matchAll(/^###\s+(.+?)\s*$/gm)) {
      if (sigla !== 'RULES') { set.add(normaliza(m[1])); continue; }
      const id = (m[1].match(/^(RC-\d{2,})\b/) || [])[1];
      if (id) set.add(normaliza(id));
    }
  } else {
    for (const l of txt.split('\n')) {
      if (!/^\s*\|/.test(l)) continue;
      const celulas = l.split('|').slice(1, -1);
      for (const c of celulas) {
        const chave = c.trim().replace(/^`|`$/g, '').trim();
        if (/^[A-Z][A-Z0-9_]{2,}$/.test(chave)) set.add(normaliza(chave));
      }
    }
    if (sigla === 'MESSAGE') set.add('baseline');
  }
  return set;
}

// `→ ver FIELD-DICTIONARY: X` / `← FIELD-DICTIONARY: X`. O alvo termina no primeiro
// delimitador de prosa. Dentro do trecho, código entre crases é um alvo cada
// (`A` / `B`); sem crase, alternativas se separam por `,`, `/` ou `·` — a mesma leitura
// do `generate-usage-index` (keysFromTail), mais o `·`, que as instâncias usam
// (`RESOURCE_NOT_FOUND · AUTH_FORBIDDEN`). `AUTH_*` é curinga: vale se alguma entrada
// começar pelo prefixo.
const CITACAO = /(?:→\s*ver\s+|←\s*)(FIELD|RULES|ERROR|MESSAGE)-DICTIONARY\s*:\s*([^\n]*)/g;

function alvosDa(cauda) {
  const corte = cauda.split(/[;(|]|⚠|←|→|\.\s|\.$|\s+se\s+|\s+—\s+/)[0];
  const ticados = [...corte.matchAll(/`([^`]+)`/g)].map((m) => m[1]);
  return (ticados.length ? ticados : corte.split(/\s*[,/·]\s*/))
    .map((x) => x.trim().replace(/^["']|["'\]]+$/g, '').trim())
    .filter(Boolean)
    // Só o PLACEHOLDER do template sai — e placeholder aqui é o que está entre
    // colchetes (`[nome]`, `[CODIGO]`). Filtrar por palavra inicial engolia citação de
    // verdade: `Nome de pessoa` começa com "nome" e passava sem ser conferida.
    .filter((x) => !x.startsWith('['));
}

const temEntrada = (entradas, alvo) => {
  const n = normaliza(alvo);
  if (!n.endsWith('*')) return entradas.has(n);
  const prefixo = n.slice(0, -1);
  return [...entradas].some((e) => e.startsWith(prefixo));
};

const alvos = process.argv.slice(2).length ? process.argv.slice(2) : ['global', 'modules'];
const arquivos = [];
for (const alvo of alvos) {
  const st = fs.statSync(alvo);
  if (st.isFile()) { arquivos.push(alvo); continue; }
  (function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.name.startsWith('.') || e.name === 'node_modules') continue;
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.md')) arquivos.push(p);
    }
  })(alvo);
}

const cache = {};
let orfas = 0, total = 0, ignorados = 0;
for (const arq of arquivos) {
  // O template do framework cita `[nome]` de propósito — é modelo, não citação.
  if (arq.split(path.sep).some((p) => p.startsWith('_template'))) { ignorados++; continue; }
  const linhas = fs.readFileSync(arq, 'utf-8').split('\n');
  let noChangelog = false;
  linhas.forEach((linha, i) => {
    // A `## Changelog` é histórico: a entrada que CITA o marcador não é uso (mesma regra
    // do generate-usage-index), e a instância não a reescreve.
    if (/^## /.test(linha)) noChangelog = /^## Changelog\b/.test(linha);
    if (noChangelog) return;
    for (const m of linha.matchAll(CITACAO)) {
      // Marcador dentro de código em linha (`# ← MESSAGE-DICTIONARY: BASELINE`) é menção
      // à convenção, não citação: crases ímpares antes dele = dentro do trecho de código.
      if ((linha.slice(0, m.index).match(/`/g) || []).length % 2) continue;
      const sigla = m[1];
      if (!(sigla in cache)) cache[sigla] = entradasDe(sigla);
      const entradas = cache[sigla];
      if (entradas === null) continue;
      // O próprio dicionário explica como se cita — não se cita a si mesmo.
      if (path.resolve(arq) === path.resolve(RAIZ, DICIONARIOS[sigla].arq)) continue;
      if (sigla === 'RULES') {
        const corte = m[2].split(/[;(|]|⚠|←|→/)[0];
        const ids = [...corte.matchAll(/\bRC-\d{2,}\b/g)].map((x) => x[0]);
        if (!ids.length && !corte.trim().startsWith('[')) {
          total++; orfas++;
          console.log(`✗ ${arq}:${i + 1} — "RULES-DICTIONARY: ${corte.trim()}" cita a regra sem o ID — cite \`RC-NN — Nome\` (o nome sozinho não é conferido)`);
        }
        for (const id of ids) {
          total++;
          if (entradas.has(normaliza(id))) continue;
          orfas++;
          console.log(`✗ ${arq}:${i + 1} — "RULES-DICTIONARY: ${id}" não tem entrada (falta ### ${id} — … em ${DICIONARIOS.RULES.arq})`);
        }
        continue;
      }
      for (const alvo of alvosDa(m[2])) {
        total++;
        if (temEntrada(entradas, alvo)) continue;
        orfas++;
        const onde = DICIONARIOS[sigla].tipo === 'heading' ? `### ${alvo}` : `linha de tabela \`${alvo}\``;
        console.log(`✗ ${arq}:${i + 1} — "${sigla}-DICTIONARY: ${alvo}" não tem entrada (falta ${onde} em ${DICIONARIOS[sigla].arq})`);
      }
    }
  });
}

console.log(orfas
  ? `\n${orfas} citação(ões) órfã(s) de ${total} conferida(s). Crie a entrada no dicionário ou corrija a citação — "→ ver" que não leva a lugar nenhum é pior que validação escrita inline.`
  : `✓ ${total} citação(ões) de dicionário conferida(s) — todas têm entrada.`);
process.exit(orfas ? 1 : 0);
