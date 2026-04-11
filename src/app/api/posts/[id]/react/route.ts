import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { type } = await request.json();
  const validTypes = ["like", "fire", "rocket", "bear"];
  if (!validTypes.includes(type)) return NextResponse.json({ error: "Invalid reaction" }, { status: 400 });

  // Toggle: delete if exists, insert if not
  const { data: existing } = await supabase
    .from("reactions")
    .select("id")
    .eq("post_id", id)
    .eq("user_id", user.id)
    .eq("type", type)
    .single();

  if (existing) {
    await supabase.from("reactions").delete().eq("id", existing.id);
    return NextResponse.json({ action: "removed" });
  } else {
    // Remove any previous reaction from this user on this post
    await supabase.from("reactions").delete().eq("post_id", id).eq("user_id", user.id);
    await supabase.from("reactions").insert({ post_id: id, user_id: user.id, type });
    return NextResponse.json({ action: "added" });
  }
}
