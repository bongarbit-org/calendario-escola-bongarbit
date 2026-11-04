import { Encontros } from "@/components/Encontros";
import { ProvedorHorarios } from "@/components/HorariosContext";
import { AGENDA_GOOGLE, AGENDA_ICS } from "@/lib/agenda";
import { hoje } from "@/lib/calendario";

// O build só fixa o primeiro HTML: "hoje", o próximo encontro e a contagem do
// rodapé são recalculados no navegador por <Encontros>.
export default function Pagina() {
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

        <Encontros
          hojeDoBuild={hoje()}
          assinar={
            <section className="assinar">
              <p className="assinar__texto">
                <strong>Leve o calendário no celular.</strong> Assine a agenda
                da escola e as aulas aparecem sozinhas no seu telefone, com
                lembrete e tudo — se uma data mudar, muda lá também.
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
          }
        />
      </main>
    </ProvedorHorarios>
  );
}
