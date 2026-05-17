import Image from "next/image";
import { planProjects } from "../../lib/gdlp-content";
import { gdlpUrl } from "../../lib/site";

export const metadata = {
  title: "Plan 2026 | Grupo de La Placeta",
  description: "Hoja de ruta del ecosistema de La Placeta, separada de las noticias ordinarias.",
  alternates: {
    canonical: gdlpUrl("/plan-2026")
  },
  openGraph: {
    title: "Plan 2026 | Grupo de La Placeta",
    description: "Hoja de ruta del ecosistema de La Placeta, separada de las noticias ordinarias.",
    url: gdlpUrl("/plan-2026"),
    siteName: "Grupo de La Placeta"
  }
};

export default function PlanIndexPage() {
  return (
    <main className="content-page">
      <header className="info-nav">
        <a href="/" className="info-brand">
          <span><Image src="/gdlp26.png" alt="Banco de La Placeta" fill sizes="58px" /></span>
          <strong>Banco de La Placeta</strong>
        </a>
        <nav>
          <a href="/noticias">Noticias</a>
          <a href="/login">Acceder</a>
        </nav>
      </header>

      <section className="content-hero compact plan">
        <span>Hoja de ruta</span>
        <h1>Plan 2026</h1>
        <p>Proyectos estratégicos de infraestructura, gobernanza, pagos, mercado regulado y privacidad. Cada proyecto tiene vista propia para compartir.</p>
      </section>

      <section className="plan-list-grid">
        {planProjects.map((item) => (
          <a key={item.slug} href={`/plan-2026/${item.slug}`} className="plan-list-card">
            <span className="plan-image"><Image src={item.image} alt={item.title} fill sizes="(max-width: 760px) 100vw, 360px" /></span>
            <div>
              <b>{item.tag}</b>
              <h2>{item.title}</h2>
              <p>{item.summary}</p>
              <small>{item.status}</small>
            </div>
          </a>
        ))}
      </section>
    </main>
  );
}
