"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  CheckCircle2,
  Loader2,
  MessageSquare,
  Send,
  Receipt,
  User,
  X,
  FileText,
  Download,
  Paperclip,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logActivity, ActivityActions } from "@/lib/activity-log";
import FileUpload from "@/components/ui/FileUpload";
import type { UploadedFile } from "@/components/ui/FileUpload";
import { notify } from "@/lib/email/notify";
import {
  statusChangeTemplate,
  stageCompletedTemplate,
  newMessageTemplate,
  newInvoiceTemplate,
  paymentReceivedTemplate,
} from "@/lib/email";

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
}

interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  currency: string;
  status: string;
  due_date: string;
  description: string;
  file_url: string;
}

interface Process {
  id: string;
  title: string;
  description: string;
  service_slug: string;
  status: string;
  client_id: string;
  created_at: string;
}

export default function AdminProcessDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [process, setProcess] = useState<Process | null>(null);
  const [stages, setStages] = useState<ProcessStage[]>([]);
  const [messages, setMessages] = useState<ProcessMessage[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [newStageTitle, setNewStageTitle] = useState("");
  const [newStageDesc, setNewStageDesc] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);
  const [documents, setDocuments] = useState<ProcessDocument[]>([]);
  const [showDocsUpload, setShowDocsUpload] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const supabase = createClient();

  // Assignment state
  const [clientAssignment, setClientAssignment] = useState<{ admin_id: string } | null>(null);
  const [adminId, setAdminId] = useState<string | null>(null);
  const [assignedAdminName, setAssignedAdminName] = useState("");
  const [assigning, setAssigning] = useState(false);

  // Invoice form state
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({
    description: "",
    amount: "",
    due_date: "",
  });
  const [creatingInvoice, setCreatingInvoice] = useState(false);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);

  const handleAssignClient = async () => {
    if (!adminId || !process) return;
    setAssigning(true);
    const { error } = await supabase.from("client_assignments").upsert({
      client_id: process.client_id,
      admin_id: adminId,
      assigned_by: adminId,
    });
    if (!error) {
      setClientAssignment({ admin_id: adminId });
    }
    setAssigning(false);
  };

  interface ProcessDocument {
    id: string;
    name: string;
    file_url: string;
    file_size: number;
    file_type: string;
    created_at: string;
  }

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) setAdminId(user.id);

    const { data: processData } = await supabase
      .from("processes")
      .select("*")
      .eq("id", id)
      .single();

    if (!processData) return;
    setProcess(processData);

    // Fetch client name, assignment, and other data in parallel
    const [
      clientProfileResult,
      stagesRes,
      messagesRes,
      invoicesRes,
      docsRes,
      assignmentResult,
      adminUsersResult,
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select("name")
        .eq("id", processData.client_id)
        .maybeSingle(),
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
      supabase
        .from("client_assignments")
        .select("admin_id")
        .eq("client_id", processData.client_id)
        .maybeSingle(),
      supabase.from("admin_users").select("user_id, display_name"),
    ]);

    setClientName(clientProfileResult.data?.name || "Cliente");

    // Fetch client email from admin API
    try {
      const emailRes = await fetch("/api/admin/users");
      if (emailRes.ok) {
        const { users } = await emailRes.json();
        const clientUser = (users || []).find((u: any) => u.id === processData.client_id);
        if (clientUser?.email) setClientEmail(clientUser.email);
      }
    } catch { /* silêncio */ }

    setStages(stagesRes.data ?? []);
    setMessages(messagesRes.data ?? []);
    setInvoices(invoicesRes.data ?? []);
    setDocuments(docsRes.data ?? []);

    if (assignmentResult.data) {
      setClientAssignment(assignmentResult.data);
      // Find the assigned admin's display name
      if (assignmentResult.data.admin_id && adminUsersResult.data) {
        const assignedAdmin = (adminUsersResult.data as any[]).find(
          (a) => a.user_id === assignmentResult.data!.admin_id,
        );
        if (assignedAdmin?.display_name) {
          setAssignedAdminName(assignedAdmin.display_name);
        }
      }
    }

    setLoading(false);
  };

  // Realtime subscription is in its own effect so cleanup runs synchronously
  // when `id` changes or the component unmounts — independent of the async
  // fetchData. Previously, the channel was created at the end of fetchData
  // (async), so in React StrictMode the cleanup ran before fetchData's first
  // invocation had a chance to set channelRef.current, leading to "cannot add
  // postgres_changes callbacks after subscribe()" when the second StrictMode
  // pass reused the same channel name.
  useEffect(() => {
    // Defensive: remove any stale channel with the same name that the
    // Supabase client may still have registered (e.g., a previous mount that
    // was not fully cleaned up).
    supabase
      .getChannels()
      .filter((c) => c.topic === `realtime:process-messages-realtime:${id}`)
      .forEach((c) => supabase.removeChannel(c));

    const channel = supabase
      .channel(`process-messages-realtime:${id}`)
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

    return () => {
      supabase.removeChannel(channel);
      if (channelRef.current === channel) channelRef.current = null;
    };
  }, [id]);

  // Stage management
  const addStage = async () => {
    if (!newStageTitle.trim() || !process) return;
    const nextOrder = stages.length;

    const { data } = await supabase
      .from("process_stages")
      .insert({
        process_id: process.id,
        title: newStageTitle.trim(),
        description: newStageDesc.trim(),
        sort_order: nextOrder,
        status: "pending",
      })
      .select()
      .single();

    if (data) {
      setStages((prev) => [...prev, data]);
      setNewStageTitle("");
      setNewStageDesc("");
    }
  };

  const updateStageStatus = async (stageId: string, newStatus: string) => {
    await supabase
      .from("process_stages")
      .update({ status: newStatus })
      .eq("id", stageId);
    setStages((prev) =>
      prev.map((s) => (s.id === stageId ? { ...s, status: newStatus } : s)),
    );

    // Notify client when a stage is completed
    if (newStatus === "completed" && clientEmail && process) {
      const stage = stages.find((s) => s.id === stageId);
      if (stage) {
        const alreadyCompleted = stages.filter((s) => s.status === "completed").length;
        const completedCount = alreadyCompleted + (newStatus === "completed" ? 1 : 0);
        const pct = stages.length > 0 ? Math.round((completedCount / stages.length) * 100) : 0;
        notify({
          to_email: clientEmail,
          to_name: clientName,
          subject: `Etapa concluída: ${stage.title}`,
          html_body: stageCompletedTemplate({
            client_name: clientName,
            process_name: process.title,
            stage_title: stage.title,
            progress_percent: Math.min(pct, 100),
            message: stage.description || `A etapa "${stage.title}" foi concluída com sucesso.`,
            cta_url: `/portal/processos/${process.id}`,
          }),
          type: "process_update",
          reference_id: process.id,
          reference_type: "process",
        });
      }
    }
  };

  const deleteStage = async (stageId: string) => {
    await supabase.from("process_stages").delete().eq("id", stageId);
    setStages((prev) => prev.filter((s) => s.id !== stageId));
  };

  // Update process status
  const updateProcessStatus = async (newStatus: string) => {
    if (!process) return;
    const oldStatus = process.status;
    await supabase
      .from("processes")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", process.id);
    setProcess({ ...process, status: newStatus });

    // Notify client of status change
    if (clientEmail && oldStatus !== newStatus) {
      const statusMap: Record<string, string> = {
        active: "Ativo", paused: "Pausado", completed: "Concluído", cancelled: "Cancelado",
      };
      notify({
        to_email: clientEmail,
        to_name: clientName,
        subject: `Processo ${process.title}: ${statusMap[oldStatus] || oldStatus} → ${statusMap[newStatus] || newStatus}`,
        html_body: statusChangeTemplate({
          entity_label: "Processo",
          entity_name: process.title,
          old_status: statusMap[oldStatus] || oldStatus,
          new_status: statusMap[newStatus] || newStatus,
          message: `O estado do seu processo foi atualizado.`,
          cta_url: `/portal/processos/${process.id}`,
        }),
        type: "status_change",
        reference_id: process.id,
        reference_type: "process",
      });
    }
  };

  // Send message as admin
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !process) return;

    setSendingMsg(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("messages")
      .insert({
        process_id: process.id,
        client_id: process.client_id,
        sender_id: user.id,
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

      await logActivity({
        entityType: "process",
        entityId: process.id,
        action: ActivityActions.MESSAGE_SENT,
        description: `Resposta do admin no processo: ${process.title}`,
      });

      // Notify client of new admin message
      if (clientEmail) {
        notify({
          to_email: clientEmail,
          to_name: clientName,
          subject: `Nova mensagem sobre ${process.title}`,
          html_body: newMessageTemplate({
            client_name: clientName,
            sender_name: adminId ? "Equipa Issencial" : "Equipa Issencial",
            preview: data.content,
            process_name: process.title,
            cta_url: `/portal/processos/${process.id}`,
          }),
          type: "new_message",
          reference_id: process.id,
          reference_type: "process",
        });
      }
    }
    setSendingMsg(false);
  };

  // Update invoice status inline
  const updateInvoiceStatus = async (
    invoiceId: string,
    newStatus: string,
  ) => {
    await supabase
      .from("invoices")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", invoiceId);
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === invoiceId ? { ...inv, status: newStatus } : inv,
      ),
    );

    // Notify client of payment received
    if (newStatus === "paid" && clientEmail && process) {
      const inv = invoices.find((i) => i.id === invoiceId);
      if (inv) {
        notify({
          to_email: clientEmail,
          to_name: clientName,
          subject: `Pagamento recebido: ${inv.invoice_number}`,
          html_body: paymentReceivedTemplate({
            client_name: clientName,
            invoice_number: inv.invoice_number,
            amount: Number(inv.amount).toFixed(2),
            currency: inv.currency || "EUR",
            service_name: process.title,
            cta_url: `/portal/processos/${process.id}`,
          }),
          type: "notification",
          reference_id: invoiceId,
          reference_type: "invoice",
        });
      }
    }
  };

  // Handle document upload
  const handleDocumentUpload = async (files: UploadedFile[]) => {
    if (!process) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    for (const file of files) {
      await supabase.from("process_documents").insert({
        process_id: process.id,
        client_id: process.client_id,
        uploaded_by: user.id,
        name: file.name,
        file_url: file.url,
        file_size: file.size,
        file_type: file.type,
        storage_path: file.url.split("/").pop() || file.name,
      });
    }
    const { data } = await supabase
      .from("process_documents")
      .select("*")
      .eq("process_id", process.id)
      .order("created_at", { ascending: false });
    setDocuments(data ?? []);
    setShowDocsUpload(false);
  };

  // Create invoice from within the process detail page
  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!process || !invoiceForm.amount) return;

    setCreatingInvoice(true);
    setInvoiceError(null);

    // Generate invoice number via Supabase RPC (same as /admin/faturas)
    const { data: numData } = await supabase.rpc("generate_invoice_number");
    const invoiceNumber = numData || `INV-${Date.now()}`;

    const { data, error } = await supabase
      .from("invoices")
      .insert({
        process_id: process.id,
        client_id: process.client_id,
        invoice_number: invoiceNumber,
        amount: parseFloat(invoiceForm.amount),
        description: invoiceForm.description || null,
        due_date: invoiceForm.due_date || null,
        status: "draft",
      })
      .select("*")
      .single();

    if (error || !data) {
      setInvoiceError("Erro ao criar fatura. Tente novamente.");
      setCreatingInvoice(false);
      return;
    }

    setInvoices((prev) => [data as Invoice, ...prev]);
    setInvoiceForm({ description: "", amount: "", due_date: "" });
    setShowInvoiceForm(false);
    setCreatingInvoice(false);

    // Notify client of new invoice
    if (clientEmail) {
      notify({
        to_email: clientEmail,
        to_name: clientName,
        subject: `Nova fatura: ${invoiceNumber}`,
        html_body: newInvoiceTemplate({
          client_name: clientName,
          invoice_number: invoiceNumber,
          amount: parseFloat(invoiceForm.amount).toFixed(2),
          due_date: invoiceForm.due_date
            ? new Date(invoiceForm.due_date).toLocaleDateString("pt-PT")
            : undefined,
          status: "Pendente",
          cta_url: `/portal/processos/${process.id}`,
        }),
        type: "new_invoice",
        reference_id: data.id,
        reference_type: "invoice",
      });
    }
  };

  const closeInvoiceForm = () => {
    setShowInvoiceForm(false);
    setInvoiceForm({ description: "", amount: "", due_date: "" });
    setInvoiceError(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!process) return null;

  const statusColors: Record<string, string> = {
    active: "text-blue-600 bg-blue-50 border-blue-200",
    paused: "text-yellow-600 bg-yellow-50 border-yellow-200",
    completed: "text-green-600 bg-green-50 border-green-200",
    cancelled: "text-red-600 bg-red-50 border-red-200",
  };

  const invoiceStatusColors: Record<string, string> = {
    draft: "text-gray-500 bg-gray-50 border-gray-200",
    pending: "text-yellow-600 bg-yellow-50 border-yellow-200",
    paid: "text-green-600 bg-green-50 border-green-200",
    overdue: "text-red-600 bg-red-50 border-red-200",
    cancelled: "text-gray-500 bg-gray-50 border-gray-200",
  };

  const stageStatusColors: Record<string, string> = {
    pending: "border-gray-200",
    in_progress: "border-blue-400",
    completed: "border-green-400",
    blocked: "border-red-400",
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin/processos"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-primary mb-4 transition-colors"
        >
          <ArrowLeft size={16} />
          Voltar aos processos
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Gerir Processo de {clientName}
            </h1>
            <p className="text-gray-500 mt-1">
              {process.description || "Sem descrição"}
            </p>
          </div>

          {/* Status actions */}
          <div className="flex gap-2">
            {["active", "paused", "completed", "cancelled"].map((s) => (
              <button
                key={s}
                onClick={() => updateProcessStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  process.status === s
                    ? statusColors[s] || "border-gray-200"
                    : "text-gray-400 border-gray-200 hover:border-gray-400"
                }`}
              >
                {s === "active"
                  ? "Ativo"
                  : s === "paused"
                    ? "Pausar"
                    : s === "completed"
                      ? "Concluir"
                      : "Cancelar"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stages */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center justify-between">
              <span>Etapas</span>
              <span className="text-xs text-gray-400">
                {stages.filter((s) => s.status === "completed").length}/
                {stages.length}
              </span>
            </h2>

            <div className="space-y-3 mb-4">
              {stages.map((stage) => (
                <div
                  key={stage.id}
                  className={`rounded-xl border-2 p-4 transition-all ${stageStatusColors[stage.status] || "border-gray-200"}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="text-sm font-medium text-gray-900">
                      {stage.title}
                    </h4>
                    <button
                      onClick={() => deleteStage(stage.id)}
                      className="p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all flex-shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  {stage.description && (
                    <p className="text-xs text-gray-400 mb-2">
                      {stage.description}
                    </p>
                  )}
                  <div className="flex gap-1.5 flex-wrap">
                    {["pending", "in_progress", "completed", "blocked"].map(
                      (s) => (
                        <button
                          key={s}
                          onClick={() => updateStageStatus(stage.id, s)}
                          className={`text-[10px] px-2 py-0.5 rounded-full border transition-all ${
                            stage.status === s
                              ? s === "completed"
                                ? "bg-green-50 text-green-600 border-green-200"
                                : s === "in_progress"
                                  ? "bg-blue-50 text-blue-600 border-blue-200"
                                  : s === "blocked"
                                    ? "bg-red-50 text-red-600 border-red-200"
                                    : "bg-gray-50 text-gray-500 border-gray-200"
                              : "text-gray-300 border-gray-100 hover:border-gray-300"
                          }`}
                        >
                          {s === "pending"
                            ? "Pendente"
                            : s === "in_progress"
                              ? "Em andamento"
                              : s === "completed"
                                ? "Concluído"
                                : "Bloqueado"}
                        </button>
                      ),
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Add stage form */}
            <div className="border-t border-gray-100 pt-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
                Adicionar Etapa
              </h3>
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  value={newStageTitle}
                  onChange={(e) => setNewStageTitle(e.target.value)}
                  placeholder="Título da etapa"
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                />
                <input
                  type="text"
                  value={newStageDesc}
                  onChange={(e) => setNewStageDesc(e.target.value)}
                  placeholder="Descrição (opcional)"
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                />
                <button
                  onClick={addStage}
                  disabled={!newStageTitle.trim()}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary-light transition-all disabled:opacity-40"
                >
                  <Plus size={14} />
                  Adicionar
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Messages & Invoices */}
        <div className="lg:col-span-2 space-y-6">
          {/* Messages */}
          <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
            <div className="border-b border-gray-100 px-6 py-4">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <MessageSquare size={16} />
                Mensagens
              </h2>
            </div>

            <div className="p-6 max-h-[350px] overflow-y-auto space-y-4">
              {messages.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">
                  Nenhuma mensagem neste processo.
                </p>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender_id !== process.client_id ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                        msg.sender_id !== process.client_id
                          ? "bg-primary text-white rounded-br-md"
                          : "bg-gray-50 text-gray-900 rounded-bl-md"
                      }`}
                    >
                      <p>{msg.content}</p>
                      <p
                        className={`text-[10px] mt-1 ${
                          msg.sender_id !== process.client_id
                            ? "text-white/60"
                            : "text-gray-400"
                        }`}
                      >
                        {new Date(msg.created_at).toLocaleString("pt-PT")}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {(() => {
              const assignment = clientAssignment;
              const isAssignedToMe = assignment?.admin_id === adminId;
              const canReply = isAssignedToMe;

              if (!canReply && assignment) {
                return (
                  <div className="border-t border-gray-100 p-4 text-center text-sm text-gray-400">
                    Este cliente está a ser gerido por{' '}
                    <strong>{assignedAdminName}</strong>.<br />
                    Apenas o gestor atribuído pode responder às mensagens.
                  </div>
                );
              }

              if (!canReply && !assignment) {
                return (
                  <div className="border-t border-gray-100 p-4 text-center text-sm text-gray-400">
                    Este cliente não tem um gestor atribuído.
                    <button
                      onClick={handleAssignClient}
                      disabled={assigning}
                      className="ml-2 rounded-md bg-primary px-3 py-1 text-xs font-semibold text-white hover:bg-primary-light transition-all disabled:opacity-40"
                    >
                      {assigning ? "A atribuir..." : "Assumir cliente"}
                    </button>
                  </div>
                );
              }

              return (
                <form
                  onSubmit={handleSendMessage}
                  className="border-t border-gray-100 p-4 flex gap-3"
                >
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Responder como admin..."
                    className="flex-1 rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 placeholder:text-gray-400"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || sendingMsg}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white hover:bg-primary-light transition-all disabled:opacity-40"
                  >
                    {sendingMsg ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Send size={16} />
                    )}
                  </button>
                </form>
              );
            })()}
          </div>

          {/* Invoices */}
          <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
            <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <Receipt size={16} />
                Faturas
              </h2>
              <button
                onClick={() => setShowInvoiceForm((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-light transition-all"
              >
                {showInvoiceForm ? <X size={12} /> : <Plus size={14} />}
                {showInvoiceForm ? "Cancelar" : "Nova Fatura"}
              </button>
            </div>

            <div className="p-6">
              {/* Inline invoice form — process_id is auto-filled */}
              {showInvoiceForm && (
                <form
                  onSubmit={handleCreateInvoice}
                  className="mb-6 rounded-xl border border-primary/20 bg-primary/5 p-4"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Receipt size={14} className="text-primary" />
                    <p className="text-xs font-semibold text-gray-700">
                      Nova fatura para este processo
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-medium text-gray-500">
                        Valor (€)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={invoiceForm.amount}
                        onChange={(e) =>
                          setInvoiceForm({
                            ...invoiceForm,
                            amount: e.target.value,
                          })
                        }
                        placeholder="0.00"
                        required
                        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-medium text-gray-500">
                        Data de Vencimento
                      </label>
                      <input
                        type="date"
                        value={invoiceForm.due_date}
                        onChange={(e) =>
                          setInvoiceForm({
                            ...invoiceForm,
                            due_date: e.target.value,
                          })
                        }
                        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                      />
                    </div>
                    <div className="flex flex-col gap-1 sm:col-span-2">
                      <label className="text-[11px] font-medium text-gray-500">
                        Descrição
                      </label>
                      <input
                        type="text"
                        value={invoiceForm.description}
                        onChange={(e) =>
                          setInvoiceForm({
                            ...invoiceForm,
                            description: e.target.value,
                          })
                        }
                        placeholder="Descrição da fatura (opcional)"
                        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                      />
                    </div>
                  </div>

                  {invoiceError && (
                    <div className="mt-3 p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs">
                      {invoiceError}
                    </div>
                  )}

                  <div className="mt-3 flex gap-2">
                    <button
                      type="submit"
                      disabled={creatingInvoice || !invoiceForm.amount}
                      className="rounded-lg bg-primary px-5 py-2 text-xs font-semibold text-white hover:bg-primary-light transition-all disabled:opacity-40"
                    >
                      {creatingInvoice ? "A criar..." : "Criar Fatura"}
                    </button>
                    <button
                      type="button"
                      onClick={closeInvoiceForm}
                      className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-medium text-gray-500 hover:bg-gray-50 transition-all"
                    >
                      Cancelar
                    </button>
                  </div>
                  <p className="mt-2 text-[10px] text-gray-400">
                    Associada automaticamente ao processo atual (
                    {process.id.slice(0, 8)}…)
                  </p>
                </form>
              )}

              {invoices.length === 0 && !showInvoiceForm ? (
                <p className="text-sm text-gray-400 text-center py-6">
                  Nenhuma fatura associada.
                </p>
              ) : (
                <div className="space-y-3">
                  {invoices.map((inv) => (
                    <div
                      key={inv.id}
                      className="rounded-xl border border-gray-100 bg-gray-50/50 px-5 py-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold text-gray-900">
                              {inv.invoice_number}
                            </span>
                          </div>
                          {inv.description && (
                            <p className="text-xs text-gray-400 mt-1 truncate">
                              {inv.description}
                            </p>
                          )}
                          {inv.due_date && (
                            <p className="text-xs text-gray-400">
                              Vence:{" "}
                              {new Date(inv.due_date).toLocaleDateString(
                                "pt-PT",
                              )}
                            </p>
                          )}
                        </div>
                        <span className="text-lg font-bold text-gray-900 shrink-0">
                          €{Number(inv.amount).toFixed(2)}
                        </span>
                      </div>

                      {/* Inline status pills — same pattern as stages */}
                      <div className="flex gap-1.5 flex-wrap mt-3 pt-3 border-t border-gray-100">
                        {[
                          { value: "draft", label: "Rascunho" },
                          { value: "pending", label: "Pendente" },
                          { value: "paid", label: "Pago" },
                          { value: "overdue", label: "Vencido" },
                          { value: "cancelled", label: "Cancelado" },
                        ].map((s) => {
                          const active = inv.status === s.value;
                          return (
                            <button
                              key={s.value}
                              onClick={() =>
                                updateInvoiceStatus(inv.id, s.value)
                              }
                              className={`text-[10px] px-2.5 py-0.5 rounded-full border transition-all ${
                                active
                                  ? invoiceStatusColors[s.value] ||
                                    "border-gray-200"
                                  : "text-gray-300 border-gray-100 hover:border-gray-300"
                              }`}
                            >
                              {s.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Documents Section */}
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
          <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <FileText size={16} />
              Documentos
            </h2>
            <button
              onClick={() => setShowDocsUpload((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-light transition-all"
            >
              {showDocsUpload ? <X size={12} /> : <Plus size={14} />}
              {showDocsUpload ? "Cancelar" : "Upload"}
            </button>
          </div>

          <div className="p-6">
            {showDocsUpload && (
              <div className="mb-6">
                <FileUpload
                  folder={`${process?.client_id || "admin"}/${id}`}
                  onUploadComplete={handleDocumentUpload}
                  buttonLabel="Enviar ficheiro"
                />
              </div>
            )}

            {documents.length === 0 && !showDocsUpload ? (
              <p className="text-sm text-gray-400 text-center py-6">
                Nenhum documento associado a este processo.
              </p>
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
                      <p className="text-sm font-medium text-gray-900 truncate group-hover:text-primary transition-colors">
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
        </div>
      </div>
    </div>
  );
}
