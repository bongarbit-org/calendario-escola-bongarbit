"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type EstadoHorarios =
  | { status: "carregando" }
  | { status: "pronto"; horarios: Record<string, string> }
  | { status: "erro" };

const PADRAO: EstadoHorarios = { status: "carregando" };

export const HorariosContext = createContext<EstadoHorarios>(PADRAO);

export function useHorarios(): EstadoHorarios {
  return useContext(HorariosContext);
}

/**
 * Busca /api/horarios (que por sua vez busca o .ics público) uma única vez,
 * depois que a página já apareceu — nunca atrasa o primeiro HTML. Enquanto
 * carrega ou se falhar, quem consome (IndicadorHorario, DetalheProxima,
 * CardDoDia) cai de volta na carga horária / no horário padrão.
 */
export function ProvedorHorarios({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<EstadoHorarios>(PADRAO);

  useEffect(() => {
    let cancelado = false;

    fetch("/api/horarios")
      .then((resposta) => {
        if (!resposta.ok) throw new Error("resposta não ok");
        return resposta.json();
      })
      .then((horarios: Record<string, string>) => {
        if (!cancelado) setEstado({ status: "pronto", horarios });
      })
      .catch(() => {
        if (!cancelado) setEstado({ status: "erro" });
      });

    return () => {
      cancelado = true;
    };
  }, []);

  return <HorariosContext.Provider value={estado}>{children}</HorariosContext.Provider>;
}
