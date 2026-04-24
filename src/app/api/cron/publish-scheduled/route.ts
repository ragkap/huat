import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const CRON_SECRET = process.env.CRON_SECRET;

interface ScheduledDraft {
  id: string;
  author_id: string;
  content: string;
  post_type: "post" | "forecast";
  sentiment: "bullish" | "bearish" | "neutral" | null;
  attachments: unknown[];
  tagged_stocks: string[];
  forecast_data: { ticker: string; target_price: number; target_date: string } | null;
  scheduled_for: string;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  const { data: drafts, error } = await db
    .from("post_drafts")
    .select("id, author_id, content, post_type, sentiment, attachments, tagged_stocks, forecast_data, scheduled_for")
    .lte("scheduled_for", new Date().toISOString())
    .not("scheduled_for", "is", null)
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!drafts?.length) return NextResponse.json({ published: 0 });

  let published = 0;
  const failures: Array<{ id: string; error: string }> = [];

  for (const d of drafts as unknown as ScheduledDraft[]) {
    if (!d.content || !d.content.trim()) {
      // Never publish an empty draft; mark with error and leave it for the user.
      await db.from("post_drafts").update({ publish_error: "Empty content" }).eq("id", d.id);
      failures.push({ id: d.id, error: "Empty content" });
      continue;
    }

    const { data: post, error: postErr } = await db
      .from("posts")
      .insert({
        author_id: d.author_id,
        content: d.content,
        post_type: d.post_type,
        sentiment: d.sentiment,
        attachments: d.attachments ?? [],
        tagged_stocks: d.tagged_stocks ?? [],
      })
      .select("id")
      .single();

    if (postErr || !post) {
      await db.from("post_drafts").update({ publish_error: postErr?.message ?? "Insert failed" }).eq("id", d.id);
      failures.push({ id: d.id, error: postErr?.message ?? "Insert failed" });
      continue;
    }

    if (d.post_type === "forecast" && d.forecast_data) {
      const { error: fErr } = await db.from("forecasts").insert({
        post_id: post.id,
        ticker: d.forecast_data.ticker,
        target_price: d.forecast_data.target_price,
        target_date: d.forecast_data.target_date,
      });
      if (fErr) {
        // Clean up the orphaned post.
        await db.from("posts").delete().eq("id", post.id);
        await db.from("post_drafts").update({ publish_error: `Forecast insert failed: ${fErr.message}` }).eq("id", d.id);
        failures.push({ id: d.id, error: fErr.message });
        continue;
      }
    }

    await db.from("post_drafts").delete().eq("id", d.id);
    published++;
  }

  return NextResponse.json({ checked: drafts.length, published, failures });
}
