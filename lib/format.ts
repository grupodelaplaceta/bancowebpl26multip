export function formatPz(amount: number) {
  return new Intl.NumberFormat("es-ES").format(Math.round(amount || 0));
}

export function formatDate(value?: string) {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function isWebIban(iban?: string) {
  return Boolean(iban?.startsWith("GDLP-W"));
}

export function isAndroidIban(iban?: string) {
  return Boolean(iban?.startsWith("GDLP-AP"));
}

export function channelLabel(iban?: string) {
  if (isWebIban(iban)) return "Web";
  if (isAndroidIban(iban)) return "Android";
  return "GDLP";
}
