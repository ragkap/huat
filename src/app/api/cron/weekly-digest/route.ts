import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { sendWeeklyDigestEmail } from "@/lib/email/send";
import { getStockNamesByTickers } from "@/lib/stocks-db/client";

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: Request) {
  // Verify cron secret (Vercel cron or manual trigger)
  const authHeader = request.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Get all users
  const { data: users } = await db.from("profiles").select("id, display_name");
  if (!users?.length) return NextResponse.json({ sent: 0 });

  // Get top posts this week (by reaction count)
  const { data: weekPosts } = await db
    .from("posts")
    .select("id, content, author_id, created_at, author:profiles!posts_author_id_fkey(display_name)")
    .is("parent_id", null)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(50);

  // Count reactions for each post
  const postIds = (weekPosts ?? []).map(p => p.id as string);
  const { data: reactions } = postIds.length
    ? await db.from("reactions").select("post_id").in("post_id", postIds)
    : { data: [] };

  const reactionCounts: Record<string, number> = {};
  for (const r of reactions ?? []) {
    reactionCounts[r.post_id as string] = (reactionCounts[r.post_id as string] ?? 0) + 1;
  }

  const topPosts = (weekPosts ?? [])
    .map(p => ({ ...p, _reactions: reactionCounts[p.id as string] ?? 0 }))
    .sort((a, b) => b._reactions - a._reactions)
    .slice(0, 3)
    .map(p => ({
      author: (p.author as unknown as Record<string, string>)?.display_name ?? "Unknown",
      content: p.content as string,
      postId: p.id as string,
    }));

  // Trending stocks this week
  const tickers: Record<string, number> = {};
  for (const p of weekPosts ?? []) {
    for (const t of (p as Record<string, unknown>).tagged_stocks as string[] ?? []) {
      tickers[t] = (tickers[t] ?? 0) + 1;
    }
  }
  const topTickers = Object.entries(tickers)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const tickerNames = await getStockNamesByTickers(topTickers.map(t => t[0])).catch(() => ({} as Record<string, string>));
  const trendingStocks = topTickers.map(([ticker, count]) => ({
    name: tickerNames[ticker] ?? ticker,
    ticker,
    postCount: count,
  }));

  // Send digest to each user with their personal stats
  let sent = 0;
  for (const user of users) {
    try {
      // User's stats for the week
      const [reactionsRes, followersRes, repliesRes, angbaoRes] = await Promise.all([
        db.from("reactions").select("id", { count: "exact", head: true })
          .in("post_id", postIds.length ? postIds : ["_"])
          .gte("created_at", since),
        db.from("social_graph").select("id", { count: "exact", head: true })
          .eq("subject_id", user.id).eq("rel_type", "follow").gte("created_at", since),
        db.from("posts").select("id", { count: "exact", head: true })
          .eq("parent_id", user.id).gte("created_at", since),
        db.from("angbao_transactions").select("amount")
          .eq("user_id", user.id).gte("created_at", since),
      ]);

      const angbaoEarned = (angbaoRes.data ?? []).reduce((sum, t) => sum + Number(t.amount), 0);

      await sendWeeklyDigestEmail(
        user.id,
        {
          reactions: reactionsRes.count ?? 0,
          followers: followersRes.count ?? 0,
          replies: repliesRes.count ?? 0,
          angbaoEarned,
        },
        topPosts,
        trendingStocks,
      );
      sent++;
    } catch {
      // Skip failed users
    }
  }

  return NextResponse.json({ sent, total: users.length });
}
