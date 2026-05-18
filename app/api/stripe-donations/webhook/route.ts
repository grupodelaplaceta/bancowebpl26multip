import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { persistRewardFromPaymentIntent } from "../../../../lib/stripe-donations";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function verifyStripeSignature(payload: string, signatureHeader: string, secret: string) {
  const parts = Object.fromEntries(signatureHeader.split(",").map((part) => {
    const [key, value] = part.split("=");
    return [key, value];
  }));
  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) return false;
  const timestampMs = Number(timestamp) * 1000;
  if (!Number.isFinite(timestampMs) || Math.abs(Date.now() - timestampMs) > 5 * 60 * 1000) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`, "utf8")
    .digest("hex");
  const left = Buffer.from(signature, "hex");
  const right = Buffer.from(expected, "hex");
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

export async function POST(request: Request) {
  try {
    const secret = String(process.env.STRIPE_WEBHOOK_SECRET || "").trim();
    if (!secret) throw new Error("stripe_webhook_secret_missing");
    const body = await request.text();
    const signature = request.headers.get("stripe-signature") || "";
    if (!verifyStripeSignature(body, signature, secret)) {
      return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
    }
    const event = JSON.parse(body);
    if (event.type === "payment_intent.succeeded") {
      await persistRewardFromPaymentIntent(event.data.object);
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "stripe_webhook_failed" }, { status: 400 });
  }
}
