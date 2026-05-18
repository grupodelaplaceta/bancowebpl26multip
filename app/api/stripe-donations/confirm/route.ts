import { NextResponse } from "next/server";
import { persistRewardFromPaymentIntent, stripeRequest } from "../../../../lib/stripe-donations";

const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST,OPTIONS",
  "access-control-allow-headers": "content-type",
  "access-control-max-age": "86400",
  "cache-control": "no-store"
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const paymentIntentId = String(payload.paymentIntentId || "").trim();
    if (!paymentIntentId.startsWith("pi_")) throw new Error("payment_intent_required");
    const paymentIntent = await stripeRequest(`/payment_intents/${encodeURIComponent(paymentIntentId)}`);
    const reward = await persistRewardFromPaymentIntent(paymentIntent);
    return NextResponse.json({ ok: true, reward }, { headers: corsHeaders });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "donation_confirm_failed" }, { status: 400, headers: corsHeaders });
  }
}
