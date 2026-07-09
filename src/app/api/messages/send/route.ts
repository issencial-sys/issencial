import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/messages/send
 * Sends a message from an admin to a client.
 * Validates that the admin is assigned to this client.
 * If no assignment exists, blocks the message (admin must assign first).
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    // Verify admin role
    if (user.app_metadata?.role !== "admin") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    const { content, client_id, process_id, attachments } = await request.json();

    if (!content?.trim() || !client_id) {
      return NextResponse.json(
        { error: "content and client_id are required" },
        { status: 400 },
      );
    }

    // Check assignment: only the assigned admin can reply
    const { data: assignment } = await supabase
      .from("client_assignments")
      .select("admin_id")
      .eq("client_id", client_id)
      .maybeSingle();

    if (!assignment) {
      // No assignment yet — the admin must assign themselves first via the UI
      return NextResponse.json(
        { error: "Este cliente ainda não tem um gestor atribuído. Atribua um gestor primeiro." },
        { status: 403 },
      );
    }

    if (assignment.admin_id !== user.id) {
      // Client is assigned to another admin
      return NextResponse.json(
        { error: "Este cliente está a ser gerido por outro administrador." },
        { status: 403 },
      );
    }

    // Insert the message
    const { data, error } = await supabase
      .from("messages")
      .insert({
        process_id: process_id || null,
        client_id,
        sender_id: user.id,
        content: content.trim(),
        attachments: attachments || [],
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: data }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
