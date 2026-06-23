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
  Mail,
  MessageCircle,
  ShieldCheck,
  Smartphone,
  Sparkles,
  TrendingUp,
  WalletCards,
  WifiOff
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import {
  Account,
  accountTypeAccountLimit,
  accountTypeBalanceLimit,
  AccountType,
  accountTypeLabel,
  AGLDP_ID,
  AndroidBetaSignup,
  BankState,
  chargeWeeklyTax,
  chargeMonthlyTaxes,
  taxPeriodDocumentId,
  changeAccountType,
  claimRbu,
  closeBankAccount,
  DigitalCard,
  finalizeState,
  formatMoneyPz,
  formatPz,
  forceVatRegularization,
  addSavedContact,
  createPaymentLink,
  createBankAccount,
  dailyInvestmentCountForCompany,
  generatePlacezumCode,
  ibanGenerate,
  issueCard,
  issueOfficialFine,
  isAccountClosed,
  investmentRiskLimits,
  investmentRiskProfile,
  LedgerTransaction,
  MAX_VIRTUAL_CARDS_PER_ACCOUNT,
  mutableAccountTypesFor,
  investmentResultRows,
  normalizeIban,
  normalizeState,
  payPlacezum,
  pendingInvestmentOperations,
  placezumWeekSpent,
  removeSavedContact,
  settleTimedInvestment,
  sha256,
  startTimedInvestment,
  PaymentLink,
  PayrollContract,
  PayrollPeriod,
  SupportTicket,
  TGLP_ID,
  toggleCard,
  transferCostPreview,
  transferByIban,
  transferPayrollOrLoan,
  updateInvestmentFundRisk,
  UserProfile,
  VAT_PERCENT
} from "../lib/bank";
import { generateBankPdf } from "../lib/pdf";
import { BANK_SITE_URL } from "../lib/site";
import type { WebDocumentKind } from "../lib/pdf";

type Tab = "home" | "placezum" | "market" | "hub" | "tributos";

const tabs: Array<{ id: Tab; label: string; icon: LucideIcon }> = [
  { id: "home", label: "Inicio", icon: Home },
  { id: "placezum", label: "Placezum", icon: QrCode },
  { id: "market", label: "Mercado", icon: TrendingUp },
  { id: "hub", label: "Hub", icon: MoreHorizontal },
  { id: "tributos", label: "TGLP", icon: Gavel }
];

const webCarouselSlides = [
  {
    title: "Banco de La Placeta",
    image: "/assets/promoscarrusel/1.png"
  },
  {
    title: "Operativa diaria sin ruido",
    image: "/assets/promoscarrusel/7.png"
  }
];

const developerApiCards = [
  { title: "Crear pago", method: "POST", path: `${BANK_SITE_URL}/api/developer-payments`, text: "Genera un pago firmado con importe neto, IVA y total a cobrar." },
  { title: "Consultar pago", method: "GET", path: `${BANK_SITE_URL}/api/developer-payments/{id}?token=...`, text: "Valida el token y recupera la ficha del pago para checkout externo." },
  { title: "Capturar pago", method: "POST", path: `${BANK_SITE_URL}/api/developer-payments/{id}/capture`, text: "Carga la cuenta pagadora, abona al comercio y separa el IVA hacia TGLP." }
];

const developerImplementationPack = {
  create: `const createResponse = await fetch("${BANK_SITE_URL}/api/developer-payments", {
  method: "POST",
  headers: {
    "content-type": "application/json",
    "x-api-key": "TU_API_KEY"
  },
  body: JSON.stringify({
    merchantIban: "GDLP-0013-0000",
    amountPz: 250,
    concept: "Pedido web #1042"
  })
});

const { payment, token, checkoutUrl } = await createResponse.json();`,
  captureIban: `const captureResponse = await fetch(\`${BANK_SITE_URL}/api/developer-payments/\${payment.id}/capture\`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    token,
    paymentCredential: "GDLP-0013-0000",
    verificationAccepted: payment.totalPz > 500
  })
});

const confirmation = await captureResponse.json();`,
  captureCard: `const cardCapture = await fetch(\`${BANK_SITE_URL}/api/developer-payments/\${payment.id}/capture\`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    token,
    paymentCredential: "183042",
    cardPin: "0000"
  })
});`
};

const landingPages = [
  { id: "cuentas", title: "Cuentas", icon: WalletCards, image: "/assets/promoscarrusel/1.png", text: "Consulta saldo, IBAN, límites, actividad reciente y accesos de cuenta sin mezclar formularios en la pantalla principal.", bullets: ["Saldo y movimientos", "Límites por tipo", "Documentos y extractos"] },
  { id: "placezum", title: "Placezum", icon: QrCode, image: "/assets/promoscarrusel/7.png", text: "Pagos rápidos con código temporal, contactos guardados y límites visibles antes de enviar.", bullets: ["Código temporal", "Contactos", "Límite semanal"] },
  { id: "tarjetas", title: "Tarjetas virtuales", icon: CreditCard, image: "/assets/VIRTUALCARD.jpg", text: "Gestiona tarjetas virtuales con estado claro, límite por cuenta y acciones separadas. La Promo Card física aparece como función próxima.", bullets: ["Emitir tarjeta virtual", "Congelar o activar", "Límite por cuenta"] },
  { id: "empresas", title: "Empresas", icon: Building2, image: "/assets/actu.jpg", text: "Panel para nóminas por DIP, alta de empresa, actividad y rentabilidad cuando la cuenta lo permite.", bullets: ["Nóminas por DIP", "Alta laboral PDF", "Actividad asociada"] },
  { id: "soporte", title: "Soporte", icon: ShieldCheck, image: "/assets/logobanco.jpg", text: "Tickets con contexto de cuenta, tarjeta, inversión o movimiento para explicar mejor cada incidencia.", bullets: ["Estado del ticket", "Historial", "Contexto de cuenta"] },
  { id: "developers", title: "API Developers", icon: Lock, image: "/assets/promocard.jpg", text: "Pagos externos con token firmado, captura segura, enlaces de pago y desglose de IVA automático.", bullets: ["Crear pago", "Consultar estado", "Capturar con IVA"] }
];

const PLACETAID_BASE_URL = "https://id.laplaceta.org";
const PLACETAID_SERVICE_NAME = "BancodeLaPlacetaDev";
const BANK_STATE_POLL_MS = 5000;
const MIN_PLACETAID_AGE = 18;
const notificationDefaults = {
  desktop: true,
  inApp: true,
  money: true,
  investments: true,
  service: true
};

type NotificationSettings = typeof notificationDefaults;
type NotificationCategory = keyof Omit<NotificationSettings, "desktop" | "inApp">;

type PlacetaIdUserPayload = {
  dip?: string;
  registroId?: string;
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

function parseJwtPayload(token: string): PlacetaIdUserPayload | null {
  const payload = token.split(".")[1];
  if (!payload) return null;
  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const decoded = decodeURIComponent(Array.from(atob(padded)).map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`).join(""));
    const parsed = JSON.parse(decoded);
    return parsed && typeof parsed === "object" ? parsed as PlacetaIdUserPayload : null;
  } catch {
    return null;
  }
}

function placetaIdCallbackParams() {
  const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  if (typeof window !== "undefined" && window.location.hash.includes("=")) {
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    hashParams.forEach((value, key) => {
      if (!params.has(key)) params.set(key, value);
    });
  }
  return params;
}

function bankStateFingerprint(state: BankState) {
  return JSON.stringify({
    updatedAt: state.updatedAt || "",
    accounts: state.accounts.map((account) => [account.id, account.balancePz, account.iban, account.displayName, account.type, account.complianceStatus || "", account.closedAt || ""]),
    transactions: state.transactions.map((transaction) => [transaction.id, transaction.status, transaction.amountPz, transaction.createdAt]),
    users: state.users.map((user) => [user.dip, user.displayName, user.primaryAccountId]),
    cards: state.digitalCards.map((card) => [card.id, card.accountId, card.frozen, card.released]),
    contacts: state.savedContacts.map((contact) => [contact.ownerPlacetaId, contact.accountId]),
    tickets: (state.supportTickets || []).map((ticket) => [ticket.id, ticket.status, ticket.updatedAt]),
    links: (state.paymentLinks || []).map((link) => [link.id, link.status, link.usedAt || "", link.totalPz]),
    investments: (state.investmentOperations || []).map((operation) => [
      operation.id,
      operation.accountId,
      operation.companyId,
      operation.amountPz,
      operation.readyAt,
      operation.settledAt || ""
    ]),
    payrollContracts: (state.payrollContracts || []).map((contract) => [
      contract.id,
      contract.companyAccountId,
      contract.employeeAccountId,
      contract.employeeDip,
      contract.grossSalaryPz,
      contract.status,
      contract.updatedAt || contract.createdAt
    ]),
    payrollPeriods: (state.payrollPeriods || []).map((period) => [
      period.id,
      period.contractId,
      period.companyAccountId,
      period.employeeAccountId,
      period.grossSalaryPz,
      period.status,
      period.transactionId || "",
      period.createdAt
    ])
  });
}

function isAdminUser(user: UserProfile | null) {
  return user?.dip === "12345678A";
}

function accountBelongsTo(user: UserProfile, account: Account | undefined | null) {
  return Boolean(account && !isAccountClosed(account) && (account.placetaId === user.placetaId || account.id === user.primaryAccountId));
}

function accountsForUser(state: BankState, user: UserProfile) {
  return state.accounts
    .filter((account) => accountBelongsTo(user, account))
    .sort((left, right) => left.type.localeCompare(right.type) || left.displayName.localeCompare(right.displayName));
}

function requireOwnedAccount(state: BankState, user: UserProfile, accountId: string) {
  const account = state.accounts.find((item) => item.id === accountId);
  if (!accountBelongsTo(user, account)) throw new Error("No puedes operar con una cuenta que no es tuya");
  return account!;
}

function requireOwnedCard(state: BankState, user: UserProfile, cardId: string) {
  const card = state.digitalCards.find((item) => item.id === cardId);
  if (!card) throw new Error("Tarjeta no encontrada");
  requireOwnedAccount(state, user, card.accountId);
  return card;
}

function placetaIdFromDip(dip: string) {
  const compact = dip.toUpperCase().replace(/[^A-Z0-9-]/g, "");
  return compact.slice(0, 18) || `PLID-${Date.now().toString().slice(-6)}`;
}

function citizenshipTierFromAge(age?: number | null) {
  if (typeof age !== "number" || !Number.isFinite(age)) return "CiudadaniaPlena";
  if (age < 16) return "JuniorBasica";
  if (age < 18) return "JuniorSenior";
  return "CiudadaniaPlena";
}

function verifiedAdultAgeFromPlacetaId(payload: PlacetaIdUserPayload) {
  const age = payload.edad;
  if (typeof age !== "number" || !Number.isFinite(age)) {
    throw new Error("PlacetaID debe verificar tu edad para acceder al banco");
  }
  if (age < MIN_PLACETAID_AGE) {
    throw new Error("Debes tener 18 años o más para acceder al Banco de La Placeta");
  }
  return age;
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
  const verifiedAge = verifiedAdultAgeFromPlacetaId(payload);
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
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [tab, setTab] = useState<Tab>("home");
  const [sync, setSync] = useState<"loading" | "online" | "offline">("loading");
  const [hydrated, setHydrated] = useState(false);
  const [toast, setToast] = useState("");
  const [authError, setAuthError] = useState("");
  const [busyMessage, setBusyMessage] = useState("");
  const [placetaIdLoading, setPlacetaIdLoading] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | "unsupported">("default");
  const [notificationNow, setNotificationNow] = useState(0);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(notificationDefaults);
  const [notificationSettingsOpen, setNotificationSettingsOpen] = useState(false);
  const stateRef = useRef<BankState>(state);
  const persistInFlightRef = useRef(false);
  const operationInFlightRef = useRef(false);
  const remoteRefreshInFlightRef = useRef(false);
  const notificationSeenRef = useRef<Set<string>>(new Set());
  const notificationsReadyRef = useRef(false);
  const notificationUserRef = useRef("");
  const placetaIdCallbackHandledRef = useRef(false);
  const lastRemoteFingerprintRef = useRef("");

  const bankStateHeaders = useCallback((json = false) => {
    const headers: Record<string, string> = json ? { "content-type": "application/json" } : {};
    const token = typeof window !== "undefined" ? sessionStorage.getItem("placetaid-token") : null;
    if (token) headers["authorization"] = `Bearer ${token}`;
    return headers;
  }, []);

  const restoreStoredSession = useCallback((nextState: BankState) => {
    if (typeof window === "undefined") return;
    const storedDip = localStorage.getItem("placeta-web-dip")?.trim().toUpperCase();
    if (!storedDip) return;
    const storedUser = nextState.users.find((user) => user.dip === storedDip);
    if (!storedUser) {
      localStorage.removeItem("placeta-web-dip");
      setActiveUser(null);
      return;
    }
    setActiveUser(storedUser);
    setSelectedAccountId((current) => {
      const selectedStillValid = nextState.accounts.some((account) => account.id === current && account.placetaId === storedUser.placetaId);
      return selectedStillValid ? current : (storedUser.primaryAccountId ?? current);
    });
  }, []);

  useEffect(() => {
    const params = placetaIdCallbackParams();
    const callbackToken = params.get("placetaid_token") || params.get("token");
    if (callbackToken) sessionStorage.setItem("placetaid-token", callbackToken);

    localStorage.removeItem("placeta-web-state");
    fetch(`/api/bank-state?ts=${Date.now()}`, { headers: bankStateHeaders(), cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Servicio no disponible");

        const newToken = response.headers.get("X-New-Token");
        if (newToken && typeof window !== "undefined") {
          sessionStorage.setItem("placetaid-token", newToken);
          localStorage.setItem("placetaidToken", newToken);
        }

        const remote = normalizeState(await response.json());
        lastRemoteFingerprintRef.current = bankStateFingerprint(remote);
        setState(remote);
        restoreStoredSession(remote);
        setHydrated(true);
        localStorage.setItem("placeta-web-state", JSON.stringify(remote));
        setSync("online");
      })
      .catch(() => {
        setSync("offline");
        setHydrated(true);
      });
  }, [bankStateHeaders, restoreStoredSession]);

  useEffect(() => {
    if (hydrated && sync === "online") localStorage.setItem("placeta-web-state", JSON.stringify(normalizeState(state)));
  }, [hydrated, state, sync]);

  useEffect(() => {
    stateRef.current = state;
    lastRemoteFingerprintRef.current = bankStateFingerprint(state);
  }, [state]);

  useEffect(() => {
    if (!activeUser) return;
    const refreshedUser = state.users.find((user) => user.dip === activeUser.dip);
    if (!refreshedUser) {
      setActiveUser(null);
      localStorage.removeItem("placeta-web-dip");
      return;
    }
    if (refreshedUser !== activeUser) setActiveUser(refreshedUser);
  }, [activeUser, state.users]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) {
      setNotificationPermission("unsupported");
      return;
    }
    setNotificationPermission(Notification.permission);
    const storedSettings = localStorage.getItem("placeta-web-notification-settings");
    if (storedSettings) {
      try {
        const parsed = JSON.parse(storedSettings);
        if (parsed && typeof parsed === "object") setNotificationSettings({ ...notificationDefaults, ...parsed });
      } catch {
        setNotificationSettings(notificationDefaults);
      }
    }
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("placeta-web-notification-settings", JSON.stringify(notificationSettings));
  }, [notificationSettings]);

  const accountsById = useMemo(() => new Map(state.accounts.map((account) => [account.id, account])), [state.accounts]);
  const userAccounts = useMemo(() => {
    if (!activeUser) return [];
    return accountsForUser(state, activeUser);
  }, [activeUser, state]);
  const selectedAccount = userAccounts.find((account) => account.id === selectedAccountId) || userAccounts.find((account) => account.id === activeUser?.primaryAccountId) || userAccounts[0];
  const visibleTabs = isAdminUser(activeUser) ? tabs : tabs.filter((item) => item.id !== "tributos");

  useEffect(() => {
    if (!activeUser || !userAccounts.length) return;
    if (!selectedAccount || selectedAccount.id !== selectedAccountId) {
      setSelectedAccountId(selectedAccount?.id || userAccounts[0].id);
    }
  }, [activeUser, selectedAccount, selectedAccountId, userAccounts]);

  useEffect(() => {
    if (!visibleTabs.some((item) => item.id === tab)) setTab("home");
  }, [tab, visibleTabs]);

  const saveSeenNotifications = useCallback(() => {
    if (typeof window === "undefined") return;
    const compact = Array.from(notificationSeenRef.current).slice(-600);
    notificationSeenRef.current = new Set(compact);
    localStorage.setItem("placeta-web-notification-seen", JSON.stringify(compact));
  }, []);

  const notifyDesktop = useCallback((title: string, body: string, tag: string, category: NotificationCategory, force = false) => {
    if (!notificationSettings[category]) return;
    if (notificationSettings.inApp) setToast(body);
    if (!notificationSettings.desktop) return;
    if (typeof window === "undefined" || !("Notification" in window) || Notification.permission !== "granted") return;
    if (!force && document.visibilityState === "visible") return;
    new Notification(title, {
      body,
      icon: "/assets/icon2.png",
      badge: "/assets/icon2.png",
      tag
    });
  }, [notificationSettings]);

  const silentRemoteRefresh = useCallback(async () => {
    if (persistInFlightRef.current || operationInFlightRef.current || remoteRefreshInFlightRef.current) return;
    remoteRefreshInFlightRef.current = true;
    try {
      const response = await fetch(`/api/bank-state?ts=${Date.now()}`, { headers: bankStateHeaders(), cache: "no-store" });
      if (!response.ok) throw new Error("Servicio no disponible");

      const newToken = response.headers.get("X-New-Token");
      if (newToken && typeof window !== "undefined") {
        sessionStorage.setItem("placetaid-token", newToken);
        localStorage.setItem("placetaidToken", newToken);
      }

      const remote = normalizeState(await response.json());
      const current = stateRef.current;
      const remoteTime = Date.parse(remote.updatedAt || "");
      const currentTime = Date.parse(current.updatedAt || "");
      const canCompareDates = Number.isFinite(remoteTime) && Number.isFinite(currentTime);
      const remoteIsNewer = canCompareDates ? remoteTime > currentTime : remote.updatedAt !== current.updatedAt;
      const remoteFingerprint = bankStateFingerprint(remote);
      const contentChanged = remoteFingerprint !== lastRemoteFingerprintRef.current;
      if (remoteIsNewer || contentChanged) {
        lastRemoteFingerprintRef.current = remoteFingerprint;
        setState(remote);
        localStorage.setItem("placeta-web-state", JSON.stringify(remote));
      }
      setSync("online");
    } catch {
      setSync("offline");
    } finally {
      remoteRefreshInFlightRef.current = false;
    }
  }, [bankStateHeaders]);

  useEffect(() => {
    if (!hydrated) return;
    void silentRemoteRefresh();
    const timer = window.setInterval(() => {
      void silentRemoteRefresh();
    }, BANK_STATE_POLL_MS);
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") void silentRemoteRefresh();
    };
    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
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

    const pendingAlerts: Array<{ id: string; title: string; body: string; category: NotificationCategory }> = [];
    for (const transaction of transactions) {
      const id = `txn:${transaction.id}`;
      if (notificationSeenRef.current.has(id)) continue;
      const incoming = accountIds.has(transaction.toAccountId);
      const counterpartyId = incoming ? transaction.fromAccountId : transaction.toAccountId;
      const counterparty = accountsById.get(counterpartyId)?.displayName || counterpartyId;
      pendingAlerts.push({
        id,
        title: incoming ? "Ingreso recibido" : "Movimiento enviado",
        body: `${transaction.kind} · ${formatPz(transaction.amountPz)} Pz · ${counterparty}`,
        category: "money"
      });
    }
    for (const operation of readyInvestments) {
      const id = `investment-ready:${operation.id}`;
      if (notificationSeenRef.current.has(id)) continue;
      pendingAlerts.push({
        id,
        title: "Inversión lista",
        body: `${operation.assetName} · ${formatPz(operation.amountPz)} Pz pendiente de liquidar`,
        category: "investments"
      });
    }
    for (const ticket of tickets) {
      const id = `ticket:${ticket.id}:${ticket.updatedAt}`;
      if (notificationSeenRef.current.has(id)) continue;
      pendingAlerts.push({
        id,
        title: "Ticket de soporte",
        body: `${ticket.status} · ${ticket.subject}`,
        category: "service"
      });
    }
    for (const link of paymentLinks) {
      const id = `payment-link:${link.id}:${link.status}:${link.usedAt || link.createdAt}`;
      if (notificationSeenRef.current.has(id)) continue;
      if (link.status === "Pending") continue;
      pendingAlerts.push({
        id,
        title: link.kind === "Payment" ? "Enlace de pago actualizado" : "Enlace de Placetas actualizado",
        body: `${link.status} · ${formatPz(link.totalPz)} Pz · ${link.concept}`,
        category: "service"
      });
    }

    const enabledAlerts = pendingAlerts.filter((alert) => notificationSettings[alert.category]);
    if (!enabledAlerts.length) return;
    for (const alert of enabledAlerts) notificationSeenRef.current.add(alert.id);
    saveSeenNotifications();
    const latest = enabledAlerts.slice(-3);
    if (notificationSettings.inApp && latest.length > 1 && document.visibilityState === "visible") {
      setToast(`${latest.length} actualizaciones nuevas`);
    }
    if (notificationPermission === "granted") latest.forEach((alert) => notifyDesktop(alert.title, alert.body, alert.id, alert.category));
  }, [accountsById, activeUser, hydrated, notificationNow, notificationPermission, notificationSettings, notifyDesktop, saveSeenNotifications, state, userAccounts]);

  async function requestDesktopNotifications() {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setNotificationPermission("unsupported");
      setToast("Este navegador no soporta notificaciones de PC");
      return;
    }
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    if (permission === "granted") {
      notifyDesktop("Banco de La Placeta", "Notificaciones de PC activadas", "placeta-notifications-enabled", "service", true);
    } else {
      setToast("Permiso de notificaciones no activado");
    }
  }

  function toggleNotificationSetting(key: keyof NotificationSettings) {
    setNotificationSettings((current) => ({ ...current, [key]: !current[key] }));
  }

  const fetchFreshState = useCallback(async (applyToUi = true) => {
    const response = await fetch(`/api/bank-state?ts=${Date.now()}`, { headers: bankStateHeaders(), cache: "no-store" });
    if (!response.ok) throw new Error("No se pudo leer el estado remoto");
    const remote = normalizeState(await response.json());
    if (applyToUi) {
      setState(remote);
      restoreStoredSession(remote);
      localStorage.setItem("placeta-web-state", JSON.stringify(remote));
    }
    setSync("online");
    return remote;
  }, [bankStateHeaders, restoreStoredSession]);

  const persist = useCallback(async (next: BankState, message: string, baseUpdatedAt: string | null = stateRef.current.updatedAt || null) => {
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
        headers: bankStateHeaders(true),
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
  }, [bankStateHeaders, silentRemoteRefresh]);

  async function runOperation(operation: (fresh: BankState) => BankState, message: string) {
    if (!activeUser) return;
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

  async function handleCreateAccount(type: AccountType, displayName: string, parentAccountId?: string | null, cardTier?: DigitalCard["tier"]) {
    if (!activeUser) return;
    if (operationInFlightRef.current) {
      setToast("Hay una operación en curso. Espera la confirmación antes de repetir.");
      return;
    }
    operationInFlightRef.current = true;
    setBusyMessage("Creando cuenta");
    try {
      const fresh = await fetchFreshState(false);
      const parent = requireOwnedAccount(fresh, activeUser, parentAccountId || selectedAccount?.id || activeUser.primaryAccountId || "");
      const created = createBankAccount(fresh, activeUser.placetaId, displayName, type, parent.id, cardTier);
      const saved = await persist(created.state, `Cuenta ${accountTypeLabel(type)} creada`, fresh.updatedAt || null);
      if (saved) setSelectedAccountId(created.account.id);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "No se pudo crear la cuenta");
    } finally {
      operationInFlightRef.current = false;
      setBusyMessage("");
    }
  }

  useEffect(() => {
    if (!hydrated || placetaIdCallbackHandledRef.current || typeof window === "undefined") return;
    const params = placetaIdCallbackParams();
    const token = params.get("placetaid_token") || params.get("token");
    const rawUser = params.get("user");
    if (!token) return;

    placetaIdCallbackHandledRef.current = true;
    setPlacetaIdLoading(true);
    sessionStorage.setItem("placetaid-token", token);
    void (async () => {
      try {
        setAuthError("");
        const placetaUser = rawUser ? parsePlacetaIdUser(rawUser) : parseJwtPayload(token);
        if (!placetaUser?.dip) throw new Error("PlacetaID no devolvió datos de usuario válidos");
        const verifiedAge = verifiedAdultAgeFromPlacetaId(placetaUser);
        const returnedState = params.get("state") || "";
        const expectedState = localStorage.getItem("placetaidOauthState") || "";
        if (returnedState && expectedState && returnedState !== expectedState) throw new Error("Validación PlacetaID rechazada por state incorrecto");
        const normalizedDip = placetaUser.dip.trim().toUpperCase();
        localStorage.setItem("placetaidToken", token);
        localStorage.setItem("placetaidUser", JSON.stringify(placetaUser));
        localStorage.setItem("placetaidService", PLACETAID_SERVICE_NAME);
        localStorage.removeItem("placetaidOauthState");

        const fresh = await fetchFreshState(false).catch(() => stateRef.current);
        const existing = fresh.users.find((item) => item.dip === normalizedDip);
        if (existing) {
          const ageChecked = applyPlacetaIdAge(fresh, normalizedDip, verifiedAge);
          const refreshedUser = ageChecked.users.find((item) => item.dip === normalizedDip) || existing;
          if (ageChecked !== fresh) await persist(ageChecked, "Edad verificada con PlacetaID", fresh.updatedAt || null);
          setActiveUser(refreshedUser);
          setSelectedAccountId(refreshedUser.primaryAccountId ?? selectedAccount?.id ?? "");
          localStorage.setItem("placeta-web-dip", refreshedUser.dip);
          setToast(`Sesión iniciada con PlacetaID · edad ${verifiedAge}`);
        } else {
          const registered = await registerPlacetaIdUser(fresh, placetaUser);
          await persist(registered.state, "Cuenta creada con PlacetaID", fresh.updatedAt || null);
          setActiveUser(registered.user);
          setSelectedAccountId(registered.user.primaryAccountId ?? selectedAccount?.id ?? "");
          localStorage.setItem("placeta-web-dip", registered.user.dip);
        }

        params.delete("token");
        params.delete("placetaid_token");
        params.delete("user");
        params.delete("platform");
        params.delete("expires_in");
        params.delete("state");
        const cleanUrl = `${window.location.pathname}${params.toString() ? `?${params}` : ""}`;
        window.history.replaceState({}, "", cleanUrl);
      } catch (error) {
        const message = error instanceof Error ? error.message : "No se pudo iniciar sesión con PlacetaID";
        localStorage.removeItem("placetaidToken");
        localStorage.removeItem("placetaidUser");
        localStorage.removeItem("placeta-web-dip");
        setActiveUser(null);
        setAuthError(message);
        setToast(message);
        params.delete("token");
        params.delete("placetaid_token");
        params.delete("user");
        params.delete("platform");
        params.delete("expires_in");
        params.delete("state");
        const cleanUrl = `${window.location.pathname}${params.toString() ? `?${params}` : ""}`;
        window.history.replaceState({}, "", cleanUrl);
      } finally {
        setPlacetaIdLoading(false);
      }
    })();
  }, [fetchFreshState, hydrated, persist]);

  if (placetaIdLoading) {
    return <PlacetaIdLoadingScreen sync={sync} />;
  }

  if (!activeUser) {
    return (
      <LoginScreen
        sync={sync}
        showLogin={pathname?.startsWith("/login") || false}
        authError={authError}
      />
    );
  }

  if (!selectedAccount) {
    return (
      <main className="app-shell">
        <header className="topbar">
          <div className="top-brand">
            <span className="brand-logo">
              <Image src="/logo.png" alt="Banco de La Placeta" fill sizes="68px" priority />
            </span>
            <div>
              <p className="eyebrow">Banco de La Placeta</p>
              <h1>Sin cuentas vinculadas</h1>
              <span className="top-user">{activeUser.displayName}</span>
            </div>
          </div>
          <button
            className="icon-button"
            aria-label="Cerrar sesión"
            onClick={() => {
              setActiveUser(null);
              localStorage.removeItem("placeta-web-dip");
              localStorage.removeItem("placetaidToken");
              localStorage.removeItem("placetaidUser");
            }}
          >
            <LogOut size={19} />
          </button>
        </header>
        <article className="panel">
          <SectionTitle icon={ShieldCheck} title="Validación de propiedad" />
          <p className="muted">No hay ninguna cuenta bancaria vinculada a tu Placeta ID. Cierra sesión o registra una cuenta propia antes de operar.</p>
        </article>
      </main>
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
            <h1>Banco de La Placeta</h1>
            <span className="top-user">{activeUser.displayName}</span>
          </div>
        </div>
        <div className="top-actions">
          <StatusPill sync={sync} />
          <button
            className={`icon-button ${notificationPermission === "granted" ? "notify-on" : ""}`}
            aria-label="Ajustes de notificaciones"
            title="Ajustes de notificaciones"
            onClick={() => setNotificationSettingsOpen(true)}
          >
            <Bell size={19} />
          </button>
          <button
            className="icon-button"
            aria-label="Cerrar sesión"
            onClick={() => {
              setActiveUser(null);
              localStorage.removeItem("placeta-web-dip");
              localStorage.removeItem("placetaidToken");
              localStorage.removeItem("placetaidUser");
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

      <section className="workspace-head" aria-label="Cuenta activa">
        <div>
          <span>Cuenta activa</span>
          <strong>{selectedAccount.displayName}</strong>
          <p>{selectedAccount.iban}</p>
        </div>
        <div className="workspace-balance">
          <span>Saldo disponible</span>
          <strong>{formatMoneyPz(selectedAccount.balancePz)} Pz</strong>
        </div>
      </section>

      {tab === "home" && (
        <HomeScreen
          account={selectedAccount}
          accounts={state.accounts}
          transactions={state.transactions}
          cards={state.digitalCards.filter((card) => card.accountId === selectedAccount.id)}
          config={state.treasuryConfig}
          onTransfer={(iban, amount, note) => runOperation((fresh) => transferByIban(fresh, requireOwnedAccount(fresh, activeUser, selectedAccount.id).id, iban, amount, note, "Consumption"), "Transferencia GDLP ejecutada")}
          onRbu={() => runOperation((fresh) => claimRbu(fresh, requireOwnedAccount(fresh, activeUser, selectedAccount.id).id), "RBU abonada")}
          onIssueCard={() => runOperation((fresh) => issueCard(fresh, requireOwnedAccount(fresh, activeUser, selectedAccount.id).id), "Tarjeta digital emitida")}
          onToggleCard={(cardId) => runOperation((fresh) => {
            requireOwnedCard(fresh, activeUser, cardId);
            return toggleCard(fresh, cardId);
          }, "Estado de tarjeta actualizado")}
          onChangeAccountType={(type) => runOperation((fresh) => changeAccountType(fresh, requireOwnedAccount(fresh, activeUser, selectedAccount.id).id, type), `Cuenta convertida a ${accountTypeLabel(type)}`)}
          onCloseAccount={() => runOperation((fresh) => closeBankAccount(fresh, requireOwnedAccount(fresh, activeUser, selectedAccount.id).id, activeUser.primaryAccountId ?? ""), "Cuenta cerrada")}
          onCreateAccount={(type, displayName, parentAccountId, cardTier) => void handleCreateAccount(type, displayName, parentAccountId, cardTier)}
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
            if (target) runOperation((fresh) => payPlacezum(fresh, requireOwnedAccount(fresh, activeUser, selectedAccount.id).id, target.iban, amount, `Placezum a ${target.displayName}`), "Pago Placezum confirmado");
          }}
        />
      )}

      {tab === "market" && (
        <MarketScreen
          state={state}
          account={selectedAccount}
          onStart={(marketId, amount) => runOperation((fresh) => startTimedInvestment(fresh, requireOwnedAccount(fresh, activeUser, selectedAccount.id).id, marketId, amount), "Inversión 60s iniciada")}
          onUpdateRisk={(accountId, level, listed) => runOperation((fresh) => {
            const account = requireOwnedAccount(fresh, activeUser, accountId);
            if (account.type !== "Business") throw new Error("Solo puedes modificar fondos de tus empresas");
            return updateInvestmentFundRisk(fresh, account.id, level, listed);
          }, "Riesgo del fondo actualizado")}
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
                const operation = pendingInvestmentOperations(fresh).find((item) => item.id === operationId);
                if (!operation) throw new Error("Operación no encontrada");
                requireOwnedAccount(fresh, activeUser, operation.accountId);
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
      {tab === "hub" && <HubScreen state={state} user={activeUser} onPersist={(next, message) => void persist(next, message)} onCreateAccount={(type, displayName, parentAccountId, cardTier) => void handleCreateAccount(type, displayName, parentAccountId, cardTier)} />}
      {tab === "tributos" && <TributosScreen state={state} onPersist={(next, message) => void persist(next, message)} />}

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
      <Modal title="Notificaciones" open={notificationSettingsOpen} onClose={() => setNotificationSettingsOpen(false)}>
        <SectionTitle icon={Bell} title="Ajustes de notificaciones" />
        <div className="payroll-summary">
          <div><span>Permiso navegador</span><strong>{notificationPermission === "granted" ? "Concedido" : notificationPermission === "unsupported" ? "No soportado" : "Pendiente"}</strong></div>
          <div><span>Estado visual</span><strong>{notificationSettings.inApp ? "Activo" : "Silenciado"}</strong></div>
        </div>
        <div className="product-type-grid" aria-label="Canales de notificación">
          {[
            ["inApp", "Avisos en pantalla"],
            ["desktop", "Notificaciones PC"],
            ["money", "Movimientos"],
            ["investments", "Inversiones"],
            ["service", "Soporte y enlaces"]
          ].map(([key, label]) => (
            <button key={key} type="button" className={notificationSettings[key as keyof NotificationSettings] ? "active" : ""} onClick={() => toggleNotificationSetting(key as keyof NotificationSettings)}>
              <strong>{label}</strong>
              <span>{notificationSettings[key as keyof NotificationSettings] ? "Activo" : "Pausado"}</span>
            </button>
          ))}
        </div>
        <div className="confirm-actions">
          <button className="secondary-button" onClick={() => setNotificationSettings(notificationDefaults)}>Restablecer</button>
          <button className="primary-button" disabled={notificationPermission === "granted" || notificationPermission === "unsupported"} onClick={requestDesktopNotifications}>Permitir en PC</button>
        </div>
      </Modal>
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

function LoginScreen({ sync, showLogin, authError }: { sync: string; showLogin: boolean; authError: string }) {
  const [slideIndex, setSlideIndex] = useState(0);
  const [betaName, setBetaName] = useState("");
  const [betaContact, setBetaContact] = useState("");
  const [betaChannel, setBetaChannel] = useState<"email" | "whatsapp">("email");
  const [betaConsent, setBetaConsent] = useState(false);
  const [betaSubmitted, setBetaSubmitted] = useState(false);
  const activeSlide = webCarouselSlides[slideIndex] ?? webCarouselSlides[0];

  useEffect(() => {
    if (showLogin) return;
    const timer = window.setInterval(() => setSlideIndex((value) => (value + 1) % webCarouselSlides.length), 6500);
    return () => window.clearInterval(timer);
  }, [showLogin]);

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

  async function submitBeta(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const signup: AndroidBetaSignup = {
      id: crypto.randomUUID(),
      name: betaName.trim(),
      contact: betaContact.trim(),
      channel: betaChannel,
      status: "Registered",
      createdAt: new Date().toISOString()
    };
    if (!signup.contact || !betaConsent) return;
    let stored = false;
    try {
      const response = await fetch("/api/bank-state", { cache: "no-store" });
      if (!response.ok) throw new Error("No se pudo leer el estado");
      const bankState = normalizeState(await response.json());
      const nextState = finalizeState({
        ...bankState,
        androidBetaSignups: [signup, ...(bankState.androidBetaSignups || [])]
      });
      const saved = await fetch("/api/bank-state", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ state: nextState, baseUpdatedAt: bankState.updatedAt || null })
      });
      stored = saved.ok;
    } catch {
      stored = false;
    }
    if (!stored) {
      const current = JSON.parse(localStorage.getItem("banco-android-beta-signups") || "[]");
      localStorage.setItem("banco-android-beta-signups", JSON.stringify([signup, ...current].slice(0, 50)));
    }
    setBetaSubmitted(true);
    setBetaName("");
    setBetaContact("");
    setBetaConsent(false);
  }

  const loginForm = (
    <div id="acceso" className="lp4-login">
      <div className="lp4-login-head">
        <span className={`login-status ${sync}`}>{sync === "online" ? "Servicio conectado" : sync === "offline" ? "Modo sin conexión" : "Sincronizando datos"}</span>
        <h2>Entrar con PlacetaID</h2>
        <p>Identidad GDLP y edad verificadas.</p>
      </div>
      <button type="button" className="placetaid-button" onClick={startPlacetaId}>
        <ShieldCheck size={19} />
        <span>
              <strong>Continuar con PlacetaID</strong>
              <small>Mayores de {MIN_PLACETAID_AGE} años</small>
            </span>
      </button>
      <div className="login-assurance">
        <span><Lock size={15} /> Sesión protegida</span>
        <span><WalletCards size={15} /> Edad verificada</span>
      </div>
      {authError && <p className="form-error">{authError}</p>}
    </div>
  );

  if (showLogin) {
    return (
      <main className="lp4-shell login-page login-only-page">
        <section className="login-only-card" aria-label="Acceso Banco de La Placeta">
          <div className="login-only-side">
            <a className="login-only-brand" href="/" aria-label="Volver al Banco de La Placeta">
              <span>
                <Image src="/logo.png" alt="Banco de La Placeta" fill sizes="76px" priority />
              </span>
              <strong>Banco de La Placeta</strong>
            </a>
            <div>
              <span>Acceso seguro</span>
              <h1>Banco GDLP</h1>
            </div>
            <div className="login-side-grid" aria-label="Ventajas del acceso">
              <span><CheckCircle2 size={16} /> Acceso unificado</span>
              <span><QrCode size={16} /> Placezum</span>
            </div>
          </div>
          {loginForm}
        </section>
      </main>
    );
  }

  return (
    <main className="lp4-shell landing-page" id="inicio">
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
          <a href="#modulos">Servicios</a>
          <a href="#android-beta">BETA Android</a>
          <a className="lp4-link-cta" href="/login">Acceder</a>
        </nav>
      </header>

      <section className="lp4-hero bank-simple-carousel">
        <div className="web-carousel-frame">
          <Image src={activeSlide.image} alt="" fill priority sizes="100vw" unoptimized />
        </div>
        <div className="web-carousel-dots" aria-label="Fotos del carrusel">
          {webCarouselSlides.map((slide, index) => (
            <button key={slide.title} type="button" className={index === slideIndex ? "active" : ""} onClick={() => setSlideIndex(index)} aria-label={`Ver foto ${index + 1}`} />
          ))}
        </div>
      </section>

      <section className="bank-public-intro">
        <div>
          <span>Acceso rápido</span>
          <h1>Entra con DIP. Prueba Android cuando esté listo.</h1>
          <p>Acceso web verificado, operaciones GDLP y lista BETA del APK en dos acciones claras.</p>
        </div>
        <div className="bank-public-actions" aria-label="Acciones principales">
          <a href="/login">Entrar al banco</a>
          <a href="#android-beta">Unirme al BETA</a>
        </div>
      </section>

      <section className="lp4-product" id="modulos">
        <div className="lp4-section-head">
          <span>Servicios</span>
          <h2>Operar sin ruido.</h2>
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
                <em>{item.bullets.slice(0, 3).join(" · ")}</em>
              </a>
            );
          })}
        </div>
      </section>

      <section className="nfc-promo-card" id="nfc-promo">
        <div className="nfc-promo-content">
          <div className="nfc-promo-icons">
            <Smartphone size={28} />
            <WalletCards size={24} />
            <CreditCard size={24} />
          </div>
          <div className="nfc-promo-text">
            <strong>PlaceZum NFC, Promo Card y más</strong>
            <p>Paga sin contacto, usa tu móvil como datafono, gestiona tarjetas virtuales y físicas, y recibe notificaciones push. Todo desde la app nativa.</p>
          </div>
          <a href="#android-beta" className="primary-button" style={{ textDecoration: "none", padding: "10px 20px", fontSize: ".85rem", display: "inline-flex", alignItems: "center", gap: 8 }}>
            <Smartphone size={18} /> Descargar APK
          </a>
        </div>
      </section>

      <section className="android-beta-section" id="android-beta">
        <div className="android-beta-copy">
          <span>Lista BETA Android</span>
          <h2>Recibe el APK cuando esté disponible.</h2>
          <p>Apúntate y te avisaremos por el canal que elijas cuando la app esté lista.</p>
          <p className="android-beta-legal">Servicio interno de pruebas del entorno Banco de La Placeta. Tus datos se usarán solo para gestionar la invitación beta y podrás solicitar baja o supresión.</p>
          <div className="android-beta-points">
            <span><Smartphone size={16} /> Sin descarga inmediata</span>
            <span><Mail size={16} /> Email</span>
            <span><MessageCircle size={16} /> WhatsApp</span>
          </div>
        </div>
        <form className="android-beta-form" onSubmit={submitBeta}>
          <label>
            <span>Nombre</span>
            <input
              value={betaName}
              onChange={(event) => setBetaName(event.target.value.slice(0, 50))}
              placeholder="Tu nombre"
              autoComplete="name"
            />
          </label>
          <label>
            <span>{betaChannel === "email" ? "Correo electrónico" : "WhatsApp"}</span>
            <input
              required
              value={betaContact}
              onChange={(event) => setBetaContact(event.target.value.slice(0, 80))}
              placeholder={betaChannel === "email" ? "nombre@correo.com" : "+34 600 000 000"}
              type={betaChannel === "email" ? "email" : "tel"}
              inputMode={betaChannel === "email" ? "email" : "tel"}
              autoComplete={betaChannel === "email" ? "email" : "tel"}
            />
          </label>
          <div className="android-beta-channel-field">
            <span>Canal de aviso</span>
            <div className="segmented android-beta-channel">
              <button type="button" className={betaChannel === "email" ? "active" : ""} onClick={() => setBetaChannel("email")}>Email</button>
              <button type="button" className={betaChannel === "whatsapp" ? "active" : ""} onClick={() => setBetaChannel("whatsapp")}>WhatsApp</button>
            </div>
          </div>
          <label className="legal-consent android-beta-consent">
            <input type="checkbox" checked={betaConsent} onChange={(event) => setBetaConsent(event.target.checked)} required />
            <span>Acepto recibir comunicaciones del Programa BETA y he leído los <a href="/terminos-y-condiciones">términos</a> y la <a href="/politica-de-privacidad">política de privacidad</a>.</span>
          </label>
          <button type="submit" className="primary-button" disabled={!betaConsent}>Unirme a la lista BETA</button>
          <p className={betaSubmitted ? "android-beta-status visible" : "android-beta-status"}>
            Inscripción recibida. El acceso al APK llegará próximamente vía {betaChannel === "email" ? "correo electrónico" : "WhatsApp"}.
          </p>
        </form>
      </section>
      <footer className="lp4-footer bank-footer">
        <div className="bank-footer-main">
          <div className="lp4-footer-brand">
            <span className="lp4-logo small">
              <Image src="/logo.png" alt="Banco de La Placeta" fill sizes="46px" />
            </span>
            <div>
              <strong>Banco de La Placeta</strong>
              <p>Banca simulada GDLP.</p>
            </div>
          </div>
          <div className="bank-footer-status" aria-label="Estado del servicio">
            <span><ShieldCheck size={15} /> PlacetaID</span>
            <span><CheckCircle2 size={15} /> Web operativa</span>
          </div>
        </div>
        <div className="bank-footer-navs">
          <div>
            <strong>Banco</strong>
            <nav className="bank-footer-actions" aria-label="Banco">
              <a href="/login">Acceder</a>
              <a href="#modulos">Servicios</a>
              <a href="#android-beta">BETA Android</a>
            </nav>
          </div>
          <div>
            <strong>Legal</strong>
            <nav className="bank-footer-legal" aria-label="Legal">
              <a href="/terminos-y-condiciones">Términos</a>
              <a href="/politica-de-privacidad">Privacidad</a>
            </nav>
          </div>
        </div>
        <p className="bank-footer-note">Placetas, IBAN GDLP y documentos: uso interno, sin valor bancario real.</p>
      </footer>
    </main>
  );
}

function HomeScreen({ account, accounts, transactions, cards, config, onTransfer, onRbu, onIssueCard, onToggleCard, onChangeAccountType, onCloseAccount, onCreateAccount }: {
  account: Account;
  accounts: Account[];
  transactions: LedgerTransaction[];
  cards: DigitalCard[];
  config: BankState["treasuryConfig"];
  onTransfer: (iban: string, amount: number, note: string) => void;
  onRbu: () => void;
  onIssueCard: () => void;
  onToggleCard: (cardId: string) => void;
  onChangeAccountType: (type: AccountType) => void;
  onCloseAccount: () => void;
  onCreateAccount: (type: AccountType, displayName: string, parentAccountId?: string | null, cardTier?: DigitalCard["tier"]) => void;
}) {
  const [showBalance, setShowBalance] = useState(true);
  const [iban, setIban] = useState(accounts.find((item) => item.id !== account.id && item.kind === "CITIZEN")?.iban || "");
  const [amount, setAmount] = useState(25);
  const [note, setNote] = useState("Pago GDLP");
  const [transferReview, setTransferReview] = useState(false);
  const [activePopup, setActivePopup] = useState<"transfer" | "cards" | "account" | "promocard" | null>(null);
  const history = transactionsFor(account.id, transactions).slice(0, 8);
  const transferState = useMemo(() => ({ accounts, treasuryConfig: config } as BankState), [accounts, config]);
  const transferPreview = useMemo(() => transferCostPreview(transferState, account.id, iban, amount, "Consumption"), [account.id, amount, iban, transferState]);
  const canSubmitTransfer = transferPreview.amountPz > 0 && (transferPreview.officialTarget ? transferPreview.canPay : true);
  const virtualCardCount = cards.filter((card) => !card.promoPhysical).length;
  const canIssueVirtualCard = virtualCardCount < MAX_VIRTUAL_CARDS_PER_ACCOUNT;
  const typeBalanceLimit = accountTypeBalanceLimit(config, account.type);
  const balanceUsage = typeBalanceLimit > 0 ? Math.min(100, Math.round((Math.max(0, account.balancePz) / typeBalanceLimit) * 100)) : 0;
  const incomingCount = history.filter((transaction) => transaction.toAccountId === account.id).length;
  const outgoingCount = history.filter((transaction) => transaction.fromAccountId === account.id).length;
  const mutableTypes = mutableAccountTypesFor(account).filter((type) => type !== account.type);
  const canCloseAccount = account.balancePz === 0 && cards.every((card) => card.frozen) && !account.closedAt;

  return (
    <section className="screen-grid">
      {/* Hero card — redesigned premium */}
      <article className="home-hero-card">
        <div className="home-hero-top">
          <div className="home-hero-info">
            <span className="home-hero-label">{account.displayName}</span>
            <h2 className="home-hero-balance">
              {showBalance ? formatMoneyPz(account.balancePz) : "••••••"}
              <small>Pz</small>
            </h2>
          </div>
          <button className="icon-button light" onClick={() => setShowBalance(!showBalance)} aria-label="Mostrar u ocultar saldo">
            {showBalance ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        <div className="home-hero-meta">
          <span><Banknote size={14} /> {account.iban}</span>
          <span className="home-hero-type">{accountTypeLabel(account.type)}</span>
        </div>
      </article>

      {/* Quick actions — premium tiles */}
      <div className="home-quick-actions">
        <button onClick={() => setActivePopup("transfer")}>
          <span className="home-qaction-icon"><CircleDollarSign size={22} /></span>
          <span className="home-qaction-label">Enviar</span>
          <span className="home-qaction-desc">Transferencia GDLP</span>
        </button>
        <button onClick={onRbu}>
          <span className="home-qaction-icon"><Sparkles size={22} /></span>
          <span className="home-qaction-label">RBU</span>
          <span className="home-qaction-desc">Renta Básica</span>
        </button>
        <button onClick={() => setActivePopup("cards")}>
          <span className="home-qaction-icon"><CreditCard size={22} /></span>
          <span className="home-qaction-label">Tarjetas</span>
          <span className="home-qaction-desc">{virtualCardCount ? `${virtualCardCount} virtuales` : "Emitir nueva"}</span>
        </button>
        <button onClick={() => setActivePopup("account")}>
          <span className="home-qaction-icon"><Landmark size={22} /></span>
          <span className="home-qaction-label">Cuenta</span>
          <span className="home-qaction-desc">Configuración</span>
        </button>
        <button onClick={() => generateBankPdf(account, { id: `account-statement-${account.id}`, title: `Extracto · ${account.displayName}`, kind: "MonthlyStatement" }, transactionsFor(account.id, transactions))}>
          <span className="home-qaction-icon"><Download size={22} /></span>
          <span className="home-qaction-label">Extracto</span>
          <span className="home-qaction-desc">PDF mensual</span>
        </button>
      </div>

      {/* Stats strip — compact financial overview */}
      <div className="home-stats-strip">
        <div className="home-stat-card">
          <span>Tipo</span>
          <strong>{accountTypeLabel(account.type)}</strong>
          <small>{account.complianceStatus || "Clear"}</small>
        </div>
        <div className="home-stat-card">
          <span>Límite saldo</span>
          <strong>{formatPz(typeBalanceLimit)} Pz</strong>
          <small>{balanceUsage}% utilizado</small>
        </div>
        <div className="home-stat-card">
          <span>Movimientos</span>
          <strong>{history.length}</strong>
          <small>{incomingCount} entradas · {outgoingCount} salidas</small>
        </div>
        <div className="home-stat-card">
          <span>Tarjetas</span>
          <strong>{virtualCardCount}/{MAX_VIRTUAL_CARDS_PER_ACCOUNT}</strong>
          <small>{cards.filter((card) => !card.frozen).length} activas</small>
        </div>
      </div>
      <div className="account-limit-bar" style={{ gridColumn: "1 / -1", marginTop: "-6px" }} aria-label={`Uso de saldo ${balanceUsage}%`}>
        <span style={{ width: `${balanceUsage}%` }} />
      </div>

      {/* Access panel — refined */}
      <article className="panel home-action-summary">
        <SectionTitle icon={WalletCards} title="Accesos de cuenta" />
        <div className="service-grid">
          <button onClick={() => setActivePopup("transfer")}><CircleDollarSign size={22} /><strong>Transferir</strong><span>Enviar Pz por IBAN</span></button>
          <button onClick={() => setActivePopup("cards")}><CreditCard size={22} /><strong>Tarjetas virtuales</strong><span>{cards.length ? `${cards.length} vinculadas` : "Emitir una nueva"}</span></button>
          <button onClick={() => setActivePopup("account")}><Landmark size={22} /><strong>Nueva cuenta</strong><span>Alta con límites por tipo</span></button>
          <button onClick={onRbu}><Sparkles size={22} /><strong>RBU</strong><span>Desde Fundación</span></button>
        </div>
      </article>

      <History transactions={history} accounts={accounts} />

      <Modal title="Transferencia GDLP" open={activePopup === "transfer"} onClose={() => setActivePopup(null)}>
        <Field label="IBAN destino" value={iban} onChange={setIban} />
        <div className="two-cols">
          <Field label="Importe Pz" value={String(amount)} onChange={(value) => setAmount(Number(value) || 0)} type="number" />
          <Field label="Concepto" value={note} onChange={setNote} />
        </div>
        <div className="payment-preview" aria-live="polite">
          <div><span>Importe</span><strong>{formatPz(transferPreview.amountPz)} Pz</strong></div>
          <div><span>{transferPreview.taxLabel} {transferPreview.taxPercent}%</span><strong>{formatPz(transferPreview.taxPz)} Pz</strong></div>
          <div><span>Comisión Web/App {transferPreview.bridgePercent}%</span><strong>{formatPz(transferPreview.bridgePz)} Pz</strong></div>
          <div><span>Total a descontar</span><strong>{formatPz(transferPreview.totalDebitPz)} Pz</strong></div>
        </div>
        {transferPreview.crossPlatform && <p className="fee-warning">Aviso: el IBAN destino pertenece a otra plataforma GDLP y aplica comisión puente Web/App antes de pagar.</p>}
        {!transferPreview.officialTarget && <p className="fee-warning">IBAN no oficial GDLP: no se abonará al instante; quedará como movimiento pendiente de validación manual.</p>}
        {transferPreview.officialTarget && !transferPreview.canPay && <p className="fee-warning">Saldo insuficiente para cubrir importe, {transferPreview.taxLabel.toLowerCase()} y comisiones manteniendo la Renta Básica mínima.</p>}
        {!transferReview ? (
          <button className="primary-button" disabled={!canSubmitTransfer} onClick={() => setTransferReview(true)}>Revisar antes de pagar</button>
        ) : (
          <div className="confirm-actions">
            <button className="secondary-button" onClick={() => setTransferReview(false)}>Editar</button>
            <button className="primary-button" disabled={!canSubmitTransfer} onClick={() => {
              onTransfer(iban, amount, note);
              setTransferReview(false);
              setActivePopup(null);
            }}>Confirmar pago de {formatPz(transferPreview.totalDebitPz)} Pz</button>
          </div>
        )}
      </Modal>

      <Modal title="Tarjetas" open={activePopup === "cards"} onClose={() => setActivePopup(null)}>
        <div className="cards-stack">
          {cards.map((card) => (
            <button key={card.id} className={`bank-card ${card.frozen ? "frozen" : ""}`} onClick={() => onToggleCard(card.id)}>
              <Image className="card-art" src="/assets/VIRTUALCARD.jpg" alt="" fill sizes="(max-width: 760px) 100vw, 360px" />
              <span>{card.alias}</span>
              <strong>•••• {card.cardNumber}</strong>
              <small>Virtual · {card.frozen ? "Congelada" : "Activa"} · PIN {card.pin}</small>
            </button>
          ))}
          {!cards.length && <Empty title="Sin tarjetas" text="Emite una tarjeta virtual para esta cuenta." />}
        </div>
        <button className="primary-button" disabled={!canIssueVirtualCard} onClick={onIssueCard}>
          Emitir tarjeta virtual ({virtualCardCount}/{MAX_VIRTUAL_CARDS_PER_ACCOUNT})
        </button>
        {!canIssueVirtualCard && <small>Límite de tarjetas virtuales alcanzado para esta cuenta.</small>}
        <button className="secondary-button" onClick={() => setActivePopup("promocard")}>Solicitar Promo Card</button>
      </Modal>

      <Modal title="Promo Card" open={activePopup === "promocard"} onClose={() => setActivePopup("cards")}>
        <div className="contact-resolver resolved">
          <div>
            <strong>Función próximamente</strong>
            <span>La Promo Card física aún está en fabricación. Cuando esté lista podrás solicitarla y vincularla a esta cuenta desde aquí.</span>
          </div>
          <CreditCard size={22} />
        </div>
        <button className="primary-button" onClick={() => setActivePopup("cards")}>Entendido</button>
      </Modal>

      <Modal title="Cuenta" open={activePopup === "account"} onClose={() => setActivePopup(null)}>
        <div className="account-create-panel">
          <SectionTitle icon={Landmark} title="Gestionar cuenta actual" />
          <div className="payroll-summary">
            <div><span>Cuenta</span><strong>{account.displayName}</strong></div>
            <div><span>Tipo actual</span><strong>{accountTypeLabel(account.type)}</strong></div>
            <div><span>Saldo</span><strong>{formatPz(account.balancePz)} Pz</strong></div>
            <div><span>Estado</span><strong>{account.closedAt ? "Cerrada" : account.complianceStatus || "Clear"}</strong></div>
          </div>
          {account.type !== "Business" && account.type !== "State" && (
            <div className="modal-subtitle">Cotitulares</div>
          )}
          {mutableTypes.length ? (
            <>
              <div className="modal-subtitle">Cambiar tipo</div>
              <div className="product-type-grid" aria-label="Cambiar tipo de cuenta">
                {mutableTypes.map((type) => (
                  <button key={type} type="button" onClick={() => {
                    onChangeAccountType(type);
                    setActivePopup(null);
                  }}>
                    <strong>{accountTypeLabel(type)}</strong>
                    <span>Convertir</span>
                  </button>
                ))}
              </div>
            </>
          ) : <p className="muted">Esta cuenta no permite cambio de tipo desde autoservicio.</p>}
          <div className="modal-subtitle">Pago de IRM</div>
          <p className="muted" style={{ fontSize: ".82rem" }}>
            IRM {account.irmOptIn ? "automático (se carga el primer lunes de cada mes)" : `manual (fecha límite: ${new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1 + (new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).getDay() === 1 ? 0 : 8 - new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).getDay())).toLocaleDateString("es-ES")})`}
          </p>
          {account.type === "Business" && account.payrollDay && (
            <p className="muted" style={{ fontSize: ".82rem" }}>Nóminas: día {account.payrollDay} del mes siguiente.</p>
          )}
          <div className="modal-subtitle">Cerrar cuenta</div>
          <p className="muted">Para cerrar una cuenta debe estar a 0 Pz, sin tarjetas activas y sin operaciones laborales o de inversión abiertas.</p>
          <button className="secondary-button" disabled={!canCloseAccount} onClick={() => {
            onCloseAccount();
            setActivePopup(null);
          }}>Cerrar cuenta</button>
        </div>
        <div className="account-create-panel">
          <SectionTitle icon={Sparkles} title="Dar de alta producto" />
        <AccountCreationForm parentAccount={account} config={config} onCreate={(type, displayName, parentAccountId, cardTier) => {
          onCreateAccount(type, displayName, parentAccountId, cardTier);
          setActivePopup(null);
        }} />
        </div>
      </Modal>
    </section>
  );
}

const accountProductTypes: AccountType[] = ["Current", "Savings", "Child", "Business", "Investment"];

const accountProductCopy: Record<AccountType, string> = {
  Current: "Cuenta corriente para pagos, ingresos y transferencias diarias.",
  Savings: "Hucha bloqueada para ahorro y rentabilidad anual.",
  Child: "Cuenta infantil con límite de envío y cuenta tutora.",
  Business: "Producto empresa con umbral institucional y nóminas.",
  Investment: "Cartera separada para activos del mercado GDLP.",
  State: "Cuenta institucional para gestión de fondos públicos."
};

function AccountCreationForm({ parentAccount, config, onCreate }: { parentAccount: Account; config: BankState["treasuryConfig"]; onCreate: (type: AccountType, displayName: string, parentAccountId?: string | null, cardTier?: DigitalCard["tier"]) => void }) {
  const [displayName, setDisplayName] = useState("");
  const [type, setType] = useState<AccountType>("Current");
  const [cardTier, setCardTier] = useState<DigitalCard["tier"]>("Standard");
  const suggestedName = displayName.trim() || accountTypeLabel(type);

  return (
    <div className="account-create-form">
      <div className="account-create-head">
        <Landmark size={22} />
        <div>
          <strong>Nuevo IBAN web GDLP automático</strong>
          <span>Formato GDLP-0000-0000 vinculado a tu PlacetaID con tarjeta virtual asociada.</span>
        </div>
      </div>
      <Field label="Nombre visible" value={displayName} onChange={(value) => setDisplayName(value.slice(0, 34))} placeholder={accountTypeLabel(type)} />
      <div className="product-type-grid" aria-label="Tipo de cuenta">
        {accountProductTypes.map((item) => (
          <button key={item} type="button" className={type === item ? "active" : ""} onClick={() => setType(item)}>
            <strong>{accountTypeLabel(item)}</strong>
            <span>{item === "Savings" ? "Hucha" : item === "Child" ? "Tutor" : item === "Business" ? "Empresa" : item === "Investment" ? "Mercado" : "Diaria"}</span>
          </button>
        ))}
      </div>
      <div className="account-product-preview">
        <strong>{suggestedName}</strong>
        <span>{accountProductCopy[type]}</span>
        <small>{type === "Child" ? `Cuenta tutora: ${parentAccount.displayName} · Tarjeta Child` : `Tarjeta ${cardTier} · Alta sin saldo inicial`}</small>
        <small>Límite: {accountTypeAccountLimit(config, type)} cuentas · saldo máximo {formatPz(accountTypeBalanceLimit(config, type))} Pz</small>
      </div>
      {type !== "Child" && (
        <div className="card-tier-grid" aria-label="Tipo de tarjeta">
          {(["Standard", "Premium"] as DigitalCard["tier"][]).map((tier) => (
            <button key={tier} type="button" className={cardTier === tier ? "active" : ""} onClick={() => setCardTier(tier)}>
              Tarjeta {tier}
            </button>
          ))}
        </div>
      )}
      <button className="primary-button" type="button" onClick={() => onCreate(type, suggestedName, type === "Child" ? parentAccount.id : null, type === "Child" ? "Child" : cardTier)}>
        Crear producto
      </button>
    </div>
  );
}

function PlacezumScreen({ user, account, accounts, contacts, limit, spent, onPay, onAddContact, onRemoveContact }: { user: UserProfile; account: Account; accounts: Account[]; contacts: { accountId: string }[]; limit: number; spent: number; onPay: (targetId: string, amount: number) => void; onAddContact: (accountId: string) => void; onRemoveContact: (accountId: string) => void }) {
  const [amount, setAmount] = useState(12);
  const [payTargetQuery, setPayTargetQuery] = useState("");
  const [contactQuery, setContactQuery] = useState("");
  const [activeModal, setActiveModal] = useState<"pay" | "contacts" | "receive" | null>(null);
  const [, setTick] = useState(0);
  const nowMs = Date.now();
  const codeWindow = Math.floor(nowMs / 120000);
  const code = useMemo(() => generatePlacezumCode(account, new Date(codeWindow * 120000)), [account, codeWindow]);
  const secondsLeft = 120 - (Math.floor(nowMs / 1000) % 120);
  const remaining = Math.max(0, limit - spent);
  const usagePercent = limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0;
  const safeAmount = Math.max(0, Math.min(amount, remaining));
  const quickAmounts = remaining > 0 ? [5, 12, 25, 50, 100].filter((value) => value <= Math.max(remaining, 5)) : [];
  const normalizedPayTarget = payTargetQuery.trim().toUpperCase();
  const payCodeCandidate = normalizedPayTarget.replace(/\D/g, "");
  const payTarget = normalizedPayTarget
    ? accounts.find((candidate) =>
      candidate.id !== account.id && (
        normalizeIban(candidate.iban) === normalizeIban(normalizedPayTarget) ||
        candidate.placetaId?.toUpperCase() === normalizedPayTarget ||
        candidate.displayName.toUpperCase().includes(normalizedPayTarget) ||
        (payCodeCandidate.length === 5 && [0, 120000].some((offset) => generatePlacezumCode(candidate, new Date(Date.now() - offset)) === payCodeCandidate))
      )
    )
    : undefined;
  const normalizedQuery = contactQuery.trim().toUpperCase();
  const resolvedContact = normalizedQuery
    ? accounts.find((candidate) =>
      candidate.id !== account.id &&
      (normalizeIban(candidate.iban) === normalizeIban(normalizedQuery) || candidate.placetaId?.toUpperCase() === normalizedQuery || candidate.displayName.toUpperCase().includes(normalizedQuery))
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
        <MetricCard label="Contactos" value={String(favoriteAccounts.length)} tone="accent" />
        <MetricCard label="Código" value={`${secondsLeft}s`} tone="purple" />
      </div>

      <article className="panel action-summary">
        <SectionTitle icon={ScanLine} title="Placezum" />
        <div className="placezum-actions">
          <button onClick={() => setActiveModal("pay")}><CircleDollarSign size={22} /><strong>Pagar</strong><span>Código, IBAN o favorito</span></button>
          <button onClick={() => setActiveModal("contacts")}><ShieldCheck size={22} /><strong>Favoritos</strong><span>Opcional, para repetir</span></button>
          <button onClick={() => setActiveModal("receive")}><QrCode size={22} /><strong>Recibir</strong><span>Código temporal</span></button>
        </div>
      </article>
      <article className="panel split-panel">
        <div><ShieldCheck size={23} /><strong>Límite semanal</strong><span>{formatPz(spent)} de {formatPz(limit)} Pz por Placezum</span><i className="placezum-progress"><b style={{ width: `${usagePercent}%` }} /></i></div>
        <div><Lock size={23} /><strong>Operación simple</strong><span>Los contactos son favoritos; también puedes pagar con código, IBAN o Placeta ID</span></div>
      </article>

      <Modal title="Pagar con Placezum" open={activeModal === "pay"} onClose={() => setActiveModal(null)}>
        <Field label={`Importe Pz · disponible ${formatPz(remaining)}`} value={String(amount)} onChange={(value) => setAmount(Number(value) || 0)} type="number" />
        <div className="amount-chips">
          {quickAmounts.map((value) => (
            <button key={value} className={safeAmount === value ? "active" : ""} onClick={() => setAmount(value)}>{formatPz(value)}</button>
          ))}
        </div>
        <div className="direct-pay-box">
          <Field label="Código Placezum, IBAN, Placeta ID o nombre" value={payTargetQuery} onChange={setPayTargetQuery} placeholder="12345, GDLP-APXX-XXX o GDLP-XXXX-XXXX" />
          <div className={`contact-resolver ${payTarget ? "resolved" : ""}`}>
            <div>
              <strong>{payTarget?.displayName || "Busca a quien recibe"}</strong>
              <span>{payTarget ? `${payTarget.iban} · código ${generatePlacezumCode(payTarget)}` : "Escribe el código temporal o busca una cuenta; guardar contacto es opcional"}</span>
            </div>
            <button className="mini-action" disabled={!payTarget || safeAmount <= 0} onClick={() => {
              if (!payTarget) return;
              onPay(payTarget.id, safeAmount);
              setPayTargetQuery("");
              setActiveModal(null);
            }}>Pagar</button>
          </div>
        </div>
        {favoriteAccounts.length ? (
          <>
          <div className="modal-subtitle">Favoritos guardados</div>
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
          </>
        ) : <Empty title="Sin favoritos" text="Puedes pagar arriba por código, IBAN, Placeta ID o nombre sin guardar contacto." />}
      </Modal>

      <Modal title="Favoritos Placezum" open={activeModal === "contacts"} onClose={() => setActiveModal(null)}>
        <div className="contact-add">
          <Field label="Guardar favorito por IBAN, Placeta ID o nombre" value={contactQuery} onChange={setContactQuery} placeholder="GDLP-APXX-XXX o GDLP-XXXX-XXXX" />
          <div className={`contact-resolver ${resolvedContact ? "resolved" : ""}`}>
            <div>
              <strong>{resolvedContact?.displayName || "Introduce una cuenta app o web"}</strong>
              <span>{resolvedContact ? `${resolvedContact.iban} · código ${generatePlacezumCode(resolvedContact)}` : "Guardar es opcional: solo sirve para repetir pagos más rápido"}</span>
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
                  setPayTargetQuery(target.iban);
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
        ) : <Empty title="Sin favoritos" text="Guarda solo los destinatarios que uses a menudo." />}
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
  const [selectedFundId, setSelectedFundId] = useState("");
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
  const selectedFund = market.find((fund) => fund.id === selectedFundId) || null;
  const selectedInvestmentPreview = selectedFund ? transferCostPreview(state, account.id, selectedFund.iban, safeAmount, "InvestmentBuy") : null;

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
          <MetricCard label="Margen cerrado" value={`${companyRoi >= 0 ? "+" : ""}${companyRoi}%`} tone={companyRoi >= 0 ? "accent" : "red"} />
          <MetricCard label="Inversores" value={String(companyInvestors)} tone="accent" />
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
        <MetricCard label="Mejor cupo hoy" value={`${remainingToday}`} tone="accent" />
        <MetricCard label="Resultado" value={`${totalNetResult >= 0 ? "+" : ""}${formatPz(totalNetResult)} Pz`} tone={totalNetResult >= 0 ? "accent" : "red"} />
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
            const preview = transferCostPreview(state, account.id, fund.iban, safeAmount, "InvestmentBuy");
            const canInvestFund = isInvestmentAccount && remainingForFund > 0 && safeAmount > 0 && safeAmount <= limits.maxAmountPz && preview.canPay;
            return (
              <button key={fund.id} className="fund-card" disabled={!canInvestFund} onClick={() => setSelectedFundId(fund.id)}>
                <div>
                  <strong>{fund.displayName} <RiskBadge level={risk} /></strong>
                  <span>Máx {formatPz(limits.maxAmountPz)} Pz · {remainingForFund}/{limits.dailyLimit} hoy · {limits.allowedPercent}% base</span>
                  <span>Prob. usuario {profile.userWinProbabilityPercent}% · si gana +{profile.winMovementMinPercent}-{profile.winMovementMaxPercent}%</span>
                  <span>Coste ahora: {formatPz(preview.totalDebitPz)} Pz · tasa {formatPz(preview.taxPz)} · puente {formatPz(preview.bridgePz)}</span>
                  <RiskIndicator level={risk} compact />
                </div>
                <b>{canInvestFund ? "Revisar" : safeAmount > limits.maxAmountPz ? "Baja importe" : !preview.canPay ? "Sin saldo" : "Sin cupo"}</b>
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
      <Modal title="Confirmar inversión" open={Boolean(selectedFund)} onClose={() => setSelectedFundId("")}>
        {selectedFund && selectedInvestmentPreview && (
          <>
            <div className="investment-confirm-head">
              <strong>{selectedFund.displayName}</strong>
              <span>Riesgo R{selectedFund.investmentRiskLevel || 3} · resultado 60s</span>
            </div>
            <div className="payment-preview" aria-live="polite">
              <div><span>Capital invertido</span><strong>{formatPz(selectedInvestmentPreview.amountPz)} Pz</strong></div>
              <div><span>{selectedInvestmentPreview.taxLabel} {selectedInvestmentPreview.taxPercent}%</span><strong>{formatPz(selectedInvestmentPreview.taxPz)} Pz</strong></div>
              <div><span>Comisión Web/App {selectedInvestmentPreview.bridgePercent}%</span><strong>{formatPz(selectedInvestmentPreview.bridgePz)} Pz</strong></div>
              <div><span>Total a descontar</span><strong>{formatPz(selectedInvestmentPreview.totalDebitPz)} Pz</strong></div>
            </div>
            {selectedInvestmentPreview.crossPlatform && <p className="fee-warning">Aviso: esta inversión cruza web/app y aplica comisión puente antes de abrir la operación.</p>}
            {!selectedInvestmentPreview.canPay && <p className="fee-warning">No hay saldo suficiente para cubrir capital, tasa y comisiones manteniendo la Renta Básica mínima.</p>}
            <div className="confirm-actions">
              <button className="secondary-button" onClick={() => setSelectedFundId("")}>Cancelar</button>
              <button className="primary-button" disabled={!selectedInvestmentPreview.canPay} onClick={() => {
                onStart(selectedFund.id, safeAmount);
                setSelectedFundId("");
              }}>Confirmar inversión</button>
            </div>
          </>
        )}
      </Modal>
    </section>
  );
}

function payrollPeriodTotal(period: PayrollPeriod) {
  return Math.max(0, period.netSalaryPz);
}

function payrollTenure(startDate: string) {
  const start = new Date(startDate);
  if (Number.isNaN(start.getTime())) return "Sin fecha";
  const now = new Date();
  let months = (now.getFullYear() - start.getFullYear()) * 12 + now.getMonth() - start.getMonth();
  if (now.getDate() < start.getDate()) months--;
  if (months <= 0) return "Menos de 1 mes";
  const years = Math.floor(months / 12);
  const rest = months % 12;
  if (!years) return `${months} meses`;
  return `${years} año${years === 1 ? "" : "s"}${rest ? ` y ${rest} meses` : ""}`;
}

function HubScreen({ state, user, onPersist, onCreateAccount }: { state: BankState; user: UserProfile; onPersist: (state: BankState, message: string) => void; onCreateAccount: (type: AccountType, displayName: string, parentAccountId?: string | null, cardTier?: DigitalCard["tier"]) => void }) {
  const userAccounts = state.accounts.filter((account) => !isAccountClosed(account) && (account.placetaId === user.placetaId || account.id === user.primaryAccountId));
  const businessAccounts = userAccounts.filter((account) => account.type === "Business");
  const totalBalance = userAccounts.reduce((sum, account) => sum + account.balancePz, 0);
  const cards = state.digitalCards.filter((card) => userAccounts.some((account) => account.id === card.accountId));
  const recent = state.transactions
    .filter((transaction) => userAccounts.some((account) => account.id === transaction.fromAccountId || account.id === transaction.toAccountId))
    .slice(0, 5);
  const pendingInvestments = pendingInvestmentOperations(state).filter((operation) => userAccounts.some((account) => account.id === operation.accountId));
  const tickets = (state.supportTickets || []).filter((ticket) => ticket.ownerDip === user.dip).sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  const [businessId, setBusinessId] = useState(businessAccounts[0]?.id || "");
  const [payrollEmployeeDip, setPayrollEmployeeDip] = useState("");
  const [payrollContactAccountId, setPayrollContactAccountId] = useState("");
  const [payrollGross, setPayrollGross] = useState(state.treasuryConfig.minimumWeeklySalaryPz);
  const [payrollRole, setPayrollRole] = useState("Empleado");
  const [payrollStartDate, setPayrollStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [payrollFrequency, setPayrollFrequency] = useState<PayrollContract["frequency"]>("Weekly");
  const [payrollPrevious, setPayrollPrevious] = useState(0);
  const [payrollBonus, setPayrollBonus] = useState(0);
  const [payrollDeductions, setPayrollDeductions] = useState(0);
  const [payrollPeriodLabel, setPayrollPeriodLabel] = useState(new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" }).format(new Date()));
  const [payrollPeriodStatus, setPayrollPeriodStatus] = useState<PayrollPeriod["status"]>("Paid");
  const [payrollNotes, setPayrollNotes] = useState("");
  const [payrollSearch, setPayrollSearch] = useState("");
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [ticketAttachments, setTicketAttachments] = useState<string[]>([]);
  const [linkKind, setLinkKind] = useState<"Payment" | "Send">("Payment");
  const [linkAmount, setLinkAmount] = useState(100);
  const [linkConcept, setLinkConcept] = useState("Pago Banco de La Placeta");
  const [linkTargetIban, setLinkTargetIban] = useState("");
  const [lastLinkUrl, setLastLinkUrl] = useState("");
  const [hubModal, setHubModal] = useState<"payroll" | "support" | "accounts" | "documents" | "activity" | "developers" | "links" | null>(null);
  const business = businessAccounts.find((account) => account.id === businessId) || businessAccounts[0];
  const payrollContactOptions = (state.savedContacts || [])
    .filter((contact) => contact.ownerPlacetaId === user.placetaId)
    .map((contact) => {
      const account = state.accounts.find((item) => item.id === contact.accountId);
      const profile = account ? state.users.find((item) => item.primaryAccountId === account.id || item.placetaId === account.placetaId) : undefined;
      return account && profile && account.type === "Current" ? { contact, account, profile } : null;
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
  const selectedPayrollContact = payrollContactOptions.find((item) => item.account.id === payrollContactAccountId);
  const normalizedPayrollDip = payrollEmployeeDip.trim().toUpperCase();
  const manualPayrollProfile = normalizedPayrollDip ? state.users.find((profile) => profile.dip.toUpperCase() === normalizedPayrollDip) : undefined;
  const payrollWorkerProfile = selectedPayrollContact?.profile || manualPayrollProfile;
  const payrollTarget = selectedPayrollContact?.account || (payrollWorkerProfile ? state.accounts.find((account) =>
    account.type === "Current" && (account.id === payrollWorkerProfile.primaryAccountId || account.placetaId === payrollWorkerProfile.placetaId)
  ) : undefined);
  const payrollTargetDip = selectedPayrollContact?.profile.dip || payrollWorkerProfile?.dip || normalizedPayrollDip;
  const payrollContracts = (state.payrollContracts || []).filter((contract) => businessAccounts.some((account) => account.id === contract.companyAccountId));
  const payrollPeriods = state.payrollPeriods || [];
  const visiblePayrollContracts = payrollContracts.filter((contract) => {
    const text = `${contract.employeeName} ${contract.employeeDip} ${contract.roleTitle} ${contract.status}`.toLowerCase();
    return !payrollSearch.trim() || text.includes(payrollSearch.trim().toLowerCase());
  });
  const selectedContract = payrollContracts.find((contract) => contract.companyAccountId === business?.id && contract.employeeAccountId === payrollTarget?.id && contract.status !== "Ended");
  const payrollPreviewTotal = Math.max(0, payrollGross + payrollPrevious + payrollBonus - payrollDeductions);
  const workerTax = Math.ceil((payrollPreviewTotal * state.treasuryConfig.payrollWorkerTaxPercent) / 100);
  const employerTax = Math.ceil((payrollPreviewTotal * state.treasuryConfig.payrollEmployerTaxPercent) / 100);
  const netSalary = Math.max(0, payrollPreviewTotal - workerTax);
  const payrollCost = payrollPreviewTotal + employerTax;
  const payrollCanSubmit = Boolean(
    business &&
    payrollTarget &&
    payrollTargetDip &&
    payrollGross >= state.treasuryConfig.minimumWeeklySalaryPz &&
    (payrollPeriodStatus !== "Paid" || payrollPreviewTotal >= state.treasuryConfig.minimumWeeklySalaryPz)
  );
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
    { title: "Extracto de cuenta", detail: `${primaryAccount?.displayName || "Cuenta"} · ${recent.length} movimientos`, icon: Download, kind: "MonthlyStatement", id: "account-statement" },
    { title: "Certificado de cuenta", detail: `${primaryAccount?.iban || user.dip}`, icon: ShieldCheck, kind: "SolvencyCertificate", id: "account-solvency" },
    { title: "Recibos fiscales de cuenta", detail: `${recent.filter((item) => item.taxAmount > 0 || item.toAccountId === TGLP_ID).length} apuntes tributarios`, icon: Gavel, kind: "VatReceipt", id: "account-vat" },
    { title: "Liquidación semanal", detail: `${primaryAccount?.displayName || "Cuenta seleccionada"}`, icon: Landmark, kind: "WeeklyTaxReport", id: "account-weekly" },
    { title: "Requerimiento fiscal", detail: primaryAccount?.complianceStatus || "Estado de cuenta", icon: ShieldCheck, kind: "FiscalRequirement", id: "account-fiscal" },
    { title: "Contrato laboral", detail: "Alta laboral de esta cuenta", icon: Building2, kind: "LaborContract", id: "account-labor" },
    { title: "Liquidación inversión", detail: "Última operación de inversión de esta cuenta", icon: TrendingUp, kind: "InvestmentLiquidation", id: "account-investment" },
    { title: "Informe empresa", detail: business?.displayName || "Cuenta empresa", icon: Banknote, kind: "BusinessStatement", id: "account-business" }
  ];

  function toggleAttachment(id: string) {
    setTicketAttachments((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function submitPayroll() {
    if (!business || !payrollTarget) return;
    if (!accountBelongsTo(user, business) || !payrollTargetDip) return;
    const now = new Date().toISOString();
    const contract: PayrollContract = selectedContract ? {
      ...selectedContract,
      roleTitle: payrollRole.trim() || selectedContract.roleTitle,
      startDate: payrollStartDate || selectedContract.startDate,
      frequency: payrollFrequency,
      grossSalaryPz: payrollGross,
      status: "Active",
      salaryHistory: selectedContract.grossSalaryPz === payrollGross ? selectedContract.salaryHistory : [
        ...selectedContract.salaryHistory,
        { changedAt: now, previousGrossSalaryPz: selectedContract.grossSalaryPz, newGrossSalaryPz: payrollGross, reason: "Cambio de sueldo desde web bancaria" }
      ],
      updatedAt: now
    } : {
      id: `payroll-contract-${Date.now()}`,
      companyAccountId: business.id,
      employeeAccountId: payrollTarget.id,
      employeeDip: payrollTargetDip,
      employeeName: payrollWorkerProfile?.displayName || payrollTarget.displayName,
      roleTitle: payrollRole.trim() || "Empleado",
      startDate: payrollStartDate || now.slice(0, 10),
      frequency: payrollFrequency,
      grossSalaryPz: payrollGross,
      status: "Active",
      endDate: null,
      salaryHistory: [{ changedAt: now, previousGrossSalaryPz: 0, newGrossSalaryPz: payrollGross, reason: "Alta inicial desde web bancaria" }],
      createdAt: now,
      updatedAt: now
    };
    const shouldTransfer = payrollPeriodStatus === "Paid";
    const transferred = shouldTransfer
      ? transferPayrollOrLoan(state, business.id, payrollTarget.id, payrollPreviewTotal, `Nómina ${payrollPeriodLabel} · ${business.displayName} -> ${payrollTarget.displayName}`)
      : state;
    const payrollTransaction = shouldTransfer
      ? transferred.transactions.find((transaction) =>
        transaction.kind === "PayrollLoan" &&
        transaction.fromAccountId === business.id &&
        transaction.toAccountId === payrollTarget.id
      )
      : undefined;
    const period: PayrollPeriod = {
      id: `payroll-period-${Date.now()}`,
      contractId: contract.id,
      companyAccountId: business.id,
      employeeAccountId: payrollTarget.id,
      employeeDip: payrollTargetDip,
      label: payrollPeriodLabel.trim() || new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" }).format(new Date()),
      periodStart: now.slice(0, 10),
      periodEnd: now.slice(0, 10),
      grossSalaryPz: payrollPreviewTotal,
      workerTaxPz: Math.ceil((payrollPreviewTotal * state.treasuryConfig.payrollWorkerTaxPercent) / 100),
      employerTaxPz: Math.ceil((payrollPreviewTotal * state.treasuryConfig.payrollEmployerTaxPercent) / 100),
      netSalaryPz: Math.max(0, payrollPreviewTotal - Math.ceil((payrollPreviewTotal * state.treasuryConfig.payrollWorkerTaxPercent) / 100)),
      status: payrollPeriodStatus,
      paidAt: shouldTransfer ? now : null,
      transactionId: payrollTransaction?.id || null,
      createdAt: now
    };
    onPersist(finalizeState({
      ...transferred,
      payrollContracts: [contract, ...transferred.payrollContracts.filter((item) => item.id !== contract.id)],
      payrollPeriods: [period, ...transferred.payrollPeriods]
    }), `${shouldTransfer ? "Nómina pagada" : "Alta laboral registrada"} para ${contract.employeeName}`);
    setPayrollPrevious(0);
    setPayrollBonus(0);
    setPayrollDeductions(0);
    setPayrollNotes("");
    setHubModal(null);
  }

  function submitTicket() {
    const primary = userAccounts.find((account) => account.id === user.primaryAccountId) || userAccounts[0];
    if (!primary) return;
    const now = new Date().toISOString();
    const ticket: SupportTicket = {
      id: `SUP-${Date.now().toString().slice(-6)}`,
      ownerDip: user.dip,
      accountId: primary.id,
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
    if (!accountBelongsTo(user, source)) return;
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
        <MetricCard label="Tarjetas activas" value={String(activeCards)} tone="accent" />
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
        {businessAccounts.length ? (
          <>
            <div className="field">
              <span>Empresa origen</span>
              <select value={business?.id || ""} onChange={(event) => setBusinessId(event.target.value)}>
                {businessAccounts.map((account) => <option key={account.id} value={account.id}>{account.displayName} · {formatPz(account.balancePz)} Pz</option>)}
              </select>
            </div>
            <div className="field">
              <span>Trabajador desde contacto guardado</span>
              <select value={payrollContactAccountId} onChange={(event) => {
                const accountId = event.target.value;
                const selected = payrollContactOptions.find((item) => item.account.id === accountId);
                setPayrollContactAccountId(accountId);
                if (selected) setPayrollEmployeeDip(selected.profile.dip);
              }}>
                <option value="">Sin contacto, introducir DIP</option>
                {payrollContactOptions.map(({ account, profile }) => <option key={account.id} value={account.id}>{profile.displayName} · {profile.dip} · {account.iban}</option>)}
              </select>
            </div>
            <Field label="DIP trabajador obligatorio" value={payrollEmployeeDip} onChange={(value) => {
              setPayrollContactAccountId("");
              setPayrollEmployeeDip(value.toUpperCase());
            }} placeholder="DIP manual o cargado desde contacto" />
            <div className="payroll-summary">
              <div><span>Trabajador verificado</span><strong>{payrollTarget ? payrollTarget.displayName : "Pendiente"}</strong></div>
              <div><span>DIP alta</span><strong>{payrollTargetDip || "Obligatorio"}</strong></div>
              <div><span>Cuenta destino</span><strong>{payrollTarget?.iban || "Sin cuenta corriente"}</strong></div>
            </div>
            <Field label={`Nómina bruta semanal · SMI ${formatPz(state.treasuryConfig.minimumWeeklySalaryPz)} Pz`} value={String(payrollGross)} onChange={(value) => setPayrollGross(Number(value) || 0)} type="number" />
            <div className="field">
              <span>Periodo de pago</span>
              <select value={payrollFrequency} onChange={(event) => setPayrollFrequency(event.target.value as PayrollContract["frequency"])}>
                <option value="Weekly">Semanal</option>
                <option value="Biweekly">Quincenal</option>
                <option value="Monthly">Mensual</option>
              </select>
            </div>
            <div className="payroll-form-grid">
              <Field label="Puesto / contrato" value={payrollRole} onChange={setPayrollRole} />
              <Field label="Inicio contrato" value={payrollStartDate} onChange={setPayrollStartDate} type="date" />
              <Field label="Periodo liquidado" value={payrollPeriodLabel} onChange={setPayrollPeriodLabel} />
              <div className="field">
                <span>Estado periodo</span>
                <select value={payrollPeriodStatus} onChange={(event) => setPayrollPeriodStatus(event.target.value as PayrollPeriod["status"])}>
                  <option value="Pending">Pendiente</option>
                  <option value="Paid">Pagado</option>
                  <option value="Cancelled">Anulado</option>
                </select>
              </div>
              <Field label="Abono periodos anteriores" value={String(payrollPrevious)} onChange={(value) => setPayrollPrevious(Number(value) || 0)} type="number" />
              <Field label="Complementos" value={String(payrollBonus)} onChange={(value) => setPayrollBonus(Number(value) || 0)} type="number" />
              <Field label="Retenciones / ajustes" value={String(payrollDeductions)} onChange={(value) => setPayrollDeductions(Number(value) || 0)} type="number" />
              <Field label="Notas" value={payrollNotes} onChange={setPayrollNotes} />
            </div>
            <div className="payroll-summary">
              <div><span>Trabajador {state.treasuryConfig.payrollWorkerTaxPercent}%</span><strong>-{formatPz(workerTax)} Pz</strong></div>
              <div><span>Empresa {state.treasuryConfig.payrollEmployerTaxPercent}%</span><strong>+{formatPz(employerTax)} Pz</strong></div>
              <div><span>Neto trabajador</span><strong>{formatPz(netSalary)} Pz</strong></div>
              <div><span>Coste empresa</span><strong>{formatPz(payrollCost)} Pz</strong></div>
              <div><span>Total con ajustes</span><strong>{formatPz(payrollPreviewTotal)} Pz</strong></div>
              <div><span>Contrato</span><strong>{selectedContract ? `${selectedContract.salaryHistory.length} cambios` : "Nuevo"}</strong></div>
            </div>
            <button className="primary-button" disabled={!payrollCanSubmit} onClick={submitPayroll}>{payrollPeriodStatus === "Paid" ? "Registrar y pagar nómina" : "Registrar alta laboral"}</button>
            <div className="payroll-register">
              <Field label="Buscar contratos" value={payrollSearch} onChange={setPayrollSearch} placeholder="DIP, trabajador, puesto o estado" />
              {visiblePayrollContracts.length ? visiblePayrollContracts.map((contract) => {
                const company = state.accounts.find((account) => account.id === contract.companyAccountId);
                const worker = state.accounts.find((account) => account.id === contract.employeeAccountId);
                const periods = payrollPeriods.filter((period) => period.contractId === contract.id);
                const lastPeriod = periods[0];
                const payrollTxn = lastPeriod?.transactionId ? state.transactions.find((transaction) => transaction.id === lastPeriod.transactionId) : undefined;
                return (
                  <article className="payroll-contract-card" key={contract.id}>
                    <header>
                      <div>
                        <strong>{contract.employeeName}</strong>
                        <span>{contract.employeeDip} · {contract.roleTitle} · {contract.status}</span>
                      </div>
                      <b>{formatPz(contract.grossSalaryPz)} Pz</b>
                    </header>
                    <div className="payroll-chip-row">
                      <span>{company?.displayName || "Empresa"}</span>
                      <span>{worker?.iban || "Sin IBAN"}</span>
                      <span>Antigüedad {payrollTenure(contract.startDate)}</span>
                      <span>{contract.salaryHistory.length} cambios sueldo</span>
                    </div>
                    {periods.length ? (
                      <div className="payroll-period-list">
                        {periods.slice(0, 3).map((period) => (
                          <div key={period.id}>
                            <span>{period.label} · {period.status}</span>
                            <strong>{formatPz(payrollPeriodTotal(period))} Pz</strong>
                          </div>
                        ))}
                      </div>
                    ) : <p className="muted">Sin periodos liquidados todavía.</p>}
                    <div className="payroll-card-actions">
                      <button className="mini-action" onClick={() => {
                        setBusinessId(contract.companyAccountId);
                        setPayrollContactAccountId("");
                        setPayrollEmployeeDip(contract.employeeDip);
                        setPayrollRole(contract.roleTitle);
                        setPayrollStartDate(contract.startDate);
                        setPayrollFrequency(contract.frequency);
                        setPayrollGross(contract.grossSalaryPz);
                      }}>Usar contrato</button>
                      <button className="mini-action" disabled={!worker} onClick={() => {
                        if (worker) generateBankPdf(worker, {
                          id: `alta-${contract.id}`,
                          title: `Alta laboral ${contract.employeeName}`,
                          kind: "LaborContract",
                          labor: {
                            companyName: company?.displayName || contract.companyAccountId,
                            employeeName: contract.employeeName,
                            employeeDip: contract.employeeDip,
                            roleTitle: contract.roleTitle,
                            startDate: contract.startDate,
                            frequency: contract.frequency,
                            grossSalaryPz: contract.grossSalaryPz,
                            workerTaxPz: Math.ceil((contract.grossSalaryPz * state.treasuryConfig.payrollWorkerTaxPercent) / 100),
                            employerTaxPz: Math.ceil((contract.grossSalaryPz * state.treasuryConfig.payrollEmployerTaxPercent) / 100),
                            netSalaryPz: Math.max(0, contract.grossSalaryPz - Math.ceil((contract.grossSalaryPz * state.treasuryConfig.payrollWorkerTaxPercent) / 100)),
                            companyIban: company?.iban,
                            workerIban: worker.iban,
                            status: contract.status
                          }
                        }, []);
                      }}>PDF alta</button>
                      <button className="mini-action" disabled={!payrollTxn || !worker} onClick={() => {
                        if (payrollTxn && worker) generateBankPdf(worker, {
                          id: `payroll-${lastPeriod?.id || payrollTxn.id}`,
                          title: `Nómina ${lastPeriod?.label || contract.employeeName}`,
                          kind: "LaborContract",
                          labor: {
                            companyName: company?.displayName || contract.companyAccountId,
                            employeeName: contract.employeeName,
                            employeeDip: contract.employeeDip,
                            roleTitle: contract.roleTitle,
                            startDate: contract.startDate,
                            frequency: contract.frequency,
                            grossSalaryPz: lastPeriod?.grossSalaryPz || contract.grossSalaryPz,
                            workerTaxPz: lastPeriod?.workerTaxPz,
                            employerTaxPz: lastPeriod?.employerTaxPz,
                            netSalaryPz: lastPeriod?.netSalaryPz,
                            companyIban: company?.iban,
                            workerIban: worker.iban,
                            status: lastPeriod?.status || contract.status,
                            periodLabel: lastPeriod?.label
                          }
                        }, [payrollTxn]);
                      }}>PDF nómina</button>
                    </div>
                  </article>
                );
              }) : <Empty title="Sin contratos" text="Registra la primera nómina para crear el contrato laboral." />}
            </div>
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
        {primaryAccount && (
          <div className="account-create-panel">
            <SectionTitle icon={Sparkles} title="Dar de alta producto" />
            <AccountCreationForm parentAccount={primaryAccount} config={state.treasuryConfig} onCreate={onCreateAccount} />
          </div>
        )}
      </Modal>

      <Modal title="Documentos" open={hubModal === "documents"} onClose={() => setHubModal(null)}>
        <SectionTitle icon={Download} title="Documentos" />
        <p className="muted">Cada PDF se emite para una cuenta o movimiento concreto.</p>
        <h3 className="modal-subtitle">Cuenta</h3>
        <div className="document-grid">
          {documents.map((doc) => {
            const Icon = doc.icon;
            return (
              <button key={doc.title} disabled={!primaryAccount} onClick={() => {
                if (!primaryAccount) return;
                generateBankPdf(primaryAccount, { id: `${doc.id}-${primaryAccount.id}`, title: `${doc.title} · ${primaryAccount.displayName}`, kind: doc.kind }, transactionsFor(primaryAccount.id, state.transactions));
              }}>
                <Icon size={22} />
                <span><strong>{doc.title}</strong><small>{doc.detail}</small></span>
              </button>
            );
          })}
        </div>
        <h3 className="modal-subtitle">Movimientos</h3>
        <div className="document-grid">
          {recent.slice(0, 8).map((transaction) => {
            const account = userAccounts.find((item) => item.id === transaction.fromAccountId || item.id === transaction.toAccountId) || primaryAccount;
            return (
              <button key={transaction.id} disabled={!account} onClick={() => {
                if (!account) return;
                generateBankPdf(account, {
                  id: `transfer-${transaction.id}`,
                  title: `Justificante ${transaction.kind} · ${formatPz(transaction.amountPz)} Pz`,
                  kind: "PaymentReceipt"
                }, [transaction]);
              }}>
                <Banknote size={22} />
                <span><strong>{transaction.kind} · {formatPz(transaction.amountPz)} Pz</strong><small>{transaction.id.slice(0, 12)} · {transaction.status}</small></span>
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
  const todayTax = state.transactions.filter((item) => item.toAccountId === TGLP_ID && item.createdAt.slice(0, 10) === new Date().toISOString().slice(0, 10)).reduce((sum, item) => sum + Math.max(item.amountPz, item.taxAmount, item.ivaPz || 0), 0);
  const pendingExternal = state.transactions.filter((item) => item.kind === "ExternalBlocked" && item.status === "Pending").length;
  const fiscalTx = state.transactions.filter((item) => item.toAccountId === TGLP_ID || item.fromAccountId === TGLP_ID).slice(0, 10);
  const taxActions = [
    { id: "actions" as const, title: "Acciones fiscales", detail: target ? `${target.displayName} seleccionado` : "Seleccionar cuenta", icon: Gavel },
    { id: "alerts" as const, title: "Expedientes", detail: `${state.complianceFlags.length} alertas activas`, icon: ShieldCheck },
    { id: "ranking" as const, title: "Ranking", detail: `${citizenAccounts.length} cuentas auditables`, icon: TrendingUp },
    { id: "history" as const, title: "Movimientos", detail: `${fiscalTx.length} apuntes fiscales`, icon: Banknote }
  ];

  function chargeWeeklyAndDocument() {
    if (!target) return;
    const next = chargeWeeklyTax(state, target.id);
    const taxTxn = next.transactions.find((transaction) =>
      transaction.kind === "Tax" &&
      transaction.fromAccountId === target.id &&
      transaction.toAccountId === TGLP_ID &&
      transaction.originalTransactionId?.endsWith(":weekly-tax")
    );
    onPersist(next, "Impuesto semanal cargado y documento emitido");
    if (taxTxn) {
      const periodKey = taxTxn.concept.replace("WEEKLY_TAX:", "");
      void generateBankPdf(target, {
        id: taxPeriodDocumentId(target.id, periodKey, "weekly"),
        title: `Liquidación semanal ${periodKey} · ${target.displayName}`,
        kind: "WeeklyTaxReport"
      }, [taxTxn]);
    }
    setTaxModal(null);
  }

  function chargeMonthlyAndDocument() {
    const result = chargeMonthlyTaxes(state, new Date(), true);
    onPersist(result.state, "Impuestos del mes anterior cargados y documentos emitidos");
    (result.transactions || []).forEach((transaction) => {
      const account = state.accounts.find((item) => item.id === transaction.fromAccountId);
      if (!account) return;
      const periodKey = transaction.concept.replace("MONTHLY_TAX:", "");
      void generateBankPdf(account, {
        id: taxPeriodDocumentId(account.id, periodKey, "monthly"),
        title: `Liquidación mensual ${periodKey} · ${account.displayName}`,
        kind: "MonthlyTaxReport"
      }, [transaction]);
    });
    setTaxModal(null);
  }

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
        <MetricCard label="Cuentas auditables" value={String(citizenAccounts.length)} tone="accent" />
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
          <button className="primary-button" disabled={!target} onClick={chargeWeeklyAndDocument}>Cobrar semanal + PDF</button>
          <button className="secondary-button" onClick={chargeMonthlyAndDocument}>Cobrar mes anterior + PDF</button>
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

function History({ transactions, accounts }: { transactions: LedgerTransaction[]; accounts: Account[] }) {
  const tglpAccount = accounts.find((account) => account.id === TGLP_ID);
  return (
    <article className="panel history-panel">
      <SectionTitle icon={Banknote} title="Movimientos" />
      {transactions.length ? transactions.map((transaction) => {
        const from = accounts.find((item) => item.id === transaction.fromAccountId);
        const to = accounts.find((item) => item.id === transaction.toAccountId);
        const contextAccount = tglpAccount && (transaction.fromAccountId === TGLP_ID || transaction.toAccountId === TGLP_ID)
          ? tglpAccount
          : to || from;
        const signedAmount = contextAccount ? signedAmountForAccount(transaction, contextAccount.id) : transaction.amountPz;
        return (
          <div className="transaction-row" key={transaction.id}>
            <div className={signedAmount >= 0 ? "txn-icon income" : "txn-icon"}><Banknote size={18} /></div>
            <div>
              <strong>{transaction.note}</strong>
              <span>{from?.displayName || transaction.fromAccountId} → {to?.displayName || transaction.toAccountId}</span>
            </div>
            <b>{formatSignedPz(signedAmount)} Pz</b>
          </div>
        );
      }) : <Empty title="Sin movimientos" text="Las operaciones aparecerán aquí." />}
    </article>
  );
}

function signedAmountForAccount(transaction: LedgerTransaction, accountId: string) {
  if (transaction.toAccountId === accountId) return transaction.amountPz;
  if (transaction.fromAccountId === accountId) return -transaction.amountPz;
  return transaction.amountPz;
}

function formatSignedPz(amount: number) {
  const sign = amount >= 0 ? "+" : "-";
  return `${sign}${formatPz(Math.abs(amount))}`;
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

function MetricCard({ label, value, tone }: { label: string; value: string; tone: "purple" | "accent" | "gold" | "red" }) {
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
  if (path?.startsWith("promos/")) return imageKey === "placezum" ? "/assets/promoscarrusel/7.png" : "/assets/promoscarrusel/1.png";
  if (path) return `/assets/${path}`;
  if (imageKey === "placezum") return "/assets/promoscarrusel/7.png";
  if (imageKey === "market") return "/assets/actu.jpg";
  return "/assets/promoscarrusel/1.png";
}
