import crypto from "node:crypto";

export function productionSecret(...values: Array<string | undefined>) {
  const configured = values.map((value) => String(value || "").trim()).find(Boolean);
  return configured || "";
}

export function requiredProductionSecret(name: string, ...values: Array<string | undefined>) {
  const secret = productionSecret(...values);
  if (!secret) throw new Error(`missing_secret:${name}`);
  return secret;
}

export function timingSafeTokenEqual(provided: string | null | undefined, expected: string) {
  const left = Buffer.from(String(provided || ""), "utf8");
  const right = Buffer.from(String(expected || ""), "utf8");
  if (!left.length || !right.length || left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}
