"use client";

import Link from "next/link";
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

type ClientView = "resumen" | "cuentas" | "enviar" | "tarjetas" | "inversiones" | "empresa" | "actividad" | "documentos" | "soporte";

const clientScreens: Array<{ id: ClientView; label: string; icon: string; group: string }> = [
  { id: "resumen", label: "Cartera", icon: "⌂", group: "Principal" },
  { id: "cuentas", label: "Cuentas", icon: "▤", group: "Principal" },
  { id: "enviar", label: "Placezum", icon: "⇄", group: "Operar" },
  { id: "tarjetas", label: "Tarjetas", icon: "▣", group: "Operar" },
  { id: "inversiones", label: "Mercado", icon: "↗", group: "Operar" },
  { id: "actividad", label: "Movimientos", icon: "≡", group: "Control" },
  { id: "empresa", label: "Empresa", icon: "◆", group: "Control" },
  { id: "documentos", label: "Documentos", icon: "↓", group: "Control" },
  { id: "soporte", label: "Ayuda", icon: "?", group: "Control" }
];

const appTabs = [
  { id: "cartera", label: "Cartera", target: "resumen" as ClientView },
  { id: "placezum", label: "Placezum", target: "enviar" as ClientView },
  { id: "mercado", label: "Mercado", target: "inversiones" as ClientView },
  { id: "mas", label: "Más", target: "cuentas" as ClientView },
  { id: "tglp", label: "TGLP", href: "/tributos" },
  { id: "junta", label: "Junta", href: "/admin" }
];

function screenFromHash(): ClientView {
  if (typeof window === "undefined") return "resumen";
  const value = window.location.hash.replace("#", "") as ClientView;
  return clientScreens.some((screen) => screen.id === value) ? value : "resumen";
}

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
  const [receiptLoadingId, setReceiptLoadingId] = useState("");
  const [cardModal, setCardModal] = useState<DigitalCard | null>(null);
  const [clientView, setClientView] = useState<ClientView>("resumen");

  const selectedAccount = useMemo(() => {
    if (!session) return null;
    return session.accounts.find((account) => account.id === selectedAccountId) || session.accounts[0] || null;
  }, [session, selectedAccountId]);
  const totalBalance = useMemo(() => session?.accounts.reduce((sum, account) => sum + account.balancePz, 0) || 0, [session]);
  const lastMovement = session?.transactions[0];
  const transferAmount = Number(amount || 0);
  const webFeePercent = session?.treasuryConfig.webBridgeCommissionPercent ?? 3;
  const estimatedFee = Math.ceil((transferAmount * webFeePercent) / 100);
  const selectedLimit = selectedAccount?.type === "Business"
    ? (session?.treasuryConfig.institutionalDeclarationThresholdPz || 10_000_000)
    : (session?.treasuryConfig.personalDeclarationThresholdPz || 500_000);
  const limitUsed = Math.min(100, Math.round(((selectedAccount?.balancePz || 0) / selectedLimit) * 100));
  const today = new Date().toISOString().slice(0, 10);
  const dailySpent = session?.transactions
    .filter((transaction) => transaction.fromAccountId === selectedAccount?.id && transaction.createdAt?.startsWith(today))
    .reduce((sum, transaction) => sum + transaction.amountPz, 0) || 0;
  const dynamicDailyLimit = selectedAccount?.sendLimitPz || (selectedAccount?.citizenshipTier === "JuniorSenior" ? 100 : undefined);
  const dailyLeft = dynamicDailyLimit ? Math.max(0, dynamicDailyLimit - dailySpent) : null;
  const canInvest = Boolean(selectedAccount && selectedAccount.type !== "Child" && !selectedAccount.citizenshipTier?.startsWith("Junior"));
  const businessAccounts = session?.accounts.filter((account) => account.type === "Business") || [];
  const activeTab = clientView === "resumen" ? "cartera" : clientView === "enviar" ? "placezum" : clientView === "inversiones" ? "mercado" : "mas";
  const visibleTabs = session?.user.dip === "DIP-A001" ? appTabs : appTabs.filter((tab) => tab.id !== "tglp" && tab.id !== "junta");
  const userName = session?.user.displayName || session?.user.name || session?.user.dip || "Cliente";

  function setScreen(view: ClientView) {
    setClientView(view);
    if (typeof window !== "undefined") window.history.replaceState(null, "", `#${view}`);
  }

  function openAppTab(tab: (typeof appTabs)[number]) {
    if ("href" in tab && tab.href) {
      location.assign(tab.href);
      return;
    }
    if ("target" in tab && tab.target) setScreen(tab.target);
  }

  useEffect(() => {
    setClientView(screenFromHash());
    const onHashChange = () => setClientView(screenFromHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

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
        body: JSON.stringify({ dip, fromAccountId: selectedAccount.id, destination, amountPz: Number(amount), concept })
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

  async function fontAsBase64(path: string) {
    const response = await fetch(path);
    const buffer = await response.arrayBuffer();
    let binary = "";
    new Uint8Array(buffer).forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    return btoa(binary);
  }

  async function downloadReceipt(transaction: LedgerTransaction) {
    setReceiptLoadingId(transaction.id);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      let pdfFont = "helvetica";
      try {
        const outfit = await fontAsBase64("/fonts/Outfit.ttf");
        const outfitBold = await fontAsBase64("/fonts/OutfitBold.ttf");
        doc.addFileToVFS("Outfit.ttf", outfit);
        doc.addFileToVFS("OutfitBold.ttf", outfitBold);
        doc.addFont("Outfit.ttf", "Outfit", "normal");
        doc.addFont("OutfitBold.ttf", "Outfit", "bold");
        doc.setFont("Outfit", "normal");
        pdfFont = "Outfit";
      } catch {
        doc.setFont("helvetica", "normal");
      }
      const pageWidth = doc.internal.pageSize.getWidth();
      doc.setFillColor(63, 0, 216);
      doc.roundedRect(34, 34, pageWidth - 68, 86, 12, 12, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont(pdfFont, "bold");
      doc.setFontSize(18);
      doc.text("BANCO DE LA PLACETA", 58, 72);
      doc.setFont(pdfFont, "normal");
      doc.setFontSize(11);
      doc.text("Comprobante de transacción bancaria e IVA", 58, 94);
      doc.setTextColor(23, 12, 42);
      doc.setDrawColor(63, 0, 216);
      doc.roundedRect(34, 148, pageWidth - 68, 330, 10, 10, "S");
      doc.setFont(pdfFont, "bold");
      doc.setFontSize(13);
      doc.text("Datos de la operación", 58, 178);
      doc.setFont(pdfFont, "normal");
      doc.setFontSize(10.5);
      [
        ["ID de transacción", transaction.id],
        ["Fecha y hora", formatDate(transaction.createdAt)],
        ["Ordenante", transaction.fromAccountId || "No disponible"],
        ["Beneficiario", transaction.toAccountId || "No disponible"],
        ["Concepto", transaction.concept || transaction.kind],
        ["Canal", "Banco de La Placeta Web"]
      ].forEach(([label, value], index) => {
        const y = 208 + index * 25;
        doc.setTextColor(108, 88, 120);
        doc.text(label, 58, y);
        doc.setTextColor(23, 12, 42);
        doc.text(String(value).slice(0, 74), 205, y);
      });
      doc.setFillColor(245, 241, 255);
      doc.roundedRect(58, 392, pageWidth - 116, 58, 10, 10, "F");
      doc.setFont(pdfFont, "bold");
      doc.setTextColor(63, 0, 216);
      doc.text("Desglose financiero", 78, 415);
      doc.setFont(pdfFont, "normal");
      doc.setTextColor(23, 12, 42);
      doc.text(`Bruto: ${formatPz(transaction.amountPz)} Pz`, 78, 437);
      doc.text(`Tasas / IVA: ${formatPz(transaction.taxAmount || transaction.ivaPz || 0)} Pz`, 230, 437);
      doc.setFont(pdfFont, "bold");
      doc.text(`Neto: ${formatPz(transaction.netAmount || transaction.amountPz)} Pz`, 392, 437);
      doc.save(`comprobante-${transaction.id}.pdf`);
      setStatus("Comprobante PDF generado");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "No se pudo generar el PDF");
    } finally {
      setReceiptLoadingId("");
    }
  }

  return (
    <main className="webApp webAppV2">
      {loading && (
        <div className="loadingOverlay">
          <img src="/loading.gif" alt="" />
          <strong>{session ? "Sincronizando operación" : "Preparando tu banca web"}</strong>
        </div>
      )}

      {!session ? (
        <section className="webLoginPage">
          <div className="webLoginHero">
            <p className="eyebrow">Banco Placeta Web</p>
            <h1>La app, pero cómoda en navegador.</h1>
            <p>Un panel multipantalla para Cartera, Placezum, Mercado, tarjetas, documentos, empresa y actividad. En web se opera por código; NFC queda en Android.</p>
            <div className="loginHighlights">
              <span>Cartera</span>
              <span>Placezum</span>
              <span>Mercado</span>
              <span>Más</span>
            </div>
          </div>
          <form className="loginBox webLoginCard" onSubmit={(event) => registerMode ? register(event) : loadSession(event)}>
            <div>
              <p className="kicker">{registerMode ? "Alta web" : "Acceso"}</p>
              <h2>{registerMode ? "Crea tu cuenta" : "Entra con tu DIP"}</h2>
            </div>
            {registerMode && (
              <label>Nombre visible<input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Nombre visible" /></label>
            )}
            <label>DIP de acceso<input value={dip} onChange={(event) => setDip(event.target.value.toUpperCase())} placeholder="DIP-4829" /></label>
            {registerMode && (
              <label>Fecha de nacimiento<input type="date" value={birthDate} onChange={(event) => setBirthDate(event.target.value)} /></label>
            )}
            <label>Clave o PIN<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••" /></label>
            <button disabled={loading || !dip.trim() || !password.trim()}>{loading ? "Cargando" : registerMode ? "Crear cuenta" : "Entrar"}</button>
            <button type="button" className="softButton" onClick={() => setRegisterMode(!registerMode)}>{registerMode ? "Ya tengo cuenta" : "Registrarme"}</button>
            {status && <p className="formStatus">{status}</p>}
          </form>
        </section>
      ) : (
        <section className="bankShell">
          <aside className="bankSidebar">
            <div className="sidebarBrand">
              <img src="/app-icon.png" alt="" />
              <div>
                <strong>Banco Placeta</strong>
                <span>{userName}</span>
              </div>
            </div>
            <div className="sidebarBalance">
              <span>Saldo total</span>
              <strong>{formatPz(totalBalance)} Pz</strong>
              <small>{session.accounts.length} cuentas · {session.cards.length} tarjetas</small>
            </div>
            <nav aria-label="Pantallas web">
              {["Principal", "Operar", "Control"].map((group) => (
                <div className="navGroup" key={group}>
                  <span>{group}</span>
                  {clientScreens.filter((screen) => screen.group === group).map((screen) => (
                    <button key={screen.id} className={clientView === screen.id ? "active" : ""} onClick={() => setScreen(screen.id)}>
                      <i>{screen.icon}</i>{screen.label}
                    </button>
                  ))}
                </div>
              ))}
            </nav>
            <div className="sidebarLinks">
              <Link href="/tributos">Tributos</Link>
              <Link href="/admin">Admin</Link>
              <button className="softButton" onClick={logout}>Salir</button>
            </div>
          </aside>

          <div className="bankWorkspace">
            <header className="workspaceTop">
              <div>
                <p className="eyebrow">Banca web</p>
                <h1>{clientScreens.find((screen) => screen.id === clientView)?.label}</h1>
                <span>{session.updatedAt ? `Sincronizado ${formatDate(session.updatedAt)}` : "Datos sincronizados con la app"}</span>
              </div>
              <div className="workspaceActions">
                <button className="softButton" onClick={claimRbu}>RBU</button>
                <button onClick={() => setScreen("enviar")}>Enviar</button>
              </div>
            </header>

            {status && <p className="statusLine">{status}</p>}

            <nav className="clientTabs appTabs" aria-label="Navegación de app">
              {visibleTabs.map((tab) => (
                <button key={tab.id} className={activeTab === tab.id ? "active" : ""} onClick={() => openAppTab(tab)}>{tab.label}</button>
              ))}
            </nav>

            {clientView === "resumen" && (
              <section className="screenGrid summaryScreen">
                <article className="panel heroPanel balanceHero">
                  <span className="kicker">Posición global</span>
                  <h2>{formatPz(totalBalance)} Pz</h2>
                  <p>{session.accounts.length} cuentas activas, {session.cards.length} tarjetas y actividad sincronizada con Android.</p>
                  <div className="appActionBar">
                    <button onClick={() => setScreen("enviar")}><span>⇄</span>Enviar</button>
                    <button onClick={() => setScreen("cuentas")}><span>↓</span>Recibir</button>
                    <button onClick={() => setScreen("tarjetas")}><span>▣</span>Tarjetas</button>
                    <button onClick={() => setScreen("actividad")}><span>≡</span>Actividad</button>
                  </div>
                </article>
                <article className="panel accountFocus">
                  <span className="kicker">Cuenta activa</span>
                  <h2>{selectedAccount?.displayName || "Cuenta web"}</h2>
                  <p className="muted">{selectedAccount?.iban}</p>
                  <strong className="bigNumber">{formatPz(selectedAccount?.balancePz || 0)} Pz</strong>
                  <div className="limitBar"><span style={{ width: `${limitUsed}%` }} /></div>
                  <div className="miniStatGrid">
                    <span><b>{limitUsed}%</b>Límite usado</span>
                    <span><b>{dailyLeft != null ? `${formatPz(dailyLeft)} Pz` : "Libre"}</b>Disponible hoy</span>
                    <span><b>{webFeePercent}%</b>Puente web</span>
                  </div>
                </article>
                <article className="panel">
                  <span className="kicker">Último movimiento</span>
                  {lastMovement ? <MovementRow transaction={lastMovement} accounts={session.accounts} onPdf={downloadReceipt} loadingId={receiptLoadingId} /> : <p className="muted">Sin movimientos todavía.</p>}
                </article>
                <article className="panel appSystemPanel">
                  <span className="kicker">Mismas secciones que Android</span>
                  <h2>Cartera, Placezum, Mercado y Más</h2>
                  <p className="muted">La web separa cada módulo en pantallas cómodas. NFC, lector físico y pagos contactless siguen en la app.</p>
                </article>
              </section>
            )}

            {clientView === "cuentas" && (
              <section className="panel large">
                <div className="panelHead">
                  <div><span className="kicker">Cuentas</span><h2>{userName}</h2></div>
                  <span className="pill">Comisión puente {webFeePercent}%</span>
                </div>
                <div className="accountGrid v2Accounts">
                  {session.accounts.map((account) => (
                    <button className={`accountTile ${selectedAccount?.id === account.id ? "active" : ""}`} key={account.id} onClick={() => setSelectedAccountId(account.id)}>
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
              <section className="operationLayout">
                <form className="panel transferPanel focusedScreen" onSubmit={transfer}>
                  <span className="kicker">Placezum web</span>
                  <h2>Pago por código</h2>
                  <label>Cuenta origen<select value={selectedAccountId} onChange={(event) => setSelectedAccountId(event.target.value)}>{session.accounts.map((account) => <option key={account.id} value={account.id}>{account.displayName} · {account.iban}</option>)}</select></label>
                  <label>Destino<input value={destination} onChange={(event) => setDestination(event.target.value)} placeholder="DIP, GDLP-AP00-000 o GDLP-W000-0000" /></label>
                  <div className="split">
                    <label>Importe Pz<input inputMode="numeric" value={amount} onChange={(event) => setAmount(event.target.value.replace(/\D/g, ""))} /></label>
                    <label>Concepto<input value={concept} onChange={(event) => setConcept(event.target.value)} /></label>
                  </div>
                  <button disabled={loading || !destination || !selectedAccount}>Confirmar envío</button>
                </form>
                <aside className="panel transferAside">
                  <span className="kicker">Previsión</span>
                  <div className="feePreview"><span>Tasa estimada</span><strong>{formatPz(estimatedFee)} Pz</strong><small>{webFeePercent}% si cruza entre web y app.</small></div>
                  <div className="webCompatibilityNote"><strong>Web sin NFC</strong><span>Para tarjetas físicas, lector y PlaceZum contactless usa Android. Desde web se opera por código.</span></div>
                </aside>
              </section>
            )}

            {clientView === "tarjetas" && (
              <section className="panel">
                <div className="panelHead"><div><span className="kicker">Tarjetas</span><h2>Tarjetas y Promo Cards</h2></div><span className="pill">{session.cards.length} visibles</span></div>
                <div className="cardList">
                  {session.cards.length === 0 && <p className="muted">No hay tarjetas registradas.</p>}
                  {session.cards.map((card) => {
                    const account = session.accounts.find((item) => item.id === card.accountId);
                    return (
                      <button className="bankCard cardButton" key={card.id} onClick={() => setCardModal(card)}>
                        <span>{card.promoPhysical ? "Promo Card registrada" : "Tarjeta virtual"}</span>
                        <strong>{card.cardNumber || "******"}</strong>
                        <small>PIN {card.pin || "****"} · {account?.displayName || "Cuenta"}</small>
                        <em>{card.promoPhysical ? "Alta solo desde app Android" : "Consulta web"}</em>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {clientView === "inversiones" && (
              <section className="operationLayout">
                <section className="panel investmentScreen">
                  <span className="kicker">Mercado</span>
                  <h2>Inversión 60 segundos</h2>
                  {!canInvest ? <p className="muted">Módulo bloqueado para cuentas Junior o infantiles.</p> : (
                    <form onSubmit={startInvestment} className="transferPanel">
                      <label>Capital a arriesgar<input inputMode="numeric" value={investmentAmount} onChange={(event) => setInvestmentAmount(event.target.value.replace(/\D/g, ""))} /></label>
                      <button>Iniciar inversión 60s</button>
                    </form>
                  )}
                </section>
                <aside className="panel">
                  <span className="kicker">Estado</span>
                  {investmentResult ? <div className="countdownCard"><span>{countdown}s</span><strong>{investmentResult.win ? "Ganancia preparada" : "Pérdida preparada"}</strong><p>Resultado {investmentResult.win ? "+" : "-"}{investmentResult.movementPercent}% · retención {formatPz(investmentResult.tax)} Pz</p></div> : <p className="muted">Cuando abras una inversión verás aquí la cuenta atrás y el resultado.</p>}
                </aside>
              </section>
            )}

            {clientView === "empresa" && (
              <section className="screenGrid">
                <article className="panel heroPanel"><span className="kicker">Empresa / Asociación</span><h2>{businessAccounts.length}</h2><p>Cuentas corporativas asociadas. Límite institucional {formatPz(session.treasuryConfig.institutionalDeclarationThresholdPz || 10_000_000)} Pz.</p></article>
                <article className="panel"><span className="kicker">Nóminas</span><h2>SMI {formatPz(session.treasuryConfig.minimumWeeklySalaryPz || 150)} Pz</h2><p className="muted">Cotización trabajador {session.treasuryConfig.payrollWorkerTaxPercent || 10}% · empresa {session.treasuryConfig.payrollEmployerTaxPercent || 10}%.</p></article>
                <article className="panel"><span className="kicker">Integración</span><h2>API y Webhooks</h2><p className="muted">Preparado para claves, payment.success y auditoría IP.</p></article>
                <article className="panel"><span className="kicker">RGPD laboral</span><h2>Responsable de datos</h2><input placeholder="DIP del responsable" /></article>
              </section>
            )}

            {clientView === "actividad" && (
              <section className="panel movements">
                <div className="panelHead"><div><span className="kicker">Movimientos</span><h2>Actividad</h2></div><span className="pill">{session.transactions.length} operaciones</span></div>
                {session.transactions.map((transaction) => <MovementRow key={transaction.id} transaction={transaction} accounts={session.accounts} onPdf={downloadReceipt} loadingId={receiptLoadingId} />)}
              </section>
            )}

            {clientView === "documentos" && (
              <section className="screenGrid">
                <article className="panel heroPanel"><span className="kicker">Documentos</span><h2>PDF</h2><p>Los justificantes se generan desde cada movimiento, con desglose fiscal y canal web.</p></article>
                <article className="panel"><span className="kicker">Normativa</span><h2>GDLP</h2><p className="muted">Consulta las reglas completas del banco y la base fiscal.</p><Link className="primaryButton" href="/normativa">Abrir normativa</Link></article>
                <article className="panel"><span className="kicker">Checkout</span><h2>Pago oficial</h2><p className="muted">Entrada directa al checkout web oficial.</p><Link className="primaryButton" href="/checkout">Abrir checkout</Link></article>
              </section>
            )}

            {clientView === "soporte" && (
              <section className="screenGrid">
                <article className="panel heroPanel"><span className="kicker">Ayuda</span><h2>Web + App</h2><p>La web cubre gestión, documentos y operaciones por código. Android cubre NFC, tarjetas físicas y pagos contactless.</p></article>
                <article className="panel"><span className="kicker">Atajos</span><h2>Acciones rápidas</h2><div className="stackActions"><button onClick={() => setScreen("enviar")}>Enviar Pz</button><button className="softButton" onClick={() => setScreen("actividad")}>Ver movimientos</button><button className="softButton" onClick={logout}>Cerrar sesión</button></div></article>
                <article className="panel"><span className="kicker">Estado</span><h2>Sesión web</h2><p className="muted">{status || "Funcionando con la última sesión local guardada."}</p></article>
              </section>
            )}
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
          {clientScreens.slice(0, 5).map((screen) => (
            <button key={screen.id} className={clientView === screen.id ? "active" : ""} onClick={() => setScreen(screen.id)}>
              <i>{screen.icon}</i><span>{screen.label}</span>
            </button>
          ))}
        </nav>
      )}
    </main>
  );
}

function MovementRow({ transaction, accounts, onPdf, loadingId }: {
  transaction: LedgerTransaction;
  accounts: Account[];
  onPdf: (transaction: LedgerTransaction) => void;
  loadingId: string;
}) {
  const incoming = accounts.some((account) => account.id === transaction.toAccountId);
  return (
    <article className="movement">
      <div>
        <strong>{transaction.note}</strong>
        <span>{formatDate(transaction.createdAt)} · {transaction.concept || transaction.kind} · Tasas/IVA {formatPz(transaction.taxAmount || transaction.ivaPz || 0)} Pz</span>
      </div>
      <button className="softButton" disabled={loadingId === transaction.id} onClick={() => onPdf(transaction)}>
        {loadingId === transaction.id ? "Generando" : "PDF"}
      </button>
      <b className={incoming ? "positive" : "negative"}>{incoming ? "+" : "-"}{formatPz(transaction.netAmount || transaction.amountPz)} Pz</b>
    </article>
  );
}
