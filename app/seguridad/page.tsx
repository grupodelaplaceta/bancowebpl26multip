import Link from "next/link";

export default function SeguridadPage() {
  return (
    <main className="subPage">
      <section className="subHero securityHero">
        <p className="eyebrow">Seguridad</p>
        <h1>La web no intenta ser una tarjeta.</h1>
        <p>El navegador sirve para consultar y operar por código. NFC, PlaceZum físico y Promo Cards se quedan en Android.</p>
        <Link className="primaryButton" href="/articulos/seguridad-sin-nfc">Leer más</Link>
      </section>
      <section className="subGrid">
        <article><span>Sin NFC</span><h2>Sin pagos físicos</h2><p>No hay emulación de tarjeta ni cobros por contacto en navegador.</p></article>
        <article><span>Server-side</span><h2>Firma protegida</h2><p>La web firma operaciones desde Vercel, no desde el cliente.</p></article>
        <article><span>Promo Cards</span><h2>Solo consulta</h2><p>Se ven si ya existen, pero se registran acercándolas al móvil Android.</p></article>
      </section>
    </main>
  );
}
