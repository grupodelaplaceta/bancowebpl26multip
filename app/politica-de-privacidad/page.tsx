const sections = [
  {
    title: "1. Responsable del Tratamiento de Datos",
    body: [
      "Identidad: Asociación Grupo de La Placeta.",
      "Finalidad: gestión técnica, operativa, de seguridad y de gamificación de la WebApp del Banco de La Placeta.",
      "Contacto: correo oficial de la Junta de la Asociación o Delegado de Protección de Datos (DPO) asignado."
    ]
  },
  {
    title: "2. Datos Objeto de Tratamiento y Recogida",
    body: [
      "Datos proporcionados para el rol: nombre de usuario ficticio, PlacetaID (DIP) y rango de edad para la asignación de cuenta.",
      "Datos técnicos de seguridad: direcciones IP de conexión, marcas de tiempo, registros de inicio de sesión y huella digital del dispositivo.",
      "Datos financieros simulados: historial de transacciones, saldos, registros de nóminas, contratos laborales internos y registros analíticos del módulo de inversiones aleatorias."
    ]
  },
  {
    title: "3. Base Jurídica del Tratamiento",
    body: [
      "La base legal que legitima el tratamiento de datos reales, como dirección IP o verificación de edad, es el consentimiento explícito otorgado por el usuario al marcar la casilla de aceptación al registrarse.",
      "Dicho consentimiento se combina con el interés legítimo de la Asociación para garantizar la seguridad técnica de la WebApp contra ataques de inyección, fraude o suplantación de identidad."
    ]
  },
  {
    title: "4. Período de Conservación de los Datos",
    body: [
      "Los datos de carácter personal real se conservarán únicamente durante el tiempo estrictamente necesario para el correcto desarrollo del juego de rol y la supervisión de seguridad, o hasta que el usuario revoque su consentimiento.",
      "Los registros contables y el historial del libro diario se mantendrán de forma inmutable y anonimizada tras la baja de un usuario para no romper el balance de masa monetaria dentro de la simulación."
    ]
  },
  {
    title: "5. Derechos del Usuario (ARCO-POL)",
    body: [
      "Acceso: conocer qué datos reales del usuario están almacenados en la base de datos del banco.",
      "Rectificación: modificar datos erróneos o inexactos relacionados con su identidad.",
      "Supresión: solicitar la eliminación total de sus datos personales. La cuenta se desactivará y los registros de transacciones se mantendrán anonimizados.",
      "Oposición y limitación: restringir el análisis de sus datos o el envío de alertas automáticas, asumiendo que esto puede deshabilitar funciones críticas."
    ]
  },
  {
    title: "6. Destinatarios y Seguridad de los Datos",
    body: [
      "No cesión: los datos contenidos en el servidor del Banco de La Placeta jamás serán vendidos, cedidos ni expuestos a terceras empresas o entidades ajenas a la Asociación.",
      "Medidas técnicas: la información viaja cifrada mediante protocolos seguros TLS 1.3 y las contraseñas se almacenan mediante funciones hash criptográficas de un solo sentido. El API Gateway y los SDK de pago externos aíslan las contraseñas de los usuarios para evitar filtraciones hacia comercios afiliados."
    ]
  }
];

export default function PrivacyPage() {
  return (
    <main className="legal-page">
      <header className="legal-hero">
        <span>Banco de La Placeta</span>
        <h1>Política de Privacidad y Protección de Datos</h1>
        <p>Última actualización: 17 de mayo de 2026</p>
      </header>
      <section className="legal-content">
        <article className="legal-warning">
          <strong>Compromiso RGPD y LOPDGDD</strong>
          <p>La Asociación Grupo de La Placeta aplica la normativa europea y española de protección de datos. Las disposiciones de datos reales prevalecen sobre cualquier regla interna en caso de conflicto.</p>
        </article>
        {sections.map((section) => (
          <article key={section.title}>
            <h2>{section.title}</h2>
            {section.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </article>
        ))}
      </section>
      <footer className="legal-footer">
        <a href="/">Volver al inicio</a>
        <a href="/terminos-y-condiciones">Términos y Condiciones</a>
      </footer>
    </main>
  );
}
