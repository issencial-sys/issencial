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
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/x-icon" },
      { url: "/logo/principal_branco.png", type: "image/png" },
    ],
    apple: [{ url: "/logo/principal_branco.png", type: "image/png" }],
  },
  openGraph: {
    title: "Issencial — Serviços Integrados Globais",
    description:
      "A sua sociedade de confiança para cuidar de processos a todos os níveis — desde viagens e educação até serviços administrativos — em qualquer parte do mundo.",
    type: "website",
    locale: "pt_PT",
    siteName: "Issencial",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        type: "image/svg+xml",
        alt: "Issencial — Serviços Integrados Globais",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Issencial — Serviços Integrados Globais",
    description:
      "A sua sociedade de confiança para cuidar de processos a todos os níveis.",
    images: ["/og-image.svg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-PT" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">
        {children}
        <WhatsAppButton />
        <CookieConsent />
      </body>
    </html>
  );
}
