"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { PostComposer } from "@/components/feed/post-composer";
import { PostCard } from "@/components/feed/post-card";
import { useAngBaoToast } from "@/components/angbao/credit-toast";
import type { Post, Profile } from "@/types/database";

function PostSkeleton() {
  return (
    <div className="px-5 py-4 border-b border-[#141414] animate-pulse">
      {/* Author row */}
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-8 h-8 rounded-full bg-[#1C1C1C] flex-shrink-0" />
        <div className="flex flex-col gap-1.5">
          <div className="h-3 w-24 rounded bg-[#1C1C1C]" />
          <div className="h-2.5 w-16 rounded bg-[#141414]" />
        </div>
      </div>
      {/* Content lines */}
      <div className="space-y-2 mb-3">
        <div className="h-3 w-full rounded bg-[#1C1C1C]" />
        <div className="h-3 w-5/6 rounded bg-[#1C1C1C]" />
        <div className="h-3 w-3/4 rounded bg-[#141414]" />
      </div>
      {/* Reaction row */}
      <div className="flex items-center gap-4 mt-3">
        <div className="h-3 w-8 rounded bg-[#141414]" />
        <div className="h-3 w-8 rounded bg-[#141414]" />
        <div className="h-3 w-8 rounded bg-[#141414]" />
      </div>
    </div>
  );
}

interface FeedListProps {
  tab: string;
  profile: Profile;
  stockTicker?: string;
  postType?: string;
  authorId?: string;
  initialPosts?: Post[];
}

export function FeedList({ tab, profile, stockTicker, postType, authorId, initialPosts }: FeedListProps) {
  const angbao = useAngBaoToast();
  const [posts, setPosts] = useState<Post[]>(initialPosts ?? []);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

  // Fetch following IDs once on mount
  useEffect(() => {
    fetch("/api/users/connections?rel_type=follow")
      .then(r => r.ok ? r.json() : { ids: [] })
      .then(d => setFollowingIds(new Set(d.ids ?? [])))
      .catch(() => {});
  }, []);
  const [page, setPage] = useState(initialPosts?.length ? 1 : 0);
  const [loading, setLoading] = useState(!initialPosts);
  const [hasMore, setHasMore] = useState(initialPosts ? initialPosts.length === 20 : true);
  const loaderRef = useRef<HTMLDivElement>(null);
  const resettingRef = useRef(false);

  const fetchPosts = useCallback(async (p: number, reset = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ tab, page: String(p), limit: "20" });
      if (stockTicker) params.set("ticker", stockTicker);
      if (postType) params.set("post_type", postType);
      if (authorId) params.set("author_id", authorId);
      const res = await fetch(`/api/posts?${params}`);
      const data = await res.json();
      const newPosts: Post[] = data.posts ?? [];
      if (reset) {
        setPosts(newPosts);
        resettingRef.current = false;
      } else {
        // Deduplicate to guard against double-fetch from concurrent observer + reset
        setPosts(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const fresh = newPosts.filter(p => !existingIds.has(p.id));
          return fresh.length ? [...prev, ...fresh] : prev;
        });
      }
      setHasMore(newPosts.length === 20);
    } finally {
      setLoading(false);
    }
  }, [tab, stockTicker, postType]);

  // Listen for feed refresh events (from logo click, sidebar feed click, etc.)
  useEffect(() => {
    function onRefresh() {
      setPosts([]);
      setPage(0);
      setHasMore(true);
      resettingRef.current = true;
      fetchPosts(0, true);
    }
    window.addEventListener("huat:refresh-feed", onRefresh);
    return () => window.removeEventListener("huat:refresh-feed", onRefresh);
  }, [fetchPosts]);

  // On mount: skip fetch if server already provided initial posts, else fetch
  const mountedRef = useRef(false);
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      if (initialPosts?.length) return; // server-provided posts — skip initial fetch
    }
    resettingRef.current = true;
    setPage(0);
    setHasMore(true);
    setPosts([]);
    fetchPosts(0, true);
  }, [tab, stockTicker, postType, fetchPosts]); // eslint-disable-line react-hooks/exhaustive-deps

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading && !resettingRef.current) {
          setPage(p => {
            const next = p + 1;
            fetchPosts(next);
            return next;
          });
        }
      },
      { threshold: 0.1 }
    );
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, fetchPosts]);

  async function handleReact(postId: string, type: string) {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    const wasReacted = !!post.user_reaction;
    // Optimistic update
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      const counts = { ...(p.reactions_count ?? { like: 0, fire: 0, rocket: 0, bear: 0, total: 0 }) };
      if (wasReacted) {
        counts[p.user_reaction as keyof typeof counts] = Math.max(0, (counts[p.user_reaction as keyof typeof counts] as number) - 1);
        counts.total = Math.max(0, counts.total - 1);
        return { ...p, user_reaction: null, reactions_count: counts };
      } else {
        counts[type as keyof typeof counts] = (counts[type as keyof typeof counts] as number) + 1;
        counts.total = counts.total + 1;
        return { ...p, user_reaction: type as Post["user_reaction"], reactions_count: counts };
      }
    }));
    await fetch(`/api/posts/${postId}/react`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type }),
    });
    if (!wasReacted) angbao.showCredit("react", 0.25);
  }

  async function handleSave(postId: string) {
    const post = posts.find(p => p.id === postId);
    const wasSaved = post?.is_saved;
    const method = wasSaved ? "DELETE" : "POST";
    await fetch(`/api/posts/${postId}/save`, { method });
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, is_saved: !p.is_saved } : p));
    if (!wasSaved) angbao.showCredit("save", 0.25);
  }

  function handleEdit(postId: string, newContent: string) {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, content: newContent } : p));
  }

  function handleDelete(postId: string) {
    setPosts(prev => prev.filter(p => p.id !== postId));
  }

  function handleReply(postId: string, newReply: Post) {
    setPosts(prev => prev.map(p => p.id !== postId ? p : {
      ...p,
      replies_count: (p.replies_count ?? 0) + 1,
      latest_reply: {
        id: newReply.id,
        content: newReply.content,
        created_at: newReply.created_at,
        author: profile,
      },
    }));
    angbao.showCredit("reply", 1);
  }

  async function handleVote(postId: string, optionId: string) {
    // Optimistic update
    setPosts(prev => prev.map(p => {
      if (p.id !== postId || !p.poll) return p;
      const poll = { ...p.poll };
      const counts = { ...(poll.vote_counts ?? {}) };
      // Remove old vote if changing
      if (poll.user_vote) {
        counts[poll.user_vote] = Math.max(0, (counts[poll.user_vote] ?? 1) - 1);
      }
      counts[optionId] = (counts[optionId] ?? 0) + 1;
      const total = Object.values(counts).reduce((s, v) => s + v, 0);
      return { ...p, poll: { ...poll, vote_counts: counts, user_vote: optionId, total_votes: total } };
    }));
    await fetch(`/api/posts/${postId}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ option_id: optionId }),
    });
  }

  async function handleRepost(postId: string) {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    const wasReposted = post.user_reposted;
    // Optimistic update
    setPosts(prev => prev.map(p => p.id !== postId ? p : {
      ...p,
      user_reposted: !wasReposted,
      reposts_count: (p.reposts_count ?? 0) + (wasReposted ? -1 : 1),
    }));
    await fetch(`/api/posts/${postId}/repost`, { method: "POST" });
    if (!wasReposted) angbao.showCredit("repost", 0.50);
  }

  const feedTopRef = useRef<HTMLDivElement>(null);
  const [quotingPost, setQuotingPost] = useState<Post | null>(null);
  const [newPostIds, setNewPostIds] = useState<Set<string>>(new Set());

  async function handleFollow(userId: string) {
    setFollowingIds(prev => new Set(prev).add(userId));
    await fetch("/api/users/connections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject_id: userId, rel_type: "follow" }),
    });
    angbao.showCredit("follow", 0.50);
  }

  function handleQuote(post: Post) {
    setQuotingPost(post);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function markNew(id: string) {
    setNewPostIds(prev => new Set(prev).add(id));
    setTimeout(() => setNewPostIds(prev => { const next = new Set(prev); next.delete(id); return next; }), 3500);
    // Scroll the new post into view
    requestAnimationFrame(() => {
      const el = document.getElementById(`post-${id}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }

  function handleComposerPost(newPost?: Record<string, unknown>) {
    if (newPost && quotingPost) {
      const enriched = {
        ...newPost,
        author: (newPost as Record<string, unknown>).author ?? profile,
        quoted_post: {
          id: quotingPost.id,
          content: quotingPost.content,
          created_at: quotingPost.created_at,
          author: quotingPost.author,
        },
        quote_of: quotingPost.id,
        reactions_count: { like: 0, fire: 0, rocket: 0, bear: 0, total: 0 },
        replies_count: 0,
        reposts_count: 0,
        user_reaction: null,
        is_saved: false,
        user_reposted: false,
      } as unknown as Post;
      setPosts(prev => [enriched, ...prev]);
      markNew(enriched.id);
    } else if (newPost) {
      const enriched = {
        ...newPost,
        author: (newPost as Record<string, unknown>).author ?? profile,
        reactions_count: { like: 0, fire: 0, rocket: 0, bear: 0, total: 0 },
        replies_count: 0,
        reposts_count: 0,
        user_reaction: null,
        is_saved: false,
        user_reposted: false,
      } as unknown as Post;
      setPosts(prev => [enriched, ...prev]);
      markNew(enriched.id);
    } else {
      fetchPosts(0, true);
    }
    setQuotingPost(null);
    if (newPost) {
      const pt = (newPost as Record<string, unknown>).post_type as string;
      const atts = (newPost as Record<string, unknown>).attachments as { type: string }[] | undefined;
      const hasImage = atts?.some(a => a.type === "image");
      const hasLink = atts?.some(a => a.type === "link");
      if (pt === "poll") angbao.showCredit("poll", 2);
      else if (pt === "forecast") angbao.showCredit("forecast", 3);
      else if (hasLink) angbao.showCredit("post_link", 3);
      else if (hasImage) angbao.showCredit("post_image", 2);
      else angbao.showCredit("post", 1);
    }
  }

  const showComposer = !authorId;
  const initialLoading = loading && posts.length === 0;

  return (
    <div>
      <div ref={feedTopRef} />
      {showComposer && (
        <PostComposer
          profile={profile}
          onPost={handleComposerPost}
          defaultTicker={stockTicker}
          quotedPost={quotingPost ? { id: quotingPost.id, content: quotingPost.content, author: quotingPost.author, tagged_stocks: quotingPost.tagged_stocks } : null}
          onCancelQuote={() => setQuotingPost(null)}
        />
      )}

      {initialLoading ? (
        <div>
          {Array.from({ length: 5 }).map((_, i) => (
            <PostSkeleton key={i} />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center px-8">
          <div className="flex items-end gap-0.5 mb-5">
            {[0.5, 1, 0.7].map((h, i) => (
              <span key={i} className="w-1 rounded-full bg-[#E8311A] opacity-40" style={{ height: `${h * 24}px` }} />
            ))}
          </div>
          <p className="text-[#F0F0F0] font-bold text-lg mb-2">Nothing here yet</p>
          <p className="text-[#9CA3AF] text-sm">
            {stockTicker
              ? `No posts about $${stockTicker} yet. Be the first!`
              : tab === "followed"
              ? "Follow some investors to see their posts here"
              : tab === "saved"
              ? "Save posts to read them later"
              : "Be the first to post!"}
          </p>
        </div>
      ) : (
        <div className="feed-divider">
          {posts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={profile.id}
              currentUserProfile={profile}
              followingIds={followingIds}
              onFollow={handleFollow}
              isNew={newPostIds.has(post.id)}
              onReact={handleReact}
              onSave={handleSave}
              onRepost={handleRepost}
              onQuote={handleQuote}
              onVote={handleVote}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onReply={handleReply}
            />
          ))}
        </div>
      )}

      <div ref={loaderRef} className="h-10 flex items-center justify-center">
        {loading && posts.length > 0 && (
          <div className="w-5 h-5 border-2 border-[#333333] border-t-[#E8311A] rounded-full animate-spin" />
        )}
      </div>

    </div>
  );
}
