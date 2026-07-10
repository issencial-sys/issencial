"use client";

import { useState } from "react";
import { Send, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import Button from "@/components/ui/Button";
import { services } from "@/data/services";

interface QuoteFormProps {
  defaultService?: string;
  className?: string;
}

export default function QuoteForm({ defaultService = "", className = "" }: QuoteFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    service_slug: defaultService,
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, honeypot }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao enviar pedido.");
      }

      setSubmitted(true);
    } catch (err: any) {
      console.error("Erro ao solicitar orçamento:", err);
      setError(err.message || "Ocorreu um erro ao enviar o seu pedido. Por favor, tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className={`rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm ${className}`}>
        <div className="flex flex-col items-center justify-center py-8">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-50 text-green-600 mb-6">
            <CheckCircle size={36} />
          </div>
          <h3 className="text-2xl font-bold text-dark mb-2">
            Pedido Enviado! 🎉
          </h3>
          <p className="text-gray-500 max-w-sm mx-auto">
            Recebemos o seu pedido de orçamento. A nossa equipa irá analisá-lo
            e entrará em contacto consigo em breve.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border border-gray-100 bg-white p-8 shadow-sm ${className}`}>
      <h3 className="text-xl font-bold text-dark mb-2">Solicitar Orçamento</h3>
      <p className="text-gray-500 text-sm mb-6">
        Preencha o formulário abaixo e receba um orçamento personalizado.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="quote-name" className="text-sm font-medium text-dark">
              Nome <span className="text-accent">*</span>
            </label>
            <input
              id="quote-name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="O seu nome"
              className="rounded-xl border border-gray-200 bg-light/50 px-4 py-3 text-sm text-dark outline-none transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 placeholder:text-gray-400"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="quote-email" className="text-sm font-medium text-dark">
              Email <span className="text-accent">*</span>
            </label>
            <input
              id="quote-email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@exemplo.pt"
              className="rounded-xl border border-gray-200 bg-light/50 px-4 py-3 text-sm text-dark outline-none transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 placeholder:text-gray-400"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="quote-phone" className="text-sm font-medium text-dark">
              Telemóvel
            </label>
            <input
              id="quote-phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+351 920 701 837"
              className="rounded-xl border border-gray-200 bg-light/50 px-4 py-3 text-sm text-dark outline-none transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 placeholder:text-gray-400"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="quote-service" className="text-sm font-medium text-dark">
              Serviço <span className="text-accent">*</span>
            </label>
            <select
              id="quote-service"
              required
              value={formData.service_slug}
              onChange={(e) => setFormData({ ...formData, service_slug: e.target.value })}
              className="rounded-xl border border-gray-200 bg-light/50 px-4 py-3 text-sm text-dark outline-none transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
            >
              <option value="">Selecione um serviço</option>
              {services.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="quote-description" className="text-sm font-medium text-dark">
            Descrição do Pedido <span className="text-accent">*</span>
          </label>
          <textarea
            id="quote-description"
            required
            rows={4}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Descreva o seu pedido com o máximo de detalhe possível..."
            className="rounded-xl border border-gray-200 bg-light/50 px-4 py-3 text-sm text-dark outline-none transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 placeholder:text-gray-400 resize-none"
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertCircle size={16} className="flex-shrink-0" />
            {error}
          </div>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <Loader2 size={16} className="mr-2 animate-spin" />
          ) : (
            <Send size={16} className="mr-2" />
          )}
          {loading ? "A enviar..." : "Solicitar Orçamento"}
        </Button>
      </form>
    </div>
  );
}
