"use client";

import Link from "next/link";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-6xl font-bold text-accent mb-4">500</div>
        <h1 className="text-2xl font-bold text-primary mb-3">
          Ocorreu um erro inesperado
        </h1>
        <p className="text-gray-500 mb-8 leading-relaxed">
          Pedimos desculpa pelo incómodo. A nossa equipa já foi notificada
          e estamos a trabalhar para resolver o problema.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-light transition-all"
          >
            Tentar novamente
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-6 py-3 text-sm font-semibold text-primary hover:bg-gray-50 transition-all"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}
