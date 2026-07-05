"use client";

import { useParams } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { services } from "@/data/services";
import { ArrowRight, Plane, GraduationCap, DollarSign, Globe, ChevronDown, Check, Star, Shield, Clock } from "lucide-react";
import { useState } from "react";

const featureIcons = [Star, Shield, Clock, Check];

export default function ServicoDetalhePage() {
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
                <p className="text-base leading-relaxed text-gray-500 mb-5">
                  {service.longDescription}
                </p>
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
                {service.stats.map((stat) => (
                  <div key={stat.value} className="p-6 rounded-2xl border border-neutral-light flex items-center gap-5 transition-all duration-300 hover:border-accent hover:shadow-[0_8px_24px_rgba(215,222,106,0.08)]">
                    <div className="text-4xl font-extrabold text-primary leading-none">
                      {stat.value.replace("+", "")}
                      {stat.value.includes("+") && <span className="text-accent-dark">+</span>}
                      {stat.value.includes("%") && <span className="text-accent-dark">%</span>}
                      {stat.value.includes("h") && <span className="text-accent-dark">h</span>}
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">{stat.label}</div>
                    </div>
                  </div>
                ))}
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
                  const IconComponent = featureIcons[i % featureIcons.length];
                  return (
                    <div key={feature} className="flex gap-6 relative group">
                      <div className="w-14 h-14 rounded-full bg-white border-2 border-accent flex items-center justify-center flex-shrink-0 z-10 transition-all duration-300 group-hover:bg-accent relative">
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

        {/* ─── FAQ ─── */}
        <section className="py-24 lg:py-32 bg-primary">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-10">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">Perguntas frequentes</h2>
              <p className="text-base text-white/50 max-w-[480px] mx-auto">Tire as suas dúvidas sobre este serviço.</p>
              <div className="w-10 h-[3px] bg-accent rounded-full mx-auto mt-4" />
            </div>
            <div className="space-y-0">
              {service.faq.map((item) => (
                <FaqItem key={item.q} question={item.q} answer={item.a} />
              ))}
            </div>
          </div>
        </section>

        {/* ─── CTA ─── */}
        <section className="py-28 lg:py-36 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/[0.02] to-transparent" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 relative z-10">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary mb-4 leading-tight">
              Vamos planear a sua<br />
              próxima experiência?
            </h2>
            <p className="text-base sm:text-lg text-gray-400 max-w-[480px] mx-auto mb-10">
              Solicite um orçamento personalizado sem compromisso. Respondemos em até 24 horas.
            </p>
            <Button
              href="/contacto"
              size="xl"
              className="shadow-[0_8px_32px_rgba(0,46,53,0.15)] hover:shadow-[0_12px_48px_rgba(0,46,53,0.2)]"
            >
              Solicitar Orçamento
              <ArrowRight size={20} />
            </Button>
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
