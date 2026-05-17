import { NextResponse } from "next/server";
import { bankApiUrl } from "../../../lib/site";
import { buildPayment, corsHeaders, requireDeveloperKey, signPayment } from "./crypto";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: Request) {
  try {
    if (!requireDeveloperKey(request)) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: corsHeaders });
    }
    const payload = await request.json();
    const payment = buildPayment(payload);
    return NextResponse.json({
      payment,
      token: signPayment(payment),
      checkoutUrl: bankApiUrl(`/api/developer-payments/${payment.id}`),
      ivaPercent: 12
    }, { headers: corsHeaders });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "payment_create_failed" }, { status: 400, headers: corsHeaders });
  }
}
