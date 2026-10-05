import { describe, expect, it, vi } from "vitest";

const buscarHorarios = vi.fn();
vi.mock("@/lib/agenda", () => ({
  buscarHorarios,
  AGENDA_ICS: "https://exemplo/agenda.ics",
}));

describe("GET /api/horarios", () => {
  it("devolve 200 com o objeto de horários quando a busca funciona", async () => {
    buscarHorarios.mockResolvedValueOnce({
      ok: true,
      horarios: new Map([["2026-09-30", "18h às 21h"]]),
    });
    const { GET } = await import("@/app/api/horarios/route");
    const resposta = await GET();
    expect(resposta.status).toBe(200);
    expect(await resposta.json()).toEqual({ "2026-09-30": "18h às 21h" });
  });

  it("devolve 502 quando a busca falha", async () => {
    buscarHorarios.mockResolvedValueOnce({ ok: false });
    const { GET } = await import("@/app/api/horarios/route");
    const resposta = await GET();
    expect(resposta.status).toBe(502);
  });
});
