"use client";

import { AlertTriangle, BadgeCheck, Banknote, CreditCard, Download, Eye, Landmark, Lock, Save, ShieldCheck, SlidersHorizontal, Ticket, WalletCards } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Account,
  BankState,
  DigitalCard,
  finalizeState,
  formatPz,
  normalizeState,
  PromoCardSerial,
  TreasuryConfig,
  updateTreasuryConfig
} from "../../lib/bank";

const PLACETAID_BASE_URL = "https://id.laplaceta.org";
const PLACETAID_SERVICE_NAME = "BancodeLaPlacetaAdmin";

type AdminUser = {
  dip: string;
  nombreCompleto?: string;
  nombre?: string;
  apellidos?: string;
};

type AdminTab = "normativa" | "cuentas" | "tarjetas" | "promocards" | "procedencia" | "informes";
type AdminApiPayload = {
  error?: string;
  state?: Partial<BankState> | null;
};

function parseAdminUser(raw: string | null): AdminUser | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as AdminUser;
    const dip = String(parsed.dip || "").trim().toUpperCase();
    return dip ? { ...parsed, dip } : null;
  } catch {
    return null;
  }
}

function displayAdmin(user: AdminUser) {
  return user.nombreCompleto || [user.nombre, user.apellidos].filter(Boolean).join(" ") || user.dip;
}

function moneyCsv(state: BankState) {
  const lines = ["tipo,id,dip,placetaId,cuenta,iban,saldo,estado"];
  state.accounts.forEach((account) => {
    const user = state.users.find((item) => item.placetaId === account.placetaId);
    lines.push([account.type, account.id, user?.dip || "", account.placetaId || "", account.displayName, account.iban, account.balancePz, account.complianceStatus || "Clear"].join(","));
  });
  return lines.join("\n");
}

function signedAmountForAccount(transaction: BankState["transactions"][number], accountId: string) {
  if (transaction.toAccountId === accountId) return transaction.amountPz;
  if (transaction.fromAccountId === accountId) return -transaction.amountPz;
  return transaction.amountPz;
}

function formatSignedPz(amount: number) {
  const sign = amount >= 0 ? "+" : "-";
  return `${sign}${formatPz(Math.abs(amount))}`;
}

function downloadText(name: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

async function readApiJson(response: Response): Promise<AdminApiPayload> {
  const text = await response.text();
  if (!text.trim()) return {};
  try {
    return JSON.parse(text) as AdminApiPayload;
  } catch {
    return { error: `Respuesta no JSON (${response.status})` };
  }
}

export default function AdminPanelPage() {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [state, setState] = useState<BankState | null>(null);
  const [baseUpdatedAt, setBaseUpdatedAt] = useState<string | null>(null);
  const [tab, setTab] = useState<AdminTab>("normativa");
  const [status, setStatus] = useState("Esperando PlacetaID");
  const [busy, setBusy] = useState(false);
  const [serialInput, setSerialInput] = useState("");
  const [selectedPromoSerial, setSelectedPromoSerial] = useState("");
  const [provenanceAccountId, setProvenanceAccountId] = useState("");
  const [provenanceQuery, setProvenanceQuery] = useState("");
  const [nfcStatus, setNfcStatus] = useState("NFC sin iniciar");
  const [nfcBusy, setNfcBusy] = useState(false);

  const token = typeof window !== "undefined" ? sessionStorage.getItem("placetaid-token") || localStorage.getItem("placetaidToken") || "" : "";

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const callbackToken = params.get("placetaid_token") || params.get("token");
    const callbackUser = parseAdminUser(params.get("user"));
    if (callbackToken) sessionStorage.setItem("placetaid-token", callbackToken);
    if (callbackUser) {
      localStorage.setItem("adminPlacetaUser", JSON.stringify(callbackUser));
      setAdminUser(callbackUser);
      params.delete("token");
      params.delete("placetaid_token");
      params.delete("user");
      params.delete("platform");
      params.delete("expires_in");
      params.delete("state");
      window.history.replaceState({}, "", `${window.location.pathname}${params.toString() ? `?${params}` : ""}`);
      return;
    }
    setAdminUser(parseAdminUser(localStorage.getItem("adminPlacetaUser")));
  }, []);

  const adminHeaders = useMemo(() => ({
    "content-type": "application/json",
    "x-admin-dip": adminUser?.dip || "",
    "authorization": `Bearer ${token}`
  }), [adminUser?.dip, token]);

  const loadAdminState = useCallback(async () => {
    if (!adminUser || !token) return;
    setBusy(true);
    try {
      const response = await fetch("/api/admin-bank", { headers: adminHeaders, cache: "no-store" });
      const payload = await readApiJson(response);
      if (!response.ok) throw new Error(String(payload.error || "Acceso admin rechazado"));
      const next = normalizeState(payload.state);
      setState(next);
      setBaseUpdatedAt(next.updatedAt || null);
      setStatus(`Acceso admin concedido para ${adminUser.dip}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "No se pudo cargar administración");
      setState(null);
    } finally {
      setBusy(false);
    }
  }, [adminHeaders, adminUser, token]);

  useEffect(() => {
    void loadAdminState();
  }, [loadAdminState]);

  async function save(next: BankState, message: string) {
    if (!adminUser || !token) return;
    setBusy(true);
    try {
      const normalized = finalizeState(next);
      const response = await fetch("/api/admin-bank", {
        method: "PUT",
        headers: adminHeaders,
        body: JSON.stringify({ state: normalized, baseUpdatedAt })
      });
      const payload = await readApiJson(response);
      if (!response.ok) throw new Error(String(payload.error || "No se pudo guardar"));
      const saved = normalizeState(payload.state);
      setState(saved);
      setBaseUpdatedAt(saved.updatedAt || null);
      setStatus(message);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Error guardando cambios");
    } finally {
      setBusy(false);
    }
  }

  function startPlacetaId() {
    const stateToken = crypto.randomUUID();
    localStorage.setItem("adminPlacetaidOauthState", stateToken);
    const url = new URL(`${PLACETAID_BASE_URL}/`);
    url.searchParams.set("from", `${window.location.origin}/admin`);
    url.searchParams.set("platform", "web");
    url.searchParams.set("state", stateToken);
    url.searchParams.set("service", PLACETAID_SERVICE_NAME);
    window.location.href = url.toString();
  }

  function updateAccount(accountId: string, patch: Partial<Account>) {
    if (!state) return;
    void save({ ...state, accounts: state.accounts.map((account) => account.id === accountId ? { ...account, ...patch } : account) }, "Cuenta actualizada");
  }

  function updateCard(cardId: string, patch: Partial<DigitalCard>) {
    if (!state) return;
    void save({ ...state, digitalCards: state.digitalCards.map((card) => card.id === cardId ? { ...card, ...patch } : card) }, "Tarjeta actualizada");
  }

  function addPromoSerials() {
    if (!state) return;
    const now = new Date().toISOString();
    const incoming = serialInput
      .split(/\s|,|;/)
      .map((item) => item.trim().toUpperCase())
      .filter(Boolean)
      .map((serial) => ({ id: `promo-serial-${crypto.randomUUID()}`, serial, status: "Available" as const, createdAt: now, updatedAt: now }));
    if (!incoming.length) return;
    void save({ ...state, promoCardSerials: [...incoming, ...(state.promoCardSerials || [])] }, "Series PromoCard dadas de alta");
    setSerialInput("");
  }

  function updatePromo(serial: PromoCardSerial, patch: Partial<PromoCardSerial>) {
    if (!state) return;
    void save({
      ...state,
      promoCardSerials: (state.promoCardSerials || []).map((item) => item.serial === serial.serial ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item)
    }, "PromoCard actualizada");
  }

  function nfcAvailable() {
    return typeof window !== "undefined" && "NDEFReader" in window;
  }

  function promoPayload(serial: string) {
    return JSON.stringify({
      type: "GDLP_PROMOCARD",
      serial,
      issuer: "Banco de La Placeta",
      version: 1
    });
  }

  function decodeNfcRecord(record: unknown) {
    const item = record as { data?: DataView; recordType?: string };
    if (!item.data) return "";
    try {
      return new TextDecoder().decode(item.data);
    } catch {
      return `[${item.recordType || "record"}]`;
    }
  }

  function selectedPromo() {
    if (!state) return null;
    return (state.promoCardSerials || []).find((item) => item.serial === selectedPromoSerial) || null;
  }

  async function readPromoNfc() {
    if (!nfcAvailable()) {
      setNfcStatus("Este navegador no expone Web NFC. Usa Chrome Android/HTTPS o un puente nativo para lectores USB.");
      return;
    }
    setNfcBusy(true);
    setNfcStatus("Acerca la PromoCard al lector NFC...");
    try {
      const reader = new (window as unknown as { NDEFReader: new () => { scan: () => Promise<void>; addEventListener: (type: string, listener: (event: unknown) => void, options?: AddEventListenerOptions) => void } }).NDEFReader();
      await reader.scan();
      reader.addEventListener("reading", (event: unknown) => {
        const reading = event as { serialNumber?: string; message?: { records?: unknown[] } };
        const payload = (reading.message?.records || []).map(decodeNfcRecord).filter(Boolean).join("\n");
        const uid = reading.serialNumber || "UID no expuesto";
        setNfcStatus(`Leída PromoCard NFC · ${uid}${payload ? ` · ${payload}` : ""}`);
        const matched = (state?.promoCardSerials || []).find((item) => payload.includes(item.serial));
        if (matched) {
          updatePromo(matched, { nfcUid: uid, nfcPayload: payload, lastNfcScanAt: new Date().toISOString(), note: "Validada por NFC" });
          setSelectedPromoSerial(matched.serial);
        }
        setNfcBusy(false);
      }, { once: true });
    } catch (error) {
      setNfcBusy(false);
      setNfcStatus(error instanceof Error ? error.message : "No se pudo iniciar NFC");
    }
  }

  async function writePromoNfc(lockAfterWrite = false) {
    const promo = selectedPromo();
    if (!promo) {
      setNfcStatus("Selecciona una serie PromoCard registrada antes de escribir.");
      return;
    }
    if (promo.writeLocked) {
      setNfcStatus("Esta serie está marcada como escritura bloqueada.");
      return;
    }
    if (!nfcAvailable()) {
      setNfcStatus("Web NFC no disponible en este navegador. No puedo escribir desde la web.");
      return;
    }
    setNfcBusy(true);
    setNfcStatus(`Acerca la tarjeta para escribir ${promo.serial}...`);
    try {
      const reader = new (window as unknown as { NDEFReader: new () => { write: (message: unknown) => Promise<void>; makeReadOnly?: () => Promise<void> } }).NDEFReader();
      const payload = promoPayload(promo.serial);
      await reader.write({ records: [{ recordType: "text", data: payload }] });
      let locked = false;
      if (lockAfterWrite && typeof reader.makeReadOnly === "function") {
        await reader.makeReadOnly();
        locked = true;
      }
      updatePromo(promo, {
        status: promo.status === "Available" ? "Assigned" : promo.status,
        nfcPayload: payload,
        writeLocked: promo.writeLocked || locked,
        lastNfcScanAt: new Date().toISOString(),
        note: locked ? "NFC escrito y bloqueado en solo lectura" : "NFC escrito"
      });
      setNfcStatus(locked ? `Escrita y bloqueada ${promo.serial}` : `Escrita ${promo.serial}`);
    } catch (error) {
      setNfcStatus(error instanceof Error ? error.message : "No se pudo escribir NFC");
    } finally {
      setNfcBusy(false);
    }
  }

  function markPromoWriteLocked() {
    const promo = selectedPromo();
    if (!promo) return;
    updatePromo(promo, { writeLocked: true, status: "Blocked", note: "Bloqueada administrativamente para escritura", updatedAt: new Date().toISOString() });
    setNfcStatus(`Serie ${promo.serial} bloqueada administrativamente.`);
  }

  const stats = useMemo(() => {
    const s = state;
    if (!s) return null;
    const totalMoney = s.accounts.reduce((sum, account) => sum + Math.max(0, account.balancePz), 0);
    const taxPaid = s.transactions.filter((txn) => ["Tax", "OperationalFee", "InvestmentTax", "ForcedVatRegularization"].includes(txn.kind)).reduce((sum, txn) => sum + Math.max(txn.amountPz, txn.taxAmount, txn.ivaPz), 0);
    const blockedAccounts = s.accounts.filter((account) => (account.complianceStatus || "Clear") !== "Clear").length;
    const frozenCards = s.digitalCards.filter((card) => card.frozen).length;
    return { totalMoney, taxPaid, blockedAccounts, frozenCards };
  }, [state]);

  const taxesByUser = useMemo(() => {
    if (!state) return [];
    return state.users.map((user) => {
      const accountIds = new Set(state.accounts.filter((account) => account.placetaId === user.placetaId || account.id === user.primaryAccountId).map((account) => account.id));
      const txs = state.transactions.filter((txn) => accountIds.has(txn.fromAccountId) || accountIds.has(txn.toAccountId));
      const taxes = txs.filter((txn) => ["Tax", "OperationalFee", "InvestmentTax", "ForcedVatRegularization"].includes(txn.kind)).reduce((sum, txn) => sum + Math.max(txn.amountPz, txn.taxAmount, txn.ivaPz), 0);
      const fees = txs.filter((txn) => txn.concept === "WEB_APP_BRIDGE_COMMISSION" || txn.kind === "InvestmentCommission").reduce((sum, txn) => sum + txn.amountPz, 0);
      return { user, taxes, fees, movements: txs.length };
    }).sort((a, b) => b.taxes + b.fees - (a.taxes + a.fees));
  }, [state]);

  const provenanceAccount = useMemo(() => {
    if (!state) return null;
    return state.accounts.find((account) => account.id === provenanceAccountId) || state.accounts[0] || null;
  }, [provenanceAccountId, state]);

  const provenanceMovements = useMemo(() => {
    if (!state || !provenanceAccount) return [];
    const query = provenanceQuery.trim().toLowerCase();
    return state.transactions
      .filter((transaction) => transaction.fromAccountId === provenanceAccount.id || transaction.toAccountId === provenanceAccount.id)
      .filter((transaction) => {
        if (!query) return true;
        const from = state.accounts.find((account) => account.id === transaction.fromAccountId);
        const to = state.accounts.find((account) => account.id === transaction.toAccountId);
        return [transaction.id, transaction.kind, transaction.note, transaction.concept, transaction.IBAN_Origin, from?.displayName, to?.displayName]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));
      })
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }, [provenanceAccount, provenanceQuery, state]);

  const provenanceTotals = useMemo(() => {
    if (!provenanceAccount) return { incoming: 0, outgoing: 0 };
    return provenanceMovements.reduce((totals, transaction) => {
      const signed = signedAmountForAccount(transaction, provenanceAccount.id);
      return {
        incoming: totals.incoming + Math.max(0, signed),
        outgoing: totals.outgoing + Math.max(0, -signed)
      };
    }, { incoming: 0, outgoing: 0 });
  }, [provenanceAccount, provenanceMovements]);

  if (!adminUser || !token) {
    return (
      <main className="admin-standalone">
        <section className="admin-login-panel">
          <Lock size={30} />
          <h1>Admin Banco GDLP</h1>
          <p>Acceso separado para web y app. Requiere PlacetaID y DIP incluido en la lista administrativa del servidor.</p>
          <button className="primary-button" onClick={startPlacetaId}><ShieldCheck size={18} /> Entrar con PlacetaID</button>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-standalone">
      <header className="admin-topbar">
        <div>
          <span>Panel Admin · Web/App</span>
          <h1>{displayAdmin(adminUser)}</h1>
          <p>{status}</p>
        </div>
        <button className="secondary-button" onClick={() => void loadAdminState()} disabled={busy}>Actualizar</button>
      </header>

      {state && stats ? (
        <>
          <section className="admin-stat-grid">
            <div><span>Masa GDLP</span><strong>{formatPz(stats.totalMoney)} Pz</strong></div>
            <div><span>Impuestos/tasas</span><strong>{formatPz(stats.taxPaid)} Pz</strong></div>
            <div><span>Cuentas bloqueadas</span><strong>{stats.blockedAccounts}</strong></div>
            <div><span>Tarjetas congeladas</span><strong>{stats.frozenCards}</strong></div>
          </section>

          <nav className="admin-tabs" aria-label="Secciones admin">
            {[
              ["normativa", SlidersHorizontal, "Normativa"],
              ["cuentas", WalletCards, "Cuentas"],
              ["tarjetas", CreditCard, "Tarjetas"],
              ["promocards", Ticket, "PromoCards"],
              ["procedencia", Eye, "Procedencia"],
              ["informes", Download, "Informes"]
            ].map(([id, Icon, label]) => (
              <button key={id as string} className={tab === id ? "active" : ""} onClick={() => setTab(id as AdminTab)}>
                <Icon size={18} /> {label as string}
              </button>
            ))}
          </nav>

          {tab === "normativa" && <TreasuryEditor state={state} onSave={(patch) => void save(updateTreasuryConfig(state, patch), "Normativa guardada")} />}

          {tab === "cuentas" && (
            <section className="admin-table">
              {state.accounts.map((account) => (
                <article key={account.id}>
                  <div><strong>{account.displayName}</strong><span>{account.iban} · {account.type} · {account.placetaId || "Sistema"}</span></div>
                  <b>{formatPz(account.balancePz)} Pz</b>
                  <select value={account.complianceStatus || "Clear"} onChange={(event) => updateAccount(account.id, { complianceStatus: event.target.value })}>
                    <option value="Clear">Activa</option>
                    <option value="Blocked_Admin">Bloqueada Admin</option>
                    <option value="Blocked_Tax">Bloqueada Fiscal</option>
                    <option value="Review">En revisión</option>
                  </select>
                </article>
              ))}
            </section>
          )}

          {tab === "tarjetas" && (
            <section className="admin-table">
              {state.digitalCards.map((card) => {
                const account = state.accounts.find((item) => item.id === card.accountId);
                return (
                  <article key={card.id}>
                    <div><strong>{card.alias}</strong><span>{account?.displayName || card.accountId} · {card.tier} · {card.promoPhysical ? "Promo física" : "Virtual"}</span></div>
                    <b>{card.cardNumber}</b>
                    <button className={card.frozen ? "secondary-button" : "primary-button"} onClick={() => updateCard(card.id, { frozen: !card.frozen })}>
                      {card.frozen ? "Desbloquear" : "Bloquear"}
                    </button>
                  </article>
                );
              })}
            </section>
          )}

          {tab === "promocards" && (
            <section className="admin-two-col">
              <article className="admin-panel-box">
                <h2>Alta de series</h2>
                <textarea value={serialInput} onChange={(event) => setSerialInput(event.target.value)} placeholder="PROMO-2026-0001, PROMO-2026-0002..." />
                <button className="primary-button" onClick={addPromoSerials}><BadgeCheck size={17} /> Registrar series</button>
                <div className="nfc-console">
                  <h3>Lector NFC</h3>
                  <p>{nfcAvailable() ? "Web NFC disponible. Acerca una PromoCard NDEF al lector." : "Web NFC no disponible. Los lectores USB/PCSC requieren app puente o navegador compatible."}</p>
                  <select value={selectedPromoSerial} onChange={(event) => setSelectedPromoSerial(event.target.value)}>
                    <option value="">Selecciona serie</option>
                    {(state.promoCardSerials || []).map((serial) => <option key={serial.id} value={serial.serial}>{serial.serial} · {serial.status}</option>)}
                  </select>
                  <div className="nfc-actions">
                    <button className="secondary-button" disabled={nfcBusy} onClick={() => void readPromoNfc()}>Validar lectura</button>
                    <button className="primary-button" disabled={nfcBusy || !selectedPromoSerial} onClick={() => void writePromoNfc(false)}>Escribir NFC</button>
                    <button className="secondary-button" disabled={nfcBusy || !selectedPromoSerial} onClick={() => void writePromoNfc(true)}>Escribir y bloquear</button>
                    <button className="secondary-button" disabled={!selectedPromoSerial} onClick={markPromoWriteLocked}>Bloqueo admin</button>
                  </div>
                  <span className="nfc-status">{nfcStatus}</span>
                </div>
              </article>
              <div className="admin-table">
                {(state.promoCardSerials || []).map((serial) => (
                  <article key={serial.id}>
                    <div><strong>{serial.serial}</strong><span>{serial.note || "Sin nota"} · {serial.accountId || "No asignada"} · {serial.nfcUid || "Sin NFC"}{serial.writeLocked ? " · escritura bloqueada" : ""}</span></div>
                    <select value={serial.status} onChange={(event) => updatePromo(serial, { status: event.target.value as PromoCardSerial["status"] })}>
                      <option value="Available">Disponible</option>
                      <option value="Assigned">Asignada</option>
                      <option value="Redeemed">Canjeada</option>
                      <option value="Blocked">Bloqueada</option>
                    </select>
                  </article>
                ))}
              </div>
            </section>
          )}

          {tab === "procedencia" && (
            <section className="admin-two-col">
              <article className="admin-panel-box">
                <h2>Procedencia del dinero</h2>
                <p>Inspecciona entradas, salidas, origen IBAN, contraparte, concepto, estado e ID de cada movimiento.</p>
                <label>
                  <span>Cuenta</span>
                  <select value={provenanceAccount?.id || ""} onChange={(event) => setProvenanceAccountId(event.target.value)}>
                    {state.accounts.map((account) => (
                      <option key={account.id} value={account.id}>{account.displayName} · {account.iban} · {formatPz(account.balancePz)} Pz</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Buscar</span>
                  <input value={provenanceQuery} onChange={(event) => setProvenanceQuery(event.target.value)} placeholder="ID, concepto, origen, cuenta" />
                </label>
                <div className="admin-stat-grid compact">
                  <div><span>Saldo</span><strong>{formatPz(provenanceAccount?.balancePz || 0)} Pz</strong></div>
                  <div><span>Entradas</span><strong>+{formatPz(provenanceTotals.incoming)} Pz</strong></div>
                  <div><span>Salidas</span><strong>-{formatPz(provenanceTotals.outgoing)} Pz</strong></div>
                  <div><span>Movs.</span><strong>{provenanceMovements.length}</strong></div>
                </div>
              </article>
              <div className="admin-table">
                {provenanceMovements.slice(0, 40).map((transaction) => {
                  const from = state.accounts.find((account) => account.id === transaction.fromAccountId);
                  const to = state.accounts.find((account) => account.id === transaction.toAccountId);
                  const signed = signedAmountForAccount(transaction, provenanceAccount?.id || "");
                  return (
                    <article key={transaction.id}>
                      <div>
                        <strong>{formatSignedPz(signed)} Pz · {transaction.kind}</strong>
                        <span>{from?.displayName || transaction.fromAccountId} → {to?.displayName || transaction.toAccountId}</span>
                        <span>Origen {transaction.IBAN_Origin || transaction.fromAccountId} · {transaction.concept || transaction.note} · {transaction.status}</span>
                        <code>{transaction.id}</code>
                      </div>
                      <b>{transaction.createdAt.slice(0, 16).replace("T", " ")}</b>
                    </article>
                  );
                })}
                {!provenanceMovements.length && <article><div><strong>Sin movimientos</strong><span>No hay trazas para esta cuenta.</span></div></article>}
              </div>
            </section>
          )}

          {tab === "informes" && (
            <section className="admin-two-col">
              <article className="admin-panel-box">
                <h2>Exportación</h2>
                <p>Descarga cuentas, saldos, estados y titulares para inspección interna.</p>
                <button className="primary-button" onClick={() => downloadText("admin-banco-gdlp.csv", moneyCsv(state))}><Download size={17} /> Descargar CSV</button>
              </article>
              <div className="admin-table">
                {taxesByUser.map((row) => (
                  <article key={row.user.dip}>
                    <div><strong>{row.user.displayName}</strong><span>{row.user.dip} · {row.movements} movimientos</span></div>
                    <b>{formatPz(row.taxes)} Pz tasas · {formatPz(row.fees)} Pz comisiones</b>
                  </article>
                ))}
              </div>
            </section>
          )}
        </>
      ) : (
        <section className="admin-login-panel"><AlertTriangle size={28} /><h1>Sin acceso</h1><p>{status}</p></section>
      )}
    </main>
  );
}

function TreasuryEditor({ state, onSave }: { state: BankState; onSave: (patch: Partial<TreasuryConfig>) => void }) {
  const [draft, setDraft] = useState<TreasuryConfig>(state.treasuryConfig);
  const fields: Array<[keyof TreasuryConfig, string]> = [
    ["operationalTransferTaxPercent", "Tasa operativa %"],
    ["webBridgeCommissionPercent", "Comisión Web/App %"],
    ["placezumWeeklyLimitPz", "Máximo Placezum semanal"],
    ["weeklyTaxPercent", "Impuesto semanal %"],
    ["monthlyTaxPercent", "Impuesto mensual %"],
    ["weeklyDeveloperApiFeePercent", "Tasa API pagos %"],
    ["weeklyPaymentLinkFeePercent", "Tasa enlaces %"],
    ["minimumWeeklySalaryPz", "Mínimo nómina"],
    ["payrollWorkerTaxPercent", "Impuesto trabajador %"],
    ["payrollEmployerTaxPercent", "Impuesto empresa %"],
    ["cardIssueFeePz", "Alta tarjeta"],
    ["businessRegistrationFeePz", "Alta empresa"],
    ["auditDailyTransferLimitPz", "Máximo auditoría diaria"],
    ["personalDeclarationThresholdPz", "Mínimo declaración personal"],
    ["institutionalDeclarationThresholdPz", "Mínimo declaración institución"],
    ["maxCurrentAccounts", "Máx cuentas personales"],
    ["maxSavingsAccounts", "Máx huchas"],
    ["maxChildAccounts", "Máx infantiles"],
    ["maxBusinessAccounts", "Máx empresas"],
    ["maxInvestmentAccounts", "Máx inversión"],
    ["maxCurrentBalancePz", "Máx saldo personal"],
    ["maxSavingsBalancePz", "Máx saldo hucha"],
    ["maxChildBalancePz", "Máx saldo infantil"],
    ["maxBusinessBalancePz", "Máx saldo empresa"],
    ["maxInvestmentBalancePz", "Máx saldo inversión"],
    ["investmentProfitTaxPercent", "Impuesto ganancia inversión %"],
    ["investmentGainCommissionPercent", "Comisión ganancia inversión %"],
    ["maxInvestmentAmountPz", "Máx inversión operación"],
    ["dailyInvestmentLimit", "Inversiones/día"],
    ["minSupportedVersionCode", "Versión mínima app"]
  ];

  return (
    <section className="admin-panel-box">
      <h2>Comisiones, impuestos, tasas, máximos y mínimos</h2>
      <div className="admin-config-grid">
        {fields.map(([key, label]) => (
          <label key={String(key)}>
            <span>{label}</span>
            <input type="number" value={String(draft[key] ?? 0)} onChange={(event) => setDraft({ ...draft, [key]: Number(event.target.value) || 0 })} />
          </label>
        ))}
      </div>
      <button className="primary-button" onClick={() => onSave(draft)}><Save size={17} /> Guardar normativa</button>
    </section>
  );
}
