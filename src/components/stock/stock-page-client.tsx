"use client";
import { useState, useEffect, useRef } from "react";
import { FeedList } from "@/components/feed/feed-list";
import { PriceChart } from "@/components/stock/price-chart";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { PenLine, X, FileText, ExternalLink } from "lucide-react";
import { formatPrice, formatMarketCap } from "@/lib/utils";
import type { Profile, Sentiment } from "@/types/database";

interface StatsData {
  market_cap: number | null;
  pe_ratio: number | null;
  pb_ratio: number | null;
  dividend_yield: number | null;
}

interface QuoteData {
  currency: string | null;
  year_high: number | null;
  year_low: number | null;
  pct_change_1m: number | null;
  pct_change_ytd: number | null;
}

interface NewsItem {
  title: string;
  link: string;
  source: string;
  pubDate: string;
}

interface StockPageClientProps {
  ticker: string;
  displayTicker: string;
  profile: Profile;
  isPositive: boolean;
  description: string | null;
  stats: StatsData | null;
  quote: QuoteData | null;
}


function NewsShareComposer({
  item,
  ticker,
  displayTicker,
  profile,
  onClose,
  onPost,
}: {
  item: NewsItem;
  ticker: string;
  displayTicker: string;
  profile: Profile;
  onClose: () => void;
  onPost: () => void;
}) {
  const [content, setContent] = useState("");
  const [sentiment, setSentiment] = useState<Sentiment | null>(null);
  const [posting, setPosting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { textareaRef.current?.focus(); }, []);

  const canPost = content.trim().length > 0 && sentiment !== null;

  async function handlePost() {
    if (!canPost) return;
    setPosting(true);
    try {
      await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: `${content}\n\n📰 ${item.title} — ${item.source}\n${item.link}`,
          sentiment,
          post_type: "post",
          tagged_stocks: [displayTicker],
        }),
      });
      onPost();
      onClose();
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="px-5 py-4 border-b border-[#282828] bg-[#0D0D0D]">
      <div className="flex gap-3">
        <Avatar src={profile.avatar_url} alt={profile.display_name} size="md" />
        <div className="flex-1 min-w-0">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={e => setContent(e.target.value.slice(0, 1000))}
            placeholder="Add your take…"
            rows={3}
            className="w-full bg-transparent text-[#F0F0F0] placeholder:text-[#71717A] text-sm resize-none focus:outline-none"
          />

          {/* News preview card */}
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="block border border-[#282828] rounded p-2.5 mb-3 bg-[#141414] hover:border-[#444444] transition-colors"
          >
            <p className="text-xs font-semibold text-[#F0F0F0] leading-snug line-clamp-2">{item.title}</p>
            <p className="text-xs text-[#71717A] mt-1">{item.source} · {new Date(item.pubDate).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" })}</p>
          </a>

          {/* Sentiment */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-[#71717A] uppercase tracking-wider">Sentiment:</span>
            {([
              { value: "bullish" as Sentiment, color: "#22C55E" },
              { value: "bearish" as Sentiment, color: "#EF4444" },
              { value: "neutral" as Sentiment, color: "#9CA3AF" },
            ]).map(({ value: s, color }) => (
              <button
                key={s}
                onClick={() => setSentiment(prev => prev === s ? null : s)}
                className="text-xs px-2 py-1 rounded border transition-colors capitalize"
                style={sentiment === s
                  ? { borderColor: color, color, backgroundColor: `${color}18` }
                  : { borderColor: "#333333", color, opacity: 0.5 }
                }
              >
                {s}
              </button>
            ))}
          </div>

          {/* Tagged stock + actions */}
          <div className="flex items-center justify-between">
            <span className="text-xs bg-[#E8311A]/10 text-[#E8311A] border border-[#E8311A]/20 rounded px-2 py-0.5 font-mono">
              ${displayTicker}
            </span>
            <div className="flex items-center gap-2">
              <button onClick={onClose} className="text-xs text-[#71717A] hover:text-[#9CA3AF] px-3 py-1.5">
                Cancel
              </button>
              <div className="relative group">
                <button
                  onClick={handlePost}
                  disabled={!canPost || posting}
                  className={cn(
                    "text-xs font-bold px-3 py-1.5 rounded transition-colors",
                    canPost && !posting
                      ? "bg-[#E8311A] text-white hover:bg-[#d12d17]"
                      : "bg-[#282828] text-[#71717A] cursor-not-allowed"
                  )}
                >
                  {posting ? "Posting…" : "Huat!"}
                </button>
                {!canPost && !posting && (
                  <div className="absolute bottom-full right-0 mb-2 w-40 bg-[#1C1C1C] border border-[#333333] rounded px-2.5 py-2 text-xs text-[#9CA3AF] shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                    {[
                      !content.trim() && "Add your take",
                      sentiment === null && "Pick a sentiment",
                    ].filter(Boolean).map((msg, i) => (
                      <p key={i} className="leading-snug">· {msg}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface AnnouncementItem {
  title: string;
  attachments: string[];
  pubDate: string;
}

function AnnouncementsTab({ ticker, displayTicker, profile }: { ticker: string; displayTicker: string; profile: Profile }) {
  const [items, setItems] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sharingIdx, setSharingIdx] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/api/stocks/${encodeURIComponent(ticker)}/announcements`)
      .then(r => r.json())
      .then(d => setItems(d.announcements ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [ticker]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-5 h-5 border-2 border-[#333333] border-t-[#E8311A] rounded-full animate-spin" />
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-8">
        <div className="flex items-end gap-0.5 mb-5">
          {[0.5, 1, 0.7].map((h, i) => (
            <span key={i} className="w-1 rounded-full bg-[#E8311A] opacity-40" style={{ height: `${h * 24}px` }} />
          ))}
        </div>
        <p className="text-[#9CA3AF] text-sm">No announcements found</p>
      </div>
    );
  }

  return (
    <div>
      {items.map((item, i) => (
        <div key={i}>
          <div className="flex items-start gap-3 px-5 py-4 border-b border-[#141414]">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#F0F0F0] leading-snug line-clamp-2 mb-1.5">{item.title}</p>
              <div className="flex flex-wrap gap-1.5 mb-1.5">
                {item.attachments.map((url, j) => (
                  <a
                    key={j}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-1.5 text-xs text-[#71717A] hover:text-[#E8311A] border border-[#282828] hover:border-[#E8311A]/40 rounded px-2 py-1 transition-colors"
                  >
                    <FileText className="w-3 h-3 flex-shrink-0" />
                    PDF{item.attachments.length > 1 ? ` ${j + 1}` : ""}
                    <ExternalLink className="w-3 h-3 flex-shrink-0 opacity-50 group-hover:opacity-100" />
                  </a>
                ))}
              </div>
              <span className="text-xs text-[#555555]">
                SGX · {new Date(item.pubDate).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            </div>
            <button
              onClick={() => setSharingIdx(sharingIdx === i ? null : i)}
              className={cn(
                "flex-shrink-0 flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded border transition-colors mt-0.5",
                sharingIdx === i
                  ? "border-[#E8311A] text-[#E8311A] bg-[#E8311A]/10"
                  : "border-[#282828] text-[#71717A] hover:border-[#E8311A] hover:text-[#E8311A]"
              )}
            >
              {sharingIdx === i ? <X className="w-3 h-3" /> : <PenLine className="w-3 h-3" />}
              Post
            </button>
          </div>
          {sharingIdx === i && (
            <NewsShareComposer
              item={{ title: item.title, link: item.attachments[0], source: "SGX", pubDate: item.pubDate }}
              ticker={ticker}
              displayTicker={displayTicker}
              profile={profile}
              onClose={() => setSharingIdx(null)}
              onPost={() => setSharingIdx(null)}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function NewsTab({ ticker, displayTicker, profile }: { ticker: string; displayTicker: string; profile: Profile }) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sharingIdx, setSharingIdx] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/api/stocks/${encodeURIComponent(ticker)}/news`)
      .then(r => r.json())
      .then(d => setNews(d.news ?? []))
      .catch(() => setNews([]))
      .finally(() => setLoading(false));
  }, [ticker]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-5 h-5 border-2 border-[#333333] border-t-[#E8311A] rounded-full animate-spin" />
      </div>
    );
  }

  if (!news.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-8">
        <div className="flex items-end gap-0.5 mb-5">
          {[0.5, 1, 0.7].map((h, i) => (
            <span key={i} className="w-1 rounded-full bg-[#E8311A] opacity-40" style={{ height: `${h * 24}px` }} />
          ))}
        </div>
        <p className="text-[#9CA3AF] text-sm">No news found</p>
      </div>
    );
  }

  return (
    <div>
      {news.map((item, i) => (
        <div key={i}>
          <div className="flex items-start gap-3 px-5 py-4 border-b border-[#141414]">
            <div className="flex-1 min-w-0">
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-[#F0F0F0] leading-snug hover:text-white line-clamp-2"
              >
                {item.title}
              </a>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-[#71717A]">{item.source}</span>
                <span className="text-xs text-[#333333]">·</span>
                <span className="text-xs text-[#71717A]">
                  {new Date(item.pubDate).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </div>
            </div>
            <button
              onClick={() => setSharingIdx(sharingIdx === i ? null : i)}
              className={cn(
                "flex-shrink-0 flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded border transition-colors mt-0.5",
                sharingIdx === i
                  ? "border-[#E8311A] text-[#E8311A] bg-[#E8311A]/10"
                  : "border-[#282828] text-[#71717A] hover:border-[#E8311A] hover:text-[#E8311A]"
              )}
            >
              {sharingIdx === i ? <X className="w-3 h-3" /> : <PenLine className="w-3 h-3" />}
              Post
            </button>
          </div>
          {sharingIdx === i && (
            <NewsShareComposer
              item={item}
              ticker={ticker}
              displayTicker={displayTicker}
              profile={profile}
              onClose={() => setSharingIdx(null)}
              onPost={() => setSharingIdx(null)}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export function StockPageClient({
  ticker,
  displayTicker,
  profile,
  isPositive,
  description,
  stats,
  quote,
}: StockPageClientProps) {
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [topTab, setTopTab] = useState("posts");

  function switchTab(id: string) {
    setTopTab(id);
    window.scrollTo({ top: 0 });
  }

  const TOP_TABS = [
    { id: "posts",        label: "Posts" },
    { id: "research",     label: "Research" },
    { id: "announcement", label: "Announcements" },
    { id: "news",         label: "News" },
  ];

  return (
    <>
      {/* Chart */}
      <PriceChart ticker={ticker} initialPositive={isPositive} />

      {/* Stats grid */}
      {(stats || quote) && (
        <div className="px-5 py-4 border-b border-[#282828] bg-[#080808]">
          <div className="grid grid-cols-4 gap-x-2 sm:gap-x-4 gap-y-2 sm:gap-y-3">
            {[
              { label: "Mkt Cap",   value: formatMarketCap(stats?.market_cap ?? null), color: null },
              { label: "P/E",       value: stats?.pe_ratio?.toFixed(1) ?? "--", color: null },
              { label: "P/B",       value: stats?.pb_ratio?.toFixed(2) ?? "--", color: null },
              { label: "Div Yield", value: stats?.dividend_yield ? `${stats.dividend_yield.toFixed(2)}%` : "--", color: null },
              { label: "52W High",  value: quote?.year_high != null ? formatPrice(quote.year_high, quote?.currency ?? "SGD") : "--", color: null },
              { label: "52W Low",   value: quote?.year_low != null ? formatPrice(quote.year_low, quote?.currency ?? "SGD") : "--", color: null },
              { label: "1M Chg",    value: quote?.pct_change_1m != null ? `${quote.pct_change_1m > 0 ? "+" : ""}${quote.pct_change_1m.toFixed(1)}%` : "--", color: quote?.pct_change_1m != null ? (quote.pct_change_1m >= 0 ? "#22C55E" : "#EF4444") : null },
              { label: "YTD",       value: quote?.pct_change_ytd != null ? `${quote.pct_change_ytd > 0 ? "+" : ""}${quote.pct_change_ytd.toFixed(1)}%` : "--", color: quote?.pct_change_ytd != null ? (quote.pct_change_ytd >= 0 ? "#22C55E" : "#EF4444") : null },
            ].map(item => (
              <div key={item.label}>
                <p className="text-[10px] sm:text-xs text-[#71717A] uppercase tracking-wider">{item.label}</p>
                <p className="text-xs sm:text-sm font-bold font-mono mt-0.5" style={{ color: item.color ?? "#F0F0F0" }}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

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

      {/* Tabs */}
      <div className="sticky top-14 z-10 bg-[#0A0A0A]/95 backdrop-blur-md overflow-anchor-none" style={{ overflowAnchor: "none" }}>
        {/* Top row */}
        <div className="flex border-b border-[#282828]">
          {TOP_TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => switchTab(id)}
              className={cn(
                "flex-1 py-3.5 text-sm font-medium transition-colors relative",
                topTab === id ? "text-[#F0F0F0]" : "text-[#9CA3AF] hover:text-[#F0F0F0]"
              )}
            >
              {label}
              {topTab === id && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#E8311A] rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {topTab === "news" ? (
        <NewsTab ticker={ticker} displayTicker={displayTicker} profile={profile} />
      ) : topTab === "announcement" ? (
        <AnnouncementsTab ticker={ticker} displayTicker={displayTicker} profile={profile} />
      ) : (
        <FeedList
          tab="foryou"
          profile={profile}
          stockTicker={displayTicker ?? ticker}
          postType={topTab === "posts" ? undefined : topTab}
        />
      )}
    </>
  );
}
