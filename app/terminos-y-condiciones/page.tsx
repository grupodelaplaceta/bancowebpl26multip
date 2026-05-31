const sections = [
  {
    title: "1. Naturaleza del Servicio y exención bancaria real",
    body: [
      "El Banco de La Placeta y todas sus herramientas (en adelante, la Plataforma) son propiedad de la Asociación Grupo de La Placeta, una entidad sin ánimo de lucro constituida al amparo de la Ley Orgánica 1/2002.",
      "DECLARACIÓN DE SIMULACIÓN CRÍTICA: La Plataforma opera única y exclusivamente como un entorno de simulación, juego de rol y gestión interna. Las Placetas (Pz), IBAN GDLP, tarjetas, nóminas, tributos y documentos generados son elementos ficticios sin valor económico real ni validez bancaria, laboral, fiscal o financiera fuera del ecosistema de La Placeta.",
      "La Plataforma no es una entidad de crédito, entidad de pago, proveedor de servicios de inversión, asesor fiscal ni intermediario financiero. No capta depósitos, no custodia dinero real, no concede crédito real y no permite canje, compraventa o retirada de Placetas por euros u otra moneda."
    ]
  },
  {
    title: "2. Identidad Digital y Acceso (PlacetaID / DIP)",
    body: [
      "Para utilizar la Plataforma es obligatorio disponer de un Documento de Identidad de La Placeta (DIP). El acceso se realiza mediante dicho código identificador y una contraseña personal e intransferible.",
      "El usuario es el único responsable de custodiar sus credenciales. El sistema registrará la dirección IP de cada inicio de sesión por motivos de auditoría y seguridad interna."
    ]
  },
  {
    title: "3. Clasificación de Cuentas y Límites Operativos Dinámicos",
    body: [
      "El sistema aplica restricciones y capacidades automáticas en función de la edad verificada del participante, los cuales pueden ser modificados en tiempo real desde el Panel de Administración de la Junta.",
      "Junior Básica (<16 años): límite de saldo total de 500 Pz y tope de transferencia diaria de 50 Pz. Excluidos de la RBU.",
      "Junior Senior (16-17 años): límite de saldo total de 1.000 Pz y tope de transferencia diaria de 100 Pz. Acceso a reclamación de RBU.",
      "Ciudadanía Plena (18+ años): límite de saldo total ordinario de 500.000 Pz, sujeto a baremos del Panel Admin. Acceso total a las funciones del banco."
    ]
  },
  {
    title: "4. Gobernanza económica y fiscalidad interna de rol",
    body: [
      "Al operar en la Plataforma, el usuario acepta de manera automática la aplicación de las reglas del Tesoro y la Agencia Tributaria de La Placeta.",
      "Tasas y comisiones: las transferencias interbancarias e interpersonales devengarán una tasa operativa automática de hasta el 12%.",
      "IVA: todas las transacciones comerciales orientadas a perfiles de Empresa o Asociación aplicarán y desglosarán un 12% de IVA obligatorio en sus facturas virtuales.",
      "Control de Acumulación (IRM): las cuentas que superen un Índice de Acumulación (IA) de 0,30 podrán verse sujetas al Impuesto de Regulación Monetaria: 5% para particulares, 6% para cuentas compartidas y 9% para empresas.",
      "Bloqueos cautelares: la Agencia Tributaria de La Placeta podrá bloquear preventivamente cualquier cuenta particular que exceda 500.000 Pz, o 10.000.000 Pz en cuentas institucionales, hasta aportar justificación interna del origen de fondos."
    ]
  },
  {
    title: "5. Módulo de inversiones con azar y loterías",
    body: [
      "El mercado de inversiones aleatorias con resolución a un (1) minuto queda estrictamente restringido a usuarios mayores de 18 años (Ciudadanía Plena).",
      "Los resultados de las inversiones, sean pérdidas o ganancias, son generados por un algoritmo probabilístico aleatorio del backend. Los beneficios netos obtenidos están sujetos a una retención fiscal inmediata del 10%.",
      "El usuario acepta el riesgo de pérdida total de sus Placetas simuladas al participar en este módulo."
    ]
  },
  {
    title: "6. Documentos, nóminas, PDFs e IBAN GDLP",
    body: [
      "Los PDFs, justificantes, certificados de solvencia, altas laborales, nóminas, recibos fiscales e IBAN GDLP se emiten únicamente como documentos internos de rol y trazabilidad técnica.",
      "Estos documentos no sustituyen contratos laborales reales, nóminas reales, facturas fiscales, certificados bancarios, justificantes de pago legalmente exigibles ni comunicaciones oficiales ante administraciones públicas.",
      "Las cuentas creadas desde web generan IBAN web en formato GDLP interno. Las cuentas creadas desde app pueden usar otro formato interno compatible. Ambos formatos son identificadores ficticios de la Plataforma."
    ]
  },
  {
    title: "7. Programa BETA Android",
    body: [
      "La inscripción al Programa BETA Android solo permite recibir comunicaciones sobre pruebas del APK de la app. La participación es voluntaria, revocable y no garantiza disponibilidad inmediata, compatibilidad del dispositivo ni acceso permanente.",
      "El usuario se compromete a no redistribuir APKs, credenciales, capturas privadas o información técnica no pública sin autorización expresa de la Asociación.",
      "La Asociación podrá cerrar, pausar o modificar la beta por seguridad, estabilidad, protección de datos o mantenimiento del servicio."
    ]
  },
  {
    title: "8. Protección de menores, uso responsable y suspensión",
    body: [
      "Las funciones sensibles quedan sujetas a edad verificada, rol, consentimiento y límites operativos. La Asociación podrá restringir cuentas ante uso abusivo, suplantación, fraude, acoso, vulneración de privacidad o intento de convertir activos ficticios en valor real.",
      "El usuario debe utilizar datos propios o autorizados. Está prohibido registrar teléfonos, correos o información personal de terceros sin legitimación suficiente."
    ]
  }
];

export default function TermsPage() {
  return (
    <main className="legal-page">
      <header className="legal-hero">
        <span>Banco de La Placeta</span>
        <h1>Términos y Condiciones de Uso</h1>
        <p>Última actualización: 31 de mayo de 2026</p>
      </header>
      <section className="legal-content">
        <article className="legal-warning">
          <strong>Entorno de simulación</strong>
          <p>Banco de La Placeta es una plataforma de rol. Las Placetas (Pz), IBAN GDLP, tarjetas, nóminas y PDFs son ficticios y no tienen valor económico real ni validez bancaria oficial.</p>
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
        <a href="/politica-de-privacidad">Política de Privacidad</a>
      </footer>
    </main>
  );
}
