import { NextResponse } from "next/server";
import { writeAuditLog } from "../../../lib/audit";
import { getState, upsertEntity } from "../../../lib/placeta-api";
import type { BankState } from "../../../lib/types";

export async function POST(request: Request) {
  try {
    const { accountId, complianceStatus } = (await request.json()) as { accountId?: string; complianceStatus?: string };
    if (!accountId || !complianceStatus) return NextResponse.json({ error: "missing_account_action" }, { status: 400 });
    const state = await getState<BankState>();
    const account = (state.accounts || []).find((item) => item.id === accountId);
    if (!account) return NextResponse.json({ error: "account_not_found" }, { status: 404 });
    const next = { ...account, complianceStatus };
    await upsertEntity("accounts", account.id, next);
    await writeAuditLog(request, { actorDip: "DIP-A001", action: "ADMIN_ACCOUNT_STATUS", targetId: account.id, metadata: { complianceStatus } });
    return NextResponse.json({ ok: true, account: next });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "admin_account_error" }, { status: 500 });
  }
}
