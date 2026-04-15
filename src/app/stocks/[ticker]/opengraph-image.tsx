import { ImageResponse } from "next/og";
import { getStockBySlugOrTicker } from "@/lib/stocks-db/client";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params;
  const identifier = decodeURIComponent(ticker);
  const stock = await getStockBySlugOrTicker(identifier).catch(() => null);

  const name = stock?.name ?? identifier;
  const displayTicker = (stock?.bloomberg_ticker ?? identifier).replace(/ SP$/, "");
  const sector = stock?.sector ?? null;
  const description = stock?.description ?? null;

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: "#0A0A0A",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "56px 72px",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Grid background */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(232,49,26,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(232,49,26,0.05) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Bottom-right glow — large warm burst */}
        <div
          style={{
            position: "absolute",
            width: 700,
            height: 700,
            background: "radial-gradient(ellipse at center, rgba(232,49,26,0.22) 0%, rgba(232,49,26,0.08) 40%, transparent 70%)",
            bottom: -200,
            right: -150,
          }}
        />
        {/* Secondary smaller glow for depth */}
        <div
          style={{
            position: "absolute",
            width: 300,
            height: 300,
            background: "radial-gradient(ellipse at center, rgba(255,100,60,0.18) 0%, transparent 70%)",
            bottom: -60,
            right: 80,
          }}
        />

        {/* Top: wordmark */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 14, zIndex: 1 }}>
          <span style={{ color: "#E8311A", fontSize: 64, fontWeight: 900, letterSpacing: "-2px" }}>Huat</span>
          <span style={{ color: "#E8311A", fontSize: 58, fontWeight: 900 }}>发</span>
          <span style={{ color: "#444444", fontSize: 20, marginLeft: 8 }}>huat.co</span>
        </div>

        {/* Middle: stock info */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14, flex: 1, justifyContent: "center", zIndex: 1 }}>
          {/* Ticker + sector */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                background: "#141414",
                border: "1px solid #303030",
                borderRadius: 6,
                padding: "6px 14px",
                color: "#9CA3AF",
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: "0.08em",
              }}
            >
              {displayTicker}
            </div>
            {sector && (
              <span style={{ color: "#555555", fontSize: 17 }}>{sector}</span>
            )}
          </div>

          {/* Company name */}
          <p style={{ color: "#F0F0F0", fontSize: 54, fontWeight: 900, lineHeight: 1.05, margin: 0, letterSpacing: "-1.5px", maxWidth: 900 }}>
            {name}
          </p>

          {/* Description — full, clamped by available space */}
          {description && (
            <p style={{ color: "#6B7280", fontSize: 19, lineHeight: 1.55, margin: 0, maxWidth: 780, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              {description}
            </p>
          )}
        </div>

        {/* Bottom bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Pill */}
            <div style={{
              background: "rgba(232,49,26,0.12)",
              border: "1px solid rgba(232,49,26,0.3)",
              borderRadius: 100,
              padding: "6px 16px",
              color: "#E8311A",
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: "0.04em",
            }}>
              Join Singapore's investing community. It's free.
            </div>
          </div>
          <span style={{ color: "#3A3A3A", fontSize: 15 }}>Invest Together. Prosper Together.</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
