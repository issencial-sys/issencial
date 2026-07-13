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

  // Validate the session LOCALLY via getClaims() (asymmetric ES256 + cached
  // JWKS, zero network). See docs/auth-session-investigation.md §6 for the
  // full bug history. We must NOT use getUser() (strict → wipes cookies on
  // 1h expiry, bug "3f") nor getSession() unconditionally (refreshes →
  // parallel token_revoked cascade under rotation, bug "3g").
  //
  // Strategy: read the access_token straight from the auth-token cookie and
  // verify its signature locally. Only when there is no token (first visit)
  // or the token is expired/invalid do we fall back to getSession() (a real
  // refresh). Because verification is local, the ~24 parallel /admin/*
  // requests make ~0 network calls in the common case.
  let user:
    | { id: string; app_metadata: Record<string, unknown>; email?: string }
    | null = null;

  // Extract access_token from the chunked sb-*-auth-token cookie (JSON body).
  const authCookieName = request.cookies
    .getAll()
    .find((c) => c.name.endsWith("-auth-token") || c.name.endsWith("-auth-token.0"))?.name;
  let accessToken: string | undefined;
  if (authCookieName) {
    try {
      const raw = request.cookies.get(authCookieName)?.value ?? "";
      const json = JSON.parse(raw.startsWith("base64-") ? atob(raw.slice(7)) : raw);
      accessToken = json.access_token;
    } catch {
      accessToken = undefined;
    }
  }

  let claimsError: string | null = null;
  if (accessToken) {
    const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(accessToken);
    if (claimsData?.claims) {
      const claims = claimsData.claims as Record<string, unknown>;
      user = {
        id: String(claims.sub),
        app_metadata: (claims.app_metadata as Record<string, unknown>) ?? {},
        email: claims.email as string | undefined,
      };
    } else {
      // Locally-verified token is expired/invalid. We do NOT call
      // getSession() here: under refresh_token_rotation_enabled, the ~24
      // parallel /admin/* requests would each race to refresh with the same
      // refresh token and wipe the session (token_revoked cascade, bug "3g").
      // The browser singleton (client.ts, autoRefreshToken:true) is the sole
      // refresher and refreshes PROACTIVELY before expiry, so in the common
      // path the token is still valid when the proxy validates. If it isn't,
      // we treat the request as unauthenticated and let the browser refresh
      // + reload — never refreshing from the server.
      claimsError = claimsErr?.message ?? "no-claims";
    }
  }

  // [DEBUG] Log outcome to correlate with cookie deletions above.
  if (process.env.NODE_ENV !== "production" || process.env.AUTH_DEBUG) {
    console.error(
      `[AUTH-DEBUG proxy.auth] ${pathname} user=${user ? user.id.slice(0, 8) : "null"} role=${user?.app_metadata?.role ?? "-"} aal=${user?.app_metadata?.aal ?? "-"} claimsErr=${claimsError ?? "none"}`,
    );
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
      // Redirect to /admin/login — NOT /portal. The /portal route runs
      // signOut({scope:"global"}) and clears the auth cookies, which made
      // the session appear to "vanish" whenever the proxy briefly failed
      // to confirm admin status (e.g. an intermittently expired access
      // token). Sending the user to /admin/login keeps the cookies intact
      // so they can re-authenticate instead of being force-logged-out.
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
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
