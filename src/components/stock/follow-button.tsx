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
    <div className="flex items-center gap-4 mt-3">
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

      <button
        onClick={toggle}
        disabled={toggling}
        className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-colors disabled:opacity-50 ml-auto ${
          following
            ? "bg-[#1C1C1C] text-[#9CA3AF] border border-[#333333] hover:border-[#EF4444] hover:text-[#EF4444]"
            : "bg-[#E8311A] text-white hover:bg-[#c9280f]"
        }`}
      >
        {following ? (
          <><BellOff className="w-3 h-3" />Unfollow</>
        ) : (
          <><Bell className="w-3 h-3" />Follow {displayTicker}</>
        )}
      </button>
    </div>
  );
}
