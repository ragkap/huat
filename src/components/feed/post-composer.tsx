"use client";
import { useState, useRef } from "react";
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
}

const MAX_CHARS = 1000;

export function PostComposer({ profile, onPost }: PostComposerProps) {
  const [content, setContent] = useState("");
  const [sentiment, setSentiment] = useState<Sentiment | null>(null);
  const [postType, setPostType] = useState<PostType>("post");
  const [taggedStocks, setTaggedStocks] = useState<string[]>([]);
  const [stockSearch, setStockSearch] = useState("");
  const [pollOptions, setPollOptions] = useState<PollOption[]>([
    { id: "1", text: "" }, { id: "2", text: "" },
  ]);
  const [forecast, setForecast] = useState<ForecastData>({ ticker: "", targetPrice: "", targetDate: "" });
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [attachmentUrls, setAttachmentUrls] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const remaining = MAX_CHARS - content.length;
  const canPost = content.trim().length > 0 && !posting;

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
          attachments: attachmentUrls.map(url => ({ url, type: "image" })),
          ...(postType === "poll" && { poll: { options: pollOptions.filter(o => o.text.trim()) } }),
          ...(postType === "forecast" && { forecast }),
        }),
      });
      setContent("");
      setSentiment(null);
      setPostType("post");
      setTaggedStocks([]);
      setAttachmentUrls([]);
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
          {/* Text area */}
          <textarea
            value={content}
            onChange={e => setContent(e.target.value.slice(0, MAX_CHARS))}
            placeholder={
              postType === "poll" ? "Ask a question..." :
              postType === "forecast" ? "What's your thesis?" :
              "What are your thoughts? 发!"
            }
            className="w-full bg-transparent text-[#F0F0F0] placeholder:text-[#71717A] text-base resize-none focus:outline-none min-h-[80px]"
            rows={3}
          />

          {/* Sentiment selector */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-[#71717A] uppercase tracking-wider">Sentiment:</span>
            {(["bullish", "bearish", "neutral"] as Sentiment[]).map(s => (
              <button
                key={s}
                onClick={() => setSentiment(prev => prev === s ? null : s)}
                className={cn(
                  "text-xs px-2 py-1 rounded border transition-colors capitalize",
                  sentiment === s
                    ? s === "bullish" ? "border-[#22C55E] text-[#22C55E] bg-[#22C55E]/10"
                    : s === "bearish" ? "border-[#EF4444] text-[#EF4444] bg-[#EF4444]/10"
                    : "border-[#9CA3AF] text-[#9CA3AF] bg-[#9CA3AF]/10"
                    : "border-[#333333] text-[#71717A] hover:border-[#444444]"
                )}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Stock tagger */}
          <div className="flex flex-wrap items-center gap-1.5 mb-3">
            {taggedStocks.map(t => (
              <span key={t} className="flex items-center gap-1 text-xs bg-[#E8311A]/10 text-[#E8311A] border border-[#E8311A]/20 rounded px-2 py-0.5 font-mono">
                ${t}
                <button onClick={() => setTaggedStocks(prev => prev.filter(x => x !== t))} className="hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <input
              value={stockSearch}
              onChange={e => setStockSearch(e.target.value)}
              onKeyDown={async e => {
                if (e.key === "Enter" && stockSearch.trim()) {
                  setTaggedStocks(prev => [...new Set([...prev, stockSearch.trim().toUpperCase()])]);
                  setStockSearch("");
                }
              }}
              placeholder="+ Tag stock (Enter)"
              className="text-xs bg-transparent text-[#9CA3AF] placeholder:text-[#71717A] focus:outline-none w-28"
            />
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
                    className="flex-1 bg-[#141414] border border-[#333333] rounded px-3 py-1.5 text-sm text-[#F0F0F0] placeholder:text-[#71717A] focus:outline-none focus:border-[#E8311A]"
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
                className="flex-1 bg-[#141414] border border-[#333333] rounded px-3 py-1.5 text-sm text-[#F0F0F0] placeholder:text-[#71717A] focus:outline-none focus:border-[#E8311A] font-mono"
              />
              <input
                value={forecast.targetPrice}
                onChange={e => setForecast(f => ({ ...f, targetPrice: e.target.value }))}
                placeholder="Target price"
                type="number"
                className="flex-1 bg-[#141414] border border-[#333333] rounded px-3 py-1.5 text-sm text-[#F0F0F0] placeholder:text-[#71717A] focus:outline-none focus:border-[#E8311A]"
              />
              <input
                value={forecast.targetDate}
                onChange={e => setForecast(f => ({ ...f, targetDate: e.target.value }))}
                type="date"
                className="flex-1 bg-[#141414] border border-[#333333] rounded px-3 py-1.5 text-sm text-[#F0F0F0] focus:outline-none focus:border-[#E8311A]"
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
              <Button
                onClick={handlePost}
                loading={posting || uploading}
                disabled={!canPost}
                size="sm"
              >
                Huat!
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
