"use client";

import { useEffect, useState } from "react";
import {
  Settings,
  Shield,
  AlertCircle,
  Loader2,
  User,
  Mail,
  Trash2,
  Plus,
  X,
  CheckCircle2,
  UserMinus,
} from "lucide-react";
import MfaSettings from "@/components/auth/MfaSettings";
import { createClient } from "@/lib/supabase/client";

interface AdminEntry {
  id: string;
  user_id: string;
  display_name?: string;
  created_at: string;
  user_email?: string;
  user_name?: string;
}

export default function AdminConfigPage() {
  const [admins, setAdmins] = useState<AdminEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [editingDisplayName, setEditingDisplayName] = useState("");
  const [savingDisplayName, setSavingDisplayName] = useState(false);
  const [displayNameSaved, setDisplayNameSaved] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
      // Fetch current admin's display_name
      const { data: adminUser } = await supabase
        .from("admin_users")
        .select("display_name")
        .eq("user_id", user.id)
        .maybeSingle();
      if (adminUser?.display_name) {
        setEditingDisplayName(adminUser.display_name);
      }
    }
    fetchAdmins();
  };

  const fetchAdmins = async () => {
    // Fetch from admin_users table
    const { data: adminUsers } = await supabase
      .from("admin_users")
      .select("*")
      .order("created_at", { ascending: false });

    if (!adminUsers) {
      setLoading(false);
      return;
    }

    // Try to fetch user emails from the admin API
    let emailMap: Record<string, { email: string; name: string }> = {};
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const { users } = await res.json();
        (users || []).forEach((u: any) => {
          emailMap[u.id] = { email: u.email, name: u.name };
        });
      }
    } catch {}

    const enriched = (adminUsers as AdminEntry[]).map((a) => ({
      ...a,
      user_email: emailMap[a.user_id]?.email || "—",
      user_name: emailMap[a.user_id]?.name || a.display_name || "",
    }));

    setAdmins(enriched);
    setLoading(false);
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim()) return;

    setAdding(true);
    setAddError(null);
    setAddSuccess(false);

    try {
      // Get user ID by email using the admin API
      const res = await fetch("/api/admin/users");
      if (!res.ok) {
        setAddError("Não foi possível aceder à lista de utilizadores.");
        setAdding(false);
        return;
      }
      const { users } = await res.json();
      const user = (users || []).find(
        (u: any) => u.email?.toLowerCase() === newAdminEmail.trim().toLowerCase(),
      );

      if (!user) {
        setAddError("Utilizador não encontrado com este email.");
        setAdding(false);
        return;
      }

      // Check if already an admin
      if (admins.some((a) => a.user_id === user.id)) {
        setAddError("Este utilizador já é administrador.");
        setAdding(false);
        return;
      }

      // Insert into admin_users
      const { error: insertError } = await supabase
        .from("admin_users")
        .insert({ user_id: user.id });

      if (insertError) {
        setAddError("Erro ao adicionar administrador.");
        setAdding(false);
        return;
      }

      // Update auth user's app_metadata via admin API
      await fetch("/api/admin/set-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, email: user.email, role: "admin" }),
      });

      setAddSuccess(true);
      setNewAdminEmail("");
      fetchAdmins();
      setTimeout(() => {
        setAddSuccess(false);
        setShowAddForm(false);
      }, 2000);
    } catch (err) {
      setAddError("Ocorreu um erro. Tente novamente.");
    }
    setAdding(false);
  };

  const handleRemoveAdmin = async (admin: AdminEntry) => {
    if (!confirm(`Tem a certeza que deseja remover ${admin.user_email || "este administrador"}?`)) return;

    setRemoving(admin.id);

    // Remove from admin_users
    await supabase.from("admin_users").delete().eq("id", admin.id);

    // Update auth user's app_metadata to remove admin role
    await fetch("/api/admin/set-role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: admin.user_id,
        email: admin.user_email,
        role: "",
      }),
    });

    fetchAdmins();
    setRemoving(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Configuração</h1>
        <p className="text-gray-500 mt-1">
          Gerir administradores, segurança e configurações do sistema.
        </p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* My Display Name */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User size={18} />
            O Meu Nome (Visível aos Clientes)
          </h2>
          <p className="text-xs text-gray-400 mb-4">
            Este nome será mostrado aos clientes nas mensagens e nos processos.
            Exemplo: "Gestor Lima", "Equipa Issencial"
          </p>

          {displayNameSaved ? (
            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 rounded-lg px-4 py-3 border border-green-200">
              <CheckCircle2 size={16} />
              Nome atualizado com sucesso!
            </div>
          ) : (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!currentUserId) return;
                setSavingDisplayName(true);
                setDisplayNameSaved(false);

                const { error } = await supabase
                  .from("admin_users")
                  .update({ display_name: editingDisplayName })
                  .eq("user_id", currentUserId);

                if (!error) {
                  setDisplayNameSaved(true);
                  setTimeout(() => setDisplayNameSaved(false), 2000);
                }
                setSavingDisplayName(false);
              }}
              className="flex gap-3"
            >
              <input
                type="text"
                value={editingDisplayName}
                onChange={(e) => setEditingDisplayName(e.target.value)}
                placeholder="O seu nome público (ex: Gestor Lima)"
                className="flex-1 rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary"
              />
              <button
                type="submit"
                disabled={savingDisplayName}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-light transition-all disabled:opacity-40"
              >
                {savingDisplayName ? <Loader2 size={14} className="animate-spin" /> : null}
                Guardar
              </button>
            </form>
          )}

          {/* Help text with current name preview */}
          {editingDisplayName && (
            <div className="mt-3 p-3 rounded-lg bg-accent/5 border border-accent/20 text-xs text-gray-600">
              Os clientes verão: <strong>{editingDisplayName}</strong>
            </div>
          )}
        </div>

        {/* Admin Management */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Shield size={18} />
            Gerir Administradores
          </h2>

          {/* Admin list */}
          {admins.length > 0 && (
            <div className="space-y-2 mb-6">
              {admins.map((admin) => (
                <div
                  key={admin.id}
                  className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/20 text-primary text-sm font-bold">
                      {(admin.user_name || admin.user_email || "A").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {admin.user_name || "Administrador"}
                      </p>
                      <p className="text-xs text-gray-400">{admin.user_email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveAdmin(admin)}
                    disabled={removing === admin.id}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all"
                    title="Remover administrador"
                  >
                    {removing === admin.id ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <UserMinus size={15} />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}

          {!showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-light transition-all"
            >
              <Plus size={16} />
              Adicionar Administrador
            </button>
          ) : (
            <div className="rounded-xl border border-gray-200 p-4">
              {addSuccess ? (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle2 size={16} />
                  Administrador adicionado com sucesso!
                </div>
              ) : (
                <form onSubmit={handleAddAdmin} className="flex flex-col gap-3">
                  <label className="text-xs font-medium text-gray-500">
                    Email do utilizador
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                      placeholder="email@exemplo.pt"
                      required
                      className="flex-1 rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary"
                    />
                    <button
                      type="submit"
                      disabled={adding || !newAdminEmail.trim()}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-light transition-all disabled:opacity-40"
                    >
                      {adding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                      Adicionar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddForm(false);
                        setAddError(null);
                        setNewAdminEmail("");
                      }}
                      className="p-2.5 text-gray-400 hover:text-gray-600"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  {addError && (
                    <p className="text-xs text-red-500">{addError}</p>
                  )}
                </form>
              )}
            </div>
          )}
        </div>

        {/* ── 2FA Settings ─────────────────────────────── */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Shield size={18} />
            Segurança da Conta (2FA)
          </h2>
          <MfaSettings />
        </div>

        {/* Info about current setup */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Settings size={18} />
            Informações do Sistema
          </h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-sm text-gray-500">Versão</span>
              <span className="text-sm font-medium text-gray-900">1.0.0</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-sm text-gray-500">Autenticação</span>
              <span className="text-sm font-medium text-gray-900">
                Supabase Auth
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-sm text-gray-500">Admin Role</span>
              <span className="text-sm font-medium text-gray-900">
                Custom Claims (app_metadata)
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-500">Base de Dados</span>
              <span className="text-sm font-medium text-gray-900">
                Supabase Postgres
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
