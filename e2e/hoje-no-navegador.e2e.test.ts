import { readFileSync } from "node:fs";
import puppeteer, { type Browser, type Page } from "puppeteer";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { type Site, subirSite } from "./site-estatico";

/**
 * O build é de um dia e o site é aberto noutro — o caso de quando o agendamento
 * do GitHub Actions atrasa ou pula a reconstrução. O build roda com a data real
 * (sem CALENDARIO_HOJE_TESTE) e o relógio do Chromium é adiantado para uma aula
 * futura: a página tem que trocar o "hoje" do build pelo do navegador.
 */

type Aula = { data: string; diaDaSemana: string; semAula: boolean };

const aulas = (
  JSON.parse(
    readFileSync(
      new URL("../content/calendario.json", import.meta.url),
      "utf-8",
    ),
  ) as { meses: { itens: Aula[] }[] }
).meses.flatMap((m) => m.itens);

const hojeReal = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Recife",
}).format(new Date());

// Uma aula de segunda ou quarta (tem convite) depois de amanhã, para o build
// e o navegador discordarem sobre "hoje" e sobre o próximo encontro.
const futura = aulas.find(
  (a) =>
    a.data > hojeReal &&
    !a.semAula &&
    (a.diaDaSemana === "Seg" || a.diaDaSemana === "Qua") &&
    aulas.some((b) => b.data > hojeReal && b.data < a.data && !b.semAula),
);

const PORTA = 3921;

describe.skipIf(!futura)("Hoje no navegador, build de outro dia", () => {
  let site: Site;
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    site = await subirSite(PORTA, null);
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    page = await browser.newPage();
    // Meio-dia em Recife (UTC-3) na data da aula futura.
    const agora = Date.parse(`${futura?.data}T15:00:00Z`);
    await page.evaluateOnNewDocument((alvo: number) => {
      const desvio = alvo - Date.now();
      const Original = Date;
      class Falso extends Original {
        constructor(...args: unknown[]) {
          if (args.length === 0) super(Original.now() + desvio);
          // @ts-expect-error repassa os argumentos como vieram
          else super(...args);
        }
        static now() {
          return Original.now() + desvio;
        }
      }
      globalThis.Date = Falso as DateConstructor;
    }, agora);
    await page.goto(`http://localhost:${PORTA}/`, {
      waitUntil: "networkidle0",
    });
  }, 120_000);

  afterAll(async () => {
    await browser?.close();
    await site?.fechar();
  });

  it("o HTML do build ainda aponta outro dia como próximo encontro", () => {
    const html = readFileSync(
      new URL(`../.e2e-${PORTA}/index.html`, import.meta.url),
      "utf-8",
    );
    const dia = html.match(/proxima__dia">(\d+)</)?.[1];
    expect(Number(dia)).not.toBe(Number(futura?.data.slice(8, 10)));
  });

  it("o navegador mostra a aula de hoje no destaque, com convite", async () => {
    await page.waitForFunction(
      () =>
        document
          .querySelector(".proxima .olho")
          ?.textContent?.includes("é hoje"),
      { timeout: 10_000 },
    );
    const dia = await page.$eval(".proxima__dia", (el) => el.textContent);
    expect(Number(dia)).toBe(Number(futura?.data.slice(8, 10)));
    const botao = await page.$(
      "xpath/.//button[normalize-space()='Visualizar convite']",
    );
    expect(botao).not.toBeNull();
  });
});
