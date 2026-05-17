import { NextResponse } from "next/server";
import { corsHeaders, verifyPaymentToken } from "../crypto";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const token = new URL(request.url).searchParams.get("token") || "";
    const payment = verifyPaymentToken(token);
    if (payment.id !== params.id) return NextResponse.json({ error: "payment_id_mismatch" }, { status: 409, headers: corsHeaders });
    return NextResponse.json({ payment }, { headers: corsHeaders });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "payment_lookup_failed" }, { status: 400, headers: corsHeaders });
  }
}
