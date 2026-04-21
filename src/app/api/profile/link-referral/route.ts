import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabase } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { referral_code } = await request.json();
  if (!referral_code) return NextResponse.json({ error: "No code" }, { status: 400 });

  const db = createSupabase(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  // Check if user already has a referrer
  const { data: profile } = await db
    .from("profiles")
    .select("referred_by, display_name")
    .eq("id", user.id)
    .single();

  if (profile?.referred_by) return NextResponse.json({ already: true });

  // Look up referrer
  const { data: referrer } = await db
    .from("profiles")
    .select("id, display_name")
    .eq("referral_code", referral_code)
    .single();

  if (!referrer || referrer.id === user.id) return NextResponse.json({ error: "Invalid code" }, { status: 400 });

  // Set referred_by (triggers angbao credits via DB trigger)
  await db
    .from("profiles")
    .update({ referred_by: referrer.id })
    .eq("id", user.id);

  // Auto-follow and auto-connect both ways
  await db.from("social_graph").upsert([
    { actor_id: user.id, subject_id: referrer.id, rel_type: "follow" },
    { actor_id: referrer.id, subject_id: user.id, rel_type: "follow" },
    { actor_id: user.id, subject_id: referrer.id, rel_type: "connect" },
    { actor_id: referrer.id, subject_id: user.id, rel_type: "connect" },
  ], { onConflict: "actor_id,subject_id,rel_type" });

  // Send welcome message
  const { data: thread } = await db
    .from("message_threads")
    .insert({})
    .select()
    .single();

  if (thread) {
    await db.from("thread_participants").insert([
      { thread_id: thread.id, user_id: referrer.id },
      { thread_id: thread.id, user_id: user.id },
    ]);
    await db.from("messages").insert({
      thread_id: thread.id,
      sender_id: referrer.id,
      content: `Heya 👋 Glad you joined! Feel free to ask me anything about the platform. Huat ah! 🧧发`,
    });
    await db.from("message_threads")
      .update({ last_msg_at: new Date().toISOString() })
      .eq("id", thread.id);
  }

  return NextResponse.json({ success: true });
}
