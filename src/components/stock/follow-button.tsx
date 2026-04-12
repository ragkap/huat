"use client";
import { useState } from "react";
import { Bell, BellOff } from "lucide-react";

interface FollowButtonProps {
  ticker: string;
  displayTicker: string;
  initialFollowing: boolean;
  initialFollowerCount: number;
}

export function FollowButton({
  ticker,
  displayTicker,
  initialFollowing,
  initialFollowerCount,
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
    <div className="flex flex-col items-center gap-1">
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
        <>
          <div className="relative">
            <span className="absolute inset-0 rounded animate-ping bg-[#E8311A] opacity-20 pointer-events-none" />
            <button
              onClick={toggle}
              disabled={toggling}
              className="relative flex items-center gap-2 px-4 py-1.5 rounded bg-[#E8311A] text-white text-sm font-bold hover:bg-[#c9280f] transition-colors disabled:opacity-50"
            >
              <Bell className="w-3.5 h-3.5" />
              Follow
            </button>
          </div>
          <span className="text-[10px] font-bold text-[#E8311A] uppercase tracking-widest animate-pulse">
            Stay updated
          </span>
        </>
      )}
    </div>
  );
}
