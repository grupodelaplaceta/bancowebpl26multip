"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
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
  const [password, setPassword] = useState("");
  const [registerMode, setRegisterMode] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [session, setSession] = useState<Session | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [destination, setDestination] = useState("");
  const [amount, setAmount] = useState("100");
  const [investmentAmount, setInvestmentAmount] = useState("100");
  const [investmentResult, setInvestmentResult] = useState<{ win: boolean; movementPercent: number; returned: number; tax: number; resolvesAt: number } | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [concept, setConcept] = useState("Transferencia web");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [cardModal, setCardModal] = useState<DigitalCard | null>(null);
  const [clientView, setClientView] = useState<"resumen" | "cuentas" | "enviar" | "tarjetas" | "inversiones" | "empresa" | "actividad">("resumen");

  const selectedAccount = useMemo(() => {
    if (!session) return null;
    return session.accounts.find((account) => account.id === selectedAccountId) || session.accounts[0] || null;
  }, [session, selectedAccountId]);
  const totalBalance = useMemo(() => {
    return session?.accounts.reduce((sum, account) => sum + account.balancePz, 0) || 0;
  }, [session]);
  const lastMovement = session?.transactions[0];
  const transferAmount = Number(amount || 0);
  const webFeePercent = session?.treasuryConfig.webBridgeCommissionPercent ?? 3;
  const estimatedFee = Math.ceil((transferAmount * webFeePercent) / 100);
  const personalLimit = session?.treasuryConfig.personalDeclarationThresholdPz || 500_000;
  const selectedLimit = selectedAccount?.type === "Business" ? (session?.treasuryConfig.institutionalDeclarationThresholdPz || 10_000_000) : personalLimit;
  const limitUsed = Math.min(100, Math.round(((selectedAccount?.balancePz || 0) / selectedLimit) * 100));
  const today = new Date().toISOString().slice(0, 10);
  const dailySpent = session?.transactions
    .filter((transaction) => transaction.fromAccountId === selectedAccount?.id && transaction.createdAt?.startsWith(today))
    .reduce((sum, transaction) => sum + transaction.amountPz, 0) || 0;
  const dynamicDailyLimit = selectedAccount?.sendLimitPz || (selectedAccount?.citizenshipTier === "JuniorSenior" ? 100 : undefined);
  const dailyLeft = dynamicDailyLimit ? Math.max(0, dynamicDailyLimit - dailySpent) : null;
  const canInvest = selectedAccount && selectedAccount.type !== "Child" && !selectedAccount.citizenshipTier?.startsWith("Junior");
  const businessAccounts = session?.accounts.filter((account) => account.type === "Business") || [];

  useEffect(() => {
    if (!investmentResult) return;
    const timer = window.setInterval(() => {
      const left = Math.max(0, Math.ceil((investmentResult.resolvesAt - Date.now()) / 1000));
      setCountdown(left);
      if (left === 0) {
        window.clearInterval(timer);
        window.alert(`Inversión completada: ${investmentResult.win ? "+" : ""}${formatPz(investmentResult.returned)} Pz devueltos`);
        loadSession();
      }
    }, 500);
    return () => window.clearInterval(timer);
  }, [investmentResult]);

  useEffect(() => {
    const savedDip = window.localStorage.getItem("placeta.web.activeDip");
    const savedHash = window.localStorage.getItem("placeta.web.sessionHash");
    if (savedDip) {
      setDip(savedDip);
      loadSession(undefined, savedDip, savedHash || undefined, true);
    }
  }, []);

  async function hashPassword(value: string) {
    const data = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  async function loadSession(event?: FormEvent, forcedDip?: string, forcedHash?: string, restore = false) {
    event?.preventDefault();
    const loginDip = (forcedDip || dip).trim().toUpperCase();
    if (!loginDip) return;
    setLoading(true);
    setStatus("Conectando con Banco de La Placeta...");
    try {
      const passwordHash = forcedHash || (password ? await hashPassword(password) : undefined);
      const response = await fetch("/api/web-session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ dip: loginDip, passwordHash, restore })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo iniciar sesión");
      setSession(data);
      setDip(loginDip);
      window.localStorage.setItem("placeta.web.activeDip", loginDip);
      if (passwordHash) window.localStorage.setItem("placeta.web.sessionHash", passwordHash);
      setSelectedAccountId(data.accounts?.[0]?.id || "");
      setStatus("Sesión web lista");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Error de sesión");
    } finally {
      setLoading(false);
    }
  }

  async function register(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/web-register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ dip, displayName, password, birthDate })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo registrar");
      setStatus("Cuenta web creada y verificada por edad");
      setRegisterMode(false);
      await loadSession(undefined, dip, await hashPassword(password));
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Error de registro");
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    window.localStorage.removeItem("placeta.web.activeDip");
    window.localStorage.removeItem("placeta.web.sessionHash");
    setSession(null);
    setSelectedAccountId("");
    setPassword("");
    setStatus("Sesión cerrada en este navegador");
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

  async function claimRbu() {
    if (!selectedAccount) return;
    setLoading(true);
    try {
      const response = await fetch("/api/web-rbu", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ dip, accountId: selectedAccount.id })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "RBU no disponible");
      setStatus("RBU reclamada: +5 Pz");
      await loadSession();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Error reclamando RBU");
    } finally {
      setLoading(false);
    }
  }

  async function startInvestment(event: FormEvent) {
    event.preventDefault();
    if (!selectedAccount) return;
    setLoading(true);
    try {
      const response = await fetch("/api/web-investment", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ dip, accountId: selectedAccount.id, amountPz: Number(investmentAmount) })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Inversión denegada");
      setInvestmentResult(data.result);
      setCountdown(60);
      setStatus("Inversión abierta: resolución en 60 segundos");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Error en inversión");
    } finally {
      setLoading(false);
    }
  }

  function downloadReceipt(transaction: LedgerTransaction) {
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Comprobante ${transaction.id}</title><style>body{font-family:Outfit,Arial,sans-serif;padding:24px;color:#170c2a} .box{border:1px solid #3f00d8;padding:20px;border-radius:8px} h1{color:#3f00d8} li{margin:8px 0}</style></head><body><div class="box"><h1>BANCO DE LA PLACETA - COMPROBANTE</h1><p><strong>ID Transacción:</strong> ${transaction.id}</p><p><strong>Fecha/Hora:</strong> ${formatDate(transaction.createdAt)}</p><p><strong>Ordenante:</strong> ${transaction.fromAccountId}</p><p><strong>Beneficiario:</strong> ${transaction.toAccountId}</p><hr/><h2>Desglose financiero</h2><ul><li>Importe bruto: ${formatPz(transaction.amountPz)} Pz</li><li>Tasas / IVA retenido: ${formatPz(transaction.taxAmount || transaction.ivaPz || 0)} Pz</li><li><strong>Neto:</strong> ${formatPz(transaction.netAmount || transaction.amountPz)} Pz</li></ul><p>Comprobante generado desde la web matriz. Los logs de IP y navegador constan en auditoría interna.</p></div></body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `comprobante-${transaction.id}.html`;
    link.click();
    URL.revokeObjectURL(url);
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
          <h1>Panel matriz GDLP-W</h1>
          <p>La experiencia principal del Banco de La Placeta. La app móvil conserva esta misma imagen y añade las funciones físicas.</p>
        </div>
        <form className="loginBox" onSubmit={(event) => registerMode ? register(event) : loadSession(event)}>
          {registerMode && (
            <label>
              Nombre de rol
              <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Nombre visible" />
            </label>
          )}
          <label>
            DIP
            <input value={dip} onChange={(event) => setDip(event.target.value.toUpperCase())} placeholder="DIP-4829" />
          </label>
          {registerMode && (
            <label>
              Fecha de nacimiento
              <input type="date" value={birthDate} onChange={(event) => setBirthDate(event.target.value)} />
            </label>
          )}
          {!session && (
            <label>
              Clave / PIN
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••" />
            </label>
          )}
          <button disabled={loading || !dip.trim() || (!session && !password.trim())}>{loading ? "Cargando" : registerMode ? "Crear cuenta" : "Entrar"}</button>
          {!session && <button type="button" className="softButton" onClick={() => setRegisterMode(!registerMode)}>{registerMode ? "Ya tengo cuenta" : "Registrarme"}</button>}
          {session && <button type="button" className="softButton" onClick={logout}>Cerrar sesión</button>}
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
        <section className="clientShell">
          <div className="mobileAppSummary">
            <div className="mobileWelcome">
              <span>{session.user.displayName || session.user.name || session.user.dip}</span>
              <button onClick={logout}>Salir</button>
            </div>
            <div className="mobileBalanceCard">
              <small>Saldo total</small>
              <strong>{formatPz(totalBalance)} Pz</strong>
              <span>{session.accounts.length} cuentas · {session.cards.length} tarjetas</span>
              <em>Web matriz del banco</em>
            </div>
            <div className="mobileActionGrid">
              <button onClick={() => setClientView("enviar")}>Enviar</button>
              <button onClick={() => setClientView("tarjetas")}>Tarjetas</button>
              <button onClick={() => setClientView("actividad")}>Actividad</button>
            </div>
            {lastMovement && (
              <article className="mobileLastMovement">
                <span>Último movimiento</span>
                <strong>{lastMovement.note}</strong>
                <b>{formatPz(lastMovement.netAmount || lastMovement.amountPz)} Pz</b>
              </article>
            )}
          </div>
          <nav className="clientTabs" aria-label="Panel cliente">
            {[
              ["resumen", "Resumen"],
              ["cuentas", "Cuentas"],
              ["enviar", "Enviar"],
              ["tarjetas", "Tarjetas"],
              ["inversiones", "Inversiones"],
              ["empresa", "Empresa"],
              ["actividad", "Actividad"]
            ].map(([id, label]) => (
              <button
                key={id}
                className={clientView === id ? "active" : ""}
                onClick={() => setClientView(id as typeof clientView)}
              >
                {label}
              </button>
            ))}
          </nav>

          {clientView === "resumen" && (
            <section className="clientDashboard">
              <div className="panel heroPanel">
                <span className="kicker">Posición global</span>
                <h2>{formatPz(totalBalance)} Pz</h2>
                <p>{session.accounts.length} cuentas activas · {session.cards.length} tarjetas visibles · sesión guardada</p>
                <div className="quickStrip">
                  <button onClick={() => setClientView("enviar")}>Enviar dinero</button>
                  <button onClick={() => setClientView("tarjetas")}>Ver tarjetas</button>
                  <button onClick={() => setClientView("inversiones")}>Invertir 60s</button>
                  <button onClick={() => setClientView("actividad")}>Movimientos</button>
                </div>
              </div>
              <div className="panel">
                <span className="kicker">Cuenta principal</span>
                <h2>{selectedAccount?.displayName || "Cuenta web"}</h2>
                <p className="muted">{selectedAccount?.iban}</p>
                <strong className="bigNumber">{formatPz(selectedAccount?.balancePz || 0)} Pz</strong>
                <div className="limitBar"><span style={{ width: `${limitUsed}%` }} /></div>
                <p className="muted">Límite normativo: {formatPz(selectedLimit)} Pz</p>
                {dailyLeft != null && <p className="muted">Disponible diario para enviar: {formatPz(dailyLeft)} Pz</p>}
              </div>
              <div className="panel">
                <span className="kicker">Último movimiento</span>
                {lastMovement ? (
                  <article className="movement compactMovement">
                    <div>
                      <strong>{lastMovement.note}</strong>
                      <span>{formatDate(lastMovement.createdAt)} · {lastMovement.concept || lastMovement.kind}</span>
                    </div>
                    <b>{formatPz(lastMovement.netAmount || lastMovement.amountPz)} Pz</b>
                  </article>
                ) : (
                  <p className="muted">Sin movimientos todavía.</p>
                )}
              </div>
              <div className="panel">
                <span className="kicker">Canal</span>
                <h2>Web matriz</h2>
                <p className="muted">Para pagos NFC, Promo Cards físicas y funciones especiales, usa la app móvil.</p>
                <button onClick={claimRbu}>Reclamar RBU semanal</button>
              </div>
            </section>
          )}

          {clientView === "cuentas" && (
            <section className="panel large">
            <div className="panelHead">
              <div>
                <span className="kicker">Cuentas</span>
                <h2>{session.user.displayName || session.user.name || session.user.dip}</h2>
              </div>
              <span className="pill">Comisión puente {session.treasuryConfig.webBridgeCommissionPercent ?? 3}%</span>
            </div>
            <div className="quickStrip">
              <button onClick={() => setClientView("enviar")}>Enviar</button>
              <button onClick={() => setClientView("tarjetas")}>Tarjetas</button>
              <button onClick={() => setClientView("actividad")}>Movimientos</button>
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
          </section>
          )}

          {clientView === "enviar" && (
          <form className="panel transferPanel focusedScreen" onSubmit={transfer}>
            <span className="kicker">Operar</span>
            <h2>Transferencia por código</h2>
            <p className="muted">Elige origen, escribe el código o IBAN destino y confirma. La web no inicia pagos por tarjeta.</p>
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
            <div className="feePreview">
              <span>Tasa estimada</span>
              <strong>{formatPz(estimatedFee)} Pz</strong>
              <small>{webFeePercent}% si cruza Web/App. La operación registra IP, navegador y timestamp.</small>
            </div>
            <p className="hint">Si cruza web y app se aplica comisión puente. Las tarjetas no pagan desde navegador.</p>
          </form>
          )}

          {clientView === "tarjetas" && (
          <section className="panel" id="webCards">
            <span className="kicker">Tarjetas</span>
            <h2>Consulta segura</h2>
            <p className="muted">Aquí se ven tarjetas y Promo Cards ya registradas. Pagar y registrar tarjetas físicas se hace en la app.</p>
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
          </section>
          )}

          {clientView === "inversiones" && (
          <section className="panel investmentScreen">
            <span className="kicker">Mercado 60s</span>
            <h2>Inversión aleatoria</h2>
            {!canInvest ? (
              <p className="muted">Módulo bloqueado para cuentas Junior o infantiles.</p>
            ) : (
              <form onSubmit={startInvestment} className="transferPanel">
                <p className="muted">Introduce una cantidad. El backend resuelve la ganancia o pérdida y la web avisa al terminar el minuto.</p>
                <label>Capital a arriesgar<input value={investmentAmount} onChange={(event) => setInvestmentAmount(event.target.value.replace(/\D/g, ""))} /></label>
                <button>Iniciar inversión 60s</button>
              </form>
            )}
            {investmentResult && (
              <div className="countdownCard">
                <span>{countdown}s</span>
                <strong>{investmentResult.win ? "Ganancia preparada" : "Pérdida preparada"}</strong>
                <p>Resultado: {investmentResult.win ? "+" : "-"}{investmentResult.movementPercent}% · Retención {formatPz(investmentResult.tax)} Pz</p>
              </div>
            )}
          </section>
          )}

          {clientView === "empresa" && (
          <section className="clientDashboard">
            <div className="panel heroPanel">
              <span className="kicker">Empresa / Asociación</span>
              <h2>{businessAccounts.length}</h2>
              <p>Cuentas corporativas asociadas a tu sesión. Límite institucional sincronizado: {formatPz(session.treasuryConfig.institutionalDeclarationThresholdPz || 10_000_000)} Pz.</p>
            </div>
            <div className="panel">
              <span className="kicker">Nóminas</span>
              <h2>SMI {formatPz(session.treasuryConfig.minimumWeeklySalaryPz || 150)} Pz</h2>
              <p className="muted">Cotización trabajador {session.treasuryConfig.payrollWorkerTaxPercent || 10}% · empresa {session.treasuryConfig.payrollEmployerTaxPercent || 10}%.</p>
            </div>
            <div className="panel">
              <span className="kicker">Integración</span>
              <h2>API y Webhooks</h2>
              <p className="muted">Módulo preparado para Public_Key, Secret_Key, payment.success y logs de conexión IP.</p>
            </div>
            <div className="panel">
              <span className="kicker">RGPD laboral</span>
              <h2>Responsable de datos</h2>
              <input placeholder="DIP del responsable" />
            </div>
          </section>
          )}

          {clientView === "actividad" && (
          <section className="panel movements" id="webMovements">
            <span className="kicker">Movimientos</span>
            <h2>Última actividad</h2>
            {session.transactions.map((transaction) => {
              const incoming = session.accounts.some((account) => account.id === transaction.toAccountId);
              return (
                <article className="movement" key={transaction.id}>
                  <div>
                    <strong>{transaction.note}</strong>
                    <span>{formatDate(transaction.createdAt)} · {transaction.concept || transaction.kind} · Tasas/IVA {formatPz(transaction.taxAmount || transaction.ivaPz || 0)} Pz</span>
                  </div>
                  <button className="softButton" onClick={() => downloadReceipt(transaction)}>Comprobante</button>
                  <b className={incoming ? "positive" : "negative"}>{incoming ? "+" : "-"}{formatPz(transaction.netAmount || transaction.amountPz)} Pz</b>
                </article>
              );
            })}
          </section>
          )}
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
          <button className={clientView === "resumen" ? "active" : ""} onClick={() => setClientView("resumen")}>Inicio</button>
          <button className={clientView === "enviar" ? "active" : ""} onClick={() => setClientView("enviar")}>Enviar</button>
          <button className={clientView === "tarjetas" ? "active" : ""} onClick={() => setClientView("tarjetas")}>Tarjetas</button>
          <button className={clientView === "inversiones" ? "active" : ""} onClick={() => setClientView("inversiones")}>Invertir</button>
        </nav>
      )}
    </main>
  );
}
