"use client";

import { use } from "react";
import ConversationView from "@/components/messages/ConversationView";

export default function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <ConversationView
      convId={id}
      showBackButton={true}
    />
  );
}
