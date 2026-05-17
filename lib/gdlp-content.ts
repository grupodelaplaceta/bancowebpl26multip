export type GdlpNewsItem = {
  slug: string;
  title: string;
  tag: string;
  summary: string;
  date: string;
  image: string;
  body: string[];
  videoUrl?: string;
};

export type PlanProject = {
  slug: string;
  title: string;
  tag: string;
  summary: string;
  status: string;
  image: string;
  body: string[];
  milestones: string[];
};

export const gdlpNews: GdlpNewsItem[] = [
  {
    slug: "apertura-portal-institucional",
    title: "Apertura del portal institucional",
    tag: "Comunicado",
    summary: "El Grupo de La Placeta estrena portal central para altas, normativa, noticias y mapa del ecosistema.",
    date: "17/05/2026",
    image: "/assets/promos/promo1.png",
    body: [
      "El portal institucional concentra la información pública del ecosistema y separa la comunicación oficial de las herramientas operativas del banco.",
      "Las noticias se publican como comunicados independientes, con URL propia para consulta posterior y difusión directa.",
      "El objetivo es que cada actualización pueda leerse sin mezclarla con la hoja de ruta, la banca o los módulos privados."
    ],
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ"
  },
  {
    slug: "guia-altas-consentimiento",
    title: "Guía de altas y consentimiento",
    tag: "Ayuda",
    summary: "Toda nueva incorporación debe aceptar el aviso de simulación y el consentimiento RGPD antes de recibir DIP.",
    date: "17/05/2026",
    image: "/assets/promos/banco-default.png",
    body: [
      "El alta distingue entre identidad, consentimiento y acceso operativo. El DIP identifica al miembro dentro del entorno de rol.",
      "Antes de activar una cuenta, el usuario debe comprender la naturaleza ficticia del ecosistema y aceptar el tratamiento mínimo de datos.",
      "La guía queda publicada como noticia de ayuda porque explica un proceso vigente, no un hito estratégico del Plan 2026."
    ]
  },
  {
    slug: "empresas-internas-sdk-pagos",
    title: "Empresas internas y SDK de pagos",
    tag: "Ecosistema",
    summary: "Las empresas de rol pueden solicitar conexión al módulo de pagos del Banco con IVA simulado por defecto.",
    date: "17/05/2026",
    image: "/assets/promos/mercado-default.png",
    body: [
      "El SDK de pagos permite que comercios internos creen cobros firmados y los capturen desde una cuenta GDLP.",
      "Cada pago separa importe neto, IVA simulado y trazabilidad para que la administración pueda revisar actividad.",
      "La noticia explica el uso ordinario del módulo; la evolución técnica del SDK vive en el Plan 2026."
    ]
  },
  {
    slug: "placetaid-acceso-comun",
    title: "PlacetaID como acceso común",
    tag: "Comunicado",
    summary: "El acceso al ecosistema se unifica mediante DIP, contraseña y autenticador para proteger la identidad interna.",
    date: "17/05/2026",
    image: "/assets/promos/placezum-default.png",
    body: [
      "PlacetaID actúa como identidad común para iniciar sesión en los servicios del ecosistema.",
      "La banca web puede registrar o reconocer una identidad existente y mantener la sesión asociada al DIP.",
      "Este comunicado queda separado del plan estratégico para que pueda compartirse como aviso operativo."
    ]
  }
];

export const planProjects: PlanProject[] = [
  {
    slug: "infraestructura-core",
    title: "Infraestructura Core",
    tag: "MongoDB y APIs",
    summary: "Consolidación de PlacetaID, API Gateway y estado centralizado para reducir sistemas manuales.",
    status: "Primer semestre",
    image: "/assets/promos/promo2.png",
    body: [
      "La infraestructura core agrupa los servicios mínimos que sostienen identidad, estado bancario y comunicaciones entre módulos.",
      "El proyecto prioriza consistencia de datos, endpoints más claros y persistencia robusta para evitar divergencias entre web y app.",
      "Forma parte del Plan 2026 porque define una línea estratégica, no una noticia puntual."
    ],
    milestones: ["Estado centralizado", "API Gateway", "Persistencia con control de conflictos"]
  },
  {
    slug: "gobernanza-economica",
    title: "Gobernanza económica",
    tag: "Fiscalidad automática",
    summary: "IVA, tasas, IRM y alertas de acumulación calculadas por backend y revisables desde paneles autorizados.",
    status: "En diseño",
    image: "/assets/promos/banco-default.png",
    body: [
      "La gobernanza económica busca que los cálculos fiscales simulados sean trazables y revisables desde roles autorizados.",
      "El alcance incluye reglas de IVA, tasas operativas, expedientes y límites configurables por administración.",
      "Las comunicaciones sobre cambios concretos se publicarán como noticias; este proyecto conserva la hoja de ruta."
    ],
    milestones: ["Reglas fiscales configurables", "Panel autorizado", "Alertas y auditoría"]
  },
  {
    slug: "sdk-comercial",
    title: "SDK comercial",
    tag: "Pagos y webhooks",
    summary: "Checkout seguro para empresas internas, enlaces de cobro de un solo uso y eventos en tiempo real.",
    status: "Piloto técnico",
    image: "/assets/promos/mercado-default.png",
    body: [
      "El SDK comercial conecta tiendas y servicios internos con pagos firmados del Banco de La Placeta.",
      "La hoja de ruta contempla enlaces de cobro, captura de pagos, eventos de confirmación y desglose fiscal simulado.",
      "El detalle de integración para developers se mantendrá en documentación separada y enlazada desde noticias técnicas."
    ],
    milestones: ["Checkout firmado", "Webhooks", "Enlaces de cobro"]
  },
  {
    slug: "mercado-regulado",
    title: "Mercado regulado",
    tag: "Inversiones +18",
    summary: "Operaciones asíncronas, control de edad, límites por riesgo y retención fiscal automática sobre beneficio.",
    status: "Marco normativo",
    image: "/assets/promos/mercado-default.png",
    body: [
      "El mercado regulado separa las cuentas ordinarias de la operativa de inversión y añade restricciones por edad y riesgo.",
      "El proyecto incluye límites por operación, liquidación asíncrona y visualización clara del perfil de riesgo.",
      "Su evolución pertenece al Plan 2026 porque afecta a normativa, diseño de producto y backend."
    ],
    milestones: ["Control de edad", "Riesgo visible", "Liquidación asíncrona"]
  },
  {
    slug: "seguridad-privacidad",
    title: "Seguridad y privacidad",
    tag: "RGPD / LOPDGDD",
    summary: "Trazabilidad de cambios, baja con anonimización contable y controles para proteger el ecosistema.",
    status: "Prioridad 2026",
    image: "/assets/promos/promo1.png",
    body: [
      "Seguridad y privacidad define cómo registrar cambios relevantes sin exponer más datos de los necesarios.",
      "El proyecto contempla logs, baja de usuario, anonimización de historial y revisión de consentimiento.",
      "Las guías de uso se publicarán como noticias; este detalle mantiene el objetivo estratégico."
    ],
    milestones: ["Logs de seguridad", "Baja y anonimización", "Consentimiento revisable"]
  }
];

export function findNews(slug: string) {
  return gdlpNews.find((item) => item.slug === slug);
}

export function findPlanProject(slug: string) {
  return planProjects.find((item) => item.slug === slug);
}
