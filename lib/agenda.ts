/**
 * Lê o horário real das aulas direto do .ics público da agenda — a única
 * leitura que este site faz da agenda do Google (CLAUDE.md §3: "a agenda nunca
 * é fonte" vale para content/calendario.json; isto é só para preencher um
 * campo de exibição que o JSON não tem, nunca grava nada de volta).
 */

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
    recife.getUTCDate()
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
    const resumo = bloco.match(/SUMMARY:([^\r\n]+)/)?.[1]?.trim().toLowerCase() ?? "";
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
export function horarioRealParaData(icsTexto: string, data: string): string | null {
  return horariosPorData(icsTexto).get(data) ?? null;
}

const PRAZO_MS = 5_000;

/**
 * Busca o .ics uma vez e devolve o mapa data -> horário inteiro. Nunca lança —
 * qualquer falha (rede, timeout, resposta ruim) devolve um mapa vazio, e quem
 * chama cai de volta no horário padrão de cada card/exibição.
 */
export async function buscarHorarios(icsUrl: string): Promise<Map<string, string>> {
  try {
    const resposta = await fetch(icsUrl, { cache: "no-store", signal: AbortSignal.timeout(PRAZO_MS) });
    if (!resposta.ok) return new Map();
    const texto = await resposta.text();
    return horariosPorData(texto);
  } catch {
    return new Map();
  }
}
