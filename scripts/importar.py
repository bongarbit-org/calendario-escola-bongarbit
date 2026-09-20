"""
importar.py — Lê o CRONOGRAMA PEDAGÓGICO.xlsx e gera content/calendario.json.

O .xlsx é a fonte: baixe a planilha do Drive e aponte o caminho.

    python3 scripts/importar.py ~/Downloads/CRONOGRAMA\\ PEDAGÓGICO.xlsx

O que fica de fora, de propósito:
  · Vivência na Mata — a data ainda não foi definida
  · Circulação       — não diz respeito aos alunos da escola
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

CORES = {
    "Luteria Orgânica": "var(--verde-baoba)",
    "Luteria Digital": "var(--azul-caixa-dagua)",
    "Trilha Empreendedora": "var(--amarelo-ocre)",
    "Eventos Abertos": "var(--terracota-queimada)",
    "Sem aula": "var(--grafite-45)",
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
        itens.append({
            "data": data,
            "diaDaSemana": r[3],
            "titulo": titulo,
            "descricao": descricao,
            "topico": topicos.get(data),
            "trilha": trilha,
            "cor": CORES.get(trilha, "var(--grafite-45)"),
            "horas": float(r[4]) if r[4] else None,
            "local": (r[10] or "").strip() or None,
            # a planilha repete o cabeçalho "ETAPA": [11] é a equipe, [12] o resultado esperado
            "equipe": re.sub(r"\s+", " ", str(r[11])).strip() if r[11] else None,
            "objetivo": re.sub(r"\s+", " ", str(r[12])).strip() if len(r) > 12 and r[12] else None,
            "modulo": (r[9] or "").strip() or None,
            "semAula": trilha == "Sem aula",
        })

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
