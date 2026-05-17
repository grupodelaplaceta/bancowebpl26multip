import { NextResponse } from "next/server";
import { readRemoteState, corsHeaders } from "../../developer-payments/crypto";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const state = await readRemoteState();
    const link = (state.paymentLinks || []).find((item) => item.id === params.id);
    if (!link) return NextResponse.json({ error: "payment_link_not_found" }, { status: 404, headers: corsHeaders });
    return NextResponse.json({ link }, { headers: corsHeaders });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "payment_link_lookup_failed" }, { status: 400, headers: corsHeaders });
  }
}
