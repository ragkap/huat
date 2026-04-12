import { notFound } from "next/navigation";
import { getStockBySlugOrTicker } from "@/lib/stocks-db/client";
import { getQuote, getSmartScore, getCurrentStats } from "@/lib/smartkarma/client";
import { createClient } from "@/lib/supabase/server";
import { StockPageClient } from "@/components/stock/stock-page-client";
import { FollowButton } from "@/components/stock/follow-button";
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
  const [{ data: { user } }, stockResult] = await Promise.all([
    supabase.auth.getUser(),
    getStockBySlugOrTicker(identifier).catch(() => null),
  ]);

  const stock = stockResult;
  if (!stock) notFound();

  const { data: profile } = user
    ? await supabase.from("profiles").select("id, username, display_name, avatar_url, bio, country, is_verified, created_at").eq("id", user.id).single()
    : { data: null };

  const ticker = stock.bloomberg_ticker ?? identifier;

  const [quote, smartScore, stats, watchlistRes, followerRes, postCountRes] = await Promise.all([
    getQuote(ticker).catch(() => null),
    stock.slug ? getSmartScore(stock.slug).catch(() => null) : null,
    stock.isin ? getCurrentStats(stock.isin).catch(() => null) : null,
    user
      ? supabase.from("stock_watchlist").select("ticker").eq("user_id", user.id).eq("ticker", ticker).maybeSingle()
      : { data: null },
    supabase.from("stock_watchlist").select("user_id", { count: "exact", head: true }).eq("ticker", ticker),
    supabase.from("posts").select("id", { count: "exact", head: true }).contains("tagged_stocks", [ticker]),
  ]);

  const isPositive = (quote?.change ?? 0) >= 0;
  const isFollowing = !!watchlistRes.data;
  const followerCount = followerRes.count ?? 0;
  const postCount = postCountRes.count ?? 0;

  return (
    <div>
      {/* Sticky header */}
      <div className="sticky top-14 z-10 bg-[#0A0A0A]/90 backdrop-blur-md border-b border-[#282828] px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-black text-[#F0F0F0]">{stock.name}</h1>
            <p className="text-xs text-[#71717A] font-mono mt-0.5">
              {ticker} · {stock.exchange_code ?? "SGX"}
              {stock.sector && ` · ${stock.sector}`}
            </p>
            {profile && (
              <FollowButton
                ticker={rawTicker}
                displayTicker={ticker}
                initialFollowing={isFollowing}
                initialFollowerCount={followerCount}
                postCount={postCount}
              />
            )}
          </div>
          {smartScore?.score != null && (
            <div className="text-right flex-shrink-0">
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
            {quote.last_updated && (
              <span className="text-xs text-[#71717A] ml-auto">
                {new Date(quote.last_updated).toLocaleTimeString("en-SG", { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </div>
          {stats && (
            <div className="grid grid-cols-4 gap-x-4 mt-4">
              {[
                { label: "Mkt Cap", value: formatLargeNumber(stats.market_cap) },
                { label: "P/E", value: stats.pe_ratio?.toFixed(1) ?? "--" },
                { label: "P/B", value: stats.pb_ratio?.toFixed(2) ?? "--" },
                { label: "Div Yield", value: stats.dividend_yield ? `${stats.dividend_yield.toFixed(2)}%` : "--" },
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
        </div>
      )}

      {profile && (
        <StockPageClient
          ticker={rawTicker}
          displayTicker={ticker}
          profile={profile as Profile}
          isPositive={isPositive}
          description={stock.description ?? null}
        />
      )}
    </div>
  );
}
