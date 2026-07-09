"use client";

import { motion } from "framer-motion";
import { type ReactNode } from "react";

interface FadeInProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "span" | "h1" | "h2" | "h3" | "p";
}

export default function FadeIn({
  children,
  delay = 0,
  className,
  as = "div",
}: FadeInProps) {
  const MotionComponent = motion[as as keyof typeof motion] as React.ElementType;

  return (
    <MotionComponent
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </MotionComponent>
  );
}
