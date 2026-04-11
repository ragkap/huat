import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: participations } = await supabase
    .from("thread_participants")
    .select(`
      thread_id,
      thread:message_threads(
        id,
        last_msg_at,
        messages(id, content, created_at, sender_id)
      )
    `)
    .eq("user_id", user.id)
    .order("joined_at", { ascending: false });

  return NextResponse.json({ threads: participations ?? [] });
}

const CreateSchema = z.object({
  recipient_id: z.string().uuid(),
  content: z.string().min(1).max(5000),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const { recipient_id, content } = parsed.data;

  // Verify connection
  const { data: connection } = await supabase
    .from("social_graph")
    .select("id")
    .eq("actor_id", user.id)
    .eq("subject_id", recipient_id)
    .eq("rel_type", "connect")
    .single();

  if (!connection) {
    return NextResponse.json({ error: "You must be connected to message this user" }, { status: 403 });
  }

  // Create or find existing thread
  const { data: existingParticipation } = await supabase
    .from("thread_participants")
    .select("thread_id")
    .eq("user_id", user.id);

  const myThreadIds = (existingParticipation ?? []).map(p => p.thread_id as string);

  let threadId: string | null = null;

  if (myThreadIds.length) {
    const { data: sharedThread } = await supabase
      .from("thread_participants")
      .select("thread_id")
      .eq("user_id", recipient_id)
      .in("thread_id", myThreadIds)
      .single();
    threadId = (sharedThread?.thread_id as string) ?? null;
  }

  if (!threadId) {
    const { data: newThread } = await supabase
      .from("message_threads")
      .insert({})
      .select()
      .single();
    if (!newThread) return NextResponse.json({ error: "Failed to create thread" }, { status: 500 });
    threadId = newThread.id as string;

    await supabase.from("thread_participants").insert([
      { thread_id: threadId, user_id: user.id },
      { thread_id: threadId, user_id: recipient_id },
    ]);
  }

  // Insert message
  const { data: message } = await supabase
    .from("messages")
    .insert({ thread_id: threadId, sender_id: user.id, content })
    .select()
    .single();

  // Update last_msg_at
  await supabase
    .from("message_threads")
    .update({ last_msg_at: new Date().toISOString() })
    .eq("id", threadId);

  return NextResponse.json({ message, thread_id: threadId }, { status: 201 });
}
