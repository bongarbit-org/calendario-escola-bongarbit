import { readFileSync } from "node:fs";
import puppeteer, { type Browser, type Page } from "puppeteer";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { type Site, subirSite } from "./site-estatico";

/**
 * Strings de todos os tamanhos, em telas de todos os tamanhos. O site roda
 * sobre e2e/fixtures/calendario-strings.json — títulos de uma letra e de três
 * linhas, palavras sem espaço, URL, emoji, trilha com nome enorme, campos nulos
 * — num build estático à parte (ver next.config.mjs). Em cada resolução,
 * todo texto tem que estar na página, dentro da tela e dentro do próprio
 * cartão: nada de rolagem lateral, nada vazando, nada cortado por overflow.
 */

const FIXTURE = "./e2e/fixtures/calendario-strings.json";
const PORTA = 3914;
// Antes de toda aula do fixture: tudo aparece como futuro, nada fica escondido
// atrás de "mostrar o que passou".
const HOJE = "2026-10-01";

type Aula = {
  data: string;
  titulo: string;
  descricao: string | null;
  topico: string | null;
  trilha: string;
  local: string | null;
  equipe: string | null;
  semAula: boolean;
};
type Calendario = { trilhas: { nome: string }[]; meses: { itens: Aula[] }[] };

const calendario = JSON.parse(
  readFileSync(
    new URL("fixtures/calendario-strings.json", import.meta.url),
    "utf-8",
  ),
) as Calendario;
const aulas = calendario.meses.flatMap((m) => m.itens);

// O horário real vem do horarios.json gerado no build a partir do .ics do
// Google — aqui é interceptado, para que as datas do fixture tenham horário e
// com textos de tamanhos variados.
const HORARIOS: Record<string, string> = {
  "2026-10-02": "das 8h30 às 12h e das 14h às 17h45",
  "2026-10-05": "9h",
  "2026-10-07": "18h às 21h",
  "2026-10-10": "8h às 12h",
  "2026-11-04": "18h às 21h",
};

// Tudo que o fixture põe na tela pela lista. Equipe e local de dia sem aula
// não aparecem de propósito (ver LinhaDaAula), então ficam de fora.
const STRINGS = [
  ...aulas.flatMap((a) => [
    a.titulo,
    a.descricao,
    a.topico,
    a.semAula ? null : a.trilha,
    a.semAula ? null : a.local,
    a.semAula ? null : a.equipe,
  ]),
  ...Object.values(HORARIOS),
].filter((s): s is string => !!s);

const RESOLUCOES = [
  { nome: "celular pequeno (320×568)", width: 320, height: 568, mobile: true },
  { nome: "Galaxy A55 (360×800)", width: 360, height: 800, mobile: true },
  { nome: "iPhone SE (375×667)", width: 375, height: 667, mobile: true },
  { nome: "iPhone Pro Max (430×932)", width: 430, height: 932, mobile: true },
  { nome: "tablet (768×1024)", width: 768, height: 1024, mobile: true },
  { nome: "notebook (1280×800)", width: 1280, height: 800, mobile: false },
  { nome: "desktop (1920×1080)", width: 1920, height: 1080, mobile: false },
];

/**
 * Percorre cada nó de texto visível de <main> e devolve o que está errado:
 * texto fora da tela, fora do cartão a que pertence, ou cortado por um
 * ancestral com overflow. A marca da grade (`.grade__marca-texto`) corta com
 * reticências de propósito — o título inteiro está no `title` da célula e no
 * detalhe que abre ao tocar —, então fica de fora.
 */
function problemasDeLayout(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const larguraDaTela = document.documentElement.clientWidth;
    const problemas: string[] = [];
    const folga = 0.5;

    const andarilho = document.createTreeWalker(
      document.querySelector("main")!,
      NodeFilter.SHOW_TEXT,
    );
    for (let no = andarilho.nextNode(); no; no = andarilho.nextNode()) {
      const texto = no.textContent!.trim();
      const el = no.parentElement!;
      if (!texto || el.closest(".grade__marca-texto")) continue;

      const intervalo = document.createRange();
      intervalo.selectNodeContents(no);
      const caixas = Array.from(intervalo.getClientRects()).filter(
        (r) => r.width > 0,
      );
      if (caixas.length === 0) continue; // escondido (display:none em algum ancestral)

      const esquerda = Math.min(...caixas.map((r) => r.left));
      const direita = Math.max(...caixas.map((r) => r.right));
      const trecho = `"${texto.length > 40 ? `${texto.slice(0, 40)}…` : texto}"`;

      if (esquerda < -folga || direita > larguraDaTela + folga) {
        problemas.push(
          `${trecho} sai da tela (${Math.round(esquerda)}–${Math.round(direita)}px, tela de ${larguraDaTela}px)`,
        );
      }

      const cartao = el.closest(
        ".proxima, .assinar, .aula, .grade__dia, .botao, .etiqueta",
      );
      if (cartao) {
        const c = cartao.getBoundingClientRect();
        if (esquerda < c.left - folga || direita > c.right + folga) {
          problemas.push(
            `${trecho} vaza de .${cartao.classList[0]} (${Math.round(esquerda)}–${Math.round(direita)}px, cartão em ${Math.round(c.left)}–${Math.round(c.right)}px)`,
          );
        }
      }

      for (
        let a: Element | null = el;
        a && a !== document.body;
        a = a.parentElement
      ) {
        if (getComputedStyle(a).overflowX === "visible") continue;
        const c = a.getBoundingClientRect();
        if (esquerda < c.left - folga || direita > c.right + folga) {
          problemas.push(
            `${trecho} é cortado pelo overflow de .${a.classList[0] ?? a.tagName.toLowerCase()}`,
          );
          break;
        }
      }
    }
    return problemas;
  });
}

const temRolagemLateral = (page: Page) =>
  page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth + 1,
  );

async function clicarPorTexto(page: Page, texto: string): Promise<void> {
  const achou = await page.evaluate((t) => {
    const btn = Array.from(document.querySelectorAll("button")).find(
      (b) => b.textContent?.trim() === t,
    );
    btn?.click();
    return !!btn;
  }, texto);
  if (!achou) throw new Error(`Botão "${texto}" não encontrado.`);
}

describe("Strings de tamanhos variados em várias resoluções (Chromium real)", () => {
  let site: Site;
  let browser: Browser;

  beforeAll(async () => {
    site = await subirSite(PORTA, HOJE, FIXTURE);
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  }, 120_000);

  afterAll(async () => {
    await browser?.close();
    await site?.fechar();
  });

  describe.each(RESOLUCOES)("$nome", ({ width, height, mobile }) => {
    let page: Page;

    beforeAll(async () => {
      page = await browser.newPage();
      await page.setViewport({
        width,
        height,
        isMobile: mobile,
        hasTouch: mobile,
        deviceScaleFactor: 2,
      });
      await page.setRequestInterception(true);
      page.on("request", (req) => {
        if (new URL(req.url()).pathname === "/horarios.json") {
          req.respond({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(HORARIOS),
          });
        } else {
          req.continue();
        }
      });
      await page.goto(`http://localhost:${PORTA}/`, {
        waitUntil: "networkidle0",
      });
      // O horário real chega depois da página — espera ele entrar para medir o layout final.
      await page.waitForFunction(
        (h) => document.querySelector(".proxima")?.textContent?.includes(h),
        {},
        HORARIOS["2026-10-02"],
      );
    }, 30_000);

    afterAll(() => page?.close());

    it("na lista, mostra todas as strings do calendário", async () => {
      const textoDaPagina = await page.$eval(
        "main",
        (el) => el.textContent ?? "",
      );
      const faltando = STRINGS.filter((s) => !textoDaPagina.includes(s));
      expect(faltando).toEqual([]);
    });

    it("na lista, nenhum texto sai da tela, vaza do cartão ou é cortado", async () => {
      expect(await problemasDeLayout(page)).toEqual([]);
      expect(await temRolagemLateral(page)).toBe(false);
    });

    it("no calendário, com um dia aberto, nenhum texto sai da tela, vaza ou é cortado", async () => {
      await clicarPorTexto(page, "Calendário");
      await page.waitForSelector(".grade");
      expect(await problemasDeLayout(page)).toEqual([]);
      expect(await temRolagemLateral(page)).toBe(false);

      // O dia 2, o de strings mais longas, abre o detalhe abaixo da grade.
      await page.$eval(".grade__dia--tem", (el) =>
        (el as HTMLButtonElement).click(),
      );
      await page.waitForSelector(".grade__detalhe .aula");
      expect(await problemasDeLayout(page)).toEqual([]);
      expect(await temRolagemLateral(page)).toBe(false);

      await clicarPorTexto(page, "Lista");
    });
  });
});
