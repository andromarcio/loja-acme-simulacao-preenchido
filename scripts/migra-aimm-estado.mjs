#!/usr/bin/env node
// Preenche `estado-por` e `estado-em` (9.1.0) nas AIMMs que ainda não os têm, pelo histórico do
// git: o commit que levou o `estado` ao valor atual dá o autor e a data, hora e fuso. Só lê o
// histórico da branch em que roda, por isso roda em cada branch. Não mexe em AIMM que já tem
// os campos nem em AIMM com o `estado` alterado e ainda não commitado.
// Uso: node scripts/migra-aimm-estado.mjs [--root <instância>] [--write]

import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ESTADO = /^estado:\s*(.*?)\s*(?:#.*)?$/m;
const limpa = (v) => String(v || '').trim().replace(/^(["'])(.*)\1$/, '$2');

// O front-matter é o bloco entre o primeiro par de `---`, depois do carimbo.
function frontMatter(text) {
  const m = text.match(/^(?:﻿)?(?:\s*<!--[\s\S]*?-->)*\s*---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/);
  return m ? { bloco: m[1] } : null;
}
const estadoDe = (text) => {
  const fm = text && frontMatter(text);
  const m = fm && fm.bloco.match(ESTADO);
  return m ? limpa(m[1]) : null;
};

// O commit que levou o `estado` ao valor atual: o mais antigo da sequência mais recente de
// commits em que ele já tem esse valor. `--follow` acompanha a troca de nome (AIM → AIMM).
export function quemEQuando(git, rel, atual) {
  const log = git('log', '--follow', '--format=%x00%H%x09%an%x09%ad', '--date=format:%Y-%m-%d %H:%M %z', '--name-only', '--', rel);
  let achado = null;
  for (const bloco of log.split('\0').filter((b) => b.trim())) {
    const [cabeca, ...nomes] = bloco.split('\n').filter(Boolean);
    const [sha, autor, quando] = cabeca.split('\t');
    let texto = null;
    try { texto = git('show', `${sha}:${nomes[0] || rel}`); } catch { /* arquivo removido nesse commit */ }
    if (estadoDe(texto) !== atual) break;
    achado = { autor, quando: quando.replace(/ ([+-]\d{2})(\d{2})$/, ' $1:$2') };
  }
  return achado;
}

// Os dois campos entram logo abaixo do `estado:`, com o mesmo fim de linha dele.
export function insereCampos(text, por, em) {
  const linhas = text.split('\n');
  const abre = linhas.findIndex((l) => l.trim() === '---');
  const fecha = linhas.findIndex((l, k) => k > abre && l.trim() === '---');
  const i = linhas.findIndex((l, k) => k > abre && k < fecha && /^estado:/.test(l));
  const cr = linhas[i].endsWith('\r') ? '\r' : '';
  linhas.splice(i + 1, 0, `estado-por: "${por}"${cr}`, `estado-em: ${em}${cr}`);
  return linhas.join('\n');
}

function main() {
  const args = process.argv.slice(2);
  const ri = args.indexOf('--root');
  for (const o of args.filter((a) => a.startsWith('--'))) if (!['--root', '--write'].includes(o)) throw new Error(`Opção desconhecida: ${o}.`);
  if (ri >= 0 && (!args[ri + 1] || args[ri + 1].startsWith('--'))) throw new Error('Falta o valor de --root.');
  const root = resolve(ri >= 0 ? args[ri + 1] : process.cwd());
  const write = args.includes('--write');
  const pasta = join(root, 'analise-impacto');
  if (!existsSync(pasta)) throw new Error('Informe uma instância com analise-impacto/.');
  const git = (...a) => execFileSync('git', ['-C', root, ...a], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).trimEnd();
  if (git('rev-parse', '--is-shallow-repository') === 'true')
    throw new Error('o clone tem histórico raso, e o commit que mudou o estado pode estar fora dele. Rode `git fetch --unshallow` e repita.');

  const mudancas = [], pulados = [];
  for (const nome of readdirSync(pasta).filter((n) => /^AIMM-.+\.md$/.test(n)).sort()) {
    const arq = join(pasta, nome), rel = relative(root, arq).replace(/\\/g, '/');
    const texto = readFileSync(arq, 'utf8');
    const fm = frontMatter(texto);
    if (!fm) { pulados.push(`${rel}: sem front-matter`); continue; }
    if (/^estado-(por|em):/m.test(fm.bloco)) continue;
    const atual = estadoDe(texto);
    if (!atual) { pulados.push(`${rel}: sem \`estado:\``); continue; }
    let commitado = null;
    try { commitado = estadoDe(git('show', `HEAD:${rel}`)); } catch { /* ainda não commitado */ }
    if (commitado !== atual) { pulados.push(`${rel}: o \`estado\` atual ainda não foi commitado — commite e repita`); continue; }
    const q = quemEQuando(git, rel, atual);
    if (!q) { pulados.push(`${rel}: sem commit com \`estado: ${atual}\``); continue; }
    mudancas.push({ arq, rel, antes: texto, depois: insereCampos(texto, q.autor, q.quando), ...q, atual });
  }

  console.log(`${write ? 'Migração' : 'Modo seco'}: ${mudancas.length} AIMM(s) ganham \`estado-por\` e \`estado-em\`.`);
  for (const m of mudancas) console.log(`  ${m.rel}: ${m.atual} — por ${m.autor}, em ${m.quando}`);
  for (const p of pulados) console.log(`  ⚠️  ${p}`);
  if (!write) { if (mudancas.length) console.log('\nNenhum arquivo alterado. Confira e aplique com --write.'); return; }
  for (const m of mudancas) writeFileSync(m.arq, m.depois);
  if (mudancas.length) console.log('✓ Aplicado. Regenere o site (atualiza-pages) e confira o validate-impact antes do commit.');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch (e) { console.error(`✗ migra-aimm-estado: ${e.message}`); process.exitCode = 1; }
}
