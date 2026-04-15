"use client";
import { useState, useEffect, useRef } from "react";
import { FeedList } from "@/components/feed/feed-list";
import { PriceChart } from "@/components/stock/price-chart";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { PenLine, X, FileText, ExternalLink } from "lucide-react";
import { recordStockVisit } from "@/components/layout/last-visited-widget";
import { formatPrice, formatMarketCap } from "@/lib/utils";
import { stripHtml } from "@/lib/smartkarma/primer";
import type { Profile, Sentiment } from "@/types/database";

function SignupGate({ stockName, followerCount, postCount }: { stockName: string; followerCount: number; postCount: number }) {
  // Fake post rows shown blurred behind the CTA
  const fakePosts = [
    { initials: "RK", name: "Raghav K", time: "2h", lines: ["Strong Q3 results. Revenue up 18% YoY, margins expanding. Adding to position.", "Risk: customer concentration still high."] },
    { initials: "JL", name: "James L", time: "5h", lines: ["Bearish near-term — order book softening per channel checks. Wait for better entry."] },
    { initials: "ST", name: "Serene T", time: "1d", lines: ["Dividend raised again. Solid balance sheet. Long-term hold for me."] },
  ];

  return (
    <div className="relative overflow-hidden">
      {/* Blurred fake posts */}
      <div style={{ filter: "blur(4px)", opacity: 0.45, pointerEvents: "none", userSelect: "none" }}>
        {fakePosts.map((p, i) => (
          <div key={i} className="px-5 py-4 border-b border-[#141414]">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#282828] flex items-center justify-center text-[10px] font-bold text-[#9CA3AF] flex-shrink-0">{p.initials}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-sm font-semibold text-[#F0F0F0]">{p.name}</span>
                  <span className="text-xs text-[#555555]">{p.time} ago</span>
                </div>
                {p.lines.map((l, j) => (
                  <p key={j} className="text-sm text-[#C0C0C0] leading-relaxed">{l}</p>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Frosted overlay + CTA */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center"
        style={{ background: "linear-gradient(to bottom, rgba(10,10,10,0.1) 0%, rgba(10,10,10,0.92) 35%)" }}>
        {/* Logo + slogan */}
        <div className="mb-5">
          <p className="text-2xl font-black text-[#E8311A] tracking-tight leading-none mb-1">Huat 发</p>
          <p className="text-[10px] text-[#555555] uppercase tracking-widest">Invest Together. Prosper Together.</p>
        </div>
        <p className="text-[#F0F0F0] font-black text-lg mb-1">
          What are investors saying about {stockName}?
        </p>
        <p className="text-[#71717A] text-sm mb-6 max-w-sm">
          Join Huat.co free — see investor posts, news, announcements and research.
        </p>
        <div className="flex gap-3">
          <a href="/login" className="px-6 py-2.5 rounded bg-[#E8311A] text-white text-sm font-bold hover:bg-[#D02A15] transition-colors">
            Sign up free
          </a>
          <a href="/login" className="px-6 py-2.5 rounded border border-[#333333] text-[#9CA3AF] text-sm font-medium hover:text-[#F0F0F0] hover:border-[#444444] transition-colors">
            Log in
          </a>
        </div>
        <p className="mt-4 text-xs text-[#555555]">
          {followerCount >= 500 && postCount >= 500
            ? <>{followerCount.toLocaleString()} investors watching · {postCount.toLocaleString()} posts</>
            : followerCount >= 500
            ? <>{followerCount.toLocaleString()} investors already watching {stockName}</>
            : postCount >= 500
            ? <>{postCount.toLocaleString()} posts about {stockName}</>
            : <>Join Singapore's investing community. It's free.</>}
        </p>
      </div>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="animate-pulse">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="px-5 py-4 border-b border-[#141414]">
          <div className="h-3 w-4/5 rounded bg-[#1C1C1C] mb-2" />
          <div className="h-3 w-3/5 rounded bg-[#1C1C1C] mb-3" />
          <div className="h-2.5 w-28 rounded bg-[#141414]" />
        </div>
      ))}
    </div>
  );
}

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

interface PrimerSummary {
  executive_summary: string[];
  three_bullish_points: string[];
  three_bearish_points: string[];
  key_risks: string[];
}

interface StockPageClientProps {
  ticker: string;
  displayTicker: string;
  stockName: string;
  profile: Profile | null;
  isPositive: boolean;
  isPublic?: boolean;
  followerCount?: number;
  postCount?: number;
  description: string | null;
  stats: StatsData | null;
  quote: QuoteData | null;
  primer: PrimerSummary | null;
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
              {displayTicker}
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
                    "text-sm font-semibold px-4 py-2 rounded transition-all duration-150",
                    canPost && !posting
                      ? "bg-[#E8311A] text-white hover:bg-[#c9280f] active:scale-[0.98]"
                      : "bg-[#282828] text-[#71717A] cursor-not-allowed"
                  )}
                >
                  {posting ? "Posting…" : "Huat 发"}
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

interface ResearchItem {
  tagline: string;
  executive_summary: string;
  url: string;
  author: string;
  published_at: string;
}

function ResearchShareComposer({
  item,
  ticker,
  displayTicker,
  profile,
  onClose,
  onPost,
}: {
  item: ResearchItem;
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
          content: `${content}\n\n📰 ${item.tagline} — Smartkarma\n${item.url}`,
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
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block border border-[#282828] rounded p-2.5 mb-3 bg-[#141414] hover:border-[#444444] transition-colors"
          >
            <p className="text-xs font-semibold text-[#F0F0F0] leading-snug line-clamp-2">{item.tagline}</p>
            <p className="text-xs text-[#71717A] mt-1">{item.author}</p>
          </a>
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
          <div className="flex items-center justify-between">
            <span className="text-xs bg-[#E8311A]/10 text-[#E8311A] border border-[#E8311A]/20 rounded px-2 py-0.5 font-mono">
              {displayTicker}
            </span>
            <div className="flex items-center gap-2">
              <button onClick={onClose} className="text-xs text-[#71717A] hover:text-[#9CA3AF] px-3 py-1.5">Cancel</button>
              <div className="relative group">
                <button
                  onClick={handlePost}
                  disabled={!canPost || posting}
                  className={cn(
                    "text-xs font-bold px-3 py-1.5 rounded transition-colors",
                    canPost && !posting ? "bg-[#E8311A] text-white hover:bg-[#d12d17]" : "bg-[#282828] text-[#71717A] cursor-not-allowed"
                  )}
                >
                  {posting ? "Posting…" : "Huat!"}
                </button>
                {!canPost && !posting && (
                  <div className="absolute bottom-full right-0 mb-2 w-40 bg-[#1C1C1C] border border-[#333333] rounded px-2.5 py-2 text-xs text-[#9CA3AF] shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                    {[!content.trim() && "Add your take", sentiment === null && "Pick a sentiment"].filter(Boolean).map((msg, i) => (
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

function ResearchTab({ ticker, displayTicker, profile }: { ticker: string; displayTicker: string; profile: Profile }) {
  const [items, setItems] = useState<ResearchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sharingIdx, setSharingIdx] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/api/stocks/${encodeURIComponent(ticker)}/research`)
      .then(r => r.json())
      .then(d => setItems(d.research ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [ticker]);

  if (loading) {
    return <ListSkeleton />;
  }

  if (!items.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-8">
        <div className="flex items-end gap-0.5 mb-5">
          {[0.5, 1, 0.7].map((h, i) => (
            <span key={i} className="w-1 rounded-full bg-[#E8311A] opacity-40" style={{ height: `${h * 24}px` }} />
          ))}
        </div>
        <p className="text-[#9CA3AF] text-sm">No research found</p>
      </div>
    );
  }

  return (
    <div>
      {items.map((item, i) => (
        <div key={i}>
          <div className="flex items-start gap-3 px-5 py-4 border-b border-[#141414]">
            <div className="flex-1 min-w-0">
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-[#F0F0F0] leading-snug hover:text-white line-clamp-2 block mb-2"
              >
                {item.tagline}
              </a>
              {item.executive_summary && (
                <div className="mb-2">
                  <p className="text-[10px] font-bold text-[#555555] uppercase tracking-wider mb-1.5">Executive Summary</p>
                  <div
                    className="research-html text-xs text-[#9CA3AF] leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: item.executive_summary }}
                  />
                </div>
              )}
              <span className="text-xs text-[#555555]">
                {item.author} · {new Date(item.published_at).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" })}
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
            <ResearchShareComposer
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
    return <ListSkeleton />;
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
    return <ListSkeleton />;
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
  stockName,
  profile,
  isPositive,
  isPublic = false,
  followerCount = 0,
  postCount = 0,
  description,
  stats,
  quote,
  primer,
}: StockPageClientProps) {
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const [bullishExpanded, setBullishExpanded] = useState(false);
  const [bearishExpanded, setBearishExpanded] = useState(false);
  const [risksExpanded, setRisksExpanded] = useState(false);
  const [topTab, setTopTab] = useState("posts");

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    recordStockVisit({ ticker: displayTicker, name: stockName, slug: ticker });
  }, [ticker, displayTicker, stockName]);

  function switchTab(id: string) {
    setTopTab(id);
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
      <PriceChart ticker={ticker} initialPositive={isPositive} isPublic={isPublic} />

      {/* Stats grid */}
      {(stats || quote) && (
        <div className="px-5 py-4 border-b border-[#282828] bg-[#080808]">
          <div className="grid grid-cols-4 gap-x-4 gap-y-3">
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

      {/* Fallback About — only shown if no primer data (left panel handles primer overview) */}
      {!primer && description && (
        <div className="px-5 py-4 border-b border-[#282828]">
          <div className="border border-[#282828] rounded-lg p-4">
            <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider mb-3">About</p>
            <p className="text-xs text-[#C0C0C0] leading-relaxed">
              {showFullDesc ? (
                <>{description}<button onClick={() => setShowFullDesc(false)} className="ml-1.5 text-[11px] text-[#71717A] hover:text-[#F0F0F0] transition-colors">Show less</button></>
              ) : (
                <>{description.slice(0, 200)}…<button onClick={() => setShowFullDesc(true)} className="ml-1 text-[11px] text-[#71717A] hover:text-[#F0F0F0] transition-colors">Show more</button></>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Primer: Executive Summary + Bull/Bear */}
      {primer && (primer.executive_summary.length > 0 || primer.three_bullish_points.length > 0 || primer.three_bearish_points.length > 0 || primer.key_risks.length > 0) && (
        <div className="px-5 py-4 border-b border-[#282828] space-y-3">
          {/* Executive Summary */}
          {primer.executive_summary.length > 0 && (
            <div className="widget-hover border border-[#282828] rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider">Executive Summary</p>
                <a href="https://www.smartkarma.com/home/smartwealth/" target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#555555] hover:text-[#9CA3AF] transition-colors">by Smartkarma</a>
              </div>
              <ul className="space-y-2">
                {(summaryExpanded ? primer.executive_summary : primer.executive_summary.slice(0, 1)).map((point, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-[#555555] flex-shrink-0 mt-0.5">·</span>
                    <span className="text-xs text-[#C0C0C0] leading-relaxed"
                      style={(!summaryExpanded && i === 0) ? { display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" } : undefined}>
                      {stripHtml(point)}
                    </span>
                  </li>
                ))}
              </ul>
              <button onClick={() => setSummaryExpanded(e => !e)} className="mt-2 text-[11px] text-[#71717A] hover:text-[#F0F0F0] transition-colors">
                {summaryExpanded ? "Show less" : "Show more"}
              </button>
            </div>
          )}

          {/* Bullish + Bearish side by side */}
          {(primer.three_bullish_points.length > 0 || primer.three_bearish_points.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {primer.three_bullish_points.length > 0 && (
                <div className="widget-hover border border-[#282828] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold text-[#22C55E] uppercase tracking-wider">Bullish</p>
                    <a href="https://www.smartkarma.com/home/smartwealth/" target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#555555] hover:text-[#9CA3AF] transition-colors">by Smartkarma</a>
                  </div>
                  <ul className="space-y-2">
                    {(bullishExpanded ? primer.three_bullish_points : primer.three_bullish_points.slice(0, 1)).map((point, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-[#22C55E] flex-shrink-0 mt-0.5 text-xs font-bold">+</span>
                        <span className="text-xs text-[#9CA3AF] leading-relaxed"
                          style={(!bullishExpanded && i === 0) ? { display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" } : undefined}>
                          {stripHtml(point)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <button onClick={() => setBullishExpanded(e => !e)} className="mt-2 text-[11px] text-[#71717A] hover:text-[#F0F0F0] transition-colors">
                    {bullishExpanded ? "Show less" : "Show more"}
                  </button>
                </div>
              )}
              {primer.three_bearish_points.length > 0 && (
                <div className="widget-hover border border-[#282828] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold text-[#EF4444] uppercase tracking-wider">Bearish</p>
                    <a href="https://www.smartkarma.com/home/smartwealth/" target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#555555] hover:text-[#9CA3AF] transition-colors">by Smartkarma</a>
                  </div>
                  <ul className="space-y-2">
                    {(bearishExpanded ? primer.three_bearish_points : primer.three_bearish_points.slice(0, 1)).map((point, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-[#EF4444] flex-shrink-0 mt-0.5 text-xs font-bold">−</span>
                        <span className="text-xs text-[#9CA3AF] leading-relaxed"
                          style={(!bearishExpanded && i === 0) ? { display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" } : undefined}>
                          {stripHtml(point)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <button onClick={() => setBearishExpanded(e => !e)} className="mt-2 text-[11px] text-[#71717A] hover:text-[#F0F0F0] transition-colors">
                    {bearishExpanded ? "Show less" : "Show more"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Key Risks */}
          {primer.key_risks.length > 0 && (
            <div className="widget-hover border border-[#282828] rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-[#EF4444] uppercase tracking-wider">Key Risks</p>
                <a href="https://www.smartkarma.com/home/smartwealth/" target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#555555] hover:text-[#9CA3AF] transition-colors">by Smartkarma</a>
              </div>
              <ul className="space-y-2">
                {(risksExpanded ? primer.key_risks : primer.key_risks.slice(0, 1)).map((point, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-[#EF4444] flex-shrink-0 mt-0.5 text-xs font-bold">!</span>
                    <span className="text-xs text-[#9CA3AF] leading-relaxed"
                      style={(!risksExpanded && i === 0) ? { display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" } : undefined}>
                      {stripHtml(point)}
                    </span>
                  </li>
                ))}
              </ul>
              <button onClick={() => setRisksExpanded(e => !e)} className="mt-2 text-[11px] text-[#71717A] hover:text-[#F0F0F0] transition-colors">
                {risksExpanded ? "Show less" : "Show more"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Community header + tabs */}
      <div className="sticky top-14 z-10 bg-[#0A0A0A]/95 backdrop-blur-md" style={{ overflowAnchor: "none" }}>
        <div className="flex border-b border-[#282828]">
          {TOP_TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => switchTab(id)}
              className={cn(
                "flex-1 py-3 text-sm font-semibold cursor-pointer",
                topTab === id ? "text-[#F0F0F0]" : "text-[#555555] hover:text-[#9CA3AF]"
              )}
              style={{
                transition: "background 0.2s ease-in-out, border-color 0.2s ease-in-out, color 0.2s ease-in-out",
                background: topTab === id ? "rgba(232, 49, 26, 0.1)" : "transparent",
                borderBottom: topTab === id ? "1px solid rgb(232, 49, 26)" : "1px solid transparent",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {!profile ? (
        <SignupGate stockName={stockName} followerCount={followerCount} postCount={postCount} />
      ) : topTab === "news" ? (
        <NewsTab ticker={ticker} displayTicker={displayTicker} profile={profile} />
      ) : topTab === "announcement" ? (
        <AnnouncementsTab ticker={ticker} displayTicker={displayTicker} profile={profile} />
      ) : topTab === "research" ? (
        <ResearchTab ticker={ticker} displayTicker={displayTicker} profile={profile} />
      ) : (
        <FeedList
          tab="foryou"
          profile={profile}
          stockTicker={displayTicker ?? ticker}
          postType={undefined}
        />
      )}
    </>
  );
}
