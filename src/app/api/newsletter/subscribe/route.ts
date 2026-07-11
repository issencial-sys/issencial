import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { newsletterConfirmTemplate } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const { email, name } = await request.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Email inválido." },
        { status: 400 }
      );
    }

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
