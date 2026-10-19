import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, rmSync, statSync } from "node:fs";
import { createServer, type Server } from "node:http";
import { extname, join, normalize } from "node:path";

const RAIZ = new URL("..", import.meta.url).pathname;

const TIPOS: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".otf": "font/otf",
  ".txt": "text/plain; charset=utf-8",
};

export type Site = { fechar: () => Promise<void> };

/**
 * Gera o site estático com "hoje" fixado em `hoje` (CALENDARIO_HOJE_TESTE é lido
 * no build, quando a página é renderizada) e o serve na raiz de `porta`. Cada
 * porta tem a própria pasta de saída: dois builds não se atropelam e a data de
 * cada um fica travada. `NEXT_BASE_PATH=""` tira o prefixo do GitHub Pages.
 * O horarios.json vem de public/ (gerado por `npm run horarios` antes dos testes).
 */
export async function subirSite(porta: number, hoje: string): Promise<Site> {
  const saida = `.e2e-${porta}`;
  const pasta = join(RAIZ, saida);
  rmSync(pasta, { recursive: true, force: true });
  execFileSync("npx", ["next", "build"], {
    cwd: RAIZ,
    env: {
      ...process.env,
      NEXT_BASE_PATH: "",
      NEXT_DIST_DIR: saida,
      CALENDARIO_HOJE_TESTE: hoje,
    },
    stdio: "ignore",
  });

  const servidor: Server = createServer((req, res) => {
    const caminho = normalize(
      decodeURIComponent((req.url ?? "/").split("?")[0]),
    );
    let arquivo = join(pasta, caminho);
    if (!arquivo.startsWith(pasta)) {
      res.writeHead(403).end();
      return;
    }
    if (existsSync(arquivo) && statSync(arquivo).isDirectory())
      arquivo = join(arquivo, "index.html");
    if (!existsSync(arquivo)) {
      res.writeHead(404).end("não encontrado");
      return;
    }
    res.writeHead(200, {
      "content-type": TIPOS[extname(arquivo)] ?? "application/octet-stream",
    });
    res.end(readFileSync(arquivo));
  });
  await new Promise<void>((ok) => servidor.listen(porta, ok));

  return {
    fechar: () =>
      new Promise<void>((ok) => {
        servidor.closeAllConnections();
        servidor.close(() => {
          rmSync(pasta, { recursive: true, force: true });
          ok();
        });
      }),
  };
}
