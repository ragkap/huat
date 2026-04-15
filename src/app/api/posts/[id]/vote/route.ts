import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: postId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { option_id } = await req.json();
  if (!option_id) return NextResponse.json({ error: "option_id required" }, { status: 400 });

  // Get poll for this post
  const { data: poll } = await supabase
    .from("polls")
    .select("id, ends_at")
    .eq("post_id", postId)
    .single();

  if (!poll) return NextResponse.json({ error: "Poll not found" }, { status: 404 });

  // Check expiry
  if (poll.ends_at && new Date(poll.ends_at) < new Date()) {
    return NextResponse.json({ error: "Poll has expired" }, { status: 400 });
  }

  // Upsert vote (change vote if already voted)
  const { error } = await supabase
    .from("poll_votes")
    .upsert(
      { poll_id: poll.id, user_id: user.id, option_id },
      { onConflict: "poll_id,user_id" }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ voted: true, option_id });
}
