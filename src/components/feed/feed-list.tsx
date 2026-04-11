"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { PostComposer } from "@/components/feed/post-composer";
import { PostCard } from "@/components/feed/post-card";
import type { Post, Profile } from "@/types/database";

interface FeedListProps {
  tab: string;
  profile: Profile;
}

export function FeedList({ tab, profile }: FeedListProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useRef<HTMLDivElement>(null);

  const fetchPosts = useCallback(async (p: number, reset = false) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/posts?tab=${tab}&page=${p}&limit=20`);
      const data = await res.json();
      const newPosts: Post[] = data.posts ?? [];
      if (reset) {
        setPosts(newPosts);
      } else {
        setPosts(prev => [...prev, ...newPosts]);
      }
      setHasMore(newPosts.length === 20);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  // Reset on tab change
  useEffect(() => {
    setPage(0);
    setHasMore(true);
    fetchPosts(0, true);
  }, [tab, fetchPosts]);

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading) {
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

  return (
    <div>
      {/* Composer */}
      {(tab === "foryou" || tab === "followed") && (
        <PostComposer profile={profile} onPost={() => fetchPosts(0, true)} />
      )}

      {/* Posts */}
      {posts.length === 0 && !loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-center px-8">
          <p className="text-4xl mb-4">发</p>
          <p className="text-[#F0F0F0] font-bold text-lg mb-2">Nothing here yet</p>
          <p className="text-[#9CA3AF] text-sm">
            {tab === "followed"
              ? "Follow some investors to see their posts here"
              : tab === "saved"
              ? "Save posts to read them later"
              : "Be the first to post!"}
          </p>
        </div>
      ) : (
        posts.map(post => (
          <PostCard
            key={post.id}
            post={post}
            currentUserId={profile.id}
            onReact={handleReact}
            onSave={handleSave}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))
      )}

      {/* Loader sentinel */}
      <div ref={loaderRef} className="h-10 flex items-center justify-center">
        {loading && (
          <div className="w-5 h-5 border-2 border-[#333333] border-t-[#E8311A] rounded-full animate-spin" />
        )}
      </div>
    </div>
  );
}
