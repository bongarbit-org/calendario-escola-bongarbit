import dados from "@/content/calendario.json";

export type Aula = {
  data: string;
  diaDaSemana: string;
  titulo: string;
  descricao: string | null;
  topico: string | null;
  trilha: string;
  cor: string;
  horas: number | null;
  local: string | null;
  equipe: string | null;
  modulo: string | null;
  semAula: boolean;
};

export type Mes = { chave: string; nome: string; itens: Aula[] };

export const calendario = {
  ...dados,
  meses: dados.meses as Mes[],
  trilhas: dados.trilhas as { nome: string; cor: string }[],
};

export const todasAsAulas = (): Aula[] => calendario.meses.flatMap((m) => m.itens);

const FUSO = "America/Recife";

/** Hoje no fuso de Recife — o servidor da Vercel roda em UTC. */
export function hoje(): string {
  // Só para os testes e2e: sem isto, "hoje" muda todo dia e o teste não tem como
  // escolher uma data previsível. Nunca é lido a partir de requisição do navegador.
  if (process.env.CALENDARIO_HOJE_TESTE) return process.env.CALENDARIO_HOJE_TESTE;
  const p = new Intl.DateTimeFormat("pt-BR", {
    timeZone: FUSO, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const v = (t: string) => p.find((x) => x.type === t)!.value;
  return `${v("year")}-${v("month")}-${v("day")}`;
}

export const dia = (data: string) => Number(data.slice(8, 10));

const MESES_CURTOS = ["jan", "fev", "mar", "abr", "mai", "jun",
                      "jul", "ago", "set", "out", "nov", "dez"];

export const mesCurto = (data: string) => MESES_CURTOS[Number(data.slice(5, 7)) - 1];

/** A próxima atividade a partir de hoje, ignorando os dias sem aula. */
export function proximaAula(): Aula | undefined {
  const h = hoje();
  return todasAsAulas().find((a) => a.data >= h && !a.semAula);
}

// `hojeStr` é opcional e serve pra quem já tem "hoje" em mãos (como o Calendario,
// que recebe via prop): sem ele, componente cliente que chamasse hoje() de novo no
// próprio render pegaria a data real do navegador, não a travada por
// CALENDARIO_HOJE_TESTE no servidor — SSR e hidratação calculavam "hoje" diferente
// e React acusava mismatch de hidratação nos testes e2e.
export function quantosDias(data: string, hojeStr: string = hoje()): number {
  const [a1, m1, d1] = hojeStr.split("-").map(Number);
  const [a2, m2, d2] = data.split("-").map(Number);
  return Math.round(
    (new Date(a2, m2 - 1, d2).getTime() - new Date(a1, m1 - 1, d1).getTime()) / 86400000
  );
}

export function emPalavras(dias: number): string {
  if (dias === 0) return "é hoje";
  if (dias === 1) return "é amanhã";
  if (dias < 0) return "já passou";
  if (dias < 7) return `em ${dias} dias`;
  const semanas = Math.round(dias / 7);
  return semanas === 1 ? "em uma semana" : `em ${semanas} semanas`;
}

export const horasDe = (n: number | null) =>
  n === null ? null : Number.isInteger(n) ? `${n}h` : `${n.toString().replace(".", ",")}h`;
