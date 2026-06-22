"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, CreditCard, Landmark, Loader2, LockKeyhole, ShieldCheck } from "lucide-react";
import { formatPz, isOfficialIban, PaymentLink } from "../../../lib/bank";

type SourceKind = "iban" | "card" | "unknown";

function detectSource(value: string): SourceKind {
  const clean = value.trim().toUpperCase();
  const digits = clean.replace(/\D/g, "");
  if (clean.startsWith("GDLP") || /^\d{8}[A-Z]$/.test(clean.replace(/[\s-]+/g, "")) || clean.includes("-")) return "iban";
  if (digits.length >= 4) return "card";
  return "unknown";
}

function sourceCopy(kind: SourceKind, value: string) {
  if (kind === "card") return "Tarjeta detectada. Se pedirá PIN para confirmar.";
  if (kind === "iban") {
    const normalized = value.replace(/\s+/g, "").toUpperCase();
    if (normalized.startsWith("GDLP") && !isOfficialIban(normalized)) return "Revisa el IBAN: parece GDLP, pero no pasa el control oficial.";
    return "Cuenta detectada. Para importes superiores a 500 Pz se pedirá verificación.";
  }
  return "Puedes escribir un IBAN GDLP, PlacetaID, ID interno o los últimos dígitos de una tarjeta.";
}

export default function PaymentLinkPage({ params }: { params: { id: string } }) {
  const [link, setLink] = useState<PaymentLink | null>(null);
  const [paymentCredential, setPaymentCredential] = useState("");
  const [cardPin, setCardPin] = useState("");
  const [status, setStatus] = useState("Cargando enlace...");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const sourceKind = useMemo(() => detectSource(paymentCredential), [paymentCredential]);
  const canPay = Boolean(link?.status === "Pending" && paymentCredential.trim() && (sourceKind !== "card" || cardPin.length >= 4));

  useEffect(() => {
    fetch(`/api/payment-links/${params.id}`, { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Enlace no disponible");
        setLink(payload.link);
        setStatus(payload.link.status === "Pending" ? "Listo para pagar" : "Este enlace ya fue usado");
      })
      .catch((caught) => {
        setError(caught instanceof Error ? caught.message : "Enlace no disponible");
        setStatus("No se pudo cargar el enlace");
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  async function capture() {
    if (!link || !canPay) return;
    setPaying(true);
    setError("");
    setStatus("Confirmando pago seguro...");
    const response = await fetch(`/api/payment-links/${params.id}/capture`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ paymentCredential, cardPin })
    });
    const payload = await response.json();
    setPaying(false);
    if (!response.ok) {
      setError(payload.error || "No se pudo pagar");
      setStatus("Revisa los datos del pago");
      return;
    }
    setLink(payload.link);
    setStatus("Pago confirmado");
  }

  return (
    <main className="pay-link-page">
      <section className="pay-link-card pay-link-card-upgraded">
        <div className="pay-link-brand">
          <span className="pay-link-brand-logo">
            <Image src="/logo.png" alt="Banco de La Placeta" fill sizes="56px" priority />
          </span>
          <div>
            <span>{link?.kind === "Send" ? "Envío de Placetas" : "Pago seguro"}</span>
            <strong>Banco de La Placeta</strong>
          </div>
        </div>

        <div className={`pay-link-status-orb ${link?.status === "Paid" ? "paid" : loading ? "loading" : ""}`}>
          {loading ? <Loader2 size={34} /> : link?.status === "Paid" ? <CheckCircle2 size={38} /> : <ShieldCheck size={38} />}
        </div>

        <h1>{link ? `${formatPz(link.totalPz)} Pz` : "Enlace seguro"}</h1>
        <p>{link?.concept || status}</p>

        {link && (
          <div className="pay-link-breakdown">
            <div><span>Neto</span><strong>{formatPz(link.amountPz)} Pz</strong></div>
            <div><span>IVA</span><strong>{formatPz(link.ivaPz)} Pz</strong></div>
            <div><span>Estado</span><strong>{link.status}</strong></div>
          </div>
        )}

        {link?.status === "Pending" && (
          <div className="pay-link-form">
            <label>
              <span>IBAN, PlacetaID o tarjeta</span>
              <div className={`pay-link-input-wrap ${sourceKind}`}>
                {sourceKind === "card" ? <CreditCard size={19} /> : sourceKind === "iban" ? <Landmark size={19} /> : <LockKeyhole size={19} />}
                <input
                  value={paymentCredential}
                  onChange={(event) => {
                    setPaymentCredential(event.target.value);
                    setCardPin("");
                    setError("");
                  }}
                  placeholder="GDLP app/web o tarjeta"
                />
              </div>
              <small>{sourceCopy(sourceKind, paymentCredential)}</small>
            </label>

            {sourceKind === "card" && (
              <label className="pay-link-slide-in">
                <span>PIN de tarjeta</span>
                <div className="pay-link-input-wrap card">
                  <LockKeyhole size={19} />
                  <input value={cardPin} onChange={(event) => setCardPin(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="PIN" type="password" inputMode="numeric" />
                </div>
              </label>
            )}

            {error && <div className="pay-link-error"><AlertTriangle size={18} /> {error}</div>}

            <button disabled={!canPay || paying} onClick={capture}>
              {paying ? <Loader2 size={19} /> : <ShieldCheck size={19} />}
              {paying ? "Confirmando..." : sourceKind === "card" ? "Pagar con tarjeta" : "Confirmar pago"}
            </button>
          </div>
        )}

        <small className="pay-link-footnote">{status}</small>
      </section>
    </main>
  );
}
