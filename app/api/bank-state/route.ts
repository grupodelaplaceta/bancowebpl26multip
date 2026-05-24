import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { demoSeed, normalizeState } from "../../../lib/bank";
import type { BankState } from "../../../lib/bank";
import { productionSecret, requiredProductionSecret } from "../../../lib/api-security";
import { BANK_API_URL } from "../../../lib/site";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const baseUrl = () => (process.env.PLACETA_API_BASE_URL || BANK_API_URL).replace(/\/$/, "");
const appId = () => process.env.PLACETA_API_APP_ID || process.env.PLACETA_APP_ID || "org.laplaceta.banco";
const appSecret = () => requiredProductionSecret("PLACETA_API_SECRET", process.env.PLACETA_API_SECRET, process.env.PLACETA_APP_SECRET);
const noStoreHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  "Pragma": "no-cache",
  "Expires": "0"
};

const localHeaders = { ...noStoreHeaders, "x-placeta-sync-mode": "local" };
const allowLocalFallback = () => process.env.NODE_ENV !== "production" || process.env.PLACETA_ALLOW_LOCAL_BANK_STATE === "true";

declare global {
  var __placetaBankState: BankState | undefined;
}

function hasRemoteConfig() {
  return Boolean(productionSecret(process.env.PLACETA_API_SECRET, process.env.PLACETA_APP_SECRET));
}

function localState() {
  globalThis.__placetaBankState = normalizeState(globalThis.__placetaBankState || demoSeed());
  return globalThis.__placetaBankState;
}

function setLocalState(state: BankState) {
  globalThis.__placetaBankState = normalizeState(state);
  return globalThis.__placetaBankState;
}

function headerSafeError(error: unknown) {
  const message = error instanceof Error ? error.message : "sync_failed";
  return message.replace(/[\r\n]/g, " ").slice(0, 180);
}

function sha256Hex(value: string) {
  return crypto.createHash("sha256").update(value || "", "utf8").digest("hex");
}

function signedHeaders(method: string, path: string, body: string) {
  const timestamp = String(Date.now());
  const nonce = crypto.randomUUID();
  const bodyHash = sha256Hex(body);
  const payload = [method, path, timestamp, nonce, bodyHash].join("\n");
  const signature = crypto.createHmac("sha256", appSecret()).update(payload, "utf8").digest("hex");
  return {
    "content-type": "application/json",
    "x-placeta-app-id": appId(),
    "x-placeta-timestamp": timestamp,
    "x-placeta-nonce": nonce,
    "x-placeta-signature": signature
  };
}

async function callBankApi(method: "GET" | "PUT", body = "") {
  const path = "/api/state";
  const url = method === "GET" ? `${baseUrl()}${path}?ts=${Date.now()}` : `${baseUrl()}${path}`;
  const response = await fetch(url, {
    method,
    headers: signedHeaders(method, path, body),
    body: method === "PUT" ? body : undefined,
    cache: "no-store"
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};
  if (!response.ok) throw new Error(payload?.error ? `remote_${response.status}:${payload.error}` : `remote_${response.status}`);
  return NextResponse.json(payload, { status: response.status, headers: noStoreHeaders });
}

async function readRemoteState() {
  const path = "/api/state";
  const response = await fetch(`${baseUrl()}${path}?ts=${Date.now()}`, {
    method: "GET",
    headers: signedHeaders("GET", path, ""),
    cache: "no-store"
  });
  const text = await response.text();
  if (!response.ok) throw new Error(text || "remote_state_unavailable");
  return normalizeState(text ? JSON.parse(text) : null);
}

export async function GET() {
  if (!hasRemoteConfig()) {
    if (!allowLocalFallback()) {
      return NextResponse.json({ error: "missing_remote_bank_config" }, { status: 503, headers: noStoreHeaders });
    }
    return NextResponse.json(localState(), { status: 200, headers: localHeaders });
  }

  try {
    return await callBankApi("GET");
  } catch (error) {
    if (!allowLocalFallback()) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "sync_failed" }, { status: 503, headers: noStoreHeaders });
    }
    return NextResponse.json(localState(), { status: 200, headers: { ...localHeaders, "x-placeta-sync-error": headerSafeError(error) } });
  }
}

export async function PUT(request: Request) {
  let rawText = "";
  try {
    rawText = await request.text();
    const payload = rawText ? JSON.parse(rawText) : {};
    const nextState = normalizeState(payload.state || payload);
    const baseUpdatedAt = payload.baseUpdatedAt || null;

    if (!hasRemoteConfig()) {
      if (!allowLocalFallback()) {
        return NextResponse.json({ error: "missing_remote_bank_config" }, { status: 503, headers: noStoreHeaders });
      }
      return NextResponse.json(setLocalState(nextState), { status: 200, headers: localHeaders });
    }

    if (baseUpdatedAt) {
      const remote = await readRemoteState();
      if (remote.updatedAt && remote.updatedAt !== baseUpdatedAt) {
        return NextResponse.json({ error: "state_conflict", remote }, { status: 409, headers: noStoreHeaders });
      }
    }

    return await callBankApi("PUT", JSON.stringify(nextState));
  } catch (error) {
    if (!allowLocalFallback()) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "sync_failed" }, { status: 503, headers: noStoreHeaders });
    }
    try {
      const payload = rawText ? JSON.parse(rawText) : {};
      return NextResponse.json(setLocalState(payload.state || payload), { status: 200, headers: { ...localHeaders, "x-placeta-sync-error": headerSafeError(error) } });
    } catch {
      return NextResponse.json({ error: error instanceof Error ? error.message : "sync_failed" }, { status: 503, headers: noStoreHeaders });
    }
  }
}
