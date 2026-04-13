"use client";
import { useState, useRef, useEffect } from "react";
import { Image as ImageIcon, BarChart2, TrendingUp, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { Profile, Sentiment, PostType } from "@/types/database";

interface PollOption { id: string; text: string; }
interface ForecastData { ticker: string; targetPrice: string; targetDate: string; }

interface PostComposerProps {
  profile: Profile;
  onPost?: () => void;
  defaultTicker?: string;
}

const MAX_CHARS = 1000;

export function PostComposer({ profile, onPost, defaultTicker }: PostComposerProps) {
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
  const [pollOptions, setPollOptions] = useState<PollOption[]>([
    { id: "1", text: "" }, { id: "2", text: "" },
  ]);
  const [forecast, setForecast] = useState<ForecastData>({ ticker: "", targetPrice: "", targetDate: "" });
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [attachmentUrls, setAttachmentUrls] = useState<string[]>([]);
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
    setTaggedStocks(prev => [...new Set([...prev, ticker])]);
    setStockSearch("");
    setStockSuggestions([]);
    setStockDropdownOpen(false);
    stockInputRef.current?.focus();
  }

  const remaining = MAX_CHARS - content.length;
  const canPost = content.trim().length > 0 && !posting && taggedStocks.length > 0 && sentiment !== null;

  async function handlePost() {
    if (!canPost) return;
    setPosting(true);
    try {
      await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          sentiment,
          post_type: postType,
          tagged_stocks: taggedStocks,
          attachments: [
            ...attachmentUrls.map(url => ({ url, type: "image" })),
            ...(linkPreview && !linkPreviewDismissed ? [{
              url: linkPreview.url,
              type: "link",
              og_title: linkPreview.og_title,
              og_description: linkPreview.og_description,
              og_image: linkPreview.og_image,
              og_site_name: linkPreview.og_site_name,
            }] : []),
          ],
          ...(postType === "poll" && { poll: { options: pollOptions.filter(o => o.text.trim()) } }),
          ...(postType === "forecast" && { forecast }),
        }),
      });
      setContent("");
      setSentiment(null);
      setPostType("post");
      setTaggedStocks([]);
      setAttachmentUrls([]);
      setLinkPreview(null);
      setLinkPreviewDismissed(false);
      onPost?.();
    } finally {
      setPosting(false);
    }
  }

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    const toUpload = Array.from(files).slice(0, 4 - attachmentUrls.length);
    setUploading(true);
    try {
      const formData = new FormData();
      toUpload.forEach(f => formData.append("files", f));
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const { urls } = await res.json();
      setAttachmentUrls(prev => [...prev, ...urls].slice(0, 4));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="border-b border-[#282828] px-5 py-4">
      <div className="flex gap-3">
        <Avatar src={profile.avatar_url} alt={profile.display_name} size="md" />
        <div className="flex-1">
          {/* Stock tagger */}
          <div ref={stockContainerRef} className="relative mb-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {taggedStocks.map(t => (
                <span key={t} className="flex items-center gap-1 text-xs bg-[#E8311A]/10 text-[#E8311A] border border-[#E8311A]/20 rounded px-2 py-0.5 font-mono">
                  ${t}
                  {t !== defaultTicker && (
                    <button onClick={() => setTaggedStocks(prev => prev.filter(x => x !== t))} className="hover:text-white">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </span>
              ))}
              {taggedStocks.length < 5 && (
                <input
                  ref={stockInputRef}
                  value={stockSearch}
                  onChange={e => handleStockSearchChange(e.target.value)}
                  onKeyDown={e => { if (e.key === "Escape") { setStockDropdownOpen(false); setStockSearch(""); } }}
                  placeholder="+ Tag stock"
                  className="text-xs bg-transparent text-[#9CA3AF] placeholder:text-[#71717A] focus:outline-none w-24"
                />
              )}
            </div>
            {stockDropdownOpen && stockSuggestions.length > 0 && (
              <div className="absolute left-0 top-full mt-1 w-56 bg-[#141414] border border-[#282828] rounded-lg shadow-xl overflow-hidden z-50">
                {stockSuggestions.map(s => (
                  <button
                    key={s.bloomberg_ticker}
                    onMouseDown={e => { e.preventDefault(); addStock(s.bloomberg_ticker); }}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#1C1C1C] transition-colors text-left"
                  >
                    <span className="text-xs font-mono text-[#E8311A] font-bold">{s.bloomberg_ticker}</span>
                    <span className="text-xs text-[#9CA3AF] truncate">{s.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Poll builder */}
          {postType === "poll" && (
            <div className="space-y-2 mb-3">
              {pollOptions.map((opt, i) => (
                <div key={opt.id} className="flex items-center gap-2">
                  <input
                    value={opt.text}
                    onChange={e => setPollOptions(prev => prev.map(o => o.id === opt.id ? { ...o, text: e.target.value } : o))}
                    placeholder={`Option ${i + 1}`}
                    className="flex-1 bg-[#141414] border border-[#333333] rounded px-3 py-1.5 text-sm text-[#F0F0F0] placeholder:text-[#71717A] focus:outline-none focus:border-[#444444]"
                  />
                  {pollOptions.length > 2 && (
                    <button onClick={() => setPollOptions(prev => prev.filter(o => o.id !== opt.id))}>
                      <X className="w-4 h-4 text-[#71717A]" />
                    </button>
                  )}
                </div>
              ))}
              {pollOptions.length < 4 && (
                <button
                  onClick={() => setPollOptions(prev => [...prev, { id: Date.now().toString(), text: "" }])}
                  className="flex items-center gap-1 text-xs text-[#E8311A] hover:underline"
                >
                  <Plus className="w-3 h-3" /> Add option
                </button>
              )}
            </div>
          )}

          {/* Forecast builder */}
          {postType === "forecast" && (
            <div className="flex gap-2 mb-3">
              <input
                value={forecast.ticker}
                onChange={e => setForecast(f => ({ ...f, ticker: e.target.value.toUpperCase() }))}
                placeholder="Ticker (e.g. D05)"
                className="flex-1 bg-[#141414] border border-[#333333] rounded px-3 py-1.5 text-sm text-[#F0F0F0] placeholder:text-[#71717A] focus:outline-none focus:border-[#444444] font-mono"
              />
              <input
                value={forecast.targetPrice}
                onChange={e => setForecast(f => ({ ...f, targetPrice: e.target.value }))}
                placeholder="Target price"
                type="number"
                className="flex-1 bg-[#141414] border border-[#333333] rounded px-3 py-1.5 text-sm text-[#F0F0F0] placeholder:text-[#71717A] focus:outline-none focus:border-[#444444]"
              />
              <input
                value={forecast.targetDate}
                onChange={e => setForecast(f => ({ ...f, targetDate: e.target.value }))}
                type="date"
                className="flex-1 bg-[#141414] border border-[#333333] rounded px-3 py-1.5 text-sm text-[#F0F0F0] focus:outline-none focus:border-[#444444]"
              />
            </div>
          )}

          {/* Attachment previews */}
          {attachmentUrls.length > 0 && (
            <div className="flex gap-2 mb-3 flex-wrap">
              {attachmentUrls.map((url, i) => (
                <div key={i} className="relative w-20 h-20 rounded overflow-hidden border border-[#333333]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setAttachmentUrls(prev => prev.filter((_, idx) => idx !== i))}
                    className="absolute top-1 right-1 bg-black/70 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Toolbar */}
          <div className="flex items-center justify-between border-t border-[#282828] pt-3">
            <div className="flex items-center gap-1">
              {/* Image */}
              <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={attachmentUrls.length >= 4 || postType !== "post"}
                className="p-2 rounded text-[#71717A] hover:text-[#9CA3AF] hover:bg-[#282828] transition-colors disabled:opacity-30"
                title="Add image"
              >
                <ImageIcon className="w-4 h-4" />
              </button>

              {/* Poll toggle */}
              <button
                onClick={() => setPostType(t => t === "poll" ? "post" : "poll")}
                className={cn("p-2 rounded transition-colors", postType === "poll" ? "text-[#E8311A] bg-[#E8311A]/10" : "text-[#71717A] hover:text-[#9CA3AF] hover:bg-[#282828]")}
                title="Poll"
              >
                <BarChart2 className="w-4 h-4" />
              </button>

              {/* Forecast toggle */}
              <button
                onClick={() => setPostType(t => t === "forecast" ? "post" : "forecast")}
                className={cn("p-2 rounded transition-colors", postType === "forecast" ? "text-[#E8311A] bg-[#E8311A]/10" : "text-[#71717A] hover:text-[#9CA3AF] hover:bg-[#282828]")}
                title="Forecast"
              >
                <TrendingUp className="w-4 h-4" />
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
                  size="sm"
                >
                  Huat!
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
