"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Eye,
  Clock,
  Loader2,
  User,
  Mail,
  Phone,
  FileText,
  Calendar,
  ExternalLink,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getServiceBySlug } from "@/data/services";
import { logActivity, ActivityActions } from "@/lib/activity-log";

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

interface LinkedProcess {
  id: string;
  title: string;
  status: string;
  created_at: string;
}

const statusConfig: Record<
  string,
  { label: string; color: string; bg: string; dot: string }
> = {
  pending: {
    label: "Pendente",
    color: "text-yellow-700",
    bg: "bg-yellow-50 border-yellow-200",
    dot: "bg-yellow-400",
  },
  in_review: {
    label: "Em Análise",
    color: "text-blue-700",
    bg: "bg-blue-50 border-blue-200",
    dot: "bg-blue-400",
  },
  approved: {
    label: "Aprovado",
    color: "text-green-700",
    bg: "bg-green-50 border-green-200",
    dot: "bg-green-400",
  },
  rejected: {
    label: "Recusado",
    color: "text-red-700",
    bg: "bg-red-50 border-red-200",
    dot: "bg-red-400",
  },
  completed: {
    label: "Concluído",
    color: "text-gray-700",
    bg: "bg-gray-50 border-gray-200",
    dot: "bg-gray-400",
  },
};

const statusFlow = ["pending", "in_review", "approved", "completed"];

export default function PedidoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [process, setProcess] = useState<LinkedProcess | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectionForm, setShowRejectionForm] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchRequest();
  }, [id]);

  const fetchRequest = async () => {
    // Fetch the service request
    const { data: reqData } = await supabase
      .from("service_requests")
      .select("*")
      .eq("id", id)
      .single();

    if (!reqData) {
      setLoading(false);
      return;
    }

    setRequest(reqData as ServiceRequest);
    setRejectionReason((reqData as any).rejection_reason || "");

    // If approved, find the linked process
    if (reqData.status === "approved" || reqData.status === "completed") {
      const { data: processData } = await supabase
        .from("processes")
        .select("id, title, status, created_at")
        .eq("source_request_id", id)
        .maybeSingle();

      if (processData) {
        setProcess(processData as LinkedProcess);
      }
    }

    setLoading(false);
  };

  const updateStatus = async (newStatus: string, reason?: string) => {
    if (!request) return;
    setUpdating(newStatus);

    const updateData: Record<string, string> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };

    if (newStatus === "rejected" && reason) {
      updateData.rejection_reason = reason;
    }

    await supabase
      .from("service_requests")
      .update(updateData)
      .eq("id", request.id);

    setRequest((prev) =>
      prev
        ? { ...prev, ...updateData }
        : prev,
    );

    // If approved, create a process for this request
    // Log activity
    if (newStatus === "approved") {
      const service = getServiceBySlug(request.service_slug);
      const { data: newProcess } = await supabase
        .from("processes")
        .insert({
          client_id: request.client_id,
          title: service?.title || request.service_slug,
          description: request.description,
          service_slug: request.service_slug,
          status: "active",
          source_request_id: request.id,
        })
        .select("id, title, status, created_at")
        .single();

      if (newProcess) {
        setProcess(newProcess as LinkedProcess);
      }

      await logActivity({
        entityType: "service_request",
        entityId: request.id,
        action: ActivityActions.REQUEST_APPROVED,
        description: `Pedido de ${service?.title || request.service_slug} aprovado`,
        metadata: { client_id: request.client_id },
      });
    }

    if (newStatus === "rejected") {
      await logActivity({
        entityType: "service_request",
        entityId: request.id,
        action: ActivityActions.REQUEST_REJECTED,
        description: `Pedido de ${getServiceBySlug(request.service_slug)?.title || request.service_slug} recusado`,
        metadata: { rejection_reason: reason },
      });
    }

    setUpdating(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400">Pedido não encontrado.</p>
        <Link
          href="/admin/pedidos"
          className="text-primary hover:underline text-sm mt-2 inline-block"
        >
          Voltar aos pedidos
        </Link>
      </div>
    );
  }

  const service = getServiceBySlug(request.service_slug);
  const cfg = statusConfig[request.status] || statusConfig.pending;
  const currentStepIndex = statusFlow.indexOf(request.status);
  const canAct =
    request.status === "pending" || request.status === "in_review";

  return (
    <div className="max-w-3xl">
      {/* ─── Back ─── */}
      <Link
        href="/admin/pedidos"
        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-primary mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        Voltar aos pedidos
      </Link>

      {/* ─── Header ─── */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">
                {service?.title || request.service_slug}
              </h1>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.color}`}
              >
                <Clock size={12} />
                {cfg.label}
              </span>
            </div>
            <p className="text-gray-500 text-sm">
              Solicitado em{" "}
              {new Date(request.created_at).toLocaleDateString("pt-PT", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>

          {process && (
            <Link
              href={`/admin/processos/${process.id}`}
              className="inline-flex items-center gap-2 rounded-xl bg-primary/5 border border-primary/20 px-4 py-2.5 text-sm font-medium text-primary hover:bg-primary/10 transition-all shrink-0"
            >
              <ExternalLink size={15} />
              Ver Processo
            </Link>
          )}
        </div>
      </div>

      {/* ─── Status Timeline ─── */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 mb-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-5">
          Progresso
        </h2>
        <div className="flex items-center gap-0">
          {statusFlow.map((step, i) => {
            const stepCfg = statusConfig[step] || statusConfig.pending;
            const isPast = currentStepIndex >= i;
            const isCurrent = currentStepIndex === i;

            return (
              <div key={step} className="flex-1 flex flex-col items-center">
                <div className="flex items-center w-full">
                  {/* Line before */}
                  {i > 0 && (
                    <div
                      className={`flex-1 h-0.5 -mr-2 ${
                        isPast ? "bg-primary/30" : "bg-gray-100"
                      }`}
                    />
                  )}
                  {/* Dot */}
                  <div
                    className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                      isCurrent
                        ? "border-primary bg-primary text-white shadow-md shadow-primary/20"
                        : isPast
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-gray-200 bg-white text-gray-300"
                    }`}
                  >
                    {isPast && !isCurrent ? (
                      <CheckCircle2 size={14} />
                    ) : (
                      <span className="text-xs font-bold">
                        {isCurrent ? "●" : i + 1}
                      </span>
                    )}
                  </div>
                  {/* Line after */}
                  {i < statusFlow.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 -ml-2 ${
                        isPast ? "bg-primary/30" : "bg-gray-100"
                      }`}
                    />
                  )}
                </div>
                <span
                  className={`mt-2 text-[10px] font-medium ${
                    isPast ? stepCfg.color : "text-gray-300"
                  }`}
                >
                  {stepCfg.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Action buttons */}
        {canAct && (
          <div className="mt-6 pt-5 border-t border-gray-100">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
              Ações
            </p>
            <div className="flex flex-wrap gap-3">
              {request.status === "pending" && (
                <button
                  onClick={() => updateStatus("in_review")}
                  disabled={updating !== null}
                  className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-medium text-blue-700 hover:bg-blue-100 transition-all disabled:opacity-40"
                >
                  {updating === "in_review" ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Eye size={15} />
                  )}
                  Marcar como "Em Análise"
                </button>
              )}
              <button
                onClick={() => updateStatus("approved")}
                disabled={updating !== null}
                className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 transition-all disabled:opacity-40"
              >
                {updating === "approved" ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={15} />
                )}
                Aprovar
              </button>
              <button
                onClick={() => setShowRejectionForm(true)}
                disabled={updating !== null}
                className="inline-flex items-center gap-2 rounded-xl bg-red-100 px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-200 transition-all disabled:opacity-40"
              >
                <XCircle size={15} />
                Recusar
              </button>
            </div>
          </div>
        )}

        {/* Rejection reason form */}
        {showRejectionForm && (
          <div className="mt-6 pt-5 border-t border-gray-100">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
              Motivo da Recusa
            </h3>
            <div className="flex flex-col gap-3">
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Indique o motivo da recusa..."
                rows={3}
                className="rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => updateStatus("rejected", rejectionReason)}
                  disabled={updating !== null || !rejectionReason.trim()}
                  className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-all disabled:opacity-40"
                >
                  {updating === "rejected" ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <XCircle size={15} />
                  )}
                  Confirmar Recusa
                </button>
                <button
                  onClick={() => {
                    setShowRejectionForm(false);
                    setRejectionReason("");
                  }}
                  className="px-4 py-2.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Rejected info */}
        {request.status === "rejected" && !showRejectionForm && (
          <div className="mt-6 pt-5 border-t border-gray-100">
            <div className="rounded-xl bg-red-50 border border-red-200 p-4">
              <p className="text-sm font-medium text-red-700 mb-1">
                Pedido Recusado
              </p>
              {rejectionReason ? (
                <p className="text-xs text-red-600">{rejectionReason}</p>
              ) : (
                <p className="text-xs text-red-500">Nenhum motivo indicado.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ─── Client Info ─── */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 mb-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
          <User size={14} />
          Cliente
        </h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/20 text-primary text-sm font-bold">
              {request.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {request.name}
              </p>
              <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                <span className="flex items-center gap-1">
                  <Mail size={12} />
                  {request.email}
                </span>
                {request.phone && (
                  <span className="flex items-center gap-1">
                    <Phone size={12} />
                    {request.phone}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Description ─── */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 mb-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
          <FileText size={14} />
          Descrição
        </h2>
        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
          {request.description}
        </p>
      </div>

      {/* ─── Service Info ─── */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 mb-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
          Detalhes do Pedido
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-400 mb-1">Serviço</p>
            <p className="text-sm font-medium text-gray-900">
              {service?.title || request.service_slug}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Estado</p>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium border ${cfg.bg} ${cfg.color}`}
            >
              <Clock size={10} />
              {cfg.label}
            </span>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Solicitado em</p>
            <p className="text-sm text-gray-700 flex items-center gap-1.5">
              <Calendar size={13} />
              {new Date(request.created_at).toLocaleDateString("pt-PT", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Última atualização</p>
            <p className="text-sm text-gray-700 flex items-center gap-1.5">
              <Calendar size={13} />
              {new Date(request.updated_at).toLocaleDateString("pt-PT", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
      </div>

      {/* ─── Linked Process ─── */}
      {process && (
        <div className="rounded-2xl border border-green-200 bg-green-50/50 p-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-green-600 mb-3 flex items-center gap-2">
            <CheckCircle2 size={14} />
            Processo Criado
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">
                {process.title}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Criado em{" "}
                {new Date(process.created_at).toLocaleDateString("pt-PT")}
              </p>
            </div>
            <Link
              href={`/admin/processos/${process.id}`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-all"
            >
              <ExternalLink size={14} />
              Abrir Processo
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
