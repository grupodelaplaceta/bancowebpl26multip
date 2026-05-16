import crypto from "node:crypto";
import { upsertEntity } from "./placeta-api";
import type { AuditLog } from "./types";

export function requestIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "0.0.0.0"
  );
}

export async function writeAuditLog(request: Request, log: Omit<AuditLog, "id" | "createdAt" | "ip" | "userAgent"> & Partial<AuditLog>) {
  const item: AuditLog = {
    id: `audit-${crypto.randomUUID()}`,
    createdAt: new Date().toISOString(),
    ip: log.ip || requestIp(request),
    userAgent: log.userAgent || request.headers.get("user-agent") || "unknown",
    ...log
  };
  await upsertEntity("auditLogs", item.id, item).catch(() => null);
  return item;
}

export async function sha256Hex(value: string) {
  const data = new TextEncoder().encode(value);
  const hash = await crypto.webcrypto.subtle.digest("SHA-256", data);
  return Buffer.from(hash).toString("hex");
}
