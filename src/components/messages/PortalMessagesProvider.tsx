"use client";

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { logActivity, ActivityActions } from "@/lib/activity-log";
import type { UploadedFile } from "@/components/ui/FileUpload";

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

interface PortalMessagesContextValue {
  conversations: Map<string, Conversation>;
  loading: boolean;
  userId: string | null;
  adminDisplayName: string;
  markRead: (convId: string) => void;
  sendMessage: (
    convId: string,
    content: string,
    attachments: UploadedFile[],
  ) => Promise<void>;
}

const PortalMessagesContext = createContext<PortalMessagesContextValue | null>(
  null,
);

export function usePortalMessages() {
  const ctx = useContext(PortalMessagesContext);
  if (!ctx) {
    throw new Error(
      "usePortalMessages must be used within PortalMessagesProvider",
    );
  }
  return ctx;
}

export function PortalMessagesProvider({ children }: { children: ReactNode }) {
  const [conversations, setConversations] = useState<
    Map<string, Conversation>
  >(new Map());
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminDisplayName, setAdminDisplayName] = useState("Issencial");
  const fetchingNewConvRef = useRef<Set<string>>(new Set());
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const supabase = createClient();

  const addMessageToConversation = (msg: GeneralMessage) => {
    const convId = msg.process_id || "general";

    if (
      convId !== "general" &&
      !conversations.has(convId) &&
      !fetchingNewConvRef.current.has(convId)
    ) {
      fetchingNewConvRef.current.add(convId);
      supabase
        .from("processes")
        .select("id, title")
        .eq("id", convId)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setConversations((prev) => {
              const next = new Map(prev);
              if (!next.has(convId)) {
                next.set(convId, {
                  id: convId,
                  title: data.title,
                  messages: [msg],
                  lastMessage: msg,
                  unreadCount:
                    msg.sender_id !== userId && convId !== selectedConvIdRef.current
                      ? 1
                      : 0,
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
            msg.sender_id !== userId && convId !== selectedConvIdRef.current
              ? existing.unreadCount + 1
              : existing.unreadCount,
        });
      }
      return next;
    });
  };

  const updateMessageInConversation = (msg: GeneralMessage) => {
    setConversations((prev) => {
      const next = new Map(prev);
      const convId = msg.process_id || "general";
      const existing = next.get(convId);
      if (existing) {
        next.set(convId, {
          ...existing,
          messages: existing.messages.map((m) => (m.id === msg.id ? msg : m)),
        });
      }
      return next;
    });
  };

  // Tracks the currently-open conversation id (route-based) so realtime
  // can decide whether an incoming message is unread.
  const selectedConvIdRef = useRef<string>("general");

  const init = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

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

    const { data: allMessages } = await supabase
      .from("messages")
      .select("*")
      .eq("client_id", user.id)
      .order("created_at", { ascending: true });

    const { data: processList } = await supabase
      .from("processes")
      .select("id, title")
      .eq("client_id", user.id)
      .order("created_at", { ascending: false });

    const convMap = new Map<string, Conversation>();
    const msgs = allMessages ?? [];

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
    setLoading(false);
  };

  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Realtime subscription for new messages — stable, never recreated
  useEffect(() => {
    if (!userId) return;

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

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

  const markRead = useCallback(
    (convId: string) => {
      selectedConvIdRef.current = convId;
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
    },
    [userId, supabase],
  );

  const sendMessage = async (
    convId: string,
    content: string,
    attachments: UploadedFile[],
  ) => {
    if (!content.trim() || !userId) return;

    const processId = convId === "general" ? null : convId;

    const { data, error } = await supabase
      .from("messages")
      .insert({
        process_id: processId,
        client_id: userId,
        sender_id: userId,
        content: content.trim(),
        attachments: attachments.length > 0 ? attachments : [],
      })
      .select()
      .single();

    if (!error && data) {
      addMessageToConversation(data as GeneralMessage);

      await logActivity({
        entityType: "process",
        entityId: processId || "general",
        action: ActivityActions.MESSAGE_SENT,
        description: processId
          ? `Mensagem enviada no processo`
          : "Mensagem enviada no chat geral",
        metadata: { has_attachments: attachments.length > 0 },
      });
    }
  };

  return (
    <PortalMessagesContext.Provider
      value={{
        conversations,
        loading,
        userId,
        adminDisplayName,
        markRead,
        sendMessage,
      }}
    >
      {children}
    </PortalMessagesContext.Provider>
  );
}
