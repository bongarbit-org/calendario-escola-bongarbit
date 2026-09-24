"""
sincronizar_agenda.py — Põe a agenda do Google de acordo com content/calendario.json.

O site é a fonte. A agenda pública "Bongarbit - Escola de Luteria - Alunos" foi
gerada da planilha antes das correções de professor, local e conteúdo, e por isso
diverge. Este script reconcilia as duas.

    # ver o que mudaria, sem tocar em nada
    python3 scripts/sincronizar_agenda.py --token ~/.config/bongarbit/token.json

    # aplicar
    python3 scripts/sincronizar_agenda.py --token ~/.config/bongarbit/token.json --aplicar

O token precisa do escopo https://www.googleapis.com/auth/calendar. Sem token,
passe --credenciais com o client secret e o script abre o navegador uma vez,
gravando o token no caminho de --token. Nenhum desses arquivos mora neste
repositório — ele é público e vai para a Vercel.

Para outra agenda, passe --agenda com o ID dela (Configurações da agenda no
Google > Integrar agenda > ID da agenda). Ver o README.

A agenda mostra só os dias em que há aula: os eventos que no site são "não
haverá aula" são apagados.

Criar um evento é opt-in: --criar cria os que existem no site e faltam na
agenda, e só para as datas com horário declarado em HORARIOS — o site guarda
data e carga horária, não hora do dia, e o script não inventa hora.

O que o script NÃO faz, de propósito:
  · não cria nada sem --criar, e nunca sem horário declarado
  · não mexe em horário nem em duração, com uma exceção anotada em MUDANCAS
  · não toca em nada antes de COMECO
"""

import argparse
import datetime
import json
import os
import re
import sys
import unicodedata

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

ESCOPOS = ["https://www.googleapis.com/auth/calendar"]

# A agenda desta escola. Outra agenda entra por --agenda, sem tocar no código.
AGENDA = (
    "b066261daf2a5e9b5a30c0e7765f8e851572c5c5b31382976ae761f88e42bd1c"
    "@group.calendar.google.com"
)

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONTE = os.path.join(RAIZ, "content", "calendario.json")

COMECO = "2026-09-01"

# Eventos da agenda que não representam aula e devem ser ignorados.
IGNORAR = ("busy",)

# Onde a agenda e o site não casam por data ou por título, o pareamento é dito
# aqui: (data e título na agenda) -> data no site.
MUDANCAS = {
    # O Café (5) muda de data: a coordenação confirmou 07/11.
    ("2026-11-21", "cafe com bongarbit 5 especial dia da consciencia negra"): "2026-11-07",
    # A agenda repete "Aula 5 (extra)" nos dois dias; a segunda é a Aula 6.
    ("2026-09-16", "luteria do tambor falante tama aula 5 extra"): "2026-09-16",
    ("2026-09-21", "luteria do tambor falante tama aula 5 extra"): "2026-09-21",
    # A Trilha Empreendedora saiu das quartas para as sextas, no Fab Lab Rec.
    ("2026-10-14", "encontro da trilha de educacao empreendedora 4"): "2026-10-16",
    ("2026-10-28", "encontro da trilha de educacao empreendedora 6"): "2026-10-30",
}

# O site guarda data e carga horária, não hora do dia. Um evento criado do zero
# precisa de hora, e ela é declarada aqui por data, em UTC — Recife é UTC-3.
HORARIOS = {
    # Vivência na Mata: 8h às 17h em Recife.
    "2026-10-10": ("11:00", "20:00"),
}

# As linhas da descrição que este script governa. O resto é preservado.
CAMPOS = {
    # A agenda põe o texto longo no próprio título ("Café com Bongarbit (4):
    # Evento aberto ao público…"). O site separa os dois; ao encurtar o título,
    # esse texto precisa cair aqui, senão se perde.
    "Sobre": "descricao",
    "Trilha": "trilha",
    "Fase/etapa": "modulo",
    "Local": "local",
    "Participantes/equipe": "equipe",
    # O site não tem mais "objetivo": a linha continua listada para que o
    # sincronizador a encontre e a apague dos eventos que ainda a carregam.
    "Etapa/resultado": "objetivo",
}


def simples(s: str) -> str:
    s = s.split(":")[0]
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", " ", s).strip()


def do_site() -> dict:
    dados = json.load(open(FONTE, encoding="utf-8"))
    return {
        i["data"]: i
        for m in dados["meses"]
        for i in m["itens"]
        if i["data"] >= COMECO
    }


def data_de(ev: dict) -> str:
    q = ev.get("start", {})
    return (q.get("dateTime") or q.get("date") or "")[:10]


def descricao_nova(atual: str, item: dict) -> str:
    """Reescreve só as linhas conhecidas e mantém as demais na ordem original."""
    linhas, vistos = [], set()
    for linha in (atual or "").split("\n"):
        rotulo = linha.split(":", 1)[0].strip()
        if rotulo in CAMPOS:
            vistos.add(rotulo)
            valor = item.get(CAMPOS[rotulo])
            if valor:  # sem valor no site, a linha sai
                linhas.append(f"{rotulo}: {valor}")
        else:
            linhas.append(linha)

    # Um campo que o site tem e a descrição não ganha linha ao final.
    for rotulo, chave in CAMPOS.items():
        if rotulo not in vistos and item.get(chave):
            linhas.append(f"{rotulo}: {item[chave]}")

    return "\n".join(linhas).strip()


def horario_deslocado(ev: dict, nova_data: str) -> dict:
    """Move o evento para outra data mantendo a hora e a duração."""
    fora = {}
    for ponta in ("start", "end"):
        q = ev[ponta]
        if "date" in q:
            fora[ponta] = {"date": nova_data}
            continue
        quando = datetime.datetime.fromisoformat(q["dateTime"].replace("Z", "+00:00"))
        # O fim pode cair no dia seguinte; preserva-se o deslocamento em dias.
        dias = (
            datetime.date.fromisoformat(q["dateTime"][:10])
            - datetime.date.fromisoformat(data_de(ev))
        ).days
        alvo = datetime.date.fromisoformat(nova_data) + datetime.timedelta(days=dias)
        fora[ponta] = {
            "dateTime": quando.replace(
                year=alvo.year, month=alvo.month, day=alvo.day
            ).isoformat().replace("+00:00", "Z"),
            "timeZone": q.get("timeZone", "UTC"),
        }
    return fora


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--token", help="token.json com escopo de calendário")
    p.add_argument("--credenciais", help="client secret, para autorizar da primeira vez")
    p.add_argument("--agenda", default=AGENDA, help="ID da agenda; o padrão é a da escola")
    p.add_argument("--criar", action="store_true",
                   help="cria os eventos do site que faltam na agenda")
    p.add_argument("--aplicar", action="store_true", help="grava; sem isso é só simulação")
    args = p.parse_args()

    cred = None
    if args.token and os.path.exists(args.token):
        cred = Credentials.from_authorized_user_file(os.path.expanduser(args.token), ESCOPOS)
        if cred and cred.expired and cred.refresh_token:
            cred.refresh(Request())
    if not cred or not cred.valid:
        if not args.credenciais:
            print("Sem token válido. Passe --token ou --credenciais.", file=sys.stderr)
            return 1
        from google_auth_oauthlib.flow import InstalledAppFlow

        fluxo = InstalledAppFlow.from_client_secrets_file(
            os.path.expanduser(args.credenciais), ESCOPOS
        )
        cred = fluxo.run_local_server(port=0)
        if args.token:
            with open(os.path.expanduser(args.token), "w") as f:
                f.write(cred.to_json())

    api = build("calendar", "v3", credentials=cred)
    site = do_site()

    eventos, pagina = [], None
    while True:
        r = (
            api.events()
            .list(
                calendarId=args.agenda,
                timeMin=f"{COMECO}T00:00:00Z",
                singleEvents=True,
                maxResults=2500,
                pageToken=pagina,
            )
            .execute()
        )
        eventos += r.get("items", [])
        pagina = r.get("nextPageToken")
        if not pagina:
            break

    print(f"{len(eventos)} eventos na agenda · {len(site)} entradas no site\n")

    mudados = sem_par = apagados = 0
    pareados = set()
    for ev in eventos:
        titulo = ev.get("summary", "")
        if simples(titulo) in IGNORAR:
            continue
        data = data_de(ev)
        alvo = MUDANCAS.get((data, simples(titulo)), data)
        item = site.get(alvo)
        if not item:
            print(f"  ? {data}  {titulo[:52]}  — sem par no site, deixado como está")
            sem_par += 1
            continue
        pareados.add(alvo)

        # A agenda lista só o que tem aula.
        if item["semAula"]:
            apagados += 1
            print(f"  - {data}  {titulo[:46]}  — dia sem aula, apagado da agenda")
            if args.aplicar:
                api.events().delete(calendarId=args.agenda, eventId=ev["id"]).execute()
            continue

        corpo, notas = {}, []
        if titulo != item["titulo"]:
            corpo["summary"] = item["titulo"]
            notas.append(f'nome: "{titulo[:40]}" -> "{item["titulo"][:40]}"')
        if item["local"] and ev.get("location") != item["local"]:
            corpo["location"] = item["local"]
            notas.append(f'local: "{ev.get("location")}" -> "{item["local"]}"')
        nova = descricao_nova(ev.get("description", ""), item)
        if nova != (ev.get("description") or "").strip():
            corpo["description"] = nova
            notas.append("descrição")
        if alvo != data:
            corpo.update(horario_deslocado(ev, alvo))
            notas.append(f"data: {data} -> {alvo}")

        if not corpo:
            continue
        mudados += 1
        print(f"  · {data}  {titulo[:46]}")
        for n in notas:
            print(f"      {n}")
        if args.aplicar:
            api.events().patch(calendarId=args.agenda, eventId=ev["id"], body=corpo).execute()

    faltando = sorted(d for d in set(site) - pareados if not site[d]["semAula"])
    criados = 0
    if faltando:
        print(f"\n  no site e não na agenda ({len(faltando)}):")
        for d in faltando:
            item = site[d]
            if not args.criar:
                print(f"    {d}  {item['titulo'][:56]}")
                continue
            if d not in HORARIOS:
                print(f"    {d}  {item['titulo'][:40]}  — sem horário em HORARIOS,"
                      f" não criado")
                continue
            ini, fim = HORARIOS[d]
            print(f"    + {d}  {item['titulo'][:40]}  {ini}–{fim} UTC")
            criados += 1
            if args.aplicar:
                api.events().insert(calendarId=args.agenda, body={
                    "summary": item["titulo"],
                    "location": item["local"] or "",
                    "description": descricao_nova("", item),
                    "start": {"dateTime": f"{d}T{ini}:00Z", "timeZone": "UTC"},
                    "end": {"dateTime": f"{d}T{fim}:00Z", "timeZone": "UTC"},
                }).execute()

    print(f"\n{mudados} eventos {'atualizados' if args.aplicar else 'a atualizar'}"
          f"{f', {apagados} a apagar' if apagados and not args.aplicar else ''}"
          f"{f', {apagados} apagados' if apagados and args.aplicar else ''}"
          f"{f', {criados} criados' if criados and args.aplicar else ''}"
          f"{f', {criados} a criar' if criados and not args.aplicar else ''}"
          f"{f', {sem_par} sem par' if sem_par else ''}")
    if not args.aplicar and (mudados or apagados or criados):
        print("Simulação. Repita com --aplicar para gravar.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
