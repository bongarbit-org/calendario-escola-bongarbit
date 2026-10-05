// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, within, fireEvent, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { temConvite } from "@/lib/card";
import type { Aula } from "@/lib/calendario";

afterEach(cleanup);

const FIXTURE = {
  meses: [
    {
      chave: "2026-09",
      nome: "Setembro 2026",
      itens: [
        // Hoje, numa quarta — deve mostrar o botão.
        {
          data: "2026-09-30", diaDaSemana: "Qua", titulo: "Luteria do Berimbau - Aula 3",
          descricao: null, topico: null, trilha: "Luteria Orgânica", cor: "#31671f",
          horas: 3, local: "CACGB", equipe: "prof. Ninho Brown Xambá", modulo: "Módulo 2",
          semAula: false,
        },
      ],
    },
    {
      chave: "2026-10",
      nome: "Outubro 2026",
      itens: [
        // No futuro (não fica escondida pelo filtro de "passadas"), numa segunda —
        // não é hoje, não deve mostrar o botão.
        {
          data: "2026-10-05", diaDaSemana: "Seg", titulo: "Luteria do Berimbau - Aula 4",
          descricao: null, topico: null, trilha: "Luteria Orgânica", cor: "#31671f",
          horas: 3, local: "CACGB", equipe: "prof. Ninho Brown Xambá", modulo: "Módulo 2",
          semAula: false,
        },
        // Sexta fora do Fab Lab — não deve mostrar o botão.
        {
          data: "2026-10-02", diaDaSemana: "Sex", titulo: "Café com Bongarbit (4)",
          descricao: null, topico: null, trilha: "Encontro", cor: "#d4752d",
          horas: 2, local: "CACGB - Cabaça", equipe: "Equipe de produção e monitoria do Bongarbit",
          modulo: null, semAula: false,
        },
        // Sexta no Fab Lab Rec — a Trilha Empreendedora mudou para lá, deve mostrar.
        {
          data: "2026-10-16", diaDaSemana: "Sex",
          titulo: "Encontro da Trilha de Educação Empreendedora (4)",
          descricao: null, topico: null, trilha: "Trilha Empreendedora", cor: "#d0962d",
          horas: 3, local: "Fab Lab Rec", equipe: "Equipe Fab Lab Rec",
          modulo: "Módulo 2", semAula: false,
        },
        // Feriado numa segunda — semAula, nunca mostra.
        {
          data: "2026-10-12", diaDaSemana: "Seg", titulo: "Nossa Senhora Aparecida",
          descricao: null, topico: null, trilha: "Feriado", cor: "#6b6b6b",
          horas: null, local: null, equipe: null, modulo: null, semAula: true,
        },
      ],
    },
  ],
  trilhas: [{ nome: "Luteria Orgânica", cor: "#31671f" }],
};

vi.mock("@/content/calendario.json", () => ({ default: FIXTURE }));
vi.mock("@zumer/snapdom", () => ({
  snapdom: { toBlob: vi.fn(async () => new Blob(["convite"], { type: "image/png" })) },
}));

const TODAS_AS_AULAS: Aula[] = FIXTURE.meses.flatMap((m) => m.itens) as Aula[];

// Mesmo cálculo que app/page.tsx faz para alimentar o ConviteDoDiaProvider:
// a aula de hoje, só se ela de fato tem convite. O provider precisa estar
// presente sempre que o teste for interagir com o botão — BotaoVisualizarConvite
// lança se for usado fora dele.
function aulaDoConvite(hoje: string): Aula | null {
  return TODAS_AS_AULAS.find((a) => a.data === hoje && temConvite(a)) ?? null;
}

async function renderCalendario(hoje: string) {
  const { Calendario } = await import("@/components/Calendario");
  const { ConviteDoDiaProvider } = await import("@/components/ConviteDoDia");
  return render(
    <ConviteDoDiaProvider aula={aulaDoConvite(hoje)}>
      <Calendario hoje={hoje} />
    </ConviteDoDiaProvider>
  );
}

describe("botão Visualizar convite", () => {
  it("aparece só na linha de hoje, numa quarta, na vista de lista", async () => {
    await renderCalendario("2026-09-30");

    expect(screen.getAllByRole("button", { name: "Visualizar convite" })).toHaveLength(1);

    const linhaDeHoje = screen.getByText("Luteria do Berimbau - Aula 3").closest("li")!;
    expect(within(linhaDeHoje).getByRole("button", { name: "Visualizar convite" })).toBeInTheDocument();

    const outraLinha = screen.getByText("Luteria do Berimbau - Aula 4").closest("li")!;
    expect(within(outraLinha).queryByRole("button", { name: "Visualizar convite" })).not.toBeInTheDocument();
  });

  it("não aparece numa sexta fora do Fab Lab", async () => {
    await renderCalendario("2026-10-02");

    expect(screen.queryByRole("button", { name: "Visualizar convite" })).not.toBeInTheDocument();
  });

  it("aparece na sexta quando o encontro é no Fab Lab Rec", async () => {
    await renderCalendario("2026-10-16");

    // Esse título, por não seguir o padrão "Luteria do/da X - Aula N", também aparece
    // dentro do cartão oculto que a fila gera em segundo plano (sempre montado, mesmo
    // fora do modal) — por isso getAllByText, e filtra o que está dentro de uma <li>.
    const linha = screen
      .getAllByText("Encontro da Trilha de Educação Empreendedora (4)")
      .map((el) => el.closest("li"))
      .find((li): li is HTMLLIElement => li !== null)!;
    expect(within(linha).getByRole("button", { name: "Visualizar convite" })).toBeInTheDocument();
  });

  it("não aparece num feriado, mesmo caindo numa segunda", async () => {
    await renderCalendario("2026-10-12");

    expect(screen.queryByRole("button", { name: "Visualizar convite" })).not.toBeInTheDocument();
  });

  it("aparece também no detalhe expandido da vista de grade", async () => {
    await renderCalendario("2026-09-30");

    fireEvent.click(screen.getByRole("button", { name: "Calendário" }));
    const secaoSetembro = screen.getByText("Setembro 2026").closest("section")!;
    const numeroDoDia = within(secaoSetembro).getByText("30", { selector: ".grade__numero" });
    fireEvent.click(numeroDoDia.closest("button")!);

    expect(screen.getAllByRole("button", { name: "Visualizar convite" })).toHaveLength(1);
  });

  it("clicar no botão abre o modal e mostra a imagem gerada", async () => {
    await renderCalendario("2026-09-30");

    fireEvent.click(screen.getByRole("button", { name: "Visualizar convite" }));

    expect(await screen.findByAltText("Convite gerado")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Fechar" })).toBeInTheDocument();
  });
});
