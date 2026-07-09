"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  MessageSquare,
  Receipt,
  ArrowRight,
  Loader2,
  Clock,
  CheckCircle2,
  MessageCircle,
  TrendingUp,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Breadcrumbs from "@/components/ui/Breadcrumbs";

interface DashboardData {
  activeProcesses: number;
  totalProcesses: number;
  unreadMessages: number;
  pendingInvoices: number;
  nextPayment: { amount: number; dueDate: string } | null;
}

interface ActivityItem {
  id: string;
  type: "process_update" | "new_message" | "new_invoice" | "status_change";
  title: string;
  description: string;
  href: string;
  timestamp: string;
  highlight?: boolean;
}

const quickActions = [
  {
    label: "Ver Processos",
    href: "/portal/processos",
    icon: FileText,
    color: "bg-blue-50 text-blue-600",
  },
  {
    label: "Mensagens",
    href: "/portal/mensagens",
    icon: MessageSquare,
    color: "bg-purple-50 text-purple-600",
  },
  {
    label: "Faturas",
    href: "/portal/faturas",
    icon: Receipt,
    color: "bg-green-50 text-green-600",
  },
];

function getTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Agora mesmo";
  if (diffMins < 60) return `Há ${diffMins} min`;
  if (diffHours < 24) return `Há ${diffHours}h`;
  if (diffDays < 7) return `Há ${diffDays} dias`;
  return date.toLocaleDateString("pt-PT");
}

function getActivityIcon(type: string, highlight?: boolean) {
  const className = highlight ? "text-accent" : "text-gray-400";
  switch (type) {
    case "process_update":
      return <Clock size={14} className={className} />;
    case "new_message":
      return <MessageCircle size={14} className={className} />;
    case "new_invoice":
      return <Receipt size={14} className={className} />;
    case "status_change":
      return <CheckCircle2 size={14} className={className} />;
    default:
      return <TrendingUp size={14} className={className} />;
  }
}

export default function PortalDashboard() {
  const [data, setData] = useState<DashboardData>({
    activeProcesses: 0,
    totalProcesses: 0,
    unreadMessages: 0,
    pendingInvoices: 0,
    nextPayment: null,
  });
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchDashboard = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUserName(user.user_metadata?.name || "");

      // Fetch all data in parallel
      const [
        activeCountRes,
        totalCountRes,
        unreadCountRes,
        pendingCountRes,
        nextInvoiceRes,
        messagesRes,
        processesRes,
        invoicesRes,
      ] = await Promise.all([
        supabase
          .from("processes")
          .select("*", { count: "exact", head: true })
          .eq("client_id", user.id)
          .eq("status", "active"),
        supabase
          .from("processes")
          .select("*", { count: "exact", head: true })
          .eq("client_id", user.id),
        supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("client_id", user.id)
          .eq("read", false)
          .neq("sender_id", user.id),
        supabase
          .from("invoices")
          .select("*", { count: "exact", head: true })
          .eq("client_id", user.id)
          .in("status", ["pending", "overdue"]),
        supabase
          .from("invoices")
          .select("amount, due_date")
          .eq("client_id", user.id)
          .in("status", ["pending", "overdue"])
          .order("due_date", { ascending: true })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("messages")
          .select("id, content, created_at, sender_id, read")
          .eq("client_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("processes")
          .select("id, title, status, updated_at")
          .eq("client_id", user.id)
          .order("updated_at", { ascending: false })
          .limit(5),
        supabase
          .from("invoices")
          .select("id, invoice_number, amount, status, due_date, created_at")
          .eq("client_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      setData({
        activeProcesses: activeCountRes.count ?? 0,
        totalProcesses: totalCountRes.count ?? 0,
        unreadMessages: unreadCountRes.count ?? 0,
        pendingInvoices: pendingCountRes.count ?? 0,
        nextPayment: nextInvoiceRes.data
          ? {
              amount: nextInvoiceRes.data.amount,
              dueDate: nextInvoiceRes.data.due_date,
            }
          : null,
      });

      // Build activity feed
      const items: ActivityItem[] = [];

      // Add recent messages (only received, not sent)
      (messagesRes.data ?? []).forEach((msg) => {
        if (msg.sender_id !== user.id) {
          items.push({
            id: `msg-${msg.id}`,
            type: "new_message",
            title: "Nova mensagem",
            description:
              msg.content.length > 80
                ? msg.content.slice(0, 80) + "…"
                : msg.content,
            href: "/portal/mensagens",
            timestamp: msg.created_at,
            highlight: !msg.read,
          });
        }
      });

      // Add recent process updates
      (processesRes.data ?? []).forEach((p) => {
        items.push({
          id: `proc-${p.id}`,
          type: "process_update",
          title: p.status === "completed" ? "Processo concluído" : "Processo atualizado",
          description: p.title,
          href: `/portal/processos/${p.id}`,
          timestamp: p.updated_at,
        });
      });

      // Add recent invoices
      (invoicesRes.data ?? []).forEach((inv) => {
        items.push({
          id: `inv-${inv.id}`,
          type: "new_invoice",
          title: `Fatura ${inv.status === "paid" ? "paga" : inv.status === "overdue" ? "vencida" : "recebida"}`,
          description: `${inv.invoice_number} — €${Number(inv.amount).toFixed(2)}`,
          href: "/portal/faturas",
          timestamp: inv.created_at,
          highlight: inv.status === "overdue" || inv.status === "pending",
        });
      });

      // Sort by timestamp descending and take top 8
      items.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );
      setActivity(items.slice(0, 8));
      setLoading(false);
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  const stats = [
    {
      label: "Processos Ativos",
      value: String(data.activeProcesses),
      desc: `${data.totalProcesses} total`,
      href: "/portal/processos",
    },
    {
      label: "Mensagens Não Lidas",
      value: String(data.unreadMessages),
      desc: data.unreadMessages > 0 ? "Por responder" : "Tudo em dia",
      href: "/portal/mensagens",
      highlight: data.unreadMessages > 0,
    },
    {
      label: "Faturas Pendentes",
      value: String(data.pendingInvoices),
      desc: data.nextPayment
        ? `Próxima: €${data.nextPayment.amount.toFixed(2)} — ${new Date(data.nextPayment.dueDate).toLocaleDateString("pt-PT")}`
        : "Sem faturas pendentes",
      href: "/portal/faturas",
    },
  ];

  return (
    <div>
      <Breadcrumbs items={[{ label: "Dashboard" }]} className="mb-4" />

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-dark">
          {userName ? `Bem-vindo(a), ${userName.split(" ")[0]}!` : "Dashboard"}
        </h1>
        <p className="text-gray-500 mt-1">
          Aqui encontra um resumo de todos os seus processos e atividades.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className={`group rounded-2xl border p-6 transition-all duration-200 hover:-translate-y-0.5 ${
              s.highlight
                ? "border-accent/30 bg-accent/5 hover:shadow-lg hover:shadow-accent/10"
                : "border-gray-100 bg-white hover:shadow-lg"
            }`}
          >
            <div className="text-sm text-gray-400 mb-2">{s.label}</div>
            <div className="text-3xl font-bold text-dark">{s.value}</div>
            <div className="text-xs text-gray-400 mt-2 flex items-center gap-1">
              {s.desc}
              <ArrowRight size={12} className="opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
            </div>
          </Link>
        ))}
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold text-dark mb-4">Acesso Rápido</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 transition-all hover:shadow-md hover:-translate-y-0.5 group"
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl ${action.color}`}
              >
                <action.icon size={22} />
              </div>
              <div className="flex-1">
                <div className="font-medium text-dark text-sm">
                  {action.label}
                </div>
                <div className="text-xs text-gray-400 flex items-center gap-1">
                  Acessar
                  <ArrowRight
                    size={12}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Atividade Recente */}
      <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h3 className="font-semibold text-dark flex items-center gap-2">
            <TrendingUp size={16} />
            Atividade Recente
          </h3>
          {activity.length > 0 && (
            <Link
              href="/portal/processos"
              className="text-sm text-primary hover:underline"
            >
              Ver tudo
            </Link>
          )}
        </div>

        {activity.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {activity.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className={`flex items-start gap-4 px-6 py-4 transition-all hover:bg-gray-50/50 ${
                  item.highlight ? "bg-accent/5" : ""
                }`}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100">
                  {getActivityIcon(item.type, item.highlight)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-dark">{item.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                    {item.description}
                  </p>
                </div>
                <span className="text-[11px] text-gray-400 shrink-0 whitespace-nowrap">
                  {getTimeAgo(item.timestamp)}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <div className="flex justify-center mb-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-50">
                <TrendingUp size={22} className="text-gray-300" />
              </div>
            </div>
            <p className="text-sm text-gray-400">
              Ainda não tem processos ativos.{" "}
              <Link
                href="/servicos"
                className="text-primary font-medium hover:underline"
              >
                Solicite um orçamento
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
