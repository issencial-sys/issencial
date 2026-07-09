"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
  baseHref?: string;
}

export default function Breadcrumbs({
  items,
  className = "",
  baseHref,
}: BreadcrumbsProps) {
  const homeHref = baseHref || "/portal";

  return (
    <nav
      className={`flex items-center gap-1.5 text-xs ${className}`}
      aria-label="Breadcrumb"
    >
      <Link
        href={homeHref}
        className="text-gray-400 hover:text-primary transition-colors flex items-center gap-1.5"
      >
        <Home size={14} />
        <span className="hidden sm:inline">Início</span>
      </Link>
      <ChevronRight size={12} className="text-gray-300" />
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <div key={i} className="flex items-center gap-1.5">
            {isLast ? (
              <span className="text-gray-700 font-medium truncate max-w-[200px] text-xs">
                {item.label}
              </span>
            ) : item.href ? (
              <Link
                href={item.href}
                className="text-gray-400 hover:text-primary transition-colors truncate max-w-[150px] text-xs"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-gray-400 truncate max-w-[150px] text-xs">
                {item.label}
              </span>
            )}
            {!isLast && (
              <ChevronRight size={12} className="text-gray-300 shrink-0" />
            )}
          </div>
        );
      })}
    </nav>
  );
}
