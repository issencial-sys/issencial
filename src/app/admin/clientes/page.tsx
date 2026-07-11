"use client";

import { useEffect, useState, useRef } from "react";
import {
  Users,
  Loader2,
  Mail,
  Phone,
  Calendar,
  FileText,
  ArrowRight,
  Clock,
  UserCheck,
  CheckCircle2,
  ChevronDown,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

interface ClientProfile {
  id: string;
  name: string;
  phone: string;
  created_at: string;
  email?: string;
  process_count?: number;
  last_sign_in_at?: string | null;
}

interface AdminInfo {
  user_id: string;
  display_name?: string;
}

interface ClientAssignment {
  client_id: string;
  admin_id: string;
}

export default function AdminClientesPage() {
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [assignments, setAssignments] = useState<Map<string, ClientAssignment>>(new Map());
  const [adminList, setAdminList] = useState<AdminInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [assigningClient, setAssigningClient] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filterGestor, setFilterGestor] = useState<string>("all");
  const [filterDate, setFilterDate] = useState<string>("all");
  const [filterProcesses, setFilterProcesses] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchClients();
  }, []);

  // Reset to page 1 when filters/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterGestor, filterDate, filterProcesses]);

  const fetchClients = async () => {
    // Get current admin's ID to exclude them from clients list
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) setCurrentUserId(user.id);

    // Get all profiles (excluding the admin's own profile)
    let query = supabase.from("profiles").select("id, name, phone, created_at").order("created_at", { ascending: false });

    if (user?.id) {
      query = query.neq("id", user.id);
    }

    const [profilesResult, countsResult, assignmentsResult, adminUsersResult] = await Promise.all([
      query,
      supabase.from("processes").select("client_id"),
      supabase.from("client_assignments").select("client_id, admin_id"),
      supabase.from("admin_users").select("user_id, display_name"),
    ]);

    const profiles = profilesResult.data;
    if (!profiles) {
      setLoading(false);
      return;
    }

    // Get process counts per client
    const countMap: Record<string, number> = {};
    countsResult.data?.forEach((p) => {
      countMap[p.client_id] = (countMap[p.client_id] || 0) + 1;
    });

    // Build assignment map
    const assignMap = new Map<string, ClientAssignment>();
    (assignmentsResult.data ?? []).forEach((a) => assignMap.set(a.client_id, a));
    setAssignments(assignMap);

    setAdminList(adminUsersResult.data ?? []);

    // Fetch emails from the admin API (requires admin role)
    let emailMap: Record<string, { email: string; last_sign_in_at: string | null }> = {};
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const { users } = await res.json();
        (users || []).forEach((u: any) => {
          emailMap[u.id] = { email: u.email, last_sign_in_at: u.last_sign_in_at };
        });
      }
    } catch (err) {
      // Silently fail — email will show as "—"
    }

    const enrichedClients = profiles.map((p) => ({
      ...p,
      process_count: countMap[p.id] || 0,
      email: emailMap[p.id]?.email || "",
      last_sign_in_at: emailMap[p.id]?.last_sign_in_at || null,
    }));

    setClients(enrichedClients);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  const filtered = clients.filter((c) => {
    // Search filter
    const matchesSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase()));
    if (!matchesSearch) return false;

    // Gestor filter
    const assignment = assignments.get(c.id);
    const assignedToMe = assignment?.admin_id === currentUserId;
    if (filterGestor === "me") {
      if (!assignedToMe) return false;
    } else if (filterGestor === "unassigned") {
      if (assignment) return false;
    } else if (filterGestor !== "all") {
      // Filter by specific admin ID
      if (assignment?.admin_id !== filterGestor) return false;
    }

    // Date filter (created_at)
    if (filterDate !== "all") {
      const created = new Date(c.created_at);
      const now = new Date();
      const diffDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
      if (filterDate === "week" && diffDays > 7) return false;
      if (filterDate === "month" && diffDays > 30) return false;
      if (filterDate === "quarter" && diffDays > 90) return false;
    }

    // Process count filter
    if (filterProcesses !== "all") {
      const count = c.process_count || 0;
      if (filterProcesses === "none" && count > 0) return false;
      if (filterProcesses === "1-3" && (count < 1 || count > 3)) return false;
      if (filterProcesses === "4plus" && count < 4) return false;
    }

    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedClients = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
        <p className="text-gray-500 mt-1">
          Todos os clientes registados na plataforma.
        </p>
      </div>

      {/* Success message */}
      {successMessage && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-5 py-3 text-sm text-green-700 animate-in slide-in-from-top-2 fade-in">
          <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />
          {successMessage}
        </div>
      )}

      {/* Search + Filters */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar por nome, email ou telefone..."
            className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 placeholder:text-gray-400"
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm transition-all ${
              showFilters || filterGestor !== "all" || filterDate !== "all" || filterProcesses !== "all"
                ? "border-primary bg-primary/5 text-primary font-medium"
                : "border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <ChevronDown size={14} className={`transition-transform ${showFilters ? "rotate-180" : ""}`} />
            Filtros
            {(filterGestor !== "all" || filterDate !== "all" || filterProcesses !== "all") && (
              <span className="w-2 h-2 rounded-full bg-primary" />
            )}
          </button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-100">
            {/* Gestor filter */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">Gestor</label>
              <select
                value={filterGestor}
                onChange={(e) => setFilterGestor(e.target.value)}
                className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
              >
                <option value="all">Todos os gestores</option>
                <option value="me">Os meus clientes</option>
                <option value="unassigned">Sem gestor</option>
                {adminList.map((admin) => (
                  <option key={admin.user_id} value={admin.user_id}>
                    {admin.display_name || "Administrador"}
                  </option>
                ))}
              </select>
            </div>

            {/* Date filter */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">Registo</label>
              <select
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
              >
                <option value="all">Qualquer data</option>
                <option value="week">Última semana</option>
                <option value="month">Último mês</option>
                <option value="quarter">Últimos 3 meses</option>
              </select>
            </div>

            {/* Process count filter */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">Processos</label>
              <select
                value={filterProcesses}
                onChange={(e) => setFilterProcesses(e.target.value)}
                className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
              >
                <option value="all">Qualquer nº</option>
                <option value="none">Sem processos</option>
                <option value="1-3">1 a 3 processos</option>
                <option value="4plus">4+ processos</option>
              </select>
            </div>

            {(filterGestor !== "all" || filterDate !== "all" || filterProcesses !== "all") && (
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setFilterGestor("all");
                    setFilterDate("all");
                    setFilterProcesses("all");
                  }}
                  className="rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-500 hover:text-primary hover:border-primary transition-all"
                >
                  Limpar filtros
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-50">
              <Users size={28} className="text-gray-300" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Nenhum cliente encontrado
          </h3>
          <p className="text-gray-400">
            {search || filterGestor !== "all" || filterDate !== "all" || filterProcesses !== "all"
              ? "Nenhum cliente corresponde aos filtros aplicados."
              : "Ainda não há clientes registados."}
          </p>
        </div>
      ) : (
        <>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {paginatedClients.map((client) => {
            const assignment = assignments.get(client.id);
            const assignedAdmin = assignment
              ? adminList.find((a) => a.user_id === assignment.admin_id)
              : null;
            const isAssignedToMe = assignment?.admin_id === currentUserId;
            const canAssign = !assignment || assignment.admin_id === currentUserId;

            return (
              <div
                key={client.id}
                className="rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:shadow-md"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/20 text-primary text-lg font-bold">
                    {(client.name || "U").charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {client.name || "Sem nome"}
                    </h3>
                    <p className="text-xs text-gray-400">
                      Cliente desde{" "}
                      {new Date(client.created_at).toLocaleDateString("pt-PT")}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  {client.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Mail size={14} />
                      <span className="truncate">{client.email}</span>
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Phone size={14} />
                      {client.phone}
                    </div>
                  )}
                  {client.last_sign_in_at && (
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Clock size={14} />
                      Último login: {new Date(client.last_sign_in_at).toLocaleDateString("pt-PT", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </div>
                  )}
                </div>

                {/* Gestor info */}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  {assignment ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-gray-400">Gestor:</span>
                        <span className={`font-medium ${isAssignedToMe ? "text-accent" : "text-gray-600"}`}>
                          {assignedAdmin?.display_name ||
                            (isAssignedToMe ? "Você (si)" : "Administrador")}
                        </span>
                        {isAssignedToMe && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 border border-green-200 px-2 py-0.5 text-[10px] font-semibold text-green-600">
                            <CheckCircle2 size={10} />
                            É seu cliente
                          </span>
                        )}
                      </div>
                      {isAssignedToMe &&
                        (assigningClient === client.id ? (
                          <span className="flex items-center gap-1.5 text-xs text-gray-400">
                            <Loader2 size={12} className="animate-spin" />
                            A libertar...
                          </span>
                        ) : (
                          <button
                            onClick={async () => {
                              if (!currentUserId) return;
                              setAssigningClient(client.id);
                              const { error } = await supabase
                                .from("client_assignments")
                                .delete()
                                .eq("client_id", client.id);
                              if (!error) {
                                // Optimistic update — remove from Map immediately
                                setAssignments((prev) => {
                                  const next = new Map(prev);
                                  next.delete(client.id);
                                  return next;
                                });
                                setSuccessMessage(
                                  `${client.name || "Cliente"} libertado com sucesso!`,
                                );
                                if (successTimeoutRef.current)
                                  clearTimeout(successTimeoutRef.current);
                                successTimeoutRef.current = setTimeout(() => {
                                  setSuccessMessage(null);
                                  successTimeoutRef.current = null;
                                }, 4000);
                                // Sync with server in background
                                fetchClients();
                              }
                              setAssigningClient(null);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 hover:text-red-600 hover:border-red-200 transition-all"
                          >
                            <X size={13} />
                            Libertar
                          </button>
                        ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Sem gestor atribuído</span>
                      {assigningClient === client.id ? (
                        <span className="flex items-center gap-1.5 text-xs text-gray-400">
                          <Loader2 size={12} className="animate-spin" />
                          A atribuir...
                        </span>
                      ) : (
                        <button
                          onClick={async () => {
                            if (!currentUserId) return;
                            setAssigningClient(client.id);
                            const { error } = await supabase.from("client_assignments").upsert({
                              client_id: client.id,
                              admin_id: currentUserId,
                              assigned_by: currentUserId,
                            });
                            if (!error) {
                              // Optimistic update — update Map immediately
                              setAssignments((prev) => {
                                const next = new Map(prev);
                                next.set(client.id, {
                                  client_id: client.id,
                                  admin_id: currentUserId,
                                });
                                return next;
                              });
                              setSuccessMessage(`${client.name || "Cliente"} atribuído a si com sucesso!`);
                              if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
                              successTimeoutRef.current = setTimeout(() => {
                                setSuccessMessage(null);
                                successTimeoutRef.current = null;
                              }, 4000);
                              // Sync with server in background
                              fetchClients();
                            }
                            setAssigningClient(null);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-gray-950 hover:bg-accent-light transition-all"
                        >
                          <UserCheck size={13} />
                          Assumir
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <FileText size={14} />
                    {client.process_count} processo(s)
                  </span>
                  <Link
                    href={`/admin/processos?client_id=${client.id}`}
                    className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
                  >
                    Ver processos <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

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
            Mostrando {paginatedClients.length} de {filtered.length} cliente{filtered.length !== 1 ? "s" : ""}
          </p>
        )}
        </>
      )}
    </div>
  );
}
