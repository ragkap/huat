import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const UpdateSchema = z.object({
  content: z.string().max(1000).optional(),
  post_type: z.enum(["post", "forecast"]).optional(),
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

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  if (parsed.data.scheduled_for && new Date(parsed.data.scheduled_for).getTime() < Date.now() - 60_000) {
    return NextResponse.json({ error: "scheduled_for must be in the future" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("post_drafts")
    .update({ ...parsed.data, publish_error: null })
    .eq("id", id)
    .eq("author_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ draft: data });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase
    .from("post_drafts")
    .delete()
    .eq("id", id)
    .eq("author_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
