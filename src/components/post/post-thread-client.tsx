"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send } from "lucide-react";
import { PostCard } from "@/components/feed/post-card";
import { Avatar } from "@/components/ui/avatar";
import { LoadingLink } from "@/components/ui/loading-link";
import { useMentions } from "@/hooks/use-mentions";
import { MentionDropdown } from "@/components/ui/mention-dropdown";
import { useAngBaoToast } from "@/components/angbao/credit-toast";
import type { Post, Profile } from "@/types/database";

function ReplyComposer({ parentId, profile, onReply, autoFocus, replyToUsername }: {
  parentId: string;
  profile: Profile;
  onReply: (post: Post) => void;
  autoFocus?: boolean;
  replyToUsername?: string;
}) {
  const [content, setContent] = useState(replyToUsername ? `@${replyToUsername} ` : "");
  const [posting, setPosting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mentions = useMentions(textareaRef, content, setContent);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
      // Place cursor at end (after the @username)
      const len = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(len, len);
    }
  }, [autoFocus]);

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
      setContent(replyToUsername ? `@${replyToUsername} ` : "");
    }
    setPosting(false);
  }

  return (
    <div className="flex gap-3 px-5 py-4 border-b border-[#282828] bg-[#080808]">
      <Avatar src={profile.avatar_url} alt={profile.display_name} size="sm" />
      <div className="flex-1 min-w-0 relative">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={e => mentions.handleChange(e.target.value)}
          onKeyDown={e => {
            if (mentions.handleKeyDown(e)) return;
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handlePost();
          }}
          placeholder="Write a reply…"
          rows={2}
          className="w-full bg-transparent text-sm text-[#F0F0F0] placeholder:text-[#555555] resize-none focus:outline-none leading-relaxed"
        />
        {mentions.mentionActive && (
          <MentionDropdown
            results={mentions.mentionResults}
            selectedIndex={mentions.selectedIndex}
            onSelect={mentions.selectMention}
            loading={mentions.mentionLoading}
          />
        )}
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-[#555555]">{content.length > 900 ? `${1000 - content.length} left` : ""}</span>
          <button
            onClick={handlePost}
            disabled={!content.trim() || posting}
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded bg-[#E8311A] text-white disabled:opacity-50 hover:bg-[#c9280f] active:scale-[0.98] transition-all duration-150"
          >
            {posting ? <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" /> : null}
            Huat 发
          </button>
        </div>
      </div>
    </div>
  );
}

interface PostThreadClientProps {
  initialPost: Post;
  initialReplies: Post[];
  profile: Profile | null;
  autoReply?: boolean;
}

export function PostThreadClient({ initialPost, initialReplies, profile, autoReply }: PostThreadClientProps) {
  const router = useRouter();
  const [post, setPost] = useState<Post>(initialPost);
  const [replies, setReplies] = useState<Post[]>(initialReplies);
  const isGuest = !profile;
  const angbao = useAngBaoToast();

  function gateLogin() {
    router.push("/login");
  }

  function handleReact(postId: string, type: string) {
    if (isGuest) { gateLogin(); return; }
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
    if (post.id === postId) setPost(p => update(p));
    setReplies(rs => rs.map(update));
    const target = post.id === postId ? post : replies.find(r => r.id === postId);
    const wasReacted = !!target?.user_reaction;
    fetch(`/api/posts/${postId}/react`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type }) });
    if (!wasReacted) angbao.showCredit("react", 0.25);
  }

  function handleSave(postId: string) {
    if (isGuest) { gateLogin(); return; }
    const p = post.id === postId ? post : replies.find(r => r.id === postId);
    const wasSaved = p?.is_saved;
    const update = (pp: Post): Post => pp.id === postId ? { ...pp, is_saved: !pp.is_saved } : pp;
    if (post.id === postId) setPost(pp => update(pp));
    setReplies(rs => rs.map(update));
    fetch(`/api/posts/${postId}/save`, { method: wasSaved ? "DELETE" : "POST" });
    if (!wasSaved) angbao.showCredit("save", 0.25);
  }

  function handleDelete(postId: string) {
    if (post.id === postId) { router.back(); return; }
    setReplies(rs => rs.filter(r => r.id !== postId));
    fetch(`/api/posts/${postId}`, { method: "DELETE" });
  }

  function handleEdit(postId: string, newContent: string) {
    const update = (p: Post): Post => p.id === postId ? { ...p, content: newContent } : p;
    if (post.id === postId) setPost(p => update(p));
    setReplies(rs => rs.map(update));
  }

  function handleRepost(postId: string) {
    if (isGuest) { gateLogin(); return; }
    const update = (p: Post): Post => p.id !== postId ? p : {
      ...p,
      user_reposted: !p.user_reposted,
      reposts_count: (p.reposts_count ?? 0) + (p.user_reposted ? -1 : 1),
    };
    if (post.id === postId) setPost(p => update(p));
    setReplies(rs => rs.map(update));
    fetch(`/api/posts/${postId}/repost`, { method: "POST" });
    const rp = post.id === postId ? post : replies.find(r => r.id === postId);
    if (!rp?.user_reposted) angbao.showCredit("repost", 0.50);
  }

  function handleVote(postId: string, optionId: string) {
    if (isGuest) { gateLogin(); return; }
    const update = (p: Post): Post => {
      if (p.id !== postId || !p.poll) return p;
      const poll = { ...p.poll };
      const counts = { ...(poll.vote_counts ?? {}) };
      if (poll.user_vote) counts[poll.user_vote] = Math.max(0, (counts[poll.user_vote] ?? 1) - 1);
      counts[optionId] = (counts[optionId] ?? 0) + 1;
      const total = Object.values(counts).reduce((s, v) => s + v, 0);
      return { ...p, poll: { ...poll, vote_counts: counts, user_vote: optionId, total_votes: total } };
    };
    if (post.id === postId) setPost(p => update(p));
    setReplies(rs => rs.map(update));
    fetch(`/api/posts/${postId}/vote`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ option_id: optionId }) });
  }

  function handleReply(newPost: Post) {
    setReplies(rs => [...rs, newPost]);
    setPost(p => ({ ...p, replies_count: (p.replies_count ?? 0) + 1 }));
    angbao.showCredit("reply", 1);
  }

  return (
    <div>
      {/* Back header */}
      <div className={`sticky ${isGuest ? "top-14" : "top-14"} z-10 flex items-center gap-3 px-4 py-3 border-b border-[#282828] bg-[#0A0A0A]/95 backdrop-blur-md`}>
        <button onClick={() => isGuest ? router.push("/") : router.back()} className="w-8 h-8 flex items-center justify-center rounded-lg text-[#71717A] hover:text-[#F0F0F0] hover:bg-[#141414] transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <p className="text-sm font-bold text-[#F0F0F0]">Post</p>
      </div>

      <PostCard
        post={post}
        currentUserId={profile?.id}
        currentUserProfile={profile ?? undefined}
        onReact={handleReact}
        onSave={handleSave}
        onRepost={handleRepost}
        onVote={handleVote}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {profile ? (
        <ReplyComposer parentId={post.id} profile={profile} onReply={handleReply} autoFocus={autoReply} replyToUsername={post.author?.username !== profile?.username ? post.author?.username : undefined} />
      ) : (
        <div className="px-5 py-5">
          <div className="flex flex-col items-center gap-3 py-4">
            <p className="text-sm text-[#9CA3AF]">Join the conversation on Huat.co</p>
            <LoadingLink
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold rounded bg-[#E8311A] text-white hover:bg-[#c9280f] transition-colors"
            >
              Sign up to reply — it&apos;s free
            </LoadingLink>
          </div>
        </div>
      )}

      {replies.length === 0 && !isGuest && (
        <div className="flex flex-col items-center justify-center py-16 text-center px-8">
          <p className="text-[#555555] text-sm">No replies yet. Be the first!</p>
        </div>
      )}

      {replies.length > 0 && (
        <div>
          <div className="px-5 py-2 border-b border-[#1C1C1C]">
            <p className="text-xs font-bold text-[#555555] uppercase tracking-wider">
              {replies.length} {replies.length === 1 ? "Reply" : "Replies"}
            </p>
          </div>
          {replies.map(reply => (
            <PostCard
              key={reply.id}
              post={reply}
              currentUserId={profile?.id}
              currentUserProfile={profile ?? undefined}
              onReact={handleReact}
              onSave={handleSave}
              onRepost={handleRepost}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

    </div>
  );
}
