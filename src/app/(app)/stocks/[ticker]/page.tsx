import { notFound } from "next/navigation";
import { getStockBySlugOrTicker } from "@/lib/stocks-db/client";
import { getQuote, getCurrentStats } from "@/lib/smartkarma/client";
import { createClient } from "@/lib/supabase/server";
import { StockPageClient } from "@/components/stock/stock-page-client";
import { FollowButton } from "@/components/stock/follow-button";
import { formatPrice } from "@/lib/utils";
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

  const [quote, stats, watchlistRes, followerRes, postCountRes] = await Promise.all([
    getQuote(ticker).catch(() => null),
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
      {/* Stock header */}
      <div className="border-b border-[#282828] px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-black text-[#F0F0F0]">{stock.name}</h1>
            <p className="text-xs text-[#71717A] font-mono mt-0.5">
              {ticker} · {stock.exchange_code ?? "SGX"}
              {stock.sector && ` · ${stock.sector}`}
            </p>
          </div>
          {profile && (
            <FollowButton
              ticker={rawTicker}
              displayTicker={ticker}
              initialFollowing={isFollowing}
              initialFollowerCount={followerCount}
            />
          )}
        </div>
        <div className="flex items-center gap-4 mt-3">
          <span className="text-sm font-bold text-[#F0F0F0]">{followerCount.toLocaleString()} <span className="text-xs text-[#71717A] font-normal">followers</span></span>
          <span className="text-sm font-bold text-[#F0F0F0]">{postCount.toLocaleString()} <span className="text-xs text-[#71717A] font-normal">posts</span></span>
        </div>
      </div>

      {/* Quote bar */}
      {quote?.price != null ? (
        <div className="px-5 py-5 border-b border-[#282828] bg-[#080808]">
          <div className="flex flex-wrap items-baseline gap-2 sm:gap-3">
            <span className="text-4xl font-black text-[#F0F0F0] font-mono">
              {formatPrice(quote.price, quote.currency ?? "SGD")}
            </span>
            <span className={`text-sm font-bold ${isPositive ? "text-[#22C55E]" : "text-[#EF4444]"}`}>
              {isPositive ? "+" : ""}{quote.change?.toFixed(3)} ({isPositive ? "+" : ""}{quote.change_pct?.toFixed(2)}%)
            </span>
          </div>
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
          stats={stats ?? null}
          quote={quote ? {
            currency: quote.currency,
            year_high: quote.year_high,
            year_low: quote.year_low,
            pct_change_1m: quote.pct_change_1m,
            pct_change_ytd: quote.pct_change_ytd,
          } : null}
        />
      )}
    </div>
  );
}
