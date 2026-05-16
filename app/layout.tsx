import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Banco de La Placeta | Web Matriz",
  description: "Web matriz, banca online y centro de marca del Banco de La Placeta y su app móvil.",
  icons: {
    icon: "/app-icon.png",
    apple: "/app-icon.png"
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Banco Placeta"
  },
  themeColor: "#3f00d8"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>
        <header className="topbar">
          <Link className="brand" href="/">
            <span className="brandMark"><img src="/app-icon.png" alt="" /></span>
            <span>
              Banco de La Placeta
              <small>Banca web</small>
            </span>
          </Link>
          <nav>
            <Link href="/web">Banca web</Link>
            <Link href="/personas">Personas</Link>
            <Link href="/empresas">Empresas</Link>
            <Link href="/seguridad">Seguridad</Link>
            <Link href="/#articulos">Artículos</Link>
            <Link href="/admin">Admin</Link>
            <Link href="/tributos">Tributos</Link>
          </nav>
        </header>
        {children}
        <footer className="legalFooter">
          <strong>Banco de La Placeta</strong>
          <p>
            Plataforma de simulación de rol sin ánimo de lucro. Las Placetas (Pz) no tienen valor económico real,
            no representan dinero físico ni permiten circulación monetaria fuera del ecosistema ficticio.
          </p>
          <nav>
            <Link href="/normativa">Normativa Unificada</Link>
            <Link href="/seguridad">RGPD / LOPDGDD</Link>
            <Link href="/checkout">Checkout oficial</Link>
          </nav>
        </footer>
      </body>
    </html>
  );
}
