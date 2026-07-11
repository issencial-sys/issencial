"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Loader2,
  ClipboardList,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Clock,
  Search,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getServiceBySlug } from "@/data/services";
import { notify } from "@/lib/email/notify";
import { statusChangeTemplate } from "@/lib/email";

interface ServiceRequest {
  id: string;
  client_id: string;
  service_slug: string;
  name: string;
  email: string;
  phone: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
}

const statusConfig: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  pending: {
    label: "Pendente",
    color: "text-yellow-700",
    bg: "bg-yellow-50 border-yellow-200",
  },
  in_review: {
    label: "Em Análise",
    color: "text-blue-700",
    bg: "bg-blue-50 border-blue-200",
  },
  approved: {
    label: "Aprovado",
    color: "text-green-700",
    bg: "bg-green-50 border-green-200",
  },
  rejected: {
    label: "Recusado",
    color: "text-red-700",
    bg: "bg-red-50 border-red-200",
  },
  completed: {
    label: "Concluído",
    color: "text-gray-700",
    bg: "bg-gray-50 border-gray-200",
  },
};

export default function AdminPedidosPage() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const supabase = createClient();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    const { data } = await supabase
      .from("service_requests")
      .select("*")
      .order("created_at", { ascending: false });

    setRequests(data ?? []);
    setLoading(false);
  };

  const updateStatus = async (id: string, newStatus: string) => {
    setUpdating(id);
    await supabase
      .from("service_requests")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", id);

    setRequests((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: newStatus, updated_at: new Date().toISOString() } : r,
      ),
    );

    // If approved, create a process for this request
    if (newStatus === "approved") {
      const req = requests.find((r) => r.id === id);
      if (req) {
        const service = getServiceBySlug(req.service_slug);
        await supabase.from("processes").insert({
          client_id: req.client_id,
          title: service?.title || req.service_slug,
          description: req.description,
          service_slug: req.service_slug,
          status: "active",
          source_request_id: req.id,
        });
      }
    }

    // Notify client of status change
    if (newStatus === "approved" || newStatus === "rejected") {
      const req = requests.find((r) => r.id === id);
      if (req) {
        const service = getServiceBySlug(req.service_slug);
        const statusMap: Record<string, string> = {
          pending: "Pendente", in_review: "Em Análise", approved: "Aprovado", rejected: "Recusado", completed: "Concluído",
        };
        notify({
          to_email: req.email,
          to_name: req.name,
          subject: `Pedido ${statusMap[newStatus]}: ${service?.title || req.service_slug}`,
          html_body: statusChangeTemplate({
            entity_label: "Pedido de Serviço",
            entity_name: service?.title || req.service_slug,
            old_status: statusMap[req.status] || req.status,
            new_status: statusMap[newStatus] || newStatus,
            message: newStatus === "approved"
              ? "O seu pedido foi aprovado. Vamos iniciar o processo em breve."
              : "O seu pedido foi recusado. Se tiver dúvidas, por favor contacte-nos.",
            cta_url: "/portal",
          }),
          type: "status_change",
          reference_id: req.id,
          reference_type: "service_request",
        });
      }
    }

    setUpdating(null);
  };

  // Filter & search
  const filteredRequests = requests.filter((r) => {
    if (filter !== "all" && r.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  const counts = {
    pending: requests.filter((r) => r.status === "pending").length,
    in_review: requests.filter((r) => r.status === "in_review").length,
    approved: requests.filter((r) => r.status === "approved").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
  };

  return (
    <div>
      {/* ─── Header ─── */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
        <p className="text-gray-500 mt-1">
          Gerir pedidos de serviço enviados pelos clientes.
        </p>
      </div>

      {/* ─── Stats ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <button
          onClick={() => setFilter("all")}
          className={`rounded-2xl border p-5 text-left transition-all ${
            filter === "all"
              ? "border-primary bg-primary/5"
              : "border-gray-200 bg-white hover:border-gray-300"
          }`}
        >
          <div className="text-sm text-gray-400 mb-1">Total</div>
          <div className="text-2xl font-bold text-gray-900">
            {requests.length}
          </div>
        </button>
        <button
          onClick={() => setFilter("pending")}
          className={`rounded-2xl border p-5 text-left transition-all ${
            filter === "pending"
              ? "border-yellow-400 bg-yellow-50"
              : "border-gray-200 bg-white hover:border-yellow-300"
          }`}
        >
          <div className="text-sm text-yellow-600 mb-1">Pendentes</div>
          <div className="text-2xl font-bold text-yellow-700">
            {counts.pending}
          </div>
        </button>
        <button
          onClick={() => setFilter("in_review")}
          className={`rounded-2xl border p-5 text-left transition-all ${
            filter === "in_review"
              ? "border-blue-400 bg-blue-50"
              : "border-gray-200 bg-white hover:border-blue-300"
          }`}
        >
          <div className="text-sm text-blue-600 mb-1">Em Análise</div>
          <div className="text-2xl font-bold text-blue-700">
            {counts.in_review}
          </div>
        </button>
        <button
          onClick={() => setFilter("approved")}
          className={`rounded-2xl border p-5 text-left transition-all ${
            filter === "approved"
              ? "border-green-400 bg-green-50"
              : "border-gray-200 bg-white hover:border-green-300"
          }`}
        >
          <div className="text-sm text-green-600 mb-1">Aprovados</div>
          <div className="text-2xl font-bold text-green-700">
            {counts.approved}
          </div>
        </button>
      </div>

      {/* ─── Search ─── */}
      <div className="relative mb-6">
        <Search
          size={16}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar por nome, email ou descrição..."
          className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 placeholder:text-gray-400"
        />
      </div>

      {/* ─── List ─── */}
      {filteredRequests.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-50">
              <ClipboardList size={28} className="text-gray-300" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Nenhum pedido encontrado
          </h3>
          <p className="text-gray-400">
            {filter !== "all"
              ? "Nenhum pedido com este estado."
              : "Os pedidos dos clientes aparecerão aqui."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredRequests.map((req) => {
            const cfg =
              statusConfig[req.status] || statusConfig.pending;
            const service = getServiceBySlug(req.service_slug);

            return (
              <div
                key={req.id}
                className="rounded-2xl border border-gray-200 bg-white overflow-hidden transition-all hover:shadow-sm"
              >
                <div className="p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-gray-900 text-sm">
                          {service?.title || req.service_slug}
                        </h3>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${cfg.bg} ${cfg.color}`}
                        >
                          <Clock size={10} />
                          {cfg.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mb-2">
                        {req.name} · {req.email}
                      </p>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {req.description}
                      </p>
                    </div>

                    {/* Actions (inline for pending/in_review) */}
                    {(req.status === "pending" ||
                      req.status === "in_review") && (
                      <div className="flex flex-col gap-1.5 shrink-0">
                        <button
                          onClick={() => updateStatus(req.id, "approved")}
                          disabled={updating === req.id}
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 transition-all disabled:opacity-40 border border-green-200"
                        >
                          {updating === req.id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <CheckCircle2 size={12} />
                          )}
                          Aprovar
                        </button>
                        <button
                          onClick={() => updateStatus(req.id, "rejected")}
                          disabled={updating === req.id}
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 transition-all disabled:opacity-40 border border-red-200"
                        >
                          <XCircle size={12} />
                          Recusar
                        </button>
                      </div>
                    )}

                    <Link
                      href={`/admin/pedidos/${req.id}`}
                      className="p-2 text-gray-300 hover:text-primary transition-all shrink-0"
                      title="Ver detalhes"
                    >
                      <ArrowRight size={16} />
                    </Link>
                  </div>

                  <div className="mt-3 flex items-center gap-4 text-[10px] text-gray-400">
                    <span>
                      {new Date(req.created_at).toLocaleDateString("pt-PT", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    {req.phone && <span>📞 {req.phone}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
