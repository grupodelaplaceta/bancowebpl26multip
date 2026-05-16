import { NextResponse } from "next/server";
import { belongsToUser, ensureWebAccount } from "../../../lib/bank";
import { getState, upsertEntity } from "../../../lib/placeta-api";
import type { BankState } from "../../../lib/types";

export async function POST(request: Request) {
  try {
    const { dip } = (await request.json()) as { dip?: string };
    const normalizedDip = dip?.trim().toUpperCase();
    if (!normalizedDip) return NextResponse.json({ error: "dip_required" }, { status: 400 });

    const state = await getState<BankState>();
    const user = state.users?.find((item) => item.dip?.toUpperCase() === normalizedDip);
    if (!user) return NextResponse.json({ error: "user_not_found" }, { status: 404 });

    const webAccount = ensureWebAccount(state, user);
    if (!state.accounts?.some((account) => account.id === webAccount.id)) {
      await upsertEntity("accounts", webAccount.id, webAccount);
      state.accounts = [...(state.accounts || []), webAccount];
    }

    const accounts = (state.accounts || []).filter((account) => belongsToUser(account, user));
    const accountIds = new Set(accounts.map((account) => account.id));
    const transactions = (state.transactions || [])
      .filter((transaction) => accountIds.has(transaction.fromAccountId) || accountIds.has(transaction.toAccountId))
      .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")))
      .slice(0, 40);
    const cards = (state.digitalCards || []).filter((card) => accountIds.has(card.accountId));

    return NextResponse.json({
      user,
      accounts,
      transactions,
      cards,
      treasuryConfig: state.treasuryConfig || {},
      updatedAt: state.updatedAt || null
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "session_error" }, { status: 500 });
  }
}
