import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { spawn, type ChildProcess } from "node:child_process";
import { readFileSync } from "node:fs";
import puppeteer, { type Browser, type Page } from "puppeteer";

/**
 * E2E de verdade: sobe o build de produção do site, abre num Chromium headless
 * real e clica no botão "Visualizar convite" — inclusive a rasterização de @zumer/snapdom,
 * que o jsdom dos testes de componente não consegue exercitar (não há canvas
 * real ali). "Hoje" é fixado via CALENDARIO_HOJE_TESTE (lib/calendario.ts),
 * lendo datas reais de content/calendario.json para não depender do dia em
 * que o teste roda.
 */

type Aula = { data: string; diaDaSemana: string; semAula: boolean; titulo: string };
type Calendario = { meses: { itens: Aula[] }[] };

function todasAsAulas(): Aula[] {
  const json = JSON.parse(readFileSync(new URL("../content/calendario.json", import.meta.url), "utf-8")) as Calendario;
  return json.meses.flatMap((m) => m.itens);
}

function acharData(pred: (a: Aula) => boolean): string {
  const aula = todasAsAulas().find(pred);
  if (!aula) throw new Error("Nenhuma aula no content/calendario.json bate com o critério do teste e2e.");
  return aula.data;
}

// Uma aula real de segunda/quarta com aula de verdade — o botão deve aparecer aqui.
const DATA_COM_AULA = acharData((a) => (a.diaDaSemana === "Seg" || a.diaDaSemana === "Qua") && !a.semAula);
// Um feriado/dia sem aula que cai numa segunda ou quarta — o botão NÃO deve aparecer
// aqui, mesmo sendo "hoje" e sendo o dia certo da semana (é o caso que motivou a
// regra extra de !semAula no gate do botão).
const DATA_FERIADO_SEG_QUA = acharData((a) => (a.diaDaSemana === "Seg" || a.diaDaSemana === "Qua") && a.semAula);

/**
 * Clica pelo texto, de dentro da página. O `.click()` do Puppeteer mira em
 * coordenadas, e aqui o modal muda de altura quando o PNG recapturado entra no
 * lugar do anterior — entre calcular o ponto e clicar, o botão já saiu dali e o
 * clique cai no vazio. Chamar `.click()` no próprio elemento não tem esse risco.
 */
async function clicarPorTexto(page: Page, texto: string): Promise<void> {
  const achou = await page.evaluate((t) => {
    const btn = Array.from(document.querySelectorAll("button")).find(
      (b) => b.textContent?.trim() === t
    ) as HTMLButtonElement | undefined;
    if (!btn || btn.disabled) return false;
    btn.click();
    return true;
  }, texto);
  if (!achou) throw new Error(`Botão "${texto}" não encontrado ou desabilitado.`);
}

const PORTA_COM_AULA = 3911;
const PORTA_FERIADO = 3912;

async function subirServidor(porta: number, hoje: string): Promise<ChildProcess> {
  // `next dev` recusa rodar duas instâncias no mesmo diretório de projeto (mesmo em
  // portas diferentes) quando já há uma de pé — como a do preview do navegador usado
  // durante o desenvolvimento. `next start`, sobre o build de produção, não tem essa
  // trava, então é o que os testes e2e usam.
  const processo = spawn("npx", ["next", "start", "-p", String(porta)], {
    cwd: new URL("..", import.meta.url).pathname,
    env: { ...process.env, CALENDARIO_HOJE_TESTE: hoje },
    detached: true,
    stdio: "ignore",
  });

  const prazo = Date.now() + 45_000;
  while (Date.now() < prazo) {
    try {
      const r = await fetch(`http://localhost:${porta}/`);
      if (r.ok) return processo;
    } catch {
      // servidor ainda não subiu
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`Servidor de teste não respondeu na porta ${porta} a tempo.`);
}

function derrubarServidor(processo: ChildProcess) {
  if (processo.pid) {
    try {
      process.kill(-processo.pid, "SIGTERM");
    } catch {
      // já não existe
    }
  }
}

describe("CardDoDia — Chromium real, hoje é dia de aula", () => {
  let servidor: ChildProcess;
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    servidor = await subirServidor(PORTA_COM_AULA, DATA_COM_AULA);
    browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] });
    page = await browser.newPage();
    await page.goto(`http://localhost:${PORTA_COM_AULA}/`, { waitUntil: "domcontentloaded" });
  }, 60_000);

  afterAll(async () => {
    await browser?.close();
    if (servidor) derrubarServidor(servidor);
  });

  it("mostra o botão Visualizar convite", async () => {
    const botao = await page.waitForSelector("xpath/.//button[normalize-space()='Visualizar convite']");
    expect(botao).not.toBeNull();
  });

  // Um fluxo só, sequencial: clicar → gerar novamente → mudar horário. São passos
  // que dependem do estado deixado pelo anterior na mesma página; separar em vários
  // `it()` faz um passo lento (a rasterização real do snapDOM passa de 15s às vezes)
  // deixar o próximo already-assumindo-estado-pronto falhando em cascata.
  it(
    "clicar gera um PNG real; gerar novamente troca o texto; mudar horário atualiza tudo",
    async () => {
      const botao = await page.waitForSelector("xpath/.//button[normalize-space()='Visualizar convite']");
      await botao!.click();

      const img = await page.waitForSelector('img[alt="Card gerado"]', { timeout: 40_000 });
      const src = await img!.evaluate((el) => (el as HTMLImageElement).src);
      expect(src.startsWith("data:image/png;base64,")).toBe(true);
      expect(src.length).toBeGreaterThan(5_000); // uma captura real não é um PNG de 4 bytes

      const linhaAntes = await page.$eval("[class*='msg'] span:nth-of-type(2)", (el) => el.textContent);
      // O horário inicial agora vem de um fetch real ao .ics (lib/agenda.ts) — não é
      // mais sempre "18h às 21h". Extrai o que veio, para conferir que "gerar
      // novamente" troca só a frase, nunca o horário.
      const horarioInicial = linhaAntes?.match(/\d{1,2}h às \d{1,2}h/)?.[0];
      expect(horarioInicial).toBeTruthy();

      await clicarPorTexto(page, "Gerar novamente");
      await page.waitForFunction(
        (textoAntigo) => {
          const el = document.querySelector("[class*='msg'] span:nth-of-type(2)");
          return !!el && el.textContent !== textoAntigo;
        },
        { timeout: 40_000 },
        linhaAntes
      );
      const linhaDepois = await page.$eval("[class*='msg'] span:nth-of-type(2)", (el) => el.textContent);
      expect(linhaDepois).not.toBe(linhaAntes);
      expect(linhaDepois).toContain(horarioInicial);

      // O texto muda assim que se clica (é derivado do estado, não da captura), mas a
      // recaptura do PNG ainda está rolando em segundo plano — os botões de ação ficam
      // `disabled` enquanto isso. Clicar antes disso não faz nada (Puppeteer não dispara
      // clique em elemento desabilitado), então espera a captura terminar de verdade.
      await page.waitForFunction(
        () => {
          const btn = Array.from(document.querySelectorAll("button")).find(
            (b) => b.textContent?.trim() === "Mudar horário"
          );
          return !!btn && !(btn as HTMLButtonElement).disabled;
        },
        { timeout: 40_000 }
      );

      await clicarPorTexto(page, "Mudar horário");
      const campo = await page.waitForSelector("input[placeholder='Ex.: 8h às 12h']");
      await campo!.click({ count: 3 });
      await campo!.type("8h às 12h");
      await clicarPorTexto(page, "Aplicar");

      await page.waitForFunction(
        () => {
          const tarja = document.querySelector("[class*='tarja']");
          return !!tarja && tarja.textContent!.includes("8h às 12h");
        },
        { timeout: 40_000 }
      );
      const linhaFinal = await page.$eval("[class*='msg'] span:nth-of-type(2)", (el) => el.textContent);
      expect(linhaFinal).toContain("8h às 12h");
    },
    90_000
  );
});

describe("CardDoDia — Chromium real, hoje é feriado numa segunda/quarta", () => {
  let servidor: ChildProcess;
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    servidor = await subirServidor(PORTA_FERIADO, DATA_FERIADO_SEG_QUA);
    browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] });
    page = await browser.newPage();
    await page.goto(`http://localhost:${PORTA_FERIADO}/`, { waitUntil: "domcontentloaded" });
  }, 60_000);

  afterAll(async () => {
    await browser?.close();
    if (servidor) derrubarServidor(servidor);
  });

  it("não mostra o botão, mesmo sendo segunda/quarta, porque não há aula", async () => {
    const botoes = await page.$$("xpath/.//button[normalize-space()='Visualizar convite']");
    expect(botoes).toHaveLength(0);
  });
});
