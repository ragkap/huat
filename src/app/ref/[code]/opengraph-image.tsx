import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: referrer } = await supabase
    .from("profiles")
    .select("display_name, username, avatar_url")
    .eq("referral_code", code)
    .single();

  const name = referrer?.display_name ?? "A friend";
  const username = referrer?.username ?? "";
  const initial = name[0]?.toUpperCase() ?? "?";

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
              "linear-gradient(rgba(232,49,26,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(232,49,26,0.04) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Glow behind avatar */}
        <div
          style={{
            position: "absolute",
            width: 500,
            height: 500,
            background: "radial-gradient(ellipse, rgba(232,49,26,0.18) 0%, transparent 70%)",
            top: "30%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />

        {/* Wordmark — top left */}
        <div style={{ position: "absolute", top: 40, left: 56, display: "flex", alignItems: "baseline", gap: 10 }}>
          <span style={{ color: "#E8311A", fontSize: 48, fontWeight: 900, letterSpacing: "-2px" }}>Huat</span>
          <span style={{ color: "#E8311A", fontSize: 44, fontWeight: 900 }}>发</span>
        </div>

        {/* Avatar circle */}
        <div
          style={{
            width: 100,
            height: 100,
            borderRadius: 50,
            background: "#E8311A",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 20,
            border: "3px solid rgba(232,49,26,0.4)",
            boxShadow: "0 0 40px rgba(232,49,26,0.3)",
          }}
        >
          {referrer?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={referrer.avatar_url}
              alt=""
              width={100}
              height={100}
              style={{ borderRadius: 50, objectFit: "cover" }}
            />
          ) : (
            <span style={{ color: "white", fontSize: 44, fontWeight: 900 }}>{initial}</span>
          )}
        </div>

        {/* Invite text */}
        <p style={{ color: "#F0F0F0", fontSize: 42, fontWeight: 900, margin: 0, textAlign: "center", letterSpacing: "-1px" }}>
          {name} invited you!
        </p>
        <p style={{ color: "#71717A", fontSize: 20, margin: "4px 0 0 0" }}>
          @{username} on Huat.co
        </p>

        {/* AngBao bonus */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: "rgba(34,197,94,0.1)",
            border: "1px solid rgba(34,197,94,0.3)",
            borderRadius: 100,
            padding: "10px 28px",
            marginTop: 24,
          }}
        >
          <span style={{ fontSize: 28 }}>🧧</span>
          <span style={{ color: "#22C55E", fontSize: 26, fontWeight: 900 }}>Earn AngBao social credits!</span>
        </div>

        {/* Bottom tagline */}
        <div style={{ position: "absolute", bottom: 36, display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ color: "#555555", fontSize: 18 }}>Join Singapore&apos;s investing community</span>
          <span style={{ color: "#333333" }}>·</span>
          <span style={{ color: "#555555", fontSize: 18, letterSpacing: "1px" }}>huat.co</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
