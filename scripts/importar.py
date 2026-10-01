"""
importar.py — Lê o CRONOGRAMA PEDAGÓGICO.xlsx e gera content/calendario.json.

O .xlsx é a fonte: baixe a planilha do Drive e aponte o caminho.

    python3 scripts/importar.py ~/Downloads/CRONOGRAMA\\ PEDAGÓGICO.xlsx

O que fica de fora, de propósito:
  · Circulação — não diz respeito aos alunos da escola
  · Vivência na Mata, como vem da planilha — a linha de lá tem data vencida e
    local "a definir"; a data confirmada entra por ACRESCENTAR
  · Pagamentos e dados pessoais dos educadores — nunca saem da planilha
"""

import datetime
import json
import os
import re
import sys

import openpyxl

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SAIDA = os.path.join(RAIZ, "content", "calendario.json")

COMECO = datetime.datetime(2026, 9, 1)

# Não entram no calendário dos alunos.
EXCLUIR = ("vivência na mata", "circulação")

# A trilha vem do nome da atividade, que é inequívoco. A coluna "Trilha" da
# planilha diverge em algumas linhas — ver a divergência reportada no README.
TRILHAS = [
    ("Luteria Digital", ("luteria digital",)),
    ("Luteria Orgânica", ("tambor falante", "berimbau", "engome", "agbê", "agbe", "gonguê")),
    ("Trilha Empreendedora", ("trilha de educação empreendedora",)),
    ("Eventos Abertos", ("café com bongarbit", "show de culminância")),
]

# A coluna "Equipe" da planilha traz sempre a mesma lista genérica; quem de fato
# dá cada aula foi informado pela coordenação e mora aqui, casado pelo nome da
# atividade. Some quando a planilha passar a nomear os professores por aula.
PROFESSORES = [
    (("café com bongarbit",), "Equipe de produção e monitoria do Bongarbit"),
    (("trilha de educação empreendedora",), "Equipe Fab Lab Rec"),
    (("tambor falante",), "prof. Bolinho"),
    (("berimbau",), "prof. Ninho Brown Xambá"),
    (("luteria digital",), "prof. Rafael, Thúlio Xambá e João Tragtenberg"),
]


def equipe_de(atividade: str, da_planilha):
    baixa = atividade.lower()
    for chaves, professores in PROFESSORES:
        if any(k in baixa for k in chaves):
            return professores
    return re.sub(r"\s+", " ", str(da_planilha)).strip() if da_planilha else None


# Onde cada trilha acontece. A coluna "Local" da planilha já trouxe "Módulo 2" e
# "Eventos Abertos" no lugar do local, então a trilha manda — só os Eventos
# Abertos, que mudam de casa, continuam vindo da planilha.
LOCAIS = {
    "Luteria Orgânica": "CACGB",
    "Luteria Digital": "CACGB",
    # A Trilha Empreendedora se divide entre duas casas e por isso sai por data,
    # em AJUSTES, e não por trilha.
}

# Ajustes pontuais confirmados pela coordenação e ainda não refletidos na
# planilha, casados pela data. Cada linha some quando a planilha for corrigida.
AJUSTES = {
    # O Café de novembro saiu do Recife e perdeu o subtítulo.
    "2026-11-07": {
        "titulo": "Café com Bongarbit (5)",
        "local": "Aldeia Povo Marikito, Escada/PE",
    },
    # Aula extra de Berimbau marcada depois que a planilha deu 05/10 como dia
    # sem aula. Sobrescreve a linha inteira, inclusive semAula.
    "2026-10-05": {
        "titulo": "Luteria do Berimbau - Aula 4",
        "trilha": "Luteria Orgânica",
        "cor": "var(--verde-baoba)",
        "horas": 3.0,
        "local": "CACGB",
        "equipe": "prof. Ninho Brown Xambá",
        "semAula": False,
    },
    # A Trilha Empreendedora se divide: quartas no CACGB, sextas no Fab Lab Rec.
    # Os dois encontros de sexta saíram das quartas 14 e 28/10 — ver ACRESCENTAR.
    "2026-10-07": {"local": "CACGB"},
    "2026-10-21": {"local": "CACGB"},
    "2026-10-14": {"data": "2026-10-16", "diaDaSemana": "Sex", "local": "Fab Lab Rec"},
    "2026-10-28": {"data": "2026-10-30", "diaDaSemana": "Sex", "local": "Fab Lab Rec"},
}

# Entradas que a planilha não traz utilizáveis. Cada uma declara só o que a
# distingue; o resto vem dos padrões de acrescentada(), que assume dia sem aula.
ACRESCENTAR = [
    # As quartas que ficaram vazias quando a Trilha Empreendedora passou para
    # sexta — o aluno precisa ver isso escrito.
    {"data": "2026-10-14", "diaDaSemana": "Qua"},
    {"data": "2026-10-28", "diaDaSemana": "Qua"},
    # A Vivência na Mata está na planilha sem data utilizável ("Mata a Definir",
    # numa data já vencida) e por isso continua em EXCLUIR. Entra por aqui, com
    # a data e o local confirmados pela coordenação. Se a planilha for corrigida
    # na origem, tire-a de EXCLUIR e apague esta entrada — senão, duplica.
    {
        "data": "2026-10-10",
        "diaDaSemana": "Sáb",
        "titulo": "Vivência na Mata",
        "trilha": "Luteria Orgânica",
        "horas": 9.0,
        "local": "Camaragibe Velho",
        "equipe": "prof. Ninho Brown Xambá",
        "modulo": "Módulo 1",
    },
]


def acrescentada(base: dict) -> dict:
    """Completa uma entrada de ACRESCENTAR. Sem trilha declarada, é dia sem aula."""
    trilha = base.get("trilha", "Sem aula")
    return {
        "descricao": None, "topico": None, "trilha": trilha,
        "cor": CORES.get(trilha, CORES["Sem aula"]), "horas": None,
        "local": "CACGB", "equipe": None, "modulo": "Módulo 2",
        "semAula": trilha == "Sem aula", "titulo": "Não haverá aula", **base,
    }

# O texto que a planilha traz para a Trilha Empreendedora é copiado das aulas de
# luteria e não descreve o encontro. Melhor nada do que errado.
SEM_CONTEUDO = ("Trilha Empreendedora",)

# A coluna "resultado esperado" (ETAPA, a segunda) não é importada. Ela é
# linguagem de prestação de contas — "Avanço no aprendizado de X conforme plano
# de ensino" — e está desalinhada na origem: das 41 entradas, 5 contradiziam o
# título da própria aula, 3 caíam em dias sem aula e 21 eram genéricas demais
# para conferir. Só 6 batiam. Se a coluna for corrigida e passar a servir ao
# aluno, o campo volta aqui e em lib/calendario.ts.


# Feriados em que não há aula. Entram como dias sem aula, mas com o motivo
# escrito — "Carnaval" diz ao aluno o que "Não haverá aula" não diz. Não vão
# para a agenda do Google, que lista só os dias com aula.
FERIADOS = {
    "2026-10-12": "Nossa Senhora Aparecida",
    "2026-11-02": "Finados",
    "2026-12-25": "Natal",
    "2027-01-01": "Ano Novo",
    # Carnaval de 2027: da quinta à Quarta de Cinzas, os sete dias.
    "2027-02-04": "Carnaval",
    "2027-02-05": "Carnaval",
    "2027-02-06": "Carnaval",
    "2027-02-07": "Carnaval",
    "2027-02-08": "Carnaval",
    "2027-02-09": "Terça de Carnaval",
    "2027-02-10": "Quarta de Cinzas",
}

CORES = {
    "Luteria Orgânica": "var(--verde-baoba)",
    "Luteria Digital": "var(--azul-caixa-dagua)",
    "Trilha Empreendedora": "var(--amarelo-ocre)",
    "Eventos Abertos": "var(--terracota-queimada)",
    "Sem aula": "var(--grafite-45)",
    "Feriado": "var(--grafite-45)",
}

SEMANA = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"]


def feriado(data: str, nome: str) -> dict:
    return {
        "data": data,
        "diaDaSemana": SEMANA[datetime.date.fromisoformat(data).weekday()],
        "titulo": nome, "descricao": None, "topico": None,
        "trilha": "Feriado", "cor": CORES["Feriado"], "horas": None,
        "local": None, "equipe": None, "modulo": None, "semAula": True,
    }

MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho",
         "agosto", "setembro", "outubro", "novembro", "dezembro"]


def trilha_de(atividade: str, da_planilha) -> str:
    baixa = atividade.lower()
    if "não haverá aula" in baixa:
        return "Sem aula"
    for nome, chaves in TRILHAS:
        if any(k in baixa for k in chaves):
            return nome
    return str(da_planilha) if da_planilha else "Outros"


def limpar_titulo(atividade: str) -> tuple[str, str | None]:
    """Separa o título curto da descrição longa que vem depois dos dois-pontos."""
    atividade = re.sub(r"\s+", " ", atividade).strip()
    if ":" in atividade:
        titulo, resto = atividade.split(":", 1)
        return titulo.strip(), resto.strip() or None
    return atividade, None


def main() -> int:
    if len(sys.argv) < 2:
        print(__doc__)
        return 1
    wb = openpyxl.load_workbook(sys.argv[1], data_only=True)

    # tópico de cada aula de Luteria Digital, que mora em aba separada
    topicos: dict[str, str] = {}
    if "Planejamento Luteria Digital" in wb.sheetnames:
        for r in wb["Planejamento Luteria Digital"].iter_rows(min_row=3, values_only=True):
            if isinstance(r[2], datetime.datetime) and r[7]:
                topicos[r[2].date().isoformat()] = re.sub(r"\s+", " ", str(r[7])).strip()

    itens, excluidos = [], []
    for r in wb["Cronograma detalhado"].iter_rows(min_row=3, values_only=True):
        quando = r[2]
        if not isinstance(quando, datetime.datetime) or quando < COMECO or not r[5]:
            continue
        atividade = re.sub(r"\s+", " ", str(r[5])).strip()
        if any(e in atividade.lower() for e in EXCLUIR):
            excluidos.append((quando.date().isoformat(), atividade))
            continue

        data = quando.date().isoformat()
        titulo, descricao = limpar_titulo(atividade)
        trilha = trilha_de(atividade, r[8])
        topico = topicos.get(data)
        if trilha in SEM_CONTEUDO:
            descricao = topico = None
        itens.append({
            "data": data,
            "diaDaSemana": r[3],
            "titulo": titulo,
            "descricao": descricao,
            "topico": topico,
            "trilha": trilha,
            "cor": CORES.get(trilha, "var(--grafite-45)"),
            "horas": float(r[4]) if r[4] else None,
            "local": LOCAIS.get(trilha) or (r[10] or "").strip() or None,
            # a planilha repete o cabeçalho "ETAPA": [11] é a equipe
            "equipe": equipe_de(atividade, r[11]),
            "modulo": (r[9] or "").strip() or None,
            "semAula": trilha == "Sem aula",
        })

    for i in itens:
        i.update(AJUSTES.get(i["data"], {}))
    itens += [acrescentada(b) for b in ACRESCENTAR]
    ocupadas = {i["data"] for i in itens}
    itens += [feriado(d, n) for d, n in FERIADOS.items()
              if d >= COMECO.date().isoformat() and d not in ocupadas]

    itens.sort(key=lambda i: i["data"])
    meses = []
    for i in itens:
        a, m, _ = i["data"].split("-")
        chave = f"{a}-{m}"
        if not meses or meses[-1]["chave"] != chave:
            meses.append({"chave": chave, "nome": f"{MESES[int(m) - 1]} de {a}", "itens": []})
        meses[-1]["itens"].append(i)

    os.makedirs(os.path.dirname(SAIDA), exist_ok=True)
    with open(SAIDA, "w", encoding="utf-8") as f:
        json.dump({
            "geradoEm": datetime.datetime.now().isoformat(timespec="seconds"),
            "fonte": os.path.basename(sys.argv[1]),
            "comeca": COMECO.date().isoformat(),
            "trilhas": [{"nome": n, "cor": CORES[n]} for n, _ in TRILHAS],
            "meses": meses,
        }, f, ensure_ascii=False, indent=2)

    horas = sum(i["horas"] or 0 for i in itens if not i["semAula"])
    print(f"✓ {len(itens)} entradas em {len(meses)} meses · {horas:.0f}h de formação")
    print(f"  {os.path.relpath(SAIDA, RAIZ)}")
    if excluidos:
        print(f"\n  fora do calendário ({len(excluidos)}):")
        for d, a in excluidos:
            print(f"    {d}  {a[:60]}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
