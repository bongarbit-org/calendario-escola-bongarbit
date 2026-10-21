// O site é sempre estático (out/): vai para o GitHub Pages, que serve o projeto
// em /calendario-escola-bongarbit. No `next dev` o prefixo some, para abrir em
// localhost:3000. NEXT_BASE_PATH e NEXT_DIST_DIR existem para os testes e2e, que
// servem cada build na raiz e numa pasta própria.
const base =
  process.env.NEXT_BASE_PATH ??
  (process.env.NODE_ENV === "production" ? "/calendario-escola-bongarbit" : "");
// Só nos testes e2e (e2e/strings.e2e.test.ts): troca content/calendario.json por
// um calendário de mentira, com strings de todos os tamanhos. O JSON entra no
// bundle do cliente também, então a troca tem que ser no build.
const calendarioDeTeste = process.env.CALENDARIO_JSON_TESTE;

/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "export",
  images: { unoptimized: true },
  ...(base && { basePath: base }),
  ...(process.env.NEXT_DIST_DIR && { distDir: process.env.NEXT_DIST_DIR }),
  env: { NEXT_PUBLIC_BASE_PATH: base },
  ...(calendarioDeTeste && {
    turbopack: {
      resolveAlias: { "@/content/calendario.json": calendarioDeTeste },
    },
  }),
};
export default nextConfig;
