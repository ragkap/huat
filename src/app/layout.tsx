import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

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
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full`} suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#E8311A" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem("theme");var d=t?t==="dark":true;document.documentElement.classList.toggle("dark",d);document.documentElement.classList.toggle("light",!d)}catch(e){}})()` }} />
      </head>
      <body className="min-h-full">
        {children}
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-QYZYDPDJVD" strategy="afterInteractive" />
        <Script id="gtag-init" strategy="afterInteractive">
          {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-QYZYDPDJVD');`}
        </Script>
      </body>
    </html>
  );
}
