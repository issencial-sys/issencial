import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-6xl font-bold text-accent mb-4">404</div>
        <h1 className="text-2xl font-bold text-primary mb-3">
          Página não encontrada
        </h1>
        <p className="text-gray-500 mb-8 leading-relaxed">
          A página que procura não existe ou foi movida.
          Verifique o endereço ou navegue para uma das nossas páginas principais.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-light transition-all"
          >
            Página Inicial
          </Link>
          <Link
            href="/servicos"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-6 py-3 text-sm font-semibold text-primary hover:bg-gray-50 transition-all"
          >
            Ver Serviços
          </Link>
          <Link
            href="/contacto"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-6 py-3 text-sm font-semibold text-primary hover:bg-gray-50 transition-all"
          >
            Contacto
          </Link>
        </div>
      </div>
    </div>
  );
}
