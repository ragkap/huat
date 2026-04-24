import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("post_drafts")
    .select("id, content, post_type, sentiment, attachments, tagged_stocks, forecast_data, scheduled_for, publish_error, created_at, updated_at")
    .eq("author_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ drafts: data ?? [] });
}

const DraftSchema = z.object({
  content: z.string().max(1000).default(""),
  post_type: z.enum(["post", "forecast"]).default("post"),
  sentiment: z.enum(["bullish", "bearish", "neutral"]).nullish(),
  attachments: z.array(z.record(z.string(), z.unknown())).max(4).optional(),
  tagged_stocks: z.array(z.string()).max(5).optional(),
  forecast_data: z.object({
    ticker: z.string(),
    target_price: z.number().positive(),
    target_date: z.string(),
  }).nullish(),
  scheduled_for: z.string().datetime().nullish(),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const parsed = DraftSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  // Don't allow scheduling in the past.
  if (parsed.data.scheduled_for && new Date(parsed.data.scheduled_for).getTime() < Date.now() - 60_000) {
    return NextResponse.json({ error: "scheduled_for must be in the future" }, { status: 400 });
  }

  const insert = {
    author_id: user.id,
    content: parsed.data.content,
    post_type: parsed.data.post_type,
    sentiment: parsed.data.sentiment ?? null,
    attachments: parsed.data.attachments ?? [],
    tagged_stocks: parsed.data.tagged_stocks ?? [],
    forecast_data: parsed.data.forecast_data ?? null,
    scheduled_for: parsed.data.scheduled_for ?? null,
  };

  const { data, error } = await supabase
    .from("post_drafts")
    .insert(insert)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ draft: data }, { status: 201 });
}
