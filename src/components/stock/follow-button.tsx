"use client";
import { useState } from "react";
import { Star } from "lucide-react";

interface FollowButtonProps {
  ticker: string;
  initialFollowing: boolean;
  initialFollowerCount: number;
}

const PARTICLES = [
  { angle: -60,  d: 22 },
  { angle: -30,  d: 26 },
  { angle:   0,  d: 24 },
  { angle:  30,  d: 26 },
  { angle:  60,  d: 22 },
  { angle: -90,  d: 20 },
  { angle:  90,  d: 20 },
];

export function FollowButton({
  ticker,
  initialFollowing,
  initialFollowerCount,
}: FollowButtonProps) {
  const [following, setFollowing] = useState(initialFollowing);
  const [followerCount, setFollowerCount] = useState(initialFollowerCount);
  const [burst, setBurst] = useState(false);

  async function toggle() {
    if (following) {
      // unwatch — no burst, just fire and forget
      setFollowing(false);
      setFollowerCount(c => c - 1);
      fetch(`/api/stocks/${encodeURIComponent(ticker)}/watch`, { method: "DELETE" });
      return;
    }
    // watch — instant optimistic + burst
    setFollowing(true);
    setFollowerCount(c => c + 1);
    setBurst(true);
    setTimeout(() => setBurst(false), 700);
    fetch(`/api/stocks/${encodeURIComponent(ticker)}/watch`, { method: "POST" });
  }

  return (
    <button
      onClick={toggle}
      className={following
        ? "relative flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#333333] bg-transparent text-[#9CA3AF] text-sm font-medium hover:border-[#EF4444] hover:text-[#EF4444] transition-colors"
        : "relative flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#E8311A] text-white text-sm font-semibold hover:bg-[#c9280f] transition-colors"
      }
    >
      <style>{`
        @keyframes watch-glow {
          0%,100% { box-shadow: 0 0 0 2px rgba(232,49,26,0.2); }
          50%      { box-shadow: 0 0 6px 5px rgba(232,49,26,0.35); }
        }
        @keyframes particle-fly {
          0%   { transform: translate(-50%,-50%) rotate(var(--a)) translateY(0px) scale(1); opacity: 1; }
          100% { transform: translate(-50%,-50%) rotate(var(--a)) translateY(var(--d)) scale(0); opacity: 0; }
        }
        @keyframes star-pop {
          0%   { transform: scale(1); }
          40%  { transform: scale(1.5); }
          70%  { transform: scale(0.85); }
          100% { transform: scale(1); }
        }
      `}</style>

      {/* Burst particles */}
      {burst && PARTICLES.map((p, i) => (
        <span
          key={i}
          className="pointer-events-none absolute left-1/2 top-1/2 w-1.5 h-1.5 rounded-full bg-white"
          style={{
            "--a": `${p.angle}deg`,
            "--d": `-${p.d}px`,
            animation: `particle-fly 0.6s ease-out ${i * 30}ms forwards`,
          } as React.CSSProperties}
        />
      ))}

      <Star
        className="w-3.5 h-3.5"
        style={{
          fill: following ? "currentColor" : "none",
          animation: burst ? "star-pop 0.4s ease-out forwards" : undefined,
        }}
      />
      {following ? "Watching" : "Watch"}
    </button>
  );
}
