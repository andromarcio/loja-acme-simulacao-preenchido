# Tópico "Data de hoje"

O carimbo de todo artefato leva a data do dia (`atualizado: AAAA-MM-DD`), e o `estado-em` da AIMM leva data, hora e fuso (`AAAA-MM-DD HH:MM -03:00`). O modelo não sabe a data por conta própria, então o agente pede ao tópico. As instruções do agente já mandam usar este tópico e perguntar a data à pessoa se ele falhar.

## Como criar

1. No agente, abra **Tópicos** e clique em **+ Adicionar um tópico** → **Do zero**.
2. Dê o nome `Data de hoje`.
3. No nó de gatilho, escolha **O agente escolhe** (*The agent chooses*) e, em **Descrição**, cole:

   ```text
   Devolve a data de hoje (AAAA-MM-DD) e a data e hora de agora com fuso (AAAA-MM-DD HH:MM -03:00), no horário de Brasília. Use antes de gravar o carimbo de um artefato ou o estado-em de uma AIMM.
   ```

4. Abaixo do gatilho, clique em **+** → **Gerenciamento de variáveis** → **Definir valor da variável**.
5. Em **Definir variável**, crie uma variável nova chamada `DataHoje`.
6. Em **Para o valor**, abra a aba **Fórmula** e cole:

   ```text
   Text(DateAdd(Now(), -3, TimeUnit.Hours), "yyyy-mm-dd")
   ```

   O `-3` converte de UTC para o horário de Brasília. Sem ele, entre 21h e meia-noite o carimbo sairia com a data do dia seguinte.

7. Repita os passos 4 a 6 para uma segunda variável, `DataHora`, com a fórmula:

   ```text
   Text(DateAdd(Now(), -3, TimeUnit.Hours), "yyyy-mm-dd hh:mm") & " -03:00"
   ```

8. Abra **Detalhes** do tópico → **Entrada e saída** (*Input and output*) → **Criar uma nova variável** de **saída** e escolha `DataHoje`. Na descrição da saída, escreva `Data de hoje, AAAA-MM-DD`. Crie também a saída `DataHora`, com a descrição `Data e hora de agora, AAAA-MM-DD HH:MM -03:00`.
9. Clique em **Salvar**.

## Como testar

No painel **Testar seu agente**, escreva `Que dia é hoje? Use o tópico Data de hoje.` A resposta tem de ser a data de hoje no formato `2026-10-29`. Depois, `Que horas são? Use o tópico Data de hoje.`: a resposta tem de ser a hora de Brasília, no formato `2026-10-29 16:19 -03:00`. Se vier outro formato ou outra data, confira a fórmula do passo 6.
