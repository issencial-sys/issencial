"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, Shield, ArrowRight, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function AdminMfaPage() {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [factorId, setFactorId] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

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

      // Check which factors need verification
      const { data } = await supabase.auth.mfa.listFactors();
      const unverifiedTotp = data?.totp?.find((f) => f.status !== "verified");

      if (!unverifiedTotp) {
        // No unverified factors — MFA not needed, go to admin
        router.push("/admin");
        return;
      }

      setFactorId(unverifiedTotp.id);
      setChecking(false);
    };

    checkMfa();
  }, []);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factorId || code.length < 6) return;

    setLoading(true);
    setError(null);

    try {
      // Challenge the factor
      const { data: challenge, error: challengeError } =
        await supabase.auth.mfa.challenge({ factorId });
      if (challengeError) throw challengeError;

      // Verify the code
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code,
      });
      if (verifyError) throw verifyError;

      // MFA verified — redirect to admin
      router.push("/admin");
    } catch {
      setError("Código inválido. Tente novamente.");
    } finally {
      setLoading(false);
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
            <p className="text-sm text-gray-500 text-center mt-2">
              Insira o código de 6 dígitos gerado pela sua aplicação
              autenticadora.
            </p>
          </div>

          <form onSubmit={handleVerify} className="flex flex-col gap-6">
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

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-900/30 border border-red-800 text-red-400 text-sm">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={code.length < 6 || loading}
              className="w-full rounded-xl bg-accent text-gray-950 py-3 text-sm font-semibold hover:bg-accent-light transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <ArrowRight size={16} />
              )}
              {loading ? "A verificar..." : "Verificar Código"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          Use o Google Authenticator, Authy ou outra aplicação compatível.
        </p>
      </div>
    </div>
  );
}
