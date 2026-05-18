export const TGLP_ID = "TGLP";
export const AGLDP_ID = "AGLDP";
export const FOUNDATION_RBU_ID = "FOUNDATION_RBU";
export const VAULT_EMISION = "VAULT_EMISION";
export const VAT_PERCENT = 12;
export const MINIMUM_INCOME_SHIELD_PZ = 5;
export const RBU_COOLDOWN_DAYS = 7;
export const OFFICIAL_IBAN_PREFIX = "GDLP";

export type AccountKind = "TGLP" | "AGLDP" | "CITIZEN";
export type AccountType = "Current" | "Savings" | "Child" | "Business" | "Investment";
export type Role = "Citizen" | "Tributos" | "Administracion";
export type TransactionStatus = "Settled" | "Reversed" | "Pending" | "Denied";
export type TransactionKind =
  | "Consumption"
  | "PayrollLoan"
  | "Fine"
  | "Tax"
  | "Subsidy"
  | "Donation"
  | "WelcomeBonus"
  | "Rbu"
  | "Reversal"
  | "IvaAdjustment"
  | "Placezum"
  | "Dividend"
  | "ExternalBlocked"
  | "MonetaryEmission"
  | "IrmCharge"
  | "ForcedVatRegularization"
  | "InvestmentBuy"
  | "InvestmentSell"
  | "OperationalFee"
  | "LotteryPrize"
  | "InvestmentTax"
  | "InvestmentCommission"
  | "LateTaxInterest"
  | "SavingsInterest"
  | "CardIssueFee"
  | "BusinessRegistrationFee";

export type Account = {
  id: string;
  displayName: string;
  kind: AccountKind;
  balancePz: number;
  placetaId?: string | null;
  role: Role;
  lastRbuClaim?: string | null;
  type: AccountType;
  iban: string;
  parentAccountId?: string | null;
  huchaLocked?: boolean;
  sendLimitPz?: number | null;
  citizenshipTier?: string;
  complianceStatus?: string;
  fundsJustificationApproved?: boolean;
  listedInvestmentFund?: boolean;
  investmentRiskLevel?: number;
};

export type UserProfile = {
  dip: string;
  displayName: string;
  placetaId: string;
  pinHash: string;
  primaryAccountId: string;
  birthDate?: string | null;
  verifiedAge?: number | null;
  consentimiento_rgpd?: boolean;
  consentimiento_rgpd_at?: string | null;
  createdAt: string;
};

export type LedgerTransaction = {
  id: string;
  kind: TransactionKind;
  fromAccountId: string;
  toAccountId: string;
  amountPz: number;
  ivaPz: number;
  note: string;
  status: TransactionStatus;
  createdAt: string;
  originalTransactionId?: string | null;
  netAmount: number;
  taxAmount: number;
  concept: string;
  IBAN_Origin: string;
};

export type DigitalCard = {
  id: string;
  accountId: string;
  alias: string;
  tier: "Standard" | "Premium" | "Child";
  frozen: boolean;
  cardNumber: string;
  pin: string;
  promoPhysical?: boolean;
  released?: boolean;
};

export type SavedContact = {
  id: string;
  ownerPlacetaId: string;
  accountId: string;
  createdAt: string;
};

export type InvestmentHolding = {
  id: string;
  accountId: string;
  assetName: string;
  units: number;
  currentValuePz: number;
  performance: number[];
};

export type InvestmentOperation = {
  id: string;
  accountId: string;
  companyId: string;
  assetName: string;
  amountPz: number;
  createdAt: string;
  readyAt: string;
  settledAt?: string | null;
};

export type PromoSlide = {
  id: string;
  title: string;
  subtitle: string;
  action: "Login" | "Register" | "Demo";
  imageKey: string;
  imageUrl?: string | null;
  assetPath?: string | null;
};

export type ComplianceFlag = {
  id: string;
  accountId: string;
  reason: string;
  amountPz: number;
  status: string;
  createdAt: string;
};

export type SubsidyRequest = {
  id: string;
  requestedBy: string;
  targetAccountId: string;
  sourceAccountId: string;
  amountPz: number;
  reason: string;
  status: TransactionStatus;
  createdAt: string;
};

export type SupportTicket = {
  id: string;
  ownerDip: string;
  accountId: string;
  subject: string;
  message: string;
  attachments: string[];
  status: "Open" | "WaitingSupport" | "Closed";
  createdAt: string;
  updatedAt: string;
};

export type DeveloperPayment = {
  id: string;
  merchantIban: string;
  customerAccountId?: string | null;
  amountPz: number;
  ivaPz: number;
  totalPz: number;
  concept: string;
  status: "Pending" | "Paid" | "Denied";
  createdAt: string;
  paidAt?: string | null;
  transactionId?: string | null;
};

export type PaymentLink = {
  id: string;
  kind: "Payment" | "Send";
  creatorAccountId: string;
  targetIban?: string | null;
  amountPz: number;
  ivaPz: number;
  totalPz: number;
  concept: string;
  status: "Pending" | "Paid" | "Cancelled";
  createdAt: string;
  usedAt?: string | null;
  usedByAccountId?: string | null;
  transactionId?: string | null;
};

export type GdlpSharedNewsItem = {
  slug: string;
  title: string;
  tag: string;
  summary: string;
  date: string;
  image: string;
  images?: string[];
  body: string[];
  html?: string;
  videoUrl?: string;
  videos?: string[];
  source?: string;
  updatedAt?: string;
};

export type DonationRewardStatus = "Available" | "Redeemed" | "Donated";

export type DonationReward = {
  id: string;
  dip: string;
  placetaId: string;
  amountCents: number;
  currency: string;
  points: number;
  status: DonationRewardStatus;
  destination?: "Wallet" | "Foundation" | "Merch";
  merchSku?: string | null;
  shippingCountry?: string | null;
  shippingPostalCode?: string | null;
  shippingRegion?: "ES_PENINSULA" | null;
  stripePaymentIntentId: string;
  createdAt: string;
  updatedAt?: string;
};

export type TreasuryConfig = {
  operationalTransferTaxPercent: number;
  webBridgeCommissionPercent: number;
  contactlessLimitPz: number;
  placezumWeeklyLimitPz: number;
  weeklyTaxPercent: number;
  weeklyDeveloperApiFeePercent: number;
  weeklyPaymentLinkFeePercent: number;
  minimumWeeklySalaryPz: number;
  payrollWorkerTaxPercent: number;
  payrollEmployerTaxPercent: number;
  cardIssueFeePz: number;
  businessRegistrationFeePz: number;
  auditDailyTransferLimitPz: number;
  personalDeclarationThresholdPz: number;
  institutionalDeclarationThresholdPz: number;
  savingsInterestAnnualPercent: number;
  juniorSavingsInterestAnnualPercent: number;
  lateTaxInterestAnnualPercent: number;
  irmPersonalPercent: number;
  irmSharedPercent: number;
  irmBusinessPercent: number;
  accumulationIndexThreshold: number;
  lotteryTaxPercent: number;
  lotteryTaxThresholdPz: number;
  investmentProfitTaxPercent: number;
  investmentGainCommissionPercent: number;
  maxInvestmentAmountPz: number;
  dailyInvestmentLimit: number;
  minSupportedVersionCode: number;
  lastSavingsInterestDate?: string | null;
};

export type BankState = {
  users: UserProfile[];
  accounts: Account[];
  transactions: LedgerTransaction[];
  subsidyRequests: SubsidyRequest[];
  investmentHoldings: InvestmentHolding[];
  investmentOperations: InvestmentOperation[];
  digitalCards: DigitalCard[];
  savedContacts: SavedContact[];
  promoSlides: PromoSlide[];
  treasuryConfig: TreasuryConfig;
  complianceFlags: ComplianceFlag[];
  supportTickets: SupportTicket[];
  paymentLinks: PaymentLink[];
  gdlpSharedNews: GdlpSharedNewsItem[];
  periodicoNews: GdlpSharedNewsItem[];
  donationRewards: DonationReward[];
  schemaSeedVersion?: number;
  updatedAt?: string | null;
};

export type StateConflictPayload = {
  error: "state_conflict";
  remote: BankState;
};

export const treasuryDefaults: TreasuryConfig = {
  operationalTransferTaxPercent: 7,
  webBridgeCommissionPercent: 3,
  contactlessLimitPz: 500,
  placezumWeeklyLimitPz: 1000,
  weeklyTaxPercent: 2,
  weeklyDeveloperApiFeePercent: 1,
  weeklyPaymentLinkFeePercent: 1,
  minimumWeeklySalaryPz: 150,
  payrollWorkerTaxPercent: 10,
  payrollEmployerTaxPercent: 10,
  cardIssueFeePz: 25,
  businessRegistrationFeePz: 250,
  auditDailyTransferLimitPz: 5000,
  personalDeclarationThresholdPz: 500000,
  institutionalDeclarationThresholdPz: 10000000,
  savingsInterestAnnualPercent: 2,
  juniorSavingsInterestAnnualPercent: 3,
  lateTaxInterestAnnualPercent: 12,
  irmPersonalPercent: 5,
  irmSharedPercent: 6,
  irmBusinessPercent: 9,
  accumulationIndexThreshold: 0.3,
  lotteryTaxPercent: 20,
  lotteryTaxThresholdPz: 1000,
  investmentProfitTaxPercent: 10,
  investmentGainCommissionPercent: 4,
  maxInvestmentAmountPz: 1200,
  dailyInvestmentLimit: 15,
  minSupportedVersionCode: 4,
  lastSavingsInterestDate: null
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
}

export function normalizeIban(value: string) {
  return value.replace(/\s+/g, "").toUpperCase();
}

export function normalizeTreasuryConfig(config: Partial<TreasuryConfig> = {}): TreasuryConfig {
  const next = { ...treasuryDefaults, ...config };
  return {
    ...next,
    operationalTransferTaxPercent: clamp(next.operationalTransferTaxPercent, 0, VAT_PERCENT),
    webBridgeCommissionPercent: clamp(next.webBridgeCommissionPercent, 0, VAT_PERCENT),
    placezumWeeklyLimitPz: clamp(next.placezumWeeklyLimitPz, 0, 1000000),
    weeklyTaxPercent: clamp(next.weeklyTaxPercent, 0, 25),
    weeklyDeveloperApiFeePercent: clamp(next.weeklyDeveloperApiFeePercent, 0, 25),
    weeklyPaymentLinkFeePercent: clamp(next.weeklyPaymentLinkFeePercent, 0, 25),
    minimumWeeklySalaryPz: clamp(next.minimumWeeklySalaryPz, 1, 10000),
    payrollWorkerTaxPercent: clamp(next.payrollWorkerTaxPercent, 0, 35),
    payrollEmployerTaxPercent: clamp(next.payrollEmployerTaxPercent, 0, 35),
    savingsInterestAnnualPercent: clamp(next.savingsInterestAnnualPercent, 0, 12),
    juniorSavingsInterestAnnualPercent: clamp(next.juniorSavingsInterestAnnualPercent, 0, 12),
    lateTaxInterestAnnualPercent: clamp(next.lateTaxInterestAnnualPercent, 0, 100),
    lotteryTaxPercent: clamp(next.lotteryTaxPercent, 0, 100),
    investmentProfitTaxPercent: clamp(next.investmentProfitTaxPercent, 0, 100),
    investmentGainCommissionPercent: clamp(next.investmentGainCommissionPercent, 0, 100),
    maxInvestmentAmountPz: clamp(next.maxInvestmentAmountPz, 1, 1200),
    dailyInvestmentLimit: clamp(next.dailyInvestmentLimit, 1, 250),
    minSupportedVersionCode: Math.max(4, Math.floor(next.minSupportedVersionCode || 4))
  };
}

export function formatPz(amount: number) {
  return Math.round(amount).toLocaleString("es-ES");
}

export function formatMoneyPz(amount: number) {
  return `${formatPz(amount)},00`;
}

export function accountTypeLabel(type: AccountType) {
  return {
    Current: "Personal",
    Savings: "Hucha",
    Child: "Infantil",
    Business: "Empresa",
    Investment: "Inversión"
  }[type];
}

export function ibanGenerate(seed: string) {
  const normalized = seed.toUpperCase().replace(/[^A-Z0-9]/g, "") || "0000";
  let body = 17;
  for (const char of normalized) body = (body * 31 + char.charCodeAt(0)) % 1000;
  const control = ((body * 97) + 13) % 100;
  return `${OFFICIAL_IBAN_PREFIX}-AP${String(control).padStart(2, "0")}-${String(body).padStart(3, "0")}`;
}

export function isOfficialIban(iban: string) {
  const upper = iban.toUpperCase();
  if (/^GDLP-W\d{3}-\d{4}$/.test(upper)) return true;
  const match = upper.match(/^GDLP-AP(\d{2})-(\d{3})$/);
  if (!match) return false;
  return Number(match[1]) === ((Number(match[2]) * 97) + 13) % 100;
}

export async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function makeId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

export function createBankAccount(state: BankState, ownerPlacetaId: string, displayName: string, type: AccountType, parentAccountId?: string | null, cardTier: DigitalCard["tier"] = type === "Child" ? "Child" : "Standard") {
  const id = makeId("acct");
  const account: Account = {
    id,
    displayName: displayName.trim() || accountTypeLabel(type),
    kind: "CITIZEN",
    balancePz: 0,
    placetaId: ownerPlacetaId,
    role: "Citizen",
    type,
    iban: ibanGenerate(id),
    parentAccountId: type === "Child" ? parentAccountId || null : null,
    huchaLocked: type === "Savings",
    sendLimitPz: type === "Child" ? 50 : null,
    citizenshipTier: type === "Business" ? "Institucion" : type === "Child" ? "JuniorBasica" : "CiudadaniaPlena",
    complianceStatus: "Clear",
    fundsJustificationApproved: false,
    listedInvestmentFund: type === "Business" ? false : undefined,
    investmentRiskLevel: type === "Investment" ? 1 : undefined
  };
  const card: DigitalCard = {
    id: `card-${id}`,
    accountId: id,
    alias: `${account.displayName} Card`,
    tier: type === "Child" ? "Child" : cardTier,
    frozen: false,
    cardNumber: String(Math.floor(Math.random() * 1000000)).padStart(6, "0"),
    pin: "0000",
    promoPhysical: false,
    released: true
  };

  return {
    account,
    state: finalizeState({
      ...state,
      accounts: [...state.accounts, account],
      digitalCards: [...state.digitalCards, card]
    })
  };
}

function account(
  id: string,
  displayName: string,
  kind: AccountKind,
  balancePz: number,
  placetaId?: string | null,
  type: AccountType = "Current",
  role: Role = "Citizen",
  extras: Partial<Account> = {}
): Account {
  return {
    id,
    displayName,
    kind,
    balancePz,
    placetaId,
    role,
    type,
    iban: extras.iban || ibanGenerate(id),
    citizenshipTier: "CiudadaniaPlena",
    complianceStatus: "Clear",
    ...extras
  };
}

export function demoSeed(): BankState {
  const now = new Date().toISOString();
  const accounts = [
    account(TGLP_ID, "TGLP Tributos", "TGLP", 8500, null, "Current", "Tributos"),
    account(AGLDP_ID, "AGLDP Administración", "AGLDP", 94000, null, "Current", "Administracion"),
    account(FOUNDATION_RBU_ID, "Fundación Banco de La Placeta", "AGLDP", 12000, null, "Current", "Administracion"),
    account(VAULT_EMISION, "Vault Emisión", "AGLDP", 0, null, "Current", "Administracion"),
    account("u-alba", "Personal", "CITIZEN", 12400, "ALBA-001"),
    account("u-alba-save", "Ahorro · Hucha", "CITIZEN", 42000, "ALBA-001", "Savings", "Citizen", { huchaLocked: true }),
    account("u-alba-biz", "Empresa Alba & Co", "CITIZEN", 87500, "ALBA-001", "Business", "Citizen", { citizenshipTier: "Institucion" }),
    account("u-alba-child", "Infantil supervisada", "CITIZEN", 1200, "ALBA-001", "Child", "Citizen", { parentAccountId: "u-alba", sendLimitPz: 50, citizenshipTier: "JuniorBasica" }),
    account("u-alba-invest", "Cartera Plazet", "CITIZEN", 18900, "ALBA-001", "Investment"),
    account("u-dario", "Darío Vega", "CITIZEN", 6800, "DARIO-014"),
    account("u-lia", "Lía Montes", "CITIZEN", 31500, "LIA-022"),
    account("biz-market-dario", "Taller Dario SA", "CITIZEN", 64000, "DARIO-SA", "Business", "Citizen", { citizenshipTier: "Institucion", listedInvestmentFund: true, investmentRiskLevel: 3 }),
    account("biz-market-cristal", "Cristal Escaso", "CITIZEN", 113000, "CRISTAL-ESC", "Business", "Citizen", { citizenshipTier: "Institucion", listedInvestmentFund: true, investmentRiskLevel: 6 }),
    account("biz-market-propiedad", "Propiedad La Placeta #042", "CITIZEN", 146500, "PROP-042", "Business", "Citizen", { citizenshipTier: "Institucion", listedInvestmentFund: true, investmentRiskLevel: 2 })
  ];
  return {
    users: [
      { dip: "DIP-A001", displayName: "Alba Placeta", placetaId: "ALBA-001", pinHash: "03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4", primaryAccountId: "u-alba", verifiedAge: 28, createdAt: now },
      { dip: "DIP-D014", displayName: "Darío Vega", placetaId: "DARIO-014", pinHash: "03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4", primaryAccountId: "u-dario", verifiedAge: 34, createdAt: now }
    ],
    accounts,
    transactions: [
      txn("txn-demo-1", "WelcomeBonus", AGLDP_ID, "u-alba", 500, 0, "Bono de bienvenida Banco Placeta", "WELCOME_BONUS"),
      txn("txn-demo-2", "Consumption", "u-alba", "biz-market-dario", 36, 5, "Café y reparación · CONSUMO GDLP", "CONSUMO"),
      txn("txn-demo-3", "Rbu", FOUNDATION_RBU_ID, "u-alba", 150, 0, "Renta Básica Universal", "RBU"),
      txn("txn-demo-4", "InvestmentBuy", "u-alba-invest", "biz-market-cristal", 300, 21, "Inversión 60s iniciada: Cristal Escaso", "InvestmentBuy")
    ],
    subsidyRequests: [],
    investmentHoldings: [],
    investmentOperations: [],
    digitalCards: [
      { id: "card-alba", accountId: "u-alba", alias: "Placeta Black", tier: "Standard", frozen: false, cardNumber: "183042", pin: "0000", released: true },
      { id: "card-child", accountId: "u-alba-child", alias: "Junior supervisada", tier: "Child", frozen: false, cardNumber: "000122", pin: "0000" }
    ],
    savedContacts: [
      { id: "contact-dario", ownerPlacetaId: "ALBA-001", accountId: "u-dario", createdAt: now },
      { id: "contact-lia", ownerPlacetaId: "ALBA-001", accountId: "u-lia", createdAt: now }
    ],
    supportTickets: [],
    paymentLinks: [],
    gdlpSharedNews: [],
    periodicoNews: [],
    donationRewards: [],
    promoSlides: [
      { id: "promo-1", title: "BANCO PLACETA", subtitle: "Tu centro financiero seguro, claro y siempre a mano.", action: "Login", imageKey: "bank", assetPath: "promos/banco-default.png" },
      { id: "promo-2", title: "PLACEZUM", subtitle: "Pagos rápidos con IBAN GDLP-APXX-XXX y control total.", action: "Register", imageKey: "placezum", assetPath: "promos/placezum-default.png" },
      { id: "promo-3", title: "MERCADO GDLP", subtitle: "Invierte, revisa movimientos y descarga documentos fiscales.", action: "Demo", imageKey: "market", assetPath: "promos/mercado-default.png" }
    ],
    treasuryConfig: treasuryDefaults,
    complianceFlags: [],
    schemaSeedVersion: 2,
    updatedAt: now
  };
}

function txn(id: string, kind: TransactionKind, fromAccountId: string, toAccountId: string, amountPz: number, ivaPz: number, note: string, concept: string): LedgerTransaction {
  return {
    id,
    kind,
    fromAccountId,
    toAccountId,
    amountPz,
    ivaPz,
    note,
    status: "Settled",
    createdAt: new Date(Date.now() - Math.floor(Math.random() * 90000000)).toISOString(),
    netAmount: amountPz,
    taxAmount: ivaPz,
    concept,
    IBAN_Origin: ibanGenerate(fromAccountId)
  };
}

export function normalizeState(input: Partial<BankState> | null | undefined): BankState {
  const seed = demoSeed();
  if (!input) return seed;
  const transactions = dedupeBy(input.transactions?.length ? input.transactions : seed.transactions, "id")
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  return {
    ...seed,
    ...input,
    users: dedupeBy(input.users?.length ? input.users : seed.users, "dip").sort((left, right) => left.displayName.localeCompare(right.displayName)),
    accounts: dedupeBy(input.accounts?.length ? input.accounts : seed.accounts, "id"),
    transactions,
    subsidyRequests: dedupeBy(input.subsidyRequests || [], "id"),
    investmentHoldings: dedupeBy(input.investmentHoldings || [], "id"),
    investmentOperations: dedupeBy(input.investmentOperations || [], "id").sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
    digitalCards: dedupeByComposite(input.digitalCards || [], (card) => card.id || `${card.accountId}:${card.cardNumber}`),
    savedContacts: dedupeByComposite(input.savedContacts || [], (contact) => `${contact.ownerPlacetaId}:${contact.accountId}`).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
    complianceFlags: dedupeBy(input.complianceFlags || [], "id").sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
    supportTickets: dedupeBy(input.supportTickets || [], "id").sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)),
    paymentLinks: dedupeBy(input.paymentLinks || [], "id").sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
    gdlpSharedNews: dedupeBy(input.gdlpSharedNews || [], "slug").sort((a, b) => Date.parse(b.updatedAt || b.date) - Date.parse(a.updatedAt || a.date)),
    periodicoNews: dedupeBy(input.periodicoNews || [], "slug").sort((a, b) => Date.parse(b.updatedAt || b.date) - Date.parse(a.updatedAt || a.date)),
    donationRewards: dedupeBy(input.donationRewards || [], "id").sort((a, b) => Date.parse(b.updatedAt || b.createdAt) - Date.parse(a.updatedAt || a.createdAt)),
    treasuryConfig: normalizeTreasuryConfig(input.treasuryConfig || {}),
    promoSlides: dedupeBy(input.promoSlides?.length ? input.promoSlides : seed.promoSlides, "id"),
    updatedAt: input.updatedAt || seed.updatedAt
  };
}

export function applyTransactions(current: LedgerTransaction[], incoming: LedgerTransaction[]) {
  const byId = new Map<string, LedgerTransaction>();
  [...incoming, ...current].forEach((transaction) => byId.set(transaction.id, transaction));
  return [...byId.values()].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export function finalizeState(state: BankState): BankState {
  const config = normalizeTreasuryConfig(state.treasuryConfig);
  const normalized = normalizeState({ ...state, treasuryConfig: config });
  return {
    ...normalized,
    treasuryConfig: config,
    complianceFlags: dedupeBy(buildAuditFlags(normalized.accounts, normalized.transactions, normalized.complianceFlags, config), "id"),
    updatedAt: new Date().toISOString()
  };
}

export function transferByIban(state: BankState, fromId: string, targetIban: string, amountPz: number, note: string, kind: TransactionKind = "Placezum") {
  const accounts = state.accounts.map((item) => ({ ...item }));
  const from = accounts.find((item) => item.id === fromId);
  if (!from) throw new Error("Cuenta emisora no encontrada");
  if (amountPz <= 0) throw new Error("El monto debe ser superior a 0 Pz");
  if (from.balancePz < MINIMUM_INCOME_SHIELD_PZ) throw new Error("Mínimo Vital");
  if (!isOfficialIban(targetIban)) {
    if (requiresDeclaration(from, state.treasuryConfig)) {
      throw new Error("Declaración obligatoria: adjunta justificación de fondos antes de transferencias externas");
    }
    const transaction = makeTransaction("ExternalBlocked", from, targetIban, amountPz, 0, `Entidad No Reconocida: ${note}`);
    transaction.status = "Pending";
    transaction.concept = kind;
    return finalizeState({
      ...state,
      transactions: applyTransactions(state.transactions, [transaction])
    });
  }
  const to = accounts.find((item) => item.iban.toUpperCase() === targetIban.toUpperCase());
  if (!to) throw new Error("IBAN oficial no localizado");
  if (kind === "Consumption" || kind === "Placezum") {
    return transferConsumption(state, fromId, to.id, amountPz, note, kind);
  }
  if (kind === "PayrollLoan") {
    return transferPayrollOrLoan(state, fromId, to.id, amountPz, note);
  }
  if (from.type === "Savings" && from.huchaLocked) throw new Error("Hucha bloqueada: desbloquea la cuenta de ahorro para enviar dinero");
  if (from.type === "Child" && amountPz > (from.sendLimitPz || Number.MAX_SAFE_INTEGER)) throw new Error("Control parental: límite de envío infantil superado");
  const fee = percentCeil(amountPz, state.treasuryConfig.operationalTransferTaxPercent);
  const totalDebit = amountPz + fee;
  if (from.balancePz < totalDebit) throw new Error("Saldo insuficiente");
  if (from.balancePz - totalDebit < MINIMUM_INCOME_SHIELD_PZ) throw new Error("Operación bloqueada para garantizar tu Renta Básica");
  const tglp = accounts.find((item) => item.id === TGLP_ID);
  from.balancePz -= totalDebit;
  to.balancePz += amountPz;
  if (tglp) tglp.balancePz += fee;
  const transaction = makeTransaction(kind, from, to.id, amountPz, fee, note || kind);
  const feeTransaction = fee > 0 ? makeTransaction("OperationalFee", from, TGLP_ID, fee, fee, `Tasa operativa ${state.treasuryConfig.operationalTransferTaxPercent}%`) : null;
  if (feeTransaction) {
    feeTransaction.netAmount = 0;
    feeTransaction.concept = "OPERATIONAL_FEE";
  }
  return finalizeState({
    ...state,
    accounts,
    transactions: applyTransactions(state.transactions, [transaction, feeTransaction].filter(Boolean) as LedgerTransaction[])
  });
}

export function transferConsumption(state: BankState, fromId: string, toId: string, amountPz: number, note: string, kind: "Consumption" | "Placezum" = "Consumption") {
  const accounts = state.accounts.map((item) => ({ ...item }));
  const from = accounts.find((item) => item.id === fromId);
  const to = accounts.find((item) => item.id === toId);
  const tglp = accounts.find((item) => item.id === TGLP_ID);
  if (!from) throw new Error("Cuenta emisora no encontrada");
  if (!to) throw new Error("Cuenta receptora no encontrada");
  if (!tglp) throw new Error("Cuenta TGLP no encontrada");
  if (amountPz <= 0) throw new Error("El monto debe ser superior a 0 Pz");
  const iva = percentCeil(amountPz, VAT_PERCENT);
  const totalDebit = amountPz + iva;
  if (from.balancePz < totalDebit) throw new Error("Saldo insuficiente para cubrir el IVA del 12%");
  if (from.balancePz - totalDebit < MINIMUM_INCOME_SHIELD_PZ) throw new Error("Operación bloqueada para garantizar tu Renta Básica");
  from.balancePz -= totalDebit;
  to.balancePz += amountPz;
  tglp.balancePz += iva;
  const transaction = makeTransaction(kind, from, to.id, amountPz, iva, note);
  transaction.concept = kind;
  return finalizeState({ ...state, accounts, transactions: applyTransactions(state.transactions, [transaction]) });
}

export function transferPayrollOrLoan(state: BankState, fromId: string, toId: string, amountPz: number, note: string) {
  const accounts = state.accounts.map((item) => ({ ...item }));
  const from = accounts.find((item) => item.id === fromId);
  const to = accounts.find((item) => item.id === toId);
  const tglp = accounts.find((item) => item.id === TGLP_ID);
  if (!from) throw new Error("Cuenta emisora no encontrada");
  if (!to) throw new Error("Cuenta receptora no encontrada");
  if (!tglp) throw new Error("Tributos del Grupo no disponible");
  if (from.type !== "Business" || to.type !== "Current") throw new Error("La nómina solo puede salir de Empresa hacia Cuenta Personal");
  if (amountPz < state.treasuryConfig.minimumWeeklySalaryPz) throw new Error(`La nómina debe cumplir el SMI mínimo de ${state.treasuryConfig.minimumWeeklySalaryPz} Pz`);
  const workerTax = percentCeil(amountPz, state.treasuryConfig.payrollWorkerTaxPercent);
  const employerTax = percentCeil(amountPz, state.treasuryConfig.payrollEmployerTaxPercent);
  const netSalary = amountPz - workerTax;
  const totalDebit = amountPz + employerTax;
  if (from.balancePz < totalDebit) throw new Error("Saldo insuficiente para nómina bruta y tributo empresarial");
  if (from.balancePz - totalDebit < MINIMUM_INCOME_SHIELD_PZ) throw new Error("Operación bloqueada para garantizar tu Renta Básica");
  from.balancePz -= totalDebit;
  to.balancePz += netSalary;
  tglp.balancePz += workerTax + employerTax;
  const transaction = makeTransaction("PayrollLoan", from, to.id, amountPz, workerTax + employerTax, `${note} · Bruto ${amountPz}Pz · Trabajador ${state.treasuryConfig.payrollWorkerTaxPercent}% · Empresa ${state.treasuryConfig.payrollEmployerTaxPercent}%`);
  transaction.netAmount = netSalary;
  transaction.concept = "PAYROLL_REGISTERED";
  return finalizeState({ ...state, accounts, transactions: applyTransactions(state.transactions, [transaction]) });
}

export function claimRbu(state: BankState, accountId: string, amountPz = 150) {
  const accounts = state.accounts.map((item) => ({ ...item }));
  const fund = accounts.find((item) => item.id === FOUNDATION_RBU_ID) || accounts.find((item) => item.id === AGLDP_ID);
  const account = accounts.find((item) => item.id === accountId);
  if (!fund || !account) throw new Error("Fondo RBU no encontrado");
  if (account.citizenshipTier === "JuniorBasica") throw new Error("Junior Básica no puede reclamar RBU");
  if (account.lastRbuClaim) {
    const last = new Date(account.lastRbuClaim);
    if (Date.now() < last.getTime() + RBU_COOLDOWN_DAYS * 86400000) throw new Error("La RBU solo puede reclamarse una vez cada 7 días");
  }
  if (fund.balancePz < amountPz) throw new Error("Fundación Banco de La Placeta no tiene saldo suficiente");
  fund.balancePz -= amountPz;
  account.balancePz += amountPz;
  account.lastRbuClaim = new Date().toISOString().slice(0, 10);
  const transaction = makeTransaction("Rbu", fund, account.id, amountPz, 0, "Renta Básica Universal · Fundación Banco de La Placeta");
  return finalizeState({ ...state, accounts, transactions: applyTransactions(state.transactions, [transaction]) });
}

export function issueCard(state: BankState, accountId: string) {
  const card: DigitalCard = {
    id: makeId("card"),
    accountId,
    alias: "Placeta Black",
    tier: "Standard",
    frozen: false,
    cardNumber: String(Math.floor(Math.random() * 1000000)).padStart(6, "0"),
    pin: "0000",
    released: true
  };
  return finalizeState({ ...state, digitalCards: [...state.digitalCards, card] });
}

export function addSavedContact(state: BankState, ownerPlacetaId: string, accountId: string) {
  const account = state.accounts.find((item) => item.id === accountId);
  if (!account) throw new Error("Cuenta de contacto no encontrada");
  const contact: SavedContact = {
    id: `contact-${ownerPlacetaId}-${accountId}`,
    ownerPlacetaId,
    accountId,
    createdAt: new Date().toISOString()
  };
  return finalizeState({
    ...state,
    savedContacts: upsertById(state.savedContacts.filter((item) => !(item.ownerPlacetaId === ownerPlacetaId && item.accountId === accountId)), contact)
  });
}

export function removeSavedContact(state: BankState, ownerPlacetaId: string, accountId: string) {
  return finalizeState({
    ...state,
    savedContacts: state.savedContacts.filter((item) => !(item.ownerPlacetaId === ownerPlacetaId && item.accountId === accountId))
  });
}

export function generatePlacezumCode(account: Account, now = new Date()) {
  const windowId = Math.floor(now.getTime() / 1000 / 120);
  let raw = 0;
  for (const char of `${account.iban}${windowId}`) raw = Math.abs(raw * 31 + char.charCodeAt(0));
  return String(raw % 100000).padStart(5, "0");
}

export function emitMoney(state: BankState, amountPz: number, note = "Emisión monetaria AGLDP") {
  if (amountPz <= 0) throw new Error("La emisión debe ser superior a 0 Pz");
  const accounts = ensureVaultEmission(state.accounts.map((item) => ({ ...item })));
  const emission = accounts.find((item) => item.id === VAULT_EMISION)!;
  const admin = accounts.find((item) => item.id === AGLDP_ID);
  if (!admin) throw new Error("Cuenta AGLDP no encontrada");
  admin.balancePz += amountPz;
  const transaction = makeTransaction("MonetaryEmission", emission, AGLDP_ID, amountPz, 0, note);
  return finalizeState({ ...state, accounts, transactions: applyTransactions(state.transactions, [transaction]) });
}

export function chargeWeeklyTax(state: BankState, accountId: string) {
  const account = state.accounts.find((item) => item.id === accountId);
  if (!account) throw new Error("Cuenta no encontrada");
  const amount = percentCeil(Math.max(0, account.balancePz), state.treasuryConfig.weeklyTaxPercent);
  if (amount <= 0) throw new Error("Impuesto semanal sin base liquidable");
  return simpleTransfer(state, accountId, TGLP_ID, amount, "Tax", `Impuesto semanal ${state.treasuryConfig.weeklyTaxPercent}%`, true);
}

export function businessUsageFeePreview(state: BankState, businessAccountId: string, now = new Date()) {
  const weekKey = weeklyFeeKey(now);
  const business = state.accounts.find((account) => account.id === businessAccountId);
  if (!business || business.type !== "Business") {
    return { weekKey, apiBasePz: 0, linkBasePz: 0, apiFeePz: 0, linkFeePz: 0, totalFeePz: 0, alreadyCharged: false };
  }
  const weekStart = weekStartUtc(now).getTime();
  const paidLinks = new Set((state.paymentLinks || [])
    .filter((link) => link.creatorAccountId === businessAccountId && link.status === "Paid")
    .map((link) => link.id));
  const apiBasePz = state.transactions
    .filter((transaction) =>
      transaction.concept === "DEVELOPER_PAYMENT" &&
      transaction.toAccountId === businessAccountId &&
      Date.parse(transaction.createdAt) >= weekStart
    )
    .reduce((sum, transaction) => sum + transaction.amountPz, 0);
  const linkBasePz = state.transactions
    .filter((transaction) =>
      paidLinks.has(transaction.originalTransactionId || "") &&
      Date.parse(transaction.createdAt) >= weekStart
    )
    .reduce((sum, transaction) => sum + transaction.amountPz, 0);
  const apiFeePz = apiBasePz > 0 ? percentCeil(apiBasePz, state.treasuryConfig.weeklyDeveloperApiFeePercent) : 0;
  const linkFeePz = linkBasePz > 0 ? percentCeil(linkBasePz, state.treasuryConfig.weeklyPaymentLinkFeePercent) : 0;
  const totalFeePz = apiFeePz + linkFeePz;
  const alreadyCharged = state.transactions.some((transaction) =>
    transaction.originalTransactionId === `${businessAccountId}:${weekKey}` &&
    (transaction.concept === "WEEKLY_DEVELOPER_API_FEE" || transaction.concept === "WEEKLY_PAYMENT_LINK_FEE")
  );
  return { weekKey, apiBasePz, linkBasePz, apiFeePz, linkFeePz, totalFeePz, alreadyCharged };
}

export function chargeWeeklyBusinessUsageFees(state: BankState, businessAccountId: string) {
  const preview = businessUsageFeePreview(state, businessAccountId);
  const business = state.accounts.find((account) => account.id === businessAccountId);
  const tglp = state.accounts.find((account) => account.id === TGLP_ID);
  if (!business || business.type !== "Business") throw new Error("Selecciona una cuenta empresa");
  if (!tglp) throw new Error("Cuenta TGLP no encontrada");
  if (preview.alreadyCharged) throw new Error("Tasas semanales de empresa ya cobradas esta semana");
  if (preview.totalFeePz <= 0) throw new Error("Sin base liquidable de API o enlaces esta semana");
  if (business.balancePz < preview.totalFeePz) throw new Error("La empresa no tiene saldo para liquidar tasas semanales");
  const accounts = state.accounts.map((account) => ({ ...account }));
  const nextBusiness = accounts.find((account) => account.id === business.id)!;
  const nextTglp = accounts.find((account) => account.id === TGLP_ID)!;
  nextBusiness.balancePz -= preview.totalFeePz;
  nextTglp.balancePz += preview.totalFeePz;
  const transactions: LedgerTransaction[] = [];
  if (preview.apiFeePz > 0) {
    const apiFee = makeTransaction("Tax", nextBusiness, TGLP_ID, preview.apiFeePz, preview.apiFeePz, `Tasa semanal API pagos ${state.treasuryConfig.weeklyDeveloperApiFeePercent}% · base ${formatPz(preview.apiBasePz)} Pz`);
    apiFee.concept = "WEEKLY_DEVELOPER_API_FEE";
    apiFee.originalTransactionId = `${businessAccountId}:${preview.weekKey}`;
    transactions.push(apiFee);
  }
  if (preview.linkFeePz > 0) {
    const linkFee = makeTransaction("Tax", nextBusiness, TGLP_ID, preview.linkFeePz, preview.linkFeePz, `Tasa semanal enlaces de pago/cobro ${state.treasuryConfig.weeklyPaymentLinkFeePercent}% · base ${formatPz(preview.linkBasePz)} Pz`);
    linkFee.concept = "WEEKLY_PAYMENT_LINK_FEE";
    linkFee.originalTransactionId = `${businessAccountId}:${preview.weekKey}`;
    transactions.push(linkFee);
  }
  return finalizeState({ ...state, accounts, transactions: applyTransactions(state.transactions, transactions) });
}

export function issueOfficialFine(state: BankState, accountId: string, amountPz: number, note = "Sanción oficial AGLDP") {
  if (amountPz <= 0) throw new Error("La multa debe ser superior a 0 Pz");
  return simpleTransfer(state, accountId, AGLDP_ID, amountPz, "Fine", note, true);
}

export function forceVatRegularization(state: BankState, accountId: string, netAmountPz: number, note = "Regularización IVA forzosa") {
  if (netAmountPz <= 0) throw new Error("Base IVA inválida");
  return simpleTransfer(state, accountId, TGLP_ID, percentCeil(netAmountPz, VAT_PERCENT), "ForcedVatRegularization", note, true);
}

export function updateTreasuryConfig(state: BankState, patch: Partial<TreasuryConfig>) {
  return finalizeState({ ...state, treasuryConfig: normalizeTreasuryConfig({ ...state.treasuryConfig, ...patch }) });
}

export function investmentRiskLimits(config: TreasuryConfig, riskLevel: number) {
  const safeRisk = clamp(Math.round(riskLevel || 3), 1, 7);
  const allowedPercent = clamp(100 - (safeRisk - 1) * 10, 40, 100);
  return {
    riskLevel: safeRisk,
    allowedPercent,
    maxAmountPz: Math.max(1, Math.floor((config.maxInvestmentAmountPz * allowedPercent) / 100)),
    dailyLimit: Math.max(1, Math.floor((config.dailyInvestmentLimit * allowedPercent) / 100))
  };
}

export function investmentRiskProfile(riskLevel: number, economyWeight = 0) {
  const safeRisk = clamp(Math.round(riskLevel || 3), 1, 7);
  const userWinProbabilityPercent = clamp(78 - (safeRisk - 1) * 8, 30, 78);
  const winMovementMinPercent = clamp(3 + (safeRisk - 1) * 3, 3, 45);
  const winMovementMaxPercent = clamp(7 + (safeRisk - 1) * 5 + Math.max(0, Math.floor(economyWeight)), winMovementMinPercent, 60);
  return {
    riskLevel: safeRisk,
    userWinProbabilityPercent,
    companyWinProbabilityPercent: 100 - userWinProbabilityPercent,
    winMovementMinPercent,
    winMovementMaxPercent
  };
}

export function dailyInvestmentCountForCompany(state: BankState, investmentAccountId: string, marketAccountId: string, isoDate = new Date().toISOString().slice(0, 10)) {
  return state.transactions.filter((transaction) =>
    transaction.fromAccountId === investmentAccountId &&
    transaction.toAccountId === marketAccountId &&
    transaction.kind === "InvestmentBuy" &&
    transaction.createdAt.slice(0, 10) === isoDate
  ).length;
}

export function updateInvestmentFundRisk(state: BankState, accountId: string, level: number, listedInvestmentFund = true) {
  const safeLevel = clamp(Math.round(level), 1, 7);
  const account = state.accounts.find((item) => item.id === accountId);
  if (!account) throw new Error("Empresa no encontrada");
  if (account.type !== "Business") throw new Error("Solo las cuentas Empresa pueden publicar riesgo de fondo");
  return finalizeState({
    ...state,
    accounts: state.accounts.map((item) => item.id === accountId ? {
      ...item,
      listedInvestmentFund,
      investmentRiskLevel: safeLevel
    } : item)
  });
}

export function toggleCard(state: BankState, cardId: string) {
  return finalizeState({
    ...state,
    digitalCards: state.digitalCards.map((card) => card.id === cardId ? { ...card, frozen: !card.frozen } : card)
  });
}

function simpleTransfer(state: BankState, fromId: string, toId: string, amountPz: number, kind: TransactionKind, note: string, bypassShield: boolean) {
  if (amountPz <= 0) throw new Error("El monto debe ser superior a 0 Pz");
  const accounts = state.accounts.map((item) => ({ ...item }));
  const from = accounts.find((item) => item.id === fromId);
  const to = accounts.find((item) => item.id === toId);
  if (!from) throw new Error("Cuenta emisora no encontrada");
  if (!to) throw new Error("Cuenta receptora no encontrada");
  if (!isOfficialIban(to.iban)) throw new Error("Transferencia externa bloqueada hasta validación manual");
  if (from.type === "Child" && amountPz > (from.sendLimitPz || Number.MAX_SAFE_INTEGER)) throw new Error("Control parental: límite de envío infantil superado");
  if (from.type === "Savings" && from.huchaLocked) throw new Error("Hucha bloqueada: desbloquea la cuenta de ahorro para enviar dinero");
  const fee = kind === "OperationalFee" || bypassShield ? 0 : percentCeil(amountPz, state.treasuryConfig.operationalTransferTaxPercent);
  const totalDebit = amountPz + fee;
  if (from.balancePz < totalDebit) throw new Error("Saldo insuficiente");
  if (!bypassShield && from.balancePz - totalDebit < MINIMUM_INCOME_SHIELD_PZ) throw new Error("Operación bloqueada para garantizar tu Renta Básica");
  from.balancePz -= totalDebit;
  to.balancePz += amountPz;
  const tglp = accounts.find((item) => item.id === TGLP_ID);
  if (fee > 0 && tglp) tglp.balancePz += fee;
  const transaction = makeTransaction(kind, from, to.id, amountPz, fee, note);
  const feeTransaction = fee > 0 ? makeTransaction("OperationalFee", from, TGLP_ID, fee, fee, `Tasa operativa ${state.treasuryConfig.operationalTransferTaxPercent}%`) : null;
  if (feeTransaction) {
    feeTransaction.netAmount = 0;
    feeTransaction.concept = "OPERATIONAL_FEE";
  }
  return finalizeState({ ...state, accounts, transactions: applyTransactions(state.transactions, [transaction, feeTransaction].filter(Boolean) as LedgerTransaction[]) });
}

export function startTimedInvestment(state: BankState, investmentAccountId: string, marketAccountId: string, amountPz: number) {
  const market = state.accounts.find((item) => item.id === marketAccountId);
  const investor = state.accounts.find((item) => item.id === investmentAccountId);
  if (!market) throw new Error("Empresa GDLP no encontrada");
  if (!investor) throw new Error("Cuenta inversora no encontrada");
  if (investor.citizenshipTier !== "CiudadaniaPlena") throw new Error("Inversiones limitadas a +18 / Ciudadanía Plena");
  const riskLimits = investmentRiskLimits(state.treasuryConfig, market.investmentRiskLevel || 3);
  if (amountPz > riskLimits.maxAmountPz) throw new Error(`La inversión máxima para R${riskLimits.riskLevel} es ${riskLimits.maxAmountPz} Pz`);
  const today = new Date().toISOString().slice(0, 10);
  const dailyInvestmentCount = dailyInvestmentCountForCompany(state, investmentAccountId, marketAccountId, today);
  if (dailyInvestmentCount >= riskLimits.dailyLimit) throw new Error(`Límite diario alcanzado para ${market.displayName}`);
  const next = transferByIban(state, investmentAccountId, market.iban, amountPz, `Inversión 60s iniciada: ${market.displayName}`, "InvestmentBuy");
  const buy = next.transactions.find((transaction) =>
    transaction.kind === "InvestmentBuy" &&
    transaction.fromAccountId === investmentAccountId &&
    transaction.toAccountId === marketAccountId
  );
  if (!buy) return next;
  const readyAt = new Date(Date.parse(buy.createdAt) + 60_000).toISOString();
  const operation: InvestmentOperation = {
    id: `op-${buy.id}`,
    accountId: investmentAccountId,
    companyId: marketAccountId,
    assetName: market.displayName,
    amountPz,
    createdAt: buy.createdAt,
    readyAt,
    settledAt: null
  };
  return finalizeState({ ...next, investmentOperations: upsertById(next.investmentOperations, operation) });
}

export function settleTimedInvestment(state: BankState, operationId: string, userWins?: boolean, movementPercent?: number) {
  const operation = pendingInvestmentOperations(state).find((item) => item.id === operationId);
  if (!operation) throw new Error("Operación de inversión no encontrada");
  if (operation.settledAt) throw new Error("La inversión ya fue liquidada");
  if (Date.now() < Date.parse(operation.readyAt)) throw new Error("La inversión se revelará en 60 segundos");
  const accounts = state.accounts.map((item) => ({ ...item }));
  const investor = accounts.find((item) => item.id === operation.accountId);
  const company = accounts.find((item) => item.id === operation.companyId);
  const agldp = accounts.find((item) => item.id === AGLDP_ID);
  const tglp = accounts.find((item) => item.id === TGLP_ID);
  if (!investor) throw new Error("Cuenta inversora no encontrada");
  if (!company) throw new Error("Empresa GDLP no encontrada");
  if (!agldp) throw new Error("Cuenta AGLDP no encontrada");
  if (!tglp) throw new Error("Cuenta TGLP no encontrada");
  if (investor.citizenshipTier !== "CiudadaniaPlena") throw new Error("Inversiones limitadas a +18 / Ciudadanía Plena");
  const economyWeight = clamp(Math.floor(company.balancePz / 20000), 1, 10);
  const riskProfile = investmentRiskProfile(company.investmentRiskLevel || 3, economyWeight);
  const movement = clamp(movementPercent ?? randomInt(riskProfile.winMovementMinPercent, riskProfile.winMovementMaxPercent + 1), 1, 100);
  const wins = userWins ?? Math.random() * 100 < riskProfile.userWinProbabilityPercent;
  const resultAmount = percentCeil(operation.amountPz, movement);
  const grossReturn = wins ? operation.amountPz + resultAmount : Math.max(0, operation.amountPz - resultAmount);
  const profitTax = wins ? percentCeil(resultAmount, state.treasuryConfig.investmentProfitTaxPercent) : 0;
  const commission = wins ? percentCeil(resultAmount, state.treasuryConfig.investmentGainCommissionPercent) : 0;
  const netReturn = Math.max(0, grossReturn - profitTax - commission);
  if (company.balancePz < grossReturn) throw new Error("La empresa no tiene liquidez para liquidar la inversión");
  company.balancePz -= grossReturn;
  investor.balancePz += netReturn;
  tglp.balancePz += profitTax;
  agldp.balancePz += commission;
  const settlement = makeTransaction(
    "InvestmentSell",
    company,
    investor.id,
    netReturn,
    profitTax + commission,
    `Resultado 60s ${wins ? "gana usuario" : "gana empresa"} en ${operation.assetName} (${wins ? "+" : "-"}${movement}%) [${operation.id}]`
  );
  settlement.concept = "INVESTMENT_60S_RESULT";
  settlement.originalTransactionId = operation.id.replace(/^op-/, "");
  const taxTxn = profitTax > 0 ? makeTransaction("InvestmentTax", company, TGLP_ID, profitTax, profitTax, `Impuesto sobre ganancia de inversión ${operation.assetName} ${state.treasuryConfig.investmentProfitTaxPercent}%`) : null;
  const commissionTxn = commission > 0 ? makeTransaction("InvestmentCommission", company, AGLDP_ID, commission, commission, `Comisión sobre ganancia de inversión ${operation.assetName} ${state.treasuryConfig.investmentGainCommissionPercent}%`) : null;
  if (taxTxn) {
    taxTxn.netAmount = 0;
    taxTxn.concept = "INVESTMENT_GAIN_TAX";
  }
  if (commissionTxn) {
    commissionTxn.netAmount = 0;
    commissionTxn.concept = "INVESTMENT_GAIN_COMMISSION";
  }
  const settledOperation = { ...operation, settledAt: new Date().toISOString() };
  return {
    state: finalizeState({
      ...state,
      accounts,
      transactions: applyTransactions(state.transactions, [settlement, taxTxn, commissionTxn].filter(Boolean) as LedgerTransaction[]),
      investmentOperations: upsertById(state.investmentOperations, settledOperation)
    }),
    reveal: {
      userWins: wins,
      assetName: operation.assetName,
      amountPz: netReturn,
      movementPercent: movement
    }
  };
}

export function pendingInvestmentOperations(state: BankState, accountId?: string) {
  const settledBuyIds = settledInvestmentBuyIds(state);
  const settledOperationIds = new Set([
    ...state.investmentOperations.filter((operation) => operation.settledAt).map((operation) => operation.id),
    ...Array.from(settledBuyIds).map((id) => `op-${id}`)
  ]);
  const transactionBacked = state.transactions
    .filter((transaction) => transaction.kind === "InvestmentBuy")
    .filter((buy) => !settledBuyIds.has(buy.id) && !settledOperationIds.has(`op-${buy.id}`))
    .map((buy) => {
      const company = state.accounts.find((account) => account.id === buy.toAccountId);
      const assetName = company?.displayName || buy.note.replace("Inversión 60s iniciada: ", "") || "Inversión GDLP";
      return {
        id: `op-${buy.id}`,
        accountId: buy.fromAccountId,
        companyId: buy.toAccountId,
        assetName,
        amountPz: buy.amountPz,
        createdAt: buy.createdAt,
        readyAt: new Date(Date.parse(buy.createdAt) + 60_000).toISOString(),
        settledAt: null
      } satisfies InvestmentOperation;
    })
    .filter(Boolean) as InvestmentOperation[];
  return [...state.investmentOperations.filter((operation) => !operation.settledAt && !settledOperationIds.has(operation.id)), ...transactionBacked]
    .filter((operation) => !accountId || operation.accountId === accountId)
    .filter((operation, index, all) => all.findIndex((candidate) => candidate.id === operation.id) === index)
    .sort((a, b) => Date.parse(a.readyAt) - Date.parse(b.readyAt));
}

function settlementOperationId(transaction: LedgerTransaction) {
  if (transaction.originalTransactionId) return `op-${transaction.originalTransactionId}`;
  const match = transaction.note.match(/\[(op-[^\]\s]+)\]/);
  return match?.[1] || null;
}

function settledInvestmentBuyIds(state: BankState) {
  const buyIds = new Set<string>();
  const buys = state.transactions
    .filter((transaction) => transaction.kind === "InvestmentBuy")
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
  const sells = state.transactions
    .filter((transaction) => transaction.kind === "InvestmentSell" && transaction.concept === "INVESTMENT_60S_RESULT")
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));

  for (const sell of sells) {
    const exact = settlementOperationId(sell)?.replace(/^op-/, "");
    if (exact) {
      buyIds.add(exact);
      continue;
    }
    const legacyMatch = [...buys].reverse().find((buy) =>
      !buyIds.has(buy.id) &&
      buy.fromAccountId === sell.toAccountId &&
      buy.toAccountId === sell.fromAccountId &&
      Date.parse(buy.createdAt) < Date.parse(sell.createdAt)
    );
    if (legacyMatch) buyIds.add(legacyMatch.id);
  }
  return buyIds;
}

export function investmentResultRows(state: BankState, accountId: string) {
  return state.transactions
    .filter((transaction) => transaction.kind === "InvestmentSell" && transaction.toAccountId === accountId && transaction.concept === "INVESTMENT_60S_RESULT")
    .map((sell) => {
      const match = sell.note.match(/en (.+) \(([+-])(\d+)%\)/);
      const assetName = match?.[1] || "Inversión GDLP";
      const movementPercent = Number(match?.[3] || 0);
      const won = match?.[2] !== "-";
      const buy = [...state.transactions]
        .filter((transaction) =>
          transaction.kind === "InvestmentBuy" &&
          transaction.fromAccountId === accountId &&
          transaction.toAccountId === sell.fromAccountId &&
          transaction.createdAt < sell.createdAt
        )
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0];
      const principalPz = buy?.amountPz || sell.amountPz;
      return {
        id: sell.id,
        assetName,
        principalPz,
        returnedPz: sell.amountPz,
        netResultPz: sell.amountPz - principalPz,
        movementPercent,
        won
      };
    })
    .sort((a, b) => b.id.localeCompare(a.id));
}

export function placezumWeekSpent(state: BankState, accountId: string) {
  const now = new Date();
  const day = now.getDay() || 7;
  const weekStart = new Date(now);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(now.getDate() - day + 1);
  return state.transactions
    .filter((transaction) => transaction.fromAccountId === accountId && transaction.kind === "Placezum" && Date.parse(transaction.createdAt) >= weekStart.getTime())
    .reduce((sum, transaction) => sum + transaction.amountPz, 0);
}

export function payPlacezum(state: BankState, fromId: string, targetIban: string, amountPz: number, note: string) {
  if (amountPz <= 0) throw new Error("Introduce un importe válido");
  const spent = placezumWeekSpent(state, fromId);
  if (spent + amountPz > state.treasuryConfig.placezumWeeklyLimitPz) {
    throw new Error(`Límite semanal PlaceZum superado: ${formatPz(spent)} de ${formatPz(state.treasuryConfig.placezumWeeklyLimitPz)} Pz`);
  }
  return transferByIban(state, fromId, targetIban, amountPz, note, "Placezum");
}

export function createDeveloperPayment(merchantIban: string, amountPz: number, concept = "Pago externo GDLP"): DeveloperPayment {
  const safeAmount = Math.max(1, Math.round(amountPz));
  const ivaPz = percentCeil(safeAmount, VAT_PERCENT);
  return {
    id: `pay_${makeId("dev").replace(/^dev-/, "")}`,
    merchantIban: merchantIban.trim().toUpperCase(),
    amountPz: safeAmount,
    ivaPz,
    totalPz: safeAmount + ivaPz,
    concept: concept.trim().slice(0, 120) || "Pago externo GDLP",
    status: "Pending",
    createdAt: new Date().toISOString(),
    paidAt: null,
    transactionId: null
  };
}

export function captureDeveloperPayment(state: BankState, payment: DeveloperPayment, customerAccountId: string) {
  if (payment.status !== "Pending") throw new Error("El pago ya no está pendiente");
  const alreadyPaid = state.transactions.some((transaction) =>
    transaction.concept === "DEVELOPER_PAYMENT" &&
    transaction.originalTransactionId === payment.id
  );
  if (alreadyPaid) throw new Error("El pago ya fue capturado");
  const customer = state.accounts.find((account) => account.id === customerAccountId);
  const merchant = state.accounts.find((account) => normalizeIban(account.iban) === normalizeIban(payment.merchantIban));
  const tglp = state.accounts.find((account) => account.id === TGLP_ID);
  if (!customer) throw new Error("Cuenta pagadora no encontrada");
  if (!merchant) throw new Error("IBAN de comercio no encontrado");
  if (!tglp) throw new Error("Cuenta TGLP no encontrada");
  if (customer.balancePz < payment.totalPz) throw new Error("Saldo insuficiente para pago con IVA");
  if (customer.balancePz - payment.totalPz < MINIMUM_INCOME_SHIELD_PZ) throw new Error("Pago bloqueado por escudo de renta mínima");
  const accounts = state.accounts.map((account) => ({ ...account }));
  const nextCustomer = accounts.find((account) => account.id === customer.id)!;
  const nextMerchant = accounts.find((account) => account.id === merchant.id)!;
  const nextTglp = accounts.find((account) => account.id === TGLP_ID)!;
  nextCustomer.balancePz -= payment.totalPz;
  nextMerchant.balancePz += payment.amountPz;
  nextTglp.balancePz += payment.ivaPz;
  const transaction = makeTransaction("Consumption", nextCustomer, nextMerchant.id, payment.amountPz, payment.ivaPz, `Pago developer: ${payment.concept}`);
  transaction.concept = "DEVELOPER_PAYMENT";
  transaction.originalTransactionId = payment.id;
  transaction.netAmount = payment.amountPz;
  transaction.taxAmount = payment.ivaPz;
  return {
    state: finalizeState({ ...state, accounts, transactions: applyTransactions(state.transactions, [transaction]) }),
    payment: { ...payment, status: "Paid" as const, customerAccountId, paidAt: transaction.createdAt, transactionId: transaction.id }
  };
}

export function createPaymentLink(state: BankState, creatorAccountId: string, kind: "Payment" | "Send", amountPz: number, concept: string, targetIban?: string) {
  const creator = state.accounts.find((account) => account.id === creatorAccountId);
  if (!creator) throw new Error("Cuenta creadora no encontrada");
  const safeAmount = Math.max(1, Math.round(amountPz));
  const isBusinessPayment = kind === "Payment" && creator.type === "Business";
  const ivaPz = isBusinessPayment ? percentCeil(safeAmount, VAT_PERCENT) : 0;
  const link: PaymentLink = {
    id: `plink-${makeId("lnk").replace(/^lnk-/, "")}`,
    kind,
    creatorAccountId,
    targetIban: kind === "Payment" ? creator.iban : (targetIban || null),
    amountPz: safeAmount,
    ivaPz,
    totalPz: safeAmount + ivaPz,
    concept: concept.trim().slice(0, 120) || (kind === "Payment" ? "Pago Banco de La Placeta" : "Envío de Placetas"),
    status: "Pending",
    createdAt: new Date().toISOString(),
    usedAt: null,
    usedByAccountId: null,
    transactionId: null
  };
  return finalizeState({ ...state, paymentLinks: [link, ...(state.paymentLinks || [])] });
}

export function capturePaymentLink(state: BankState, linkId: string, payerAccountId: string) {
  const link = (state.paymentLinks || []).find((item) => item.id === linkId);
  if (!link) throw new Error("Enlace no encontrado");
  if (link.status !== "Pending") throw new Error("Enlace ya usado o cancelado");
  if (state.transactions.some((transaction) => transaction.originalTransactionId === link.id)) throw new Error("Enlace ya usado");
  const payer = state.accounts.find((account) => account.id === payerAccountId);
  if (!payer) throw new Error("Cuenta pagadora no encontrada");
  const target = link.kind === "Payment"
    ? state.accounts.find((account) =>
      link.targetIban
        ? normalizeIban(account.iban) === normalizeIban(link.targetIban)
        : account.id === link.creatorAccountId
    )
    : state.accounts.find((account) => account.id === link.creatorAccountId);
  if (!target) throw new Error("Destino del enlace no encontrado");
  const tglp = state.accounts.find((account) => account.id === TGLP_ID);
  if (link.ivaPz > 0 && !tglp) throw new Error("Cuenta TGLP no encontrada");
  if (payer.id === target.id) throw new Error("No puedes pagarte el enlace con la misma cuenta");
  if (payer.balancePz < link.totalPz) throw new Error("Saldo insuficiente");
  if (payer.balancePz - link.totalPz < MINIMUM_INCOME_SHIELD_PZ) throw new Error("Operación bloqueada por escudo de renta mínima");
  const accounts = state.accounts.map((account) => ({ ...account }));
  const nextPayer = accounts.find((account) => account.id === payer.id)!;
  const nextTarget = accounts.find((account) => account.id === target.id)!;
  const nextTglp = accounts.find((account) => account.id === TGLP_ID);
  nextPayer.balancePz -= link.totalPz;
  nextTarget.balancePz += link.amountPz;
  if (nextTglp && link.ivaPz > 0) nextTglp.balancePz += link.ivaPz;
  const transaction = makeTransaction(link.kind === "Payment" ? "Consumption" : "Placezum", nextPayer, nextTarget.id, link.amountPz, link.ivaPz, `${link.kind === "Payment" ? "Pago enlace" : "Envío enlace"}: ${link.concept}`);
  transaction.concept = link.kind === "Payment" ? "PAYMENT_LINK" : "PLACETA_SEND_LINK";
  transaction.originalTransactionId = link.id;
  transaction.netAmount = link.amountPz;
  transaction.taxAmount = link.ivaPz;
  const usedAt = transaction.createdAt;
  return finalizeState({
    ...state,
    accounts,
    transactions: applyTransactions(state.transactions, [transaction]),
    paymentLinks: (state.paymentLinks || []).map((item) => item.id === link.id ? {
      ...item,
      status: "Paid",
      usedAt,
      usedByAccountId: payer.id,
      transactionId: transaction.id
    } : item)
  });
}

export function makeTransaction(kind: TransactionKind, from: Account, toAccountId: string, amountPz: number, ivaPz: number, note: string): LedgerTransaction {
  return {
    id: makeId(kind === "OperationalFee" ? "fee" : "txn"),
    kind,
    fromAccountId: from.id,
    toAccountId,
    amountPz,
    ivaPz,
    note,
    status: "Settled",
    createdAt: new Date().toISOString(),
    netAmount: amountPz,
    taxAmount: ivaPz,
    concept: kind,
    IBAN_Origin: from.iban
  };
}

function percentCeil(amount: number, percent: number) {
  return Math.ceil((amount * percent) / 100);
}

function requiresDeclaration(account: Account, config: TreasuryConfig) {
  const threshold = account.kind === "CITIZEN" && account.type !== "Business"
    ? config.personalDeclarationThresholdPz
    : config.institutionalDeclarationThresholdPz;
  return account.balancePz >= threshold && !account.fundsJustificationApproved;
}

function buildAuditFlags(accounts: Account[], transactions: LedgerTransaction[], existing: ComplianceFlag[], config: TreasuryConfig) {
  const since = Date.now() - 24 * 60 * 60 * 1000;
  const existingKeys = new Set(existing.map((flag) => `${flag.accountId}:${flag.reason}`));
  const volumeByAccount = new Map<string, number>();
  transactions.forEach((transaction) => {
    if (transaction.status !== "Settled" || Date.parse(transaction.createdAt) < since) return;
    volumeByAccount.set(transaction.fromAccountId, (volumeByAccount.get(transaction.fromAccountId) || 0) + transaction.amountPz);
  });
  const volumeFlags: ComplianceFlag[] = [...volumeByAccount.entries()].flatMap(([accountId, amountPz]) => {
    const reason = `Movimiento 24h superior a ${config.auditDailyTransferLimitPz} Pz`;
    if (amountPz <= config.auditDailyTransferLimitPz || existingKeys.has(`${accountId}:${reason}`)) return [];
    return [{ id: makeId("flag"), accountId, reason, amountPz, status: "PendingReview", createdAt: new Date().toISOString() }];
  });
  const declarationFlags: ComplianceFlag[] = accounts.flatMap((account) => {
    const reason = "Declaración de fondos obligatoria";
    const threshold = account.kind === "CITIZEN" && account.type !== "Business"
      ? config.personalDeclarationThresholdPz
      : config.institutionalDeclarationThresholdPz;
    if (account.balancePz < threshold || account.fundsJustificationApproved || existingKeys.has(`${account.id}:${reason}`)) return [];
    return [{ id: makeId("flag"), accountId: account.id, reason, amountPz: account.balancePz, status: "DeclarationRequired", createdAt: new Date().toISOString() }];
  });
  return [...volumeFlags, ...declarationFlags, ...existing].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

function upsertById<T extends { id: string }>(items: T[], item: T) {
  return [...items.filter((candidate) => candidate.id !== item.id), item];
}

function dedupeBy<T, K extends keyof T>(items: T[], key: K): T[] {
  const byKey = new Map<string, T>();
  for (const item of items || []) {
    const value = item?.[key];
    if (value == null) continue;
    byKey.set(String(value), item);
  }
  return [...byKey.values()];
}

function dedupeByComposite<T>(items: T[], key: (item: T) => string): T[] {
  const byKey = new Map<string, T>();
  for (const item of items || []) {
    byKey.set(key(item), item);
  }
  return [...byKey.values()];
}

function randomInt(min: number, maxExclusive: number) {
  return Math.floor(Math.random() * Math.max(1, maxExclusive - min)) + min;
}

function weekStartUtc(now = new Date()) {
  const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() - day + 1);
  return date;
}

function weeklyFeeKey(now = new Date()) {
  return weekStartUtc(now).toISOString().slice(0, 10);
}

function ensureVaultEmission(accounts: Account[]): Account[] {
  if (accounts.some((account) => account.id === VAULT_EMISION)) return accounts;
  const vault: Account = {
    id: VAULT_EMISION,
    displayName: "Vault Emisión",
    kind: "AGLDP",
    balancePz: Number.MAX_SAFE_INTEGER / 4,
    placetaId: null,
    role: "Administracion",
    type: "Current",
    iban: ibanGenerate(VAULT_EMISION),
    citizenshipTier: "Institucion",
    complianceStatus: "Clear"
  };
  return [
    ...accounts,
    vault
  ];
}
