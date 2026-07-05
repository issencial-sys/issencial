import Image from "next/image";
import Badge from "@/components/ui/Badge";

const reasons = [
  {
    icon: "/assets/icons/certo.webp",
    title: "Eficiência & Agilidade",
    description: "Processos otimizados que poupan o seu tempo e garantem resultados rápidos.",
  },
  {
    icon: "/assets/icons/balanca-justica.webp",
    title: "Segurança & Confiança",
    description: "Cada processo é tratado com o máximo profissionalismo e sigilo.",
  },
  {
    icon: "/assets/icons/mapa-mundial.webp",
    title: "Alcance Global",
    description: "Presença em mais de 30 países, conectando-o a oportunidades em qualquer lugar.",
  },
];

export default function WhyIssencial() {
  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <div>
            <Badge>Porquê a Issencial?</Badge>
            <h2 className="mt-4 text-3xl font-bold md:text-4xl">
              Uma sociedade da qual pode<br />
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">confiar</span>
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-gray-500">
              Construímos relações sólidas e duradouras, sendo o parceiro de confiança que simplifica processos e conecta pessoas a oportunidades no mundo todo.
            </p>
            <div className="mt-8 flex flex-col gap-6">
              {reasons.map((reason) => (
                <div key={reason.title} className="flex items-start gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-accent/15 text-primary">
                    <Image src={reason.icon} alt={reason.title} width={24} height={24} />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold mb-1">{reason.title}</h4>
                    <p className="text-gray-500 text-sm leading-relaxed">{reason.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right - Mission Card */}
          <div className="relative rounded-3xl bg-primary p-10 overflow-hidden">
            <div className="absolute top-[-50px] right-[-50px] w-[200px] h-[200px] bg-[radial-gradient(circle,rgba(215,222,106,0.2),transparent)] rounded-full" />
            <div className="relative z-10">
              <h3 className="text-xl font-semibold text-accent mb-6">A nossa missão</h3>
              <p className="text-lg leading-relaxed text-white/90 italic">
                &ldquo;Ser a sociedade de confiança à qual recorrem para cuidar dos seus processos e concretizar seus objetivos, em qualquer parte do mundo.&rdquo;
              </p>
              <div className="mt-8 pt-6 border-t border-white/10">
                <div className="font-semibold text-white">Issencial</div>
                <div className="text-sm text-white/50 mt-1">Serviços Integrados Globais</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
