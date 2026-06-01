import { NextResponse } from "next/server";
import { finalizeState, normalizeState } from "../../../lib/bank";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const noStoreHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  "Pragma": "no-cache",
  "Expires": "0"
};

function allowedDips() {
  return [process.env.PLACETA_ADMIN_DIPS, process.env.ADMIN_ALLOWED_DIPS, "12345678A,11111111D"]
    .filter(Boolean)
    .join(",")
    .split(",")
    .map((item) => item.trim().toUpperCase())
    .filter(Boolean);
}

function requireAdmin(request: Request) {
  const dip = (request.headers.get("x-admin-dip") || "").trim().toUpperCase();
  const bearer = request.headers.get("authorization") || "";
  if (!bearer.startsWith("Bearer ")) return { ok: false, error: "placetaid_token_required", status: 401 };
  if (!dip || !allowedDips().includes(dip)) return { ok: false, error: "dip_not_allowed", status: 403 };
  return { ok: true, dip };
}

function bankStateUrl(request: Request) {
  return new URL("/api/bank-state", request.url).toString();
}

function serverStateHeaders(json = false): Record<string, string> {
  return json ? { "content-type": "application/json" } : {};
}

async function readState(request: Request) {
  const response = await fetch(`${bankStateUrl(request)}?adminTs=${Date.now()}`, {
    headers: serverStateHeaders(),
    cache: "no-store"
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.error || "bank_state_unavailable");
  return normalizeState(payload);
}

export async function GET(request: Request) {
  const auth = requireAdmin(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status, headers: noStoreHeaders });
  try {
    const state = await readState(request);
    return NextResponse.json({ state, allowedDip: auth.dip }, { headers: noStoreHeaders });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "admin_state_unavailable" },
      { status: 503, headers: noStoreHeaders }
    );
  }
}

export async function PUT(request: Request) {
  const auth = requireAdmin(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status, headers: noStoreHeaders });

  try {
    const payload = await request.json().catch(() => ({}));
    const nextState = finalizeState(normalizeState(payload.state));
    const baseUpdatedAt = payload.baseUpdatedAt || null;
    const response = await fetch(bankStateUrl(request), {
      method: "PUT",
      headers: serverStateHeaders(true),
      body: JSON.stringify({ state: nextState, baseUpdatedAt }),
      cache: "no-store"
    });
    const result = await response.json().catch(() => null);
    if (!response.ok) return NextResponse.json(result || { error: "admin_write_failed" }, { status: response.status, headers: noStoreHeaders });
    return NextResponse.json({ state: normalizeState(result), savedBy: auth.dip }, { headers: noStoreHeaders });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "admin_write_failed" },
      { status: 503, headers: noStoreHeaders }
    );
  }
}
