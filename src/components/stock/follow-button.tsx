"use client";
import { useState } from "react";
import { Bell, BellOff } from "lucide-react";

interface FollowButtonProps {
  ticker: string;
  displayTicker: string;
  initialFollowing: boolean;
  initialFollowerCount: number;
  postCount: number;
}

export function FollowButton({
  ticker,
  displayTicker,
  initialFollowing,
  initialFollowerCount,
  postCount,
}: FollowButtonProps) {
  const [following, setFollowing] = useState(initialFollowing);
  const [followerCount, setFollowerCount] = useState(initialFollowerCount);
  const [toggling, setToggling] = useState(false);

  async function toggle() {
    setToggling(true);
    try {
      const res = await fetch(`/api/stocks/${encodeURIComponent(ticker)}/watch`, {
        method: following ? "DELETE" : "POST",
      });
      if (res.ok) {
        setFollowing(f => !f);
        setFollowerCount(c => c + (following ? -1 : 1));
      }
    } finally {
      setToggling(false);
    }
  }

  return (
    <div className="flex items-center justify-between gap-4 mt-3">
      {/* Stats */}
      <div className="flex items-center gap-4">
        <div>
          <span className="text-[#F0F0F0] font-bold text-sm">{followerCount.toLocaleString()}</span>
          <span className="text-[#71717A] text-xs ml-1">followers</span>
        </div>
        <div>
          <span className="text-[#F0F0F0] font-bold text-sm">{postCount.toLocaleString()}</span>
          <span className="text-[#71717A] text-xs ml-1">posts</span>
        </div>
      </div>

      {/* Follow button */}
      {following ? (
        <button
          onClick={toggle}
          disabled={toggling}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded border border-[#333333] bg-[#1C1C1C] text-[#9CA3AF] text-sm font-semibold hover:border-[#EF4444] hover:text-[#EF4444] transition-colors disabled:opacity-50"
        >
          <BellOff className="w-3.5 h-3.5" />
          Following
        </button>
      ) : (
        <div className="relative">
          {/* Pulsating eyebrow */}
          <span className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold text-[#E8311A] uppercase tracking-widest animate-pulse pointer-events-none">
            Stay updated
          </span>

          {/* Glow ring */}
          <span className="absolute inset-0 rounded animate-ping bg-[#E8311A] opacity-20 pointer-events-none" />

          <button
            onClick={toggle}
            disabled={toggling}
            className="relative flex items-center gap-2 px-5 py-2 rounded bg-[#E8311A] text-white text-sm font-black hover:bg-[#c9280f] transition-colors disabled:opacity-50 shadow-[0_0_16px_rgba(232,49,26,0.4)]"
          >
            <Bell className="w-4 h-4" />
            Follow {displayTicker}
          </button>
        </div>
      )}
    </div>
  );
}
