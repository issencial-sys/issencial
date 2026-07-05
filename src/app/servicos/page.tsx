import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { services } from "@/data/services";

const steps = [
  { num: "1", title: "Contacto", desc: "Entre em contacto connosco e conte-nos a sua necessidade." },
  { num: "2", title: "Análise", desc: "Analisamos o seu caso e propomos a melhor solução." },
  { num: "3", title: "Execução", desc: "Cuidamos de cada etapa do processo com dedicação." },
  { num: "4", title: "Conclusão", desc: "Garantimos a conclusão bem-sucedida e ficamos disponíveis." },
];

export default function ServicosPage() {
  return (
    <>
      <Header />
      <main>
        {/* Header */}
        <section className="relative bg-primary pt-24 pb-16 md:pb-20 overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_25%_25%,#d7de6a_1px,transparent_1px),radial-gradient(circle_at_75%_75%,#d7de6a_1px,transparent_1px)] bg-[length:60px_60px]" />
          <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 text-center max-w-2xl mx-auto">
            <Badge variant="accent">Os Nossos Serviços</Badge>
            <h1 className="mt-4 text-3xl md:text-4xl font-bold text-white">Soluções completas para cada necessidade</h1>
            <p className="mt-4 text-lg text-white/70">Oferecemos uma gama integrada de serviços desenhados para simplificar a sua vida em qualquer parte do mundo.</p>
          </div>
        </section>

        {/* Services */}
        <section className="py-20 md:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {services.map((s) => (
                <div key={s.title} className="group rounded-2xl border border-primary/10 bg-primary p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/20 hover:border-primary/20 overflow-hidden relative">
                  <div className="absolute top-0 left-0 w-full h-1 bg-accent scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100" />
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-white/10 mb-5 transition-all group-hover:bg-accent">
                    <Image src={s.icon} alt={s.title} width={32} height={32} className="brightness-0 invert transition-all duration-300 group-hover:brightness-100 group-hover:invert-0" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">{s.title}</h3>
                  <p className="text-white/70 leading-relaxed mb-4">{s.description}</p>
                  <ul className="flex flex-col gap-2 mb-6">
                    {s.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-white/60">
                        <Image src="/assets/icons/certo.webp" alt="" width={16} height={16} className="flex-shrink-0 brightness-0 invert" /> {f}
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap gap-3">
                    <Button href="/contacto" size="sm">Solicitar Orçamento</Button>
                    <Button href={`/servicos/${s.slug}`} variant="outline-light" size="sm">Ver Detalhes</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Process */}
        <section className="bg-primary py-16 md:py-20 text-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <Badge variant="accent">Como Trabalhamos</Badge>
              <h2 className="mt-4 text-3xl font-bold text-white">Um processo simples e transparente</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {steps.map((s) => (
                <div key={s.num} className="text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/15 text-xl font-bold text-accent">{s.num}</div>
                  <h4 className="text-lg font-semibold text-white mb-2">{s.title}</h4>
                  <p className="text-sm text-white/60">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-accent py-16 text-center">
          <div className="mx-auto max-w-7xl px-4">
            <h2 className="text-3xl font-bold text-primary mb-4">Precisa de ajuda com algum processo?</h2>
            <p className="text-lg text-primary/80 mb-8 max-w-xl mx-auto">A nossa equipa está pronta para o ajudar. Entre em contacto e descubra como podemos simplificar a sua vida.</p>
            <Button href="/contacto" variant="secondary" size="lg">Fale Connosco <ArrowRight size={18} /></Button>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
