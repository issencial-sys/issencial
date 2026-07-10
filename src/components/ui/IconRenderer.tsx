"use client";

import { Heart, Target, type LucideIcon } from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  heart: Heart,
  target: Target,
};

interface IconRendererProps {
  name: string;
  size?: number;
  className?: string;
  strokeWidth?: number;
}

export default function IconRenderer({
  name,
  size = 24,
  className,
  strokeWidth,
}: IconRendererProps) {
  const Icon = ICONS[name];
  if (!Icon) return null;
  return <Icon size={size} className={className} strokeWidth={strokeWidth} />;
}
