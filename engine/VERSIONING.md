# Versionamento e carimbo de artefatos

Este documento define **como o Docqui Caixa é versionado** e **como cada
artefato gerado pelos prompts registra, de forma invisível ao leitor, a versão do
framework que o produziu**.

> Esta é uma regra do **engine** (somente-leitura nas instâncias). Vale para todos
> os fluxos de geração — skill no Claude Code, copy-paste e CLI.

---

## 1. Versão do framework

- A versão vigente vive em [`../VERSION`](../VERSION) (uma linha, SemVer, ex.: `6.2.1`).
- Toda evolução do engine registra uma entrada em [`../CHANGELOG.md`](../CHANGELOG.md)
  e faz o *bump* de `VERSION` conforme o impacto (MAJOR/MINOR/PATCH — ver o changelog).
- **Renomear uma seção ou um nome do contrato mantendo a leitura do nome anterior é MINOR**, não PATCH: o artefato novo muda, e quem lê o antigo continua funcionando. PATCH é o que não muda o que se escreve no artefato. A 7.1.0 (seções da AIMM renomeadas, Contexto fora do ticket, nomes anteriores ainda lidos) quase saiu como 7.0.1.
- `VERSION` é a **fonte única da verdade**. Nenhum prompt ou template embute o número
  literal — todos leem `VERSION` no momento da geração.
- **O site mostra a versão** num selo no topo, em toda página. Ele é servido só
  de `docs/` e não alcança o `VERSION`, então `docs/config.js` → `version` a espelha. No
  bump, troque os dois no mesmo commit e acrescente a seção da versão em
  `docs/content/novidades.md` — o eval 40 reprova a versão divergente ou sem seção.
- **Na variante CAIXA**, atualize também a versão inicial do selo em `docs/index.html` e o `docs/engine-version.txt` local. O workflow Pages mantém esse arquivo sincronizado com `VERSION`; o eval específico da variante reprova um selo inicial em outra versão.

---

## 2. Carimbo no artefato (invisível ao leitor)

Todo artefato gerado **ou atualizado** por um prompt carrega, na **primeira linha**,
um comentário HTML:

```
<!-- docqui: 6.2.1 | prompt: PROMPT_3A | atualizado: 2026-06-23 -->
```

### Por que comentário HTML

- **Invisível no documento renderizado** — não aparece em export PDF/HTML nem no
  preview do GitHub/visualizadores de Markdown. O leitor de negócio (PO) nunca o vê.
- **Legível só no source** `.md`, pelo time técnico, para auditoria.
- Coerente com a "convenção de visibilidade" já usada nos templates (blocos
  `<!-- … -->` e `.dev-only`).

### Campos do carimbo

| Campo | Conteúdo | Exemplo |
|---|---|---|
| versão | conteúdo de `VERSION` no momento da geração | `6.2.1` |
| `prompt` | ID do prompt que gerou/atualizou o artefato | `PROMPT_3A` |
| `atualizado` | data da geração/atualização (`YYYY-MM-DD`) | `2026-06-23` |

---

## 3. Regra de geração (para o agente)

Ao chegar no estado terminal de geração de artefato (`[GERACAO_ARTEFATO]`,
`[ARQUIVO_FINAL]`, `[GERACAO_ARTEFATO_BASE]` etc.), **antes de escrever o conteúdo**:

1. Leia a versão vigente em `VERSION` (na raiz do engine).
2. Garanta que a **primeira linha** do artefato seja o carimbo, preenchido com a
   versão lida, o ID do prompt corrente e a data de hoje.
3. Em **atualização** de artefato existente (PROMPT_4A/4B e demais updates):
   **reescreva** o carimbo existente com a versão e a data correntes — nunca
   acumule carimbos nem mantenha um número antigo.

> Atalho determinístico (copy-paste/CLI): `scripts/stamp.sh <arquivo> <PROMPT_ID>`
> insere ou atualiza o carimbo lendo `VERSION` e a data atual.

O prefixo atual continua `docqui:`; o nome técnico `docqui-caixa-engine` não é um prefixo de carimbo. Desde a 6.2.2, o helper reconhece apenas `docqui:` e o legado `doc-template-engine:`. Comentários com outros prefixos são preservados abaixo do carimbo novo, sem migração automática.

---

## 4. Escopo

Recebem carimbo **todos** os artefatos produzidos por um `PROMPT_*`: specs N0/N1/N2/N3,
dicionários (FIELD/RULES/ERROR/MESSAGE), data-models, contagem de PF, NFR, SDD,
backlog e protótipos. Arquivos de configuração da instância (ex.: `MASTER.md`
preenchido) seguem a mesma regra quando gerados por prompt.

---

## 5. Governança multi-repositório (canônico × instâncias)

O **Docqui Caixa** (repositório `docqui-caixa-engine`) é a **fonte única da verdade** de prompts, templates, skills e
scripts. As instâncias (`simpf-doc`, `desenvolve-ai`, `sifof-doc`, …) **consomem** o
engine. Uma instância que precisa **só de requisitos** (negocial + data-model, sem as
passadas técnicas) declara `Perfil: requisitos` no próprio `MASTER.md` (ver 2.7.0): a
**redução de escopo é um flag no canônico**, não um fork.

> **Não forke o engine para reduzir escopo.** Uma variante negocial antiga, mantida em
> repositório à parte, foi a tentativa disso — e **apodreceu**: congelou em pré-2.0.0 e
> nunca recebeu as evoluções seguintes, porque um segundo engine só sobrevive se alguém o
> sincroniza a cada release, e ninguém sincroniza. Trate-a como legado congelado; para
> novas instâncias só-requisitos, use o perfil. (Desde a 3.1.0, o nome **Docqui Caixa**
> designa este engine canônico, e não aquela variante.)

- **Evolução nasce no canônico** e é replicada às demais, respeitando o escopo de cada
  uma (uma instância `Perfil: requisitos` simplesmente não exercita os prompts técnicos).
- **Autoridade do canônico:** havendo divergência (*drift*) de um arquivo do engine entre
  repositórios, o canônico prevalece.
- **Reconciliar ao tocar:** **não** faça *overwrite* em massa dos consumidores. Ao editar
  um arquivo do engine num consumidor, primeiro **sincronize-o do canônico** e só então
  aplique a mudança. Isso preserva conteúdo local intencional (ex.: prompts próprios da
  esteira SIESA no `desenvolve-ai`). **A recíproca vale e é a que costuma
  falhar:** conteúdo que nasce num consumidor sobe ao canônico **na mesma sessão**. Adiar
  não é neutro — o drift some de vista e reaparece meses depois como reconciliação manual,
  arquivo a arquivo (foi o que aconteceu com a skill `analise-impacto` e o
  `generate-impact-draft.mjs`, que evoluíram no `transparencia-web` e ficaram lá).
- **Nem todo conteúdo local é adaptação:** antes de preservar uma divergência por parecer
  específica da instância, verifique se o canônico **já a resolve de forma genérica**. O
  `PROMPT_MENU` do `portal-compras` estava reduzido à mão ao perfil `requisitos` e parecia
  conteúdo a proteger; o canônico já lia o `**Perfil**` do `MASTER.md` e filtrava sozinho —
  a redução era paliativo anterior ao recurso, ou seja, atraso disfarçado.
- **Direção do drift:** o relatório separa o que está **atrás** do canônico (atraso puro — sobrescrever é seguro) do que está **à frente** (a instância tem conteúdo que o engine não tem). O sinal é a forma do bloco de diferença: linha reescrita aparece como remoção e inserção coladas; conteúdo novo aparece como bloco só de inserção. O `--write` **pula** os arquivos à frente — promova-os ao canônico e rode de novo, ou use `--force` para descartá-los conscientemente.
- **Ferramenta:** `node scripts/sync-instance.mjs <instância>` detecta o drift
  (arquivo a arquivo, com exit code para CI) e, com `--write`, replica o canônico —
  o relatório sai **antes** do overwrite, e extras da instância fora de `engine/`
  são preservados. Rode em modo verificação após qualquer release do engine.
