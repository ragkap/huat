import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: "#E8311A",
          borderRadius: 7,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            color: "#FFFFFF",
            fontSize: 22,
            fontWeight: 900,
            lineHeight: 1,
            fontFamily: "sans-serif",
            marginTop: 1,
          }}
        >
          H
        </span>
      </div>
    ),
    { ...size }
  );
}
