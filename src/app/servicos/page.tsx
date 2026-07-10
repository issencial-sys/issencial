import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import FadeIn from "@/components/ui/FadeIn";
import { ArrowRight } from "lucide-react";
import { services } from "@/data/services";

export const metadata: Metadata = {
  title: "Serviços — Issencial | Soluções Completas",
  description:
    "Oferecemos uma gama integrada de serviços desenhados para simplificar a sua vida em qualquer parte do mundo: passaportes, educação na Europa, transferências internacionais e serviços administrativos.",
  openGraph: {
    title: "Serviços — Issencial | Soluções Completas",
    description:
      "Oferecemos uma gama integrada de serviços desenhados para simplificar a sua vida em qualquer parte do mundo.",
    type: "website",
    locale: "pt_PT",
    siteName: "Issencial",
    images: [{ url: "/og-image.svg", width: 1200, height: 630, type: "image/svg+xml" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Serviços — Issencial | Soluções Completas",
    description:
      "Oferecemos uma gama integrada de serviços desenhados para simplificar a sua vida em qualquer parte do mundo.",
    images: ["/og-image.svg"],
  },
};

const serviceIcons: Record<string, string> = {
  "tratamento-passaporte": "/assets/icons/pasta-ficheiro.png",
  "educacao-europa": "/assets/icons/licencitura.png",
  "transferencias": "/assets/icons/dinheiro-dolar.png",
  "servicos-administrativos": "/assets/icons/correcto.png",
};

const serviceThemes: Record<string, { bgHover: string; shadowHover: string; iconHoverBg: string }> = {
  "tratamento-passaporte": {
    bgHover: "hover:border-primary/20",
    shadowHover: "hover:shadow-xl hover:shadow-primary/20",
    iconHoverBg: "group-hover:bg-accent",
  },
  "educacao-europa": {
    bgHover: "hover:border-accent/20",
    shadowHover: "hover:shadow-xl hover:shadow-accent/10",
    iconHoverBg: "group-hover:bg-white/20",
  },
  "transferencias": {
    bgHover: "hover:border-emerald-400/20",
    shadowHover: "hover:shadow-xl hover:shadow-emerald-900/20",
    iconHoverBg: "group-hover:bg-emerald-500",
  },
  "servicos-administrativos": {
    bgHover: "hover:border-blue-400/20",
    shadowHover: "hover:shadow-xl hover:shadow-blue-900/20",
    iconHoverBg: "group-hover:bg-blue-500",
  },
};

const steps = [
  { num: "1", icon: "/assets/icons/telefone.png", title: "Contacto", desc: "Entre em contacto connosco e conte-nos a sua necessidade.", benefit: "Sem compromisso" },
  { num: "2", icon: "/assets/icons/pesquisa.png", title: "Análise", desc: "Analisamos o seu caso e propomos a melhor solução.", benefit: "Proposta em 48h" },
  { num: "3", icon: "/assets/icons/acompanhar-grupo.png", title: "Execução", desc: "Cuidamos de cada etapa do processo com dedicação.", benefit: "Acompanhamento total" },
  { num: "4", icon: "/assets/icons/bandeira.png", title: "Conclusão", desc: "Garantimos a conclusão bem-sucedida e ficamos disponíveis.", benefit: "Suporte contínuo" },
];

export default function ServicosPage() {
  return (
    <>
      <Header />
      <main>
        {/* Header */}
        <section className="relative bg-primary py-28 min-h-[75vh] overflow-hidden flex flex-col items-center justify-center">
          <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_25%_25%,#d7de6a_1px,transparent_1px),radial-gradient(circle_at_75%_75%,#d7de6a_1px,transparent_1px)] bg-[length:60px_60px]" />
          <div className="relative z-10 mx-auto max-w-2xl px-4 sm:px-6 lg:px-10 text-center">
            <FadeIn delay={0.1}>
              <Badge variant="accent">Os Nossos Serviços</Badge>
            </FadeIn>
            <FadeIn delay={0.2}>
              <h1 className="mt-6 text-3xl md:text-5xl font-bold text-white leading-tight">Soluções completas para cada necessidade</h1>
            </FadeIn>
            <FadeIn delay={0.3}>
              <p className="mt-6 text-lg md:text-xl text-white/70 max-w-xl mx-auto">Oferecemos uma gama integrada de serviços desenhados para simplificar a sua vida em qualquer parte do mundo.</p>
            </FadeIn>
          </div>
        </section>

        {/* Services */}
        <section className="py-20 md:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {services.map((s, idx) => {
                const theme = serviceThemes[s.slug];
                const isFirst = idx === 0;

                return (
                  <div
                    key={s.title}
                    className={`group relative rounded-2xl border bg-primary p-8 transition-all duration-300 hover:-translate-y-1 overflow-hidden ${
                      theme?.bgHover || "hover:border-primary/20"
                    } ${theme?.shadowHover || "hover:shadow-xl hover:shadow-primary/20"}`}
                  >
                    {/* Recommended badge */}
                    {isFirst && (
                      <div className="absolute top-4 right-4 z-10">
                        <span className="inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                          ★ Mais Pedido
                        </span>
                      </div>
                    )}

                    {/* Hover line */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-accent scale-x-0 origin-left transition-transform duration-500 ease-out group-hover:scale-x-100" />

                    {/* Icon */}
                    <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-accent/10 mb-5 transition-all duration-300 group-hover:bg-accent">
                      <div
                        className="h-7 w-7 bg-accent"
                        role="img"
                        aria-label={s.title}
                        style={{
                          maskImage: `url(${serviceIcons[s.slug] || "/assets/icons/www.png"})`,
                          maskSize: "contain",
                          maskRepeat: "no-repeat",
                          WebkitMaskImage: `url(${serviceIcons[s.slug] || "/assets/icons/www.png"})`,
                          WebkitMaskSize: "contain",
                          WebkitMaskRepeat: "no-repeat",
                        }}
                      />
                    </div>

                    <h3 className="text-xl font-semibold text-white mb-3">{s.title}</h3>
                    <p className="text-white/70 leading-relaxed mb-4">{s.description}</p>

                    {/* Features with varied icons */}
                    <ul className="flex flex-col gap-2.5 mb-6">
                      {s.features.slice(0, 3).map((f) => (
                        <li key={f} className="flex items-start gap-2.5 text-sm text-white/60">
                          <div
                            className="flex-shrink-0 mt-0.5 h-[18px] w-[18px] bg-accent"
                            style={{
                              maskImage: `url(${serviceIcons[s.slug] || "/assets/icons/www.png"})`,
                              maskSize: "contain",
                              maskRepeat: "no-repeat",
                              WebkitMaskImage: `url(${serviceIcons[s.slug] || "/assets/icons/www.png"})`,
                              WebkitMaskSize: "contain",
                              WebkitMaskRepeat: "no-repeat",
                            }}
                          />
                          <span>{f}</span>
                        </li>
                      ))}
                      {s.features.length > 3 && (
                        <li>
                          <a
                            href={`/servicos/${s.slug}`}
                            className="inline-flex items-center gap-2.5 text-sm text-accent/70 hover:text-accent transition-colors"
                          >
                            <span className="flex items-center justify-center w-[15px] text-center text-[11px] font-semibold">+{s.features.length - 3}</span>
                            <span>Ver detalhes completos →</span>
                          </a>
                        </li>
                      )}
                    </ul>

                    <div className="flex flex-wrap gap-3">
                      <Button href="/contacto" size="sm">Solicitar Orçamento</Button>
                      <Button href={`/servicos/${s.slug}`} variant="outline-light" size="sm">Ver Detalhes</Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Process */}
        <section className="bg-primary py-20 md:py-28 text-white overflow-hidden">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <Badge variant="accent">Como Trabalhamos</Badge>
              <h2 className="mt-4 text-3xl font-bold text-white">Um processo simples e transparente</h2>
              <p className="mt-4 text-white/50 max-w-md mx-auto">Da primeira conversa à conclusão, estamos consigo em cada etapa.</p>
            </div>

            {/* Desktop: horizontal timeline with connectors */}
            <div className="relative hidden md:block">
              {/* Connector line */}
              <div className="absolute top-[44px] left-[8%] right-[8%] h-px bg-gradient-to-r from-accent/10 via-accent/30 to-accent/10" />

              <div className="grid grid-cols-4 gap-6 relative">
                {steps.map((s, i) => {
                  return (
                    <div key={s.num} className="text-center group">
                      {/* Step number + icon */}
                      <div className="relative mx-auto mb-6">
                        <div className="mx-auto flex h-[88px] w-[88px] items-center justify-center rounded-full bg-primary border-2 border-accent/20 transition-all duration-500 group-hover:border-accent/60 relative z-10">
                          <div
                            className="h-8 w-8 bg-accent transition-all duration-500 group-hover:scale-110"
                            role="img"
                            aria-label={s.title}
                            style={{
                              maskImage: `url(${s.icon})`,
                              maskSize: "contain",
                              maskRepeat: "no-repeat",
                              WebkitMaskImage: `url(${s.icon})`,
                              WebkitMaskSize: "contain",
                              WebkitMaskRepeat: "no-repeat",
                            }}
                          />
                        </div>
                        {/* Pulse ring on hover */}
                        <div className="absolute inset-0 mx-auto h-[88px] w-[88px] rounded-full bg-accent/5 scale-0 transition-transform duration-500 group-hover:scale-150" />
                      </div>

                      <h4 className="text-lg font-semibold text-white mb-2">{s.title}</h4>
                      <p className="text-sm text-white/50 leading-relaxed mb-2">{s.desc}</p>
                      <span className="inline-block rounded-full bg-accent/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-accent">
                        {s.benefit}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Mobile: vertical timeline */}
            <div className="relative md:hidden">
              <div className="absolute top-0 left-[39px] h-full w-px bg-accent/15" />
              <div className="flex flex-col gap-10">
                {steps.map((s, i) => {
                  return (
                    <div key={s.num} className="flex gap-5 relative group">
                      <div className="flex h-[78px] w-[78px] shrink-0 items-center justify-center rounded-full bg-primary border-2 border-accent/20 transition-all duration-300 group-hover:border-accent/60 z-10">
                        <div
                          className="h-7 w-7 bg-accent"
                          role="img"
                          aria-label={s.title}
                          style={{
                            maskImage: `url(${s.icon})`,
                            maskSize: "contain",
                            maskRepeat: "no-repeat",
                            WebkitMaskImage: `url(${s.icon})`,
                            WebkitMaskSize: "contain",
                            WebkitMaskRepeat: "no-repeat",
                          }}
                        />
                      </div>
                      <div className="pt-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-accent/60">Passo {s.num}</span>
                          <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent">
                            {s.benefit}
                          </span>
                        </div>
                        <h4 className="text-base font-semibold text-white mb-1">{s.title}</h4>
                        <p className="text-sm text-white/50">{s.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
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
