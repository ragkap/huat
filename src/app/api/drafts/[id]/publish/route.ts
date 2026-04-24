import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabase } from "@supabase/supabase-js";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: draft, error: fetchErr } = await supabase
    .from("post_drafts")
    .select("*")
    .eq("id", id)
    .eq("author_id", user.id)
    .single();

  if (fetchErr || !draft) return NextResponse.json({ error: "Draft not found" }, { status: 404 });
  if (!draft.content || !draft.content.trim()) {
    return NextResponse.json({ error: "Draft is empty" }, { status: 400 });
  }

  const { data: post, error: insertErr } = await supabase
    .from("posts")
    .insert({
      author_id: user.id,
      content: draft.content,
      post_type: draft.post_type,
      sentiment: draft.sentiment,
      attachments: draft.attachments ?? [],
      tagged_stocks: draft.tagged_stocks ?? [],
    })
    .select()
    .single();

  if (insertErr || !post) return NextResponse.json({ error: insertErr?.message ?? "Failed to create post" }, { status: 500 });

  // Forecasts go in a separate table; needs service role (no INSERT RLS policy).
  if (draft.post_type === "forecast" && draft.forecast_data) {
    const admin = createSupabase(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const fd = draft.forecast_data as { ticker: string; target_price: number; target_date: string };
    const { error: fErr } = await admin.from("forecasts").insert({
      post_id: post.id,
      ticker: fd.ticker,
      target_price: fd.target_price,
      target_date: fd.target_date,
    });
    if (fErr) {
      // Post was created; forecast row failed. Clean up the post so we don't
      // leave an orphaned forecast-post without its forecast record.
      await supabase.from("posts").delete().eq("id", post.id);
      return NextResponse.json({ error: `Forecast insert failed: ${fErr.message}` }, { status: 500 });
    }
  }

  await supabase.from("post_drafts").delete().eq("id", id).eq("author_id", user.id);

  return NextResponse.json({ post }, { status: 201 });
}
