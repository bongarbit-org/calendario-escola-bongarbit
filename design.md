# design.md — Identidade visual do Bongarbit

Guia da linguagem visual do Bongarbit para qualquer interface ou peça nova: sites, ferramentas, cartões. Fica na raiz do projeto e quem for construir segue estas regras. Exemplos específicos deste repositório (o calendário da escola) aparecem marcados como "no calendário".

---

## A ideia

**Impresso, não tela.** Papel envelhecido, tinta preta, cantos retos, filete, sombra sólida. A referência mental é o **caderno de campo e a ficha de arquivo**, com a xilogravura e o baobá do Bongarbit ao fundo — não o dashboard de startup.

Três coisas decorrem disso:

1. **Calor e ofício.** Tons de terra, textura de papel, tipografia monoespaçada que parece máquina de escrever. Nada de gradiente frio, vidro ou brilho.
2. **Clareza antes de enfeite.** A informação vem em fichas, filetes e etiquetas. A decoração (xilogravura, moldura) é rara e fica em peças de divulgação, não em telas de uso diário.
3. **Densidade proporcional ao uso.** Peça impressa respira; interface de consulta mostra muita informação de uma vez. A escala tipográfica da interface é menor e o espaçamento mais apertado que a de um cartaz.

---

## Tokens

```css
:root{
  /* Terra — estruturais */
  --preto-grafite:#161512;
  --verde-musgo:#1e2c1a;
  --marrom-terra:#6b3c23;
  --terracota-queimada:#b14826;

  /* Acentos */
  --ocre-cabaca:#d4752d;
  --amarelo-ocre:#d0962d;
  --verde-baoba:#31671f;
  --azul-caixa-dagua:#376182;

  /* Superfície */
  --areia:#d3ad84;
  --papel:#ead6bf;
  --papel-claro:#f4e8da;
  --papel-sombra:#dfc7ab;

  /* Tinta diluída */
  --grafite-70:rgba(22,21,18,.7);
  --grafite-45:rgba(22,21,18,.45);
  --grafite-18:rgba(22,21,18,.18);
  --grafite-08:rgba(22,21,18,.08);

  /* Semântica — superfícies */
  --surface-page:var(--papel);
  --surface-panel:var(--papel-claro);   /* menus, painéis */
  --surface-card:var(--papel-claro);
  --surface-sunken:var(--papel-sombra); /* campos, linhas alternadas */
  --surface-inverse:var(--preto-grafite);

  /* Semântica — texto */
  --text-strong:var(--preto-grafite);
  --text-body:var(--grafite-70);
  --text-muted:var(--grafite-45);
  --text-on-inverse:var(--papel);
  --text-accent:var(--terracota-queimada);
  --text-link:var(--terracota-queimada);
  --text-link-hover:var(--ocre-cabaca);

  /* Linhas */
  --border-rule:var(--preto-grafite);
  --border-hairline:var(--grafite-18);
  --border-inverse:rgba(234,214,191,.28);
  --rule-hair:1px;
  --rule-thick:3px;

  /* Ação */
  --action-primary:var(--terracota-queimada);
  --action-primary-hover:#993d20;
  --action-primary-active:#7f321a;
  --focus-ring:var(--azul-caixa-dagua);

  /* Tipografia — escala de interface */
  --font-core:"The Mix Mono", ui-monospace, "SF Mono", Menlo, Consolas, monospace;
  --fw-light:300; --fw-regular:400; --fw-semibold:600; --fw-bold:700; --fw-black:900;
  --fs-page-title:30px;   /* título da tela */
  --fs-h2:22px;           /* título de seção */
  --fs-h3:17px;           /* título de card */
  --fs-body:15px;
  --fs-small:13px;
  --fs-caption:12px;
  --fs-micro:11px;        /* rótulos, etiquetas, metadados */
  --lh-heading:1.2;
  --lh-body:1.5;
  --lh-dense:1.35;        /* tabelas e listas */
  --ls-body:0.01em;
  --ls-eyebrow:0.18em;    /* rótulos e etiquetas */

  /* Espaço — base 8 com meio-passo */
  --space-1:4px; --space-2:8px; --space-3:12px; --space-4:16px; --space-5:24px;
  --space-6:32px; --space-7:48px; --space-8:64px;
  --content-max:1080px;
  --reading-max:680px;    /* texto corrido */
  --gutter:clamp(16px,3vw,40px);

  /* Forma */
  --radius-none:0;
  --shadow-print:3px 3px 0 var(--grafite-18);
  --shadow-print-strong:5px 5px 0 var(--preto-grafite);
  --frame-double:inset 0 0 0 1px var(--preto-grafite), inset 0 0 0 5px var(--papel), inset 0 0 0 6px var(--preto-grafite);

  /* Movimento */
  --ease-standard:cubic-bezier(.2,.6,.2,1);
  --dur-fast:120ms; --dur-base:200ms;
}

body{
  margin:0;
  background:var(--surface-page);
  color:var(--text-strong);
  font-family:var(--font-core);
  font-size:var(--fs-body);
  line-height:var(--lh-body);
  letter-spacing:var(--ls-body);
}
a{color:var(--text-link);text-decoration:underline;text-underline-offset:3px;text-decoration-thickness:1px;transition:color var(--dur-fast) var(--ease-standard)}
a:hover{color:var(--text-link-hover)}
::selection{background:var(--amarelo-ocre);color:var(--preto-grafite)}
:focus-visible{outline:2px solid var(--focus-ring);outline-offset:2px}
```

### Tipografia

**The Mix Mono** em tudo. A monoespaçada alinha números, datas e horários em colunas sem recurso extra e dá a cara de ficha datilografada.

Os OTF estão em `public/fonts/` (Light 300, Regular 400 + itálico, SemiBold 600, Bold 700, Black 900). Declare `@font-face` para os pesos usados. Sem os arquivos, cai na stack monoespaçada do sistema — nunca substitua por Inter, Roboto ou sans genérica.

Texto corrido longo cansa em monoespaçada: mantenha-o em `--reading-max` (680px) e com `line-height` generoso. Se um projeto precisar de uma serifada para leitura longa, use **uma só** e só no corpo do texto; toda a moldura (navegação, rótulos, tabelas, estados) continua em The Mix Mono.

---

## Regras que não se quebram

1. **Raio 0 em tudo.** Única exceção: o radio button.
2. **Sombra sólida deslocada, nunca blur.** É papel sobre papel.
3. **O fundo é Papel `#ead6bf`, nunca branco puro.**
4. **Sem emoji.** O estado ou a categoria é cor + palavra, não bolinha colorida com carinha.
5. **Não invente cores.** A paleta acima cobre o vocabulário; uma categoria nova ganha uma cor **ainda não usada** dela, nunca um tom novo.
6. **Sem gradiente decorativo, sem blur, sem glassmorphism, sem `backdrop-filter`.** (Gradiente de papel em peça de divulgação, como o fundo dos cartões, é do impresso e fica fora desta regra.)
7. **Cor carrega significado.** Cada cor identifica uma categoria ou estado e mantém esse papel em toda a interface. Cor não é enfeite.
8. **Ilustração é rara.** Uma xilogravura num estado vazio ou numa peça de divulgação; nunca um baobá em cada tela.
9. **Logo só em peça pública.** Cartões, cartazes e cabeçalhos de divulgação levam a marca; telas de uso diário não repetem logo em toda página.
10. **Sem assinatura institucional** (patrocinadores, chamadas de edital) em interface de uso. Isso pertence às peças públicas do projeto.

---

## Cor semântica

Quando há categorias (trilhas, tipos de evento, estados), cada uma recebe **uma cor fixa da paleta**, usada igual em etiqueta, filete, barra e grade. Escolha uma cor que ainda não tenha papel.

No calendário, as trilhas são:

| Trilha | Cor |
|---|---|
| Luteria Orgânica | `--verde-baoba` |
| Luteria Digital | `--azul-caixa-dagua` |
| Trilha Empreendedora | `--amarelo-ocre` |
| Eventos Abertos | `--terracota-queimada` |
| Projeto Formação de Agentes Culturais | `--marrom-terra` |
| Sem aula, feriado | `--grafite-45` |

Uma trilha nova entra em `TRILHAS` e `CORES` de `scripts/importar.py` (ver `CLAUDE.md`).

### Etiqueta

Retângulo reto, caixa alta, 11px, tracking 0.18em, filete de 1px em tinta, fundo na cor da categoria.

```jsx
<span style={{
  display:"inline-block", padding:"3px 9px",
  fontSize:"var(--fs-micro)", fontWeight:"var(--fw-semibold)",
  letterSpacing:"var(--ls-eyebrow)", textTransform:"uppercase",
  border:"1px solid var(--border-rule)", borderRadius:0,
  background:"var(--verde-baoba)", color:"var(--papel)"
}}>Luteria Orgânica</span>
```

Sobre Amarelo Ocre e Areia o texto vai em `--preto-grafite`; nos demais, em `--papel`. Nome de categoria longo precisa quebrar linha no celular — confira a largura de 390px.

---

## Componentes

### Menu lateral
Coluna fixa em Papel Claro, separada por filete de 1px em tinta. Itens em caixa alta 11px com tracking; o ativo recebe **filete grosso de 3px em Terracota na borda esquerda** e texto em tinta cheia — o mesmo gesto do sublinhado das abas, virado na vertical.

```jsx
<nav style={{width:252,background:"var(--surface-panel)",borderRight:"1px solid var(--border-rule)",height:"100vh",position:"sticky",top:0,display:"flex",flexDirection:"column",gap:"var(--space-1)",padding:"var(--space-5) 0"}}>
  <a href="#" style={{padding:"9px var(--space-5)",borderLeft:"var(--rule-thick) solid var(--terracota-queimada)",fontSize:"var(--fs-micro)",fontWeight:"var(--fw-semibold)",letterSpacing:"var(--ls-eyebrow)",textTransform:"uppercase",color:"var(--text-strong)",textDecoration:"none"}}>Início</a>
  <a href="#" style={{padding:"9px var(--space-5)",borderLeft:"var(--rule-thick) solid transparent",fontSize:"var(--fs-micro)",fontWeight:"var(--fw-semibold)",letterSpacing:"var(--ls-eyebrow)",textTransform:"uppercase",color:"var(--text-muted)",textDecoration:"none"}}>Calendário</a>
</nav>
```

### Linha de ficha
Para listas de itens (aulas, entradas, arquivos): **linha de ficha**, não card. Numeração ou data monoespaçada, título, etiqueta, metadados. Separadas por filete hairline; indentação por `padding-left`.

```jsx
<div style={{display:"grid",gridTemplateColumns:"56px 1fr 110px 90px",gap:"var(--space-4)",alignItems:"center",padding:"11px var(--space-4)",borderBottom:"1px solid var(--border-hairline)",lineHeight:"var(--lh-dense)"}}>
  <span style={{fontSize:"var(--fs-small)",color:"var(--text-muted)"}}>19/10</span>
  <span style={{fontSize:"var(--fs-body)"}}>Encontro da Trilha Empreendedora</span>
  <span style={{fontSize:"var(--fs-micro)",textTransform:"uppercase",letterSpacing:"var(--ls-eyebrow)"}}>Etiqueta</span>
  <span style={{fontSize:"var(--fs-small)",color:"var(--text-body)",textAlign:"right"}}>3h</span>
</div>
```

Hover: fundo `--grafite-08`. Nada de sombra, nada de elevação.

### Card / ficha
Quando o conteúdo é um bloco só: Papel Claro, filete de 1px em tinta, sombra impressa de 3px e, se quiser marcar a categoria, **filete grosso de 3px no topo** na cor dela.

```jsx
<article style={{background:"var(--surface-card)",border:"1px solid var(--border-rule)",borderTop:"var(--rule-thick) solid var(--marrom-terra)",boxShadow:"var(--shadow-print)",padding:"var(--space-5)"}}>
  <div style={{fontSize:"var(--fs-micro)",fontWeight:"var(--fw-semibold)",letterSpacing:"var(--ls-eyebrow)",textTransform:"uppercase",color:"var(--text-accent)"}}>Quarta · 21/10</div>
  <h3 style={{fontSize:"var(--fs-h3)",fontWeight:"var(--fw-bold)",margin:"var(--space-2) 0 0"}}>Título do encontro</h3>
  <div style={{fontSize:"var(--fs-small)",color:"var(--text-body)",marginTop:"var(--space-3)",maxWidth:"var(--reading-max)"}}>…</div>
</article>
```

### Barra de progresso
Retângulo reto com filete em tinta, preenchido na cor da categoria. Sem cantos arredondados, sem animação de brilho.

```jsx
<div style={{height:14,border:"1px solid var(--border-rule)",background:"var(--papel-sombra)"}}>
  <div style={{height:"100%",width:"62%",background:"var(--verde-baoba)"}} />
</div>
```

Para progresso composto, use uma **faixa segmentada**: blocos lado a lado nas cores das categorias, separados por filete de 1px. Lê-se como régua de impressor.

### Botão
Caixa alta, tracking 0.18em, cantos retos, filete de 1px, sombra impressa de 3px. Tamanho padrão `sm`; reserve `md` para a ação principal da tela.

```jsx
<button style={{display:"inline-flex",alignItems:"center",gap:"var(--space-2)",font:"inherit",fontSize:"var(--fs-micro)",fontWeight:"var(--fw-semibold)",letterSpacing:"var(--ls-eyebrow)",textTransform:"uppercase",padding:"8px 14px",border:"1px solid var(--border-rule)",borderRadius:0,background:"var(--action-primary)",color:"var(--papel)",boxShadow:"var(--shadow-print)",cursor:"pointer"}}>Adicionar</button>
```

Variantes: **primary** (Terracota) · **secondary** (Papel Claro / tinta) · **ghost** (transparente).

### Campos
Fundo Papel Claro, filete de 1px em tinta, `padding:11px 13px`, cantos retos. Label em caixa alta 11px acima. O checkbox marca com **×** de tinta, como formulário preenchido à mão. O radio é o único elemento redondo do sistema.

### Estado vazio
O lugar natural da ilustração: uma xilogravura pequena (máx. 180px) do kit, texto curto em `--text-muted` e, se couber, uma ação. Um por tela, nunca mais.

---

## Layout

- **Coluna de conteúdo** com `max-width: 1080px`; texto corrido em `--reading-max: 680px`. Menu lateral só quando a navegação pedir.
- Linhas de tabela em ~40px; seções separadas por `--space-6`.
- Sempre **flex/grid com `gap`**.
- **Cabeçalho de tela** = olho em caixa alta + título + ação à direita, sobre filete grosso. Sem hero, sem imagem de topo.
- Tabelas e listas ganham filete hairline entre linhas; alternância de fundo só acima de ~15 linhas, com `--papel-sombra`.
- Funciona a 390px de largura, sem rolagem lateral.

## Estados de interação

- **Hover:** fundo `--grafite-08` em linhas; nos botões, escurece o pigmento (`#b14826` → `#993d20`).
- **Press:** `translate(2px,2px)` — o elemento entra na própria sombra. O gesto de carimbar.
- **Focus:** contorno 2px Azul Caixas d'Água, offset 2px.
- **Disabled:** opacidade 0.4, `cursor:not-allowed`.
- **Selecionado:** inverte para tinta cheia (fundo Preto Grafite, texto Papel).

## Animação

Discreta e mecânica: `cubic-bezier(.2,.6,.2,1)`, 120–200ms. Só cor, posição curta e toggle. **Sem bounce, sem parallax, sem fade-in de scroll, sem confete.**

## Iconografia

**Lucide** via CDN, traço 1.5–2px, `currentColor`. Só onde o texto não resolve: navegação, expandir/colapsar, link externo. Emoji nunca. Unicode só no `×` do checkbox e no `×` de fechar.

---

## Voz

- **Rótulos:** substantivo curto em caixa alta — CALENDÁRIO, PRÓXIMO ENCONTRO, LOCAL.
- **Texto de interface:** direto e operacional. Frase única nos estados vazios, sem entusiasmo fabricado ("Nenhum encontro neste mês.", não "Que tal explorar o calendário?").
- **Datas:** pt-BR, `12/09`. Relativas só quando recentes ("hoje", "em 3 dias"), absolutas depois disso.
- **Números:** vírgula decimal, ponto como separador de milhar (`4.210`).
- **Sem gamificação.** Nenhum streak, medalha ou "parabéns".
- **Poesia na medida.** O vocabulário do Bongarbit (raiz, terreiro, ancestralidade) cabe em peças públicas e de divulgação. Em tela de consulta a linguagem é a do uso: data, local, horário, quem conduz.

---

## Assets

Neste repositório:

```
public/fonts/                            The Mix Mono, 7 pesos — essencial (cópia em assets/fonts/)
public/img/cartao/                       logos e faixa-vila, só no convite do dia
```

O kit completo do Bongarbit tem ainda textura de papel (`paper-texture.png`) e xilogravuras para estados vazios; não estão aqui. Se um projeto precisar delas, copie só 1 ou 2, não a pasta toda.

**Não copie** para um projeto novo: réguas de patrocinadores, logos de parceiros (Fab Lab Rec etc.) sem autorização, submarcas (Café com Bongarbit, Circula), templates de certificado e timbrado. O que se herda é a linguagem visual; a marca só entra onde faz sentido.
