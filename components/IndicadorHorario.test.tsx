// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import "@testing-library/jest-dom/vitest";
import {
  type EstadoHorarios,
  HorariosContext,
} from "@/components/HorariosContext";
import { IndicadorHorario } from "@/components/IndicadorHorario";
import type { Aula } from "@/lib/calendario";

afterEach(cleanup);

const AULA: Aula = {
  data: "2026-09-30",
  diaDaSemana: "Qua",
  titulo: "Luteria do Berimbau - Aula 3",
  descricao: null,
  topico: null,
  trilha: "Luteria Orgânica",
  cor: "#31671f",
  horas: 3,
  local: "CACGB",
  equipe: "prof. Ninho Brown Xambá",
  modulo: "Módulo 2",
  semAula: false,
};

function renderCom(estado: EstadoHorarios, aula: Aula = AULA) {
  return render(
    <HorariosContext.Provider value={estado}>
      <IndicadorHorario aula={aula} />
    </HorariosContext.Provider>,
  );
}

describe("IndicadorHorario", () => {
  it("mostra um indicador de carregamento enquanto a busca está em andamento", () => {
    renderCom({ status: "carregando" });
    expect(
      screen.getByLabelText("Carregando horário real"),
    ).toBeInTheDocument();
  });

  it("mostra uma exclamação com tooltip quando a busca falhou", () => {
    renderCom({ status: "erro" });
    const exclamacao = screen.getByLabelText(
      "Não foi possível obter o horário das aulas",
    );
    expect(exclamacao).toBeInTheDocument();
    expect(exclamacao).toHaveAttribute(
      "title",
      "Não foi possível obter o horário das aulas",
    );
  });

  it("mostra o horário real quando a busca terminou e a data bate", () => {
    renderCom({ status: "pronto", horarios: { "2026-09-30": "18h às 21h" } });
    expect(screen.getByText("18h às 21h")).toBeInTheDocument();
  });

  it("não mostra nada quando a busca terminou mas a data não bate com nenhum evento", () => {
    const { container } = renderCom({ status: "pronto", horarios: {} });
    expect(container).toBeEmptyDOMElement();
  });

  it("não mostra nada num dia sem aula, mesmo com a busca pronta", () => {
    const { container } = renderCom(
      { status: "pronto", horarios: { "2026-09-30": "18h às 21h" } },
      { ...AULA, semAula: true },
    );
    expect(container).toBeEmptyDOMElement();
  });
});
