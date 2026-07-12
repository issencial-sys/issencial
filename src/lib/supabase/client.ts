import { createBrowserClient } from "@supabase/ssr";

// Use a single shared browser client instance. Creating a new client in every
// component (e.g. multiple admin layout mounts) makes several clients compete
// to write the chunked auth cookies (.0/.1) on mfa.verify(), producing
// inconsistent chunks that the browser fails to read after an F5 -> session lost.
let browserClient: ReturnType<typeof createBrowserClient> | undefined;

export function createClient() {
  if (browserClient) return browserClient;
  browserClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        path: "/",
        sameSite: "lax",
        secure: true,
        httpOnly: false,
      },
      // The proxy (src/proxy.ts) is the SINGLE session refresher: it runs
      // getUser() on every server request and rewrites the cookies when the
      // access token is near expiry. If the browser client also auto-refreshes
      // (default), the two refreshers race under refresh_token_rotation and the
      // session gets invalidated intermittently -> random logout / redirect
      // loop. Disabling it here makes the proxy the sole authority.
      auth: {
        autoRefreshToken: false,
      },
    },
  );
  return browserClient;
}
