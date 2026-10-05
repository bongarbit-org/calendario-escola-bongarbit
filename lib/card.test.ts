import { describe, expect, it } from "vitest";
import type { Aula } from "@/lib/calendario";
import {
  diaDataDeAula,
  esc,
  escolherIndice,
  escolherIndiceDiferente,
  extrairInstrumento,
  extrairNumeroDaAula,
  linha2Variantes,
  linha3Variantes,
  linha4Variantes,
  negrito,
  nomeCompletoDaSede,
  ordinalPT,
  saudacaoPorHora,
  sedeDoLocal,
  stripPrefixoProf,
  tarjaCacgb,
  tarjaFablab,
  tituloSemSufixoAula,
} from "@/lib/card";

function aula(overrides: Partial<Aula>): Aula {
  return {
    data: "2026-09-30",
    diaDaSemana: "Qua",
    titulo: "Luteria do Berimbau - Aula 3",
    descricao: null,
    topico: null,
    trilha: "Luteria Orgânica",
    cor: "var(--verde-baoba)",
    horas: 3,
    local: "CACGB",
    equipe: "prof. Ninho Brown Xambá",
    modulo: "Módulo 2",
    semAula: false,
    ...overrides,
  };
}

describe("sedeDoLocal", () => {
  it("mapeia os dois nomes de CACGB para cacgb", () => {
    expect(sedeDoLocal("CACGB")).toBe("cacgb");
    expect(sedeDoLocal("CACGB - Cabaça")).toBe("cacgb");
  });
  it("mapeia Fab Lab Rec para fablab", () => {
    expect(sedeDoLocal("Fab Lab Rec")).toBe("fablab");
  });
  it("usa cacgb como palpite padrão para locais desconhecidos ou nulos", () => {
    expect(sedeDoLocal("Aldeia Povo Marikito, Escada/PE")).toBe("cacgb");
    expect(sedeDoLocal("Camaragibe Velho")).toBe("cacgb");
    expect(sedeDoLocal(null)).toBe("cacgb");
  });
});

describe("nomeCompletoDaSede", () => {
  it("devolve o nome completo de cada sede", () => {
    expect(nomeCompletoDaSede("cacgb")).toBe(
      "Centro de Arte e Cultura Grupo Bongar",
    );
    expect(nomeCompletoDaSede("fablab")).toBe("Fab Lab Rec");
  });
});

describe("saudacaoPorHora", () => {
  it("bom dia antes do meio-dia, boa tarde depois", () => {
    expect(saudacaoPorHora(0)).toBe("Bom dia!");
    expect(saudacaoPorHora(11)).toBe("Bom dia!");
    expect(saudacaoPorHora(12)).toBe("Boa tarde!");
    expect(saudacaoPorHora(23)).toBe("Boa tarde!");
  });
});

describe("diaDataDeAula", () => {
  it("formata dia da semana e data sem zero à esquerda", () => {
    expect(diaDataDeAula("2026-09-30")).toBe("quarta, 30/9");
    expect(diaDataDeAula("2026-01-05")).toBe("segunda, 5/1");
  });
  it("não erra o sábado, que não tem sufixo -feira a remover", () => {
    expect(diaDataDeAula("2026-10-10")).toBe("sábado, 10/10");
  });
});

describe("extrairInstrumento / extrairNumeroDaAula", () => {
  it("extrai instrumento e número de títulos de luteria", () => {
    expect(extrairInstrumento("Luteria do Berimbau - Aula 1")).toBe("Berimbau");
    expect(extrairNumeroDaAula("Luteria do Berimbau - Aula 1")).toBe(1);
    expect(
      extrairInstrumento("Luteria do Tambor Falante (Tama) - Aula 2"),
    ).toBe("Tambor Falante (Tama)");
    expect(
      extrairNumeroDaAula("Luteria do Tambor Falante (Tama) - Aula 2"),
    ).toBe(2);
  });
  it("devolve null para títulos que não seguem o padrão", () => {
    expect(extrairInstrumento("Café com Bongarbit (3)")).toBeNull();
    expect(extrairNumeroDaAula("Café com Bongarbit (3)")).toBeNull();
    expect(
      extrairInstrumento("Encontro da Trilha de Educação Empreendedora (3)"),
    ).toBeNull();
    expect(extrairInstrumento("Luteria Digital")).toBeNull();
  });
});

describe("tituloSemSufixoAula", () => {
  it("remove o sufixo de aula quando presente", () => {
    expect(tituloSemSufixoAula("Luteria do Berimbau - Aula 1")).toBe(
      "Luteria do Berimbau",
    );
  });
  it("devolve o título sem mudança quando não há sufixo", () => {
    expect(tituloSemSufixoAula("Café com Bongarbit (3)")).toBe(
      "Café com Bongarbit (3)",
    );
    expect(tituloSemSufixoAula("Vivência na Mata")).toBe("Vivência na Mata");
  });
});

describe("stripPrefixoProf", () => {
  it("remove o prefixo prof.", () => {
    expect(stripPrefixoProf("prof. Bolinho")).toBe("Bolinho");
    expect(stripPrefixoProf("prof. Ninho Brown Xambá")).toBe(
      "Ninho Brown Xambá",
    );
  });
  it("não mexe em equipes sem o prefixo", () => {
    expect(stripPrefixoProf("Equipe Fab Lab Rec")).toBe("Equipe Fab Lab Rec");
    expect(stripPrefixoProf("João, Thúlio, Educadores e Monitores")).toBe(
      "João, Thúlio, Educadores e Monitores",
    );
  });
  it("passa null adiante", () => {
    expect(stripPrefixoProf(null)).toBeNull();
  });
});

describe("ordinalPT", () => {
  it("escreve por extenso de 1 a 10", () => {
    expect(ordinalPT(1)).toBe("primeira");
    expect(ordinalPT(3)).toBe("terceira");
    expect(ordinalPT(10)).toBe("décima");
  });
  it("cai no formato numérico fora desse intervalo", () => {
    expect(ordinalPT(11)).toBe("11ª");
  });
});

describe("esc / negrito", () => {
  it("escapa & < >", () => {
    expect(esc("<script>a & b</script>")).toBe(
      "&lt;script&gt;a &amp; b&lt;/script&gt;",
    );
  });
  it("troca **texto** por <b>texto</b> depois de escapar", () => {
    expect(negrito("o **Berimbau** de hoje")).toBe("o <b>Berimbau</b> de hoje");
  });
  it("deixa ** sem par como está, sem quebrar", () => {
    expect(negrito("preço: R$ 10 ** promoção")).toBe(
      "preço: R$ 10 ** promoção",
    );
  });
});

describe("tarjaCacgb / tarjaFablab", () => {
  it("monta a tarja cacgb em HTML, com <br> entre data e horário", () => {
    expect(tarjaCacgb("Hoje", "quarta, 30/9", "18h às 21h")).toBe(
      "Hoje · quarta, 30/9<br>18h às 21h",
    );
  });
  it("monta a tarja fablab em texto puro, tudo na mesma linha", () => {
    expect(tarjaFablab("Hoje", "quarta, 30/9", "18h às 21h")).toBe(
      "Hoje · quarta, 30/9 · 18h às 21h",
    );
  });
  it("omite o prefixo quando vazio", () => {
    expect(tarjaCacgb("", "quarta, 30/9", "18h às 21h")).toBe(
      "quarta, 30/9<br>18h às 21h",
    );
  });
});

describe("linha2Variantes", () => {
  it("todas as variantes citam a sede e o horário em negrito", () => {
    for (const v of linha2Variantes("cacgb", "18h às 21h")) {
      expect(v).toContain("**Centro de Arte e Cultura Grupo Bongar**");
      expect(v).toContain("**18h às 21h**");
    }
  });
});

describe("linha3Variantes", () => {
  it("usa a forma ordinal para títulos de luteria", () => {
    for (const v of linha3Variantes(aula({}))) {
      expect(v).toContain("terceira aula de Berimbau");
      expect(v).toContain("Ninho Brown Xambá");
    }
  });
  it("cai no título sem sufixo quando não é luteria", () => {
    for (const v of linha3Variantes(
      aula({ titulo: "Vivência na Mata", equipe: null }),
    )) {
      expect(v).toContain("Vivência na Mata");
      expect(v).not.toContain(", com **");
    }
  });
  it("nunca menciona 'hoje' — quem já diz isso é a linha2Variantes", () => {
    const variantes = [
      ...linha3Variantes(aula({})),
      ...linha3Variantes(aula({ titulo: "Vivência na Mata", equipe: null })),
    ];
    for (const v of variantes) {
      expect(v.toLowerCase()).not.toContain("hoje");
    }
  });
});

describe("linha4Variantes", () => {
  it("só fechamentos curtos e sem emoji", () => {
    for (const v of linha4Variantes()) {
      expect(v.length).toBeLessThan(30);
      expect(v).not.toMatch(/[\u{1F300}-\u{1FAFF}]/u);
    }
  });
});

describe("escolherIndice", () => {
  it("random = 0 escolhe o primeiro item", () => {
    expect(escolherIndice(3, () => 0)).toBe(0);
  });
  it("random perto de 1 escolhe o último item", () => {
    expect(escolherIndice(3, () => 0.999)).toBe(2);
  });
});

describe("escolherIndiceDiferente", () => {
  it("nunca devolve o índice atual, para qualquer sorteio", () => {
    for (const r of [0, 0.1, 0.33, 0.34, 0.5, 0.66, 0.67, 0.9, 0.999]) {
      for (let atual = 0; atual < 4; atual++) {
        expect(escolherIndiceDiferente(4, atual, () => r)).not.toBe(atual);
      }
    }
  });
  it("cobre todos os índices restantes conforme o sorteio varia", () => {
    expect(escolherIndiceDiferente(3, 1, () => 0)).toBe(0);
    expect(escolherIndiceDiferente(3, 1, () => 0.9)).toBe(2);
  });
  it("com n=1 não há para onde ir: devolve 0", () => {
    expect(escolherIndiceDiferente(1, 0, () => 0.5)).toBe(0);
  });
});
