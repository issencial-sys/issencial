import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { newsletterEditionTemplate } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Verify admin authentication (validated against admin_users, not JWT)
    const user = await requireAdmin();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const {
      subject,
      article_slug,
      article_title,
      article_excerpt,
      article_category_label,
      issue,
      intro,
      recipient_type, // "all" | "random" | "manual"
      recipient_count, // number (for "random")
      recipient_emails, // string[] (for "manual")
      scheduled_at, // ISO string or null
    } = await request.json();

    if (!subject || !article_slug || !article_title) {
      return NextResponse.json(
        { error: "Campos obrigatórios em falta: subject, article_slug, article_title." },
        { status: 400 }
      );
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";

    let subscribers: { id: string; email: string; name: string; token: string }[] = [];
    const baseUnsubscribeUrl = `${siteUrl}/api/newsletter/unsubscribe?token=`;

    // Get recipients based on type
    if (recipient_type === "all") {
      const { data } = await supabase
        .from("newsletter_subscribers")
        .select("id, email, name, token")
        .eq("status", "active")
        .order("subscribed_at", { ascending: true });

      subscribers = data ?? [];
    } else if (recipient_type === "random") {
      const count = Math.min(Math.max(1, recipient_count || 10), 1000);
      const { data } = await supabase
        .from("newsletter_subscribers")
        .select("id, email, name, token")
        .eq("status", "active")
        .order("subscribed_at", { ascending: true });

      const all = data ?? [];
      // Shuffle and pick random
      const shuffled = [...all].sort(() => Math.random() - 0.5);
      subscribers = shuffled.slice(0, count);
    } else if (recipient_type === "manual") {
      if (!recipient_emails || recipient_emails.length === 0) {
        return NextResponse.json(
          { error: "Seleccione pelo menos um destinatário." },
          { status: 400 }
        );
      }
      const { data } = await supabase
        .from("newsletter_subscribers")
        .select("id, email, name, token")
        .in("email", recipient_emails.map((e: string) => e.toLowerCase().trim()));

      subscribers = data ?? [];
    }

    if (subscribers.length === 0) {
      return NextResponse.json(
        { error: "Nenhum subscritor ativo encontrado." },
        { status: 400 }
      );
    }

    // Create campaign record
    const { data: campaign, error: campaignError } = await supabase
      .from("newsletter_campaigns")
      .insert({
        subject,
        article_slug,
        article_title,
        issue: issue || null,
        intro: intro || "",
        recipient_count: subscribers.length,
        recipient_type,
        status: scheduled_at ? "queued" : "sending",
        scheduled_at: scheduled_at || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (campaignError || !campaign) {
      console.error("Erro ao criar campanha:", campaignError);
      return NextResponse.json(
        { error: "Erro ao criar campanha." },
        { status: 500 }
      );
    }

    // If scheduled, don't queue emails yet — just return
    if (scheduled_at) {
      return NextResponse.json({
        message: `Campanha agendada para ${new Date(scheduled_at).toLocaleString("pt-PT")}.`,
        campaign_id: campaign.id,
        recipient_count: subscribers.length,
      });
    }

    // Personalize each email with the correct unsubscribe URL
    const queueEntries: any[] = [];
    const emailQueueEntries: any[] = [];

    for (const sub of subscribers) {
      const unsubscribeUrl = `${baseUnsubscribeUrl}${sub.token}`;

      // Build HTML with unsubscribe link using the template directly
      const htmlWithUnsubscribe = newsletterEditionTemplate({
        issue: issue || undefined,
        title: subject,
        intro: intro || undefined,
        hero: {
          title: article_title,
          excerpt: article_excerpt || "",
          category_label: article_category_label || undefined,
          href: `/blog/${article_slug}`,
        },
        unsubscribe_url: unsubscribeUrl,
      });

      // newsletter_queue: for tracking (not processed by cron)
      queueEntries.push({
        campaign_id: campaign.id,
        subscriber_id: sub.id,
        to_email: sub.email,
        to_name: sub.name || "",
        subject,
        html_body: htmlWithUnsubscribe,
        status: "pending",
      });

      // email_queue: actually processed by the /api/send-email cron
      emailQueueEntries.push({
        to_email: sub.email,
        to_name: sub.name || "",
        subject,
        html_body: htmlWithUnsubscribe,
        type: "newsletter" as const,
        reference_id: campaign.id,
        reference_type: "newsletter_campaign",
      });
    }

    // Insert into newsletter_queue for tracking
    const { error: queueError } = await supabase
      .from("newsletter_queue")
      .insert(queueEntries);

    if (queueError) {
      console.error("Erro ao inserir na fila de rastreio:", queueError);
      await supabase
        .from("newsletter_campaigns")
        .update({ status: "cancelled" })
        .eq("id", campaign.id);

      return NextResponse.json(
        { error: "Erro ao enfileirar emails." },
        { status: 500 }
      );
    }

    // Insert into email_queue for the cron job to process
    const { error: emailQueueError } = await supabase
      .from("email_queue")
      .insert(emailQueueEntries);

    if (emailQueueError) {
      console.error("Erro ao inserir na email_queue:", emailQueueError);
      await supabase
        .from("newsletter_campaigns")
        .update({ status: "cancelled" })
        .eq("id", campaign.id);

      return NextResponse.json(
        { error: "Erro ao enfileirar emails." },
        { status: 500 }
      );
    }

    // Update campaign status to sent
    await supabase
      .from("newsletter_campaigns")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
      })
      .eq("id", campaign.id);

    return NextResponse.json({
      message: `Newsletter enviada para ${subscribers.length} subscritor(es)!`,
      campaign_id: campaign.id,
      recipient_count: subscribers.length,
    });
  } catch (err) {
    console.error("Erro inesperado em newsletter/send:", err);
    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    // Verify admin authentication (validated against admin_users, not JWT)
    const user = await requireAdmin();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get("campaign_id");

    if (campaignId) {
      // Get specific campaign
      const { data: campaign } = await supabase
        .from("newsletter_campaigns")
        .select("*")
        .eq("id", campaignId)
        .single();

      if (!campaign) {
        return NextResponse.json(
          { error: "Campanha não encontrada." },
          { status: 404 }
        );
      }

      // Get queue stats
      const { data: queueStats } = await supabase
        .from("newsletter_queue")
        .select("status")
        .eq("campaign_id", campaignId);

      const stats = {
        total: queueStats?.length || 0,
        sent: queueStats?.filter((q) => q.status === "sent").length || 0,
        pending: queueStats?.filter((q) => q.status === "pending").length || 0,
        failed: queueStats?.filter((q) => q.status === "failed").length || 0,
      };

      return NextResponse.json({ campaign, stats });
    }

    // List all campaigns
    const { data: campaigns } = await supabase
      .from("newsletter_campaigns")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    return NextResponse.json({ campaigns: campaigns ?? [] });
  } catch (err) {
    console.error("Erro inesperado em newsletter/send:", err);
    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
