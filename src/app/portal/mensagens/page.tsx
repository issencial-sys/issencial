"use client";

import { MessageSquare } from "lucide-react";
import ConversationList from "@/components/messages/ConversationList";

export default function MensagensPage() {
  return (
    <>
      {/* Mobile: full-screen conversation list (matches current behavior) */}
      <div className="lg:hidden flex w-full h-full">
        <ConversationList />
      </div>

      {/* Desktop: empty state placeholder when no conversation is selected */}
      <div className="hidden lg:flex flex-1 flex-col items-center justify-center bg-gray-50 text-center p-8">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-200 mb-5">
          <MessageSquare size={36} className="text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-dark mb-1.5">
          As suas conversas
        </h3>
        <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
          Selecione uma conversa para começar a trocar mensagens com a equipa
          Issencial.
        </p>
      </div>
    </>
  );
}
