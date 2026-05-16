"use client";

import {
  Banknote,
  Bell,
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
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Account,
  accountTypeLabel,
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
  SupportTicket,
  TGLP_ID,
  toggleCard,
  transferByIban,
  transferPayrollOrLoan,
  updateTreasuryConfig,
  UserProfile
} from "../lib/bank";
import { generateBankPdf } from "../lib/pdf";
import type { WebDocumentKind } from "../lib/pdf";

type Tab = "home" | "placezum" | "market" | "hub" | "tributos" | "admin";

const tabs: Array<{ id: Tab; label: string; icon: LucideIcon }> = [
  { id: "home", label: "Inicio", icon: Home },
  { id: "placezum", label: "Placezum", icon: QrCode },
  { id: "market", label: "Mercado", icon: TrendingUp },
  { id: "hub", label: "Hub", icon: MoreHorizontal },
  { id: "tributos", label: "TGLP", icon: Gavel },
  { id: "admin", label: "Admin", icon: Landmark }
];

const landingSlides = [
  {
    title: "Banco de La Placeta",
    kicker: "Banca digital",
    subtitle: "Gestiona pagos, tarjetas, cuentas y documentos desde una plataforma clara para móvil y escritorio.",
    image: "/assets/promos/promo1.png",
    action: "Abrir cuenta",
    metric: "Cuentas, pagos y tarjetas"
  },
  {
    title: "Operativa con contexto",
    kicker: "Pagos y actividad",
    subtitle: "Consulta saldos, movimientos, límites y operaciones recientes con una experiencia pensada para entender qué ocurre.",
    image: "/assets/promos/promo2.png",
    action: "Ver demo",
    metric: "Actividad trazable"
  },
  {
    title: "Gestión institucional",
    kicker: "Empresas y administración",
    subtitle: "Herramientas para nóminas, soporte, documentos y revisión administrativa sin ruido visual ni promesas exageradas.",
    image: "/assets/promos/mercado-default.png",
    action: "Conocer funciones",
    metric: "Empresa, tributos y soporte"
  }
];

const landingFeatures = [
  { title: "Pagos digitales", text: "Placezum, IBAN y transferencias con límites visibles antes de confirmar.", icon: QrCode },
  { title: "Tarjetas y cuentas", text: "Tarjeta digital, cuentas personales y empresa con estado claro en cada operación.", icon: CreditCard },
  { title: "Administración", text: "Nóminas, documentos, soporte y tributos en paneles separados para trabajar mejor.", icon: Landmark }
];

const landingTrust = [
  { title: "Operaciones verificables", text: "Cada movimiento conserva origen, destino, concepto y estado para evitar confusiones entre sesiones.", icon: ShieldCheck },
  { title: "Diseño financiero claro", text: "Sin promesas exageradas: la landing explica pagos, cuentas, tarjetas, soporte y administración.", icon: Landmark },
  { title: "Experiencia unificada", text: "La web acompaña a Android con la misma lógica de cuenta, documentos y color de marca.", icon: Sparkles }
];

const landingStats = [
  { label: "Servicios", value: "6", detail: "cuentas, pagos, tarjetas, documentos, hub y soporte" },
  { label: "Identidad", value: "DIP", detail: "acceso único sincronizado con la app Android" },
  { label: "Atención", value: "Tickets", detail: "incidencias con contexto de cuenta y operación" }
];

const landingWorkflow = [
  { title: "Accede con tu DIP", text: "Entras con el mismo identificador usado en la app Android." },
  { title: "Elige el módulo", text: "Las acciones se abren en paneles y popups para no llenar cada pantalla." },
  { title: "Confirma la operación", text: "Importe, origen, destino y límites aparecen antes de guardar cambios." },
  { title: "Consulta el historial", text: "Movimientos, PDFs, soporte y administración quedan separados por contexto." }
];

const landingFaq = [
  { question: "¿Qué puedo hacer desde Banco de La Placeta web?", answer: "Consultar cuentas, enviar pagos, gestionar tarjetas, revisar actividad, abrir tickets y usar herramientas administrativas si tu perfil lo permite." },
  { question: "¿La web sustituye a la app Android?", answer: "No. La complementa: mantiene la misma lógica de cuenta y añade una experiencia más cómoda para escritorio." },
  { question: "¿Dónde veo soporte o incidencias?", answer: "Dentro del Hub puedes abrir tickets con contexto de cuentas, tarjetas, inversiones o movimientos." }
];

const commercialServices = [
  { title: "Cuenta digital", text: "Saldo, IBAN, actividad y documentos en una vista clara para operar con menos pasos.", icon: WalletCards },
  { title: "Pagos Placezum", text: "Pagos rápidos, contactos guardados y límites visibles antes de confirmar.", icon: QrCode },
  { title: "Tarjetas", text: "Tarjeta virtual y Promo Card con control de estado y acciones separadas.", icon: CreditCard },
  { title: "Empresa", text: "Nóminas, alta, actividad asociada y soporte operativo para cuentas empresariales.", icon: Building2 },
  { title: "Documentos", text: "Extractos, certificados y recibos descargables desde el Hub.", icon: Download },
  { title: "Soporte", text: "Tickets con asunto, mensaje y contexto para acelerar la revisión.", icon: ShieldCheck }
];

const customerSegments = [
  { title: "Particulares", text: "Pagos, tarjetas, extractos y actividad diaria con una navegación sencilla.", icon: Home },
  { title: "Empresas", text: "Nóminas, rentabilidad, movimientos y documentos agrupados por cuenta.", icon: Building2 },
  { title: "Administración", text: "Paneles para revisión fiscal, normativa y operación interna cuando el rol lo permite.", icon: Landmark }
];

const channelCards = [
  { title: "Web escritorio", text: "Diseñada para revisar, comparar, descargar y gestionar operaciones con más espacio.", icon: MoreHorizontal },
  { title: "App Android", text: "Mantiene la operativa móvil diaria con la misma identidad y lógica de cuenta.", icon: WalletCards },
  { title: "Notificaciones", text: "Avisos opcionales en PC para movimientos, soporte y operaciones relevantes.", icon: Bell }
];

const footerColumns = [
  { title: "Banco", links: ["Cuentas", "Pagos", "Tarjetas", "Documentos"] },
  { title: "Ayuda", links: ["Soporte", "FAQ", "Seguridad", "Contacto"] },
  { title: "Legal", links: ["Privacidad", "Términos", "Accesibilidad", "Cookies"] }
];

const landingPages = [
  { id: "cuentas", title: "Cuentas", icon: WalletCards, text: "Consulta saldo, IBAN, actividad reciente y accesos de cuenta sin mezclar formularios en la pantalla principal.", bullets: ["Saldo y movimientos", "Transferencias por popup", "Documentos y extractos"] },
  { id: "placezum", title: "Placezum", icon: QrCode, text: "Pagos rápidos con código temporal, contactos guardados y límites visibles antes de enviar.", bullets: ["Código temporal", "Contactos", "Límite semanal"] },
  { id: "tarjetas", title: "Tarjetas", icon: CreditCard, text: "Gestiona tarjetas digitales y Promo Card con estado claro y acciones separadas.", bullets: ["Emitir tarjeta", "Congelar o activar", "PIN y numeración"] },
  { id: "empresas", title: "Empresas", icon: Building2, text: "Panel para nóminas, alta de empresa, actividad y rentabilidad cuando la cuenta lo permite.", bullets: ["Nóminas", "Alta empresa", "Actividad asociada"] },
  { id: "soporte", title: "Soporte", icon: ShieldCheck, text: "Tickets con contexto de cuenta, tarjeta, inversión o movimiento para explicar mejor cada incidencia.", bullets: ["Adjuntos", "Estado del ticket", "Historial"] },
  { id: "seguridad", title: "Seguridad", icon: Lock, text: "Interfaz clara, permisos explícitos y validaciones de operación para reducir errores entre sesiones.", bullets: ["Notificaciones opcionales", "Validación de origen", "Modo sin conexión"] }
];

const helpPosts = [
  { title: "Cómo enviar un pago sin errores", tag: "Pagos", text: "Revisa IBAN, importe y concepto antes de confirmar. La web separa el formulario en popup para evitar acciones accidentales." },
  { title: "Qué cuenta usar para inversiones", tag: "Inversiones", text: "Solo la cuenta de inversión permite operar. Las cuentas empresa muestran alta, capital recibido y rentabilidad asociada." },
  { title: "Cómo abrir un ticket útil", tag: "Soporte", text: "Incluye cuenta, tarjeta o movimiento relacionado para que la revisión sea más rápida y clara." }
];

const landingArticles = [
  {
    title: "Placezum para pagos rápidos",
    text: "Contactos guardados, IBAN oficial y límites semanales visibles antes de enviar.",
    image: "/assets/promos/placezum-default.png",
    icon: QrCode
  },
  {
    title: "Tarjetas con assets originales",
    text: "Promo Card y tarjeta virtual mantienen la identidad visual de Banco de La Placeta.",
    image: "/assets/promocard.jpg",
    icon: CreditCard
  },
  {
    title: "Hub ciudadano completo",
    text: "Cuentas, documentos, administración y soporte organizados en módulos separados.",
    image: "/assets/logobanco.jpg",
    icon: MoreHorizontal
  }
];

export default function BancoPlacetaWeb() {
  const [state, setState] = useState<BankState>(() => normalizeState(null));
  const [activeUser, setActiveUser] = useState<UserProfile | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState("u-alba");
  const [tab, setTab] = useState<Tab>("home");
  const [sync, setSync] = useState<"loading" | "online" | "offline">("loading");
  const [hydrated, setHydrated] = useState(false);
  const [toast, setToast] = useState("");
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | "unsupported">("default");
  const [notificationNow, setNotificationNow] = useState(0);
  const stateRef = useRef<BankState>(state);
  const persistInFlightRef = useRef(false);
  const operationInFlightRef = useRef(false);
  const remoteRefreshInFlightRef = useRef(false);
  const notificationSeenRef = useRef<Set<string>>(new Set());
  const notificationsReadyRef = useRef(false);
  const notificationUserRef = useRef("");

  useEffect(() => {
    const cached = localStorage.getItem("placeta-web-state");
    const savedDip = localStorage.getItem("placeta-web-dip");
    let cachedState: BankState | null = null;
    if (cached) {
      cachedState = normalizeState(JSON.parse(cached));
      setState(cachedState);
      setHydrated(true);
    }
    fetch("/api/bank-state", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Servicio no disponible");
        const remote = normalizeState(await response.json());
        setState(remote);
        setHydrated(true);
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
        setHydrated(true);
        if (savedDip) {
          const user = (cachedState || normalizeState(demoSeed())).users.find((item) => item.dip === savedDip) || null;
          setActiveUser(user);
          if (user) setSelectedAccountId(user.primaryAccountId);
        }
      });
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem("placeta-web-state", JSON.stringify(normalizeState(state)));
  }, [hydrated, state]);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) {
      setNotificationPermission("unsupported");
      return;
    }
    setNotificationPermission(Notification.permission);
    const stored = localStorage.getItem("placeta-web-notification-seen");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) notificationSeenRef.current = new Set(parsed.filter((item) => typeof item === "string"));
      } catch {
        notificationSeenRef.current = new Set();
      }
    }
    setNotificationNow(Date.now());
    const timer = window.setInterval(() => setNotificationNow(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  const accountsById = useMemo(() => new Map(state.accounts.map((account) => [account.id, account])), [state.accounts]);
  const userAccounts = useMemo(() => {
    if (!activeUser) return [];
    return state.accounts.filter((account) => account.placetaId === activeUser.placetaId || account.id === activeUser.primaryAccountId);
  }, [activeUser, state.accounts]);
  const selectedAccount = accountsById.get(selectedAccountId) || userAccounts[0] || state.accounts.find((item) => item.id === "u-alba")!;
  const visibleTabs = activeUser?.dip === "DIP-A001" ? tabs : tabs.filter((item) => !["tributos", "admin"].includes(item.id));

  const saveSeenNotifications = useCallback(() => {
    if (typeof window === "undefined") return;
    const compact = Array.from(notificationSeenRef.current).slice(-600);
    notificationSeenRef.current = new Set(compact);
    localStorage.setItem("placeta-web-notification-seen", JSON.stringify(compact));
  }, []);

  const notifyDesktop = useCallback((title: string, body: string, tag: string, force = false) => {
    setToast(body);
    if (typeof window === "undefined" || !("Notification" in window) || Notification.permission !== "granted") return;
    if (!force && document.visibilityState === "visible") return;
    new Notification(title, {
      body,
      icon: "/assets/icon2.png",
      badge: "/assets/icon2.png",
      tag
    });
  }, []);

  const silentRemoteRefresh = useCallback(async () => {
    if (persistInFlightRef.current || remoteRefreshInFlightRef.current) return;
    remoteRefreshInFlightRef.current = true;
    try {
      const response = await fetch("/api/bank-state", { cache: "no-store" });
      if (!response.ok) throw new Error("Servicio no disponible");
      const remote = normalizeState(await response.json());
      const current = stateRef.current;
      const remoteTime = Date.parse(remote.updatedAt || "");
      const currentTime = Date.parse(current.updatedAt || "");
      const remoteIsNewer = Number.isFinite(remoteTime) && Number.isFinite(currentTime) ? remoteTime >= currentTime : true;
      const remoteHasMoreLedger = remote.transactions.length > current.transactions.length;
      if (remoteIsNewer || remoteHasMoreLedger) {
        setState(remote);
        localStorage.setItem("placeta-web-state", JSON.stringify(remote));
      }
      setSync("online");
    } catch {
      setSync("offline");
    } finally {
      remoteRefreshInFlightRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const timer = window.setInterval(() => {
      void silentRemoteRefresh();
    }, 5000);
    return () => window.clearInterval(timer);
  }, [hydrated, silentRemoteRefresh]);

  useEffect(() => {
    if (!activeUser || !hydrated) return;
    const accountIds = new Set(userAccounts.map((account) => account.id));
    if (!accountIds.size) return;

    const readyNow = notificationNow || Date.now();
    const transactions = state.transactions.filter((transaction) => accountIds.has(transaction.fromAccountId) || accountIds.has(transaction.toAccountId));
    const readyInvestments = pendingInvestmentOperations(state).filter((operation) => accountIds.has(operation.accountId) && readyNow >= Date.parse(operation.readyAt));
    const tickets = (state.supportTickets || []).filter((ticket) => ticket.ownerDip === activeUser.dip);
    const currentIds = [
      ...transactions.map((transaction) => `txn:${transaction.id}`),
      ...readyInvestments.map((operation) => `investment-ready:${operation.id}`),
      ...tickets.map((ticket) => `ticket:${ticket.id}:${ticket.updatedAt}`)
    ];

    if (!notificationsReadyRef.current || notificationUserRef.current !== activeUser.dip) {
      notificationUserRef.current = activeUser.dip;
      notificationSeenRef.current = new Set([...notificationSeenRef.current, ...currentIds]);
      saveSeenNotifications();
      notificationsReadyRef.current = true;
      return;
    }

    const pendingAlerts: Array<{ id: string; title: string; body: string }> = [];
    for (const transaction of transactions) {
      const id = `txn:${transaction.id}`;
      if (notificationSeenRef.current.has(id)) continue;
      const incoming = accountIds.has(transaction.toAccountId);
      pendingAlerts.push({
        id,
        title: incoming ? "Ingreso recibido" : "Movimiento enviado",
        body: `${transaction.kind} · ${formatPz(transaction.amountPz)} Pz`
      });
    }
    for (const operation of readyInvestments) {
      const id = `investment-ready:${operation.id}`;
      if (notificationSeenRef.current.has(id)) continue;
      pendingAlerts.push({
        id,
        title: "Inversión lista",
        body: `${operation.assetName} · ${formatPz(operation.amountPz)} Pz pendiente de liquidar`
      });
    }
    for (const ticket of tickets) {
      const id = `ticket:${ticket.id}:${ticket.updatedAt}`;
      if (notificationSeenRef.current.has(id)) continue;
      pendingAlerts.push({
        id,
        title: "Ticket de soporte",
        body: `${ticket.status} · ${ticket.subject}`
      });
    }

    if (!pendingAlerts.length) return;
    for (const alert of pendingAlerts) notificationSeenRef.current.add(alert.id);
    saveSeenNotifications();
    if (notificationPermission === "granted") pendingAlerts.slice(-3).forEach((alert) => notifyDesktop(alert.title, alert.body, alert.id));
  }, [activeUser, hydrated, notificationNow, notificationPermission, notifyDesktop, saveSeenNotifications, state, userAccounts]);

  async function requestDesktopNotifications() {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setNotificationPermission("unsupported");
      setToast("Este navegador no soporta notificaciones de PC");
      return;
    }
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    if (permission === "granted") {
      notifyDesktop("Banco de La Placeta", "Notificaciones de PC activadas", "placeta-notifications-enabled", true);
    } else {
      setToast("Permiso de notificaciones no activado");
    }
  }

  async function fetchFreshState() {
    const response = await fetch("/api/bank-state", { cache: "no-store" });
    if (!response.ok) throw new Error("No se pudo leer el estado remoto");
    const remote = normalizeState(await response.json());
    setState(remote);
    localStorage.setItem("placeta-web-state", JSON.stringify(remote));
    setSync("online");
    return remote;
  }

  async function persist(next: BankState, message: string, baseUpdatedAt: string | null = stateRef.current.updatedAt || null) {
    persistInFlightRef.current = true;
    const normalizedNext = normalizeState(next);
    setState(normalizedNext);
    setToast(message);
    try {
      const response = await fetch("/api/bank-state", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ state: normalizedNext, baseUpdatedAt })
      });
      setSync(response.ok ? "online" : "offline");
      if (response.ok) {
        const fresh = await fetch("/api/bank-state", { cache: "no-store" });
        if (fresh.ok) {
          const remote = normalizeState(await fresh.json());
          setState(remote);
          localStorage.setItem("placeta-web-state", JSON.stringify(remote));
          if (remote.updatedAt !== normalizedNext.updatedAt) setToast(`${message} · actualizado`);
        }
      } else if (response.status === 409) {
        const conflict = await response.json();
        const remote = normalizeState(conflict.remote);
        setState(remote);
        localStorage.setItem("placeta-web-state", JSON.stringify(remote));
        setToast("Operación no aplicada: los datos cambiaron en otro dispositivo. Reintenta con el saldo actualizado.");
      } else {
        setToast("No se pudo guardar. Revisa si había una operación duplicada o un conflicto de sincronización.");
      }
    } catch {
      setSync("offline");
      setToast(`${message} · guardado localmente`);
    } finally {
      persistInFlightRef.current = false;
    }
  }

  async function runOperation(operation: (fresh: BankState) => BankState, message: string) {
    if (operationInFlightRef.current) {
      setToast("Hay una operación en curso. Espera la confirmación antes de repetir.");
      return;
    }
    operationInFlightRef.current = true;
    try {
      const fresh = await fetchFreshState();
      await persist(operation(fresh), message, fresh.updatedAt || null);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Operación rechazada");
    } finally {
      operationInFlightRef.current = false;
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
          void persist(next, "DIP registrado en Banco de La Placeta");
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
        <div className="top-brand">
          <span className="brand-logo">
            <Image src="/logo.png" alt="Banco de La Placeta" fill sizes="68px" priority />
          </span>
          <div>
            <p className="eyebrow">Banco de La Placeta</p>
            <h1>Panel web</h1>
            <span className="top-user">{activeUser.displayName}</span>
          </div>
        </div>
        <div className="top-actions">
          <StatusPill sync={sync} />
          <button
            className={`icon-button ${notificationPermission === "granted" ? "notify-on" : ""}`}
            aria-label={notificationPermission === "granted" ? "Notificaciones de PC activadas" : "Activar notificaciones de PC"}
            title={notificationPermission === "granted" ? "Notificaciones de PC activadas" : "Activar notificaciones de PC"}
            onClick={requestDesktopNotifications}
          >
            <Bell size={19} />
          </button>
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

      <nav className="app-nav" aria-label="Secciones del banco">
        {visibleTabs.map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.id} className={tab === item.id ? "active" : ""} onClick={() => setTab(item.id)}>
              <Icon size={19} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

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
          onTransfer={(iban, amount, note) => runOperation((fresh) => transferByIban(fresh, selectedAccount.id, iban, amount, note, "Consumption"), "Transferencia GDLP ejecutada")}
          onRbu={() => runOperation((fresh) => claimRbu(fresh, selectedAccount.id), "RBU abonada")}
          onIssueCard={() => runOperation((fresh) => issueCard(fresh, selectedAccount.id), "Tarjeta digital emitida")}
          onToggleCard={(cardId) => runOperation((fresh) => toggleCard(fresh, cardId), "Estado de tarjeta actualizado")}
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
          onAddContact={(accountId) => runOperation((fresh) => addSavedContact(fresh, activeUser.placetaId, accountId), "Contacto guardado")}
          onRemoveContact={(accountId) => runOperation((fresh) => removeSavedContact(fresh, activeUser.placetaId, accountId), "Contacto eliminado")}
          onPay={(targetId, amount) => {
            const target = accountsById.get(targetId);
            if (target) runOperation((fresh) => payPlacezum(fresh, selectedAccount.id, target.iban, amount, `Placezum a ${target.displayName}`), "Pago Placezum confirmado");
          }}
        />
      )}

      {tab === "market" && (
        <MarketScreen
          state={state}
          account={selectedAccount}
          onStart={(marketId, amount) => runOperation((fresh) => startTimedInvestment(fresh, selectedAccount.id, marketId, amount), "Inversión 60s iniciada")}
          onSettle={(operationId) => {
            if (operationInFlightRef.current) {
              setToast("Hay una operación en curso. Espera la confirmación antes de repetir.");
              return;
            }
            operationInFlightRef.current = true;
            void (async () => {
              try {
                const fresh = await fetchFreshState();
                const result = settleTimedInvestment(fresh, operationId);
                await persist(result.state, `${result.reveal.userWins ? "Resultado a favor" : "Resultado en contra"} · ${formatPz(result.reveal.amountPz)} Pz`, fresh.updatedAt || null);
              } catch (error) {
                setToast(error instanceof Error ? error.message : "Resultado no disponible");
              } finally {
                operationInFlightRef.current = false;
              }
            })();
          }}
        />
      )}
      {tab === "hub" && <HubScreen state={state} user={activeUser} onPersist={(next, message) => void persist(next, message)} />}
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
      note: "Bono de bienvenida Banco de La Placeta",
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
    <main className="lp4-shell" id="inicio">
      <header className="lp4-nav">
        <a className="lp4-brand" href="#inicio" aria-label="Banco de La Placeta">
          <span className="lp4-logo">
            <Image src="/logo.png" alt="Banco de La Placeta" fill sizes="72px" priority />
          </span>
          <span>
            <strong>Banco de La Placeta</strong>
            <small>Web oficial</small>
          </span>
        </a>
        <nav className="lp4-links" aria-label="Navegación landing">
          <a href="#cuentas">Cuentas</a>
          <a href="#servicios">Servicios</a>
          <a href="#clientes">Clientes</a>
          <a href="#ayuda">Ayuda</a>
          <a href="#seguridad">Seguridad</a>
          <a className="lp4-link-cta" href="#acceso">Acceder</a>
        </nav>
      </header>

      <section className="lp4-hero">
        <Image src="/assets/promos/promo2.png" alt="Banco de La Placeta web" fill priority sizes="100vw" />
        <div className="lp4-hero-shade" />
        <div className="lp4-hero-inner">
          <div className="lp4-hero-copy">
            <span>Banca digital para La Placeta</span>
            <h1>Tu banco web para operar con claridad y control.</h1>
            <p>Banco de La Placeta reúne cuentas, pagos, tarjetas, documentos y soporte en una experiencia comercial lista para escritorio, con un lenguaje financiero serio y sin pantallas saturadas.</p>
            <div className="lp4-hero-actions">
              <a href="#acceso">Entrar al banco</a>
              <a href="#servicios">Ver servicios</a>
            </div>
            <div className="lp4-hero-badges" aria-label="Puntos destacados">
              <span>Sin promesas irreales</span>
              <span>Datos con trazabilidad</span>
              <span>Responsive</span>
            </div>
          </div>

          <form id="acceso" className="lp4-login" onSubmit={submit}>
            <div className="lp4-login-head">
              <span>{sync === "online" ? "Servicio conectado" : sync === "offline" ? "Modo sin conexión" : "Sincronizando datos"}</span>
              <h2>{mode === "login" ? "Acceso DIP" : "Crear acceso"}</h2>
            </div>
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
          </form>
        </div>
      </section>

      <section className="lp4-strip" id="cuentas" aria-label="Resumen del producto">
        {landingStats.map((item) => (
          <article key={item.label}>
            <strong>{item.value}</strong>
            <span>{item.label}</span>
            <p>{item.detail}</p>
          </article>
        ))}
      </section>

      <section className="lp4-product" id="servicios">
        <div className="lp4-section-head">
          <span>Servicios</span>
          <h2>Una oferta bancaria clara, modular y vendible.</h2>
          <p>La web agrupa cada tarea en una zona reconocible: consultar, pagar, documentar, administrar y pedir ayuda.</p>
        </div>
        <div className="lp4-service-grid">
          {commercialServices.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title}>
                <Icon size={22} />
                <strong>{item.title}</strong>
                <p>{item.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="lp4-showcase">
        <div className="lp4-card-visual">
          <Image src="/assets/promocard.jpg" alt="Tarjeta Banco de La Placeta" fill sizes="420px" />
          <div className="lp4-card-caption">
            <span>Promo Card</span>
            <strong>Assets originales de marca</strong>
          </div>
        </div>
        <div className="lp4-flow">
          <span>Operativa</span>
          <h2>Una experiencia pensada para escritorio.</h2>
          <p>Acciones principales visibles, formularios bajo demanda, documentos descargables y tickets con contexto.</p>
          {landingWorkflow.map((item, index) => (
            <article key={item.title}>
              <b>{index + 1}</b>
              <div>
                <strong>{item.title}</strong>
                <p>{item.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="lp4-clients" id="clientes">
        <div className="lp4-section-head">
          <span>Clientes</span>
          <h2>Una web preparada para cada perfil.</h2>
          <p>El contenido cambia por rol y tipo de cuenta para evitar módulos incompatibles y mostrar solo lo que corresponde.</p>
        </div>
        <div className="lp4-client-grid">
          {customerSegments.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title}>
                <Icon size={24} />
                <strong>{item.title}</strong>
                <p>{item.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="lp4-channels">
        <div className="lp4-section-head">
          <span>Canales</span>
          <h2>Web y Android sincronizados.</h2>
        </div>
        <div className="lp4-channel-grid">
          {channelCards.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title}>
                <Icon size={22} />
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.text}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="lp4-help" id="ayuda">
        <div className="lp4-section-head">
          <span>Ayuda</span>
          <h2>Contenido útil para operar mejor.</h2>
        </div>
        <div className="lp4-post-grid">
          {helpPosts.map((post) => (
            <article key={post.title}>
              <span>{post.tag}</span>
              <strong>{post.title}</strong>
              <p>{post.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="lp4-trust" id="seguridad">
        <div>
          <span>Seguridad y confianza</span>
          <h2>Lenguaje financiero real y operaciones con contexto.</h2>
          <p>Banco de La Placeta evita promesas irreales y prioriza origen, destino, límites, documentos y soporte.</p>
        </div>
        <div className="lp4-trust-grid">
          {landingTrust.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title}>
                <Icon size={22} />
                <strong>{item.title}</strong>
                <p>{item.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="lp4-faq" id="faq">
        <div className="lp4-section-head">
          <span>FAQ</span>
          <h2>Preguntas frecuentes</h2>
        </div>
        {landingFaq.map((item) => (
          <details key={item.question}>
            <summary>{item.question}</summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </section>

      <section className="lp4-final-cta">
        <div>
          <span>Banco de La Placeta</span>
          <h2>Accede a tu banca web y continúa donde lo dejaste.</h2>
          <p>La web está pensada para operar, revisar y administrar con calma desde PC sin perder continuidad con la app.</p>
        </div>
        <a href="#acceso">Abrir acceso DIP</a>
      </section>

      <footer className="lp4-footer">
        <div className="lp4-footer-brand">
          <span className="lp4-logo small">
            <Image src="/logo.png" alt="Banco de La Placeta" fill sizes="46px" />
          </span>
          <div>
            <strong>Banco de La Placeta</strong>
            <p>Banca digital, pagos y gestión financiera.</p>
          </div>
        </div>
        <div className="lp4-footer-columns">
          {footerColumns.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <strong>{column.title}</strong>
              {column.links.map((link) => <a key={link} href={link === "Soporte" ? "mailto:soporte@bancoplaceta.com" : "#inicio"}>{link}</a>)}
            </nav>
          ))}
        </div>
      </footer>
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
  const [activePopup, setActivePopup] = useState<"transfer" | "cards" | null>(null);
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
        <button onClick={() => setActivePopup("transfer")}><CircleDollarSign size={20} /> Enviar</button>
        <button onClick={onRbu}><Sparkles size={20} /> RBU</button>
        <button onClick={() => setActivePopup("cards")}><CreditCard size={20} /> Tarjetas</button>
        <button onClick={() => generateBankPdf(account, { id: `doc-month-${account.id}`, title: "Extracto mensual", kind: "MonthlyStatement" }, transactionsFor(account.id, transactions))}><Download size={20} /> PDF</button>
      </div>

      <article className="panel action-summary">
        <SectionTitle icon={WalletCards} title="Accesos de cuenta" />
        <div className="service-grid">
          <button onClick={() => setActivePopup("transfer")}><CircleDollarSign size={22} /><strong>Transferir</strong><span>Enviar Pz por IBAN</span></button>
          <button onClick={() => setActivePopup("cards")}><CreditCard size={22} /><strong>Tarjetas</strong><span>{cards.length ? `${cards.length} vinculadas` : "Emitir una nueva"}</span></button>
          <button onClick={onRbu}><Sparkles size={22} /><strong>RBU</strong><span>Abono disponible</span></button>
        </div>
      </article>

      <History transactions={history} accounts={accounts} />

      <Modal title="Transferencia GDLP" open={activePopup === "transfer"} onClose={() => setActivePopup(null)}>
        <Field label="IBAN destino" value={iban} onChange={setIban} />
        <div className="two-cols">
          <Field label="Importe Pz" value={String(amount)} onChange={(value) => setAmount(Number(value) || 0)} type="number" />
          <Field label="Concepto" value={note} onChange={setNote} />
        </div>
        <button className="primary-button" onClick={() => {
          onTransfer(iban, amount, note);
          setActivePopup(null);
        }}>Enviar</button>
      </Modal>

      <Modal title="Tarjetas" open={activePopup === "cards"} onClose={() => setActivePopup(null)}>
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
        <button className="primary-button" onClick={onIssueCard}>Emitir tarjeta digital</button>
      </Modal>
    </section>
  );
}

function PlacezumScreen({ user, account, accounts, contacts, limit, spent, onPay, onAddContact, onRemoveContact }: { user: UserProfile; account: Account; accounts: Account[]; contacts: { accountId: string }[]; limit: number; spent: number; onPay: (targetId: string, amount: number) => void; onAddContact: (accountId: string) => void; onRemoveContact: (accountId: string) => void }) {
  const [amount, setAmount] = useState(12);
  const [contactQuery, setContactQuery] = useState("");
  const [contactsOpen, setContactsOpen] = useState(false);
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
      <article className="panel action-summary">
        <SectionTitle icon={ScanLine} title="Placezum" />
        <div className="service-grid">
          <button onClick={() => setContactsOpen(true)}><QrCode size={22} /><strong>Pagar contacto</strong><span>{favoriteAccounts.length ? `${favoriteAccounts.length} guardados` : "Añadir primero"}</span></button>
          <button onClick={() => setContactsOpen(true)}><ShieldCheck size={22} /><strong>Contactos</strong><span>Guardar IBAN o Placeta ID</span></button>
        </div>
      </article>
      <article className="panel split-panel">
        <div><ShieldCheck size={23} /><strong>Límite semanal</strong><span>{formatPz(spent)} de {formatPz(limit)} Pz por Placezum</span></div>
        <div><Lock size={23} /><strong>Biometría web</strong><span>Confirmación local del navegador</span></div>
      </article>

      <Modal title="Contactos Placezum" open={contactsOpen} onClose={() => setContactsOpen(false)}>
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
      </Modal>
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
  const isBusinessAccount = account.type === "Business";
  const pending = pendingInvestmentOperations(state, account.id);
  const allResults = investmentResultRows(state, account.id);
  const results = allResults.slice(0, 6);
  const wins = allResults.filter((row) => row.netResultPz >= 0).length;
  const totalPrincipal = allResults.reduce((sum, row) => sum + row.principalPz, 0);
  const totalNetResult = allResults.reduce((sum, row) => sum + row.netResultPz, 0);
  const roiPercent = totalPrincipal > 0 ? Math.round((totalNetResult / totalPrincipal) * 100) : 0;
  const winRate = allResults.length ? Math.round((wins / allResults.length) * 100) : 0;
  const bestResult = [...allResults].sort((left, right) => right.netResultPz - left.netResultPz)[0];
  const worstResult = [...allResults].sort((left, right) => left.netResultPz - right.netResultPz)[0];
  const companyBuys = state.transactions.filter((transaction) => transaction.kind === "InvestmentBuy" && transaction.toAccountId === account.id);
  const companySettlements = state.transactions.filter((transaction) => transaction.kind === "InvestmentSell" && transaction.fromAccountId === account.id && transaction.concept === "INVESTMENT_60S_RESULT");
  const companyOpen = pendingInvestmentOperations(state).filter((operation) => operation.companyId === account.id);
  const companyReceived = companyBuys.reduce((sum, transaction) => sum + transaction.amountPz, 0);
  const companyPaid = companySettlements.reduce((sum, transaction) => sum + transaction.amountPz, 0);
  const companyNet = companyReceived - companyPaid;
  const companyRoi = companyReceived > 0 ? Math.round((companyNet / companyReceived) * 100) : 0;
  const companyInvestors = new Set(companyBuys.map((transaction) => transaction.fromAccountId)).size;
  const today = new Date().toISOString().slice(0, 10);
  const dailyInvestmentCount = state.transactions.filter((transaction) =>
    transaction.fromAccountId === account.id &&
    transaction.kind === "InvestmentBuy" &&
    transaction.createdAt.slice(0, 10) === today
  ).length;
  const remainingToday = Math.max(0, state.treasuryConfig.dailyInvestmentLimit - dailyInvestmentCount);
  const pendingCapital = pending.reduce((sum, operation) => sum + operation.amountPz, 0);
  const maxAmount = state.treasuryConfig.maxInvestmentAmountPz;
  const safeAmount = Math.min(Math.max(0, amount), maxAmount);
  const quickAmounts = [100, 250, 500, maxAmount].filter((value, index, all) => value <= maxAmount && all.indexOf(value) === index);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  if (!isInvestmentAccount && !isBusinessAccount) {
    return (
      <section className="screen-grid market-grid">
        <article className="hero-card market-hero">
          <span>Mercado GDLP</span>
          <strong>Cuenta no compatible</strong>
          <p>{account.displayName} es una cuenta {accountTypeLabel(account.type).toLowerCase()}. Selecciona una cuenta de inversión o empresa.</p>
        </article>
        <article className="panel market-alert incompatible-panel">
          <SectionTitle icon={ShieldCheck} title="Inversiones no disponibles" />
          <p className="muted">Esta sección solo se activa con “Cartera Plazet” para operar o con una cuenta Empresa para ver alta, capital recibido y rentabilidad.</p>
          <div className="analysis-grid">
            <div><span>Cuenta actual</span><strong>{account.displayName}</strong></div>
            <div><span>Tipo</span><strong>{accountTypeLabel(account.type)}</strong></div>
            <div><span>IBAN</span><strong>{account.iban}</strong></div>
            <div><span>Estado</span><strong>{account.complianceStatus || "Clear"}</strong></div>
          </div>
        </article>
      </section>
    );
  }

  if (isBusinessAccount) {
    return (
      <section className="screen-grid market-grid">
        <article className="hero-card market-hero">
          <span>Empresa GDLP · detalle de alta</span>
          <strong>{account.displayName}</strong>
          <p>{account.listedInvestmentFund ? "Empresa publicada para recibir capital" : "Empresa activa sin publicación de fondo"} · riesgo {account.investmentRiskLevel || 3}/7</p>
        </article>
        <div className="metric-grid market-metrics">
          <MetricCard label="Capital recibido" value={`${formatPz(companyReceived)} Pz`} tone="purple" />
          <MetricCard label="Liquidado" value={`${formatPz(companyPaid)} Pz`} tone="gold" />
          <MetricCard label="Rentabilidad" value={`${companyRoi >= 0 ? "+" : ""}${companyRoi}%`} tone={companyRoi >= 0 ? "green" : "red"} />
          <MetricCard label="Inversores" value={String(companyInvestors)} tone="green" />
        </div>
        <article className="panel investment-analysis company-analysis">
          <SectionTitle icon={Building2} title="Alta de empresa" />
          <div className="analysis-grid">
            <div><span>Placeta ID</span><strong>{account.placetaId || "Sin ID"}</strong></div>
            <div><span>IBAN empresa</span><strong>{account.iban}</strong></div>
            <div><span>Publicación</span><strong>{account.listedInvestmentFund ? "Activa" : "No publicada"}</strong></div>
            <div><span>Estado</span><strong>{account.complianceStatus || "Clear"}</strong></div>
          </div>
          <p className="muted">Las cuentas empresa no compran desde esta pantalla. Aquí se revisa el alta, el capital recibido y la rentabilidad de las operaciones asociadas.</p>
        </article>
        <article className="panel investment-analysis company-analysis">
          <SectionTitle icon={Sparkles} title="Rentabilidad empresa" />
          <div className="analysis-grid">
            <div><span>Saldo neto inversión</span><strong className={companyNet >= 0 ? "good" : "bad"}>{companyNet >= 0 ? "+" : ""}{formatPz(companyNet)} Pz</strong></div>
            <div><span>Operaciones recibidas</span><strong>{companyBuys.length}</strong></div>
            <div><span>Operaciones liquidadas</span><strong>{companySettlements.length}</strong></div>
            <div><span>Capital abierto</span><strong>{formatPz(companyOpen.reduce((sum, operation) => sum + operation.amountPz, 0))} Pz</strong></div>
          </div>
          <div className="company-open-list">
            {companyOpen.length ? companyOpen.slice(0, 6).map((operation) => (
              <div key={operation.id}>
                <strong>{formatPz(operation.amountPz)} Pz abiertos</strong>
                <span>{operation.accountId} · vence {operation.readyAt.slice(11, 16)}</span>
              </div>
            )) : <span>Sin capital pendiente de liquidación.</span>}
          </div>
        </article>
        <article className="panel history-panel market-results">
          <SectionTitle icon={Landmark} title="Actividad de inversión" />
          {[...companyBuys, ...companySettlements].slice(0, 8).map((transaction) => (
            <div className="investment-row" key={transaction.id}>
              <div>
                <strong>{transaction.kind === "InvestmentBuy" ? "Capital recibido" : "Liquidación enviada"}</strong>
                <span>{transaction.createdAt.slice(0, 10)} · {transaction.note}</span>
              </div>
              <b>{formatPz(transaction.amountPz)} Pz</b>
            </div>
          ))}
          {!companyBuys.length && !companySettlements.length && <Empty title="Sin actividad" text="Las operaciones aparecerán cuando una cartera invierta en esta empresa." />}
        </article>
      </section>
    );
  }

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
      <article className="panel investment-analysis">
        <SectionTitle icon={Sparkles} title="Cómo vas" />
        <div className="analysis-grid">
          <div><span>ROI cerrado</span><strong className={roiPercent >= 0 ? "good" : "bad"}>{roiPercent >= 0 ? "+" : ""}{roiPercent}%</strong></div>
          <div><span>Aciertos</span><strong>{wins}/{allResults.length || 0}</strong></div>
          <div><span>Capital cerrado</span><strong>{formatPz(totalPrincipal)} Pz</strong></div>
          <div><span>Resultado neto</span><strong className={totalNetResult >= 0 ? "good" : "bad"}>{totalNetResult >= 0 ? "+" : ""}{formatPz(totalNetResult)} Pz</strong></div>
        </div>
        <div className="progress-meter">
          <span style={{ width: `${Math.max(0, Math.min(100, winRate))}%` }} />
        </div>
        <p className="muted">{allResults.length ? `Mejor: ${bestResult?.assetName} (${bestResult && bestResult.netResultPz >= 0 ? "+" : ""}${formatPz(bestResult?.netResultPz || 0)} Pz). Peor: ${worstResult?.assetName} (${worstResult && worstResult.netResultPz >= 0 ? "+" : ""}${formatPz(worstResult?.netResultPz || 0)} Pz).` : "Aún no hay suficientes liquidaciones para calcular rendimiento."}</p>
      </article>
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
                  <i><span style={{ width: `${Math.round((risk / 7) * 100)}%` }} /></i>
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

function HubScreen({ state, user, onPersist }: { state: BankState; user: UserProfile; onPersist: (state: BankState, message: string) => void }) {
  const userAccounts = state.accounts.filter((account) => account.placetaId === user.placetaId || account.id === user.primaryAccountId);
  const businessAccounts = userAccounts.filter((account) => account.type === "Business");
  const payrollTargets = userAccounts.filter((account) => account.type === "Current");
  const totalBalance = userAccounts.reduce((sum, account) => sum + account.balancePz, 0);
  const cards = state.digitalCards.filter((card) => userAccounts.some((account) => account.id === card.accountId));
  const recent = state.transactions
    .filter((transaction) => userAccounts.some((account) => account.id === transaction.fromAccountId || account.id === transaction.toAccountId))
    .slice(0, 5);
  const pendingInvestments = pendingInvestmentOperations(state).filter((operation) => userAccounts.some((account) => account.id === operation.accountId));
  const tickets = (state.supportTickets || []).filter((ticket) => ticket.ownerDip === user.dip).sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  const [businessId, setBusinessId] = useState(businessAccounts[0]?.id || "");
  const [payrollTargetId, setPayrollTargetId] = useState(payrollTargets[0]?.id || "");
  const [payrollGross, setPayrollGross] = useState(state.treasuryConfig.minimumWeeklySalaryPz);
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [ticketAttachments, setTicketAttachments] = useState<string[]>([]);
  const [hubModal, setHubModal] = useState<"payroll" | "support" | "accounts" | "documents" | "activity" | "promos" | null>(null);
  const business = state.accounts.find((account) => account.id === businessId) || businessAccounts[0];
  const payrollTarget = state.accounts.find((account) => account.id === payrollTargetId) || payrollTargets[0];
  const workerTax = Math.ceil((payrollGross * state.treasuryConfig.payrollWorkerTaxPercent) / 100);
  const employerTax = Math.ceil((payrollGross * state.treasuryConfig.payrollEmployerTaxPercent) / 100);
  const netSalary = Math.max(0, payrollGross - workerTax);
  const payrollCost = payrollGross + employerTax;
  const attachments = [
    ...userAccounts.slice(0, 4).map((account) => ({ id: `account:${account.id}`, label: `Cuenta · ${account.displayName}` })),
    ...cards.slice(0, 3).map((card) => ({ id: `card:${card.id}`, label: `Tarjeta · ${card.alias}` })),
    ...pendingInvestments.slice(0, 3).map((operation) => ({ id: `investment:${operation.id}`, label: `Inversión · ${operation.assetName}` })),
    ...recent.slice(0, 3).map((transaction) => ({ id: `txn:${transaction.id}`, label: `Movimiento · ${transaction.kind} ${formatPz(transaction.amountPz)} Pz` }))
  ];
  const primaryAccount = userAccounts.find((account) => account.id === user.primaryAccountId) || userAccounts[0];
  const documents: Array<{ title: string; detail: string; icon: LucideIcon; kind: WebDocumentKind; id: string }> = [
    { title: "Extracto mensual", detail: `${recent.length} movimientos recientes`, icon: Download, kind: "MonthlyStatement", id: "doc-month" },
    { title: "Certificado DIP", detail: `${user.dip} · identidad activa`, icon: ShieldCheck, kind: "SolvencyCertificate", id: "doc-solvency" },
    { title: "Justificante de pago", detail: "Última transacción asentada", icon: Banknote, kind: "PaymentReceipt", id: "doc-payment" },
    { title: "Recibos fiscales", detail: `${state.transactions.filter((item) => item.toAccountId === TGLP_ID).length} apuntes tributarios`, icon: Gavel, kind: "VatReceipt", id: "doc-vat" },
    { title: "Impuestos semanales", detail: "Liquidación semanal TGLP", icon: Landmark, kind: "WeeklyTaxReport", id: "doc-weekly" },
    { title: "Requerimiento fiscal", detail: "Formato ATP de la app", icon: ShieldCheck, kind: "FiscalRequirement", id: "doc-fiscal" },
    { title: "Contrato laboral", detail: "Relación laboral registrada", icon: Building2, kind: "LaborContract", id: "doc-labor" },
    { title: "Liquidación inversión", detail: "Ticket de operación 60s", icon: TrendingUp, kind: "InvestmentLiquidation", id: "doc-investment" },
    { title: "Informe empresa", detail: "Actividad y pagos de empresa", icon: Banknote, kind: "BusinessStatement", id: "doc-business" }
  ];

  function toggleAttachment(id: string) {
    setTicketAttachments((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function submitPayroll() {
    if (!business || !payrollTarget) return;
    onPersist(
      transferPayrollOrLoan(state, business.id, payrollTarget.id, payrollGross, `Nómina empresa ${business.displayName} -> ${payrollTarget.displayName}`),
      `Nómina registrada para ${payrollTarget.displayName}`
    );
    setHubModal(null);
  }

  function submitTicket() {
    const now = new Date().toISOString();
    const ticket: SupportTicket = {
      id: `SUP-${Date.now().toString().slice(-6)}`,
      ownerDip: user.dip,
      accountId: user.primaryAccountId,
      subject: ticketSubject.trim() || "Consulta de soporte",
      message: ticketMessage.trim() || ticketSubject.trim() || "Consulta de soporte",
      attachments: ticketAttachments,
      status: "Open",
      createdAt: now,
      updatedAt: now
    };
    onPersist({
      ...state,
      supportTickets: [ticket, ...(state.supportTickets || [])],
      updatedAt: now
    }, `Ticket de soporte enviado: ${ticket.id}`);
    setTicketSubject("");
    setTicketMessage("");
    setTicketAttachments([]);
    setHubModal(null);
  }

  const openTickets = tickets.filter((ticket) => ticket.status !== "Closed").length;
  const activeCards = cards.filter((card) => !card.frozen).length;
  const hubActions = [
    { id: "payroll" as const, title: "Nóminas", detail: businessAccounts.length ? `${businessAccounts.length} empresas disponibles` : "Sin empresa vinculada", icon: Banknote },
    { id: "support" as const, title: "Soporte", detail: openTickets ? `${openTickets} tickets abiertos` : "Abrir ticket con contexto", icon: ShieldCheck },
    { id: "accounts" as const, title: "Cuentas", detail: `${userAccounts.length} cuentas vinculadas`, icon: Landmark },
    { id: "documents" as const, title: "Documentos", detail: "Extractos y certificados", icon: Download },
    { id: "activity" as const, title: "Actividad", detail: `${recent.length} movimientos recientes`, icon: Sparkles },
    { id: "promos" as const, title: "Promos", detail: `${state.promoSlides.length} campañas activas`, icon: CreditCard }
  ];

  return (
    <section className="screen-grid hub-grid">
      <article className="hero-card hub-hero">
        <span>Hub web · {user.dip}</span>
        <strong>{formatMoneyPz(totalBalance)} Pz</strong>
        <p>{userAccounts.length} cuentas · {businessAccounts.length} empresas · {openTickets} tickets abiertos</p>
      </article>

      <div className="metric-grid">
        <MetricCard label="Saldo total" value={`${formatPz(totalBalance)} Pz`} tone="purple" />
        <MetricCard label="Tarjetas activas" value={String(activeCards)} tone="green" />
        <MetricCard label="Nómina neta" value={`${formatPz(netSalary)} Pz`} tone="gold" />
        <MetricCard label="Tickets abiertos" value={String(openTickets)} tone="red" />
      </div>

      <article className="panel hub-panel hub-command-center">
        <SectionTitle icon={MoreHorizontal} title="Centro de acciones" />
        <div className="hub-action-grid">
          {hubActions.map((action) => {
            const Icon = action.icon;
            return (
              <button key={action.id} onClick={() => setHubModal(action.id)}>
                <Icon size={22} />
                <span><strong>{action.title}</strong><small>{action.detail}</small></span>
              </button>
            );
          })}
        </div>
      </article>

      <article className="panel hub-panel hub-overview">
        <SectionTitle icon={ShieldCheck} title="Resumen operativo" />
        <div className="hub-status-list">
          <div><strong>DIP verificado</strong><span>{user.dip} · {user.placetaId}</span></div>
          <div><strong>Empresas</strong><span>{businessAccounts.length ? businessAccounts.map((account) => account.displayName).join(", ") : "Sin empresa vinculada"}</span></div>
          <div><strong>Soporte</strong><span>{openTickets ? "Hay tickets pendientes de seguimiento" : "Sin incidencias abiertas"}</span></div>
        </div>
      </article>

      <article className="panel hub-panel">
        <SectionTitle icon={Sparkles} title="Actividad reciente" />
        <div className="mini-feed">
          {recent.length ? recent.slice(0, 4).map((transaction) => (
            <div key={transaction.id}>
              <span>{transaction.kind}</span>
              <strong>{formatPz(transaction.amountPz)} Pz</strong>
            </div>
          )) : <Empty title="Sin actividad" text="Tus movimientos aparecerán aquí." />}
        </div>
      </article>

      <Modal title="Administración de nóminas" open={hubModal === "payroll"} onClose={() => setHubModal(null)}>
        <SectionTitle icon={Building2} title="Administración de nóminas" />
        {businessAccounts.length && payrollTargets.length ? (
          <>
            <div className="field">
              <span>Empresa origen</span>
              <select value={business?.id || ""} onChange={(event) => setBusinessId(event.target.value)}>
                {businessAccounts.map((account) => <option key={account.id} value={account.id}>{account.displayName} · {formatPz(account.balancePz)} Pz</option>)}
              </select>
            </div>
            <div className="field">
              <span>Trabajador / cuenta destino</span>
              <select value={payrollTarget?.id || ""} onChange={(event) => setPayrollTargetId(event.target.value)}>
                {payrollTargets.map((account) => <option key={account.id} value={account.id}>{account.displayName} · {account.iban}</option>)}
              </select>
            </div>
            <Field label={`Nómina bruta semanal · SMI ${formatPz(state.treasuryConfig.minimumWeeklySalaryPz)} Pz`} value={String(payrollGross)} onChange={(value) => setPayrollGross(Number(value) || 0)} type="number" />
            <div className="payroll-summary">
              <div><span>Trabajador {state.treasuryConfig.payrollWorkerTaxPercent}%</span><strong>-{formatPz(workerTax)} Pz</strong></div>
              <div><span>Empresa {state.treasuryConfig.payrollEmployerTaxPercent}%</span><strong>+{formatPz(employerTax)} Pz</strong></div>
              <div><span>Neto trabajador</span><strong>{formatPz(netSalary)} Pz</strong></div>
              <div><span>Coste empresa</span><strong>{formatPz(payrollCost)} Pz</strong></div>
            </div>
            <button className="primary-button" disabled={!business || !payrollTarget || payrollGross < state.treasuryConfig.minimumWeeklySalaryPz} onClick={submitPayroll}>Registrar nómina</button>
          </>
        ) : (
          <Empty title="Sin empresa disponible" text="Selecciona o crea una cuenta Empresa para registrar nóminas." />
        )}
      </Modal>

      <Modal title="Cuentas vinculadas" open={hubModal === "accounts"} onClose={() => setHubModal(null)}>
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
      </Modal>

      <Modal title="Documentos" open={hubModal === "documents"} onClose={() => setHubModal(null)}>
        <SectionTitle icon={Download} title="Documentos" />
        <div className="document-grid">
          {documents.map((doc) => {
            const Icon = doc.icon;
            return (
              <button key={doc.title} disabled={!primaryAccount} onClick={() => {
                if (!primaryAccount) return;
                generateBankPdf(primaryAccount, { id: `${doc.id}-${primaryAccount.id}`, title: doc.title, kind: doc.kind }, transactionsFor(primaryAccount.id, state.transactions));
              }}>
                <Icon size={22} />
                <span><strong>{doc.title}</strong><small>{doc.detail}</small></span>
              </button>
            );
          })}
        </div>
      </Modal>

      <Modal title="Promos activas" open={hubModal === "promos"} onClose={() => setHubModal(null)}>
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
      </Modal>

      <Modal title="Ticket de soporte" open={hubModal === "support"} onClose={() => setHubModal(null)}>
        <SectionTitle icon={WifiOff} title="Ticket de soporte" />
        <Field label="Asunto" value={ticketSubject} onChange={setTicketSubject} placeholder="Ej. Revisión de movimiento" />
        <Field label="Mensaje" value={ticketMessage} onChange={setTicketMessage} placeholder="Describe qué ocurre" />
        <div className="attachment-grid">
          {attachments.map((attachment) => (
            <button key={attachment.id} className={ticketAttachments.includes(attachment.id) ? "active" : ""} onClick={() => toggleAttachment(attachment.id)}>
              {attachment.label}
            </button>
          ))}
        </div>
        <button className="primary-button" onClick={submitTicket}>Abrir ticket</button>
        <div className="support-thread">
          {tickets.slice(0, 3).map((ticket) => (
            <div key={ticket.id}><strong>{ticket.id} · {ticket.subject}</strong><span>{ticket.attachments.length} adjuntos · {ticket.status}</span></div>
          ))}
          {!tickets.length && <div><strong>Canal soporte</strong><span>Sin tickets abiertos. Adjunta movimientos, cuentas o inversiones.</span></div>}
        </div>
      </Modal>

      <Modal title="Actividad reciente" open={hubModal === "activity"} onClose={() => setHubModal(null)}>
        <SectionTitle icon={Sparkles} title="Actividad reciente" />
        <div className="mini-feed">
          {recent.length ? recent.map((transaction) => (
            <div key={transaction.id}>
              <span>{transaction.kind}</span>
              <strong>{formatPz(transaction.amountPz)} Pz</strong>
            </div>
          )) : <Empty title="Sin actividad" text="Tus movimientos aparecerán aquí." />}
        </div>
      </Modal>
    </section>
  );
}

function TributosScreen({ state, onPersist }: { state: BankState; onPersist: (state: BankState, message: string) => void }) {
  const tglp = state.accounts.find((item) => item.id === TGLP_ID);
  const citizenAccounts = state.accounts.filter((account) => account.kind === "CITIZEN").sort((a, b) => b.balancePz - a.balancePz);
  const [targetId, setTargetId] = useState(citizenAccounts[0]?.id || "");
  const [fineAmount, setFineAmount] = useState(50);
  const [vatBase, setVatBase] = useState(100);
  const [taxModal, setTaxModal] = useState<"actions" | "alerts" | "ranking" | "history" | null>(null);
  const target = state.accounts.find((account) => account.id === targetId) || citizenAccounts[0];
  const iva = state.transactions.reduce((sum, item) => sum + (item.ivaPz || 0), 0);
  const todayTax = state.transactions.filter((item) => item.toAccountId === TGLP_ID && item.createdAt.slice(0, 10) === new Date().toISOString().slice(0, 10)).reduce((sum, item) => sum + item.amountPz + item.ivaPz, 0);
  const pendingExternal = state.transactions.filter((item) => item.kind === "ExternalBlocked" && item.status === "Pending").length;
  const fiscalTx = state.transactions.filter((item) => item.toAccountId === TGLP_ID || item.fromAccountId === TGLP_ID).slice(0, 10);
  const taxActions = [
    { id: "actions" as const, title: "Acciones fiscales", detail: target ? `${target.displayName} seleccionado` : "Seleccionar cuenta", icon: Gavel },
    { id: "alerts" as const, title: "Expedientes", detail: `${state.complianceFlags.length} alertas activas`, icon: ShieldCheck },
    { id: "ranking" as const, title: "Ranking", detail: `${citizenAccounts.length} cuentas auditables`, icon: TrendingUp },
    { id: "history" as const, title: "Movimientos", detail: `${fiscalTx.length} apuntes fiscales`, icon: Banknote }
  ];
  return (
    <section className="screen-grid admin-grid purple-suite">
      <article className="hero-card tributos-hero admin-command">
        <span>Agencia Tributaria · Centro fiscal</span>
        <strong>{formatMoneyPz(tglp?.balancePz || 0)} Pz</strong>
        <p>IVA acumulado {formatPz(iva)} Pz · {state.complianceFlags.length} alertas · {pendingExternal} externas pendientes</p>
      </article>

      <div className="metric-grid">
        <MetricCard label="Recaudado hoy" value={`${formatPz(todayTax)} Pz`} tone="purple" />
        <MetricCard label="IVA histórico" value={`${formatPz(iva)} Pz`} tone="gold" />
        <MetricCard label="Expedientes" value={String(state.complianceFlags.length)} tone="red" />
        <MetricCard label="Cuentas auditables" value={String(citizenAccounts.length)} tone="green" />
      </div>

      <article className="panel admin-panel admin-command-center">
        <SectionTitle icon={Gavel} title="Panel de gestión tributaria" />
        <div className="admin-action-grid">
          {taxActions.map((action) => {
            const Icon = action.icon;
            return (
              <button key={action.id} onClick={() => setTaxModal(action.id)}>
                <Icon size={22} />
                <span><strong>{action.title}</strong><small>{action.detail}</small></span>
              </button>
            );
          })}
        </div>
      </article>

      <article className="panel admin-panel fiscal-overview">
        <SectionTitle icon={ShieldCheck} title="Estado fiscal" />
        <div className="hub-status-list">
          <div><strong>Cuenta objetivo</strong><span>{target ? `${target.displayName} · ${target.iban}` : "Sin cuenta seleccionada"}</span></div>
          <div><strong>Riesgo operativo</strong><span>{state.complianceFlags.length ? "Hay expedientes pendientes" : "Sin expedientes abiertos"}</span></div>
          <div><strong>Actividad de hoy</strong><span>{formatPz(todayTax)} Pz recaudados en el día</span></div>
        </div>
      </article>

      <Modal title="Acciones fiscales" open={taxModal === "actions"} onClose={() => setTaxModal(null)}>
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
          <button className="primary-button" disabled={!target} onClick={() => { if (target) onPersist(chargeWeeklyTax(state, target.id), "Impuesto semanal cargado"); setTaxModal(null); }}>Cobrar semanal</button>
          <button className="secondary-button" disabled={!target} onClick={() => { if (target) onPersist(issueOfficialFine(state, target.id, fineAmount), "Multa oficial emitida"); setTaxModal(null); }}>Emitir multa</button>
          <button className="secondary-button" disabled={!target} onClick={() => { if (target) onPersist(forceVatRegularization(state, target.id, vatBase), "IVA regularizado"); setTaxModal(null); }}>Regularizar IVA</button>
        </div>
      </Modal>

      <Modal title="Alertas fiscales" open={taxModal === "alerts"} onClose={() => setTaxModal(null)}>
        <SectionTitle icon={Gavel} title="Alertas fiscales" />
        {state.complianceFlags.length ? state.complianceFlags.map((flag) => (
          <div className="holding-row" key={flag.id}>
            <div><strong>{flag.reason}</strong><span>{flag.accountId}</span></div>
            <b>{formatPz(flag.amountPz)} Pz</b>
          </div>
        )) : <Empty title="Sin alertas" text="No hay expedientes fiscales pendientes." />}
      </Modal>

      <Modal title="Ranking de balances" open={taxModal === "ranking"} onClose={() => setTaxModal(null)}>
        <SectionTitle icon={TrendingUp} title="Ranking de balances" />
        {citizenAccounts.slice(0, 8).map((account, index) => (
          <div className="holding-row" key={account.id}>
            <div><strong>#{index + 1} · {account.displayName}</strong><span>{account.iban} · {account.type}</span></div>
            <b>{formatPz(account.balancePz)} Pz</b>
          </div>
        ))}
      </Modal>

      <Modal title="Movimientos fiscales" open={taxModal === "history"} onClose={() => setTaxModal(null)}>
        <History transactions={fiscalTx} accounts={state.accounts} />
      </Modal>
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
  const [adminModal, setAdminModal] = useState<"emission" | "policy" | "audit" | "users" | null>(null);
  const agldp = state.accounts.find((item) => item.id === AGLDP_ID);
  const totalMoney = state.accounts.reduce((sum, account) => sum + Math.max(0, account.balancePz), 0);
  const businessCount = state.accounts.filter((account) => account.type === "Business").length;
  const pendingRequests = state.subsidyRequests.filter((request) => request.status === "Pending").length;
  const adminActions = [
    { id: "emission" as const, title: "Emisión", detail: `Preparado ${formatPz(amount)} Pz`, icon: Landmark },
    { id: "policy" as const, title: "Normativa", detail: "Límites, tasas e inversión", icon: ShieldCheck },
    { id: "audit" as const, title: "Auditoría", detail: `${state.complianceFlags.length} flags · ${state.transactions.length} movimientos`, icon: WifiOff },
    { id: "users" as const, title: "Usuarios", detail: `${state.users.length} perfiles registrados`, icon: Building2 }
  ];
  return (
    <section className="screen-grid admin-grid purple-suite">
      <article className="hero-card admin-hero admin-command">
        <span>Administración · Banco de La Placeta</span>
        <strong>{formatMoneyPz(agldp?.balancePz || 0)} Pz</strong>
        <p>{state.users.length} usuarios · {state.accounts.length} cuentas · masa {formatPz(totalMoney)} Pz</p>
      </article>

      <div className="metric-grid">
        <MetricCard label="Masa monetaria" value={`${formatPz(totalMoney)} Pz`} tone="purple" />
        <MetricCard label="Empresas" value={String(businessCount)} tone="green" />
        <MetricCard label="Promos" value={String(state.promoSlides.length)} tone="gold" />
        <MetricCard label="Solicitudes" value={String(pendingRequests)} tone="red" />
      </div>

      <article className="panel admin-panel admin-command-center">
        <SectionTitle icon={Landmark} title="Centro administrativo" />
        <div className="admin-action-grid">
          {adminActions.map((action) => {
            const Icon = action.icon;
            return (
              <button key={action.id} onClick={() => setAdminModal(action.id)}>
                <Icon size={22} />
                <span><strong>{action.title}</strong><small>{action.detail}</small></span>
              </button>
            );
          })}
        </div>
      </article>

      <article className="panel admin-panel fiscal-overview">
        <SectionTitle icon={ShieldCheck} title="Resumen del sistema" />
        <div className="hub-status-list">
          <div><strong>Saldo AGLDP</strong><span>{formatPz(agldp?.balancePz || 0)} Pz disponibles</span></div>
          <div><strong>Normativa activa</strong><span>Placezum {formatPz(state.treasuryConfig.placezumWeeklyLimitPz)} Pz · inversión máx {formatPz(state.treasuryConfig.maxInvestmentAmountPz)} Pz</span></div>
          <div><strong>Operación</strong><span>{pendingRequests ? `${pendingRequests} solicitudes pendientes` : "Sin solicitudes pendientes"}</span></div>
        </div>
      </article>

      <Modal title="Emisión monetaria" open={adminModal === "emission"} onClose={() => setAdminModal(null)}>
        <SectionTitle icon={Landmark} title="Emisión monetaria" />
        <Field label="Importe Pz" value={String(amount)} onChange={(value) => setAmount(Number(value) || 0)} type="number" />
        <button className="primary-button" onClick={() => {
          onPersist(emitMoney(state, amount), "Emisión monetaria aplicada");
          setAdminModal(null);
        }}>Emitir hacia AGLDP</button>
      </Modal>

      <Modal title="Configuración normativa" open={adminModal === "policy"} onClose={() => setAdminModal(null)}>
        <SectionTitle icon={ShieldCheck} title="Configuración normativa" />
        <div className="config-grid">
          <Field label="Impuesto semanal %" value={String(weeklyTax)} onChange={(value) => setWeeklyTax(Number(value) || 0)} type="number" />
          <Field label="Tasa operativa %" value={String(opTax)} onChange={(value) => setOpTax(Number(value) || 0)} type="number" />
          <Field label="Placezum semanal" value={String(placezumLimit)} onChange={(value) => setPlacezumLimit(Number(value) || 0)} type="number" />
          <Field label="Máx inversión" value={String(investmentMax)} onChange={(value) => setInvestmentMax(Number(value) || 0)} type="number" />
          <Field label="Inversiones/día" value={String(dailyInvestmentLimit)} onChange={(value) => setDailyInvestmentLimit(Number(value) || 0)} type="number" />
        </div>
        <button className="primary-button" onClick={() => {
          onPersist(updateTreasuryConfig(state, {
            weeklyTaxPercent: weeklyTax,
            operationalTransferTaxPercent: opTax,
            placezumWeeklyLimitPz: placezumLimit,
            maxInvestmentAmountPz: investmentMax,
            dailyInvestmentLimit
          }), "Configuración normativa guardada");
          setAdminModal(null);
        }}>Guardar configuración</button>
      </Modal>

      <Modal title="Auditoría operativa" open={adminModal === "audit"} onClose={() => setAdminModal(null)}>
        <SectionTitle icon={WifiOff} title="Auditoría operativa" />
        <div className="ops-list">
          <div><strong>Conexión segura</strong><span>La sesión mantiene tus datos actualizados entre móvil y web.</span></div>
          <div><strong>Modo sin conexión</strong><span>La web conserva la última información disponible si pierdes señal.</span></div>
          <div><strong>Auditoría</strong><span>{state.complianceFlags.length} flags activos · {state.transactions.length} movimientos.</span></div>
        </div>
      </Modal>

      <Modal title="Usuarios y cuentas" open={adminModal === "users"} onClose={() => setAdminModal(null)}>
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
      </Modal>
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

function Modal({ title, open, onClose, children }: { title: string; open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="modal-panel" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()}>
        <header className="modal-header">
          <strong>{title}</strong>
          <button type="button" className="modal-close" aria-label="Cerrar" onClick={onClose}>×</button>
        </header>
        <div className="modal-body">
          {children}
        </div>
      </section>
    </div>
  );
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
  return <span className={`status-pill ${sync}`}>{sync === "online" ? "Al día" : sync === "loading" ? "Actualizando" : "Sin conexión"}</span>;
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
