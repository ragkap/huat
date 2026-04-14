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
  const description = stock?.description ? stock.description.slice(0, 120) + (stock.description.length > 120 ? "…" : "") : null;

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
          padding: "60px 72px",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Grid background */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(232,49,26,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(232,49,26,0.04) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Glow */}
        <div
          style={{
            position: "absolute",
            width: 500,
            height: 300,
            background: "radial-gradient(ellipse, rgba(232,49,26,0.12) 0%, transparent 70%)",
            bottom: 0,
            right: 0,
          }}
        />

        {/* Top: wordmark */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <span style={{ color: "#E8311A", fontSize: 32, fontWeight: 900, letterSpacing: "-1px" }}>Huat</span>
          <span style={{ color: "#E8311A", fontSize: 32, fontWeight: 900 }}>发</span>
          <span style={{ color: "#333333", fontSize: 18, marginLeft: 8 }}>huat.co</span>
        </div>

        {/* Middle: stock info */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, flex: 1, justifyContent: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* Ticker badge */}
            <div
              style={{
                background: "#141414",
                border: "1px solid #282828",
                borderRadius: 8,
                padding: "8px 16px",
                color: "#9CA3AF",
                fontSize: 20,
                fontWeight: 700,
                fontFamily: "monospace",
                letterSpacing: "0.05em",
              }}
            >
              {displayTicker}
            </div>
            {sector && (
              <span style={{ color: "#555555", fontSize: 18 }}>{sector}</span>
            )}
          </div>

          <p style={{ color: "#F0F0F0", fontSize: 52, fontWeight: 900, lineHeight: 1.1, margin: 0, letterSpacing: "-1px" }}>
            {name}
          </p>

          {description && (
            <p style={{ color: "#71717A", fontSize: 22, lineHeight: 1.5, margin: 0, maxWidth: 800 }}>
              {description}
            </p>
          )}
        </div>

        {/* Bottom: SGX + slogan */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ color: "#333333", fontSize: 16 }}>SGX Listed</span>
          <span style={{ color: "#333333", fontSize: 16 }}>Invest Together. Prosper Together.</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
