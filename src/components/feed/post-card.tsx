"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

function decodeHtml(str: string | null | undefined): string {
  if (!str) return "";
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&nbsp;/g, " ");
}

function shortenUrl(url: string): string {
  try {
    const { hostname, pathname } = new URL(url);
    const host = hostname.replace(/^www\./, "");
    return pathname.length > 1 ? `${host}/…` : host;
  } catch { return url; }
}

function renderTextWithLinks(text: string) {
  const parts = text.split(/(https?:\/\/[^\s]+)/g);
  return parts.map((part, i) =>
    /^https?:\/\//.test(part) ? (
      <a key={i} href={part} target="_blank" rel="noopener noreferrer"
        className="text-[#E8311A]/50 hover:text-[#E8311A]/80 transition-colors"
        onClick={e => e.stopPropagation()}
      >{shortenUrl(part)}</a>
    ) : part
  );
}
import { ThumbsUp, MessageCircle, Repeat2, Share2, Bookmark, MoreHorizontal, TrendingUp, TrendingDown, Flag, Pencil, Trash2, Send, PenLine, X } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn, timeAgo, timeLeft, formatPrice } from "@/lib/utils";
import type { Post, Sentiment, Profile } from "@/types/database";

interface PostCardProps {
  post: Post;
  currentUserId?: string;
  currentUserProfile?: Profile;
  onReact?: (postId: string, type: string) => void;
  onSave?: (postId: string) => void;
  onRepost?: (postId: string) => void;
  onEdit?: (postId: string, newContent: string) => void;
  onDelete?: (postId: string) => void;
  onReply?: (postId: string, newReply: Post) => void;
  onQuote?: (post: Post) => void;
  onVote?: (postId: string, optionId: string) => void;
  isNew?: boolean;
}


function SentimentIcon({ sentiment }: { sentiment: Sentiment | null }) {
  if (!sentiment) return null;
  if (sentiment === "bullish") return <TrendingUp className="w-3.5 h-3.5 text-[#22C55E]" />;
  if (sentiment === "bearish") return <TrendingDown className="w-3.5 h-3.5 text-[#EF4444]" />;
  return null;
}

function ImageLightbox({ images, startIndex, onClose }: { images: string[]; startIndex: number; onClose: () => void }) {
  const [idx, setIdx] = useState(startIndex);
  const touchStartX = useRef(0);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") setIdx(i => Math.max(0, i - 1));
      if (e.key === "ArrowRight") setIdx(i => Math.min(images.length - 1, i + 1));
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [images.length, onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close */}
      <button onClick={onClose} className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-[#282828]/80 text-white hover:bg-[#333333] transition-colors">
        <X className="w-5 h-5" />
      </button>

      {/* Counter */}
      {images.length > 1 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 text-sm text-[#9CA3AF] font-mono">
          {idx + 1} / {images.length}
        </div>
      )}

      {/* Prev */}
      {idx > 0 && (
        <button
          onClick={e => { e.stopPropagation(); setIdx(i => i - 1); }}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-[#282828]/80 text-white hover:bg-[#333333] transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
      )}

      {/* Next */}
      {idx < images.length - 1 && (
        <button
          onClick={e => { e.stopPropagation(); setIdx(i => i + 1); }}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-[#282828]/80 text-white hover:bg-[#333333] transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
        </button>
      )}

      {/* Image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={images[idx]}
        alt=""
        className="max-w-[90vw] max-h-[90vh] object-contain select-none"
        onClick={e => e.stopPropagation()}
        onTouchStart={e => { touchStartX.current = e.touches[0].clientX; }}
        onTouchEnd={e => {
          const dx = e.changedTouches[0].clientX - touchStartX.current;
          if (dx > 50 && idx > 0) setIdx(i => i - 1);
          if (dx < -50 && idx < images.length - 1) setIdx(i => i + 1);
        }}
        draggable={false}
      />
    </div>
  );
}

function AttachmentGrid({ attachments }: { attachments: Post["attachments"] }) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  if (!attachments?.length) return null;
  const count = Math.min(attachments.length, 4);
  const items = attachments.slice(0, count);
  const imageUrls = items.filter(a => a.type === "image").map(a => a.url);

  const gridClass = {
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-2",
    4: "grid-cols-2",
  }[count] ?? "grid-cols-2";

  // Map grid index to image-only index for lightbox
  let imageCounter = 0;

  return (
    <>
      <div className={cn("grid gap-1 rounded overflow-hidden mt-3", gridClass)}>
        {items.map((att, i) => {
          const imageIdx = att.type === "image" ? imageCounter++ : -1;
          return (
            <div
              key={i}
              className={cn(
                "bg-[#141414] overflow-hidden",
                count === 3 && i === 0 ? "row-span-2" : "",
                att.type === "pdf" ? "" : "aspect-video",
                att.type === "image" ? "cursor-pointer" : ""
              )}
              onClick={att.type === "image" ? (e) => { e.stopPropagation(); setLightboxIdx(imageIdx); } : undefined}
            >
              {att.type === "video" ? (
                <video
                  src={att.url}
                  controls
                  preload="metadata"
                  className="w-full h-full object-cover"
                  onClick={e => e.stopPropagation()}
                />
              ) : att.type === "pdf" ? (
                <a
                  href={att.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 hover:bg-[#1C1C1C] transition-colors"
                  onClick={e => e.stopPropagation()}
                >
                  <svg className="w-8 h-8 text-[#E8311A] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
                    <path d="M14 2v6h6" />
                  </svg>
                  <div className="min-w-0">
                    <p className="text-sm text-[#F0F0F0] font-medium truncate">{decodeURIComponent(att.url.split("/").pop() ?? "Document.pdf")}</p>
                    <p className="text-xs text-[#555555]">PDF · Tap to open</p>
                  </div>
                </a>
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={att.url}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              )}
            </div>
          );
        })}
      </div>
      {lightboxIdx !== null && (
        <ImageLightbox
          images={imageUrls}
          startIndex={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
        />
      )}
    </>
  );
}

function PollDisplay({ poll, postId, onVote }: { poll: NonNullable<Post["poll"]>; postId: string; onVote?: (postId: string, optionId: string) => void }) {
  const total = poll.total_votes ?? 0;
  const voted = !!poll.user_vote;
  const expired = poll.ends_at ? new Date(poll.ends_at) < new Date() : false;
  const showResults = voted || expired;

  return (
    <div className="mt-3 space-y-2">
      {poll.options.map(opt => {
        const votes = poll.vote_counts?.[opt.id] ?? 0;
        const pct = total > 0 ? Math.round((votes / total) * 100) : 0;
        const isVoted = poll.user_vote === opt.id;

        return (
          <button
            key={opt.id}
            onClick={e => { e.stopPropagation(); if (!showResults) onVote?.(postId, opt.id); }}
            className={cn(
              "w-full relative text-left px-3 py-2 rounded border text-sm overflow-hidden transition-colors",
              isVoted
                ? "border-[#E8311A] text-[#F0F0F0]"
                : showResults
                  ? "border-[#282828] text-[#9CA3AF] cursor-default"
                  : "border-[#333333] text-[#9CA3AF] hover:border-[#555555] hover:text-[#F0F0F0]"
            )}
            disabled={showResults}
          >
            {showResults && (
              <div
                className={cn("absolute inset-y-0 left-0 transition-all duration-500", isVoted ? "bg-[#E8311A]/15" : "bg-[#9CA3AF]/10")}
                style={{ width: `${pct}%` }}
              />
            )}
            <span className="relative flex items-center justify-between">
              <span>{opt.text}</span>
              {showResults && <span className="text-xs font-bold">{pct}%</span>}
            </span>
          </button>
        );
      })}
      <p className="text-xs text-[#555555]">
        {total} vote{total !== 1 ? "s" : ""}
        {poll.ends_at && !expired && ` · ${timeLeft(poll.ends_at)}`}
        {expired && " · Ended"}
      </p>
    </div>
  );
}

function LiveCountdown({ targetDate }: { targetDate: string }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, Math.floor((new Date(targetDate).getTime() - now) / 1000));
  const d = Math.floor(diff / 86400);
  const h = Math.floor((diff % 86400) / 3600);
  const m = Math.floor((diff % 3600) / 60);
  const s = diff % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <span className="font-mono tabular-nums inline-flex items-center gap-1">
      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
      {d > 0 && <>{d} {d === 1 ? "Day" : "Days"} </>}
      {pad(h)}:{pad(m)}:{pad(s)} Left
    </span>
  );
}

function ForecastDisplay({ forecast }: { forecast: NonNullable<Post["forecast"]> }) {
  const targetDate = new Date(forecast.target_date);
  const isPending = forecast.outcome === "pending";
  const isExpired = targetDate < new Date();

  return (
    <div className="mt-3 border border-[#282828] rounded-lg overflow-hidden bg-[#0A0A0A]">
      {/* Countdown / status bar */}
      <div className={cn(
        "flex items-center justify-between px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider",
        forecast.outcome === "hit" ? "bg-[#22C55E]/10 text-[#22C55E]"
          : forecast.outcome === "missed" ? "bg-[#EF4444]/10 text-[#EF4444]"
          : "bg-[#E8311A]/10 text-[#E8311A]"
      )}>
        <span>Prediction</span>
        {isPending && !isExpired ? (
          <LiveCountdown targetDate={forecast.target_date} />
        ) : (
          <span>{forecast.outcome === "hit" ? "✓ Hit" : forecast.outcome === "missed" ? "✗ Missed" : "Expired"}</span>
        )}
      </div>
      {/* Body */}
      <div className="flex items-center justify-between px-3 py-2.5">
        <div>
          <p className="text-lg font-bold text-[#F0F0F0] font-mono">{formatPrice(forecast.target_price)}</p>
          <p className="text-[11px] text-[#555555]">by {targetDate.toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" })}</p>
        </div>
        <div className="text-right">
          {forecast.current_price != null && (
            <p className="text-xs text-[#9CA3AF]">Now: <span className="font-mono font-bold text-[#F0F0F0]">{formatPrice(forecast.current_price)}</span></p>
          )}
        </div>
      </div>
    </div>
  );
}

function EditModal({
  content,
  onSave,
  onClose,
  saving,
}: {
  content: string;
  onSave: (text: string) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [text, setText] = useState(content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
    textareaRef.current?.setSelectionRange(text.length, text.length);
  }, [text.length]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={onClose}>
      <div
        className="bg-[#141414] border border-[#333333] rounded-lg w-full max-w-lg p-5 shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-sm font-bold text-[#F0F0F0] mb-3">Edit post</h2>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => setText(e.target.value)}
          maxLength={1000}
          rows={5}
          className="w-full bg-[#0A0A0A] border border-[#333333] rounded px-3 py-2 text-sm text-[#F0F0F0] placeholder:text-[#71717A] resize-none focus:outline-none focus:border-[#444444] transition-colors"
        />
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-[#71717A]">{text.length}/1000</span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-sm text-[#9CA3AF] hover:text-[#F0F0F0] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(text)}
              disabled={saving || !text.trim() || text === content}
              className="px-4 py-1.5 text-sm font-semibold bg-[#E8311A] text-white rounded hover:bg-[#c9280f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MoreMenu({
  isOwn,
  onEdit,
  onDelete,
}: {
  isOwn: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="opacity-0 group-hover:opacity-100 text-[#71717A] hover:text-[#9CA3AF] transition-all"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-6 z-20 bg-[#141414] border border-[#333333] rounded-lg shadow-xl min-w-[140px] py-1 overflow-hidden">
          {isOwn ? (
            <>
              <button
                onClick={() => { setOpen(false); onEdit(); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[#F0F0F0] hover:bg-[#282828] transition-colors"
              >
                <Pencil className="w-3.5 h-3.5 text-[#9CA3AF]" />
                Edit post
              </button>
              <button
                onClick={() => { setOpen(false); onDelete(); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[#EF4444] hover:bg-[#282828] transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete post
              </button>
            </>
          ) : (
            <button
              onClick={() => setOpen(false)}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[#9CA3AF] hover:bg-[#282828] transition-colors"
            >
              <Flag className="w-3.5 h-3.5" />
              Report post
            </button>
          )}
        </div>
      )}
    </div>
  );
}

interface OgData { og_title?: string | null; og_description?: string | null; og_image?: string | null; og_site_name?: string | null; }

export function PostCard({ post, currentUserId, currentUserProfile, onReact, onSave, onRepost, onEdit, onDelete, onReply, onQuote, onVote, isNew }: PostCardProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [localContent, setLocalContent] = useState(post.content);
  const [inlineOg, setInlineOg] = useState<(OgData & { url: string }) | null>(null);
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [replyPosting, setReplyPosting] = useState(false);
  const [localRepliesCount, setLocalRepliesCount] = useState(post.replies_count ?? 0);
  const [repostMenuOpen, setRepostMenuOpen] = useState(false);
  const replyRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (post.post_type !== "post") return;
    const isNewsEmbed = /\n\n📰 /.test(post.content ?? "");
    if (isNewsEmbed) return;
    // Skip if we already have stored OG data
    const hasOgData = post.attachments?.some(a => a.type === "link" && (a.og_title || a.og_image));
    if (hasOgData) return;
    const match = post.content?.match(/https?:\/\/[^\s]+/);
    if (!match) return;
    const url = match[0];
    fetch(`/api/og?url=${encodeURIComponent(url)}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.og_title || d?.og_image) setInlineOg({ url, ...d }); })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post.id]);

  const reactions = post.reactions_count ?? { like: 0, fire: 0, rocket: 0, bear: 0, total: 0 };
  const isOwn = !!currentUserId && post.author_id === currentUserId;

  async function handleSaveEdit(newContent: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newContent }),
      });
      if (res.ok) {
        setLocalContent(newContent);
        onEdit?.(post.id, newContent);
        setEditing(false);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this post? This cannot be undone.")) return;
    await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
    onDelete?.(post.id);
  }

  return (
    <div>
      {editing && (
        <EditModal
          content={localContent}
          onSave={handleSaveEdit}
          onClose={() => setEditing(false)}
          saving={saving}
        />
      )}

      <article className={cn("px-5 pt-5 pb-4 hover:bg-[#0D0D0D] transition-colors group relative overflow-hidden", isNew && "animate-highlight")}>
        <div className="flex gap-3">
          {/* Avatar */}
          <Link href={`/profile/${post.author?.username}`} className="flex-shrink-0">
            <Avatar src={post.author?.avatar_url} alt={post.author?.display_name ?? "User"} size="md" />
          </Link>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Link href={`/profile/${post.author?.username}`} className="font-bold text-[#9CA3AF] hover:underline text-sm">
                  {post.author?.display_name}
                </Link>
                <span className="text-[#9CA3AF] text-xs">·</span>
                <span className="text-[#9CA3AF] text-xs">{timeAgo(post.created_at)}</span>
                {post.updated_at !== post.created_at && (
                  <span className="text-[#9CA3AF] text-xs">· edited</span>
                )}
              </div>
              <MoreMenu isOwn={isOwn} onEdit={() => setEditing(true)} onDelete={handleDelete} />
            </div>


            {/* Post text — parse news embeds, render URLs as links */}
            {(() => {
              const sentimentColor = post.sentiment === "bullish" ? "#22C55E" : post.sentiment === "bearish" ? "#EF4444" : "#E8311A";
              const tickerPrefix = post.tagged_stocks?.length > 0
                ? post.tagged_stocks.map(ticker => {
                    const displayTicker = ticker.replace(/ SP$/, "");
                    return (
                      <Link
                        key={ticker}
                        href={`/stocks/${ticker}`}
                        onClick={e => e.stopPropagation()}
                        className="inline-flex items-center gap-0.5 text-xs font-mono tracking-wider mr-1.5 border border-[#333333] rounded px-1.5 py-0.5 text-[#F0F0F0] bg-[#1C1C1C] hover:bg-[#282828] transition-colors"
                        style={{ verticalAlign: "middle" }}
                      >
                        {post.sentiment && (
                          <span style={{ color: sentimentColor, marginRight: 3 }}>
                            <SentimentIcon sentiment={post.sentiment} />
                          </span>
                        )}
                        {displayTicker}
                      </Link>
                    );
                  })
                : null;

              // News posts have format: "{user text}\n\n📰 {title} — {source}\n{url}"
              const newsMatch = localContent.match(/^([\s\S]*?)\n\n📰 ([\s\S]+?) — (.+?)\n(https?:\/\/\S+)\s*$/);
              if (newsMatch) {
                const [, userText, title, source, url] = newsMatch;
                return (
                  <>
                    {(tickerPrefix || userText.trim()) && (
                      <p className="text-sm text-[#F0F0F0] leading-relaxed mb-2">
                        {tickerPrefix}{renderTextWithLinks(userText.trim())}
                      </p>
                    )}
                    <a href={url} target="_blank" rel="noopener noreferrer"
                      className="block border border-[#282828] rounded p-3 bg-[#141414] hover:border-[#444444] transition-colors"
                      onClick={e => e.stopPropagation()}
                    >
                      <p className="text-xs text-[#555555] mb-1">{source}</p>
                      <p className="text-sm text-[#9CA3AF] leading-snug line-clamp-2">{title}</p>
                    </a>
                  </>
                );
              }
              return (
                <p className="text-sm text-[#F0F0F0] leading-relaxed">
                  {tickerPrefix}{renderTextWithLinks(localContent)}
                </p>
              );
            })()}

            {/* Link preview — stored attachment or inline OG fetch (plain posts only) */}
            {(() => {
              const linkAttachment = ["post", "poll", "forecast"].includes(post.post_type) ? post.attachments?.find(a => a.type === "link") : undefined;
              const storedOg = linkAttachment?.og_title || linkAttachment?.og_image
                ? { url: linkAttachment.url, og_title: linkAttachment.og_title, og_description: linkAttachment.og_description, og_image: linkAttachment.og_image, og_site_name: linkAttachment.og_site_name }
                : null;
              const og = storedOg ?? inlineOg;
              if (!og || (!og.og_title && !og.og_image)) return null;
              return (
                <a href={og.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-stretch mt-2 border border-[#282828] rounded-lg overflow-hidden bg-[#0D0D0D] hover:border-[#444444] transition-colors"
                  onClick={e => e.stopPropagation()}
                >
                  {/* Thumbnail — real image or placeholder */}
                  <div className="w-1/3 min-h-[160px] flex-shrink-0 bg-[#141414] flex items-center justify-center overflow-hidden">
                    {og.og_image ? (
                      <img src={og.og_image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <svg className="w-6 h-6 text-[#333333]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <path d="M3 9h18M9 21V9" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 px-3 py-2.5 flex flex-col justify-start gap-1">
                    {og.og_site_name && <p className="text-[10px] text-[#555555] uppercase tracking-wide">{decodeHtml(og.og_site_name)}</p>}
                    {og.og_title && <p className="text-sm text-[#9CA3AF] leading-snug line-clamp-3">{decodeHtml(og.og_title)}</p>}
                    {og.og_description && <p className="text-xs text-[#555555] leading-snug line-clamp-4">{decodeHtml(og.og_description)}</p>}
                  </div>
                </a>
              );
            })()}

            {/* Attachments (images/video only) */}
            {post.post_type === "post" && <AttachmentGrid attachments={post.attachments?.filter(a => a.type !== "link")} />}

            {/* Poll */}
            {post.post_type === "poll" && post.poll && <PollDisplay poll={post.poll} postId={post.id} onVote={onVote} />}

            {/* Forecast */}
            {post.post_type === "forecast" && post.forecast && <ForecastDisplay forecast={post.forecast} />}

            {/* Quoted post embed */}
            {post.quoted_post && (
              <Link
                href={`/post/${post.quoted_post.id}`}
                className="mt-3 block rounded-lg border-l-2 border-l-[#E8311A]/40 border border-[#222222] bg-[#0A0A0A] hover:bg-[#111111] transition-colors pl-3 pr-3.5 py-2.5"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center gap-1.5">
                  <Repeat2 className="w-3 h-3 text-[#555555]" />
                  <span className="text-[10px] text-[#555555] font-medium uppercase tracking-wider">Quoting</span>
                  <span className="text-[10px] text-[#555555]">·</span>
                  <span className="text-xs font-semibold text-[#71717A]">{post.quoted_post.author?.display_name}</span>
                  <span className="text-[10px] text-[#444444]">{timeAgo(post.quoted_post.created_at)}</span>
                </div>
                <p className="text-xs text-[#9CA3AF] line-clamp-3 leading-relaxed mt-1">{post.quoted_post.content}</p>
              </Link>
            )}


            {/* Actions */}
            <div className="flex items-center mt-4 -ml-2 gap-2">
              {/* Reply — icon toggles composer, count navigates to thread */}
              <div className="flex items-center">
                <button
                  onClick={e => { e.stopPropagation(); setReplyOpen(o => !o); setTimeout(() => replyRef.current?.focus(), 50); }}
                  className={cn("flex items-center justify-center w-9 h-9 rounded-full transition-colors", replyOpen ? "text-[#E8311A]" : "text-[#9CA3AF] hover:text-[#C0C0C0] hover:bg-[#1A1A1A]")}
                >
                  <MessageCircle className="w-4 h-4" />
                </button>
                {localRepliesCount > 0 ? (
                  <button
                    onClick={e => { e.stopPropagation(); router.push(`/post/${post.id}`); }}
                    className="text-xs text-[#9CA3AF] hover:text-[#C0C0C0] hover:underline transition-colors -ml-1 pr-1"
                  >
                    {localRepliesCount}
                  </button>
                ) : (
                  <span className="text-xs text-[#9CA3AF] -ml-1 pr-1">{localRepliesCount}</span>
                )}
              </div>

              {/* Repost / Quote */}
              <div className="relative">
                <button
                  onClick={e => { e.stopPropagation(); setRepostMenuOpen(o => !o); }}
                  className={cn(
                    "flex items-center gap-1.5 h-9 px-2 rounded-full transition-colors hover:bg-[#1A1A1A]",
                    post.user_reposted ? "text-[#22C55E]" : "text-[#9CA3AF] hover:text-[#22C55E]"
                  )}
                >
                  <Repeat2 className="w-4 h-4" />
                  {(post.reposts_count ?? 0) > 0 && <span className="text-xs">{post.reposts_count}</span>}
                </button>
                {repostMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={e => { e.stopPropagation(); setRepostMenuOpen(false); }} />
                    <div className="absolute left-0 bottom-full mb-1 z-50 bg-[#1C1C1C] border border-[#333333] rounded-lg shadow-xl py-1 min-w-[140px]">
                      <button
                        onClick={e => { e.stopPropagation(); setRepostMenuOpen(false); onRepost?.(post.id); }}
                        className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-sm text-[#F0F0F0] hover:bg-[#282828] transition-colors"
                      >
                        <Repeat2 className="w-4 h-4 text-[#22C55E]" />
                        Repost
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); setRepostMenuOpen(false); onQuote?.(post); }}
                        className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-sm text-[#F0F0F0] hover:bg-[#282828] transition-colors"
                      >
                        <PenLine className="w-4 h-4 text-[#9CA3AF]" />
                        Quote
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Like (Thumbs up) */}
              <button
                onClick={() => onReact?.(post.id, "like")}
                className={cn("flex items-center gap-1.5 h-9 px-2 rounded-full hover:bg-[#1A1A1A] transition-colors", post.user_reaction ? "text-[#E8311A]" : "text-[#9CA3AF] hover:text-[#E8311A]")}
              >
                <ThumbsUp className={cn("w-4 h-4", post.user_reaction && "fill-current")} />
                <span className="text-xs">{reactions.total}</span>
              </button>

              {/* Save */}
              <button
                onClick={() => onSave?.(post.id)}
                className={cn(
                  "flex items-center justify-center w-9 h-9 rounded-full transition-colors hover:bg-[#1A1A1A]",
                  post.is_saved ? "text-[#F0F0F0]" : "text-[#9CA3AF] hover:text-[#F0F0F0]"
                )}
              >
                <Bookmark className={cn("w-4 h-4", post.is_saved && "fill-current")} />
              </button>

              {/* Share */}
              <button className="flex items-center justify-center w-9 h-9 rounded-full text-[#9CA3AF] hover:text-[#C0C0C0] hover:bg-[#1A1A1A] transition-colors ml-auto">
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Latest reply preview — inside the article so it's clearly part of this post */}
        {post.latest_reply && !replyOpen && (
          <Link
            href={`/post/${post.id}`}
            className="flex items-center gap-2.5 mt-3 ml-11 mr-0 pl-3 py-2 rounded-lg bg-[#111111] border border-[#222222] hover:border-[#333333] hover:bg-[#151515] transition-colors"
            onClick={e => e.stopPropagation()}
          >
            <Avatar src={post.latest_reply.author?.avatar_url ?? null} alt={post.latest_reply.author?.display_name ?? "User"} size="xs" />
            <span className="text-xs font-semibold text-[#71717A] whitespace-nowrap">{post.latest_reply.author?.display_name}</span>
            <span className="text-xs text-[#444444] line-clamp-1 flex-1 min-w-0 pr-3">{post.latest_reply.content}</span>
          </Link>
        )}
      </article>

      {/* Inline reply composer */}
      {replyOpen && currentUserProfile && (
        <div className="px-5 pb-4 bg-[#080808]" onClick={e => e.stopPropagation()}>
          <div className="ml-11">
            <textarea
              ref={replyRef}
              value={replyContent}
              onChange={e => setReplyContent(e.target.value)}
              onKeyDown={async e => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (!replyContent.trim() || replyPosting) return;
                  setReplyPosting(true);
                  const res = await fetch("/api/posts", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ content: replyContent.trim(), parent_id: post.id, post_type: "post" }),
                  });
                  if (res.ok) {
                    const { post: newReply } = await res.json();
                    setLocalRepliesCount(c => c + 1);
                    setReplyContent("");
                    setReplyOpen(false);
                    onReply?.(post.id, newReply);
                  }
                  setReplyPosting(false);
                }
              }}
              placeholder="What are your thoughts? 发!"
              rows={3}
              className="w-full bg-transparent text-sm text-[#F0F0F0] placeholder:text-[#555555] resize-none focus:outline-none leading-relaxed border border-[#333333] rounded-lg px-3 py-2.5 focus:border-[#555555] transition-colors"
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={async () => {
                  if (!replyContent.trim() || replyPosting) return;
                  setReplyPosting(true);
                  const res = await fetch("/api/posts", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ content: replyContent.trim(), parent_id: post.id, post_type: "post" }),
                  });
                  if (res.ok) {
                    const { post: newReply } = await res.json();
                    setLocalRepliesCount(c => c + 1);
                    setReplyContent("");
                    setReplyOpen(false);
                    onReply?.(post.id, newReply);
                  }
                  setReplyPosting(false);
                }}
                disabled={!replyContent.trim() || replyPosting}
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded bg-[#E8311A] text-white disabled:opacity-50 hover:bg-[#c9280f] active:scale-[0.98] transition-all duration-150"
              >
                {replyPosting ? <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" /> : null}
                Huat 发
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
