import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          background: "#0A0A0A",
          borderRadius: 40,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 0,
        }}
      >
        <span
          style={{
            color: "#FF3D1A",
            fontSize: 100,
            fontWeight: 900,
            lineHeight: 1,
            fontFamily: "sans-serif",
          }}
        >
          发
        </span>
      </div>
    ),
    { ...size }
  );
}
