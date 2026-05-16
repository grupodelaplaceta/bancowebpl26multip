"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { formatDate, formatPz } from "../../lib/format";
import type { Account, BankState, TreasuryConfig } from "../../lib/types";

type Props = {
  mode: "admin" | "tributos";
};

const configFields: Array<[keyof TreasuryConfig, string]> = [
  ["operationalTransferTaxPercent", "Tasa operativa %"],
  ["webBridgeCommissionPercent", "Comisión Web/App %"],
  ["weeklyTaxPercent", "Impuesto semanal %"],
  ["minimumWeeklySalaryPz", "SMI semanal Pz"],
  ["payrollWorkerTaxPercent", "Nómina trabajador %"],
  ["payrollEmployerTaxPercent", "Nómina empresa %"],
  ["personalDeclarationThresholdPz", "Umbral personal"],
  ["institutionalDeclarationThresholdPz", "Umbral instituciones"],
  ["investmentProfitTaxPercent", "Impuesto inversión %"],
  ["investmentGainCommissionPercent", "Comisión inversión %"],
  ["minSupportedVersionCode", "Versión mínima"]
];

export default function AdminConsole({ mode }: Props) {
  const [state, setState] = useState<BankState | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("Cargando demo...");
  const [section, setSection] = useState(mode === "tributos" ? "fiscal" : "resumen");
  const [configDraft, setConfigDraft] = useState<Record<string, string>>({});
  const [destination, setDestination] = useState("");
  const [amount, setAmount] = useState("1000");
  const [concept, setConcept] = useState("Transferencia admin web");

  async function load() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin-state", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo cargar");
      setState(data);
      setConfigDraft(Object.fromEntries(configFields.map(([key]) => [key, String(data.treasuryConfig?.[key] ?? "")])));
      setStatus("Demo con acceso total cargada");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Error cargando demo");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const accounts = state?.accounts || [];
  const transactions = state?.transactions || [];
  const flags = state?.complianceFlags || [];
  const cards = state?.digitalCards || [];
  const totals = useMemo(() => {
    const citizen = accounts.filter((account) => account.kind !== "TGLP" && account.kind !== "AGLDP").reduce((sum, account) => sum + account.balancePz, 0);
    const treasury = accounts.find((account) => account.id === "TGLP")?.balancePz || 0;
    const admin = accounts.find((account) => account.id === "AGLDP")?.balancePz || 0;
    const blocked = accounts.filter((account) => account.complianceStatus && account.complianceStatus !== "Clear").length;
    return { citizen, treasury, admin, blocked };
  }, [accounts]);

  async function saveConfig(event: FormEvent) {
    event.preventDefault();
    if (!state) return;
    setLoading(true);
    try {
      const nextConfig = {
        ...(state.treasuryConfig || {}),
        ...Object.fromEntries(configFields.map(([key]) => [key, Number(configDraft[key] || 0)]))
      };
      const response = await fetch("/api/admin-config", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(nextConfig)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo guardar");
      setStatus("Normativa publicada");
      await load();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Error guardando normativa");
    } finally {
      setLoading(false);
    }
  }

  async function sendAdminTransfer(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/admin-transfer", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ destination, amountPz: Number(amount), concept })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Transferencia denegada");
      setStatus(`Transferencia admin enviada: ${formatPz(data.transaction.amountPz)} Pz`);
      await load();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Error en transferencia");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="consoleApp">
      {loading && (
        <div className="loadingOverlay">
          <img src="/loading.gif" alt="" />
          <strong>Actualizando panel demo</strong>
        </div>
      )}
      <section className="consoleHero">
        <div>
          <p className="eyebrow">Demo con acceso total</p>
          <h1>{mode === "admin" ? "Panel Admin Web" : "Panel Tributos Web"}</h1>
          <p>{mode === "admin" ? "Operación, normativa, cuentas y herramientas del Grupo." : "Control fiscal, alertas, recaudación y auditoría de cuentas."}</p>
        </div>
        <button onClick={load}>Actualizar</button>
      </section>
      <p className="statusLine">{status}</p>
      <nav className="consoleTabs">
        {["resumen", "fiscal", "cuentas", "movimientos", "tarjetas", "normativa", "operaciones"].map((item) => (
          <button className={section === item ? "active" : ""} key={item} onClick={() => setSection(item)}>{item}</button>
        ))}
      </nav>

      {section === "resumen" && (
        <section className="metricGrid">
          <Metric title="Ciudadanía" value={`${formatPz(totals.citizen)} Pz`} />
          <Metric title="Tributos" value={`${formatPz(totals.treasury)} Pz`} />
          <Metric title="AGLDP" value={`${formatPz(totals.admin)} Pz`} />
          <Metric title="Alertas" value={`${flags.length} casos`} tone={flags.length ? "warn" : "ok"} />
        </section>
      )}

      {section === "fiscal" && (
        <section className="consoleGrid">
          <div className="panel span2">
            <span className="kicker">Alertas fiscales</span>
            <h2>Requerimientos y bloqueos</h2>
            <div className="tableList">
              {flags.length === 0 && <p className="muted">Sin alertas fiscales pendientes.</p>}
              {flags.map((flag) => {
                const account = accounts.find((item) => item.id === flag.accountId);
                return (
                  <article className="listRow" key={flag.id}>
                    <div><strong>{account?.displayName || flag.accountId}</strong><span>{flag.reason} · {formatDate(flag.createdAt)}</span></div>
                    <b>{formatPz(flag.amountPz)} Pz</b>
                  </article>
                );
              })}
            </div>
          </div>
          <div className="panel">
            <span className="kicker">Baremos</span>
            <h2>Normativa vigente</h2>
            <p className="muted">Personal {formatPz(state?.treasuryConfig?.personalDeclarationThresholdPz || 0)} Pz</p>
            <p className="muted">Instituciones {formatPz(state?.treasuryConfig?.institutionalDeclarationThresholdPz || 0)} Pz</p>
          </div>
        </section>
      )}

      {section === "cuentas" && (
        <section className="panel">
          <span className="kicker">Cuentas</span>
          <h2>{accounts.length} cuentas registradas</h2>
          <div className="accountAdminGrid">
            {accounts.map((account) => (
              <article className="accountTile adminTile" key={account.id}>
                <strong>{account.displayName}</strong>
                <span>{account.iban}</span>
                <b>{formatPz(account.balancePz)} Pz</b>
                <small>{account.type} · {account.complianceStatus || "Clear"}</small>
              </article>
            ))}
          </div>
        </section>
      )}

      {section === "movimientos" && (
        <section className="panel">
          <span className="kicker">Ledger</span>
          <h2>Últimos movimientos</h2>
          {transactions.slice(0, 80).map((transaction) => (
            <article className="movement" key={transaction.id}>
              <div><strong>{transaction.note}</strong><span>{formatDate(transaction.createdAt)} · {transaction.kind}</span></div>
              <b>{formatPz(transaction.netAmount || transaction.amountPz)} Pz</b>
            </article>
          ))}
        </section>
      )}

      {section === "tarjetas" && (
        <section className="panel">
          <span className="kicker">Tarjetas</span>
          <h2>Virtuales y Promo Cards</h2>
          <div className="cardList adminCards">
            {cards.map((card) => (
              <article className="bankCard" key={card.id}>
                <span>{card.promoPhysical ? "Promo Card" : "Virtual"}</span>
                <strong>{card.cardNumber || "******"}</strong>
                <small>{card.released ? "Liberada" : "Vinculada"} · {card.accountId || "sin cuenta"}</small>
                <em>{card.promoPhysical ? "Registro solo Android" : "Consulta web"}</em>
              </article>
            ))}
          </div>
        </section>
      )}

      {section === "normativa" && (
        <form className="panel configPanel" onSubmit={saveConfig}>
          <span className="kicker">Normativa</span>
          <h2>Configuración publicada</h2>
          <div className="configGrid">
            {configFields.map(([key, label]) => (
              <label key={key}>
                {label}
                <input value={configDraft[key] || ""} onChange={(event) => setConfigDraft((current) => ({ ...current, [key]: event.target.value.replace(/\D/g, "") }))} />
              </label>
            ))}
          </div>
          <button>Publicar normativa</button>
        </form>
      )}

      {section === "operaciones" && (
        <form className="panel transferPanel" onSubmit={sendAdminTransfer}>
          <span className="kicker">Operaciones Admin</span>
          <h2>Transferir desde AGLDP</h2>
          <label>Destino<input value={destination} onChange={(event) => setDestination(event.target.value)} placeholder="IBAN, nombre o id" /></label>
          <div className="split">
            <label>Importe<input value={amount} onChange={(event) => setAmount(event.target.value.replace(/\D/g, ""))} /></label>
            <label>Concepto<input value={concept} onChange={(event) => setConcept(event.target.value)} /></label>
          </div>
          <button>Enviar fondos</button>
        </form>
      )}
    </main>
  );
}

function Metric({ title, value, tone }: { title: string; value: string; tone?: "ok" | "warn" }) {
  return (
    <article className={`metricCard ${tone || ""}`}>
      <span>{title}</span>
      <strong>{value}</strong>
    </article>
  );
}
