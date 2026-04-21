import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabase } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { z } from "zod";

const Schema = z.object({
  username: z.string().min(2).max(30).regex(/^[a-z0-9_]+$/),
  display_name: z.string().min(1).max(60),
  country: z.enum(["SG", "MY", "US"]),
  referral_code: z.string().nullish(),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const { username, display_name, country, referral_code } = parsed.data;

  const db = createSupabase(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  // Check username uniqueness
  const { data: existing } = await db
    .from("profiles")
    .select("id")
    .eq("username", username)
    .neq("id", user.id)
    .single();

  if (existing) return NextResponse.json({ error: "Username is taken" }, { status: 409 });

  // Look up referrer by referral code
  let referredBy: string | null = null;
  if (referral_code) {
    const { data: referrer } = await db
      .from("profiles")
      .select("id")
      .eq("referral_code", referral_code)
      .single();
    if (referrer && referrer.id !== user.id) {
      referredBy = referrer.id;
    }
  }

  // Generate a unique referral code for this user
  const userRefCode = (user.id.replace(/-/g, "").slice(0, 8)).toLowerCase();

  const { error } = await db
    .from("profiles")
    .upsert({
      id: user.id,
      username,
      display_name,
      country,
      referral_code: userRefCode,
      ...(referredBy ? { referred_by: referredBy } : {}),
    });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // If referred, auto-follow, auto-connect, and send welcome message
  if (referredBy) {
    await db.from("social_graph").upsert([
      { actor_id: user.id, subject_id: referredBy, rel_type: "follow" },
      { actor_id: referredBy, subject_id: user.id, rel_type: "follow" },
      { actor_id: user.id, subject_id: referredBy, rel_type: "connect" },
      { actor_id: referredBy, subject_id: user.id, rel_type: "connect" },
    ], { onConflict: "actor_id,subject_id,rel_type" });

    // Get referrer's name for the welcome message
    const { data: referrerProfile } = await db
      .from("profiles")
      .select("display_name")
      .eq("id", referredBy)
      .single();

    const referrerName = referrerProfile?.display_name ?? "Someone";

    // Create a message thread and send welcome message from the referrer
    const { data: thread } = await db
      .from("message_threads")
      .insert({})
      .select()
      .single();

    if (thread) {
      await db.from("thread_participants").insert([
        { thread_id: thread.id, user_id: referredBy },
        { thread_id: thread.id, user_id: user.id },
      ]);

      await db.from("messages").insert({
        thread_id: thread.id,
        sender_id: referredBy,
        content: `Hey ${display_name}! 👋 Welcome to Huat.co! I'm ${referrerName} — glad you joined. Feel free to ask me anything about the platform. Huat ah! 🧧发`,
      });

      await db.from("message_threads")
        .update({ last_msg_at: new Date().toISOString() })
        .eq("id", thread.id);
    }
  }

  return NextResponse.json({ success: true });
}
