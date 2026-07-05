import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Badge from "@/components/ui/Badge";
import Image from "next/image";
import { Clock, Heart } from "lucide-react";

const values = [
  { icon: "/assets/icons/balanca-justica.webp", title: "Confiança", desc: "Construímos relações sólidas baseadas na transparência, honestidade e cumprimento de promessas." },
  { icon: Clock, title: "Eficiência", desc: "Otimizamos cada processo para oferecer resultados rápidos e de qualidade, poupando tempo aos nossos clientes." },
  { icon: Heart, title: "Dedicação", desc: "Cada cliente é único. Oferecemos atenção personalizada e cuidamos de cada detalhe com profissionalismo." },
];

export default function SobrePage() {
  return (
    <>
      <Header />
      <main>
        <section className="relative bg-primary pt-24 pb-16 md:pb-20 overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_25%_25%,#d7de6a_1px,transparent_1px),radial-gradient(circle_at_75%_75%,#d7de6a_1px,transparent_1px)] bg-[length:60px_60px]" />
          <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 text-center max-w-2xl mx-auto">
            <Badge variant="accent">Sobre Nós</Badge>
            <h1 className="mt-4 text-3xl md:text-4xl font-bold text-white">A sua sociedade de confiança</h1>
            <p className="mt-4 text-lg text-white/70">Conheça a história, missão e valores que guiam a Issencial todos os dias.</p>
          </div>
        </section>

        <section className="py-20 md:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <Badge>A Nossa História</Badge>
                <h2 className="mt-4 text-3xl font-bold">Construímos confiança através da dedicação</h2>
                <p className="mt-6 text-lg leading-relaxed text-gray-500">A Issencial nasceu da vontade de criar uma empresa em que as pessoas pudessem confiar para cuidar dos seus processos mais importantes. Com mais de 15 anos de experiência, construímos uma rede global de parceiros e uma equipa dedicada de profissionais.</p>
                <p className="mt-4 text-gray-500 leading-relaxed">Especializámo-nos no cuidado de processos a todos os níveis e ramos — desde viagens e educação até serviços administrativos e transferências internacionais.</p>
              </div>
              <div className="bg-neutral-light rounded-3xl aspect-[4/3] flex items-center justify-center">
                <div className="text-center p-8">
                  <Image src="/assets/icons/mapa-mundial.webp" alt="Mapa Mundial" width={80} height={80} className="mx-auto mb-4 opacity-30" />
                  <p className="text-sm text-gray-400">[Imagem da empresa]</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 md:py-28 bg-light">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <Badge>Os Nossos Valores</Badge>
              <h2 className="mt-4 text-3xl font-bold">O que nos move</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {values.map((v) => (
                <div key={v.title} className="text-center rounded-2xl border border-gray-100 bg-white p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:bg-primary hover:border-primary group">
                  <div className="mx-auto mb-6 flex h-18 w-18 items-center justify-center rounded-full bg-accent/10 text-primary transition-all group-hover:bg-accent/20">
                    {typeof v.icon === "string" ? <Image src={v.icon} alt={v.title} width={32} height={32} /> : <v.icon size={32} />}
                  </div>
                  <h3 className="text-xl font-semibold mb-3 transition-colors group-hover:text-white">{v.title}</h3>
                  <p className="text-gray-500 transition-colors group-hover:text-white/70">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 md:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-primary rounded-3xl p-10 text-white">
                <h3 className="text-xl font-semibold text-accent mb-4">Missão</h3>
                <p className="text-lg leading-relaxed text-white/85">Ser a sociedade de confiança à qual recorrem para cuidar dos seus processos e concretizar seus objetivos, em qualquer parte do mundo.</p>
              </div>
              <div className="bg-dark rounded-3xl p-10 text-white">
                <h3 className="text-xl font-semibold text-accent mb-4">Visão</h3>
                <p className="text-lg leading-relaxed text-white/85">Ser reconhecida como a parceira de confiança que simplifica processos e conecta pessoas a oportunidades no mundo todo.</p>
              </div>
            </div>
          </div>
        </section>


      </main>
      <Footer />
    </>
  );
}
