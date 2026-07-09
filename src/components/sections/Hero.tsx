"use client";

import Image from "next/image";
import Link from "next/link";
import FadeIn from "@/components/ui/FadeIn";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col lg:flex-row items-center bg-white overflow-hidden">
      {/* ─── LADO ESQUERDO — Texto ─── */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-10 lg:pl-20 lg:pr-12 pt-28 pb-8 lg:py-20 relative z-[2]">
        {/* Tag */}
        <FadeIn delay={0.1}>
          <div className="flex flex-wrap gap-2 mb-5">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/[0.12] bg-primary/[0.03] px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-primary w-fit">
              <Image
                src="/logo/secundario_verde.png"
                alt=""
                width={12}
                height={12}
                className="object-contain"
                style={{ width: "auto", height: "auto" }}
              />
              Serviços Integrados Globais
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-primary w-fit">
              <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-accent text-[8px] font-bold text-primary">★</span>
              +5.000 Clientes Satisfeitos
            </div>
          </div>
        </FadeIn>

        {/* Título */}
        <FadeIn delay={0.2}>
          <h1 className="text-[42px] font-bold leading-[1.1] text-primary mb-4">
            Simplificamos<br />
            processos.<br />
            <span className="bg-gradient-to-br from-primary to-[#3a5a40] bg-clip-text text-transparent">
              Conectamos<br />
              oportunidades.
            </span>
          </h1>
        </FadeIn>

        {/* Descrição */}
        <FadeIn delay={0.3}>
          <p className="text-[17px] leading-[1.6] text-[#666] max-w-[440px] mb-8">
            A sua sociedade de confiança para cuidar de processos a todos os
            níveis — desde viagens e educação até serviços administrativos — em
            qualquer parte do mundo.
          </p>
        </FadeIn>

        {/* Botões */}
        <FadeIn delay={0.4}>
          <div className="flex gap-3">
          <Link
            href="/servicos"
            className="inline-flex items-center gap-2 rounded-[12px] bg-primary px-7 py-3.5 text-[15px] font-semibold text-white transition-all duration-200 hover:bg-primary-light hover:-translate-y-[1px]"
          >
            Descubra a Solução Ideal
            <span aria-hidden="true">→</span>
          </Link>
          <Link
            href="/sobre"
            className="inline-flex items-center gap-2 rounded-[12px] bg-transparent px-7 py-3.5 text-[15px] font-semibold text-primary border border-primary/15 transition-all duration-200 hover:border-primary/30 hover:bg-primary/[0.03]"
          >
            Sobre Nós
          </Link>
        </div>
        </FadeIn>
      </div>

      {/* ─── LADO DIREITO — Pattern Card ─── */}
      <div className="flex-1 relative min-h-0 lg:min-h-screen flex items-center justify-center pb-12 lg:pb-0">
        <div className="w-[340px] h-[420px] rounded-2xl bg-gradient-to-br from-primary via-primary-light to-dark relative overflow-hidden shadow-[0_40px_80px_rgba(0,46,53,0.2)]">
          {/* Dot pattern overlay */}
          <div className="absolute inset-0 opacity-[0.08] bg-[radial-gradient(circle_at_20%_30%,#d7de6a_1px,transparent_1px),radial-gradient(circle_at_80%_70%,#d7de6a_1px,transparent_1px)] bg-[length:40px_40px]" />

          {/* Conteúdo do card */}
          <div className="relative z-10 px-8 py-10 h-full flex flex-col justify-between">
            {/* Logo Issencial */}
            <div className="relative w-12 h-12 opacity-90">
              <Image
                src="/logo/principal_branco.png"
                alt="Issencial"
                fill
                sizes="48px"
                style={{ objectFit: "contain" }}
              />
            </div>

            {/* Título do card */}
            <h3 className="text-2xl font-bold text-white leading-[1.2]">
              Soluções integradas para cada necessidade
            </h3>

            {/* Ícones */}
            <div className="flex gap-4">
              {[
                "/assets/icons/viagem-aviao.webp",
                "/assets/icons/licenciatura.webp",
                "/assets/icons/dinheiro-dolar.webp",
                "/assets/icons/www.webp",
              ].map((src) => (
                <div
                  key={src}
                  className="relative w-11 h-11 rounded-[12px] bg-white/10 flex items-center justify-center overflow-hidden"
                >
                  <Image
                    src={src}
                    alt=""
                    fill
                    sizes="44px"
                    className="brightness-0 invert p-1.5"
                    style={{ objectFit: "contain" }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
