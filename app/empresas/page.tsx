import Link from "next/link";

export default function EmpresasPage() {
  return (
    <main className="subPage">
      <section className="subHero companyHero">
        <p className="eyebrow">Empresas</p>
        <h1>Un panel más amplio para cuentas de empresa.</h1>
        <p>La web prepara espacio para ver liquidez, movimientos, nóminas e inversiones con calma de escritorio.</p>
        <Link className="primaryButton" href="/web">Abrir panel</Link>
      </section>
      <section className="subGrid">
        <article><span>Liquidez</span><h2>Todo localizable</h2><p>Cuentas principales, actividad reciente y destino de fondos a mano.</p></article>
        <article><span>Nóminas</span><h2>Control fiscal</h2><p>Compatible con la normativa ajustable de Tributos del Grupo de La Placeta.</p></article>
        <article><span>Fondos</span><h2>Inversión visible</h2><p>Una base para que las empresas consulten su rendimiento y exposición.</p></article>
      </section>
    </main>
  );
}
