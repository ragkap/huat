"use client";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Send } from "lucide-react";
import { PostCard } from "@/components/feed/post-card";
import { Avatar } from "@/components/ui/avatar";
import type { Post, Profile } from "@/types/database";

function ReplyComposer({ parentId, profile, onReply }: { parentId: string; profile: Profile; onReply: (post: Post) => void }) {
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { textareaRef.current?.focus(); }, []);

  async function handlePost() {
    if (!content.trim() || posting) return;
    setPosting(true);
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: content.trim(), parent_id: parentId, post_type: "post" }),
    });
    if (res.ok) {
      const { post } = await res.json();
      onReply(post);
      setContent("");
    }
    setPosting(false);
  }

  return (
    <div className="flex gap-3 px-5 py-4 border-b border-[#282828] bg-[#080808]">
      <Avatar src={profile.avatar_url} alt={profile.display_name} size="sm" />
      <div className="flex-1 min-w-0">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={e => setContent(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handlePost(); }}
          placeholder="Write a reply…"
          rows={2}
          className="w-full bg-transparent text-sm text-[#F0F0F0] placeholder:text-[#555555] resize-none focus:outline-none leading-relaxed"
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-[#555555]">{content.length > 900 ? `${1000 - content.length} left` : ""}</span>
          <button
            onClick={handlePost}
            disabled={!content.trim() || posting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#E8311A] text-white text-xs font-bold disabled:opacity-40 hover:bg-[#D02A15] transition-colors"
          >
            <Send className="w-3 h-3" />
            {posting ? "Posting…" : "Reply"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PostThreadPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [replies, setReplies] = useState<Post[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/posts/${id}`).then(r => r.ok ? r.json() : null),
      fetch("/api/me").then(r => r.ok ? r.json() : null),
    ]).then(([threadData, meData]) => {
      if (threadData?.post) setPost(threadData.post as Post);
      if (threadData?.replies) setReplies(threadData.replies as Post[]);
      if (meData?.profile) setProfile(meData.profile as Profile);
      setLoading(false);
    });
  }, [id]);

  function handleReact(postId: string, type: string) {
    const update = (p: Post): Post => {
      if (p.id !== postId) return p;
      const wasReacted = !!p.user_reaction;
      const counts = { ...(p.reactions_count ?? { like: 0, fire: 0, rocket: 0, bear: 0, total: 0 }) };
      if (wasReacted) {
        counts[p.user_reaction as keyof typeof counts] = Math.max(0, (counts[p.user_reaction as keyof typeof counts] as number) - 1);
        counts.total = Math.max(0, counts.total - 1);
        return { ...p, user_reaction: null, reactions_count: counts };
      }
      counts[type as keyof typeof counts] = (counts[type as keyof typeof counts] as number) + 1;
      counts.total++;
      return { ...p, user_reaction: type as Post["user_reaction"], reactions_count: counts };
    };
    if (post?.id === postId) setPost(p => p ? update(p) : p);
    setReplies(rs => rs.map(update));
    fetch(`/api/posts/${postId}/react`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type }) });
  }

  function handleSave(postId: string) {
    const update = (p: Post): Post => p.id === postId ? { ...p, is_saved: !p.is_saved } : p;
    if (post?.id === postId) setPost(p => p ? update(p) : p);
    setReplies(rs => rs.map(update));
    const p = post?.id === postId ? post : replies.find(r => r.id === postId);
    fetch(`/api/posts/${postId}/save`, { method: p?.is_saved ? "DELETE" : "POST" });
  }

  function handleDelete(postId: string) {
    if (post?.id === postId) { router.back(); return; }
    setReplies(rs => rs.filter(r => r.id !== postId));
    fetch(`/api/posts/${postId}`, { method: "DELETE" });
  }

  function handleEdit(postId: string, newContent: string) {
    const update = (p: Post): Post => p.id === postId ? { ...p, content: newContent } : p;
    if (post?.id === postId) setPost(p => p ? update(p) : p);
    setReplies(rs => rs.map(update));
  }

  function handleReply(newPost: Post) {
    setReplies(rs => [...rs, newPost]);
    if (post) setPost({ ...post, replies_count: (post.replies_count ?? 0) + 1 });
  }

  if (loading) {
    return (
      <div>
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#282828]">
          <div className="w-8 h-8 rounded-full bg-[#1C1C1C] animate-pulse" />
          <div className="space-y-2 flex-1">
            <div className="h-3 w-32 bg-[#1C1C1C] rounded animate-pulse" />
            <div className="h-3 w-full bg-[#141414] rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!post) return (
    <div className="flex flex-col items-center justify-center py-20">
      <p className="text-[#71717A]">Post not found.</p>
    </div>
  );

  return (
    <div>
      {/* Back header */}
      <div className="sticky top-14 z-10 flex items-center gap-3 px-4 py-3 border-b border-[#282828] bg-[#0A0A0A]/95 backdrop-blur-md">
        <button onClick={() => router.back()} className="w-8 h-8 flex items-center justify-center rounded-lg text-[#71717A] hover:text-[#F0F0F0] hover:bg-[#141414] transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <p className="text-sm font-bold text-[#F0F0F0]">Post</p>
      </div>

      {/* Original post */}
      <PostCard
        post={post}
        currentUserId={profile?.id}
        onReact={handleReact}
        onSave={handleSave}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Reply composer */}
      {profile && (
        <ReplyComposer parentId={post.id} profile={profile} onReply={handleReply} />
      )}

      {/* Replies */}
      {replies.length > 0 && (
        <div>
          <div className="px-5 py-2 border-b border-[#1C1C1C]">
            <p className="text-xs font-bold text-[#555555] uppercase tracking-wider">{replies.length} {replies.length === 1 ? "Reply" : "Replies"}</p>
          </div>
          {replies.map(reply => (
            <PostCard
              key={reply.id}
              post={reply}
              currentUserId={profile?.id}
              onReact={handleReact}
              onSave={handleSave}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {replies.length === 0 && profile && (
        <div className="flex flex-col items-center justify-center py-16 text-center px-8">
          <p className="text-[#555555] text-sm">No replies yet. Be the first!</p>
        </div>
      )}
    </div>
  );
}
