import { NextResponse } from "next/server";
import { buildWebTransaction, findDestinationAccount } from "../../../lib/bank";
import { getState, upsertEntity } from "../../../lib/placeta-api";
import type { Account, BankState } from "../../../lib/types";

const AGLDP_ID = "AGLDP";

export async function POST(request: Request) {
  try {
    const { destination, amountPz, concept } = (await request.json()) as {
      destination?: string;
      amountPz?: number;
      concept?: string;
    };
    const amount = Math.round(Number(amountPz || 0));
    if (!destination || amount <= 0) return NextResponse.json({ error: "missing_transfer_data" }, { status: 400 });

    const state = await getState<BankState>();
    const accounts = state.accounts || [];
    const from = accounts.find((account) => account.id === AGLDP_ID);
    const to = findDestinationAccount(accounts, destination);
    if (!from) return NextResponse.json({ error: "agldp_not_found" }, { status: 404 });
    if (!to) return NextResponse.json({ error: "destination_not_found" }, { status: 404 });
    if (from.balancePz < amount) return NextResponse.json({ error: "insufficient_balance" }, { status: 409 });

    const nextFrom: Account = { ...from, balancePz: from.balancePz - amount };
    const nextTo: Account = { ...to, balancePz: to.balancePz + amount };
    const transaction = buildWebTransaction(from, to, amount, 0, concept || "Transferencia admin web");

    await upsertEntity("accounts", nextFrom.id, nextFrom);
    await upsertEntity("accounts", nextTo.id, nextTo);
    await upsertEntity("transactions", transaction.id, { ...transaction, concept: "ADMIN_WEB_TRANSFER" });

    return NextResponse.json({ ok: true, transaction, balances: { from: nextFrom.balancePz, to: nextTo.balancePz } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "admin_transfer_error" }, { status: 500 });
  }
}
