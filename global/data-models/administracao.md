<!-- docqui: 6.4.10 | prompt: PROMPT_DATA_MODEL_negocio | atualizado: 2026-10-18 -->
# Data Model: Administração
> **Modelo de entidades (negocial)** — entidades, atributos e relacionamentos de negócio, sem camada física.

## Usuario

> Pessoa com acesso identificado à loja: cliente, atendente, gestor de catálogo ou administrador.

| Atributo (Label PO) | Tipo | Obrigatório | Notas |
|---|---|---|---|
| Nome completo | texto | sim | → ver FIELD-DICTIONARY: Nome de pessoa |
| E-mail | texto | sim | Único; identifica o usuário e não muda depois do cadastro; → ver FIELD-DICTIONARY: E-mail |
| CPF | texto | não | Único quando informado; → ver FIELD-DICTIONARY: CPF |
| Telefone | texto | não | → ver FIELD-DICTIONARY: Telefone |
| Perfil | lista (Cliente, Atendente, Gestor de catálogo, Administrador) | sim | O que cada perfil pode fazer está nas matrizes de permissão dos N2 |
| Situação | lista (Ativo, Inativo) | automático | Nasce Ativo; passa a Inativo ao inativar o usuário |
| Data de cadastro | data | automático | Registrada ao cadastrar o usuário |
| Data da inativação | data | automático | Registrada ao inativar o usuário |
| Motivo da inativação | texto | não | Informado ao inativar; até 200 caracteres |

## Relacionamentos

- **Usuario** [1 — N] **Pedido** — um cliente pode ter vários pedidos; o pedido guarda quem é o cliente e, quando cancelado, quem cancelou. Pedido é entidade de Vendas.

### Dados da demonstração

| Nome completo | E-mail | Perfil | Situação |
|---|---|---|---|
| Ana Costa | ana.costa@cliente.example | Cliente | Ativo |
| Marcos Pereira | marcos.pereira@cliente.example | Cliente | Ativo |
| Juliana Alves | juliana.alves@cliente.example | Cliente | Ativo |
| Roberto Dias | roberto.dias@cliente.example | Cliente | Ativo |
| Carla Souza | carla.souza@acme.example | Atendente | Ativo |
| Diego Martins | diego.martins@acme.example | Gestor de catálogo | Ativo |
| Elisa Rocha | elisa.rocha@acme.example | Administrador | Ativo |
| Fábio Nunes | fabio.nunes@acme.example | Atendente | Inativo |

Pessoas e e-mails fictícios, nos domínios reservados `.example`; os CPFs dos cenários são números de teste conhecidos. Fábio Nunes foi inativado em 30/09/2026, com o motivo "Desligado da equipe de atendimento". Elisa Rocha é a única administradora ativa: tirar dela o perfil Administrador deixaria a loja sem administrador, e ela não pode inativar o próprio usuário.
