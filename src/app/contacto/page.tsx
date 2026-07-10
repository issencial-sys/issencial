"use client";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import FadeIn from "@/components/ui/FadeIn";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { useState } from "react";

const contactInfo = [
  {
    icon: "/assets/icons/telefone.png",
    title: "WhatsApp",
    lines: ["+351 920 701 837"],
    href: "https://wa.me/351920701837",
    cta: "Falar connosco",
  },
  {
    icon: "/assets/icons/telefone.png",
    title: "Telefone",
    lines: ["+351 920 701 837"],
    href: "tel:+351920701837",
    cta: "Ligar agora",
  },
  {
    icon: "/assets/icons/email.png",
    title: "Email",
    lines: ["info@issencial.pt"],
    href: "mailto:info@issencial.pt",
    cta: "Enviar email",
  },
  {
    icon: "/assets/icons/relogio.png",
    title: "Horário",
    lines: ["Seg - Sex: 9h - 18h", "Sáb: 9h - 13h"],
  },
];

const subjectOptions = [
  "Selecione um assunto",
  "Pedido de Orçamento",
  "Informações sobre Serviços",
  "Acompanhamento de Processo",
  "Parcerias",
  "Reclamação",
  "Outro",
];

export default function ContactoPage() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, honeypot }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao enviar mensagem.");
      }

      setSubmitted(true);
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (err: any) {
      console.error("Erro ao enviar formulário:", err);
      setError(err.message || "Ocorreu um erro ao enviar a sua mensagem. Por favor, tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setError(null);
  };

  return (
    <>
      <Header />
      <main>
        {/* ─── Hero ─── */}
        <section className="relative bg-primary py-28 min-h-[50vh] overflow-hidden flex flex-col items-center justify-center">
          <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_25%_25%,#d7de6a_1px,transparent_1px),radial-gradient(circle_at_75%_75%,#d7de6a_1px,transparent_1px)] bg-[length:60px_60px]" />
          <div className="relative z-10 mx-auto max-w-2xl px-4 sm:px-6 lg:px-10 text-center">
            <FadeIn delay={0.1}>
              <Badge variant="accent">Contacto</Badge>
            </FadeIn>
            <FadeIn delay={0.2}>
              <h1 className="mt-6 text-3xl md:text-5xl font-bold text-white leading-tight">
                Fale Connosco
              </h1>
            </FadeIn>
            <FadeIn delay={0.3}>
              <p className="mt-6 text-lg md:text-xl text-white/70 max-w-xl mx-auto">
                Estamos prontos para ajudá-lo. Entre em contacto connosco e
                responderemos o mais brevemente possível.
              </p>
            </FadeIn>
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
                    const CardWrapper = item.href ? "a" : "div";
                    const cardProps = item.href
                      ? { href: item.href, target: "_blank", rel: "noopener noreferrer" }
                      : {};

                    return (
                      <CardWrapper
                        key={item.title}
                        {...cardProps}
                        className={`group rounded-2xl border border-gray-100 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-transparent relative overflow-hidden ${item.href ? "cursor-pointer" : ""}`}
                      >
                        <div className="absolute top-0 left-0 w-full h-1 bg-accent scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100" />
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-primary mb-4 transition-all duration-300 group-hover:bg-accent">
                          <Image src={item.icon} alt={item.title} width={22} height={22} className="text-primary" />
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
                        {item.cta && (
                          <span className="inline-flex items-center gap-1 mt-2 text-xs font-semibold uppercase tracking-wider text-accent-dark opacity-0 translate-y-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
                            {item.cta}
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                          </span>
                        )}
                      </CardWrapper>
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
                        <Image src="/assets/icons/email.png" alt="Enviado" width={32} height={32} />
                      </div>
                      <h3 className="text-2xl font-bold text-dark mb-2">
                        Mensagem Enviada! 🎉
                      </h3>
                      <p className="text-gray-500 max-w-sm mx-auto mb-8">
                        Obrigado pelo contacto. A nossa equipa irá analisar o
                        seu pedido e responderá em breve.
                      </p>
                      <Button onClick={handleReset} variant="outline">
                        Enviar outra mensagem
                      </Button>
                    </div>
                  ) : (
                    <form
                      onSubmit={handleSubmit}
                      className="flex flex-col gap-6"
                    >
                      {/* Honeypot — invisible to humans, bots fill it */}
                      <input
                        type="text"
                        name="website"
                        value={honeypot}
                        onChange={(e) => setHoneypot(e.target.value)}
                        tabIndex={-1}
                        autoComplete="off"
                        style={{ position: "absolute", left: "-9999px", opacity: 0, height: 0 }}
                        aria-hidden="true"
                      />
                      {/* Trust indicators */}
                      <div className="flex flex-wrap items-center gap-3 pb-4 border-b border-gray-100">
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1.5">
                          <Image src="/assets/icons/relogio.png" alt="" width={13} height={13} />
                          <span className="text-xs font-semibold text-accent-dark">Resposta em até 24h</span>
                        </div>
                        <div className="inline-flex items-center gap-1.5 text-gray-400">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                          <span className="text-xs">4.9/5 — 500+ avaliações</span>
                        </div>
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
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                        <select
                          id="subject"
                          required
                          value={formData.subject}
                          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                          className="rounded-xl border border-gray-200 bg-light/50 px-4 py-3 text-sm text-dark outline-none transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20width%3D%2712%27%20height%3D%278%27%20viewBox%3D%270%200%2012%208%27%20fill%3D%27none%27%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%3E%3Cpath%20d%3D%27M1%201.5L6%206.5L11%201.5%27%20stroke%3D%27%23999%27%20stroke-width%3D%271.5%27%20stroke-linecap%3D%27round%27%20stroke-linejoin%3D%27round%27%2F%3E%3C%2Fsvg%3E')] bg-[length:12px_8px] bg-[right_16px_center] bg-no-repeat"
                        >
                          {subjectOptions.map((opt) => (
                            <option key={opt} value={opt === "Selecione um assunto" ? "" : opt} disabled={opt === "Selecione um assunto"}>
                              {opt}
                            </option>
                          ))}
                        </select>
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
                          value={formData.message}
                          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                          placeholder="Descreva o seu pedido com o máximo de detalhe possível..."
                          className="rounded-xl border border-gray-200 bg-light/50 px-4 py-3 text-sm text-dark outline-none transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 placeholder:text-gray-400 resize-none"
                        />
                      </div>

                      {error && (
                        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                          {error}
                        </div>
                      )}

                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? (
                          <Loader2 size={16} className="mr-2 animate-spin" />
                        ) : (
                          <Image src="/assets/icons/email.png" alt="" width={16} height={16} className="mr-2 inline-block" />
                        )}
                        {loading ? "A enviar..." : "Enviar Pedido"}
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
                  icon: "/assets/icons/telefone.png",
                  title: "WhatsApp",
                  desc: "+351 920 701 837",
                  sub: "Respondemos rapidamente",
                  href: "https://wa.me/351920701837",
                  cta: "Abrir conversa",
                },
                {
                  icon: "/assets/icons/email.png",
                  title: "Envie-nos um Email",
                  desc: "info@issencial.pt",
                  sub: "Respondemos em até 24h",
                  href: "mailto:info@issencial.pt",
                  cta: "Enviar email",
                },
              ].map((item) => {
                return (
                  <a
                    key={item.title}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group rounded-2xl border border-gray-100 bg-white p-8 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-transparent relative overflow-hidden cursor-pointer block"
                  >
                    <div className="absolute top-0 left-0 w-full h-1 bg-accent scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100" />
                    <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-primary transition-all duration-300 group-hover:bg-accent">
                      <Image src={item.icon} alt={item.title} width={24} height={24} />
                    </div>
                    <h3 className="text-lg font-semibold text-dark mb-1">
                      {item.title}
                    </h3>
                    <p className="text-sm font-medium text-primary">{item.desc}</p>
                    <p className="text-xs text-gray-400 mt-1">{item.sub}</p>
                    <span className="inline-flex items-center gap-1 mt-3 text-xs font-semibold uppercase tracking-wider text-accent-dark opacity-0 translate-y-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
                      {item.cta}
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    </span>
                  </a>
                );
              })}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
