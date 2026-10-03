// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import type { Aula } from "@/lib/calendario";
import { HorariosContext, type EstadoHorarios } from "@/components/HorariosContext";
import { DetalheProxima } from "@/components/DetalheProxima";

afterEach(cleanup);

const AULA: Aula = {
  data: "2026-09-30", diaDaSemana: "Qua", titulo: "Luteria do Berimbau - Aula 3",
  descricao: null, topico: null, trilha: "Luteria Orgânica", cor: "#31671f",
  horas: 3, local: "CACGB", equipe: "prof. Ninho Brown Xambá", modulo: "Módulo 2",
  semAula: false,
};

function renderCom(estado: EstadoHorarios) {
  return render(
    <HorariosContext.Provider value={estado}>
      <DetalheProxima aula={AULA} />
    </HorariosContext.Provider>
  );
}

describe("DetalheProxima", () => {
  it("sempre mostra trilha e carga horária, mesmo sem horário real", () => {
    renderCom({ status: "carregando" });
    expect(screen.getByText(/Luteria Orgânica/)).toBeInTheDocument();
    expect(screen.getByText(/3h/)).toBeInTheDocument();
    expect(screen.getByText(/CACGB/)).toBeInTheDocument();
  });

  it("acrescenta o indicador de carregamento sem esconder a carga horária", () => {
    renderCom({ status: "carregando" });
    expect(screen.getByLabelText("Carregando horário real")).toBeInTheDocument();
    expect(screen.getByText(/3h/)).toBeInTheDocument();
  });

  it("acrescenta a exclamação de erro sem esconder a carga horária", () => {
    renderCom({ status: "erro" });
    expect(screen.getByLabelText("Não foi possível obter o horário das aulas")).toBeInTheDocument();
    expect(screen.getByText(/3h/)).toBeInTheDocument();
  });

  it("acrescenta o horário real ao lado da carga horária quando a busca acha a data", () => {
    renderCom({ status: "pronto", horarios: { "2026-09-30": "18h às 21h" } });
    expect(screen.getByText(/3h/)).toBeInTheDocument();
    expect(screen.getByText(/18h às 21h/)).toBeInTheDocument();
  });

  it("não acrescenta nada quando a busca terminou mas não achou a data (não é erro)", () => {
    renderCom({ status: "pronto", horarios: {} });
    expect(screen.queryByLabelText("Não foi possível obter o horário das aulas")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Carregando horário real")).not.toBeInTheDocument();
    expect(screen.getByText(/3h/)).toBeInTheDocument();
  });
});
