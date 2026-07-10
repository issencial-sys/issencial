import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Badge from "@/components/ui/Badge";
import FadeIn from "@/components/ui/FadeIn";
import IconRenderer from "@/components/ui/IconRenderer";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import Button from "@/components/ui/Button";
import Stats from "@/components/sections/Stats";

const values = [
  { icon: "/assets/icons/protecao-escudo-seguranca.png", title: "Confiança", desc: "Construímos relações sólidas baseadas na transparência, honestidade e cumprimento de promessas." },
  { icon: "/assets/icons/relogio.png", title: "Eficiência", desc: "Otimizamos cada processo para oferecer resultados rápidos e de qualidade, poupando tempo aos nossos clientes." },
  { icon: "heart", title: "Dedicação", desc: "Cada cliente é único. Oferecemos atenção personalizada e cuidamos de cada detalhe com profissionalismo." },
];

const milestones = [
  { year: "2008", icon: "/assets/icons/mapa-mundial.webp", title: "Fundação", desc: "A Issencial é fundada com a missão de simplificar processos e conectar pessoas a oportunidades." },
  { year: "2012", icon: "target", title: "Expansão", desc: "Abertura de escritórios em mais 3 países europeus, alargando a rede de parceiros." },
  { year: "2018", icon: "/assets/icons/acompanhar-grupo.png", title: "+2.000 Clientes", desc: "Alcançamos a marca de 2.000 clientes satisfeitos em mais de 20 países." },
  { year: "2024", icon: "heart", title: "Plataforma Digital", desc: "Lançamento do portal do cliente e dashboard administrativo para acompanhamento em tempo real." },
];

export default function SobrePage() {
  return (
    <>
      <Header />
      <main>
        <section className="relative bg-primary py-28 min-h-[75vh] overflow-hidden flex flex-col items-center justify-center">
          <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_25%_25%,#d7de6a_1px,transparent_1px),radial-gradient(circle_at_75%_75%,#d7de6a_1px,transparent_1px)] bg-[length:60px_60px]" />
          <div className="relative z-10 mx-auto max-w-2xl px-4 sm:px-6 lg:px-10 text-center">
            <FadeIn delay={0.1}>
              <Badge variant="accent">Sobre Nós</Badge>
            </FadeIn>
            <FadeIn delay={0.2}>
              <h1 className="mt-6 text-3xl md:text-5xl font-bold text-white leading-tight">A sua sociedade de confiança</h1>
            </FadeIn>
            <FadeIn delay={0.3}>
              <p className="mt-6 text-lg md:text-xl text-white/70 max-w-xl mx-auto">Conheça a história, missão e valores que guiam a Issencial todos os dias.</p>
            </FadeIn>
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
              <div className="relative bg-gradient-to-br from-primary via-primary-light to-dark rounded-3xl aspect-[4/3] flex items-center justify-center overflow-hidden shadow-[0_20px_60px_rgba(0,46,53,0.15)]">
                {/* Dot pattern */}
                <div className="absolute inset-0 opacity-[0.06] bg-[radial-gradient(circle_at_20%_30%,#d7de6a_1px,transparent_1px),radial-gradient(circle_at_80%_70%,#d7de6a_1px,transparent_1px)] bg-[length:40px_40px]" />

                {/* Decorative circles */}
                <div className="absolute w-[300px] h-[300px] rounded-full border border-accent/10 -top-[100px] -right-[60px]" />
                <div className="absolute w-[200px] h-[200px] rounded-full border border-accent/8 -bottom-[60px] -left-[40px]" />

                <div className="relative z-10 text-center p-8 max-w-[280px]">
                  <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-accent/15 backdrop-blur-sm">
                    <Image src="/logo/principal_branco.png" alt="Issencial" width={48} height={48} className="opacity-90" />
                  </div>
                  <p className="text-white/80 text-lg leading-relaxed font-medium italic">
                    &ldquo;Simplificamos processos. Conectamos oportunidades.&rdquo;
                  </p>
                  <div className="mt-6 pt-5 border-t border-white/10">
                    <div className="flex items-center justify-center gap-2 text-sm text-accent">
                      <Image src="/assets/icons/mapa-mundial.webp" alt="" width={14} height={14} className="brightness-0 saturate-100 [filter:invert(79%)_sepia(18%)_saturate(389%)_hue-rotate(23deg)_brightness(93%)_contrast(87%)]" />
                      <span>Portugal · Europa · Mundo</span>
                    </div>
                  </div>
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
              {values.map((v, i) => (
                <FadeIn key={v.title} delay={i * 0.1}>
                <div className="text-center rounded-2xl border border-gray-100 bg-white p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:bg-primary hover:border-primary group">
                  <div className="mx-auto mb-6 flex h-18 w-18 items-center justify-center rounded-full bg-accent/10 text-primary transition-all group-hover:bg-accent/20">
                    {typeof v.icon === "string" && v.icon.startsWith("/") ? (
                      <Image src={v.icon} alt={v.title} width={32} height={32} className="text-primary" />
                    ) : (
                      <IconRenderer name={v.icon} size={32} className="text-primary" />
                    )}
                  </div>
                  <h3 className="text-xl font-semibold mb-3 transition-colors group-hover:text-white">{v.title}</h3>
                  <p className="text-gray-500 transition-colors group-hover:text-white/70">{v.desc}</p>
                </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 md:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <FadeIn>
                <div className="bg-primary rounded-3xl p-10 text-white">
                  <h3 className="text-xl font-semibold text-accent mb-4">Missão</h3>
                  <p className="text-lg leading-relaxed text-white/85">Ser a sociedade de confiança à qual recorrem para cuidar dos seus processos e concretizar seus objetivos, em qualquer parte do mundo.</p>
                </div>
              </FadeIn>
              <FadeIn delay={0.15}>
                <div className="bg-dark rounded-3xl p-10 text-white">
                  <h3 className="text-xl font-semibold text-accent mb-4">Visão</h3>
                  <p className="text-lg leading-relaxed text-white/85">Ser reconhecida como a parceira de confiança que simplifica processos e conecta pessoas a oportunidades no mundo todo.</p>
                </div>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* Stats */}
        <Stats />

        {/* Timeline — A Nossa História */}
        <section className="py-20 md:py-28 bg-light">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-10">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <Badge>A Nossa Jornada</Badge>
              <h2 className="mt-4 text-3xl font-bold">Marcos da nossa história</h2>
              <p className="mt-4 text-gray-500 max-w-md mx-auto">Desde 2008 que construímos confiança e expandimos horizontes.</p>
            </div>

            {/* Desktop timeline */}
            <div className="relative hidden md:block">
              <div className="absolute top-[44px] left-[8%] right-[8%] h-px bg-gradient-to-r from-primary/10 via-accent/40 to-primary/10" />

              <div className="grid grid-cols-4 gap-6 relative">
                {milestones.map((m, i) => {
                  return (
                    <FadeIn key={m.year} delay={i * 0.1}>
                    <div className="text-center group">
                      <div className="relative mx-auto mb-6">
                        <div className="mx-auto flex h-[88px] w-[88px] items-center justify-center rounded-full bg-white border-2 border-accent/30 transition-all duration-500 group-hover:border-accent group-hover:shadow-[0_0_30px_rgba(215,222,106,0.2)] relative z-10">
                          {typeof m.icon === "string" && m.icon.startsWith("/") ? (
                            <Image src={m.icon} alt={m.title} width={30} height={30} className="text-primary transition-all duration-500 group-hover:scale-110" />
                          ) : (
                            <IconRenderer name={m.icon} size={30} className="text-primary transition-all duration-500 group-hover:scale-110" />
                          )}
                        </div>
                        <div className="absolute inset-0 mx-auto h-[88px] w-[88px] rounded-full bg-accent/5 scale-0 transition-transform duration-500 group-hover:scale-150" />
                      </div>
                      <span className="inline-block mb-2 rounded-full bg-accent/15 px-3 py-1 text-sm font-bold text-accent-dark">
                        {m.year}
                      </span>
                      <h4 className="text-base font-semibold text-primary mb-1">{m.title}</h4>
                      <p className="text-sm text-gray-500 leading-relaxed">{m.desc}</p>
                    </div>
                    </FadeIn>
                  );
                })}
              </div>
            </div>

            {/* Mobile timeline */}
            <div className="relative md:hidden">
              <div className="absolute top-0 left-[39px] h-full w-px bg-accent/20" />
              <div className="flex flex-col gap-10">
                {milestones.map((m, i) => {
                  return (
                    <FadeIn key={m.year} delay={i * 0.1}>
                    <div className="flex gap-5 relative group">
                      <div className="flex h-[78px] w-[78px] shrink-0 items-center justify-center rounded-full bg-white border-2 border-accent/30 transition-all duration-300 group-hover:border-accent z-10">
                        {typeof m.icon === "string" && m.icon.startsWith("/") ? (
                          <Image src={m.icon} alt={m.title} width={28} height={28} className="text-primary" />
                        ) : (
                          <IconRenderer name={m.icon} size={28} className="text-primary" />
                        )}
                      </div>
                      <div className="pt-3">
                        <span className="inline-block mb-1 rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-bold text-accent-dark">
                          {m.year}
                        </span>
                        <h4 className="text-base font-semibold text-primary mb-1">{m.title}</h4>
                        <p className="text-sm text-gray-500">{m.desc}</p>
                      </div>
                    </div>
                    </FadeIn>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-accent py-20 text-center">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
            <h2 className="text-3xl font-bold text-primary mb-4">Vamos trabalhar juntos?</h2>
            <p className="text-lg text-primary/80 mb-8 max-w-xl mx-auto">
              Descubra como a Issencial pode simplificar os seus processos e conectar-lhe a oportunidades em qualquer parte do mundo.
            </p>
            <div className="flex justify-center gap-4 flex-wrap">
              <Button href="/contacto" variant="secondary" size="lg">
                Fale Connosco
                <ArrowRight size={18} />
              </Button>
              <Button href="/servicos" variant="outline" size="lg">
                Conheça os Nossos Serviços
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
