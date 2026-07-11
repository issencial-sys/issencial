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
  X,
  Send,
  AlertCircle,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getServiceBySlug } from "@/data/services";
import { services } from "@/data/services";

interface Process {
  id: string;
  title: string;
  client_id: string;
  status: string;
  created_at: string;
  profiles?: { name: string; email?: string };
}

interface ClientProfile {
  id: string;
  name: string;
}

interface ClientAssignment {
  client_id: string;
  admin_id: string;
}

interface AdminInfo {
  user_id: string;
  display_name?: string;
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

export default function AdminProcessosPage() {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [assignments, setAssignments] = useState<Map<string, ClientAssignment>>(new Map());
  const [adminList, setAdminList] = useState<AdminInfo[]>([]);

  // Create form state
  const [sortColumn, setSortColumn] = useState<string>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) return <ArrowUpDown size={12} className="text-gray-300" />;
    return sortDirection === "asc"
      ? <ArrowUp size={12} className="text-primary" />
      : <ArrowDown size={12} className="text-primary" />;
  };

  const [formClientId, setFormClientId] = useState("");
  const [formServiceSlug, setFormServiceSlug] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCreating, setFormCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    fetchProcesses();
    fetchClients();
  }, []);

  const fetchClients = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, name")
      .order("name");
    setClients(data ?? []);
  };

  const fetchProcesses = async () => {
    const [processesResult, assignmentsResult, adminUsersResult] = await Promise.all([
      supabase
        .from("processes")
        .select("*, profiles!inner(name)")
        .order("created_at", { ascending: false }),
      supabase.from("client_assignments").select("*"),
      supabase.from("admin_users").select("user_id, display_name"),
    ]);

    setProcesses(processesResult.data ?? []);

    const assignMap = new Map<string, ClientAssignment>();
    (assignmentsResult.data ?? []).forEach((a) => assignMap.set(a.client_id, a));
    setAssignments(assignMap);

    setAdminList(adminUsersResult.data ?? []);

    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formClientId || !formServiceSlug) return;

    setFormCreating(true);
    setFormError(null);

    const service = getServiceBySlug(formServiceSlug);

    const { error } = await supabase.from("processes").insert({
      client_id: formClientId,
      title: formTitle || service?.title || formServiceSlug,
      description: formDescription,
      service_slug: formServiceSlug,
      status: "active",
    });

    if (error) {
      setFormError("Erro ao criar processo. Tente novamente.");
    } else {
      setFormSuccess(true);
      setFormClientId("");
      setFormServiceSlug("");
      setFormTitle("");
      setFormDescription("");
      fetchProcesses();
      setTimeout(() => {
        setFormSuccess(false);
        setShowCreateForm(false);
      }, 2000);
    }
    setFormCreating(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  const filteredProcesses = processes.filter((p) => {
    if (filter !== "all" && p.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        p.profiles?.name?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const counts = {
    active: processes.filter((p) => p.status === "active").length,
    paused: processes.filter((p) => p.status === "paused").length,
    completed: processes.filter((p) => p.status === "completed").length,
    cancelled: processes.filter((p) => p.status === "cancelled").length,
  };

  // Sorting
  const sortedProcesses = [...filteredProcesses].sort((a, b) => {
    const dir = sortDirection === "asc" ? 1 : -1;

    if (sortColumn === "title") {
      return a.title.localeCompare(b.title) * dir;
    }
    if (sortColumn === "client") {
      return (a.profiles?.name || "").localeCompare(b.profiles?.name || "") * dir;
    }
    if (sortColumn === "status") {
      return a.status.localeCompare(b.status) * dir;
    }
    // Default: sort by created_at
    return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * dir;
  });

  // Pagination
  const totalPages = Math.ceil(sortedProcesses.length / ITEMS_PER_PAGE);
  const paginatedProcesses = sortedProcesses.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  // Reset to page 1 when filters/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filter]);

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gerir Processos
          </h1>
          <p className="text-gray-500 mt-1">
            Todos os processos dos clientes.
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-light transition-all"
        >
          {showCreateForm ? <X size={16} /> : <Plus size={16} />}
          {showCreateForm ? "Cancelar" : "+ Novo Processo"}
        </button>
      </div>

      {/* ─── Filtros ─── */}
      <div className="flex flex-wrap gap-2 mb-4">
        {[
          { key: "all", label: "Todos", count: processes.length },
          { key: "active", label: "Ativos", count: counts.active },
          { key: "paused", label: "Pausados", count: counts.paused },
          { key: "completed", label: "Concluídos", count: counts.completed },
          { key: "cancelled", label: "Cancelados", count: counts.cancelled },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === f.key
                ? "bg-primary text-white shadow-sm"
                : "bg-white text-gray-500 border border-gray-200 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {/* ─── Search ─── */}
      <div className="relative mb-6">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar processos..."
          className="w-full max-w-md rounded-xl border border-gray-200 bg-white pl-9 pr-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 placeholder:text-gray-400"
        />
      </div>

      {/* ─── Create Form ─── */}
      {showCreateForm && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 mb-6">
          {formSuccess ? (
            <div className="text-center py-6">
              <div className="flex justify-center mb-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
                  <CheckCircle2 size={24} className="text-green-600" />
                </div>
              </div>
              <p className="text-sm font-medium text-green-700">Processo criado com sucesso!</p>
            </div>
          ) : (
            <>
              <h2 className="font-semibold text-gray-900 mb-4">Criar Novo Processo</h2>
              <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-gray-500">Cliente</label>
                  <select
                    value={formClientId}
                    onChange={(e) => setFormClientId(e.target.value)}
                    required
                    className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary"
                  >
                    <option value="">Selecionar cliente...</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-gray-500">Serviço</label>
                  <select
                    value={formServiceSlug}
                    onChange={(e) => setFormServiceSlug(e.target.value)}
                    required
                    className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary"
                  >
                    <option value="">Selecionar serviço...</option>
                    {services.map((s) => (
                      <option key={s.slug} value={s.slug}>{s.title}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-xs font-medium text-gray-500">Título (opcional)</label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Deixe em branco para usar o nome do serviço"
                    className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-xs font-medium text-gray-500">Descrição</label>
                  <textarea
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    rows={3}
                    placeholder="Descrição do processo..."
                    className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary resize-none"
                  />
                </div>
                {formError && (
                  <div className="sm:col-span-2 flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                    <AlertCircle size={14} />
                    {formError}
                  </div>
                )}
                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    disabled={formCreating || !formClientId || !formServiceSlug}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-light transition-all disabled:opacity-40"
                  >
                    {formCreating ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                    {formCreating ? "A criar..." : "Criar Processo"}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      )}

      {/* ─── List ─── */}
      {filteredProcesses.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-50">
              <FileText size={28} className="text-gray-300" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {search || filter !== "all" ? "Nenhum processo encontrado" : "Nenhum processo ainda"}
          </h3>
          <p className="text-gray-400">
            {search || filter !== "all"
              ? "Tente alterar os filtros ou pesquisa."
              : "Crie o primeiro processo clicando em '+ Novo Processo'."}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-6 py-4">
                    <button onClick={() => handleSort("title")} className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400 hover:text-gray-700 transition-colors">
                      Processo {getSortIcon("title")}
                    </button>
                  </th>
                  <th className="text-left px-6 py-4">
                    <button onClick={() => handleSort("client")} className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400 hover:text-gray-700 transition-colors">
                      Cliente {getSortIcon("client")}
                    </button>
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Gestor</th>
                  <th className="text-left px-6 py-4">
                    <button onClick={() => handleSort("status")} className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400 hover:text-gray-700 transition-colors">
                      Status {getSortIcon("status")}
                    </button>
                  </th>
                  <th className="text-left px-6 py-4">
                    <button onClick={() => handleSort("created_at")} className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400 hover:text-gray-700 transition-colors">
                      Data {getSortIcon("created_at")}
                    </button>
                  </th>
                  <th className="text-right px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginatedProcesses.map((p) => {
                  const status = statusConfig[p.status] || statusConfig.active;
                  const StatusIcon = status.icon;
                  const assignment = assignments.get(p.client_id);
                  const assignedAdmin = assignment
                    ? adminList.find((a) => a.user_id === assignment.admin_id)
                    : null;
                  return (
                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-900">{p.title}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-500">{p.profiles?.name || "—"}</span>
                      </td>
                      <td className="px-6 py-4">
                        {assignedAdmin ? (
                          <span className="text-sm text-gray-600">
                            {assignedAdmin.display_name || "Administrador"}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-300 italic">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                          <StatusIcon size={14} />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {new Date(p.created_at).toLocaleDateString("pt-PT")}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/admin/processos/${p.id}`}
                          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                        >
                          Gerir <ArrowRight size={14} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2 flex-wrap">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Anterior
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`w-10 h-10 rounded-xl text-sm font-medium transition-all ${
                page === currentPage
                  ? "bg-primary text-white shadow-sm"
                  : "border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Seguinte
          </button>
        </div>
      )}

      {/* Results info */}
      {totalPages > 1 && (
        <p className="text-center text-xs text-gray-400 mt-3">
          Mostrando {paginatedProcesses.length} de {filteredProcesses.length} processo{filteredProcesses.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
