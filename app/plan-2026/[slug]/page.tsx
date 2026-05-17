import Image from "next/image";
import { notFound } from "next/navigation";
import { ShareButton } from "../../components/ShareButton";
import { findPlanProject, planProjects } from "../../../lib/gdlp-content";
import { gdlpUrl } from "../../../lib/site";

export function generateStaticParams() {
  return planProjects.map((item) => ({ slug: item.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const item = findPlanProject(params.slug);
  if (!item) return {};
  return {
    title: `${item.title} | Plan 2026`,
    description: item.summary,
    alternates: {
      canonical: gdlpUrl(`/plan-2026/${item.slug}`)
    },
    openGraph: {
      title: `${item.title} | Plan 2026`,
      description: item.summary,
      url: gdlpUrl(`/plan-2026/${item.slug}`),
      siteName: "Grupo de La Placeta",
      images: [item.image],
      type: "article"
    }
  };
}

export default function PlanDetailPage({ params }: { params: { slug: string } }) {
  const item = findPlanProject(params.slug);
  if (!item) notFound();
  const related = planProjects.filter((entry) => entry.slug !== item.slug).slice(0, 3);

  return (
    <main className="content-page">
      <header className="info-nav">
        <a href="/" className="info-brand">
          <span><Image src="/gdlp26.png" alt="Banco de La Placeta" fill sizes="58px" /></span>
          <strong>Banco de La Placeta</strong>
        </a>
        <nav>
          <a href="/plan-2026">Plan 2026</a>
          <a href="/noticias">Noticias</a>
        </nav>
      </header>

      <article className="detail-article plan-detail">
        <div className="detail-media">
          <Image src={item.image} alt={item.title} fill priority sizes="100vw" />
        </div>
        <div className="detail-body">
          <span>{item.tag}</span>
          <h1>{item.title}</h1>
          <p className="detail-lead">{item.summary}</p>
          <small>{item.status}</small>
          <div className="share-row">
            <ShareButton title={`${item.title} | Plan 2026`} url={gdlpUrl(`/plan-2026/${item.slug}`)} />
            <a href="/plan-2026">Volver al Plan 2026</a>
          </div>
          {item.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          <div className="milestone-list">
            {item.milestones.map((milestone) => <strong key={milestone}>{milestone}</strong>)}
          </div>
        </div>
      </article>

      <section className="info-related">
        <span>Más proyectos del plan</span>
        <div>
          {related.map((entry) => (
            <a key={entry.slug} href={`/plan-2026/${entry.slug}`}>
              <strong>{entry.title}</strong>
              <p>{entry.summary}</p>
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
