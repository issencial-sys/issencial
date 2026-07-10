import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { formRateLimiter, getClientIp } from "@/lib/rate-limiter";

const quoteSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100, "Nome muito longo"),
  email: z.string().email("Email inválido"),
  phone: z.string().max(20, "Telemóvel muito longo").optional().default(""),
  service_slug: z.string().min(1, "Selecione um serviço"),
  description: z.string().min(10, "Descrição deve ter pelo menos 10 caracteres").max(5000, "Descrição muito longa"),
});

export async function POST(request: Request) {
  try {
    // Rate limiting by IP
    const ip = getClientIp(request);
    const limiter = await formRateLimiter;
    const rateCheck = await limiter.check(ip);

    const responseHeaders: Record<string, string> = {
      "X-RateLimit-Limit": "5",
      "X-RateLimit-Remaining": String(rateCheck.remaining),
      "X-RateLimit-Reset": String(Math.ceil(rateCheck.resetMs / 1000)),
    };

    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Muitos pedidos. Tente novamente dentro de um minuto." },
        {
          status: 429,
          headers: {
            ...responseHeaders,
            "Retry-After": String(Math.ceil(rateCheck.resetMs / 1000)),
          },
        },
      );
    }

    const body = await request.json();

    // Honeypot check — field filled by bots
    if (body.honeypot) {
      // Pretend success to not alert the bot
      return NextResponse.json({ success: true });
    }

    // Validate with Zod
    const parsed = quoteSchema.safeParse(body);
    if (!parsed.success) {
      const errors = parsed.error.issues.map((i) => i.message).join(", ");
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const supabase = await createClient();
    const { error: insertError } = await supabase
      .from("service_requests")
      .insert({
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone,
        service_slug: parsed.data.service_slug,
        description: parsed.data.description,
      });

    if (insertError) {
      console.error("Erro ao inserir pedido de orçamento:", insertError);
      return NextResponse.json({ error: "Erro ao processar o pedido." }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200, headers: responseHeaders });
  } catch (err) {
    console.error("Erro no endpoint /api/quote:", err);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}
