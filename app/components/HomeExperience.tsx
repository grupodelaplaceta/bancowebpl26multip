"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { articles } from "../../lib/articles";

const features = [
  ["Cuentas web", "Opera con tu DIP y tu cuenta GDLP-W desde cualquier navegador."],
  ["Misma banca", "La web y la app comparten saldo, normativa, límites y movimientos."],
  ["Panel cliente", "Saldo, transferencias, tarjetas visibles, inversiones y actividad."],
  ["Admin completo", "Tributos, límites, cuentas, auditoría y empresas desde escritorio."]
];

const areas = [
  {
    title: "Personas",
    href: "/personas",
    text: "Tu saldo, tus movimientos y tus transferencias por código."
  },
  {
    title: "Empresas",
    href: "/empresas",
    text: "Tesorería, nóminas, fiscalidad, API y webhooks en un panel claro."
  },
  {
    title: "Seguridad",
    href: "/seguridad",
    text: "La web no usa NFC: las tarjetas se consultan y las operaciones se confirman por código."
  }
];

export default function HomeExperience() {
  const [modal, setModal] = useState<"web" | "app" | null>(null);

  return (
    <main>
      <section className="hero editorialHero">
        <Image src="/logobanco.jpg" alt="Banco de La Placeta" fill priority className="heroImage" />
        <div className="heroShade" />
        <div className="heroContent wideHero">
          <p className="eyebrow">Banco de La Placeta</p>
          <h1>La banca web del Grupo de La Placeta.</h1>
          <p>
            Accede a tus cuentas, revisa tu actividad y opera con Placetas desde una web pensada
            para móvil, iPhone y escritorio. La app Android mantiene la misma imagen y añade NFC.
          </p>
          <div className="heroActions">
            <Link className="primaryButton" href="/web">Entrar al panel</Link>
            <button className="ghostButton cleanButton" onClick={() => setModal("web")}>Ver funciones</button>
          </div>
          <div className="heroBadges" aria-label="Canales del banco">
            <span>GDLP-W</span>
            <span>DIP seguro</span>
            <span>Normativa sincronizada</span>
          </div>
        </div>
        <div className="heroDevice" aria-hidden="true">
          <div className="deviceTop">
            <span />
            <strong>GDLP-W482-9104</strong>
          </div>
          <small>Saldo disponible</small>
          <b>24.820 Pz</b>
          <div className="deviceRows">
            <span />
            <span />
            <span />
          </div>
        </div>
      </section>

      <section className="brandRail" aria-label="Resumen">
        <span>Web matriz</span>
        <span>App Android</span>
        <span>Admin</span>
        <span>Tributos</span>
        <span>Empresas</span>
      </section>

      <section className="band introBand">
        <div className="sectionHead">
          <p className="eyebrow">Una sola marca</p>
          <h2>La web se ve como la app, pero aprovecha mejor el navegador.</h2>
          <p className="lead">
            El panel está separado por pantallas, con acciones rápidas, tarjetas limpias y textos directos.
            Nada de NFC en web: lo físico sigue viviendo en Android.
          </p>
        </div>
        <div className="featureGrid">
          {features.map(([title, text]) => (
            <article className="feature lift" key={title}>
              <strong>{title}</strong>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="splitBand">
        <div>
          <p className="eyebrow">Panel móvil</p>
          <h2>Hecha para quien entra desde iPhone.</h2>
          <p>
            La web abre como una app: saldo arriba, acciones a mano y navegación inferior en móvil.
            En escritorio mantiene el mismo lenguaje, con más espacio para Admin, Tributos y empresas.
          </p>
          <button className="primaryButton cleanButton" onClick={() => setModal("app")}>Web frente a app</button>
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
              <span>Invertir</span>
            </div>
            <div className="phoneCard">
              <small>Tarjeta virtual</small>
              <b>482910</b>
            </div>
            <div className="phoneRows"><i /><i /><i /></div>
          </div>
        </div>
      </section>

      <section className="band">
        <div className="sectionHead">
          <p className="eyebrow">Apartados</p>
          <h2>Todo tiene su sitio.</h2>
        </div>
        <div className="journeyGrid">
          {areas.map((item) => (
            <Link href={item.href} className="journey" key={item.title}>
              <span>{item.title}</span>
              <p>{item.text}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="ecosystemBand">
        <div className="ecosystemNode parent">
          <span>Web</span>
          <h2>Centro del banco</h2>
          <p>Marca, banca online, panel cliente, Admin, Tributos, empresas, artículos y normativa.</p>
        </div>
        <div className="ecosystemLine" aria-hidden="true" />
        <div className="ecosystemNode child">
          <span>App</span>
          <h2>Canal móvil físico</h2>
          <p>La misma cuenta y estilo, con NFC, PlaceZum y registro real de Promo Cards.</p>
        </div>
      </section>

      <section className="band soft" id="articulos">
        <div className="sectionHead">
          <p className="eyebrow">Artículos</p>
          <h2>Novedades del banco</h2>
        </div>
        <div className="articleGrid richArticles">
          {articles.map((article) => (
            <Link className="articleCard imageArticle" href={`/articulos/${article.slug}`} key={article.slug}>
              <Image src={article.image} alt="" width={720} height={420} />
              <div>
                <span>{article.category}</span>
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
          <h2>Entra con tu DIP y empieza.</h2>
        </div>
        <Link className="primaryButton" href="/web">Abrir panel</Link>
      </section>

      {modal && (
        <div className="modalLayer" role="dialog" aria-modal="true" onClick={() => setModal(null)}>
          <div className="modalSheet" onClick={(event) => event.stopPropagation()}>
            <button className="modalClose" onClick={() => setModal(null)}>Cerrar</button>
            {modal === "web" ? (
              <>
                <p className="eyebrow">Funciones</p>
                <h2>Web completa, sin funciones físicas.</h2>
                <p>La web permite consultar cuentas, enviar por código, ver tarjetas, invertir, usar empresa y acceder a Admin o Tributos en demo.</p>
              </>
            ) : (
              <>
                <p className="eyebrow">Canales</p>
                <h2>La app queda para NFC.</h2>
                <p>Las Promo Cards se registran en Android acercándolas al teléfono. En web solo se muestran si ya están vinculadas.</p>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
