import { NextResponse } from "next/server";
import { writeAuditLog } from "../../../lib/audit";
import { upsertEntity } from "../../../lib/placeta-api";
import type { TreasuryConfig } from "../../../lib/types";

export async function PUT(request: Request) {
  try {
    const payload = (await request.json()) as TreasuryConfig;
    const result = await upsertEntity("treasuryConfig", "treasuryConfig", payload);
    await writeAuditLog(request, { actorDip: "DIP-A001", action: "ADMIN_CONFIG_UPDATE", targetId: "treasuryConfig", metadata: payload as Record<string, unknown> });
    return NextResponse.json({ ok: true, item: result.item });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "admin_config_error" }, { status: 500 });
  }
}
