import type { Metadata, Viewport } from "next";
import { BANK_SITE_URL } from "../lib/site";
import AccessibilityPanel from "./components/AccessibilityPanel";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(BANK_SITE_URL),
  title: "Banco de La Placeta | Banca digital para pagos, tarjetas y gestión financiera",
  description: "Banco de La Placeta reúne pagos digitales, Placezum, tarjetas, cuentas y gestión administrativa en una plataforma web clara y segura.",
  applicationName: "Banco de La Placeta",
  keywords: ["Banco de La Placeta", "banca digital", "Placezum", "pagos digitales", "fintech"],
  alternates: {
    canonical: "/"
  },
  icons: {
    icon: "/logo.png",
    apple: "/logo.png"
  },
  openGraph: {
    title: "Banco de La Placeta",
    description: "Banca digital para pagos, tarjetas, cuentas y gestión financiera.",
    siteName: "Banco de La Placeta",
    url: BANK_SITE_URL,
    images: [{ url: "/logo.png", width: 512, height: 512, alt: "Banco de La Placeta" }],
    locale: "es_ES",
    type: "website"
  },
  twitter: {
    card: "summary",
    title: "Banco de La Placeta",
    description: "Banca digital clara para pagos, tarjetas y gestión financiera.",
    images: ["/logo.png"]
  }
};

export const viewport: Viewport = {
  themeColor: "#3F00D8",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <AccessibilityPanel />
        <div id="contenido-principal">{children}</div>
      </body>
    </html>
  );
}
