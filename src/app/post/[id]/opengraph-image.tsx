import { ImageResponse } from "next/og";
import { createClient as createSupabase } from "@supabase/supabase-js";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Use admin client — OG crawlers aren't authenticated
  const supabase = createSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: post } = await supabase
    .from("posts")
    .select("content, post_type, sentiment, tagged_stocks, created_at, author:profiles!posts_author_id_fkey(display_name, username)")
    .eq("id", id)
    .single();

  const author = (post?.author as { display_name?: string; username?: string } | null);
  const authorName = author?.display_name ?? "Someone";
  const username = author?.username ?? "";
  const content = (post?.content as string) ?? "";
  const sentiment = post?.sentiment as string | null;
  const postType = (post?.post_type as string) ?? "post";
  const stocks = (post?.tagged_stocks as string[]) ?? [];
  const displayTicker = stocks[0]?.replace(/ SP$/, "") ?? "";

  const sentimentColor = sentiment === "bullish" ? "#22C55E" : sentiment === "bearish" ? "#EF4444" : "#9CA3AF";
  const sentimentLabel = sentiment === "bullish" ? "▲ Bullish" : sentiment === "bearish" ? "▼ Bearish" : "";
  const typeLabel = postType === "poll" ? "Poll" : postType === "forecast" ? "Prediction" : "";

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

        {/* Bottom-right glow */}
        <div
          style={{
            position: "absolute",
            width: 700,
            height: 700,
            background: "radial-gradient(ellipse at center, rgba(232,49,26,0.18) 0%, rgba(232,49,26,0.06) 40%, transparent 70%)",
            bottom: -200,
            right: -150,
          }}
        />

        {/* Top: wordmark + author */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
            <span style={{ color: "#E8311A", fontSize: 64, fontWeight: 900, letterSpacing: "-2px" }}>Huat</span>
            <span style={{ color: "#E8311A", fontSize: 58, fontWeight: 900 }}>发</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
              <span style={{ color: "#F0F0F0", fontSize: 22, fontWeight: 700 }}>{authorName}</span>
              <span style={{ color: "#555555", fontSize: 16 }}>@{username}</span>
            </div>
          </div>
        </div>

        {/* Middle: post content */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, flex: 1, justifyContent: "center", zIndex: 1 }}>
          {/* Tags row: ticker + sentiment + type */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {displayTicker && (
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
            )}
            {sentimentLabel && (
              <span style={{ color: sentimentColor, fontSize: 17, fontWeight: 700 }}>{sentimentLabel}</span>
            )}
            {typeLabel && (
              <div
                style={{
                  background: "#E8311A",
                  borderRadius: 8,
                  padding: "6px 18px",
                  color: "#FFFFFF",
                  fontSize: 20,
                  fontWeight: 800,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                {typeLabel === "Poll" ? "📊 Poll" : "🎯 Prediction"}
              </div>
            )}
          </div>

          {/* Content */}
          <p
            style={{
              color: "#F0F0F0",
              fontSize: 40,
              fontWeight: 700,
              lineHeight: 1.3,
              margin: 0,
              maxWidth: 1000,
            }}
          >
            {content.length > 100 ? content.slice(0, 100) + "…" : content}
          </p>
        </div>

        {/* Bottom bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 1 }}>
          <div
            style={{
              background: "rgba(232,49,26,0.12)",
              border: "1px solid rgba(232,49,26,0.3)",
              borderRadius: 100,
              padding: "6px 16px",
              color: "#E8311A",
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: "0.04em",
            }}
          >
            Join the conversation on Huat.co — it's free
          </div>
          <span style={{ color: "#3A3A3A", fontSize: 15 }}>Invest Together. Prosper Together.</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
