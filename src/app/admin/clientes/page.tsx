"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Loader2,
  Mail,
  Phone,
  Calendar,
  FileText,
  ArrowRight,
  Clock,
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
  const supabase = createClient();

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    // Get current admin's ID to exclude them from clients list
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) setCurrentUserId(user.id);

    // Get all profiles (excluding the admin's own profile)
    let query = supabase.from("profiles").select("*").order("created_at", { ascending: false });

    if (user?.id) {
      query = query.neq("id", user.id);
    }

    const [profilesResult, countsResult, assignmentsResult, adminUsersResult] = await Promise.all([
      query,
      supabase.from("processes").select("client_id"),
      supabase.from("client_assignments").select("*"),
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

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
        <p className="text-gray-500 mt-1">
          Todos os clientes registados na plataforma.
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar por nome ou telefone..."
          className="max-w-md w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-gray-400"
        />
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
            {search
              ? "Nenhum cliente corresponde à pesquisa."
              : "Ainda não há clientes registados."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((client) => {
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
                  {assignedAdmin ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-gray-400">Gestor:</span>
                        <span className={`font-medium ${isAssignedToMe ? "text-accent" : "text-gray-600"}`}>
                          {assignedAdmin.display_name || "Administrador"}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Sem gestor atribuído</span>
                      <button
                        onClick={async () => {
                          if (!currentUserId) return;
                          await supabase.from("client_assignments").upsert({
                            client_id: client.id,
                            admin_id: currentUserId,
                            assigned_by: currentUserId,
                          });
                          fetchClients();
                        }}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Assumir
                      </button>
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
      )}
    </div>
  );
}
