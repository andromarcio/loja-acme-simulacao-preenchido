// front-matter.mjs — leitura ÚNICA do front-matter YAML do topo de um artefato .md.
//
// O mesmo recorte do `parse_front_matter` do scripts/gates.py, que é a fonte do ciclo
// de vida (estado, gates):
//   • antes do `---` de abertura só podem vir linhas em branco e comentários HTML de
//     UMA linha (`<!-- … -->`) — é ali que mora o carimbo `<!-- docqui: … -->` que o
//     template, o stamp.sh e os prompts gravam na linha 1. Qualquer outra linha antes
//     do `---` (inclusive comentário de várias linhas) = não há front-matter;
//   • o bloco fecha no primeiro `---` seguinte; sem fechamento = não há front-matter;
//   • BOM (U+FEFF) e `\r` de fim de linha não atrapalham.
//
// Cada script tinha a sua cópia, e cada cópia tolerava uma coisa: o validate-doc exigia
// o `---` na linha 1 — e, com o carimbo antes, o gate de repositório de destino nunca
// rodou num N3 feito pelo template —; o trace-index aceitava um comentário, mas não uma
// linha em branco depois dele; ninguém tirava aspas do valor.
//
// Não é parser YAML: devolve as chaves de TOPO (coluna 0) com o valor escalar, sem aspas
// e sem comentário de fim de linha (`estado: "implementado"  # nota` → `implementado`).
// Chave indentada (`  requisitos: {…}`) fica de fora; chave com filhos (`origem:`) fica
// com '' — os filhos de um bloco saem de `frontMatterBloco` (ex.: `contagem.pendente`).

const linha = (l) => String(l).replace(/^﻿/, '').replace(/\r$/, '');
const prefixoTolerado = (t) => t === '' || (t.startsWith('<!--') && t.endsWith('-->'));

// Índices das linhas `---` de abertura e de fechamento, ou null.
export function frontMatterRange(lines) {
  let i = 0;
  while (i < lines.length && prefixoTolerado(linha(lines[i]).trim())) i++;
  if (i >= lines.length || linha(lines[i]).trim() !== '---') return null;
  for (let j = i + 1; j < lines.length; j++) {
    if (linha(lines[j]).trim() === '---') return { open: i, close: j };
  }
  return null;
}

// Valor escalar sem aspas e sem comentário de fim de linha.
const escalar = (v) => {
  const bruto = (v || '').trim();
  const aspas = bruto.match(/^(["'])(.*?)\1(?:\s+#.*)?$/);
  return aspas ? aspas[2] : bruto.replace(/(^|\s)#.*$/, '').trim();
};

// { chave: valor } das chaves de topo, ou null se não houver front-matter.
export function frontMatter(lines) {
  const r = frontMatterRange(lines);
  if (!r) return null;
  const fm = {};
  for (let k = r.open + 1; k < r.close; k++) {
    // só espaço depois dos dois-pontos: TAB ali o PyYAML rejeita, e o gates.py também
    const m = linha(lines[k]).match(/^([A-Za-z_][\w-]*):(?: +(.*))?$/);
    if (!m) continue;
    fm[m[1]] = escalar(m[2]);
  }
  return fm;
}

// { subchave: valor } de um bloco de topo — a chave em coluna 0 e as linhas indentadas
// abaixo dela, como `contagem:` / `  pendente: true` —, ou null se o front-matter não
// tem o bloco. Mesma limpeza de aspas e de comentário das chaves de topo. O estilo de
// fluxo (`contagem: { pendente: true }`) não é lido: devolve {} — nenhum template o usa.
export function frontMatterBloco(lines, chave) {
  const r = frontMatterRange(lines);
  if (!r) return null;
  let dentro = false, achou = false;
  const out = {};
  for (let k = r.open + 1; k < r.close; k++) {
    const l = linha(lines[k]);
    const topo = l.match(/^([A-Za-z_][\w-]*):/);
    if (topo) { dentro = topo[1] === chave; achou = achou || dentro; continue; }
    if (!dentro) continue;
    const m = l.match(/^\s+([A-Za-z_][\w-]*):(?: +(.*))?$/);
    if (m) out[m[1]] = escalar(m[2]);
  }
  return achou ? out : null;
}

// Lista de topo — `chave: [a, "b"]` ou `chave:` com `  - a` abaixo — como array de
// strings; null se o front-matter não tem a chave. (`endpoints`, `error_codes`, `depende_de`.)
export function frontMatterLista(lines, chave) {
  const r = frontMatterRange(lines);
  if (!r) return null;
  for (let k = r.open + 1; k < r.close; k++) {
    const m = linha(lines[k]).match(/^([A-Za-z_][\w-]*):(?: +(.*))?$/);
    if (!m || m[1] !== chave) continue;
    const v = escalar(m[2]);
    if (v.startsWith('[')) {
      return v.replace(/^\[|\]$/g, '').split(',').map((x) => escalar(x)).filter(Boolean);
    }
    const out = [];
    for (let j = k + 1; j < r.close; j++) {
      const item = linha(lines[j]).match(/^\s+-\s+(.*)$/);
      if (!item) break;
      out.push(escalar(item[1]));
    }
    return out;
  }
  return null;
}

export function frontMatterEstado(lines) {
  const fm = frontMatter(lines);
  return fm && fm.estado ? fm.estado : null;
}
