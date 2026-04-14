import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { FeedTabs } from "@/components/feed/feed-tabs";
import type { Post, Profile } from "@/types/database";
import { getStockNamesByTickers } from "@/lib/stocks-db/client";

const PAGE_SIZE = 20;

async function getInitialPosts(userId: string): Promise<Post[]> {
  const supabase = await createClient();
  const { data: posts } = await supabase
    .from("posts")
    .select(`
      id, author_id, content, post_type, sentiment, attachments, tagged_stocks, is_pinned, parent_id, created_at, updated_at,
      author:profiles!posts_author_id_fkey(id, username, display_name, avatar_url, is_verified, country),
      poll:polls(*),
      forecast:forecasts(*)
    `)
    .is("parent_id", null)
    .order("created_at", { ascending: false })
    .range(0, PAGE_SIZE - 1);

  if (!posts?.length) return [];

  const postIds = posts.map(p => p.id as string);
  const allTickers = [...new Set(posts.flatMap(p => p.tagged_stocks as string[] ?? []))];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pollPostIds = posts.filter(p => p.post_type === "poll").map(p => (p.poll as any)?.id).filter(Boolean) as string[];

  const [reactionsResult, savedResult, pollVotesResult, repliesResult, stockNames] = await Promise.all([
    supabase.from("reactions").select("post_id, type, user_id").in("post_id", postIds),
    supabase.from("saved_posts").select("post_id").eq("user_id", userId).in("post_id", postIds),
    pollPostIds.length
      ? supabase.from("poll_votes").select("poll_id, option_id, user_id").in("poll_id", pollPostIds)
      : Promise.resolve({ data: [] as { poll_id: string; option_id: string; user_id: string }[] }),
    supabase
      .from("posts")
      .select("id, parent_id, content, created_at, author:profiles!posts_author_id_fkey(id, username, display_name, avatar_url)")
      .in("parent_id", postIds)
      .order("created_at", { ascending: false }),
    getStockNamesByTickers(allTickers).catch(() => ({} as Record<string, string>)),
  ]);

  const allReactions = reactionsResult.data ?? [];
  const savedSet = new Set((savedResult.data ?? []).map(s => s.post_id as string));
  const pollVotes = pollVotesResult.data ?? [];
  const repliesCountMap: Record<string, number> = {};
  const latestReplyMap: Record<string, Record<string, unknown>> = {};
  for (const r of repliesResult.data ?? []) {
    const pid = (r as Record<string, unknown>).parent_id as string;
    repliesCountMap[pid] = (repliesCountMap[pid] ?? 0) + 1;
    if (!latestReplyMap[pid]) latestReplyMap[pid] = r as Record<string, unknown>;
  }

  return posts.map(post => {
    const postReactions = allReactions.filter(r => r.post_id === post.id);
    const counts = { like: 0, fire: 0, rocket: 0, bear: 0, total: 0 };
    let userReaction: string | null = null;
    for (const r of postReactions) {
      counts[r.type as keyof typeof counts] = (counts[r.type as keyof typeof counts] as number) + 1;
      counts.total++;
      if (r.user_id === userId) userReaction = r.type as string;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const poll = post.poll as any;
    let enrichedPoll = poll;
    if (post.post_type === "poll" && poll) {
      const pVotes = pollVotes.filter(v => v.poll_id === poll.id);
      const voteCounts: Record<string, number> = {};
      for (const v of pVotes) voteCounts[v.option_id] = (voteCounts[v.option_id] ?? 0) + 1;
      const userVote = pVotes.find(v => v.user_id === userId)?.option_id ?? null;
      enrichedPoll = { ...poll, vote_counts: voteCounts, user_vote: userVote, total_votes: pVotes.length };
    }
    const tagged_stock_names: Record<string, string> = {};
    for (const t of (post.tagged_stocks as string[]) ?? []) {
      if (stockNames[t]) tagged_stock_names[t] = stockNames[t];
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return {
      ...(post as unknown as Record<string, unknown>),
      reactions_count: counts,
      user_reaction: userReaction,
      is_saved: savedSet.has(post.id as string),
      poll: enrichedPoll,
      tagged_stock_names,
      replies_count: repliesCountMap[post.id as string] ?? 0,
      latest_reply: latestReplyMap[post.id as string] ?? null,
    } as unknown as Post;
  });
}

export default async function FeedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profileRes, initialPosts] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    getInitialPosts(user.id),
  ]);

  const profile = profileRes.data as Profile;
  if (!profile) redirect("/onboarding");

  return <FeedTabs profile={profile} initialPosts={initialPosts} />;
}
