"use client";

import { useParams } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { services } from "@/data/services";
import Image from "next/image";
import { ArrowRight, ChevronDown, Zap, Target } from "lucide-react";
import QuoteForm from "@/components/sections/QuoteForm";
import { useState } from "react";

// Map feature text keywords to specific icon paths for each service
function getFeatureIcon(feature: string, index: number): string {
  const lower = feature.toLowerCase();
  if (lower.includes("doc") || lower.includes("document") || lower.includes("prepara") || lower.includes("certif")) return "/assets/icons/pasta-ficheiro.png";
  if (lower.includes("visto") || lower.includes("consular")) return "/assets/icons/viagem-aviao.png";
  if (lower.includes("pagament") || lower.includes("transf") || lower.includes("câmbio") || lower.includes("moeda") || lower.includes("envio")) return "/assets/icons/dinheiro-dolar.png";
  if (lower.includes("inscri") || lower.includes("matr") || lower.includes("escola") || lower.includes("univers") || lower.includes("estud")) return "/assets/icons/licenciatura.webp";
  if (lower.includes("acompanh") || lower.includes("orient") || lower.includes("gestor") || lower.includes("dedicad")) return "/assets/icons/acompanhar-grupo.png";
  if (lower.includes("praz") || lower.includes("temp") || lower.includes("rápid") || lower.includes("urgen")) return "/assets/icons/relogio.png";
  if (lower.includes("seguran") || lower.includes("confid") || lower.includes("rgpd") || lower.includes("dados")) return "/assets/icons/protecao-escudo-seguranca.png";
  if (lower.includes("efic") || lower.includes("garant")) return "/assets/icons/certo.png";
  if (lower.includes("sucess") || lower.includes("conclu") || lower.includes("aprova")) return "/assets/icons/certo.png";
  // Fallback based on index
  const fallbacks = ["/assets/icons/3-estrelas.png", "/assets/icons/protecao-escudo-seguranca.png", "/assets/icons/relogio.png", "/assets/icons/certo.png", "/assets/icons/pasta-ficheiro.png", "/assets/icons/lista.png"];
  return fallbacks[index % fallbacks.length];
}

// Icons for stats by service
function getStatIcon(statLabel: string): string {
  const lower = statLabel.toLowerCase();
  if (lower.includes("processo") || lower.includes("concluído")) return "/assets/icons/pasta-ficheiro.png";
  if (lower.includes("document") || lower.includes("aprova")) return "/assets/icons/certo.png";
  if (lower.includes("ano") || lower.includes("experiência")) return "/assets/icons/3-estrelas.png";
  if (lower.includes("país") || lower.includes("institui") || lower.includes("europa")) return "/assets/icons/www.png";
  if (lower.includes("taxa") || lower.includes("sucess")) return "/assets/icons/3-estrelas.png";
  if (lower.includes("hora") || lower.includes("temp") || lower.includes("processamento")) return "/assets/icons/relogio.png";
  if (lower.includes("comissão") || lower.includes("oculta")) return "/assets/icons/protecao-escudo-seguranca.png";
  return "/assets/icons/3-estrelas.png";
}

export default function ServicoDetalheContent() {
  const params = useParams();
  const slug = params.slug as string;
  const service = services.find((s) => s.slug === slug);


  if (!service) {
    return (
      <>
        <Header />
        <main className="min-h-screen flex items-center justify-center bg-white pt-24">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-primary mb-4">Serviço não encontrado</h1>
            <p className="text-gray-500 mb-8">O serviço que procura não existe.</p>
            <Button href="/servicos">Ver Todos os Serviços</Button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main>
        {/* ─── HERO FULL ─── */}
        <section className="relative min-h-screen flex items-center bg-primary overflow-hidden">
          {/* Geometric circles */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute w-[600px] h-[600px] rounded-full border border-accent/8 -top-[200px] -right-[100px]" />
            <div className="absolute w-[400px] h-[400px] rounded-full border border-accent/8 -bottom-[100px] -left-[80px]" />
            <div className="absolute w-[200px] h-[200px] rounded-full border border-accent/4 bg-accent/[0.02] top-[30%] right-[15%]" />
          </div>

          {/* Floating service icons (custom PNGs with invert filter for dark bg) */}
          <div className="hidden lg:block absolute inset-0 pointer-events-none">
            <div className="absolute top-[18%] left-[6%] w-16 h-16 rounded-[18px] bg-white/4 backdrop-blur-sm border border-white/6 flex items-center justify-center animate-[float_6s_ease-in-out_infinite]">
              <Image src="/assets/icons/viagem-aviao.png" alt="" width={28} height={28} className="brightness-0 invert opacity-60" />
            </div>
            <div className="absolute top-[60%] left-[4%] w-16 h-16 rounded-[18px] bg-white/4 backdrop-blur-sm border border-white/6 flex items-center justify-center animate-[float_6s_ease-in-out_infinite_1.5s]">
              <Image src="/assets/icons/licenciatura.webp" alt="" width={28} height={28} className="brightness-0 invert opacity-60" />
            </div>
            <div className="absolute top-[25%] right-[6%] w-16 h-16 rounded-[18px] bg-white/4 backdrop-blur-sm border border-white/6 flex items-center justify-center animate-[float_6s_ease-in-out_infinite_3s]">
              <Image src="/assets/icons/dinheiro-dolar.png" alt="" width={28} height={28} className="brightness-0 invert opacity-60" />
            </div>
            <div className="absolute top-[65%] right-[4%] w-16 h-16 rounded-[18px] bg-white/4 backdrop-blur-sm border border-white/6 flex items-center justify-center animate-[float_6s_ease-in-out_infinite_4.5s]">
              <Image src="/assets/icons/www.png" alt="" width={28} height={28} className="brightness-0 invert opacity-60" />
            </div>
          </div>

          {/* Dot pattern */}
          <div className="absolute inset-0 opacity-[0.035] bg-[radial-gradient(circle_at_50%_50%,#d7de6a_1px,transparent_1px)] bg-[length:40px_40px]" />

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-32 lg:py-40 flex flex-col items-center text-center">
            <Badge variant="accent" className="mb-8">Serviço</Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05] text-white mb-5 tracking-tight">
              {service.title}{' '}
              <span className="bg-gradient-to-r from-accent to-accent-light bg-clip-text text-transparent">
                {/* Use accent gradient for part of title if it has & */}
                {service.title.includes("&") ? "— Soluções completas" : "— Soluções integradas"}
              </span>
            </h1>
            <p className="text-lg text-white/55 max-w-[520px] mb-10 leading-relaxed">
              {service.description}
            </p>
            <div className="flex gap-4 flex-wrap justify-center">
              <Button href="/contacto" size="lg" className="shadow-[0_8px_32px_rgba(215,222,106,0.2)] hover:shadow-[0_12px_40px_rgba(215,222,106,0.3)]">
                Solicitar Orçamento
                <ArrowRight size={18} />
              </Button>
              <Button href="/servicos" variant="outline-light" size="lg">
                Todos os Serviços
              </Button>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/30 text-[11px] tracking-[0.1em] uppercase">
            <span>Explorar</span>
            <div className="w-px h-10 bg-gradient-to-b from-white/30 to-transparent animate-pulse" />
          </div>
        </section>

        {/* ─── DETAILS ─── */}
        <section className="py-24 lg:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-16 lg:gap-24 items-start">
              <div>
                <div className="mb-6">
                  <h2 className="text-3xl sm:text-4xl font-bold text-primary mb-3 leading-tight">
                    {service.title}<br /><span className="text-gray-400">sem complicações</span>
                  </h2>
                  <div className="w-10 h-[3px] bg-accent rounded-full mb-6" />
                </div>
                <div className="text-base leading-relaxed text-gray-500 mb-5 space-y-4">
                  {service.longDescription.split('\n\n').map((paragraph, i) => (
                    <p key={i}>{paragraph}</p>
                  ))}
                </div>
                <div className="p-6 rounded-2xl bg-accent/[0.04] border-l-4 border-accent mt-8">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
                      <Image src="/assets/icons/3-estrelas.png" alt="" width={16} height={16} />
                    </div>
                    <h4 className="text-base font-semibold text-primary">Parcerias Exclusivas</h4>
                  </div>
                  <p className="text-sm text-gray-400 leading-relaxed ml-12">{service.highlights[0].description}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="flex flex-col gap-5">
                {service.stats.map((stat) => {
                  const statIcon = getStatIcon(stat.label);
                  // Extract numeric value for visual treatment
                  const numValue = stat.value.replace(/[^0-9.,]/g, '');
                  const suffix = stat.value.replace(/[0-9.,]/g, '');

                  return (
                    <div key={stat.value} className="group p-6 rounded-2xl border border-neutral-light transition-all duration-300 hover:border-accent hover:shadow-[0_8px_24px_rgba(215,222,106,0.08)] hover:-translate-y-0.5 relative overflow-hidden">
                      {/* Hover accent bar */}
                      <div className="absolute top-0 left-0 w-full h-0.5 bg-accent scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100" />

                      <div className="flex items-center gap-5">
                        {/* Icon */}
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-primary transition-all duration-300 group-hover:bg-accent group-hover:text-primary">
                          <Image src={statIcon} alt={stat.label} width={22} height={22} />
                        </div>

                        {/* Value */}
                        <div className="flex-1 min-w-0">
                          <div className="text-3xl font-extrabold text-primary leading-none mb-1">
                            {numValue}
                            {suffix && (
                              <span className="text-accent-dark text-2xl ml-0.5">{suffix}</span>
                            )}
                          </div>
                          <div className="text-sm text-gray-400 leading-tight">{stat.label}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ─── FEATURES TIMELINE ─── */}
        <section className="py-24 lg:py-32 bg-light overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-primary mb-3">O que está incluído</h2>
              <p className="text-base text-gray-400 max-w-[480px] mx-auto">Cada serviço é desenhado para oferecer a melhor experiência possível.</p>
              <div className="w-10 h-[3px] bg-accent rounded-full mx-auto mt-4" />
            </div>

            <div className="max-w-2xl mx-auto relative">
              {/* Timeline line */}
              <div className="absolute top-0 left-7 w-px h-full bg-accent/20 hidden sm:block" />

              <div className="flex flex-col gap-10">
                {service.features.map((feature, i) => {
                  const iconPath = getFeatureIcon(feature, i);
                  return (
                    <div key={feature} className="flex gap-6 relative group">
                      {/* Icon circle */}
                      <div className="w-14 h-14 rounded-full bg-white border-2 border-accent flex items-center justify-center flex-shrink-0 z-10 transition-all duration-500 group-hover:bg-accent group-hover:scale-110 group-hover:shadow-[0_0_24px_rgba(215,222,106,0.3)] relative">
                        <Image src={iconPath} alt="" width={22} height={22} className="text-primary transition-all duration-300 group-hover:text-primary" />
                      </div>
                      <div className="pt-3">
                        <p className="text-base text-gray-500 leading-relaxed">{feature}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ─── LOSS AVERSION / URGENCY MICROCOPY ─── */}
        <section className="py-16 md:py-20 bg-accent/5 border-y border-accent/10">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-10 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/20 text-accent-dark">
                <Image src="/assets/icons/relogio.png" alt="" width={20} height={20} />
              </div>
              <span className="text-sm font-semibold uppercase tracking-widest text-accent-dark">Não espere demasiado</span>
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-primary mb-3">
              {service.slug === "educacao-europa"
                ? "As inscrições para o próximo ano letivo estão a decorrer"
                : service.slug === "tratamento-passaporte"
                ? "Os prazos de emissão podem variar — quanto mais cedo iniciar, melhor"
                : "Garanta o seu lugar e evite contratempos de última hora"}
            </h3>
            <p className="text-base text-gray-500 max-w-lg mx-auto mb-8">
              {service.slug === "educacao-europa"
                ? "As vagas nas melhores instituições são limitadas. Garanta a sua candidatura atempadamente e aumente as suas hipóteses de sucesso."
                : service.slug === "transferencias"
                ? "As taxas de câmbio flutuam diariamente. Bloqueie a taxa ideal agora e evite surpresas."
                : "Cada dia de espera é um dia perdido. A nossa equipa está pronta para começar a tratar do seu processo hoje."}
            </p>
            <Button href="/contacto" size="lg" variant="primary" className="shadow-[0_8px_32px_rgba(215,222,106,0.2)] hover:shadow-[0_12px_40px_rgba(215,222,106,0.3)]">
              Começar Agora
              <ArrowRight size={18} />
            </Button>
          </div>
        </section>

        {/* ─── FAQ ─── */}
        <section className="py-24 lg:py-32 bg-primary">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-10">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">Perguntas frequentes</h2>
              <p className="text-base text-white/50 max-w-[480px] mx-auto">Tire as suas dúvidas sobre este serviço.</p>
              <div className="w-10 h-[3px] bg-accent rounded-full mx-auto mt-4" />
            </div>

            {/* FAQ Items */}
            <div className="space-y-0">
              {service.faq.map((item) => (
                <FaqItem key={item.q} question={item.q} answer={item.a} />
              ))}
            </div>
          </div>
        </section>

        {/* ─── QUOTE FORM ─── */}
        <section className="py-24 lg:py-32">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-10">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-primary mb-3">Solicitar Orçamento</h2>
              <p className="text-base text-gray-400 max-w-[480px] mx-auto">
                Preencha o formulário abaixo e receba um orçamento personalizado para este serviço.
              </p>
              <div className="w-10 h-[3px] bg-accent rounded-full mx-auto mt-4" />
            </div>
            <QuoteForm defaultService={slug} />
          </div>
        </section>
      </main>
      <Footer />


    </>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-white/6 py-5">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 text-left"
      >
        <span className="text-base font-medium text-white">{question}</span>
        <div className={`w-8 h-8 rounded-full border border-white/10 flex items-center justify-center flex-shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`}>
          <ChevronDown size={14} className="text-accent" />
        </div>
      </button>
      {open && (
        <div className="mt-3 text-sm text-white/50 leading-relaxed">
          {answer}
        </div>
      )}
    </div>
  );
}
