import Image from "next/image";
import { gdlpNews } from "../../lib/gdlp-content";
import { gdlpUrl } from "../../lib/site";

export const metadata = {
  title: "Noticias | Grupo de La Placeta",
  description: "Comunicados y novedades oficiales del ecosistema de La Placeta.",
  alternates: {
    canonical: gdlpUrl("/noticias")
  },
  openGraph: {
    title: "Noticias | Grupo de La Placeta",
    description: "Comunicados y novedades oficiales del ecosistema de La Placeta.",
    url: gdlpUrl("/noticias"),
    siteName: "Grupo de La Placeta"
  }
};

export default function NewsIndexPage() {
  const [featured, ...rest] = gdlpNews;

  return (
    <main className="content-page">
      <header className="info-nav">
        <a href="/" className="info-brand">
          <span><Image src="/gdlp26.png" alt="Banco de La Placeta" fill sizes="58px" /></span>
          <strong>Banco de La Placeta</strong>
        </a>
        <nav>
          <a href="/plan-2026">Plan 2026</a>
          <a href="/login">Acceder</a>
        </nav>
      </header>

      <section className="content-hero compact">
        <span>Comunicación oficial</span>
        <h1>Noticias</h1>
        <p>Comunicados, guías y novedades publicadas como piezas independientes, separadas de la hoja de ruta del Plan 2026.</p>
      </section>

      <section className="featured-content">
        <a href={`/noticias/${featured.slug}`} className="featured-card">
          <span className="featured-image"><Image src={featured.image} alt={featured.title} fill sizes="(max-width: 900px) 100vw, 520px" /></span>
          <div>
            <b>{featured.tag}</b>
            <h2>{featured.title}</h2>
            <p>{featured.summary}</p>
            <small>{featured.date}</small>
          </div>
        </a>
      </section>

      <section className="content-card-grid">
        {rest.map((item) => (
          <a key={item.slug} href={`/noticias/${item.slug}`} className="content-card">
            <span><Image src={item.image} alt={item.title} fill sizes="(max-width: 760px) 100vw, 340px" /></span>
            <b>{item.tag}</b>
            <h2>{item.title}</h2>
            <p>{item.summary}</p>
            <small>{item.date}</small>
          </a>
        ))}
      </section>
    </main>
  );
}
