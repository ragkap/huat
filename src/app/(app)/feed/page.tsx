import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { FeedTabs } from "@/components/feed/feed-tabs";
import { FeedList } from "@/components/feed/feed-list";
import type { Profile } from "@/types/database";

interface FeedPageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function FeedPage({ searchParams }: FeedPageProps) {
  const params = await searchParams;
  const tab = params.tab ?? "foryou";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile) return null;

  return (
    <div>
      {/* Header */}
      <div className="sticky top-14 z-10 bg-[#0A0A0A]/90 backdrop-blur-md border-b border-[#282828]">
        <Suspense>
          <FeedTabs />
        </Suspense>
      </div>

      <FeedList tab={tab} profile={profile as unknown as Profile} />
    </div>
  );
}
