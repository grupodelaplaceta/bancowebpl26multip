import { NextResponse } from "next/server";
import { capturePayment, corsHeaders, readRemoteState, verifyPaymentToken, writeRemoteState } from "../../crypto";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const payload = await request.json();
    const payment = verifyPaymentToken(payload.token || "");
    if (payment.id !== params.id) return NextResponse.json({ error: "payment_id_mismatch" }, { status: 409, headers: corsHeaders });
    const customerAccountId = String(payload.customerAccountId || "");
    if (!customerAccountId) return NextResponse.json({ error: "customerAccountId requerido" }, { status: 400, headers: corsHeaders });
    const remote = await readRemoteState();
    const result = capturePayment(remote, payment, customerAccountId);
    const state = await writeRemoteState(result.state);
    const confirmed = state.transactions.some((transaction) =>
      transaction.concept === "DEVELOPER_PAYMENT" &&
      transaction.originalTransactionId === payment.id
    );
    if (!confirmed) throw new Error("Pago no confirmado por el banco");
    return NextResponse.json({
      payment: result.payment,
      transactionId: result.payment.transactionId,
      updatedAt: state.updatedAt
    }, { headers: corsHeaders });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "payment_capture_failed" }, { status: 400, headers: corsHeaders });
  }
}
