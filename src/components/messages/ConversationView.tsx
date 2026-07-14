"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import {
  Loader2,
  Send,
  Paperclip,
  FileText,
  ChevronLeft,
  MessageSquare,
  Layers,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import FileUpload from "@/components/ui/FileUpload";
import type { UploadedFile } from "@/components/ui/FileUpload";
import {
  usePortalMessages,
} from "./PortalMessagesProvider";

export default function ConversationView({
  convId,
  showBackButton = true,
}: {
  convId: string;
  showBackButton?: boolean;
}) {
  const {
    conversations,
    loading,
    userId,
    adminDisplayName,
    markRead,
    sendMessage,
  } = usePortalMessages();

  const supabase = createClient();
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [typing, setTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(
    null,
  );

  const conversation = conversations.get(convId);
  const activeMessages = conversation?.messages || [];

  // Mark conversation as read when opened
  useEffect(() => {
    markRead(convId);
  }, [convId, markRead]);

  // Scroll to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages.length]);

  // Typing presence channel for this conversation
  useEffect(() => {
    if (!userId) return;
    const convKey = convId === "general" ? "general" : convId;
    const typingChannel = supabase.channel(
      `portal-typing:${convKey}:${userId}`,
    );
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
  }, [userId, convId, supabase]);

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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setSending(true);
    await sendMessage(convId, newMessage, uploadedFiles);
    setNewMessage("");
    setUploadedFiles([]);
    setShowFileUpload(false);
    setSending(false);
  };

  const isGeneral = convId === "general";

  return (
    <div className="flex-1 flex flex-col bg-gray-100 min-w-0 h-full">
      {/* Fixed header */}
      <div className="shrink-0 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3 px-5 py-4">
          {showBackButton && (
            <Link
              href="/portal/mensagens"
              className="lg:hidden p-1 text-gray-500 hover:text-gray-700 -ml-1"
            >
              <ChevronLeft size={22} />
            </Link>
          )}
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
              isGeneral
                ? "bg-primary/10 text-primary"
                : "bg-accent/20 text-primary"
            }`}
          >
            {isGeneral ? (
              <MessageSquare size={16} />
            ) : (
              <Layers size={16} />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-dark">
              {conversation?.title || "Selecione uma conversa"}
            </p>
            <p className="text-xs text-gray-400">
              {isGeneral
                ? "Conversa com a equipa Issencial"
                : "Conversa sobre o processo"}
            </p>
          </div>
        </div>
      </div>

      {/* Messages — only this scrolls */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-3 min-h-0">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 size={24} className="animate-spin text-primary" />
          </div>
        ) : activeMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="flex justify-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-200">
                <MessageSquare size={28} className="text-gray-400" />
              </div>
            </div>
            <p className="text-gray-400 text-sm max-w-xs">
              {isGeneral
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
                          {new Date(msg.created_at).toLocaleTimeString("pt-PT", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
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
                          {new Date(msg.created_at).toLocaleTimeString("pt-PT", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
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

      {/* Typing indicator */}
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

      {/* Fixed input */}
      <div className="px-4 py-3 bg-white border-t border-gray-200 shrink-0">
        <form
          onSubmit={handleSendMessage}
          className="flex flex-col gap-3 max-w-2xl mx-auto"
        >
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
              folder={`${userId}/${isGeneral ? "general" : convId}`}
              onUploadComplete={handleFilesUploaded}
              buttonLabel="Anexar ficheiro"
            />
          </div>
        )}
      </div>
    </div>
  );
}
