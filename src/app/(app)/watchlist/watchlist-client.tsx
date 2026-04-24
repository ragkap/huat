"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { TrendingUp, TrendingDown, X, Search, Plus, MoreVertical, Bell, Trash2 } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { PriceAlertButton } from "@/components/stock/price-alert-button";

const CACHE_KEY = "watchlist_cache";

function readCache(): WatchlistItem[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { items, ts } = JSON.parse(raw);
    void ts; // no TTL — cache is invalidated explicitly on add/remove
    return items;
  } catch { return null; }
}

function writeCache(items: WatchlistItem[]) {
  // Only persist identity — never cache live prices
  const stripped = items.map(({ slug, ticker, name }) => ({ slug, ticker, name, quote: null }));
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ items: stripped, ts: Date.now() })); } catch { /* ignore */ }
}

function clearCache() {
  try { localStorage.removeItem(CACHE_KEY); } catch { /* ignore */ }
}

interface WatchlistItem {
  slug: string;
  ticker: string;
  name: string;
  quote: {
    price: number | null;
    change: number | null;
    change_pct: number | null;
    currency: string | null;
  } | null;
}

type SortKey = "name" | "change_pct";

function StockSearchRow({ onAdd }: { onAdd: (ticker: string) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ bloomberg_ticker: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/stocks?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults((data.stocks ?? []).slice(0, 8));
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <div className="relative">
      <div className="flex items-center gap-2 px-3 py-2 bg-[#141414] border border-[#282828] rounded-lg focus-within:border-[#444444] transition-colors">
        <Search className="w-3.5 h-3.5 text-[#555555] flex-shrink-0" />
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Add stock..."
          className="flex-1 bg-transparent text-sm text-[#F0F0F0] placeholder:text-[#555555] focus:outline-none"
        />
        {loading && <div className="w-3 h-3 border border-[#333333] border-t-[#9CA3AF] rounded-full animate-spin" />}
      </div>

      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 z-20 bg-[#141414] border border-[#282828] rounded-lg shadow-xl overflow-hidden">
          {results.map(s => (
            <button
              key={s.bloomberg_ticker}
              onMouseDown={() => {
                onAdd(s.bloomberg_ticker);
                setQuery("");
                setResults([]);
                setOpen(false);
              }}
              className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-[#1C1C1C] transition-colors"
            >
              <div className="text-left">
                <p className="text-sm text-[#F0F0F0] font-medium">{s.name}</p>
                <p className="text-xs text-[#71717A] font-mono">{s.bloomberg_ticker.replace(/ SP$/, "")}</p>
              </div>
              <Plus className="w-3.5 h-3.5 text-[#555555]" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function WatchlistMenu({ ticker, currentPrice, onRemove }: { ticker: string; currentPrice?: number | null; onRemove: () => void }) {
  const [open, setOpen] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  if (showAlert) {
    return (
      <div className="flex-shrink-0">
        <PriceAlertButton ticker={ticker} currentPrice={currentPrice} />
      </div>
    );
  }

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-7 h-7 flex items-center justify-center rounded text-[#555555] hover:text-[#9CA3AF] transition-colors"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-[#1C1C1C] border border-[#333333] rounded-lg shadow-xl py-1 min-w-[160px]">
          <button
            onClick={() => { setOpen(false); setShowAlert(true); }}
            className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-[#F0F0F0] hover:bg-[#282828] transition-colors"
          >
            <Bell className="w-3.5 h-3.5 text-[#22C55E]" />
            Set alert
          </button>
          <button
            onClick={() => { setOpen(false); onRemove(); }}
            className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-[#EF4444] hover:bg-[#282828] transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Remove from watchlist
          </button>
        </div>
      )}
    </div>
  );
}

export function WatchlistClient({ initialTickers }: { initialTickers: string[] }) {
  const cached = typeof window !== "undefined" ? readCache() : null;
  const [items, setItems] = useState<WatchlistItem[]>(
    cached ?? initialTickers.map(t => ({ slug: t, ticker: t, name: t, quote: null }))
  );
  const [sort, setSort] = useState<SortKey>("name");
  const [loading, setLoading] = useState(!cached);

  const fetchData = useCallback(async ({ invalidate = false } = {}) => {
    if (invalidate) clearCache();
    if (!invalidate) {
      const hit = readCache();
      if (hit) { setItems(hit); setLoading(false); return; }
    }
    setLoading(true);
    try {
      const res = await fetch("/api/watchlist");
      const data = await res.json();
      const fresh = data.items ?? [];
      setItems(fresh);
      writeCache(fresh);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // If we have a cache hit, still revalidate in background silently
    const cached = readCache();
    if (cached) {
      fetch("/api/watchlist")
        .then(r => r.json())
        .then(d => { const fresh = d.items ?? []; setItems(fresh); writeCache(fresh); })
        .catch(() => {});
    } else {
      fetchData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAdd(ticker: string) {
    if (items.some(i => i.ticker === ticker)) return;
    const res = await fetch(`/api/stocks/${encodeURIComponent(ticker)}/watch`, { method: "POST" });
    if (!res.ok) return;
    await fetchData({ invalidate: true });
  }

  async function handleRemove(ticker: string) {
    await fetch(`/api/stocks/${encodeURIComponent(ticker)}/watch`, { method: "DELETE" });
    const next = items.filter(i => i.ticker !== ticker);
    setItems(next);
    writeCache(next);
  }

  const sorted = [...items].sort((a, b) => {
    if (sort === "name") return (a.name ?? a.ticker).localeCompare(b.name ?? b.ticker);
    const ap = a.quote?.change_pct ?? -Infinity;
    const bp = b.quote?.change_pct ?? -Infinity;
    return bp - ap;
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-bold text-[#F0F0F0]">Watchlist</h1>
        <span className="text-xs text-[#555555]">{items.length} stock{items.length !== 1 ? "s" : ""}</span>
      </div>

      <div className="mb-5">
        <StockSearchRow onAdd={handleAdd} />
      </div>

      {items.length > 1 && (
        <div className="flex items-center gap-1 mb-4">
          <span className="text-xs text-[#555555] mr-1">Sort:</span>
          {([["name", "Name"], ["change_pct", "Day change"]] as [SortKey, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSort(key)}
              className={cn(
                "px-2.5 py-1 text-xs rounded transition-colors",
                sort === key ? "bg-[#282828] text-[#F0F0F0]" : "text-[#555555] hover:text-[#9CA3AF]"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="space-y-px">
          {Array.from({ length: initialTickers.length || 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-3.5 border-b border-[#141414]">
              <div className="space-y-1.5">
                <div className="h-3.5 w-28 bg-[#1C1C1C] rounded animate-pulse" />
                <div className="h-2.5 w-16 bg-[#141414] rounded animate-pulse" />
              </div>
              <div className="h-4 w-20 bg-[#141414] rounded animate-pulse" />
            </div>
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-[#F0F0F0] font-medium mb-1">No stocks yet</p>
          <p className="text-sm text-[#555555]">Search above to add stocks to your watchlist</p>
        </div>
      ) : (
        <div>
          {sorted.map(item => {
            const pct = item.quote?.change_pct;
            const positive = (pct ?? 0) >= 0;
            const displayTicker = item.ticker.replace(/ SP$/, "");

            return (
              <div key={item.slug} className="flex items-center gap-3 py-3 border-b border-[#141414] group">
                <Link href={`/stocks/${encodeURIComponent(item.slug)}`} className="flex-1 min-w-0 hover:opacity-80 transition-opacity">
                  <p className="text-sm font-medium text-[#F0F0F0] truncate">{item.name}</p>
                  <p className="text-xs text-[#555555] font-mono mt-0.5">{displayTicker}</p>
                </Link>

                <div className="flex-shrink-0 text-right min-w-[72px]">
                  {item.quote === null ? (
                    <div className="flex flex-col items-end gap-1.5">
                      <div className="h-3.5 w-16 bg-[#1C1C1C] rounded animate-pulse" />
                      <div className="h-2.5 w-10 bg-[#141414] rounded animate-pulse" />
                    </div>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-[#F0F0F0]">
                        {item.quote.price != null ? formatPrice(item.quote.price) : "—"}
                      </p>
                      {pct != null ? (
                        <p className={cn("text-xs flex items-center justify-end gap-0.5 mt-0.5", positive ? "text-[#22C55E]" : "text-[#EF4444]")}>
                          {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {positive ? "+" : ""}{pct.toFixed(2)}%
                        </p>
                      ) : (
                        <p className="text-xs text-[#555555] mt-0.5">—</p>
                      )}
                    </>
                  )}
                </div>

                <WatchlistMenu ticker={item.ticker} currentPrice={item.quote?.price} onRemove={() => handleRemove(item.ticker)} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
