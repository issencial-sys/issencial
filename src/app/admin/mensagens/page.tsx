"use client";

import AdminConversationList from "@/components/messages/AdminConversationList";
import { MessageSquare } from "lucide-react";

export default function AdminMensagensPage() {
  return (
    <>
      {/* Mobile: full-screen conversation list */}
      <div className="lg:hidden flex flex-1 min-h-0">
        <AdminConversationList />
      </div>

      {/* Desktop: empty state placeholder when no conversation is selected */}
      <div className="hidden lg:flex flex-1 flex-col items-center justify-center bg-gray-50 text-center p-8">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-200 mb-5">
          <MessageSquare size={36} className="text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1.5">
          Conversas de Clientes
        </h3>
        <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
          Selecione uma conversa no painel ao lado para ver o histórico de
          mensagens e responder aos clientes.
        </p>
      </div>
    </>
  );
}
