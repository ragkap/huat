import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getStockNamesByTickers } from "@/lib/stocks-db/client";

const SELECT = `*, author:profiles!posts_author_id_fkey(id, username, display_name, avatar_url, is_verified, is_bot, country), poll:polls(*), forecast:forecasts(*)`;

async function enrichPosts(posts: Record<string, unknown>[], userId: string, supabase: Awaited<ReturnType<typeof createClient>>) {
  const postIds = posts.map(p => p.id as string);
  if (!postIds.length) return [];
  const allTickers = [...new Set(posts.flatMap(p => (p.tagged_stocks as string[]) ?? []))];
  const [reactionsResult, savedResult, stockNames] = await Promise.all([
    supabase.from("reactions").select("post_id, type, user_id").in("post_id", postIds),
    supabase.from("saved_posts").select("post_id").eq("user_id", userId).in("post_id", postIds),
    getStockNamesByTickers(allTickers).catch(() => ({} as Record<string, string>)),
  ]);
  const allReactions = reactionsResult.data ?? [];
  const savedSet = new Set((savedResult.data ?? []).map(s => s.post_id as string));
  return posts.map(post => {
    const postReactions = allReactions.filter(r => r.post_id === post.id);
    const counts = { like: 0, fire: 0, rocket: 0, bear: 0, total: 0 };
    let userReaction: string | null = null;
    for (const r of postReactions) {
      counts[r.type as keyof typeof counts] = (counts[r.type as keyof typeof counts] as number) + 1;
      counts.total++;
      if (r.user_id === userId) userReaction = r.type as string;
    }
    const tagged_stock_names: Record<string, string> = {};
    for (const t of (post.tagged_stocks as string[]) ?? []) {
      if (stockNames[t]) tagged_stock_names[t] = stockNames[t];
    }
    return { ...post, reactions_count: counts, user_reaction: userReaction, is_saved: savedSet.has(post.id as string), tagged_stock_names };
  });
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [postRes, repliesRes] = await Promise.all([
    supabase.from("posts").select(SELECT).eq("id", id).single(),
    supabase.from("posts").select(SELECT).eq("parent_id", id).order("created_at", { ascending: true }),
  ]);

  if (postRes.error || !postRes.data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [enrichedPost, enrichedReplies] = await Promise.all([
    enrichPosts([postRes.data as Record<string, unknown>], user.id, supabase).then(r => r[0]),
    enrichPosts((repliesRes.data ?? []) as Record<string, unknown>[], user.id, supabase),
  ]);

  return NextResponse.json({ post: enrichedPost, replies: enrichedReplies });
}

const EditSchema = z.object({
  content: z.string().min(1).max(1000),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = EditSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  // RLS ensures only the author can update their own post
  const { data: post, error } = await supabase
    .from("posts")
    .update({ content: parsed.data.content, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("author_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!post) return NextResponse.json({ error: "Not found or not authorized" }, { status: 404 });

  return NextResponse.json({ post });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase
    .from("posts")
    .delete()
    .eq("id", id)
    .eq("author_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
