"use client";
import { useState } from "react";
import { Star } from "lucide-react";

interface FollowButtonProps {
  ticker: string;
  initialFollowing: boolean;
  initialFollowerCount: number;
}

export function FollowButton({
  ticker,
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
    <button
      onClick={toggle}
      disabled={toggling}
      className={following
        ? "flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#333333] bg-[#1C1C1C] text-[#9CA3AF] text-sm font-medium hover:border-[#EF4444] hover:text-[#EF4444] transition-colors disabled:opacity-50"
        : "flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#E8311A]/40 text-[#E8311A] text-sm font-medium hover:bg-[#E8311A]/10 transition-colors disabled:opacity-50"
      }
    >
      <Star className={following ? "w-3.5 h-3.5 fill-current" : "w-3.5 h-3.5"} />
      {following ? "Watching" : "Watch"}
    </button>
  );
}
