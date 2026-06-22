import { NextResponse } from "next/server";
import { normalizeState, TGLP_ID, VAULT_EMISION } from "../../../lib/bank";
import type { Account, BankState } from "../../../lib/bank";
import { productionSecret, timingSafeTokenEqual } from "../../../lib/api-security";
import { readRemoteState } from "../developer-payments/crypto";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,OPTIONS",
  "access-control-allow-headers": "content-type,x-tributos-key",
  "access-control-max-age": "86400",
  "cache-control": "no-store"
};

const readKey = () => productionSecret(process.env.TRIBUTOS_READ_KEY, process.env.TRIBUTOS_ADMIN_KEY, process.env.PLACETA_GDLP_ADMIN_KEY);

function percentCeil(base: number, percent: number) {
  return Math.ceil((Math.max(0, base) * Math.max(0, percent)) / 100);
}

function formatWeekKey(now = new Date()) {
  const start = weekStartUtc(now);
  return `${start.getUTCFullYear()}-W${String(weekNumber(start)).padStart(2, "0")}`;
}

function weekStartUtc(now = new Date()) {
  const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() - day + 1);
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

function weekNumber(date: Date) {
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNumber = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - dayNumber);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  return Math.ceil((((target.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function accountTypeLabel(type: Account["type"]) {
  return {
    Current: "Personal",
    Savings: "Hucha",
    Child: "Infantil",
    Business: "Empresa",
    Investment: "Inversion",
    State: "Estatal"
  }[type];
}

function maskIban(iban: string) {
  const clean = String(iban || "").replace(/\s+/g, "");
  if (clean.length <= 7) return clean;
  return `${clean.slice(0, 7)}-${clean.slice(-3)}`;
}

function businessUsagePreview(state: BankState, accountId: string, weekStartMs: number) {
  const paidLinks = new Set((state.paymentLinks || [])
    .filter((link) => link.creatorAccountId === accountId && link.status === "Paid")
    .map((link) => link.id));
  const apiBasePz = state.transactions
    .filter((transaction) =>
      transaction.concept === "DEVELOPER_PAYMENT" &&
      transaction.toAccountId === accountId &&
      Date.parse(transaction.createdAt) >= weekStartMs
    )
    .reduce((sum, transaction) => sum + transaction.amountPz, 0);
  const linkBasePz = state.transactions
    .filter((transaction) =>
      paidLinks.has(transaction.originalTransactionId || "") &&
      Date.parse(transaction.createdAt) >= weekStartMs
    )
    .reduce((sum, transaction) => sum + transaction.amountPz, 0);
  const apiFeePz = apiBasePz > 0 ? percentCeil(apiBasePz, state.treasuryConfig.weeklyDeveloperApiFeePercent) : 0;
  const linkFeePz = linkBasePz > 0 ? percentCeil(linkBasePz, state.treasuryConfig.weeklyPaymentLinkFeePercent) : 0;
  return { apiBasePz, linkBasePz, apiFeePz, linkFeePz };
}

function buildDeclarations(state: BankState) {
  const now = new Date();
  const weekStart = weekStartUtc(now);
  const weekStartMs = weekStart.getTime();
  const weekKey = formatWeekKey(now);
  const taxableAccounts = state.accounts
    .filter((account) => ![TGLP_ID, VAULT_EMISION].includes(account.id))
    .filter((account) => account.kind === "CITIZEN" || account.type === "Business" || account.type === "Investment");

  const declarations = taxableAccounts.map((account) => {
    const weeklyBasePz = Math.max(0, account.balancePz);
    const weeklyTaxPz = percentCeil(weeklyBasePz, state.treasuryConfig.weeklyTaxPercent);
    const business = account.type === "Business" ? businessUsagePreview(state, account.id, weekStartMs) : { apiBasePz: 0, linkBasePz: 0, apiFeePz: 0, linkFeePz: 0 };
    const collectedThisWeekPz = state.transactions
      .filter((transaction) =>
        transaction.fromAccountId === account.id &&
        transaction.toAccountId === TGLP_ID &&
        Date.parse(transaction.createdAt) >= weekStartMs
      )
      .reduce((sum, transaction) => sum + transaction.amountPz + transaction.ivaPz, 0);
    const ivaCollectedPz = state.transactions
      .filter((transaction) =>
        transaction.toAccountId === TGLP_ID &&
        Date.parse(transaction.createdAt) >= weekStartMs &&
        (transaction.kind === "Consumption" || transaction.kind === "Placezum" || transaction.concept === "DEVELOPER_PAYMENT" || transaction.taxAmount > 0)
      )
      .filter((transaction) => transaction.fromAccountId === account.id || transaction.toAccountId === account.id)
      .reduce((sum, transaction) => sum + Math.max(transaction.ivaPz || 0, transaction.taxAmount || 0), 0);
    const totalDuePz = weeklyTaxPz + business.apiFeePz + business.linkFeePz;
    const pendingPz = Math.max(0, totalDuePz - collectedThisWeekPz);

    return {
      id: `${account.id}:${weekKey}`,
      weekKey,
      accountId: account.id,
      displayName: account.displayName,
      placetaId: account.placetaId || "GDLP",
      iban: maskIban(account.iban),
      type: account.type,
      typeLabel: accountTypeLabel(account.type),
      balancePz: account.balancePz,
      weeklyBasePz,
      weeklyTaxPz,
      apiBasePz: business.apiBasePz,
      apiFeePz: business.apiFeePz,
      linkBasePz: business.linkBasePz,
      linkFeePz: business.linkFeePz,
      ivaCollectedPz,
      collectedThisWeekPz,
      totalDuePz,
      pendingPz,
      status: pendingPz <= 0 ? "Declarada" : "Pendiente"
    };
  });

  const totals = declarations.reduce((sum, item) => ({
    accounts: sum.accounts + 1,
    balancePz: sum.balancePz + item.balancePz,
    weeklyTaxPz: sum.weeklyTaxPz + item.weeklyTaxPz,
    apiFeePz: sum.apiFeePz + item.apiFeePz,
    linkFeePz: sum.linkFeePz + item.linkFeePz,
    ivaCollectedPz: sum.ivaCollectedPz + item.ivaCollectedPz,
    totalDuePz: sum.totalDuePz + item.totalDuePz,
    pendingPz: sum.pendingPz + item.pendingPz,
    declared: sum.declared + (item.status === "Declarada" ? 1 : 0)
  }), {
    accounts: 0,
    balancePz: 0,
    weeklyTaxPz: 0,
    apiFeePz: 0,
    linkFeePz: 0,
    ivaCollectedPz: 0,
    totalDuePz: 0,
    pendingPz: 0,
    declared: 0
  });

  return {
    weekKey,
    weekStart: weekStart.toISOString(),
    generatedAt: now.toISOString(),
    treasuryAccount: state.accounts.find((account) => account.id === TGLP_ID) || null,
    config: {
      weeklyTaxPercent: state.treasuryConfig.weeklyTaxPercent,
      weeklyDeveloperApiFeePercent: state.treasuryConfig.weeklyDeveloperApiFeePercent,
      weeklyPaymentLinkFeePercent: state.treasuryConfig.weeklyPaymentLinkFeePercent
    },
    totals,
    declarations: declarations.sort((left, right) => right.pendingPz - left.pendingPz || right.totalDuePz - left.totalDuePz)
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(request: Request) {
  try {
    const provided = request.headers.get("x-tributos-key");
    if (!timingSafeTokenEqual(provided, readKey())) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: corsHeaders });
    }

    const state = normalizeState(await readRemoteState());
    return NextResponse.json(buildDeclarations(state), { headers: corsHeaders });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "tributos_weekly_failed" }, { status: 503, headers: corsHeaders });
  }
}
