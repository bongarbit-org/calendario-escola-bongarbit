// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import type { Aula } from "@/lib/calendario";
import { HorariosContext } from "@/components/HorariosContext";

afterEach(cleanup);

const toBlob = vi.fn(async () => new Blob(["convite"], { type: "image/png" }));
vi.mock("@zumer/snapdom", () => ({ snapdom: { toBlob } }));

const AULA: Aula = {
  data: "2026-09-30", diaDaSemana: "Qua", titulo: "Luteria do Berimbau - Aula 3",
  descricao: null, topico: null, trilha: "Luteria Orgânica", cor: "#31671f",
  horas: 3, local: "CACGB", equipe: "prof. Ninho Brown Xambá", modulo: "Módulo 2",
  semAula: false,
};

async function importarComponentes() {
  const { ConviteDoDiaProvider, BotaoVisualizarConvite } = await import("@/components/ConviteDoDia");
  return { ConviteDoDiaProvider, BotaoVisualizarConvite };
}

describe("ConviteDoDia", () => {
  it("ao clicar no gatilho, gera e mostra a imagem", async () => {
    const { ConviteDoDiaProvider, BotaoVisualizarConvite } = await importarComponentes();
    render(
      <ConviteDoDiaProvider aula={AULA}>
        <BotaoVisualizarConvite />
      </ConviteDoDiaProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Visualizar convite" }));

    expect(await screen.findByAltText("Convite gerado")).toBeInTheDocument();
    expect(toBlob).toHaveBeenCalled();
  });

  it("'Gerar novamente' troca o texto mostrado", async () => {
    const { ConviteDoDiaProvider, BotaoVisualizarConvite } = await importarComponentes();
    const { container } = render(
      <ConviteDoDiaProvider aula={AULA}>
        <BotaoVisualizarConvite />
      </ConviteDoDiaProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Visualizar convite" }));
    await screen.findByAltText("Convite gerado");
    const linhaAntes = container.querySelector('[class*="msg"] span:nth-of-type(2)')?.textContent;

    fireEvent.click(screen.getByRole("button", { name: "Gerar novamente" }));
    await vi.waitFor(() => {
      const linhaDepois = container.querySelector('[class*="msg"] span:nth-of-type(2)')?.textContent;
      expect(linhaDepois).not.toBe(linhaAntes);
    });
  });

  it("'Mudar horário' aplica o novo valor e gera de novo", async () => {
    const { ConviteDoDiaProvider, BotaoVisualizarConvite } = await importarComponentes();
    render(
      <ConviteDoDiaProvider aula={AULA}>
        <BotaoVisualizarConvite />
      </ConviteDoDiaProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Visualizar convite" }));
    await screen.findByAltText("Convite gerado");
    const chamadasAntes = toBlob.mock.calls.length;

    fireEvent.click(screen.getByRole("button", { name: "Mudar horário" }));
    const campo = screen.getByPlaceholderText("Ex.: 8h às 12h");
    fireEvent.change(campo, { target: { value: "8h às 12h" } });
    fireEvent.click(screen.getByRole("button", { name: "Aplicar" }));

    await vi.waitFor(() => expect(toBlob.mock.calls.length).toBeGreaterThan(chamadasAntes));
  });

  it("sede fablab: gera, usa as imagens do Fab Lab Rec e tarja em texto puro (sem <br>)", async () => {
    const { ConviteDoDiaProvider, BotaoVisualizarConvite } = await importarComponentes();
    const aulaFablab: Aula = { ...AULA, local: "Fab Lab Rec" };
    const { container } = render(
      <ConviteDoDiaProvider aula={aulaFablab}>
        <BotaoVisualizarConvite />
      </ConviteDoDiaProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Visualizar convite" }));
    await screen.findByAltText("Convite gerado");

    expect(container.querySelector('img[src*="bongarbit-lettering-negativo"]')).toBeInTheDocument();
    expect(container.querySelector('img[src*="fablab-rec-empilhado-branco"]')).toBeInTheDocument();
    expect(container.querySelector('img[src*="bongarbit-lockup-horizontal"]')).not.toBeInTheDocument();
    expect(container.querySelector('img[src*="faixa-vila"]')).not.toBeInTheDocument();
  });

  it("fechar e reabrir volta ao horário padrão 18h às 21h", async () => {
    const { ConviteDoDiaProvider, BotaoVisualizarConvite } = await importarComponentes();
    render(
      <ConviteDoDiaProvider aula={AULA}>
        <BotaoVisualizarConvite />
      </ConviteDoDiaProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Visualizar convite" }));
    await screen.findByAltText("Convite gerado");
    fireEvent.click(screen.getByRole("button", { name: "Mudar horário" }));
    fireEvent.change(screen.getByPlaceholderText("Ex.: 8h às 12h"), { target: { value: "8h às 12h" } });
    fireEvent.click(screen.getByRole("button", { name: "Aplicar" }));
    await vi.waitFor(() => expect(screen.getByRole("button", { name: "Mudar horário" })).not.toBeDisabled());

    fireEvent.click(screen.getByRole("button", { name: "Fechar" }));
    fireEvent.click(screen.getByRole("button", { name: "Visualizar convite" }));
    await screen.findByAltText("Convite gerado");

    fireEvent.click(screen.getByRole("button", { name: "Mudar horário" }));
    expect(screen.getByPlaceholderText("Ex.: 8h às 12h")).toHaveValue("18h às 21h");
  });

  it("usa o horário do contexto (status pronto) como padrão, em vez de 18h às 21h", async () => {
    const { ConviteDoDiaProvider, BotaoVisualizarConvite } = await importarComponentes();
    const { container } = render(
      <HorariosContext.Provider value={{ status: "pronto", horarios: { [AULA.data]: "15h às 18h" } }}>
        <ConviteDoDiaProvider aula={AULA}>
          <BotaoVisualizarConvite />
        </ConviteDoDiaProvider>
      </HorariosContext.Provider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Visualizar convite" }));
    await screen.findByAltText("Convite gerado");

    expect(container.querySelector("[class*='tarja']")!.textContent).toContain("15h às 18h");
    fireEvent.click(screen.getByRole("button", { name: "Mudar horário" }));
    expect(screen.getByPlaceholderText("Ex.: 8h às 12h")).toHaveValue("15h às 18h");
  });

  it("fechar e reabrir com horário do contexto volta para ele, não para 18h às 21h", async () => {
    const { ConviteDoDiaProvider, BotaoVisualizarConvite } = await importarComponentes();
    render(
      <HorariosContext.Provider value={{ status: "pronto", horarios: { [AULA.data]: "15h às 18h" } }}>
        <ConviteDoDiaProvider aula={AULA}>
          <BotaoVisualizarConvite />
        </ConviteDoDiaProvider>
      </HorariosContext.Provider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Visualizar convite" }));
    await screen.findByAltText("Convite gerado");
    fireEvent.click(screen.getByRole("button", { name: "Mudar horário" }));
    fireEvent.change(screen.getByPlaceholderText("Ex.: 8h às 12h"), { target: { value: "8h às 12h" } });
    fireEvent.click(screen.getByRole("button", { name: "Aplicar" }));
    await vi.waitFor(() => expect(screen.getByRole("button", { name: "Mudar horário" })).not.toBeDisabled());

    fireEvent.click(screen.getByRole("button", { name: "Fechar" }));
    fireEvent.click(screen.getByRole("button", { name: "Visualizar convite" }));
    await screen.findByAltText("Convite gerado");

    fireEvent.click(screen.getByRole("button", { name: "Mudar horário" }));
    expect(screen.getByPlaceholderText("Ex.: 8h às 12h")).toHaveValue("15h às 18h");
  });

  it("usa o horário padrão quando o contexto está carregando ou deu erro", async () => {
    const { ConviteDoDiaProvider, BotaoVisualizarConvite } = await importarComponentes();
    render(
      <HorariosContext.Provider value={{ status: "erro" }}>
        <ConviteDoDiaProvider aula={AULA}>
          <BotaoVisualizarConvite />
        </ConviteDoDiaProvider>
      </HorariosContext.Provider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Visualizar convite" }));
    await screen.findByAltText("Convite gerado");
    fireEvent.click(screen.getByRole("button", { name: "Mudar horário" }));
    expect(screen.getByPlaceholderText("Ex.: 8h às 12h")).toHaveValue("18h às 21h");
  });

  it("deixa convites prontos numa fila mesmo sem o usuário ter clicado em nada", async () => {
    const { ConviteDoDiaProvider, BotaoVisualizarConvite } = await importarComponentes();
    render(
      <ConviteDoDiaProvider aula={AULA}>
        <BotaoVisualizarConvite />
      </ConviteDoDiaProvider>
    );

    // A fila enche em segundo plano (via requestIdleCallback/setTimeout) — basta
    // esperar o toBlob ser chamado sem nenhum clique no botão de abrir.
    await vi.waitFor(() => expect(toBlob).toHaveBeenCalled());

    fireEvent.click(screen.getByRole("button", { name: "Visualizar convite" }));
    expect(await screen.findByAltText("Convite gerado")).toBeInTheDocument();
  });

  it("dois gatilhos sob o mesmo provider abrem o mesmo modal único, não um cada", async () => {
    const { ConviteDoDiaProvider, BotaoVisualizarConvite } = await importarComponentes();
    render(
      <ConviteDoDiaProvider aula={AULA}>
        <div data-testid="destaque">
          <BotaoVisualizarConvite />
        </div>
        <div data-testid="linha-da-lista">
          <BotaoVisualizarConvite />
        </div>
      </ConviteDoDiaProvider>
    );

    const botoes = screen.getAllByRole("button", { name: "Visualizar convite" });
    expect(botoes).toHaveLength(2);

    fireEvent.click(botoes[0]);
    expect(await screen.findByAltText("Convite gerado")).toBeInTheDocument();
    // Um só modal — não dois, um por gatilho.
    expect(screen.getAllByRole("button", { name: "Fechar" })).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: "Fechar" }));
    fireEvent.click(botoes[1]);
    expect(await screen.findByAltText("Convite gerado")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Fechar" })).toHaveLength(1);
  });
});
