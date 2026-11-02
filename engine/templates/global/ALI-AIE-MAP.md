<!-- docqui: {{VERSION}} | prompt: {{PROMPT_ID}} | atualizado: {{YYYY-MM-DD}} -->
# ALI-AIE-MAP.md
> **Registro canônico** dos Arquivos Lógicos Internos (ALI) e Arquivos de Interface
> Externa (AIE) do sistema e das **entidades** que os constituem.
> Fonte de verdade para a **validade** de um ALI/AIE na contagem APF.
>
> O **dimensionamento** (RLR/DER/complexidade/PF) vive em
> `global/DATA-MODEL.md → ## Arquivos Lógicos (APF)`. Aqui fica o mapeamento
> ALI/AIE ↔ entidade e o status de cada um.

---

## Como usar

- Todo **ALR** (Arquivo Lógico Referenciado = IFPUG FTR) contado numa função de transação deve corresponder a um ALI ou AIE listado aqui.
- **Ao contar um ALR ainda não mapeado**, registre-o nesta tabela com as **entidades em branco** e status `pendente`. Isso marca que é um ALI/AIE **válido**; o detalhamento (entidades, domínio, sizing) é preenchido conforme o projeto evolui.
- **Arquivos de importação/transmissão** (XML, CSV, etc.) **não** são classificados como AIE por padrão — são dados processados por uma EE. Contá-los como AIE fica a **critério do Analista de Métricas**; se decidir contar, registre aqui.

---

## ALIs / AIEs registrados

| Nome | Tipo | Domínio | Entidades constituintes | Status |
|---|---|---|---|---|
| [Nome do ALI/AIE] | ALI \| AIE | [Domínio] | [Entidade(s) que o constituem] | mapeado \| pendente |

<!-- Exemplo (remova ao registrar os reais):
| Cliente        | ALI | Cadastro | Cliente, Endereço do Cliente | mapeado  |
| Tabela de CEP  | AIE | —        | (em branco)                  | pendente |
Ao contar um ALR novo ainda não modelado, registre-o com entidades "(em branco)" e
status `pendente`; complete o detalhamento quando o domínio for especificado. -->

---

## Links
[DATA-MODEL.md](./DATA-MODEL.md) · [SIZING.md](./SIZING.md) · [INDEX geral](../modules/INDEX.md)
