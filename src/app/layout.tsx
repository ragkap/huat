import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://www.huat.co"),
  title: "Huat.co — Invest Together, Prosper Together",
  description: "Singapore's social network for retail investors. Follow stocks, share forecasts, and grow your wealth.",
  openGraph: {
    title: "Huat.co — Invest Together, Prosper Together",
    description: "Singapore's social network for retail investors. Follow stocks, share forecasts, and grow your wealth.",
    siteName: "Huat.co",
    url: "https://www.huat.co",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Huat.co — Invest Together, Prosper Together",
    description: "Singapore's social network for retail investors.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
