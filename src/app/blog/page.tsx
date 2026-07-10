import type { Metadata } from "next";
import BlogPageContent from "./BlogPageContent";

export const metadata: Metadata = {
  title: "Blog — Issencial | Guia para Viver sem Fronteiras",
  description:
    "Histórias, guias e conselhos práticos sobre passaportes, educação na Europa, finanças internacionais e tudo o que precisa para simplificar a sua vida. Descubra como viver sem fronteiras.",
  openGraph: {
    title: "Blog — Issencial | Guia para Viver sem Fronteiras",
    description:
      "Histórias, guias e conselhos práticos sobre passaportes, educação na Europa, finanças internacionais e tudo o que precisa para simplificar a sua vida.",
    type: "website",
    images: [{ url: "/og-image.svg", width: 1200, height: 630, type: "image/svg+xml" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog — Issencial | Guia para Viver sem Fronteiras",
    description:
      "Histórias, guias e conselhos práticos sobre passaportes, educação na Europa, finanças internacionais e tudo o que precisa para simplificar a sua vida.",
    images: ["/og-image.svg"],
  },
};

export default function BlogPage() {
  return <BlogPageContent />;
}
