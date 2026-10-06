import { NextResponse } from "next/server";
import { buscarHorarios, AGENDA_ICS } from "@/lib/agenda";

export const dynamic = "force-dynamic";

/**
 * Proxy same-origin para o .ics público: o navegador não pode buscá-lo direto
 * (o Google não manda cabeçalho CORS nessa resposta). O cliente chama esta
 * rota depois que a página já apareceu — nunca bloqueia o primeiro HTML.
 */
export async function GET() {
  const resultado = await buscarHorarios(AGENDA_ICS);
  if (!resultado.ok) {
    return NextResponse.json({ erro: "não foi possível buscar a agenda" }, { status: 502 });
  }
  return NextResponse.json(Object.fromEntries(resultado.horarios));
}
