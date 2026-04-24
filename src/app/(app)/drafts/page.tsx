import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DraftsList } from "@/components/drafts/drafts-list";

export const metadata = { title: "Drafts — Huat.co" };

export interface DraftRow {
  id: string;
  content: string;
  post_type: "post" | "forecast";
  sentiment: "bullish" | "bearish" | "neutral" | null;
  attachments: unknown[];
  tagged_stocks: string[];
  forecast_data: { ticker: string; target_price: number; target_date: string } | null;
  scheduled_for: string | null;
  publish_error: string | null;
  created_at: string;
  updated_at: string;
}

export default async function DraftsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("post_drafts")
    .select("id, content, post_type, sentiment, attachments, tagged_stocks, forecast_data, scheduled_for, publish_error, created_at, updated_at")
    .eq("author_id", user.id)
    .order("updated_at", { ascending: false });

  return (
    <div className="max-w-2xl mx-auto px-5 py-6">
      <div className="mb-6">
        <h1 className="text-lg font-bold text-[#F0F0F0]">Drafts</h1>
        <p className="text-sm text-[#9CA3AF] mt-1">Unpublished posts and anything you&apos;ve scheduled.</p>
      </div>
      <DraftsList initialDrafts={(data ?? []) as DraftRow[]} />
    </div>
  );
}
