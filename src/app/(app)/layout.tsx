import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";
import type { Profile } from "@/types/database";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/onboarding");

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex justify-center">
      <div className="flex w-full max-w-6xl">
        <Sidebar profile={profile as Profile} />
        <main className="flex-1 ml-64 min-h-screen border-x border-[#282828]">
          {children}
        </main>
        <aside className="w-72 xl:w-80 flex-shrink-0 p-6 hidden xl:block">
          <div className="sticky top-6">
            <TrendingStocks />
          </div>
        </aside>
      </div>
    </div>
  );
}

async function TrendingStocks() {
  let stocks: { name: string; bloomberg_ticker: string | null; sector: string | null; slug: string | null }[] = [];
  try {
    const { getSingaporeStocks } = await import("@/lib/stocks-db/client");
    const all = await getSingaporeStocks(200);
    stocks = all.sort(() => Math.random() - 0.5).slice(0, 10);
  } catch {
    stocks = [];
  }

  return (
    <div className="border border-[#282828] rounded p-4">
      <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider mb-3">SGX Stocks</p>
      {stocks.length === 0 ? (
        <p className="text-xs text-[#9CA3AF]">Loading stocks...</p>
      ) : (
        <div className="space-y-1">
          {stocks.map(s => (
            <a
              key={s.bloomberg_ticker}
              href={`/stocks/${encodeURIComponent(s.slug ?? s.bloomberg_ticker ?? s.name)}`}
              className="flex items-center justify-between hover:bg-[#282828] -mx-2 px-2 py-1.5 rounded transition-colors group"
            >
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#E0E0E0] truncate group-hover:text-white">{s.name}</p>
                <p className="text-xs text-[#9CA3AF] font-mono">{s.bloomberg_ticker}</p>
              </div>
              {s.sector && (
                <span className="text-xs text-[#9CA3AF] ml-2 flex-shrink-0">{s.sector.slice(0, 3)}</span>
              )}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
