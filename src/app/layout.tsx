import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ArmorCRA — Score de conformité Cyber Resilience Act 2026",
  description: "Vérifiez la conformité CRA de votre produit en 60 secondes. Score gratuit, articles violés, risque financier estimé.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="fr"><body>{children}</body></html>;
}
