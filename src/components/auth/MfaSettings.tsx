"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Shield,
  ShieldCheck,
  ShieldOff,
  Key,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Copy,
  RefreshCw,
  Printer,
} from "lucide-react";
import DOMPurify from "dompurify";
import { createClient } from "@/lib/supabase/client";

type MfaState = "loading" | "off" | "enrolling" | "verify_enroll" | "on" | "recovery_codes";

export default function MfaSettings() {
  const [state, setState] = useState<MfaState>("loading");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [verifyCode, setVerifyCode] = useState("");
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [generatingCodes, setGeneratingCodes] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const supabase = createClient();

  // ── Load MFA status ───────────────────────────────────
  const checkMfaStatus = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;

      const verifiedTotp = data.totp?.find((f) => f.status === "verified");

      if (verifiedTotp) {
        setFactorId(verifiedTotp.id);
        setState("on");
      } else {
        setState("off");
      }
    } catch {
      setState("off");
    }
  }, []);

  useEffect(() => {
    checkMfaStatus();
  }, [checkMfaStatus]);

  // ── Enroll (start) ────────────────────────────────────
  const handleEnroll = async () => {
    setActionLoading(true);
    setMessage(null);

    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
      });
      if (error) throw error;

      setFactorId(data.id);
      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setState("enrolling");
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.message || "Erro ao iniciar configuração 2FA.",
      });
    }

    setActionLoading(false);
  };

  // ── Generate recovery codes ──────────────────────────
  const generateRecoveryCodes = async () => {
    setGeneratingCodes(true);
    try {
      const res = await fetch("/api/auth/mfa/generate-recovery", {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.codes) {
        setRecoveryCodes(data.codes);
        setState("recovery_codes");
      } else {
        setMessage({
          type: "error",
          text: data.error || "Erro ao gerar códigos de recuperação.",
        });
      }
    } catch {
      setMessage({
        type: "error",
        text: "Erro ao gerar códigos de recuperação.",
      });
    }
    setGeneratingCodes(false);
  };

  // ── Challenge + Verify ────────────────────────────────
  const handleVerify = async () => {
    if (!factorId || verifyCode.length < 6) return;

    setActionLoading(true);
    setVerifyError(null);
    setMessage(null);

    try {
      // Create challenge
      const { data: challenge, error: challengeError } =
        await supabase.auth.mfa.challenge({ factorId });
      if (challengeError) throw challengeError;

      // Verify code
      const { error: verifyError } =
        await supabase.auth.mfa.verify({
          factorId,
          challengeId: challenge.id,
          code: verifyCode,
        });

      if (verifyError) {
        setVerifyError("Código inválido. Tente novamente.");
      } else {
        // 2FA verified — generate and show recovery codes directly
        await generateRecoveryCodes();
      }
    } catch (err: any) {
      setVerifyError(err.message || "Erro ao verificar código.");
    }

    setActionLoading(false);
  };

  // ── Unenroll (disable) ────────────────────────────────
  const handleDisable = async () => {
    if (!factorId) return;

    setActionLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.mfa.unenroll({
        factorId,
      });
      if (error) throw error;

      setFactorId(null);
      setQrCode("");
      setSecret("");
      setVerifyCode("");
      setState("off");
      setMessage({
        type: "success",
        text: "2FA desativado com sucesso.",
      });
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.message || "Erro ao desativar 2FA.",
      });
    }

    setActionLoading(false);
  };

  // ── Cancel enrollment ─────────────────────────────────
  const handleCancel = () => {
    setFactorId(null);
    setQrCode("");
    setSecret("");
    setVerifyCode("");
    setVerifyError(null);
    setState("off");
  };

  // ── Copy secret to clipboard ──────────────────────────
  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    setMessage({ type: "success", text: "Chave secreta copiada!" });
    setTimeout(() => setMessage(null), 2000);
  };

  // ── Loading ───────────────────────────────────────────
  if (state === "loading") {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 size={20} className="animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status indicator */}
      <div className="flex items-center gap-3">
        {state === "on" || state === "recovery_codes" ? (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50">
            <ShieldCheck size={20} className="text-green-600" />
          </div>
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50">
            <ShieldOff size={20} className="text-gray-400" />
          </div>
        )}
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">
            Autenticação de Dois Fatores (2FA)
          </p>
          <p className="text-xs text-gray-400">
            {state === "on"
              ? "Protegido com 2FA via aplicação autenticadora"
              : state === "recovery_codes"
                ? "Guarde os códigos de recuperação abaixo"
                : state === "enrolling" || state === "verify_enroll"
                  ? "A configurar 2FA..."
                  : "Adicione uma camada extra de segurança à sua conta"}
          </p>
        </div>
        {(state === "on" || state === "recovery_codes") && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium bg-green-50 text-green-600 border border-green-200">
            <ShieldCheck size={12} />
            Ativo
          </span>
        )}
      </div>

      {/* ── State: OFF ─────────────────────────────────── */}
      {state === "off" && (
        <button
          onClick={handleEnroll}
          disabled={actionLoading}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-light transition-all disabled:opacity-40"
        >
          {actionLoading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Shield size={16} />
          )}
          {actionLoading ? "A preparar..." : "Ativar 2FA"}
        </button>
      )}

      {/* ── State: ENROLLING (QR Code) ─────────────────── */}
      {(state === "enrolling" || state === "verify_enroll") && (
        <div className="space-y-5">
          <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              1. Escanea o código QR
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              Abre a tua aplicação autenticadora (Google Authenticator,
              Authy, etc.) e escanea o código abaixo.
            </p>

            {/* QR Code */}
            {qrCode && (
              <div className="flex justify-center mb-4">
                <div
                  className="rounded-xl border border-gray-200 bg-white p-4"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(qrCode) }}
                />
              </div>
            )}

            {/* Manual secret */}
            {secret && (
              <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 px-3 py-2">
                <Key size={14} className="text-gray-400 flex-shrink-0" />
                <code className="text-xs font-mono text-gray-600 flex-1 break-all select-all">
                  {secret}
                </code>
                <button
                  onClick={copySecret}
                  className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all"
                  title="Copiar chave secreta"
                >
                  <Copy size={14} />
                </button>
              </div>
            )}
          </div>

          {/* Verify code */}
          <div className="rounded-xl border border-gray-100 bg-white p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              2. Verifica o código
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              Insere o código de 6 dígitos gerado pela aplicação
              autenticadora para confirmar.
            </p>

            <div className="flex gap-3">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={verifyCode}
                onChange={(e) => {
                  setVerifyCode(e.target.value.replace(/\D/g, ""));
                  setVerifyError(null);
                }}
                placeholder="000000"
                className="flex-1 rounded-xl border border-gray-200 bg-light/50 px-4 py-3 text-center text-lg font-mono tracking-[0.5em] text-dark outline-none transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 placeholder:text-gray-300"
              />
              <button
                onClick={handleVerify}
                disabled={verifyCode.length < 6 || actionLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary-light transition-all disabled:opacity-40"
              >
                {actionLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <ArrowRight size={16} />
                )}
                Verificar
              </button>
            </div>

            {verifyError && (
              <div className="flex items-center gap-2 mt-3 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs">
                <AlertCircle size={14} />
                {verifyError}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleEnroll}
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              <RefreshCw size={14} />
              Gerar novo código
            </button>
          </div>
        </div>
      )}

      {/* ── State: ON ──────────────────────────────────── */}
      {state === "on" && (
        <div className="space-y-3">
          <div className="rounded-xl border border-green-100 bg-green-50/50 p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-800 mb-1">
                  A sua conta está protegida com 2FA
                </p>
                <p className="text-xs text-green-600">
                  Sempre que fizer login, será solicitado um código de
                  autenticação adicional além da sua password.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={generateRecoveryCodes}
              disabled={generatingCodes}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-40"
            >
              {generatingCodes ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Key size={16} />
              )}
              {generatingCodes ? "A gerir..." : "Gerir códigos de recuperação"}
            </button>
            <button
              onClick={handleDisable}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-all disabled:opacity-40"
            >
              {actionLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <ShieldOff size={16} />
              )}
              {actionLoading ? "A desativar..." : "Desativar 2FA"}
            </button>
          </div>
        </div>
      )}

      {/* ── State: RECOVERY CODES ──────────────────────── */}
      {state === "recovery_codes" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
            <div className="flex items-start gap-3 mb-3">
              <Key size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-amber-800 mb-1">
                  Códigos de Recuperação
                </h3>
                <p className="text-xs text-amber-700">
                  Guarde estes códigos num local seguro. Cada código só pode ser
                  usado uma vez para aceder à sua conta caso perca o acesso à
                  aplicação autenticadora.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-amber-200 p-4 mb-4" id="recovery-codes-list">
              <div className="grid grid-cols-2 gap-2">
                {recoveryCodes.map((code, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 font-mono text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2"
                  >
                    <span className="text-[10px] text-gray-400 font-sans w-5">
                      {i + 1}.
                    </span>
                    <span className="tracking-wider">{code}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  const text = recoveryCodes
                    .map((c, i) => `${i + 1}. ${c}`)
                    .join("\n");
                  navigator.clipboard.writeText(
                    `Issencial — Códigos de Recuperação 2FA\n\n${text}\n\nGuarde estes códigos num local seguro. Cada código só pode ser usado uma vez.`,
                  );
                  setMessage({
                    type: "success",
                    text: "Códigos copiados! Guarde-os num local seguro.",
                  });
                  setTimeout(() => setMessage(null), 3000);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-700 transition-all"
              >
                <Copy size={14} />
                Copiar
              </button>

              <button
                onClick={() => {
                  const printWindow = window.open("", "_blank");
                  if (!printWindow) return;
                  const codeRows = recoveryCodes
                    .map((c, i) => `<tr><td style="padding:6px 12px;font-family:monospace;font-size:14px;border:1px solid #e5e7eb;">${i + 1}.</td><td style="padding:6px 12px;font-family:monospace;font-size:14px;letter-spacing:3px;border:1px solid #e5e7eb;">${c}</td></tr>`)
                    .join("");
                  printWindow.document.write(`
                    <html>
                      <head><title>Issencial — Códigos de Recuperação</title></head>
                      <body style="font-family:sans-serif;padding:40px;max-width:500px;margin:0 auto;">
                        <h2 style="margin-bottom:8px;">Issencial — Códigos de Recuperação 2FA</h2>
                        <p style="color:#666;font-size:14px;margin-bottom:24px;">Guarde este documento num local seguro. Cada código só pode ser usado uma vez.</p>
                        <table style="border-collapse:collapse;width:100%;">
                          ${codeRows}
                        </table>
                        <p style="color:#999;font-size:11px;margin-top:24px;">Gerado a ${new Date().toLocaleString("pt-PT")}</p>
                      </body>
                    </html>
                  `);
                  printWindow.document.close();
                  printWindow.print();
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-white px-4 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-50 transition-all"
              >
                <Printer size={14} />
                Imprimir
              </button>
            </div>
          </div>

          <button
            onClick={() => {
              setState("on");
              setMessage(null);
            }}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Já guardei. Voltar às definições.
          </button>
        </div>
      )}

      {/* ── Global message ─────────────────────────────── */}
      {message && (
        <div
          className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
            message.type === "success"
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 size={16} className="flex-shrink-0" />
          ) : (
            <AlertCircle size={16} className="flex-shrink-0" />
          )}
          {message.text}
        </div>
      )}
    </div>
  );
}
