"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";

export const dynamic = "force-dynamic";

import {
  LayoutDashboard,
  MessageSquare,
  Inbox,
  FileText,
  Users,
  Receipt,
  Settings,
  LogOut,
  Loader2,
  Menu,
  X,
  ChevronRight,
  Newspaper,
  Send,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

const navItems = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/pedidos", icon: Inbox, label: "Pedidos" },
  { href: "/admin/contactos", icon: MessageSquare, label: "Contactos" },
  { href: "/admin/processos", icon: FileText, label: "Processos" },
  { href: "/admin/clientes", icon: Users, label: "Clientes" },
  { href: "/admin/mensagens", icon: MessageSquare, label: "Mensagens" },
  { href: "/admin/faturas", icon: Receipt, label: "Faturas" },
  { href: "/admin/blog", icon: Newspaper, label: "Blog" },
  { href: "/admin/newsletter", icon: Send, label: "Newsletter" },
  { href: "/admin/config", icon: Settings, label: "Configuração" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [adminDisplayName, setAdminDisplayName] = useState("");
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkAdmin = async () => {
      // Preview pages are standalone — don't redirect, just stop loading
      if (pathname.endsWith("/preview")) {
        setLoading(false);
        return;
      }

      // Login pages (incl. MFA) are public — render without admin wrapper
      if (pathname === "/admin/login" || pathname.startsWith("/admin/login/")) {
        setLoading(false);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/admin/login");
        return;
      }

      setUser(user);

      // Verify admin role against the database, NOT the JWT custom claim.
      // The `role` claim in app_metadata is INTERMITTENTLY absent from the
      // post-MFA access token on Vercel (same root cause as the missing
      // `aal` claim). Trusting it here bounced every admin to /portal on
      // Vercel, which then signOut({scope:"global"}) and wiped the session.
      // admin_users is the source of truth for who is an admin.
      const { data: adminUser, error: adminErr } = await supabase
        .from("admin_users")
        .select("display_name")
        .eq("user_id", user.id)
        .maybeSingle();

      if (adminErr) {
        // DB error (transient / network race) — do NOT bounce to /portal,
        // which the proxy would then treat as an admin hitting the portal and
        // clear the cookies (destroying the session). Retry instead.
        setTimeout(() => checkAdmin(), 1000);
        return;
      }
      if (!adminUser) {
        // Confirmed non-admin → portal is fine (proxy only clears cookies for
        // role === "admin", so a real non-admin is unaffected).
        router.push("/portal");
        return;
      }

      if (adminUser.display_name) {
        setAdminDisplayName(adminUser.display_name);
      }

      // Enforce MFA (AAL2). An admin with a verified TOTP factor must
      // complete the second factor before accessing the dashboard. A
      // session that only reached AAL1 (signed in with password, MFA
      // pending) must be sent to the MFA challenge, not the dashboard —
      // otherwise the second factor could be bypassed entirely.
      const { data: aal } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const hasVerifiedTotp = factors?.totp?.some(
        (f) => f.status === "verified",
      );

      // The `aal` claim is not reliably present in the post-MFA access token
      // on Vercel (getAuthenticatorAssuranceLevel returns currentLevel:
      // undefined there, while it works on localhost). Do NOT treat a
      // missing claim as "MFA pending" — that caused an infinite redirect
      // loop right after a successful mfa.verify(). If the claim is missing
      // but a verified TOTP factor exists, the second factor was already
      // satisfied, so admit the session instead of bouncing to /mfa.
      const currentLevel = aal?.currentLevel;
      const mfaPending =
        hasVerifiedTotp &&
        currentLevel !== undefined &&
        currentLevel !== "aal2";
      if (mfaPending) {
        router.push("/admin/login/mfa");
        return;
      }

      setIsAdmin(true);
      setLoading(false);
    };

    checkAdmin();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      // Only react to sign-out. Do NOT re-check AAL2 or re-emit the auth
      // cookie here: that races the proxy's server-side refresh (which is
      // the single writer under refresh_token_rotation_enabled) and causes
      // GoTrue to revoke the session (cookie wipe -> forced re-login).
      // AAL2 enforcement runs once at mount in checkAdmin().
      if (!session?.user) {
        setUser(null);
        setIsAdmin(false);
        if (pathname !== "/admin/login") {
          router.push("/admin/login");
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [pathname]);

  const handleLogout = async () => {
    // scope: 'global' revoga refresh token no servidor
    await supabase.auth.signOut({ scope: "global" });
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-accent" />
      </div>
    );
  }

  // Preview pages are standalone — render without admin wrapper
  if (pathname.endsWith("/preview")) {
    return <>{children}</>;
  }

  // Login pages (incl. MFA) are public — render without admin wrapper
  if (pathname === "/admin/login" || pathname.startsWith("/admin/login/")) {
    return <>{children}</>;
  }

  if (!isAdmin) {
    return null;
  }

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  const userInitial = (user?.email || "A").charAt(0).toUpperCase();

  const sidebar = (
    <>
      {/* Logo Issencial */}
      <div className="mb-6 pb-6 border-b border-white/10">
        <Link href="/admin">
          <Image
            src="/logo/principal_branco.png"
            alt="Issencial"
            width={130}
            height={32}
            className="object-contain h-6 w-auto"
            priority
          />
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileSidebar(false)}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all ${
                active
                  ? "bg-accent/15 text-accent shadow-sm"
                  : "text-white/60 hover:bg-white/10 hover:text-white"
              }`}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
              {active && (
                <ChevronRight size={14} className="ml-auto text-accent" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User info & logout */}
      <div className="pt-6 border-t border-white/10 mt-auto">
        <div className="flex items-center gap-3 px-4 py-3 mb-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 text-accent text-xs font-bold">
            {userInitial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white font-medium truncate">{adminDisplayName || "Admin"}</p>
            <p className="text-xs text-white/40 truncate">{user?.email}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href="/portal"
            className="flex-1 text-center rounded-lg px-3 py-2 text-xs text-white/40 hover:text-white/70 hover:bg-white/5 transition-all"
          >
            Ver Portal
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs text-white/40 hover:text-white/70 hover:bg-white/5 transition-all"
          >
            <LogOut size={16} />
            Sair
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop sidebar — fixa sem scroll da página */}
      <aside className="hidden lg:flex w-[260px] flex-shrink-0 flex-col bg-gray-900 p-6 fixed left-0 top-0 h-screen overflow-y-auto">
        {sidebar}
      </aside>
      <div className="hidden lg:block w-[260px] flex-shrink-0" /> {/* spacer */}

      {/* Mobile sidebar overlay */}
      {mobileSidebar && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setMobileSidebar(false)}
        />
      )}

      {/* Mobile sidebar drawer */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-[280px] bg-gray-900 p-6 flex flex-col transition-transform duration-300 ease-out lg:hidden ${
          mobileSidebar ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          onClick={() => setMobileSidebar(false)}
          className="self-end mb-4 text-white/60 hover:text-white"
        >
          <X size={24} />
        </button>
        {sidebar}
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between bg-white border-b border-gray-200 px-4 py-3">
          <button
            onClick={() => setMobileSidebar(true)}
            className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <Menu size={22} />
          </button>
          <Link href="/admin" className="flex items-center">
            <Image
              src="/logo/principal_branco.png"
              alt="Issencial"
              width={100}
              height={24}
              className="object-contain h-5 w-auto brightness-0 invert"
            />
          </Link>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-gray-900 text-xs font-bold">
            {userInitial}
          </div>
        </header>

        {/* Page content */}
        <main
          className={`flex-1 overflow-hidden ${
            pathname === "/admin/mensagens" || pathname.startsWith("/admin/mensagens/")
              ? "flex flex-col h-screen"
              : "p-4 sm:p-6 lg:p-8 overflow-auto"
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
