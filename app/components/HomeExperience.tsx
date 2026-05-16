"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { articles } from "../../lib/articles";

const highlights = [
  ["Web matriz", "El sitio principal del banco: marca, cuentas, artículos y paneles oficiales."],
  ["App móvil", "La app hereda la misma identidad visual y añade las funciones físicas."],
  ["Canales conectados", "GDLP-W y GDLP-AP comparten backend, normativa y estado."],
  ["Administración central", "Admin y Tributos viven mejor en la web, con más espacio y control."]
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
        <div className="heroGrain" />
        <div className="heroContent wideHero">
          <p className="eyebrow">Web matriz del Banco de La Placeta</p>
          <h1>La casa principal de la app.</h1>
          <p>
            La web es el centro oficial de marca, banca y administración. La app móvil nace de esta misma identidad para llevar el banco al bolsillo.
          </p>
          <div className="heroActions">
            <Link className="primaryButton" href="/web">Entrar a banca web</Link>
            <button className="ghostButton cleanButton" onClick={() => setModal("web")}>Ver cómo funciona</button>
          </div>
          <div className="heroBadges" aria-label="Funciones principales">
            <span>GDLP-W</span>
            <span>App GDLP-AP</span>
            <span>Una sola marca</span>
          </div>
        </div>
        <div className="heroDevice" aria-hidden="true">
          <div className="parentBadge">Web matriz</div>
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

      <section className="brandRail" aria-label="Resumen de canales">
        <span>Web matriz oficial</span>
        <span>App móvil derivada</span>
        <span>Backend único</span>
        <span>Tributos GDLP</span>
        <span>Panel empresa</span>
      </section>

      <section className="band introBand">
        <div className="sectionHead">
          <p className="eyebrow">Lo esencial</p>
          <h2>Una identidad, dos formas de entrar.</h2>
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
          <h2>La web manda la imagen. La app la lleva contigo.</h2>
          <p>
            Todo parte de la web: colores, tono, normativa, paneles y estructura. En móvil se conserva el mismo lenguaje, quitando solo lo que pertenece al escritorio.
          </p>
          <button className="primaryButton cleanButton" onClick={() => setModal("channels")}>Diferencias web/app</button>
        </div>
        <div className="phoneShowcase" aria-hidden="true">
          <div className="phoneChrome">
            <div className="phoneStatus"><span />Banco Placeta</div>
            <div className="phoneBalance">
              <small>Saldo total</small>
              <strong>24.820 Pz</strong>
            </div>
            <div className="phoneActions">
              <span>Enviar</span>
              <span>Tarjetas</span>
              <span>Actividad</span>
            </div>
            <div className="phoneCard">
              <small>Tarjeta virtual</small>
              <b>482910</b>
            </div>
            <div className="phoneRows"><i /><i /><i /></div>
          </div>
        </div>
      </section>

      <section className="ecosystemBand">
        <div className="ecosystemNode parent">
          <span>Centro</span>
          <h2>Banco de La Placeta Web</h2>
          <p>Marca principal, panel cliente, Admin, Tributos, artículos y cuentas GDLP-W.</p>
        </div>
        <div className="ecosystemLine" aria-hidden="true" />
        <div className="ecosystemNode child">
          <span>Canal móvil</span>
          <h2>App Banco Placeta</h2>
          <p>La misma estética y cuenta, con NFC, Promo Cards físicas y funciones Android.</p>
        </div>
      </section>

      <section className="experienceGrid">
        <article>
          <span>01</span>
          <h2>Marca madre</h2>
          <p>La web se presenta como el origen visual y operativo del banco.</p>
        </article>
        <article>
          <span>02</span>
          <h2>App coherente</h2>
          <p>El panel web móvil usa navegación y jerarquía similares a la app.</p>
        </article>
        <article>
          <span>03</span>
          <h2>Control central</h2>
          <p>Admin, Tributos y empresas tienen su casa natural en la web.</p>
        </article>
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
