// GITHUB_PAGES=1 gera um site estático (out/) para o GitHub Pages, que mora em
// /calendario-escola-bongarbit. Sem a variável, é o build normal da Vercel.
const pages = process.env.GITHUB_PAGES === "1";
const base = pages ? "/calendario-escola-bongarbit" : "";

/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  ...(pages && {
    output: "export",
    basePath: base,
    images: { unoptimized: true },
  }),
  env: {
    NEXT_PUBLIC_BASE_PATH: base,
    NEXT_PUBLIC_ESTATICO: pages ? "1" : "0",
  },
};
export default nextConfig;
