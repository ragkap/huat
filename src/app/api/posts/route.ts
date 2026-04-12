import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const PAGE_SIZE = 20;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tab = searchParams.get("tab") ?? "foryou";
  const page = Number(searchParams.get("page") ?? 0);
  const ticker = searchParams.get("ticker");
  const authorId = searchParams.get("author_id");
  const postType = searchParams.get("post_type");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // For saved/followed tabs, pre-fetch the filter IDs in parallel with nothing
  // (we need them before building the query, but fetch them fast)
  let filterIds: string[] | null = null;
  if (tab === "saved") {
    const { data: saved } = await supabase.from("saved_posts").select("post_id").eq("user_id", user.id);
    filterIds = (saved ?? []).map(s => s.post_id as string);
    if (!filterIds.length) return NextResponse.json({ posts: [] });
  } else if (tab === "followed") {
    const { data: follows } = await supabase.from("social_graph").select("subject_id").eq("actor_id", user.id).eq("rel_type", "follow");
    filterIds = (follows ?? []).map(f => f.subject_id as string);
    if (!filterIds.length) return NextResponse.json({ posts: [] });
  }

  let query = supabase
    .from("posts")
    .select(`
      *,
      author:profiles!posts_author_id_fkey(id, username, display_name, avatar_url, is_verified, country),
      poll:polls(*),
      forecast:forecasts(*)
    `)
    .is("parent_id", null)
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

  if (tab === "saved" && filterIds) query = query.in("id", filterIds);
  else if (tab === "followed" && filterIds) query = query.in("author_id", filterIds);

  if (ticker) query = query.contains("tagged_stocks", [ticker]);
  if (authorId) query = query.eq("author_id", authorId);
  if (postType) query = query.eq("post_type", postType);

  query = query.order("created_at", { ascending: false });

  const { data: posts, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Enrich with reaction counts and saved status
  const postIds = (posts ?? []).map(p => p.id as string);

  const [reactionsResult, savedResult, pollVotesResult] = await Promise.all([
    postIds.length
      ? supabase.from("reactions").select("post_id, type, user_id").in("post_id", postIds)
      : Promise.resolve({ data: [] }),
    postIds.length
      ? supabase.from("saved_posts").select("post_id").eq("user_id", user.id).in("post_id", postIds)
      : Promise.resolve({ data: [] }),
    postIds.length
      ? supabase.from("poll_votes").select("poll_id, option_id, user_id").in("poll_id", (posts ?? []).filter(p => p.post_type === "poll").map(p => p.poll?.id).filter(Boolean) as string[])
      : Promise.resolve({ data: [] }),
  ]);

  const allReactions = reactionsResult.data ?? [];
  const savedSet = new Set((savedResult.data ?? []).map(s => s.post_id as string));
  const pollVotes = pollVotesResult.data ?? [];

  const enriched = (posts ?? []).map(post => {
    const postReactions = allReactions.filter(r => r.post_id === post.id);
    const counts = { like: 0, fire: 0, rocket: 0, bear: 0, total: 0 };
    let userReaction: string | null = null;
    for (const r of postReactions) {
      counts[r.type as keyof typeof counts] = (counts[r.type as keyof typeof counts] as number) + 1;
      counts.total++;
      if (r.user_id === user.id) userReaction = r.type as string;
    }

    let enrichedPoll = post.poll;
    if (post.post_type === "poll" && post.poll) {
      const pVotes = pollVotes.filter(v => v.poll_id === post.poll?.id);
      const voteCounts: Record<string, number> = {};
      for (const v of pVotes) {
        voteCounts[v.option_id as string] = (voteCounts[v.option_id as string] ?? 0) + 1;
      }
      const userVote = pVotes.find(v => v.user_id === user.id)?.option_id ?? null;
      enrichedPoll = { ...post.poll, vote_counts: voteCounts, user_vote: userVote, total_votes: pVotes.length };
    }

    return {
      ...post,
      reactions_count: counts,
      user_reaction: userReaction,
      is_saved: savedSet.has(post.id as string),
      poll: enrichedPoll,
    };
  });

  return NextResponse.json({ posts: enriched });
}

const CreatePostSchema = z.object({
  content: z.string().min(1).max(1000),
  sentiment: z.enum(["bullish", "bearish", "neutral"]).nullable().optional(),
  post_type: z.enum(["post", "poll", "forecast"]).default("post"),
  tagged_stocks: z.array(z.string()).max(5).optional(),
  attachments: z.array(z.object({ url: z.string(), type: z.string() })).max(4).optional(),
  poll: z.object({
    options: z.array(z.object({ id: z.string(), text: z.string() })).min(2).max(4),
    ends_at: z.string().optional(),
  }).optional(),
  forecast: z.object({
    ticker: z.string(),
    targetPrice: z.string(),
    targetDate: z.string(),
  }).optional(),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = CreatePostSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { content, sentiment, post_type, tagged_stocks, attachments, poll, forecast } = parsed.data;

  const { data: post, error } = await supabase
    .from("posts")
    .insert({
      author_id: user.id,
      content,
      sentiment: sentiment ?? null,
      post_type,
      tagged_stocks: tagged_stocks ?? [],
      attachments: attachments ?? [],
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await Promise.all([
    post_type === "poll" && poll
      ? supabase.from("polls").insert({ post_id: post.id, question: content, options: poll.options, ends_at: poll.ends_at ?? null })
      : null,
    post_type === "forecast" && forecast
      ? supabase.from("forecasts").insert({ post_id: post.id, ticker: forecast.ticker, target_price: parseFloat(forecast.targetPrice), target_date: forecast.targetDate })
      : null,
  ].filter(Boolean));

  return NextResponse.json({ post }, { status: 201 });
}
