"use client";
import { useEffect, useRef, useState } from "react";

interface ChartData {
  dates: string[];
  prices: number[];
}

const INTERVALS = [
  { label: "1D", value: "d1" },
  { label: "3M", value: "m3" },
  { label: "1Y", value: "y1" },
  { label: "5Y", value: "y5" },
] as const;

function formatDateLabel(dateStr: string, interval: string): string {
  const d = new Date(dateStr);
  if (interval === "d1") {
    return d.toLocaleTimeString("en-SG", { hour: "2-digit", minute: "2-digit" });
  }
  if (interval === "m3") {
    return d.toLocaleDateString("en-SG", { day: "numeric", month: "short" });
  }
  return d.toLocaleDateString("en-SG", { month: "short", year: "2-digit" });
}

const LABEL_COUNT = 5;
const CHART_H = 300;
const PAD = { top: 8, right: 8, bottom: 8, left: 8 };
const W = 800;

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
  const [hovered, setHovered] = useState<{ x: number; y: number; idx: number } | null>(null);

  const prices = data.prices.filter((p): p is number => p != null);
  if (!prices.length) return null;

  const rawMin = Math.min(...prices);
  const rawMax = Math.max(...prices);
  const yPad = (rawMax - rawMin) * 0.05 || 1;
  const minP = rawMin - yPad;
  const maxP = rawMax + yPad;
  const range = maxP - minP;

  const H = CHART_H;
  const px = (i: number) =>
    PAD.left + (i / (prices.length - 1)) * (W - PAD.left - PAD.right);
  const py = (p: number) =>
    PAD.top + (1 - (p - minP) / range) * (H - PAD.top - PAD.bottom);

  const pathD = prices
    .map((p, i) => `${i === 0 ? "M" : "L"} ${px(i).toFixed(1)} ${py(p).toFixed(1)}`)
    .join(" ");
  const areaD = `${pathD} L ${px(prices.length - 1).toFixed(1)} ${H} L ${px(0).toFixed(1)} ${H} Z`;

  const color = isPositive ? "#22C55E" : "#EF4444";
  const gradId = `grad-${isPositive ? "pos" : "neg"}`;

  // Label positions as percentages of width for HTML overlay
  const labelIndices = Array.from({ length: LABEL_COUNT }, (_, i) =>
    Math.round((i / (LABEL_COUNT - 1)) * (prices.length - 1))
  );

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * W;
    const idx = Math.max(
      0,
      Math.min(
        prices.length - 1,
        Math.round(((mx - PAD.left) / (W - PAD.left - PAD.right)) * (prices.length - 1))
      )
    );
    setHovered({ x: px(idx), y: py(prices[idx]), idx });
  }

  return (
    <div className="relative w-full">
      {/* SVG chart */}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full block"
        preserveAspectRatio="none"
        style={{ height: CHART_H }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHovered(null)}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        <path d={areaD} fill={`url(#${gradId})`} />
        <path d={pathD} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />

        {hovered && (
          <>
            <line
              x1={hovered.x} y1={PAD.top}
              x2={hovered.x} y2={H}
              stroke="#3A3A3A" strokeWidth="1" strokeDasharray="4 3"
            />
            <circle cx={hovered.x} cy={hovered.y} r="5" fill={color} stroke="#0A0A0A" strokeWidth="2" />
          </>
        )}
      </svg>

      {/* HTML date labels — immune to preserveAspectRatio distortion */}
      <div className="relative flex justify-between mt-1 px-0">
        {labelIndices.map(i => (
          <span key={i} className="text-xs text-[#9CA3AF] font-mono leading-none" style={{ minWidth: 0 }}>
            {data.dates[i] ? formatDateLabel(data.dates[i], interval) : ""}
          </span>
        ))}
      </div>

      {/* Hover tooltip */}
      {hovered && (
        <div
          className="absolute top-2 pointer-events-none bg-[#141414] border border-[#333333] rounded px-2.5 py-1.5 text-xs shadow-lg"
          style={{
            left: hovered.x / W < 0.6 ? "8px" : "auto",
            right: hovered.x / W >= 0.6 ? "8px" : "auto",
          }}
        >
          <p className="text-[#F0F0F0] font-bold font-mono">{prices[hovered.idx]?.toFixed(3) ?? "--"}</p>
          <p className="text-[#71717A] mt-0.5">
            {data.dates[hovered.idx]
              ? interval === "d1"
                ? new Date(data.dates[hovered.idx]).toLocaleTimeString("en-SG", { hour: "2-digit", minute: "2-digit" })
                : new Date(data.dates[hovered.idx]).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" })
              : ""}
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
  const [prevData, setPrevData] = useState<ChartData | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/stocks/${encodeURIComponent(ticker)}/chart?interval=${interval}`)
      .then(r => r.json())
      .then((d: ChartData) => {
        const next = d.prices?.length ? d : null;
        setPrevData(next);
        setData(next);
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [ticker, interval]);

  const isPositive = data?.prices?.length
    ? data.prices[data.prices.length - 1] >= data.prices[0]
    : initialPositive;

  return (
    <div className="px-5 pt-4 pb-3 border-b border-[#282828]">
      {/* Interval selector */}
      <div className="flex items-center gap-1 mb-3 overflow-x-auto no-scrollbar">
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

      {/* Chart — fixed height, no layout shift */}
      <div className="relative" style={{ height: CHART_H + 20 }}>
        {/* Show previous data while loading to avoid shift */}
        {(data ?? prevData) ? (
          <div className={loading ? "opacity-40 pointer-events-none" : ""} style={{ transition: "opacity 0.15s" }}>
            <SVGChart data={(data ?? prevData)!} isPositive={isPositive} interval={interval} />
          </div>
        ) : !loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-xs text-[#71717A]">Chart data unavailable</p>
          </div>
        ) : null}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-5 h-5 border-2 border-[#333333] border-t-[#E8311A] rounded-full animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}
