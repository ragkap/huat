"use client";
import { useState } from "react";
import Link from "next/link";
import { Heart, MessageCircle, Repeat2, Share2, Bookmark, MoreHorizontal, TrendingUp, TrendingDown, Flag } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn, timeAgo, formatPrice } from "@/lib/utils";
import type { Post, Sentiment } from "@/types/database";

interface PostCardProps {
  post: Post;
  onReact?: (postId: string, type: string) => void;
  onSave?: (postId: string) => void;
  onRepost?: (postId: string) => void;
}

const REACTIONS = [
  { type: "like", emoji: "❤️", label: "Like" },
  { type: "fire", emoji: "🔥", label: "Fire" },
  { type: "rocket", emoji: "🚀", label: "Rocket" },
  { type: "bear", emoji: "🐻", label: "Bear" },
];

function SentimentIcon({ sentiment }: { sentiment: Sentiment | null }) {
  if (!sentiment) return null;
  if (sentiment === "bullish") return <TrendingUp className="w-3.5 h-3.5 text-[#22C55E]" />;
  if (sentiment === "bearish") return <TrendingDown className="w-3.5 h-3.5 text-[#EF4444]" />;
  return null;
}

function AttachmentGrid({ attachments }: { attachments: Post["attachments"] }) {
  if (!attachments?.length) return null;
  const count = Math.min(attachments.length, 4);
  const items = attachments.slice(0, count);

  const gridClass = {
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-2",
    4: "grid-cols-2",
  }[count] ?? "grid-cols-2";

  return (
    <div className={cn("grid gap-1 rounded overflow-hidden mt-3", gridClass)}>
      {items.map((att, i) => (
        <div
          key={i}
          className={cn(
            "bg-[#282828] overflow-hidden",
            count === 3 && i === 0 ? "row-span-2" : "",
            "aspect-video"
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={att.url}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      ))}
    </div>
  );
}

function PollDisplay({ poll }: { poll: NonNullable<Post["poll"]> }) {
  const total = poll.total_votes ?? 0;
  const voted = !!poll.user_vote;
  const expired = poll.ends_at ? new Date(poll.ends_at) < new Date() : false;

  return (
    <div className="mt-3 space-y-2">
      {poll.options.map(opt => {
        const votes = poll.vote_counts?.[opt.id] ?? 0;
        const pct = total > 0 ? Math.round((votes / total) * 100) : 0;
        const isVoted = poll.user_vote === opt.id;

        return (
          <button
            key={opt.id}
            className={cn(
              "w-full relative text-left px-3 py-2 rounded border text-sm overflow-hidden transition-colors",
              isVoted
                ? "border-[#E8311A] text-[#F0F0F0]"
                : "border-[#333333] text-[#9CA3AF] hover:border-[#444444]",
              (voted || expired) && "cursor-default"
            )}
            disabled={voted || expired}
          >
            {(voted || expired) && (
              <div
                className={cn("absolute inset-y-0 left-0 opacity-10", isVoted ? "bg-[#E8311A]" : "bg-[#9CA3AF]")}
                style={{ width: `${pct}%` }}
              />
            )}
            <span className="relative flex items-center justify-between">
              <span>{opt.text}</span>
              {(voted || expired) && <span className="text-xs font-bold">{pct}%</span>}
            </span>
          </button>
        );
      })}
      <p className="text-xs text-[#71717A]">
        {total} vote{total !== 1 ? "s" : ""}
        {poll.ends_at && !expired && ` · ${timeAgo(poll.ends_at)} left`}
        {expired && " · Ended"}
      </p>
    </div>
  );
}

function ForecastDisplay({ forecast }: { forecast: NonNullable<Post["forecast"]> }) {
  const outcomeColors = {
    pending: "text-[#9CA3AF]",
    hit: "text-[#22C55E]",
    missed: "text-[#EF4444]",
  };

  return (
    <div className="mt-3 border border-[#333333] rounded p-3 bg-[#0F0F0F]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-[#9CA3AF] uppercase tracking-wider mb-1">Price Forecast</p>
          <p className="text-lg font-bold text-[#F0F0F0] font-mono">{formatPrice(forecast.target_price)}</p>
          <p className="text-xs text-[#9CA3AF]">by {new Date(forecast.target_date).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" })}</p>
        </div>
        <div className={cn("text-right", outcomeColors[forecast.outcome])}>
          <span className="text-sm font-bold uppercase">{forecast.outcome}</span>
          {forecast.current_price && (
            <p className="text-xs text-[#9CA3AF] mt-1">Current: {formatPrice(forecast.current_price)}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function PostCard({ post, onReact, onSave, onRepost }: PostCardProps) {
  const [showReactions, setShowReactions] = useState(false);
  const reactions = post.reactions_count ?? { like: 0, fire: 0, rocket: 0, bear: 0, total: 0 };

  const sentimentVariant = post.sentiment === "bullish" ? "bullish" : post.sentiment === "bearish" ? "bearish" : "neutral";

  return (
    <article className="border-b border-[#282828] px-5 py-4 hover:bg-[#0D0D0D] transition-colors group">
      <div className="flex gap-3">
        {/* Avatar */}
        <Link href={`/profile/${post.author?.username}`} className="flex-shrink-0">
          <Avatar src={post.author?.avatar_url} alt={post.author?.display_name ?? "User"} size="md" />
        </Link>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Link href={`/profile/${post.author?.username}`} className="font-bold text-[#F0F0F0] hover:underline text-sm">
                {post.author?.display_name}
              </Link>
              <span className="text-[#71717A] text-sm">@{post.author?.username}</span>
              <span className="text-[#71717A] text-xs">·</span>
              <span className="text-[#71717A] text-xs">{timeAgo(post.created_at)}</span>
            </div>
            <button className="opacity-0 group-hover:opacity-100 text-[#71717A] hover:text-[#9CA3AF] transition-all">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>

          {/* Sentiment + Type badges */}
          {(post.sentiment || post.post_type !== "post") && (
            <div className="flex items-center gap-1.5 mb-2">
              {post.sentiment && (
                <Badge variant={sentimentVariant}>
                  <SentimentIcon sentiment={post.sentiment} />
                  <span className="ml-1 capitalize">{post.sentiment}</span>
                </Badge>
              )}
              {post.post_type === "poll" && <Badge variant="brand">Poll</Badge>}
              {post.post_type === "forecast" && <Badge variant="brand">Forecast</Badge>}
            </div>
          )}

          {/* Post text */}
          <p className="text-sm text-[#F0F0F0] leading-relaxed whitespace-pre-wrap">{post.content}</p>

          {/* Attachments */}
          {post.post_type === "post" && <AttachmentGrid attachments={post.attachments} />}

          {/* Poll */}
          {post.post_type === "poll" && post.poll && <PollDisplay poll={post.poll} />}

          {/* Forecast */}
          {post.post_type === "forecast" && post.forecast && <ForecastDisplay forecast={post.forecast} />}

          {/* Stock tags */}
          {post.tagged_stocks?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {post.tagged_stocks.map(ticker => (
                <Link
                  key={ticker}
                  href={`/stocks/${ticker}`}
                  className="text-xs text-[#E8311A] hover:underline font-mono font-medium bg-[#E8311A]/5 px-2 py-0.5 rounded border border-[#E8311A]/20"
                >
                  ${ticker}
                </Link>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-5 mt-3">
            {/* Reply */}
            <Link
              href={`/post/${post.id}`}
              className="flex items-center gap-1.5 text-[#71717A] hover:text-[#9CA3AF] transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="text-xs">{post.replies_count ?? 0}</span>
            </Link>

            {/* Repost */}
            <button
              onClick={() => onRepost?.(post.id)}
              className="flex items-center gap-1.5 text-[#71717A] hover:text-[#22C55E] transition-colors"
            >
              <Repeat2 className="w-4 h-4" />
              <span className="text-xs">{post.reposts_count ?? 0}</span>
            </button>

            {/* Reactions */}
            <div className="relative">
              <button
                onMouseEnter={() => setShowReactions(true)}
                onMouseLeave={() => setShowReactions(false)}
                onClick={() => onReact?.(post.id, "like")}
                className="flex items-center gap-1.5 text-[#71717A] hover:text-[#E8311A] transition-colors"
              >
                <Heart className={cn("w-4 h-4", post.user_reaction && "fill-[#E8311A] text-[#E8311A]")} />
                <span className="text-xs">{reactions.total}</span>
              </button>
              {showReactions && (
                <div
                  className="absolute bottom-full left-0 mb-1 flex items-center gap-1 bg-[#282828] border border-[#333333] rounded-full px-2 py-1"
                  onMouseEnter={() => setShowReactions(true)}
                  onMouseLeave={() => setShowReactions(false)}
                >
                  {REACTIONS.map(r => (
                    <button
                      key={r.type}
                      onClick={() => onReact?.(post.id, r.type)}
                      className="text-base hover:scale-125 transition-transform"
                      title={r.label}
                    >
                      {r.emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Save */}
            <button
              onClick={() => onSave?.(post.id)}
              className={cn(
                "text-[#71717A] hover:text-[#F0F0F0] transition-colors",
                post.is_saved && "text-[#F0F0F0]"
              )}
            >
              <Bookmark className={cn("w-4 h-4", post.is_saved && "fill-current")} />
            </button>

            {/* Share */}
            <button className="text-[#71717A] hover:text-[#9CA3AF] transition-colors ml-auto">
              <Share2 className="w-4 h-4" />
            </button>

            {/* Report */}
            <button className="text-[#71717A] hover:text-[#EF4444] transition-colors">
              <Flag className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
