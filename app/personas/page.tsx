import Link from "next/link";

export default function PersonasPage() {
  return (
    <main className="subPage">
      <section className="subHero peopleHero">
        <p className="eyebrow">Personas</p>
        <h1>Tu dinero, claro desde el primer vistazo.</h1>
        <p>Consulta cuentas, mueve Pz y revisa tarjetas con una web pensada para ir directa al grano.</p>
        <Link className="primaryButton" href="/web">Entrar a banca web</Link>
      </section>
      <section className="subGrid">
        <article><span>01</span><h2>Resumen vivo</h2><p>Saldo, cuentas y últimas operaciones sin pantallas de más.</p></article>
        <article><span>02</span><h2>Enviar por código</h2><p>Operaciones web con IBAN o referencia, sin funciones físicas del móvil.</p></article>
        <article><span>03</span><h2>Tarjetas visibles</h2><p>Consulta número y estado de tus tarjetas sin habilitar pagos desde navegador.</p></article>
      </section>
    </main>
  );
}
