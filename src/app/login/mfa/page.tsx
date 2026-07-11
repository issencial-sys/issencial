"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Loader2, Shield, ArrowRight, AlertCircle, Clock, Key } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ClientMfaPage() {
  const [mode, setMode] = useState<"totp" | "recovery">("totp");
  const [code, setCode] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [rateLimited, setRateLimited] = useState(false);
  const [remainingAttempts, setRemainingAttempts] = useState(5);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const router = useRouter();
  const supabase = createClient();

  // Rate limit check
  const checkRateLimit = async (): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/mfa/check", { method: "POST" });
      const data = await res.json();
      setRemainingAttempts(data.remaining);
      if (!data.allowed) {
        setRateLimited(true);
        startCooldown(data.resetMs);
        return false;
      }
      return true;
    } catch {
      // Fail open if rate limit API is unavailable
      return true;
    }
  };

  const startCooldown = (ms: number) => {
    const seconds = Math.ceil(ms / 1000);
    setCooldownSeconds(seconds);

    cooldownRef.current = setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current);
          setRateLimited(false);
          setRemainingAttempts(5);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Clean up cooldown interval on unmount
  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  useEffect(() => {
    const checkMfa = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Non-admin users: make sure they're not an admin
      const role = user.app_metadata?.role;
      if (role === "admin") {
        router.push("/admin/login/mfa");
        return;
      }

      // Find the verified TOTP factor to challenge
      const { data } = await supabase.auth.mfa.listFactors();
      const verifiedTotp = data?.totp?.find((f) => f.status === "verified");

      if (!verifiedTotp) {
        // No verified factors — MFA not configured, go to portal
        const params = new URLSearchParams(window.location.search);
        const redirectTo = params.get("redirect") || "/portal";
        router.push(redirectTo);
        return;
      }

      setFactorId(verifiedTotp.id);
      setChecking(false);
    };

    checkMfa();
  }, []);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "totp") {
      if (!factorId || code.length < 6 || rateLimited) return;

      const allowed = await checkRateLimit();
      if (!allowed) return;

      setLoading(true);
      setError(null);

      try {
        const { data: challenge, error: challengeError } =
          await supabase.auth.mfa.challenge({ factorId });
        if (challengeError) throw challengeError;

        const { error: verifyError } = await supabase.auth.mfa.verify({
          factorId,
          challengeId: challenge.id,
          code,
        });
        if (verifyError) throw verifyError;

        // Persist the AAL2 session explicitly (see admin MFA page for why).
        const { data: sessionData } = await supabase.auth.refreshSession();
        if (sessionData.session) {
          await supabase.auth.setSession(sessionData.session);
        }

        const params = new URLSearchParams(window.location.search);
        const redirectTo = params.get("redirect") || "/portal";
        router.push(redirectTo);
      } catch {
        setRemainingAttempts((prev) => Math.max(prev - 1, 0));
        setError("Código inválido. Tente novamente.");
      } finally {
        setLoading(false);
      }
    } else {
      // Recovery code mode
      if (!recoveryCode.trim() || rateLimited) return;

      const allowed = await checkRateLimit();
      if (!allowed) return;

      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/auth/mfa/verify-recovery", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: recoveryCode.trim() }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Código inválido.");
        }

        const params = new URLSearchParams(window.location.search);
        const redirectTo = params.get("redirect") || "/portal";
        router.push(redirectTo);
      } catch (err: any) {
        setRemainingAttempts((prev) => Math.max(prev - 1, 0));
        setError(err.message || "Código de recuperação inválido.");
      } finally {
        setLoading(false);
      }
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
            Verificação adicional de segurança
          </p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
          <div className="flex flex-col items-center mb-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mb-4">
              <Shield size={28} className="text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-dark text-center">
              Autenticação de Dois Fatores
            </h2>
            {mode === "totp" ? (
              <p className="text-sm text-gray-500 text-center mt-2">
                Insira o código de 6 dígitos gerado pela sua aplicação
                autenticadora.
              </p>
            ) : (
              <p className="text-sm text-gray-500 text-center mt-2">
                Insira um dos seus códigos de recuperação.
              </p>
            )}
          </div>

          <form onSubmit={handleVerify} className="flex flex-col gap-6">
            {mode === "totp" ? (
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.replace(/\D/g, ""));
                  setError(null);
                }}
                placeholder="000000"
                autoFocus
                className="w-full rounded-xl border border-gray-200 bg-light/50 px-4 py-4 text-center text-2xl font-mono tracking-[0.5em] text-dark outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-gray-300"
              />
            ) : (
              <input
                type="text"
                value={recoveryCode}
                onChange={(e) => {
                  setRecoveryCode(e.target.value.toUpperCase());
                  setError(null);
                }}
                placeholder="XXXXX-XXXXX"
                autoFocus
                className="w-full rounded-xl border border-gray-200 bg-light/50 px-4 py-4 text-center text-xl font-mono tracking-[0.3em] text-dark outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-gray-300"
              />
            )}

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            {rateLimited ? (
              <div className="w-full rounded-xl bg-red-50 border border-red-200 p-4 text-center">
                <div className="flex items-center justify-center gap-2 text-red-600 text-sm font-medium mb-2">
                  <Clock size={16} />
                  Demasiadas tentativas
                </div>
                <p className="text-xs text-red-500">
                  Aguarde {cooldownSeconds}s para tentar novamente.
                </p>
              </div>
            ) : (
              <>
                {remainingAttempts < 3 && remainingAttempts > 0 && (
                  <p className="text-xs text-amber-600 text-center">
                    {remainingAttempts} tentativa{remainingAttempts !== 1 ? "s" : ""} restante{remainingAttempts !== 1 ? "s" : ""}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={
                    (mode === "totp" ? code.length < 6 : !recoveryCode.trim()) || loading
                  }
                  className="w-full rounded-xl bg-primary text-white py-3 text-sm font-semibold hover:bg-primary-light transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {loading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <ArrowRight size={16} />
                  )}
                  {loading ? "A verificar..." : "Verificar Código"}
                </button>
              </>
            )}
          </form>

          {/* Toggle mode */}
          <div className="mt-4 text-center">
            {mode === "totp" ? (
              <button
                onClick={() => {
                  setMode("recovery");
                  setError(null);
                  setCode("");
                }}
                className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-primary transition-colors"
              >
                <Key size={12} />
                Usar código de recuperação
              </button>
            ) : (
              <button
                onClick={() => {
                  setMode("totp");
                  setError(null);
                  setRecoveryCode("");
                }}
                className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-primary transition-colors"
              >
                <Shield size={12} />
                Usar aplicação autenticadora
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Use o Google Authenticator, Authy ou outra aplicação compatível.
        </p>
      </div>
    </div>
  );
}
