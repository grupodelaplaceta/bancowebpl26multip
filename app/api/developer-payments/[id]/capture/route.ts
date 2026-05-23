import { NextResponse } from "next/server";
import { isOfficialIban, normalizeIban } from "../../../../../lib/bank";
import { capturePayment, corsHeaders, readRemoteState, verifyPaymentToken, writeRemoteState } from "../../crypto";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const payload = await request.json();
    const payment = verifyPaymentToken(payload.token || "");
    if (payment.id !== params.id) return NextResponse.json({ error: "payment_id_mismatch" }, { status: 409, headers: corsHeaders });
    const paymentCredential = String(payload.paymentCredential || payload.customerAccountId || "").trim();
    const cardPin = String(payload.cardPin || "").trim();
    const verificationAccepted = Boolean(payload.verificationAccepted);
    if (!paymentCredential) return NextResponse.json({ error: "Introduce IBAN, PlacetaID, cuenta o tarjeta GDLP" }, { status: 400, headers: corsHeaders });
    const remote = await readRemoteState();

    const cleanCredential = paymentCredential.replace(/\s+/g, "");
    const normalizedCredential = cleanCredential.toUpperCase();
    const normalizedDip = normalizedCredential.replace(/-/g, "");
    const cardDigits = cleanCredential.replace(/\D/g, "");
    const looksLikeAccountCredential = normalizedCredential.startsWith("GDLP") || /^\d{8}[A-Z]$/.test(normalizedDip) || normalizedCredential.includes("-");
    const card = !looksLikeAccountCredential && cardDigits.length >= 4
      ? remote.digitalCards.find((item) => item.cardNumber === cardDigits || item.cardNumber.endsWith(cardDigits))
      : undefined;

    let customerAccountId = "";
    if (card) {
      if (card.frozen) return NextResponse.json({ error: "Esta tarjeta está congelada. Usa otra tarjeta o una cuenta por IBAN." }, { status: 400, headers: corsHeaders });
      if (!cardPin) return NextResponse.json({ error: "Introduce el PIN de la tarjeta para confirmar el pago" }, { status: 400, headers: corsHeaders });
      if (card.pin !== cardPin) return NextResponse.json({ error: "PIN de tarjeta incorrecto" }, { status: 401, headers: corsHeaders });
      if (!remote.accounts.some((account) => account.id === card.accountId)) {
        return NextResponse.json({ error: "La tarjeta no está vinculada a una cuenta activa" }, { status: 404, headers: corsHeaders });
      }
      customerAccountId = card.accountId;
    } else {
      if (!looksLikeAccountCredential && cardDigits.length >= 4) {
        return NextResponse.json({ error: "No encontramos una tarjeta activa con esos dígitos. Revisa el número o usa IBAN GDLP." }, { status: 404, headers: corsHeaders });
      }
      const dipUser = remote.users.find((user) => user.dip.toUpperCase().replace(/[\s-]+/g, "") === normalizedDip);
      const account = remote.accounts.find((item) =>
        item.id === paymentCredential ||
        item.id === dipUser?.primaryAccountId ||
        normalizeIban(item.iban) === normalizeIban(paymentCredential) ||
        item.placetaId?.toUpperCase() === normalizedCredential
      );
      if (!account) {
        const looksLikeIban = normalizedCredential.startsWith("GDLP");
        const message = looksLikeIban && !isOfficialIban(normalizedCredential)
          ? "El IBAN no tiene formato oficial GDLP. Revisa guiones y dígitos de control."
          : "No encontramos esa cuenta. Puedes usar IBAN GDLP, PlacetaID o una tarjeta activa.";
        return NextResponse.json({ error: message }, { status: 404, headers: corsHeaders });
      }
      if (payment.totalPz > 500 && !verificationAccepted) {
        return NextResponse.json({
          error: "Este pago supera 500 Pz. Verifícalo desde la web o desde la app antes de confirmarlo.",
          requiresVerification: true
        }, { status: 428, headers: corsHeaders });
      }
      customerAccountId = account.id;
    }

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
