"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Layers, LogOut, Settings } from "lucide-react";

export default function PortalPage() {
  const [loggedIn, setLoggedIn] = useState(false);

  if (loggedIn) {
    return (
      <div className="min-h-screen bg-light flex">
        {/* Sidebar */}
        <aside className="hidden lg:flex w-[260px] flex-shrink-0 flex-col bg-primary text-white p-6">
          <div className="flex items-center gap-3 text-lg font-bold mb-8 pb-6 border-b border-white/10">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-primary">
              <Layers size={20} />
            </div>
            Issencial
          </div>
          <nav className="flex flex-col gap-1 flex-1">
            {[
              { icon: "/assets/icons/www.webp", label: "Dashboard", active: true },
              { icon: "/assets/icons/lista.webp", label: "Processos" },
              { icon: "/assets/icons/dinheiro-dolar.webp", label: "Pagamentos" },
              { icon: "/assets/icons/email.webp", label: "Mensagens" },
              { icon: "settings", label: "Definições" },
            ].map((item) => (
              <div key={item.label} className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium cursor-pointer transition-colors ${item.active ? "bg-accent/15 text-accent" : "text-white/60 hover:bg-white/10 hover:text-white"}`}>
                {item.icon === "settings" ? <Settings size={20} /> : <Image src={item.icon} alt="" width={20} height={20} />} {item.label}
              </div>
            ))}
          </nav>
          <button onClick={() => setLoggedIn(false)} className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm text-white/40 hover:text-white/70 mt-auto">
            <LogOut size={20} /> Sair
          </button>
        </aside>

        {/* Main */}
        <main className="flex-1 p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="text-2xl font-bold">Bem-vindo, Maria!</div>
              <div className="text-sm text-gray-500 mt-1">Aqui está o resumo dos seus processos</div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">Maria Fernandes</span>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-primary font-bold">MF</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[
              { label: "Processos Ativos", value: "3", change: "↑ 1 este mês" },
              { label: "Concluídos", value: "12", change: "↑ 2 este mês" },
              { label: "Mensagens", value: "5", change: "2 não lidas" },
              { label: "Próximo Pagamento", value: "€450", change: "Vence em 15 dias" },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-gray-100 bg-white p-6">
                <div className="text-sm text-gray-400 mb-2">{s.label}</div>
                <div className="text-2xl font-bold">{s.value}</div>
                <div className="text-xs text-green-600 mt-1">{s.change}</div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h3 className="font-semibold">Atividade Recente</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {[
                { title: "Processo de visto — Fase 2 concluída", time: "Há 2 horas", status: "Concluído" },
                { title: "Documentos de transferência recebidos", time: "Há 1 dia", status: "Pendente" },
                { title: "Pagamento de propina processado", time: "Há 3 dias", status: "Processado" },
                { title: "Nova mensagem do consultor", time: "Há 5 dias", status: "Não lido" },
              ].map((activity, i) => (
                <div key={i} className="flex items-center justify-between px-6 py-4">
                  <div>
                    <div className="text-sm font-medium">{activity.title}</div>
                    <div className="text-xs text-gray-400 mt-1">{activity.time}</div>
                  </div>
                  <span className={`text-xs font-medium px-3 py-1 rounded-full ${
                    activity.status === "Concluído" ? "bg-green-50 text-green-700" :
                    activity.status === "Pendente" ? "bg-yellow-50 text-yellow-700" :
                    activity.status === "Processado" ? "bg-blue-50 text-blue-700" :
                    "bg-red-50 text-red-700"
                  }`}>
                    {activity.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 text-2xl font-bold">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Layers size={22} />
            </div>
            Issencial
          </Link>
          <p className="text-muted mt-3">Acesse o seu portal de cliente</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <h2 className="text-xl font-bold mb-6 text-center">Entrar no Portal</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setLoggedIn(true);
            }}
            className="flex flex-col gap-5"
          >
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <input
                id="email"
                type="email"
                required
                placeholder="email@exemplo.pt"
                className="rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="text-sm font-medium">Palavra-passe</label>
              <input
                id="password"
                type="password"
                required
                placeholder="••••••••"
                className="rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-xl bg-primary text-primary-foreground py-3 text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Entrar
            </button>
          </form>
          <p className="text-center text-sm text-muted mt-6">
            Não tem conta? <Link href="/contacto" className="text-primary font-medium hover:underline">Contacte-nos</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
