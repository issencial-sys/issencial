"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import {
  Loader2,
  Receipt,
  Plus,
  ArrowLeft,
  Search,
  Check,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import { notify } from "@/lib/email/notify";
import { newInvoiceTemplate, paymentReceivedTemplate } from "@/lib/email";

interface Invoice {
  id: string;
  process_id: string;
  client_id: string;
  invoice_number: string;
  amount: number;
  currency: string;
  status: string;
  due_date: string;
  description: string;
  created_at: string;
}

interface ProcessOption {
  id: string;
  title: string;
  service_slug: string;
  profiles: { name: string } | null;
}

const STATUS_OPTIONS = [
  { value: "draft", label: "Rascunho" },
  { value: "pending", label: "Pendente" },
  { value: "paid", label: "Pago" },
  { value: "overdue", label: "Vencido" },
  { value: "cancelled", label: "Cancelado" },
] as const;

const statusColors: Record<string, string> = {
  draft: "text-gray-500 bg-gray-50 border-gray-200",
  pending: "text-yellow-600 bg-yellow-50 border-yellow-200",
  paid: "text-green-600 bg-green-50 border-green-200",
  overdue: "text-red-600 bg-red-50 border-red-200",
  cancelled: "text-gray-500 bg-gray-50 border-gray-200",
};

function FaturasContent() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    process_id: "",
    description: "",
    amount: "",
    due_date: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [processes, setProcesses] = useState<ProcessOption[]>([]);
  const [processesLoading, setProcessesLoading] = useState(true);
  const [processSearch, setProcessSearch] = useState("");
  const [showProcessDropdown, setShowProcessDropdown] = useState(false);
  const [selectedProcessLabel, setSelectedProcessLabel] = useState("");
  const processDropdownRef = useRef<HTMLDivElement>(null);
  const processInputRef = useRef<HTMLInputElement>(null);

  const preselectedProcess = searchParams.get("process_id");

  useEffect(() => {
    fetchInvoices();
    fetchProcesses();
    if (preselectedProcess) {
      setFormData((prev) => ({
        ...prev,
        process_id: preselectedProcess,
      }));
      setShowForm(true);
    }
  }, []);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        processDropdownRef.current &&
        !processDropdownRef.current.contains(e.target as Node)
      ) {
        setShowProcessDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchProcesses = async () => {
    setProcessesLoading(true);
    const { data } = await supabase
      .from("processes")
      .select("id, title, service_slug, profiles!client_id(name)")
      .order("created_at", { ascending: false });
    setProcesses(
      (data ?? []).map((item: any) => ({
        id: item.id,
        title: item.title,
        service_slug: item.service_slug,
        profiles: Array.isArray(item.profiles) ? item.profiles[0] ?? null : item.profiles,
      })),
    );
    setProcessesLoading(false);
  };

  // Filtrar processos com base na pesquisa
  const filteredProcesses = processes.filter((p) => {
    if (!processSearch) return true;
    const q = processSearch.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      p.profiles?.name?.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q)
    );
  });

  const selectProcess = (proc: ProcessOption) => {
    setFormData((prev) => ({ ...prev, process_id: proc.id }));
    setSelectedProcessLabel(
      `${proc.title} — ${proc.profiles?.name || "Sem cliente"}`,
    );
    setProcessSearch("");
    setShowProcessDropdown(false);
  };

  const clearProcess = () => {
    setFormData((prev) => ({ ...prev, process_id: "" }));
    setSelectedProcessLabel("");
    setProcessSearch("");
    processInputRef.current?.focus();
  };

  const fetchInvoices = async () => {
    const { data } = await supabase
      .from("invoices")
      .select("*")
      .order("created_at", { ascending: false });
    setInvoices(data ?? []);
    setLoading(false);
  };

  const updateStatus = async (id: string, newStatus: string) => {
    await supabase
      .from("invoices")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", id);
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === id ? { ...inv, status: newStatus } : inv,
      ),
    );

    // Notify client of payment
    if (newStatus === "paid") {
      const inv = invoices.find((i) => i.id === id);
      if (inv) {
        try {
          const emailRes = await fetch("/api/admin/users");
          if (emailRes.ok) {
            const { users } = await emailRes.json();
            const clientUser = (users || []).find((u: any) => u.id === inv.client_id);
            if (clientUser?.email) {
              notify({
                to_email: clientUser.email,
                to_name: "",
                subject: `Pagamento recebido: ${inv.invoice_number}`,
                html_body: paymentReceivedTemplate({
                  invoice_number: inv.invoice_number,
                  amount: Number(inv.amount).toFixed(2),
                  currency: inv.currency || "EUR",
                  cta_url: "/portal",
                }),
                type: "notification",
                reference_id: id,
                reference_type: "invoice",
              });
            }
          }
        } catch { /* silêncio */ }
      }
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.process_id || !formData.amount) return;

    setSubmitting(true);
    setFormError(null);

    // Fetch client_id and title from the process
    const { data: processData, error: processError } = await supabase
      .from("processes")
      .select("client_id, title")
      .eq("id", formData.process_id)
      .maybeSingle();

    if (processError || !processData) {
      setFormError("Processo não encontrado. Verifique o ID.");
      setSubmitting(false);
      return;
    }

    // Generate invoice number
    const { data: numData } = await supabase.rpc("generate_invoice_number");
    const invoiceNumber = numData || `INV-${Date.now()}`;

    const { error } = await supabase.from("invoices").insert({
      process_id: formData.process_id,
      client_id: processData.client_id,
      invoice_number: invoiceNumber,
      amount: parseFloat(formData.amount),
      description: formData.description,
      due_date: formData.due_date || null,
      status: "draft",
    });

    if (error) {
      setFormError("Erro ao criar fatura. Tente novamente.");
    } else {
      setShowForm(false);
      setFormData({
        process_id: "",
        description: "",
        amount: "",
        due_date: "",
      });
      fetchInvoices();

      // Notify client of new invoice
      try {
        const emailRes = await fetch("/api/admin/users");
        if (emailRes.ok) {
          const { users } = await emailRes.json();
          const clientUser = (users || []).find((u: any) => u.id === processData.client_id);
          if (clientUser?.email) {
            notify({
              to_email: clientUser.email,
              to_name: processData.title || "",
              subject: `Nova fatura: ${invoiceNumber}`,
              html_body: newInvoiceTemplate({
                invoice_number: invoiceNumber,
                amount: parseFloat(formData.amount).toFixed(2),
                due_date: formData.due_date
                  ? new Date(formData.due_date).toLocaleDateString("pt-PT")
                  : undefined,
                status: "Pendente",
                cta_url: "/portal",
              }),
              type: "new_invoice",
              reference_id: processData.id,
              reference_type: "process",
            });
          }
        }
      } catch { /* silêncio */ }
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  const totalPending = invoices
    .filter((inv) => ["pending", "overdue"].includes(inv.status))
    .reduce((sum, inv) => sum + Number(inv.amount), 0);

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Faturas</h1>
          <p className="text-gray-500 mt-1">
            Gerir faturas de todos os processos.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-light transition-all"
        >
          {showForm ? <ArrowLeft size={16} /> : <Plus size={16} />}
          {showForm ? "Cancelar" : "Nova Fatura"}
        </button>
      </div>

      {/* Total summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="text-sm text-gray-500 mb-1">Total Faturas</div>
          <div className="text-2xl font-bold text-gray-900">
            {invoices.length}
          </div>
        </div>
        <div className="rounded-2xl border border-yellow-200 bg-yellow-50/50 p-5">
          <div className="text-sm text-yellow-600 mb-1">Pendentes</div>
          <div className="text-2xl font-bold text-yellow-700">
            €{totalPending.toFixed(2)}
          </div>
        </div>
        <div className="rounded-2xl border border-green-200 bg-green-50/50 p-5">
          <div className="text-sm text-green-600 mb-1">Pagas</div>
          <div className="text-2xl font-bold text-green-700">
            €
            {invoices
              .filter((inv) => inv.status === "paid")
              .reduce((sum, inv) => sum + Number(inv.amount), 0)
              .toFixed(2)}
          </div>
        </div>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">
            Criar Nova Fatura
          </h2>
          <form
            onSubmit={handleCreate}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            <div
              className="flex flex-col gap-1.5 sm:col-span-2 relative"
              ref={processDropdownRef}
            >
              <label className="text-xs font-medium text-gray-500">
                Processo
              </label>
              {selectedProcessLabel && formData.process_id ? (
                <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2.5">
                  <Check size={14} className="text-primary shrink-0" />
                  <span className="text-sm text-gray-700 flex-1 truncate">
                    {selectedProcessLabel}
                  </span>
                  <button
                    type="button"
                    onClick={clearProcess}
                    className="p-0.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Search
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                  <input
                    ref={processInputRef}
                    type="text"
                    value={processSearch}
                    onChange={(e) => {
                      setProcessSearch(e.target.value);
                      setShowProcessDropdown(true);
                    }}
                    onFocus={() => setShowProcessDropdown(true)}
                    placeholder="Pesquisar processo (título, cliente ou ID)..."
                    required
                    className="w-full rounded-lg border border-gray-200 pl-9 pr-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                  />
                </div>
              )}

              {/* Dropdown de processos */}
              {showProcessDropdown && !selectedProcessLabel && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-64 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                  {processesLoading ? (
                    <div className="flex items-center justify-center gap-2 p-4 text-sm text-gray-400">
                      <Loader2 size={14} className="animate-spin" />
                      A carregar processos…
                    </div>
                  ) : filteredProcesses.length === 0 ? (
                    <div className="p-4 text-center text-sm text-gray-400">
                      Nenhum processo encontrado
                    </div>
                  ) : (
                    filteredProcesses.map((proc) => (
                      <button
                        key={proc.id}
                        type="button"
                        onClick={() => selectProcess(proc)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-primary text-xs font-bold">
                          {proc.title.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {proc.title}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {proc.profiles?.name || "Sem cliente"}
                            <span className="mx-1">·</span>
                            {proc.service_slug}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500">
                Valor (€)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                placeholder="0.00"
                required
                className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500">
                Data de Vencimento
              </label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) =>
                  setFormData({ ...formData, due_date: e.target.value })
                }
                className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
              />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-gray-500">
                Descrição
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Descrição da fatura"
                className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
              />
            </div>

            {formError && (
              <div className="sm:col-span-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                {formError}
              </div>
            )}

            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-light transition-all disabled:opacity-40"
              >
                {submitting ? "A criar..." : "Criar Fatura"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Invoice list */}
      {invoices.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-50">
              <Receipt size={28} className="text-gray-300" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Nenhuma fatura
          </h3>
          <p className="text-gray-400">
            Crie a primeira fatura clicando em &quot;Nova Fatura&quot;.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Nº Fatura
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Descrição
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Valor
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Status
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Vencimento
                  </th>
                  <th className="text-right px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {invoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900">
                        {inv.invoice_number}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500">
                        {inv.description || "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-gray-900">
                        €{Number(inv.amount).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-[10px] font-medium px-2.5 py-1 rounded-full border ${
                          statusColors[inv.status] || "border-gray-200"
                        }`}
                      >
                        {inv.status === "draft"
                          ? "Rascunho"
                          : inv.status === "pending"
                            ? "Pendente"
                            : inv.status === "paid"
                              ? "Pago"
                              : inv.status === "overdue"
                                ? "Vencido"
                                : "Cancelado"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {inv.due_date
                        ? new Date(inv.due_date).toLocaleDateString("pt-PT")
                        : "—"}
                    </td>
                    <td className="px-6 py-4 text-right">                        <select
                        value={inv.status}
                        onChange={(e) =>
                          updateStatus(inv.id, e.target.value)
                        }
                        className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none cursor-pointer hover:border-gray-300 transition-colors"
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminFaturasPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-primary" />
        </div>
      }
    >
      <FaturasContent />
    </Suspense>
  );
}
