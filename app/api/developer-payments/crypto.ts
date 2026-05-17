import crypto from "node:crypto";
import { BankState, captureDeveloperPayment, createDeveloperPayment, DeveloperPayment, normalizeState } from "../../../lib/bank";

const baseUrl = () => (process.env.PLACETA_API_BASE_URL || "https://apisbanco.vercel.app").replace(/\/$/, "");
const appId = () => process.env.PLACETA_API_APP_ID || process.env.PLACETA_APP_ID || "org.laplaceta.banco";
const appSecret = () => process.env.PLACETA_API_SECRET || process.env.PLACETA_APP_SECRET || "dev-secret-change-me";
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

function signedHeaders(method: string, path: string, body: string) {
  const timestamp = String(Date.now());
  const nonce = crypto.randomUUID();
  const payload = [method, path, timestamp, nonce, sha256Hex(body)].join("\n");
  const signature = crypto.createHmac("sha256", appSecret()).update(payload, "utf8").digest("hex");
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
  const response = await fetch(`${baseUrl()}${path}`, {
    method: "GET",
    headers: signedHeaders("GET", path, ""),
    cache: "no-store"
  });
  const text = await response.text();
  if (!response.ok) throw new Error(text || "remote_state_unavailable");
  return normalizeState(text ? JSON.parse(text) : null);
}

export async function writeRemoteState(state: BankState) {
  const path = "/api/state";
  const body = JSON.stringify(normalizeState(state));
  const response = await fetch(`${baseUrl()}${path}`, {
    method: "PUT",
    headers: signedHeaders("PUT", path, body),
    body,
    cache: "no-store"
  });
  const text = await response.text();
  if (!response.ok) throw new Error(text || "remote_write_failed");
  const payload = text ? JSON.parse(text) : null;
  if (payload && Array.isArray(payload.accounts)) return normalizeState(payload);
  return normalizeState(state);
}

export function buildPayment(input: { merchantIban?: string; amountPz?: number; concept?: string }) {
  const merchantIban = String(input.merchantIban || "").trim().toUpperCase();
  if (!merchantIban.startsWith("GDLP")) throw new Error("merchantIban GDLP requerido");
  if (!Number.isFinite(input.amountPz) || Number(input.amountPz) <= 0) throw new Error("amountPz inválido");
  return createDeveloperPayment(merchantIban, Number(input.amountPz), input.concept || "Pago externo GDLP");
}

export function capturePayment(state: BankState, payment: DeveloperPayment, customerAccountId: string) {
  return captureDeveloperPayment(state, payment, customerAccountId);
}
