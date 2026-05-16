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

export type TreasuryConfig = {
  operationalTransferTaxPercent: number;
  webBridgeCommissionPercent: number;
  contactlessLimitPz: number;
  placezumWeeklyLimitPz: number;
  weeklyTaxPercent: number;
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
  schemaSeedVersion?: number;
  updatedAt?: string | null;
};

export const treasuryDefaults: TreasuryConfig = {
  operationalTransferTaxPercent: 7,
  webBridgeCommissionPercent: 3,
  contactlessLimitPz: 500,
  placezumWeeklyLimitPz: 1000,
  weeklyTaxPercent: 2,
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
  minSupportedVersionCode: 1,
  lastSavingsInterestDate: null
};

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
    investmentHoldings: [
      { id: "hold-1", accountId: "u-alba-invest", assetName: "Taller Dario SA", units: 7, currentValuePz: 840, performance: [760, 780, 820, 790, 840] },
      { id: "hold-2", accountId: "u-alba-invest", assetName: "Cristal Escaso", units: 3, currentValuePz: 510, performance: [400, 430, 470, 460, 510] }
    ],
    investmentOperations: [],
    digitalCards: [
      { id: "card-alba", accountId: "u-alba", alias: "Placeta Black", tier: "Standard", frozen: false, cardNumber: "183042", pin: "0000", released: true },
      { id: "card-child", accountId: "u-alba-child", alias: "Junior supervisada", tier: "Child", frozen: false, cardNumber: "000122", pin: "0000" }
    ],
    savedContacts: [
      { id: "contact-dario", ownerPlacetaId: "ALBA-001", accountId: "u-dario", createdAt: now },
      { id: "contact-lia", ownerPlacetaId: "ALBA-001", accountId: "u-lia", createdAt: now }
    ],
    promoSlides: [
      { id: "01", title: "BANCO PLACETA", subtitle: "Servicios GDLP, cuentas oficiales y Placezum en tiempo real", action: "Login", imageKey: "bank", assetPath: "/assets/logobanco.jpg" },
      { id: "02", title: "PLACEZUM", subtitle: "Paga con código temporal, contacto o tarjeta promocional", action: "Demo", imageKey: "placezum", assetPath: "/assets/promocard.jpg" },
      { id: "03", title: "MERCADO PLACETA", subtitle: "Fondos, empresas y cartera Plazet con liquidación fiscal", action: "Register", imageKey: "market", assetPath: "/assets/actu.jpg" }
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
  return {
    ...seed,
    ...input,
    users: input.users?.length ? input.users : seed.users,
    accounts: input.accounts?.length ? input.accounts : seed.accounts,
    transactions: input.transactions?.length ? input.transactions : seed.transactions,
    treasuryConfig: { ...treasuryDefaults, ...(input.treasuryConfig || {}) },
    promoSlides: input.promoSlides?.length ? input.promoSlides : seed.promoSlides,
    updatedAt: input.updatedAt || seed.updatedAt
  };
}

export function applyTransactions(current: LedgerTransaction[], incoming: LedgerTransaction[]) {
  const byId = new Map<string, LedgerTransaction>();
  [...incoming, ...current].forEach((transaction) => byId.set(transaction.id, transaction));
  return [...byId.values()].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export function transferByIban(state: BankState, fromId: string, targetIban: string, amountPz: number, note: string, kind: TransactionKind = "Placezum") {
  const accounts = state.accounts.map((item) => ({ ...item }));
  const from = accounts.find((item) => item.id === fromId);
  if (!from) throw new Error("Cuenta emisora no encontrada");
  if (amountPz <= 0) throw new Error("El monto debe ser superior a 0 Pz");
  if (from.type === "Savings" && from.huchaLocked) throw new Error("Hucha bloqueada: desbloquea la cuenta de ahorro para enviar dinero");
  if (from.type === "Child" && amountPz > (from.sendLimitPz || Number.MAX_SAFE_INTEGER)) throw new Error("Control parental: límite infantil superado");
  if (!isOfficialIban(targetIban)) throw new Error("Entidad No Reconocida");
  const to = accounts.find((item) => item.iban.toUpperCase() === targetIban.toUpperCase());
  if (!to) throw new Error("IBAN oficial no localizado");
  const fee = Math.ceil((amountPz * state.treasuryConfig.operationalTransferTaxPercent) / 100);
  const total = amountPz + fee;
  if (from.balancePz < total) throw new Error("Saldo insuficiente");
  if (from.balancePz - total < MINIMUM_INCOME_SHIELD_PZ) throw new Error("Operación bloqueada para garantizar tu Renta Básica");
  const tglp = accounts.find((item) => item.id === TGLP_ID);
  from.balancePz -= total;
  to.balancePz += amountPz;
  if (tglp) tglp.balancePz += fee;
  const transaction = makeTransaction(kind, from, to.id, amountPz, fee, note || kind);
  const feeTransaction = fee > 0 ? makeTransaction("OperationalFee", from, TGLP_ID, fee, fee, `Tasa operativa ${state.treasuryConfig.operationalTransferTaxPercent}%`) : null;
  return {
    ...state,
    accounts,
    transactions: applyTransactions(state.transactions, [transaction, feeTransaction].filter(Boolean) as LedgerTransaction[]),
    updatedAt: new Date().toISOString()
  };
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
  return { ...state, accounts, transactions: applyTransactions(state.transactions, [transaction]), updatedAt: new Date().toISOString() };
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
  return { ...state, digitalCards: [...state.digitalCards, card], updatedAt: new Date().toISOString() };
}

export function toggleCard(state: BankState, cardId: string) {
  return {
    ...state,
    digitalCards: state.digitalCards.map((card) => card.id === cardId ? { ...card, frozen: !card.frozen } : card),
    updatedAt: new Date().toISOString()
  };
}

export function buyInvestment(state: BankState, investmentAccountId: string, marketAccountId: string, amountPz: number) {
  const market = state.accounts.find((item) => item.id === marketAccountId);
  if (!market) throw new Error("Empresa GDLP no encontrada");
  const next = transferByIban(state, investmentAccountId, market.iban, amountPz, `Inversión 60s iniciada: ${market.displayName}`, "InvestmentBuy");
  const holding = state.investmentHoldings.find((item) => item.accountId === investmentAccountId && item.assetName === market.displayName);
  const unitValue = 120;
  const units = Math.max(1, Math.floor(amountPz / unitValue));
  const holdings = holding
    ? next.investmentHoldings.map((item) => item.id === holding.id ? { ...item, units: item.units + units, currentValuePz: item.currentValuePz + amountPz, performance: [...item.performance.slice(-5), item.currentValuePz + amountPz] } : item)
    : [...next.investmentHoldings, { id: makeId("hold"), accountId: investmentAccountId, assetName: market.displayName, units, currentValuePz: amountPz, performance: [amountPz] }];
  return { ...next, investmentHoldings: holdings };
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
