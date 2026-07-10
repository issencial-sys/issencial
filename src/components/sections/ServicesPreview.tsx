import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import SectionHeader from "@/components/ui/SectionHeader";

interface ServiceItem {
  icon: string;
  title: string;
  description: string;
  slug?: string;
}

const services: ServiceItem[] = [
  {
    icon: "/assets/icons/pasta-ficheiro.webp",
    title: "Tratamento de Passaporte",
    description: "Apoio especializado no tratamento de passaportes, com acompanhamento completo na preparação da documentação e verificação de requisitos.",
    slug: "tratamento-passaporte",
  },
  {
    icon: "/assets/icons/licenciatura.webp",
    title: "Educação na Europa",
    description: "Inscrições em escolas e universidades europeias com acompanhamento personalizado em cada etapa.",
    slug: "educacao-europa",
  },
  {
    icon: "/assets/icons/dinheiro-dolar.webp",
    title: "Transferências Internacionais",
    description: "Serviços de transferência financeira internacionais seguros, rápidos e com as melhores taxas.",
    slug: "transferencias",
  },
  {
    icon: "/assets/icons/pasta-ficheiro.webp",
    title: "Serviços Administrativos",
    description: "Gestão completa de processos burocráticos e documentais, poupando-lhe tempo e garantindo conformidade.",
    slug: "servicos-administrativos",
  },
  {
    icon: "/assets/icons/acompanhar-grupo.png",
    title: "Consultoria Personalizada",
    description: "Aconselhamento estratégico à medida, analisando as suas necessidades e propondo as melhores soluções.",
  },
  {
    icon: "/assets/icons/lista.webp",
    title: "Gestão de Processos",
    description: "Acompanhamento integral de processos complexos, coordenando cada etapa com eficiência e dedicação.",
  },
];

const cardVariants = [
  { bg: "bg-neutral", line: "bg-accent", isDark: false }, // cinza
  { bg: "bg-accent", line: "bg-primary", isDark: false }, // verde claro (linha verde escuro p/ contraste)
  { bg: "bg-primary", line: "bg-accent", isDark: true }, // verde escuro
];

export default function ServicesPreview() {
  return (
    <section className="py-20 md:py-28 bg-light">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <SectionHeader
          badge="Os Nossos Serviços"
          title={<>Soluções integradas para cada necessidade</>}
          description="Oferecemos uma gama completa de serviços desenhados para simplificar a sua vida e conectar-lhe a oportunidades no mundo todo."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {services.map((service, index) => {
            const variant = cardVariants[index % cardVariants.length];

            return (
              <div
                key={service.title}
                className={`group relative overflow-hidden rounded-2xl cursor-pointer transition-transform duration-300 hover:scale-[1.015] min-h-[210px] sm:min-h-[200px] ${variant.bg}`}
              >
                {/* Content overlay */}
                <div className="relative z-10 flex h-full flex-col items-start justify-center gap-1.5 px-[7%] py-5">
                  {/* Hover line — começa no canto superior esquerdo e percorre até ao canto superior direito */}
                  <div className={`absolute top-0 left-0 right-0 h-[3px] ${variant.line} scale-x-0 origin-left transition-transform duration-500 ease-out group-hover:scale-x-100`} />

                  {/* Icon */}
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-lg ${
                      variant.isDark ? "bg-white/10" : "bg-black/5"
                    } mb-1 flex-shrink-0`}
                  >
                    <Image
                      src={service.icon}
                      alt={service.title}
                      width={26}
                      height={26}
                      style={{ width: "auto", height: "auto" }}
                      className={variant.isDark ? "brightness-0 invert" : ""}
                    />
                  </div>

                  {/* Title + Arrow */}
                  <div className="flex items-center gap-1.5 w-full">
                    <h3
                      className={`text-sm sm:text-base font-semibold leading-tight ${
                        variant.isDark ? "text-white" : "text-primary"
                      }`}
                    >
                      {service.title}
                    </h3>
                    {service.slug && (
                      <ArrowRight size={14} className="text-accent-dark opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 flex-shrink-0" />
                    )}
                  </div>

                  {/* Description */}
                  <p
                    className={`text-xs sm:text-[13px] leading-relaxed ${
                      variant.isDark ? "text-white/70" : "text-gray-500"
                    }`}
                  >
                    {service.description}
                  </p>

                  {/* Bottom CTA (decorative — whole card is the link) */}
                  {service.slug && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-[#bcc44e] opacity-0 translate-y-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
                      Ver Detalhes
                      <ArrowRight size={12} />
                    </span>
                  )}

                  {/* Full-card link overlay */}
                  {service.slug && (
                    <Link
                      href={`/servicos/${service.slug}`}
                      className="absolute inset-0 z-20"
                      aria-label={`Ver detalhes de ${service.title}`}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
