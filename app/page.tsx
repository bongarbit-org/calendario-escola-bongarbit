import { Calendario } from "@/components/Calendario";
import { CardDoDia } from "@/components/CardDoDia";
import {
  calendario, dia, emPalavras, hoje, horasDe, mesCurto, proximaAula, quantosDias, todasAsAulas,
} from "@/lib/calendario";

export const dynamic = "force-dynamic";

// A agenda pública "Bongarbit - Escola de Luteria - Alunos", no Google Calendar.
const ID_AGENDA =
  "b066261daf2a5e9b5a30c0e7765f8e851572c5c5b31382976ae761f88e42bd1c@group.calendar.google.com";
const AGENDA_GOOGLE = `https://calendar.google.com/calendar/u/0?cid=${Buffer.from(ID_AGENDA).toString("base64")}`;
// iPhone, Outlook e qualquer outro leitor de .ics assinam por aqui.
const AGENDA_ICS = `https://calendar.google.com/calendar/ical/${encodeURIComponent(ID_AGENDA)}/public/basic.ics`;

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
          Os encontros da escola de luteria, de setembro em diante. As aulas de luteria,
          orgânica e digital, são no <strong>CACGB</strong>, às segundas e quartas. Em
          outubro não há luteria: o mês é da Trilha Empreendedora, que se divide entre as{" "}
          <strong>quartas no CACGB</strong> (7 e 21) e as{" "}
          <strong>sextas no Fab Lab Rec</strong> (16 e 30) — endereço diferente, fique
          atento. Os Cafés com Bongarbit acontecem aos sábados, na Cabaça do CACGB —
          menos o de novembro, que é na Aldeia Povo Marikito, em Escada.
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
            {proxima.data === h && (proxima.diaDaSemana === "Seg" || proxima.diaDaSemana === "Qua") && (
              <div style={{ marginTop: "var(--space-3)" }}>
                <CardDoDia aula={proxima} />
              </div>
            )}
          </div>
        </section>
      )}

      <section className="assinar">
        <p className="assinar__texto">
          <strong>Leve o calendário no celular.</strong> Assine a agenda da escola e as aulas
          aparecem sozinhas no seu telefone, com lembrete e tudo — se uma data mudar, muda lá
          também.
        </p>
        <a className="botao" href={AGENDA_GOOGLE} target="_blank" rel="noreferrer">
          Adicionar ao Google Agenda
        </a>
        <a className="botao botao--fantasma" href={AGENDA_ICS} target="_blank" rel="noreferrer">
          Outro app (.ics)
        </a>
      </section>

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
