"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  MessageSquare,
  FileText,
  Users,
  Receipt,
  ArrowRight,
  Loader2,
  TrendingUp,
  Activity,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import SimpleChart from "@/components/ui/SimpleChart";

interface AdminStats {
  newContacts: number;
  activeProcesses: number;
  totalClients: number;
  pendingInvoices: number;
  pendingInvoicesAmount: number;
}

interface DailyActivity {
  date: string;
  label: string;
  processes: number;
  messages: number;
  contacts: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats>({
    newContacts: 0,
    activeProcesses: 0,
    totalClients: 0,
    pendingInvoices: 0,
    pendingInvoicesAmount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [dailyActivity, setDailyActivity] = useState<DailyActivity[]>([]);
  const supabase = createClient();

  useEffect(() => {
    const fetchStats = async () => {
      const { count: contactsCount } = await supabase
        .from("contact_submissions")
        .select("*", { count: "exact", head: true })
        .eq("read", false);

      const { count: activeProcesses } = await supabase
        .from("processes")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      const { count: totalClients } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      const { data: pendingInvoices } = await supabase
        .from("invoices")
        .select("amount")
        .in("status", ["pending", "overdue"]);

      const pendingCount = pendingInvoices?.length ?? 0;
      const pendingAmount =
        pendingInvoices?.reduce((sum, inv) => sum + Number(inv.amount), 0) ?? 0;

      setStats({
        newContacts: contactsCount ?? 0,
        activeProcesses: activeProcesses ?? 0,
        totalClients: totalClients ?? 0,
        pendingInvoices: pendingCount,
        pendingInvoicesAmount: pendingAmount,
      });
      // Fetch daily activity for chart (last 7 days)
      const weeklyData: DailyActivity[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayStart = d.toISOString().split("T")[0];
        const dayEnd = new Date(d.getTime() + 86400000).toISOString().split("T")[0];

        const [procCount, msgCount, contCount] = await Promise.all([
          supabase
            .from("processes")
            .select("*", { count: "exact", head: true })
            .gte("created_at", dayStart)
            .lt("created_at", dayEnd),
          supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .gte("created_at", dayStart)
            .lt("created_at", dayEnd),
          supabase
            .from("contact_submissions")
            .select("*", { count: "exact", head: true })
            .gte("created_at", dayStart)
            .lt("created_at", dayEnd),
        ]);

        weeklyData.push({
          date: dayStart,
          label: d.toLocaleDateString("pt-PT", { weekday: "short" }).slice(0, 3),
          processes: procCount.count ?? 0,
          messages: msgCount.count ?? 0,
          contacts: contCount.count ?? 0,
        });
      }

      setDailyActivity(weeklyData);
      setLoading(false);
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  const cards = [
    {
      label: "Novos Contactos",
      value: String(stats.newContacts),
      desc: "Por responder",
      href: "/admin/contactos",
      icon: MessageSquare,
      highlight: stats.newContacts > 0,
      color: "text-blue-600 bg-blue-50",
    },
    {
      label: "Processos Ativos",
      value: String(stats.activeProcesses),
      desc: "Em andamento",
      href: "/admin/processos",
      icon: FileText,
      color: "text-green-600 bg-green-50",
    },
    {
      label: "Clientes Registados",
      value: String(stats.totalClients),
      desc: "Total na plataforma",
      href: "/admin/clientes",
      icon: Users,
      color: "text-purple-600 bg-purple-50",
    },
    {
      label: "Faturas Pendentes",
      value: String(stats.pendingInvoices),
      desc: `€${stats.pendingInvoicesAmount.toFixed(2)} em aberto`,
      href: "/admin/faturas",
      icon: Receipt,
      highlight: stats.pendingInvoices > 0,
      color: "text-yellow-600 bg-yellow-50",
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Admin</h1>
        <p className="text-gray-500 mt-1">
          Visão geral do negócio — acompanhe contactos, processos e faturas.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className={`group rounded-2xl border p-6 transition-all duration-200 hover:-translate-y-0.5 ${
              c.highlight
                ? "border-accent/30 bg-accent/5 hover:shadow-lg hover:shadow-accent/10"
                : "border-gray-200 bg-white hover:shadow-lg"
            }`}
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${c.color} mb-4`}>
              <c.icon size={20} />
            </div>
            <div className="text-sm text-gray-500 mb-1">{c.label}</div>
            <div className="text-3xl font-bold text-gray-900">{c.value}</div>
            <div className="text-xs text-gray-400 mt-2 flex items-center gap-1">
              {c.desc}
              <ArrowRight
                size={12}
                className="opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0"
              />
            </div>
          </Link>
        ))}
      </div>

      {/* ─── Activity Chart ─── */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Activity size={18} />
          Atividade dos Últimos 7 Dias
        </h2>
        {dailyActivity.length > 0 && (
          <div>
            <div className="flex gap-4 mb-2">
              <span className="flex items-center gap-1.5 text-[10px] font-medium text-primary">
                <span className="w-2.5 h-2.5 rounded-sm bg-primary/60" />
                Processos
              </span>
              <span className="flex items-center gap-1.5 text-[10px] font-medium text-blue-500">
                <span className="w-2.5 h-2.5 rounded-sm bg-blue-300" />
                Mensagens
              </span>
              <span className="flex items-center gap-1.5 text-[10px] font-medium text-amber-500">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-300" />
                Contactos
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-[10px] text-gray-400 mb-1.5">Processos</p>
                <SimpleChart
                  data={dailyActivity.map((d) => ({
                    label: d.label,
                    value: d.processes,
                    color: "bg-primary/60",
                  }))}
                  height={80}
                />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 mb-1.5">Mensagens</p>
                <SimpleChart
                  data={dailyActivity.map((d) => ({
                    label: d.label,
                    value: d.messages,
                    color: "bg-blue-300",
                  }))}
                  height={80}
                />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 mb-1.5">Contactos</p>
                <SimpleChart
                  data={dailyActivity.map((d) => ({
                    label: d.label,
                    value: d.contacts,
                    color: "bg-amber-300",
                  }))}
                  height={80}
                />
              </div>
            </div>
          </div>
        )}
        {dailyActivity.every((d) => d.processes === 0 && d.messages === 0 && d.contacts === 0) && (
          <p className="text-xs text-gray-400 text-center py-4">
            Sem atividade registada nos últimos 7 dias.
          </p>
        )}
      </div>

      {/* Quick actions */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp size={18} />
          Ações Rápidas
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              label: "Novos Contactos",
              href: "/admin/contactos",
              desc: stats.newContacts > 0 ? `${stats.newContacts} por responder` : "Nenhum novo",
            },
            {
              label: "Gerir Processos",
              href: "/admin/processos",
              desc: `${stats.activeProcesses} ativos`,
            },
            {
              label: "Faturas",
              href: "/admin/faturas",
              desc: `€${stats.pendingInvoicesAmount.toFixed(2)} pendentes`,
            },
          ].map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/50 px-5 py-4 transition-all hover:bg-white hover:shadow-sm hover:border-gray-200 group"
            >
              <div>
                <div className="text-sm font-medium text-gray-900">
                  {action.label}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {action.desc}
                </div>
              </div>
              <ArrowRight
                size={16}
                className="text-gray-300 transition-all group-hover:text-primary group-hover:translate-x-0.5"
              />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
