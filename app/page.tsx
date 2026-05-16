import Image from "next/image";
import Link from "next/link";
import { articles } from "../lib/articles";

export default function Home() {
  return (
    <main>
      <section className="hero">
        <Image src="/logobanco.jpg" alt="Banco de La Placeta" fill priority className="heroImage" />
        <div className="heroShade" />
        <div className="heroContent">
          <p className="eyebrow">Grupo de La Placeta</p>
          <h1>Banco de La Placeta</h1>
          <p>
            Banca digital con cuentas web GDLP-W, artículos normativos y acceso unificado al backend operativo de la app.
          </p>
          <div className="heroActions">
            <Link className="primaryButton" href="/web">Abrir banca web</Link>
            <Link className="ghostButton" href="#articulos">Leer artículos</Link>
          </div>
        </div>
      </section>

      <section className="band">
        <div className="sectionHead">
          <p className="eyebrow">Canales</p>
          <h2>Web conectada a la app, con reglas distintas</h2>
        </div>
        <div className="featureGrid">
          <article className="feature">
            <strong>IBAN web</strong>
            <p>Las cuentas creadas desde navegador usan formato GDLP-WXXX-XXXX.</p>
          </article>
          <article className="feature">
            <strong>Comisión puente</strong>
            <p>Las transferencias entre GDLP-W y GDLP-AP calculan comisión de canal.</p>
          </article>
          <article className="feature">
            <strong>Tarjetas informativas</strong>
            <p>Se ven tarjetas virtuales y Promo Cards registradas, pero no pagan desde web.</p>
          </article>
          <article className="feature">
            <strong>Sin PlaceZum NFC</strong>
            <p>En web las operaciones se hacen mediante código, IBAN o referencia de cuenta.</p>
          </article>
        </div>
      </section>

      <section className="band soft" id="articulos">
        <div className="sectionHead">
          <p className="eyebrow">Publicaciones</p>
          <h2>Artículos del Banco</h2>
        </div>
        <div className="articleGrid">
          {articles.map((article) => (
            <Link className="articleCard" href={`/articulos/${article.slug}`} key={article.slug}>
              <span>{new Intl.DateTimeFormat("es-ES").format(new Date(article.date))}</span>
              <h3>{article.title}</h3>
              <p>{article.excerpt}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
