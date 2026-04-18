"use client";
import React, { useState, useRef, useEffect } from "react";
import { Image as ImageIcon, BarChart2, TrendingUp, TrendingDown, MoveHorizontal, X, Plus, Crosshair } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useMentions } from "@/hooks/use-mentions";
import { MentionDropdown } from "@/components/ui/mention-dropdown";
import type { Profile, Sentiment, PostType } from "@/types/database";

interface PollOption { id: string; text: string; }
interface ForecastData { ticker: string; targetPrice: string; targetDate: string; }

interface QuotedPostInfo {
  id: string;
  content: string;
  author?: { display_name?: string; username?: string };
  tagged_stocks?: string[];
}

interface PostComposerProps {
  profile: Profile;
  onPost?: (newPost?: Record<string, unknown>) => void;
  defaultTicker?: string;
  quotedPost?: QuotedPostInfo | null;
  onCancelQuote?: () => void;
}

const MAX_CHARS = 1000;

export function PostComposer({ profile, onPost, defaultTicker, quotedPost, onCancelQuote }: PostComposerProps) {
  const [content, setContent] = useState("");
  const [sentiment, setSentiment] = useState<Sentiment | null>(null);
  const [postType, setPostType] = useState<PostType>("post");
  const [taggedStocks, setTaggedStocks] = useState<string[]>(defaultTicker ? [defaultTicker] : []);
  const [stockSearch, setStockSearch] = useState("");
  const [stockSuggestions, setStockSuggestions] = useState<{ bloomberg_ticker: string; name: string }[]>([]);
  const [stockDropdownOpen, setStockDropdownOpen] = useState(false);
  const stockDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stockInputRef = useRef<HTMLInputElement>(null);
  const stockContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mentions = useMentions(textareaRef, content, setContent);
  const [pollOptions, setPollOptions] = useState<PollOption[]>([
    { id: "1", text: "" }, { id: "2", text: "" },
  ]);
  const [pollDays, setPollDays] = useState(3);
  const [forecast, setForecast] = useState<ForecastData>({ ticker: "", targetPrice: "", targetDate: "" });
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [fetchingPrice, setFetchingPrice] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [posting, setPosting] = useState(false);
  const [attachments, setAttachments] = useState<{ url: string; type: "image" | "video" | "pdf" }[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const [linkPreview, setLinkPreview] = useState<{ url: string; og_title?: string | null; og_description?: string | null; og_image?: string | null; og_site_name?: string | null } | null>(null);
  const [linkPreviewDismissed, setLinkPreviewDismissed] = useState(false);
  const linkDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (stockContainerRef.current && !stockContainerRef.current.contains(e.target as Node)) {
        setStockDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // When quoting, prefill stock and focus textarea
  useEffect(() => {
    if (quotedPost) {
      if (quotedPost.tagged_stocks?.length) {
        setTaggedStocks(quotedPost.tagged_stocks.slice(0, 1));
      }
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [quotedPost]);

  // Fetch current price when forecast mode + stock tagged
  const taggedTicker = taggedStocks[0] ?? "";
  useEffect(() => {
    if (postType !== "forecast" || !taggedTicker) { setCurrentPrice(null); return; }
    let cancelled = false;
    setFetchingPrice(true);
    setForecast(f => ({ ...f, ticker: taggedTicker }));
    fetch(`/api/stocks/${encodeURIComponent(taggedTicker)}/quote`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (cancelled) return;
        const price = data?.quote?.price ?? data?.quote?.last ?? data?.quote?.close ?? null;
        setCurrentPrice(typeof price === "number" ? price : null);
      })
      .catch(() => { if (!cancelled) setCurrentPrice(null); })
      .finally(() => { if (!cancelled) setFetchingPrice(false); });
    return () => { cancelled = true; };
  }, [postType, taggedTicker]);

  // Detect URLs in content and fetch OG preview
  useEffect(() => {
    if (linkPreviewDismissed) return;
    const urlMatch = content.match(/https?:\/\/[^\s]+/);
    const url = urlMatch?.[0];
    if (!url) { setLinkPreview(null); return; }
    if (linkPreview?.url === url) return;
    if (linkDebounceRef.current) clearTimeout(linkDebounceRef.current);
    linkDebounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/og?url=${encodeURIComponent(url)}`);
        if (!res.ok) return;
        const data = await res.json();
        setLinkPreview({ url, ...data });
      } catch { /* silent */ }
    }, 600);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, linkPreviewDismissed]);

  function handleStockSearchChange(val: string) {
    setStockSearch(val);
    setStockDropdownOpen(false);
    setStockSuggestions([]);
    if (!val.trim()) return;
    if (stockDebounceRef.current) clearTimeout(stockDebounceRef.current);
    stockDebounceRef.current = setTimeout(async () => {
      const res = await fetch(`/api/stocks?q=${encodeURIComponent(val)}`).then(r => r.json()).catch(() => ({ stocks: [] }));
      const filtered = (res.stocks ?? []).filter((s: { bloomberg_ticker: string }) => s.bloomberg_ticker && !taggedStocks.includes(s.bloomberg_ticker));
      setStockSuggestions(filtered.slice(0, 6));
      setStockDropdownOpen(filtered.length > 0);
    }, 200);
  }

  function addStock(ticker: string) {
    setTaggedStocks([ticker]);
    setStockSearch("");
    setStockSuggestions([]);
    setStockDropdownOpen(false);
    setTimeout(() => textareaRef.current?.focus(), 0);
  }

  const remaining = MAX_CHARS - content.length;
  const pollValid = postType !== "poll" || pollOptions.filter(o => o.text.trim()).length >= 2;
  const forecastValid = postType !== "forecast" || (!!forecast.targetPrice && !!forecast.targetDate);
  const forecastSentiment: Sentiment | null = postType === "forecast" && currentPrice && forecast.targetPrice
    ? (parseFloat(forecast.targetPrice) >= currentPrice ? "bullish" : "bearish")
    : null;
  const canPost = content.trim().length > 0 && !posting && taggedStocks.length === 1 && (postType === "poll" || postType === "forecast" || sentiment !== null) && pollValid && forecastValid;

  async function handlePost() {
    if (!canPost) return;
    setPosting(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          sentiment: postType === "poll" ? "neutral" : postType === "forecast" ? forecastSentiment : sentiment,
          post_type: postType,
          tagged_stocks: taggedStocks,
          ...(quotedPost ? { quote_of: quotedPost.id } : {}),
          attachments: [
            ...attachments.map(a => ({ url: a.url, type: a.type === "pdf" ? "pdf" : a.type })),
            ...(linkPreview && !linkPreviewDismissed ? [{
              url: linkPreview.url,
              type: "link",
              og_title: linkPreview.og_title,
              og_description: linkPreview.og_description,
              og_image: linkPreview.og_image,
              og_site_name: linkPreview.og_site_name,
            }] : []),
          ],
          ...(postType === "poll" && { poll: { options: pollOptions.filter(o => o.text.trim()), ends_at: new Date(Date.now() + pollDays * 86400000).toISOString() } }),
          ...(postType === "forecast" && { forecast: { ...forecast, ticker: taggedStocks[0] } }),
        }),
      });
      const newPost = res.ok ? (await res.json()).post : undefined;
      setContent("");
      setSentiment(null);
      setPostType("post");
      setTaggedStocks([]);
      setAttachments([]);
      setPollOptions([{ id: "1", text: "" }, { id: "2", text: "" }]);
      setPollDays(3);
      setLinkPreview(null);
      setLinkPreviewDismissed(false);
      onCancelQuote?.();
      onPost?.(newPost);
    } finally {
      setPosting(false);
    }
  }

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    const toUpload = Array.from(files).slice(0, 4 - attachments.length);
    setPendingCount(toUpload.length);
    setUploading(true);
    try {
      const formData = new FormData();
      toUpload.forEach(f => formData.append("files", f));
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) { console.error("Upload failed:", res.status); return; }
      const data = await res.json();
      if (data.errors?.length) console.warn("Upload errors:", data.errors);
      const uploaded: { url: string; type: "image" | "video" | "pdf" }[] = data.files ?? (data.urls ?? []).map((u: string) => ({ url: u, type: "image" as const }));
      setAttachments(prev => [...prev, ...uploaded].slice(0, 4));
    } finally {
      setUploading(false);
      setPendingCount(0);
    }
  }

  return (
    <div className="border-b border-[#282828] px-5 py-4">
      <div className="flex gap-3">
        <Avatar src={profile.avatar_url} alt={profile.display_name} size="md" />
        <div className="flex-1">
          {/* Steps: each row is number + field side by side */}
          <div className="space-y-3">

            {/* Step 1: Stock tagger */}
            <div className="flex gap-2 items-start">
              <span className="text-xs font-black text-[#555555] pt-2 leading-none flex-shrink-0 w-3 text-center">1</span>
              <div ref={stockContainerRef} className="relative flex-1 min-w-0">
                {taggedStocks.length === 0 ? (
                  <div className="flex items-center gap-2 bg-[#141414] border border-[#333333] rounded-lg px-3 py-2 focus-within:border-[#444444] transition-colors">
                    <input
                      ref={stockInputRef}
                      value={stockSearch}
                      onChange={e => handleStockSearchChange(e.target.value)}
                      onKeyDown={e => { if (e.key === "Escape") { setStockDropdownOpen(false); setStockSearch(""); } }}
                      placeholder="Tag a stock…"
                      className="flex-1 bg-transparent text-sm text-[#F0F0F0] placeholder:text-[#9CA3AF] focus:outline-none"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 text-sm bg-[#E8311A]/10 text-[#E8311A] border border-[#E8311A]/20 rounded-lg px-3 py-2 font-mono font-bold">
                      {taggedStocks[0]}
                      {taggedStocks[0] !== defaultTicker && (
                        <button onClick={() => setTaggedStocks([])} className="ml-1 hover:text-white transition-colors">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </span>
                  </div>
                )}
                {stockDropdownOpen && stockSuggestions.length > 0 && (
                  <div className="absolute left-0 top-full mt-1 w-64 bg-[#141414] border border-[#282828] rounded-lg shadow-xl overflow-hidden z-50">
                    {stockSuggestions.map(s => (
                      <button
                        key={s.bloomberg_ticker}
                        onMouseDown={e => { e.preventDefault(); addStock(s.bloomberg_ticker); }}
                        className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-[#1C1C1C] transition-colors text-left"
                      >
                        <span className="text-xs font-mono text-[#E8311A] font-bold">{s.bloomberg_ticker}</span>
                        <span className="text-xs text-[#9CA3AF] truncate">{s.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Step 2: Textarea + optional extras */}
            <div className="flex gap-2 items-start">
              <span className="text-xs font-black text-[#555555] pt-2.5 leading-none flex-shrink-0 w-3 text-center">2</span>
              <div className="flex-1 min-w-0 space-y-2">
                <div className="relative">
                  <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={e => {
                      const val = e.target.value.slice(0, MAX_CHARS);
                      mentions.handleChange(val);
                    }}
                    onKeyDown={e => {
                      if (mentions.handleKeyDown(e)) return;
                    }}
                    placeholder={
                      postType === "poll" ? "Ask a question..." :
                      postType === "forecast" ? "What's your thesis?" :
                      "What are your thoughts? 发!"
                    }
                    className="w-full bg-[#141414] border border-[#333333] rounded-lg px-3 py-2.5 text-[#F0F0F0] placeholder:text-[#9CA3AF] text-sm resize-none focus:outline-none focus:border-[#444444] min-h-[80px] transition-colors"
                    rows={3}
                  />
                  {mentions.mentionActive && (
                    <MentionDropdown
                      results={mentions.mentionResults}
                      selectedIndex={mentions.selectedIndex}
                      onSelect={mentions.selectMention}
                      loading={mentions.mentionLoading}
                    />
                  )}
                </div>
                {/* Link preview */}
                {linkPreview && !linkPreviewDismissed && (linkPreview.og_title || linkPreview.og_image) && (
                  <div className="relative flex items-stretch border border-[#282828] rounded-lg overflow-hidden bg-[#0D0D0D]">
                    <button
                      onClick={() => setLinkPreviewDismissed(true)}
                      className="absolute top-1.5 right-1.5 z-10 w-5 h-5 flex items-center justify-center rounded-full bg-black/60 text-[#9CA3AF] hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <div className="w-1/3 min-h-[160px] flex-shrink-0 bg-[#141414] flex items-center justify-center overflow-hidden">
                      {linkPreview.og_image ? (
                        <img src={linkPreview.og_image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <svg className="w-6 h-6 text-[#333333]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <path d="M3 9h18M9 21V9" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 px-3 py-2.5 flex flex-col justify-start gap-1">
                      {linkPreview.og_site_name && <p className="text-[10px] text-[#555555] uppercase tracking-wide">{linkPreview.og_site_name}</p>}
                      {linkPreview.og_title && <p className="text-sm text-[#9CA3AF] leading-snug line-clamp-3">{linkPreview.og_title}</p>}
                      {linkPreview.og_description && <p className="text-xs text-[#555555] leading-snug line-clamp-4">{linkPreview.og_description}</p>}
                    </div>
                  </div>
                )}
                {/* Quoted post preview */}
                {quotedPost && (
                  <div className="relative rounded-lg border-l-2 border-l-[#E8311A]/40 border border-[#222222] bg-[#0A0A0A] pl-3 pr-3.5 py-2.5">
                    <button
                      onClick={() => onCancelQuote?.()}
                      className="absolute top-1.5 right-1.5 w-5 h-5 flex items-center justify-center rounded-full bg-black/60 text-[#9CA3AF] hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[10px] text-[#555555] font-medium uppercase tracking-wider">Quoting</span>
                      <span className="text-[10px] text-[#555555]">·</span>
                      <span className="text-xs font-semibold text-[#71717A]">{quotedPost.author?.display_name}</span>
                    </div>
                    <p className="text-xs text-[#9CA3AF] line-clamp-3 leading-relaxed">{quotedPost.content}</p>
                  </div>
                )}
                {/* Poll builder */}
                {postType === "poll" && (
                  <div className="space-y-2">
                    {pollOptions.map((opt, i) => (
                      <div key={opt.id} className="flex items-center gap-2">
                        <input
                          value={opt.text}
                          onChange={e => setPollOptions(prev => prev.map(o => o.id === opt.id ? { ...o, text: e.target.value } : o))}
                          placeholder={`Option ${i + 1}`}
                          className="flex-1 bg-[#141414] border border-[#333333] rounded px-3 py-1.5 text-sm text-[#F0F0F0] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#444444]"
                        />
                        {pollOptions.length > 2 && (
                          <button onClick={() => setPollOptions(prev => prev.filter(o => o.id !== opt.id))}>
                            <X className="w-4 h-4 text-[#9CA3AF]" />
                          </button>
                        )}
                      </div>
                    ))}
                    <div className="flex items-center justify-between">
                      {pollOptions.length < 4 && (
                        <button
                          onClick={() => setPollOptions(prev => [...prev, { id: Date.now().toString(), text: "" }])}
                          className="flex items-center gap-1 text-xs text-[#E8311A] hover:underline"
                        >
                          <Plus className="w-3 h-3" /> Add option
                        </button>
                      )}
                      <div className="flex items-center gap-2 ml-auto">
                        <span className="text-xs text-[#555555]">Expires in</span>
                        <select
                          value={pollDays}
                          onChange={e => setPollDays(Number(e.target.value))}
                          className="bg-[#141414] border border-[#333333] rounded px-2 py-1 text-xs text-[#F0F0F0] focus:outline-none focus:border-[#444444]"
                        >
                          {[1, 2, 3, 5, 7, 14, 30].map(d => (
                            <option key={d} value={d}>{d} day{d > 1 ? "s" : ""}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
                {/* Forecast builder */}
                {postType === "forecast" && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-[#141414] border border-[#282828] rounded px-3 py-2">
                        <p className="text-[10px] text-[#555555] uppercase tracking-wider mb-0.5">Current Price</p>
                        <p className="text-sm font-mono text-[#F0F0F0]">
                          {fetchingPrice ? "…" : currentPrice != null ? `$${currentPrice.toFixed(2)}` : taggedStocks.length ? "N/A" : "Tag a stock first"}
                        </p>
                      </div>
                      <div className="text-[#555555] text-lg">→</div>
                      <div className="flex-1 bg-[#141414] border border-[#282828] rounded px-3 py-2">
                        <p className="text-[10px] text-[#555555] uppercase tracking-wider mb-0.5">Target Price</p>
                        <input
                          value={forecast.targetPrice}
                          onChange={e => setForecast(f => ({ ...f, targetPrice: e.target.value }))}
                          placeholder="$0.00"
                          type="number"
                          step="0.01"
                          className="w-full bg-transparent text-sm text-[#F0F0F0] placeholder:text-[#555555] focus:outline-none font-mono"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] text-[#555555] uppercase tracking-wider font-bold">Timeframe</span>
                      {([
                        { label: "1D", days: 1 },
                        { label: "1W", days: 7 },
                        { label: "1M", days: 30 },
                        { label: "1Q", days: 90 },
                        { label: "2Q", days: 180 },
                        { label: "1Y", days: 365 },
                        { label: "5Y", days: 1825 },
                      ] as const).map(({ label, days }) => {
                        const date = new Date(Date.now() + days * 86400000).toISOString().split("T")[0];
                        const selected = forecast.targetDate === date;
                        return (
                          <button
                            key={label}
                            type="button"
                            onClick={() => setForecast(f => ({ ...f, targetDate: date }))}
                            className={cn(
                              "px-2.5 py-1 text-xs font-bold rounded transition-colors",
                              selected
                                ? "bg-[#E8311A] text-white"
                                : "text-[#9CA3AF] border border-[#333333] hover:border-[#555555] hover:text-[#F0F0F0]"
                            )}
                          >
                            {label}
                          </button>
                        );
                      })}
                      {forecastSentiment && (
                        <span className={cn("text-xs font-bold px-2 py-1 rounded ml-auto", forecastSentiment === "bullish" ? "text-[#22C55E] bg-[#22C55E]/10" : "text-[#EF4444] bg-[#EF4444]/10")}>
                          {forecastSentiment === "bullish" ? "▲ Bullish" : "▼ Bearish"}
                        </span>
                      )}
                    </div>
                  </div>
                )}
                {/* Attachment previews + upload placeholders */}
                {(attachments.length > 0 || pendingCount > 0) && (
                  <div className="flex gap-2 flex-wrap">
                    {attachments.map((att, i) => (
                      <div key={i} className="relative w-20 h-20 rounded overflow-hidden border border-[#333333] bg-[#141414] flex items-center justify-center">
                        {att.type === "image" ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={att.url} alt="" className="w-full h-full object-cover" />
                        ) : att.type === "video" ? (
                          <div className="flex flex-col items-center gap-1 text-[#9CA3AF]">
                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="5 3 19 12 5 21" /></svg>
                            <span className="text-[8px] uppercase tracking-wider">Video</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-1 text-[#9CA3AF]">
                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6" /></svg>
                            <span className="text-[8px] uppercase tracking-wider">PDF</span>
                          </div>
                        )}
                        <button
                          onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))}
                          className="absolute top-1 right-1 bg-black/70 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    ))}
                    {/* Upload placeholders */}
                    {Array.from({ length: pendingCount }).map((_, i) => (
                      <div key={`pending-${i}`} className="w-20 h-20 rounded border border-[#333333] border-dashed bg-[#141414] flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-[#333333] border-t-[#E8311A] rounded-full animate-spin" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Step 3: Sentiment (hidden for polls and forecasts) */}
            {postType === "post" && <div className="flex gap-2 items-start">
              <span className="text-xs font-black text-[#555555] pt-1.5 leading-none flex-shrink-0 w-3 text-center">3</span>
              <div className="flex items-center gap-2">
                {([
                  { value: "bullish", color: "#22C55E", icon: <TrendingUp className="w-3 h-3" /> },
                  { value: "bearish", color: "#EF4444", icon: <TrendingDown className="w-3 h-3" /> },
                  { value: "neutral", color: "#9CA3AF", icon: <MoveHorizontal className="w-3 h-3" /> },
                ] as { value: Sentiment; color: string; icon: React.ReactNode }[]).map(({ value: s, color, icon }) => (
                  <button
                    key={s}
                    onClick={() => setSentiment(prev => prev === s ? null : s)}
                    disabled={!content.trim()}
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded border transition-all capitalize disabled:opacity-25 disabled:cursor-not-allowed"
                    style={sentiment === s
                      ? { borderColor: color, backgroundColor: color, color: "#0a0a0a" }
                      : { borderColor: color, color, opacity: content.trim() ? 0.9 : undefined }
                    }
                  >
                    {icon}
                    {s}
                  </button>
                ))}
              </div>
            </div>}

          </div>

          {/* Toolbar */}
          <div className="flex items-center justify-between border-t border-[#282828] pt-3 mt-3">
            <div className="flex items-center gap-1">
              {/* Attachments */}
              <input ref={fileRef} type="file" accept="image/*,video/mp4,video/quicktime,video/webm,application/pdf" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={attachments.length >= 4 || postType !== "post"}
                className="p-2 rounded text-[#9CA3AF] hover:text-[#9CA3AF] hover:bg-[#282828] transition-colors disabled:opacity-30"
                title="Add image, video, or PDF (max 10MB each)"
              >
                <ImageIcon className="w-4 h-4" />
              </button>

              {/* Poll toggle */}
              <button
                onClick={() => setPostType(t => t === "poll" ? "post" : "poll")}
                className={cn("p-2 rounded transition-colors", postType === "poll" ? "text-[#E8311A] bg-[#E8311A]/10" : "text-[#9CA3AF] hover:text-[#9CA3AF] hover:bg-[#282828]")}
                title="Poll"
              >
                <BarChart2 className="w-4 h-4" />
              </button>

              {/* Forecast toggle */}
              <button
                onClick={() => setPostType(t => t === "forecast" ? "post" : "forecast")}
                className={cn("p-2 rounded transition-colors", postType === "forecast" ? "text-[#E8311A] bg-[#E8311A]/10" : "text-[#9CA3AF] hover:text-[#9CA3AF] hover:bg-[#282828]")}
                title="Forecast"
              >
                <Crosshair className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              {content.length > MAX_CHARS * 0.8 && (
                <span className={cn("text-xs tabular-nums", remaining < 20 ? "text-[#EF4444]" : "text-[#9CA3AF]")}>
                  {remaining}
                </span>
              )}
              <div className="relative group">
                <Button
                  onClick={handlePost}
                  loading={posting || uploading}
                  disabled={!canPost}
                  size="md"
                >
                  Huat 发
                </Button>
                {!canPost && !posting && (
                  <div className="absolute bottom-full right-0 mb-2 w-48 bg-[#1C1C1C] border border-[#333333] rounded px-2.5 py-2 text-xs text-[#9CA3AF] shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                    {[
                      !content.trim() && "Write something",
                      !taggedStocks.length && "Tag a stock",
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
