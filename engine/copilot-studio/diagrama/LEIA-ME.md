# Diagrama da arquitetura (archify)

- `docqui-copilot.html` — o diagrama, gerado pelo [archify](https://github.com/tt-a1i/archify). Abra no navegador do computador: dá para aproximar, buscar um nó, traçar o caminho entre dois nós e exportar como imagem ou SVG (botão **Exportar**). No celular, o diagrama abre maior que a tela e se navega arrastando.
- `docqui-copilot.architecture.json` — a entrada do archify. Para mudar o diagrama, edite este arquivo e gere de novo.

O HTML passou nas quatro verificações do `finalize` do archify: schema, entrega, consistência e navegador. A interface está em português nos textos que aparecem no uso comum; mensagens raras, como erros de exportação, ficam em inglês.

## Como gerar de novo

Com o Claude Code e a skill do archify instalada (`npx skills add tt-a1i/archify -g`), abra o Claude Code nesta pasta e peça:

```text
/archify finalize o candidato docqui-copilot.architecture.json
```

Ou, com o repositório do archify clonado, rode a partir desta pasta:

```bash
node <caminho-do-archify>/archify/bin/archify.mjs finalize architecture docqui-copilot.architecture.json docqui-copilot.html --quality showcase --json
```
