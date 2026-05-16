export type AccountType = "Current" | "Savings" | "Child" | "Business" | "Investment";
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

export type UserProfile = {
  dip: string;
  name?: string;
  displayName?: string;
  placetaId?: string;
  primaryAccountId?: string;
  role?: string;
};

export type Account = {
  id: string;
  displayName: string;
  kind?: string;
  balancePz: number;
  placetaId?: string;
  role?: string;
  type: AccountType;
  iban: string;
  complianceStatus?: string;
  listedInvestmentFund?: boolean;
  investmentRiskLevel?: number;
};

export type LedgerTransaction = {
  id: string;
  kind: TransactionKind;
  fromAccountId: string;
  toAccountId: string;
  amountPz: number;
  ivaPz?: number;
  note: string;
  status?: string;
  createdAt?: string;
  netAmount?: number;
  taxAmount?: number;
  concept?: string;
  IBAN_Origin?: string;
};

export type DigitalCard = {
  id: string;
  accountId: string;
  label?: string;
  alias?: string;
  tier?: string;
  cardNumber?: string;
  pin?: string;
  promoPhysical?: boolean;
  released?: boolean;
};

export type ComplianceFlag = {
  id: string;
  accountId: string;
  reason: string;
  amountPz: number;
  status?: string;
  createdAt?: string;
};

export type TreasuryConfig = {
  operationalTransferTaxPercent?: number;
  webBridgeCommissionPercent?: number;
  weeklyTaxPercent?: number;
  payrollWorkerTaxPercent?: number;
  payrollEmployerTaxPercent?: number;
  contactlessLimitPz?: number;
  placezumWeeklyLimitPz?: number;
  cardIssueFeePz?: number;
  businessRegistrationFeePz?: number;
  personalDeclarationThresholdPz?: number;
  institutionalDeclarationThresholdPz?: number;
  savingsInterestAnnualPercent?: number;
  juniorSavingsInterestAnnualPercent?: number;
  investmentProfitTaxPercent?: number;
  investmentGainCommissionPercent?: number;
  maxInvestmentAmountPz?: number;
  dailyInvestmentLimit?: number;
  minSupportedVersionCode?: number;
};

export type BankState = {
  users?: UserProfile[];
  accounts?: Account[];
  transactions?: LedgerTransaction[];
  digitalCards?: DigitalCard[];
  complianceFlags?: ComplianceFlag[];
  treasuryConfig?: TreasuryConfig;
  updatedAt?: string | null;
};
