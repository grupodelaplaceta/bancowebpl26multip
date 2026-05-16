import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { writeAuditLog } from "../../../lib/audit";
import { belongsToUser } from "../../../lib/bank";
import { getState, upsertEntity } from "../../../lib/placeta-api";
import type { Account, BankState, LedgerTransaction } from "../../../lib/types";

const AGLDP_ID = "AGLDP";
const RBU_AMOUNT = 5;

export async function POST(request: Request) {
  try {
    const { dip, accountId } = (await request.json()) as { dip?: string; accountId?: string };
    const normalizedDip = dip?.trim().toUpperCase();
    if (!normalizedDip || !accountId) return NextResponse.json({ error: "missing_rbu_data" }, { status: 400 });
    const state = await getState<BankState>();
    const user = state.users?.find((item) => item.dip?.toUpperCase() === normalizedDip);
    if (!user) return NextResponse.json({ error: "user_not_found" }, { status: 404 });
    const accounts = state.accounts || [];
    const account = accounts.find((item) => item.id === accountId);
    const agldp = accounts.find((item) => item.id === AGLDP_ID);
    if (!account || !belongsToUser(account, user)) return NextResponse.json({ error: "account_not_allowed" }, { status: 403 });
    if (account.type === "Child") return NextResponse.json({ error: "rbu_not_available_for_child" }, { status: 403 });
    const last = account.lastRbuClaim ? new Date(account.lastRbuClaim).getTime() : 0;
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    if (last && Date.now() - last < weekMs) return NextResponse.json({ error: "rbu_cooldown_active" }, { status: 409 });
    if (!agldp || agldp.balancePz < RBU_AMOUNT) return NextResponse.json({ error: "agldp_insufficient" }, { status: 409 });

    const today = new Date().toISOString().slice(0, 10);
    const nextAccount: Account = { ...account, balancePz: account.balancePz + RBU_AMOUNT, lastRbuClaim: today };
    const nextAgldp: Account = { ...agldp, balancePz: agldp.balancePz - RBU_AMOUNT };
    const transaction: LedgerTransaction = {
      id: `rbu-web-${crypto.randomUUID()}`,
      kind: "Rbu",
      fromAccountId: AGLDP_ID,
      toAccountId: account.id,
      amountPz: RBU_AMOUNT,
      note: "Renta Básica Universal reclamada desde web",
      status: "Settled",
      createdAt: new Date().toISOString(),
      netAmount: RBU_AMOUNT,
      taxAmount: 0,
      concept: "RBU_WEB",
      IBAN_Origin: agldp.iban
    };
    await upsertEntity("accounts", nextAccount.id, nextAccount);
    await upsertEntity("accounts", nextAgldp.id, nextAgldp);
    await upsertEntity("transactions", transaction.id, transaction);
    await writeAuditLog(request, { actorDip: normalizedDip, action: "WEB_RBU_CLAIM", targetId: transaction.id, metadata: { accountId } });
    return NextResponse.json({ ok: true, transaction });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "rbu_error" }, { status: 500 });
  }
}
