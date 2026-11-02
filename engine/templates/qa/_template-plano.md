<!-- docqui: [versão] | prompt: PROMPT_QA | atualizado: [YYYY-MM-DD] -->
# Plano de testes — [SIGLA]-[SAF]-NN — [Nome da funcionalidade]

> **N3**: [[SIGLA]-[SAF]-NN — [Nome da funcionalidade]](../../../modules/[dominio]/[agrupamento-funcional]/[funcionalidade].md) · **Framework**: [Playwright / Cypress / Cucumber / roteiro manual] · **Script**: `[repositório]/[pasta de E2E do MASTER]/[dominio]/[funcionalidade].spec.ts`

<!--
Molde do PROMPT_QA. O plano testa o comportamento do N3 — regras, cenários negociais e técnicos, estados da tela — e não a implementação. Não repita a regra aqui: cite-a pelo ID (`[ID]/RN-NN`) e o leitor a lê no N3. O que a documentação não responde vai para "Pontos a resolver" com ❓, nunca inventado no script.
-->

## Escopo e premissas

[O que o plano cobre e o que fica de fora (ex.: o "Então" que acontece em outra funcionalidade). Ambiente: endereço do front e da API, de onde vêm.]

## Massa de teste

[Como cada teste obtém os dados: pela API de quais funcionalidades (`ID — Nome` e endpoint), o que cada teste cria para si e o que é compartilhado e congelado, os usuários por perfil (matriz do N2) e as dependências externas com a variável de ambiente que as configura. Teste sem massa falha ou pula com o motivo — nunca passa.]

| Dado | Como é criado | Variável de ambiente |
|---|---|---|
| [ex.: usuário Administrador] | [ex.: cadastro de conta — ADM-CTA-01 — Cadastrar conta, `POST /api/contas`] | — |

## Cobertura das regras

Toda regra do N3 tem ao menos um teste com `[ID]/RN-NN` no nome — é o texto que o `valida-artefatos-previstos` procura no repositório de código.

| Regra | Cenário do N3 | Teste | Observação |
|---|---|---|---|
| [ID]/RN-01 | [título do cenário `@RN-01`] | `[ID]/RN-01 — [o que verifica]` | [ex.: só cenário derivado ⚠️ — `@derivado`; cobertura parcial — `@parcial`] |

## 🟢 Smoke — `@smoke`

- [Cenários do grupo "Caminho feliz" do N3.]

## 🔴 Negativos — `@negative`

- [Obrigatórios ausentes, formatos inválidos, limites, conflitos com dados existentes.]

## 🔒 Permissões — `@permissions`

- [Por perfil, pela matriz de permissões do N2; perfil sem vínculo, outra conta, sem sessão.]

## ⚙️ Técnicos

- [Cenários técnicos adicionais do N3: status HTTP e código do ERROR-DICTIONARY, concorrência, jobs.]

## 📐 NFR aplicáveis

- [Só os IDs que existem no `global/NFR.md` da instância e que a funcionalidade exercita.]

## Script base

```ts
// [ID] — [Nome da funcionalidade]
```

## Pontos a resolver (❓)

| # | Ponto | Onde falta | Efeito no teste |
|---|---|---|---|
| ❓1 | [o que a documentação não responde] | [arquivo / seção] | [teste pulado, `fixme`, seletor provisório] |
