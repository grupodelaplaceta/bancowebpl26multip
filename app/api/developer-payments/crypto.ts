import crypto from "node:crypto";
import { BankState, captureDeveloperPayment, createDeveloperPayment, DeveloperPayment, isOfficialIban, normalizeState } from "../../../lib/bank";
import { requiredProductionSecret } from "../../../lib/api-security";
import { BANK_API_URL } from "../../../lib/site";

export const baseUrl = () => (process.env.PLACETA_API_BASE_URL || BANK_API_URL).replace(/\/$/, "");
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
export const appSecret = () => appSecrets()[0];
const developerSecret = () => process.env.PLACETA_DEVELOPER_SECRET || appSecret();
const developerApiKey = () => process.env.PLACETA_DEVELOPER_API_KEY || "";

export const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,OPTIONS",
  "access-control-allow-headers": "content-type,x-api-key",
  "access-control-max-age": "86400"
};

function sha256Hex(value: string) {
  return crypto.createHash("sha256").update(value || "", "utf8").digest("hex");
}

export function signedHeaders(method: string, path: string, body: string, secret = appSecret()) {
  const timestamp = String(Date.now());
  const nonce = crypto.randomUUID();
  const payload = [method, path, timestamp, nonce, sha256Hex(body)].join("\n");
  const signature = crypto.createHmac("sha256", secret).update(payload, "utf8").digest("hex");
  return {
    "content-type": "application/json",
    "x-placeta-app-id": appId(),
    "x-placeta-timestamp": timestamp,
    "x-placeta-nonce": nonce,
    "x-placeta-signature": signature
  };
}

function base64url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function fromBase64url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

export function requireDeveloperKey(request: Request) {
  const provided = request.headers.get("x-api-key") || "";
  const expected = developerApiKey();
  return Boolean(expected) && provided === expected;
}

export function signPayment(payment: DeveloperPayment) {
  const payload = base64url(JSON.stringify(payment));
  const signature = crypto.createHmac("sha256", developerSecret()).update(payload, "utf8").digest("base64url");
  return `${payload}.${signature}`;
}

export function verifyPaymentToken(token: string) {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) throw new Error("Token de pago inválido");
  const expected = crypto.createHmac("sha256", developerSecret()).update(payload, "utf8").digest("base64url");
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) throw new Error("Firma de pago inválida");
  return JSON.parse(fromBase64url(payload)) as DeveloperPayment;
}

export async function readRemoteState() {
  const path = "/api/state";
  let lastError: unknown = null;
  for (const secret of appSecrets()) {
    try {
      const response = await fetch(`${baseUrl()}${path}`, {
        method: "GET",
        headers: signedHeaders("GET", path, "", secret),
        cache: "no-store"
      });
      const text = await response.text();
      if (!response.ok) throw new Error(text || "remote_state_unavailable");
      return normalizeState(text ? JSON.parse(text) : null);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("remote_state_unavailable");
}

export async function writeRemoteState(state: BankState) {
  const path = "/api/state";
  const body = JSON.stringify(normalizeState(state));
  let lastError: unknown = null;
  for (const secret of appSecrets()) {
    try {
      const response = await fetch(`${baseUrl()}${path}`, {
        method: "PUT",
        headers: signedHeaders("PUT", path, body, secret),
        body,
        cache: "no-store"
      });
      const text = await response.text();
      if (!response.ok) throw new Error(text || "remote_write_failed");
      const payload = text ? JSON.parse(text) : null;
      if (payload && Array.isArray(payload.accounts)) return normalizeState(payload);
      return normalizeState(state);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("remote_write_failed");
}

export function buildPayment(input: { merchantIban?: string; amountPz?: number; concept?: string }) {
  const merchantIban = String(input.merchantIban || "").trim().toUpperCase();
  if (!isOfficialIban(merchantIban)) throw new Error("merchantIban GDLP oficial requerido");
  if (!Number.isFinite(input.amountPz) || Number(input.amountPz) <= 0) throw new Error("amountPz inválido");
  return createDeveloperPayment(merchantIban, Number(input.amountPz), input.concept || "Pago externo GDLP");
}

export function capturePayment(state: BankState, payment: DeveloperPayment, customerAccountId: string) {
  return captureDeveloperPayment(state, payment, customerAccountId);
}
