"use client";

import {
  Banknote,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  Contactless,
  CreditCard,
  Download,
  Eye,
  EyeOff,
  Gavel,
  Home,
  Landmark,
  Lock,
  LogOut,
  MoreHorizontal,
  QrCode,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  WalletCards,
  WifiOff
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Image from "next/image";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Account,
  AGLDP_ID,
  BankState,
  buyInvestment,
  claimRbu,
  demoSeed,
  DigitalCard,
  formatMoneyPz,
  formatPz,
  ibanGenerate,
  issueCard,
  LedgerTransaction,
  normalizeState,
  sha256,
  TGLP_ID,
  toggleCard,
  transferByIban,
  UserProfile
} from "../lib/bank";

type Tab = "home" | "placezum" | "market" | "hub" | "tributos" | "admin";

const tabs: Array<{ id: Tab; label: string; icon: LucideIcon }> = [
  { id: "home", label: "Inicio", icon: Home },
  { id: "placezum", label: "Placezum", icon: QrCode },
  { id: "market", label: "Mercado", icon: TrendingUp },
  { id: "hub", label: "Hub", icon: MoreHorizontal },
  { id: "tributos", label: "TGLP", icon: Gavel },
  { id: "admin", label: "Admin", icon: Landmark }
];

export default function BancoPlacetaWeb() {
  const [state, setState] = useState<BankState>(() => normalizeState(null));
  const [activeUser, setActiveUser] = useState<UserProfile | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState("u-alba");
  const [tab, setTab] = useState<Tab>("home");
  const [sync, setSync] = useState<"loading" | "online" | "offline">("loading");
  const [toast, setToast] = useState("");

  useEffect(() => {
    const cached = localStorage.getItem("placeta-web-state");
    const savedDip = localStorage.getItem("placeta-web-dip");
    if (cached) setState(normalizeState(JSON.parse(cached)));
    fetch("/api/bank-state", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("API no disponible");
        const remote = normalizeState(await response.json());
        setState(remote);
        localStorage.setItem("placeta-web-state", JSON.stringify(remote));
        setSync("online");
        if (savedDip) {
          const user = remote.users.find((item) => item.dip === savedDip) || null;
          setActiveUser(user);
          if (user) setSelectedAccountId(user.primaryAccountId);
        }
      })
      .catch(() => {
        setSync("offline");
        if (savedDip) {
          const user = normalizeState(cached ? JSON.parse(cached) : demoSeed()).users.find((item) => item.dip === savedDip) || null;
          setActiveUser(user);
          if (user) setSelectedAccountId(user.primaryAccountId);
        }
      });
  }, []);

  useEffect(() => {
    localStorage.setItem("placeta-web-state", JSON.stringify(state));
  }, [state]);

  const accountsById = useMemo(() => new Map(state.accounts.map((account) => [account.id, account])), [state.accounts]);
  const userAccounts = useMemo(() => {
    if (!activeUser) return [];
    return state.accounts.filter((account) => account.placetaId === activeUser.placetaId || account.id === activeUser.primaryAccountId);
  }, [activeUser, state.accounts]);
  const selectedAccount = accountsById.get(selectedAccountId) || userAccounts[0] || state.accounts.find((item) => item.id === "u-alba")!;
  const visibleTabs = activeUser?.dip === "DIP-A001" ? tabs : tabs.filter((item) => !["tributos", "admin"].includes(item.id));

  async function persist(next: BankState, message: string) {
    setState(next);
    setToast(message);
    try {
      const response = await fetch("/api/bank-state", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(next)
      });
      setSync(response.ok ? "online" : "offline");
    } catch {
      setSync("offline");
    }
  }

  function runOperation(operation: () => BankState, message: string) {
    try {
      void persist(operation(), message);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Operación rechazada");
    }
  }

  if (!activeUser) {
    return (
      <LoginScreen
        state={state}
        sync={sync}
        onLogin={(user) => {
          setActiveUser(user);
          setSelectedAccountId(user.primaryAccountId);
          localStorage.setItem("placeta-web-dip", user.dip);
        }}
        onRegister={(next, user) => {
          void persist(next, "DIP registrado en Banco Placeta");
          setActiveUser(user);
          setSelectedAccountId(user.primaryAccountId);
          localStorage.setItem("placeta-web-dip", user.dip);
        }}
      />
    );
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Banco Digital de La Placeta</p>
          <h1>{activeUser.displayName}</h1>
        </div>
        <div className="top-actions">
          <StatusPill sync={sync} />
          <button
            className="icon-button"
            aria-label="Cerrar sesión"
            onClick={() => {
              setActiveUser(null);
              localStorage.removeItem("placeta-web-dip");
            }}
          >
            <LogOut size={19} />
          </button>
        </div>
      </header>

      <section className="account-strip">
        {userAccounts.map((account) => (
          <button key={account.id} className={`account-chip ${account.id === selectedAccount.id ? "active" : ""}`} onClick={() => setSelectedAccountId(account.id)}>
            <span>{account.displayName}</span>
            <strong>{formatPz(account.balancePz)} Pz</strong>
          </button>
        ))}
      </section>

      {tab === "home" && (
        <HomeScreen
          account={selectedAccount}
          accounts={state.accounts}
          transactions={state.transactions}
          cards={state.digitalCards.filter((card) => card.accountId === selectedAccount.id)}
          onTransfer={(iban, amount, note) => runOperation(() => transferByIban(state, selectedAccount.id, iban, amount, note), "Transferencia GDLP ejecutada")}
          onRbu={() => runOperation(() => claimRbu(state, selectedAccount.id), "RBU abonada")}
          onIssueCard={() => runOperation(() => issueCard(state, selectedAccount.id), "Tarjeta digital emitida")}
          onToggleCard={(cardId) => runOperation(() => toggleCard(state, cardId), "Estado de tarjeta actualizado")}
        />
      )}

      {tab === "placezum" && (
        <PlacezumScreen
          user={activeUser}
          account={selectedAccount}
          accounts={state.accounts}
          contacts={state.savedContacts.filter((contact) => contact.ownerPlacetaId === activeUser.placetaId)}
          onPay={(targetId, amount) => {
            const target = accountsById.get(targetId);
            if (target) runOperation(() => transferByIban(state, selectedAccount.id, target.iban, amount, `Placezum a ${target.displayName}`, "Placezum"), "Pago Placezum confirmado");
          }}
        />
      )}

      {tab === "market" && (
        <MarketScreen
          state={state}
          account={selectedAccount}
          onBuy={(marketId, amount) => runOperation(() => buyInvestment(state, selectedAccount.id, marketId, amount), "Orden de inversión registrada")}
        />
      )}

      {tab === "hub" && <HubScreen state={state} user={activeUser} />}
      {tab === "tributos" && <TributosScreen state={state} />}
      {tab === "admin" && <AdminScreen state={state} onPersist={(next, message) => void persist(next, message)} />}

      <nav className="bottom-nav">
        {visibleTabs.map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.id} className={tab === item.id ? "active" : ""} onClick={() => setTab(item.id)} aria-label={item.label}>
              <Icon size={21} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {toast && (
        <button className="toast" onClick={() => setToast("")}>
          <CheckCircle2 size={18} />
          {toast}
        </button>
      )}
    </main>
  );
}

function LoginScreen({ state, sync, onLogin, onRegister }: { state: BankState; sync: string; onLogin: (user: UserProfile) => void; onRegister: (state: BankState, user: UserProfile) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [dip, setDip] = useState("DIP-A001");
  const [pin, setPin] = useState("1234");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const slide = state.promoSlides[0];

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    const normalizedDip = dip.trim().toUpperCase();
    if (mode === "login") {
      const user = state.users.find((item) => item.dip === normalizedDip);
      if (!user) return setError("DIP no registrado");
      if (user.pinHash !== await sha256(pin)) return setError("PIN incorrecto");
      return onLogin(user);
    }
    if (!/^DIP-[A-Z0-9]{4}$/.test(normalizedDip)) return setError("Formato DIP inválido. Usa DIP-XXXX");
    if (pin.length < 4 || name.trim().length < 2) return setError("Completa nombre y PIN de 4 dígitos");
    if (state.users.some((item) => item.dip === normalizedDip)) return setError("Ese DIP ya existe");
    const accountId = `acct-${crypto.randomUUID()}`;
    const user: UserProfile = {
      dip: normalizedDip,
      displayName: name.trim(),
      placetaId: normalizedDip.replace("DIP-", ""),
      pinHash: await sha256(pin),
      primaryAccountId: accountId,
      createdAt: new Date().toISOString()
    };
    const account: Account = {
      id: accountId,
      displayName: "Cuenta personal",
      kind: "CITIZEN",
      balancePz: 500,
      placetaId: user.placetaId,
      role: "Citizen",
      type: "Current",
      iban: ibanGenerate(accountId),
      citizenshipTier: "CiudadaniaPlena",
      complianceStatus: "Clear"
    };
    const admin = state.accounts.find((item) => item.id === AGLDP_ID)!;
    const welcome: LedgerTransaction = {
      id: `welcome-${crypto.randomUUID()}`,
      kind: "WelcomeBonus",
      fromAccountId: AGLDP_ID,
      toAccountId: account.id,
      amountPz: 500,
      ivaPz: 0,
      note: "Bono de bienvenida Banco Placeta",
      status: "Settled",
      createdAt: new Date().toISOString(),
      netAmount: 500,
      taxAmount: 0,
      concept: "WELCOME_BONUS",
      IBAN_Origin: admin.iban
    };
    onRegister({ ...state, users: [...state.users, user], accounts: [...state.accounts, account], transactions: [welcome, ...state.transactions] }, user);
  }

  return (
    <main className="login-shell">
      <Image className="login-bg" src={slide?.assetPath || "/assets/logobanco.jpg"} alt="" fill priority />
      <div className="login-content">
        <div className="brand-lockup">
          <Image src="/assets/icon2.png" alt="Banco Placeta" width={58} height={58} />
          <div>
            <p>{slide?.subtitle || "Servicios GDLP disponibles"}</p>
            <h1>{slide?.title || "BANCO PLACETA"}</h1>
          </div>
        </div>
        <form className="login-panel" onSubmit={submit}>
          <div className="segmented">
            <button type="button" className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>Entrar</button>
            <button type="button" className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>Registro</button>
          </div>
          {mode === "register" && <Field label="Nombre" value={name} onChange={setName} placeholder="Tu nombre" />}
          <Field label="DIP oficial" value={dip} onChange={setDip} placeholder="DIP-XXXX" />
          <Field label="PIN" value={pin} onChange={setPin} placeholder="1234" type="password" />
          {error && <p className="form-error">{error}</p>}
          <button className="primary-button" type="submit">{mode === "login" ? "Abrir banco" : "Crear DIP"}</button>
          <p className="login-hint">Demo: DIP-A001 / PIN 1234</p>
          <StatusPill sync={sync as "loading" | "online" | "offline"} />
        </form>
      </div>
    </main>
  );
}

function HomeScreen({ account, accounts, transactions, cards, onTransfer, onRbu, onIssueCard, onToggleCard }: {
  account: Account;
  accounts: Account[];
  transactions: LedgerTransaction[];
  cards: DigitalCard[];
  onTransfer: (iban: string, amount: number, note: string) => void;
  onRbu: () => void;
  onIssueCard: () => void;
  onToggleCard: (cardId: string) => void;
}) {
  const [showBalance, setShowBalance] = useState(true);
  const [iban, setIban] = useState(accounts.find((item) => item.id !== account.id && item.kind === "CITIZEN")?.iban || "");
  const [amount, setAmount] = useState(25);
  const [note, setNote] = useState("Pago GDLP");
  const history = transactionsFor(account.id, transactions).slice(0, 8);

  return (
    <section className="screen-grid">
      <article className="hero-card">
        <div className="hero-topline">
          <span>{account.displayName}</span>
          <button className="icon-button light" onClick={() => setShowBalance(!showBalance)} aria-label="Mostrar u ocultar saldo">
            {showBalance ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        <strong>{showBalance ? `${formatMoneyPz(account.balancePz)} Pz` : "••••••"}</strong>
        <p>{account.iban}</p>
      </article>

      <div className="quick-grid">
        <button onClick={onRbu}><Sparkles size={20} /> RBU</button>
        <button onClick={onIssueCard}><CreditCard size={20} /> Tarjeta</button>
        <button onClick={() => window.print()}><Download size={20} /> PDF</button>
      </div>

      <article className="panel transfer-panel">
        <SectionTitle icon={CircleDollarSign} title="Transferencia GDLP" />
        <Field label="IBAN destino" value={iban} onChange={setIban} />
        <div className="two-cols">
          <Field label="Importe Pz" value={String(amount)} onChange={(value) => setAmount(Number(value) || 0)} type="number" />
          <Field label="Concepto" value={note} onChange={setNote} />
        </div>
        <button className="primary-button" onClick={() => onTransfer(iban, amount, note)}>Enviar</button>
      </article>

      <article className="panel">
        <SectionTitle icon={WalletCards} title="Tarjetas" />
        <div className="cards-stack">
          {cards.map((card) => (
            <button key={card.id} className={`bank-card ${card.frozen ? "frozen" : ""}`} onClick={() => onToggleCard(card.id)}>
              <span>{card.alias}</span>
              <strong>•••• {card.cardNumber}</strong>
              <small>{card.frozen ? "Congelada" : "Activa"} · PIN {card.pin}</small>
            </button>
          ))}
          {!cards.length && <Empty title="Sin tarjetas" text="Emite una tarjeta digital para esta cuenta." />}
        </div>
      </article>

      <History transactions={history} accounts={accounts} />
    </section>
  );
}

function PlacezumScreen({ user, account, accounts, contacts, onPay }: { user: UserProfile; account: Account; accounts: Account[]; contacts: { accountId: string }[]; onPay: (targetId: string, amount: number) => void }) {
  const [amount, setAmount] = useState(12);
  const code = useMemo(() => {
    const windowId = Math.floor(Date.now() / 120000);
    let raw = 0;
    for (const char of `${account.iban}${windowId}`) raw = Math.abs(raw * 31 + char.charCodeAt(0));
    return String(raw % 100000).padStart(5, "0");
  }, [account.iban]);
  const favoriteAccounts = contacts.map((contact) => accounts.find((account) => account.id === contact.accountId)).filter(Boolean) as Account[];

  return (
    <section className="screen-grid">
      <article className="placezum-card">
        <div>
          <p>Código temporal de {user.placetaId}</p>
          <strong>{code}</strong>
          <span>Válido durante 120 segundos</span>
        </div>
        <QrCode size={98} strokeWidth={1.4} />
      </article>
      <article className="panel">
        <SectionTitle icon={Contactless} title="Contactos" />
        <Field label="Importe Pz" value={String(amount)} onChange={(value) => setAmount(Number(value) || 0)} type="number" />
        <div className="contact-grid">
          {favoriteAccounts.map((target) => (
            <button key={target.id} onClick={() => onPay(target.id, amount)}>
              <span>{target.displayName.slice(0, 1)}</span>
              <strong>{target.displayName}</strong>
              <small>{target.placetaId}</small>
            </button>
          ))}
        </div>
      </article>
      <article className="panel split-panel">
        <div><ShieldCheck size={23} /><strong>Límite semanal</strong><span>1.000 Pz por Placezum</span></div>
        <div><Lock size={23} /><strong>Biometría web</strong><span>Confirmación local del navegador</span></div>
      </article>
    </section>
  );
}

function MarketScreen({ state, account, onBuy }: { state: BankState; account: Account; onBuy: (marketId: string, amount: number) => void }) {
  const [amount, setAmount] = useState(120);
  const market = state.accounts.filter((item) => item.listedInvestmentFund || item.id.startsWith("biz-market-"));
  const holdings = state.investmentHoldings.filter((item) => item.accountId === account.id);
  return (
    <section className="screen-grid">
      <article className="hero-card market-hero">
        <span>Cartera Plazet</span>
        <strong>{formatMoneyPz(holdings.reduce((sum, item) => sum + item.currentValuePz, 0))} Pz</strong>
        <p>{holdings.length} posiciones · riesgo medio {marketRiskLabel(market)}</p>
      </article>
      <article className="panel">
        <SectionTitle icon={TrendingUp} title="Fondos GDLP" />
        <Field label="Importe Pz" value={String(amount)} onChange={(value) => setAmount(Number(value) || 0)} type="number" />
        <div className="fund-list">
          {market.map((fund) => (
            <button key={fund.id} onClick={() => onBuy(fund.id, amount)}>
              <div>
                <strong>{fund.displayName}</strong>
                <span>Riesgo {fund.investmentRiskLevel || 3}/7 · {formatPz(fund.balancePz)} Pz liquidez</span>
              </div>
              <TrendingUp size={20} />
            </button>
          ))}
        </div>
      </article>
      <article className="panel">
        <SectionTitle icon={Landmark} title="Mis posiciones" />
        {holdings.length ? holdings.map((holding) => (
          <div className="holding-row" key={holding.id}>
            <div><strong>{holding.assetName}</strong><span>{holding.units} participaciones</span></div>
            <b>{formatPz(holding.currentValuePz)} Pz</b>
          </div>
        )) : <Empty title="Sin cartera" text="Selecciona un fondo para iniciar una inversión." />}
      </article>
    </section>
  );
}

function HubScreen({ state, user }: { state: BankState; user: UserProfile }) {
  return (
    <section className="screen-grid">
      <article className="panel support-panel">
        <SectionTitle icon={Building2} title="Servicios" />
        <div className="service-grid">
          <div><Banknote size={24} /><strong>Nómina</strong><span>Alta laboral con retención trabajador/empresa.</span></div>
          <div><ShieldCheck size={24} /><strong>DIP</strong><span>{user.dip} · {user.placetaId}</span></div>
          <div><CreditCard size={24} /><strong>Tarjeta física</strong><span>Promocard y NFC se gestionan desde la app Android.</span></div>
          <div><Download size={24} /><strong>Documentos</strong><span>Extractos, recibos fiscales y certificados.</span></div>
        </div>
      </article>
      <article className="panel">
        <SectionTitle icon={Sparkles} title="Promos activas" />
        <div className="promo-list">
          {state.promoSlides.map((slide) => (
            <div key={slide.id}>
              <strong>{slide.title}</strong>
              <span>{slide.subtitle}</span>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}

function TributosScreen({ state }: { state: BankState }) {
  const tglp = state.accounts.find((item) => item.id === TGLP_ID);
  const iva = state.transactions.reduce((sum, item) => sum + (item.ivaPz || 0), 0);
  return (
    <section className="screen-grid">
      <article className="hero-card tributos-hero">
        <span>TGLP Tributos</span>
        <strong>{formatMoneyPz(tglp?.balancePz || 0)} Pz</strong>
        <p>IVA recaudado en historial: {formatPz(iva)} Pz</p>
      </article>
      <History transactions={state.transactions.filter((item) => item.toAccountId === TGLP_ID || item.fromAccountId === TGLP_ID).slice(0, 10)} accounts={state.accounts} />
      <article className="panel">
        <SectionTitle icon={Gavel} title="Alertas fiscales" />
        {state.complianceFlags.length ? state.complianceFlags.map((flag) => (
          <div className="holding-row" key={flag.id}>
            <div><strong>{flag.reason}</strong><span>{flag.accountId}</span></div>
            <b>{formatPz(flag.amountPz)} Pz</b>
          </div>
        )) : <Empty title="Sin alertas" text="No hay expedientes fiscales pendientes." />}
      </article>
    </section>
  );
}

function AdminScreen({ state, onPersist }: { state: BankState; onPersist: (state: BankState, message: string) => void }) {
  const [amount, setAmount] = useState(1000);
  const agldp = state.accounts.find((item) => item.id === AGLDP_ID);
  return (
    <section className="screen-grid">
      <article className="hero-card admin-hero">
        <span>AGLDP Administración</span>
        <strong>{formatMoneyPz(agldp?.balancePz || 0)} Pz</strong>
        <p>{state.users.length} usuarios · {state.accounts.length} cuentas</p>
      </article>
      <article className="panel">
        <SectionTitle icon={Landmark} title="Emisión monetaria" />
        <Field label="Importe Pz" value={String(amount)} onChange={(value) => setAmount(Number(value) || 0)} type="number" />
        <button className="primary-button" onClick={() => {
          const accounts = state.accounts.map((account) => account.id === AGLDP_ID ? { ...account, balancePz: account.balancePz + amount } : account);
          onPersist({ ...state, accounts, updatedAt: new Date().toISOString() }, "Emisión monetaria aplicada");
        }}>Emitir hacia AGLDP</button>
      </article>
      <article className="panel">
        <SectionTitle icon={WifiOff} title="Estado remoto" />
        <p className="muted">La app sincroniza con la API firmada de Banco Placeta. Si Vercel o Mongo no responden, los cambios quedan guardados localmente en este navegador.</p>
      </article>
    </section>
  );
}

function History({ transactions, accounts }: { transactions: LedgerTransaction[]; accounts: Account[] }) {
  return (
    <article className="panel history-panel">
      <SectionTitle icon={Banknote} title="Movimientos" />
      {transactions.length ? transactions.map((transaction) => {
        const from = accounts.find((item) => item.id === transaction.fromAccountId);
        const to = accounts.find((item) => item.id === transaction.toAccountId);
        return (
          <div className="transaction-row" key={transaction.id}>
            <div className={transaction.kind === "Rbu" || transaction.kind === "WelcomeBonus" ? "txn-icon income" : "txn-icon"}><Banknote size={18} /></div>
            <div>
              <strong>{transaction.note}</strong>
              <span>{from?.displayName || transaction.fromAccountId} → {to?.displayName || transaction.toAccountId}</span>
            </div>
            <b>{formatPz(transaction.amountPz)} Pz</b>
          </div>
        );
      }) : <Empty title="Sin movimientos" text="Las operaciones aparecerán aquí." />}
    </article>
  );
}

function Field({ label, value, onChange, type = "text", placeholder }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} type={type} placeholder={placeholder} />
    </label>
  );
}

function SectionTitle({ icon: Icon, title }: { icon: LucideIcon; title: string }) {
  return <h2 className="section-title"><Icon size={20} /> {title}</h2>;
}

function StatusPill({ sync }: { sync: "loading" | "online" | "offline" }) {
  return <span className={`status-pill ${sync}`}>{sync === "online" ? "Mongo conectado" : sync === "loading" ? "Sincronizando" : "Modo local"}</span>;
}

function Empty({ title, text }: { title: string; text: string }) {
  return <div className="empty"><strong>{title}</strong><span>{text}</span></div>;
}

function transactionsFor(accountId: string, transactions: LedgerTransaction[]) {
  return transactions.filter((item) => item.fromAccountId === accountId || item.toAccountId === accountId).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

function marketRiskLabel(accounts: Account[]) {
  const avg = accounts.reduce((sum, item) => sum + (item.investmentRiskLevel || 3), 0) / Math.max(1, accounts.length);
  if (avg < 3) return "bajo";
  if (avg < 5) return "medio";
  return "alto";
}
