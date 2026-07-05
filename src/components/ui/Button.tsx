import Link from "next/link";
import { ReactNode } from "react";

interface ButtonProps {
  children: ReactNode;
  variant?: "primary" | "secondary" | "outline" | "outline-light" | "ghost" | "ghost-accent";
  size?: "sm" | "md" | "lg" | "xl";
  href?: string;
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
}

const variants = {
  primary: "bg-accent text-primary border-accent hover:bg-accent-light hover:border-accent-light hover:shadow-accent hover:-translate-y-0.5",
  secondary: "bg-primary text-white border-primary hover:bg-primary-light hover:border-primary-light hover:shadow-lg hover:-translate-y-0.5",
  outline: "bg-transparent text-primary border-primary hover:bg-primary hover:text-white hover:-translate-y-0.5",
  "outline-light": "bg-transparent text-white border-white/30 hover:bg-white hover:text-primary hover:-translate-y-0.5",
  ghost: "bg-transparent text-primary border-transparent hover:bg-primary/5",
  "ghost-accent": "bg-transparent text-accent border-transparent hover:bg-accent/10",
};

const sizes = {
  sm: "px-4 py-2 text-xs",
  md: "px-6 py-3 text-sm",
  lg: "px-8 py-4 text-base",
  xl: "px-10 py-5 text-md",
};

export default function Button({ children, variant = "primary", size = "md", href, className = "", onClick, type = "button" }: ButtonProps) {
  const base = "inline-flex items-center justify-center gap-2 rounded-lg font-semibold uppercase tracking-wider border-2 transition-all duration-200 cursor-pointer whitespace-nowrap active:scale-[0.98]";
  const classes = `${base} ${variants[variant]} ${sizes[size]} ${className}`;

  if (href) {
    return <Link href={href} className={classes}>{children}</Link>;
  }
  return <button type={type} onClick={onClick} className={classes}>{children}</button>;
}
