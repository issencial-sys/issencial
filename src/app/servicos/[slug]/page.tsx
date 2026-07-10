import type { Metadata } from "next";
import { services } from "@/data/services";
import ServicoDetalheContent from "./ServicoDetalheContent";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const service = services.find((s) => s.slug === params.slug);

  if (!service) {
  return {
    title: "Serviço não encontrado — Issencial",
    description: "O serviço que procura não existe.",
    openGraph: {
      title: "Serviço não encontrado — Issencial",
      description: "O serviço que procura não existe.",
      type: "website",
      locale: "pt_PT",
      siteName: "Issencial",
    },
  };
  }

  return {
    title: `${service.title} — Issencial | Soluções Integradas`,
    description: service.description,
    openGraph: {
      title: `${service.title} — Issencial`,
      description: service.description,
      locale: "pt_PT",
      siteName: "Issencial",
      images: [{ url: "/og-image.svg", width: 1200, height: 630, type: "image/svg+xml" }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${service.title} — Issencial`,
      description: service.description,
      images: ["/og-image.svg"],
    },
  };
}

export default function ServicoDetalhePage() {
  return <ServicoDetalheContent />;
}
