"use client";

import { FormEvent, useMemo, useState } from "react";
import { channelLabel, formatDate, formatPz } from "../../lib/format";
import type { Account, DigitalCard, LedgerTransaction, TreasuryConfig, UserProfile } from "../../lib/types";

type Session = {
  user: UserProfile;
  accounts: Account[];
  transactions: LedgerTransaction[];
  cards: DigitalCard[];
  treasuryConfig: TreasuryConfig;
  updatedAt: string | null;
};

export default function WebBankPage() {
  const [dip, setDip] = useState("");
  const [session, setSession] = useState<Session | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [destination, setDestination] = useState("");
  const [amount, setAmount] = useState("100");
  const [concept, setConcept] = useState("Transferencia web");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [cardModal, setCardModal] = useState<DigitalCard | null>(null);
  const [transferOpen, setTransferOpen] = useState(false);

  const selectedAccount = useMemo(() => {
    if (!session) return null;
    return session.accounts.find((account) => account.id === selectedAccountId) || session.accounts[0] || null;
  }, [session, selectedAccountId]);

  async function loadSession(event?: FormEvent) {
    event?.preventDefault();
    setLoading(true);
    setStatus("Conectando con Banco de La Placeta...");
    try {
      const response = await fetch("/api/web-session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ dip })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo iniciar sesión");
      setSession(data);
      setSelectedAccountId(data.accounts?.[0]?.id || "");
      setStatus("Sesión web lista");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Error de sesión");
    } finally {
      setLoading(false);
    }
  }

  async function transfer(event: FormEvent) {
    event.preventDefault();
    if (!selectedAccount || !session) return;
    setLoading(true);
    setStatus("Enviando operación web...");
    try {
      const response = await fetch("/api/web-transfer", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          dip,
          fromAccountId: selectedAccount.id,
          destination,
          amountPz: Number(amount),
          concept
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Operación denegada");
      setStatus(`Transferencia registrada. Comisión: ${formatPz(data.fee?.amount || 0)} Pz`);
      await loadSession();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Error de transferencia");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="webApp">
      {loading && (
        <div className="loadingOverlay">
          <img src="/loading.gif" alt="" />
          <strong>{session ? "Sincronizando operación" : "Preparando tu banca web"}</strong>
        </div>
      )}
      <section className="webHeader appLikeHeader">
        <div>
          <p className="eyebrow">Banca Web</p>
          <h1>Tu panel GDLP-W</h1>
          <p>Todo lo importante del banco en navegador, sin las funciones físicas que pertenecen al móvil.</p>
        </div>
        <form className="loginBox" onSubmit={loadSession}>
          <label>
            DIP
            <input value={dip} onChange={(event) => setDip(event.target.value.toUpperCase())} placeholder="DIP-4829" />
          </label>
          <button disabled={loading || !dip.trim()}>{loading ? "Cargando" : "Entrar"}</button>
        </form>
      </section>

      {status && <p className="statusLine">{status}</p>}

      {!session && (
        <section className="emptyState">
          <img src="/loading.gif" alt="" />
          <div>
            <h2>Login preparado para cargar tu cuenta web</h2>
            <p>Al entrar se crea o recupera tu cuenta GDLP-W y se sincroniza con el backend compartido.</p>
          </div>
        </section>
      )}

      {session && (
        <section className="dashboardGrid">
          <div className="panel large">
            <div className="panelHead">
              <div>
                <span className="kicker">Resumen</span>
                <h2>{session.user.displayName || session.user.name || session.user.dip}</h2>
              </div>
              <span className="pill">Comisión puente {session.treasuryConfig.webBridgeCommissionPercent ?? 3}%</span>
            </div>
            <div className="quickStrip">
              <button onClick={() => setTransferOpen(true)}>Enviar</button>
              <button onClick={() => document.getElementById("webCards")?.scrollIntoView({ behavior: "smooth" })}>Tarjetas</button>
              <button onClick={() => document.getElementById("webMovements")?.scrollIntoView({ behavior: "smooth" })}>Movimientos</button>
              <button onClick={() => location.assign("/admin")}>Demo admin</button>
            </div>
            <div className="accountGrid">
              {session.accounts.map((account) => (
                <button
                  className={`accountTile ${selectedAccount?.id === account.id ? "active" : ""}`}
                  key={account.id}
                  onClick={() => setSelectedAccountId(account.id)}
                >
                  <strong>{account.displayName}</strong>
                  <span>{account.iban}</span>
                  <b>{formatPz(account.balancePz)} Pz</b>
                  <small>{channelLabel(account.iban)} · {account.type}</small>
                </button>
              ))}
            </div>
          </div>

          <form className={`panel transferPanel ${transferOpen ? "focusPanel" : ""}`} onSubmit={transfer}>
            <span className="kicker">Operar</span>
            <h2>Transferencia por código</h2>
            <label>
              Cuenta origen
              <select value={selectedAccountId} onChange={(event) => setSelectedAccountId(event.target.value)}>
                {session.accounts.map((account) => (
                  <option key={account.id} value={account.id}>{account.displayName} · {account.iban}</option>
                ))}
              </select>
            </label>
            <label>
              Código, IBAN o nombre destino
              <input value={destination} onChange={(event) => setDestination(event.target.value)} placeholder="GDLP-AP00-000 o GDLP-W000-0000" />
            </label>
            <div className="split">
              <label>
                Importe Pz
                <input value={amount} onChange={(event) => setAmount(event.target.value.replace(/\D/g, ""))} />
              </label>
              <label>
                Concepto
                <input value={concept} onChange={(event) => setConcept(event.target.value)} />
              </label>
            </div>
            <button disabled={loading || !destination || !selectedAccount}>Enviar desde web</button>
            <p className="hint">Si cruza web y app se aplica comisión puente. Las tarjetas no pagan desde navegador.</p>
          </form>

          <div className="panel" id="webCards">
            <span className="kicker">Tarjetas</span>
            <h2>Consulta segura</h2>
            <div className="cardList">
              {session.cards.length === 0 && <p className="muted">No hay tarjetas registradas.</p>}
              {session.cards.map((card) => {
                const account = session.accounts.find((item) => item.id === card.accountId);
                return (
                  <button className="bankCard cardButton" key={card.id} onClick={() => setCardModal(card)}>
                    <span>{card.promoPhysical ? "Promo Card registrada" : "Tarjeta virtual"}</span>
                    <strong>{card.cardNumber || "******"}</strong>
                    <small>PIN {card.pin || "****"} · {account?.displayName || "Cuenta"}</small>
                    <em>{card.promoPhysical ? "Alta solo desde app Android" : "No paga desde web"}</em>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="panel movements" id="webMovements">
            <span className="kicker">Movimientos</span>
            <h2>Última actividad</h2>
            {session.transactions.map((transaction) => {
              const incoming = session.accounts.some((account) => account.id === transaction.toAccountId);
              return (
                <article className="movement" key={transaction.id}>
                  <div>
                    <strong>{transaction.note}</strong>
                    <span>{formatDate(transaction.createdAt)} · {transaction.concept || transaction.kind}</span>
                  </div>
                  <b className={incoming ? "positive" : "negative"}>{incoming ? "+" : "-"}{formatPz(transaction.netAmount || transaction.amountPz)} Pz</b>
                </article>
              );
            })}
          </div>
        </section>
      )}
      {cardModal && (
        <div className="modalLayer" role="dialog" aria-modal="true" onClick={() => setCardModal(null)}>
          <div className="modalSheet cardModal" onClick={(event) => event.stopPropagation()}>
            <button className="modalClose" onClick={() => setCardModal(null)}>Cerrar</button>
            <p className="eyebrow">{cardModal.promoPhysical ? "Promo Card" : "Tarjeta virtual"}</p>
            <h2>{cardModal.alias || cardModal.label || cardModal.tier || "Tarjeta GDLP"}</h2>
            <div className="bankCard modalCardPreview">
              <span>{cardModal.promoPhysical ? "Registrada desde Android" : "Consulta web"}</span>
              <strong>{cardModal.cardNumber || "******"}</strong>
              <small>PIN {cardModal.pin || "****"}</small>
              <em>{cardModal.promoPhysical ? "Para pagar, acerca la tarjeta física al lector." : "Para pagar, usa la app móvil."}</em>
            </div>
          </div>
        </div>
      )}
      {session && (
        <nav className="mobileDock">
          <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>Inicio</button>
          <button onClick={() => setTransferOpen(true)}>Enviar</button>
          <button onClick={() => document.getElementById("webCards")?.scrollIntoView({ behavior: "smooth" })}>Tarjetas</button>
          <button onClick={() => document.getElementById("webMovements")?.scrollIntoView({ behavior: "smooth" })}>Actividad</button>
        </nav>
      )}
    </main>
  );
}
