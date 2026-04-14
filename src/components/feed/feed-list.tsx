"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { PostComposer } from "@/components/feed/post-composer";
import { PostCard } from "@/components/feed/post-card";
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
}

export function FeedList({ tab, profile, stockTicker, postType }: FeedListProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useRef<HTMLDivElement>(null);
  const resettingRef = useRef(false);

  const fetchPosts = useCallback(async (p: number, reset = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ tab, page: String(p), limit: "20" });
      if (stockTicker) params.set("ticker", stockTicker);
      if (postType) params.set("post_type", postType);
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

  // Reset on tab/ticker/postType change
  useEffect(() => {
    resettingRef.current = true;
    setPage(0);
    setHasMore(true);
    setPosts([]);
    fetchPosts(0, true);
  }, [tab, stockTicker, postType, fetchPosts]);

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
  }

  async function handleSave(postId: string) {
    const post = posts.find(p => p.id === postId);
    const method = post?.is_saved ? "DELETE" : "POST";
    await fetch(`/api/posts/${postId}/save`, { method });
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, is_saved: !p.is_saved } : p));
  }

  function handleEdit(postId: string, newContent: string) {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, content: newContent } : p));
  }

  function handleDelete(postId: string) {
    setPosts(prev => prev.filter(p => p.id !== postId));
  }

  const showComposer = tab === "foryou" || tab === "followed" || !!stockTicker;
  const initialLoading = loading && posts.length === 0;

  return (
    <div>
      {showComposer && (
        <PostComposer profile={profile} onPost={() => fetchPosts(0, true)} defaultTicker={stockTicker} />
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
        <div className="divide-y divide-[#1A1A1A]">
          {posts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={profile.id}
              currentUserProfile={profile}
              onReact={handleReact}
              onSave={handleSave}
              onEdit={handleEdit}
              onDelete={handleDelete}
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
