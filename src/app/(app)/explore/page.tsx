"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

interface SGStock {
  slug: string | null;
  bloomberg_ticker: string | null;
  name: string;
  sector: string | null;
}

interface Profile {
  username: string;
  display_name: string;
  country: string;
}

function ExploreResults() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";

  const [stocks, setStocks] = useState<SGStock[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q.trim()) { setStocks([]); setProfiles([]); return; }
    setLoading(true);
    Promise.all([
      fetch(`/api/stocks?q=${encodeURIComponent(q)}`).then(r => r.json()),
      fetch(`/api/users/search?q=${encodeURIComponent(q)}`).then(r => r.json()).catch(() => ({ profiles: [] })),
    ]).then(([stocksRes, profilesRes]) => {
      setStocks(stocksRes.stocks ?? []);
      setProfiles(profilesRes.profiles ?? []);
    }).finally(() => setLoading(false));
  }, [q]);

  const hasResults = stocks.length > 0 || profiles.length > 0;

  return (
    <div>
      <div className="sticky top-14 z-10 bg-[#0A0A0A]/90 backdrop-blur-md border-b border-[#282828] hidden sm:flex sm:items-center px-5 py-4">
        <h1 className="text-xl font-black text-[#F0F0F0]">Search</h1>
      </div>

      <div className="px-5 py-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-5 h-5 border-2 border-[#333333] border-t-[#E8311A] rounded-full animate-spin" />
          </div>
        ) : !q.trim() ? (
          <div className="py-12 text-center">
            <p className="text-[#71717A] text-sm">Search stocks and investors above</p>
          </div>
        ) : !hasResults ? (
          <div className="py-12 text-center">
            <p className="text-[#9CA3AF] font-medium mb-1">No results for "{q}"</p>
            <p className="text-[#71717A] text-sm">Try a different ticker or name</p>
          </div>
        ) : (
          <div className="space-y-6">
            {profiles.length > 0 && (
              <div>
                <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider mb-3">People</p>
                <div className="space-y-0">
                  {profiles.map(p => (
                    <Link
                      key={p.username}
                      href={`/profile/${p.username}`}
                      className="flex items-center gap-3 py-3 border-b border-[#141414] hover:bg-[#0D0D0D] -mx-5 px-5 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-[#282828] border border-[#333333] flex items-center justify-center text-sm font-bold text-[#9CA3AF]">
                        {p.display_name[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-[#F0F0F0]">{p.display_name}</p>
                        <p className="text-xs text-[#71717A]">@{p.username}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {stocks.length > 0 && (
              <div>
                <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider mb-3">Stocks</p>
                <div className="space-y-0">
                  {stocks.map(s => (
                    <Link
                      key={s.bloomberg_ticker}
                      href={`/stocks/${encodeURIComponent(s.slug ?? s.bloomberg_ticker ?? s.name)}`}
                      className="flex items-center gap-3 py-3 border-b border-[#141414] hover:bg-[#0D0D0D] -mx-5 px-5 transition-colors"
                    >
                      <div className="w-10 h-10 rounded bg-[#141414] border border-[#282828] flex items-center justify-center text-xs font-bold text-[#9CA3AF] font-mono">
                        {(s.bloomberg_ticker ?? "?").split(" ")[0].slice(0, 4)}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-[#F0F0F0]">{s.name}</p>
                        <p className="text-xs text-[#71717A] font-mono">{s.bloomberg_ticker}{s.sector && ` · ${s.sector}`}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense>
      <ExploreResults />
    </Suspense>
  );
}
