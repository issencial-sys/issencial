"use client";

import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { PortalMessagesProvider } from "@/components/messages/PortalMessagesProvider";
import ConversationList from "@/components/messages/ConversationList";

export default function MensagensLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Extract the active conversation id from the URL, if any
  const convId =
    pathname.startsWith("/portal/mensagens/") &&
    pathname !== "/portal/mensagens"
      ? pathname.split("/").pop()
      : undefined;

  return (
    <PortalMessagesProvider>
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left panel: Conversation list — always visible on desktop */}
        <div className="hidden lg:flex w-80 shrink-0 border-r border-gray-200 bg-white flex-col h-full">
          <ConversationList activeConvId={convId} />
        </div>

        {/* Right panel: active conversation view or placeholder */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="flex-1 flex flex-col min-h-0"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </PortalMessagesProvider>
  );
}
