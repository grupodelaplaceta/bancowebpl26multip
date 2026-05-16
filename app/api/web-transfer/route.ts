import { NextResponse } from "next/server";
import {
  belongsToUser,
  buildWebTransaction,
  calculateBridgeCommission,
  findDestinationAccount,
  TGLP_ID
} from "../../../lib/bank";
import { writeAuditLog } from "../../../lib/audit";
import { getState, upsertEntity } from "../../../lib/placeta-api";
import type { Account, BankState } from "../../../lib/types";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      dip?: string;
      fromAccountId?: string;
      destination?: string;
      amountPz?: number;
      concept?: string;
    };
    const dip = payload.dip?.trim().toUpperCase();
    const amountPz = Math.round(Number(payload.amountPz || 0));
    if (!dip || !payload.fromAccountId || !payload.destination) {
      return NextResponse.json({ error: "missing_transfer_data" }, { status: 400 });
    }
    if (amountPz <= 0) return NextResponse.json({ error: "invalid_amount" }, { status: 400 });

    const state = await getState<BankState>();
    const user = state.users?.find((item) => item.dip?.toUpperCase() === dip);
    if (!user) return NextResponse.json({ error: "user_not_found" }, { status: 404 });

    const accounts = state.accounts || [];
    const from = accounts.find((account) => account.id === payload.fromAccountId);
    const destinationText = payload.destination.trim().toUpperCase();
    const destinationUser = destinationText.startsWith("DIP-")
      ? state.users?.find((item) => item.dip?.toUpperCase() === destinationText)
      : null;
    const to = destinationUser
      ? accounts.find((account) => account.id === destinationUser.primaryAccountId)
      : findDestinationAccount(accounts, payload.destination);
    if (!from || !belongsToUser(from, user)) return NextResponse.json({ error: "source_not_allowed" }, { status: 403 });
    if (!to) return NextResponse.json({ error: "destination_not_found" }, { status: 404 });
    if (from.id === to.id) return NextResponse.json({ error: "same_account" }, { status: 400 });

    const fee = calculateBridgeCommission(amountPz, from, to, state);
    const totalDebit = amountPz + fee.amount;
    const today = new Date().toISOString().slice(0, 10);
    const dailySpent = (state.transactions || [])
      .filter((transaction) => transaction.fromAccountId === from.id && transaction.createdAt?.startsWith(today))
      .reduce((sum, transaction) => sum + transaction.amountPz, 0);
    const dynamicDailyLimit = from.sendLimitPz || (from.citizenshipTier === "JuniorSenior" ? 100 : undefined);
    if (dynamicDailyLimit && dailySpent + amountPz > dynamicDailyLimit) {
      return NextResponse.json({ error: "daily_limit_exceeded" }, { status: 409 });
    }
    if (from.balancePz < totalDebit) return NextResponse.json({ error: "insufficient_balance" }, { status: 409 });

    const tglp = accounts.find((account) => account.id === TGLP_ID);
    const nextFrom: Account = { ...from, balancePz: from.balancePz - totalDebit };
    const nextTo: Account = { ...to, balancePz: to.balancePz + amountPz };
    const note = `${payload.concept?.trim() || "Transferencia web"} · Código web · Comisión puente ${fee.percent}%`;
    const transaction = buildWebTransaction(from, to, amountPz, fee.amount, note);

    await upsertEntity("accounts", nextFrom.id, nextFrom);
    await upsertEntity("accounts", nextTo.id, nextTo);
    if (tglp && fee.amount > 0) {
      await upsertEntity("accounts", tglp.id, { ...tglp, balancePz: tglp.balancePz + fee.amount });
    }
    await upsertEntity("transactions", transaction.id, transaction);
    await writeAuditLog(request, {
      actorDip: dip,
      action: "WEB_TRANSFER",
      targetId: transaction.id,
      metadata: { from: from.id, to: to.id, amountPz, feePz: fee.amount }
    });

    return NextResponse.json({
      ok: true,
      transaction,
      fee,
      balances: {
        from: nextFrom.balancePz,
        to: nextTo.balancePz
      }
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "transfer_error" }, { status: 500 });
  }
}
