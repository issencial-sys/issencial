import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { newsletterConfirmTemplate } from "@/lib/email";
import { z } from "zod";
import { formRateLimiter, getClientIp } from "@/lib/rate-limiter";

const newsletterSubscribeSchema = z.object({
  email: z.string().email("Email inválido").max(254),
  name: z.string().max(100, "Nome muito longo").optional().default(""),
});

export async function POST(request: Request) {
  try {
    // Rate limiting by IP (public endpoint — abuse vector without it)
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

    // Validate with Zod (server-side — client validation is not security)
    const parsed = newsletterSubscribeSchema.safeParse(body);
    if (!parsed.success) {
      const errors = parsed.error.issues.map((i) => i.message).join(", ");
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase().trim();
    const name = parsed.data.name;

    const supabase = await createClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";

    // Check if already subscribed — include token to avoid a second query
    let { data: existing } = await supabase
      .from("newsletter_subscribers")
      .select("id, email, status, token")
      .eq("email", email.toLowerCase().trim())
      .maybeSingle();

    if (existing) {
      if (existing.status === "active") {
        return NextResponse.json(
          { message: "Já está subscrito na nossa newsletter!" },
          { status: 200 }
        );
      }

      if (existing.status === "unsubscribed") {
        // Re-subscribe — token stays the same
        await supabase
          .from("newsletter_subscribers")
          .update({
            status: "active",
            unsubscribed_at: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
      }

      if (existing.status === "bounced") {
        return NextResponse.json(
          { error: "Este email não pode ser utilizado." },
          { status: 400 }
        );
      }
    } else {
      // Insert new subscriber, then fetch the generated token
      const { error: insertError, data: newSub } = await supabase
        .from("newsletter_subscribers")
        .insert({
          email: email.toLowerCase().trim(),
          name: name || "",
        })
        .select("id, email, status, token")
        .single();

      if (insertError) {
        console.error("Erro ao inserir subscritor:", insertError);
        return NextResponse.json(
          { error: "Erro ao registar subscrição." },
          { status: 500 }
        );
      }

      existing = newSub;
    }

    const unsubscribeUrl = existing?.token
      ? `${siteUrl}/api/newsletter/unsubscribe?token=${existing.token}`
      : undefined;

    // Build confirmation email
    const htmlBody = newsletterConfirmTemplate({
      name: name || undefined,
      unsubscribe_url: unsubscribeUrl,
    });

    const subject = "Bem-vindo à newsletter Issencial";

    // Queue the confirmation email
    await supabase.from("email_queue").insert({
      to_email: email.toLowerCase().trim(),
      to_name: name || "",
      subject,
      html_body: htmlBody,
      type: "newsletter",
    });

    return NextResponse.json(
      { message: "Subscrição confirmada! Verifique o seu email." },
      { status: 201 }
    );
  } catch (err) {
    console.error("Erro inesperado em newsletter/subscribe:", err);
    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
