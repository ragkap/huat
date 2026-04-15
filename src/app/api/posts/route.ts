import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getStockNamesByTickers as _getStockNamesByTickers } from "@/lib/stocks-db/client";

const PAGE_SIZE = 20;

// In-process cache for stock names — refreshes every 5 min
const stockNamesCache = new Map<string, { value: string; exp: number }>();
async function getStockNamesCached(tickers: string[]): Promise<Record<string, string>> {
  if (!tickers.length) return {};
  const now = Date.now();
  const missing: string[] = [];
  const result: Record<string, string> = {};
  for (const t of tickers) {
    const entry = stockNamesCache.get(t);
    if (entry && entry.exp > now) result[t] = entry.value;
    else missing.push(t);
  }
  if (missing.length) {
    const fresh = await _getStockNamesByTickers(missing).catch(() => ({} as Record<string, string>));
    const exp = now + 5 * 60 * 1000;
    for (const t of missing) {
      if (fresh[t]) { stockNamesCache.set(t, { value: fresh[t], exp }); result[t] = fresh[t]; }
    }
  }
  return result;
}

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

  // Pre-fetch filter IDs for saved/followed tabs
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
      id, author_id, content, post_type, sentiment, attachments, tagged_stocks, is_pinned, parent_id, quote_of, created_at, updated_at,
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
  if (!posts?.length) return NextResponse.json({ posts: [] });

  const postIds = posts.map(p => p.id as string);
  const allTickers = [...new Set(posts.flatMap(p => p.tagged_stocks as string[] ?? []))];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pollPostIds = posts.filter(p => p.post_type === "poll").map(p => (p.poll as any)?.id).filter(Boolean) as string[];

  // Collect quote_of IDs for fetching quoted posts
  const quoteOfIds = [...new Set(posts.map(p => p.quote_of as string | null).filter(Boolean))] as string[];

  // Single query for replies: get content+author for latest reply, derive count in JS
  const [reactionsResult, savedResult, pollVotesResult, repliesResult, repostsResult, userRepostsResult, quotedPostsResult, stockNames] = await Promise.all([
    supabase.from("reactions").select("post_id, type, user_id").in("post_id", postIds),
    supabase.from("saved_posts").select("post_id").eq("user_id", user.id).in("post_id", postIds),
    pollPostIds.length
      ? supabase.from("poll_votes").select("poll_id, option_id, user_id").in("poll_id", pollPostIds)
      : Promise.resolve({ data: [] }),
    supabase
      .from("posts")
      .select("id, parent_id, content, created_at, author:profiles!posts_author_id_fkey(id, username, display_name, avatar_url)")
      .in("parent_id", postIds)
      .order("created_at", { ascending: false }),
    supabase.from("reposts").select("post_id", { count: "exact" }).in("post_id", postIds),
    supabase.from("reposts").select("post_id").eq("user_id", user.id).in("post_id", postIds),
    quoteOfIds.length
      ? supabase.from("posts").select("id, content, created_at, author:profiles!posts_author_id_fkey(id, username, display_name, avatar_url)").in("id", quoteOfIds)
      : Promise.resolve({ data: [] }),
    getStockNamesCached(allTickers),
  ]);

  const allReactions = reactionsResult.data ?? [];
  const savedSet = new Set((savedResult.data ?? []).map(s => s.post_id as string));
  const pollVotes = pollVotesResult.data ?? [];

  // Derive both replies_count and latest_reply from the single replies query
  const repliesCountMap: Record<string, number> = {};
  const latestReplyMap: Record<string, Record<string, unknown>> = {};
  for (const r of repliesResult.data ?? []) {
    const pid = (r as Record<string, unknown>).parent_id as string;
    repliesCountMap[pid] = (repliesCountMap[pid] ?? 0) + 1;
    if (!latestReplyMap[pid]) latestReplyMap[pid] = r as Record<string, unknown>;
  }

  // Repost counts per post
  const repostsCountMap: Record<string, number> = {};
  for (const r of repostsResult.data ?? []) {
    const pid = r.post_id as string;
    repostsCountMap[pid] = (repostsCountMap[pid] ?? 0) + 1;
  }
  const userRepostSet = new Set((userRepostsResult.data ?? []).map(r => r.post_id as string));

  // Quoted posts map
  const quotedPostsMap: Record<string, Record<string, unknown>> = {};
  for (const qp of quotedPostsResult.data ?? []) {
    quotedPostsMap[(qp as Record<string, unknown>).id as string] = qp as Record<string, unknown>;
  }

  const enriched = posts.map(post => {
    const postReactions = allReactions.filter(r => r.post_id === post.id);
    const counts = { like: 0, fire: 0, rocket: 0, bear: 0, total: 0 };
    let userReaction: string | null = null;
    for (const r of postReactions) {
      counts[r.type as keyof typeof counts] = (counts[r.type as keyof typeof counts] as number) + 1;
      counts.total++;
      if (r.user_id === user.id) userReaction = r.type as string;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const poll = post.poll as any;
    let enrichedPoll = poll;
    if (post.post_type === "poll" && poll) {
      const pVotes = pollVotes.filter(v => v.poll_id === poll.id);
      const voteCounts: Record<string, number> = {};
      for (const v of pVotes) voteCounts[v.option_id as string] = (voteCounts[v.option_id as string] ?? 0) + 1;
      const userVote = pVotes.find(v => v.user_id === user.id)?.option_id ?? null;
      enrichedPoll = { ...poll, vote_counts: voteCounts, user_vote: userVote, total_votes: pVotes.length };
    }

    const tagged_stock_names: Record<string, string> = {};
    for (const t of (post.tagged_stocks as string[]) ?? []) {
      if (stockNames[t]) tagged_stock_names[t] = stockNames[t];
    }

    return {
      ...post,
      reactions_count: counts,
      user_reaction: userReaction,
      is_saved: savedSet.has(post.id as string),
      poll: enrichedPoll,
      tagged_stock_names,
      replies_count: repliesCountMap[post.id as string] ?? 0,
      latest_reply: latestReplyMap[post.id as string] ?? null,
      reposts_count: repostsCountMap[post.id as string] ?? 0,
      user_reposted: userRepostSet.has(post.id as string),
      quote_of: (post.quote_of as string) ?? null,
      quoted_post: (post.quote_of && quotedPostsMap[post.quote_of as string]) ?? null,
    };
  });

  const response = NextResponse.json({ posts: enriched });
  // Cache page 0 in browser for 10s — stale-while-revalidate for 30s
  // Subsequent pages are less time-sensitive
  if (page === 0 && !ticker && !authorId && !postType) {
    response.headers.set("Cache-Control", "private, max-age=10, stale-while-revalidate=30");
  }
  return response;
}

const CreatePostSchema = z.object({
  content: z.string().min(1).max(1000),
  sentiment: z.enum(["bullish", "bearish", "neutral"]).nullable().optional(),
  post_type: z.enum(["post", "poll", "forecast"]).default("post"),
  tagged_stocks: z.array(z.string()).max(5).optional(),
  parent_id: z.string().uuid().nullish(),
  quote_of: z.string().uuid().nullish(),
  attachments: z.array(z.object({
    url: z.string(),
    type: z.string(),
    og_title: z.string().nullish(),
    og_description: z.string().nullish(),
    og_image: z.string().nullish(),
    og_site_name: z.string().nullish(),
  })).max(4).optional(),
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

  const { content, sentiment, post_type, tagged_stocks, parent_id, quote_of, attachments, poll, forecast } = parsed.data;

  const { data: post, error } = await supabase
    .from("posts")
    .insert({
      author_id: user.id,
      content,
      sentiment: sentiment ?? null,
      post_type,
      tagged_stocks: tagged_stocks ?? [],
      attachments: attachments ?? [],
      parent_id: parent_id ?? null,
      quote_of: quote_of ?? null,
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
