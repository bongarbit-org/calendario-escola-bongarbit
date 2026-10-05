"use client";

import {
  createContext, useContext, useEffect, useMemo, useRef, useState,
  type ReactNode, type RefObject,
} from "react";
import { createPortal } from "react-dom";
import type { Aula } from "@/lib/calendario";
import {
  sedeDoLocal, saudacaoPorHora, diaDataDeAula, negrito,
  tarjaCacgb, tarjaFablab, linha2Variantes, linha3Variantes, linha4Variantes,
  escolherIndice, escolherIndiceDiferente, type Sede,
} from "@/lib/card";
import { useHorarios } from "@/components/HorariosContext";
import styles from "./ConviteDoDia.module.css";

// Cai aqui quando não há horário real disponível (ainda carregando, busca ao
// .ics falhou, ou a aula não bateu com nenhum evento) — um palpite, não um dado.
const HORARIO_PADRAO_FALLBACK = "18h às 21h";

// Quantos convites ficam prontos à frente, num cantinho invisível da página,
// enquanto o usuário nem clicou em nada ainda. "Visualizar convite" só olha o
// topo dessa fila, sem consumi-lo — fechar e reabrir mostra o mesmo convite.
// Só "Gerar novamente" de fato descarta o topo e avança para o próximo, o que
// dispara a reposição em segundo plano. Caem no caminho lento (gerando ao
// vivo, com "Montando o convite…") se a fila ainda estiver vazia.
const CAPACIDADE_FILA = 3;

type ItemGerado = {
  url: string;
  indiceLinha2: number;
  indiceLinha3: number;
  indiceLinha4: number;
};

// Espera a imagem terminar de carregar de verdade — não só o fetch, mas a
// decodificação — antes de deixar o snapdom capturar o cartão. Sem isso, num
// celular com rede lenta, a captura dispara antes das imagens chegarem e sai
// com logos/faixas faltando. `decode()` não existe no jsdom dos testes nem em
// browsers mais velhos, daí o fallback no evento `load`/`error`.
function aguardarImagem(img: HTMLImageElement): Promise<void> {
  if (img.complete) return Promise.resolve();
  if (typeof img.decode === "function") return img.decode().catch(() => {});
  return new Promise((resolve) => {
    img.addEventListener("load", () => resolve(), { once: true });
    img.addEventListener("error", () => resolve(), { once: true });
  });
}

// Agenda para quando o browser estiver ocioso — sem isso, gerar os 3 convites
// da fila de uma vez travaria a página (cada captura do snapdom roda na
// thread principal, porque precisa do DOM de verdade). `requestIdleCallback`
// não existe no Safari nem no jsdom dos testes, daí o fallback com setTimeout.
function agendarOcioso(fn: () => void): number {
  if (typeof window !== "undefined" && typeof window.requestIdleCallback === "function") {
    return window.requestIdleCallback(fn);
  }
  return window.setTimeout(fn, 200);
}

function cancelarOcioso(id: number) {
  if (typeof window !== "undefined" && typeof window.cancelIdleCallback === "function") {
    window.cancelIdleCallback(id);
  } else {
    window.clearTimeout(id);
  }
}

// Cacheado num só lugar: a fila (em segundo plano) e a captura em primeiro
// plano podem disparar a primeira captura quase ao mesmo tempo, e dois
// `import("@zumer/snapdom")` concorrentes e "frios" acabavam, nos testes,
// escapando do mock e caindo no módulo de verdade (que não funciona no jsdom).
let snapdomPromise: Promise<typeof import("@zumer/snapdom")> | null = null;

// `toBlob` (-> URL.createObjectURL), nunca `toPng` (-> data: URI base64). Um
// convite em 2x escala passa de 4MB; atribuir uma data: URI desse tamanho a
// um <img src> faz o browser decodificar o base64 de forma síncrona, travando
// a thread principal por ~200-300ms — foi isso que fazia "gerar novamente"
// parecer lento mesmo com a imagem já pronta na fila. blob: URLs passam pelo
// pipeline normal de carregamento assíncrono. Em troca, cada blob: URL
// precisa ser liberada explicitamente — ver trocarGeradoUrl.
async function capturarCartao(el: HTMLDivElement): Promise<string> {
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  await Promise.all(Array.from(el.querySelectorAll("img")).map((img) => aguardarImagem(img)));
  if (!snapdomPromise) snapdomPromise = import("@zumer/snapdom");
  const { snapdom } = await snapdomPromise;
  const blob = await snapdom.toBlob(el, { scale: 2, embedFonts: false, type: "png" });
  return URL.createObjectURL(blob);
}

function Cartao({
  conviteRef, sede, aula, horario, saudacao, linha2, linha3, linha4,
}: {
  conviteRef: RefObject<HTMLDivElement | null>;
  sede: Sede;
  aula: Aula;
  horario: string;
  saudacao: "Bom dia!" | "Boa tarde!";
  linha2: string;
  linha3: string;
  linha4: string;
}) {
  const prefixo = "Hoje";
  const diaData = useMemo(() => diaDataDeAula(aula.data), [aula.data]);

  return (
    <div
      ref={conviteRef}
      aria-hidden="true"
      className={`${styles.cartao} ${sede === "cacgb" ? styles.cacgb : styles.fablab}`}
    >
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
  );
}

// Única fonte de verdade para o convite do dia: o provider roda uma vez (montado
// perto da raiz da página), começa a preparar a fila assim que existe, e guarda
// o estado do modal. Qualquer botão na página — o destaque "Próximo encontro" ou
// a linha de hoje no calendário — só chama `abrir()` por contexto; nenhum deles
// sabe (nem precisa saber) que existe uma fila por trás.
const ConviteContext = createContext<(() => void) | null>(null);

export function BotaoVisualizarConvite() {
  const abrir = useContext(ConviteContext);
  if (!abrir) throw new Error("BotaoVisualizarConvite precisa estar dentro de ConviteDoDiaProvider");
  return (
    <button type="button" className="botao botao--mini" onClick={abrir}>
      Visualizar convite
    </button>
  );
}

export function ConviteDoDiaProvider({ aula, children }: { aula: Aula | null; children: ReactNode }) {
  const sedeFixa = useMemo(() => (aula ? sedeDoLocal(aula.local) : "cacgb"), [aula]);

  const estadoHorarios = useHorarios();
  const horarioReal = aula && estadoHorarios.status === "pronto" ? estadoHorarios.horarios[aula.data] : undefined;
  const horarioPadrao = horarioReal ?? HORARIO_PADRAO_FALLBACK;

  const [aberto, setAberto] = useState(false);
  const [sede, setSede] = useState<Sede>(sedeFixa);
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

  // Toda troca de geradoUrl passa por aqui: libera a blob: URL anterior, já
  // que ela não serve mais pra nada (o item correspondente, se veio da fila,
  // já foi retirado dela por quem chamou). Sem isso, cada convite gerado
  // vazaria memória pelo resto da sessão.
  function trocarGeradoUrl(novo: string | null) {
    setGeradoUrl((anterior) => {
      if (anterior) URL.revokeObjectURL(anterior);
      return novo;
    });
  }

  // A pilha de convites prontos. `filaRef` é a fonte de verdade (lida de
  // forma síncrona por abrir(), que só espia o topo; mutada por
  // gerarNovamente(), que descarta o topo e avança). `tamanhoFila` só existe
  // para disparar o efeito que repõe a fila até CAPACIDADE_FILA.
  const filaRef = useRef<ItemGerado[]>([]);
  const [tamanhoFila, setTamanhoFila] = useState(0);
  const ultimoFilaRef = useRef({ l2: -1, l3: -1, l4: -1 });
  const [filaDraft, setFilaDraft] = useState({ l2: 0, l3: 0, l4: 0, saudacao: "Bom dia!" as "Bom dia!" | "Boa tarde!" });

  const conviteRef = useRef<HTMLDivElement>(null);
  const conviteRefFila = useRef<HTMLDivElement>(null);

  const linha2 = aula ? linha2Variantes(sede, horario)[indiceLinha2] : "";
  const linha3 = aula ? linha3Variantes(aula)[indiceLinha3] : "";
  const linha4 = linha4Variantes()[indiceLinha4];

  function abrir() {
    if (!aula) return;
    setEditandoHorario(false);
    setErro(null);
    setSede(sedeFixa);
    setAberto(true);

    // Reabrir sem ter clicado em "gerar novamente" tem que mostrar exatamente o
    // mesmo convite de antes — não buscar de novo na fila, que pode ter andado
    // (enchido ou não) enquanto o modal estava fechado. Só busca um convite novo
    // (da fila ou ao vivo) na primeira vez que abre ou depois de mudar o horário.
    if (geradoUrl && horario === horarioPadrao) {
      setExportando(false);
      return;
    }

    setSaudacao(saudacaoPorHora(new Date().getHours()));
    setHorario(horarioPadrao);

    // Só espia o topo — não remove. "Gerar novamente" é quem de fato consome.
    const item = filaRef.current[0];
    if (item) {
      setIndiceLinha2(item.indiceLinha2);
      setIndiceLinha3(item.indiceLinha3);
      setIndiceLinha4(item.indiceLinha4);
      trocarGeradoUrl(item.url);
      setExportando(false);
    } else {
      const l2 = escolherIndice(linha2Variantes(sedeFixa, horarioPadrao).length);
      const l3 = escolherIndice(linha3Variantes(aula).length);
      const l4 = escolherIndice(linha4Variantes().length);
      // Alinha a fila em segundo plano ao que acabou de ir pra tela — sem isso,
      // o próximo item da fila podia coincidir por acaso com o que já está
      // mostrado (a fila só se compara contra o item anterior DELA, não contra
      // o que o usuário está vendo), e "gerar novamente" pareceria não fazer nada.
      ultimoFilaRef.current = { l2, l3, l4 };
      setIndiceLinha2(l2);
      setIndiceLinha3(l3);
      setIndiceLinha4(l4);
      trocarGeradoUrl(null);
      setCapturaPendente((n) => n + 1);
    }
  }

  function fechar() {
    setAberto(false);
    // Mantém `geradoUrl` — é o que diz pra abrir() que já tem um convite pronto e
    // reabrir deve só reexibi-lo, em vez de buscar outro na fila.
    setErro(null);
  }

  // Troca as três linhas para variantes diferentes das atuais — nunca sorteia
  // de volta a mesma frase, senão "gerar novamente" às vezes pareceria não ter feito nada.
  // Quando o horário não foi alterado, descarta o topo da fila (o convite que
  // estava sendo mostrado) e espia o próximo, que sai instantâneo; só cai no
  // caminho lento (gerar ao vivo) se a fila ficar vazia ou o horário tiver sido
  // editado (a fila só pré-gera para o horário padrão).
  function gerarNovamente() {
    if (!aula) return;
    if (horario === horarioPadrao) {
      filaRef.current.shift();
      const proximo = filaRef.current[0];
      setTamanhoFila(filaRef.current.length);
      // A fila só garante que cada item difere do anterior DELA (`ultimoFilaRef`,
      // visto acima e em gerarItemFila) — não do que está na tela agora, que pode
      // ter vindo do caminho ao vivo. Essa checagem é o cinto-e-suspensório contra
      // a coincidência: se por acaso bater igual, cai no caminho ao vivo abaixo,
      // que aí sim garante diferença.
      if (
        proximo &&
        (proximo.indiceLinha2 !== indiceLinha2 ||
          proximo.indiceLinha3 !== indiceLinha3 ||
          proximo.indiceLinha4 !== indiceLinha4)
      ) {
        setIndiceLinha2(proximo.indiceLinha2);
        setIndiceLinha3(proximo.indiceLinha3);
        setIndiceLinha4(proximo.indiceLinha4);
        trocarGeradoUrl(proximo.url);
        return;
      }
    }
    const l2 = escolherIndiceDiferente(linha2Variantes(sede, horario).length, indiceLinha2);
    const l3 = escolherIndiceDiferente(linha3Variantes(aula).length, indiceLinha3);
    const l4 = escolherIndiceDiferente(linha4Variantes().length, indiceLinha4);
    ultimoFilaRef.current = { l2, l3, l4 };
    setIndiceLinha2(l2);
    setIndiceLinha3(l3);
    setIndiceLinha4(l4);
    setCapturaPendente((n) => n + 1);
  }

  function aplicarHorario() {
    setHorario(horarioRascunho);
    setEditandoHorario(false);
    setCapturaPendente((n) => n + 1);
  }

  // Captura o cartão depois que o React já commitou o texto/sede/horário atuais no DOM.
  // Reabrir com um item da fila também muda `aberto` (false -> true) sem tocar em
  // `capturaPendente` — isso por si só já dispara de novo este efeito (ele depende de
  // `aberto`), e sem o controle abaixo capturaria de novo por cima do que a fila
  // acabou de entregar. `ultimoCapturaPendenteRef` garante que só captura quando
  // `capturaPendente` é realmente um valor novo, não só porque o efeito rodou de novo.
  const ultimoCapturaPendenteRef = useRef(0);
  useEffect(() => {
    if (!aberto || capturaPendente === 0 || capturaPendente === ultimoCapturaPendenteRef.current) return;
    ultimoCapturaPendenteRef.current = capturaPendente;
    let cancelado = false;

    async function capturar() {
      const el = conviteRef.current;
      if (!el) return;
      setExportando(true);
      setErro(null);
      try {
        const url = await capturarCartao(el);
        if (!cancelado) trocarGeradoUrl(url);
        else URL.revokeObjectURL(url);
      } catch (err) {
        console.error(err);
        if (!cancelado) setErro("Erro ao gerar imagem.");
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

  // Repõe a fila em segundo plano, um convite por vez, sempre que ela cai abaixo
  // da capacidade — inclusive assim que a página carrega, antes de qualquer clique
  // em qualquer botão. Roda uma única vez (o provider é montado uma vez só, perto
  // da raiz da página), então qualquer botão que apareça depois já encontra a fila
  // sendo preenchida ou pronta. `agendarOcioso` cede a thread principal entre uma
  // captura e outra, para o usuário não sentir a página travar enquanto isso roda.
  useEffect(() => {
    if (!aula || tamanhoFila >= CAPACIDADE_FILA) return;
    let cancelado = false;
    let idleId: number;

    function tentar(tentativas: number) {
      idleId = agendarOcioso(() => {
        gerarItemFila()
          .then((item) => {
            if (cancelado) return;
            ultimoFilaRef.current = { l2: item.indiceLinha2, l3: item.indiceLinha3, l4: item.indiceLinha4 };
            filaRef.current.push(item);
            setTamanhoFila(filaRef.current.length);
          })
          .catch((err) => {
            console.error(err);
            if (!cancelado && tentativas < 3) tentar(tentativas + 1);
          });
      });
    }

    async function gerarItemFila(): Promise<ItemGerado> {
      const l2 = escolherIndiceDiferente(linha2Variantes(sedeFixa, horarioPadrao).length, ultimoFilaRef.current.l2);
      const l3 = escolherIndiceDiferente(linha3Variantes(aula!).length, ultimoFilaRef.current.l3);
      const l4 = escolherIndiceDiferente(linha4Variantes().length, ultimoFilaRef.current.l4);
      setFilaDraft({ l2, l3, l4, saudacao: saudacaoPorHora(new Date().getHours()) });
      const el = conviteRefFila.current;
      if (!el) throw new Error("cartão da fila sem DOM");
      const url = await capturarCartao(el);
      return { url, indiceLinha2: l2, indiceLinha3: l3, indiceLinha4: l4 };
    }

    tentar(0);
    return () => {
      cancelado = true;
      cancelarOcioso(idleId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tamanhoFila, sedeFixa, aula]);

  return (
    <ConviteContext.Provider value={abrir}>
      {children}

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
                <img className={styles.resultadoImg} src={geradoUrl} alt="Convite gerado" />
              ) : erro ? (
                <p className={styles.erro}>{erro}</p>
              ) : (
                <p className={styles.carregando}>Montando o convite…</p>
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

      {aberto && aula && (
        <Cartao
          conviteRef={conviteRef}
          sede={sede}
          aula={aula}
          horario={horario}
          saudacao={saudacao}
          linha2={linha2}
          linha3={linha3}
          linha4={linha4}
        />
      )}

      {aula && (
        <Cartao
          conviteRef={conviteRefFila}
          sede={sedeFixa}
          aula={aula}
          horario={horarioPadrao}
          saudacao={filaDraft.saudacao}
          linha2={linha2Variantes(sedeFixa, horarioPadrao)[filaDraft.l2]}
          linha3={linha3Variantes(aula)[filaDraft.l3]}
          linha4={linha4Variantes()[filaDraft.l4]}
        />
      )}
    </ConviteContext.Provider>
  );
}
