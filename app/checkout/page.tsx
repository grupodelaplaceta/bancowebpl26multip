export default function CheckoutPage() {
  return (
    <main className="subPage">
      <section className="subHero">
        <p className="eyebrow">Checkout oficial</p>
        <h1>Pasarela segura del Banco de La Placeta.</h1>
        <p>Las tiendas externas envían la solicitud; el banco confirma con el usuario y devuelve una respuesta firmada al comercio.</p>
      </section>
      <section className="subGrid">
        <article><span>1</span><h2>Solicitud</h2><p>El comercio manda importe, concepto y referencia.</p></article>
        <article><span>2</span><h2>Confirmación</h2><p>El usuario autoriza en el banco. El comercio nunca ve la clave.</p></article>
        <article><span>3</span><h2>Comprobante</h2><p>Se emite justificante con IVA, tasas, IP y timestamp.</p></article>
      </section>
    </main>
  );
}
