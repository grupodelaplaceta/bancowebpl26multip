import Image from "next/image";
import { notFound } from "next/navigation";
import { ShareButton } from "../../components/ShareButton";
import { findNews, gdlpNews } from "../../../lib/gdlp-content";
import { BANK_SITE_URL, gdlpUrl } from "../../../lib/site";
import type { GdlpSharedNewsItem } from "../../../lib/bank";

export const dynamic = "force-dynamic";

type NewsApiResponse = {
  news?: GdlpSharedNewsItem[];
};

async function loadNews(): Promise<GdlpSharedNewsItem[]> {
  try {
    const response = await fetch(`${BANK_SITE_URL}/api/gdlp-news`, { cache: "no-store" });
    const payload = (await response.json()) as NewsApiResponse;
    return Array.isArray(payload.news) && payload.news.length ? payload.news : gdlpNews;
  } catch {
    return gdlpNews;
  }
}

export function generateStaticParams() {
  return gdlpNews.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const news = await loadNews();
  const item = news.find((entry) => entry.slug === params.slug) || findNews(params.slug);
  if (!item) return {};
  return {
    title: `${item.title} | Noticias`,
    description: item.summary,
    alternates: {
      canonical: gdlpUrl(`/noticias/${item.slug}`)
    },
    openGraph: {
      title: item.title,
      description: item.summary,
      url: gdlpUrl(`/noticias/${item.slug}`),
      siteName: "Grupo de La Placeta",
      images: [item.image],
      type: "article"
    }
  };
}

export default async function NewsDetailPage({ params }: { params: { slug: string } }) {
  const news = await loadNews();
  const item = news.find((entry) => entry.slug === params.slug) || findNews(params.slug);
  if (!item) notFound();
  const related = news.filter((entry) => entry.slug !== item.slug).slice(0, 3);

  return (
    <main className="content-page">
      <header className="info-nav">
        <a href="/" className="info-brand">
          <span><Image src="/logo.png" alt="Banco de La Placeta" fill sizes="58px" /></span>
          <strong>Banco de La Placeta</strong>
        </a>
        <nav>
          <a href="/noticias">Noticias</a>
          <a href="/plan-2026">Plan 2026</a>
        </nav>
      </header>

      <article className="detail-article">
        <div className="detail-media">
          <Image src={item.image} alt={item.title} fill priority sizes="100vw" />
        </div>
        <div className="detail-body">
          <span>{item.tag}</span>
          <h1>{item.title}</h1>
          <p className="detail-lead">{item.summary}</p>
          <small>{item.date}</small>
          <div className="share-row">
            <ShareButton title={item.title} url={gdlpUrl(`/noticias/${item.slug}`)} />
            <a href="/noticias">Volver a noticias</a>
          </div>
          {(item.body || [item.summary]).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          {item.videoUrl && (
            <div className="video-frame">
              <iframe src={item.videoUrl} title={item.title} allowFullScreen loading="lazy" />
            </div>
          )}
          {Array.isArray(item.videos) && item.videos.filter((video) => video !== item.videoUrl).map((video) => (
            <div className="video-frame" key={video}>
              <iframe src={video} title={item.title} allowFullScreen loading="lazy" />
            </div>
          ))}
        </div>
      </article>

      <section className="info-related">
        <span>Más noticias</span>
        <div>
          {related.map((entry) => (
            <a key={entry.slug} href={`/noticias/${entry.slug}`}>
              <strong>{entry.title}</strong>
              <p>{entry.summary}</p>
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
