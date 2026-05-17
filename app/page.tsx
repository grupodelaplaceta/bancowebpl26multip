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
import { usePathname } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Account,
  accountTypeLabel,
  AGLDP_ID,
  BankState,
  businessUsageFeePreview,
  chargeWeeklyTax,
  chargeWeeklyBusinessUsageFees,
  claimRbu,
  demoSeed,
  DigitalCard,
  emitMoney,
  finalizeState,
  formatMoneyPz,
  formatPz,
  forceVatRegularization,
  addSavedContact,
  createPaymentLink,
  dailyInvestmentCountForCompany,
  generatePlacezumCode,
  ibanGenerate,
  issueCard,
  issueOfficialFine,
  investmentRiskLimits,
  investmentRiskProfile,
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
  PaymentLink,
  SupportTicket,
  TGLP_ID,
  toggleCard,
  transferByIban,
  transferPayrollOrLoan,
  updateInvestmentFundRisk,
  updateTreasuryConfig,
  UserProfile,
  VAT_PERCENT
} from "../lib/bank";
import { gdlpNews, planProjects } from "../lib/gdlp-content";
import { generateBankPdf } from "../lib/pdf";
import { BANK_API_URL, BANK_SITE_URL, GDLP_SITE_URL, GDLP_SITE_URL_NO_WWW } from "../lib/site";
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

const developerApiCards = [
  { title: "Crear pago", method: "POST", path: `${BANK_API_URL}/api/developer-payments`, text: "Genera un pago firmado con importe neto, IVA y total a cobrar." },
  { title: "Consultar pago", method: "GET", path: `${BANK_API_URL}/api/developer-payments/{id}?token=...`, text: "Valida el token y recupera la ficha del pago para checkout externo." },
  { title: "Capturar pago", method: "POST", path: `${BANK_API_URL}/api/developer-payments/{id}/capture`, text: "Carga la cuenta pagadora, abona al comercio y separa el IVA hacia TGLP." }
];

const developerSnippet = `await fetch("${BANK_API_URL}/api/developer-payments", {
  method: "POST",
  headers: { "content-type": "application/json", "x-api-key": "TU_API_KEY" },
  body: JSON.stringify({
    merchantIban: "GDLP...",
    amountPz: 250,
    concept: "Pedido web #1042"
  })
});`;

const developerImplementationPack = {
  create: `const createResponse = await fetch("${BANK_API_URL}/api/developer-payments", {
  method: "POST",
  headers: {
    "content-type": "application/json",
    "x-api-key": "TU_API_KEY"
  },
  body: JSON.stringify({
    merchantIban: "GDLP-AP00-000",
    amountPz: 250,
    concept: "Pedido web #1042"
  })
});

const { payment, token, checkoutUrl } = await createResponse.json();`,
  captureIban: `const captureResponse = await fetch(\`${BANK_API_URL}/api/developer-payments/\${payment.id}/capture\`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    token,
    paymentCredential: "GDLP-AP00-000",
    verificationAccepted: payment.totalPz > 500
  })
});

const confirmation = await captureResponse.json();`,
  captureCard: `const cardCapture = await fetch(\`${BANK_API_URL}/api/developer-payments/\${payment.id}/capture\`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    token,
    paymentCredential: "183042",
    cardPin: "0000"
  })
});`
};

const channelCards = [
  { title: "Web escritorio", text: "Diseñada para revisar, comparar, descargar y gestionar operaciones con más espacio.", icon: MoreHorizontal, href: "/info/cuentas" },
  { title: "App Android", text: "Mantiene la operativa móvil diaria con la misma identidad y lógica de cuenta.", icon: WalletCards, href: "/info/seguridad" },
  { title: "Notificaciones", text: "Avisos opcionales en PC para movimientos, soporte y operaciones relevantes.", icon: Bell, href: "/info/seguridad" }
];

const footerColumns = [
  { title: "Banco", links: [{ label: "Cuentas", href: "/info/cuentas" }, { label: "Placezum", href: "/info/placezum" }, { label: "Tarjetas", href: "/info/tarjetas" }, { label: "Empresas", href: "/info/empresas" }] },
  { title: "Institución", links: [{ label: "Noticias", href: "/noticias" }, { label: "Plan 2026", href: "/plan-2026" }, { label: "Seguridad", href: "/info/seguridad" }, { label: "Soporte", href: "/info/soporte" }] },
  { title: "Legal", links: [{ label: "Términos", href: "/terminos-y-condiciones" }, { label: "Privacidad", href: "/politica-de-privacidad" }, { label: "Developers", href: "/info/developers" }, { label: "Contacto", href: "mailto:soporte@banco.laplaceta.org" }] }
];

const landingPages = [
  { id: "cuentas", title: "Cuentas", icon: WalletCards, image: "/assets/promos/promo2.png", text: "Consulta saldo, IBAN, actividad reciente y accesos de cuenta sin mezclar formularios en la pantalla principal.", bullets: ["Saldo y movimientos", "Transferencias por popup", "Documentos y extractos"] },
  { id: "placezum", title: "Placezum", icon: QrCode, image: "/assets/promos/placezum-default.png", text: "Pagos rápidos con código temporal, contactos guardados y límites visibles antes de enviar.", bullets: ["Código temporal", "Contactos", "Límite semanal"] },
  { id: "tarjetas", title: "Tarjetas", icon: CreditCard, image: "/assets/promocard.jpg", text: "Gestiona tarjetas digitales y Promo Card con estado claro y acciones separadas.", bullets: ["Emitir tarjeta", "Congelar o activar", "PIN y numeración"] },
  { id: "empresas", title: "Empresas", icon: Building2, image: "/assets/promos/mercado-default.png", text: "Panel para nóminas, alta de empresa, actividad y rentabilidad cuando la cuenta lo permite.", bullets: ["Nóminas", "Alta empresa", "Actividad asociada"] },
  { id: "soporte", title: "Soporte", icon: ShieldCheck, image: "/assets/logobanco.jpg", text: "Tickets con contexto de cuenta, tarjeta, inversión o movimiento para explicar mejor cada incidencia.", bullets: ["Estado del ticket", "Historial", "Contexto de cuenta"] },
  { id: "developers", title: "API Developers", icon: Lock, image: "/assets/promos/banco-default.png", text: "Pagos externos con token firmado, captura segura y desglose de IVA automático.", bullets: ["Crear pago", "Consultar estado", "Capturar con IVA"] }
];

const helpPosts = [
  { id: "guia-pagos", title: "Cómo enviar un pago sin errores", tag: "Pagos", image: "/assets/promos/placezum-default.png", text: "Revisa IBAN, importe y concepto antes de confirmar. La web separa el formulario en popup para evitar acciones accidentales." },
  { id: "inversiones-cuenta", title: "Qué cuenta usar para inversiones", tag: "Inversiones", image: "/assets/promos/mercado-default.png", text: "Solo la cuenta de inversión permite operar. Las cuentas empresa muestran alta, capital recibido y rentabilidad asociada." },
  { id: "ticket-soporte", title: "Cómo abrir un ticket útil", tag: "Soporte", image: "/assets/logobanco.jpg", text: "Incluye cuenta, tarjeta o movimiento relacionado para que la revisión sea más rápida y clara." }
];

const PLACETAID_BASE_URL = "https://id.laplaceta.org";
const PLACETAID_SERVICE_NAME = "BancodeLaPlacetaDev";

type PlacetaIdUserPayload = {
  dip?: string;
  nombre?: string;
  apellidos?: string;
  nombreCompleto?: string;
  edad?: number | null;
  rol?: string;
  accesoComo?: string;
};

function parsePlacetaIdUser(value: string): PlacetaIdUserPayload | null {
  const attempts = [value];
  try { attempts.push(decodeURIComponent(value)); } catch {}
  for (const candidate of attempts) {
    try {
      const parsed = JSON.parse(candidate);
      if (parsed && typeof parsed === "object") return parsed as PlacetaIdUserPayload;
    } catch {}
  }
  return null;
}

function hasPlacetaIdCallback() {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  return Boolean((params.get("placetaid_token") || params.get("token")) && params.get("user"));
}

function placetaIdFromDip(dip: string) {
  const compact = dip.toUpperCase().replace(/^DIP-/, "").replace(/[^A-Z0-9-]/g, "");
  return compact.slice(0, 18) || `PLID-${Date.now().toString().slice(-6)}`;
}

function citizenshipTierFromAge(age?: number | null) {
  if (typeof age !== "number" || !Number.isFinite(age)) return "CiudadaniaPlena";
  if (age < 16) return "JuniorBasica";
  if (age < 18) return "JuniorSenior";
  return "CiudadaniaPlena";
}

function applyPlacetaIdAge(base: BankState, dip: string, age?: number | null) {
  if (typeof age !== "number" || !Number.isFinite(age)) return base;
  const user = base.users.find((item) => item.dip === dip);
  if (!user) return base;
  const tier = citizenshipTierFromAge(age);
  return finalizeState({
    ...base,
    users: base.users.map((item) => item.dip === dip ? { ...item, verifiedAge: age } : item),
    accounts: base.accounts.map((account) =>
      account.placetaId === user.placetaId || account.id === user.primaryAccountId
        ? {
          ...account,
          citizenshipTier: account.type === "Business" ? account.citizenshipTier : tier,
          sendLimitPz: tier === "JuniorBasica" ? Math.min(account.sendLimitPz ?? 50, 50) : tier === "JuniorSenior" ? Math.min(account.sendLimitPz ?? 100, 100) : account.sendLimitPz
        }
        : account
    )
  });
}

async function registerPlacetaIdUser(base: BankState, payload: PlacetaIdUserPayload) {
  const normalizedDip = String(payload.dip || "").trim().toUpperCase();
  if (!normalizedDip) throw new Error("PlacetaID no devolvió DIP válido");
  const displayName = payload.nombreCompleto || [payload.nombre, payload.apellidos].filter(Boolean).join(" ") || normalizedDip;
  const accountId = `acct-plid-${crypto.randomUUID()}`;
  const createdAt = new Date().toISOString();
  const verifiedAge = typeof payload.edad === "number" ? payload.edad : null;
  const user: UserProfile = {
    dip: normalizedDip,
    displayName,
    placetaId: placetaIdFromDip(normalizedDip),
    pinHash: await sha256(`placetaid:${normalizedDip}`),
    primaryAccountId: accountId,
    verifiedAge,
    consentimiento_rgpd: true,
    consentimiento_rgpd_at: createdAt,
    createdAt
  };
  const account: Account = {
    id: accountId,
    displayName: "Cuenta PlacetaID",
    kind: "CITIZEN",
    balancePz: 500,
    placetaId: user.placetaId,
    role: "Citizen",
    type: "Current",
    iban: ibanGenerate(accountId),
    citizenshipTier: citizenshipTierFromAge(verifiedAge),
    complianceStatus: "Clear"
  };
  const admin = base.accounts.find((item) => item.id === AGLDP_ID);
  const welcome: LedgerTransaction = {
    id: `welcome-${crypto.randomUUID()}`,
    kind: "WelcomeBonus",
    fromAccountId: AGLDP_ID,
    toAccountId: account.id,
    amountPz: 500,
    ivaPz: 0,
    note: `Alta Banco de La Placeta mediante PlacetaID · ${PLACETAID_SERVICE_NAME}`,
    status: "Settled",
    createdAt,
    netAmount: 500,
    taxAmount: 0,
    concept: "WELCOME_BONUS",
    IBAN_Origin: admin?.iban || ibanGenerate(AGLDP_ID)
  };
  const card: DigitalCard = {
    id: `card-${crypto.randomUUID()}`,
    accountId,
    alias: "PlacetaID Card",
    tier: verifiedAge !== null && verifiedAge < 18 ? "Child" : "Standard",
    frozen: false,
    cardNumber: String(Math.floor(Math.random() * 1000000)).padStart(6, "0"),
    pin: "0000",
    released: true
  };
  const accounts = base.accounts.map((item) => item.id === AGLDP_ID ? { ...item, balancePz: Math.max(0, item.balancePz - 500) } : item);
  return {
    state: finalizeState({
      ...base,
      users: [...base.users, user].sort((left, right) => left.displayName.localeCompare(right.displayName)),
      accounts: [...accounts, account],
      transactions: [welcome, ...base.transactions],
      digitalCards: [...base.digitalCards, card]
    }),
    user
  };
}

async function createLocalRegisteredUser(base: BankState, normalizedDip: string, pin: string, displayName: string) {
  if (base.users.some((item) => item.dip === normalizedDip)) throw new Error("Ese DIP ya existe");
  const accountId = `acct-${crypto.randomUUID()}`;
  const createdAt = new Date().toISOString();
  const user: UserProfile = {
    dip: normalizedDip,
    displayName,
    placetaId: placetaIdFromDip(normalizedDip),
    pinHash: await sha256(pin),
    primaryAccountId: accountId,
    consentimiento_rgpd: true,
    consentimiento_rgpd_at: createdAt,
    createdAt
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
  const admin = base.accounts.find((item) => item.id === AGLDP_ID);
  const welcome: LedgerTransaction = {
    id: `welcome-${crypto.randomUUID()}`,
    kind: "WelcomeBonus",
    fromAccountId: AGLDP_ID,
    toAccountId: account.id,
    amountPz: 500,
    ivaPz: 0,
    note: "Bono de bienvenida Banco de La Placeta",
    status: "Settled",
    createdAt,
    netAmount: 500,
    taxAmount: 0,
    concept: "WELCOME_BONUS",
    IBAN_Origin: admin?.iban || ibanGenerate(AGLDP_ID)
  };
  const card: DigitalCard = {
    id: `card-${crypto.randomUUID()}`,
    accountId,
    alias: "Placeta Black",
    tier: "Standard",
    frozen: false,
    cardNumber: String(Math.floor(Math.random() * 1000000)).padStart(6, "0"),
    pin: "0000",
    released: true
  };
  const accounts = base.accounts.map((item) => item.id === AGLDP_ID ? { ...item, balancePz: Math.max(0, item.balancePz - 500) } : item);
  return {
    state: finalizeState({
      ...base,
      users: [...base.users, user].sort((left, right) => left.displayName.localeCompare(right.displayName)),
      accounts: [...accounts, account],
      transactions: [welcome, ...base.transactions],
      digitalCards: [...base.digitalCards, card]
    }),
    user
  };
}

export default function BancoPlacetaWeb() {
  return <BancoPlacetaClient />;
}

function BancoPlacetaClient() {
  const pathname = usePathname();
  const [state, setState] = useState<BankState>(() => normalizeState(null));
  const [activeUser, setActiveUser] = useState<UserProfile | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState("u-alba");
  const [tab, setTab] = useState<Tab>("home");
  const [sync, setSync] = useState<"loading" | "online" | "offline">("loading");
  const [hydrated, setHydrated] = useState(false);
  const [toast, setToast] = useState("");
  const [busyMessage, setBusyMessage] = useState("");
  const [placetaIdLoading, setPlacetaIdLoading] = useState(() => hasPlacetaIdCallback());
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | "unsupported">("default");
  const [notificationNow, setNotificationNow] = useState(0);
  const stateRef = useRef<BankState>(state);
  const persistInFlightRef = useRef(false);
  const operationInFlightRef = useRef(false);
  const remoteRefreshInFlightRef = useRef(false);
  const notificationSeenRef = useRef<Set<string>>(new Set());
  const notificationsReadyRef = useRef(false);
  const notificationUserRef = useRef("");
  const placetaIdCallbackHandledRef = useRef(false);

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
    const timer = window.setInterval(() => setNotificationNow(Date.now()), 5000);
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
    if (persistInFlightRef.current || operationInFlightRef.current || remoteRefreshInFlightRef.current) return;
    remoteRefreshInFlightRef.current = true;
    try {
      const response = await fetch("/api/bank-state", { cache: "no-store" });
      if (!response.ok) throw new Error("Servicio no disponible");
      const remote = normalizeState(await response.json());
      const current = stateRef.current;
      const remoteTime = Date.parse(remote.updatedAt || "");
      const currentTime = Date.parse(current.updatedAt || "");
      const canCompareDates = Number.isFinite(remoteTime) && Number.isFinite(currentTime);
      const remoteIsNewer = canCompareDates ? remoteTime > currentTime : remote.updatedAt !== current.updatedAt;
      if (remoteIsNewer) {
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
    const paymentLinks = (state.paymentLinks || []).filter((link) =>
      accountIds.has(link.creatorAccountId) || Boolean(link.usedByAccountId && accountIds.has(link.usedByAccountId))
    );
    const currentIds = [
      ...transactions.map((transaction) => `txn:${transaction.id}`),
      ...readyInvestments.map((operation) => `investment-ready:${operation.id}`),
      ...tickets.map((ticket) => `ticket:${ticket.id}:${ticket.updatedAt}`),
      ...paymentLinks.map((link) => `payment-link:${link.id}:${link.status}:${link.usedAt || link.createdAt}`)
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
      const counterpartyId = incoming ? transaction.fromAccountId : transaction.toAccountId;
      const counterparty = accountsById.get(counterpartyId)?.displayName || counterpartyId;
      pendingAlerts.push({
        id,
        title: incoming ? "Ingreso recibido" : "Movimiento enviado",
        body: `${transaction.kind} · ${formatPz(transaction.amountPz)} Pz · ${counterparty}`
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
    for (const link of paymentLinks) {
      const id = `payment-link:${link.id}:${link.status}:${link.usedAt || link.createdAt}`;
      if (notificationSeenRef.current.has(id)) continue;
      if (link.status === "Pending") continue;
      pendingAlerts.push({
        id,
        title: link.kind === "Payment" ? "Enlace de pago actualizado" : "Enlace de Placetas actualizado",
        body: `${link.status} · ${formatPz(link.totalPz)} Pz · ${link.concept}`
      });
    }

    if (!pendingAlerts.length) return;
    for (const alert of pendingAlerts) notificationSeenRef.current.add(alert.id);
    saveSeenNotifications();
    const latest = pendingAlerts.slice(-3);
    if (latest.length > 1 && document.visibilityState === "visible") {
      setToast(`${latest.length} actualizaciones nuevas`);
    }
    if (notificationPermission === "granted") latest.forEach((alert) => notifyDesktop(alert.title, alert.body, alert.id));
  }, [accountsById, activeUser, hydrated, notificationNow, notificationPermission, notifyDesktop, saveSeenNotifications, state, userAccounts]);

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

  async function fetchFreshState(applyToUi = true) {
    const response = await fetch("/api/bank-state", { cache: "no-store" });
    if (!response.ok) throw new Error("No se pudo leer el estado remoto");
    const remote = normalizeState(await response.json());
    if (applyToUi) {
      setState(remote);
      localStorage.setItem("placeta-web-state", JSON.stringify(remote));
    }
    setSync("online");
    return remote;
  }

  async function persist(next: BankState, message: string, baseUpdatedAt: string | null = stateRef.current.updatedAt || null) {
    if (persistInFlightRef.current) {
      setToast("Hay una operación guardándose. Espera un momento.");
      return false;
    }
    persistInFlightRef.current = true;
    setBusyMessage(message);
    const normalizedNext = normalizeState(next);
    setState(normalizedNext);
    setToast(message);
    localStorage.setItem("placeta-web-state", JSON.stringify(normalizedNext));
    try {
      const response = await fetch("/api/bank-state", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ state: normalizedNext, baseUpdatedAt })
      });
      setSync(response.ok ? "online" : "offline");
      if (response.ok) {
        setToast(`${message} · confirmado`);
        window.setTimeout(() => void silentRemoteRefresh(), 1200);
        return true;
      } else if (response.status === 409) {
        const conflict = await response.json();
        const remote = normalizeState(conflict.remote);
        setState(remote);
        localStorage.setItem("placeta-web-state", JSON.stringify(remote));
        setToast("Operación no aplicada: los datos cambiaron en otro dispositivo. Reintenta con el saldo actualizado.");
        return false;
      } else {
        setToast("No se pudo guardar. Revisa si había una operación duplicada o un conflicto de sincronización.");
        return false;
      }
    } catch {
      setSync("offline");
      setToast(`${message} · guardado localmente`);
      return true;
    } finally {
      persistInFlightRef.current = false;
      setBusyMessage("");
    }
  }

  async function runOperation(operation: (fresh: BankState) => BankState, message: string) {
    if (operationInFlightRef.current) {
      setToast("Hay una operación en curso. Espera la confirmación antes de repetir.");
      return;
    }
    operationInFlightRef.current = true;
    setBusyMessage(message);
    try {
      const fresh = await fetchFreshState(false);
      await persist(operation(fresh), message, fresh.updatedAt || null);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Operación rechazada");
    } finally {
      operationInFlightRef.current = false;
      setBusyMessage("");
    }
  }

  useEffect(() => {
    if (!hydrated || placetaIdCallbackHandledRef.current || typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const token = params.get("placetaid_token") || params.get("token");
    const rawUser = params.get("user");
    if (!token || !rawUser) return;

    placetaIdCallbackHandledRef.current = true;
    setPlacetaIdLoading(true);
    void (async () => {
      try {
        const placetaUser = parsePlacetaIdUser(rawUser);
        if (!placetaUser?.dip) throw new Error("PlacetaID no devolvió datos de usuario válidos");
        const returnedState = params.get("state") || "";
        const expectedState = localStorage.getItem("placetaidOauthState") || "";
        if (returnedState && expectedState && returnedState !== expectedState) throw new Error("Validación PlacetaID rechazada por state incorrecto");
        const normalizedDip = placetaUser.dip.trim().toUpperCase();
        localStorage.setItem("placetaidToken", token);
        localStorage.setItem("placetaidUser", JSON.stringify(placetaUser));
        localStorage.setItem("placetaidService", PLACETAID_SERVICE_NAME);
        localStorage.removeItem("placetaidOauthState");

        const fresh = sync === "online" ? await fetchFreshState(false).catch(() => stateRef.current) : stateRef.current;
        const existing = fresh.users.find((item) => item.dip === normalizedDip);
        if (existing) {
          const ageChecked = applyPlacetaIdAge(fresh, normalizedDip, placetaUser.edad);
          const refreshedUser = ageChecked.users.find((item) => item.dip === normalizedDip) || existing;
          if (ageChecked !== fresh) await persist(ageChecked, "Edad verificada con PlacetaID", fresh.updatedAt || null);
          setActiveUser(refreshedUser);
          setSelectedAccountId(refreshedUser.primaryAccountId);
          localStorage.setItem("placeta-web-dip", refreshedUser.dip);
          setToast(`Sesión iniciada con PlacetaID${typeof placetaUser.edad === "number" ? ` · edad ${placetaUser.edad}` : ""}`);
        } else {
          const registered = await registerPlacetaIdUser(fresh, placetaUser);
          await persist(registered.state, "Cuenta creada con PlacetaID", fresh.updatedAt || null);
          setActiveUser(registered.user);
          setSelectedAccountId(registered.user.primaryAccountId);
          localStorage.setItem("placeta-web-dip", registered.user.dip);
        }

        params.delete("token");
        params.delete("placetaid_token");
        params.delete("user");
        params.delete("platform");
        params.delete("expires_in");
        params.delete("state");
        const cleanUrl = `${window.location.pathname}${params.toString() ? `?${params}` : ""}${window.location.hash}`;
        window.history.replaceState({}, "", cleanUrl);
      } catch (error) {
        setToast(error instanceof Error ? error.message : "No se pudo iniciar sesión con PlacetaID");
      } finally {
        setPlacetaIdLoading(false);
      }
    })();
  }, [hydrated, sync]);

  if (placetaIdLoading) {
    return <PlacetaIdLoadingScreen sync={sync} />;
  }

  if (!activeUser) {
    return (
      <LoginScreen
        state={state}
        sync={sync}
        showLogin={pathname?.startsWith("/login") || false}
        onLogin={(user) => {
          setActiveUser(user);
          setSelectedAccountId(user.primaryAccountId);
          localStorage.setItem("placeta-web-dip", user.dip);
        }}
        onRegister={async (normalizedDip, pin, displayName) => {
          const fresh = await fetchFreshState(false).catch(() => stateRef.current);
          const registered = await createLocalRegisteredUser(fresh, normalizedDip, pin, displayName);
          const saved = await persist(registered.state, "DIP registrado en Banco de La Placeta", fresh.updatedAt || null);
          if (!saved) throw new Error("No se pudo completar el alta. Reintenta con los datos actualizados.");
          setActiveUser(registered.user);
          setSelectedAccountId(registered.user.primaryAccountId);
          localStorage.setItem("placeta-web-dip", registered.user.dip);
        }}
      />
    );
  }

  return (
    <main className={`app-shell ${busyMessage ? "is-busy" : ""}`}>
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
          onUpdateRisk={(accountId, level, listed) => runOperation((fresh) => updateInvestmentFundRisk(fresh, accountId, level, listed), "Riesgo del fondo actualizado")}
          onSettle={(operationId) => {
            if (operationInFlightRef.current) {
              setToast("Hay una operación en curso. Espera la confirmación antes de repetir.");
              return;
            }
            operationInFlightRef.current = true;
            setBusyMessage("Calculando resultado");
            void (async () => {
              try {
                const fresh = await fetchFreshState(false);
                const result = settleTimedInvestment(fresh, operationId);
                await persist(result.state, `${result.reveal.userWins ? "Resultado a favor" : "Resultado en contra"} · ${formatPz(result.reveal.amountPz)} Pz`, fresh.updatedAt || null);
              } catch (error) {
                setToast(error instanceof Error ? error.message : "Resultado no disponible");
              } finally {
                operationInFlightRef.current = false;
                setBusyMessage("");
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
      {busyMessage && (
        <div className="action-progress" role="status" aria-live="polite">
          <span />
          {busyMessage}
        </div>
      )}
    </main>
  );
}

function PlacetaIdLoadingScreen({ sync }: { sync: "loading" | "online" | "offline" }) {
  return (
    <main className="placetaid-loading-shell" role="status" aria-live="polite">
      <section className="placetaid-loading-card">
        <span className="placetaid-loading-logo">
          <Image src="/logo.png" alt="Banco de La Placeta" fill sizes="82px" priority />
        </span>
        <div className="placetaid-loading-orbit" aria-hidden="true">
          <span />
          <span />
          <ShieldCheck size={36} />
        </div>
        <p className="eyebrow">Acceso seguro</p>
        <h1>Conectando con PlacetaID</h1>
        <p>Estamos validando tu identidad y preparando tu sesión del Banco de La Placeta.</p>
        <div className="placetaid-loading-steps">
          <span className="done"><CheckCircle2 size={16} /> Token recibido</span>
          <span className={sync === "online" ? "done" : "active"}><ScanLine size={16} /> Sincronizando datos</span>
          <span className="active"><Sparkles size={16} /> Abriendo tu cuenta</span>
        </div>
      </section>
    </main>
  );
}

function LoginScreen({ state, sync, showLogin, onLogin, onRegister }: { state: BankState; sync: string; showLogin: boolean; onLogin: (user: UserProfile) => void; onRegister: (normalizedDip: string, pin: string, displayName: string) => Promise<void> }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [dip, setDip] = useState("DIP-A001");
  const [pin, setPin] = useState("1234");
  const [name, setName] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const activeSlide = landingSlides[slideIndex] ?? landingSlides[0];

  useEffect(() => {
    const timer = window.setInterval(() => setSlideIndex((value) => (value + 1) % landingSlides.length), 6500);
    return () => window.clearInterval(timer);
  }, []);

  function startPlacetaId() {
    if (typeof window === "undefined") return;
    const callbackUrl = `${window.location.origin}/`;
    const stateToken = crypto.randomUUID();
    localStorage.setItem("placetaidOauthState", stateToken);
    const url = new URL(`${PLACETAID_BASE_URL}/`);
    url.searchParams.set("from", callbackUrl);
    url.searchParams.set("platform", "web");
    url.searchParams.set("state", stateToken);
    url.searchParams.set("service", PLACETAID_SERVICE_NAME);
    window.location.href = url.toString();
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    const compactDip = dip.trim().toUpperCase();
    const normalizedDip = compactDip.startsWith("DIP-") ? compactDip : `DIP-${compactDip}`;
    if (mode === "login") {
      const user = state.users.find((item) => item.dip === normalizedDip);
      if (!user) return setError("DIP no registrado");
      if (user.pinHash !== await sha256(pin)) return setError("PIN incorrecto");
      return onLogin(user);
    }
    if (!/^DIP-[A-Z0-9]{4}$/.test(normalizedDip)) return setError("Formato DIP inválido. Usa DIP-XXXX");
    if (pin.length < 4 || name.trim().length < 2) return setError("Completa nombre y PIN de 4 dígitos");
    if (!consent) return setError("Debes aceptar los términos y la política de privacidad para registrarte");
    setSubmitting(true);
    try {
      await onRegister(normalizedDip, pin, name.trim());
    } catch (error) {
      setError(error instanceof Error ? error.message : "No se pudo completar el alta");
    } finally {
      setSubmitting(false);
    }
  }

  function switchMode(nextMode: "login" | "register") {
    setMode(nextMode);
    setError("");
    if (nextMode === "login") {
      setDip("DIP-A001");
      setPin("1234");
      setName("");
      setConsent(false);
    } else {
      setDip("DIP-");
      setPin("");
    }
  }

  return (
    <main className={`lp4-shell ${showLogin ? "login-page" : "landing-page"}`} id="inicio">
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
          <a href="#modulos">Módulos</a>
          <a href="/noticias">Noticias</a>
          <a href="/plan-2026">Plan 2026</a>
          <a href="/info/developers">Developers</a>
          <a href="#ayuda">Ayuda</a>
          <a className="lp4-link-cta" href="/login">Acceder</a>
        </nav>
      </header>

      <section className="lp4-hero">
        <Image src={activeSlide.image} alt={activeSlide.title} fill priority sizes="100vw" />
        <div className="lp4-hero-shade" />
        <div className={`lp4-hero-inner ${showLogin ? "" : "landing-only"}`}>
          <div className="lp4-hero-copy">
            <span>{activeSlide.kicker}</span>
            <h1>{activeSlide.title}</h1>
            <p>{activeSlide.subtitle}</p>
            <div className="lp4-hero-actions">
              <a href="/login">Entrar al banco</a>
              <a href="#modulos">Ver módulos</a>
            </div>
            <div className="lp4-hero-badges" aria-label="Puntos destacados">
              <span>{activeSlide.metric}</span>
              <span>Identidad GDLP</span>
              <span>Diseño responsive</span>
            </div>
            <div className="lp4-carousel-controls" aria-label="Carrusel Banco de La Placeta">
              {landingSlides.map((slide, index) => (
                <button
                  key={slide.title}
                  type="button"
                  className={index === slideIndex ? "active" : ""}
                  onClick={() => setSlideIndex(index)}
                  aria-label={`Ver ${slide.title}`}
                >
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{slide.kicker}</strong>
                  <small>{slide.metric}</small>
                </button>
              ))}
            </div>
          </div>

          {showLogin ? <form id="acceso" className="lp4-login" onSubmit={submit}>
            <div className="lp4-login-head">
              <span>{sync === "online" ? "Servicio conectado" : sync === "offline" ? "Modo sin conexión" : "Sincronizando datos"}</span>
              <h2>{mode === "login" ? "Acceso DIP" : "Crear acceso"}</h2>
            </div>
            <button type="button" className="placetaid-button" onClick={startPlacetaId}>
              <ShieldCheck size={19} />
              <span>
                <strong>Continuar con PlacetaID</strong>
                <small>Login o registro automático con identidad GDLP</small>
              </span>
            </button>
            <div className="login-divider"><span>o usa acceso local</span></div>
            <div className="segmented">
              <button type="button" className={mode === "login" ? "active" : ""} onClick={() => switchMode("login")}>Entrar</button>
              <button type="button" className={mode === "register" ? "active" : ""} onClick={() => switchMode("register")}>Registro</button>
            </div>
            {mode === "register" && <Field label="Nombre" value={name} onChange={setName} placeholder="Tu nombre" />}
            <Field label="DIP oficial" value={dip} onChange={setDip} placeholder="DIP-XXXX" />
            <Field label="PIN" value={pin} onChange={setPin} placeholder="1234" type="password" />
            {mode === "register" && (
              <label className="legal-consent">
                <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />
                <span>
                  He leído y acepto los <a href="/terminos-y-condiciones" target="_blank" rel="noreferrer">Términos y Condiciones</a> del Banco de La Placeta y consiento el tratamiento de mis datos de conexión según la <a href="/politica-de-privacidad" target="_blank" rel="noreferrer">Política de Privacidad</a>.
                </span>
              </label>
            )}
            {error && <p className="form-error">{error}</p>}
            <button className="primary-button" type="submit" disabled={submitting}>{submitting ? "Creando acceso..." : mode === "login" ? "Abrir banco" : "Crear DIP"}</button>
            <p className="login-hint">Demo: DIP-A001 / PIN 1234</p>
          </form> : (
            <aside className="lp4-carousel-panel" aria-label="Resumen del carrusel">
              <span>{activeSlide.action}</span>
              <strong>{activeSlide.metric}</strong>
              <p>La entrada DIP vive ahora en una página separada para mantener la landing limpia y comercial.</p>
              <a href="/login">Ir al acceso seguro</a>
            </aside>
          )}
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

      <section className="lp4-product" id="modulos">
        <div className="lp4-section-head">
          <span>Módulos</span>
          <h2>La información importante vive en subpáginas claras.</h2>
          <p>La portada resume lo esencial y cada módulo abre una vista útil con imagen, explicación, pasos y ayuda relacionada.</p>
        </div>
        <div className="lp4-service-grid lp4-info-grid">
          {landingPages.map((item) => {
            const Icon = item.icon;
            return (
              <a key={item.id} href={`/info/${item.id}`}>
                <span className="lp4-info-image">
                  <Image src={item.image} alt={item.title} fill sizes="(max-width: 760px) 100vw, 360px" />
                </span>
                <Icon size={22} />
                <strong>{item.title}</strong>
                <p>{item.text}</p>
              </a>
            );
          })}
        </div>
      </section>

      <section className="lp4-help lp4-plan-preview" id="plan-2026">
        <div className="lp4-section-head">
          <span>Plan 2026</span>
          <h2>Hoja de ruta estratégica, separada de las noticias.</h2>
          <p>Infraestructura, gobernanza, pagos y seguridad tienen páginas propias para compartir cada proyecto del plan.</p>
        </div>
        <div className="lp4-post-grid lp4-article-grid">
          {planProjects.slice(0, 3).map((project) => (
            <a key={project.slug} href={`/plan-2026/${project.slug}`}>
              <span className="lp4-info-image">
                <Image src={project.image} alt={project.title} fill sizes="(max-width: 760px) 100vw, 360px" />
              </span>
              <b>{project.status}</b>
              <strong>{project.title}</strong>
              <p>{project.summary}</p>
            </a>
          ))}
        </div>
        <a className="lp4-inline-link" href="/plan-2026">Ver Plan 2026 completo</a>
      </section>

      <section className="lp4-help" id="noticias">
        <div className="lp4-section-head">
          <span>Noticias</span>
          <h2>Comunicados y novedades con enlace propio.</h2>
          <p>Las noticias explican cambios, guías y avisos operativos. No se mezclan con la hoja de ruta del Plan 2026.</p>
        </div>
        <div className="lp4-post-grid lp4-article-grid">
          {gdlpNews.slice(0, 3).map((post) => (
            <a key={post.slug} href={`/noticias/${post.slug}`}>
              <span className="lp4-info-image">
                <Image src={post.image} alt={post.title} fill sizes="(max-width: 760px) 100vw, 360px" />
              </span>
              <b>{post.tag}</b>
              <strong>{post.title}</strong>
              <p>{post.summary}</p>
            </a>
          ))}
        </div>
        <a className="lp4-inline-link" href="/noticias">Ver todas las noticias</a>
      </section>

      <section className="lp4-showcase">
        <div className="lp4-card-visual">
          <Image src="/assets/promocard.jpg" alt="Tarjeta Banco de La Placeta" fill sizes="420px" />
          <div className="lp4-card-caption">
            <span>Banco de La Placeta</span>
            <strong>Tarjetas, pagos y documentos en una banca compacta</strong>
          </div>
        </div>
        <div className="lp4-flow">
          <span>Cómo se usa</span>
          <h2>Entra, elige módulo y confirma con contexto.</h2>
          <p>Las operaciones importantes usan popups y validaciones para que la pantalla principal no se llene de formularios.</p>
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

      <section className="lp4-channels" id="ayuda">
        <div className="lp4-section-head">
          <span>Ayuda rápida</span>
          <h2>Accesos útiles sin llenar la portada.</h2>
        </div>
        <div className="lp4-channel-grid">
          {[...channelCards, { title: "Centro de seguridad", text: "Buenas prácticas, límites y validación de operaciones.", icon: ShieldCheck, href: "/info/seguridad" }].map((item) => {
            const Icon = item.icon;
            return (
              <a key={item.title} href={item.href}>
                <Icon size={22} />
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.text}</p>
                </div>
              </a>
            );
          })}
        </div>
      </section>

      <section className="lp4-developers" id="developers">
        <div className="lp4-section-head">
          <span>API para Developers</span>
          <h2>Pagos externos seguros con IVA integrado.</h2>
          <p>Implementa Banco de La Placeta en webs y apps externas con pagos firmados, captura contra cuenta GDLP y desglose fiscal automático.</p>
        </div>
        <div className="developer-layout">
          <div className="developer-endpoints">
            {developerApiCards.map((item) => (
              <article key={item.path}>
                <span>{item.method}</span>
                <strong>{item.title}</strong>
                <code>{item.path}</code>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
          <div className="developer-code">
            <span>Ejemplo</span>
            <pre><code>{developerSnippet}</code></pre>
            <p>El importe enviado es neto. La API calcula IVA 12%, total, token firmado y al capturar mueve el IVA a TGLP.</p>
            <a className="lp4-inline-link" href="/info/developers">Ver documentación completa</a>
          </div>
        </div>
      </section>

      <section className="lp4-final-cta">
        <div>
          <span>Banco de La Placeta</span>
          <h2>Accede a tu banca web y continúa donde lo dejaste.</h2>
          <p>La web está pensada para operar, revisar y administrar con calma desde PC sin perder continuidad con la app.</p>
        </div>
        <a href="/login">Abrir acceso DIP</a>
      </section>

      <footer className="lp4-footer">
        <div className="lp4-footer-brand">
          <span className="lp4-logo small">
            <Image src="/logo.png" alt="Banco de La Placeta" fill sizes="46px" />
          </span>
          <div>
          <strong>Banco de La Placeta</strong>
            <p>Banca digital en {BANK_SITE_URL.replace("https://", "")}. Web GDLP: {GDLP_SITE_URL.replace("https://", "")} o {GDLP_SITE_URL_NO_WWW.replace("https://", "")}.</p>
          </div>
        </div>
        <div className="lp4-footer-columns">
          {footerColumns.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <strong>{column.title}</strong>
              {column.links.map((link) => <a key={link.label} href={link.href}>{link.label}</a>)}
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
  const [activeModal, setActiveModal] = useState<"pay" | "contacts" | "receive" | null>(null);
  const [tick, setTick] = useState(0);
  const codeWindow = Math.floor(tick / 120);
  const code = useMemo(() => generatePlacezumCode(account, new Date(codeWindow * 120000)), [account, codeWindow]);
  const secondsLeft = 120 - (tick % 120);
  const remaining = Math.max(0, limit - spent);
  const usagePercent = limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0;
  const safeAmount = Math.max(0, Math.min(amount, remaining));
  const quickAmounts = remaining > 0 ? [5, 12, 25, 50, 100].filter((value) => value <= Math.max(remaining, 5)) : [];
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
    <section className="screen-grid placezum-grid">
      <article className="placezum-card">
        <div className="placezum-code-copy">
          <p>Recibir con {user.placetaId}</p>
          <strong>{code}</strong>
          <span>Se renueva en {secondsLeft}s · {account.iban}</span>
        </div>
        <button className="placezum-qr" onClick={() => setActiveModal("receive")} aria-label="Ver código Placezum">
          <QrCode size={78} strokeWidth={1.5} />
        </button>
      </article>

      <div className="metric-grid placezum-metrics">
        <MetricCard label="Disponible" value={`${formatPz(remaining)} Pz`} tone="purple" />
        <MetricCard label="Usado semana" value={`${usagePercent}%`} tone="gold" />
        <MetricCard label="Contactos" value={String(favoriteAccounts.length)} tone="green" />
        <MetricCard label="Código" value={`${secondsLeft}s`} tone="purple" />
      </div>

      <article className="panel action-summary">
        <SectionTitle icon={ScanLine} title="Placezum" />
        <div className="placezum-actions">
          <button onClick={() => setActiveModal("pay")}><CircleDollarSign size={22} /><strong>Pagar</strong><span>A contacto guardado</span></button>
          <button onClick={() => setActiveModal("contacts")}><ShieldCheck size={22} /><strong>Contactos</strong><span>Añadir o quitar</span></button>
          <button onClick={() => setActiveModal("receive")}><QrCode size={22} /><strong>Recibir</strong><span>Código temporal</span></button>
        </div>
      </article>
      <article className="panel split-panel">
        <div><ShieldCheck size={23} /><strong>Límite semanal</strong><span>{formatPz(spent)} de {formatPz(limit)} Pz por Placezum</span><i className="placezum-progress"><b style={{ width: `${usagePercent}%` }} /></i></div>
        <div><Lock size={23} /><strong>Operación segura</strong><span>Valida IBAN, contacto y cupo antes de enviar</span></div>
      </article>

      <Modal title="Pagar con Placezum" open={activeModal === "pay"} onClose={() => setActiveModal(null)}>
        <Field label={`Importe Pz · disponible ${formatPz(remaining)}`} value={String(amount)} onChange={(value) => setAmount(Number(value) || 0)} type="number" />
        <div className="amount-chips">
          {quickAmounts.map((value) => (
            <button key={value} className={safeAmount === value ? "active" : ""} onClick={() => setAmount(value)}>{formatPz(value)}</button>
          ))}
        </div>
        {favoriteAccounts.length ? (
          <div className="contact-list">
            {favoriteAccounts.map((target) => (
              <div key={target.id} className="contact-item">
                <button className="contact-pay" disabled={safeAmount <= 0} onClick={() => {
                  onPay(target.id, safeAmount);
                  setActiveModal(null);
                }}>
                  <span>{target.displayName.slice(0, 1).toUpperCase()}</span>
                  <strong>{target.displayName}</strong>
                  <small>{target.iban} · {generatePlacezumCode(target)}</small>
                </button>
                <button className="contact-remove" aria-label={`Eliminar ${target.displayName}`} onClick={() => onRemoveContact(target.id)}>Quitar</button>
              </div>
            ))}
          </div>
        ) : <Empty title="Sin contactos" text="Añade un IBAN o Placeta ID para pagar por Placezum." />}
      </Modal>

      <Modal title="Contactos Placezum" open={activeModal === "contacts"} onClose={() => setActiveModal(null)}>
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
                <button className="contact-pay" onClick={() => {
                  setContactQuery(target.iban);
                  setActiveModal("pay");
                }}>
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

      <Modal title="Recibir con Placezum" open={activeModal === "receive"} onClose={() => setActiveModal(null)}>
        <div className="placezum-receive">
          <div className="placezum-receive-qr"><QrCode size={120} strokeWidth={1.3} /></div>
          <span>Código temporal</span>
          <strong>{code}</strong>
          <p>{account.displayName} · {account.iban}</p>
          <div className="payroll-summary">
            <div><span>Renueva en</span><strong>{secondsLeft}s</strong></div>
            <div><span>Placeta ID</span><strong>{user.placetaId}</strong></div>
            <div><span>Estado</span><strong>{account.complianceStatus || "Clear"}</strong></div>
            <div><span>Límite restante</span><strong>{formatPz(remaining)} Pz</strong></div>
          </div>
        </div>
      </Modal>
    </section>
  );
}

function MarketScreen({ state, account, onStart, onSettle, onUpdateRisk }: {
  state: BankState;
  account: Account;
  onStart: (marketId: string, amount: number) => void;
  onSettle: (operationId: string) => void;
  onUpdateRisk: (accountId: string, level: number, listedInvestmentFund: boolean) => void;
}) {
  const [amount, setAmount] = useState(120);
  const [now, setNow] = useState(Date.now());
  const [riskDraft, setRiskDraft] = useState(account.investmentRiskLevel || 3);
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
  const companySettlementRows = companySettlements.map((settlement) => {
    const sourceBuy = companyBuys.find((buy) =>
      settlement.originalTransactionId === buy.id ||
      settlement.note.includes(`[op-${buy.id}]`)
    ) || [...companyBuys].reverse().find((buy) =>
      buy.fromAccountId === settlement.toAccountId &&
      Date.parse(buy.createdAt) < Date.parse(settlement.createdAt)
    );
    const principalPz = sourceBuy?.amountPz || 0;
    const companyResultPz = principalPz > 0 ? principalPz - settlement.amountPz : 0;
    return { settlement, principalPz, companyResultPz };
  });
  const companySettledPrincipal = companySettlementRows.reduce((sum, row) => sum + row.principalPz, 0);
  const companyClosedMargin = companySettlementRows.reduce((sum, row) => sum + row.companyResultPz, 0);
  const companyOpenCapital = companyOpen.reduce((sum, operation) => sum + operation.amountPz, 0);
  const companyRoi = companySettledPrincipal > 0 ? Math.round((companyClosedMargin / companySettledPrincipal) * 100) : 0;
  const companyInvestorLosses = companySettlementRows.filter((row) => row.companyResultPz > 0).length;
  const companyInvestorWins = companySettlementRows.filter((row) => row.companyResultPz < 0).length;
  const companyInvestors = new Set(companyBuys.map((transaction) => transaction.fromAccountId)).size;
  const today = new Date().toISOString().slice(0, 10);
  const companyDailyCounts = new Map(market.map((fund) => [fund.id, dailyInvestmentCountForCompany(state, account.id, fund.id, today)]));
  const companyDailyLimits = new Map(market.map((fund) => [fund.id, investmentRiskLimits(state.treasuryConfig, fund.investmentRiskLevel || 3)]));
  const remainingToday = Math.max(0, ...market.map((fund) => (companyDailyLimits.get(fund.id)?.dailyLimit || 1) - (companyDailyCounts.get(fund.id) || 0)));
  const pendingCapital = pending.reduce((sum, operation) => sum + operation.amountPz, 0);
  const maxAmount = state.treasuryConfig.maxInvestmentAmountPz;
  const safeAmount = Math.min(Math.max(0, amount), maxAmount);
  const quickAmounts = [100, 250, 500, maxAmount].filter((value, index, all) => value <= maxAmount && all.indexOf(value) === index);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    setRiskDraft(account.investmentRiskLevel || 3);
  }, [account.id, account.investmentRiskLevel]);

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
          <MetricCard label="Pagado a usuarios" value={`${formatPz(companyPaid)} Pz`} tone="gold" />
          <MetricCard label="Margen cerrado" value={`${companyRoi >= 0 ? "+" : ""}${companyRoi}%`} tone={companyRoi >= 0 ? "green" : "red"} />
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
          <SectionTitle icon={TrendingUp} title="Riesgo del fondo" />
          <RiskIndicator level={riskDraft} />
          <div className="risk-selector" aria-label="Editar riesgo del fondo">
            {[1, 2, 3, 4, 5, 6, 7].map((level) => (
              <button key={level} className={riskDraft === level ? "active" : ""} onClick={() => setRiskDraft(level)}>
                R{level}
              </button>
            ))}
          </div>
          <button className="primary-button" onClick={() => onUpdateRisk(account.id, riskDraft, true)}>
            {account.listedInvestmentFund ? "Actualizar ficha de fondo" : "Dar de alta como fondo"}
          </button>
          <p className="muted">El indicador va de 1 a 7. Cuanto más alto, mayor variación potencial y mayor probabilidad de pérdida para quien invierte.</p>
        </article>
        <article className="panel investment-analysis company-analysis">
          <SectionTitle icon={Sparkles} title="Rentabilidad empresa" />
          <div className="analysis-grid">
            <div><span>Margen cerrado empresa</span><strong className={companyClosedMargin >= 0 ? "good" : "bad"}>{companyClosedMargin >= 0 ? "+" : ""}{formatPz(companyClosedMargin)} Pz</strong></div>
            <div><span>Usuarios en pérdida</span><strong>{companyInvestorLosses}/{companySettlements.length}</strong></div>
            <div><span>Usuarios en ganancia</span><strong>{companyInvestorWins}/{companySettlements.length}</strong></div>
            <div><span>Capital abierto</span><strong>{formatPz(companyOpenCapital)} Pz</strong></div>
          </div>
          <p className="muted">Para la empresa, la rentabilidad es positiva cuando devuelve menos de lo captado en una operación cerrada. Si el usuario pierde, ese margen queda a favor del fondo; el capital abierto aún no cuenta como resultado.</p>
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
          {[...companyBuys, ...companySettlements].sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt)).slice(0, 8).map((transaction) => {
            const isPayout = transaction.kind === "InvestmentSell";
            return (
              <div className={`investment-row ${isPayout ? "loss" : ""}`} key={transaction.id}>
                <div>
                  <strong>{transaction.kind === "InvestmentBuy" ? "Capital recibido" : "Pago al usuario"}</strong>
                  <span>{transaction.createdAt.slice(0, 10)} · {transaction.note}</span>
                </div>
                <b>{isPayout ? "-" : "+"}{formatPz(transaction.amountPz)} Pz</b>
              </div>
            );
          })}
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
        <p>{pending.length} abiertas · cupo por empresa según riesgo · resultado reciente {totalNetResult >= 0 ? "+" : ""}{formatPz(totalNetResult)} Pz</p>
      </article>
      <div className="metric-grid market-metrics">
        <MetricCard label="Disponible" value={`${formatPz(account.balancePz)} Pz`} tone="purple" />
        <MetricCard label="Pendiente 60s" value={`${formatPz(pendingCapital)} Pz`} tone="gold" />
        <MetricCard label="Mejor cupo hoy" value={`${remainingToday}`} tone="green" />
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
        <Field label={`Importe Pz · máximo base ${formatPz(maxAmount)}`} value={String(amount)} onChange={(value) => setAmount(Number(value) || 0)} type="number" />
        <div className="amount-chips">
          {quickAmounts.map((value) => (
            <button key={value} className={safeAmount === value ? "active" : ""} onClick={() => setAmount(value)}>
              {value === maxAmount ? "Máx" : formatPz(value)}
            </button>
          ))}
        </div>
        <div className="investment-rules">
          <div><strong>{formatPz(safeAmount)} Pz</strong><span>importe preparado</span></div>
          <div><strong>{remainingToday}</strong><span>mejor cupo restante</span></div>
        </div>
        <p className="muted">Cada empresa tiene su propio cupo diario. A mayor riesgo, menor importe máximo y menos operaciones disponibles para ese fondo.</p>
      </article>
      <article className="panel market-funds-panel">
        <SectionTitle icon={TrendingUp} title="Fondos GDLP" />
        <div className="fund-list">
          {market.map((fund) => {
            const risk = fund.investmentRiskLevel || 3;
            const limits = companyDailyLimits.get(fund.id) || investmentRiskLimits(state.treasuryConfig, risk);
            const profile = investmentRiskProfile(risk);
            const usedToday = companyDailyCounts.get(fund.id) || 0;
            const remainingForFund = Math.max(0, limits.dailyLimit - usedToday);
            const canInvestFund = isInvestmentAccount && remainingForFund > 0 && safeAmount > 0 && safeAmount <= limits.maxAmountPz;
            return (
              <button key={fund.id} className="fund-card" disabled={!canInvestFund} onClick={() => onStart(fund.id, safeAmount)}>
                <div>
                  <strong>{fund.displayName} <RiskBadge level={risk} /></strong>
                  <span>Máx {formatPz(limits.maxAmountPz)} Pz · {remainingForFund}/{limits.dailyLimit} hoy · {limits.allowedPercent}% base</span>
                  <span>Prob. usuario {profile.userWinProbabilityPercent}% · si gana +{profile.winMovementMinPercent}-{profile.winMovementMaxPercent}%</span>
                  <RiskIndicator level={risk} compact />
                </div>
                <b>{canInvestFund ? "Invertir" : safeAmount > limits.maxAmountPz ? "Baja importe" : "Sin cupo"}</b>
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
  const [linkKind, setLinkKind] = useState<"Payment" | "Send">("Payment");
  const [linkAmount, setLinkAmount] = useState(100);
  const [linkConcept, setLinkConcept] = useState("Pago Banco de La Placeta");
  const [linkTargetIban, setLinkTargetIban] = useState("");
  const [lastLinkUrl, setLastLinkUrl] = useState("");
  const [hubModal, setHubModal] = useState<"payroll" | "support" | "accounts" | "documents" | "activity" | "developers" | "links" | null>(null);
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
  const paymentLinks = ((state.paymentLinks || []) as PaymentLink[]).filter((link) => userAccounts.some((account) => account.id === link.creatorAccountId)).slice(0, 6);
  const primaryAccount = userAccounts.find((account) => account.id === user.primaryAccountId) || userAccounts[0];
  const linkSelectedAccount = linkKind === "Payment"
    ? (business || userAccounts.find((account) => account.type === "Business") || primaryAccount)
    : primaryAccount;
  const linkAccountRole = linkKind === "Payment" ? "destino de cobro" : "destino receptor";
  const linkIvaPreview = linkKind === "Payment" && linkSelectedAccount?.type === "Business" ? Math.ceil((Math.max(1, Math.round(linkAmount || 0)) * VAT_PERCENT) / 100) : 0;
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

  function linkUrl(id: string) {
    return `${BANK_SITE_URL}/pay-link/${id}`;
  }

  async function copyText(value: string) {
    if (typeof navigator !== "undefined" && navigator.clipboard) await navigator.clipboard.writeText(value);
  }

  function submitPaymentLink() {
    const source = linkSelectedAccount;
    if (!source) return;
    const next = createPaymentLink(state, source.id, linkKind, linkAmount, linkConcept, linkTargetIban || undefined);
    const created = next.paymentLinks[0];
    const url = linkUrl(created.id);
    setLastLinkUrl(url);
    void copyText(url);
    onPersist(next, `${linkKind === "Payment" ? "Enlace de pago" : "Enlace de envío"} creado`);
  }

  const openTickets = tickets.filter((ticket) => ticket.status !== "Closed").length;
  const activeCards = cards.filter((card) => !card.frozen).length;
  const hubActions = [
    { id: "payroll" as const, title: "Nóminas", detail: businessAccounts.length ? `${businessAccounts.length} empresas disponibles` : "Sin empresa vinculada", icon: Banknote },
    { id: "support" as const, title: "Soporte", detail: openTickets ? `${openTickets} tickets abiertos` : "Abrir ticket con contexto", icon: ShieldCheck },
    { id: "accounts" as const, title: "Cuentas", detail: `${userAccounts.length} cuentas vinculadas`, icon: Landmark },
    { id: "documents" as const, title: "Documentos", detail: "Extractos y certificados", icon: Download },
    { id: "activity" as const, title: "Actividad", detail: `${recent.length} movimientos recientes`, icon: Sparkles },
    { id: "links" as const, title: "Enlaces", detail: "Pagos y envíos", icon: QrCode },
    { id: "developers" as const, title: "Developers", detail: "API pagos + IVA", icon: Lock }
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

      <Modal title="API para Developers" open={hubModal === "developers"} onClose={() => setHubModal(null)}>
        <SectionTitle icon={Lock} title="API para Developers" />
        <div className="developer-modal">
          <p className="muted">Pack listo para implementar en webs y apps externas. El comercio crea un pago neto, la API calcula IVA 12%, firma el token y captura con IBAN/PlacetaID o tarjeta + PIN.</p>
          <div className="developer-endpoints compact">
            {developerApiCards.map((item) => (
              <article key={item.path}>
                <span>{item.method}</span>
                <strong>{item.title}</strong>
                <code>{item.path}</code>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
          <div className="implementation-pack">
            <div className="developer-code">
              <span>1 · Crear pago firmado</span>
              <pre><code>{developerImplementationPack.create}</code></pre>
              <button onClick={() => copyText(developerImplementationPack.create)}>Copiar implementación</button>
            </div>
            <div className="developer-code">
              <span>2 · Capturar con IBAN o PlacetaID</span>
              <pre><code>{developerImplementationPack.captureIban}</code></pre>
              <button onClick={() => copyText(developerImplementationPack.captureIban)}>Copiar captura IBAN</button>
            </div>
            <div className="developer-code">
              <span>3 · Capturar con tarjeta + PIN</span>
              <pre><code>{developerImplementationPack.captureCard}</code></pre>
              <button onClick={() => copyText(developerImplementationPack.captureCard)}>Copiar captura tarjeta</button>
            </div>
          </div>
          <div className="payroll-summary">
            <div><span>IVA</span><strong>12%</strong></div>
            <div><span>Tasa semanal API</span><strong>{state.treasuryConfig.weeklyDeveloperApiFeePercent}%</strong></div>
            <div><span>Cuenta</span><strong>IBAN / PlacetaID</strong></div>
            <div><span>Tarjeta</span><strong>PIN obligatorio</strong></div>
          </div>
        </div>
      </Modal>

      <Modal title="Enlaces de pago y envío" open={hubModal === "links"} onClose={() => setHubModal(null)}>
        <SectionTitle icon={QrCode} title="Enlaces de pago y envío" />
        <div className="segmented">
          <button className={linkKind === "Payment" ? "active" : ""} onClick={() => setLinkKind("Payment")}>Cobrar</button>
          <button className={linkKind === "Send" ? "active" : ""} onClick={() => setLinkKind("Send")}>Recibir Placetas</button>
        </div>
        <Field label="Importe Pz" value={String(linkAmount)} onChange={(value) => setLinkAmount(Number(value) || 0)} type="number" />
        <Field label="Concepto" value={linkConcept} onChange={setLinkConcept} placeholder="Pedido, reserva o envío" />
        {linkKind === "Send" && <Field label="Referencia IBAN opcional" value={linkTargetIban} onChange={setLinkTargetIban} placeholder="GDLP-... (solo referencia)" />}
        {linkSelectedAccount && (
          <div className="link-account-notice">
            <Landmark size={20} />
            <div>
              <strong>Se usará esta cuenta como {linkAccountRole}</strong>
              <span>{linkSelectedAccount.displayName} · {linkSelectedAccount.iban} · {formatPz(linkSelectedAccount.balancePz)} Pz</span>
            </div>
          </div>
        )}
        <div className="payroll-summary">
          <div><span>IVA empresa</span><strong>{linkKind === "Payment" ? `${formatPz(linkIvaPreview)} Pz` : "0 Pz"}</strong></div>
          <div><span>Tasa semanal</span><strong>{state.treasuryConfig.weeklyPaymentLinkFeePercent}%</strong></div>
          <div><span>Uso</span><strong>Único</strong></div>
          <div><span>Apertura</span><strong>Web/App</strong></div>
        </div>
        <p className="muted">Empresas: los enlaces de cobro sirven para pedidos, reservas o facturas. No los uses para enviar salarios; las nóminas deben registrarse desde el módulo de nóminas.</p>
        <button className="primary-button" disabled={linkAmount <= 0} onClick={submitPaymentLink}>Crear y copiar enlace</button>
        {lastLinkUrl && <button className="link-copy" onClick={() => copyText(lastLinkUrl)}>{lastLinkUrl}</button>}
        <div className="support-thread">
          {paymentLinks.map((link) => (
            <div key={link.id}>
              <strong>{link.kind === "Payment" ? "Pago" : "Envío"} · {formatPz(link.totalPz)} Pz · {link.status}</strong>
              <span>{link.concept} · {linkUrl(link.id)}</span>
            </div>
          ))}
          {!paymentLinks.length && <div><strong>Sin enlaces</strong><span>Crea un enlace para cobrar o recibir Placetas.</span></div>}
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
  const [developerApiFee, setDeveloperApiFee] = useState(state.treasuryConfig.weeklyDeveloperApiFeePercent);
  const [paymentLinkFee, setPaymentLinkFee] = useState(state.treasuryConfig.weeklyPaymentLinkFeePercent);
  const [opTax, setOpTax] = useState(state.treasuryConfig.operationalTransferTaxPercent);
  const [placezumLimit, setPlacezumLimit] = useState(state.treasuryConfig.placezumWeeklyLimitPz);
  const [investmentMax, setInvestmentMax] = useState(state.treasuryConfig.maxInvestmentAmountPz);
  const [dailyInvestmentLimit, setDailyInvestmentLimit] = useState(state.treasuryConfig.dailyInvestmentLimit);
  const [adminModal, setAdminModal] = useState<"emission" | "policy" | "businessFees" | "audit" | "users" | null>(null);
  const agldp = state.accounts.find((item) => item.id === AGLDP_ID);
  const totalMoney = state.accounts.reduce((sum, account) => sum + Math.max(0, account.balancePz), 0);
  const businessCount = state.accounts.filter((account) => account.type === "Business").length;
  const pendingRequests = state.subsidyRequests.filter((request) => request.status === "Pending").length;
  const adminActions = [
    { id: "emission" as const, title: "Emisión", detail: `Preparado ${formatPz(amount)} Pz`, icon: Landmark },
    { id: "policy" as const, title: "Normativa", detail: "Límites, tasas e inversión", icon: ShieldCheck },
    { id: "businessFees" as const, title: "Tasas empresa", detail: "API y enlaces semanales", icon: Banknote },
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
        <MetricCard label="Developers" value="API" tone="gold" />
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
          <div><strong>Normativa activa</strong><span>Placezum {formatPz(state.treasuryConfig.placezumWeeklyLimitPz)} Pz · API {state.treasuryConfig.weeklyDeveloperApiFeePercent}% · enlaces {state.treasuryConfig.weeklyPaymentLinkFeePercent}%</span></div>
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
          <Field label="Tasa semanal API pagos %" value={String(developerApiFee)} onChange={(value) => setDeveloperApiFee(Number(value) || 0)} type="number" />
          <Field label="Tasa semanal enlaces empresa %" value={String(paymentLinkFee)} onChange={(value) => setPaymentLinkFee(Number(value) || 0)} type="number" />
          <Field label="Tasa operativa %" value={String(opTax)} onChange={(value) => setOpTax(Number(value) || 0)} type="number" />
          <Field label="Placezum semanal" value={String(placezumLimit)} onChange={(value) => setPlacezumLimit(Number(value) || 0)} type="number" />
          <Field label="Máx inversión" value={String(investmentMax)} onChange={(value) => setInvestmentMax(Number(value) || 0)} type="number" />
          <Field label="Inversiones/día" value={String(dailyInvestmentLimit)} onChange={(value) => setDailyInvestmentLimit(Number(value) || 0)} type="number" />
        </div>
        <button className="primary-button" onClick={() => {
          onPersist(updateTreasuryConfig(state, {
            weeklyTaxPercent: weeklyTax,
            weeklyDeveloperApiFeePercent: developerApiFee,
            weeklyPaymentLinkFeePercent: paymentLinkFee,
            operationalTransferTaxPercent: opTax,
            placezumWeeklyLimitPz: placezumLimit,
            maxInvestmentAmountPz: investmentMax,
            dailyInvestmentLimit
          }), "Configuración normativa guardada");
          setAdminModal(null);
        }}>Guardar configuración</button>
      </Modal>

      <Modal title="Tasas semanales de empresa" open={adminModal === "businessFees"} onClose={() => setAdminModal(null)}>
        <SectionTitle icon={Banknote} title="API de pagos y enlaces" />
        <p className="muted">Liquida semanalmente el uso de API de pagos y enlaces creados por empresas. Los enlaces de cobro no sustituyen el módulo de nóminas ni deben usarse para enviar salarios.</p>
        <div className="ops-list">
          {state.accounts.filter((account) => account.type === "Business").map((business) => {
            const preview = businessUsageFeePreview(state, business.id);
            return (
              <div key={business.id}>
                <strong>{business.displayName}</strong>
                <span>API base {formatPz(preview.apiBasePz)} Pz · enlaces base {formatPz(preview.linkBasePz)} Pz · tasa {formatPz(preview.totalFeePz)} Pz · semana {preview.weekKey}</span>
                <button className="mini-action" disabled={preview.totalFeePz <= 0 || preview.alreadyCharged} onClick={() => onPersist(chargeWeeklyBusinessUsageFees(state, business.id), "Tasas semanales de empresa cobradas")}>
                  {preview.alreadyCharged ? "Cobrada" : "Cobrar tasas"}
                </button>
              </div>
            );
          })}
        </div>
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

function RiskBadge({ level }: { level: number }) {
  const safeLevel = clampRisk(level);
  return <span className={`risk-badge risk-${safeLevel}`}>R{safeLevel}</span>;
}

function RiskIndicator({ level, compact = false }: { level: number; compact?: boolean }) {
  const safeLevel = clampRisk(level);
  const profile = investmentRiskProfile(safeLevel);
  return (
    <div className={`risk-indicator ${compact ? "compact" : ""}`}>
      <div className="risk-indicator-head">
        <strong>Riesgo {safeLevel}/7</strong>
        <span>{riskLabel(safeLevel)} · {profile.userWinProbabilityPercent}% usuario</span>
      </div>
      <div className="risk-bar" aria-label={`Riesgo ${safeLevel} de 7`}>
        {[1, 2, 3, 4, 5, 6, 7].map((item) => (
          <span key={item} className={item <= safeLevel ? `active risk-${item}` : ""} />
        ))}
      </div>
      {!compact && <p className="risk-description">{riskDescription(safeLevel)} Si sale a favor, resultado estimado +{profile.winMovementMinPercent}-{profile.winMovementMaxPercent}%.</p>}
    </div>
  );
}

function clampRisk(level: number) {
  const numeric = Number.isFinite(level) ? level : 3;
  return Math.min(7, Math.max(1, Math.round(numeric)));
}

function riskLabel(level: number) {
  const safeLevel = clampRisk(level);
  if (safeLevel <= 2) return "Conservador";
  if (safeLevel <= 4) return "Moderado";
  if (safeLevel <= 6) return "Dinámico";
  return "Muy alto";
}

function riskDescription(level: number) {
  const safeLevel = clampRisk(level);
  if (safeLevel === 1) return "Riesgo muy bajo: variación limitada, pérdidas menos probables.";
  if (safeLevel === 2) return "Riesgo bajo: exposición moderada a movimientos negativos.";
  if (safeLevel === 3) return "Riesgo medio-bajo: puede fluctuar, adecuado para importes prudentes.";
  if (safeLevel === 4) return "Riesgo medio: equilibrio entre probabilidad y resultado potencial.";
  if (safeLevel === 5) return "Riesgo alto: ganar es menos probable, pero el resultado a favor sube.";
  if (safeLevel === 6) return "Riesgo muy alto: probabilidad menor para el usuario y pago potencial superior.";
  return "Riesgo extremo: probabilidad baja para el usuario, con el mayor porcentaje si acierta.";
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
