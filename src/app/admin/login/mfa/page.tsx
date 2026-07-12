"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, Shield, ArrowRight, AlertCircle, Clock, Key } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function AdminMfaPage() {
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
        router.push("/admin/login");
        return;
      }

      const role = user.app_metadata?.role;
      if (role !== "admin") {
        router.push("/portal");
        return;
      }

      // If MFA is already verified for this session, skip the challenge
      const { data: aal } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aal?.currentLevel === "aal2") {
        router.push("/admin");
        return;
      }

      // Find the verified TOTP factor to challenge
      const { data } = await supabase.auth.mfa.listFactors();
      const verifiedTotp = data?.totp?.find((f) => f.status === "verified");

      if (!verifiedTotp) {
        // No verified factors — MFA not configured, go to admin
        router.push("/admin");
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

      // Check rate limit before attempting
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

        // mfa.verify() already calls _saveSession internally and persists the
        // upgraded AAL2 session to the auth cookies via the @supabase/ssr
        // browser client. Do NOT call getSession()+setSession() here — that
        // re-writes the store with the in-memory AAL1 session and wipes the
        // auth cookies (session disappears immediately after MFA).

        router.replace("/admin");
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
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Código inválido.");
        }

        // Recovery code verified — sign out MFA session and redirect
        router.push("/admin");
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
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
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
            Verificação adicional de segurança
          </p>
        </div>

        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-8 shadow-sm">
          <div className="flex flex-col items-center mb-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/15 mb-4">
              <Shield size={28} className="text-accent" />
            </div>
            <h2 className="text-lg font-semibold text-white text-center">
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
                className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-4 text-center text-2xl font-mono tracking-[0.5em] text-white outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/20 placeholder:text-gray-600"
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
                className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-4 text-center text-xl font-mono tracking-[0.3em] text-white outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/20 placeholder:text-gray-600"
              />
            )}

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-900/30 border border-red-800 text-red-400 text-sm">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            {rateLimited ? (
              <div className="w-full rounded-xl bg-red-900/30 border border-red-800 p-4 text-center">
                <div className="flex items-center justify-center gap-2 text-red-400 text-sm font-medium mb-2">
                  <Clock size={16} />
                  Demasiadas tentativas
                </div>
                <p className="text-xs text-red-400/70">
                  Aguarde {cooldownSeconds}s para tentar novamente.
                </p>
              </div>
            ) : (
              <>
                {remainingAttempts < 3 && remainingAttempts > 0 && (
                  <p className="text-xs text-yellow-400/70 text-center">
                    {remainingAttempts} tentativa{remainingAttempts !== 1 ? "s" : ""} restante{remainingAttempts !== 1 ? "s" : ""}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={
                    (mode === "totp" ? code.length < 6 : !recoveryCode.trim()) || loading
                  }
                  className="w-full rounded-xl bg-accent text-gray-950 py-3 text-sm font-semibold hover:bg-accent-light transition-all flex items-center justify-center gap-2 disabled:opacity-60"
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
                className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-accent transition-colors"
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
                className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-accent transition-colors"
              >
                <Shield size={12} />
                Usar aplicação autenticadora
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          Use o Google Authenticator, Authy ou outra aplicação compatível.
        </p>
      </div>
    </div>
  );
}
