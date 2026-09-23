# Calendário — Escola Bongarbit

Site público com o calendário de aulas da escola de luteria, de setembro de 2026
em diante. Feito para os alunos abrirem no celular.

## Atualizar o calendário

A fonte é a planilha **CRONOGRAMA PEDAGÓGICO.xlsx**, no Drive. Baixe e rode:

```sh
python3 scripts/importar.py ~/Downloads/CRONOGRAMA\ PEDAGÓGICO.xlsx
npm run build
npx vercel deploy --prod --yes
```

O importador lê duas abas: `Cronograma detalhado` (o calendário) e
`Planejamento Luteria Digital` (o tópico de cada aula do módulo digital, que
mora em aba separada e é cruzado por data).

Requer `openpyxl` (`pip install openpyxl`).

## O que fica de fora, de propósito

| Item | Por quê |
|---|---|
| **Vivência na Mata** | a data ainda não foi definida (`Mata a Definir`) |
| **Circulação** | não diz respeito aos alunos da escola |
| **Aba `Pagamentos Educadores`** | tem CPF, RG, CNPJ e endereços — nunca sai da planilha |

As duas primeiras estão na constante `EXCLUIR` em `scripts/importar.py`. Para
trazer a Vivência na Mata quando a data sair, tire `"vivência na mata"` de lá.

## Quem aparece no "Com"

A coluna **Equipe** da planilha traz sempre a mesma lista genérica ("João,
Thúlio, Educadores e Monitores") em quase todas as linhas. Quem de fato conduz
cada atividade foi informado pela coordenação e vive na constante `PROFESSORES`,
em `scripts/importar.py`, casada pelo nome da atividade:

| Atividade | Com |
|---|---|
| Luteria do Tambor Falante | prof. Bolinho |
| Luteria do Berimbau | prof. Ninho Brown Xambá |
| Luteria Digital | prof. Rafael, Thúlio Xambá e João Tragtenberg |
| Café com Bongarbit | Equipe de produção e monitoria do Bongarbit |
| Encontro da Trilha de Educação Empreendedora | Equipe Fab Lab Rec |

O que não casa com nenhuma dessas regras — só o Show de Culminância — continua
vindo da planilha. Quando a planilha passar a nomear os professores por aula, a
constante pode sumir.

## Locais

A coluna **Local** da planilha vinha trazendo o nome do módulo ("Módulo 2",
"Eventos Abertos") no lugar do lugar. Por isso o local sai da trilha, na
constante `LOCAIS`:

| Trilha | Onde |
|---|---|
| Luteria Orgânica | CACGB |
| Luteria Digital | CACGB |

Duas trilhas ficam de fora da regra, porque mudam de casa e por isso saem por
data, em `AJUSTES`:

- **Eventos Abertos** — os Cafés são na Cabaça do CACGB, menos o de novembro,
  na Aldeia Povo Marikito, em Escada.
- **Trilha Empreendedora** — outubro inteiro, dividido entre as **quartas no
  CACGB** (7 e 21) e as **sextas no Fab Lab Rec** (16 e 30).

O endereço diferente é dito com todas as letras na abertura do site: quem vai à
aula não pode descobrir isso na porta errada.

### Outubro é o mês da Trilha Empreendedora

Não há luteria em outubro, e os encontros da Trilha não caem todos na grade
habitual de segundas e quartas. Para o aluno não supor aula onde não há, as
segundas e as quartas vazias do mês entram no calendário como **"Não haverá
aula"**, com etiqueta própria e sem local — não há aonde ir.

| Data | |
|---|---|
| 5, 19 e 26/10 (seg) | não haverá aula — vêm da planilha |
| 14 e 28/10 (qua) | não haverá aula — as quartas que a Trilha deixou ao mudar para sexta; entram por `ACRESCENTAR`, já que a planilha não as tem |

Os demais vazios do calendário — o recesso de fim de ano e a pausa de fevereiro
— **não** são marcados, por decisão da coordenação.

### Feriados

A constante `FERIADOS`, no importador, traz os feriados em que não há aula. Eles
entram como dias sem aula, mas com o motivo escrito: "Carnaval" diz ao aluno o
que "Não haverá aula" não diz. Levam a etiqueta **Feriado**, não têm local e não
contam como encontro.

| Data | |
|---|---|
| 12/10/2026 (seg) | Nossa Senhora Aparecida |
| 02/11/2026 (seg) | Finados |
| 25/12/2026 (sex) | Natal |
| 01/01/2027 (sex) | Ano Novo |
| 04 a 10/02/2027 | Carnaval, da quinta à Quarta de Cinzas — os sete dias |

A Quarta de Cinzas de 2027 cai em **10/02**, calculada a partir da Páscoa
(28/03/2027). Só 08/02 e 10/02 seriam dias de aula; os outros cinco entram
porque a coordenação quis a janela inteira visível.

Nota: 12/10 é Nossa Senhora **Aparecida**. A **Conceição**, feriado municipal do
Recife, é 08/12 — cai numa terça em 2026, fora da grade de aulas, e por isso não
está no calendário.

### Conteúdo descartado

O texto que a planilha traz para a Trilha Empreendedora é copiado das aulas de
luteria ("Avanço no aprendizado de luteria do Tambor Falante…") e não descreve o
encontro. A constante `SEM_CONTEUDO` apaga descrição e tópico dessa trilha:
melhor nada do que errado. Quando a planilha ganhar o texto certo, tire a
trilha de lá.

### O "resultado esperado" não é importado

A segunda coluna **ETAPA** da planilha — o resultado esperado — está desalinhada
na origem, e por isso não entra no site nem na agenda. A auditoria das 41
entradas de setembro em diante:

| | |
|---|---|
| contradizem o título da própria aula | 5 |
| caem em dias sem aula | 3 |
| genéricas demais para conferir | 21 |
| conferem | 6 |
| já vinham vazias | 6 |

Testei deslocamento de linhas de −4 a +4 e nenhum melhora o alinhamento: o atual
já é o melhor. Ou seja, não é um desvio uniforme que se conserte somando um
offset — são erros espalhados. A evidência mais direta está no par Café (5) e
Trilha Empreendedora, que trocaram de texto entre si: o encontro da Trilha ficou
com "Realização do 5º Café com Bongarbit" e o Café, com o texto de
empreendedorismo.

Somado a isso, o campo é linguagem de prestação de contas ("Avanço no
aprendizado de X conforme plano de ensino"), não fala com o aluno. Se a coluna
for corrigida e ganhar utilidade, o campo volta em `scripts/importar.py` e em
`lib/calendario.ts`.

### Ajustes pontuais

`AJUSTES`, no importador, corrige por data o que a coordenação confirmou e a
planilha ainda não reflete. Hoje há uma entrada só:

| Data | O quê |
|---|---|
| 07/11 | O Café (5) perdeu o subtítulo "Especial Mês da Consciência Negra" e o objetivo, e mudou de lugar: **Aldeia Povo Marikito, Escada/PE** |

## Divergência conhecida na planilha

A coluna **Trilha** marca cinco aulas como *Luteria Digital* quando são de
luteria orgânica:

| Data | Atividade | Trilha na planilha |
|---|---|---|
| 16/09 | Luteria do Tambor Falante (Tama) — Aula 5 | Luteria Digital |
| 21/09 | Luteria do Tambor Falante (Tama) — Aula 6 | Luteria Digital |
| 23/09 | Luteria do Berimbau — Aula 1 | Luteria Digital |
| 28/09 | Luteria do Berimbau — Aula 2 | Luteria Digital |
| 30/09 | Luteria do Berimbau — Aula 3 | Luteria Digital |

O site **classifica pelo nome da atividade**, que é inequívoco, e por isso
mostra essas cinco como Luteria Orgânica. A regra está em `TRILHAS`, no
importador. Corrigir a planilha na origem resolveria a divergência.

A mesma planilha tem a coluna de resultado esperado desalinhada — ver acima, em
"O resultado esperado não é importado".

## A agenda no Google Calendar

O site oferece dois botões para o aluno assinar a agenda pública
**Bongarbit - Escola de Luteria - Alunos**: um para o Google Agenda (o link
`cid=`) e outro com o `.ics` público, que serve para iPhone, Outlook e o resto.
Os dois saem do mesmo ID, montado em `app/page.tsx` — não há link colado à mão.

O `.ics` público baixa sem autenticação, o que permite conferir a agenda contra
a planilha:

```sh
curl -s "https://calendar.google.com/calendar/ical/<ID>/public/basic.ics"
```

### Sincronizar a agenda com o site

`scripts/sincronizar_agenda.py` reconcilia a agenda com o `calendario.json`. O
site é a fonte; o script **corrige eventos que já existem** e **apaga** os dias
que no site são "não haverá aula" — a agenda mostra só o que tem aula. Ele nunca
cria eventos. Ele mexe em título, local e nas linhas da descrição que conhece
(`Sobre`, `Trilha`, `Fase/etapa`, `Local`, `Participantes/equipe`,
`Etapa/resultado`), preservando qualquer outra linha. O `Etapa/resultado`
continua listado só para ser **apagado** dos eventos que ainda o carregam. Horário e duração ficam
como estão, com uma exceção declarada em `MUDANCAS`: a mudança de data do
Café (5).

```sh
# simulação, não grava nada
python3 scripts/sincronizar_agenda.py --token ~/.config/bongarbit/token.json

# aplicar
python3 scripts/sincronizar_agenda.py --token ~/.config/bongarbit/token.json --aplicar
```

**Nem o token nem o client secret podem morar neste repositório** — ele é
público e vai inteiro para a Vercel. Guarde-os fora, como em
`~/.config/bongarbit/`.

### Usar com outra agenda e outras credenciais

Nada de agenda está preso ao código: o ID entra por `--agenda` e a credencial
por `--token` ou `--credenciais`. Quem clonar este repositório para outra escola
faz assim.

**1. Ative a API do Calendar.** No [Google Cloud
Console](https://console.cloud.google.com/), crie um projeto (ou escolha um) e
ative a **Google Calendar API** em *APIs e serviços > Biblioteca*.

**2. Crie a credencial.** Em *APIs e serviços > Credenciais*, clique em *Criar
credenciais > ID do cliente OAuth* e escolha o tipo **App para computador**.
Baixe o JSON — é o *client secret*. Guarde-o fora do repositório:

```sh
mkdir -p ~/.config/minha-escola
mv ~/Downloads/client_secret_*.json ~/.config/minha-escola/credenciais.json
```

Se a tela de consentimento pedir configuração, marque o app como **Externo** e
adicione seu e-mail em *Usuários de teste* — não é preciso publicar o app nem
passar por verificação para uso próprio.

**3. Descubra o ID da agenda.** No Google Agenda, abra *Configurações da
agenda > Integrar agenda* e copie o **ID da agenda**. Numa agenda de grupo ele
tem a forma `…@group.calendar.google.com`; na agenda pessoal, é o seu e-mail.

**4. Autorize uma vez.** O script abre o navegador e grava o token no caminho
que você passar em `--token`:

```sh
python3 scripts/sincronizar_agenda.py \
  --credenciais ~/.config/minha-escola/credenciais.json \
  --token ~/.config/minha-escola/token.json \
  --agenda SEU_ID@group.calendar.google.com
```

Nas vezes seguintes, só `--token` e `--agenda`: o token se renova sozinho
enquanto o refresh token valer.

**5. Confira antes de gravar.** Sem `--aplicar` o script só mostra o que faria.
**Rode assim primeiro, sempre** — ele apaga eventos, e a conta precisa ter
permissão de *Fazer alterações nos eventos* na agenda.

```sh
python3 scripts/sincronizar_agenda.py \
  --token ~/.config/minha-escola/token.json \
  --agenda SEU_ID@group.calendar.google.com

# convencido? repita com --aplicar
```

**6. Ajuste o site.** O botão "Adicionar ao Google Agenda" monta o link a partir
de `ID_AGENDA`, em `app/page.tsx`. Troque por lá — o `cid` e o `.ics` saem do
mesmo ID, sem link colado à mão.

Uma ressalva que vale para qualquer fork: `MUDANCAS`, `AJUSTES`, `FERIADOS` e as
demais constantes descrevem **esta** escola. Esvazie-as antes de apontar o
script para outra agenda, senão ele tentará mover datas que não existem.

Duas notas sobre o pareamento, que é por data:

- Os títulos na agenda trazem o texto longo depois dos dois-pontos ("Café com
  Bongarbit (4): Evento aberto ao público…"). O site separa os dois, então ao
  encurtar o título o script move esse texto para a linha `Sobre` da descrição.
- Os eventos da Trilha Empreendedora vieram com as colunas deslocadas na
  descrição (`Participantes/equipe: CACGB`, `Etapa/resultado: João, Thúlio…`).
  O script reescreve os campos que governa e apaga o `Etapa/resultado`, que na
  origem era texto de luteria.

### Conferência de 20/09/2026

Os horários da agenda estão em UTC: `21:00Z` é **18h em Recife**. As aulas são
de 3h (18h–21h) e os Cafés de 4h (16h–20h), o que bate com a planilha. Das 41
entradas de setembro em diante, 41 existem dos dois lados, nas mesmas datas,
com três exceções:

| Onde | Google Calendar | Planilha e site |
|---|---|---|
| 16/09 e 21/09 | as duas dizem *Tambor Falante — Aula 5 (extra)* | *Aula 5* e *Aula 6* |
| Café (5) | **21/11**, "Especial **Dia** da Consciência Negra", no CACGB | **07/11**, "Café com Bongarbit (5)", na Aldeia Povo Marikito |
| Show de Culminância | 3h (09h–12h) | 10h |

A divergência que importa é a do Café (5): **duas semanas de diferença**. A
coordenação confirmou **07/11**, que é o que o site mostra — quem precisa ser
corrigida é a agenda do Google, e junto com a data vão o nome e o local novos.
As outras duas divergências são de rótulo e de duração.

A agenda também foi gerada a partir da planilha antes das correções de equipe, e
por isso as descrições dos eventos ainda trazem *"Participantes/equipe: João,
Thúlio, Educadores e Monitores"* e a mesma troca de trilha descrita abaixo. O
site mostra os professores certos; a agenda, não. O mesmo vale para os locais:
a agenda ainda põe os encontros da Trilha Empreendedora no CACGB.

## Como se lê

- **Duas vistas.** *Lista* é a leitura corrida, um encontro por linha. *Calendário*
  é a grade do mês; cada dia com encontro vira botão e abre o detalhe embaixo da
  grade. No celular a grade mostra só a faixa de cor — sete colunas não cabem com
  texto.
- **Faixa colorida** à esquerda: a trilha. Verde Baobá para Luteria Orgânica,
  Azul Caixas d'Água para Luteria Digital, Amarelo Ocre para a Trilha
  Empreendedora, Terracota para os Eventos Abertos.
- **Dias sem aula** aparecem em cinza, sem etiqueta — são informação útil.
- O que já passou some por padrão; há um botão para trazer de volta.

## Design

Segue [`design.md`](design.md), o guia visual do Bongarbit: papel envelhecido
`#ead6bf`, The Mix Mono, cantos retos, sombra sólida deslocada, sem emoji.

Três coisas foram adaptadas, porque o `design.md` foi escrito para uma
ferramenta pessoal de uma pessoa só:

1. **Sem sidebar.** O guia prescreve uma coluna fixa de navegação; aqui há uma
   tela só, e um cabeçalho basta.
2. **Trilhas no lugar dos estados de trabalho.** Os sete estados (Rascunho,
   Travado…) são vocabulário da tese. Aqui as quatro trilhas cumprem o papel de
   cor semântica, usando a mesma paleta.
3. **Voz para os alunos, não operacional.** O guia pede primeira pessoa e
   linguagem de trabalho; este site fala com quem vai à aula.

O que não foi adaptado: nenhuma marca, logo ou assinatura institucional aparece.
Se este site precisar de régua de patrocinadores ou selo do MinC, isso é uma
decisão a tomar — os assets não estão aqui.
