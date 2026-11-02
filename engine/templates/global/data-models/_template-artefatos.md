<!-- docqui: {{VERSION}} | prompt: {{PROMPT_ID}} | atualizado: {{YYYY-MM-DD}} -->
# Data Model: [Domínio] — Artefatos

> **Modelo de artefatos (dados persistidos)** — descreve os dados que este domínio
> **produz e consome fora de banco relacional**: datasets, caches, checkpoints,
> índices, relatórios. É o equivalente, para pipelines de dados/ML e ferramentas
> CLI, do fragmento de entidades: a fonte única de formato, estrutura, ciclo de
> vida e **invariantes de compatibilidade** de cada artefato. Vive em
> `global/data-models/[dominio]-artefatos.md` (ou `[dominio].md`, se o domínio só
> tiver artefatos) e é referenciado pelos N3 (`→ ver data-models/…: [Artefato]`) —
> nunca redefinido neles.
>
> Validação: `scripts/validate-doc.mjs` reconhece este fragmento pelo marcador
> acima e exige, por artefato: a anotação `> **Artefato**: …`, a tabela de
> estrutura, `### Ciclo de vida` e `### Invariantes de compatibilidade`.
> Um artefato que é tabela relacional NÃO entra aqui — use o fragmento padrão.

---

## [NomeDoArtefato]

> **Artefato**: [dataset | cache | checkpoint | índice | relatório] — formato: [JSONL | binário + manifest JSON | safetensors | Parquet | …] · produzido por: [funcionalidade/estágio `SIGLA-SAF-NN`] · consumido por: [funcionalidades/estágios]

[1–2 frases: o que este artefato representa para o negócio do pipeline — ex.: "Cache de ativações do modelo-alvo que alimenta o treino; evita reprocessar o corpus a cada experimento".]

### Estrutura

<!--
  Os campos do manifest/metadados e/ou o layout dos arquivos. O "schema" do artefato:
  o que um consumidor precisa saber para ler. Para artefatos compostos (diretório com
  vários arquivos), uma linha por componente + tabelas adicionais se necessário.
-->

| Campo/Atributo | Tipo | Obrigatório | Notas |
|---|---|---|---|
| [ex.: versão do formato] | [número] | sim | [participa da checagem de compatibilidade] |
| [ex.: modelo de origem] | [texto] | sim | [identifica o modelo-alvo que gerou o artefato] |
| [ex.: total de amostras] | [número] | sim | [conferido contra o índice na leitura] |

**Layout em disco** *(artefatos compostos — senão, remova)*:

```
[pasta-do-artefato]/
  manifest.json     ← metadados e invariantes (tabela acima)
  [dados.bin]       ← [conteúdo, formato, ordenação]
  [indice.idx]      ← [offsets/particionamento]
```

### Versionamento

[Como versões são identificadas e onde: campo de versão no manifest, sufixo no path, hash do config gerador. O que muda a versão (mudança de formato ≠ regeneração com outros dados).]

### Ciclo de vida

| Fase | O que acontece | Responsável |
|---|---|---|
| Produção | [quando/como é gerado ou regenerado] | [funcionalidade/estágio] |
| Validação | [checagem na produção e/ou na leitura — ex.: `validar` antes do consumo] | [funcionalidade/validador] |
| Consumo | [quem lê e para quê] | [funcionalidades/estágios] |
| Retenção/descarte | [por quanto tempo vive, quando pode ser apagado/recriado, tamanho esperado] | [operação] |

### Invariantes de compatibilidade

<!--
  As REGRAS que, violadas, quebram os consumidores — o análogo das regras de negócio
  para dados persistidos (ex.: "tokenizer do cache deve ser idêntico ao do modelo de
  treino", "amostras em ordem estável entre execuções", "versão do formato N só é
  lida por consumidores ≥ M"). Uma invariante por item, testável. Se não houver
  nenhuma além do formato, escreva "nenhuma além do formato".
-->

1. [Invariante que o produtor garante e o consumidor pressupõe]
2. [Condição de compatibilidade entre versões/execuções]

---

## Relacionamentos

<!-- Dependências entre artefatos e com entidades de banco, quando houver. -->

- [Artefato A] → é insumo de → [Artefato B]
- [Artefato] → referencia → [Entidade do fragmento relacional, se existir]

---

## Changelog

| Data | Autor | Tipo | Descrição |
|---|---|---|---|
| [AAAA-MM-DD] | [autor] | Criação | Modelo de artefatos do domínio |
