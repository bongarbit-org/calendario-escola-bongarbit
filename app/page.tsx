import { Calendario } from "@/components/Calendario";
import {
  calendario, dia, emPalavras, hoje, horasDe, mesCurto, proximaAula, quantosDias, todasAsAulas,
} from "@/lib/calendario";

export const dynamic = "force-dynamic";

export default function Pagina() {
  const h = hoje();
  const proxima = proximaAula();
  const aulas = todasAsAulas();
  const pelaFrente = aulas.filter((a) => a.data >= h && !a.semAula);
  const horas = pelaFrente.reduce((s, a) => s + (a.horas ?? 0), 0);

  return (
    <main className="pagina">
      <header className="topo">
        <div className="olho">Escola Bongarbit</div>
        <h1 className="topo__titulo">Calendário de aulas</h1>
        <p className="topo__nota">
          Os encontros da escola de luteria, de setembro em diante. As aulas acontecem
          no CACGB, às segundas e quartas; os Cafés com Bongarbit, aos sábados.
        </p>
      </header>

      {proxima && (
        <section className="proxima">
          <div className="proxima__data">
            <div className="proxima__dia">{dia(proxima.data)}</div>
            <div className="proxima__mes">{mesCurto(proxima.data)}</div>
          </div>
          <div className="proxima__corpo">
            <div className="olho">
              Próximo encontro · {proxima.diaDaSemana} · {emPalavras(quantosDias(proxima.data))}
            </div>
            <h2 className="proxima__titulo">{proxima.titulo}</h2>
            {proxima.topico && <p className="aula__topico">{proxima.topico}</p>}
            {proxima.descricao && <p className="aula__descricao">{proxima.descricao}</p>}
            <p className="aula__detalhe" style={{ marginTop: "var(--space-3)" }}>
              {[proxima.trilha, horasDe(proxima.horas), proxima.local]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
        </section>
      )}

      <Calendario hoje={h} />

      <footer className="rodape">
        <p>
          {pelaFrente.length} encontros pela frente, {horas.toFixed(0)}h de formação.
          Calendário sujeito a mudanças — confirme com a equipe da escola.
        </p>
        <p style={{ marginTop: "var(--space-2)" }}>
          A Vivência na Mata ainda não tem data definida e por isso não aparece aqui.
        </p>
      </footer>
    </main>
  );
}
