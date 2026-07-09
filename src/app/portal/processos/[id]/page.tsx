"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Loader2,
  MessageSquare,
  Send,
  Receipt,
  FileText,
  Download,
  Paperclip,
  ChevronRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import ProgressBar from "@/components/ui/ProgressBar";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import FileUpload from "@/components/ui/FileUpload";
import type { UploadedFile } from "@/components/ui/FileUpload";
import { logActivity, ActivityActions } from "@/lib/activity-log";

interface ProcessStage {
  id: string;
  title: string;
  description: string;
  status: string;
  sort_order: number;
}

interface ProcessMessage {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  attachments?: { name: string; url: string; size: number; type: string }[];
}

interface ProcessDocument {
  id: string;
  name: string;
  file_url: string;
  file_size: number;
  file_type: string;
  description: string;
  created_at: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  currency: string;
  status: string;
  due_date: string;
  description: string;
}

interface Process {
  id: string;
  title: string;
  description: string;
  service_slug: string;
  status: string;
  created_at: string;
  assigned_to?: string;
  estimated_date?: string;
}

const stageStatusConfig: Record<
  string,
  { icon: any; color: string; bg: string }
> = {
  pending: {
    icon: Clock,
    color: "text-gray-400",
    bg: "bg-gray-50",
  },
  in_progress: {
    icon: Clock,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  completed: {
    icon: CheckCircle2,
    color: "text-green-600",
    bg: "bg-green-50",
  },
  blocked: {
    icon: Clock,
    color: "text-red-600",
    bg: "bg-red-50",
  },
};

const invoiceStatusConfig: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  draft: { label: "Rascunho", color: "text-gray-500", bg: "bg-gray-50" },
  pending: {
    label: "Pendente",
    color: "text-yellow-600",
    bg: "bg-yellow-50",
  },
  paid: { label: "Pago", color: "text-green-600", bg: "bg-green-50" },
  overdue: { label: "Vencido", color: "text-red-600", bg: "bg-red-50" },
  cancelled: {
    label: "Cancelado",
    color: "text-gray-500",
    bg: "bg-gray-50",
  },
};

export default function ProcessDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [process, setProcess] = useState<Process | null>(null);
  const [stages, setStages] = useState<ProcessStage[]>([]);
  const [messages, setMessages] = useState<ProcessMessage[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [documents, setDocuments] = useState<ProcessDocument[]>([]);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [consultantName, setConsultantName] = useState("");
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      // Fully remove any dangling channel with this topic (handles StrictMode race condition)
      supabase
        .getChannels()
        .filter((c) => c.topic === "realtime:portal-process-messages-realtime")
        .forEach((c) => supabase.removeChannel(c));
      channelRef.current = null;

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data: processData } = await supabase
        .from("processes")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (!processData || processData.client_id !== user.id) {
        router.push("/portal/processos");
        return;
      }

      setProcess(processData);

      const [stagesRes, messagesRes, invoicesRes, docsRes] = await Promise.all([
        supabase
          .from("process_stages")
          .select("*")
          .eq("process_id", id)
          .order("sort_order"),
        supabase
          .from("messages")
          .select("*")
          .eq("process_id", id)
          .order("created_at"),
        supabase
          .from("invoices")
          .select("*")
          .eq("process_id", id)
          .order("created_at", { ascending: false }),
        supabase
          .from("process_documents")
          .select("*")
          .eq("process_id", id)
          .order("created_at", { ascending: false }),
      ]);

      setStages(stagesRes.data ?? []);
      setMessages(messagesRes.data ?? []);
      setInvoices(invoicesRes.data ?? []);
      setDocuments(docsRes.data ?? []);

      // Fetch consultant name — first from client_assignments, then from admin_users
      const { data: clientAssig } = await supabase
        .from("client_assignments")
        .select("admin_id")
        .eq("client_id", processData.client_id)
        .maybeSingle();

      if (clientAssig) {
        const { data: adminUser } = await supabase
          .from("admin_users")
          .select("display_name")
          .eq("user_id", clientAssig.admin_id)
          .maybeSingle();
        setConsultantName(adminUser?.display_name || "Consultor Issencial");
      } else if (processData.assigned_to) {
        // Fallback to old assigned_to field
        const { data: consProfile } = await supabase
          .from("profiles")
          .select("name")
          .eq("id", processData.assigned_to)
          .maybeSingle();
        setConsultantName(consProfile?.name || "Consultor Issencial");
      }

      setLoading(false);

      // Subscribe to realtime changes on messages for this process
      const channel = supabase
        .channel("portal-process-messages-realtime")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `process_id=eq.${id}`,
          },
          (payload) => {
            const newMsg = payload.new as {
              id: string;
              process_id: string;
              client_id: string;
              sender_id: string;
              content: string;
              created_at: string;
            };
            // Only add messages that belong to this process
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [
                ...prev,
                {
                  id: newMsg.id,
                  content: newMsg.content,
                  sender_id: newMsg.sender_id,
                  created_at: newMsg.created_at,
                },
              ];
            });
          },
        )
        .subscribe();

      channelRef.current = channel;
    };

    fetchData();
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !userId || !process) return;

    setSending(true);
    const { data, error } = await supabase
      .from("messages")
      .insert({
        process_id: process.id,
        client_id: userId,
        sender_id: userId,
        content: newMessage.trim(),
      })
      .select()
      .single();

    if (!error && data) {
      setMessages((prev) => [
        ...prev,
        {
          id: data.id,
          content: data.content,
          sender_id: data.sender_id,
          created_at: data.created_at,
        },
      ]);
      setNewMessage("");
      setShowFileUpload(false);

      await logActivity({
        entityType: "process",
        entityId: process.id,
        action: ActivityActions.MESSAGE_SENT,
        description: `Mensagem enviada no processo: ${process.title}`,
      });
    }
    setSending(false);
  };

  // Typing indicator — single channel, debounced
  const typingChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const handleTyping = useCallback(() => {
    if (!userId || !process) return;

    // Debounce — only send typing signal every 2s
    if (typingDebounceRef.current) return;
    typingDebounceRef.current = setTimeout(() => {
      typingDebounceRef.current = null;
    }, 2000);

    // Broadcast typing event on the shared typing channel
    if (typingChannelRef.current) {
      typingChannelRef.current.send({
        type: "broadcast",
        event: "typing",
        payload: { userId },
      });
    }
  }, [userId, process]);

  // Listen for typing events
  useEffect(() => {
    if (!process) return;

    const channel = supabase.channel(`portal-typing:process:${process.id}`);
    typingChannelRef.current = channel;

    channel
      .on("broadcast", { event: "typing" }, (payload) => {
        const typingUserId = payload.payload.userId;
        if (typingUserId !== userId) {
          setTypingUsers((prev) => new Set(prev).add(typingUserId));
          if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
          typingTimerRef.current = setTimeout(() => {
            setTypingUsers(new Set());
          }, 2000);
        }
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
      typingChannelRef.current = null;
      if (typingDebounceRef.current) clearTimeout(typingDebounceRef.current);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, [process, userId]);

  // Handle file upload completion on messages
  const handleDocumentUpload = async (files: UploadedFile[]) => {
    if (!process || !userId) return;
    for (const file of files) {
      await supabase.from("process_documents").insert({
        process_id: process.id,
        client_id: userId,
        uploaded_by: userId,
        name: file.name,
        file_url: file.url,
        file_size: file.size,
        file_type: file.type,
        storage_path: file.url.split("/").pop() || file.name,
      });
    }
    // Refresh documents
    const { data } = await supabase
      .from("process_documents")
      .select("*")
      .eq("process_id", process.id)
      .order("created_at", { ascending: false });
    setDocuments(data ?? []);
    setShowFileUpload(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!process) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <Breadcrumbs
        items={[
          { label: "Processos", href: "/portal/processos" },
          { label: process.title },
        ]}
        className="mb-4"
      />

      {/* Back */}
      <motion.div
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.25, delay: 0.05, ease: "easeOut" }}
      >
        <Link
          href="/portal/processos"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-primary mb-6 transition-colors"
        >
          <ArrowLeft size={16} />
          Voltar aos processos
        </Link>
      </motion.div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.1, ease: "easeOut" }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold text-dark">{process.title}</h1>
        <p className="text-gray-500 mt-1">
          {process.description || "Acompanhe o progresso do seu processo."}
        </p>
      </motion.div>

      {/* Consultant & Estimated Date */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1, ease: "easeOut" }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6"
      >
        {consultantName && (
          <div className="rounded-2xl border border-gray-100 bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/20 text-primary font-bold text-sm">
                {consultantName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-xs text-gray-400">Consultor Responsável</p>
                <p className="text-sm font-semibold text-dark">{consultantName}</p>
              </div>
            </div>
          </div>
        )}
        {process.estimated_date && (
          <div className="rounded-2xl border border-gray-100 bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <Clock size={18} />
              </div>
              <div>
                <p className="text-xs text-gray-400">Previsão de Conclusão</p>
                <p className="text-sm font-semibold text-dark">
                  {new Date(process.estimated_date).toLocaleDateString("pt-PT", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Progress / Stages */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15, ease: "easeOut" }}
        className="rounded-2xl border border-gray-100 bg-white p-6 mb-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-semibold text-dark">Progresso</h2>
          {stages.length > 0 && (
            <span className="text-xs font-medium text-gray-400">
              {stages.filter((s) => s.status === "completed").length}/{stages.length}
            </span>
          )}
        </div>

        {/* Progress Bar */}
        {stages.length > 0 && (
          <ProgressBar
            completed={stages.filter((s) => s.status === "completed").length}
            total={stages.length}
            className="mb-6"
          />
        )}

        {/* Next Step Callout */}
        {(() => {
          const nextStep = stages.find(
            (s) => s.status === "pending" || s.status === "in_progress",
          );
          const inProgressStep = stages.find(
            (s) => s.status === "in_progress",
          );
          if (inProgressStep) {
            return (
              <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Clock size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">
                      Etapa atual em andamento
                    </p>
                    <p className="text-xs text-blue-600 mt-0.5">
                      {inProgressStep.title}
                      {inProgressStep.description &&
                        ` — ${inProgressStep.description}`}
                    </p>
                  </div>
                </div>
              </div>
            );
          }
          if (nextStep) {
            return (
              <div className="rounded-xl border border-accent/30 bg-accent/5 p-4 mb-6">
                <div className="flex items-start gap-3">
                  <ChevronRight size={16} className="text-accent flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-dark">
                      Próximo passo
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {nextStep.title}
                      {nextStep.description && ` — ${nextStep.description}`}
                    </p>
                  </div>
                </div>
              </div>
            );
          }
          return null;
        })()}

        <div className="space-y-0">
          {stages.map((stage, index) => {
            const config = stageStatusConfig[stage.status] || stageStatusConfig.pending;
            const StageIcon = config.icon;
            const isLast = index === stages.length - 1;

            return (
              <div key={stage.id} className="relative flex gap-4 pb-6 last:pb-0">
                {/* Line connector */}
                {!isLast && (
                  <div className="absolute left-[19px] top-10 bottom-0 w-0.5 bg-gray-100" />
                )}

                {/* Icon */}
                <div
                  className={`relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${config.bg} ${config.color}`}
                >
                  <StageIcon size={18} />
                </div>

                {/* Content */}
                <div className="flex-1 pt-1">
                  <h4 className="text-sm font-medium text-dark">{stage.title}</h4>
                  {stage.description && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {stage.description}
                    </p>
                  )}
                  {stage.status === "in_progress" && (
                    <span className="inline-flex items-center gap-1 mt-1.5 text-[11px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                      <Clock size={10} />
                      Em Andamento
                    </span>
                  )}
                  {stage.status === "completed" && (
                    <span className="inline-flex items-center gap-1 mt-1.5 text-[11px] font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                      <CheckCircle2 size={10} />
                      Concluído
                    </span>
                  )}
                  {stage.status === "pending" && (
                    <span className="inline-block mt-1.5 text-[11px] uppercase tracking-wider font-medium text-gray-400">
                      Pendente
                    </span>
                  )}
                  {stage.status === "blocked" && (
                    <span className="inline-flex items-center gap-1 mt-1.5 text-[11px] font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                      Bloqueado
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {stages.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">
              As etapas do processo serão adicionadas em breve.
            </p>
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2, ease: "easeOut" }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Messages */}
        <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
          <div className="border-b border-gray-100 px-6 py-4">
            <h2 className="font-semibold text-dark flex items-center gap-2">
              <MessageSquare size={16} />
              Mensagens do Processo
            </h2>
          </div>

          <div className="p-6 max-h-[400px] overflow-y-auto space-y-4">
            {messages.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">
                Ainda não há mensagens neste processo.
              </p>
            ) : (
              <AnimatePresence initial={false}>
                {messages.map((msg, i) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 16, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{
                      duration: 0.25,
                      delay: Math.min(i * 0.025, 0.3),
                      ease: "easeOut",
                    }}
                    className={`flex ${msg.sender_id === userId ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                        msg.sender_id === userId
                          ? "bg-primary text-white rounded-br-md"
                          : "bg-gray-50 text-dark rounded-bl-md"
                      }`}
                    >
                      <p>{msg.content}</p>
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {msg.attachments.map((att, i) => (
                            <a
                              key={i}
                              href={att.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1 text-[10px] font-medium hover:bg-white transition-all ${
                                msg.sender_id === userId
                                  ? "bg-white/20 text-white/90"
                                  : "bg-white/80 text-primary"
                              }`}
                            >
                              <FileText size={10} />
                              {att.name.length > 20 ? att.name.slice(0, 20) + "…" : att.name}
                            </a>
                          ))}
                        </div>
                      )}
                      <p
                        className={`text-[10px] mt-1 ${
                          msg.sender_id === userId
                            ? "text-white/60"
                            : "text-gray-400"
                        }`}
                      >
                        {new Date(msg.created_at).toLocaleString("pt-PT", {
                          day: "numeric",
                          month: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>

          {/* Typing indicator */}
          {typingUsers.size > 0 && (
            <div className="px-6 py-1.5 text-xs text-gray-400 italic flex items-center gap-1.5">
              <span className="flex gap-0.5">
                <span className="w-1 h-1 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1 h-1 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1 h-1 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }} />
              </span>
              Issencial está a escrever...
            </div>
          )}

          {/* File upload — outside the form to avoid drag/drop interference */}
          {showFileUpload && (
            <div className="border-t border-gray-100 p-4">
              <FileUpload
                folder={`${userId}/${process.id}`}
                onUploadComplete={handleDocumentUpload}
                buttonLabel="Anexar ficheiro"
              />
            </div>
          )}

          <form
            onSubmit={handleSendMessage}
            className="border-t border-gray-100 p-4"
          >
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowFileUpload(!showFileUpload)}
                className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-all ${
                  showFileUpload
                    ? "bg-primary text-white border-primary"
                    : "border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600"
                }`}
                title="Anexar ficheiro"
              >
                <Paperclip size={16} />
              </button>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  handleTyping();
                }}
                placeholder="Escreva uma mensagem..."
                className="flex-1 rounded-xl border border-gray-200 bg-light/50 px-4 py-2.5 text-sm text-dark outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 placeholder:text-gray-400"
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || sending}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white hover:bg-primary-light transition-all disabled:opacity-40"
              >
                {sending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Invoices */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.25, ease: "easeOut" }}
          className="rounded-2xl border border-gray-100 bg-white overflow-hidden"
        >
          <div className="border-b border-gray-100 px-6 py-4">
            <h2 className="font-semibold text-dark flex items-center gap-2">
              <Receipt size={16} />
              Faturas
            </h2>
          </div>

          <div className="divide-y divide-gray-50">
            {invoices.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-400">
                Nenhuma fatura associada a este processo.
              </div>
            ) : (
              invoices.map((inv) => {
                const config =
                  invoiceStatusConfig[inv.status] || invoiceStatusConfig.pending;
                return (
                  <div key={inv.id} className="px-6 py-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-dark">
                        {inv.invoice_number}
                      </span>
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full ${config.bg} ${config.color}`}
                      >
                        {config.label}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        {inv.description || "Sem descrição"}
                      </span>
                      <span className="text-sm font-semibold text-dark">
                        €{Number(inv.amount).toFixed(2)}
                      </span>
                    </div>
                    {inv.due_date && (
                      <div className="text-xs text-gray-400 mt-1">
                        Vence:{" "}
                        {new Date(inv.due_date).toLocaleDateString("pt-PT")}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* Documents Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3, ease: "easeOut" }}
        className="mt-6 rounded-2xl border border-gray-100 bg-white overflow-hidden"
      >
        <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <h2 className="font-semibold text-dark flex items-center gap-2">
            <Paperclip size={16} />
            Documentos
          </h2>
        </div>

        <div className="p-6">
          {documents.length === 0 ? (
            <div className="text-center py-6">
              <div className="flex justify-center mb-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-50">
                  <FileText size={22} className="text-gray-300" />
                </div>
              </div>
              <p className="text-sm text-gray-400">
                Nenhum documento associado a este processo.
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Os documentos partilhados aparecerão aqui.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => (
                <a
                  key={doc.id}
                  href={doc.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-3 transition-all hover:bg-gray-50 hover:border-gray-200 group"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <FileText size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-dark truncate group-hover:text-primary transition-colors">
                      {doc.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(doc.created_at).toLocaleDateString("pt-PT")}
                    </p>
                  </div>
                  <Download
                    size={16}
                    className="text-gray-300 group-hover:text-primary transition-colors"
                  />
                </a>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
