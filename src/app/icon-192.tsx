import { ImageResponse } from "next/og";

export const size = { width: 192, height: 192 };
export const contentType = "image/png";

export default function Icon192() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 192,
          height: 192,
          background: "#E8311A",
          borderRadius: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span style={{ color: "#FFFFFF", fontSize: 100, fontWeight: 900, lineHeight: 1, fontFamily: "sans-serif" }}>
          发
        </span>
      </div>
    ),
    { ...size }
  );
}
