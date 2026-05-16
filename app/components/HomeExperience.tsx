"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { articles } from "../../lib/articles";

const highlights = [
  ["Cuentas web", "Opera con IBAN GDLP-W desde escritorio, móvil o tablet."],
  ["Transferencias", "Envía por código o IBAN con una confirmación limpia y directa."],
  ["Tarjetas", "Consulta tus tarjetas y Promo Cards sin habilitar pagos web."],
  ["Empresas", "Resumen claro para cuentas de empresa, nóminas y actividad."]
];

const journeys = [
  {
    title: "Para personas",
    href: "/personas",
    text: "Consulta saldo, revisa movimientos y mueve Pz sin abrir la app."
  },
  {
    title: "Para empresas",
    href: "/empresas",
    text: "Una vista de escritorio para liquidez, empleados e inversiones."
  },
  {
    title: "Seguridad",
    href: "/seguridad",
    text: "Web sin NFC, tarjetas solo lectura y operaciones por código."
  }
];

export default function HomeExperience() {
  const [modal, setModal] = useState<"web" | "cards" | "channels" | null>(null);

  return (
    <main>
      <section className="hero editorialHero">
        <Image src="/logobanco.jpg" alt="Banco de La Placeta" fill priority className="heroImage" />
        <div className="heroShade" />
        <div className="heroContent wideHero">
          <p className="eyebrow">Banco de La Placeta</p>
          <h1>Tu banco también vive en la web.</h1>
          <p>
            Una experiencia rápida, elegante y conectada con la app para mirar, mover y entender tu dinero sin ruido.
          </p>
          <div className="heroActions">
            <Link className="primaryButton" href="/web">Entrar a banca web</Link>
            <button className="ghostButton cleanButton" onClick={() => setModal("web")}>Ver cómo funciona</button>
          </div>
        </div>
        <div className="heroDevice" aria-hidden="true">
          <div className="deviceTop">
            <span />
            <strong>GDLP-W482-9104</strong>
          </div>
          <b>24.820 Pz</b>
          <small>Disponible ahora</small>
          <div className="deviceRows">
            <span />
            <span />
            <span />
          </div>
        </div>
      </section>

      <section className="band introBand">
        <div className="sectionHead">
          <p className="eyebrow">Lo esencial</p>
          <h2>Más limpio que una oficina. Más amplio que el móvil.</h2>
        </div>
        <div className="featureGrid">
          {highlights.map(([title, text]) => (
            <article className="feature lift" key={title}>
              <strong>{title}</strong>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="splitBand">
        <div>
          <p className="eyebrow">Experiencia</p>
          <h2>La misma Placeta, adaptada al navegador.</h2>
          <p>
            La web está hecha para sesiones más tranquilas: revisar cuentas, leer el contexto del banco, enviar dinero y ver tarjetas registradas.
          </p>
          <button className="primaryButton cleanButton" onClick={() => setModal("channels")}>Diferencias web/app</button>
        </div>
        <div className="stackedPreview">
          <article>
            <span>Resumen</span>
            <strong>Saldo total visible</strong>
          </article>
          <article>
            <span>Enviar</span>
            <strong>Por código o IBAN</strong>
          </article>
          <article>
            <span>Tarjetas</span>
            <strong>Consulta segura</strong>
          </article>
        </div>
      </section>

      <section className="band">
        <div className="sectionHead">
          <p className="eyebrow">Apartados</p>
          <h2>Entra por donde te toca.</h2>
        </div>
        <div className="journeyGrid">
          {journeys.map((item) => (
            <Link href={item.href} className="journey" key={item.title}>
              <span>{item.title}</span>
              <p>{item.text}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="band soft" id="articulos">
        <div className="sectionHead">
          <p className="eyebrow">Historias y novedades</p>
          <h2>Artículos del Banco</h2>
        </div>
        <div className="articleGrid richArticles">
          {articles.map((article) => (
            <Link className="articleCard imageArticle" href={`/articulos/${article.slug}`} key={article.slug}>
              <Image src={article.image} alt="" width={720} height={420} />
              <div>
                <span>{article.category} · {new Intl.DateTimeFormat("es-ES").format(new Date(article.date))}</span>
                <h3>{article.title}</h3>
                <p>{article.excerpt}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="closingCta">
        <div>
          <p className="eyebrow">Banca web</p>
          <h2>Lista para entrar cuando tú lo estés.</h2>
        </div>
        <Link className="primaryButton" href="/web">Abrir mi panel</Link>
      </section>

      {modal && (
        <div className="modalLayer" role="dialog" aria-modal="true" onClick={() => setModal(null)}>
          <div className="modalSheet" onClick={(event) => event.stopPropagation()}>
            <button className="modalClose" onClick={() => setModal(null)}>Cerrar</button>
            {modal === "web" && (
              <>
                <p className="eyebrow">Funcionamiento</p>
                <h2>Banca web con las reglas claras</h2>
                <p>Entras con tu DIP, se recuperan tus cuentas y se crea una cuenta web GDLP-W si todavía no existe.</p>
              </>
            )}
            {modal === "cards" && (
              <>
                <p className="eyebrow">Tarjetas</p>
                <h2>Visible, no pagable</h2>
                <p>La web muestra datos de tarjetas y Promo Cards registradas. El pago NFC y el alta física se mantienen en Android.</p>
              </>
            )}
            {modal === "channels" && (
              <>
                <p className="eyebrow">Canales</p>
                <h2>Web para operar, app para lo físico</h2>
                <p>Las cuentas GDLP-W viven en navegador. Las funciones de NFC, PlaceZum físico y registro de Promo Cards se quedan en móvil.</p>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
