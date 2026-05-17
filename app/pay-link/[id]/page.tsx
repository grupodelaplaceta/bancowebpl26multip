"use client";

import { useEffect, useState } from "react";
import { formatPz, PaymentLink } from "../../../lib/bank";

export default function PaymentLinkPage({ params }: { params: { id: string } }) {
  const [link, setLink] = useState<PaymentLink | null>(null);
  const [payerAccountId, setPayerAccountId] = useState("");
  const [status, setStatus] = useState("Cargando enlace...");
  const [fallback, setFallback] = useState<PaymentLink | null>(null);

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    const fallbackLink: PaymentLink | null = search.get("amount") ? {
      id: params.id,
      kind: search.get("kind") === "send" ? "Send" : "Payment",
      creatorAccountId: search.get("account") || "",
      targetIban: null,
      amountPz: Number(search.get("amount") || 0),
      ivaPz: Number(search.get("iva") || 0),
      totalPz: Number(search.get("total") || search.get("amount") || 0),
      concept: "Enlace generado desde app",
      status: "Pending",
      createdAt: new Date().toISOString()
    } : null;
    if (fallbackLink) setFallback(fallbackLink);
    fetch(`/api/payment-links/${params.id}`, { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Enlace no disponible");
        setLink(payload.link);
        setStatus(payload.link.status === "Pending" ? "Listo para pagar" : "Este enlace ya fue usado");
      })
      .catch((error) => {
        if (fallbackLink) {
          setLink(fallbackLink);
          setStatus("Listo para pagar");
        } else {
          setStatus(error instanceof Error ? error.message : "Enlace no disponible");
        }
      });
  }, [params.id]);

  async function capture() {
    setStatus("Confirmando pago...");
    const response = await fetch(`/api/payment-links/${params.id}/capture`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ payerAccountId, fallback })
    });
    const payload = await response.json();
    if (!response.ok) {
      setStatus(payload.error || "No se pudo pagar");
      return;
    }
    setLink(payload.link);
    setStatus("Pago confirmado");
  }

  return (
    <main className="pay-link-page">
      <section className="pay-link-card">
        <img src="/logo.png" alt="Banco de La Placeta" />
        <span>{link?.kind === "Send" ? "Envío de Placetas" : "Pago Banco de La Placeta"}</span>
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
          <>
            <label>
              <span>Cuenta o tarjeta GDLP</span>
              <input value={payerAccountId} onChange={(event) => setPayerAccountId(event.target.value)} placeholder="u-alba / cuenta pagadora" />
            </label>
            <button disabled={!payerAccountId} onClick={capture}>Pagar enlace</button>
          </>
        )}
        <small>{status}</small>
      </section>
    </main>
  );
}
