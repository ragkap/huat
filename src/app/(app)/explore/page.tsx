"use client";
import { useState } from "react";
import { Search } from "lucide-react";
import Link from "next/link";

interface StockResult {
  ticker: string;
  name: string;
  exchange: string;
  sector: string | null;
}

export default function ExplorePage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StockResult[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleSearch(q: string) {
    setQuery(q);
    if (q.length < 2) { setResults([]); return; }
    setLoading(true);
    const res = await fetch(`/api/stocks?q=${encodeURIComponent(q)}`);
    const { stocks } = await res.json();
    setResults(stocks ?? []);
    setLoading(false);
  }

  return (
    <div>
      <div className="sticky top-0 z-10 bg-[#0A0A0A]/90 backdrop-blur-md border-b border-[#282828] px-5 py-4">
        <h1 className="text-xl font-black text-[#F0F0F0] mb-3">Explore</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717A]" />
          <input
            value={query}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Search stocks, investors..."
            className="w-full bg-[#141414] border border-[#333333] rounded pl-9 pr-3 py-2.5 text-sm text-[#F0F0F0] placeholder:text-[#71717A] focus:outline-none focus:border-[#E8311A] transition-colors"
          />
        </div>
      </div>

      <div className="px-5 py-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-5 h-5 border-2 border-[#333333] border-t-[#E8311A] rounded-full animate-spin" />
          </div>
        ) : results.length > 0 ? (
          <div>
            <p className="text-xs text-[#71717A] uppercase tracking-wider mb-3">Stocks</p>
            <div className="space-y-0">
              {results.map(stock => (
                <Link
                  key={stock.ticker}
                  href={`/stocks/${encodeURIComponent(stock.slug ?? stock.bloomberg_ticker ?? stock.name)}`}
                  className="flex items-center gap-3 py-3 border-b border-[#141414] hover:bg-[#0D0D0D] -mx-5 px-5 transition-colors"
                >
                  <div className="w-10 h-10 rounded bg-[#282828] border border-[#333333] flex items-center justify-center text-xs font-bold text-[#9CA3AF] font-mono">
                    {(stock.bloomberg_ticker ?? "?").split(" ")[0].slice(0, 4)}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-[#F0F0F0]">{stock.name}</p>
                    <p className="text-xs text-[#71717A] font-mono">{stock.bloomberg_ticker}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : query.length > 1 ? (
          <p className="text-[#71717A] text-sm text-center py-8">No results for "{query}"</p>
        ) : (
          <div className="py-8 text-center">
            <p className="text-[#71717A] text-sm">Search for stocks or investors</p>
          </div>
        )}
      </div>
    </div>
  );
}
