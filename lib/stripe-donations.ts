import { DonationReward, normalizeState } from "./bank";
import { readRemoteState, writeRemoteState } from "../app/api/developer-payments/crypto";

function text(value: unknown, fallback = "") {
  return String(value || fallback).trim();
}

export const stripeSecretKey = () => String(process.env.STRIPE_SECRET_KEY || "").trim();
export const stripePublishableKey = () => String(process.env.STRIPE_PUBLISHABLE_KEY || "").trim();

export function safeDonationAmountCents(value: unknown) {
  const euros = Number(value || 0);
  if (!Number.isFinite(euros)) return 0;
  return Math.round(Math.min(500, Math.max(1, euros)) * 100);
}

export function donationPointsFor(amountCents: number) {
  return Math.max(1, Math.floor(amountCents / 100));
}

export async function stripeRequest(path: string, body?: URLSearchParams) {
  const secret = stripeSecretKey();
  if (!secret) throw new Error("stripe_secret_missing");
  const response = await fetch(`https://api.stripe.com/v1${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      authorization: `Bearer ${secret}`,
      ...(body ? { "content-type": "application/x-www-form-urlencoded" } : {})
    },
    body,
    cache: "no-store"
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload?.error?.message || "stripe_request_failed");
  return payload;
}

export async function persistRewardFromPaymentIntent(paymentIntent: any) {
  if (paymentIntent.status !== "succeeded") throw new Error("payment_not_succeeded");
  const metadata = paymentIntent.metadata || {};
  const id = text(metadata.donationId, paymentIntent.id);
  const now = new Date().toISOString();
  const reward: DonationReward = {
    id,
    dip: text(metadata.dip).toUpperCase(),
    placetaId: text(metadata.placetaId).toUpperCase(),
    amountCents: Number(paymentIntent.amount_received || paymentIntent.amount || 0),
    currency: text(paymentIntent.currency, "eur").toUpperCase(),
    points: Number(metadata.points || donationPointsFor(Number(paymentIntent.amount_received || paymentIntent.amount || 0))),
    status: "Available",
    destination: "Wallet",
    stripePaymentIntentId: paymentIntent.id,
    createdAt: now,
    updatedAt: now
  };
  if (!reward.dip || !reward.placetaId || reward.points <= 0) throw new Error("invalid_reward_metadata");

  const remote = normalizeState(await readRemoteState());
  const byId = new Map<string, DonationReward>();
  [...(remote.donationRewards || []), reward].forEach((item) => byId.set(item.id, item));
  const saved = await writeRemoteState(normalizeState({
    ...remote,
    donationRewards: [...byId.values()]
  }));
  return saved.donationRewards.find((item) => item.id === reward.id) || reward;
}
