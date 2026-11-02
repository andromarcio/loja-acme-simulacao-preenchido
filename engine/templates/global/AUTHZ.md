<!-- docqui: {{VERSION}} | prompt: {{PROMPT_ID}} | atualizado: {{YYYY-MM-DD}} -->
# AUTHZ.md — Modelo de Autorização
> Padrão arquitetural transversal de **controle de acesso por funcionalidade**.
> Independente de domínio: vale para toda Funcionalidade (N3) do sistema.
>
> **Quem mantém**: arquiteto / dev
> **Atualização**: revisado quando o modelo de permissão muda — não a cada funcionalidade.
> **Realização no produto**: domínio de **Administração / Segurança** da instância,
> no Agrupamento Funcional de **Gestão de Perfis de Acesso** (ex.: `[ADM-PER]`). ⚠️

---

## Problema que este modelo resolve

Na maioria dos sistemas não há um mecanismo que padronize **como os perfis interagem com cada funcionalidade**. Criar um perfil novo costuma exigir **alterar o código** (esconder um botão, liberar uma rota). Não existe um caminho em que uma funcionalidade recém-implantada **passe a obedecer a um perfil automaticamente**, por configuração e não por código.

Este documento define esse mecanismo.

---

## Princípio central: a Funcionalidade (N3) é o átomo de autorização

O framework de especificação já atribui a **toda** funcionalidade um identificador único e estável — o ID da Funcionalidade (`[SIGLA]-[SAF]-[NN]`, ex.: `CRM-CLI-08`). Esse ID é a peça que faltava: ele passa a ser **a unidade de permissão**.

Em vez de a permissão ser ad-hoc ("esconder o botão X na tela Y"), o que se autoriza é **o ID da Funcionalidade**. A granularidade do controle **para na Funcionalidade** — não há permissão por campo ou por sub-elemento (decisão de projeto; tratar exceção rara como regra de negócio no N3, não como permissão). ⚠️

### As duas formas físicas de uma Funcionalidade — mesmo gate

| Forma | Exemplo | Como é gated |
|---|---|---|
| Funcionalidade com **tela/rota** própria | `CRM-CLI-02` Pesquisar Clientes | guarda de rota (front) + endpoint (back) |
| Funcionalidade que é uma **ação** dentro da tela de outra | `CRM-CLI-08` Aprovar Cadastro | diretiva no elemento (front) + endpoint (back) |

Ambas têm ID; ambas obedecem **ao mesmo mecanismo**. Um botão "passa a obedecer um perfil" porque está **etiquetado com o ID da sua Funcionalidade** — não porque alguém editou código quando o perfil nasceu.

---

## Comportamento padrão (decisões de projeto)

> ⚠️ Confirme estas decisões na instância — são os padrões recomendados.

1. **Nega por padrão** (*secure-by-default*): uma Funcionalidade ainda não vinculada a nenhum perfil **não é acessível** por ninguém — exceto pelo Administrador.
2. **Administrador recebe tudo**: o perfil Administrador tem acesso a toda Funcionalidade do Catálogo automaticamente, sem vínculo explícito. Funcionalidade nova entra no Catálogo e já é acessível ao Administrador para que ele a vincule aos demais perfis.
3. **Liga/desliga global** sobrepõe-se ao perfil: Funcionalidade globalmente desabilitada não é acessível por ninguém, independentemente do vínculo (ver *kill switch*).

---

## Modelo conceitual

> Modelagem formal (Label Dev, campo banco, tipos) é feita quando o domínio de Administração for detalhado tecnicamente (PROMPT_1B/3B) e registrada em `global/data-models/[dominio-admin].md` + `global/DATA-MODEL.md`. Aqui fica só o conceito que a arquitetura exige.

- **Funcionalidade** (Catálogo) — espelho de cada Funcionalidade do framework. Chave de negócio = **ID da Funcionalidade** (`CRM-CLI-08`). Atributos: nome, tipo (`TELA` | `AÇÃO`), Funcionalidade-pai (quando `AÇÃO`), domínio, rota (quando `TELA`), e o flag global `habilitada`.
- **Perfil** — perfil de acesso. Guarda a chave do SSO que o identifica no login.
- **Perfil ⟷ Funcionalidade** — vínculo N:N. **É aqui que mora o "automático"**: conceder acesso é inserir um vínculo (**dado**, em tela), nunca alterar código nem fazer deploy.

```
Perfil ──< Perfil_Funcionalidade >── Funcionalidade (Catálogo)
                                          │ habilitada (kill switch global)
                                          │ chave = ID da Funcionalidade (N3)
```

---

## Os quatro pontos de aplicação

### 1. Catálogo de Funcionalidades
Tabela única, chaveada pelo ID da Funcionalidade — fonte de verdade do que pode ser autorizado. Populado por DML (ver "Ciclo de vida", abaixo).

### 2. Matriz Perfil ⟷ Funcionalidade
A tela de Gestão de Perfis de Acesso vincula Funcionalidades a Perfis. Criar um perfil novo = vincular Funcionalidades a ele. Zero código, zero deploy.

### 3. Enforcement no frontend — diretiva declarativa (UX)
No login, o usuário busca uma vez seu conjunto de Funcionalidades (`GET /me/funcionalidades`). Qualquer elemento — botão, item de menu, guarda de rota — é etiquetado de forma declarativa pelo ID da Funcionalidade:

```html
<button *appFeature="'CRM-CLI-08'">Aprovar</button>
```

A mesma fonte alimenta a guarda de rota. Esconder/exibir é **só UX**.

### 4. Enforcement no backend — o gate de verdade (segurança)
Esconder botão não protege nada. **Quem garante é o servidor.** Cada endpoint é anotado com o ID da Funcionalidade que serve, e um interceptor confere contra as Funcionalidades resolvidas do usuário (a partir do perfil no JWT — SSO corporativo OIDC/OAuth2):

```
@RequiresFeature("CRM-CLI-08")
```

O mapa Funcionalidade→endpoint sai da seção `## Implementação` do N3. Sem este ponto, a diretiva do front é apenas teatro.

---

## Liga/desliga global (kill switch)

O flag `habilitada` no Catálogo desabilita uma Funcionalidade para **todos**, independentemente de perfil. Dois usos da mesma chave:

- **Rollout**: implantar a Funcionalidade desabilitada e ligá-la quando pronta.
- **Desligamento emergencial**: cortar o acesso a uma Funcionalidade problemática sem deploy e sem mexer em nenhuma matriz de perfil.

---

## Ciclo de vida da Funcionalidade no Catálogo

O Catálogo é um **espelho** do N3/INDEX. A Funcionalidade entra nele por **DML idempotente**, versionada junto das migrações (roda no deploy):

```
N3 especificado (ID, nome, tipo, Funcionalidade-pai)
   └─ DML idempotente (MERGE por ID da Funcionalidade)   ← versionada, roda no deploy
        └─ Catálogo de Funcionalidades (tabela)
             └─ disponível na Gestão de Perfis para vinculação a perfis   ← dado, sem deploy
```

Regras do ciclo de vida:

- **Idempotência**: usar `MERGE` (upsert) pela coluna do ID da Funcionalidade — nunca `INSERT` cru. A mesma DML roda em qualquer ambiente sem duplicar.
- **Remoção é lógica**: Funcionalidade retirada vira `habilitada = false` / `deleted_at` preenchido — nunca apaga a linha (IDs de Funcionalidade não são reutilizados; preserva a trilha de quem tinha o acesso — ver NFR AUD-01).
- **Fonte de verdade = N3/INDEX**: a tabela é um reflexo da spec. Por ora a DML é escrita pelo dev (na *Definition of Done* da Funcionalidade, junto da seção `## Implementação`). Quando incomodar, a skill `analista-requisitos` pode **gerar o stub da DML** a partir do N3 — eliminando esquecimento e divergência. Não construir o gerador agora é YAGNI aplicado. ⚠️

---

## Fluxo ponta a ponta

```
1. Funcionalidade especificada no N3            → ID estável (SIGLA-SAF-NN)
2. Front etiqueta o elemento             → *appFeature="ID"
3. Back anota o endpoint                 → @RequiresFeature("ID")
4. DML (MERGE por ID) roda no deploy     → Funcionalidade no Catálogo
5. Administrador vincula a Funcionalidade a um perfil   ← único passo manual, em tela
6. Usuário do perfil acessa; demais, não → resolvido por dado, sem deploy
```

O **único passo manual** que sobra é a decisão de negócio "quais perfis recebem esta Funcionalidade" — feita em tela, como dado.

---

## Relação com Administração e auditoria

| Elemento | Onde vive |
|---|---|
| Catálogo de Funcionalidades, matriz Perfil⟷Funcionalidade, kill switch | Agrupamento Funcional de Gestão de Perfis de Acesso (ex.: `[ADM-PER]`) |
| Cadastro de usuários e vínculo usuário↔perfil | Agrupamento Funcional de Gestão de Usuários (ex.: `[ADM-USR]`) |
| Trilha de acessos e ações | Agrupamento Funcional de Auditoria de Acessos (ex.: `[ADM-AUD]`) + NFR **AUD-01** |
| Perfil no token e identidade no login | SSO corporativo (OIDC/OAuth2 + JWT) — fora do sistema |

A NFR de autorização (`SEG-01`) é **herdada** por toda Funcionalidade; um N3 só a referencia quando precisa apontá-la explicitamente.

---

## Decisões de arquitetura

> ⚠️ Padrões recomendados — confirme/ajuste na instância.

1. **Resolução do conjunto de Funcionalidades no login → no servidor.** O JWT carrega apenas o **perfil** (papel); o backend resolve perfil→funcionalidades. O front busca o conjunto via `GET /me/funcionalidades`. Evita token inchado e torna a revogação imediata quando o Administrador altera um vínculo.
2. **Um único perfil por usuário.** As funcionalidades acessíveis são exatamente as vinculadas ao perfil do usuário — sem união de perfis. ⚠️
3. **Geração da DML → manual por ora (YAGNI).** Escrita pelo dev na *Definition of Done* da Funcionalidade; gerador a partir do N3 fica como evolução futura.
4. **Entidades**: `Funcionalidade` (Catálogo) e `PerfilFuncionalidade` (vínculo). Modelagem técnica formal no detalhamento do domínio de Administração (PROMPT_1B → `global/data-models/[dominio-admin].md`).
