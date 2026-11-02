<!-- docqui: 6.4.10 | prompt: PROMPT_DATA_MODEL_negocio | atualizado: 2026-10-18 -->
# Data Model: Vitrine
> **Modelo de entidades (negocial)** — entidades, atributos e relacionamentos de negócio, sem camada física.

## Destaque

> Produto que a equipe de vendas põe em evidência na página inicial da loja, por um período.

| Atributo (Label PO) | Tipo | Obrigatório | Notas |
|---|---|---|---|
| Produto | seleção → Produto | sim | Produto do Catálogo; não muda depois do cadastro |
| Chamada | texto | sim | Frase curta exibida com o produto; até 60 caracteres |
| Ordem de exibição | número | sim | Inteiro de 1 a 99; o menor aparece primeiro |
| Início da vigência | data | sim | Primeiro dia em que o destaque aparece |
| Fim da vigência | data | sim | Último dia em que o destaque aparece; não é anterior ao início |
| Data de cadastro | data | automático | Registrada ao cadastrar o destaque |

A situação do destaque — programado, vigente ou encerrado — é derivada das datas de vigência e da data de hoje; não é guardada.

## Relacionamentos

- **Produto** [1 — N] **Destaque** — um produto pode ter vários destaques ao longo do tempo, nunca dois com vigências sobrepostas; cada destaque é de um único produto. Produto é entidade do Catálogo.

### Dados da demonstração

Referência: 18/10/2026.

| Produto | Chamada | Ordem de exibição | Início da vigência | Fim da vigência | Situação |
|---|---|---|---|---|---|
| Garrafa térmica ACME 500 ml | Café quente o dia todo | 1 | 01/10/2026 | 31/10/2026 | Vigente |
| Camiseta ACME algodão — tamanho M | Nova coleção de algodão | 2 | 10/10/2026 | 10/11/2026 | Vigente |
| Boné ACME aba curva | Volta em breve | 3 | 15/10/2026 | 25/10/2026 | Vigente |
| Caneca de cerâmica ACME 300 ml | Presente para o Dia do Professor | 1 | 01/10/2026 | 15/10/2026 | Encerrado |
| Ecobag ACME de lona | Semana da sacola retornável | 1 | 20/11/2026 | 30/11/2026 | Programado |

O Boné está em destaque e esgotado: aparece na página inicial como esgotado.
