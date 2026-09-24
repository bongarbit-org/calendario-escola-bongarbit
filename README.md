# Calendário da Escola

Uma planilha de cronograma vira um site público de aulas e, se você quiser, uma
agenda do Google que os alunos assinam no celular. Não há banco de dados, painel
de administração nem login: a planilha continua sendo o lugar onde a coordenação
trabalha, e o site é só a leitura dela.

```
  planilha .xlsx
        │
        │  scripts/importar.py
        ▼
  content/calendario.json  ──────►  site Next.js  ──►  público
        │
        │  scripts/sincronizar_agenda.py
        ▼
  agenda do Google  ──►  alunos assinam no celular
```

O `calendario.json` é o centro de tudo. Ele é gerado da planilha, versionado no
repositório e lido tanto pelo site quanto pelo sincronizador. Quem quiser trocar
a origem dos dados só precisa produzir esse arquivo.

## A origem: uma planilha

O importador lê um arquivo **`.xlsx`**. Se o cronograma mora no Google Sheets,
baixe-o como `.xlsx` — *Arquivo → Fazer download → Microsoft Excel* — e aponte o
script para ele. Não há integração direta com o Drive, de propósito: um arquivo
baixado é reproduzível e não depende de credencial para rodar.

```sh
python3 scripts/importar.py caminho/para/cronograma.xlsx
```

Requer `openpyxl` (`pip install openpyxl`). O sincronizador da agenda pede
`google-api-python-client` e `google-auth-oauthlib`.

### O que a planilha precisa ter

Uma aba chamada **`Cronograma detalhado`**, com os dados a partir da terceira
linha e uma atividade por linha. As colunas são lidas por posição:

| Coluna | O que é |
|---|---|
| C | data |
| D | dia da semana |
| E | carga horária |
| F | atividade — o título; o que vier depois de `:` vira descrição |
| I | trilha |
| J | módulo ou fase |
| K | local |
| L | equipe |

Opcionalmente, uma segunda aba com o planejamento detalhado de uma trilha, para
dar a cada encontro o seu tópico. Ela é cruzada por data e o nome dela está em
`main()`, no importador.

Planilha com outro formato? As posições estão todas concentradas no laço de
leitura do `main()`. É o único ponto a mexer.

## O arquivo intermediário

`content/calendario.json` guarda os encontros agrupados por mês. Cada um tem a
forma:

```json
{
  "data": "2026-09-23",
  "diaDaSemana": "Qua",
  "titulo": "Luteria do Berimbau - Aula 1",
  "descricao": null,
  "topico": null,
  "trilha": "Luteria Orgânica",
  "cor": "var(--verde-baoba)",
  "horas": 3.0,
  "local": "CACGB",
  "equipe": "prof. Ninho Brown Xambá",
  "modulo": "Módulo 2",
  "semAula": false
}
```

O tipo correspondente vive em [`lib/calendario.ts`](lib/calendario.ts). Gerar
esse arquivo por outro caminho — outro script, outra fonte, à mão — é suficiente
para o site funcionar.

## A camada de adaptação

Nenhuma planilha real chega pronta. O importador concentra num punhado de
constantes tudo o que a planilha não diz, ou diz de um jeito que não serve ao
aluno. Elas são o ponto de configuração do projeto:

| Constante | Para quê |
|---|---|
| `COMECO` | a partir de que data o calendário começa |
| `TRILHAS` | classifica a atividade pelo nome, quando a coluna de trilha não basta |
| `CORES` | a cor de cada trilha, em variáveis CSS |
| `PROFESSORES` | quem conduz cada tipo de atividade |
| `LOCAIS` | onde cada trilha acontece |
| `AJUSTES` | correções por data: título, local, horário, o que for |
| `ACRESCENTAR` | entradas que a planilha não tem |
| `FERIADOS` | datas em que não há aula, com o motivo escrito |
| `EXCLUIR` | atividades que não dizem respeito aos alunos |
| `SEM_CONTEUDO` | trilhas cujo texto descritivo não vai ao ar |

A regra que governa o conjunto: **a correção mora no código, não no JSON
gerado**. Editar o `calendario.json` à mão funciona até a próxima importação, que
apaga tudo. Uma linha numa constante sobrevive.

## O site

Next.js com React, sem dependência além disso. Renderiza no servidor a cada
requisição, para que "hoje" seja o hoje de quem abre a página.

```sh
npm install
npm run dev     # desenvolvimento
npm run build   # produção
```

O que o aluno encontra:

- **Duas vistas.** Lista, um encontro por linha, e calendário, a grade do mês —
  onde cada dia com encontro abre o detalhe ao ser clicado.
- **Filtro por trilha**, com as cores servindo de código visual.
- **O próximo encontro em destaque**, com a contagem em linguagem corrente.
- **Botões para assinar a agenda**, no Google ou por `.ics`, que cobre iPhone,
  Outlook e o resto.
- O que já passou fica escondido por padrão, com um botão para trazer de volta.

Feito para o celular primeiro: é onde o aluno consulta.

## A agenda do Google

`scripts/sincronizar_agenda.py` põe uma agenda do Google de acordo com o
`calendario.json`. O site é a fonte; a agenda o acompanha.

O script **corrige e apaga eventos que já existem**, e só cria com `--criar`,
para datas com horário declarado em `HORARIOS` — o site guarda data e carga
horária, não hora do dia, e o script não inventa hora. Ele mexe em
título, local e nas linhas da descrição que conhece, preservando qualquer outra
linha que esteja lá. Horário e duração ficam como estão, salvo mudança de data
declarada explicitamente em `MUDANCAS`.

```sh
# simulação: mostra o que faria, sem tocar em nada
python3 scripts/sincronizar_agenda.py --token ~/.config/escola/token.json

# grava
python3 scripts/sincronizar_agenda.py --token ~/.config/escola/token.json --aplicar
```

**Sem `--aplicar` nada é gravado. Rode assim primeiro, sempre** — o script apaga
eventos.

### Usar com a sua agenda e as suas credenciais

Nada de agenda está preso ao código: o ID entra por `--agenda` e a credencial
por `--token` ou `--credenciais`.

**1. Ative a API.** No [Google Cloud Console](https://console.cloud.google.com/),
crie ou escolha um projeto e ative a **Google Calendar API** em *APIs e serviços
→ Biblioteca*.

**2. Crie a credencial.** Em *APIs e serviços → Credenciais*, use *Criar
credenciais → ID do cliente OAuth*, tipo **App para computador**. Baixe o JSON e
guarde-o **fora do repositório**:

```sh
mkdir -p ~/.config/escola
mv ~/Downloads/client_secret_*.json ~/.config/escola/credenciais.json
```

Se a tela de consentimento pedir configuração, marque o app como **Externo** e
inclua seu e-mail em *Usuários de teste*. Não é preciso publicar o app nem passar
por verificação para uso próprio.

**3. Pegue o ID da agenda.** No Google Agenda: *Configurações da agenda →
Integrar agenda → ID da agenda*. Numa agenda de grupo ele termina em
`@group.calendar.google.com`; na pessoal, é o seu e-mail.

**4. Autorize uma vez.** O script abre o navegador e grava o token no caminho de
`--token`:

```sh
python3 scripts/sincronizar_agenda.py \
  --credenciais ~/.config/escola/credenciais.json \
  --token ~/.config/escola/token.json \
  --agenda SEU_ID@group.calendar.google.com
```

Nas vezes seguintes bastam `--token` e `--agenda`: o token se renova sozinho.

**5. Ajuste o site.** O botão "Adicionar ao Google Agenda" monta o link a partir
de `ID_AGENDA`, em [`app/page.tsx`](app/page.tsx). O `cid` e o `.ics` saem do
mesmo ID, sem link colado à mão.

A conta precisa de permissão de **Fazer alterações nos eventos** na agenda. E
uma ressalva para quem adaptar o projeto: as constantes da camada de adaptação
descrevem uma escola específica — esvazie-as antes de apontar o script para
outra agenda, senão ele tentará mover datas que não existem.

### Segredos

Token e client secret **nunca** entram no repositório. O
`.gitignore` e o `.vercelignore` barram `token.json`, `credentials.json` e
`client_secret*.json`, mas o hábito certo é guardá-los em outro lugar, como
`~/.config/`, e apontar o script para lá.

## Publicar

Qualquer hospedagem que rode Next.js serve. Com a Vercel:

```sh
npm run build
npx vercel deploy --prod
```

O ciclo completo de uma atualização: baixar a planilha, rodar o importador,
conferir o JSON gerado, publicar o site e, se houver agenda, sincronizá-la.

## Design

O visual segue [`design.md`](design.md): papel envelhecido, tipografia mono,
cantos retos, filete fino e sombra sólida deslocada, sem emoji. As trilhas
carregam a cor semântica, e é ela que liga a etiqueta, a faixa lateral da lista e
a marca no calendário.

A voz do texto é dirigida a quem vai à aula, não à coordenação: o site diz onde é
e quando é, não relata etapas de projeto.
