"use client";

import {
  Banknote,
  Building2,
  CheckCircle2,
  CircleDollarSign,
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
  ScanLine,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  WalletCards,
  WifiOff
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Image from "next/image";
import type { CSSProperties } from "react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Account,
  AGLDP_ID,
  BankState,
  chargeWeeklyTax,
  claimRbu,
  demoSeed,
  DigitalCard,
  emitMoney,
  finalizeState,
  formatMoneyPz,
  formatPz,
  forceVatRegularization,
  addSavedContact,
  generatePlacezumCode,
  ibanGenerate,
  issueCard,
  issueOfficialFine,
  LedgerTransaction,
  investmentResultRows,
  normalizeState,
  payPlacezum,
  pendingInvestmentOperations,
  placezumWeekSpent,
  removeSavedContact,
  settleTimedInvestment,
  sha256,
  startTimedInvestment,
  TGLP_ID,
  toggleCard,
  transferByIban,
  updateTreasuryConfig,
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
      if (response.ok) {
        const fresh = await fetch("/api/bank-state", { cache: "no-store" });
        if (fresh.ok) {
          const remote = normalizeState(await fresh.json());
          setState(remote);
          localStorage.setItem("placeta-web-state", JSON.stringify(remote));
        }
      }
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
          onTransfer={(iban, amount, note) => runOperation(() => transferByIban(state, selectedAccount.id, iban, amount, note, "Consumption"), "Transferencia GDLP ejecutada")}
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
          limit={state.treasuryConfig.placezumWeeklyLimitPz}
          spent={placezumWeekSpent(state, selectedAccount.id)}
          contacts={state.savedContacts.filter((contact) => contact.ownerPlacetaId === activeUser.placetaId)}
          onAddContact={(accountId) => runOperation(() => addSavedContact(state, activeUser.placetaId, accountId), "Contacto guardado")}
          onRemoveContact={(accountId) => runOperation(() => removeSavedContact(state, activeUser.placetaId, accountId), "Contacto eliminado")}
          onPay={(targetId, amount) => {
            const target = accountsById.get(targetId);
            if (target) runOperation(() => payPlacezum(state, selectedAccount.id, target.iban, amount, `Placezum a ${target.displayName}`), "Pago Placezum confirmado");
          }}
        />
      )}

      {tab === "market" && (
        <MarketScreen
          state={state}
          account={selectedAccount}
          onStart={(marketId, amount) => runOperation(() => startTimedInvestment(state, selectedAccount.id, marketId, amount), "Inversión 60s iniciada")}
          onSettle={(operationId) => {
            try {
              const result = settleTimedInvestment(state, operationId);
              void persist(result.state, `${result.reveal.userWins ? "Resultado a favor" : "Resultado en contra"} · ${formatPz(result.reveal.amountPz)} Pz`);
            } catch (error) {
              setToast(error instanceof Error ? error.message : "Resultado no disponible");
            }
          }}
        />
      )}

      {tab === "hub" && <HubScreen state={state} user={activeUser} />}
      {tab === "tributos" && <TributosScreen state={state} onPersist={(next, message) => void persist(next, message)} />}
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
    const card: DigitalCard = {
      id: `card-${crypto.randomUUID()}`,
      accountId,
      alias: "Placeta Black",
      tier: "Standard",
      frozen: false,
      cardNumber: String(Math.floor(Math.random() * 1000000)).padStart(6, "0"),
      pin: "0000"
    };
    const accounts = state.accounts.map((item) => item.id === AGLDP_ID ? { ...item, balancePz: Math.max(0, item.balancePz - 500) } : item);
    onRegister(finalizeState({
      ...state,
      users: [...state.users, user].sort((left, right) => left.displayName.localeCompare(right.displayName)),
      accounts: [...accounts, account],
      transactions: [welcome, ...state.transactions],
      digitalCards: [...state.digitalCards, card]
    }), user);
  }

  return (
    <main className="login-shell">
      <Image className="login-bg" src={assetUrl(slide?.assetPath, slide?.imageKey)} alt="" fill priority />
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
              <Image className="card-art" src={card.promoPhysical ? "/assets/promocard.jpg" : "/assets/VIRTUALCARD.jpg"} alt="" fill sizes="(max-width: 760px) 100vw, 360px" />
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

function PlacezumScreen({ user, account, accounts, contacts, limit, spent, onPay, onAddContact, onRemoveContact }: { user: UserProfile; account: Account; accounts: Account[]; contacts: { accountId: string }[]; limit: number; spent: number; onPay: (targetId: string, amount: number) => void; onAddContact: (accountId: string) => void; onRemoveContact: (accountId: string) => void }) {
  const [amount, setAmount] = useState(12);
  const [contactQuery, setContactQuery] = useState("");
  const [tick, setTick] = useState(0);
  const codeWindow = Math.floor(tick / 120);
  const code = useMemo(() => generatePlacezumCode(account), [account, codeWindow]);
  const normalizedQuery = contactQuery.trim().toUpperCase();
  const resolvedContact = normalizedQuery
    ? accounts.find((candidate) =>
    candidate.id !== account.id &&
    (candidate.iban.toUpperCase() === normalizedQuery || candidate.placetaId?.toUpperCase() === normalizedQuery || candidate.displayName.toUpperCase().includes(normalizedQuery))
  )
    : undefined;
  const favoriteAccounts = contacts
    .map((contact) => accounts.find((item) => item.id === contact.accountId))
    .filter((item): item is Account => item !== undefined)
    .filter((item) => item.id !== account.id)
    .filter((item, index, all) => all.findIndex((candidate) => candidate.id === item.id) === index)
    .sort((left, right) => left.displayName.localeCompare(right.displayName));

  useEffect(() => {
    const timer = window.setInterval(() => setTick((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

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
        <SectionTitle icon={ScanLine} title="Contactos Placezum" />
        <Field label="Importe Pz" value={String(amount)} onChange={(value) => setAmount(Number(value) || 0)} type="number" />
        <div className="contact-add">
          <Field label="Añadir por IBAN, Placeta ID o nombre" value={contactQuery} onChange={setContactQuery} placeholder="GDLP-APXX-XXX" />
          <div className={`contact-resolver ${resolvedContact ? "resolved" : ""}`}>
            <div>
              <strong>{resolvedContact?.displayName || "Introduce un contacto de la app"}</strong>
              <span>{resolvedContact ? `${resolvedContact.iban} · código ${generatePlacezumCode(resolvedContact)}` : "Se resolverá nombre, IBAN y Placezum automáticamente"}</span>
            </div>
            <button className="mini-action" disabled={!resolvedContact} onClick={() => {
              if (!resolvedContact) return;
              onAddContact(resolvedContact.id);
              setContactQuery("");
            }}>Guardar</button>
          </div>
        </div>
        {favoriteAccounts.length ? (
          <div className="contact-list">
            {favoriteAccounts.map((target) => (
              <div key={target.id} className="contact-item">
                <button className="contact-pay" onClick={() => onPay(target.id, amount)}>
                  <span>{target.displayName.slice(0, 1).toUpperCase()}</span>
                  <strong>{target.displayName}</strong>
                  <small>{target.iban} · {generatePlacezumCode(target)}</small>
                </button>
                <button className="contact-remove" aria-label={`Eliminar ${target.displayName}`} onClick={() => onRemoveContact(target.id)}>Quitar</button>
              </div>
            ))}
          </div>
        ) : <Empty title="Sin contactos" text="Añade un IBAN real de la app para guardarlo aquí." />}
      </article>
      <article className="panel split-panel">
        <div><ShieldCheck size={23} /><strong>Límite semanal</strong><span>{formatPz(spent)} de {formatPz(limit)} Pz por Placezum</span></div>
        <div><Lock size={23} /><strong>Biometría web</strong><span>Confirmación local del navegador</span></div>
      </article>
    </section>
  );
}

function MarketScreen({ state, account, onStart, onSettle }: { state: BankState; account: Account; onStart: (marketId: string, amount: number) => void; onSettle: (operationId: string) => void }) {
  const [amount, setAmount] = useState(120);
  const [now, setNow] = useState(Date.now());
  const market = state.accounts
    .filter((item) => item.listedInvestmentFund || item.id.startsWith("biz-market-"))
    .sort((left, right) => (left.investmentRiskLevel || 3) - (right.investmentRiskLevel || 3));
  const isInvestmentAccount = account.type === "Investment";
  const pending = pendingInvestmentOperations(state, account.id);
  const results = investmentResultRows(state, account.id).slice(0, 6);
  const today = new Date().toISOString().slice(0, 10);
  const dailyInvestmentCount = state.transactions.filter((transaction) =>
    transaction.fromAccountId === account.id &&
    transaction.kind === "InvestmentBuy" &&
    transaction.createdAt.slice(0, 10) === today
  ).length;
  const totalNetResult = results.reduce((sum, row) => sum + row.netResultPz, 0);
  const remainingToday = Math.max(0, state.treasuryConfig.dailyInvestmentLimit - dailyInvestmentCount);
  const pendingCapital = pending.reduce((sum, operation) => sum + operation.amountPz, 0);
  const maxAmount = state.treasuryConfig.maxInvestmentAmountPz;
  const safeAmount = Math.min(Math.max(0, amount), maxAmount);
  const quickAmounts = [100, 250, 500, maxAmount].filter((value, index, all) => value <= maxAmount && all.indexOf(value) === index);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="screen-grid market-grid">
      <article className="hero-card market-hero">
        <span>Mercado GDLP · Cartera Plazet</span>
        <strong>{formatMoneyPz(account.balancePz)} Pz</strong>
        <p>{pending.length} abiertas · {remainingToday} disponibles hoy · resultado reciente {totalNetResult >= 0 ? "+" : ""}{formatPz(totalNetResult)} Pz</p>
      </article>
      <div className="metric-grid market-metrics">
        <MetricCard label="Disponible" value={`${formatPz(account.balancePz)} Pz`} tone="purple" />
        <MetricCard label="Pendiente 60s" value={`${formatPz(pendingCapital)} Pz`} tone="gold" />
        <MetricCard label="Cupos hoy" value={`${remainingToday}/${state.treasuryConfig.dailyInvestmentLimit}`} tone="green" />
        <MetricCard label="Resultado" value={`${totalNetResult >= 0 ? "+" : ""}${formatPz(totalNetResult)} Pz`} tone={totalNetResult >= 0 ? "green" : "red"} />
      </div>
      {!isInvestmentAccount && (
        <article className="panel market-alert">
          <SectionTitle icon={ShieldCheck} title="Cuenta de inversión" />
          <p className="muted">Selecciona la cuenta “Cartera Plazet” para operar. Este mercado usa el sistema Android de inversión 60s.</p>
        </article>
      )}
      <article className="panel market-ticket">
        <SectionTitle icon={CircleDollarSign} title="Ticket de inversión" />
        <Field label={`Importe Pz · máximo ${formatPz(maxAmount)}`} value={String(amount)} onChange={(value) => setAmount(Number(value) || 0)} type="number" />
        <div className="amount-chips">
          {quickAmounts.map((value) => (
            <button key={value} className={safeAmount === value ? "active" : ""} onClick={() => setAmount(value)}>
              {value === maxAmount ? "Máx" : formatPz(value)}
            </button>
          ))}
        </div>
        <div className="investment-rules">
          <div><strong>{formatPz(safeAmount)} Pz</strong><span>importe preparado</span></div>
          <div><strong>{remainingToday}</strong><span>operaciones restantes</span></div>
        </div>
        <p className="muted">Cada orden queda vinculada a su cuenta origen e IBAN. El backend valida saldo, origen y liquidación para evitar duplicados entre sesiones.</p>
      </article>
      <article className="panel market-funds-panel">
        <SectionTitle icon={TrendingUp} title="Fondos GDLP" />
        <div className="fund-list">
          {market.map((fund) => {
            const risk = fund.investmentRiskLevel || 3;
            return (
              <button key={fund.id} className="fund-card" disabled={!isInvestmentAccount || remainingToday <= 0 || safeAmount <= 0} onClick={() => onStart(fund.id, safeAmount)}>
                <div>
                  <strong>{fund.displayName}</strong>
                  <span>Liquidez {formatPz(fund.balancePz)} Pz · riesgo {risk}/7</span>
                  <i style={{ "--risk": `${Math.round((risk / 7) * 100)}%` } as CSSProperties & Record<"--risk", string>} />
                </div>
                <b>{isInvestmentAccount ? "Invertir" : "Bloqueado"}</b>
              </button>
            );
          })}
        </div>
      </article>
      <article className="panel market-ops">
        <SectionTitle icon={Landmark} title="Operaciones 60s" />
        {pending.length ? pending.map((operation) => {
          const secondsLeft = Math.max(0, Math.ceil((Date.parse(operation.readyAt) - now) / 1000));
          return (
            <div className="investment-row pending" key={operation.id}>
              <div>
                <strong>{operation.assetName}</strong>
                <span>{formatPz(operation.amountPz)} Pz · {operation.createdAt.slice(11, 16)} · {secondsLeft > 0 ? `faltan ${secondsLeft}s` : "resultado listo"}</span>
              </div>
              <button className="mini-action" disabled={secondsLeft > 0} onClick={() => onSettle(operation.id)}>
                {secondsLeft > 0 ? `${secondsLeft}s` : "Resultado"}
              </button>
            </div>
          );
        }) : <Empty title="Sin inversiones abiertas" text="Inicia una inversión y vuelve cuando pasen 60 segundos." />}
      </article>
      <article className="panel history-panel market-results">
        <SectionTitle icon={Sparkles} title="Análisis reciente" />
        {results.length ? results.map((row) => (
          <div className={`investment-row ${row.netResultPz >= 0 ? "win" : "loss"}`} key={row.id}>
            <div>
              <strong>{row.assetName}</strong>
              <span>{formatPz(row.principalPz)} → {formatPz(row.returnedPz)} Pz · {row.won ? "+" : "-"}{row.movementPercent}%</span>
            </div>
            <b>{row.netResultPz >= 0 ? "+" : ""}{formatPz(row.netResultPz)} Pz</b>
          </div>
        )) : <Empty title="Sin resultados cerrados" text="Los resultados aparecerán al liquidar operaciones 60s." />}
      </article>
    </section>
  );
}

function HubScreen({ state, user }: { state: BankState; user: UserProfile }) {
  const userAccounts = state.accounts.filter((account) => account.placetaId === user.placetaId || account.id === user.primaryAccountId);
  const totalBalance = userAccounts.reduce((sum, account) => sum + account.balancePz, 0);
  const cards = state.digitalCards.filter((card) => userAccounts.some((account) => account.id === card.accountId));
  const recent = state.transactions
    .filter((transaction) => userAccounts.some((account) => account.id === transaction.fromAccountId || account.id === transaction.toAccountId))
    .slice(0, 5);
  const pendingInvestments = pendingInvestmentOperations(state).filter((operation) => userAccounts.some((account) => account.id === operation.accountId));
  const documents = [
    { title: "Extracto mensual", detail: `${recent.length} movimientos recientes`, icon: Download },
    { title: "Certificado DIP", detail: `${user.dip} · identidad activa`, icon: ShieldCheck },
    { title: "Recibos fiscales", detail: `${state.transactions.filter((item) => item.toAccountId === TGLP_ID).length} apuntes tributarios`, icon: Gavel }
  ];
  return (
    <section className="screen-grid hub-grid">
      <article className="hero-card hub-hero">
        <span>Hub ciudadano · {user.dip}</span>
        <strong>{formatMoneyPz(totalBalance)} Pz</strong>
        <p>{userAccounts.length} cuentas · {cards.length} tarjetas · {pendingInvestments.length} inversiones 60s abiertas</p>
      </article>

      <div className="metric-grid">
        <MetricCard label="Saldo total" value={`${formatPz(totalBalance)} Pz`} tone="purple" />
        <MetricCard label="Cuentas" value={String(userAccounts.length)} tone="green" />
        <MetricCard label="Tarjetas" value={String(cards.length)} tone="gold" />
        <MetricCard label="60s abiertas" value={String(pendingInvestments.length)} tone="red" />
      </div>

      <article className="panel hub-panel">
        <SectionTitle icon={Building2} title="Centro de servicios" />
        <div className="hub-service-grid">
          <div><Banknote size={24} /><strong>Nómina GDLP</strong><span>Alta laboral con retención trabajador/empresa y trazabilidad fiscal.</span></div>
          <div><ShieldCheck size={24} /><strong>DIP verificado</strong><span>{user.dip} · {user.placetaId}</span></div>
          <div><CreditCard size={24} /><strong>Tarjetas</strong><span>{cards.filter((card) => !card.frozen).length} activas · Promo Card y virtual.</span></div>
          <div><TrendingUp size={24} /><strong>Mercado 60s</strong><span>{pendingInvestments.length ? "Resultados pendientes disponibles pronto." : "Sin operaciones abiertas."}</span></div>
        </div>
      </article>

      <article className="panel hub-panel">
        <SectionTitle icon={Landmark} title="Cuentas vinculadas" />
        {userAccounts.map((account) => (
          <div className="account-row" key={account.id}>
            <div>
              <strong>{account.displayName}</strong>
              <span>{account.type} · {account.iban}</span>
            </div>
            <b>{formatPz(account.balancePz)} Pz</b>
          </div>
        ))}
      </article>

      <article className="panel hub-panel">
        <SectionTitle icon={Download} title="Documentos" />
        <div className="document-grid">
          {documents.map((doc) => {
            const Icon = doc.icon;
            return (
              <button key={doc.title}>
                <Icon size={22} />
                <span><strong>{doc.title}</strong><small>{doc.detail}</small></span>
              </button>
            );
          })}
        </div>
      </article>

      <article className="panel hub-panel">
        <SectionTitle icon={Sparkles} title="Promos activas" />
        <div className="promo-list">
          {state.promoSlides.map((slide) => (
            <div key={slide.id}>
              <Image src={assetUrl(slide.assetPath, slide.imageKey)} alt="" width={58} height={58} />
              <span>
                <strong>{slide.title}</strong>
                <small>{slide.subtitle}</small>
              </span>
            </div>
          ))}
        </div>
      </article>

      <article className="panel hub-panel">
        <SectionTitle icon={MoreHorizontal} title="Soporte y actividad" />
        <div className="support-thread">
          <div><strong>Canal soporte</strong><span>Prioridad normal · respuesta operativa GDLP.</span></div>
          <div><strong>Estado cuenta</strong><span>{state.complianceFlags.some((flag) => userAccounts.some((account) => account.id === flag.accountId)) ? "Revisión fiscal pendiente" : "Sin incidencias activas"}</span></div>
        </div>
        <div className="mini-feed">
          {recent.length ? recent.map((transaction) => (
            <div key={transaction.id}>
              <span>{transaction.kind}</span>
              <strong>{formatPz(transaction.amountPz)} Pz</strong>
            </div>
          )) : <Empty title="Sin actividad" text="Tus movimientos aparecerán aquí." />}
        </div>
      </article>
    </section>
  );
}

function TributosScreen({ state, onPersist }: { state: BankState; onPersist: (state: BankState, message: string) => void }) {
  const tglp = state.accounts.find((item) => item.id === TGLP_ID);
  const citizenAccounts = state.accounts.filter((account) => account.kind === "CITIZEN").sort((a, b) => b.balancePz - a.balancePz);
  const [targetId, setTargetId] = useState(citizenAccounts[0]?.id || "");
  const [fineAmount, setFineAmount] = useState(50);
  const [vatBase, setVatBase] = useState(100);
  const target = state.accounts.find((account) => account.id === targetId) || citizenAccounts[0];
  const iva = state.transactions.reduce((sum, item) => sum + (item.ivaPz || 0), 0);
  const todayTax = state.transactions.filter((item) => item.toAccountId === TGLP_ID && item.createdAt.slice(0, 10) === new Date().toISOString().slice(0, 10)).reduce((sum, item) => sum + item.amountPz + item.ivaPz, 0);
  const pendingExternal = state.transactions.filter((item) => item.kind === "ExternalBlocked" && item.status === "Pending").length;
  const fiscalTx = state.transactions.filter((item) => item.toAccountId === TGLP_ID || item.fromAccountId === TGLP_ID).slice(0, 10);
  return (
    <section className="screen-grid admin-grid purple-suite">
      <article className="hero-card tributos-hero admin-command">
        <span>TGLP · Centro fiscal</span>
        <strong>{formatMoneyPz(tglp?.balancePz || 0)} Pz</strong>
        <p>IVA acumulado {formatPz(iva)} Pz · {state.complianceFlags.length} alertas · {pendingExternal} externas pendientes</p>
      </article>

      <div className="metric-grid">
        <MetricCard label="Recaudado hoy" value={`${formatPz(todayTax)} Pz`} tone="purple" />
        <MetricCard label="IVA histórico" value={`${formatPz(iva)} Pz`} tone="gold" />
        <MetricCard label="Expedientes" value={String(state.complianceFlags.length)} tone="red" />
        <MetricCard label="Cuentas auditables" value={String(citizenAccounts.length)} tone="green" />
      </div>

      <article className="panel admin-panel">
        <SectionTitle icon={Gavel} title="Acciones fiscales" />
        <label className="field">
          <span>Cuenta objetivo</span>
          <select value={target?.id || ""} onChange={(event) => setTargetId(event.target.value)}>
            {citizenAccounts.map((account) => (
              <option key={account.id} value={account.id}>{account.displayName} · {formatPz(account.balancePz)} Pz</option>
            ))}
          </select>
        </label>
        <div className="two-cols">
          <Field label="Multa Pz" value={String(fineAmount)} onChange={(value) => setFineAmount(Number(value) || 0)} type="number" />
          <Field label="Base IVA Pz" value={String(vatBase)} onChange={(value) => setVatBase(Number(value) || 0)} type="number" />
        </div>
        <div className="action-grid">
          <button className="primary-button" disabled={!target} onClick={() => target && onPersist(chargeWeeklyTax(state, target.id), "Impuesto semanal cargado")}>Cobrar semanal</button>
          <button className="secondary-button" disabled={!target} onClick={() => target && onPersist(issueOfficialFine(state, target.id, fineAmount), "Multa oficial emitida")}>Emitir multa</button>
          <button className="secondary-button" disabled={!target} onClick={() => target && onPersist(forceVatRegularization(state, target.id, vatBase), "IVA regularizado")}>Regularizar IVA</button>
        </div>
      </article>

      <article className="panel admin-panel">
        <SectionTitle icon={Gavel} title="Alertas fiscales" />
        {state.complianceFlags.length ? state.complianceFlags.map((flag) => (
          <div className="holding-row" key={flag.id}>
            <div><strong>{flag.reason}</strong><span>{flag.accountId}</span></div>
            <b>{formatPz(flag.amountPz)} Pz</b>
          </div>
        )) : <Empty title="Sin alertas" text="No hay expedientes fiscales pendientes." />}
      </article>

      <article className="panel admin-panel">
        <SectionTitle icon={TrendingUp} title="Ranking de balances" />
        {citizenAccounts.slice(0, 8).map((account, index) => (
          <div className="holding-row" key={account.id}>
            <div><strong>#{index + 1} · {account.displayName}</strong><span>{account.iban} · {account.type}</span></div>
            <b>{formatPz(account.balancePz)} Pz</b>
          </div>
        ))}
      </article>

      <History transactions={fiscalTx} accounts={state.accounts} />
    </section>
  );
}

function AdminScreen({ state, onPersist }: { state: BankState; onPersist: (state: BankState, message: string) => void }) {
  const [amount, setAmount] = useState(1000);
  const [weeklyTax, setWeeklyTax] = useState(state.treasuryConfig.weeklyTaxPercent);
  const [opTax, setOpTax] = useState(state.treasuryConfig.operationalTransferTaxPercent);
  const [placezumLimit, setPlacezumLimit] = useState(state.treasuryConfig.placezumWeeklyLimitPz);
  const [investmentMax, setInvestmentMax] = useState(state.treasuryConfig.maxInvestmentAmountPz);
  const [dailyInvestmentLimit, setDailyInvestmentLimit] = useState(state.treasuryConfig.dailyInvestmentLimit);
  const agldp = state.accounts.find((item) => item.id === AGLDP_ID);
  const totalMoney = state.accounts.reduce((sum, account) => sum + Math.max(0, account.balancePz), 0);
  const businessCount = state.accounts.filter((account) => account.type === "Business").length;
  const pendingRequests = state.subsidyRequests.filter((request) => request.status === "Pending").length;
  return (
    <section className="screen-grid admin-grid purple-suite">
      <article className="hero-card admin-hero admin-command">
        <span>AGLDP · Panel soberano</span>
        <strong>{formatMoneyPz(agldp?.balancePz || 0)} Pz</strong>
        <p>{state.users.length} usuarios · {state.accounts.length} cuentas · masa {formatPz(totalMoney)} Pz</p>
      </article>

      <div className="metric-grid">
        <MetricCard label="Masa monetaria" value={`${formatPz(totalMoney)} Pz`} tone="purple" />
        <MetricCard label="Empresas" value={String(businessCount)} tone="green" />
        <MetricCard label="Promos" value={String(state.promoSlides.length)} tone="gold" />
        <MetricCard label="Solicitudes" value={String(pendingRequests)} tone="red" />
      </div>

      <article className="panel admin-panel">
        <SectionTitle icon={Landmark} title="Emisión monetaria" />
        <Field label="Importe Pz" value={String(amount)} onChange={(value) => setAmount(Number(value) || 0)} type="number" />
        <button className="primary-button" onClick={() => onPersist(emitMoney(state, amount), "Emisión monetaria aplicada")}>Emitir hacia AGLDP</button>
      </article>

      <article className="panel admin-panel">
        <SectionTitle icon={ShieldCheck} title="Configuración normativa" />
        <div className="config-grid">
          <Field label="Impuesto semanal %" value={String(weeklyTax)} onChange={(value) => setWeeklyTax(Number(value) || 0)} type="number" />
          <Field label="Tasa operativa %" value={String(opTax)} onChange={(value) => setOpTax(Number(value) || 0)} type="number" />
          <Field label="Placezum semanal" value={String(placezumLimit)} onChange={(value) => setPlacezumLimit(Number(value) || 0)} type="number" />
          <Field label="Máx inversión" value={String(investmentMax)} onChange={(value) => setInvestmentMax(Number(value) || 0)} type="number" />
          <Field label="Inversiones/día" value={String(dailyInvestmentLimit)} onChange={(value) => setDailyInvestmentLimit(Number(value) || 0)} type="number" />
        </div>
        <button className="primary-button" onClick={() => onPersist(updateTreasuryConfig(state, {
          weeklyTaxPercent: weeklyTax,
          operationalTransferTaxPercent: opTax,
          placezumWeeklyLimitPz: placezumLimit,
          maxInvestmentAmountPz: investmentMax,
          dailyInvestmentLimit
        }), "Configuración normativa guardada")}>Guardar configuración</button>
      </article>

      <article className="panel admin-panel">
        <SectionTitle icon={WifiOff} title="Operación remota" />
        <div className="ops-list">
          <div><strong>API firmada</strong><span>Proxy server-side `/api/bank-state` con HMAC compatible con Android.</span></div>
          <div><strong>Estado local</strong><span>Fallback en navegador si Mongo/Vercel no responde.</span></div>
          <div><strong>Auditoría</strong><span>{state.complianceFlags.length} flags activos · {state.transactions.length} movimientos.</span></div>
        </div>
      </article>

      <article className="panel admin-panel history-panel">
        <SectionTitle icon={Building2} title="Usuarios y cuentas" />
        {state.users.map((user) => {
          const account = state.accounts.find((item) => item.id === user.primaryAccountId);
          return (
            <div className="holding-row" key={user.dip}>
              <div><strong>{user.displayName}</strong><span>{user.dip} · {user.placetaId}</span></div>
              <b>{formatPz(account?.balancePz || 0)} Pz</b>
            </div>
          );
        })}
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

function MetricCard({ label, value, tone }: { label: string; value: string; tone: "purple" | "green" | "gold" | "red" }) {
  return (
    <div className={`metric-card ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
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

function assetUrl(path?: string | null, imageKey = "bank") {
  if (path?.startsWith("http") || path?.startsWith("/")) return path;
  if (path?.startsWith("promos/")) return `/assets/${path}`;
  if (path) return `/assets/${path}`;
  if (imageKey === "placezum") return "/assets/promos/placezum-default.png";
  if (imageKey === "market") return "/assets/promos/mercado-default.png";
  return "/assets/promos/banco-default.png";
}
