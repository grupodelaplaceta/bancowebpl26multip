import crypto from "node:crypto";
import type { Account, BankState, LedgerTransaction, UserProfile } from "./types";
import { isAndroidIban, isWebIban } from "./format";

export const TGLP_ID = "TGLP";

export function userName(user: UserProfile) {
  return user.displayName || user.name || user.dip;
}

export function belongsToUser(account: Account, user: UserProfile) {
  return account.placetaId === user.placetaId || account.id === user.primaryAccountId;
}

export function generateWebIban(seed: string) {
  const hash = crypto.createHash("sha256").update(seed).digest("hex").toUpperCase();
  const digits = hash.replace(/[A-F]/g, (char) => String(char.charCodeAt(0) % 10)).slice(0, 7);
  return `GDLP-W${digits.slice(0, 3)}-${digits.slice(3, 7)}`;
}

export function ensureWebAccount(state: BankState, user: UserProfile): Account {
  const accounts = state.accounts || [];
  const existing = accounts.find((account) => belongsToUser(account, user) && isWebIban(account.iban));
  if (existing) return existing;
  return {
    id: `web-${user.dip.toLowerCase().replace(/[^a-z0-9-]/g, "-")}`,
    displayName: `Cuenta Web ${userName(user)}`,
    kind: "CITIZEN",
    balancePz: 0,
    placetaId: user.placetaId,
    role: "Citizen",
    type: "Current",
    iban: generateWebIban(user.dip),
    complianceStatus: "Clear"
  };
}

export function findDestinationAccount(accounts: Account[], destination: string) {
  const normalized = destination.trim().toUpperCase();
  return accounts.find((account) => {
    const iban = account.iban.toUpperCase();
    return (
      iban === normalized ||
      account.id.toUpperCase() === normalized ||
      iban.endsWith(normalized) ||
      account.displayName.toUpperCase().includes(normalized)
    );
  });
}

export function bridgeCommissionPercent(state: BankState) {
  const configured = state.treasuryConfig?.webBridgeCommissionPercent;
  const fallback = Number(process.env.NEXT_PUBLIC_WEB_COMMISSION_PERCENT || 3);
  return Number.isFinite(configured) ? Number(configured) : fallback;
}

export function calculateBridgeCommission(amountPz: number, from: Account, to: Account, state: BankState) {
  const crossesChannel = (isWebIban(from.iban) && isAndroidIban(to.iban)) || (isAndroidIban(from.iban) && isWebIban(to.iban));
  if (!crossesChannel) return { percent: 0, amount: 0 };
  const percent = Math.max(0, Math.min(12, bridgeCommissionPercent(state)));
  return { percent, amount: Math.ceil((amountPz * percent) / 100) };
}

export function buildWebTransaction(from: Account, to: Account, amountPz: number, feePz: number, note: string): LedgerTransaction {
  return {
    id: `web-${crypto.randomUUID()}`,
    kind: "OperationalFee",
    fromAccountId: from.id,
    toAccountId: to.id,
    amountPz,
    ivaPz: feePz,
    note,
    status: "Settled",
    createdAt: new Date().toISOString(),
    netAmount: amountPz,
    taxAmount: feePz,
    concept: "WEB_TRANSFER",
    IBAN_Origin: from.iban
  };
}
