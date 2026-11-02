// regras.mjs — as regras de negócio do N3 e os cenários que as cobrem.
//
// Por quê (pedido do PO, 2026-10-10): a regra específica da funcionalidade era numerada pela
// posição ("1.", "2."), e nada a ligava ao cenário que a verifica. Quem gera o teste —
// pessoa ou agente — deduzia qual cenário cobre qual regra, e a regra sem cenário passava
// sem ninguém notar. Agora cada regra tem um ID estável na funcionalidade, `RN-NN`, e o cenário
// declara as regras que verifica com a tag Gherkin `@RN-NN`:
//
//   ## Regras de negócio
//   - **RN-01** — A desativação revoga o acesso e preserva o histórico.
//   - **RN-02** — A organização mantém ao menos um Administrador ativo.
//
//   @RN-02
//   Scenario: Desativar o último Administrador
//
// O ID é da funcionalidade: fora do N3 ele se cita com o da funcionalidade — `ADM-USR-04/RN-02` — no
// SDD, no código e no nome ou na tag do teste. Como o `RC-NN` do RULES-DICTIONARY, nunca
// é reaproveitado: a regra removida leva o número com ela.

const ITEM_RE = /^(?:\d+\.|[-*])\s+(.*)$/;
const ID_RE = /^(?:\*\*)?(RN-\d{2,})(?:\*\*)?(?=\s|$|[—–:-])/;
const CENARIO_RE = /^\s*(?:Scenario Outline|Scenario|Example|Esquema do Cen[aá]rio|Cen[aá]rio|Exemplo)\s*:\s*(.*)$/;

// As linhas de uma seção `## <nome>` (até o próximo `## `), sem comentários HTML.
export function secao(lines, nome) {
  const ini = lines.findIndex((l) => l.trim() === `## ${nome}` || l.trim().startsWith(`## ${nome} `));
  if (ini < 0) return null;
  const out = [];
  let comentario = false;
  for (let i = ini + 1; i < lines.length && !/^##\s/.test(lines[i]); i++) {
    let l = lines[i];
    if (comentario) { if (l.includes('-->')) { comentario = false; l = l.slice(l.indexOf('-->') + 3); } else continue; }
    l = l.replace(/<!--.*?-->/g, '');
    if (l.includes('<!--')) { comentario = true; l = l.slice(0, l.indexOf('<!--')); }
    out.push({ texto: l, linha: i + 1 });
  }
  return out;
}

// Os itens de primeiro nível de `## Regras de negócio`: [{ id|null, texto, linha }].
// Placeholder do template (`[Regra …]`) não é regra.
export function regrasDoN3(lines) {
  const sec = secao(lines, 'Regras de negócio') || [];
  const out = [];
  for (const { texto, linha } of sec) {
    const m = texto.match(ITEM_RE);
    if (!m || /^\s/.test(texto)) continue;
    const corpo = m[1].trim();
    const id = (corpo.match(ID_RE) || [])[1] || null;
    const resto = corpo.replace(ID_RE, '').replace(/^\s*[—–:-]\s*/, '').trim();
    if (!id && /^\[[^\]]*\]/.test(resto)) continue;
    out.push({ id, texto: resto, linha });
  }
  return out;
}

// Os cenários Gherkin das seções `## Cenários…` (inclui `## Cenários técnicos
// adicionais`): [{ titulo, tags: ['RN-01', …], linha, secao }]. Valem as tags do próprio
// cenário — as linhas `@…` logo acima dele, com comentários `#` no meio —; a tag do
// `Feature:` não cobre regra nenhuma, senão uma linha cobriria todas.
export function cenariosDoN3(lines) {
  const out = [];
  let nomeSec = null, tags = [];
  lines.forEach((l, i) => {
    const h = l.match(/^##\s+(.*)$/);
    if (h) { nomeSec = /^Cen[aá]rios/.test(h[1].trim()) ? h[1].trim() : null; tags = []; return; }
    if (!nomeSec) return;
    const t = l.trim();
    if (t.startsWith('@')) { tags.push(...(t.match(/@RN-\d{2,}\b/g) || []).map((x) => x.slice(1))); return; }
    if (t.startsWith('#') || t === '') return;
    const c = t.match(CENARIO_RE);
    if (c) out.push({ titulo: c[1].trim(), tags: [...new Set(tags)], linha: i + 1, secao: nomeSec });
    tags = [];
  });
  return out;
}
