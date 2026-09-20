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

Há também uma aula de Berimbau (30/09) cujo resultado esperado fala do Tambor
Falante. Essa o site mostra como está — é texto, não classificação.

## Como se lê

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
