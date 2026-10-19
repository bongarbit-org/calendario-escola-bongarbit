import { Calendario } from "@/components/Calendario";
import {
  BotaoVisualizarConvite,
  ConviteDoDiaProvider,
} from "@/components/ConviteDoDia";
import { DetalheProxima } from "@/components/DetalheProxima";
import { ProvedorHorarios } from "@/components/HorariosContext";
import { AGENDA_GOOGLE, AGENDA_ICS } from "@/lib/agenda";
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

export const dynamic = "force-dynamic";

export default function Pagina() {
  const h = hoje();
  const proxima = proximaAula();
  const aulas = todasAsAulas();
  const pelaFrente = aulas.filter((a) => a.data >= h && !a.semAula);
  const horas = pelaFrente.reduce((s, a) => s + (a.horas ?? 0), 0);
  // O destaque "Próximo encontro" e a linha de hoje no calendário mostram o
  // mesmo convite — um só provider, mais abaixo, cobre os dois.
  const aulaDoConvite =
    proxima && proxima.data === h && temConvite(proxima) ? proxima : null;

  return (
    <ProvedorHorarios>
      <main className="pagina">
        <header className="topo">
          <div className="olho">Escola Bongarbit</div>
          <h1 className="topo__titulo">Calendário de aulas</h1>
          <p className="topo__nota">
            Os encontros da escola de luteria, de setembro em diante. As aulas
            de luteria, orgânica e digital, são no <strong>CACGB</strong>, às
            segundas e quartas. Outubro é sobretudo da Trilha Empreendedora, que
            se divide entre o <strong>CACGB</strong> (quarta 7 e segunda 19) e o{" "}
            <strong>Fab Lab Rec</strong> (sextas 16 e 30) — endereço diferente,
            fique atento. Fora isso, o mês tem a aula de Berimbau da segunda 5 e
            a <strong>Vivência na Mata</strong>, no sábado 10, em Camaragibe
            Velho. Na quarta 21, a Formação de Agentes Culturais, e no sábado
            24, a Oficina de Produção Cultural, ambas no <strong>CACGB</strong>.
            Os Cafés com Bongarbit acontecem aos sábados, na Cabaça do CACGB —
            menos o de novembro, que é na Aldeia Povo Marikito, em Escada.
          </p>
        </header>

        <ConviteDoDiaProvider aula={aulaDoConvite}>
          {proxima && (
            <section className="proxima">
              <div className="proxima__data">
                <div className="proxima__dia">{dia(proxima.data)}</div>
                <div className="proxima__mes">{mesCurto(proxima.data)}</div>
              </div>
              <div className="proxima__corpo">
                <div className="olho">
                  Próximo encontro · {proxima.diaDaSemana} ·{" "}
                  {emPalavras(quantosDias(proxima.data))}
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

          <section className="assinar">
            <p className="assinar__texto">
              <strong>Leve o calendário no celular.</strong> Assine a agenda da
              escola e as aulas aparecem sozinhas no seu telefone, com lembrete
              e tudo — se uma data mudar, muda lá também.
            </p>
            <a
              className="botao"
              href={AGENDA_GOOGLE}
              target="_blank"
              rel="noreferrer"
            >
              Adicionar ao Google Agenda
            </a>
            <a
              className="botao botao--fantasma"
              href={AGENDA_ICS}
              target="_blank"
              rel="noreferrer"
            >
              Outro app (.ics)
            </a>
          </section>

          <Calendario hoje={h} />
        </ConviteDoDiaProvider>

        <footer className="rodape">
          <p>
            {pelaFrente.length} encontros pela frente, {horas.toFixed(0)}h de
            formação. Calendário sujeito a mudanças — confirme com a equipe da
            escola.
          </p>
        </footer>
      </main>
    </ProvedorHorarios>
  );
}
