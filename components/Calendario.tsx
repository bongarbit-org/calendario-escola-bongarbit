"use client";

import { useMemo, useState } from "react";
import {
  calendario, dia, emPalavras, horasDe, mesCurto, quantosDias, type Aula,
} from "@/lib/calendario";

export function Calendario({ hoje }: { hoje: string }) {
  const [trilha, setTrilha] = useState<string | null>(null);
  const [mostrarPassadas, setMostrarPassadas] = useState(false);

  const meses = useMemo(() => {
    return calendario.meses
      .map((m) => ({
        ...m,
        itens: m.itens.filter(
          (a) =>
            (!trilha || a.trilha === trilha) &&
            (mostrarPassadas || a.data >= hoje)
        ),
      }))
      .filter((m) => m.itens.length > 0);
  }, [trilha, mostrarPassadas, hoje]);

  const contagem = (nome: string) =>
    calendario.meses
      .flatMap((m) => m.itens)
      .filter((a) => a.trilha === nome && (mostrarPassadas || a.data >= hoje)).length;

  const passadas = calendario.meses.flatMap((m) => m.itens).filter((a) => a.data < hoje).length;

  return (
    <>
      <div className="filtros">
        <button
          type="button"
          onClick={() => setTrilha(null)}
          className={`botao ${trilha === null ? "" : "botao--fantasma"}`}
        >
          Tudo
        </button>
        {calendario.trilhas.map((t) => (
          <button
            key={t.nome}
            type="button"
            onClick={() => setTrilha(t.nome === trilha ? null : t.nome)}
            className={`botao ${trilha === t.nome ? "" : "botao--fantasma"}`}
          >
            <span className="botao__marca" style={{ background: t.cor }} />
            {t.nome} {contagem(t.nome) > 0 && contagem(t.nome)}
          </button>
        ))}
        {passadas > 0 && (
          <button
            type="button"
            onClick={() => setMostrarPassadas((v) => !v)}
            className="botao botao--fantasma"
            style={{ marginLeft: "auto" }}
          >
            {mostrarPassadas ? "Esconder o que passou" : `Mostrar o que passou (${passadas})`}
          </button>
        )}
      </div>

      {meses.map((mes) => (
        <section className="mes" key={mes.chave}>
          <h2 className="mes__titulo">
            {mes.nome}
            <span>
              {mes.itens.filter((a) => !a.semAula).length}{" "}
              {mes.itens.filter((a) => !a.semAula).length === 1 ? "encontro" : "encontros"}
            </span>
          </h2>

          <ul>
            {mes.itens.map((aula) => (
              <LinhaDaAula key={aula.data + aula.titulo} aula={aula} hoje={hoje} />
            ))}
          </ul>
        </section>
      ))}

      {meses.length === 0 && (
        <p className="rodape" style={{ marginTop: "var(--space-6)" }}>
          Nenhum encontro nesta trilha daqui para a frente.
        </p>
      )}
    </>
  );
}

function LinhaDaAula({ aula, hoje }: { aula: Aula; hoje: string }) {
  const passada = aula.data < hoje;
  const ehHoje = aula.data === hoje;

  return (
    <li
      className={`aula ${passada ? "aula--passada" : ""} ${ehHoje ? "aula--hoje" : ""} ${
        aula.semAula ? "aula--sem-aula" : ""
      }`}
    >
      <div className="aula__quando">
        <span className="aula__numero">{dia(aula.data)}</span>
        <span className="aula__semana">
          {aula.diaDaSemana} {mesCurto(aula.data)}
        </span>
      </div>

      <div
        className="aula__faixa"
        style={{ background: aula.semAula ? "var(--papel-sombra)" : aula.cor }}
        aria-hidden="true"
      />

      <div className="aula__corpo">
        <div className="aula__titulo">{aula.titulo}</div>
        {aula.topico && <div className="aula__topico">{aula.topico}</div>}
        {aula.descricao && <p className="aula__descricao">{aula.descricao}</p>}
        {aula.objetivo && !aula.semAula && <p className="aula__objetivo">{aula.objetivo}</p>}
        {aula.equipe && !aula.semAula && (
          <p className="aula__equipe">
            <span className="aula__rotulo">Com</span> {aula.equipe}
          </p>
        )}
      </div>

      <div className="aula__meta">
        {!aula.semAula && (
          <span
            className="etiqueta"
            style={{
              background: aula.cor,
              color: aula.trilha === "Trilha Empreendedora" ? "var(--preto-grafite)" : "var(--papel)",
            }}
          >
            {aula.trilha}
          </span>
        )}
        {aula.horas && <span className="aula__detalhe">{horasDe(aula.horas)}</span>}
        {aula.local && <span className="aula__detalhe">{aula.local}</span>}
        {ehHoje && <span className="aula__detalhe" style={{ color: "var(--terracota-queimada)" }}>hoje</span>}
        {!passada && !ehHoje && (
          <span className="aula__detalhe">{emPalavras(quantosDias(aula.data))}</span>
        )}
      </div>
    </li>
  );
}
