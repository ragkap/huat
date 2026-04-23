import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";
import { TopNav } from "@/components/layout/top-nav";
import { RightAside } from "@/components/layout/right-aside";
import { LoadingLink } from "@/components/ui/loading-link";
import { AngBaoToastProvider } from "@/components/angbao/credit-toast";
import { TrendingStocks } from "@/components/layout/trending-stocks";
import type { Profile } from "@/types/database";

export default async function PostLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Unauthenticated: public preview with minimal branding header
  if (!user) {
    return (
      <div className="min-h-screen bg-[#0A0A0A]">
        <header className="sticky top-0 z-30 bg-[#0A0A0A]/95 backdrop-blur-md border-b border-[#282828] h-14">
          <div className="max-w-2xl mx-auto h-full flex items-center justify-between px-4">
            <a href="/" className="flex items-center gap-2">
              <span className="text-[#E8311A] font-black text-2xl tracking-tighter leading-none">Huat</span>
              <span className="text-[#E8311A] font-black text-2xl">发</span>
            </a>
            <div className="flex items-center gap-3">
              <LoadingLink href={`/login?redirect=${encodeURIComponent(`/post/${id}`)}`} className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-[#9CA3AF] hover:text-[#F0F0F0] transition-colors">Log in</LoadingLink>
              <LoadingLink href={`/login?redirect=${encodeURIComponent(`/post/${id}`)}`} className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded bg-[#E8311A] text-white hover:bg-[#c9280f] transition-colors">Sign up</LoadingLink>
            </div>
          </div>
        </header>
        <main className="max-w-2xl mx-auto">
          {children}
        </main>
        <footer className="border-t border-[#282828] px-8 py-6 flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-baseline gap-1.5">
            <span className="text-[#E8311A] font-black text-xl tracking-tighter">Huat</span>
            <span className="text-[#E8311A] font-black text-xl">发</span>
            <span className="text-[#71717A] text-xs ml-1">huat.co</span>
          </div>
          <p className="text-[#71717A] text-xs">Singapore&apos;s investor community</p>
        </footer>
      </div>
    );
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  return (
    <AngBaoToastProvider initialBalance={(profile as Profile)?.angbao_balance ?? 0}>
      <div className="min-h-screen bg-[#0A0A0A]">
        <TopNav profile={profile as Profile} />
        <div className="flex max-w-[1290px] mx-auto pt-14">
          <Sidebar />
          <main className="flex-1 min-h-screen pb-16 lg:pb-0 min-w-0" style={{ overflowX: "clip" }}>
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
