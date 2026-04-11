"use client";
import { useState } from "react";
import { FeedList } from "@/components/feed/feed-list";
import { PriceChart } from "@/components/stock/price-chart";
import type { Profile } from "@/types/database";

interface StockPageClientProps {
  ticker: string;           // raw (URL-encoded) ticker for API calls
  displayTicker: string;    // bloomberg_ticker for display
  profile: Profile;
  isPositive: boolean;
  description: string | null;
}

export function StockPageClient({
  ticker,
  displayTicker,
  profile,
  isPositive,
  description,
}: StockPageClientProps) {
  const [showFullDesc, setShowFullDesc] = useState(false);

  const descTrimmed = description && description.length > 280;
  const descDisplay = descTrimmed && !showFullDesc ? description!.slice(0, 280) + "…" : description;

  return (
    <>
      {/* Chart */}
      <PriceChart ticker={ticker} initialPositive={isPositive} />

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
