"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Loader2,
  MessageSquare,
  Send,
  Paperclip,
  FileText,
  ChevronLeft,
  Search,
  Layers,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import FileUpload from "@/components/ui/FileUpload";
import type { UploadedFile } from "@/components/ui/FileUpload";
import { logActivity, ActivityActions } from "@/lib/activity-log";

interface Attachment {
  name: string;
  url: string;
  size: number;
  type: string;
}

interface GeneralMessage {
  id: string;
  client_id: string;
  sender_id: string;
  content: string;
  read: boolean;
  created_at: string;
  process_id: string | null;
  attachments: Attachment[];
}

interface ClientProcess {
  id: string;
  title: string;
}

interface Conversation {
  id: string; // "general" or process_id
  title: string;
  messages: GeneralMessage[];
  lastMessage?: GeneralMessage;
  unreadCount: number;
}

export default function MensagensPage() {
  const [conversations, setConversations] = useState<Map<string, Conversation>>(new Map());
  const [selectedConvId, setSelectedConvId] = useState<string>("general");
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [typing, setTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [processes, setProcesses] = useState<Map<string, ClientProcess>>(new Map());
  const [adminDisplayName, setAdminDisplayName] = useState("Issencial");
  const fetchingNewConvRef = useRef<Set<string>>(new Set());
  const chatEndRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const typingChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const supabase = createClient();

  useEffect(() => {
    init();
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversations.get(selectedConvId)?.messages]);

  // Realtime subscription for new messages — stable, never recreated
  useEffect(() => {
    if (!userId) return;

    // Clean up previous channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    // Subscribe to all messages for this client (general + process-scoped)
    const channel = supabase
      .channel("portal-messages-all")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const newMsg = payload.new as GeneralMessage;
          if (newMsg.client_id === userId) {
            addMessageToConversation(newMsg);
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const updated = payload.new as GeneralMessage;
          if (updated.client_id === userId) {
            updateMessageInConversation(updated);
          }
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [userId]);

  // Typing channel — re-created when selected conversation changes
  useEffect(() => {
    if (!userId) return;

    const convKey = selectedConvId === "general" ? "general" : selectedConvId;
    const typingChannel = supabase.channel(`portal-typing:${convKey}:${userId}`);
    if (typingChannelRef.current) {
      typingChannelRef.current.unsubscribe();
    }
    typingChannelRef.current = typingChannel;
    typingChannel
      .on("broadcast", { event: "admin-typing" }, () => {
        setTyping(true);
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => setTyping(false), 3000);
      })
      .subscribe();

    return () => {
      if (typingChannelRef.current) {
        typingChannelRef.current.unsubscribe();
        typingChannelRef.current = null;
      }
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      if (typingDebounceRef.current) clearTimeout(typingDebounceRef.current);
    };
  }, [userId, selectedConvId]);

  const addMessageToConversation = (msg: GeneralMessage) => {
    const convId = msg.process_id || "general";

    // If this is a process conversation we don't have yet, fetch the title
    if (convId !== "general" && !conversations.has(convId) && !fetchingNewConv.has(convId)) {
      fetchingNewConv.add(convId);
      supabase
        .from("processes")
        .select("id, title")
        .eq("id", convId)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setProcesses((prev) => {
              const next = new Map(prev);
              next.set(data.id, data);
              return next;
            });
            setConversations((prev) => {
              const next = new Map(prev);
              if (!next.has(convId)) {
                next.set(convId, {
                  id: convId,
                  title: data.title,
                  messages: [msg],
                  lastMessage: msg,
                  unreadCount:
                    msg.sender_id !== userId && convId !== selectedConvId ? 1 : 0,
                });
              }
              return next;
            });
          }
        });
      return;
    }

    setConversations((prev) => {
      const next = new Map(prev);
      const existing = next.get(convId);
      if (existing) {
        if (existing.messages.some((m) => m.id === msg.id)) return prev;
        next.set(convId, {
          ...existing,
          messages: [...existing.messages, msg],
          lastMessage: msg,
          unreadCount:
            msg.sender_id !== userId && convId !== selectedConvId
              ? existing.unreadCount + 1
              : existing.unreadCount,
        });
      }
      return next;
    });
  };

  const fetchingNewConv = fetchingNewConvRef.current;

  const updateMessageInConversation = (msg: GeneralMessage) => {
    setConversations((prev) => {
      const next = new Map(prev);
      const convId = msg.process_id || "general";
      const existing = next.get(convId);
      if (existing) {
        next.set(convId, {
          ...existing,
          messages: existing.messages.map((m) =>
            m.id === msg.id ? msg : m,
          ),
        });
      }
      return next;
    });
  };

  const init = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    // Fetch admin display name from client_assignments
    const { data: assignment } = await supabase
      .from("client_assignments")
      .select("admin_id")
      .eq("client_id", user.id)
      .maybeSingle();

    if (assignment) {
      const { data: adminUser } = await supabase
        .from("admin_users")
        .select("display_name")
        .eq("user_id", assignment.admin_id)
        .maybeSingle();
      if (adminUser?.display_name) {
        setAdminDisplayName(adminUser.display_name);
      }
    }

    // Fetch all messages for this client (general + process-scoped)
    const { data: allMessages } = await supabase
      .from("messages")
      .select("*")
      .eq("client_id", user.id)
      .order("created_at", { ascending: true });

    // Fetch client's processes
    const { data: processList } = await supabase
      .from("processes")
      .select("id, title")
      .eq("client_id", user.id)
      .order("created_at", { ascending: false });

    const procMap = new Map<string, ClientProcess>();
    (processList ?? []).forEach((p) => procMap.set(p.id, p));
    setProcesses(procMap);

    // Group messages by process_id (null = general)
    const convMap = new Map<string, Conversation>();
    const msgs = allMessages ?? [];

    // Add general conversation
    const generalMsgs = msgs.filter((m) => !m.process_id);
    const generalUnread = generalMsgs.filter(
      (m) => !m.read && m.sender_id !== user.id,
    ).length;
    convMap.set("general", {
      id: "general",
      title: "Chat Geral",
      messages: generalMsgs,
      lastMessage: generalMsgs[generalMsgs.length - 1],
      unreadCount: generalUnread,
    });

    // Add process conversations
    (processList ?? []).forEach((proc) => {
      const procMsgs = msgs.filter((m) => m.process_id === proc.id);
      const procUnread = procMsgs.filter(
        (m) => !m.read && m.sender_id !== user.id,
      ).length;
      convMap.set(proc.id, {
        id: proc.id,
        title: proc.title,
        messages: procMsgs,
        lastMessage: procMsgs[procMsgs.length - 1],
        unreadCount: procUnread,
      });
    });

    setConversations(convMap);

    // Auto-select first conversation with messages, or general
    const firstWithMessages = [...convMap.values()].find(
      (c) => c.messages.length > 0,
    );
    if (firstWithMessages) {
      setSelectedConvId(firstWithMessages.id);
    }

    setLoading(false);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !userId) return;

    setSending(true);
    const processId = selectedConvId === "general" ? null : selectedConvId;

    const { data, error } = await supabase
      .from("messages")
      .insert({
        process_id: processId,
        client_id: userId,
        sender_id: userId,
        content: newMessage.trim(),
        attachments: uploadedFiles.length > 0 ? uploadedFiles : [],
      })
      .select()
      .single();

    if (!error && data) {
      addMessageToConversation(data as GeneralMessage);
      setNewMessage("");
      setUploadedFiles([]);
      setShowFileUpload(false);

      await logActivity({
        entityType: "process",
        entityId: processId || "general",
        action: ActivityActions.MESSAGE_SENT,
        description: processId
          ? `Mensagem enviada no processo`
          : "Mensagem enviada no chat geral",
        metadata: { has_attachments: uploadedFiles.length > 0 },
      });
    }
    setSending(false);
  };

  const handleTyping = useCallback(() => {
    if (!userId) return;
    if (typingDebounceRef.current) return;
    typingDebounceRef.current = setTimeout(() => {
      typingDebounceRef.current = null;
    }, 2000);

    if (typingChannelRef.current) {
      typingChannelRef.current.send({
        type: "broadcast",
        event: "client-typing",
        payload: { userId },
      });
    }
  }, [userId]);

  const handleFilesUploaded = (files: UploadedFile[]) => {
    setUploadedFiles((prev) => [...prev, ...files]);
  };

  const selectConversation = (convId: string) => {
    setSelectedConvId(convId);
    // Mark messages as read
    setConversations((prev) => {
      const next = new Map(prev);
      const conv = next.get(convId);
      if (conv && conv.unreadCount > 0) {
        const unreadIds = conv.messages
          .filter((m) => !m.read && m.sender_id !== userId)
          .map((m) => m.id);
        unreadIds.forEach((id) => {
          supabase.from("messages").update({ read: true }).eq("id", id);
        });
        next.set(convId, { ...conv, unreadCount: 0 });
      }
      return next;
    });
  };

  const selectedConversation = conversations.get(selectedConvId);
  const activeMessages = selectedConversation?.messages || [];

  // Sort conversations: general first, then by last message time
  const sortedConversations = [...conversations.values()]
    .filter((c) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return c.title.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (a.id === "general") return -1;
      if (b.id === "general") return 1;
      const aTime = a.lastMessage?.created_at || "";
      const bTime = b.lastMessage?.created_at || "";
      return new Date(bTime).getTime() - new Date(aTime).getTime();
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
      {/* ─── Sidebar — Conversation List ─── */}
      <div
        className={`w-72 lg:w-80 border-r border-gray-200 bg-white flex flex-col shrink-0 ${
          selectedConvId && selectedConversation?.messages.length
            ? "hidden lg:flex"
            : "flex"
        }`}
      >
        {/* Header — fixed */}
        <div className="px-5 py-4 border-b border-gray-100 shrink-0">
          <h2 className="font-semibold text-dark">Conversas</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {sortedConversations.length} conversa(s)
          </p>
        </div>

        {/* Search — fixed */}
        <div className="px-4 py-3 border-b border-gray-100 shrink-0">
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

        {/* Conversation List — scrolls independently */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {sortedConversations.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-400">
              <div className="flex justify-center mb-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-50">
                  <MessageSquare size={22} className="text-gray-300" />
                </div>
              </div>
              {searchQuery ? (
                <>
                  Nenhuma conversa encontrada
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
            sortedConversations.map((conv) => {
              const isActive = selectedConvId === conv.id;
              const isGeneral = conv.id === "general";
              return (
                <button
                  key={conv.id}
                  onClick={() => selectConversation(conv.id)}
                  className={`w-full flex items-center gap-3 px-5 py-4 text-left transition-all border-b border-gray-50 hover:bg-gray-50 ${
                    isActive ? "bg-accent/10" : ""
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                      isGeneral
                        ? "bg-primary/10 text-primary"
                        : "bg-accent/20 text-primary"
                    }`}
                  >
                    {isGeneral ? (
                      <MessageSquare size={18} />
                    ) : (
                      <Layers size={18} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-dark truncate">
                        {conv.title}
                      </span>
                      {conv.lastMessage && (
                        <span className="text-[10px] text-gray-400 shrink-0 ml-2">
                          {new Date(conv.lastMessage.created_at).toLocaleDateString(
                            "pt-PT",
                            { day: "numeric", month: "short" },
                          )}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 truncate mt-0.5">
                      {conv.lastMessage
                        ? conv.lastMessage.content
                        : "Sem mensagens"}
                    </p>
                    {conv.unreadCount > 0 && (
                      <span className="inline-block mt-1 text-[10px] bg-accent text-primary font-bold px-2 py-0.5 rounded-full">
                        {conv.unreadCount} nova(s)
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ─── Chat View ─── */}
      <div
        className={`flex-1 flex flex-col bg-gray-100 min-w-0 ${
          selectedConversation && selectedConversation.messages.length > 0
            ? "flex"
            : "hidden lg:flex"
        }`}
      >
        {/* ─── Fixed Header ─── */}
        <div className="shrink-0 bg-white border-b border-gray-200">
          <div className="flex items-center gap-3 px-5 py-4">
            <button
              onClick={() => setSelectedConvId("")}
              className="lg:hidden p-1 text-gray-500 hover:text-gray-700 -ml-1"
            >
              <ChevronLeft size={22} />
            </button>
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
                selectedConvId === "general"
                  ? "bg-primary/10 text-primary"
                  : "bg-accent/20 text-primary"
              }`}
            >
              {selectedConvId === "general" ? (
                <MessageSquare size={16} />
              ) : (
                <Layers size={16} />
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-dark">
                {selectedConversation?.title || "Selecione uma conversa"}
              </p>
              <p className="text-xs text-gray-400">
                {selectedConvId === "general"
                  ? "Conversa com a equipa Issencial"
                  : "Conversa sobre o processo"}
              </p>
            </div>
          </div>
        </div>

        {/* ─── Messages — only this scrolls ─── */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-3 min-h-0">
          {activeMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="flex justify-center mb-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-200">
                  <MessageSquare size={28} className="text-gray-400" />
                </div>
              </div>
              <p className="text-gray-400 text-sm max-w-xs">
                {selectedConvId === "general"
                  ? "Envie-nos uma mensagem. Estamos aqui para ajudar!"
                  : "Nenhuma mensagem nesta conversa ainda."}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 max-w-2xl mx-auto">
              {activeMessages.map((msg) => {
                const isSent = msg.sender_id === userId;
                const attachments = msg.attachments;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isSent ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] sm:max-w-[65%] rounded-2xl px-4 py-2.5 ${
                        isSent
                          ? "bg-accent text-primary rounded-br-md"
                          : "bg-white text-gray-800 rounded-bl-md border border-gray-100 shadow-sm"
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                      {attachments && attachments.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {attachments.map((att, i) => (
                            <a
                              key={i}
                              href={att.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1 text-[10px] font-medium hover:bg-white transition-all ${
                                isSent
                                  ? "bg-white/20 text-primary/80"
                                  : "bg-white/80 text-primary"
                              }`}
                            >
                              <FileText size={10} />
                              {att.name.length > 20
                                ? att.name.slice(0, 20) + "…"
                                : att.name}
                            </a>
                          ))}
                        </div>
                      )}
                      <div
                        className={`flex items-center gap-2 mt-1 ${
                          isSent ? "justify-end" : "justify-start"
                        }`}
                      >
                        {isSent && (
                          <span className="text-[10px] text-primary/50">
                            {new Date(msg.created_at).toLocaleTimeString(
                              "pt-PT",
                              { hour: "2-digit", minute: "2-digit" },
                            )}
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-medium ${
                            isSent ? "text-primary/60" : "text-gray-400"
                          }`}
                        >
                          {isSent ? "Você" : adminDisplayName}
                        </span>
                        {!isSent && (
                          <span className="text-[10px] text-gray-400">
                            {new Date(msg.created_at).toLocaleTimeString(
                              "pt-PT",
                              { hour: "2-digit", minute: "2-digit" },
                            )}
                          </span>
                        )}
                        {!msg.read && !isSent && (
                          <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* ─── Typing Indicator — fixed ─── */}
        {typing && (
          <div className="px-6 py-1.5 text-xs text-gray-400 italic flex items-center gap-1.5 bg-gray-50 border-t border-gray-100 shrink-0">
            <span className="flex gap-0.5">
              <span
                className="w-1 h-1 rounded-full bg-gray-400 animate-bounce"
                style={{ animationDelay: "0ms" }}
              />
              <span
                className="w-1 h-1 rounded-full bg-gray-400 animate-bounce"
                style={{ animationDelay: "150ms" }}
              />
              <span
                className="w-1 h-1 rounded-full bg-gray-400 animate-bounce"
                style={{ animationDelay: "300ms" }}
              />
            </span>
            {adminDisplayName} está a escrever...
          </div>
        )}

        {/* ─── Fixed Input ─── */}
        <div className="px-4 py-3 bg-white border-t border-gray-200 shrink-0">
          <form
            onSubmit={handleSendMessage}
            className="flex flex-col gap-3 max-w-2xl mx-auto"
          >
            {/* FileUpload outside the form to avoid drag/drop interference */}
            {uploadedFiles.length > 0 && !showFileUpload && (
              <div className="flex gap-2 flex-wrap">
                {uploadedFiles.map((f, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 bg-primary/5 text-xs text-primary px-2.5 py-1 rounded-lg"
                  >
                    <Paperclip size={10} />
                    {f.name}
                  </span>
                ))}
              </div>
            )}
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
                placeholder="Escrever mensagem..."
                className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 placeholder:text-gray-400 transition-all"
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || sending}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white hover:bg-primary-light transition-all disabled:opacity-40 shrink-0"
              >
                {sending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
              </button>
            </div>
          </form>
          {showFileUpload && (
            <div className="mt-3">
              <FileUpload
                folder={`${userId}/${selectedConvId === "general" ? "general" : selectedConvId}`}
                onUploadComplete={handleFilesUploaded}
                buttonLabel="Anexar ficheiro"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
