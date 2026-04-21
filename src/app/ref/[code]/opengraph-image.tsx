import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: referrer } = await supabase
    .from("profiles")
    .select("display_name, username")
    .eq("referral_code", code)
    .single();

  const name = referrer?.display_name ?? "A friend";

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: "#0A0A0A",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
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

        {/* Glow */}
        <div
          style={{
            position: "absolute",
            width: 600,
            height: 400,
            background: "radial-gradient(ellipse, rgba(232,49,26,0.2) 0%, transparent 70%)",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />

        {/* Wordmark */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginBottom: 24 }}>
          <span style={{ color: "#E8311A", fontSize: 80, fontWeight: 900, letterSpacing: "-3px", lineHeight: 1 }}>
            Huat
          </span>
          <span style={{ color: "#E8311A", fontSize: 80, fontWeight: 900, lineHeight: 1 }}>
            发
          </span>
        </div>

        {/* Invite text */}
        <p style={{ color: "#F0F0F0", fontSize: 36, fontWeight: 700, margin: "0 0 8px 0", textAlign: "center" }}>
          {name} invited you!
        </p>

        {/* AngBao bonus */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: "rgba(34,197,94,0.1)",
            border: "1px solid rgba(34,197,94,0.3)",
            borderRadius: 16,
            padding: "12px 28px",
            marginTop: 16,
          }}
        >
          <span style={{ fontSize: 36 }}>🧧</span>
          <span style={{ color: "#22C55E", fontSize: 32, fontWeight: 900 }}>+$8.88 Welcome AngBao</span>
        </div>

        {/* Tagline */}
        <p style={{ color: "#9CA3AF", fontSize: 22, margin: "24px 0 0 0" }}>
          Singapore&apos;s social network for retail investors
        </p>

        {/* URL */}
        <p style={{ color: "#555555", fontSize: 18, margin: "12px 0 0 0", letterSpacing: "1px" }}>
          huat.co
        </p>
      </div>
    ),
    { ...size }
  );
}
