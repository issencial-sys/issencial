"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Receipt,
  Loader2,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  FileText,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Breadcrumbs from "@/components/ui/Breadcrumbs";

interface Invoice {
  id: string;
  process_id: string;
  invoice_number: string;
  amount: number;
  currency: string;
  status: string;
  due_date: string;
  description: string;
  created_at: string;
  processes: {
    title: string;
    service_slug: string;
  } | null;
}

const statusConfig: Record<
  string,
  { label: string; icon: any; color: string; bg: string }
> = {
  draft: {
    label: "Rascunho",
    icon: FileText,
    color: "text-gray-500",
    bg: "bg-gray-50",
  },
  pending: {
    label: "Pendente",
    icon: Clock,
    color: "text-yellow-600",
    bg: "bg-yellow-50",
  },
  paid: {
    label: "Paga",
    icon: CheckCircle2,
    color: "text-green-600",
    bg: "bg-green-50",
  },
  overdue: {
    label: "Vencida",
    icon: AlertCircle,
    color: "text-red-600",
    bg: "bg-red-50",
  },
  cancelled: {
    label: "Cancelada",
    icon: FileText,
    color: "text-gray-400",
    bg: "bg-gray-50",
  },
};

type FilterKey = "all" | "pending" | "paid" | "overdue";

const filters: { key: FilterKey; label: string }[] = [
  { key: "all", label: "Todas" },
  { key: "pending", label: "Pendentes" },
  { key: "paid", label: "Pagas" },
  { key: "overdue", label: "Vencidas" },
];

export default function FaturasPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const supabase = createClient();

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("invoices")
      .select("*, processes!inner(title, service_slug)")
      .eq("client_id", user.id)
      .order("created_at", { ascending: false });

    setInvoices(data ?? []);
    setLoading(false);
  };

  const filtered =
    activeFilter === "all"
      ? invoices
      : invoices.filter((inv) => inv.status === activeFilter);

  const totalPending = invoices
    .filter((inv) => ["pending", "overdue"].includes(inv.status))
    .reduce((sum, inv) => sum + Number(inv.amount), 0);

  const totalPaid = invoices
    .filter((inv) => inv.status === "paid")
    .reduce((sum, inv) => sum + Number(inv.amount), 0);

  const totalOverdue = invoices
    .filter((inv) => inv.status === "overdue")
    .reduce((sum, inv) => sum + Number(inv.amount), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <Breadcrumbs items={[{ label: "Faturas" }]} className="mb-4" />

      {/* ─── Header ─── */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-dark">As Minhas Faturas</h1>
        <p className="text-gray-500 mt-1">
          Consulte todas as suas faturas e acompanhe o estado de pagamento.
        </p>
      </div>

      {/* ─── Summary Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="rounded-2xl border border-yellow-200 bg-yellow-50/50 p-5">
          <div className="flex items-center gap-2 text-yellow-600 text-sm mb-2">
            <Clock size={16} />
            Pendentes
          </div>
          <div className="text-2xl font-bold text-yellow-700">
            €{totalPending.toFixed(2)}
          </div>
          <p className="text-xs text-yellow-500 mt-1">
            {invoices.filter((inv) => ["pending", "overdue"].includes(inv.status)).length} fatura(s)
          </p>
        </div>

        <div className="rounded-2xl border border-green-200 bg-green-50/50 p-5">
          <div className="flex items-center gap-2 text-green-600 text-sm mb-2">
            <CheckCircle2 size={16} />
            Pagas
          </div>
          <div className="text-2xl font-bold text-green-700">
            €{totalPaid.toFixed(2)}
          </div>
          <p className="text-xs text-green-500 mt-1">
            {invoices.filter((inv) => inv.status === "paid").length} fatura(s)
          </p>
        </div>

        <div className="rounded-2xl border border-red-200 bg-red-50/50 p-5">
          <div className="flex items-center gap-2 text-red-600 text-sm mb-2">
            <AlertCircle size={16} />
            Vencidas
          </div>
          <div className="text-2xl font-bold text-red-700">
            €{totalOverdue.toFixed(2)}
          </div>
          <p className="text-xs text-red-500 mt-1">
            {invoices.filter((inv) => inv.status === "overdue").length} fatura(s)
          </p>
        </div>
      </div>

      {/* ─── Filters ─── */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1 sm:pb-0 sm:flex-wrap sm:overflow-visible -mx-4 px-4 sm:mx-0 sm:px-0">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeFilter === f.key
                ? "bg-primary text-white shadow-sm"
                : "bg-white text-gray-500 border border-gray-200 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ─── Invoice List ─── */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-50">
              <Receipt size={28} className="text-gray-300" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-dark mb-2">
            {activeFilter === "all"
              ? "Nenhuma fatura ainda"
              : "Nenhuma fatura com este estado"}
          </h3>
          <p className="text-gray-400 text-sm max-w-sm mx-auto">
            {activeFilter === "all"
              ? "As suas faturas aparecerão aqui assim que forem emitidas pela equipa Issencial."
              : "Tente ver outro filtro ou aguarde novas faturas."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((inv) => {
            const cfg = statusConfig[inv.status] || statusConfig.draft;
            const StatusIcon = cfg.icon;
            const isOverdue = inv.status === "overdue";
            const isPending = inv.status === "pending";

            return (
              <Link
                key={inv.id}
                href={`/portal/processos/${inv.process_id}`}
                className={`block rounded-2xl border p-5 transition-all hover:shadow-md hover:-translate-y-0.5 ${
                  isOverdue
                    ? "border-red-200 bg-red-50/30"
                    : isPending
                      ? "border-yellow-100 bg-white"
                      : "border-gray-100 bg-white"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-sm font-semibold text-dark">
                        {inv.invoice_number}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium ${cfg.bg} ${cfg.color}`}
                      >
                        <StatusIcon size={11} />
                        {cfg.label}
                      </span>
                    </div>

                    <p className="text-xs text-gray-400 mt-0.5">
                      {inv.processes?.title || "Processo"}
                    </p>

                    {inv.description && (
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                        {inv.description}
                      </p>
                    )}

                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      {inv.due_date && (
                        <span>
                          Vence:{" "}
                          <span
                            className={
                              isOverdue ? "font-medium text-red-500" : ""
                            }
                          >
                            {new Date(inv.due_date).toLocaleDateString("pt-PT")}
                          </span>
                        </span>
                      )}
                      <span>
                        Emitida em:{" "}
                        {new Date(inv.created_at).toLocaleDateString("pt-PT")}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xl font-bold text-dark">
                      €{Number(inv.amount).toFixed(2)}
                    </span>
                    <ArrowRight
                      size={16}
                      className="text-gray-300 transition-all group-hover:translate-x-0.5 group-hover:text-primary"
                    />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* ─── Info ─── */}
      <div className="mt-8 p-5 rounded-2xl border border-gray-100 bg-white">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Receipt size={18} />
          </div>
          <div>
            <p className="text-sm font-medium text-dark">
              Precisa de ajuda com pagamentos?
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              Se tiver dúvidas sobre alguma fatura ou precisar de renegociar
              prazos, entre em contacto connosco através da página de{" "}
              <Link
                href="/portal/mensagens"
                className="text-primary hover:underline font-medium"
              >
                Mensagens
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
