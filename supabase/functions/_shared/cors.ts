/**
 * CORS headers for Supabase Edge Functions.
 * Allows the function to be invoked from the web app.
 */
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

/**
 * Handle CORS preflight (OPTIONS) requests.
 * Returns a Response with 204 No Content if it's an OPTIONS request,
 * or null otherwise.
 */
export function handleCors(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 204,
      headers: corsHeaders,
    });
  }
  return null;
}

/**
 * Wrap a response with CORS headers.
 */
export function withCors(response: Response): Response {
  for (const [key, value] of Object.entries(corsHeaders)) {
    response.headers.set(key, value);
  }
  return response;
}

/**
 * Create a JSON response with CORS headers.
 */
export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}
