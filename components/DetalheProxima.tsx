"use client";

import type { ReactNode } from "react";
import { useHorarios } from "@/components/HorariosContext";
import { type Aula, horasDe } from "@/lib/calendario";

/**
 * A linha "Trilha · carga horária · horário real · local" do Próximo encontro.
 * Monta como lista e só junta com " · " entre peças que existem de verdade —
 * o horário real pode estar carregando, ter falhado, ou simplesmente não
 * bater com nenhum evento (não é erro, só ausência, e nesse caso não aparece).
 */
export function DetalheProxima({ aula }: { aula: Aula }) {
  const estado = useHorarios();

  const partes: ReactNode[] = [aula.trilha, horasDe(aula.horas)].filter(
    Boolean,
  );

  if (estado.status === "carregando") {
    partes.push(
      <span
        className="aula__detalhe--carregando"
        role="img"
        aria-label="Carregando horário real"
      >
        ···
      </span>,
    );
  } else if (estado.status === "erro") {
    partes.push(
      <span
        className="aula__detalhe--erro"
        role="img"
        aria-label="Não foi possível obter o horário das aulas"
        title="Não foi possível obter o horário das aulas"
      >
        !
      </span>,
    );
  } else if (estado.horarios[aula.data]) {
    partes.push(estado.horarios[aula.data]);
  }

  if (aula.local) partes.push(aula.local);

  return (
    <p className="aula__detalhe" style={{ marginTop: "var(--space-3)" }}>
      {partes.map((parte, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: ordem é fixa (trilha, carga, horário, local), lista só cresce/encolhe, nunca reordena.
        <span key={i}>
          {i > 0 && " · "}
          {parte}
        </span>
      ))}
    </p>
  );
}
