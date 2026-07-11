"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import {
  MessageSquare,
  Loader2,
  Send,
  ChevronLeft,
  Search,
  Paperclip,
  FileText,
  CheckCircle2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import FileUpload from "@/components/ui/FileUpload";
import type { UploadedFile } from "@/components/ui/FileUpload";
import { notify } from "@/lib/email/notify";
import { newMessageTemplate } from "@/lib/email";

interface GeneralMessage {
  id: string;
  client_id: string;
  sender_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

interface ClientInfo {
  id: string;
  name: string;
}

interface ClientAssignment {
  client_id: string;
  admin_id: string;
}

interface AdminInfo {
  id: string;
  user_id: string;
  display_name?: string;
}

export default function AdminMensagensPage() {
  const [messages, setMessages] = useState<GeneralMessage[]>([]);
  const [clients, setClients] = useState<Map<string, ClientInfo>>(new Map());
  const [assignments, setAssignments] = useState<Map<string, ClientAssignment>>(new Map());
  const [adminDisplayNames, setAdminDisplayNames] = useState<Map<string, string>>(new Map());
  const [clientEmails, setClientEmails] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [adminId, setAdminId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [clientTyping, setClientTyping] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [assignmentError, setAssignmentError] = useState<string | null>(null);
  const [assignSuccess, setAssignSuccess] = useState<string | null>(null);
  const assignTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const supabase = createClient();

  useEffect(() => {
    init();
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (assignTimeoutRef.current) clearTimeout(assignTimeoutRef.current);
    };
  }, []);

  // Realtime subscription in its own effect to avoid StrictMode race.
  useEffect(() => {
    supabase
      .getChannels()
      .filter((c) => c.topic === "realtime:admin-messages-realtime")
      .forEach((c) => supabase.removeChannel(c));

    const channel = supabase
      .channel("admin-messages-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: "process_id=is.null",
        },
        (payload) => {
          const newMsg = payload.new as GeneralMessage;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });

          if (
            newMsg.client_id !== adminId &&
            !clients.has(newMsg.client_id)
          ) {
            supabase
              .from("profiles")
              .select("id, name")
              .eq("id", newMsg.client_id)
              .single()
              .then(({ data }) => {
                if (data) {
                  setClients((prev) => {
                    const next = new Map(prev);
                    next.set(data.id, data);
                    return next;
                  });
                }
              });
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: "process_id=is.null",
        },
        (payload) => {
          const updated = payload.new as GeneralMessage;
          setMessages((prev) =>
            prev.map((m) => (m.id === updated.id ? updated : m)),
          );
        },
      )
      .subscribe();

    // Listen for client typing on the scoped channel
    if (selectedClientId) {
      const typingChannel = supabase.channel(`portal-typing:general:${selectedClientId}`);
      typingChannelRef.current = typingChannel;
      typingChannel
        .on("broadcast", { event: "client-typing" }, () => {
          setClientTyping(true);
          if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
          typingTimerRef.current = setTimeout(() => setClientTyping(false), 3000);
        })
        .on("broadcast", { event: "admin-typing" }, () => {
          // Ignore our own broadcasts
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
        supabase.removeChannel(typingChannel);
        typingChannelRef.current = null;
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      };
    }

    return () => {
      supabase.removeChannel(channel);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, [adminId, clients, selectedClientId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedClientId]);

  const init = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setAdminId(user.id);

    const { data } = await supabase
      .from("messages")
      .select("id, client_id, sender_id, content, read, created_at")
      .is("process_id", null)
      .order("created_at", { ascending: true });

    setMessages(data ?? []);

    const clientIds = [
      ...new Set(
        (data ?? [])
          .filter((m) => m.client_id !== user.id)
          .map((m) => m.client_id),
      ),
    ];
    
    // Fetch profiles and assignments in parallel
    const [profilesResult, assignmentsResult, adminUsersResult] = await Promise.all([
      clientIds.length > 0
        ? supabase.from("profiles").select("id, name").in("id", clientIds)
        : { data: [] },
      supabase.from("client_assignments").select("client_id, admin_id"),
      supabase.from("admin_users").select("user_id, display_name"),
    ]);

    const map = new Map<string, ClientInfo>();
    (profilesResult.data ?? []).forEach((p) => map.set(p.id, p));
    setClients(map);

    const assignMap = new Map<string, ClientAssignment>();
    (assignmentsResult.data ?? []).forEach((a) => assignMap.set(a.client_id, a));
    setAssignments(assignMap);

    const nameMap = new Map<string, string>();
    (adminUsersResult.data ?? []).forEach((a: any) => {
      if (a.display_name) nameMap.set(a.user_id, a.display_name);
    });
    setAdminDisplayNames(nameMap);

    // Fetch client emails
    try {
      const emailRes = await fetch("/api/admin/users");
      if (emailRes.ok) {
        const { users } = await emailRes.json();
        const emailMap = new Map<string, string>();
        (users || []).forEach((u: any) => {
          emailMap.set(u.id, u.email);
        });
        setClientEmails(emailMap);
      }
    } catch { /* silêncio */ }

    setLoading(false);
  };

  const markAsRead = async (msgId: string) => {
    await supabase.from("messages").update({ read: true }).eq("id", msgId);
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, read: true } : m)),
    );
  };

  const handleAssign = async (clientId: string) => {
    if (!adminId) return;
    setAssigning(true);
    setAssignmentError(null);
    setAssignSuccess(null);

    const { error } = await supabase.from("client_assignments").upsert({
      client_id: clientId,
      admin_id: adminId,
      assigned_by: adminId,
    });

    if (error) {
      setAssignmentError("Erro ao atribuir cliente.");
    } else {
      setAssignmentError(null);
      setAssignments((prev) => {
        const next = new Map(prev);
        next.set(clientId, { client_id: clientId, admin_id: adminId });
        return next;
      });
      const clientName = clients.get(clientId)?.name || "Cliente";
      setAssignSuccess(`${clientName} atribuído a si com sucesso!`);
      if (assignTimeoutRef.current) clearTimeout(assignTimeoutRef.current);
      assignTimeoutRef.current = setTimeout(() => {
        setAssignSuccess(null);
        assignTimeoutRef.current = null;
      }, 4000);
    }
    setAssigning(false);
  };

  const handleReply = async () => {
    const text = replyText.trim();
    if (!text || !selectedClientId || !adminId) return;

    setSending(true);

    // Broadcast admin typing stop on the scoped channel via existing ref
    if (typingChannelRef.current) {
      typingChannelRef.current.send({
        type: "broadcast",
        event: "admin-typing",
        payload: {},
      });
    }

    // Optimistic update — show immediately
    const optimisticMsg: GeneralMessage = {
      id: `temp-${Date.now()}`,
      client_id: selectedClientId,
      sender_id: adminId,
      content: text,
      read: false,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setReplyText("");
    setUploadedFiles([]);
    setShowFileUpload(false);

    const { data, error } = await supabase
      .from("messages")
      .insert({
        process_id: null,
        client_id: selectedClientId,
        sender_id: adminId,
        content: replyText.trim(),
        attachments: uploadedFiles.length > 0 ? uploadedFiles : [],
      })
      .select()
      .single();

    if (!error && data) {
      // Replace optimistic message with the real one from DB
      setMessages((prev) =>
        prev.map((m) => (m.id === optimisticMsg.id ? (data as GeneralMessage) : m)),
      );

      // Notify client of admin reply
      if (selectedClientId) {
        const clientEmail = clientEmails.get(selectedClientId);
        const clientName = clients.get(selectedClientId)?.name || "";
        if (clientEmail) {
          notify({
            to_email: clientEmail,
            to_name: clientName,
            subject: "Nova mensagem da Equipa Issencial",
            html_body: newMessageTemplate({
              client_name: clientName,
              sender_name: "Equipa Issencial",
              preview: text,
              cta_url: "/portal/mensagens",
            }),
            type: "new_message",
            reference_id: selectedClientId,
            reference_type: "client",
          });
        }
      }
    } else {
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
    }
    setSending(false);
  };

  const selectClient = (clientId: string) => {
    setSelectedClientId(clientId);
    // Mark all unread messages from this client as read
    const unread = messages.filter(
      (m) => m.client_id === clientId && !m.read && m.sender_id === clientId,
    );
    unread.forEach((m) => markAsRead(m.id));
  };

  // Group messages by client, excluding admin's own conversations
  const clientConversations = new Map<string, GeneralMessage[]>();
  messages.forEach((msg) => {
    // Skip messages where the client is the admin themselves
    if (msg.client_id === adminId) return;
    const existing = clientConversations.get(msg.client_id) || [];
    existing.push(msg);
    clientConversations.set(msg.client_id, existing);
  });

  const activeMessages = selectedClientId
    ? messages.filter((m) => m.client_id === selectedClientId)
    : [];

  // Filter conversations by search query
  const filteredConversations = [...clientConversations.entries()]
    .filter(([clientId, convMessages]) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const client = clients.get(clientId);
      // Search by client name
      if (client?.name?.toLowerCase().includes(q)) return true;
      // Search by any message content in the conversation
      if (convMessages.some((m) => m.content.toLowerCase().includes(q)))
        return true;
      return false;
    })
    .sort((a, b) => {
      const aMsgs = a[1];
      const bMsgs = b[1];
      const aUnread = aMsgs.filter(
        (m) => !m.read && m.sender_id === a[0],
      ).length;
      const bUnread = bMsgs.filter(
        (m) => !m.read && m.sender_id === b[0],
      ).length;
      if (aUnread !== bUnread) return bUnread - aUnread;
      return (
        new Date(bMsgs[bMsgs.length - 1].created_at).getTime() -
        new Date(aMsgs[aMsgs.length - 1].created_at).getTime()
      );
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* ─── Conversation List ─── */}
      <div
        className={`w-80 lg:w-96 border-r border-gray-200 bg-white flex flex-col shrink-0 ${
          selectedClientId ? "hidden lg:flex" : "flex"
        }`}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Conversas</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {searchQuery
              ? `${filteredConversations.length} de ${clientConversations.size} conversa(s)`
              : `${clientConversations.size} conversa(s)`}
          </p>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar conversas..."
              className="w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 py-2 text-sm outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 placeholder:text-gray-400 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs px-1"
              >
                Limpar
              </button>
            )}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-400">
              <div className="flex justify-center mb-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-50">
                  {searchQuery ? (
                    <Search size={22} className="text-gray-300" />
                  ) : (
                    <MessageSquare size={22} className="text-gray-300" />
                  )}
                </div>
              </div>
              {searchQuery ? (
                <>
                  Nenhuma conversa encontrada para &ldquo;{searchQuery}&rdquo;
                  <button
                    onClick={() => setSearchQuery("")}
                    className="block mx-auto mt-3 text-xs text-primary hover:underline"
                  >
                    Limpar pesquisa
                  </button>
                </>
              ) : (
                "Nenhuma conversa ainda."
              )}
            </div>
          ) : (
            filteredConversations.map(([clientId, convMessages]) => {
              const client = clients.get(clientId);
              const lastMsg = convMessages[convMessages.length - 1];
              const unread = convMessages.filter(
                (m) => !m.read && m.sender_id === clientId,
              ).length;
              const isActive = selectedClientId === clientId;
              const assignment = assignments.get(clientId);
              const isAssignedToMe = assignment?.admin_id === adminId;

              return (
                <div key={clientId}>
                  {/* Mobile: link to dedicated route */}
                  <div className="lg:hidden">
                    <Link
                      href={`/admin/mensagens/${clientId}`}
                      className={`w-full flex items-center gap-3 px-5 py-4 text-left transition-all border-b border-gray-50 hover:bg-gray-50 ${
                        isActive ? "bg-accent/10" : ""
                      }`}
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
                        {(client?.name || "C").charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900 truncate">
                              {client?.name || "Cliente"}
                            </span>
                            {isAssignedToMe && (
                              <span className="shrink-0 inline-flex items-center gap-0.5 rounded-full bg-green-50 border border-green-200 px-1.5 py-0.5 text-[9px] font-semibold text-green-600">
                                <CheckCircle2 size={8} />
                                Meu
                              </span>
                            )}
                            <span className="text-[10px] text-gray-400 shrink-0 ml-auto">
                              {new Date(lastMsg.created_at).toLocaleDateString(
                                "pt-PT",
                                { day: "numeric", month: "short" },
                              )}
                            </span>
                          </div>
                        <p className="text-xs text-gray-400 truncate mt-0.5">
                          {lastMsg.content}
                        </p>
                        {unread > 0 && (
                          <span className="inline-block mt-1 text-[10px] bg-accent text-primary font-bold px-2 py-0.5 rounded-full">
                            {unread} nova(s)
                          </span>
                        )}
                      </div>
                    </Link>
                  </div>
                  {/* Desktop: inline selection */}
                  <div className="hidden lg:block">
                    <button
                      onClick={() => selectClient(clientId)}
                      className={`w-full flex items-center gap-3 px-5 py-4 text-left transition-all border-b border-gray-50 hover:bg-gray-50 ${
                        isActive ? "bg-accent/10" : ""
                      }`}
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
                        {(client?.name || "C").charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900 truncate">
                              {client?.name || "Cliente"}
                            </span>
                            {isAssignedToMe && (
                              <span className="shrink-0 inline-flex items-center gap-0.5 rounded-full bg-green-50 border border-green-200 px-1.5 py-0.5 text-[9px] font-semibold text-green-600">
                                <CheckCircle2 size={8} />
                                Meu
                              </span>
                            )}
                            <span className="text-[10px] text-gray-400 shrink-0 ml-auto">
                              {new Date(lastMsg.created_at).toLocaleDateString(
                                "pt-PT",
                                { day: "numeric", month: "short" },
                              )}
                            </span>
                          </div>
                        <p className="text-xs text-gray-400 truncate mt-0.5">
                          {lastMsg.content}
                        </p>
                        {unread > 0 && (
                          <span className="inline-block mt-1 text-[10px] bg-accent text-primary font-bold px-2 py-0.5 rounded-full">
                            {unread} nova(s)
                          </span>
                        )}
                      </div>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ─── Chat View ─── */}
      <div
        className={`flex-1 flex flex-col bg-gray-50 ${
          !selectedClientId ? "hidden lg:flex" : "flex"
        }`}
      >
        {!selectedClientId ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                  <MessageSquare size={28} className="text-gray-300" />
                </div>
              </div>
              <p className="text-gray-400 text-sm">
                Selecione uma conversa para começar
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="flex items-center gap-3 px-5 py-4 bg-white border-b border-gray-200">
              <button
                onClick={() => setSelectedClientId(null)}
                className="lg:hidden p-1 text-gray-500 hover:text-gray-700"
              >
                <ChevronLeft size={22} />
              </button>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
                {(
                  clients.get(selectedClientId)?.name || "C"
                )
                  .charAt(0)
                  .toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {clients.get(selectedClientId)?.name || "Cliente"}
                </p>
                <p className="text-xs text-gray-400">Cliente</p>
              </div>
            </div>

            {/* Assignment status bar */}
            {(() => {
              const assignment = assignments.get(selectedClientId);
              const isAssignedToMe = assignment?.admin_id === adminId;
              const isAssignedToOther = assignment && !isAssignedToMe;
              const assignedAdminName = isAssignedToOther
                ? adminDisplayNames.get(assignment.admin_id) || "outro administrador"
                : "";

              if (isAssignedToOther) {
                return (
                  <div className="px-5 py-2.5 bg-yellow-50 border-b border-yellow-100 text-xs text-yellow-700">
                    Este cliente está a ser gerido por <strong>{assignedAdminName}</strong>.
                    Apenas o gestor atribuído pode responder às mensagens.
                  </div>
                );
              }

              if (!assignment) {
                return (
                  <div className="px-5 py-2.5 bg-blue-50 border-b border-blue-100 text-xs text-blue-700 flex items-center justify-between gap-2">
                    <span>Este cliente ainda não tem um gestor atribuído.</span>
                    <button
                      onClick={() => handleAssign(selectedClientId)}
                      disabled={assigning}
                      className="shrink-0 rounded-md bg-blue-600 px-3 py-1 text-[11px] font-semibold text-white hover:bg-blue-700 transition-all disabled:opacity-40"
                    >
                      {assigning ? "A atribuir..." : "Assumir cliente"}
                    </button>
                  </div>
                );
              }

              if (isAssignedToMe) {
                return (
                  <div className="px-5 py-2.5 bg-green-50 border-b border-green-100 text-xs text-green-700 flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-green-500" />
                    Este cliente está atribuído a si.
                  </div>
                );
              }

              return null;
            })()}

            {assignSuccess && (
              <div className="px-5 py-2.5 bg-green-50 border-b border-green-100 text-xs text-green-700 flex items-center gap-2">
                <CheckCircle2 size={14} className="text-green-500" />
                {assignSuccess}
              </div>
            )}

            {assignmentError && (
              <div className="px-5 py-2 bg-red-50 border-b border-red-100 text-xs text-red-600">
                {assignmentError}
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-3">
              {activeMessages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-sm text-gray-400">
                  Nenhuma mensagem nesta conversa.
                </div>
              ) : (
                activeMessages.map((msg) => {
                  const isAdmin = msg.sender_id !== msg.client_id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[75%] sm:max-w-[65%] rounded-2xl px-4 py-2.5 ${
                          isAdmin
                            ? "bg-accent text-primary rounded-br-md"
                            : "bg-white text-gray-800 rounded-bl-md border border-gray-100 shadow-sm"
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                        <div
                          className={`flex items-center gap-2 mt-1 ${
                            isAdmin ? "justify-end" : "justify-start"
                          }`}
                        >
                          <span
                            className={`text-[10px] ${
                              isAdmin ? "text-primary/60" : "text-gray-400"
                            }`}
                          >
                            {isAdmin ? "Admin" : "Cliente"}
                          </span>
                          <span
                            className={`text-[10px] ${
                              isAdmin ? "text-primary/50" : "text-gray-400"
                            }`}
                          >
                            {new Date(msg.created_at).toLocaleTimeString(
                              "pt-PT",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </span>
                          {!msg.read && !isAdmin && (
                            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Typing indicator */}
            {clientTyping && (
              <div className="px-6 py-1.5 text-xs text-gray-400 italic flex items-center gap-1.5">
                <span className="flex gap-0.5">
                  <span className="w-1 h-1 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1 h-1 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1 h-1 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                </span>
                Cliente está a escrever...
              </div>
            )}

            {/* Reply Input */}
            <div className="px-4 sm:px-6 py-4 bg-white border-t border-gray-200">
              {(() => {
                const assignment = assignments.get(selectedClientId);
                const isAssignedToMe = assignment?.admin_id === adminId;
                const canReply = !assignment || isAssignedToMe;

                if (!canReply) {
                  return (
                    <div className="text-center text-sm text-gray-400 py-3">
                      Não tens permissão para responder a este cliente.
                    </div>
                  );
                }

                if (!assignment) {
                  return (
                    <div className="text-center text-sm text-gray-400 py-3">
                      Atribua este cliente a si primeiro para responder.
                    </div>
                  );
                }

                return (
                  <div className="flex flex-col gap-2">
                    {showFileUpload && (
                      <FileUpload
                        folder={`${selectedClientId}/admin`}
                        onUploadComplete={(files) => {
                          setUploadedFiles((prev) => [...prev, ...files]);
                        }}
                        buttonLabel="Anexar ficheiro"
                      />
                    )}
                    {uploadedFiles.length > 0 && !showFileUpload && (
                      <div className="flex gap-2 flex-wrap">
                        {uploadedFiles.map((f, i) => (
                          <span key={i} className="inline-flex items-center gap-1 bg-primary/5 text-xs text-primary px-2.5 py-1 rounded-lg">
                            <Paperclip size={10} />
                            {f.name}
                          </span>
                        ))}
                      </div>
                    )}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleReply();
                      }}
                      className="flex gap-3"
                    >
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
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Escrever mensagem..."
                        className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 placeholder:text-gray-400 transition-all"
                      />
                      <button
                        type="submit"
                        disabled={!replyText.trim() || sending}
                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white hover:bg-primary-light transition-all disabled:opacity-40 shrink-0"
                      >
                        {sending ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Send size={16} />
                        )}
                      </button>
                    </form>
                  </div>
                );
              })()}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
