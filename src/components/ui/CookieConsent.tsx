"use client";

import { useState, useEffect } from "react";
import { Cookie, X } from "lucide-react";
import Link from "next/link";

const COOKIE_CONSENT_KEY = "issencial_cookie_consent";

type ConsentChoice = "accepted" | "declined" | null;

export default function CookieConsent() {
  const [consent, setConsent] = useState<ConsentChoice>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY) as ConsentChoice;
    if (!stored) {
      // Delay showing the banner slightly for a better UX
      const timer = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(timer);
    }
    setConsent(stored);
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    setConsent("accepted");
    setVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "declined");
    setConsent("declined");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6">
      <div className="mx-auto max-w-3xl">
        <div className="relative rounded-2xl border border-gray-100 bg-white/95 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.1)] p-5 md:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Close button — only hides, doesn't store preference */}
          <button
            onClick={() => setVisible(false)}
            className="absolute top-3 right-3 sm:hidden flex h-6 w-6 items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Fechar"
          >
            <X size={14} />
          </button>

          {/* Icon */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-primary">
            <Cookie size={20} />
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-600 leading-relaxed">
              Utilizamos cookies próprios e de terceiros para melhorar a sua experiência no nosso website. Ao continuar, concorda com a nossa{" "}
              <Link href="/termos-privacidade#cookies" className="font-medium text-primary underline underline-offset-2 hover:text-primary-light transition-colors">
                Política de Cookies
              </Link>.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <button
              onClick={handleDecline}
              className="flex-1 sm:flex-none rounded-lg border border-gray-200 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-gray-500 transition-all hover:bg-gray-50 hover:border-gray-300"
            >
              Recusar
            </button>
            <button
              onClick={handleAccept}
              className="flex-1 sm:flex-none rounded-lg bg-primary px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-white transition-all hover:bg-primary-light"
            >
              Aceitar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
