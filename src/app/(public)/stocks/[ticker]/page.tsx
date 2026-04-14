import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getStockBySlugOrTicker } from "@/lib/stocks-db/client";
import { getQuote, getCurrentStats } from "@/lib/smartkarma/client";
import { getPrimer } from "@/lib/smartkarma/primer";
import { createClient } from "@/lib/supabase/server";
import { StockPageClient } from "@/components/stock/stock-page-client";
import { FollowButton } from "@/components/stock/follow-button";
import { formatPrice } from "@/lib/utils";
import { StockPageSkeleton } from "@/components/stock/stock-page-skeleton";
import type { Profile } from "@/types/database";

interface StockPageProps {
  params: Promise<{ ticker: string }>;
}

export async function generateMetadata({ params }: StockPageProps): Promise<Metadata> {
  const { ticker } = await params;
  const identifier = decodeURIComponent(ticker);
  const stock = await getStockBySlugOrTicker(identifier).catch(() => null);
  if (!stock) return { title: "Stock — Huat.co" };

  const displayTicker = (stock.bloomberg_ticker ?? identifier).replace(/ SP$/, "");
  const title = `${stock.name} (${displayTicker}) — Huat.co`;
  const description = stock.description
    ? stock.description.slice(0, 160)
    : `Follow ${stock.name} on Huat.co — Singapore's social network for retail investors. See investor posts, news, and analysis.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://www.huat.co/stocks/${encodeURIComponent(ticker)}`,
      siteName: "Huat.co",
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
    alternates: {
      canonical: `https://www.huat.co/stocks/${encodeURIComponent(ticker)}`,
    },
  };
}

async function StockPageContent({
  identifier,
  rawTicker,
  stock,
  profile,
}: {
  identifier: string;
  rawTicker: string;
  stock: Awaited<ReturnType<typeof getStockBySlugOrTicker>>;
  profile: Profile | null;
}) {
  if (!stock) return null;
  const ticker = stock.bloomberg_ticker ?? identifier;
  const isPublic = !profile;

  const supabase = await createClient();
  const [quote, stats, primer, watchlistRes, followerRes, postCountRes] = await Promise.all([
    isPublic ? Promise.resolve(null) : getQuote(ticker).catch(() => null),
    stock.isin ? getCurrentStats(stock.isin).catch(() => null) : null,
    stock.bloomberg_ticker ? getPrimer(stock.bloomberg_ticker).catch(() => null) : null,
    profile
      ? supabase.from("stock_watchlist").select("ticker").eq("user_id", profile.id).eq("ticker", ticker).maybeSingle()
      : { data: null },
    supabase.from("stock_watchlist").select("user_id", { count: "exact", head: true }).eq("ticker", ticker),
    supabase.from("posts").select("id", { count: "exact", head: true }).contains("tagged_stocks", [ticker]),
  ]);

  const isPositive = (quote?.change ?? 0) >= 0;
  const isFollowing = !!watchlistRes.data;
  const followerCount = followerRes.count ?? 0;
  const postCount = postCountRes.count ?? 0;

  return (
    <>
      {/* Unified header */}
      <div className="border-b border-[#282828] px-5 py-4 bg-[#080808]">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-base sm:text-xl font-black text-[#F0F0F0] leading-snug">{stock!.name}</h1>
            <p className="text-xs text-[#71717A] font-mono mt-0.5">
              {ticker} · {stock!.exchange_code ?? "SGX"}
              {stock!.sector && ` · ${stock!.sector}`}
            </p>
            <div className="flex flex-wrap items-baseline gap-2 mt-2">
              {isPublic ? (
                <a href="/login" className="group flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black font-mono text-[#F0F0F0] select-none" style={{ filter: "blur(6px)" }}>
                    S$1.234
                  </span>
                  <span className="text-sm font-bold text-[#22C55E] select-none" style={{ filter: "blur(4px)" }}>
                    +0.012 (+0.98%)
                  </span>
                  <span className="text-xs text-[#555555] group-hover:text-[#9CA3AF] transition-colors ml-1">
                    (yours if you join) →
                  </span>
                </a>
              ) : quote?.price != null ? (
                <>
                  <span className="text-2xl sm:text-3xl font-black text-[#F0F0F0] font-mono">
                    {formatPrice(quote.price, quote.currency ?? "SGD")}
                  </span>
                  <span className={`text-sm font-bold ${isPositive ? "text-[#22C55E]" : "text-[#EF4444]"}`}>
                    {isPositive ? "+" : ""}{quote.change?.toFixed(3)} ({isPositive ? "+" : ""}{quote.change_pct?.toFixed(2)}%)
                  </span>
                </>
              ) : (
                <span className="text-[#71717A] text-sm">Price unavailable</span>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            {(followerCount > 100 || postCount > 100) && (
              <div className="flex items-center gap-3">
                {followerCount > 100 && <span className="text-sm font-bold text-[#F0F0F0]">{followerCount.toLocaleString()} <span className="text-xs text-[#71717A] font-normal">followers</span></span>}
                {postCount > 100 && <span className="text-sm font-bold text-[#F0F0F0]">{postCount.toLocaleString()} <span className="text-xs text-[#71717A] font-normal">posts</span></span>}
              </div>
            )}
            {profile && (
              <FollowButton
                ticker={rawTicker}
                initialFollowing={isFollowing}
                initialFollowerCount={followerCount}
              />
            )}
          </div>
        </div>
      </div>

      <StockPageClient
        ticker={rawTicker}
        displayTicker={ticker}
        stockName={stock.name}
        isPublic={isPublic}
        profile={profile}
        isPositive={isPositive}
        description={stock.description ?? null}
        stats={stats ?? null}
        primer={primer?.primer ? {
          executive_summary: primer.primer.executive_summary,
          three_bullish_points: primer.primer.three_bullish_points,
          three_bearish_points: primer.primer.three_bearish_points,
          key_risks: primer.primer.key_risks,
        } : null}
        quote={quote ? {
          currency: quote.currency,
          year_high: quote.year_high,
          year_low: quote.year_low,
          pct_change_1m: quote.pct_change_1m,
          pct_change_ytd: quote.pct_change_ytd,
        } : null}
      />
    </>
  );
}

export default async function StockPage({ params }: StockPageProps) {
  const { ticker: rawTicker } = await params;
  const identifier = decodeURIComponent(rawTicker);

  const supabase = await createClient();
  const [{ data: { user } }, stock] = await Promise.all([
    supabase.auth.getUser(),
    getStockBySlugOrTicker(identifier).catch(() => null),
  ]);

  if (!stock) notFound();

  const { data: profile } = user
    ? await supabase.from("profiles").select("id, username, display_name, avatar_url, bio, country, is_verified, created_at").eq("id", user.id).single()
    : { data: null };

  return (
    <div>
      <Suspense fallback={<StockPageSkeleton />}>
        <StockPageContent
          identifier={identifier}
          rawTicker={rawTicker}
          stock={stock}
          profile={profile as Profile | null}
        />
      </Suspense>
    </div>
  );
}
