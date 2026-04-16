import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { getStocksBySlugs } from "@/lib/stocks-db/client";
import { LastVisitedWidget } from "@/components/layout/last-visited-widget";

async function getTrendingStocks() {
  try {
    const supabase = await createClient();
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data } = await supabase
      .from("posts")
      .select("tagged_stocks")
      .gte("created_at", since)
      .not("tagged_stocks", "is", null);

    if (!data?.length) return [];

    // Count posts per ticker
    const counts: Record<string, number> = {};
    for (const row of data) {
      for (const ticker of row.tagged_stocks ?? []) {
        counts[ticker] = (counts[ticker] ?? 0) + 1;
      }
    }

    const top = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([ticker, count]) => ({ ticker, count }));

    // Resolve names in a single batch query instead of N individual lookups
    const tickers = top.map(t => t.ticker);
    const stocks = await getStocksBySlugs(tickers).catch(() => []);
    const stockMap = new Map(stocks.map(s => [s.slug, s]));

    return top.map(({ ticker, count }) => {
      const stock = stockMap.get(ticker);
      return {
        ticker,
        count,
        name: stock?.name ?? ticker,
        slug: stock?.slug ?? ticker,
      };
    });
  } catch {
    return [];
  }
}

export async function TrendingStocks() {
  const trending = await getTrendingStocks();

  return (
    <div className="space-y-3">
      {/* Trending widget */}
      <div className="border border-[#282828] rounded-lg p-4">
        <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider mb-3">Trending Stocks</p>
        {trending.length === 0 ? (
          <p className="text-xs text-[#555555]">No activity yet this week</p>
        ) : (
          <div className="space-y-0.5">
            {trending.map((s, i) => (
              <Link
                key={s.ticker}
                href={`/stocks/${encodeURIComponent(s.slug)}`}
                className="flex items-center justify-between hover:bg-[#141414] -mx-2 px-2 py-1.5 rounded transition-colors group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-[10px] font-bold text-[#555555] w-4 flex-shrink-0">{i + 1}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#E0E0E0] truncate group-hover:text-white leading-tight">{s.name}</p>
                    <p className="text-[10px] text-[#555555] font-mono">{s.ticker}</p>
                  </div>
                </div>
                <span className="text-[10px] text-[#555555] flex-shrink-0 ml-2">{s.count} post{s.count !== 1 ? "s" : ""}</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Last visited widget — client-side from localStorage */}
      <LastVisitedWidget />
    </div>
  );
}
