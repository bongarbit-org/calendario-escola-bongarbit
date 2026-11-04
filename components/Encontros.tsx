"use client";

import { type ReactNode, useEffect, useState } from "react";
import { Calendario } from "@/components/Calendario";
import {
  BotaoVisualizarConvite,
  ConviteDoDiaProvider,
} from "@/components/ConviteDoDia";
import { DetalheProxima } from "@/components/DetalheProxima";
import {
  dia,
  emPalavras,
  hoje,
  mesCurto,
  proximaAula,
  quantosDias,
  todasAsAulas,
} from "@/lib/calendario";
import { temConvite } from "@/lib/card";

/**
 * "Hoje" no navegador. O primeiro render usa a data do build, a mesma do HTML
 * estático, para a hidratação bater; logo depois troca pela data de agora e a
 * confere a cada minuto, para quem deixa a aba aberta virando a meia-noite.
 * Sem isto o site ficaria preso ao dia do último build, e o agendamento do
 * GitHub Actions atrasa horas ou pula execuções.
 */
function useHoje(doBuild: string): string {
  const [h, setH] = useState(doBuild);
  useEffect(() => {
    const atualizar = () => setH(hoje());
    atualizar();
    const id = setInterval(atualizar, 60_000);
    document.addEventListener("visibilitychange", atualizar);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", atualizar);
    };
  }, []);
  return h;
}

/** Tudo da página que depende de "hoje". */
export function Encontros({
  hojeDoBuild,
  assinar,
}: {
  hojeDoBuild: string;
  assinar: ReactNode;
}) {
  const h = useHoje(hojeDoBuild);
  const proxima = proximaAula(h);
  const pelaFrente = todasAsAulas().filter((a) => a.data >= h && !a.semAula);
  const horas = pelaFrente.reduce((s, a) => s + (a.horas ?? 0), 0);
  // O destaque "Próximo encontro" e a linha de hoje no calendário mostram o
  // mesmo convite — um só provider, mais abaixo, cobre os dois.
  const aulaDoConvite =
    proxima && proxima.data === h && temConvite(proxima) ? proxima : null;

  return (
    <>
      {/* A key remonta o provider quando a aula do convite muda (o dia virou,
          ou o build era de outro dia): o estado dele é derivado da aula. */}
      <ConviteDoDiaProvider
        key={aulaDoConvite?.data ?? "sem-convite"}
        aula={aulaDoConvite}
      >
        {proxima && (
          <section className="proxima">
            <div className="proxima__data">
              <div className="proxima__dia">{dia(proxima.data)}</div>
              <div className="proxima__mes">{mesCurto(proxima.data)}</div>
            </div>
            <div className="proxima__corpo">
              <div className="olho">
                Próximo encontro · {proxima.diaDaSemana} ·{" "}
                {emPalavras(quantosDias(proxima.data, h))}
              </div>
              <h2 className="proxima__titulo">{proxima.titulo}</h2>
              {proxima.topico && (
                <p className="aula__topico">{proxima.topico}</p>
              )}
              {proxima.descricao && (
                <p className="aula__descricao">{proxima.descricao}</p>
              )}
              <DetalheProxima aula={proxima} />
              {aulaDoConvite && (
                <div style={{ marginTop: "var(--space-3)" }}>
                  <BotaoVisualizarConvite />
                </div>
              )}
            </div>
          </section>
        )}

        {assinar}

        <Calendario hoje={h} />
      </ConviteDoDiaProvider>

      <footer className="rodape">
        <p>
          {pelaFrente.length} encontros pela frente, {horas.toFixed(0)}h de
          formação. Calendário sujeito a mudanças — confirme com a equipe da
          escola.
        </p>
      </footer>
    </>
  );
}
