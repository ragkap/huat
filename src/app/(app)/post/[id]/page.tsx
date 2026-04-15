import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabase } from "@supabase/supabase-js";
import { redirect, notFound } from "next/navigation";
import { PostThreadClient } from "@/components/post/post-thread-client";
import type { Post, Profile } from "@/types/database";
import type { Metadata as NextMetadata } from "next";
import { getStockNamesByTickers } from "@/lib/stocks-db/client";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<NextMetadata> {
  const { id } = await params;
  const supabase = createSupabase(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: post } = await supabase
    .from("posts")
    .select("content, author:profiles!posts_author_id_fkey(display_name)")
    .eq("id", id)
    .single();

  const author = (post?.author as { display_name?: string } | null)?.display_name ?? "Someone";
  const content = (post?.content as string)?.slice(0, 160) ?? "";
  const title = `${author} on Huat.co`;
  const description = content || `See what ${author} posted on Huat.co`;
  const ogImage = `https://www.huat.co/post/${id}/opengraph-image`;

  return {
    title,
    description,
    openGraph: { title, description, url: `https://www.huat.co/post/${id}`, siteName: "Huat.co", type: "article", images: [{ url: ogImage, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title, description, images: [ogImage] },
  };
}

const SELECT = `id, author_id, content, post_type, sentiment, attachments, tagged_stocks, is_pinned, parent_id, created_at, updated_at,
  author:profiles!posts_author_id_fkey(id, username, display_name, avatar_url, is_verified, country),
  poll:polls(*),
  forecast:forecasts(*)`;

async function enrichPosts(
  posts: Record<string, unknown>[],
  userId: string,
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<Post[]> {
  if (!posts.length) return [];
  const postIds = posts.map(p => p.id as string);
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
    return {
      ...(post as unknown as Post),
      reactions_count: counts,
      user_reaction: userReaction as Post["user_reaction"],
      is_saved: savedSet.has(post.id as string),
      tagged_stock_names,
    };
  });
}

export default async function PostThreadPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ reply?: string }>;
}) {
  const { id } = await params;
  const { reply } = await searchParams;
  const autoReply = reply === "1";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profileRes, postRes, repliesRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("posts").select(SELECT).eq("id", id).single(),
    supabase.from("posts").select(SELECT).eq("parent_id", id).order("created_at", { ascending: true }),
  ]);

  if (postRes.error || !postRes.data) notFound();
  const profile = profileRes.data as Profile;

  const [enrichedPosts] = await Promise.all([
    enrichPosts(
      [postRes.data as Record<string, unknown>, ...((repliesRes.data ?? []) as Record<string, unknown>[])],
      user.id,
      supabase
    ),
  ]);

  const [post, ...replies] = enrichedPosts;

  return (
    <PostThreadClient
      initialPost={post}
      initialReplies={replies}
      profile={profile}
      autoReply={autoReply}
    />
  );
}
