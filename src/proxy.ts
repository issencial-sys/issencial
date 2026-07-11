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

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip auth check for public routes (avoids hanging getUser() call)
  if (PUBLIC_ROUTES.has(pathname) || pathname === "") {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            // Never let the proxy itself clear the session cookie. A value
            // of "" means "clear" (logout / failed refresh) — if we wrote
            // that, the browser would wipe the session right after a
            // successful 2FA login. Only propagate non-empty updates so the
            // client-side signOut remains the single source of truth.
            if (value === "") return;
            response.cookies.set(name, value, options);
          });
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
    request.cookies
      .getAll()
      .filter((c) => c.name.startsWith("sb-"))
      .forEach((c) =>
        redirectResponse.cookies.set(c.name, "", { maxAge: 0, path: "/" }),
      );
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
      request.cookies
        .getAll()
        .filter((c) => c.name.startsWith("sb-"))
        .forEach((c) =>
          redirectResponse.cookies.set(c.name, "", { maxAge: 0, path: "/" }),
        );
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

    // NOTE: MFA / AAL2 enforcement is handled client-side in
    // admin/layout.tsx (which reads the real browser session). Doing it
    // here with getAuthenticatorAssuranceLevel() forced a server-side
    // session refresh on every request that re-emitted the auth cookie with
    // a short/expired lifetime (worsened by "Limit AAL1" = 15 min) and
    // wiped the session right after login. Keeping this proxy to session +
    // role only stops the cookie from being destroyed server-side.
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
