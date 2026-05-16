import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { writeAuditLog } from "../../../lib/audit";
import { belongsToUser } from "../../../lib/bank";
import { getState, upsertEntity } from "../../../lib/placeta-api";
import type { Account, BankState, LedgerTransaction } from "../../../lib/types";

const TGLP_ID = "TGLP";

export async function POST(request: Request) {
  try {
    const { dip, accountId, amountPz } = (await request.json()) as { dip?: string; accountId?: string; amountPz?: number };
    const normalizedDip = dip?.trim().toUpperCase();
    const amount = Math.round(Number(amountPz || 0));
    if (!normalizedDip || !accountId || amount <= 0) return NextResponse.json({ error: "missing_investment_data" }, { status: 400 });
    const state = await getState<BankState>();
    const user = state.users?.find((item) => item.dip?.toUpperCase() === normalizedDip);
    if (!user) return NextResponse.json({ error: "user_not_found" }, { status: 404 });
    const accounts = state.accounts || [];
    const account = accounts.find((item) => item.id === accountId);
    const tglp = accounts.find((item) => item.id === TGLP_ID);
    if (!account || !belongsToUser(account, user)) return NextResponse.json({ error: "account_not_allowed" }, { status: 403 });
    if (account.citizenshipTier?.startsWith("Junior") || account.type === "Child") return NextResponse.json({ error: "investment_adults_only" }, { status: 403 });
    const max = state.treasuryConfig?.maxInvestmentAmountPz || 1200;
    if (amount > max) return NextResponse.json({ error: "investment_limit_exceeded" }, { status: 409 });
    if (account.balancePz < amount) return NextResponse.json({ error: "insufficient_balance" }, { status: 409 });

    const win = crypto.randomInt(0, 100) >= 45;
    const movementPercent = win ? crypto.randomInt(15, 76) : crypto.randomInt(10, 61);
    const grossProfit = Math.ceil((amount * movementPercent) / 100);
    const taxPercent = state.treasuryConfig?.investmentProfitTaxPercent || 10;
    const tax = win ? Math.ceil((grossProfit * taxPercent) / 100) : 0;
    const returned = win ? amount + grossProfit - tax : Math.max(0, amount - grossProfit);
    const nextAccount: Account = { ...account, balancePz: account.balancePz - amount + returned };
    const nextTglp = tglp && tax > 0 ? { ...tglp, balancePz: tglp.balancePz + tax } : tglp;
    const transaction: LedgerTransaction = {
      id: `inv-web-${crypto.randomUUID()}`,
      kind: "InvestmentSell",
      fromAccountId: account.id,
      toAccountId: account.id,
      amountPz: amount,
      note: `Liquidación inversión web 60s · ${win ? "Ganancia" : "Pérdida"} ${movementPercent}%`,
      status: "Settled",
      createdAt: new Date().toISOString(),
      netAmount: returned - amount,
      taxAmount: tax,
      concept: "WEB_60S_INVESTMENT",
      IBAN_Origin: account.iban
    };
    await upsertEntity("accounts", nextAccount.id, nextAccount);
    if (nextTglp) await upsertEntity("accounts", nextTglp.id, nextTglp);
    await upsertEntity("transactions", transaction.id, transaction);
    await writeAuditLog(request, { actorDip: normalizedDip, action: "WEB_INVESTMENT_60S", targetId: transaction.id, metadata: { amount, win, movementPercent, tax, returned } });
    return NextResponse.json({ ok: true, result: { win, movementPercent, tax, returned, resolvesAt: Date.now() + 60_000 }, transaction });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "investment_error" }, { status: 500 });
  }
}
