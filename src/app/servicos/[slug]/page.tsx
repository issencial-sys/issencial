"use client";

import { useParams } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { services } from "@/data/services";
import { ArrowRight, Plane, GraduationCap, DollarSign, Globe, ChevronDown, Check, Star, Shield, Clock, FileText, Users, Zap, Target, Search, X as XIcon } from "lucide-react";
import QuoteForm from "@/components/sections/QuoteForm";
import { useState, useMemo } from "react";

// Map feature text keywords to specific icons for each service
function getFeatureIcon(feature: string, index: number): typeof Star {
  const lower = feature.toLowerCase();
  if (lower.includes("doc") || lower.includes("document") || lower.includes("prepara") || lower.includes("certif")) return FileText;
  if (lower.includes("visto") || lower.includes("consular")) return Plane;
  if (lower.includes("pagament") || lower.includes("transf") || lower.includes("câmbio") || lower.includes("moeda") || lower.includes("envio")) return DollarSign;
  if (lower.includes("inscri") || lower.includes("matr") || lower.includes("escola") || lower.includes("univers") || lower.includes("estud")) return GraduationCap;
  if (lower.includes("acompanh") || lower.includes("orient") || lower.includes("gestor") || lower.includes("dedicad")) return Users;
  if (lower.includes("praz") || lower.includes("temp") || lower.includes("rápid") || lower.includes("urgen")) return Clock;
  if (lower.includes("seguran") || lower.includes("confid") || lower.includes("rgpd") || lower.includes("dados")) return Shield;
  if (lower.includes("efic") || lower.includes("garant")) return Zap;
  if (lower.includes("sucess") || lower.includes("conclu") || lower.includes("aprova")) return Check;
  // Fallback based on index
  const fallbacks = [Star, Shield, Clock, Check, FileText, Target];
  return fallbacks[index % fallbacks.length];
}

// Icons for stats by service
function getStatIcon(statLabel: string): typeof Star {
  const lower = statLabel.toLowerCase();
  if (lower.includes("processo") || lower.includes("concluído")) return FileText;
  if (lower.includes("document") || lower.includes("aprova")) return Check;
  if (lower.includes("ano") || lower.includes("experiência")) return Star;
  if (lower.includes("país") || lower.includes("institui") || lower.includes("europa")) return Globe;
  if (lower.includes("taxa") || lower.includes("sucess")) return Target;
  if (lower.includes("hora") || lower.includes("temp") || lower.includes("processamento")) return Clock;
  if (lower.includes("comissão") || lower.includes("oculta")) return Shield;
  return Star;
}

export default function ServicoDetalhePage() {
  const params = useParams();
  const slug = params.slug as string;
  const service = services.find((s) => s.slug === slug);

  const [faqSearch, setFaqSearch] = useState("");

  const filteredFaq = useMemo(() => {
    if (!faqSearch.trim()) return service?.faq ?? [];
    const q = faqSearch.toLowerCase();
    return (service?.faq ?? []).filter(
      (item) =>
        item.q.toLowerCase().includes(q) ||
        item.a.toLowerCase().includes(q)
    );
  }, [faqSearch, service?.faq]);

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

          {/* Floating service icons */}
          <div className="hidden lg:block absolute inset-0 pointer-events-none">
            <div className="absolute top-[18%] left-[6%] w-16 h-16 rounded-[18px] bg-white/4 backdrop-blur-sm border border-white/6 flex items-center justify-center animate-[float_6s_ease-in-out_infinite]">
              <Plane size={28} className="text-white/60" />
            </div>
            <div className="absolute top-[60%] left-[4%] w-16 h-16 rounded-[18px] bg-white/4 backdrop-blur-sm border border-white/6 flex items-center justify-center animate-[float_6s_ease-in-out_infinite_1.5s]">
              <GraduationCap size={28} className="text-white/60" />
            </div>
            <div className="absolute top-[25%] right-[6%] w-16 h-16 rounded-[18px] bg-white/4 backdrop-blur-sm border border-white/6 flex items-center justify-center animate-[float_6s_ease-in-out_infinite_3s]">
              <DollarSign size={28} className="text-white/60" />
            </div>
            <div className="absolute top-[65%] right-[4%] w-16 h-16 rounded-[18px] bg-white/4 backdrop-blur-sm border border-white/6 flex items-center justify-center animate-[float_6s_ease-in-out_infinite_4.5s]">
              <Globe size={28} className="text-white/60" />
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
                      <Star size={16} className="text-accent-dark" />
                    </div>
                    <h4 className="text-base font-semibold text-primary">Parcerias Exclusivas</h4>
                  </div>
                  <p className="text-sm text-gray-400 leading-relaxed ml-12">{service.highlights[0].description}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="flex flex-col gap-5">
                {service.stats.map((stat) => {
                  const StatIcon = getStatIcon(stat.label);
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
                          <StatIcon size={22} />
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
                  const IconComponent = getFeatureIcon(feature, i);
                  return (
                    <div key={feature} className="flex gap-6 relative group">
                      {/* Icon circle */}
                      <div className="w-14 h-14 rounded-full bg-white border-2 border-accent flex items-center justify-center flex-shrink-0 z-10 transition-all duration-500 group-hover:bg-accent group-hover:scale-110 group-hover:shadow-[0_0_24px_rgba(215,222,106,0.3)] relative">
                        <IconComponent size={22} className="text-primary transition-all duration-300 group-hover:text-primary" />
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
                <Clock size={20} />
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

            {/* Search */}
            <div className="mb-10">
              <div className="relative">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Pesquisar perguntas..."
                  value={faqSearch}
                  onChange={(e) => setFaqSearch(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-3.5 pl-11 pr-10 text-sm text-white outline-none transition-all placeholder:text-white/30 focus:border-accent/50 focus:bg-white/10 focus:ring-1 focus:ring-accent/30"
                />
                {faqSearch && (
                  <button
                    onClick={() => setFaqSearch("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                    aria-label="Limpar pesquisa"
                  >
                    <XIcon size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* FAQ Items */}
            {filteredFaq.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-white/40 text-sm">Nenhuma pergunta encontrada para &quot;{faqSearch}&quot;.</p>
                <button
                  onClick={() => setFaqSearch("")}
                  className="mt-3 text-sm font-medium text-accent hover:text-accent-light transition-colors underline underline-offset-4"
                >
                  Limpar pesquisa
                </button>
              </div>
            ) : (
              <div className="space-y-0">
                {filteredFaq.map((item) => (
                  <FaqItem key={item.q} question={item.q} answer={item.a} />
                ))}
              </div>
            )}
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
