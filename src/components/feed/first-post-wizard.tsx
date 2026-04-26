"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { TrendingUp, TrendingDown, ArrowRight, X } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { Profile } from "@/types/database";

interface FirstPostWizardProps {
  profile: Profile;
  onPost?: (newPost?: Record<string, unknown>) => void;
  onSkip: () => void;
}

const PROMPTS = [
  "Strong fundamentals — long-term hold",
  "Earnings beat expectations",
  "Better entry now after the dip",
  "Dividend yield is hard to beat",
  "Sector tailwinds picking up",
];

const MAX_LEN = 200;

export function FirstPostWizard({ profile, onPost, onSkip }: FirstPostWizardProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [ticker, setTicker] = useState<string | null>(null);
  const [stockName, setStockName] = useState<string>("");
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState<{ bloomberg_ticker: string; name: string }[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [sentiment, setSentiment] = useState<"bullish" | "bearish" | null>(null);
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleSearchChange(val: string) {
    setSearch(val);
    setDropdownOpen(false);
    setSuggestions([]);
    if (!val.trim()) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const res = await fetch(`/api/stocks?q=${encodeURIComponent(val)}`).then(r => r.json()).catch(() => ({ stocks: [] }));
      const filtered = (res.stocks ?? []).filter((s: { bloomberg_ticker: string }) => s.bloomberg_ticker);
      setSuggestions(filtered.slice(0, 6));
      setDropdownOpen(filtered.length > 0);
    }, 200);
  }

  function pickStock(t: string, name: string) {
    setTicker(t);
    setStockName(name);
    setSearch("");
    setSuggestions([]);
    setDropdownOpen(false);
    setStep(2);
  }

  function pickSentiment(s: "bullish" | "bearish") {
    setSentiment(s);
    setStep(3);
  }

  async function handleSubmit() {
    if (!ticker || !sentiment || !content.trim() || posting) return;
    setPosting(true);
    setError("");
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          sentiment,
          post_type: "post",
          tagged_stocks: [ticker],
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error?.message ?? data.error ?? "Couldn't post. Try again?");
        return;
      }
      const data = await res.json();
      onPost?.(data.post);
    } catch {
      setError("Network error. Try again?");
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="border-b border-[#282828]">
      {/* AngBao banner */}
      <div className="bg-gradient-to-r from-[#E8311A]/10 via-[#E8311A]/5 to-transparent border-b border-[#E8311A]/20 px-5 py-2.5 flex items-center justify-between gap-3">
        <p className="text-xs text-[#F0F0F0]">
          <span className="font-bold">🧧 Your first post earns $8 AngBao</span>
          <span className="text-[#9CA3AF] ml-2 hidden sm:inline">— pick a stock, share why, done.</span>
        </p>
        <button
          onClick={onSkip}
          className="text-[10px] text-[#9CA3AF] hover:text-[#F0F0F0] flex items-center gap-1 flex-shrink-0"
          aria-label="Skip wizard"
        >
          Skip <X className="w-3 h-3" />
        </button>
      </div>

      <div className="px-5 py-4">
        {/* Step indicator */}
        <div className="flex items-center gap-1.5 mb-4">
          {[1, 2, 3].map(n => (
            <div
              key={n}
              className={`h-1 flex-1 rounded-full transition-colors ${n <= step ? "bg-[#E8311A]" : "bg-[#282828]"}`}
            />
          ))}
        </div>

        <div className="flex gap-3">
          <Avatar src={profile.avatar_url} alt={profile.display_name} size="md" />
          <div className="flex-1 min-w-0">
            {/* Step 1: pick a stock */}
            {step === 1 && (
              <div className="relative">
                <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider mb-2">Step 1 · Pick a stock</p>
                <input
                  autoFocus
                  value={search}
                  onChange={e => handleSearchChange(e.target.value)}
                  placeholder="Search SGX stocks…  (try DBS, AEM, Sea)"
                  className="w-full bg-[#141414] border border-[#333333] rounded-lg px-3 py-2.5 text-sm text-[#F0F0F0] placeholder:text-[#71717A] focus:outline-none focus:border-[#444444]"
                />
                {dropdownOpen && suggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 max-w-md bg-[#141414] border border-[#282828] rounded-lg shadow-xl overflow-hidden z-50">
                    {suggestions.map(s => (
                      <button
                        key={s.bloomberg_ticker}
                        onMouseDown={e => { e.preventDefault(); pickStock(s.bloomberg_ticker, s.name); }}
                        className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-[#1C1C1C] transition-colors text-left"
                      >
                        <span className="text-xs font-mono text-[#E8311A] font-bold">{s.bloomberg_ticker}</span>
                        <span className="text-xs text-[#9CA3AF] truncate">{s.name}</span>
                      </button>
                    ))}
                  </div>
                )}
                <p className="text-[11px] text-[#71717A] mt-2">
                  Don&apos;t know what to post about?{" "}
                  <Link href="/stocks" className="text-[#E8311A] hover:underline">Browse SGX stocks first</Link>
                  .
                </p>
              </div>
            )}

            {/* Step 2: pick sentiment */}
            {step === 2 && (
              <div>
                <button onClick={() => setStep(1)} className="text-[11px] text-[#71717A] hover:text-[#F0F0F0] mb-2">← Change stock</button>
                <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider mb-3">
                  Step 2 · How do you feel about <span className="font-mono text-[#E8311A]">{ticker}</span>?
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => pickSentiment("bullish")}
                    className="flex items-center gap-2 px-4 py-4 rounded-lg border border-[#22C55E]/40 hover:border-[#22C55E] hover:bg-[#22C55E]/5 transition-colors text-left"
                  >
                    <TrendingUp className="w-5 h-5 text-[#22C55E] flex-shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-[#22C55E]">Bullish</p>
                      <p className="text-[11px] text-[#9CA3AF]">I think it goes up</p>
                    </div>
                  </button>
                  <button
                    onClick={() => pickSentiment("bearish")}
                    className="flex items-center gap-2 px-4 py-4 rounded-lg border border-[#EF4444]/40 hover:border-[#EF4444] hover:bg-[#EF4444]/5 transition-colors text-left"
                  >
                    <TrendingDown className="w-5 h-5 text-[#EF4444] flex-shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-[#EF4444]">Bearish</p>
                      <p className="text-[11px] text-[#9CA3AF]">I think it goes down</p>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: write a sentence */}
            {step === 3 && ticker && sentiment && (
              <div>
                <button onClick={() => setStep(2)} className="text-[11px] text-[#71717A] hover:text-[#F0F0F0] mb-2">← Change sentiment</button>
                <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider mb-2">
                  Step 3 ·{" "}
                  <span className={sentiment === "bullish" ? "text-[#22C55E]" : "text-[#EF4444]"}>
                    {sentiment === "bullish" ? "Bullish" : "Bearish"} on {ticker}
                  </span>{" "}
                  — why?
                </p>
                <textarea
                  autoFocus
                  value={content}
                  onChange={e => setContent(e.target.value.slice(0, MAX_LEN))}
                  placeholder={`In one sentence — why ${sentiment} on ${stockName || ticker}?`}
                  rows={2}
                  className="w-full bg-[#141414] border border-[#333333] rounded-lg px-3 py-2.5 text-sm text-[#F0F0F0] placeholder:text-[#71717A] focus:outline-none focus:border-[#444444] resize-none"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {PROMPTS.map(p => (
                    <button
                      key={p}
                      onClick={() => setContent(p)}
                      className="text-[11px] text-[#9CA3AF] bg-[#141414] border border-[#282828] hover:border-[#444444] hover:text-[#F0F0F0] rounded-full px-2.5 py-1 transition-colors"
                    >
                      {p}
                    </button>
                  ))}
                </div>
                {error && <p className="text-xs text-[#EF4444] mt-2">{error}</p>}
                <div className="flex items-center justify-between mt-3">
                  <span className={`text-xs tabular-nums ${content.length > MAX_LEN * 0.9 ? "text-[#EF4444]" : "text-[#71717A]"}`}>
                    {MAX_LEN - content.length}
                  </span>
                  <Button
                    onClick={handleSubmit}
                    disabled={!content.trim() || posting}
                    loading={posting}
                  >
                    Post & earn $8 <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
