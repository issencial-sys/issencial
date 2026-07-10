"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";

const navLinks = [
  { href: "/", label: "Início" },
  { href: "/servicos", label: "Serviços" },
  { href: "/blog", label: "Blog" },
  { href: "/sobre", label: "Sobre Nós" },
  { href: "/contacto", label: "Contacto" },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  // Fechar drawer ao clicar fora
  useEffect(() => {
    if (!mobileOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        drawerRef.current &&
        !drawerRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setMobileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mobileOpen]);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-b border-neutral-light transition-all duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <div className="flex h-[72px] items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center shrink-0">
            <Image
              src="/logo/Ativo 7.webp"
              alt="Issencial"
              width={160}
              height={40}
              className="object-contain h-8 sm:h-9 md:h-10 w-auto"
              priority
            />
          </Link>

          {/* Desktop Links */}
          <div className="hidden items-center gap-1 lg:flex">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-3 py-2 text-sm font-medium transition-colors rounded-lg ${
                    active
                      ? "text-primary bg-primary/[0.06]"
                      : "text-gray-600 hover:text-primary hover:bg-gray-100/60"
                  }`}
                >
                  {link.label}
                  {active && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-accent rounded-full" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* CTA + Mobile Toggle */}
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="hidden rounded-lg bg-accent px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-primary transition-all hover:bg-accent-light hover:-translate-y-0.5 hover:shadow-accent lg:inline-flex"
            >
              Portal do Cliente
            </Link>
            <button
              ref={buttonRef}
              onClick={() => setMobileOpen(!mobileOpen)}
              className="flex h-11 w-11 items-center justify-center rounded-full text-primary lg:hidden"
              aria-label="Menu"
            >
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 top-[72px] z-40 bg-black/20 transition-opacity duration-500 ease-out lg:hidden ${
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      {/* Mobile Drawer — slide da direita */}
      <div
        ref={drawerRef}
        className={`fixed top-[72px] right-0 z-50 h-[calc(100vh-72px)] w-80 max-w-[85vw] bg-white shadow-2xl border-l border-neutral-light transition-all duration-[800ms] ease-out lg:hidden ${
          mobileOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col gap-1 p-6">
          {navLinks.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`relative rounded-lg px-4 py-3 text-lg font-medium transition-colors ${
                  active
                    ? "text-primary bg-primary/[0.06]"
                    : "text-gray-800 hover:text-primary hover:bg-primary/[0.03]"
                }`}
              >
                {link.label}
                {active && (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 w-1 h-6 bg-accent rounded-full" />
                )}
              </Link>
            );
          })}
          <Link
            href="/login"
            onClick={() => setMobileOpen(false)}
            className="mt-4 rounded-lg bg-accent px-4 py-3 text-center text-sm font-semibold text-primary"
          >
            Portal do Cliente
          </Link>
        </div>
      </div>
    </nav>
  );
}
