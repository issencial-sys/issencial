import type { Metadata } from "next";
import "./globals.css";
import CookieConsent from "@/components/ui/CookieConsent";
import WhatsAppButton from "@/components/ui/WhatsAppButton";

export const metadata: Metadata = {
  title: "Issencial — Serviços Integrados Globais",
  description:
    "A sua sociedade de confiança para cuidar de processos a todos os níveis — desde viagens e educação até serviços administrativos — em qualquer parte do mundo.",
  keywords: [
    "issencial",
    "serviços integrados",
    "viagens",
    "educação",
    "transferências internacionais",
    "serviços administrativos",
  ],
  openGraph: {
    title: "Issencial — Serviços Integrados Globais",
    description:
      "A sua sociedade de confiança para cuidar de processos a todos os níveis.",
    type: "website",
    locale: "pt_BR",
    siteName: "Issencial",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">
        {children}
        <WhatsAppButton />
        <CookieConsent />
      </body>
    </html>
  );
}
