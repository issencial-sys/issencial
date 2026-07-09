"use client";

import { useEffect, useState } from "react";
import {
  User,
  Mail,
  Phone,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Shield,
  Lock,
  Eye,
  EyeOff,
  Camera,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import MfaSettings from "@/components/auth/MfaSettings";
import Breadcrumbs from "@/components/ui/Breadcrumbs";

export default function PerfilPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    const fetchProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      setEmail(user.email ?? "");

      const { data: profile } = await supabase
        .from("profiles")
        .select("name, phone")
        .eq("id", user.id)
        .maybeSingle();

      if (profile) {
        setName(profile.name ?? "");
        setPhone(profile.phone ?? "");
        setAvatarUrl((profile as any).avatar_url ?? "");
      } else {
        setName(user.user_metadata?.name ?? "");
      }

      setLoading(false);
    };

    fetchProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        name,
        phone,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      setError("Ocorreu um erro ao guardar. Tente novamente.");
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword !== confirmPassword) {
      setPasswordError("As palavras-passe não coincidem.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("A nova palavra-passe deve ter pelo menos 6 caracteres.");
      return;
    }

    // First verify current password by trying to sign in
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) {
      setPasswordError("Sessão expirada. Faça login novamente.");
      return;
    }

    setChangingPassword(true);

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      setPasswordError(
        updateError.message === "New password should be different from the old password."
          ? "A nova palavra-passe deve ser diferente da atual."
          : updateError.message || "Erro ao alterar palavra-passe.",
      );
    } else {
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(false), 5000);
    }
    setChangingPassword(false);
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
      <Breadcrumbs items={[{ label: "Perfil" }]} className="mb-4" />

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-dark">O Meu Perfil</h1>
        <p className="text-gray-500 mt-1">
          Gerir as suas informações pessoais e segurança.
        </p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* ── Profile Info ─────────────────────────────── */}
        <div className="rounded-2xl border border-gray-100 bg-white p-8">
          {/* Avatar */}
          <div className="flex items-center gap-5 mb-8 pb-6 border-b border-gray-100">
            <div className="relative group">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-primary text-xl font-bold">
                  {(name || email || "U").charAt(0).toUpperCase()}
                </div>
              )}
              <label className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 cursor-pointer transition-all">
                <Camera size={18} className="text-white" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setUploadingAvatar(true);
                    const {
                      data: { user },
                    } = await supabase.auth.getUser();
                    if (!user) return;
                    const path = `${user.id}/${Date.now()}-${file.name}`;
                    const { error: uploadError } = await supabase.storage
                      .from("avatars")
                      .upload(path, file, { upsert: true });
                    if (uploadError) {
                      console.error("Erro ao fazer upload:", uploadError);
                      setUploadingAvatar(false);
                      return;
                    }
                    const { data: urlData } = supabase.storage
                      .from("avatars")
                      .getPublicUrl(path);
                    await supabase
                      .from("profiles")
                      .update({ avatar_url: urlData.publicUrl })
                      .eq("id", user.id);
                    setAvatarUrl(urlData.publicUrl);
                    setUploadingAvatar(false);
                  }}
                />
              </label>
              {uploadingAvatar && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60">
                  <Loader2 size={18} className="animate-spin text-white" />
                </div>
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-dark">
                {name || "Utilizador"}
              </h2>
              <p className="text-sm text-gray-400">{email}</p>
            </div>
          </div>

          <form onSubmit={handleSave} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-dark">
                Nome Completo
              </label>
              <div className="relative">
                <User
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="O seu nome"
                  className="w-full rounded-xl border border-gray-200 bg-light/50 pl-10 pr-4 py-3 text-sm text-dark outline-none transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 placeholder:text-gray-400"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-dark">Email</label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 py-3 text-sm text-gray-400 outline-none cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                O email não pode ser alterado.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-dark">
                Telemóvel
              </label>
              <div className="relative">
                <Phone
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+351 900 000 000"
                  className="w-full rounded-xl border border-gray-200 bg-light/50 pl-10 pr-4 py-3 text-sm text-dark outline-none transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 placeholder:text-gray-400"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-light transition-all disabled:opacity-40"
              >
                {saving ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                {saving ? "A guardar..." : "Guardar Alterações"}
              </button>

              {saved && (
                <span className="flex items-center gap-1.5 text-sm text-green-600">
                  <CheckCircle2 size={16} />
                  Guardado com sucesso!
                </span>
              )}
            </div>
          </form>
        </div>

        {/* ── Change Password ──────────────────────────── */}
        <div className="rounded-2xl border border-gray-100 bg-white p-8">
          <h2 className="text-lg font-semibold text-dark mb-6 flex items-center gap-2">
            <Lock size={18} />
            Alterar Palavra-passe
          </h2>

          <form onSubmit={handleChangePassword} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-dark">
                Nova Palavra-passe
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type={showPasswords ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nova palavra-passe"
                  minLength={6}
                  required
                  className="w-full rounded-xl border border-gray-200 bg-light/50 pl-10 pr-10 py-3 text-sm text-dark outline-none transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 placeholder:text-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(!showPasswords)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-dark">
                Confirmar Nova Palavra-passe
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type={showPasswords ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repetir nova palavra-passe"
                  minLength={6}
                  required
                  className="w-full rounded-xl border border-gray-200 bg-light/50 pl-10 pr-10 py-3 text-sm text-dark outline-none transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 placeholder:text-gray-400"
                />
              </div>
            </div>

            {passwordError && (
              <div className="flex items-center gap-2 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                <AlertCircle size={16} />
                {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div className="flex items-center gap-2 p-4 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm">
                <CheckCircle2 size={16} />
                Palavra-passe alterada com sucesso!
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={changingPassword || !newPassword || !confirmPassword}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-light transition-all disabled:opacity-40"
              >
                {changingPassword ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Lock size={16} />
                )}
                {changingPassword ? "A alterar..." : "Alterar Palavra-passe"}
              </button>
            </div>

            <p className="text-xs text-gray-400">
              A palavra-passe deve ter pelo menos 6 caracteres.
            </p>
          </form>
        </div>

        {/* ── 2FA Settings ─────────────────────────────── */}
        <div className="rounded-2xl border border-gray-100 bg-white p-8">
          <h2 className="text-lg font-semibold text-dark mb-6 flex items-center gap-2">
            <Shield size={18} />
            Segurança da Conta (2FA)
          </h2>
          <MfaSettings />
        </div>
      </div>
    </div>
  );
}
