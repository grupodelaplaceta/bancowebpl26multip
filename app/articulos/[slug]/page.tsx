import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { articles, getArticle } from "../../../lib/articles";

export function generateStaticParams() {
  return articles.map((article) => ({ slug: article.slug }));
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  return (
    <main className="articlePage">
      <Link href="/#articulos" className="backLink">Volver a artículos</Link>
      <Image className="articleHeroImage" src={article.image} alt="" width={1180} height={520} priority />
      <p className="eyebrow">{new Intl.DateTimeFormat("es-ES").format(new Date(article.date))}</p>
      <h1>{article.title}</h1>
      <p className="lead">{article.excerpt}</p>
      <div className="articleBody">
        {article.body.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </main>
  );
}
