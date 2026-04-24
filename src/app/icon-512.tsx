import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon512() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 512,
          height: 512,
          background: "#E8311A",
          borderRadius: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span style={{ color: "#FFFFFF", fontSize: 260, fontWeight: 900, lineHeight: 1, fontFamily: "sans-serif" }}>
          发
        </span>
      </div>
    ),
    { ...size }
  );
}
