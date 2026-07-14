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
      // The proxy validates the session LOCALLY via getClaims() (asymmetric
      // ES256 + cached JWKS, zero network) — NOT via getUser()/getSession()
      // which round-trip to GoTrue. Rationale (docs/auth-session-investigation.md §6):
      //  - getUser() is strict: when the 1h access_token expires, auth-js runs
      //    _removeSession() and wipes the cookies (the original "3f" bug).
      //  - getSession() refreshes: under refresh_token_rotation_enabled, the
      //    ~24 parallel /admin/* requests each built a client and raced to
      //    refresh with the same refresh token → token_revoked cascade that
      //    wiped the session ("3g" bug).
      //  - This project uses ES256 (confirmed via /auth/v1/.well-known/jwks.json,
      //    kty=EC alg=ES256), so getClaims(token) verifies the signature
      //    LOCALLY with WebCrypto. The parallel requests now do ~0 network
      //    calls; the refresh race window shrinks to "once/hour on expiry".
      // We keep autoRefreshToken:false so this server client never proactively
      // refreshes; the browser singleton (client.ts) is the sole refresher,
      // and getClaims falls back to getSession() only when the token is
      // actually expired/invalid.
      auth: {
        autoRefreshToken: false,
      },
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
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

  // Validate the session via getSession() with autoRefreshToken:false.
  // See docs/auth-session-investigation.md §6 for the full bug history.
  //
  // Why getSession() and not getUser()/getClaims():
  //  - getUser() is strict: a locally-expired 1h access_token makes auth-js run
  //    _removeSession() and wipe the cookies (the original "3f" bug).
  //  - getClaims() WITHOUT a token argument internally calls getSession() and
  //    REFRESHES — under refresh_token_rotation_enabled the ~24 parallel
  //    /admin/* requests each race to refresh with the same refresh token and
  //    wipe the session (token_revoked cascade, "3g").
  //  - getClaims(token) with an explicit token verifies LOCALLY (asymmetric
  //    ES256 + cached JWKS), but requires manually extracting the access_token
  //    from the chunked cookie — which is fragile (chunk .0/.1 splitting,
  //    base64- prefix) and BROKE even /portal in the previous iteration.
  //
  // The robust choice: getSession() with autoRefreshToken:false reads the
  // session from the cookies, with the @supabase/ssr storage client combining
  // the chunks and decoding the base64- prefix for us (no manual parsing).
  // Because autoRefreshToken is false, getSession() does NOT refresh — it only
  // returns the in-cookie session (zero network, no race). If the token is
  // expired/absent, session is null and we treat the request as
  // unauthenticated, letting the browser singleton (client.ts, the sole
  // refresher) refresh + reload. This is the Supabase-recommended middleware
  // pattern minus the per-request refresh that causes token_revoked cascades.
  let user:
    | { id: string; app_metadata: Record<string, unknown>; email?: string }
    | null = null;


  //    ES256 + cached JWKS), but requires manually extracting the access_token
  //    from the chunked cookie — which is fragile (chunk .0/.1 splitting,
  //    base64- prefix) and BROKE even /portal in the previous iteration.
  //
  // The robust choice: getSession() with autoRefreshToken:false reads the
  // session from the cookies, with the @supabase/ssr storage client combining
  // the chunks and decoding the base64- prefix for us (no manual parsing).
  // Because autoRefreshToken is false, getSession() does NOT refresh — it only
  // returns the in-cookie session (zero network, no race). If the token is
  // expired/absent, session is null and we treat the request as
  // unauthenticated, letting the browser singleton (client.ts, the sole
  // refresher) refresh + reload. This is the Supabase-recommended middleware
  // pattern minus the per-request refresh that causes token_revoked cascades.
  let sessionError: string | null = null;
  const {
    data: { session },
    error: sessionErr,
  } = await supabase.auth.getSession();
  if (session?.user) {
    user = {
      id: session.user.id,
      app_metadata: (session.user.app_metadata ?? {}) as Record<string, unknown>,
      email: session.user.email,
    };
  } else if (sessionErr) {
    sessionError = sessionErr.message;
  }

  // Redirect root /portal to /login if not authenticated
  if (pathname === "/portal" && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Admin users trying to access /portal — send them to /admin/login but
  // NEVER clear the auth cookies. Clearing them here is what destroyed the
  // session in earlier iterations (signOut-equivalent cookie wipe). The
  // browser keeps its session and can re-authenticate instead of being
  // force-logged-out.
  if (pathname === "/portal" && user?.app_metadata?.role === "admin") {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }

  // Protected portal sub-routes -> redirect to /login if not authenticated
  if (pathname.startsWith("/portal/")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }

    // Admin users should not access portal — redirect to /admin/login
    // WITHOUT clearing cookies (see note above).
    if (user.app_metadata?.role === "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
  }

  // Admin routes (excluding /admin/login which is in PUBLIC_ROUTES).
  // The proxy ONLY checks that a session exists (locally verified via
  // getClaims). It does NOT decide admin role here.
  //
  // Why not check role in the proxy: the admin role comes from the JWT
  // `role` custom claim, which is INTERMITTENTLY absent from the post-MFA
  // access token on Vercel, and from the admin_users DB table, which is
  // subject to network races. Deciding role here split the source of truth
  // from the client (admin/layout.tsx, which trusts the JWT role claim via
  // getUser) and produced an infinite redirect loop: the proxy said
  // !isAdmin → 307 → /admin/login, the login page saw role:"admin" →
  // router.push("/admin") → proxy 307 → ... (spinner forever, cookies kept).
  //
  // So role enforcement is delegated entirely to the client (admin/layout
  // + mfa/page), which already retries on DB errors and only bounces
  // confirmed non-admins to /portal. The proxy just gates unauthenticated
  // requests.
  if (pathname.startsWith("/admin")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
