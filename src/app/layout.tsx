import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ArmorCRA — CCPA & Cybersecurity Compliance Scanner",
  description: "Scan your CCPA, SOC2, and FTC compliance in 60 seconds. Free score, violations detected, financial risk estimate.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
