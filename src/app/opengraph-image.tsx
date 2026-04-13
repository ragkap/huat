import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
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
        }}
      >
        {/* Subtle grid lines */}
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
            width: 600,
            height: 300,
            background: "radial-gradient(ellipse, rgba(232,49,26,0.15) 0%, transparent 70%)",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />

        {/* Wordmark */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 16,
            marginBottom: 24,
          }}
        >
          <span
            style={{
              color: "#E8311A",
              fontSize: 120,
              fontWeight: 900,
              letterSpacing: "-4px",
              lineHeight: 1,
            }}
          >
            Huat
          </span>
          <span
            style={{
              color: "#E8311A",
              fontSize: 120,
              fontWeight: 900,
              lineHeight: 1,
            }}
          >
            发
          </span>
        </div>

        {/* Tagline */}
        <p
          style={{
            color: "#9CA3AF",
            fontSize: 28,
            fontWeight: 400,
            letterSpacing: "0.5px",
            margin: 0,
          }}
        >
          Singapore's social network for retail investors
        </p>

        {/* URL */}
        <p
          style={{
            color: "#555555",
            fontSize: 20,
            margin: "16px 0 0 0",
            letterSpacing: "1px",
          }}
        >
          huat.co
        </p>
      </div>
    ),
    { ...size }
  );
}
