import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const cookieStore = await cookies();
  const sbCookies = cookieStore
    .getAll()
    .filter((c) => c.name.startsWith("sb-lyqmsluktqdeytpouyvh-auth-token"))
    .map((c) => ({ name: c.name, len: c.value.length }));

  const envUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").slice(0, 30);
  const envAnon = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").slice(0, 20);

  let userResult: unknown = null;
  let userError: unknown = null;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    userResult = data.user
      ? { id: data.user.id, role: data.user.app_metadata?.role, aal: data.user.app_metadata?.aal }
      : null;
    userError = error ? { message: error.message, status: error.status } : null;
  } catch (e) {
    userError = String(e);
  }

  return NextResponse.json({
    env: { url: envUrl, anonPrefix: envAnon, anonLen: (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").length },
    receivedSbCookies: sbCookies,
    user: userResult,
    userError,
    now: Date.now(),
  });
}
