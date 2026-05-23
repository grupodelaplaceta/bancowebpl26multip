import { NextResponse } from "next/server";
import { capturePaymentLink, isOfficialIban, normalizeIban, normalizeState, PaymentLink } from "../../../../../lib/bank";
import { corsHeaders, readRemoteState, writeRemoteState } from "../../../developer-payments/crypto";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const payload = await request.json();
    const paymentCredential = String(payload.paymentCredential || payload.payerAccountId || "").trim();
    const cardPin = String(payload.cardPin || "").trim();
    const verificationAccepted = Boolean(payload.verificationAccepted);
    if (!paymentCredential) return NextResponse.json({ error: "Introduce un IBAN, PlacetaID, cuenta o tarjeta GDLP" }, { status: 400, headers: corsHeaders });

    const remote = await readRemoteState();
    const fallback = payload.fallback as PaymentLink | undefined;
    const base = fallback && !(remote.paymentLinks || []).some((link) => link.id === params.id)
      ? normalizeState({ ...remote, paymentLinks: [fallback, ...(remote.paymentLinks || [])] })
      : remote;

    const link = (base.paymentLinks || []).find((item) => item.id === params.id);
    if (!link) return NextResponse.json({ error: "Enlace no encontrado o caducado" }, { status: 404, headers: corsHeaders });

    const cleanCredential = paymentCredential.replace(/\s+/g, "");
    const normalizedCredential = cleanCredential.toUpperCase();
    const normalizedDip = normalizedCredential.replace(/-/g, "");
    const cardDigits = cleanCredential.replace(/\D/g, "");
    const looksLikeAccountCredential = normalizedCredential.startsWith("GDLP") || /^\d{8}[A-Z]$/.test(normalizedDip) || normalizedCredential.includes("-");
    const card = !looksLikeAccountCredential && cardDigits.length >= 4
      ? base.digitalCards.find((item) => item.cardNumber === cardDigits || item.cardNumber.endsWith(cardDigits))
      : undefined;

    let payerAccountId = "";
    if (card) {
      if (card.frozen) return NextResponse.json({ error: "Esta tarjeta está congelada. Usa otra tarjeta o una cuenta por IBAN." }, { status: 400, headers: corsHeaders });
      if (!cardPin) return NextResponse.json({ error: "Introduce el PIN de la tarjeta para confirmar el pago" }, { status: 400, headers: corsHeaders });
      if (card.pin !== cardPin) return NextResponse.json({ error: "PIN de tarjeta incorrecto" }, { status: 401, headers: corsHeaders });
      if (!base.accounts.some((account) => account.id === card.accountId)) {
        return NextResponse.json({ error: "La tarjeta no está vinculada a una cuenta activa" }, { status: 404, headers: corsHeaders });
      }
      payerAccountId = card.accountId;
    } else {
      if (!looksLikeAccountCredential && cardDigits.length >= 4) {
        return NextResponse.json({ error: "No encontramos una tarjeta activa con esos dígitos. Revisa el número o usa IBAN GDLP." }, { status: 404, headers: corsHeaders });
      }
      const dipUser = base.users.find((user) => user.dip.toUpperCase().replace(/[\s-]+/g, "") === normalizedDip);
      const account = base.accounts.find((item) =>
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
      if (link.totalPz > 500 && !verificationAccepted) {
        return NextResponse.json({
          error: "Este pago supera 500 Pz. Verifícalo desde la web o desde la app antes de confirmarlo.",
          requiresVerification: true
        }, { status: 428, headers: corsHeaders });
      }
      payerAccountId = account.id;
    }

    const next = capturePaymentLink(base, params.id, payerAccountId);
    const saved = normalizeState(await writeRemoteState(next));
    const paidLink = (saved.paymentLinks || []).find((item) => item.id === params.id);
    if (!paidLink || paidLink.status !== "Paid") throw new Error("El enlace no quedó confirmado");
    return NextResponse.json({ link: paidLink }, { headers: corsHeaders });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "payment_link_capture_failed" }, { status: 400, headers: corsHeaders });
  }
}
