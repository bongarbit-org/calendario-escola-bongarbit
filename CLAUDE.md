# CLAUDE.md

Instruções para o Claude Code neste repositório.

## 1. Sempre comece com `git pull`

**Nenhuma leitura, análise ou alteração acontece antes disto.** O repositório é
compartilhado e pode ter mudado desde a última sessão:

```sh
git pull
```

Se o pull trouxer mudanças em `content/calendario.json`, `scripts/` ou `app/`,
leia o que veio antes de propor qualquer coisa. Se houver conflito ou trabalho
local não commitado, pare e mostre a situação ao usuário — não resolva por conta
própria.

Isto vale inclusive para perguntas que parecem só de leitura ("o que tem em
outubro?"): responder a partir de uma cópia velha é pior que não responder.

## 2. Commits

- **Nunca** adicione `Co-Authored-By: Claude`, `Generated with Claude Code` ou
  qualquer outra atribuição a IA. Os commits são do usuário.
- **Simples.** Uma linha de assunto no imperativo, em português, dizendo o que
  mudou. Corpo só quando a razão não couber no assunto — e aí, duas ou três
  linhas.
- Commite quando o usuário pedir. Faça `push` em seguida, já que outras pessoas
  têm acesso ao repositório.

Bons assuntos: `Move a Trilha Empreendedora para as sextas`, `Acrescenta os
feriados de fim de ano`, `Corrige o local do Café de novembro`.

## 3. A direção da verdade

```
  planilha .xlsx  ──►  content/calendario.json  ──►  site
                              │
                              └────────────────►  agenda do Google
```

`content/calendario.json` é a fonte. O site e a agenda do Google são ambos
derivados dele. **A agenda nunca é fonte**: o sincronizador só escreve nela,
nunca lê dela para dentro do site.

Consequência prática: se alguém editar um evento direto no Google Agenda, a
próxima sincronização desfaz a edição. Quando notar isso, avise antes de aplicar.

## 4. Como o usuário pede mudanças

Ele descreve a mudança em linguagem corrente — "as aulas de X são com o prof. Y",
"o encontro de 14/10 passou para 16/10, no Fab Lab". Ele **não** edita a planilha
e o JSON à mão, e normalmente a planilha atualizada não está no disco.

Por isso toda mudança se escreve em **dois lugares**:

1. **A constante em `scripts/importar.py`** — para a correção sobreviver à
   próxima importação da planilha.
2. **`content/calendario.json`** — para valer agora, já que reimportar exigiria
   o `.xlsx` atualizado.

Escrever só no JSON é um erro: a próxima importação apaga. Escrever só na
constante também: o site não muda até alguém reimportar.

Qual constante usar:

| Mudança | Onde |
|---|---|
| quem conduz uma atividade | `PROFESSORES` |
| onde uma trilha inteira acontece | `LOCAIS` |
| algo pontual numa data — título, local, data | `AJUSTES` |
| uma entrada que a planilha não tem | `ACRESCENTAR` |
| feriado | `FERIADOS` |
| classificação de trilha pelo nome | `TRILHAS` |

## 5. Verificar diferenças entre o site e a agenda

A simulação do sincronizador **é** a ferramenta de comparação. Ela não grava
nada:

```sh
python3 scripts/sincronizar_agenda.py --token ~/.config/bongarbit/token.json
```

Saída limpa (`0 eventos a atualizar`) significa que as duas pontas estão iguais.
Qualquer linha listada é uma diferença.

Para inspecionar a agenda sem credencial, o `.ics` público serve:

```sh
curl -s "https://calendar.google.com/calendar/ical/<ID>/public/basic.ics"
```

### Qual versão é a mais atual

Diante de uma diferença, **não decida sozinho**. Levante as duas datas e
apresente:

**Lado da agenda** — cada evento no `.ics` traz `LAST-MODIFIED`, em UTC. Extraia
por bloco `VEVENT`, não com `grep -A`: os campos não vêm em ordem fixa e um
`grep` de contexto devolve o carimbo do evento vizinho, calado.

```sh
awk -v alvo="<trecho do título>" 'BEGIN{RS="BEGIN:VEVENT"} index($0,alvo){
  if (match($0,/LAST-MODIFIED:[0-9TZ]+/)) print substr($0,RSTART,RLENGTH)
  if (match($0,/DTSTART[^:]*:[0-9TZ]+/))  print substr($0,RSTART,RLENGTH)
}' agenda.ics
```

O `DTSTART` impresso junto serve de conferência: se não for o evento que você
procurava, o carimbo não vale.

**Lado do site** — quando aquele valor entrou no JSON:

```sh
git log -1 --format="%cI  %s" -S"<o valor>" -- content/calendario.json
```

A leitura:

| Situação | O que significa |
|---|---|
| `LAST-MODIFIED` **anterior** à última sincronização | a agenda está velha; o site é o mais atual |
| `LAST-MODIFIED` **posterior**, e há diferença | alguém editou no Google depois da última sincronização |
| `LAST-MODIFIED` recente, sem diferença | é só o eco da própria sincronização |

**Cuidado com o eco.** O sincronizador atualiza o `LAST-MODIFIED` de todo evento
que escreve. Logo após uma sincronização, a agenda inteira parece recém-mexida
sem trazer informação nova. O que distingue é a existência de diferença: carimbo
novo sem diferença é eco; carimbo novo com diferença é edição humana.

Quando a diferença vier de uma edição humana no Google, **pergunte qual vale**
antes de aplicar — aplicar apagaria a edição.

## 6. Sincronizar

```sh
# simulação primeiro, sempre
python3 scripts/sincronizar_agenda.py --token ~/.config/bongarbit/token.json

# só depois de mostrar o resultado e ter o aval
python3 scripts/sincronizar_agenda.py --token ~/.config/bongarbit/token.json --aplicar
```

Rode a simulação de novo depois de aplicar: tem que dar `0 eventos a atualizar`.

O script apaga eventos — os dias sem aula saem da agenda, que lista só o que tem
aula. Nunca rode `--aplicar` sem antes mostrar a simulação ao usuário.

Criar é opt-in: `--criar` cria na agenda os eventos que existem no site e faltam
lá, e só para as datas com horário declarado em `HORARIOS`. O site guarda data e
carga horária, não hora do dia — sem horário declarado, o script recusa a criação
em vez de inventar hora.

As bibliotecas do Google (`google-api-python-client`, `google-auth-oauthlib`) e o
`openpyxl` precisam estar no interpretador que você usar. Confira antes de
concluir que algo falhou: `python3 -c "import googleapiclient, openpyxl"`.

## 7. Fluxo completo de uma alteração

1. `git pull`
2. Editar a constante em `scripts/importar.py` **e** o `content/calendario.json`
3. `npm run build`
4. Conferir o resultado no HTML servido, não só no JSON
5. Commit simples e `git push`
6. `npx vercel deploy --prod --yes`
7. Verificar no ar
8. Sincronizar a agenda, com simulação antes

## 8. Segredos

O token do Google vive em `~/.config/bongarbit/token.json`, **fora do
repositório**. Nunca o mova para cá, nunca o imprima, nunca o commite. O
`.gitignore` barra `token.json`, `credentials.json` e `client_secret*.json`, mas
a regra é não trazer esses arquivos para a pasta.

## 9. Ao verificar, verifique de verdade

Alterou o site? Confira o HTML que o servidor devolve, não o JSON de entrada.
Alterou a agenda? Baixe o `.ics` de novo e confirme. Afirmar que algo funcionou
sem ter olhado é o pior resultado possível aqui, porque o calendário é público e
os alunos se organizam por ele.
