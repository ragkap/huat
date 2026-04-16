"use client";

import { useState, useEffect } from "react";
import type { StockPrimer } from "@/lib/smartkarma/primer";
import { stripHtml } from "@/lib/smartkarma/primer";
import { ripple } from "@/lib/utils";

// ─── Shared helpers ───────────────────────────────────────────────────────────

function WidgetShell({ title, attribution, children, onClick }: {
  title: string;
  attribution?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <div className={`widget-hover relative overflow-hidden border border-[#282828] rounded-lg p-4${onClick ? " cursor-pointer" : ""}`} onClick={onClick ? (e: React.MouseEvent<HTMLDivElement>) => { ripple(e); onClick(); } : undefined}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider">{title}</p>
        {attribution && <a href="https://www.smartkarma.com/home/smartwealth/" target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-[10px] text-[#555555] hover:text-[#9CA3AF] transition-colors">by Smartkarma</a>}
      </div>
      {children}
    </div>
  );
}

// ─── Ratings ─────────────────────────────────────────────────────────────────

const MOAT_COLOR: Record<string, string> = {
  wide: "#22C55E",
  narrow: "#F59E0B",
  none: "#EF4444",
};

const OUTLOOK_COLOR: Record<string, string> = {
  positive: "#22C55E",
  stable: "#F0F0F0",
  negative: "#EF4444",
};

const PFV_COLOR: Record<string, string> = {
  undervalued: "#22C55E",
  moderate: "#F59E0B",
  overvalued: "#EF4444",
};

function badge(label: string, color: string) {
  return (
    <span
      className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide"
      style={{ color, border: `1px solid ${color}22`, background: `${color}18` }}
    >
      {label}
    </span>
  );
}

export function RatingsWidget({ ratings, outlook }: { ratings: NonNullable<StockPrimer["ratings"]>; outlook?: string[] }) {
  const [expanded, setExpanded] = useState(false);
  const overallNum = ratings.overall_rating ? Number(ratings.overall_rating) : null;
  const outlookText = outlook?.map(p => stripHtml(p)).join("\n\n") ?? "";

  return (
    <WidgetShell title="Ratings" attribution onClick={outlookText ? () => setExpanded(e => !e) : undefined}>
      {/* Overall rating */}
      {overallNum != null && (
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-[#71717A]">Overall</span>
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map(i => (
              <div
                key={i}
                className="w-4 h-4 rounded-sm"
                style={{ background: i <= overallNum ? "#22C55E" : "#1C1C1C" }}
              />
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        {ratings.moat && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#71717A]">Moat</span>
            {badge(ratings.moat, MOAT_COLOR[ratings.moat.toLowerCase()] ?? "#F0F0F0")}
          </div>
        )}
        {ratings.outlook && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#71717A]">Outlook</span>
            {badge(ratings.outlook, OUTLOOK_COLOR[ratings.outlook.toLowerCase()] ?? "#F0F0F0")}
          </div>
        )}
        {ratings.price_vs_fair_value && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#71717A]">vs Fair Value</span>
            {badge(ratings.price_vs_fair_value, PFV_COLOR[ratings.price_vs_fair_value.toLowerCase()] ?? "#F0F0F0")}
          </div>
        )}
        {ratings.uncertainty_rating && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#71717A]">Uncertainty</span>
            {badge(ratings.uncertainty_rating, ratings.uncertainty_rating.toLowerCase() === "low" ? "#22C55E" : ratings.uncertainty_rating.toLowerCase() === "high" ? "#EF4444" : "#F59E0B")}
          </div>
        )}
      </div>

      {/* Outlook text */}
      {outlookText && (
        <div className="mt-3 pt-3 border-t border-[#1C1C1C]">
          <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-1.5">Outlook</p>
          <p
            className="widget-text-muted text-xs text-[#9CA3AF] leading-relaxed whitespace-pre-line"
            style={expanded ? undefined : { display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}
          >
            {outlookText}
          </p>
          <span className="mt-1.5 inline-block text-[11px] text-[#71717A]">
            {expanded ? "Show less" : "Show more"}
          </span>
        </div>
      )}
    </WidgetShell>
  );
}

// ─── Porter's Five Forces ─────────────────────────────────────────────────────

const FORCES: { key: keyof NonNullable<StockPrimer["porters_five_forces_score"]>; label: string }[] = [
  { key: "bargaining_power_over_buyers",    label: "Buyer Power" },
  { key: "bargaining_power_over_suppliers", label: "Supplier Power" },
  { key: "competitive_intensity",            label: "Rivalry" },
  { key: "threat_of_new_entrants",          label: "New Entrants" },
  { key: "threat_of_substitutes",           label: "Substitutes" },
];

function forceColor(score: number): string {
  // 5 = good (green), 1 = bad (red)
  if (score >= 4) return "#22C55E";
  if (score >= 3) return "#F59E0B";
  return "#EF4444";
}

export function PortersWidget({ porters, swot }: { porters: NonNullable<StockPrimer["porters_five_forces_score"]>; swot?: string[] }) {
  const [expanded, setExpanded] = useState(false);
  const swotText = swot?.map(p => stripHtml(p)).join("\n\n") ?? "";

  return (
    <WidgetShell title="Porter's Five Forces" attribution onClick={swotText ? () => setExpanded(e => !e) : undefined}>
      <div className="space-y-2.5">
        {FORCES.map(({ key, label }) => {
          const raw = porters[key];
          const val = raw != null ? Number(raw) : null;
          if (val == null) return null;
          const pct = (val / 5) * 100;
          const color = forceColor(val);
          return (
            <div key={key} className="flex items-center gap-2">
              <span className="text-[11px] text-[#71717A] w-24 flex-shrink-0 leading-tight">{label}</span>
              <div className="flex-1 h-1.5 bg-[#1C1C1C] rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
              </div>
              <span className="text-xs font-bold w-4 text-right flex-shrink-0" style={{ color }}>{val}</span>
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-[#555555] mt-3">Higher = stronger competitive force</p>

      {/* SWOT analysis */}
      {swotText && (
        <div className="mt-3 pt-3 border-t border-[#1C1C1C]">
          <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-1.5">SWOT Analysis</p>
          <p
            className="widget-text-muted text-xs text-[#9CA3AF] leading-relaxed whitespace-pre-line"
            style={expanded ? undefined : { display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}
          >
            {swotText}
          </p>
          <span className="mt-1.5 inline-block text-[11px] text-[#71717A]">
            {expanded ? "Show less" : "Show more"}
          </span>
        </div>
      )}
    </WidgetShell>
  );
}

// ─── Collapsible text widget ──────────────────────────────────────────────────

const LINE_LIMIT = 5;

export function CollapsibleWidget({ title, paragraphs }: { title: string; paragraphs: string[] }) {
  const [expanded, setExpanded] = useState(false);
  if (!paragraphs.length) return null;
  const text = paragraphs.map(p => stripHtml(p)).join("\n\n");
  return (
    <WidgetShell title={title} attribution onClick={() => setExpanded(e => !e)}>
      <div>
        <p
          className="widget-text-muted text-xs text-[#9CA3AF] leading-relaxed whitespace-pre-line"
          style={expanded ? undefined : { display: "-webkit-box", WebkitLineClamp: LINE_LIMIT, WebkitBoxOrient: "vertical", overflow: "hidden" }}
        >
          {text}
        </p>
        <span className="mt-2 inline-block text-[11px] text-[#71717A]">
          {expanded ? "Show less" : "Show more"}
        </span>
      </div>
    </WidgetShell>
  );
}

// ─── Growth Track Record ──────────────────────────────────────────────────────

export function GrowthWidget({ growth }: { growth: string[] }) {
  return <CollapsibleWidget title="Growth Track Record" paragraphs={growth} />;
}

// ─── Dividend Summary ─────────────────────────────────────────────────────────

export function DividendWidget({ dividend }: { dividend: string[] }) {
  return <CollapsibleWidget title="Dividend Summary" paragraphs={dividend} />;
}

// ─── Primer Generating Widget ─────────────────────────────────────────────────

const GENERATING_MESSAGES = [
  "Fetching financials...",
  "Analysing fundamentals...",
  "Processing industry data...",
  "Generating ratings...",
  "Evaluating competitive landscape...",
  "Computing SmartScore...",
  "Reviewing management...",
  "Synthesising insights...",
];

export function PrimerGeneratingWidget() {
  const [msgIndex, setMsgIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setMsgIndex(i => (i + 1) % GENERATING_MESSAGES.length);
        setFade(true);
      }, 300);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="border border-[#282828] rounded-lg p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider">AI Analysis</p>
        <a href="https://www.smartkarma.com/home/smartwealth/" target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#555555] hover:text-[#9CA3AF] transition-colors">by Smartkarma</a>
      </div>

      {/* Animated dots */}
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-[#E8311A]"
            style={{
              animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Cycling message */}
      <p
        className="text-xs text-[#71717A] font-mono transition-opacity duration-300"
        style={{ opacity: fade ? 1 : 0 }}
      >
        {GENERATING_MESSAGES[msgIndex]}
      </p>

      {/* ETA */}
      <div className="pt-1 border-t border-[#1C1C1C]">
        <p className="text-[11px] text-[#555555] leading-relaxed">
          Full data review available in under 2 mins.
        </p>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
