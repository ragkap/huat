"use client";

import { useState } from "react";
import type { SmartScore } from "@/lib/smartkarma/client";
import { stripHtml } from "@/lib/smartkarma/primer";
import { ripple } from "@/lib/utils";

const DIMENSIONS = [
  { key: "dividend",   label: "Dividend" },
  { key: "growth",     label: "Growth" },
  { key: "momentum",   label: "Momentum" },
  { key: "resilience", label: "Resilience" },
  { key: "value",      label: "Value" },
] as const;

function scoreColor(score: number): string {
  if (score >= 4) return "#22C55E";
  if (score >= 3) return "#F59E0B";
  return "#EF4444";
}

export function SmartScoreWidget({ smartScore, analysis }: { smartScore: SmartScore; analysis?: string[] }) {
  const [expanded, setExpanded] = useState(false);
  const hasDimensions = DIMENSIONS.some(d => smartScore[d.key] != null);
  const analysisBullets = analysis
    ?.map(a => stripHtml(a))
    .sort((a, b) => a.localeCompare(b)) ?? [];
  const BULLET_LIMIT = 1;

  return (
    <div className="widget-hover relative overflow-hidden border border-[#282828] rounded-lg p-4 cursor-pointer" onClick={(e: React.MouseEvent<HTMLDivElement>) => { ripple(e); setExpanded(v => !v); }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider">SmartScore</p>
          <a href="https://www.smartkarma.com/home/smartwealth/" target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-[10px] text-[#555555] hover:text-[#9CA3AF] transition-colors mt-0.5">by Smartkarma</a>
        </div>
        {smartScore.score != null && (
          <div className="flex flex-col items-end">
            <span
              className="text-3xl font-black"
              style={{ color: scoreColor(smartScore.score) }}
            >
              {smartScore.score.toFixed(1)}
            </span>
            <span className="text-[10px] text-[#555555]">/ 5</span>
          </div>
        )}
      </div>

      {/* Dimension bars */}
      {hasDimensions && (
        <div className="space-y-2.5">
          {DIMENSIONS.map(({ key, label }) => {
            const val = smartScore[key];
            if (val == null) return null;
            const pct = (val / 5) * 100;
            return (
              <div key={key} className="flex items-center gap-2">
                <span className="text-xs text-[#71717A] w-20 flex-shrink-0">{label}</span>
                <div className="flex-1 h-1.5 bg-[#1C1C1C] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, backgroundColor: scoreColor(val) }}
                  />
                </div>
                <span className="text-xs font-bold text-[#F0F0F0] w-4 text-right flex-shrink-0">{val}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* SmartScore analysis */}
      {analysisBullets.length > 0 && (
        <div className="mt-3 pt-3 border-t border-[#1C1C1C]">
          <ul className="space-y-1.5">
            {(expanded ? analysisBullets : analysisBullets.slice(0, BULLET_LIMIT)).map((item, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-[#555555] mt-0.5 flex-shrink-0">·</span>
                <span className="widget-text-muted text-xs text-[#9CA3AF] leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
          {analysisBullets.length > BULLET_LIMIT && (
            <span className="mt-2 inline-block text-[11px] text-[#71717A]">
              {expanded ? "Show less" : `Show ${analysisBullets.length - BULLET_LIMIT} more`}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
