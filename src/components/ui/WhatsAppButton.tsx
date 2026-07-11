"use client";

import { MessageCircle, X } from "lucide-react";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

const PHONE_NUMBER = "351920701837";
const WHATSAPP_URL = `https://wa.me/${PHONE_NUMBER}`;
const PREVIEW_MESSAGE = "Olá! Como podemos ajudar?";

export default function WhatsAppButton() {
  const pathname = usePathname();
  const [showTooltip, setShowTooltip] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Show tooltip briefly on mount, then after 5s if no interaction
  useEffect(() => {
    if (hasInteracted) return;

    const timer = setTimeout(() => {
      setShowTooltip(true);
    }, 5000);

    const hideTimer = setTimeout(() => {
      setShowTooltip(false);
    }, 12000);

    return () => {
      clearTimeout(timer);
      clearTimeout(hideTimer);
    };
  }, [hasInteracted]);

  // Don't show on admin or portal pages
  if (pathname.startsWith("/admin") || pathname.startsWith("/portal")) {
    return null;
  }

  const handleClick = () => {
    setHasInteracted(true);
    setShowTooltip(false);
    window.open(WHATSAPP_URL, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Tooltip */}
      {showTooltip && (
        <div className="relative animate-[float_3s_ease-in-out_infinite]">
          <div className="rounded-2xl bg-white px-4 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-gray-100 max-w-[220px]">
            <p className="text-sm text-dark font-medium">{PREVIEW_MESSAGE}</p>
            <div className="absolute -bottom-1.5 right-5 w-3 h-3 bg-white border-r border-b border-gray-100 rotate-45" />
          </div>
        </div>
      )}

      {/* Button */}
      <button
        onClick={handleClick}
        onMouseEnter={() => !hasInteracted && setShowTooltip(true)}
        onMouseLeave={() => !hasInteracted && setShowTooltip(false)}
        className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_4px_20px_rgba(37,211,102,0.35)] transition-all duration-300 hover:shadow-[0_8px_32px_rgba(37,211,102,0.45)] hover:scale-105 active:scale-95"
        aria-label="Falar connosco pelo WhatsApp"
      >
        <MessageCircle size={26} className="transition-transform duration-300 group-hover:scale-110" />

        {/* Ripple effect */}
        <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-20 group-hover:opacity-30" style={{ animationDuration: "3s" }} />
      </button>
    </div>
  );
}
