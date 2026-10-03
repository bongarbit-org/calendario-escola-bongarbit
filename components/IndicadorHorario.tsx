"use client";

import { useHorarios } from "@/components/HorariosContext";
import type { Aula } from "@/lib/calendario";

/**
 * O horário de verdade de uma aula, ou o estado da busca — nunca substitui a
 * carga horária (`aula.horas`), aparece ao lado dela.
 */
export function IndicadorHorario({ aula }: { aula: Aula }) {
  const estado = useHorarios();

  if (aula.semAula) return null;

  if (estado.status === "carregando") {
    return (
      <span className="aula__detalhe aula__detalhe--carregando" aria-label="Carregando horário real">
        ···
      </span>
    );
  }

  if (estado.status === "erro") {
    return (
      <span
        className="aula__detalhe aula__detalhe--erro"
        role="img"
        aria-label="Não foi possível obter o horário das aulas"
        title="Não foi possível obter o horário das aulas"
      >
        !
      </span>
    );
  }

  const horario = estado.horarios[aula.data];
  return horario ? <span className="aula__detalhe">{horario}</span> : null;
}
