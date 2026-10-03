"use client";

import { useMemo, useState } from "react";
import {
  calendario, dia, emPalavras, horasDe, mesCurto, quantosDias, type Aula,
} from "@/lib/calendario";
import { CardDoDia } from "@/components/CardDoDia";

const SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

/** As células de um mês, do primeiro domingo da grade ao último sábado. */
function grade(chave: string, itens: Aula[]) {
  const [ano, mes] = chave.split("-").map(Number);
  const antes = new Date(Date.UTC(ano, mes - 1, 1)).getUTCDay();
  const quantos = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
  const celulas: ({ data: string; itens: Aula[] } | null)[] = Array(antes).fill(null);
  for (let d = 1; d <= quantos; d++) {
    const data = `${chave}-${String(d).padStart(2, "0")}`;
    celulas.push({ data, itens: itens.filter((a) => a.data === data) });
  }
  while (celulas.length % 7) celulas.push(null);
  return celulas;
}

export function Calendario({
  hoje, horarios,
}: {
  hoje: string;
  horarios?: Record<string, string>;
}) {
  const [trilha, setTrilha] = useState<string | null>(null);
  const [mostrarPassadas, setMostrarPassadas] = useState(false);
  const [vista, setVista] = useState<"lista" | "grade">("lista");
  const [aberto, setAberto] = useState<string | null>(null);

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

  // Na grade o mês vem inteiro — um calendário com buracos não se lê.
  const mesesDaGrade = useMemo(
    () =>
      calendario.meses
        .map((m) => ({ ...m, itens: m.itens.filter((a) => !trilha || a.trilha === trilha) }))
        .filter((m) => m.itens.length > 0)
        .filter((m) => mostrarPassadas || m.chave >= hoje.slice(0, 7)),
    [trilha, mostrarPassadas, hoje]
  );

  const contagem = (nome: string) =>
    calendario.meses
      .flatMap((m) => m.itens)
      .filter((a) => a.trilha === nome && (mostrarPassadas || a.data >= hoje)).length;

  const passadas = calendario.meses.flatMap((m) => m.itens).filter((a) => a.data < hoje).length;

  return (
    <>
      <div className="vistas">
        <button
          type="button"
          onClick={() => setVista("lista")}
          className={`botao ${vista === "lista" ? "" : "botao--fantasma"}`}
          aria-pressed={vista === "lista"}
        >
          Lista
        </button>
        <button
          type="button"
          onClick={() => setVista("grade")}
          className={`botao ${vista === "grade" ? "" : "botao--fantasma"}`}
          aria-pressed={vista === "grade"}
        >
          Calendário
        </button>
      </div>

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

      {vista === "grade" &&
        mesesDaGrade.map((mes) => (
          <section className="mes" key={mes.chave}>
            <h2 className="mes__titulo">
              {mes.nome}
              <span>
                {mes.itens.filter((a) => !a.semAula).length}{" "}
                {mes.itens.filter((a) => !a.semAula).length === 1 ? "encontro" : "encontros"}
              </span>
            </h2>

            <div className="grade" role="grid" aria-label={mes.nome}>
              {SEMANA.map((d) => (
                <div className="grade__peso" key={d} role="columnheader">
                  {d}
                </div>
              ))}
              {grade(mes.chave, mes.itens).map((celula, i) =>
                celula === null ? (
                  <div className="grade__vazio" key={`v${i}`} role="gridcell" />
                ) : (
                  <Celula
                    key={celula.data}
                    data={celula.data}
                    itens={celula.itens}
                    hoje={hoje}
                    aberto={aberto === celula.data}
                    aoAbrir={() => setAberto(aberto === celula.data ? null : celula.data)}
                  />
                )
              )}
            </div>

            {aberto?.startsWith(mes.chave) && (
              <ul className="grade__detalhe">
                {mes.itens
                  .filter((a) => a.data === aberto)
                  .map((aula) => (
                    <LinhaDaAula key={aula.data + aula.titulo} aula={aula} hoje={hoje} horarios={horarios} />
                  ))}
              </ul>
            )}
          </section>
        ))}

      {vista === "lista" &&
        meses.map((mes) => (
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
              <LinhaDaAula key={aula.data + aula.titulo} aula={aula} hoje={hoje} horarios={horarios} />
            ))}
          </ul>
        </section>
      ))}

      {((vista === "lista" && meses.length === 0) ||
        (vista === "grade" && mesesDaGrade.length === 0)) && (
        <p className="rodape" style={{ marginTop: "var(--space-6)" }}>
          Nenhum encontro nesta trilha daqui para a frente.
        </p>
      )}
    </>
  );
}

function LinhaDaAula({
  aula, hoje, horarios,
}: {
  aula: Aula;
  hoje: string;
  horarios?: Record<string, string>;
}) {
  const passada = aula.data < hoje;
  const ehHoje = aula.data === hoje;
  const horarioDaAula = !aula.semAula ? horarios?.[aula.data] : undefined;

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
        {aula.equipe && !aula.semAula && (
          <p className="aula__equipe">
            <span className="aula__rotulo">Com</span> {aula.equipe}
          </p>
        )}
      </div>

      <div className="aula__meta">
        {aula.semAula ? (
          // Dia sem aula leva etiqueta própria: some grifado é melhor que some apagado.
          // O feriado diz o motivo — o título já traz o nome da data.
          <span className="etiqueta etiqueta--sem-aula">
            {aula.trilha === "Feriado" ? "Feriado" : "Sem aula"}
          </span>
        ) : (
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
        {/* Prefere o horário de verdade (vindo do .ics); sem ele, só a carga horária. */}
        {horarioDaAula ? (
          <span className="aula__detalhe">{horarioDaAula}</span>
        ) : (
          aula.horas && <span className="aula__detalhe">{horasDe(aula.horas)}</span>
        )}
        {/* Local num dia sem aula só confunde — não há aonde ir. */}
        {aula.local && !aula.semAula && <span className="aula__detalhe">{aula.local}</span>}
        {ehHoje && <span className="aula__detalhe" style={{ color: "var(--terracota-queimada)" }}>hoje</span>}
        {ehHoje && !aula.semAula && (aula.diaDaSemana === "Seg" || aula.diaDaSemana === "Qua") && (
          <CardDoDia aula={aula} horarioInicial={horarioDaAula} />
        )}
        {!passada && !ehHoje && (
          <span className="aula__detalhe">{emPalavras(quantosDias(aula.data))}</span>
        )}
      </div>
    </li>
  );
}

/** Um dia na grade. Sem encontro é só o número; com encontro, vira botão. */
function Celula({
  data, itens, hoje, aberto, aoAbrir,
}: {
  data: string;
  itens: Aula[];
  hoje: string;
  aberto: boolean;
  aoAbrir: () => void;
}) {
  const ehHoje = data === hoje;
  const passada = data < hoje;
  const classe = `grade__dia ${passada ? "grade__dia--passada" : ""} ${
    ehHoje ? "grade__dia--hoje" : ""
  } ${aberto ? "grade__dia--aberta" : ""}`;

  if (itens.length === 0) {
    return (
      <div className={classe} role="gridcell">
        <span className="grade__numero">{dia(data)}</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      role="gridcell"
      onClick={aoAbrir}
      aria-expanded={aberto}
      className={`${classe} grade__dia--tem`}
      title={itens.map((a) => a.titulo).join(" · ")}
    >
      <span className="grade__numero">{dia(data)}</span>
      {itens.map((a) => (
        <span
          key={a.titulo}
          className={`grade__marca ${a.semAula ? "grade__marca--sem-aula" : ""}`}
          style={{ background: a.semAula ? "transparent" : a.cor }}
        >
          <span className="grade__marca-texto">
            {a.semAula && a.trilha !== "Feriado" ? "sem aula" : a.titulo}
          </span>
        </span>
      ))}
    </button>
  );
}
