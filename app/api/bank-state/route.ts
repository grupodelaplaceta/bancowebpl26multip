import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { normalizeState } from "../../../lib/bank";

const baseUrl = () => (process.env.PLACETA_API_BASE_URL || "https://apisbanco.vercel.app").replace(/\/$/, "");
const appId = () => process.env.PLACETA_API_APP_ID || process.env.PLACETA_APP_ID || "org.laplaceta.banco";
const appSecret = () => process.env.PLACETA_API_SECRET || process.env.PLACETA_APP_SECRET || "dev-secret-change-me";

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
  const response = await fetch(`${baseUrl()}${path}`, {
    method,
    headers: signedHeaders(method, path, body),
    body: method === "PUT" ? body : undefined,
    cache: "no-store"
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};
  return NextResponse.json(payload, { status: response.status });
}

async function readRemoteState() {
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

export async function GET() {
  try {
    return await callBankApi("GET");
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "sync_failed" }, { status: 503 });
  }
}

export async function PUT(request: Request) {
  try {
    const text = await request.text();
    const payload = text ? JSON.parse(text) : {};
    const nextState = normalizeState(payload.state || payload);
    const baseUpdatedAt = payload.baseUpdatedAt || null;

    if (baseUpdatedAt) {
      const remote = await readRemoteState();
      if (remote.updatedAt && remote.updatedAt !== baseUpdatedAt) {
        return NextResponse.json({ error: "state_conflict", remote }, { status: 409 });
      }
    }

    return await callBankApi("PUT", JSON.stringify(nextState));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "sync_failed" }, { status: 503 });
  }
}
