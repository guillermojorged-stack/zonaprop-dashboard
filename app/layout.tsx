import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Propiedades Zonaprop",
  description: "Listado de propiedades scrapeadas de Zonaprop",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
