/**
 * Prefixo das URLs de `public/` e do horário estático. Vazio na Vercel; no
 * GitHub Pages o site mora em /calendario-escola-bongarbit (ver next.config.mjs).
 */
export const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** No GitHub Pages não há servidor: o horário vem de um horarios.json gerado no build. */
export const ESTATICO = process.env.NEXT_PUBLIC_ESTATICO === "1";
