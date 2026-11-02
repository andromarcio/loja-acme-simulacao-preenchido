// Desde a 7.0.0, os níveis têm nome em português: Domínio (N1), Agrupamento Funcional (N2) e
// Funcionalidade (N3). Os artefatos que as instâncias já têm continuam com os nomes anteriores
// até rodar o migra-niveis (e, na AIMM, o migra-aimm-ticket-layout), e os leitores aceitam todos.
const LEGADO = {
  'Agrupamentos Funcionais': ['Feature Sets'],
  'Funcionalidades': ['Features'],
  // 6.4.26 e 7.0.0; o nome atual vem da 7.1.0.
  'Alterações em funcionalidades por Agrupamento Funcional': ['Alterações na spec, por Agrupamento Funcional', 'Alterações na spec, por Feature Set'],
  'Dependências entre funcionalidades': ['Dependências entre features'],
  'Decisões pendentes': ['Decisões de produto pendentes'],
  'Domínios previstos (N1)': ['Major Feature Sets previstos (N1)'],
};
const ATUAL = Object.fromEntries(Object.entries(LEGADO).flatMap(([atual, legados]) => legados.map((legado) => [legado, atual])));

// Nomes aceitos de uma seção `## …`: o atual primeiro, os legados depois.
export const nomesDaSecao = (nome) => [nome, ...(LEGADO[nome] || [])];
export const ehSecao = (linha, nome) => nomesDaSecao(nome).some((n) => linha.trim() === `## ${n}`);
// Nome atual de uma seção lida (o legado vira o atual; os demais ficam como estão).
export const secaoAtual = (nome) => ATUAL[nome] || nome;

export const TITULO_N1 = /^# (?:Domínio|Major Feature Set):\s*/;
export const TITULO_N2 = /^# (?:Agrupamento Funcional|Feature Set):\s*/;
