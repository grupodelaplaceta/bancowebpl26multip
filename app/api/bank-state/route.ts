import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { emptyBankState, normalizeState } from "../../../lib/bank";
import type { BankState } from "../../../lib/bank";
import { productionSecret, requiredProductionSecret } from "../../../lib/api-security";
import { BANK_API_URL } from "../../../lib/site";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const configuredBaseUrl = () => (process.env.PLACETA_API_BASE_URL || BANK_API_URL).replace(/\/$/, "");
const baseUrls = () => Array.from(new Set([configuredBaseUrl(), BANK_API_URL.replace(/\/$/, "")].filter(Boolean)));
const appId = () => process.env.PLACETA_API_APP_ID || process.env.PLACETA_APP_ID || "org.laplaceta.banco";
const splitSecrets = (...values: Array<string | undefined>) =>
  values
    .filter(Boolean)
    .join(",")
    .split(/[,\r\n]+/)
    .map((value) => String(value || "").trim().replace(/^["']|["']$/g, ""))
    .filter(Boolean);
const appSecrets = () => {
  const secrets = splitSecrets(
    process.env.PLACETA_API_SECRETS,
    process.env.PLACETA_APP_SECRETS,
    process.env.PLACETA_BANK_API_SECRETS,
    process.env.BANK_API_SECRETS,
    process.env.PLACETA_API_SECRET,
    process.env.PLACETA_APP_SECRET,
    process.env.PLACETA_BANK_API_SECRET,
    process.env.BANK_API_SECRET,
    process.env.API_SECRET
  );
  if (!secrets.length) requiredProductionSecret("PLACETA_API_SECRET", process.env.PLACETA_API_SECRET, process.env.PLACETA_APP_SECRET, process.env.BANK_API_SECRET);
  return Array.from(new Set(secrets));
};
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

function bearerToken(request?: Request) {
  const auth = request?.headers.get("authorization") || "";
  return auth.startsWith("Bearer ") ? auth : "";
}

function hasRemoteConfig(request?: Request) {
  return Boolean(productionSecret(process.env.PLACETA_API_SECRET, process.env.PLACETA_APP_SECRET) || (request && bearerToken(request)));
}

function localState() {
  globalThis.__placetaBankState = normalizeState(globalThis.__placetaBankState || emptyBankState());
  return globalThis.__placetaBankState;
}

function setLocalState(state: BankState) {
  globalThis.__placetaBankState = normalizeState(state);
  return globalThis.__placetaBankState;
}

function isFullStatePayload(value: unknown) {
  return Boolean(
    value &&
    typeof value === "object" &&
    Array.isArray((value as Partial<BankState>).users) &&
    Array.isArray((value as Partial<BankState>).accounts) &&
    Array.isArray((value as Partial<BankState>).transactions)
  );
}

function headerSafeError(error: unknown) {
  const message = error instanceof Error ? error.message : "sync_failed";
  return message.replace(/[\r\n]/g, " ").slice(0, 180);
}

function parseRemoteJson(text: string, status: number) {
  if (!text.trim()) return {};
  try {
    return JSON.parse(text);
  } catch {
    const preview = text.replace(/\s+/g, " ").trim().slice(0, 160);
    throw new Error(`remote_${status}:non_json_response:${preview || "empty"}`);
  }
}

function sha256Hex(value: string) {
  return crypto.createHash("sha256").update(value || "", "utf8").digest("hex");
}

function signedHeaders(method: string, path: string, body: string, request?: Request, secret?: string): Record<string, string> {
  const bearer = request ? bearerToken(request) : "";
  if (bearer) {
    return {
      "content-type": "application/json",
      "x-placeta-app-id": appId(),
      Authorization: bearer
    };
  }

  const timestamp = String(Date.now());
  const nonce = crypto.randomUUID();
  const bodyHash = sha256Hex(body);
  const payload = [method, path, timestamp, nonce, bodyHash].join("\n");
  const signature = crypto.createHmac("sha256", secret || appSecrets()[0]).update(payload, "utf8").digest("hex");
  return {
    "content-type": "application/json",
    "x-placeta-app-id": appId(),
    "x-placeta-timestamp": timestamp,
    "x-placeta-nonce": nonce,
    "x-placeta-signature": signature
  };
}

async function callBankApi(method: "GET" | "PUT", body = "", request?: Request) {
  const path = "/api/state";
  let lastError: unknown = null;
  for (const remoteBaseUrl of baseUrls()) {
    const secrets = bearerToken(request) ? [""] : appSecrets();
    for (const secret of secrets) {
      try {
        const url = method === "GET" ? `${remoteBaseUrl}${path}?ts=${Date.now()}` : `${remoteBaseUrl}${path}`;
        const response = await fetch(url, {
          method,
          headers: signedHeaders(method, path, body, request, secret),
          body: method === "PUT" ? body : undefined,
          cache: "no-store"
        });
        const text = await response.text();
        const payload = parseRemoteJson(text, response.status);
        if (!response.ok) throw new Error(payload?.error ? `remote_${response.status}:${payload.error}` : `remote_${response.status}`);

        const res = NextResponse.json(normalizeState(payload), { status: response.status, headers: noStoreHeaders });
        const newToken = response.headers.get("X-New-Token");
        if (newToken) {
          res.headers.set("X-New-Token", newToken);
          res.headers.set("Access-Control-Expose-Headers", "X-New-Token");
        }
        return res;
      } catch (error) {
        lastError = error;
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error("remote_state_unavailable");
}

async function readRemoteState(request?: Request) {
  const path = "/api/state";
  let lastError: unknown = null;
  for (const remoteBaseUrl of baseUrls()) {
    const secrets = bearerToken(request) ? [""] : appSecrets();
    for (const secret of secrets) {
      try {
        const response = await fetch(`${remoteBaseUrl}${path}?ts=${Date.now()}`, {
          method: "GET",
          headers: signedHeaders("GET", path, "", request, secret),
          cache: "no-store"
        });
        const text = await response.text();
        const payload = parseRemoteJson(text, response.status);
        if (!response.ok) throw new Error(payload?.error ? `remote_${response.status}:${payload.error}` : text || "remote_state_unavailable");
        return normalizeState(payload);
      } catch (error) {
        lastError = error;
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error("remote_state_unavailable");
}

export async function GET(request: Request) {
  if (!hasRemoteConfig(request)) {
    if (!allowLocalFallback()) {
      return NextResponse.json({ error: "missing_remote_bank_config" }, { status: 503, headers: noStoreHeaders });
    }
    return NextResponse.json(localState(), { status: 200, headers: localHeaders });
  }

  try {
    return await callBankApi("GET", "", request);
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
    if (!isFullStatePayload(payload.state)) {
      return NextResponse.json({ error: "full_bank_state_required" }, { status: 400, headers: noStoreHeaders });
    }
    const nextState = normalizeState(payload.state);
    const baseUpdatedAt = payload.baseUpdatedAt || null;
    if (!hasRemoteConfig(request)) {
      if (!allowLocalFallback()) {
        return NextResponse.json({ error: "missing_remote_bank_config" }, { status: 503, headers: noStoreHeaders });
      }
      return NextResponse.json(setLocalState(nextState), { status: 200, headers: localHeaders });
    }

    if (baseUpdatedAt) {
      const remote = await readRemoteState(request);
      if (remote.updatedAt && remote.updatedAt !== baseUpdatedAt) {
        return NextResponse.json({ error: "state_conflict", remote }, { status: 409, headers: noStoreHeaders });
      }
    }

    return await callBankApi("PUT", JSON.stringify(nextState), request);
  } catch (error) {
    if (!allowLocalFallback()) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "sync_failed" }, { status: 503, headers: noStoreHeaders });
    }
    try {
      const payload = rawText ? JSON.parse(rawText) : {};
      if (!isFullStatePayload(payload.state)) throw new Error("full_bank_state_required");
      return NextResponse.json(setLocalState(payload.state), { status: 200, headers: { ...localHeaders, "x-placeta-sync-error": headerSafeError(error) } });
    } catch {
      return NextResponse.json({ error: error instanceof Error ? error.message : "sync_failed" }, { status: 503, headers: noStoreHeaders });
    }
  }
}
