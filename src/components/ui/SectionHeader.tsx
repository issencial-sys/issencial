import { ReactNode } from "react";
import Badge from "./Badge";

interface SectionHeaderProps {
  badge: string;
  title: ReactNode;
  description?: string;
  align?: "center" | "left";
  light?: boolean;
}

export default function SectionHeader({ badge, title, description, align = "center", light = false }: SectionHeaderProps) {
  return (
    <div className={`${align === "center" ? "text-center mx-auto" : ""} max-w-2xl ${align === "center" ? "mb-12" : "mb-8"}`}>
      <Badge>{badge}</Badge>
      <h2 className={`mt-4 text-3xl font-bold md:text-4xl ${light ? "text-white" : "text-dark"}`}>{title}</h2>
      {description && (
        <p className={`mt-4 text-lg leading-relaxed ${light ? "text-white/70" : "text-gray-500"}`}>{description}</p>
      )}
    </div>
  );
}
