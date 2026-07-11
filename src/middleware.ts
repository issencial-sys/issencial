import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Routes that don't need auth checking — skip getUser() entirely
const PUBLIC_ROUTES = new Set([
  "/",
  "/login",
  "/login/mfa",
  "/admin/login",
  "/admin/login/mfa",
  "/sobre",
  "/servicos",
  "/contacto",
  "/faq",
  "/termos-privacidade",
]);

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip auth check for public routes (avoids hanging getUser() call)
  if (PUBLIC_ROUTES.has(pathname) || pathname === "") {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect root /portal to /login if not authenticated
  if (pathname === "/portal" && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Admin users trying to access /portal — sign them out by clearing cookies
  if (pathname === "/portal" && user?.app_metadata?.role === "admin") {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    const redirectResponse = NextResponse.redirect(url);

    // Clear Supabase auth cookies on the actual response we're returning
    request.cookies.getAll()
      .filter((c) => c.name.startsWith("sb-"))
      .forEach((c) => redirectResponse.cookies.set(c.name, "", { maxAge: 0, path: "/" }));

    return redirectResponse;
  }

  // Protected portal sub-routes -> redirect to /login if not authenticated
  if (pathname.startsWith("/portal/")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }

    // Admin users should not access portal — sign them out by clearing cookies
    if (user.app_metadata?.role === "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      const redirectResponse = NextResponse.redirect(url);

      // Clear Supabase auth cookies on the actual response we're returning
      request.cookies.getAll()
        .filter((c) => c.name.startsWith("sb-"))
        .forEach((c) => redirectResponse.cookies.set(c.name, "", { maxAge: 0, path: "/" }));

      return redirectResponse;
    }
  }

  // Admin routes (excluding /admin/login which is in PUBLIC_ROUTES)
  if (pathname.startsWith("/admin")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }

    // Check admin role via JWT custom claim
    const role = user.app_metadata?.role;
    if (role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/portal";
      return NextResponse.redirect(url);
    }

    // Enforce MFA (AAL2) on the server. With "Limit duration of AAL1
    // sessions" ON at the Supabase level, an admin who only reached AAL1
    // (password entered, TOTP pending) must be sent to the challenge —
    // otherwise the second factor can be bypassed. Server-side enforcement
    // also fixes the client-only session loss loop, since the request is
    // redirected before the admin shell ever renders.
    if (pathname !== "/admin/login/mfa") {
      const { data: aal } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const hasVerifiedTotp = factors?.totp?.some(
        (f) => f.status === "verified",
      );
      if (hasVerifiedTotp && (aal?.currentLevel ?? "aal1") !== "aal2") {
        const url = request.nextUrl.clone();
        url.pathname = "/admin/login/mfa";
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
