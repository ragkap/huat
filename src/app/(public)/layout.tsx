import { createClient } from "@/lib/supabase/server";
import { TopNav } from "@/components/layout/top-nav";
import { Sidebar } from "@/components/layout/sidebar";
import { RightAside } from "@/components/layout/right-aside";
import { Suspense } from "react";
import { TrendingStocks } from "@/components/layout/trending-stocks";
import { AngBaoToastProvider } from "@/components/angbao/credit-toast";
import type { Profile } from "@/types/database";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const profile = user
    ? (await supabase.from("profiles").select("*").eq("id", user.id).single()).data as Profile | null
    : null;

  return (
    <AngBaoToastProvider initialBalance={profile?.angbao_balance ?? 0}>
      <div className="min-h-screen bg-[#0A0A0A]">
        <TopNav profile={profile ?? undefined} />
        <div className="flex max-w-[1290px] mx-auto pt-14">
          <Sidebar />
          <main className="flex-1 min-h-screen lg:border-l lg:border-[#282828] pb-16 lg:pb-0 min-w-0" style={{ overflowX: "clip" }}>
            {children}
          </main>
          <RightAside>
            <Suspense fallback={<div className="border border-[#282828] rounded p-4"><p className="text-xs text-[#71717A]">Loading...</p></div>}>
              <TrendingStocks />
            </Suspense>
          </RightAside>
        </div>
      </div>
    </AngBaoToastProvider>
  );
}
