"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ChevronUp, ChevronDown } from "lucide-react";
import type { SGStock } from "@/lib/stocks-db/client";

type CapBucket = "small" | "mid" | "large";
type SortKey = "market_cap" | "smart_score" | "name";
type SortDir = "asc" | "desc";

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

function SmartScoreBadge({ score }: { score: number | null }) {
  if (score === null) return <span className="text-xs text-[#555555] font-mono w-6 text-center">—</span>;
  const color = score >= 4 ? "#22C55E" : score >= 3 ? "#F59E0B" : "#EF4444";
  return (
    <span
      className="text-xs font-bold font-mono w-6 text-center"
      style={{ color }}
    >
      {score}
    </span>
  );
}

export function StocksFilterClient({ stocks }: { stocks: SGStock[] }) {
  const [sector, setSector] = useState<string | null>(null);
  const [cap, setCap] = useState<CapBucket | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("market_cap");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const sectors = useMemo(() => {
    const seen = new Set<string>();
    for (const s of stocks) {
      if (s.sector) seen.add(s.sector);
    }
    return Array.from(seen).sort();
  }, [stocks]);

  const filtered = useMemo(() => {
    const f = stocks.filter(s => {
      if (sector && s.sector !== sector) return false;
      if (cap && marketCapBucket(s.market_cap) !== cap) return false;
      return true;
    });

    return [...f].sort((a, b) => {
      let av: number | string | null;
      let bv: number | string | null;
      if (sortKey === "name") {
        av = a.name ?? "";
        bv = b.name ?? "";
        return sortDir === "asc"
          ? (av as string).localeCompare(bv as string)
          : (bv as string).localeCompare(av as string);
      }
      av = sortKey === "smart_score" ? a.smart_score : a.market_cap;
      bv = sortKey === "smart_score" ? b.smart_score : b.market_cap;
      if (av === null && bv === null) return 0;
      if (av === null) return 1;
      if (bv === null) return -1;
      return sortDir === "asc" ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });
  }, [stocks, sector, cap, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <ChevronDown className="w-3 h-3 text-[#555555]" />;
    return sortDir === "desc"
      ? <ChevronDown className="w-3 h-3 text-[#E8311A]" />
      : <ChevronUp className="w-3 h-3 text-[#E8311A]" />;
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
                onClick={() => setCap(prev => prev === b.id ? null : b.id)}
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
                onClick={() => setSector(prev => prev === s ? null : s)}
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

      {/* Column headers */}
      <div className="px-5 py-2 border-b border-[#1C1C1C] flex items-center text-[10px] font-bold text-[#555555] uppercase tracking-wider">
        <div className="flex-1 min-w-0">Company</div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <button onClick={() => toggleSort("smart_score")} className="flex items-center gap-0.5 hover:text-[#9CA3AF] transition-colors justify-end">
            SmartScore <SortIcon k="smart_score" />
          </button>
          <button onClick={() => toggleSort("market_cap")} className="flex items-center gap-0.5 hover:text-[#9CA3AF] transition-colors w-16 justify-end">
            Mkt Cap <SortIcon k="market_cap" />
          </button>
        </div>
      </div>

      {/* Stock list */}
      <div>
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[#F0F0F0] font-bold mb-2">No results</p>
            <p className="text-[#71717A] text-sm">Try adjusting the filters</p>
          </div>
        ) : (
          filtered.map(stock => (
            <Link
              key={stock.id}
              href={`/stocks/${encodeURIComponent(stock.slug ?? stock.bloomberg_ticker ?? String(stock.id))}`}
              className="flex items-center px-5 py-2.5 border-b border-[#141414] hover:bg-[#0D0D0D] transition-colors group"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8 h-8 rounded bg-[#282828] border border-[#333333] flex items-center justify-center text-[10px] font-bold text-[#9CA3AF] font-mono flex-shrink-0 hidden sm:flex">
                  {(stock.bloomberg_ticker ?? "??").split(" ")[0].slice(0, 4)}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm text-[#F0F0F0] group-hover:text-white truncate">{stock.name}</p>
                  <p className="text-[10px] text-[#555555] font-mono">
                    {stock.bloomberg_ticker?.replace(/ SP$/, "")}
                    {stock.sector && <span className="text-[#444444] hidden sm:inline"> · {stock.sector}</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <SmartScoreBadge score={stock.smart_score} />
                <span className="text-xs text-[#9CA3AF] font-mono w-16 text-right">
                  {formatMarketCap(stock.market_cap)}
                </span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
