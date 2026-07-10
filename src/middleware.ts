import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware que corre em cada request:
 * 1. Verifica validade da sessão em rotas protegidas (/admin, /portal)
 * 2. Redireciona para login se sessão expirou
 * 3. Protege rotas de admin contra acessos não-admin
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that don't need session check
  const publicRoutes = [
    "/admin/login",
    "/login",
    "/_next",
    "/api",
    "/favicon",
    "/logo",
    "/assets",
    "/fonts",
    "/images",
  ];

  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));
  const isProtectedRoute = pathname.startsWith("/admin") || pathname.startsWith("/portal");

  // Skip middleware for public routes and non-protected routes
  if (isPublicRoute || !isProtectedRoute) {
    return NextResponse.next();
  }

  // Check for preview routes — render without auth redirect
  if (pathname.endsWith("/preview")) {
    return NextResponse.next();
  }

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
            request.cookies.set(name, value);
          });
        },
      },
    },
  );

  // Verify session with server (not just local cookie)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Session expired or invalid — redirect to login
    const loginUrl = new URL(
      pathname.startsWith("/admin") ? "/admin/login" : "/login",
      request.url,
    );
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin route check — verify admin role server-side
  if (pathname.startsWith("/admin")) {
    const role = user.app_metadata?.role;
    if (role !== "admin") {
      // Not an admin — redirect to portal
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Apply to all routes except static files
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
