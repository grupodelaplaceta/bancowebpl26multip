import crypto from "node:crypto";

const apiBaseUrl = process.env.PLACETA_API_BASE_URL || "https://apisbanco.vercel.app";
const appId = process.env.PLACETA_API_APP_ID || "org.laplaceta.banco";
const appSecret = process.env.PLACETA_API_SECRET || "dev-secret-change-me";

function sha256Hex(value: string) {
  return crypto.createHash("sha256").update(value || "", "utf8").digest("hex");
}

function nonce() {
  return crypto.randomBytes(16).toString("hex");
}

async function signedFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method || "GET").toUpperCase();
  const body = typeof init.body === "string" ? init.body : "";
  const timestamp = Date.now().toString();
  const requestNonce = nonce();
  const signedPayload = [method, path.split("?")[0], timestamp, requestNonce, sha256Hex(body)].join("\n");
  const signature = crypto.createHmac("sha256", appSecret).update(signedPayload, "utf8").digest("hex");
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    method,
    body: method === "GET" ? undefined : body,
    headers: {
      "content-type": "application/json",
      "x-placeta-app-id": appId,
      "x-placeta-timestamp": timestamp,
      "x-placeta-nonce": requestNonce,
      "x-placeta-signature": signature,
      ...(init.headers || {})
    },
    cache: "no-store"
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(json?.error || `api_error_${response.status}`);
  }
  return json as T;
}

export async function getState<T>() {
  return signedFetch<T>("/api/state");
}

export async function upsertEntity<T>(collection: string, id: string, payload: T) {
  const query = new URLSearchParams({ collection, id });
  return signedFetch<{ item: T }>(`/api/entity?${query}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}
