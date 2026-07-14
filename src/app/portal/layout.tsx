"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";

export const dynamic = "force-dynamic";
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  Receipt,
  User,
  LogOut,
  Loader2,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface NavItem {
  href: string;
  icon: any;
  label: string;
  badgeKey?: "messages" | "invoices";
}

const navItems: NavItem[] = [
  { href: "/portal", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/portal/processos", icon: FileText, label: "Processos" },
  { href: "/portal/mensagens", icon: MessageSquare, label: "Mensagens", badgeKey: "messages" },
  { href: "/portal/faturas", icon: Receipt, label: "Faturas", badgeKey: "invoices" },
  { href: "/portal/perfil", icon: User, label: "Perfil" },
];

const LOGO_PNG = "/logo/principal_branco.png";
const LOGO_WEBP = "/logo/principal_branco.webp";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [badges, setBadges] = useState({ messages: 0, invoices: 0 });
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.push("/login");
        return;
      }

      // Admin users should not access the client portal — sign them out globally
      if (user.app_metadata?.role === "admin") {
        await supabase.auth.signOut({ scope: "global" });
        router.push("/admin/login");
        return;
      }

      // Enforce MFA (AAL2). If a client has a verified TOTP factor but
      // hasn't completed the second factor this session, redirect to the
      // MFA challenge — otherwise the second factor could be bypassed.
      const { data: aal } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const hasVerifiedTotp = factors?.totp?.some(
        (f) => f.status === "verified",
      );
      if (hasVerifiedTotp && (aal?.currentLevel ?? "aal1") !== "aal2") {
        router.push("/login/mfa");
        return;
      }

      setUser(user);

      // Fetch profile (name for badge, avatar_url)
      const { data: profile } = await supabase
        .from("profiles")
        .select("name, avatar_url")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.avatar_url) {
        setAvatarUrl(profile.avatar_url);
      }

      await fetchBadges(user.id);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      // Only react to sign-out. Do NOT re-check AAL2 or call signOut here:
      // this races the proxy's single server-side cookie writer under
      // refresh_token_rotation_enabled and can revoke the whole session.
      // Role mismatch is handled at mount in the initial getUser() check.
      if (!session?.user) {
        setUser(null);
        router.push("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [pathname]);

  const fetchBadges = async (userId: string) => {
    const [unreadRes, pendingRes] = await Promise.all([
      supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("client_id", userId)
        .eq("read", false)
        .neq("sender_id", userId)
        .is("process_id", null),
      supabase
        .from("invoices")
        .select("*", { count: "exact", head: true })
        .eq("client_id", userId)
        .in("status", ["pending", "overdue"]),
    ]);

    setBadges({
      messages: unreadRes.count ?? 0,
      invoices: pendingRes.count ?? 0,
    });
  };

  const handleLogout = async () => {
    // scope: 'global' revokes all refresh tokens server-side
    await supabase.auth.signOut({ scope: "global" });
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-light flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  const isActive = (href: string) => {
    if (href === "/portal") return pathname === "/portal";
    return pathname.startsWith(href);
  };

  const userInitial = (user?.user_metadata?.name || user?.email || "U")
    .charAt(0)
    .toUpperCase();

  const sidebar = (
    <>
      {/* Logo Issencial */}
      <div className="mb-8 pb-6 border-b border-white/10">
        <Link href="/portal">
          <Image
            src={LOGO_PNG}
            alt="Issencial"
            width={140}
            height={35}
            className="object-contain h-7 w-auto"
            priority
          />
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const badgeCount = item.badgeKey ? badges[item.badgeKey] : 0;
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
              <item.icon size={20} />
              <span>{item.label}</span>
              {badgeCount > 0 && (
                <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-bold text-primary">
                  {badgeCount > 9 ? "9+" : badgeCount}
                </span>
              )}
              {active && badgeCount === 0 && (
                <ChevronRight size={14} className="ml-auto text-accent" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User info & logout */}
      <div className="pt-6 border-t border-white/10 mt-auto">
        <div className="flex items-center gap-3 px-4 py-3 mb-2">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt="Avatar"
              width={32}
              height={32}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 text-accent text-xs font-bold">
              {userInitial}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white font-medium truncate">
              {user?.user_metadata?.name || "Cliente"}
            </p>
            <p className="text-xs text-white/40 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm text-white/40 hover:text-white/70 hover:bg-white/5 transition-all"
        >
          <LogOut size={18} />
          Sair
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-light flex">
      {/* Desktop sidebar — fixa sem scroll da página */}
      <aside className="hidden lg:flex w-[260px] flex-shrink-0 flex-col bg-primary p-6 fixed left-0 top-0 h-screen overflow-y-auto">
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
        className={`fixed top-0 left-0 z-50 h-full w-[280px] bg-primary p-6 flex flex-col transition-transform duration-300 ease-out lg:hidden ${
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
      <div className="flex-1 flex flex-col h-dvh overflow-hidden">
        {/* Mobile header — sempre visível/fixo (shrink-0) */}
        <header className="lg:hidden shrink-0 z-30 flex items-center justify-between bg-white border-b border-gray-100 px-4 py-3">
          <button
            onClick={() => setMobileSidebar(true)}
            className="p-2 text-primary hover:bg-gray-100 rounded-lg"
          >
            <Menu size={22} />
          </button>
          <Link href="/portal" className="flex items-center">
            <Image
              src="/logo/principal_azul.png"
              alt="Issencial"
              width={110}
              height={26}
              className="object-contain h-5 w-auto"
            />
          </Link>
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt="Avatar"
              width={32}
              height={32}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-primary text-xs font-bold">
              {userInitial}
            </div>
          )}
        </header>

        {/* Page content — só o conteúdo faz scroll; o header fica fixo */}
        <main
          className={`flex-1 min-h-0 overflow-y-auto ${
            pathname === "/portal/mensagens" ||
            pathname.startsWith("/portal/mensagens/")
              ? "flex flex-col"
              : "p-4 sm:p-6 lg:p-8"
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
