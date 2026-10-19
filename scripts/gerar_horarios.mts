// O site é estático e o navegador não pode buscar o .ics (o Google não manda
// CORS): este script baixa o .ics público e grava public/horarios.json, o mapa
// data -> horário que o site lê. Roda antes do dev e do build. Se a busca
// falhar, não grava nada: o site mostra o "!" de erro.
import { mkdirSync, writeFileSync } from "node:fs";
import { AGENDA_ICS, buscarHorarios } from "../lib/agenda.ts";

const r = await buscarHorarios(AGENDA_ICS);
if (!r.ok) {
  console.warn("Não foi possível buscar a agenda; horarios.json não gerado.");
} else {
  mkdirSync("public", { recursive: true });
  writeFileSync(
    "public/horarios.json",
    JSON.stringify(Object.fromEntries(r.horarios)),
  );
  console.log(`horarios.json: ${r.horarios.size} datas`);
}
