import { notFound } from "next/navigation";
import { getStockBySlugOrTicker } from "@/lib/stocks-db/client";
import { getQuote, getSmartScore, getCurrentStats } from "@/lib/smartkarma/client";
import { createClient } from "@/lib/supabase/server";
import { StockPageClient } from "@/components/stock/stock-page-client";
import { formatPrice, formatLargeNumber } from "@/lib/utils";
import type { Profile } from "@/types/database";

interface StockPageProps {
  params: Promise<{ ticker: string }>;
}

export async function generateMetadata({ params }: StockPageProps) {
  const { ticker } = await params;
  return { title: `${decodeURIComponent(ticker)} — huat.co` };
}

export default async function StockPage({ params }: StockPageProps) {
  const { ticker: rawTicker } = await params;
  const identifier = decodeURIComponent(rawTicker);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("profiles").select("*").eq("id", user.id).single()
    : { data: null };

  let stock = null;
  try { stock = await getStockBySlugOrTicker(identifier); } catch { /* */ }
  if (!stock) notFound();

  const [quote, smartScore, stats] = await Promise.all([
    getQuote(stock.bloomberg_ticker ?? identifier).catch(() => null),
    stock.slug ? getSmartScore(stock.slug).catch(() => null) : null,
    stock.isin ? getCurrentStats(stock.isin).catch(() => null) : null,
  ]);

  const isPositive = (quote?.change ?? 0) >= 0;

  return (
    <div>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0A0A0A]/90 backdrop-blur-md border-b border-[#282828] px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-[#F0F0F0]">{stock.name}</h1>
            <p className="text-xs text-[#71717A] font-mono mt-0.5">
              {stock.bloomberg_ticker} · {stock.exchange_code ?? "SGX"}
            </p>
          </div>
          {smartScore?.score != null && (
            <div className="text-right">
              <p className="text-xs text-[#71717A] mb-0.5">SmartScore</p>
              <p className={`text-2xl font-black ${smartScore.score >= 7 ? "text-[#22C55E]" : smartScore.score >= 4 ? "text-[#F0F0F0]" : "text-[#EF4444]"}`}>
                {smartScore.score.toFixed(1)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quote bar */}
      {quote?.price != null ? (
        <div className="px-5 py-5 border-b border-[#282828] bg-[#080808]">
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-black text-[#F0F0F0] font-mono">
              {formatPrice(quote.price, quote.currency ?? "SGD")}
            </span>
            <span className={`text-sm font-bold ${isPositive ? "text-[#22C55E]" : "text-[#EF4444]"}`}>
              {isPositive ? "+" : ""}{quote.change?.toFixed(3)} ({isPositive ? "+" : ""}{quote.change_pct?.toFixed(2)}%)
            </span>
          </div>
          {stats && (
            <div className="grid grid-cols-3 gap-x-4 gap-y-3 mt-4">
              {[
                { label: "P/E", value: stats.pe_ratio?.toFixed(1) ?? "--" },
                { label: "P/B", value: stats.pb_ratio?.toFixed(2) ?? "--" },
                { label: "Mkt Cap", value: formatLargeNumber(stats.market_cap) },
                { label: "Div Yield", value: stats.dividend_yield ? `${stats.dividend_yield.toFixed(2)}%` : "--" },
                { label: "52W High", value: formatPrice(stats.week_52_high, quote.currency ?? "SGD") },
                { label: "52W Low", value: formatPrice(stats.week_52_low, quote.currency ?? "SGD") },
              ].map(item => (
                <div key={item.label}>
                  <p className="text-xs text-[#71717A] uppercase tracking-wider">{item.label}</p>
                  <p className="text-sm font-bold text-[#F0F0F0] font-mono mt-0.5">{item.value}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="px-5 py-4 border-b border-[#282828] bg-[#080808]">
          <p className="text-[#71717A] text-sm">Price data unavailable</p>
          {stock.sector && <p className="text-xs text-[#71717A] mt-1">Sector: {stock.sector}</p>}
        </div>
      )}

      {/* Community feed */}
      <div className="border-b border-[#282828] px-5 py-3">
        <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider">Community</p>
      </div>

      {profile && <StockPageClient ticker={rawTicker} profile={profile as Profile} />}
    </div>
  );
}
