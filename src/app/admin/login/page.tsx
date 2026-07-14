"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Mail,
  Lock,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logAuthEvent } from "@/lib/auth-log";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  // Redirect to /admin if already authenticated as admin
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const role = user.app_metadata?.role;
        if (role === "admin") {
          setCheckingAuth(false);
          router.push("/admin");
          return;
        }
      }

      setCheckingAuth(false);
    };

    checkAuth();
  }, [router, supabase]);

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-accent" />
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        // Log failed attempt
        await logAuthEvent(email, "login_failed", {
          reason: signInError.message,
          source: "admin",
        });
        throw signInError;
      }

      // Check if user is admin
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const role = user?.app_metadata?.role;

      if (role !== "admin") {
        // scope: 'global' revokes all refresh tokens server-side
        await supabase.auth.signOut({ scope: "global" });
        await logAuthEvent(email, "login_failed", {
          reason: "not_admin",
          source: "admin",
        });
        setError(
          "Esta conta não tem permissões de administrador. Aceda ao portal de cliente.",
        );
        return;
      }

      // Log successful admin login
      await logAuthEvent(email, "login_success", { source: "admin" });

      // Check if MFA is enrolled — if so, redirect to MFA verification
      const { data: mfaData } = await supabase.auth.mfa.listFactors();
      const hasMfa = mfaData?.totp?.some((f) => f.status === "verified");
      if (hasMfa) {
        router.push("/admin/login/mfa");
        return;
      }

      router.push("/admin");
    } catch {
      setError("Email ou palavra-passe incorretos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo Issencial */}
        <div className="text-center mb-8">
          <Image
            src="/logo/principal_branco.png"
            alt="Issencial"
            width={180}
            height={45}
            className="object-contain h-9 w-auto mx-auto"
            priority
          />
          <p className="text-gray-500 mt-4">
            Área restrita — administradores
          </p>
        </div>

        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-8 shadow-sm">
          <h2 className="text-lg font-semibold text-white mb-6 text-center">
            Acesso Administrador
          </h2>

          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="admin-email"
                className="text-sm font-medium text-gray-300"
              >
                Email
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                />
                <input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@issencial.pt"
                  required
                  className="w-full rounded-xl border border-gray-700 bg-gray-800 pl-10 pr-4 py-3 text-sm text-white outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/20 placeholder:text-gray-500"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="admin-password"
                className="text-sm font-medium text-gray-300"
              >
                Palavra-passe
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                />
                <input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-xl border border-gray-700 bg-gray-800 pl-10 pr-4 py-3 text-sm text-white outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/20 placeholder:text-gray-500"
                />
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-xl text-sm bg-red-900/30 border border-red-800 text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-accent text-gray-950 py-3 text-sm font-semibold hover:bg-accent-light transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? "A verificar..." : "Entrar como Admin"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
            >
              Acesso Cliente
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          Apenas administradores autorizados. Todos os acessos são registados.
        </p>
      </div>
    </div>
  );
}
