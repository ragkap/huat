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

  const [communityTab, setCommunityTab] = useState("all");

  const COMMUNITY_PILLS = [
    { id: "all",           label: "All" },
    { id: "forecast",      label: "Forecasts" },
    { id: "poll",          label: "Polls" },
    { id: "research",      label: "Research" },
    { id: "announcement",  label: "Announcements" },
    { id: "news",          label: "News" },
  ];

  return (
    <>
      {/* Chart */}
      <PriceChart ticker={ticker} initialPositive={isPositive} />

      {/* Description */}
      {description && (
        <div className="px-5 py-4 border-b border-[#282828]">
          <p className="text-sm text-[#C0C0C0] leading-relaxed">
            {showFullDesc ? (
              <>{description}<button onClick={() => setShowFullDesc(false)} className="ml-1.5 text-xs text-[#E8311A] hover:underline">Show less</button></>
            ) : (
              <>{description.slice(0, 100)}…<button onClick={() => setShowFullDesc(true)} className="ml-1 text-xs text-[#E8311A] hover:underline">Show more</button></>
            )}
          </p>
        </div>
      )}

      {/* Community header + pills */}
      <div className="sticky top-14 z-10 bg-[#0A0A0A]/95 backdrop-blur-md border-b border-[#282828] px-5 pt-3 pb-0">
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-3">
          {COMMUNITY_PILLS.map(pill => (
            <button
              key={pill.id}
              onClick={() => setCommunityTab(pill.id)}
              className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                communityTab === pill.id
                  ? "bg-[#E8311A] text-white"
                  : "bg-[#1C1C1C] text-[#9CA3AF] hover:text-[#F0F0F0] hover:bg-[#282828]"
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      <FeedList
        tab="foryou"
        profile={profile}
        stockTicker={displayTicker ?? ticker}
        postType={communityTab === "all" ? undefined : communityTab}
      />
    </>
  );
}
