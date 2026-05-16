export const articles = [
  {
    slug: "banca-web-gdlp",
    title: "La banca web de Banco de La Placeta",
    excerpt: "Una forma cómoda de consultar cuentas, tarjetas y operaciones GDLP desde navegador.",
    date: "2026-05-16",
    body: [
      "La banca web usa el mismo backend operativo que la app Android para mantener una única fuente de verdad.",
      "Las cuentas creadas desde web usan IBAN con formato GDLP-WXXX-XXXX. Las cuentas de la app mantienen su formato GDLP-APXX-XXX.",
      "Las operaciones entre ambos canales pueden aplicar comisión puente, configurable desde la normativa técnica del sistema."
    ]
  },
  {
    slug: "seguridad-sin-nfc",
    title: "Seguridad web: sin NFC ni PlaceZum",
    excerpt: "La web limita pagos físicos: no inicia pagos por tarjeta ni NFC.",
    date: "2026-05-16",
    body: [
      "PlaceZum y el pago NFC pertenecen a la app Android y a lectores físicos.",
      "En web las tarjetas solo muestran datos informativos. No pueden usarse para pagar.",
      "Las Promo Cards ya registradas se pueden consultar, pero su alta se mantiene exclusivamente desde la app."
    ]
  },
  {
    slug: "ibans-web-y-comisiones",
    title: "IBAN web y comisión entre canales",
    excerpt: "El canal web separa cuentas GDLP-W de las cuentas Android GDLP-AP.",
    date: "2026-05-16",
    body: [
      "La separación de IBAN permite saber desde qué canal opera cada cuenta.",
      "Cuando una operación cruza entre web y app Android, el sistema calcula una comisión de puente y la registra como ingreso de Tributos GDLP.",
      "Este diseño permite evolucionar ambos productos sin duplicar saldos ni estados."
    ]
  }
];

export function getArticle(slug: string) {
  return articles.find((article) => article.slug === slug);
}
