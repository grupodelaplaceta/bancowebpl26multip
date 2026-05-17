import Image from "next/image";
import { notFound } from "next/navigation";
import { BANK_API_URL } from "../../lib/site";

const infoPages = [
  {
    slug: "cuentas",
    tag: "Cuentas",
    title: "Cuentas digitales de Banco de La Placeta",
    summary: "Consulta saldo, IBAN, actividad y documentos desde una vista pensada para operar sin mezclar acciones incompatibles.",
    image: "/assets/promos/promo2.png",
    sections: [
      { title: "Qué puedes consultar", text: "La cuenta muestra saldo, estado, IBAN, movimientos recientes y accesos a transferencias o documentos cuando corresponda." },
      { title: "Cómo se opera", text: "Las acciones sensibles se abren en ventanas separadas. Antes de guardar se revisa importe, origen, destino y concepto." },
      { title: "Cuándo usarla", text: "Úsala para revisar actividad diaria, descargar justificantes y preparar pagos desde escritorio." }
    ],
    bullets: ["Saldo e IBAN siempre visibles", "Transferencias con confirmación", "Extractos y certificados desde Hub", "Sin formularios permanentes ocupando la pantalla"]
  },
  {
    slug: "placezum",
    tag: "Pagos",
    title: "Placezum para pagos rápidos",
    summary: "Placezum permite pagar y recibir con código temporal, contactos guardados y límite semanal visible antes de enviar.",
    image: "/assets/promos/placezum-default.png",
    sections: [
      { title: "Recibir", text: "La web muestra un código temporal y datos de cuenta para que otra persona pueda identificar el destino." },
      { title: "Pagar", text: "Elige contacto, importe y confirma. La interfaz avisa del cupo disponible para reducir errores." },
      { title: "Contactos", text: "Guarda contactos por IBAN, Placeta ID o nombre para operar más rápido sin escribirlo cada vez." }
    ],
    bullets: ["Código renovable", "Contactos guardados", "Cupo semanal", "Validación de cuenta antes de enviar"]
  },
  {
    slug: "tarjetas",
    tag: "Tarjetas",
    title: "Tarjetas digitales y Promo Card",
    summary: "Controla tarjetas virtuales, estado de bloqueo y datos principales usando los assets originales de Banco de La Placeta.",
    image: "/assets/promocard.jpg",
    sections: [
      { title: "Tarjeta virtual", text: "Permite operar desde web con numeración y PIN visibles solo cuando el usuario los solicita." },
      { title: "Control de estado", text: "Puedes congelar o activar una tarjeta para evitar uso accidental." },
      { title: "Uso recomendado", text: "Mantén las tarjetas separadas de pagos, documentos y soporte para no saturar el panel inicial." }
    ],
    bullets: ["Emitir tarjeta", "Congelar o activar", "Ver PIN cuando toca", "Diseño consistente con la app"]
  },
  {
    slug: "empresas",
    tag: "Empresas",
    title: "Cuentas empresa y gestión operativa",
    summary: "Las cuentas empresa agrupan nóminas, alta, actividad asociada y rentabilidad cuando el perfil lo permite.",
    image: "/assets/promos/mercado-default.png",
    sections: [
      { title: "Alta y datos", text: "La vista empresa debe mostrar la información del alta y el estado administrativo sin esconder datos importantes." },
      { title: "Nóminas", text: "El módulo de empresa concentra pagos recurrentes y operaciones laborales en un panel más claro que la pantalla principal." },
      { title: "Rentabilidad", text: "Si la empresa participa en inversiones, la rentabilidad se interpreta desde el punto de vista de la empresa." }
    ],
    bullets: ["Panel separado", "Nóminas", "Actividad vinculada", "Rentabilidad por empresa"]
  },
  {
    slug: "soporte",
    tag: "Soporte",
    title: "Tickets de soporte con contexto",
    summary: "Un ticket útil explica qué cuenta, tarjeta, inversión o movimiento está relacionado con la incidencia.",
    image: "/assets/logobanco.jpg",
    sections: [
      { title: "Qué incluir", text: "Describe el problema, cuenta afectada, importe si existe y momento aproximado de la operación." },
      { title: "Seguimiento", text: "El estado del ticket aparece en Hub y las notificaciones web pueden avisar de cambios relevantes." },
      { title: "Cuándo abrirlo", text: "Úsalo para operaciones dudosas, documentos, tarjetas, enlaces de pago o incidencias con sincronización." }
    ],
    bullets: ["Asunto claro", "Contexto de cuenta", "Historial de estado", "Seguimiento desde web"]
  },
  {
    slug: "developers",
    tag: "API",
    title: "API para Developers y pagos externos",
    summary: "Integra pagos externos con token firmado, captura de un solo uso y separación automática del IVA.",
    image: "/assets/promos/banco-default.png",
    sections: [
      { title: "Crear un pago", text: "El comercio envía cuenta destino, importe neto y concepto. La API calcula IVA y total." },
      { title: "Consultar estado", text: "La URL firmada permite recuperar el estado antes de mostrar el checkout." },
      { title: "Capturar", text: "La captura mueve el total desde la cuenta pagadora, abona neto al comercio y separa IVA hacia TGLP." },
      { title: "Tasa semanal", text: "Las empresas liquidan una tasa semanal ajustable por uso de API de pago y enlaces de cobro. Los enlaces de cobro no sustituyen nóminas." }
    ],
    bullets: [`POST ${BANK_API_URL}/api/developer-payments`, `GET ${BANK_API_URL}/api/developer-payments/{id}`, `POST ${BANK_API_URL}/api/developer-payments/{id}/capture`, "IVA 12% integrado", "Tasa semanal configurable"]
  },
  {
    slug: "seguridad",
    tag: "Seguridad",
    title: "Seguridad operativa y coherencia entre sesiones",
    summary: "La web prioriza contexto, trazabilidad y confirmaciones para evitar duplicados o operaciones incoherentes entre dispositivos.",
    image: "/assets/promos/promo1.png",
    sections: [
      { title: "Origen y destino", text: "Cada operación debe conservar cuenta origen, cuenta destino, concepto, estado y fecha." },
      { title: "Sin duplicados", text: "Las acciones sensibles se validan contra el estado más reciente antes de persistir." },
      { title: "Notificaciones", text: "Los avisos de PC ayudan a ver cambios sin recargar toda la página ni perder el contexto actual." }
    ],
    bullets: ["Confirmación antes de operar", "Recarga sutil de datos", "Estado compartido web/app", "Alertas relevantes"]
  },
  {
    slug: "guia-pagos",
    tag: "Pagos",
    title: "Cómo enviar un pago sin errores",
    summary: "Una buena operación empieza revisando importe, cuenta destino y concepto antes de confirmar.",
    image: "/assets/promos/placezum-default.png",
    sections: [
      { title: "Antes de enviar", text: "Comprueba IBAN o contacto, importe, concepto y límite disponible." },
      { title: "Durante la confirmación", text: "La web separa el formulario en popup para que no pulses una acción por accidente." },
      { title: "Después", text: "Revisa el movimiento en actividad y descarga justificante si lo necesitas." }
    ],
    bullets: ["Revisar IBAN", "No repetir mientras confirma", "Guardar contacto solo si es correcto", "Consultar historial"]
  },
  {
    slug: "inversiones-cuenta",
    tag: "Inversiones",
    title: "Qué cuenta usar para inversiones",
    summary: "Solo una cuenta compatible debe mostrar herramientas de inversión; una cuenta normal debe explicar que no aplica.",
    image: "/assets/promos/mercado-default.png",
    sections: [
      { title: "Cuenta de inversión", text: "Muestra mercado, límites diarios por empresa, riesgo, operaciones pendientes y resultados." },
      { title: "Cuenta empresa", text: "Muestra alta, capital recibido, margen y rentabilidad desde el punto de vista empresarial." },
      { title: "Cuenta no compatible", text: "No debe enseñar botones de inversión; solo un mensaje claro de compatibilidad." }
    ],
    bullets: ["Riesgo visible", "Límite diario", "Resultados separados", "Empresa interpreta rentabilidad propia"]
  },
  {
    slug: "ticket-soporte",
    tag: "Soporte",
    title: "Cómo abrir un ticket útil",
    summary: "Un ticket con contexto permite revisar antes y evita mensajes de ida y vuelta.",
    image: "/assets/logobanco.jpg",
    sections: [
      { title: "Describe el caso", text: "Incluye qué intentabas hacer y qué ocurrió realmente." },
      { title: "Añade contexto", text: "Cuenta, tarjeta, inversión, enlace de pago o movimiento relacionado." },
      { title: "Revisa el estado", text: "El Hub mantiene el histórico y las notificaciones pueden avisar de cambios." }
    ],
    bullets: ["Asunto específico", "Cuenta afectada", "Fecha aproximada", "Importe si existe"]
  }
];

export function generateStaticParams() {
  return infoPages.map((page) => ({ slug: page.slug }));
}

export default function InfoPage({ params }: { params: { slug: string } }) {
  const page = infoPages.find((item) => item.slug === params.slug);
  if (!page) notFound();

  return (
    <main className="info-page">
      <header className="info-nav">
        <a href="/" className="info-brand">
          <span><Image src="/gdlp26.png" alt="Banco de La Placeta" fill sizes="58px" /></span>
          <strong>Banco de La Placeta</strong>
        </a>
        <nav>
          <a href="/">Inicio</a>
          <a href="/login">Acceder</a>
        </nav>
      </header>

      <section className="info-hero">
        <Image src={page.image} alt={page.title} fill priority sizes="100vw" />
        <div>
          <span>{page.tag}</span>
          <h1>{page.title}</h1>
          <p>{page.summary}</p>
        </div>
      </section>

      <section className="info-content">
        <aside>
          <span>Resumen</span>
          {page.bullets.map((bullet) => <strong key={bullet}>{bullet}</strong>)}
        </aside>
        <div className="info-sections">
          {page.sections.map((section) => (
            <article key={section.title}>
              <h2>{section.title}</h2>
              <p>{section.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="info-related">
        <span>Más información</span>
        <div>
          {infoPages.filter((item) => item.slug !== page.slug).slice(0, 3).map((item) => (
            <a key={item.slug} href={`/info/${item.slug}`}>
              <strong>{item.title}</strong>
              <p>{item.summary}</p>
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
