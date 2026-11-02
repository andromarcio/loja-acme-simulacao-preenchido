<!-- gerado por scripts/gera-diagrama-er.mjs a partir de global/data-models/*.md — não editar à mão -->
# Diagrama ER
> Um diagrama por domínio, derivado dos fragmentos de `global/data-models/`. A fonte é o fragmento: mude lá e rode `node scripts/gera-diagrama-er.mjs`. Os campos globais implícitos ficam de fora, como no fragmento; entidade de outro domínio aparece como caixa vazia.

## Administração

Fonte: [`data-models/administracao.md`](./data-models/administracao.md)

```mermaid
erDiagram
  Usuario {
    Nome_completo texto
    E-mail texto
    CPF texto
    Telefone texto
    Perfil lista
    Situação lista
    Data_de_cadastro data
    Data_da_inativação data
    Motivo_da_inativação texto
  }
```

## Catálogo

Fonte: [`data-models/catalogo.md`](./data-models/catalogo.md)

```mermaid
erDiagram
  Categoria {
    Nome_da_categoria texto
    Descrição texto
    Categoria_superior seleção FK
    Situação lista
    Data_de_cadastro data
  }
  Produto {
    Nome_do_produto texto
    Descrição texto
    Preço valor
    Quantidade_em_estoque número
    Categoria seleção FK
  }
  Categoria |o--o{ Categoria : "Categoria_superior"
  Categoria ||--o{ Produto : "Categoria"
```

## Vendas

Fonte: [`data-models/vendas.md`](./data-models/vendas.md)

```mermaid
erDiagram
  Pedido {
    Número_do_pedido número
    Cliente seleção FK
    CEP_de_entrega texto
    Valor_do_frete valor
    Faixa_de_frete seleção FK
    Situação lista
    Data_da_confirmação data
    Motivo_do_cancelamento texto
    Data_do_cancelamento data
    Cancelado_por seleção FK
  }
  ItemPedido {
    Pedido seleção FK
    Produto seleção FK
    Quantidade número
    Preço_unitário valor
  }
  TabelaFrete {
    Região texto
    CEP_inicial texto
    CEP_final texto
    Valor_do_frete valor
  }
  Usuario ||--o{ Pedido : "Cliente"
  TabelaFrete |o--o{ Pedido : "Faixa_de_frete"
  Usuario |o--o{ Pedido : "Cancelado_por"
  Pedido ||--o{ ItemPedido : "Pedido"
  Produto ||--o{ ItemPedido : "Produto"
```

## Vitrine

Fonte: [`data-models/vitrine.md`](./data-models/vitrine.md)

```mermaid
erDiagram
  Destaque {
    Produto seleção FK
    Chamada texto
    Ordem_de_exibição número
    Início_da_vigência data
    Fim_da_vigência data
    Data_de_cadastro data
  }
  Produto ||--o{ Destaque : "Produto"
```
