import { describe, it, expect, vi, afterEach } from "vitest";
import { horarioRealParaData, horariosPorData, buscarHorarios } from "@/lib/agenda";

function ics(...veventos: string[]): string {
  return `BEGIN:VCALENDAR\n${veventos.join("\n")}\nEND:VCALENDAR`;
}

function vevent(opts: { summary: string; dtstart: string; dtend: string }): string {
  return [
    "BEGIN:VEVENT",
    `SUMMARY:${opts.summary}`,
    `DTSTART:${opts.dtstart}`,
    `DTEND:${opts.dtend}`,
    "END:VEVENT",
  ].join("\n");
}

describe("horarioRealParaData", () => {
  it("extrai o horário em Recife (UTC-3) de um evento que bate com a data", () => {
    const texto = ics(
      vevent({ summary: "Luteria do Berimbau - Aula 3", dtstart: "20260930T210000Z", dtend: "20261001T000000Z" })
    );
    expect(horarioRealParaData(texto, "2026-09-30")).toBe("18h às 21h");
  });

  it("devolve null quando nenhum evento bate com a data", () => {
    const texto = ics(
      vevent({ summary: "Luteria do Berimbau - Aula 3", dtstart: "20260930T210000Z", dtend: "20261001T000000Z" })
    );
    expect(horarioRealParaData(texto, "2026-10-05")).toBeNull();
  });

  it("ignora eventos de dia inteiro (sem horário)", () => {
    const texto = ics("BEGIN:VEVENT\nSUMMARY:Feriado\nDTSTART;VALUE=DATE:20261012\nDTEND;VALUE=DATE:20261013\nEND:VEVENT");
    expect(horarioRealParaData(texto, "2026-10-12")).toBeNull();
  });

  it("ignora eventos 'busy' de bloqueio mesmo que batam com a data e hora", () => {
    const texto = ics(
      vevent({ summary: "busy", dtstart: "20260930T210000Z", dtend: "20261001T000000Z" }),
      vevent({ summary: "Luteria do Berimbau - Aula 3", dtstart: "20260930T110000Z", dtend: "20260930T140000Z" })
    );
    expect(horarioRealParaData(texto, "2026-09-30")).toBe("8h às 11h");
  });

  it("acha o evento certo mesmo com outros antes dele na lista", () => {
    const texto = ics(
      vevent({ summary: "Luteria do Berimbau - Aula 2", dtstart: "20260923T210000Z", dtend: "20260924T000000Z" }),
      vevent({ summary: "Luteria do Berimbau - Aula 3", dtstart: "20260930T180000Z", dtend: "20260930T210000Z" })
    );
    expect(horarioRealParaData(texto, "2026-09-30")).toBe("15h às 18h");
  });
});

describe("horariosPorData", () => {
  it("monta um mapa com todas as datas que têm horário", () => {
    const texto = ics(
      vevent({ summary: "Luteria do Berimbau - Aula 2", dtstart: "20260923T210000Z", dtend: "20260924T000000Z" }),
      vevent({ summary: "Luteria do Berimbau - Aula 3", dtstart: "20260930T210000Z", dtend: "20261001T000000Z" })
    );
    const mapa = horariosPorData(texto);
    expect(mapa.get("2026-09-23")).toBe("18h às 21h");
    expect(mapa.get("2026-09-30")).toBe("18h às 21h");
    expect(mapa.size).toBe(2);
  });

  it("não inclui dias sem horário (feriado, evento busy)", () => {
    const texto = ics(
      "BEGIN:VEVENT\nSUMMARY:Feriado\nDTSTART;VALUE=DATE:20261012\nDTEND;VALUE=DATE:20261013\nEND:VEVENT",
      vevent({ summary: "busy", dtstart: "20260930T210000Z", dtend: "20261001T000000Z" })
    );
    expect(horariosPorData(texto).size).toBe(0);
  });
});

describe("buscarHorarios", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("devolve { ok: true, horarios } quando o fetch funciona", async () => {
    const texto = ics(
      vevent({ summary: "Luteria do Berimbau - Aula 3", dtstart: "20260930T210000Z", dtend: "20261001T000000Z" })
    );
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, text: async () => texto }))
    );
    const resultado = await buscarHorarios("https://exemplo/agenda.ics");
    expect(resultado.ok).toBe(true);
    expect(resultado.ok && resultado.horarios.get("2026-09-30")).toBe("18h às 21h");
  });

  it("devolve { ok: false } quando a resposta não é ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, text: async () => "" }))
    );
    expect(await buscarHorarios("https://exemplo/agenda.ics")).toEqual({ ok: false });
  });

  it("devolve { ok: false } quando o fetch lança (rede fora, timeout etc.)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("rede fora");
      })
    );
    expect(await buscarHorarios("https://exemplo/agenda.ics")).toEqual({ ok: false });
  });
});
