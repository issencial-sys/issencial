"use client";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Image from "next/image";
import { Send, Clock, Mail, MapPin, Phone } from "lucide-react";
import { useState } from "react";

const contactInfo = [
  {
    icon: MapPin,
    title: "Morada",
    lines: ["Rua Example, 123", "1200-100 Lisboa, Portugal"],
  },
  {
    icon: Phone,
    title: "Telefone",
    lines: ["+351 210 000 000"],
  },
  {
    icon: Mail,
    title: "Email",
    lines: ["info@issencial.pt"],
  },
  {
    icon: Clock,
    title: "Horário",
    lines: ["Seg - Sex: 9h - 18h", "Sáb: 9h - 13h"],
  },
];

export default function ContactoPage() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <>
      <Header />
      <main>
        {/* ─── Hero ─── */}
        <section className="relative bg-primary pt-24 pb-16 md:pb-20 overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_25%_25%,#d7de6a_1px,transparent_1px),radial-gradient(circle_at_75%_75%,#d7de6a_1px,transparent_1px)] bg-[length:60px_60px]" />
          <div className="relative z-10 mx-auto max-w-2xl px-4 sm:px-6 lg:px-10 text-center">
            <Badge variant="accent">Contacto</Badge>
            <h1 className="mt-4 text-3xl md:text-4xl font-bold text-white">
              Fale Connosco
            </h1>
            <p className="mt-4 text-lg text-white/70">
              Estamos prontos para ajudá-lo. Entre em contacto connosco e
              responderemos o mais brevemente possível.
            </p>
          </div>
        </section>

        {/* ─── Contact Info + Form ─── */}
        <section className="py-20 md:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
              {/* ── Left: Info Cards ── */}
              <div>
                <h2 className="text-2xl font-bold text-dark mb-2">
                  Informações de Contacto
                </h2>
                <p className="text-gray-500 mb-10 max-w-md">
                  Temos vários canais disponíveis para o atender. Escolha o mais
                  conveniente para si.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {contactInfo.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.title}
                        className="group rounded-2xl border border-gray-100 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-transparent relative overflow-hidden"
                      >
                        {/* Hover accent bar */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-accent scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100" />

                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-primary mb-4 transition-all duration-300 group-hover:bg-accent">
                          <Icon size={22} />
                        </div>

                        <h3 className="font-semibold text-dark text-sm mb-1.5">
                          {item.title}
                        </h3>
                        {item.lines.map((line) => (
                          <p
                            key={line}
                            className="text-sm text-gray-500 leading-relaxed"
                          >
                            {line}
                          </p>
                        ))}
                      </div>
                    );
                  })}
                </div>


              </div>

              {/* ── Right: Form ── */}
              <div>
                <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-md">
                  {submitted ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent/15 text-accent mb-6">
                        <Send size={32} />
                      </div>
                      <h3 className="text-2xl font-bold text-dark mb-2">
                        Mensagem Enviada! 🎉
                      </h3>
                      <p className="text-gray-500 max-w-sm mx-auto mb-8">
                        Obrigado pelo contacto. A nossa equipa irá analisar o
                        seu pedido e responderá em breve.
                      </p>
                      <Button onClick={() => setSubmitted(false)} variant="outline">
                        Enviar outra mensagem
                      </Button>
                    </div>
                  ) : (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        setSubmitted(true);
                      }}
                      className="flex flex-col gap-6"
                    >
                      {/* Section label */}
                      <div className="pb-2 border-b border-gray-100">
                        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                          Envie-nos uma mensagem
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="flex flex-col gap-1.5">
                          <label
                            htmlFor="name"
                            className="text-sm font-medium text-dark"
                          >
                            Nome <span className="text-accent">*</span>
                          </label>
                          <input
                            id="name"
                            type="text"
                            required
                            placeholder="O seu nome"
                            className="rounded-xl border border-gray-200 bg-light/50 px-4 py-3 text-sm text-dark outline-none transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 placeholder:text-gray-400"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label
                            htmlFor="email"
                            className="text-sm font-medium text-dark"
                          >
                            Email <span className="text-accent">*</span>
                          </label>
                          <input
                            id="email"
                            type="email"
                            required
                            placeholder="email@exemplo.pt"
                            className="rounded-xl border border-gray-200 bg-light/50 px-4 py-3 text-sm text-dark outline-none transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 placeholder:text-gray-400"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label
                          htmlFor="subject"
                          className="text-sm font-medium text-dark"
                        >
                          Assunto <span className="text-accent">*</span>
                        </label>
                        <input
                          id="subject"
                          type="text"
                          required
                          placeholder="Como podemos ajudar?"
                          className="rounded-xl border border-gray-200 bg-light/50 px-4 py-3 text-sm text-dark outline-none transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 placeholder:text-gray-400"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label
                          htmlFor="message"
                          className="text-sm font-medium text-dark"
                        >
                          Mensagem <span className="text-accent">*</span>
                        </label>
                        <textarea
                          id="message"
                          required
                          rows={5}
                          placeholder="Descreva o seu pedido com o máximo de detalhe possível..."
                          className="rounded-xl border border-gray-200 bg-light/50 px-4 py-3 text-sm text-dark outline-none transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 placeholder:text-gray-400 resize-none"
                        />
                      </div>

                      <Button type="submit" className="w-full">
                        <Send size={16} className="mr-2" />
                        Enviar Mensagem
                      </Button>

                      <p className="text-xs text-gray-400 text-center">
                        Ao enviar este formulário, aceita a nossa{" "}
                        <a
                          href="/termos-privacidade"
                          className="text-primary underline underline-offset-2 hover:text-primary-light"
                        >
                          Política de Privacidade
                        </a>
                        .
                      </p>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Support CTA ─── */}
        <section className="bg-light py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-2xl mx-auto">
              {[
                {
                  icon: "/assets/icons/telefone.webp",
                  title: "Ligue-nos",
                  desc: "+351 210 000 000",
                  sub: "Seg - Sex: 9h - 18h",
                },
                {
                  icon: "/assets/icons/email.webp",
                  title: "Envie-nos um Email",
                  desc: "info@issencial.pt",
                  sub: "Respondemos em até 24h",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="group rounded-2xl border border-gray-100 bg-white p-8 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-transparent relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-accent scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100" />
                  <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-primary transition-all duration-300 group-hover:bg-accent">
                    <Image
                      src={item.icon}
                      alt={item.title}
                      width={24}
                      height={24}
                    />
                  </div>
                  <h3 className="text-lg font-semibold text-dark mb-1">
                    {item.title}
                  </h3>
                  <p className="text-sm font-medium text-primary">{item.desc}</p>
                  <p className="text-xs text-gray-400 mt-1">{item.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
