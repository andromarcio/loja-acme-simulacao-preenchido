<!-- docqui: 7.0.0 | prompt: MIGRA_NIVEIS | atualizado: 2026-10-21 -->
# FIELD-DICTIONARY.md
> Dicionário de **campos canônicos** — campos que se repetem em várias funcionalidades
> com a mesma semântica de validação (CPF, e-mail, telefone…).
>
> Registrá-los **uma vez** evita reespecificar validações em cada N3 e garante
> mensagens e cenários idênticos em todo o sistema.
>
> **Como referenciar nos N3**:
> - Tabela de campos: `→ ver FIELD-DICTIONARY: [nome]`
> - Cenários Gherkin: `# ← FIELD-DICTIONARY: [nome] (importar cenários de validação)`
>
> **Regra de uso**:
> - Modo PO: aplicar a validação automaticamente; perguntar apenas o que o
>   dicionário deixa em aberto — **obrigatoriedade** e **unicidade**.
> - Modo DEV: usar o **Label Dev** abaixo; não reescrever cenários — importá-los com o marcador.
> - Mensagens específicas de campo canônico vivem aqui e **têm precedência** sobre o MESSAGE-DICTIONARY.

---

## Índice

| Campo (Label PO) | Label Dev | Tipo | Resumo da validação |
|---|---|---|---|
| CPF | cpf | texto (11 dígitos) | 11 dígitos numéricos; dígitos verificadores válidos |
| CNPJ | cnpj | texto (14 dígitos) | 14 dígitos numéricos; dígitos verificadores válidos |
| CEP | cep | texto (8 dígitos) | 8 dígitos numéricos |
| Telefone | telefone | texto | DDD + número no formato nacional |
| E-mail | email | texto | formato de e-mail válido |
| Senha | senha | texto | política mínima de segurança |
| Data de nascimento | dataNascimento | data | data no passado; idade derivável |
| Data futura | [contexto] | data | não anterior à data atual |
| Valor monetário | valor | decimal | ≥ 0; 2 casas decimais |
| Percentual | percentual | decimal | entre 0 e 100 |
| Nome de pessoa | nomeCompleto | texto | nome e sobrenome; comprimento mínimo |
| Razão social | razaoSocial | texto | texto livre; comprimento mínimo |
| URL | url | texto | formato de URL válido (http/https) |
| Quantidade | quantidade | número inteiro | inteiro maior ou igual a 1 |

> Parâmetros sempre deixados em aberto para a funcionalidade: **obrigatoriedade** e **unicidade**.

---

## Entradas

> Formato de cada entrada. Abaixo, exemplos trabalhados dos campos mais comuns;
> replique o mesmo formato ao detalhar os demais do índice.

### CPF
<!-- usado-em:gerado -->
> **Usado em:** `ADM-USR-02` · `ADM-USR-03`
<!-- /usado-em -->

- **Label Dev**: `cpf`
- **Tipo**: texto (11 dígitos, sem máscara no armazenamento)
- **Validação**: exatamente 11 dígitos numéricos; dígitos verificadores válidos.
- **Em aberto (por funcionalidade)**: obrigatoriedade; unicidade (ex.: único por organização).
- **Mensagem**: "CPF inválido." (→ ver MESSAGE-DICTIONARY se houver variação)

```gherkin
# ── Validação de campo: CPF ──────────────────────────────────────
Scenario: CPF com dígitos verificadores inválidos
  Given que informo um CPF com dígito verificador incorreto
  When tento salvar
  Then o sistema rejeita e exibe "CPF inválido."

Scenario: CPF com quantidade de dígitos diferente de 11
  Given que informo um CPF com menos de 11 dígitos
  When tento salvar
  Then o sistema rejeita e exibe "CPF inválido."
```

### CEP
<!-- usado-em:gerado -->
> **Usado em:** `ADM-FRT-01` · `ADM-FRT-02` · `ADM-FRT-03` · `ADM-FRT-05` · `VND-CHK-01` · `VND-PED-02`
<!-- /usado-em -->

- **Label Dev**: `cep`
- **Tipo**: texto (8 dígitos, sem máscara no exemplo)
- **Validação**: exatamente oito dígitos numéricos.
- **Em aberto (por funcionalidade)**: obrigatoriedade.
- **Mensagem**: "CEP inválido."

```gherkin
Scenario: CEP com quantidade de dígitos inválida
  Given que informo um CEP com menos de oito dígitos
  When tento calcular o frete
  Then o sistema rejeita e exibe "CEP inválido."
```

### Telefone
<!-- usado-em:gerado -->
> **Usado em:** `ADM-USR-02` · `ADM-USR-03`
<!-- /usado-em -->

- **Label Dev**: `telefone`
- **Tipo**: texto (DDD + número, sem máscara no armazenamento)
- **Validação**: DDD de dois dígitos seguido do número, com 10 ou 11 dígitos no total.
- **Em aberto (por funcionalidade)**: obrigatoriedade.
- **Mensagem**: "Telefone inválido."

```gherkin
# ── Validação de campo: Telefone ─────────────────────────────────
Scenario: Telefone com quantidade de dígitos inválida
  Given que informo um telefone com menos de 10 dígitos
  When tento salvar
  Then o sistema rejeita e exibe "Telefone inválido."
```

### E-mail
<!-- usado-em:gerado -->
> **Usado em:** `ADM-USR-02` · `VND-PED-02`
<!-- /usado-em -->

- **Label Dev**: `email`
- **Tipo**: texto
- **Validação**: formato de e-mail válido (`local@dominio.tld`).
- **Em aberto (por funcionalidade)**: obrigatoriedade; unicidade.
- **Mensagem**: "E-mail inválido."

```gherkin
# ── Validação de campo: E-mail ───────────────────────────────────
Scenario: E-mail em formato inválido
  Given que informo um e-mail sem "@" ou sem domínio
  When tento salvar
  Then o sistema rejeita e exibe "E-mail inválido."
```

### Senha
<!-- usado-em:gerado -->
> **Usado em:** _(ainda não referenciado em N3)_
<!-- /usado-em -->

- **Label Dev**: `senha`
- **Tipo**: texto (armazenado com hash — nunca em texto puro)
- **Validação**: política mínima (ex.: 8+ caracteres, com letra e número). Defina os parâmetros no MASTER/NFR de segurança.
- **Em aberto (por funcionalidade)**: política exata; confirmação de senha.
- **Mensagem**: "A senha não atende aos requisitos de segurança."

```gherkin
# ── Validação de campo: Senha ────────────────────────────────────
Scenario: Senha abaixo da política mínima
  Given que informo uma senha que não atende à política
  When tento salvar
  Then o sistema rejeita e exibe "A senha não atende aos requisitos de segurança."
```

### Valor monetário
<!-- usado-em:gerado -->
> **Usado em:** `ADM-FRT-02` · `ADM-FRT-03` · `ADM-FRT-05` · `VIT-NAV-01` · `VIT-NAV-02` · `VIT-NAV-03` · `VND-CAR-02` · `VND-CAR-03` · `VND-CAR-04` · `VND-CHK-01` · `VND-PED-01` · `VND-PED-02`
<!-- /usado-em -->

- **Label Dev**: `valor`
- **Tipo**: decimal (2 casas)
- **Validação**: ≥ 0; no máximo 2 casas decimais.
- **Em aberto (por funcionalidade)**: limite máximo; se aceita zero.
- **Mensagem**: "Informe um valor válido."

```gherkin
# ── Validação de campo: Valor monetário ──────────────────────────
Scenario: Valor negativo
  Given que informo um valor menor que zero
  When tento salvar
  Then o sistema rejeita e exibe "Informe um valor válido."
```

### Nome de pessoa
<!-- usado-em:gerado -->
> **Usado em:** `ADM-USR-02` · `ADM-USR-03`
<!-- /usado-em -->

- **Label Dev**: `nomeCompleto`
- **Tipo**: texto
- **Validação**: nome e sobrenome separados por espaço; de 5 a 100 caracteres.
- **Em aberto (por funcionalidade)**: obrigatoriedade.
- **Mensagem**: "Informe nome e sobrenome."

```gherkin
# ── Validação de campo: Nome de pessoa ───────────────────────────
Scenario: Nome sem sobrenome
  Given que informo apenas o primeiro nome
  When tento salvar
  Then o sistema rejeita e exibe "Informe nome e sobrenome."
```

### Data futura
<!-- usado-em:gerado -->
> **Usado em:** `VIT-DST-02` · `VIT-DST-03`
<!-- /usado-em -->

- **Label Dev**: definido pelo contexto (ex.: `inicioVigencia`)
- **Tipo**: data
- **Validação**: igual ou posterior à data atual.
- **Em aberto (por funcionalidade)**: obrigatoriedade; se vale também na edição de um registro que já começou.
- **Mensagem**: "Informe uma data igual ou posterior a hoje."

```gherkin
# ── Validação de campo: Data futura ──────────────────────────────
Scenario: Data anterior a hoje
  Given que informo uma data anterior à data atual
  When tento salvar
  Then o sistema rejeita e exibe "Informe uma data igual ou posterior a hoje."
```

### Quantidade
<!-- usado-em:gerado -->
> **Usado em:** `VND-CAR-01` · `VND-CAR-02` · `VND-CAR-03` · `VND-PED-02`
<!-- /usado-em -->

- **Label Dev**: `quantidade`
- **Tipo**: número inteiro
- **Validação**: inteiro maior ou igual a 1.
- **Em aberto (por funcionalidade)**: limite máximo (ex.: a quantidade em estoque).
- **Mensagem**: "Informe uma quantidade válida."

```gherkin
# ── Validação de campo: Quantidade ───────────────────────────────
Scenario: Quantidade menor que 1
  Given que informo a quantidade 0
  When tento confirmar
  Then o sistema rejeita e exibe "Informe uma quantidade válida."
```

---

## Como adicionar um campo canônico

Um campo vira canônico quando aparece, com a **mesma semântica de validação**, em **2+ funcionalidades**. Para promovê-lo:

1. Adicione uma linha ao **Índice** (Label PO, Label Dev, Tipo, resumo).
2. Crie a **entrada** completa (validação, parâmetros em aberto, mensagem, cenários).
3. Nos N3 que já tratavam o campo inline, substitua a definição por `→ ver FIELD-DICTIONARY: [nome]` e importe os cenários com o marcador.

---

## Instrução para a LLM

Ao especificar campos em um N3 (PROMPT_3A/3B):
1. Verifique se o campo é canônico — se for, **não pergunte** sobre suas validações; aplique automaticamente e pergunte apenas obrigatoriedade/unicidade.
2. Na tabela de campos, referencie `→ ver FIELD-DICTIONARY: [nome]`.
3. Nos cenários, importe com `# ← FIELD-DICTIONARY: [nome]` — não reescreva os cenários daqui.
4. Campo recorrente ainda não dicionarizado: proponha com ⚠️ e aguarde aprovação antes de promovê-lo.

> **Usado em (não escreva à mão)**: abaixo de cada `### <entrada>` há um bloco
> `> **Usado em:** …` entre `<!-- usado-em:gerado -->` e `<!-- /usado-em -->`,
> **gerado** por `scripts/generate-usage-index.mjs` a partir das referências
> `→ ver`/`←` dos N3. Não edite esse bloco à mão — rode o gerador (o CI valida
> que está fresco).
