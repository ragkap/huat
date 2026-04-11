"use client";
import { useEffect, useRef, useState } from "react";

interface ChartData {
  dates: string[];
  prices: number[];
}

const INTERVALS = [
  { label: "1W", value: "w1" },
  { label: "1M", value: "m1" },
  { label: "3M", value: "m3" },
  { label: "6M", value: "m6" },
  { label: "1Y", value: "y1" },
  { label: "All", value: "max" },
] as const;

function formatDateLabel(dateStr: string, interval: string): string {
  const d = new Date(dateStr);
  if (interval === "w1") {
    return d.toLocaleDateString("en-SG", { weekday: "short", day: "numeric" });
  }
  if (interval === "m1" || interval === "m3") {
    return d.toLocaleDateString("en-SG", { day: "numeric", month: "short" });
  }
  return d.toLocaleDateString("en-SG", { month: "short", year: "2-digit" });
}

function SVGChart({
  data,
  isPositive,
  interval,
}: {
  data: ChartData;
  isPositive: boolean;
  interval: string;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hovered, setHovered] = useState<{ x: number; y: number; price: number; date: string } | null>(null);

  const W = 800;
  const H = 200;
  const PAD = { top: 16, right: 16, bottom: 32, left: 8 };

  const prices = data.prices;
  if (!prices.length) return null;

  const minP = Math.min(...prices);
  const maxP = Math.max(...prices);
  const range = maxP - minP || 1;

  const px = (i: number) => PAD.left + (i / (prices.length - 1)) * (W - PAD.left - PAD.right);
  const py = (p: number) => PAD.top + (1 - (p - minP) / range) * (H - PAD.top - PAD.bottom);

  const pathD = prices.map((p, i) => `${i === 0 ? "M" : "L"} ${px(i).toFixed(1)} ${py(p).toFixed(1)}`).join(" ");
  const areaD = `${pathD} L ${px(prices.length - 1).toFixed(1)} ${(H - PAD.bottom).toFixed(1)} L ${px(0).toFixed(1)} ${(H - PAD.bottom).toFixed(1)} Z`;

  const color = isPositive ? "#22C55E" : "#EF4444";
  const gradId = `grad-${isPositive ? "pos" : "neg"}`;

  // x-axis labels: pick ~5 evenly spaced
  const labelCount = 5;
  const labelIndices = Array.from({ length: labelCount }, (_, i) =>
    Math.round((i / (labelCount - 1)) * (prices.length - 1))
  );

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const scaleX = W / rect.width;
    const mx = (e.clientX - rect.left) * scaleX;
    const idx = Math.max(0, Math.min(prices.length - 1, Math.round(((mx - PAD.left) / (W - PAD.left - PAD.right)) * (prices.length - 1))));
    setHovered({ x: px(idx), y: py(prices[idx]), price: prices[idx], date: data.dates[idx] ?? "" });
  }

  return (
    <div className="relative w-full">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ height: 200 }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHovered(null)}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Area fill */}
        <path d={areaD} fill={`url(#${gradId})`} />

        {/* Line */}
        <path d={pathD} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />

        {/* X-axis labels */}
        {labelIndices.map(i => (
          <text
            key={i}
            x={px(i)}
            y={H - 4}
            textAnchor="middle"
            fontSize="9"
            fill="#71717A"
            fontFamily="ui-monospace,monospace"
          >
            {data.dates[i] ? formatDateLabel(data.dates[i], interval) : ""}
          </text>
        ))}

        {/* Hover crosshair */}
        {hovered && (
          <>
            <line x1={hovered.x} y1={PAD.top} x2={hovered.x} y2={H - PAD.bottom} stroke="#444444" strokeWidth="1" strokeDasharray="3 3" />
            <circle cx={hovered.x} cy={hovered.y} r="4" fill={color} stroke="#0A0A0A" strokeWidth="2" />
          </>
        )}
      </svg>

      {/* Tooltip */}
      {hovered && (
        <div
          className="absolute top-2 pointer-events-none bg-[#141414] border border-[#333333] rounded px-2.5 py-1.5 text-xs shadow-lg"
          style={{ left: hovered.x / 8 < 50 ? "8px" : "auto", right: hovered.x / 8 >= 50 ? "8px" : "auto" }}
        >
          <p className="text-[#F0F0F0] font-bold font-mono">{hovered.price.toFixed(3)}</p>
          <p className="text-[#71717A] mt-0.5">
            {hovered.date ? new Date(hovered.date).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" }) : ""}
          </p>
        </div>
      )}
    </div>
  );
}

export function PriceChart({ ticker, initialPositive }: { ticker: string; initialPositive: boolean }) {
  const [interval, setInterval] = useState<string>("y1");
  const [data, setData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/stocks/${encodeURIComponent(ticker)}/chart?interval=${interval}`)
      .then(r => r.json())
      .then((d: ChartData) => setData(d.prices?.length ? d : null))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [ticker, interval]);

  const isPositive = data?.prices?.length
    ? data.prices[data.prices.length - 1] >= data.prices[0]
    : initialPositive;

  return (
    <div className="px-5 py-4 border-b border-[#282828]">
      {/* Interval selector */}
      <div className="flex items-center gap-1 mb-3">
        {INTERVALS.map(iv => (
          <button
            key={iv.value}
            onClick={() => setInterval(iv.value)}
            className={`px-2.5 py-1 text-xs font-bold rounded transition-colors ${
              interval === iv.value
                ? "bg-[#E8311A] text-white"
                : "text-[#71717A] hover:text-[#F0F0F0] hover:bg-[#1C1C1C]"
            }`}
          >
            {iv.label}
          </button>
        ))}
      </div>

      {/* Chart area */}
      <div className="relative min-h-[200px] flex items-center justify-center">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-[#333333] border-t-[#E8311A] rounded-full animate-spin" />
          </div>
        ) : data ? (
          <SVGChart data={data} isPositive={isPositive} interval={interval} />
        ) : (
          <p className="text-xs text-[#71717A]">Chart data unavailable</p>
        )}
      </div>
    </div>
  );
}
