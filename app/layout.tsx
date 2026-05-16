import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Banco Placeta",
  description: "Banco Digital de La Placeta en web"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
