import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Banco Placeta | Banca digital para pagos, tarjetas y gestión financiera",
  description: "Banco Placeta reúne pagos digitales, Placezum, tarjetas, cuentas y gestión administrativa en una plataforma web clara y segura.",
  applicationName: "Banco Placeta",
  keywords: ["Banco Placeta", "banca digital", "Placezum", "pagos digitales", "fintech"],
  icons: {
    icon: "/logo.png",
    apple: "/logo.png"
  },
  openGraph: {
    title: "Banco Placeta",
    description: "Banca digital para pagos, tarjetas, cuentas y gestión financiera.",
    siteName: "Banco Placeta",
    images: [{ url: "/logo.png", width: 512, height: 512, alt: "Banco Placeta" }],
    locale: "es_ES",
    type: "website"
  },
  twitter: {
    card: "summary",
    title: "Banco Placeta",
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
      <body>{children}</body>
    </html>
  );
}
