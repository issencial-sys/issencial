"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  ArrowRight,
  Loader2,
  Clock,
  CheckCircle2,
  PauseCircle,
  XCircle,
  Plus,
  Send,
  Check,
  AlertCircle,
  Hourglass,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { services, getServiceBySlug } from "@/data/services";
import Breadcrumbs from "@/components/ui/Breadcrumbs";

interface Process {
  id: string;
  title: string;
  description: string;
  service_slug: string;
  status: string;
  created_at: string;
}

interface ServiceRequest {
  id: string;
  service_slug: string;
  description: string;
  status: string;
  created_at: string;
}

const statusConfig: Record<
  string,
  { label: string; icon: any; color: string; bg: string }
> = {
  active: {
    label: "Ativo",
    icon: Clock,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  paused: {
    label: "Pausado",
    icon: PauseCircle,
    color: "text-yellow-600",
    bg: "bg-yellow-50",
  },
  completed: {
    label: "Concluído",
    icon: CheckCircle2,
    color: "text-green-600",
    bg: "bg-green-50",
  },
  cancelled: {
    label: "Cancelado",
    icon: XCircle,
    color: "text-red-600",
    bg: "bg-red-50",
  },
};

const requestStatusConfig: Record<
  string,
  { label: string; icon: any; color: string; bg: string }
> = {
  pending: {
    label: "A Aguardar",
    icon: Hourglass,
    color: "text-yellow-600",
    bg: "bg-yellow-50",
  },
  in_review: {
    label: "Em Análise",
    icon: Clock,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  approved: {
    label: "Aprovado",
    icon: CheckCircle2,
    color: "text-green-600",
    bg: "bg-green-50",
  },
  rejected: {
    label: "Recusado",
    icon: XCircle,
    color: "text-red-600",
    bg: "bg-red-50",
  },
};

export default function ProcessosPage() {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [selectedSlug, setSelectedSlug] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const [processesRes, requestsRes] = await Promise.all([
      supabase
        .from("processes")
        .select("*")
        .eq("client_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("service_requests")
        .select("id, service_slug, description, status, created_at")
        .eq("client_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

    setProcesses(processesRes.data ?? []);
    setRequests(requestsRes.data ?? []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlug || !description) return;

    setSubmitting(true);
    setFormError(null);
    setFormSuccess(false);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setFormError("Sessão expirada. Por favor, faça login novamente.");
      setSubmitting(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("name, phone")
      .eq("id", user.id)
      .maybeSingle();

    const { error } = await supabase.from("service_requests").insert({
      client_id: user.id,
      service_slug: selectedSlug,
      name: profile?.name || user.user_metadata?.name || "",
      email: user.email || "",
      phone: phone || profile?.phone || "",
      description,
      status: "pending",
    });

    if (error) {
      console.error("Erro ao solicitar serviço:", error);
      setFormError("Ocorreu um erro ao enviar o pedido. Tente novamente.");
    } else {
      setFormSuccess(true);
      setSelectedSlug("");
      setDescription("");
      setPhone("");
      // Refresh data to show the new request
      await fetchData();
      setTimeout(() => {
        setFormSuccess(false);
        setShowForm(false);
      }, 3000);
    }
    setSubmitting(false);
  };

  const resetForm = () => {
    setShowForm(false);
    setFormError(null);
    setFormSuccess(false);
    setSelectedSlug("");
    setDescription("");
    setPhone("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  const pendingRequests = requests.filter(
    (r) => r.status === "pending" || r.status === "in_review",
  );
  const hasItems = processes.length > 0 || requests.length > 0;

  return (
    <div>
      <Breadcrumbs items={[{ label: "Os Meus Processos" }]} className="mb-4" />

      {/* ─── Header ─── */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark">Os Meus Processos</h1>
          <p className="text-gray-500 mt-1">
            Acompanhe o estado de cada processo ou solicite um novo serviço.
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-light transition-all shrink-0"
          >
            <Plus size={16} />
            Solicitar Serviço
          </button>
        )}
      </div>

      {/* ─── Formulário de Solicitação ─── */}
      {showForm && (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 sm:p-8 mb-8">
          {formSuccess ? (
            <div className="text-center py-8">
              <div className="flex justify-center mb-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
                  <Check size={28} className="text-green-600" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-dark mb-2">
                Pedido Enviado com Sucesso!
              </h3>
              <p className="text-gray-400 max-w-sm mx-auto mb-6">
                A nossa equipa vai analisar o seu pedido e entraremos em
                contacto em breve. Pode acompanhar o estado abaixo.
              </p>
              <button
                onClick={resetForm}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-light transition-all"
              >
                Fechar
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-dark">
                  Solicitar Novo Serviço
                </h2>
                <button
                  onClick={resetForm}
                  className="text-sm text-gray-400 hover:text-gray-600 transition-all"
                >
                  Cancelar
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                {/* Seletor de Serviço */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-dark">
                    Serviço Pretendido
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {services.map((s) => {
                      const isSelected = selectedSlug === s.slug;
                      return (
                        <button
                          key={s.slug}
                          type="button"
                          onClick={() => setSelectedSlug(s.slug)}
                          className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                            isSelected
                              ? "border-primary bg-primary/5"
                              : "border-gray-200 bg-white hover:border-gray-300"
                          }`}
                        >
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                              isSelected
                                ? "bg-primary text-white"
                                : "bg-gray-100 text-gray-500"
                            } transition-all`}
                          >
                            <span className="text-xs font-bold">
                              {s.title.charAt(0)}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-dark">
                              {s.title}
                            </p>
                            <p className="text-xs text-gray-400 line-clamp-1">
                              {s.description}
                            </p>
                          </div>
                          {isSelected && (
                            <Check
                              size={16}
                              className="text-primary shrink-0 mt-0.5"
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Descrição */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-dark">
                    Descrição do Pedido
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descreva o que precisa. Quanto mais detalhes, melhor podemos ajudá-lo."
                    required
                    rows={4}
                    className="rounded-xl border border-gray-200 bg-light/50 px-4 py-3 text-sm text-dark outline-none transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 placeholder:text-gray-400 resize-none"
                  />
                  {getServiceBySlug(selectedSlug) && (
                    <p className="text-xs text-gray-400 mt-1">
                      Precisa de ajuda com:{" "}
                      <span className="font-medium text-gray-500">
                        {getServiceBySlug(selectedSlug)?.title}
                      </span>
                    </p>
                  )}
                </div>

                {/* Telemóvel */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-dark">
                    Telemóvel <span className="text-gray-400">(opcional)</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+351 900 000 000"
                    className="rounded-xl border border-gray-200 bg-light/50 px-4 py-3 text-sm text-dark outline-none transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 placeholder:text-gray-400"
                  />
                </div>

                {formError && (
                  <div className="flex items-center gap-2 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                    <AlertCircle size={16} />
                    {formError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting || !selectedSlug || !description}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-light transition-all disabled:opacity-40 self-start"
                >
                  {submitting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Send size={16} />
                  )}
                  {submitting ? "A enviar..." : "Enviar Pedido"}
                </button>
              </form>
            </>
          )}
        </div>
      )}

      {/* ─── Conteúdo ─── */}
      {!hasItems ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-50">
              <FileText size={28} className="text-gray-300" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-dark mb-2">
            Nenhum processo ainda
          </h3>
          <p className="text-gray-400 mb-6 max-w-sm mx-auto">
            Solicite um serviço e acompanhe tudo aqui. Quando a equipa aprovar,
            o processo aparecerá com todas as etapas e atualizações.
          </p>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-light transition-all"
            >
              <Plus size={16} />
              Solicitar Serviço
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-6">
          {/* ─── Pedidos Pendentes ─── */}
          {pendingRequests.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Hourglass size={14} />
                Pedidos a Aguardar Aprovação
              </h2>
              <div className="grid gap-3">
                {pendingRequests.map((req) => {
                  const cfg =
                    requestStatusConfig[req.status] || requestStatusConfig.pending;
                  const ReqIcon = cfg.icon;
                  const service = getServiceBySlug(req.service_slug);
                  return (
                    <div
                      key={req.id}
                      className="rounded-2xl border border-yellow-100 bg-yellow-50/30 p-5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-yellow-100 text-yellow-700">
                            <ReqIcon size={18} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-dark text-sm">
                              {service?.title || req.service_slug}
                            </h3>
                            <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">
                              {req.description}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              Solicitado em{" "}
                              {new Date(req.created_at).toLocaleDateString(
                                "pt-PT",
                                {
                                  day: "numeric",
                                  month: "long",
                                },
                              )}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium shrink-0 ${cfg.bg} ${cfg.color}`}
                        >
                          <ReqIcon size={12} />
                          {cfg.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ─── Processos Ativos / Concluídos ─── */}
          {processes.length > 0 && (
            <div>
              {pendingRequests.length > 0 && (
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Clock size={14} />
                  Processos
                </h2>
              )}
              <div className="grid gap-4">
                {processes.map((p) => {
                  const status = statusConfig[p.status] || statusConfig.active;
                  const StatusIcon = status.icon;

                  return (
                    <Link
                      key={p.id}
                      href={`/portal/processos/${p.id}`}
                      className="group rounded-2xl border border-gray-100 bg-white p-6 transition-all hover:shadow-md hover:-translate-y-0.5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-dark mb-1 group-hover:text-primary transition-colors">
                            {p.title}
                          </h3>
                          <p className="text-sm text-gray-400 line-clamp-2">
                            {p.description || "Sem descrição"}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${status.bg} ${status.color}`}
                          >
                            <StatusIcon size={14} />
                            {status.label}
                          </span>
                          <ArrowRight
                            size={16}
                            className="text-gray-300 transition-all group-hover:text-primary group-hover:translate-x-0.5"
                          />
                        </div>
                      </div>
                      <div className="mt-3 text-xs text-gray-400">
                        Criado em{" "}
                        {new Date(p.created_at).toLocaleDateString("pt-PT", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* ─── Pedidos Recusados (histórico) ─── */}
          {requests.filter((r) => ["approved", "rejected"].includes(r.status)).length > 0 && (
            <details className="group">
              <summary className="text-sm text-gray-400 cursor-pointer hover:text-gray-600 transition-colors">
                Ver pedidos anteriores
              </summary>
              <div className="mt-3 grid gap-3">
                {requests
                  .filter((r) => ["approved", "rejected"].includes(r.status))
                  .map((req) => {
                    const cfg =
                      requestStatusConfig[req.status] || requestStatusConfig.pending;
                    const ReqIcon = cfg.icon;
                    const service = getServiceBySlug(req.service_slug);
                    return (
                      <div
                        key={req.id}
                        className="rounded-xl border border-gray-100 bg-white p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-dark">
                              {service?.title || req.service_slug}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {new Date(req.created_at).toLocaleDateString(
                                "pt-PT",
                                { day: "numeric", month: "long", year: "numeric" },
                              )}
                            </p>
                          </div>
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ${cfg.bg} ${cfg.color}`}
                          >
                            <ReqIcon size={12} />
                            {cfg.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
