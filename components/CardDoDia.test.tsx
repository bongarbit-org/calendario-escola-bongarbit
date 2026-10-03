// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import type { Aula } from "@/lib/calendario";
import { HorariosContext, type EstadoHorarios } from "@/components/HorariosContext";

afterEach(cleanup);

const toPng = vi.fn(async () => ({ src: "data:image/png;base64,AAAA" }));
vi.mock("@zumer/snapdom", () => ({ snapdom: { toPng } }));

const AULA: Aula = {
  data: "2026-09-30", diaDaSemana: "Qua", titulo: "Luteria do Berimbau - Aula 3",
  descricao: null, topico: null, trilha: "Luteria Orgânica", cor: "#31671f",
  horas: 3, local: "CACGB", equipe: "prof. Ninho Brown Xambá", modulo: "Módulo 2",
  semAula: false,
};

async function importCardDoDia() {
  const { CardDoDia } = await import("@/components/CardDoDia");
  return CardDoDia;
}

function renderComHorarios(aula: Aula, estado: EstadoHorarios, CardDoDia: Awaited<ReturnType<typeof importCardDoDia>>) {
  return render(
    <HorariosContext.Provider value={estado}>
      <CardDoDia aula={aula} />
    </HorariosContext.Provider>
  );
}

describe("CardDoDia", () => {
  it("ao clicar no gatilho, gera e mostra a imagem", async () => {
    const CardDoDia = await importCardDoDia();
    render(<CardDoDia aula={AULA} />);

    fireEvent.click(screen.getByRole("button", { name: "Visualizar convite" }));

    expect(await screen.findByAltText("Card gerado")).toBeInTheDocument();
    expect(toPng).toHaveBeenCalledTimes(1);
  });

  it("'Gerar novamente' chama a captura de novo", async () => {
    const CardDoDia = await importCardDoDia();
    render(<CardDoDia aula={AULA} />);

    fireEvent.click(screen.getByRole("button", { name: "Visualizar convite" }));
    await screen.findByAltText("Card gerado");

    fireEvent.click(screen.getByRole("button", { name: "Gerar novamente" }));
    await vi.waitFor(() => expect(toPng).toHaveBeenCalledTimes(2));
  });

  it("'Mudar horário' aplica o novo valor e gera de novo", async () => {
    const CardDoDia = await importCardDoDia();
    render(<CardDoDia aula={AULA} />);

    fireEvent.click(screen.getByRole("button", { name: "Visualizar convite" }));
    await screen.findByAltText("Card gerado");

    fireEvent.click(screen.getByRole("button", { name: "Mudar horário" }));
    const campo = screen.getByPlaceholderText("Ex.: 8h às 12h");
    fireEvent.change(campo, { target: { value: "8h às 12h" } });
    fireEvent.click(screen.getByRole("button", { name: "Aplicar" }));

    await vi.waitFor(() => expect(toPng).toHaveBeenCalledTimes(2));
  });

  it("sede fablab: gera, usa as imagens do Fab Lab Rec e tarja em texto puro (sem <br>)", async () => {
    const CardDoDia = await importCardDoDia();
    const aulaFablab: Aula = { ...AULA, local: "Fab Lab Rec" };
    const { container } = render(<CardDoDia aula={aulaFablab} />);

    fireEvent.click(screen.getByRole("button", { name: "Visualizar convite" }));
    await screen.findByAltText("Card gerado");

    expect(container.querySelector('img[src*="bongarbit-lettering-negativo"]')).toBeInTheDocument();
    expect(container.querySelector('img[src*="fablab-rec-empilhado-branco"]')).toBeInTheDocument();
    expect(container.querySelector('img[src*="bongarbit-lockup-horizontal"]')).not.toBeInTheDocument();
    expect(container.querySelector('img[src*="faixa-vila"]')).not.toBeInTheDocument();
  });

  it("usa o horário do contexto (status pronto) como padrão, em vez de 18h às 21h", async () => {
    const CardDoDia = await importCardDoDia();
    const { container } = renderComHorarios(
      AULA,
      { status: "pronto", horarios: { [AULA.data]: "15h às 18h" } },
      CardDoDia
    );

    fireEvent.click(screen.getByRole("button", { name: "Visualizar convite" }));
    await screen.findByAltText("Card gerado");

    expect(container.querySelector("[class*='tarja']")!.textContent).toContain("15h às 18h");
    fireEvent.click(screen.getByRole("button", { name: "Mudar horário" }));
    expect(screen.getByPlaceholderText("Ex.: 8h às 12h")).toHaveValue("15h às 18h");
  });

  it("fechar e reabrir com horário do contexto volta para ele, não para 18h às 21h", async () => {
    const CardDoDia = await importCardDoDia();
    renderComHorarios(AULA, { status: "pronto", horarios: { [AULA.data]: "15h às 18h" } }, CardDoDia);

    fireEvent.click(screen.getByRole("button", { name: "Visualizar convite" }));
    await screen.findByAltText("Card gerado");
    fireEvent.click(screen.getByRole("button", { name: "Mudar horário" }));
    fireEvent.change(screen.getByPlaceholderText("Ex.: 8h às 12h"), { target: { value: "8h às 12h" } });
    fireEvent.click(screen.getByRole("button", { name: "Aplicar" }));
    await vi.waitFor(() => expect(toPng).toHaveBeenCalledTimes(2));

    fireEvent.click(screen.getByRole("button", { name: "Fechar" }));
    fireEvent.click(screen.getByRole("button", { name: "Visualizar convite" }));
    await vi.waitFor(() => expect(toPng).toHaveBeenCalledTimes(3));

    fireEvent.click(screen.getByRole("button", { name: "Mudar horário" }));
    expect(screen.getByPlaceholderText("Ex.: 8h às 12h")).toHaveValue("15h às 18h");
  });

  it("usa o horário padrão quando o contexto está carregando ou deu erro", async () => {
    const CardDoDia = await importCardDoDia();
    renderComHorarios(AULA, { status: "erro" }, CardDoDia);

    fireEvent.click(screen.getByRole("button", { name: "Visualizar convite" }));
    await screen.findByAltText("Card gerado");
    fireEvent.click(screen.getByRole("button", { name: "Mudar horário" }));
    expect(screen.getByPlaceholderText("Ex.: 8h às 12h")).toHaveValue("18h às 21h");
  });

  it("fechar e reabrir volta ao horário padrão 18h às 21h", async () => {
    const CardDoDia = await importCardDoDia();
    render(<CardDoDia aula={AULA} />);

    fireEvent.click(screen.getByRole("button", { name: "Visualizar convite" }));
    await screen.findByAltText("Card gerado");
    fireEvent.click(screen.getByRole("button", { name: "Mudar horário" }));
    fireEvent.change(screen.getByPlaceholderText("Ex.: 8h às 12h"), { target: { value: "8h às 12h" } });
    fireEvent.click(screen.getByRole("button", { name: "Aplicar" }));
    await vi.waitFor(() => expect(toPng).toHaveBeenCalledTimes(2));

    fireEvent.click(screen.getByRole("button", { name: "Fechar" }));
    fireEvent.click(screen.getByRole("button", { name: "Visualizar convite" }));
    await vi.waitFor(() => expect(toPng).toHaveBeenCalledTimes(3));

    fireEvent.click(screen.getByRole("button", { name: "Mudar horário" }));
    expect(screen.getByPlaceholderText("Ex.: 8h às 12h")).toHaveValue("18h às 21h");
  });
});
