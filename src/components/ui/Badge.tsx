import { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  variant?: "default" | "dark" | "accent";
  className?: string;
}

const variants = {
  default: "bg-accent/15 text-accent border-accent/30",
  dark: "bg-primary/10 text-accent border-primary/20",
  accent: "bg-accent/20 text-accent border-accent/40",
};

export default function Badge({ children, variant = "default", className = "" }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
