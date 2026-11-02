<!-- docqui: 7.0.0 | prompt: MIGRA_NIVEIS | atualizado: 2026-10-23 -->
# MESSAGE-DICTIONARY.md
> Dicionário de **mensagens de UI** que a pessoa usuária lê — e o **baseline** de
> validação (obrigatório, formato, sucesso, estados de tela).
>
> Garante texto **literal e consistente** em todo o sistema. Nos cenários, escreva
> sempre o texto final do catálogo — nunca "conforme o Design System" (isso é
> gatilho de busca, não texto entregável).
>
> **Como referenciar nos N3**:
> - Mensagens genéricas (obrigatório/formato/sucesso): `# ← MESSAGE-DICTIONARY: BASELINE`
> - Mensagem específica: cite a chave e escreva o texto literal.
>
> **Precedência**: mensagem de campo canônico vem do **FIELD-DICTIONARY** (tem
> precedência sobre o baseline daqui).

---

## Baseline de validação

> Mensagens genéricas reutilizadas por qualquer campo/funcionalidade. Ajuste o texto ao
> tom de voz definido no N0. Use o marcador `# ← MESSAGE-DICTIONARY: BASELINE`
> nos cenários em vez de reescrevê-las.

| Chave | Situação | Texto literal |
|---|---|---|
| `REQUIRED` | Campo obrigatório não preenchido | "Campo obrigatório." |
| `INVALID_FORMAT` | Formato inválido (genérico) | "Formato inválido." |
| `MAX_LENGTH` | Excedeu o comprimento máximo | "Máximo de [N] caracteres." |
| `MIN_LENGTH` | Abaixo do comprimento mínimo | "Mínimo de [N] caracteres." |
| `SAVE_SUCCESS` | Registro salvo | "Registro salvo com sucesso." |
| `DELETE_SUCCESS` | Registro excluído | "Registro excluído com sucesso." |
| `DELETE_CONFIRM` | Confirmação antes de excluir | "Deseja realmente excluir este registro?" |
| `GENERIC_ERROR` | Falha inesperada | "Ocorreu um erro. Tente novamente." |
| `NO_PERMISSION` | Ação sem permissão | "Você não tem permissão para esta ação." |
| `NOT_FOUND` | Registro inexistente ou excluído enquanto a pessoa navegava | "Registro não encontrado." |
| `INVALID_PERIOD` | Período com a data final antes da inicial (filtro ou formulário) | "A data final não pode ser anterior à data inicial." |

---

## Estados de tela

> Textos padrão para os estados que toda tela de listagem/formulário pode assumir.

| Chave | Estado | Texto literal |
|---|---|---|
| `LOADING` | Carregando | "Carregando…" |
| `EMPTY` | Sem dados | "Nenhum registro encontrado." |
| `EMPTY_SEARCH` | Busca sem resultados | "Nenhum resultado para a busca." |
| `ERROR_STATE` | Falha ao carregar | "Não foi possível carregar os dados." |

---

## Mensagens específicas por domínio

> Uma seção por domínio. Crie conforme os N3 forem especificados. Use chaves
> descritivas em SCREAMING_SNAKE_CASE prefixadas pelo domínio.

### Catálogo

| Chave | Situação | Texto literal |
|---|---|---|
| `CAT_CATEGORIA_DUPLICADA` | Nome já usado na mesma Categoria superior, inclusive sem superior; cadastro ou mudança de superior na edição (⚠️ proposta STRY0013205) | "Já existe uma categoria com este nome nesta categoria superior." |
| `CAT_CATEGORIA_COM_PRODUTOS` | Exclusão de uma categoria que tem produtos (RC-09 — Registro vinculado não pode ser excluído) | "Não é possível excluir: existem produtos vinculados a este registro." |
| `CAT_CATEGORIA_COM_SUBCATEGORIAS` | Exclusão de categoria com subcategorias, ativas ou inativas (RC-09; ⚠️ proposta STRY0013205) | "Não é possível excluir: existem subcategorias vinculadas a este registro." |
| `CAT_SUPERIOR_COM_SUBCATEGORIAS` | Atribuição de superior a categoria que tem subcategorias (⚠️ proposta STRY0013205) | "Uma categoria com subcategorias não pode ter categoria superior." |
| `CAT_SUPERIOR_INVALIDA` | Superior é a própria categoria, uma subcategoria ou não existe mais (⚠️ proposta STRY0013205) | "Selecione uma categoria superior de primeiro nível, diferente da própria categoria." |
| `CAT_SEM_SUBCATEGORIAS` | Lista de subcategorias vazia na ficha (⚠️ proposta STRY0013205) | "Nenhuma subcategoria cadastrada." |
| `CAT_INATIVAR_COM_PRODUTOS` | Confirmação ao inativar uma categoria que tem produtos | "Os produtos desta categoria deixarão de aparecer na vitrine. Deseja continuar?" |

### Vitrine

| Chave | Situação | Texto literal |
|---|---|---|
| `VIT_SELO_ESGOTADO` | Selo do produto com estoque zero, nos destaques, na busca e na página do produto | "Esgotado" |
| `VIT_SEM_DESTAQUES` | Página inicial sem destaque vigente | "Nenhum destaque no momento. Use a busca para encontrar produtos." |
| `VIT_PRODUTO_INDISPONIVEL` | Página de um produto inexistente ou de categoria inativa | "Este produto não está disponível na loja." |
| `VIT_ORDEM_INVALIDA` | Ordem de exibição fora de 1 a 99 | "Informe uma ordem de 1 a 99." |
| `VIT_DESTAQUE_SOBREPOSTO` | Produto que já tem destaque com vigência sobreposta | "Este produto já tem um destaque nesse período." |
| `VIT_DESTAQUE_ENCERRADO` | Tentativa de alterar um destaque encerrado | "Destaque encerrado não pode ser alterado." |

### Vendas

| Chave | Situação | Texto literal |
|---|---|---|
| `VND_CEP_NAO_ATENDIDO` | CEP fora das faixas da Tabela de Frete | "Ainda não entregamos neste CEP." |
| `VND_CARRINHO_VAZIO` | Tentativa de cálculo sem itens | "Adicione itens ao carrinho para calcular o frete." |
| `VND_PRODUTO_ESGOTADO` | Tentativa de adicionar ao carrinho um produto sem estoque | "Este produto está esgotado." |
| `VND_ESTOQUE_INSUFICIENTE` | Quantidade maior que a quantidade em estoque | "Quantidade indisponível em estoque." |
| `VND_ITEM_ADICIONADO` | Produto adicionado ao carrinho | "Produto adicionado ao carrinho." |
| `VND_QUANTIDADE_ATUALIZADA` | Quantidade de um item do carrinho alterada | "Quantidade atualizada." |
| `VND_ITEM_REMOVIDO` | Item removido do carrinho | "Item removido do carrinho." |
| `VND_CARRINHO_SEM_ITENS` | Carrinho aberto sem itens | "Seu carrinho está vazio." |
| `VND_ESTOQUE_REDUZIDO` | Estoque do produto ficou abaixo da quantidade que está no carrinho | "O estoque deste produto é menor que a quantidade no carrinho." |
| `VND_CANCELAR_CONFIRMACAO` | Confirmação antes de cancelar um pedido | "Deseja realmente cancelar o pedido [número]?" |
| `VND_PEDIDO_CANCELADO` | Pedido cancelado | "Pedido cancelado." |
| `VND_PEDIDO_NAO_CANCELAVEL` | Cancelamento de pedido que não está confirmado | "Somente pedidos confirmados podem ser cancelados." |

### Administração

| Chave | Situação | Texto literal |
|---|---|---|
| `ADM_EMAIL_DUPLICADO` | E-mail já usado por outro usuário | "Já existe um usuário com este e-mail." |
| `ADM_CPF_DUPLICADO` | CPF já usado por outro usuário | "Já existe um usuário com este CPF." |
| `ADM_USUARIO_INATIVO` | Tentativa de alterar um usuário inativo | "Usuário inativo não pode ser alterado." |
| `ADM_ULTIMO_ADMINISTRADOR` | Tirar o perfil Administrador do único administrador ativo | "A loja precisa de ao menos um administrador ativo." |
| `ADM_AUTOINATIVACAO` | Administrador tenta inativar o próprio usuário | "Você não pode inativar o próprio usuário." |
| `ADM_INATIVAR_CONFIRMACAO` | Confirmação antes de inativar um usuário | "Deseja realmente inativar [nome]? O usuário perderá o acesso à loja." |
| `ADM_USUARIO_INATIVADO` | Usuário inativado | "Usuário inativado." |
| `ADM_USUARIO_JA_INATIVO` | Tentativa de inativar um usuário que já está inativo | "Este usuário já está inativo." |
| `ADM_REGIAO_DUPLICADA` | Região já usada por outra faixa de frete | "Já existe uma faixa com esta região." |
| `ADM_FAIXA_INTERVALO_INVALIDO` | CEP final menor que o CEP inicial | "O CEP final deve ser igual ou maior que o CEP inicial." |
| `ADM_FAIXA_SOBREPOSTA` | Faixa com CEPs em comum com outra | "Esta faixa tem CEPs em comum com a faixa [região]." |
| `ADM_FAIXA_COM_PEDIDOS` | Exclusão de uma faixa de frete que atende pedidos (RC-09 — Registro vinculado não pode ser excluído) | "Não é possível excluir: existem pedidos vinculados a este registro." |
| `ADM_FAIXA_VALE_PROXIMOS` | Aviso no formulário de edição da faixa de frete | "A alteração vale para os próximos cálculos de frete; os pedidos já feitos mantêm o valor cobrado." |

---

## Como adicionar uma mensagem

1. Use o **baseline** sempre que a mensagem for genérica — não crie variações desnecessárias.
2. Mensagem nova e específica: adicione à seção do domínio com chave e texto literal.
3. Mensagem de **campo canônico**: defina no FIELD-DICTIONARY, não aqui.

---

## Instrução para a LLM

Ao escrever cenários/telas em um N3:
1. Use o **texto literal** do catálogo — nunca "conforme o Design System".
2. Para obrigatório/formato/sucesso genéricos, use `# ← MESSAGE-DICTIONARY: BASELINE`.
3. Mensagem de campo canônico vem do FIELD-DICTIONARY (precedência).
4. Mensagem inexistente no catálogo: proponha com ⚠️, aguarde aprovação e instrua a adição aqui.

> **Usado em (não escreva à mão)**: a seção `## Usado em (índice reverso)` ao final
> é **gerada** por `scripts/generate-usage-index.mjs` a partir das referências
> `→ ver`/`←` dos N3. Não edite à mão — rode o gerador (o CI valida que está fresco).

<!-- usado-em:gerado -->
## Usado em (índice reverso)

> Gerado por `scripts/generate-usage-index.mjs` a partir das referências `→ ver`/`←` nos N3. **Não editar à mão.**

| Entrada | Usado em |
|---|---|
| `ADM_AUTOINATIVACAO` | `ADM-USR-04` |
| `ADM_CPF_DUPLICADO` | `ADM-USR-02` · `ADM-USR-03` |
| `ADM_EMAIL_DUPLICADO` | `ADM-USR-02` |
| `ADM_FAIXA_COM_PEDIDOS` | `ADM-FRT-04` |
| `ADM_FAIXA_INTERVALO_INVALIDO` | `ADM-FRT-02` · `ADM-FRT-03` |
| `ADM_FAIXA_SOBREPOSTA` | `ADM-FRT-02` · `ADM-FRT-03` |
| `ADM_FAIXA_VALE_PROXIMOS` | `ADM-FRT-03` |
| `ADM_INATIVAR_CONFIRMACAO` | `ADM-USR-04` |
| `ADM_REGIAO_DUPLICADA` | `ADM-FRT-02` |
| `ADM_ULTIMO_ADMINISTRADOR` | `ADM-USR-03` |
| `ADM_USUARIO_INATIVADO` | `ADM-USR-04` |
| `ADM_USUARIO_INATIVO` | `ADM-USR-03` |
| `ADM_USUARIO_JA_INATIVO` | `ADM-USR-04` |
| `BASELINE` | `ADM-FRT-01` · `ADM-FRT-02` · `ADM-FRT-03` · `ADM-FRT-04` · `ADM-FRT-05` · `ADM-USR-01` · `ADM-USR-02` · `ADM-USR-03` · `ADM-USR-04` · `ADM-USR-05` · `CAT-CTG-01` · `CAT-CTG-02` · `CAT-CTG-03` · `CAT-CTG-04` · `CAT-CTG-05` · `VIT-DST-01` · `VIT-DST-02` · `VIT-DST-03` · `VIT-DST-04` · `VIT-DST-05` · `VND-CAR-01` · `VND-CAR-02` · `VND-CAR-03` · `VND-CAR-04` · `VND-CHK-01` · `VND-PED-01` · `VND-PED-02` · `VND-PED-03` |
| `CAT_CATEGORIA_COM_PRODUTOS` | `CAT-CTG-04` |
| `CAT_CATEGORIA_COM_SUBCATEGORIAS` | `CAT-CTG-04` |
| `CAT_CATEGORIA_DUPLICADA` | `CAT-CTG-02` · `CAT-CTG-03` |
| `CAT_INATIVAR_COM_PRODUTOS` | `CAT-CTG-03` |
| `CAT_SEM_SUBCATEGORIAS` | `CAT-CTG-05` |
| `CAT_SUPERIOR_COM_SUBCATEGORIAS` | `CAT-CTG-03` |
| `CAT_SUPERIOR_INVALIDA` | `CAT-CTG-02` · `CAT-CTG-03` |
| `EMPTY_SEARCH` | `VIT-NAV-02` |
| `ERROR_STATE` | `VIT-NAV-01` · `VIT-NAV-02` · `VIT-NAV-03` |
| `MIN_LENGTH` | `VIT-NAV-02` |
| `VIT_DESTAQUE_ENCERRADO` | `VIT-DST-03` |
| `VIT_DESTAQUE_SOBREPOSTO` | `VIT-DST-02` · `VIT-DST-03` |
| `VIT_ORDEM_INVALIDA` | `VIT-DST-02` · `VIT-DST-03` |
| `VIT_PRODUTO_INDISPONIVEL` | `VIT-NAV-03` |
| `VIT_SELO_ESGOTADO` | `VIT-NAV-01` · `VIT-NAV-02` · `VIT-NAV-03` |
| `VIT_SEM_DESTAQUES` | `VIT-NAV-01` |
| `VND_CANCELAR_CONFIRMACAO` | `VND-PED-03` |
| `VND_CARRINHO_SEM_ITENS` | `VND-CAR-02` · `VND-CAR-04` |
| `VND_CARRINHO_VAZIO` | `VND-CHK-01` |
| `VND_CEP_NAO_ATENDIDO` | `ADM-FRT-04` · `VND-CHK-01` |
| `VND_ESTOQUE_INSUFICIENTE` | `VND-CAR-01` · `VND-CAR-03` |
| `VND_ESTOQUE_REDUZIDO` | `VND-CAR-02` |
| `VND_ITEM_ADICIONADO` | `VND-CAR-01` |
| `VND_ITEM_REMOVIDO` | `VND-CAR-04` |
| `VND_PEDIDO_CANCELADO` | `VND-PED-03` |
| `VND_PEDIDO_NAO_CANCELAVEL` | `VND-PED-03` |
| `VND_PRODUTO_ESGOTADO` | `VND-CAR-01` |
| `VND_QUANTIDADE_ATUALIZADA` | `VND-CAR-03` |
<!-- /usado-em -->
