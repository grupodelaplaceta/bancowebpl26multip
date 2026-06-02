import { Account, formatPz, LedgerTransaction } from "./bank";

export type WebDocumentKind =
  | "MonthlyStatement"
  | "MonthlyTaxReport"
  | "WeeklyTaxReport"
  | "VatReceipt"
  | "PaymentReceipt"
  | "FineReceipt"
  | "BusinessStatement"
  | "FiscalRequirement"
  | "InvestmentLiquidation"
  | "LaborContract"
  | "SolvencyCertificate";

type PdfDocumentInput = {
  id: string;
  title: string;
  kind: WebDocumentKind;
  labor?: {
    companyName: string;
    employeeName: string;
    employeeDip: string;
    roleTitle: string;
    startDate: string;
    frequency: string;
    grossSalaryPz: number;
    workerTaxPz?: number;
    employerTaxPz?: number;
    netSalaryPz?: number;
    companyIban?: string;
    workerIban?: string;
    status?: string;
    periodLabel?: string;
  };
};

const PAGE_W = 595;
const PAGE_H = 842;
const purple = "3F00D8";
const ink = "1B1024";
const muted = "5C4E6A";
const soft = "F6F0FF";
const gold = "FFD36E";
const border = "CFB8FF";

export async function generateBankPdf(account: Account, document: PdfDocumentInput, transactions: LedgerTransaction[]) {
  const ops = pdfOps();
  const filtered = filterTransactions(document.kind, transactions);

  if (["PaymentReceipt", "FiscalRequirement", "InvestmentLiquidation", "LaborContract"].includes(document.kind)) {
    drawSpecialDocument(ops, account, document, filtered, transactions);
  } else {
    drawOfficialDocument(ops, account, document, filtered);
  }

  const pdf = await buildPdf(ops.join("\n"));
  const blob = new Blob([pdf], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = documentNode("a") as HTMLAnchorElement;
  link.href = url;
  link.download = `${document.id}-${Date.now()}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}

function drawOfficialDocument(ops: string[], account: Account, document: PdfDocumentInput, transactions: LedgerTransaction[]) {
  header(ops, "TRIBUTOS DEL GRUPO DE LA PLACETA", document.title.toUpperCase(), document);
  roundRect(ops, 42, 138, 511, 82, 16, soft, border);
  label(ops, "Titular", account.displayName, 60, 166);
  label(ops, "IBAN GDLP", account.iban, 300, 166);
  text(ops, `Estado normativo: ${account.complianceStatus || "Clear"}`, 60, 204, 11, muted);
  text(ops, `Firma digital: GDLP-${document.id.toUpperCase()}`, 300, 204, 11, muted);
  text(ops, `Expediente: ${caseCode(document, account)}`, 60, 232, 9.5, muted);
  text(ops, `CSV: ${verificationCode(document, account)}`, 300, 232, 9.5, muted);

  const gross = transactions.reduce((sum, item) => sum + item.amountPz, 0);
  const taxes = transactions.reduce((sum, item) => sum + item.taxAmount, 0);
  const net = transactions.reduce((sum, item) => sum + item.netAmount, 0);
  text(ops, sectionTitle(document.kind), 42, 254, 14, ink, true);
  summaryBox(ops, "Bruto", `${formatPz(gross)} Pz`, 42, 268);
  summaryBox(ops, "Neto", `${formatPz(net)} Pz`, 214, 268);
  summaryBox(ops, "Impuestos", `${formatPz(taxes)} Pz`, 386, 268);

  text(ops, "DETALLE OFICIAL", 42, 378, 14, ink, true);
  roundRect(ops, 42, 394, 511, 26, 8, purple);
  text(ops, "Fecha", 54, 412, 11, "FFFFFF", true);
  text(ops, "Concepto", 150, 412, 11, "FFFFFF", true);
  text(ops, "Bruto", 362, 412, 11, "FFFFFF", true);
  text(ops, "Imp.", 432, 412, 11, "FFFFFF", true);
  text(ops, "Estado", 492, 412, 11, "FFFFFF", true);

  let y = 444;
  if (!transactions.length) text(ops, "Sin movimientos aplicables a este documento.", 54, y, 11, muted);
  const visibleTransactions = transactions.slice(0, 4);
  visibleTransactions.forEach((txn, index) => {
    if (index % 2 === 0) roundRect(ops, 42, y - 18, 511, 38, 6, soft);
    text(ops, formatDate(txn.createdAt).slice(0, 16), 54, y, 9.5, muted);
    fitText(ops, txn.note, 150, y, 195, 11, muted);
    fitText(ops, formatPz(txn.amountPz), 362, y, 58, 11, muted);
    fitText(ops, formatPz(txn.taxAmount), 432, y, 48, 11, muted);
    fitText(ops, txn.status, 492, y, 48, 9.5, muted);
    fitText(ops, `Origen ${txn.IBAN_Origin} · ${txn.concept}`, 150, y + 15, 340, 9.5, muted);
    y += 48;
  });
  if (transactions.length > visibleTransactions.length) {
    text(ops, `+ ${transactions.length - visibleTransactions.length} movimientos adicionales en el registro digital.`, 54, y, 9.5, muted);
  }

  text(ops, "CLÁUSULAS Y DATOS DEL DOCUMENTO", 42, 676, 14, ink, true);
  legalLines(document.kind, account, transactions).slice(0, 4).forEach((line, index) => fitText(ops, line, 42, 696 + index * 14, 500, 9.5, muted));
  footer(ops, document, account);
}

function drawSpecialDocument(ops: string[], account: Account, document: PdfDocumentInput, filtered: LedgerTransaction[], all: LedgerTransaction[]) {
  if (document.kind === "PaymentReceipt") return drawPaymentReceipt(ops, account, document, filtered[0]);
  if (document.kind === "FiscalRequirement") return drawFiscalRequirement(ops, account, document, all);
  if (document.kind === "InvestmentLiquidation") return drawInvestmentLiquidation(ops, account, document, filtered[0]);
  return drawLaborContract(ops, account, document, filtered[0]);
}

function drawPaymentReceipt(ops: string[], account: Account, document: PdfDocumentInput, txn?: LedgerTransaction) {
  header(ops, "BANCO DE LA PLACETA", "COMPROBANTE DE TRANSACCIÓN BANCARIA E IVA", document);
  if (!txn) {
    text(ops, "No hay transacciones asentadas para generar un justificante individual.", 42, 170, 11, muted);
    return footer(ops, document, account);
  }
  const iva = txn.kind === "Consumption" || txn.ivaPz > 0 ? Math.max(txn.ivaPz, txn.taxAmount) : 0;
  const adminFee = iva > 0 ? 0 : Math.max(txn.taxAmount, txn.ivaPz);
  const signedNet = txn.toAccountId === account.id ? txn.netAmount : -Math.max(txn.amountPz + adminFee + iva, txn.netAmount);
  roundRect(ops, 42, 144, 511, 116, 14, soft, border);
  label(ops, "ID Transacción", txn.id, 60, 170);
  label(ops, "Tipo / estado", `${txn.kind} · ${txn.status}`, 324, 170);
  label(ops, "Fecha/Hora", formatDateTime(txn.createdAt), 60, 214);
  label(ops, "CSV operación", verificationCode(document, account), 324, 214);
  text(ops, "Detalle de transferencia", 42, 294, 14, ink, true);
  row(ops, "Ordenante", txn.fromAccountId, 54, 324);
  row(ops, "Beneficiario", txn.toAccountId, 54, 352);
  row(ops, "IBAN origen", txn.IBAN_Origin || "No informado", 54, 380);
  row(ops, "Concepto", txn.concept || txn.note, 54, 408);
  row(ops, "Referencia original", txn.originalTransactionId || "Movimiento principal", 54, 436);
  line(ops, 42, 468, 553, 468);
  text(ops, "Desglose financiero", 42, 500, 14, ink, true);
  money(ops, "Importe bruto ordenado", txn.amountPz, 54, 532);
  money(ops, "Comisión / tasa operativa", adminFee, 54, 562, adminFee > 0);
  money(ops, "IVA retenido", iva, 54, 592, iva > 0);
  money(ops, "Importe neto acreditado", txn.netAmount, 54, 622, false, true);
  money(ops, "Impacto en esta cuenta", Math.abs(signedNet), 54, 652, signedNet < 0);
  roundRect(ops, 42, 694, 511, 52, 12, soft, border);
  text(ops, "Base normativa", 58, 718, 14, ink, true);
  wrapped(ops, "Justificante inmutable de transferencia, Placezum, enlace de pago o pago con desglose fiscal, comisiones y marcadores de seguridad internos.", 58, 738, 92, 9.5);
  footer(ops, document, account);
}

function drawFiscalRequirement(ops: string[], account: Account, document: PdfDocumentInput, transactions: LedgerTransaction[]) {
  header(ops, "AGENCIA TRIBUTARIA DE LA PLACETA", "NOTIFICACIÓN DE BLOQUEO Y REQUERIMIENTO", document);
  const threshold = account.type === "Business" ? 50000 : 15000;
  const excess = Math.max(0, account.balancePz - threshold);
  text(ops, "Motivo del requerimiento", 42, 158, 14, ink, true);
  wrapped(ops, "Superar el límite establecido en el Panel Admin sin justificación previa suficiente. Base: Capítulo IV, Art. 4.1 y 4.2 (Límites de Capital y Control Fiscal).", 42, 182, 96, 11);
  roundRect(ops, 42, 244, 511, 148, 14, soft, border);
  row(ops, "Destinatario DIP", account.placetaId || account.id, 58, 274);
  row(ops, "Tipo de cuenta", account.type, 58, 304);
  money(ops, "Saldo detectado", account.balancePz, 58, 334);
  money(ops, "Umbral máximo permitido", threshold, 58, 364);
  text(ops, "Medidas cautelares", 42, 430, 14, ink, true);
  row(ops, "Estado de la cuenta", excess > 0 ? "Bloqueada_Tributaria" : account.complianceStatus || "Clear", 54, 462);
  row(ops, "Restricción 1", "Inhabilitación de transferencias salientes", 54, 490);
  row(ops, "Restricción 2", "Exclusión temporal de reclamación de RBU", 54, 518);
  money(ops, "Exceso no justificado", excess, 54, 546);
  line(ops, 42, 586, 553, 586);
  row(ops, "Plazo de subsanación", "7 días naturales desde el timestamp de emisión", 54, 620);
  wrapped(ops, "Consecuencias legales internas: aplicación de recargos automáticos o multas si no se atiende el requerimiento. Recargo por demora calculado por segundo tras vencer el plazo establecido.", 54, 654, 92, 9.5);
  row(ops, "Movimientos revisados", String(transactions.length), 54, 724);
  footer(ops, document, account);
}

function drawInvestmentLiquidation(ops: string[], account: Account, document: PdfDocumentInput, txn?: LedgerTransaction) {
  header(ops, "MÓDULO INVERSIONES", "TICKET DE LIQUIDACIÓN DE INVERSIÓN ALEATORIA", document);
  if (!txn) {
    text(ops, "No hay liquidaciones de inversión disponibles para esta cuenta.", 42, 170, 11, muted);
    return footer(ops, document, account);
  }
  const movement = /([+-]\d+)%/.exec(txn.note)?.[1] || "0";
  const initial = txn.amountPz;
  const profit = Math.max(0, txn.amountPz - initial);
  roundRect(ops, 42, 146, 511, 140, 14, soft, border);
  row(ops, "ID inversión", txn.id, 58, 176);
  row(ops, "Usuario DIP", account.placetaId || account.id, 58, 206);
  money(ops, "Capital inicialmente arriesgado", initial, 58, 236);
  row(ops, "IP ejecución", "No registrada en cliente", 58, 266);
  text(ops, "Métrica de tiempo", 42, 326, 14, ink, true);
  row(ops, "Apertura", formatDateTime(new Date(Date.parse(txn.createdAt) - 60000).toISOString()), 54, 356);
  row(ops, "Resolución", formatDateTime(txn.createdAt), 54, 384);
  row(ops, "Diferencia", "60 segundos", 54, 412);
  line(ops, 42, 446, 553, 446);
  row(ops, "Resultado aleatorio", txn.note.includes("gana usuario") ? `Ganancia (${movement}%)` : `Pérdida (${movement}%)`, 54, 480);
  money(ops, "Beneficio bruto", profit, 54, 510);
  money(ops, "Impuesto inversiones retenido", txn.taxAmount, 54, 540, txn.taxAmount > 0);
  money(ops, "Saldo neto devuelto", txn.amountPz, 54, 578, false, true);
  row(ops, "Notificación push", "Enviada_Exitosamente", 54, 626);
  wrapped(ops, "Base normativa: Capítulo VI (Loterías, Juegos e Inversiones). Resolución de operación de mercado de azar a 1 minuto con retenciones fiscales de la casa.", 54, 668, 92, 9.5);
  footer(ops, document, account);
}

function drawLaborContract(ops: string[], account: Account, document: PdfDocumentInput, txn?: LedgerTransaction) {
  header(ops, "BANCO DE LA PLACETA", txn ? "NÓMINA Y RELACIÓN LABORAL REGISTRADA" : "CERTIFICADO DE ALTA LABORAL", document);
  const labor = document.labor;
  const gross = txn?.amountPz || labor?.grossSalaryPz || 0;
  const totalTax = txn ? Math.max(txn.taxAmount, txn.ivaPz) : 0;
  const workerRetention = labor?.workerTaxPz ?? (txn ? Math.ceil(totalTax / 2) : Math.ceil(gross * 0.1));
  const employerContribution = labor?.employerTaxPz ?? (txn ? Math.max(0, totalTax - workerRetention) : Math.ceil(gross * 0.1));
  const net = labor?.netSalaryPz ?? Math.max(0, gross - workerRetention);
  text(ops, txn ? "Partes contratantes" : "Alta registrada", 42, 158, 14, ink, true);
  row(ops, "Empresa/Asociación", labor?.companyName || txn?.fromAccountId || "ASOC-GDLP", 54, 190);
  row(ops, "Empleado", labor?.employeeName || account.displayName, 54, 218);
  row(ops, "Empleado DIP", labor?.employeeDip || account.placetaId || txn?.toAccountId || account.id, 54, 246);
  row(ops, "Puesto verificado", labor?.roleTitle || account.citizenshipTier || "CiudadaniaPlena", 54, 274);
  roundRect(ops, 42, 292, 511, 176, 14, soft, border);
  money(ops, txn ? "Sueldo bruto liquidado" : "Sueldo bruto semanal pactado", gross, 58, 324);
  row(ops, "Cumple SMI vigente", String(gross >= 150), 58, 354);
  row(ops, "Estado de alta", txn ? `Periodo liquidado${labor?.periodLabel ? ` · ${labor.periodLabel}` : ""}` : labor?.status || "Alta laboral registrada sin liquidación", 58, 384);
  row(ops, "Frecuencia", labor?.frequency || "Semanal", 58, 414);
  money(ops, "Retención trabajador", workerRetention, 58, 444, true);
  money(ops, "Aportación patronal", employerContribution, 300, 444);
  money(ops, txn ? "Sueldo neto abonado" : "Sueldo neto previsto", net, 58, 466, false, true);
  line(ops, 42, 504, 553, 504);
  text(ops, "Trazabilidad del alta", 42, 538, 14, ink, true);
  row(ops, "Registro laboral", document.id, 54, 570);
  row(ops, "IBAN empresa", labor?.companyIban || txn?.IBAN_Origin || "No informado", 54, 598);
  row(ops, "IBAN trabajador", labor?.workerIban || account.iban, 54, 626);
  row(ops, "Responsable datos", `Delegado_Datos_${account.id.slice(0, 8)}`, 54, 654);
  row(ops, "Inicio contrato", labor?.startDate || "No informado", 54, 682);
  row(ops, "Registro actividades", "Inscrito_En_Log_Central", 54, 710);
  fitText(ops, "Clausula RGPD: trazabilidad del alta, periodos y pagos en el registro central.", 54, 742, 470, 9.5, muted);
  footer(ops, document, account);
}

function header(ops: string[], issuer: string, subtitle: string, document: PdfDocumentInput) {
  roundRect(ops, 32, 30, 531, 88, 12, purple);
  text(ops, issuer, 52, 64, 20, "FFFFFF", true);
  text(ops, subtitle, 52, 90, 11, "FFFFFF", true);
  text(ops, `Emitido: ${formatDateTime(new Date().toISOString())}`, 52, 108, 9.5, "E8DEFF");
}

function footer(ops: string[], document: PdfDocumentInput, account: Account) {
  line(ops, 42, 772, 553, 772);
  text(ops, `CSV ${verificationCode(document, account)} · Firma GDLP-${document.id.toUpperCase()}`, 42, 796, 9.5, muted);
  text(ops, "Documento verificable por firma digital interna. Registro inmutable sujeto a normativa GDLP.", 42, 814, 9.5, muted);
}

function filterTransactions(kind: WebDocumentKind, transactions: LedgerTransaction[]) {
  const sorted = [...transactions].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  if (kind === "WeeklyTaxReport" || kind === "MonthlyTaxReport" || kind === "VatReceipt") return sorted.filter((item) => item.taxAmount > 0 || item.kind.includes("Tax"));
  if (kind === "PaymentReceipt") return sorted.slice(0, 1);
  if (kind === "FineReceipt") return sorted.filter((item) => item.kind.includes("Fine"));
  if (kind === "BusinessStatement") return sorted.filter((item) => item.note.toLowerCase().includes("empresa") || item.kind.includes("Business") || item.kind.includes("Payroll"));
  if (kind === "FiscalRequirement") return sorted.slice(0, 12);
  if (kind === "InvestmentLiquidation") return sorted.filter((item) => item.kind === "InvestmentSell").slice(0, 1);
  if (kind === "LaborContract") return sorted.filter((item) => item.kind === "PayrollLoan").slice(0, 1);
  return sorted;
}

function legalLines(kind: WebDocumentKind, account: Account, transactions: LedgerTransaction[]) {
  if (kind === "SolvencyCertificate") return [
    `Se certifica que la cuenta ${account.iban} mantiene estado ${account.complianceStatus || "Clear"}.`,
    `Saldo declarado: ${account.balancePz} Pz. Movimientos revisados: ${transactions.length}.`,
    "Este certificado no sustituye una auditoría externa, pero acredita solvencia operativa GDLP."
  ];
  if (kind === "BusinessStatement") return [
    "Informe de actividad de empresa y pagos asociados a nóminas, préstamos o alta mercantil.",
    "El titular declara que la actividad económica se realiza dentro del marco GDLP.",
    "Los umbrales institucionales y obligaciones declarativas son los publicados por Admin."
  ];
  if (kind === "WeeklyTaxReport") return [
    "Liquidación semanal emitida por Tributos del Grupo de La Placeta.",
    `Base liquidada: ${transactions.reduce((s, t) => s + t.amountPz, 0)} Pz. Cuota: ${transactions.reduce((s, t) => s + t.taxAmount, 0)} Pz.`,
    "Los importes quedan vinculados a los movimientos detallados y a su CSV de verificación."
  ];
  if (kind === "MonthlyTaxReport") return [
    "Liquidación mensual emitida por Tributos del Grupo de La Placeta.",
    `Periodo cerrado con ${transactions.length} cargos. Cuota: ${transactions.reduce((s, t) => s + t.taxAmount, 0)} Pz.`,
    "Cada cargo queda vinculado a la cuenta, periodo y CSV de verificación."
  ];
  return [
    "Documento generado con datos reales de cuenta, movimientos e impuestos asociados.",
    "El CSV permite verificar integridad, titular, fecha de emisión y tipo documental.",
    "Emitido por Tributos del Grupo de La Placeta para uso interno GDLP."
  ];
}

function sectionTitle(kind: WebDocumentKind) {
  return {
    WeeklyTaxReport: "LIQUIDACIÓN SEMANAL",
    MonthlyTaxReport: "LIQUIDACIÓN MENSUAL",
    PaymentReceipt: "JUSTIFICANTE DE PAGO",
    FineReceipt: "EXPEDIENTE DE MULTAS",
    BusinessStatement: "INFORME DE EMPRESA",
    MonthlyStatement: "EXTRACTO DE CUENTA",
    FiscalRequirement: "REQUERIMIENTO FISCAL ATP",
    InvestmentLiquidation: "LIQUIDACIÓN INVERSIÓN AZAR",
    LaborContract: "CONTRATO LABORAL REGISTRADO",
    VatReceipt: "RECIBOS DE IVA TGLP",
    SolvencyCertificate: "CERTIFICADO DE SOLVENCIA"
  }[kind];
}

function caseCode(document: PdfDocumentInput, account: Account) {
  return `TGLP-${document.kind.slice(0, 4)}-${account.iban.slice(-3)}-${Date.now().toString().slice(-6)}`;
}

function verificationCode(document: PdfDocumentInput, account: Account) {
  const raw = `${document.id}|${account.iban}|${document.kind}|${Date.now()}`;
  let acc = 17;
  for (const char of raw) acc = Math.imul(acc, 31) + char.charCodeAt(0);
  return `CSV-${Math.abs(acc).toString().padStart(10, "0").slice(0, 10)}`;
}

function label(ops: string[], labelText: string, value: string, x: number, y: number) {
  text(ops, labelText, x, y, 9.5, muted);
  fitText(ops, value, x, y + 18, 210, 14, ink, true);
}

function row(ops: string[], labelText: string, value: string, x: number, y: number) {
  fitText(ops, `${labelText}:`, x, y, 170, 14, ink, true);
  fitText(ops, value, x + 180, y, 315, 11, muted);
}

function money(ops: string[], labelText: string, amount: number, x: number, y: number, negative = false, accent = false) {
  row(ops, labelText, `${negative && amount > 0 ? "-" : ""}${formatPz(amount)},00 Pz`, x, y);
  if (accent) text(ops, `${negative && amount > 0 ? "-" : ""}${formatPz(amount)},00 Pz`, x + 180, y, 14, "A855F7", true);
}

function summaryBox(ops: string[], labelText: string, value: string, x: number, y: number) {
  roundRect(ops, x, y, 150, 72, 14, soft, border);
  text(ops, labelText, x + 16, y + 27, 11, muted);
  fitText(ops, value, x + 16, y + 52, 118, 14, ink, true);
}

function wrapped(ops: string[], source: string, x: number, y: number, maxChars: number, size: number) {
  source.match(new RegExp(`.{1,${maxChars}}(\\s|$)`, "g"))?.slice(0, 5).forEach((lineText, index) => {
    text(ops, lineText.trim(), x, y + index * 15, size, muted);
  });
}

function text(ops: string[], value: string, x: number, y: number, size: number, color = muted, bold = false) {
  const font = bold ? "F2" : "F1";
  ops.push(`BT /${font} ${size} Tf ${rgb(color)} rg ${x.toFixed(2)} ${(PAGE_H - y).toFixed(2)} Td (${escapePdf(value)}) Tj ET`);
}

function fitText(ops: string[], value: string, x: number, y: number, maxWidth: number, size: number, color = muted, bold = false) {
  const safe = ellipsize(value, Math.max(4, Math.floor(maxWidth / (size * 0.52))));
  text(ops, safe, x, y, size, color, bold);
}

function ellipsize(value: string, maxChars: number) {
  const clean = value.replace(/\s+/g, " ").trim();
  if (clean.length <= maxChars) return clean;
  return `${clean.slice(0, Math.max(0, maxChars - 1)).trimEnd()}…`;
}

function line(ops: string[], x1: number, y1: number, x2: number, y2: number) {
  ops.push(`${rgb("E1D5F2")} RG 1.2 w ${x1} ${PAGE_H - y1} m ${x2} ${PAGE_H - y2} l S`);
}

function roundRect(ops: string[], x: number, y: number, w: number, h: number, _r: number, fill: string, stroke?: string) {
  const yy = PAGE_H - y - h;
  ops.push(`${rgb(fill)} rg ${x} ${yy} ${w} ${h} re f`);
  if (stroke) ops.push(`${rgb(stroke)} RG 1.1 w ${x} ${yy} ${w} ${h} re S`);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", timeZoneName: "short" }).format(new Date(value));
}

function rgb(hex: string) {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16) / 255;
  const g = parseInt(value.slice(2, 4), 16) / 255;
  const b = parseInt(value.slice(4, 6), 16) / 255;
  return `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)}`;
}

function escapePdf(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/→/g, "->")
    .replace(/…/g, "...")
    .replace(/[\\()]/g, "\\$&")
    .replace(/[^\x20-\x7E]/g, " ");
}

function pdfOps() {
  return ["q"];
}

let outfitFontCache: Promise<{ regular: Uint8Array; bold: Uint8Array }> | null = null;

function loadOutfitFonts() {
  if (!outfitFontCache) {
    outfitFontCache = Promise.all([
      fetch("/fonts/outfit_regular.ttf").then((response) => response.arrayBuffer()),
      fetch("/fonts/outfit_bold.ttf").then((response) => response.arrayBuffer())
    ]).then(([regular, bold]) => ({ regular: new Uint8Array(regular), bold: new Uint8Array(bold) }));
  }
  return outfitFontCache;
}

async function buildPdf(content: string) {
  const fonts = await loadOutfitFonts();
  const stream = `${content}\nQ`;
  const widthsRegular = outfitWidths(500);
  const widthsBold = outfitWidths(560);
  const objects: PdfObjectChunk[] = [
    pdfObject("1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n"),
    pdfObject("2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n"),
    pdfObject(`3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Resources << /Font << /F1 4 0 R /F2 7 0 R >> >> /Contents 10 0 R >> endobj\n`),
    pdfObject(`4 0 obj << /Type /Font /Subtype /TrueType /BaseFont /Outfit-Regular /Encoding /WinAnsiEncoding /FirstChar 32 /LastChar 126 /Widths [${widthsRegular}] /FontDescriptor 5 0 R >> endobj\n`),
    pdfObject("5 0 obj << /Type /FontDescriptor /FontName /Outfit-Regular /Flags 32 /FontBBox [-500 -300 1200 1000] /ItalicAngle 0 /Ascent 1000 /Descent -300 /CapHeight 720 /StemV 80 /FontFile2 6 0 R >> endobj\n"),
    pdfStreamObject(6, fonts.regular),
    pdfObject(`7 0 obj << /Type /Font /Subtype /TrueType /BaseFont /Outfit-Bold /Encoding /WinAnsiEncoding /FirstChar 32 /LastChar 126 /Widths [${widthsBold}] /FontDescriptor 8 0 R >> endobj\n`),
    pdfObject("8 0 obj << /Type /FontDescriptor /FontName /Outfit-Bold /Flags 32 /FontBBox [-500 -300 1200 1000] /ItalicAngle 0 /Ascent 1000 /Descent -300 /CapHeight 720 /StemV 96 /FontFile2 9 0 R >> endobj\n"),
    pdfStreamObject(9, fonts.bold),
    pdfStreamObject(10, asciiBytes(stream))
  ];
  return assemblePdf(objects);
}

type PdfObjectChunk = Uint8Array;

function pdfObject(value: string): PdfObjectChunk {
  return asciiBytes(value);
}

function pdfStreamObject(id: number, bytes: Uint8Array): PdfObjectChunk {
  return concatBytes([
    asciiBytes(`${id} 0 obj << /Length ${bytes.length} >> stream\n`),
    bytes,
    asciiBytes("\nendstream endobj\n")
  ]);
}

function assemblePdf(objects: PdfObjectChunk[]) {
  const header = asciiBytes("%PDF-1.4\n");
  let offset = header.length;
  const xref = ["0000000000 65535 f \n"];
  for (const object of objects) {
    xref.push(`${String(offset).padStart(10, "0")} 00000 n \n`);
    offset += object.length;
  }
  const startxref = offset;
  const trailer = asciiBytes(`xref\n0 ${objects.length + 1}\n${xref.join("")}trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${startxref}\n%%EOF`);
  return concatBytes([header, ...objects, trailer]);
}

function outfitWidths(defaultWidth: number) {
  return Array.from({ length: 95 }, (_, index) => {
    const code = index + 32;
    if (code === 32) return 260;
    if ("ilI.,:;!|'".includes(String.fromCharCode(code))) return 260;
    if ("mwMW@#".includes(String.fromCharCode(code))) return 780;
    if ("0123456789".includes(String.fromCharCode(code))) return 560;
    return defaultWidth;
  }).join(" ");
}

function asciiBytes(value: string) {
  return new TextEncoder().encode(value);
}

function concatBytes(chunks: Uint8Array[]) {
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }
  return merged;
}

function documentNode(tag: string) {
  return globalThis.document.createElement(tag);
}
