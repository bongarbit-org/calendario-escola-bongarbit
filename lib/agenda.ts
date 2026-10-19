/**
 * Lê o horário real das aulas direto do .ics público da agenda — a única
 * leitura que este site faz da agenda do Google (CLAUDE.md §3: "a agenda nunca
 * é fonte" vale para content/calendario.json; isto é só para preencher um
 * campo de exibição que o JSON não tem, nunca grava nada de volta).
 */

// A agenda pública "Bongarbit - Escola de Luteria - Alunos", no Google Calendar.
// Único lugar a mudar se a agenda pública trocar de ID.
export const ID_AGENDA =
  "b066261daf2a5e9b5a30c0e7765f8e851572c5c5b31382976ae761f88e42bd1c@group.calendar.google.com";
export const AGENDA_GOOGLE = `https://calendar.google.com/calendar/u/0?cid=${Buffer.from(ID_AGENDA).toString("base64")}`;
// iPhone, Outlook e qualquer outro leitor de .ics assinam por aqui — e é o
// mesmo .ics de onde scripts/gerar_horarios.mts extrai o horário real.
export const AGENDA_ICS = `https://calendar.google.com/calendar/ical/${encodeURIComponent(ID_AGENDA)}/public/basic.ics`;

const TRES_HORAS_MS = 3 * 60 * 60 * 1000;

/** Um "YYYYMMDDTHHMMSS" em UTC (sem o "Z") -> data e hora no fuso de Recife (UTC-3, fixo). */
function paraRecife(dtUtc: string): { data: string; hora: number } {
  const ano = Number(dtUtc.slice(0, 4));
  const mes = Number(dtUtc.slice(4, 6));
  const dia = Number(dtUtc.slice(6, 8));
  const hora = Number(dtUtc.slice(9, 11));
  const minuto = Number(dtUtc.slice(11, 13));
  const instante = Date.UTC(ano, mes - 1, dia, hora, minuto);
  const recife = new Date(instante - TRES_HORAS_MS);
  const data = `${recife.getUTCFullYear()}-${String(recife.getUTCMonth() + 1).padStart(2, "0")}-${String(
    recife.getUTCDate(),
  ).padStart(2, "0")}`;
  return { data, hora: recife.getUTCHours() };
}

/**
 * Varre todos os VEVENT do .ics e monta um mapa data -> "18h às 21h". Ignora
 * eventos de dia inteiro (feriados, sem horário) e os "busy" de bloqueio.
 */
export function horariosPorData(icsTexto: string): Map<string, string> {
  const mapa = new Map<string, string>();
  const blocos = icsTexto.split("BEGIN:VEVENT").slice(1);

  for (const bloco of blocos) {
    const resumo =
      bloco
        .match(/SUMMARY:([^\r\n]+)/)?.[1]
        ?.trim()
        .toLowerCase() ?? "";
    if (resumo.includes("busy")) continue;

    const ini = bloco.match(/DTSTART(?:;[^:\r\n]*)?:(\d{8}T\d{6})Z/)?.[1];
    const fim = bloco.match(/DTEND(?:;[^:\r\n]*)?:(\d{8}T\d{6})Z/)?.[1];
    if (!ini || !fim) continue; // evento de dia inteiro, sem horário — nada a extrair

    const inicio = paraRecife(ini);
    const fimRecife = paraRecife(fim);
    mapa.set(inicio.data, `${inicio.hora}h às ${fimRecife.hora}h`);
  }

  return mapa;
}

/** Atalho para uma única data — usado nos testes e em quem só precisa de uma. */
export function horarioRealParaData(
  icsTexto: string,
  data: string,
): string | null {
  return horariosPorData(icsTexto).get(data) ?? null;
}

const PRAZO_MS = 5_000;

export type ResultadoHorarios =
  | { ok: true; horarios: Map<string, string> }
  | { ok: false };

/**
 * Busca o .ics uma vez e devolve o mapa data -> horário inteiro. Nunca lança —
 * qualquer falha (rede, timeout, resposta ruim) devolve `{ ok: false }`, que
 * quem chama distingue de "buscou certinho, só não achou essa data" (um mapa
 * sem aquela chave, dentro de `{ ok: true }`).
 */
export async function buscarHorarios(
  icsUrl: string,
): Promise<ResultadoHorarios> {
  try {
    const resposta = await fetch(icsUrl, {
      cache: "no-store",
      signal: AbortSignal.timeout(PRAZO_MS),
    });
    if (!resposta.ok) return { ok: false };
    const texto = await resposta.text();
    return { ok: true, horarios: horariosPorData(texto) };
  } catch {
    return { ok: false };
  }
}
