"use client";

import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import AdminConversationList from "@/components/messages/AdminConversationList";

export default function AdminMensagensLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex-1 flex min-h-0 overflow-hidden">
      {/* Left panel: Conversation list — always visible on desktop */}
      <div className="hidden lg:flex w-80 shrink-0 border-r border-gray-200 bg-white flex-col h-full">
        <AdminConversationList />
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
  );
}
