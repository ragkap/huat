import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabase } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const admin = () => createSupabase(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await admin()
    .from("email_preferences")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return NextResponse.json({ preferences: data });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  // Only allow known preference keys
  const allowed = ["new_message", "new_follower", "connect_request", "connect_accepted", "post_reply", "post_reaction", "post_repost", "angbao_milestone", "weekly_digest", "pause_all"];
  const updates: Record<string, boolean> = {};
  for (const key of allowed) {
    if (typeof body[key] === "boolean") updates[key] = body[key];
  }

  if (Object.keys(updates).length === 0) return NextResponse.json({ error: "No valid updates" }, { status: 400 });

  const { error } = await admin()
    .from("email_preferences")
    .upsert({ user_id: user.id, ...updates, updated_at: new Date().toISOString() });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
