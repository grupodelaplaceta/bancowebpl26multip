import { NextResponse } from "next/server";
import { capturePaymentLink, normalizeState, PaymentLink } from "../../../../../lib/bank";
import { corsHeaders, readRemoteState, writeRemoteState } from "../../../developer-payments/crypto";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const payload = await request.json();
    const payerAccountId = String(payload.payerAccountId || "");
    if (!payerAccountId) return NextResponse.json({ error: "payerAccountId requerido" }, { status: 400, headers: corsHeaders });
    const remote = await readRemoteState();
    const fallback = payload.fallback as PaymentLink | undefined;
    const base = fallback && !(remote.paymentLinks || []).some((link) => link.id === params.id)
      ? normalizeState({ ...remote, paymentLinks: [fallback, ...(remote.paymentLinks || [])] })
      : remote;
    const next = capturePaymentLink(base, params.id, payerAccountId);
    const saved = normalizeState(await writeRemoteState(next));
    const link = (saved.paymentLinks || []).find((item) => item.id === params.id);
    if (!link || link.status !== "Paid") throw new Error("El enlace no quedó confirmado");
    return NextResponse.json({ link }, { headers: corsHeaders });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "payment_link_capture_failed" }, { status: 400, headers: corsHeaders });
  }
}
