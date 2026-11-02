# Alternativa: dois child agents

Não use na primeira montagem. O caminho recomendado é a especificação inteira no agente `../1-agente-docqui-caixa.md`, com o filho `../3-agente-retro.md`.

Esta pasta guarda o desenho anterior: um child agent por skill, cada um com instruções próprias. Ele só vale a pena se o piloto mostrar que o agente Docqui Caixa, com as duas skills, se perde ou estoura o limite de instruções. O risco que levou a juntar as duas skills num agente é o orquestrador trocar de agente no meio de um roteiro de várias mensagens e perder o estado da conversa.

Se for usar: crie os dois child agents dentro do agente Docqui Caixa, com nome, descrição e instruções destes arquivos, dê a eles a mesma ferramenta do GitHub e o tópico "Data de hoje", e tire do agente principal a seção 2 ("Contexto e método") na parte que manda ler as skills. O agente "Retro" continua igual nos dois desenhos.
