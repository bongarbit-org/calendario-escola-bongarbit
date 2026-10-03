"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Aula } from "@/lib/calendario";
import {
  sedeDoLocal, saudacaoPorHora, diaDataDeAula, negrito,
  tarjaCacgb, tarjaFablab, linha2Variantes, linha3Variantes, linha4Variantes,
  escolherIndice, escolherIndiceDiferente, type Sede,
} from "@/lib/card";
import styles from "./CardDoDia.module.css";

// Cai aqui quando não há horário real disponível (busca ao .ics falhou, ou a
// aula não bateu com nenhum evento) — um palpite, não um dado.
const HORARIO_PADRAO_FALLBACK = "18h às 21h";

export function CardDoDia({ aula, horarioInicial }: { aula: Aula; horarioInicial?: string }) {
  const horarioPadrao = horarioInicial ?? HORARIO_PADRAO_FALLBACK;

  const [aberto, setAberto] = useState(false);
  const [sede, setSede] = useState<Sede>("cacgb");
  const [saudacao, setSaudacao] = useState<"Bom dia!" | "Boa tarde!">("Bom dia!");
  const [horario, setHorario] = useState(horarioPadrao);
  const [editandoHorario, setEditandoHorario] = useState(false);
  const [horarioRascunho, setHorarioRascunho] = useState(horarioPadrao);
  const [indiceLinha2, setIndiceLinha2] = useState(0);
  const [indiceLinha3, setIndiceLinha3] = useState(0);
  const [indiceLinha4, setIndiceLinha4] = useState(0);
  const [capturaPendente, setCapturaPendente] = useState(0);
  const [exportando, setExportando] = useState(false);
  const [geradoUrl, setGeradoUrl] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const cardRef = useRef<HTMLDivElement>(null);

  const prefixo = "Hoje";
  const diaData = useMemo(() => diaDataDeAula(aula.data), [aula.data]);

  const linha2 = linha2Variantes(sede, horario)[indiceLinha2];
  const linha3 = linha3Variantes(aula)[indiceLinha3];
  const linha4 = linha4Variantes()[indiceLinha4];

  function abrir() {
    const sedeDeAgora = sedeDoLocal(aula.local);
    setSede(sedeDeAgora);
    setSaudacao(saudacaoPorHora(new Date().getHours()));
    setHorario(horarioPadrao);
    setEditandoHorario(false);
    setIndiceLinha2(escolherIndice(linha2Variantes(sedeDeAgora, horarioPadrao).length));
    setIndiceLinha3(escolherIndice(linha3Variantes(aula).length));
    setIndiceLinha4(escolherIndice(linha4Variantes().length));
    setErro(null);
    setGeradoUrl(null);
    setAberto(true);
    setCapturaPendente((n) => n + 1);
  }

  function fechar() {
    setAberto(false);
    setGeradoUrl(null);
    setErro(null);
  }

  // Troca as três linhas para variantes diferentes das atuais — nunca sorteia
  // de volta a mesma frase, senão "gerar novamente" às vezes pareceria não ter feito nada.
  function gerarNovamente() {
    setIndiceLinha2((i) => escolherIndiceDiferente(linha2Variantes(sede, horario).length, i));
    setIndiceLinha3((i) => escolherIndiceDiferente(linha3Variantes(aula).length, i));
    setIndiceLinha4((i) => escolherIndiceDiferente(linha4Variantes().length, i));
    setCapturaPendente((n) => n + 1);
  }

  function aplicarHorario() {
    setHorario(horarioRascunho);
    setEditandoHorario(false);
    setCapturaPendente((n) => n + 1);
  }

  // Captura o cartão depois que o React já commitou o texto/sede/horário atuais no DOM.
  useEffect(() => {
    if (!aberto || capturaPendente === 0) return;
    let cancelado = false;

    async function capturar() {
      const el = cardRef.current;
      if (!el) return;
      setExportando(true);
      setErro(null);
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      try {
        const { snapdom } = await import("@zumer/snapdom");
        const img = await snapdom.toPng(el, { scale: 2, embedFonts: false });
        if (!cancelado) setGeradoUrl(img.src);
      } catch (err) {
        console.error(err);
        if (!cancelado) setErro("Deu erro ao gerar a imagem — olha o console.");
      } finally {
        if (!cancelado) setExportando(false);
      }
    }

    capturar();
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto, capturaPendente]);

  return (
    <>
      <button type="button" className="botao botao--mini" onClick={abrir}>
        Visualizar convite
      </button>

      {aberto &&
        createPortal(
          <div
            className={styles.fundo}
            onClick={(e) => {
              if (e.target === e.currentTarget) fechar();
            }}
          >
            <div className={styles.caixa}>
              <button type="button" className={styles.fechar} onClick={fechar} aria-label="Fechar modal">
                ×
              </button>

              {geradoUrl ? (
                <img className={styles.resultadoImg} src={geradoUrl} alt="Card gerado" />
              ) : erro ? (
                <p className={styles.erro}>{erro}</p>
              ) : (
                <p className={styles.carregando}>Gerando o card…</p>
              )}

              {editandoHorario ? (
                <div className={styles.horario}>
                  <input
                    type="text"
                    value={horarioRascunho}
                    onChange={(e) => setHorarioRascunho(e.target.value)}
                    placeholder="Ex.: 8h às 12h"
                    autoFocus
                  />
                  <button type="button" className="botao botao--mini" onClick={aplicarHorario}>
                    Aplicar
                  </button>
                  <button
                    type="button"
                    className="botao botao--fantasma botao--mini"
                    onClick={() => setEditandoHorario(false)}
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <div className={styles.acoes}>
                  <button
                    type="button"
                    className="botao botao--fantasma botao--mini"
                    onClick={() => {
                      setHorarioRascunho(horario);
                      setEditandoHorario(true);
                    }}
                    disabled={exportando}
                  >
                    Mudar horário
                  </button>
                  <button
                    type="button"
                    className="botao botao--fantasma botao--mini"
                    onClick={gerarNovamente}
                    disabled={exportando}
                  >
                    Gerar novamente
                  </button>
                  <button type="button" className="botao botao--mini" onClick={fechar}>
                    Fechar
                  </button>
                </div>
              )}
            </div>
          </div>,
          document.body
        )}

      {aberto && (
        <div ref={cardRef} className={`${styles.cartao} ${sede === "cacgb" ? styles.cacgb : styles.fablab}`}>
          {sede === "cacgb" ? (
            <>
              <img className={styles.marca} src="/img/cartao/bongarbit-lockup-horizontal.png" alt="" />
              <div
                className={styles.tarja}
                dangerouslySetInnerHTML={{ __html: tarjaCacgb(prefixo, diaData, horario) }}
              />
              <div className={styles.msg}>
                <span className={styles.hi}>{saudacao}</span>
                <span dangerouslySetInnerHTML={{ __html: negrito(linha2) }} />
                <span dangerouslySetInnerHTML={{ __html: negrito(linha3) }} />
                <span dangerouslySetInnerHTML={{ __html: negrito(linha4) }} />
              </div>
              <img className={styles.vila} src="/img/cartao/faixa-vila.png" alt="" />
            </>
          ) : (
            <>
              <img className={styles.marca} src="/img/cartao/bongarbit-lettering-negativo.png" alt="" />
              <div className={styles.tarja}>{tarjaFablab(prefixo, diaData, horario)}</div>
              <div className={styles.msg}>
                <span className={styles.hi}>{saudacao}</span>
                <span dangerouslySetInnerHTML={{ __html: negrito(linha2) }} />
                <span dangerouslySetInnerHTML={{ __html: negrito(linha3) }} />
                <span dangerouslySetInnerHTML={{ __html: negrito(linha4) }} />
              </div>
              <div className={styles.rodape}>
                <img className={styles.rodapeBong} src="/img/cartao/bongarbit-lettering-negativo.png" alt="" />
                <img className={styles.rodapeFab} src="/img/cartao/fablab-rec-empilhado-branco.png" alt="" />
              </div>
            </>
          )}
          <img className={styles.borda} src="/img/cartao/borda-instagram.png" alt="" />
        </div>
      )}
    </>
  );
}
