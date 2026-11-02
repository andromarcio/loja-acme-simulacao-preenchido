# Aprovação da especificação — perfil requisitos

Copie CODEOWNERS, o template de PR e os workflows de validação desta pasta para a instância. Substitua os responsáveis fictícios pelos usuários ou times reais.

## Checkpoints

CP1 aprova os requisitos; CP2 aprova o modelo de entidades negocial. A esteira termina em `especificado`. A revisão pode cobrir ambos no mesmo PR; registre `por` e `em` em cada gate, sem atribuir aprovação por inferência.

No PR, inclua os artefatos revisados e regenere `modules/INDEX.md` com `python scripts/gates.py promote --write`. O gate-check confere transições e o espelho; o CODEOWNERS encaminha a revisão ao responsável. Configure proteção da branch e exigência de review no GitHub, com os checks obrigatórios **Esteira de gates — check** e os jobs **estrutura**, **rastreabilidade** e **entrega** do `spec-guard.yml`. O `spec-guard` roda em todo PR, então exigi-lo não trava PR que não mexe na especificação; fora de uma branch `historia/` ou `sprint/`, o `entrega` é pulado e conta como aprovado. O check só aparece na busca depois de rodar uma vez no repositório.

## Entrega

Na cadência sprint, commits de especificação citam uma única chave de ticket. As AIMMs registram o escopo e os resultados; `valida-entrega` confere o merge para a main. A main recebe somente especificações entregues. Não há aprovação de testes nem de código neste perfil.

No merge para main, registre o trailer `Approved-by: Nome <email>` do responsável real. Não use os autores dos exemplos como se tivessem revisado o artefato.

Esta instância inclui em `scripts/` os validadores usados por `gate-check.yml`,
`promote-estado.yml` e `spec-guard.yml`, com suas dependências em `scripts/lib/`,
copiados do `docqui-caixa-engine`. Os workflows existentes foram preservados.
Para atualizar esse conjunto, use as versões canônicas do engine e inclua também
as dependências dos scripts. As ferramentas de publicação do Pages e as extensões
locais de dashboard citadas no README da raiz não fazem parte deste conjunto.

O `spec-guard` usa Node.js 20; os workflows de gates usam Python 3.x com PyYAML.

```bash
python scripts/gates.py status                 # esteira (readiness) de todas as funcionalidades
python scripts/gates.py promote --write        # regenera a seção no INDEX.md
python scripts/gates.py check --base origin/main  # valida transições (como no CI)
```

> Requer Python 3.8+ e PyYAML (`pip install pyyaml`). Item 5 (integração com o
> ServiceNow — espelhar gate ↔ estado do ticket) fica a cargo da instância,
> conforme a infraestrutura disponível.
