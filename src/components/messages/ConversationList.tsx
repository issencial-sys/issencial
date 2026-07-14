"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageSquare, Layers, Search } from "lucide-react";
import { usePortalMessages } from "./PortalMessagesProvider";

export default function ConversationList({
  activeConvId,
}: {
  activeConvId?: string;
}) {
  const { conversations, loading } = usePortalMessages();
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = [...conversations.values()]
    .filter((c) => {
      if (!searchQuery.trim()) return true;
      return c.title.toLowerCase().includes(searchQuery.toLowerCase());
    })
    .sort((a, b) => {
      if (a.id === "general") return -1;
      if (b.id === "general") return 1;
      const aTime = a.lastMessage?.created_at || "";
      const bTime = b.lastMessage?.created_at || "";
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="px-5 py-4 border-b border-gray-100 shrink-0">
        <h2 className="font-semibold text-dark">Conversas</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          {conversations.size} conversa(s)
        </p>
      </div>

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

      <div className="flex-1 overflow-y-auto min-h-0">
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-400">
            A carregar...
          </div>
        ) : conversations.size === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">
            <div className="flex justify-center mb-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-50">
                <MessageSquare size={22} className="text-gray-300" />
              </div>
            </div>
            Nenhuma conversa ainda.
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">
            Nenhuma conversa encontrada.
            <button
              onClick={() => setSearchQuery("")}
              className="block mx-auto mt-3 text-xs text-primary hover:underline"
            >
              Limpar pesquisa
            </button>
          </div>
        ) : (
          filtered.map((conv) => {
              const isActive = activeConvId === conv.id;
              const isGeneral = conv.id === "general";
              return (
                <Link
                  key={conv.id}
                  href={`/portal/mensagens/${conv.id}`}
                  className={`flex items-center gap-3 px-5 py-4 text-left transition-all border-b border-gray-50 hover:bg-gray-50 ${
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
                          {new Date(
                            conv.lastMessage.created_at,
                          ).toLocaleDateString("pt-PT", {
                            day: "numeric",
                            month: "short",
                          })}
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
                </Link>
              );
            })
        )}
      </div>
    </div>
  );
}
