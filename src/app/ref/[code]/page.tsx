import { createClient } from "@supabase/supabase-js";
import type { Metadata } from "next";

const admin = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params;
  const { data: referrer } = await admin()
    .from("profiles")
    .select("display_name, username")
    .eq("referral_code", code)
    .single();

  const name = referrer?.display_name ?? "A friend";
  const title = `${name} invited you to Huat!`;
  const description = `Join Singapore's investing community and earn AngBao social credits. Invest together, prosper together!`;
  const ogImage = `https://www.huat.co/ref/${code}/opengraph-image`;

  return {
    title,
    description,
    openGraph: { title, description, url: `https://www.huat.co/ref/${code}`, siteName: "Huat.co", type: "website", images: [{ url: ogImage, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title, description, images: [ogImage] },
  };
}

export default async function ReferralPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  const { data: referrer } = await admin()
    .from("profiles")
    .select("display_name")
    .eq("referral_code", code)
    .single();

  const refName = referrer?.display_name ?? "";
  const loginUrl = `/login?redirect=/feed&ref=${encodeURIComponent(code)}&refname=${encodeURIComponent(refName)}`;

  // Render a page with meta tags (for OG crawlers) + client-side redirect (for browsers)
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
      <meta httpEquiv="refresh" content={`0;url=${loginUrl}`} />
      <script dangerouslySetInnerHTML={{ __html: `window.location.replace(${JSON.stringify(loginUrl)})` }} />
      <div className="text-center">
        <div className="flex items-baseline gap-2 justify-center mb-4">
          <span className="text-[#E8311A] font-black text-4xl tracking-tighter">Huat</span>
          <span className="text-[#E8311A] font-black text-4xl">发</span>
        </div>
        <p className="text-[#9CA3AF] text-sm">Redirecting you to sign up...</p>
      </div>
    </div>
  );
}
