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

type ClientView = "resumen" | "cuentas" | "enviar" | "tarjetas" | "inversiones" | "empresa" | "actividad";

const appTabs: Array<{ id: string; label: string; target?: ClientView; href?: string }> = [
  { id: "cartera", label: "Cartera", target: "resumen" },
  { id: "placezum", label: "Placezum", target: "enviar" },
  { id: "mercado", label: "Mercado", target: "inversiones" },
  { id: "mas", label: "Más", target: "cuentas" },
  { id: "tglp", label: "TGLP", href: "/tributos" },
  { id: "junta", label: "Junta", href: "/admin" }
];

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
  const activeTab = clientView === "resumen"
    ? "cartera"
    : clientView === "enviar"
      ? "placezum"
      : clientView === "inversiones"
        ? "mercado"
        : "mas";
  const visibleTabs = session?.user.dip === "DIP-A001" ? appTabs : appTabs.filter((tab) => tab.id !== "tglp" && tab.id !== "junta");

  function openAppTab(tab: (typeof appTabs)[number]) {
    if (tab.href) {
      location.assign(tab.href);
      return;
    }
    if (tab.target) setClientView(tab.target);
  }

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

      const gross = formatPz(transaction.amountPz);
      const taxes = formatPz(transaction.taxAmount || transaction.ivaPz || 0);
      const net = formatPz(transaction.netAmount || transaction.amountPz);
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
      doc.setLineWidth(1);
      doc.roundedRect(34, 148, pageWidth - 68, 330, 10, 10, "S");

      doc.setFont(pdfFont, "bold");
      doc.setFontSize(13);
      doc.text("Datos de la operación", 58, 178);
      doc.setFont(pdfFont, "normal");
      doc.setFontSize(10.5);
      const rows = [
        ["ID de transacción", transaction.id],
        ["Fecha y hora", formatDate(transaction.createdAt)],
        ["Ordenante", transaction.fromAccountId || "No disponible"],
        ["Beneficiario", transaction.toAccountId || "No disponible"],
        ["Concepto", transaction.concept || transaction.kind],
        ["Canal", "Banco de La Placeta Web"],
        ["Auditoría", "IP, navegador y timestamp registrados en backend"]
      ];
      rows.forEach(([label, value], index) => {
        const y = 208 + index * 24;
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
      doc.text(`Bruto: ${gross} Pz`, 78, 437);
      doc.text(`Tasas / IVA: ${taxes} Pz`, 230, 437);
      doc.setFont(pdfFont, "bold");
      doc.text(`Neto: ${net} Pz`, 392, 437);

      doc.setFont(pdfFont, "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(108, 88, 120);
      doc.text("Documento emitido por Banco de La Placeta dentro de una simulación de rol sin valor económico real.", 58, 520, { maxWidth: pageWidth - 116 });
      doc.text("Base normativa: Normativa Unificada GDLP, capítulos III, IV y XIV.", 58, 548);
      doc.save(`comprobante-${transaction.id}.pdf`);
      setStatus("Comprobante PDF generado");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "No se pudo generar el PDF");
    } finally {
      setReceiptLoadingId("");
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
          <p className="eyebrow">Banco Placeta</p>
          <h1>La app, en web</h1>
          <p>La misma Cartera, Placezum, Mercado y Más de Android, usando el mismo backend y las mismas reglas. Solo cambian las funciones físicas que dependen de NFC.</p>
        </div>
        <form className="loginBox" onSubmit={(event) => registerMode ? register(event) : loadSession(event)}>
          {registerMode && (
            <label>
              Nombre visible
              <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Nombre visible" />
            </label>
          )}
          <label>
            DIP de acceso
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
              Clave o PIN
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
            <h2>Entra con tu DIP</h2>
            <p>La web recupera tu sesión, crea tu cuenta GDLP-W si hace falta y deja el panel listo para usar.</p>
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
              <em>Banco de La Placeta</em>
            </div>
            <div className="mobileActionGrid">
              <button onClick={() => setClientView("enviar")}>Placezum</button>
              <button onClick={() => setClientView("inversiones")}>Mercado</button>
              <button onClick={() => setClientView("cuentas")}>Más</button>
            </div>
            {lastMovement && (
              <article className="mobileLastMovement">
                <span>Último movimiento</span>
                <strong>{lastMovement.note}</strong>
                <b>{formatPz(lastMovement.netAmount || lastMovement.amountPz)} Pz</b>
              </article>
            )}
          </div>
          <nav className="clientTabs appTabs" aria-label="Navegación principal de la app">
            {visibleTabs.map((tab) => (
              <button
                key={tab.id}
                className={activeTab === tab.id ? "active" : ""}
                onClick={() => openAppTab(tab)}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {clientView === "resumen" && (
            <section className="clientDashboard">
              <div className="panel heroPanel">
                <span className="kicker">Posición global</span>
                <h2>{formatPz(totalBalance)} Pz</h2>
                <p>{session.accounts.length} cuentas activas · {session.cards.length} tarjetas visibles · sistemas sincronizados con Android</p>
                <div className="appActionBar">
                  <button onClick={() => setClientView("enviar")}><span>⌁</span> Placezum</button>
                  <button onClick={() => setClientView("cuentas")}><span>↓</span> Recibir</button>
                  <button onClick={() => setClientView("tarjetas")}><span>▣</span> Tarjetas</button>
                  <button onClick={() => setClientView("actividad")}><span>≡</span> Movimientos</button>
                </div>
              </div>
              <div className="panel appSystemPanel">
                <span className="kicker">Mismos sistemas</span>
                <h2>GDLP compartido</h2>
                <p className="muted">La web lee usuarios, cuentas, tarjetas, inversiones, límites, nóminas y tributos desde el mismo backend de la app.</p>
                <div className="miniStatGrid">
                  <span><b>Cartera</b>Cuentas</span>
                  <span><b>Placezum</b>Código</span>
                  <span><b>Mercado</b>60s</span>
                </div>
              </div>
              <div className="panel">
                <span className="kicker">Cuenta principal</span>
                <h2>{selectedAccount?.displayName || "Cuenta web"}</h2>
                <p className="muted">{selectedAccount?.iban}</p>
                <strong className="bigNumber">{formatPz(selectedAccount?.balancePz || 0)} Pz</strong>
                <div className="limitBar"><span style={{ width: `${limitUsed}%` }} /></div>
                <div className="miniStatGrid">
                  <span><b>{limitUsed}%</b>Límite usado</span>
                  <span><b>{formatPz(selectedLimit)} Pz</b>Máximo</span>
                  <span><b>{dailyLeft != null ? `${formatPz(dailyLeft)} Pz` : "Libre"}</b>Disponible hoy</span>
                </div>
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
                <span className="kicker">Más</span>
                <h2>Accesos de app</h2>
                <p className="muted">Documentos, soporte, tarjetas, empresa y movimientos igual que en Android. NFC queda reservado al móvil.</p>
                <div className="stackActions">
                  <button onClick={claimRbu}>Reclamar RBU semanal</button>
                  <button className="softButton" onClick={() => setClientView("inversiones")}>Abrir inversiones</button>
                </div>
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
              <button onClick={() => setClientView("enviar")}>Placezum</button>
              <button onClick={() => setClientView("tarjetas")}>Tarjetas</button>
              <button onClick={() => setClientView("actividad")}>Movimientos</button>
              <button onClick={() => setClientView("empresa")}>Empresa</button>
              <button onClick={() => location.assign("/admin")}>Admin demo</button>
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
            <span className="kicker">Placezum</span>
            <h2>Pago por código</h2>
            <p className="muted">Mismo sistema Placezum de la app, adaptado a web: envía por DIP, IBAN o código. El lector NFC físico sigue estando solo en Android.</p>
            <label>
              Cuenta origen
              <select value={selectedAccountId} onChange={(event) => setSelectedAccountId(event.target.value)}>
                {session.accounts.map((account) => (
                  <option key={account.id} value={account.id}>{account.displayName} · {account.iban}</option>
                ))}
              </select>
            </label>
            <label>
              Destino
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
            <button disabled={loading || !destination || !selectedAccount}>Confirmar envío</button>
            <div className="feePreview">
              <span>Tasa estimada</span>
              <strong>{formatPz(estimatedFee)} Pz</strong>
              <small>{webFeePercent}% si cruza entre web y app. La operación queda auditada.</small>
            </div>
            <div className="webCompatibilityNote">
              <strong>Compatibilidad web</strong>
              <span>Tarjeta virtual NFC, lector Placezum y vinculación de Promo Cards se ejecutan en Android. La web usa el mismo backend y opera por código.</span>
            </div>
          </form>
          )}

          {clientView === "tarjetas" && (
          <section className="panel" id="webCards">
            <span className="kicker">Más · Tarjetas</span>
            <h2>Tarjetas</h2>
            <p className="muted">Puedes consultar tarjetas virtuales y Promo Cards ya vinculadas. El alta física y el pago móvil se hacen desde Android.</p>
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
            <span className="kicker">Mercado</span>
            <h2>Inversión 60 segundos</h2>
            {!canInvest ? (
              <p className="muted">Módulo bloqueado para cuentas Junior o infantiles.</p>
            ) : (
              <form onSubmit={startInvestment} className="transferPanel">
                <p className="muted">Introduce una cantidad. El backend resuelve el resultado y la web avisa al terminar el minuto.</p>
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
              <span className="kicker">Más · Empresa / Asociación</span>
              <h2>{businessAccounts.length}</h2>
              <p>Cuentas corporativas asociadas a tu sesión. Límite institucional: {formatPz(session.treasuryConfig.institutionalDeclarationThresholdPz || 10_000_000)} Pz.</p>
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
            <span className="kicker">Más · Movimientos</span>
            <h2>Actividad</h2>
            {session.transactions.map((transaction) => {
              const incoming = session.accounts.some((account) => account.id === transaction.toAccountId);
              return (
                <article className="movement" key={transaction.id}>
                  <div>
                    <strong>{transaction.note}</strong>
                    <span>{formatDate(transaction.createdAt)} · {transaction.concept || transaction.kind} · Tasas/IVA {formatPz(transaction.taxAmount || transaction.ivaPz || 0)} Pz</span>
                  </div>
                  <button className="softButton" disabled={receiptLoadingId === transaction.id} onClick={() => downloadReceipt(transaction)}>
                    {receiptLoadingId === transaction.id ? "Generando" : "PDF"}
                  </button>
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
          {visibleTabs.slice(0, 4).map((tab) => (
            <button key={tab.id} className={activeTab === tab.id ? "active" : ""} onClick={() => openAppTab(tab)}>
              {tab.label}
            </button>
          ))}
        </nav>
      )}
    </main>
  );
}
