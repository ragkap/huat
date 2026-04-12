import type { SmartScore } from "@/lib/smartkarma/client";

const DIMENSIONS = [
  { key: "value",      label: "Value" },
  { key: "dividend",   label: "Dividend" },
  { key: "growth",     label: "Growth" },
  { key: "resilience", label: "Resilience" },
  { key: "momentum",   label: "Momentum" },
] as const;

function scoreColor(score: number): string {
  if (score >= 4) return "#22C55E";
  if (score >= 3) return "#F0F0F0";
  return "#EF4444";
}

export function SmartScoreWidget({ smartScore }: { smartScore: SmartScore }) {
  const hasDimensions = DIMENSIONS.some(d => smartScore[d.key] != null);

  return (
    <div className="border border-[#282828] rounded-lg p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider">SmartScore</p>
          <p className="text-[10px] text-[#555555] mt-0.5">by Smartkarma</p>
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
    </div>
  );
}
