"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle, CheckCircle2, CreditCard, Landmark, Loader2,
  LockKeyhole, ShieldCheck, Banknote, Star, ArrowRight, Copy,
  ExternalLink, Wallet, BadgeCheck
} from "lucide-react";
import { formatPz, isOfficialIban, PaymentLink } from "../../lib/bank";

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

function SixPointStar({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12,2 14,9 21,9 15.5,14 17.5,22 12,17 6.5,22 8.5,14 3,9 10,9" />
    </svg>
  );
}

export default function PaymentPageContent({ linkId }: { linkId: string }) {
  const [link, setLink] = useState<PaymentLink | null>(null);
  const [paymentCredential, setPaymentCredential] = useState("");
  const [cardPin, setCardPin] = useState("");
  const [status, setStatus] = useState("Cargando enlace...");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  const [copied, setCopied] = useState(false);
  const sourceKind = useMemo(() => detectSource(paymentCredential), [paymentCredential]);
  const canPay = Boolean(link?.status === "Pending" && paymentCredential.trim() && (sourceKind !== "card" || cardPin.length >= 4));

  useEffect(() => {
    fetch(`/api/payment-links/${linkId}`, { cache: "no-store" })
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
  }, [linkId]);

  async function capture() {
    if (!link || !canPay) return;
    setPaying(true);
    setError("");
    setStatus("Confirmando pago seguro...");
    const response = await fetch(`/api/payment-links/${linkId}/capture`, {
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
    setPaid(true);
  }

  function copyLink() {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (loading) {
    return (
      <main className="pay-link-page">
        <div className="pay-link-loader">
          <Loader2 size={42} className="pay-spin" />
          <p>Cargando enlace seguro...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="pay-link-page">
      <div className={`pay-link-wrapper ${paid ? "pay-link-wrapper-paid" : ""}`}>
        {/* Barra superior con brillo */}
        <div className="pay-link-glow" />

        {/* Cabecera */}
        <div className="pay-link-header">
          <div className="pay-link-brand">
            <span className="pay-link-logo">
              <Image src="/logo.png" alt="Banco de La Placeta" fill sizes="56px" priority />
            </span>
            <div className="pay-link-brand-text">
              <span className="pay-link-brand-tag">
                <SixPointStar size={14} />
                {link?.kind === "Send" ? "Envío de Placetas" : "Pago seguro"}
              </span>
              <strong>Banco de La Placeta</strong>
            </div>
          </div>
          <button className="pay-link-copy" onClick={copyLink} title="Copiar enlace">
            {copied ? <BadgeCheck size={18} /> : <Copy size={18} />}
          </button>
        </div>

        {/* Estado - Esfera */}
        <div className={`pay-link-orb ${paid ? "paid" : ""}`}>
          {paid ? <BadgeCheck size={40} /> : link?.status === "Pending" ? <ShieldCheck size={40} /> : <AlertTriangle size={40} />}
        </div>

        {/* Importe y concepto */}
        <div className="pay-link-amount-section">
          <h1 className="pay-link-amount">
            {link ? `${formatPz(link.totalPz)}` : "—"}
            <span className="pay-link-currency"> Pz</span>
          </h1>
          <p className="pay-link-concept">{link?.concept || status}</p>
        </div>

        {/* Desglose */}
        {link && (
          <div className="pay-link-breakdown-modern">
            <div className="pay-link-breakdown-item">
              <span className="pay-link-bd-label">
                <Banknote size={15} /> Neto
              </span>
              <strong>{formatPz(link.amountPz)} Pz</strong>
            </div>
            <div className="pay-link-breakdown-divider" />
            <div className="pay-link-breakdown-item">
              <span className="pay-link-bd-label">
                <SixPointStar size={13} /> IVA
              </span>
              <strong>{formatPz(link.ivaPz)} Pz</strong>
            </div>
            <div className="pay-link-breakdown-divider" />
            <div className="pay-link-breakdown-item">
              <span className="pay-link-bd-label">
                <Wallet size={15} /> Total
              </span>
              <strong className="pay-link-total">{formatPz(link.totalPz)} Pz</strong>
            </div>
          </div>
        )}

        {/* Formulario de pago */}
        {link?.status === "Pending" && !paid && (
          <div className="pay-link-form-modern">
            <div className="pay-link-field">
              <label className="pay-link-field-label">
                <SixPointStar size={13} /> IBAN, PlacetaID o tarjeta
              </label>
              <div className={`pay-link-input-group ${sourceKind}`}>
                {sourceKind === "card" ? <CreditCard size={19} /> : sourceKind === "iban" ? <Landmark size={19} /> : <LockKeyhole size={19} />}
                <input
                  value={paymentCredential}
                  onChange={(event) => {
                    setPaymentCredential(event.target.value);
                    setCardPin("");
                    setError("");
                  }}
                  placeholder="GDLP app/web o tarjeta"
                  autoFocus
                />
              </div>
              <small className="pay-link-hint">{sourceCopy(sourceKind, paymentCredential)}</small>
            </div>

            {sourceKind === "card" && (
              <div className="pay-link-field pay-link-field-slide">
                <label className="pay-link-field-label">
                  <LockKeyhole size={14} /> PIN de tarjeta
                </label>
                <div className="pay-link-input-group card">
                  <LockKeyhole size={19} />
                  <input
                    value={cardPin}
                    onChange={(event) => setCardPin(event.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="PIN"
                    type="password"
                    inputMode="numeric"
                    autoFocus
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="pay-link-error-modern">
                <AlertTriangle size={18} />
                <span>{error}</span>
              </div>
            )}

            <button className="pay-link-submit" disabled={!canPay || paying} onClick={capture}>
              {paying ? (
                <Loader2 size={19} className="pay-spin" />
              ) : (
                sourceKind === "card" ? <CreditCard size={19} /> : <ShieldCheck size={19} />
              )}
              {paying ? "Confirmando..." : sourceKind === "card" ? "Pagar con tarjeta" : "Confirmar pago"}
              {!paying && <ArrowRight size={18} />}
            </button>
          </div>
        )}

        {/* Estado final de pago */}
        {paid && (
          <div className="pay-link-success">
            <div className="pay-link-success-icon">
              <CheckCircle2 size={48} />
            </div>
            <h2>¡Pago realizado!</h2>
            <p>El pago de <strong>{formatPz(link?.totalPz || 0)} Pz</strong> se ha completado correctamente.</p>
            <div className="pay-link-success-badge">
              <BadgeCheck size={16} />
              Transacción segura verificada
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pay-link-footer">
          <SixPointStar size={13} />
          <span>{status}</span>
          <SixPointStar size={13} />
        </div>
      </div>
    </main>
  );
}
