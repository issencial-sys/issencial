import Image from "next/image";
import Link from "next/link";
import SectionHeader from "@/components/ui/SectionHeader";
import ChevronCard from "@/components/ui/ChevronCard";

interface ServiceItem {
  icon: string;
  title: string;
  description: string;
  color: string;
}

const services: ServiceItem[] = [
  {
    icon: "/assets/icons/viagem-aviao.webp",
    title: "Viagens & Turismo",
    description: "Planeamento, reservas e assessoria de viagens internacionais com soluções completas para cada destino.",
    color: "#e8e9e4",
  },
  {
    icon: "/assets/icons/licenciatura.webp",
    title: "Educação na Europa",
    description: "Inscrições em escolas e universidades europeias com acompanhamento personalizado em cada etapa.",
    color: "#d7de6a",
  },
  {
    icon: "/assets/icons/dinheiro-dolar.webp",
    title: "Transferências Internacionais",
    description: "Serviços de transferência financeira internacionais seguros, rápidos e com as melhores taxas.",
    color: "#d7de6a",
  },
  {
    icon: "/assets/icons/pasta-ficheiro.webp",
    title: "Serviços Administrativos",
    description: "Gestão completa de processos burocráticos e documentais, poupando-lhe tempo e garantindo conformidade.",
    color: "#e8e9e4",
  },
  {
    icon: "/assets/icons/rosto.webp",
    title: "Consultoria Personalizada",
    description: "Aconselhamento estratégico à medida, analisando as suas necessidades e propondo as melhores soluções.",
    color: "#e8e9e4",
  },
  {
    icon: "/assets/icons/lista.webp",
    title: "Gestão de Processos",
    description: "Acompanhamento integral de processos complexos, coordenando cada etapa com eficiência e dedicação.",
    color: "#d7de6a",
  },
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
          {services.map((service) => {
            const isDark = service.color === "#3a5a40";

            return (
              <ChevronCard
                key={service.title}
                color={service.color}
                className="group overflow-hidden cursor-pointer transition-transform duration-300 hover:scale-[1.015] max-lg:min-h-[150px]"
                contentClassName="flex-col items-start justify-center gap-1.5 max-lg:py-3 py-4"
              >
                {/* Hover line — anima da esquerda para a direita */}
                <div className="absolute top-0 h-[3px] bg-accent scale-x-0 origin-left transition-transform duration-500 ease-out group-hover:scale-x-100" style={{ left: '3.7%', width: '79.6%' }} />

                {/* Icon */}
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-lg ${
                    isDark ? "bg-white/10" : "bg-black/5"
                  } mb-1`}
                >
                  <Image
                    src={service.icon}
                    alt={service.title}
                    width={26}
                    height={26}
                    style={{ width: "auto", height: "auto" }}
                    className={isDark ? "brightness-0 invert" : ""}
                  />
                </div>

                {/* Title */}
                <h3
                  className={`text-sm sm:text-base font-semibold leading-tight ${
                    isDark ? "text-white" : "text-primary"
                  }`}
                >
                  {service.title}
                </h3>

                {/* Description */}
                <p
                  className={`text-xs sm:text-[13px] leading-relaxed ${
                    isDark ? "text-white/70" : "text-gray-500"
                  }`}
                >
                  {service.description}
                </p>

                {/* Link */}
                <Link
                  href="/servicos"
                  className={`text-xs font-medium mt-0.5 transition-opacity hover:opacity-80 ${
                    isDark ? "text-accent" : "text-primary"
                  }`}
                >
                  Saber mais →
                </Link>
              </ChevronCard>
            );
          })}
        </div>
      </div>
    </section>
  );
}
