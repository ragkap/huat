import { createClient } from "@/lib/supabase/server";
import { FeedList } from "@/components/feed/feed-list";
import type { Profile } from "@/types/database";

export const metadata = { title: "Saved — Huat.co" };

export default async function SavedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user!.id).single();

  return (
    <div>
      <div className="sticky top-14 z-10 bg-[#0A0A0A]/90 backdrop-blur-md border-b border-[#282828] hidden sm:flex sm:items-center px-5 py-4">
        <h1 className="text-xl font-black text-[#F0F0F0]">Saved</h1>
      </div>
      <FeedList tab="saved" profile={profile as Profile} />
    </div>
  );
}
