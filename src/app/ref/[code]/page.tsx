import { redirect } from "next/navigation";
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
  const title = `${name} invited you to Huat.co!`;
  const description = `Join Singapore's investing community and get a $8.88 AngBao welcome bonus. Invest together, prosper together!`;
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

  // Store the referral code in the redirect URL so we can pick it up after signup
  redirect(`/login?redirect=/feed&ref=${encodeURIComponent(code)}`);
}
