// ordem-n3.mjs — a ordem canônica das seções do N3 (decisão do PO, 2026-10-18).
//
// O conteúdo da funcionalidade vem primeiro; a `## Superfície` fica logo antes da seção de
// manifestação que ela decide (`## Comportamento de tela` ou `## Execução e operação`),
// fora do `dev-only`; a `## Origem` — rastreabilidade, como o Changelog — fica no fim,
// logo antes do `## Changelog`, depois das seções técnicas do perfil `completo`.
//
// Usado pelo validate-doc (a conferência) e pelo migra-ordem-n3 (a migração).

export const N3_SECOES = [
  'Descrição',
  'Regras de negócio',
  'Cenários',
  'Campos',
  'Derivações',
  'Colunas do resultado',
  'Campos automáticos',
  'Dados lidos e gravados',
  'Superfície',
  'Comportamento de tela',
  'Execução e operação',
  'Critérios de sucesso',
  'Métricas de tamanho',
  'Mapeamento de campos',
  'Cenários técnicos adicionais',
  'Mapeamento de erros',
  'API',
  'Eventos',
  'AuditLog',
  'Arquivos a criar ou alterar',
  'Dependências',
  'Implementação',
  'Origem',
  'Changelog',
];

// O nome canônico de um cabeçalho `## …`, ou null quando a seção não é do molde.
// `Mapeamento de erros (código interno → mensagem ao usuário)` conta como `Mapeamento de erros`.
export function secaoCanonica(titulo) {
  const t = titulo.trim();
  if (N3_SECOES.includes(t)) return t;
  if (/^Mapeamento de erros\b/.test(t)) return 'Mapeamento de erros';
  return null;
}

// Os cabeçalhos `## ` do N3 fora de cerca de código e de comentário HTML: [{ linha, titulo }].
export function cabecalhosN3(lines) {
  const out = [];
  let cerca = false;
  let comentario = false;
  lines.forEach((l, i) => {
    const s = l.trim();
    if (!comentario && /^(```|~~~)/.test(s)) { cerca = !cerca; return; }
    if (cerca) return;
    if (comentario) { if (s.includes('-->')) comentario = false; return; }
    if (s.startsWith('<!--') && !s.includes('-->')) { comentario = true; return; }
    if (/^## /.test(l)) out.push({ linha: i, titulo: l.replace(/^##\s+/, '').trim() });
  });
  return out;
}

// As seções do molde presentes no N3, na ordem do arquivo, e na ordem canônica.
export function ordemN3(lines) {
  const presentes = cabecalhosN3(lines).map((c) => secaoCanonica(c.titulo)).filter(Boolean);
  const esperada = N3_SECOES.filter((s) => presentes.includes(s));
  return { presentes, esperada, emOrdem: presentes.join('|') === esperada.join('|') };
}

// Linhas que só ligam uma seção à seguinte: branco, régua `---` e as tags do `dev-only`.
const COLA = (l) => /^\s*$/.test(l) || /^\s*---\s*$/.test(l) || /^\s*<div class="dev-only">\s*$/.test(l) || /^\s*<\/div>\s*$/.test(l);

// Reordena o N3 para a ordem canônica, movendo só a Superfície e a Origem — as duas
// seções que mudaram de lugar — e tirando a Superfície do seu próprio `dev-only`.
// Devolve { texto, mudou, motivos, destino } — destino: { Superfície?, Origem? }, a seção
// que cada uma passou a preceder (só a que de fato mudou de lugar). O conteúdo das seções não muda; os carimbos
// `trace-verified` da Origem vão junto com ela.
export function reordenaN3(texto) {
  let lines = texto.split('\n');
  const motivos = [];
  // Régua `---` entre as seções (como no template) ou só linha em branco (como na loja)?
  // Conta só depois do primeiro `## `: antes dele, o `---` é do front-matter.
  const primeiro = cabecalhosN3(lines)[0];
  const usaRegua = !!primeiro && lines.slice(primeiro.linha).some((l) => /^---\s*$/.test(l));

  // Fatia [ini, fim) de uma seção, sem a cola que a liga à seguinte.
  const fatia = (nome) => {
    const cabs = cabecalhosN3(lines);
    const k = cabs.findIndex((c) => secaoCanonica(c.titulo) === nome);
    if (k < 0) return null;
    const ini = cabs[k].linha;
    const prox = k + 1 < cabs.length ? cabs[k + 1].linha : lines.length;
    let fim = prox;
    while (fim > ini + 1 && COLA(lines[fim - 1])) fim--;
    return { ini, fim, prox };
  };

  // 1. A Superfície sai do `dev-only` próprio: o `<div>` logo antes dela e o `</div>` logo depois.
  const sup = fatia('Superfície');
  if (sup) {
    let a = sup.ini - 1;
    while (a >= 0 && COLA(lines[a]) && !/<div class="dev-only">/.test(lines[a])) a--;
    const abre = a >= 0 && /^\s*<div class="dev-only">\s*$/.test(lines[a]) ? a : -1;
    const fecha = lines.slice(sup.fim, sup.prox).findIndex((l) => /^\s*<\/div>\s*$/.test(l));
    if (abre >= 0 && fecha >= 0) {
      const iFecha = sup.fim + fecha;
      // apaga a tag e a linha em branco que a segue, para não sobrar buraco
      const corta = (i) => lines.splice(i, lines[i + 1] !== undefined && /^\s*$/.test(lines[i + 1]) ? 2 : 1);
      corta(iFecha);
      corta(abre);
      motivos.push('Superfície sai do dev-only');
    }
  }

  // 2. Tira uma seção do lugar (com a cola que a segue) e a põe antes do primeiro alvo presente.
  const move = (nome, alvos) => {
    const f = fatia(nome);
    if (!f) return;
    const bloco = lines.slice(f.ini, f.fim);
    // A cola que segue a seção sai com ela, menos as tags do dev-only: a que abre o bloco
    // técnico seguinte fica no lugar, para o bloco não perder a abertura.
    const tags = lines.slice(f.fim, f.prox).filter((l) => /^\s*<\/?div\b/.test(l)).flatMap((l) => [l, '']);
    const resto = [...lines.slice(0, f.ini), ...tags, ...lines.slice(f.prox)];
    const cabs = cabecalhosN3(resto);
    const alvo = alvos.map((a) => cabs.find((c) => secaoCanonica(c.titulo) === a)).find(Boolean);
    const em = alvo ? alvo.linha : resto.length;
    const cola = usaRegua ? ['', '---', ''] : [''];
    const antes = resto.slice(0, em);
    while (antes.length && /^\s*$/.test(antes[antes.length - 1]) && !alvo) antes.pop();
    const novo = alvo ? [...antes, ...bloco, ...cola, ...resto.slice(em)] : [...antes, '', ...bloco, ''];
    if (novo.join('\n') !== lines.join('\n')) { lines = novo; destino[nome] = alvo ? secaoCanonica(alvo.titulo) : 'o fim'; }
  };

  const destino = {};
  const depois = (nome) => N3_SECOES.slice(N3_SECOES.indexOf(nome) + 1);
  const ordemAntes = ordemN3(lines);
  if (!ordemAntes.emOrdem) {
    // A Origem primeiro: a Superfície procura o seu alvo entre as seções seguintes, e a
    // Origem ainda no lugar antigo, logo depois da Descrição, seria tomada por ele.
    move('Origem', depois('Origem'));
    move('Superfície', depois('Superfície'));
    if (ordemN3(lines).presentes.join('|') !== ordemAntes.presentes.join('|')) motivos.push('Superfície e Origem no lugar novo');
  }
  const novoTexto = lines.join('\n');
  return { texto: novoTexto, mudou: novoTexto !== texto, motivos, destino };
}
