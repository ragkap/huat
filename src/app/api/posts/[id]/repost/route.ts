import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// POST — toggle repost (create or delete)
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: postId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Check if already reposted
  const { data: existing } = await supabase
    .from("reposts")
    .select("id")
    .eq("user_id", user.id)
    .eq("post_id", postId)
    .maybeSingle();

  if (existing) {
    // Undo repost
    await supabase.from("reposts").delete().eq("id", existing.id);
    return NextResponse.json({ reposted: false });
  }

  // Create repost
  const { error } = await supabase
    .from("reposts")
    .insert({ user_id: user.id, post_id: postId });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ reposted: true });
}
