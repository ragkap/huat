import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabase } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createSupabase(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  const { data: participations } = await db
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

  // Enrich with other participant's profile
  const threadIds = (participations ?? []).map(p => p.thread_id);
  const { data: allParticipants } = threadIds.length
    ? await db
        .from("thread_participants")
        .select("thread_id, profile:profiles(id, username, display_name, avatar_url)")
        .in("thread_id", threadIds)
        .neq("user_id", user.id)
    : { data: [] };

  const otherByThread: Record<string, unknown> = {};
  for (const p of allParticipants ?? []) {
    otherByThread[p.thread_id] = p.profile;
  }

  const enriched = (participations ?? []).map(p => ({
    ...p,
    other: otherByThread[p.thread_id] ?? null,
  }));

  return NextResponse.json({ threads: enriched });
}

const CreateSchema = z.object({
  recipient_id: z.string().uuid(),
  content: z.string().min(1).max(5000),
});

export async function POST(request: Request) {
  try {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const { recipient_id, content } = parsed.data;
  const admin = createSupabase(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

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

  // Create or find existing thread (use admin to bypass RLS)
  const { data: existingParticipation } = await admin
    .from("thread_participants")
    .select("thread_id")
    .eq("user_id", user.id);

  const myThreadIds = (existingParticipation ?? []).map(p => p.thread_id as string);

  let threadId: string | null = null;

  if (myThreadIds.length) {
    const { data: sharedThread } = await admin
      .from("thread_participants")
      .select("thread_id")
      .eq("user_id", recipient_id)
      .in("thread_id", myThreadIds)
      .single();
    threadId = (sharedThread?.thread_id as string) ?? null;
  }

  if (!threadId) {
    const { data: newThread, error: threadErr } = await admin
      .from("message_threads")
      .insert({})
      .select()
      .single();
    if (threadErr || !newThread) {
      console.error("[messages] Failed to create thread:", threadErr);
      return NextResponse.json({ error: "Failed to create thread" }, { status: 500 });
    }
    threadId = newThread.id as string;

    await admin.from("thread_participants").insert([
      { thread_id: threadId, user_id: user.id },
      { thread_id: threadId, user_id: recipient_id },
    ]);
  }

  // Insert message + update last_msg_at (use admin to bypass RLS)
  const { data: message } = await admin
    .from("messages")
    .insert({ thread_id: threadId, sender_id: user.id, content })
    .select()
    .single();

  await admin
    .from("message_threads")
    .update({ last_msg_at: new Date().toISOString() })
    .eq("id", threadId);

  return NextResponse.json({ message, thread_id: threadId }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/messages] error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
