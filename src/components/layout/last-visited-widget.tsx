"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export interface VisitedStock {
  ticker: string;
  name: string;
  slug: string;
  visitedAt: number;
}

const STORAGE_KEY = "huat_last_visited";
const MAX_ITEMS = 6;

export function recordStockVisit(stock: { ticker: string; name: string; slug: string }) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const existing: VisitedStock[] = raw ? JSON.parse(raw) : [];
    // Remove duplicate then prepend
    const filtered = existing.filter(v => v.ticker !== stock.ticker);
    const updated = [{ ...stock, visitedAt: Date.now() }, ...filtered].slice(0, MAX_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
}

export function LastVisitedWidget() {
  const [visited, setVisited] = useState<VisitedStock[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setVisited(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  if (!visited.length) return null;

  return (
    <div className="border border-[#282828] rounded-lg p-4">
      <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider mb-3">Last Visited</p>
      <div className="space-y-0.5">
        {visited.map((s, i) => (
          <Link
            key={s.ticker}
            href={`/stocks/${encodeURIComponent(s.slug)}`}
            className="flex items-center gap-2.5 hover:bg-[#141414] -mx-2 px-2 py-1.5 rounded transition-colors group"
          >
            <span className="text-[10px] font-bold text-[#555555] w-4 flex-shrink-0">{i + 1}</span>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#E0E0E0] truncate group-hover:text-white leading-tight">{s.name}</p>
              <p className="text-[10px] text-[#555555] font-mono">{s.ticker}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
