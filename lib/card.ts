import type { Aula } from "@/lib/calendario";

export type Sede = "cacgb" | "fablab";

/** `local` começando com "CACGB" → cacgb; "Fab Lab Rec" → fablab; qualquer outro (inclusive null) → cacgb, palpite padrão. */
export function sedeDoLocal(local: string | null): Sede {
  if (local?.startsWith("CACGB")) return "cacgb";
  if (local === "Fab Lab Rec") return "fablab";
  return "cacgb";
}

/**
 * Em que encontros o convite faz sentido. Segundas e quartas são a grade das
 * aulas de luteria; as sextas entram só quando o encontro é no Fab Lab Rec,
 * onde a Trilha Empreendedora passou a acontecer. Dia sem aula e feriado,
 * nunca — `semAula` cobre os dois.
 */
export function temConvite(aula: Aula): boolean {
  if (aula.semAula) return false;
  if (aula.diaDaSemana === "Seg" || aula.diaDaSemana === "Qua") return true;
  return aula.diaDaSemana === "Sex" && sedeDoLocal(aula.local) === "fablab";
}

export function nomeCompletoDaSede(sede: Sede): string {
  return sede === "cacgb"
    ? "Centro de Arte e Cultura Grupo Bongar"
    : "Fab Lab Rec";
}

export function saudacaoPorHora(hora: number): "Bom dia!" | "Boa tarde!" {
  return hora < 12 ? "Bom dia!" : "Boa tarde!";
}

const DIAS_SEMANA = [
  "domingo",
  "segunda",
  "terça",
  "quarta",
  "quinta",
  "sexta",
  "sábado",
];

/** "2026-09-30" -> "quarta, 30/9" (sem zero à esquerda). */
export function diaDataDeAula(data: string): string {
  const [ano, mes, dia] = data.split("-").map(Number);
  const diaSemana = new Date(Date.UTC(ano, mes - 1, dia)).getUTCDay();
  return `${DIAS_SEMANA[diaSemana]}, ${dia}/${mes}`;
}

const RE_AULA_LUTERIA = /^Luteria d[oa]\s+(.+?)\s*-\s*Aula\s+(\d+)\s*$/i;

/** "Luteria do Berimbau - Aula 3" -> "Berimbau". null quando o título não segue esse padrão. */
export function extrairInstrumento(titulo: string): string | null {
  return titulo.match(RE_AULA_LUTERIA)?.[1] ?? null;
}

/** "Luteria do Berimbau - Aula 3" -> 3. null quando o título não segue esse padrão. */
export function extrairNumeroDaAula(titulo: string): number | null {
  const m = titulo.match(RE_AULA_LUTERIA);
  return m ? Number(m[2]) : null;
}

/** Remove o sufixo " - Aula N" quando presente; senão devolve o título como está. */
export function tituloSemSufixoAula(titulo: string): string {
  return titulo.replace(/\s*-\s*Aula\s+\d+\s*$/i, "");
}

/** Remove um "prof. " do início; qualquer outro valor (inclusive null) passa sem mudança. */
export function stripPrefixoProf(equipe: string | null): string | null {
  return equipe === null ? null : equipe.replace(/^prof\.\s+/i, "");
}

const ORDINAIS = [
  "primeira",
  "segunda",
  "terceira",
  "quarta",
  "quinta",
  "sexta",
  "sétima",
  "oitava",
  "nona",
  "décima",
];

export function ordinalPT(n: number): string {
  return n >= 1 && n <= 10 ? ORDINAIS[n - 1] : `${n}ª`;
}

export function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** esc(s) e depois troca **texto** por <b>texto</b> — pronto para dangerouslySetInnerHTML. */
export function negrito(s: string): string {
  return esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
}

function topoTarja(prefixo: string, diaData: string): string {
  return prefixo ? `${prefixo} · ${diaData}` : diaData;
}

/** Tarja do cartão cacgb: HTML, com <br> entre a data e o horário. */
export function tarjaCacgb(
  prefixo: string,
  diaData: string,
  horario: string,
): string {
  return `${esc(topoTarja(prefixo, diaData))}<br>${esc(horario)}`;
}

/** Tarja do cartão fablab: texto puro, data e horário na mesma linha. */
export function tarjaFablab(
  prefixo: string,
  diaData: string,
  horario: string,
): string {
  return `${topoTarja(prefixo, diaData)} · ${horario}`;
}

/**
 * Formas de dizer "hoje tem aula em {sede}, das {horário}", todas com negrito
 * nos pontos que o aluno precisa lembrar. `**` vira <b> só quando renderizado via negrito().
 */
export function linha2Variantes(sede: Sede, horario: string): string[] {
  const nome = nomeCompletoDaSede(sede);
  return [
    `Lembrando que **hoje** nossa aula é no **${nome}**, das **${horario}**.`,
    `**Hoje** tem aula no **${nome}**, das **${horario}**.`,
    `Hoje é dia de aula: **${nome}**, das **${horario}**.`,
    `Nos encontramos **hoje** no **${nome}**, das **${horario}**.`,
    `A aula de **hoje** é no **${nome}**, das **${horario}**.`,
    `Passando para lembrar: aula **hoje** no **${nome}**, das **${horario}**.`,
    `Hoje a turma se reúne no **${nome}**, das **${horario}**.`,
    `Esperamos vocês **hoje** no **${nome}**, das **${horario}**.`,
    `Contamos com vocês **hoje** no **${nome}**, das **${horario}**.`,
    `**Hoje**, aula no **${nome}**, das **${horario}**.`,
    `Confirmando: aula **hoje** no **${nome}**, das **${horario}**.`,
    `Hoje o encontro é no **${nome}**, das **${horario}**.`,
  ];
}

/**
 * Formas de anunciar a aula em si — sem mencionar "hoje", que já está coberto
 * pela linha anterior (linha2Variantes). Quando o título segue o padrão de
 * luteria ("Luteria do/da X - Aula N"), usa a forma ordinal ("a terceira aula
 * de Berimbau"); senão cai no título sem o sufixo de aula, como assunto.
 */
export function linha3Variantes(aula: Aula): string[] {
  const quem = stripPrefixoProf(aula.equipe);
  const comQuem = quem ? `, com **${quem}**` : "";

  const instrumento = extrairInstrumento(aula.titulo);
  if (instrumento !== null) {
    // biome-ignore lint/style/noNonNullAssertion: mesma regex de extrairInstrumento já casou — o grupo do número também existe.
    const ordinal = ordinalPT(extrairNumeroDaAula(aula.titulo)!);
    return [
      `É a **${ordinal} aula de ${instrumento}**${comQuem}.`,
      `Chegou a **${ordinal} aula de ${instrumento}**${comQuem}.`,
      `Seguimos com a **${ordinal} aula de ${instrumento}**${comQuem}.`,
      `Temos a **${ordinal} aula de ${instrumento}**${comQuem}.`,
      `O encontro é a **${ordinal} aula de ${instrumento}**${comQuem}.`,
      `Vamos para a **${ordinal} aula de ${instrumento}**${comQuem}.`,
      `No programa, a **${ordinal} aula de ${instrumento}**${comQuem}.`,
      `Na pauta, a **${ordinal} aula de ${instrumento}**${comQuem}.`,
      `É dia da **${ordinal} aula de ${instrumento}**${comQuem}.`,
      `Nosso encontro é a **${ordinal} aula de ${instrumento}**${comQuem}.`,
      `Preparados para a **${ordinal} aula de ${instrumento}**${comQuem}.`,
      `Já estamos na **${ordinal} aula de ${instrumento}**${comQuem}.`,
    ];
  }

  const assunto = tituloSemSufixoAula(aula.titulo);
  return [
    `É **${assunto}**${comQuem}.`,
    `Chegou a vez de **${assunto}**${comQuem}.`,
    `Nosso encontro: **${assunto}**${comQuem}.`,
    `Temos **${assunto}**${comQuem}.`,
    `Na pauta, **${assunto}**${comQuem}.`,
    `É dia de **${assunto}**${comQuem}.`,
    `Vamos ter **${assunto}**${comQuem}.`,
    `No programa, **${assunto}**${comQuem}.`,
  ];
}

export function linha4Variantes(): string[] {
  return [
    "Até lá!",
    "Até logo mais!",
    "Contamos com vocês!",
    "Esperamos vocês!",
    "Venham com disposição!",
    "Nos vemos lá!",
    "Vamos juntos!",
    "Até mais tarde!",
    "Até breve!",
    "Um abraço a todos!",
    "Vamos com tudo!",
    "Até mais!",
  ];
}

/** Sorteia um índice em [0, n). `random` é injetável para os testes. */
export function escolherIndice(
  n: number,
  random: () => number = Math.random,
): number {
  return Math.floor(random() * n);
}

/**
 * Sorteia um índice em [0, n) garantidamente diferente de `atual` — "gerar novamente"
 * não pode, por azar, sortear a mesma frase de novo. Sorteia entre as n-1 opções
 * restantes e desloca por cima de `atual` para manter distribuição uniforme.
 */
export function escolherIndiceDiferente(
  n: number,
  atual: number,
  random: () => number = Math.random,
): number {
  if (n <= 1) return 0;
  const sorteado = escolherIndice(n - 1, random);
  return sorteado >= atual ? sorteado + 1 : sorteado;
}
