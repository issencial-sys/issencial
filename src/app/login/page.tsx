"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Mail,
  Lock,
  User,
  Loader2,
  Shield,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logAuthEvent } from "@/lib/auth-log";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Get redirect param from URL safely (avoids useSearchParams Suspense issue)
    const params = new URLSearchParams(window.location.search);
    const redirectTo = params.get("redirect") || "/portal";

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        router.push(redirectTo);
      }
      setChecking(false);
    });
  }, []);

  const getRedirectTo = () => {
    if (typeof window === "undefined") return "/portal";
    return new URLSearchParams(window.location.search).get("redirect") || "/portal";
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          // Log failed login attempt
          await logAuthEvent(email, "login_failed", {
            reason: error.message,
            source: "client",
          });
          throw error;
        }

        // Admin users must use /admin/login — sign them out with an error
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.app_metadata?.role === "admin") {
          await supabase.auth.signOut();
          await logAuthEvent(email, "login_failed", {
            reason: "admin_using_client_login",
            source: "client",
          });
          setError("Esta conta é de administrador. Use o acesso específico de administrador.");
          return;
        }

        // Log successful login
        await logAuthEvent(email, "login_success", { source: "client" });
        router.push(getRedirectTo());
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name, role: "client" } },
        });
        if (error) {
          await logAuthEvent(email, "signup_failed", {
            reason: error.message,
            source: "client",
          });
          throw error;
        }
        await logAuthEvent(email, "signup_success", { source: "client" });
        setMode("login");
        setError("Conta criada! Verifique o seu email para confirmar o registo.");
        setPassword("");
      }
    } catch {
      setError(
        mode === "register"
          ? "Não foi possível criar a conta. Verifique os dados e tente novamente."
          : "Email ou palavra-passe incorretos."
      );
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-light flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center bg-primary rounded-2xl p-5 mx-auto w-fit">
            <Image
              src="/logo/principal_branco.png"
              alt="Issencial"
              width={160}
              height={38}
              className="object-contain h-8 w-auto"
              priority
            />
          </Link>
          <p className="text-gray-500 mt-4">
            {mode === "login"
              ? "Aceda ao seu portal de cliente"
              : "Crie a sua conta de cliente"}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
          {/* Tabs */}
          <div className="flex mb-6 bg-light rounded-xl p-1">
            <button
              onClick={() => {
                setMode("login");
                setError(null);
              }}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                mode === "login"
                  ? "bg-white text-dark shadow-sm"
                  : "text-gray-400 hover:text-dark"
              }`}
            >
              Entrar
            </button>
            <button
              onClick={() => {
                setMode("register");
                setError(null);
              }}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                mode === "register"
                  ? "bg-white text-dark shadow-sm"
                  : "text-gray-400 hover:text-dark"
              }`}
            >
              Registar
            </button>
          </div>

          <form onSubmit={handleAuth} className="flex flex-col gap-5">
            {mode === "register" && (
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="login-name"
                  className="text-sm font-medium text-dark"
                >
                  Nome
                </label>
                <div className="relative">
                  <User
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    id="login-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="O seu nome"
                    required
                    className="w-full rounded-xl border border-gray-200 bg-light/50 pl-10 pr-4 py-3 text-sm text-dark outline-none transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 placeholder:text-gray-400"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="login-email"
                className="text-sm font-medium text-dark"
              >
                Email
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@exemplo.pt"
                  required
                  className="w-full rounded-xl border border-gray-200 bg-light/50 pl-10 pr-4 py-3 text-sm text-dark outline-none transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 placeholder:text-gray-400"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="login-password"
                className="text-sm font-medium text-dark"
              >
                Palavra-passe
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full rounded-xl border border-gray-200 bg-light/50 pl-10 pr-4 py-3 text-sm text-dark outline-none transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 placeholder:text-gray-400"
                />
              </div>
            </div>

            {error && (
              <div
                className={`p-4 rounded-xl text-sm ${
                  error.includes("Verifique")
                    ? "bg-blue-50 border border-blue-200 text-blue-700"
                    : "bg-red-50 border border-red-200 text-red-700"
                }`}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-primary text-white py-3 text-sm font-semibold hover:bg-primary-light transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading
                ? "A processar..."
                : mode === "login"
                  ? "Entrar"
                  : "Criar Conta"}
            </button>
          </form>

          <div className="mt-6 flex flex-col items-center gap-3 text-sm text-gray-400">
            <p>
              {mode === "login" ? (
                <>
                  Não tem conta?{" "}
                  <button
                    onClick={() => {
                      setMode("register");
                      setError(null);
                    }}
                    className="text-primary font-medium hover:underline"
                  >
                    Registar-se
                  </button>
                </>
              ) : (
                <>
                  Já tem conta?{" "}
                  <button
                    onClick={() => {
                      setMode("login");
                      setError(null);
                    }}
                    className="text-primary font-medium hover:underline"
                  >
                    Entrar
                  </button>
                </>
              )}
            </p>
            <Link
              href="/"
              className="text-gray-400 hover:text-primary transition-colors"
            >
              ← Voltar ao site
            </Link>
          </div>
        </div>

        {/* Admin login hint */}
        <div className="text-center mt-6">
          <Link
            href="/admin/login"
            className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-primary transition-colors"
          >
            <Shield size={12} />
            Acesso Administrador
          </Link>
        </div>
      </div>
    </div>
  );
}
