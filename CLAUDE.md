# CLAUDE.md

Instruções para o Claude Code neste repositório.

## Comandos

```sh
npm install                              # dependências do site
npm run dev                              # site em localhost:3000
npm run build                            # build estático em out/ (rode antes de commitar mudança de UI)
npm run horarios                         # baixa o .ics e grava public/horarios.json (dev e build já chamam)
npm run test                             # testes unitários e de componente (vitest, rápido)
npm run test:e2e                         # build + Chromium headless de verdade (puppeteer, mais lento)
npm run lint                             # Biome, só checa — é o que roda no CI
npm run format                           # Biome, reformata o repositório

python3 scripts/importar.py cronograma.xlsx                              # planilha → calendario.json
python3 scripts/sincronizar_agenda.py --token ~/.config/bongarbit/token.json               # simula a sincronização
python3 scripts/sincronizar_agenda.py --token ~/.config/bongarbit/token.json --aplicar     # grava na agenda

python3 -c "import googleapiclient, openpyxl"   # confirma que as libs Python estão instaladas
```

`npm run test` cobre funções puras (`lib/*.test.ts`) e renderização de componente
(`components/*.test.tsx`, jsdom, sem browser de verdade). `npm run test:e2e`
gera o site estático, serve-o e dirige um Chromium headless real via Puppeteer —
é o único jeito de testar coisas que dependem de um browser de verdade, como a
rasterização de imagem do `@zumer/snapdom` (`e2e/*.e2e.test.ts`). Como "hoje"
é fixado no build (`CALENDARIO_HOJE_TESTE`), [`e2e/site-estatico.ts`](e2e/site-estatico.ts)
faz um build por data, cada um na própria pasta `.e2e-<porta>/` (apagada ao
fim), e o serve na raiz de uma porta — nunca `next dev`, que recusa duas
instâncias no mesmo projeto.

O CI (`.github/workflows/ci.yml`) roda `lint`, `build`, `test` e `test:e2e` a
cada push e PR. Rode os quatro antes de pedir merge — o que falha lá falha aqui.

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
- O `origin` é `github.com/bongarbit-org/calendario-escola-bongarbit` (público),
  não mais `bongarbit/…`. Cada `push` no `main` já publica o site (ver §4).

Bons assuntos: `Move a Trilha Empreendedora para as sextas`, `Acrescenta os
feriados de fim de ano`, `Corrige o local do Café de novembro`.

## 3. A direção da verdade

```
  planilha .xlsx  ──►  content/calendario.json  ──►  site
                              │                      ▲
                              │                      │ só o horário do dia,
                              ▼                      │ só para exibir
                       agenda do Google  ────────────┘
```

`content/calendario.json` é a fonte. O site e a agenda do Google são ambos
derivados dele. **A agenda nunca é fonte do que o calendário contém**: o
sincronizador só escreve nela, nunca lê dela para dentro do JSON.

Consequência prática: se alguém editar um evento direto no Google Agenda, a
próxima sincronização desfaz a edição. Quando notar isso, avise antes de aplicar.

Única exceção, e só de leitura: `content/calendario.json` guarda `horas`
(carga horária, ex. `3`), não horário de verdade — a planilha não traz isso.
[`lib/agenda.ts`](lib/agenda.ts) sabe extrair o horário real do `.ics` público
(`horariosPorData`/`buscarHorarios`), mas quem o chama é só
[`scripts/gerar_horarios.mts`](scripts/gerar_horarios.mts), no `npm run
horarios` (antes do `dev` e do `build`), que grava `public/horarios.json` —
o navegador não pode buscar o `.ics` do Google direto (sem CORS) e o site não
tem servidor. A página não espera por esse arquivo: [`components/HorariosContext.tsx`](components/HorariosContext.tsx)
busca `horarios.json` só depois que a página já apareceu, uma vez por
carregamento, e guarda o resultado num Context (`carregando` → `pronto` ou
`erro`) que `IndicadorHorario`, `DetalheProxima` e `ConviteDoDia` consultam. O
horário real aparece **ao lado** da carga horária, nunca no lugar dela:
enquanto carrega, um "···" pulsando; se a busca falhar, um "!" vermelho com
tooltip; achando a data, o horário. Datas sem evento com horário (feriado, por
exemplo) não mostram nada — não é erro, só ausência. Nunca escreve nada de
volta nem alimenta o JSON — é exibição, não sincronização.

## 4. Arquitetura do site

Next.js (App Router), sempre **estático** (`output: "export"`): o build gera
`out/`, que o GitHub Pages serve (ver "Publicação" abaixo). Não há servidor nem
rota de API. "Hoje" é o do momento do build; só no `npm run dev` ele é
recalculado a cada requisição.

- [`lib/calendario.ts`](lib/calendario.ts) importa `content/calendario.json`
  direto (não via `fetch`) e expõe os tipos (`Aula`, `Mes`) e as funções
  puras usadas pelo resto do site: `hoje()` calcula a data no fuso de Recife
  porque o build roda em UTC; `proximaAula()`, `quantosDias()`,
  `emPalavras()` e `horasDe()` formatam o que aparece na tela.
- [`app/page.tsx`](app/page.tsx) é a página única do site: cabeçalho, destaque
  do próximo encontro, botões de assinatura da agenda e o rodapé com a
  contagem de encontros e horas. `ID_AGENDA` está hardcoded em
  [`lib/agenda.ts`](lib/agenda.ts) — é o único lugar a mudar se a agenda
  pública trocar de ID.
- [`components/Calendario.tsx`](components/Calendario.tsx) guarda o estado de
  filtro por trilha, a alternância lista/grade e mostrar/esconder aulas
  passadas. A grade de mês é montada à mão (função `grade()`) a partir do
  primeiro domingo ao último sábado.

Cinco componentes são client (`"use client"`), e todos pelo mesmo motivo —
dependem de estado, de evento ou do navegador:

| Componente | Para quê |
|---|---|
| `Calendario` | filtro, vista lista/grade, dia aberto |
| `HorariosContext` | busca `horarios.json` depois do primeiro HTML e distribui o resultado |
| `IndicadorHorario` | mostra o horário real ao lado da carga horária, ou o estado de carga/erro |
| `DetalheProxima` | o mesmo, no destaque do próximo encontro |
| `ConviteDoDia` | o convite de aula: modal, sorteio das frases e rasterização via `@zumer/snapdom` |

O resto é server component. Em particular `hoje()` só roda no build, o que
mantém a data vinda do fuso de Recife e não do relógio de quem abre a página.

### Publicação: GitHub Pages

O site é publicado como página estática em
`https://bongarbit-org.github.io/calendario-escola-bongarbit/`, por
[`.github/workflows/pages.yml`](.github/workflows/pages.yml): a cada `push` no
`main`, manualmente (`gh workflow run pages.yml`) e às 00h30, 06h30, 12h30 e
18h30 de Recife. O workflow só instala e roda `npm run build`, cujo `prebuild`
gera o `horarios.json`; o `basePath` `/calendario-escola-bongarbit` vem de
`next.config.mjs` (só em produção; no `dev` é vazio).

Consequências: "hoje" e o horário só mudam na próxima reconstrução; caminhos de
`public/` precisam do prefixo `BASE` de [`lib/base.ts`](lib/base.ts) (as fontes
usam `url("../public/fonts/…")` no CSS por isso). Para ver o build como o Pages
o serve, abra `out/` sob o prefixo — ou, mais simples, confie no e2e, que o
serve na raiz.

Mudança visual segue [`design.md`](design.md) — papel envelhecido, tipografia
mono, cantos retos, cor semântica por trilha. Leia antes de mexer em CSS ou em
como uma informação é apresentada.

## 5. Como o usuário pede mudanças

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
| trilha nova | `TRILHAS` **e** `CORES` (uma cor ainda não usada, de `globals.css`) e, no JSON, `trilhas` e a `cor` de cada entrada |

Nome de trilha longo vira etiqueta larga: confira no celular (o e2e acusa
rolagem lateral). O convite do dia (`lib/card.ts`, `ConviteDoDia`) só diz
"HOJE · dia/mês", sem dia da semana; ao mexer nele, gere o cartão num Chromium
de verdade e olhe a imagem, porque a rasterização difere do layout.

## 6. Verificar diferenças entre o site e a agenda

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

## 7. Sincronizar

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
em vez de inventar hora. Os horários de `HORARIOS` são em **UTC**
(Recife + 3h): 18h–21h vira `("21:00", "00:00")`, 9h–17h vira `("12:00", "20:00")`.
Um evento novo no site entra assim: horário em `HORARIOS` → simulação com
`--criar` → mostrar → `--criar --aplicar` → simulação de novo (`0 eventos a
atualizar`) → conferir o `.ics`. Mudar a trilha de um evento já criado também
aparece na simulação, como diferença de "descrição".

As bibliotecas do Google (`google-api-python-client`, `google-auth-oauthlib`) e o
`openpyxl` precisam estar no interpretador que você usar. Confira antes de
concluir que algo falhou: `python3 -c "import googleapiclient, openpyxl"`.

## 8. Fluxo completo de uma alteração

1. `git pull`
2. Editar a constante em `scripts/importar.py` **e** o `content/calendario.json`
3. `npm run build`
4. Conferir o resultado no HTML servido, não só no JSON
5. Commit simples e `git push`
6. O `push` já dispara o GitHub Pages: acompanhe com
   `gh run watch <id> -R bongarbit-org/calendario-escola-bongarbit` (o id sai de
   `gh run list -w pages.yml`)
7. Verificar no ar, em `bongarbit-org.github.io/calendario-escola-bongarbit/`
8. Sincronizar a agenda, com simulação antes

## 9. Segredos

O token do Google vive em `~/.config/bongarbit/token.json`, **fora do
repositório**. Nunca o mova para cá, nunca o imprima, nunca o commite. O
`.gitignore` barra `token.json`, `credentials.json` e `client_secret*.json`, mas
a regra é não trazer esses arquivos para a pasta.

## 10. Ao verificar, verifique de verdade

Alterou o site? Confira o HTML que o servidor devolve, não o JSON de entrada.
Alterou a agenda? Baixe o `.ics` de novo e confirme. Afirmar que algo funcionou
sem ter olhado é o pior resultado possível aqui, porque o calendário é público e
os alunos se organizam por ele.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
