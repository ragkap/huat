import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";
import { TopNav } from "@/components/layout/top-nav";
import { RightAside } from "@/components/layout/right-aside";
import { TrendingStocks } from "@/components/layout/trending-stocks";
import type { Profile } from "@/types/database";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profileRes, notifsRes, messagesRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("notifications").select("id", { count: "exact", head: true }).eq("recipient_id", user.id).eq("is_read", false),
    supabase.from("messages").select("id", { count: "exact", head: true }).eq("is_read", false).neq("sender_id", user.id),
  ]);
  const profile = profileRes.data;
  if (!profile) redirect("/onboarding");

  const unreadNotifs = notifsRes.count ?? 0;
  const unreadMessages = messagesRes.count ?? 0;

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <TopNav unreadNotifs={unreadNotifs} unreadMessages={unreadMessages} profile={profile as Profile} />
      <div className="flex max-w-6xl mx-auto pt-14">
        <Sidebar />
        <main className="flex-1 min-h-screen border-l border-[#282828] pb-16 lg:pb-0">
          {children}
        </main>
        <RightAside>
          <Suspense fallback={<div className="border border-[#282828] rounded p-4"><p className="text-xs text-[#71717A]">Loading...</p></div>}>
            <TrendingStocks />
          </Suspense>
        </RightAside>
      </div>
    </div>
  );
}

