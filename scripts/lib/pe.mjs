// lib/pe.mjs — leitor único dos processos elementares (PE) da `## Métricas de tamanho`
// de um N3. Serve ao valida-acessorio-tela (onde o PE mora, e cada PE uma vez na
// aplicação) e ao generate-impact-draft (a alteração vai para onde o PE é contado; quem o
// reutiliza entra como regressão). Um leitor só, para os dois não divergirem sobre o que
// é uma referência ou sobre quando dois nomes são o mesmo PE.
//
// PE reutilizado (SIZING.md → *PE reutilizado*): um PE conta UMA vez na aplicação. A
// funcionalidade que usa um PE já contado noutra grava a linha com o nome do PE contado e, na
// coluna Tipo, `↪` + o ID da funcionalidade onde ele conta, com link para o N3 dela; ALR, DER,
// Complexidade e PF ficam `—`. O componente entre parênteses — combo, autocomplete… — é
// marcação de conferência, não identidade: a mesma lista em combo numa tela e em
// autocomplete noutra é o mesmo PE. Mesmo rótulo com filtro diferente é outro PE, e o
// segundo declara na memória: `> Distinto de <ID> · <PE>: <o que difere>`.

const ID = '[A-Z]{3}-[A-Z]{3}-\\d{2}';
// `↪ [CRM-CTT-01](../contatos/f-pesquisar-contato.md)` é a forma que o SIZING manda gravar.
// `↪ CRM-CTT-01` e `↪ \`CRM-CTT-01\`` também são lidas como referência — a linha não conta —,
// mas saem com `reusoLink` nulo, e o valida-acessorio-tela as acusa (decisão do PO,
// 2026-09-27): sem o link, quem lê a funcionalidade não chega ao PE contado.
const REUSO_RE = new RegExp(`^↪\\s*(?:\\[\`?(${ID})\`?\\]\\(\\s*(?:<([^>]+)>|([^)\\s]+))\\s*\\)|\\[?\`?(${ID})\`?\\]?)`);
// Só o componente que a *Regra da lista consultada* manda pôr no nome sai da chave —
// `(implícita)`, `(excel)` e cia. são outro PE, e continuam no nome.
const COMPONENTE_RE = /\s*\((combo|autocomplete|carrossel|bot[õo]es|chips|lookup|dropdown|lista)\)\s*$/i;
const DISTINTO_RE = new RegExp(`^>\\s*Distinto de\\s+\\[?\`?(${ID})\`?\\]?(?:\\([^)]*\\))?\\s*·\\s*(.+?)\\s*:\\s`, 'i');

const celulas = (l) => l.trim().replace(/^\||\|$/g, '').split('|').map((x) => x.trim());
const ehSeparador = (l) => /^\|[\s\-:|]+\|$/.test(l.trim());

// Nome do PE sem marcação de markdown — o que se mostra nas mensagens.
export const nomePE = (s) => String(s || '').replace(/[`*]/g, '').trim();

// Chave de comparação: sem o componente, sem acento, sem caixa, espaços únicos.
export function chavePE(nome) {
  return nomePE(nome).replace(COMPONENTE_RE, '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

// Linhas da seção `## Métricas de tamanho` (até o próximo `## `), ou null.
function secaoMetricas(ls) {
  const i = ls.findIndex((l) => /^##\s+Métricas de tamanho\s*$/.test(l));
  if (i < 0) return null;
  const out = [];
  for (let k = i + 1; k < ls.length && !/^##\s/.test(ls[k]); k++) out.push(ls[k]);
  return out;
}

// PE da PRIMEIRA tabela da seção, guiada pelo cabeçalho:
// [{ nome, tipo, papel|null, pf: número|null, reuso: ID|null, reusoLink: caminho|null }].
// `pf` só é número quando a célula é número; `—`, vazio ou texto viram null.
export function pesDoN3(raw) {
  const sec = secaoMetricas(String(raw).split(/\r?\n/));
  if (!sec) return [];
  let cab = null, iPE = 0, iTipo = -1, iPF = -1, iPapel = -1;
  const out = [];
  for (const bruta of sec) {
    const l = bruta.trim();
    if (/^###\s/.test(l)) break;
    if (!l.startsWith('|')) { if (cab && out.length) break; continue; }
    if (ehSeparador(l)) continue;
    const c = celulas(l);
    if (!cab) {
      cab = c;
      const col = (re) => cab.findIndex((x) => re.test(x));
      iPE = Math.max(col(/fun[çc][ãa]o de transa[çc][ãa]o|processo elementar/i), 0);
      iTipo = col(/^tipo$/i); iPF = col(/^pf$/i); iPapel = col(/^papel$/i);
      continue;
    }
    const tipo = iTipo >= 0 ? (c[iTipo] || '').trim() : '';
    const pfTxt = iPF >= 0 ? (c[iPF] || '').trim() : '';
    const m = tipo.match(REUSO_RE);
    out.push({
      nome: nomePE(c[iPE]),
      tipo,
      papel: iPapel >= 0 ? (c[iPapel] || '').trim() : null,
      pf: /^\d+$/.test(pfTxt) ? Number(pfTxt) : null,
      reuso: m ? (m[1] || m[4]) : null,
      reusoLink: m && m[1] ? (m[2] || m[3]) : null,
    });
  }
  return out;
}

// Declarações `> Distinto de <ID> · <PE>: …` da seção: [{ id, chave }].
export function distintosDoN3(raw) {
  const sec = secaoMetricas(String(raw).split(/\r?\n/)) || [];
  const out = [];
  for (const l of sec) {
    const m = l.trim().match(DISTINTO_RE);
    if (m) out.push({ id: m[1], chave: chavePE(m[2]) });
  }
  return out;
}

// PE contado aqui: tem PF maior que zero e não é referência.
export const contado = (pe) => !pe.reuso && pe.pf !== null && pe.pf > 0;
