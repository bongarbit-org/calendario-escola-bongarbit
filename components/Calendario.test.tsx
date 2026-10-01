// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, within, fireEvent, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

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
  snapdom: { toPng: vi.fn(async () => ({ src: "data:image/png;base64,AAAA" })) },
}));

async function importCalendario() {
  const { Calendario } = await import("@/components/Calendario");
  return Calendario;
}

describe("botão Visualizar convite", () => {
  it("aparece só na linha de hoje, numa quarta, na vista de lista", async () => {
    const Calendario = await importCalendario();
    render(<Calendario hoje="2026-09-30" />);

    expect(screen.getAllByRole("button", { name: "Visualizar convite" })).toHaveLength(1);

    const linhaDeHoje = screen.getByText("Luteria do Berimbau - Aula 3").closest("li")!;
    expect(within(linhaDeHoje).getByRole("button", { name: "Visualizar convite" })).toBeInTheDocument();

    const outraLinha = screen.getByText("Luteria do Berimbau - Aula 4").closest("li")!;
    expect(within(outraLinha).queryByRole("button", { name: "Visualizar convite" })).not.toBeInTheDocument();
  });

  it("não aparece numa sexta fora do Fab Lab", async () => {
    const Calendario = await importCalendario();
    render(<Calendario hoje="2026-10-02" />);

    expect(screen.queryByRole("button", { name: "Visualizar convite" })).not.toBeInTheDocument();
  });

  it("aparece na sexta quando o encontro é no Fab Lab Rec", async () => {
    const Calendario = await importCalendario();
    render(<Calendario hoje="2026-10-16" />);

    const linha = screen
      .getByText("Encontro da Trilha de Educação Empreendedora (4)")
      .closest("li")!;
    expect(within(linha).getByRole("button", { name: "Visualizar convite" })).toBeInTheDocument();
  });

  it("não aparece num feriado, mesmo caindo numa segunda", async () => {
    const Calendario = await importCalendario();
    render(<Calendario hoje="2026-10-12" />);

    expect(screen.queryByRole("button", { name: "Visualizar convite" })).not.toBeInTheDocument();
  });

  it("aparece também no detalhe expandido da vista de grade", async () => {
    const Calendario = await importCalendario();
    render(<Calendario hoje="2026-09-30" />);

    fireEvent.click(screen.getByRole("button", { name: "Calendário" }));
    const secaoSetembro = screen.getByText("Setembro 2026").closest("section")!;
    const numeroDoDia = within(secaoSetembro).getByText("30", { selector: ".grade__numero" });
    fireEvent.click(numeroDoDia.closest("button")!);

    expect(screen.getAllByRole("button", { name: "Visualizar convite" })).toHaveLength(1);
  });

  it("clicar no botão abre o modal e mostra a imagem gerada", async () => {
    const Calendario = await importCalendario();
    render(<Calendario hoje="2026-09-30" />);

    fireEvent.click(screen.getByRole("button", { name: "Visualizar convite" }));

    expect(await screen.findByAltText("Card gerado")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Fechar" })).toBeInTheDocument();
  });
});
