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
          // [DEBUG] Instrument every server-side cookie write to attribute
          // who deletes the auth-token chunks that vanish on Vercel.
          if (process.env.NODE_ENV !== "production" || process.env.AUTH_DEBUG) {
            const deletions = cookiesToSet.filter(
              (c) => c.value === "" || (c.options?.maxAge ?? 0) <= 0,
            );
            if (deletions.length || cookiesToSet.some((c) => c.name.includes("auth-token"))) {
              console.error(
                `[AUTH-DEBUG proxy.setAll] ${request.nextUrl.pathname} writes=${cookiesToSet.length} deletions=${deletions.length}`,
                deletions.map((d) => ({ name: d.name, value: d.value, maxAge: d.options?.maxAge })),
                "incoming-cookies=",
                request.cookies.getAll().filter((c) => c.name.includes("auth-token")).map((c) => c.name),
              );
            }
          }
          cookiesToSet.forEach(({ name, value, options }) => {
            // NOTE: previously we ignored `value === ""` to "avoid clearing"
            // the session. That was wrong: the @supabase/ssr GoTrue client
            // writes value:"" precisely to DELETE obsolete auth-token chunks
            // (e.g. ".1") after a refresh-token rotation shrinks the session.
            // Ignoring those deletions left stale chunks behind; on the next
            // read the SDK concatenates them, the parse fails, and the
            // client-side storage wipes the whole session. So we MUST forward
            // empty-value writes (they are intentional deletions).
            // Keep cookie attributes identical to the browser client so the
            // two writers never produce divergent chunks.
            response.cookies.set(name, value, {
              ...options,
              path: "/",
              sameSite: "lax",
              secure: true,
              httpOnly: false,
            });
          });
        },
      },
    },
  );

  // Use getSession() (NOT getUser()). getUser() is "strict": it validates
  // the access token against the Auth server and, when that token has
  // expired, the server rejects it and the auth-js client runs
  // _removeSession() — which wipes the auth cookies and 307-redirects every
  // /admin/* request once the ~1h access token lapses (this is what made
  // cookies "vanish" after a while / on F5 on Vercel). getSession() instead
  // refreshes the access token when expired (autoRefreshToken is on for the
  // server client), so a valid session survives.
  const {
    data: { session },
    error: getSessionError,
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  // [DEBUG] Log getSession outcome to correlate with cookie deletions above.
  if (process.env.NODE_ENV !== "production" || process.env.AUTH_DEBUG) {
    console.error(
      `[AUTH-DEBUG proxy.getSession] ${pathname} user=${user ? user.id.slice(0, 8) : "null"} role=${user?.app_metadata?.role ?? "-"} aal=${user?.app_metadata?.aal ?? "-"} err=${getSessionError?.message ?? "none"}`,
    );
  }

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

    // Check admin role. Prefer the JWT custom claim, but it is
    // INTERMITTENTLY absent from the post-MFA access token on Vercel
    // (same root cause as the missing `aal` claim). When the claim is
    // missing, fall back to the database (admin_users) as the source of
    // truth — otherwise every admin request 307-redirects to /portal and
    // the session appears to vanish. Only hit the DB when the claim is
    // absent, to keep the common path cheap.
    const role = user.app_metadata?.role;
    let isAdmin = role === "admin";
    if (!isAdmin) {
      const { data: adminUser } = await supabase
        .from("admin_users")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();
      isAdmin = !!adminUser;
    }
    if (!isAdmin) {
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
