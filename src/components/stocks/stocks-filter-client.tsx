"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { SGStock } from "@/lib/stocks-db/client";

type CapBucket = "small" | "mid" | "large";

const CAP_BUCKETS: { id: CapBucket; label: string; desc: string }[] = [
  { id: "small", label: "Small", desc: "<$500M" },
  { id: "mid",   label: "Mid",   desc: "$500M–$5B" },
  { id: "large", label: "Large", desc: ">$5B" },
];

function marketCapBucket(cap: number | null): CapBucket | null {
  if (cap === null) return null;
  if (cap < 500) return "small";
  if (cap < 5000) return "mid";
  return "large";
}

function formatMarketCap(n: number | null): string {
  if (n === null) return "--";
  if (n >= 1_000_000) return `US$${(n / 1_000_000).toFixed(2)}T`;
  if (n >= 1_000) return `US$${(n / 1_000).toFixed(2)}B`;
  return `US$${n.toFixed(0)}M`;
}

export function StocksFilterClient({ stocks }: { stocks: SGStock[] }) {
  const [sector, setSector] = useState<string | null>(null);
  const [cap, setCap] = useState<CapBucket | null>(null);

  const sectors = useMemo(() => {
    const seen = new Set<string>();
    for (const s of stocks) {
      if (s.sector) seen.add(s.sector);
    }
    return Array.from(seen).sort();
  }, [stocks]);

  const filtered = useMemo(() => {
    return stocks.filter(s => {
      if (sector && s.sector !== sector) return false;
      if (cap && marketCapBucket(s.market_cap) !== cap) return false;
      return true;
    });
  }, [stocks, sector, cap]);

  function toggleSector(s: string) {
    setSector(prev => prev === s ? null : s);
  }

  function toggleCap(c: CapBucket) {
    setCap(prev => prev === c ? null : c);
  }

  const hasFilters = sector !== null || cap !== null;

  return (
    <div>
      {/* Filter bar */}
      <div className="px-5 py-3 border-b border-[#282828] space-y-2.5">
        {/* Market cap row */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-[#71717A] uppercase tracking-wider w-14 flex-shrink-0">Cap</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {CAP_BUCKETS.map(b => (
              <button
                key={b.id}
                onClick={() => toggleCap(b.id)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  cap === b.id
                    ? "bg-[#E8311A] text-white"
                    : "bg-[#1A1A1A] text-[#9CA3AF] hover:text-[#F0F0F0] hover:bg-[#282828]"
                }`}
              >
                {b.label} <span className="opacity-70">{b.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Sector row */}
        <div className="flex items-start gap-2">
          <span className="text-[10px] font-bold text-[#71717A] uppercase tracking-wider w-14 flex-shrink-0 pt-1">Sector</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {sectors.map(s => (
              <button
                key={s}
                onClick={() => toggleSector(s)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  sector === s
                    ? "bg-[#E8311A] text-white"
                    : "bg-[#1A1A1A] text-[#9CA3AF] hover:text-[#F0F0F0] hover:bg-[#282828]"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Results count + clear */}
        <div className="flex items-center justify-between pt-0.5">
          <p className="text-xs text-[#71717A]">
            <span className="text-[#F0F0F0] font-bold">{filtered.length}</span> companies
          </p>
          {hasFilters && (
            <button
              onClick={() => { setSector(null); setCap(null); }}
              className="text-xs text-[#9CA3AF] hover:text-[#F0F0F0] transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Stock list */}
      <div className="px-5 py-4">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[#F0F0F0] font-bold mb-2">No results</p>
            <p className="text-[#71717A] text-sm">Try adjusting the filters</p>
          </div>
        ) : (
          <div>
            {filtered.map(stock => (
              <Link
                key={stock.id}
                href={`/stocks/${encodeURIComponent(stock.slug ?? stock.bloomberg_ticker ?? String(stock.id))}`}
                className="flex items-center justify-between py-3 border-b border-[#141414] hover:bg-[#0D0D0D] -mx-5 px-5 transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded bg-[#282828] border border-[#333333] flex items-center justify-center text-xs font-bold text-[#9CA3AF] font-mono flex-shrink-0">
                    {(stock.bloomberg_ticker ?? "??").split(" ")[0].slice(0, 4)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-[#F0F0F0] group-hover:text-white truncate">{stock.name}</p>
                    <p className="text-xs text-[#71717A] font-mono truncate">{stock.bloomberg_ticker}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                  {stock.market_cap !== null && (
                    <span className="text-xs text-[#9CA3AF] font-mono hidden sm:block">
                      {formatMarketCap(stock.market_cap)}
                    </span>
                  )}
                  {stock.sector && (
                    <span className="text-xs text-[#71717A] bg-[#282828] px-2 py-0.5 rounded hidden sm:block">
                      {stock.sector}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
