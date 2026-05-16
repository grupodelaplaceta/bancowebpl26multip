export const articles = [
  {
    slug: "banca-web-gdlp",
    title: "La banca web de Banco de La Placeta",
    excerpt: "Tu dinero, tus movimientos y tus tarjetas visibles desde cualquier navegador.",
    date: "2026-05-16",
    image: "/logobanco.jpg",
    category: "Producto",
    body: [
      "La banca web nace para consultar, enviar y organizar dinero sin depender del móvil en cada momento.",
      "Las cuentas web tienen identidad propia, pero conviven con las cuentas de la app para que todo siga formando parte del mismo banco.",
      "La experiencia está pensada para ser rápida: entrar con DIP, ver el resumen y operar por código o IBAN."
    ]
  },
  {
    slug: "seguridad-sin-nfc",
    title: "Seguridad clara en navegador",
    excerpt: "La web evita lo físico: nada de NFC, nada de pagos por tarjeta desde navegador.",
    date: "2026-05-16",
    image: "/actu.jpg",
    category: "Seguridad",
    body: [
      "El navegador es perfecto para consultar y ordenar, pero no para sustituir una tarjeta física.",
      "Por eso la web no inicia pagos NFC ni emula tarjetas. Las tarjetas se muestran para que puedas revisarlas, no para pagar con ellas.",
      "Las Promo Cards se registran desde Android acercándolas al móvil. En web aparecen ya vinculadas como parte de tu cartera."
    ]
  },
  {
    slug: "ibans-web-y-comisiones",
    title: "IBAN web y comisión entre canales",
    excerpt: "Las cuentas web tienen su propio formato para separar canales sin separar el banco.",
    date: "2026-05-16",
    image: "/app-icon.png",
    category: "Cuentas",
    body: [
      "El formato GDLP-WXXX-XXXX identifica cuentas nacidas en web. El formato GDLP-APXX-XXX identifica cuentas operadas desde Android.",
      "Cuando una operación cruza de un canal al otro, el sistema puede aplicar una comisión puente visible antes de confirmar.",
      "Así se puede crecer en web y móvil a la vez, manteniendo reglas claras para cada sitio."
    ]
  },
  {
    slug: "empresas-en-la-placeta",
    title: "Empresas con nóminas, cuentas y fondos",
    excerpt: "La web también prepara un espacio más cómodo para consultar actividad de empresa.",
    date: "2026-05-16",
    image: "/logobanco.jpg",
    category: "Empresas",
    body: [
      "Las empresas necesitan ver liquidez, nóminas, inversión y movimientos sin perderse entre pantallas.",
      "La web organiza esa información en bloques más amplios, ideales para escritorio.",
      "Las acciones delicadas siguen protegidas por las reglas del banco y la normativa de Tributos."
    ]
  }
];

export function getArticle(slug: string) {
  return articles.find((article) => article.slug === slug);
}
