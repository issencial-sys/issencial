"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, MessageSquare, Send, Paperclip, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import FileUpload from "@/components/ui/FileUpload";
import type { UploadedFile } from "@/components/ui/FileUpload";

interface GeneralMessage {
  id: string;
  client_id: string;
  sender_id: string;
  content: string;
  read: boolean;
  created_at: string;
  attachments?: { name: string; url: string; size: number; type: string }[];
}

interface ClientInfo {
  id: string;
  name: string;
}

export default function AdminMensagensConversaPage() {
  const { id: clientId } = useParams<{ id: string }>();
  const router = useRouter();
  const [messages, setMessages] = useState<GeneralMessage[]>([]);
  const [client, setClient] = useState<ClientInfo | null>(null);
  const [adminId, setAdminId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [clientTyping, setClientTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const typingChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const supabase = createClient();

  useEffect(() => {
    init();
  }, [clientId]);

  // Realtime subscription in its own effect to avoid StrictMode race.
  useEffect(() => {
    supabase
      .getChannels()
      .filter((c) => c.topic === "realtime:admin-mobile-chat")
      .forEach((c) => supabase.removeChannel(c));

    const channel = supabase
      .channel("admin-mobile-chat")
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
          if (newMsg.client_id === clientId) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
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
          if (updated.client_id === clientId) {
            setMessages((prev) =>
              prev.map((m) => (m.id === updated.id ? updated : m)),
            );
          }
        },
      )
      .subscribe();

    // Listen for client typing — scoped per client
    const typingChannel = supabase.channel(`portal-typing:general:${clientId}`);
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
      typingChannel.unsubscribe();
      typingChannelRef.current = null;
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, [clientId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const init = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setAdminId(user.id);

    const { data: msgs } = await supabase
      .from("messages")
      .select("*")
      .is("process_id", null)
      .eq("client_id", clientId)
      .order("created_at", { ascending: true });

    setMessages(msgs ?? []);

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, name")
      .eq("id", clientId)
      .single();

    if (profile) {
      setClient(profile);
    }

    setLoading(false);

    const unread = (msgs ?? []).filter(
      (m) => m.sender_id === clientId && !m.read,
    );
    unread.forEach((m) => {
      supabase.from("messages").update({ read: true }).eq("id", m.id);
    });
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !adminId) return;

    // Broadcast admin typing stop via existing channel
    if (typingChannelRef.current) {
      typingChannelRef.current.send({
        type: "broadcast",
        event: "admin-typing",
        payload: {},
      });
    }

    // Optimistic update — show immediately
    const optimisticMsg = {
      id: `temp-${Date.now()}`,
      process_id: null,
      client_id: clientId,
      sender_id: adminId,
      content: replyText.trim(),
      read: false,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    setReplyText("");
    setUploadedFiles([]);
    setShowFileUpload(false);
    setSending(true);

    await supabase.from("messages").insert({
      process_id: null,
      client_id: clientId,
      sender_id: adminId,
      content: replyText.trim(),
      attachments: uploadedFiles.length > 0 ? uploadedFiles : [],
    });

    setSending(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 shrink-0 top-0 z-10"
      >
        <Link
          href="/admin/mensagens"
          className="p-1 text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft size={22} />
        </Link>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
          {(client?.name || "C").charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">
            {client?.name || "Cliente"}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 bg-gray-50 space-y-2">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="flex justify-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <MessageSquare size={28} className="text-gray-300" />
              </div>
            </div>
            <p className="text-gray-400 text-sm max-w-xs">
              Envie a primeira mensagem para este cliente.
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => {
              const isAdmin = msg.sender_id !== msg.client_id;
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 16, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{
                    duration: 0.25,
                    delay: Math.min(i * 0.025, 0.3),
                    ease: "easeOut",
                  }}
                  className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 ${
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
                        {isAdmin ? "Admin" : client?.name || "Cliente"}
                      </span>
                      <span
                        className={`text-[10px] ${
                          isAdmin ? "text-primary/50" : "text-gray-400"
                        }`}
                      >
                        {new Date(msg.created_at).toLocaleTimeString("pt-PT", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {!msg.read && !isAdmin && (
                        <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Client typing indicator */}
      {clientTyping && (
        <div className="px-6 py-1.5 text-xs text-gray-400 italic flex items-center gap-1.5 bg-gray-50 border-t border-gray-100">
          <span className="flex gap-0.5">
            <span className="w-1 h-1 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-1 h-1 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-1 h-1 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }} />
          </span>
          {client?.name?.split(" ")[0] || "Cliente"} está a escrever...
        </div>
      )}

      {/* Fixed input at bottom */}
      <div className="px-4 sm:px-6 py-4 bg-white border-t border-gray-200 shrink-0">
        <div className="flex flex-col gap-2 max-w-2xl mx-auto">
          {showFileUpload && (
            <FileUpload
              folder={`${clientId}/admin`}
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
          <form onSubmit={handleReply} className="flex gap-3">
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
      </div>
    </div>
  );
}
