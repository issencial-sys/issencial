"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  MessageSquare,
  Search,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

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

export default function AdminConversationList() {
  const [messages, setMessages] = useState<GeneralMessage[]>([]);
  const [clients, setClients] = useState<Map<string, ClientInfo>>(new Map());
  const [assignments, setAssignments] = useState<Map<string, ClientAssignment>>(
    new Map(),
  );
  const [adminDisplayNames, setAdminDisplayNames] = useState<
    Map<string, string>
  >(new Map());
  const [clientEmails, setClientEmails] = useState<Map<string, string>>(
    new Map(),
  );
  const [loading, setLoading] = useState(true);
  const [adminId, setAdminId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [assignmentError, setAssignmentError] = useState<string | null>(null);
  const [assignSuccess, setAssignSuccess] = useState<string | null>(null);
  const assignTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const supabase = createClient();
  const pathname = usePathname();

  const activeClientId =
    pathname.startsWith("/admin/mensagens/") && pathname !== "/admin/mensagens"
      ? decodeURIComponent(pathname.split("/").pop() || "")
      : null;

  useEffect(() => {
    init();
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (assignTimeoutRef.current) clearTimeout(assignTimeoutRef.current);
    };
  }, []);

  // Realtime subscription for new/updated messages
  useEffect(() => {
    if (!adminId) return;

    supabase
      .getChannels()
      .filter((c) => c.topic === "realtime:admin-conversation-list")
      .forEach((c) => supabase.removeChannel(c));

    const channel = supabase
      .channel("admin-conversation-list")
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

          // Fetch unknown client
          if (newMsg.client_id !== adminId && !clients.has(newMsg.client_id)) {
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

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [adminId]);

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
    const [profilesResult, assignmentsResult, adminUsersResult] =
      await Promise.all([
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
    (assignmentsResult.data ?? []).forEach((a) =>
      assignMap.set(a.client_id, a),
    );
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
    } catch {
      /* silêncio */
    }

    setLoading(false);
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

  // Group messages by client, excluding admin's own conversations
  const clientConversations = new Map<string, GeneralMessage[]>();
  messages.forEach((msg) => {
    if (msg.client_id === adminId) return;
    const existing = clientConversations.get(msg.client_id) || [];
    existing.push(msg);
    clientConversations.set(msg.client_id, existing);
  });

  // Filter conversations by search query
  const filteredConversations = [...clientConversations.entries()]
    .filter(([clientId, convMessages]) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const client = clients.get(clientId);
      if (client?.name?.toLowerCase().includes(q)) return true;
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
    <div className="flex flex-1 flex-col bg-white min-h-0">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 shrink-0">
        <h2 className="font-semibold text-gray-900">Conversas</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          {searchQuery
            ? `${filteredConversations.length} de ${clientConversations.size} conversa(s)`
            : `${clientConversations.size} conversa(s)`}
        </p>
      </div>

      {/* Search */}
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

      {/* List */}
      <div className="flex-1 overflow-y-auto min-h-0">
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
            const isActive = activeClientId === clientId;
            const assignment = assignments.get(clientId);
            const isAssignedToMe = assignment?.admin_id === adminId;

            return (
              <div key={clientId}>
                <Link
                  href={`/admin/mensagens/${clientId}`}
                  className={`flex items-center gap-3 px-5 py-4 text-left transition-all border-b border-gray-50 hover:bg-gray-50 ${
                    isActive ? "bg-accent/10" : ""
                  }`}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
                    {(client?.name || "C").charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
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
            );
          })
        )}
      </div>
    </div>
  );
}
