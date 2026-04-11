"use client";
import { useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { FeedList } from "@/components/feed/feed-list";
import { PriceChart } from "@/components/stock/price-chart";
import type { Profile } from "@/types/database";

interface StockPageClientProps {
  ticker: string;           // raw (URL-encoded) ticker for API calls
  displayTicker: string;    // bloomberg_ticker for display
  profile: Profile;
  initialFollowing: boolean;
  followerCount: number;
  postCount: number;
  isPositive: boolean;
  description: string | null;
}

export function StockPageClient({
  ticker,
  displayTicker,
  profile,
  initialFollowing,
  followerCount: initialFollowerCount,
  postCount,
  isPositive,
  description,
}: StockPageClientProps) {
  const [following, setFollowing] = useState(initialFollowing);
  const [followerCount, setFollowerCount] = useState(initialFollowerCount);
  const [toggling, setToggling] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);

  async function toggleFollow() {
    setToggling(true);
    try {
      const method = following ? "DELETE" : "POST";
      const res = await fetch(`/api/stocks/${encodeURIComponent(ticker)}/watch`, { method });
      if (res.ok) {
        setFollowing(f => !f);
        setFollowerCount(c => c + (following ? -1 : 1));
      }
    } finally {
      setToggling(false);
    }
  }

  const descTrimmed = description && description.length > 280;
  const descDisplay = descTrimmed && !showFullDesc ? description!.slice(0, 280) + "…" : description;

  return (
    <>
      {/* Chart */}
      <PriceChart ticker={ticker} initialPositive={isPositive} />

      {/* Follow + stats bar */}
      <div className="px-5 py-4 border-b border-[#282828] flex items-center justify-between gap-4">
        <div className="flex items-center gap-5">
          <div>
            <span className="text-[#F0F0F0] font-bold text-sm">{followerCount.toLocaleString()}</span>
            <span className="text-[#71717A] text-xs ml-1">followers</span>
          </div>
          <div>
            <span className="text-[#F0F0F0] font-bold text-sm">{postCount.toLocaleString()}</span>
            <span className="text-[#71717A] text-xs ml-1">posts</span>
          </div>
        </div>

        <button
          onClick={toggleFollow}
          disabled={toggling}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded text-sm font-semibold transition-colors disabled:opacity-50 ${
            following
              ? "bg-[#1C1C1C] text-[#9CA3AF] border border-[#333333] hover:border-[#EF4444] hover:text-[#EF4444]"
              : "bg-[#E8311A] text-white hover:bg-[#c9280f]"
          }`}
        >
          {following ? (
            <><BellOff className="w-3.5 h-3.5" />Unfollow</>
          ) : (
            <><Bell className="w-3.5 h-3.5" />Follow {displayTicker}</>
          )}
        </button>
      </div>

      {/* Description */}
      {description && (
        <div className="px-5 py-4 border-b border-[#282828]">
          <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider mb-2">About</p>
          <p className="text-sm text-[#C0C0C0] leading-relaxed">{descDisplay}</p>
          {descTrimmed && (
            <button
              onClick={() => setShowFullDesc(s => !s)}
              className="text-xs text-[#E8311A] hover:underline mt-1.5"
            >
              {showFullDesc ? "Show less" : "Show more"}
            </button>
          )}
        </div>
      )}

      {/* Community feed */}
      <div className="border-b border-[#282828] px-5 py-3">
        <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider">Community</p>
      </div>

      <FeedList tab="foryou" profile={profile} stockTicker={displayTicker ?? ticker} />
    </>
  );
}
