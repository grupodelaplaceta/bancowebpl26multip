import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Banco de La Placeta",
  description: "Banca web, artículos y servicios digitales del Grupo de La Placeta."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>
        <header className="topbar">
          <Link className="brand" href="/">
            <span className="brandMark">B</span>
            <span>Banco de La Placeta</span>
          </Link>
          <nav>
            <Link href="/#articulos">Artículos</Link>
            <Link href="/web">Banca web</Link>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
