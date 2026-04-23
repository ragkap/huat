import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabase } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { triggerMessageEmail } from "@/lib/email/triggers";

const admin = () => createSupabase(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function GET(request: Request, { params }: { params: Promise<{ threadId: string }> }) {
  const { threadId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = admin();

  // Verify participant
  const { data: participation } = await db
    .from("thread_participants")
    .select("thread_id")
    .eq("thread_id", threadId)
    .eq("user_id", user.id)
    .single();

  if (!participation) return NextResponse.json({ error: "Not a participant" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") ?? 0);
  const PAGE_SIZE = 50;

  const { data: messages } = await db
    .from("messages")
    .select(`
      *,
      sender:profiles!messages_sender_id_fkey(id, username, display_name, avatar_url)
    `)
    .eq("thread_id", threadId)
    .order("created_at", { ascending: false })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

  // Get other participants
  const { data: participants } = await db
    .from("thread_participants")
    .select(`profile:profiles(id, username, display_name, avatar_url)`)
    .eq("thread_id", threadId)
    .neq("user_id", user.id);

  return NextResponse.json({
    messages: (messages ?? []).reverse(),
    participants: (participants ?? []).map(p => p.profile),
  });
}

export async function POST(request: Request, { params }: { params: Promise<{ threadId: string }> }) {
  const { threadId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = admin();

  // Verify participant
  const { data: participation } = await db
    .from("thread_participants")
    .select("thread_id")
    .eq("thread_id", threadId)
    .eq("user_id", user.id)
    .single();

  if (!participation) return NextResponse.json({ error: "Not a participant" }, { status: 403 });

  const { content } = await request.json();
  if (!content?.trim()) return NextResponse.json({ error: "Empty message" }, { status: 400 });

  const { data: message } = await db
    .from("messages")
    .insert({ thread_id: threadId, sender_id: user.id, content })
    .select("*, sender:profiles!messages_sender_id_fkey(id, username, display_name, avatar_url)")
    .single();

  await db
    .from("message_threads")
    .update({ last_msg_at: new Date().toISOString() })
    .eq("id", threadId);

  // Email notification to other participants
  const { data: others } = await db
    .from("thread_participants")
    .select("user_id")
    .eq("thread_id", threadId)
    .neq("user_id", user.id);
  const senderName = (message as Record<string, unknown>)?.sender
    ? ((message as Record<string, unknown>).sender as Record<string, string>)?.display_name ?? "Someone"
    : "Someone";
  for (const p of others ?? []) {
    triggerMessageEmail(p.user_id, senderName, content);
  }

  return NextResponse.json({ message }, { status: 201 });
}
