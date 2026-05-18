import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { donationPointsFor, safeDonationAmountCents, stripePublishableKey, stripeRequest } from "../../../lib/stripe-donations";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST,OPTIONS",
  "access-control-allow-headers": "content-type",
  "access-control-max-age": "86400",
  "cache-control": "no-store"
};

function text(value: unknown, fallback = "") {
  return String(value || fallback).trim();
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const dip = text(payload.dip).toUpperCase();
    const placetaId = text(payload.placetaId).toUpperCase();
    const amountCents = safeDonationAmountCents(payload.amountEur);
    if (!dip || !placetaId) throw new Error("identity_required");
    if (amountCents < 100) throw new Error("minimum_donation_1_eur");

    const donationId = `don-${crypto.randomUUID()}`;
    const points = donationPointsFor(amountCents);
    const body = new URLSearchParams({
      amount: String(amountCents),
      currency: "eur",
      "automatic_payment_methods[enabled]": "true",
      description: "Donacion Grupo de La Placeta",
      "metadata[donationId]": donationId,
      "metadata[dip]": dip,
      "metadata[placetaId]": placetaId,
      "metadata[points]": String(points),
      "metadata[source]": "banco-android"
    });
    const paymentIntent = await stripeRequest("/payment_intents", body);
    const publishableKey = stripePublishableKey();
    if (!publishableKey) throw new Error("stripe_publishable_key_missing");

    return NextResponse.json({
      donationId,
      points,
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      publishableKey
    }, { headers: corsHeaders });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "stripe_donation_failed" }, { status: 400, headers: corsHeaders });
  }
}
