"use client";

import { useState, useEffect } from "react";
import { Bell, BellRing, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PriceAlert {
  id: string;
  ticker: string;
  target_price: number;
  direction: "above" | "below";
  triggered: boolean;
}

export function PriceAlertButton({ ticker, currentPrice, compact }: { ticker: string; currentPrice?: number | null; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [targetPrice, setTargetPrice] = useState(currentPrice?.toFixed(2) ?? "");
  const [direction, setDirection] = useState<"above" | "below">("above");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch(`/api/stocks/${encodeURIComponent(ticker)}/alerts`)
      .then(r => r.json())
      .then(d => setAlerts(d.alerts ?? []))
      .finally(() => setLoading(false));
  }, [open, ticker]);

  async function handleCreate() {
    if (!targetPrice || saving) return;
    setSaving(true);
    const res = await fetch(`/api/stocks/${encodeURIComponent(ticker)}/alerts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target_price: targetPrice, direction }),
    });
    if (res.ok) {
      const { alert } = await res.json();
      setAlerts(prev => [...prev, alert]);
      setTargetPrice("");
      // Auto-watch the stock + notify FollowButton
      fetch(`/api/stocks/${encodeURIComponent(ticker)}/watch`, { method: "POST" }).catch(() => {});
      window.dispatchEvent(new CustomEvent("huat:auto-watch", { detail: ticker }));
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    setAlerts(prev => prev.filter(a => a.id !== id));
    await fetch(`/api/stocks/${encodeURIComponent(ticker)}/alerts`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  }

  const hasAlerts = alerts.length > 0;
  const displayTicker = ticker.replace(/ SP$/, "");

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={cn(
          "flex items-center justify-center rounded transition-colors",
          compact
            ? cn("w-7 h-7", hasAlerts ? "text-[#22C55E]" : "text-[#22C55E]/40 hover:text-[#22C55E]/70")
            : cn("gap-1.5 px-3 py-1.5 border text-sm font-medium",
                hasAlerts
                  ? "text-white bg-[#22C55E] border-[#22C55E] hover:bg-[#1ea34b]"
                  : "text-[#22C55E]/60 bg-transparent border-[#22C55E]/30 hover:border-[#22C55E]/60 hover:text-[#22C55E]"
              )
        )}
        title="Price alerts"
      >
        {hasAlerts ? <BellRing className={compact ? "w-4 h-4" : "w-3.5 h-3.5"} /> : <Bell className={compact ? "w-4 h-4" : "w-3.5 h-3.5"} />}
        {!compact && <>Alert{hasAlerts ? ` (${alerts.length})` : ""}</>}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 w-[280px] bg-[#141414] border border-[#282828] rounded-lg shadow-xl overflow-hidden">
          <div className="px-3 py-2.5 border-b border-[#282828] flex items-center justify-between">
            <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider">Price Alerts — {displayTicker}</p>
            <button onClick={() => setOpen(false)} className="text-[#71717A] hover:text-[#F0F0F0]">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Existing alerts */}
          {loading ? (
            <div className="px-3 py-4 text-center">
              <span className="w-4 h-4 border-2 border-[#333333] border-t-[#E8311A] rounded-full animate-spin inline-block" />
            </div>
          ) : alerts.length > 0 ? (
            <div className="divide-y divide-[#1C1C1C]">
              {alerts.map(a => (
                <div key={a.id} className="px-3 py-2 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[#F0F0F0]">
                      {a.direction === "above" ? "Above" : "Below"}{" "}
                      <span className="font-bold">${Number(a.target_price).toFixed(2)}</span>
                    </p>
                  </div>
                  <button onClick={() => handleDelete(a.id)} className="text-[#555555] hover:text-[#EF4444] transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="px-3 py-3 text-xs text-[#555555]">No active alerts</p>
          )}

          {/* Create new alert */}
          <div className="px-3 py-3 border-t border-[#282828] space-y-2">
            <div className="flex gap-1.5">
              <button
                onClick={() => setDirection("above")}
                className={cn(
                  "flex-1 py-1.5 text-xs font-semibold rounded transition-colors",
                  direction === "above" ? "bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30" : "bg-[#1C1C1C] text-[#71717A] border border-[#333333]"
                )}
              >
                Above
              </button>
              <button
                onClick={() => setDirection("below")}
                className={cn(
                  "flex-1 py-1.5 text-xs font-semibold rounded transition-colors",
                  direction === "below" ? "bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30" : "bg-[#1C1C1C] text-[#71717A] border border-[#333333]"
                )}
              >
                Below
              </button>
            </div>
            <div className="flex gap-1.5">
              <input
                type="number"
                step="0.01"
                value={targetPrice}
                onChange={e => setTargetPrice(e.target.value)}
                placeholder="Target price"
                className="flex-1 bg-[#1C1C1C] border border-[#333333] rounded px-2.5 py-1.5 text-sm text-text placeholder:text-[#555555] focus:outline-none focus:border-[#444444]"
              />
              <Button size="sm" onClick={handleCreate} loading={saving} disabled={!targetPrice}>
                Set
              </Button>
            </div>
            <p className="text-[9px] text-[#555555] leading-relaxed">
              Prices may be delayed. Verify with your broker before trading.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
