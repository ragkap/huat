"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { TrendingUp, User, Search, X, Bell, MessageSquare, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/database";

interface SearchResult {
  type: "stock" | "profile";
  href: string;
  primary: string;
  secondary: string;
}

export function SearchBar({ autoFocus }: { autoFocus?: boolean } = {}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  useEffect(() => { if (autoFocus) inputRef.current?.focus(); }, [autoFocus]);

  useEffect(() => {
    if (!query.trim()) { setResults([]); setOpen(false); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const [stocksRes, profilesRes] = await Promise.all([
          fetch(`/api/stocks?q=${encodeURIComponent(query)}`).then(r => r.json()),
          fetch(`/api/users/search?q=${encodeURIComponent(query)}`).then(r => r.json()).catch(() => ({ profiles: [] })),
        ]);
        const stockResults: SearchResult[] = (stocksRes.stocks ?? []).slice(0, 5).map((s: { slug: string | null; bloomberg_ticker: string | null; name: string }) => ({
          type: "stock" as const,
          href: `/stocks/${encodeURIComponent(s.slug ?? s.bloomberg_ticker ?? s.name)}`,
          primary: s.name,
          secondary: s.bloomberg_ticker ?? "",
        }));
        const profileResults: SearchResult[] = (profilesRes.profiles ?? []).slice(0, 3).map((p: { username: string; display_name: string }) => ({
          type: "profile" as const,
          href: `/profile/${p.username}`,
          primary: p.display_name,
          secondary: `@${p.username}`,
        }));
        setResults([...profileResults, ...stockResults]);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 250);
  }, [query]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function clear() {
    setQuery("");
    setResults([]);
    setOpen(false);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && query.trim()) {
      setOpen(false);
      router.push(`/explore?q=${encodeURIComponent(query.trim())}`);
    }
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <div className={cn(
        "flex items-center gap-2 bg-[#141414] border rounded-lg px-3 py-2 transition-colors",
        open ? "border-[#383838]" : "border-[#282828] hover:border-[#333333]"
      )}>
        <Search className="w-4 h-4 text-[#71717A] flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => results.length && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search stocks, people…"
          className="flex-1 bg-transparent text-sm text-[#F0F0F0] placeholder:text-[#71717A] outline-none min-w-0"
        />
        {loading && (
          <div className="w-3.5 h-3.5 border-2 border-[#333333] border-t-[#E8311A] rounded-full animate-spin flex-shrink-0" />
        )}
        {query && !loading && (
          <button onClick={clear} className="text-[#71717A] hover:text-[#9CA3AF] flex-shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#141414] border border-[#282828] rounded-lg shadow-xl overflow-hidden z-50">
          {results.map((r, i) => (
            <Link
              key={i}
              href={r.href}
              onClick={() => { setOpen(false); setQuery(""); }}
              className="flex items-center gap-3 px-3 py-2.5 hover:bg-[#1C1C1C] transition-colors"
            >
              <div className={cn(
                "w-7 h-7 rounded flex items-center justify-center flex-shrink-0",
                r.type === "stock" ? "bg-[#E8311A]/10 text-[#E8311A]" : "bg-[#282828] text-[#9CA3AF]"
              )}>
                {r.type === "stock" ? <TrendingUp className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
              </div>
              <div className="min-w-0">
                <p className="text-sm text-[#F0F0F0] font-medium truncate">{r.primary}</p>
                <p className="text-xs text-[#71717A] font-mono truncate">{r.secondary}</p>
              </div>
            </Link>
          ))}
          <button
            onClick={() => { setOpen(false); router.push(`/explore?q=${encodeURIComponent(query.trim())}`); }}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-[#71717A] hover:bg-[#1C1C1C] hover:text-[#F0F0F0] transition-colors border-t border-[#282828]"
          >
            <Search className="w-3.5 h-3.5" />
            See all results for "{query}"
          </button>
        </div>
      )}
    </div>
  );
}

function ProfileMenu({ profile }: { profile: Profile }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        onClick={() => setOpen(o => !o)}
        className={cn(
          "w-8 h-8 rounded-full bg-[#282828] border flex items-center justify-center text-xs font-bold transition-colors",
          open ? "border-[#555555] text-[#F0F0F0]" : "border-[#333333] text-[#9CA3AF] hover:border-[#555555] hover:text-[#F0F0F0]"
        )}
      >
        {profile.display_name[0]?.toUpperCase()}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-[#141414] border border-[#282828] rounded-lg shadow-xl overflow-hidden z-50">
          <div className="px-3 py-2.5 border-b border-[#282828]">
            <p className="text-sm font-semibold text-[#F0F0F0] truncate">{profile.display_name}</p>
            <p className="text-xs text-[#71717A] truncate">@{profile.username}</p>
          </div>
          <Link
            href={`/profile/${profile.username}`}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2.5 text-sm text-[#9CA3AF] hover:text-[#F0F0F0] hover:bg-[#1C1C1C] transition-colors"
          >
            <User className="w-4 h-4" />
            View profile
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-[#9CA3AF] hover:text-[#EF4444] hover:bg-[#1C1C1C] transition-colors border-t border-[#282828]"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

function MobileSearchOverlay() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="sm:hidden relative w-10 h-10 flex items-center justify-center rounded-lg text-[#71717A] hover:text-[#F0F0F0] hover:bg-[#141414] transition-colors"
      >
        <Search style={{ width: 20, height: 20 }} />
      </button>
      {open && (
        <div className="sm:hidden fixed inset-0 z-50 bg-[#0A0A0A]/95 backdrop-blur-md px-4 pt-4">
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <SearchBar autoFocus />
            </div>
            <button
              onClick={() => setOpen(false)}
              className="flex-shrink-0 w-10 h-10 flex items-center justify-center text-[#71717A] hover:text-[#F0F0F0]"
            >
              <X style={{ width: 20, height: 20 }} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export function TopNav({ unreadNotifs = 0, unreadMessages = 0, profile }: { unreadNotifs?: number; unreadMessages?: number; profile?: Profile }) {
  return (
    <header className="fixed top-0 left-0 right-0 z-30 bg-[#0A0A0A]/95 backdrop-blur-md border-b border-[#282828] h-14">
      <div className="max-w-[1290px] mx-auto h-full flex items-center">
        {/* Logo — aligns with sidebar width */}
        <Link href="/feed" className="flex items-baseline gap-2 flex-shrink-0 lg:w-80 px-4">
          <span className="text-[#E8311A] font-black text-2xl tracking-tighter leading-none">huat</span>
          <span className="text-[#E8311A] font-black text-2xl">发</span>
        </Link>

        {/* Search — hidden on mobile (collapsed to icon), visible sm+ */}
        <div className="hidden sm:flex flex-1 lg:w-[650px] lg:flex-shrink-0 px-5">
          <SearchBar />
        </div>

        {/* Right icons */}
        <div className="flex items-center justify-end gap-1 sm:gap-2 flex-shrink-0 xl:w-80 px-4 ml-auto sm:ml-0">
          {/* Mobile search icon */}
          <MobileSearchOverlay />
          <Link
            href="/notifications"
            title="Notifications"
            className="relative w-10 h-10 flex items-center justify-center rounded-lg text-[#71717A] hover:text-[#F0F0F0] hover:bg-[#141414] transition-colors"
          >
            <Bell style={{ width: 22, height: 22 }} />
            {unreadNotifs > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 bg-[#E8311A] rounded-full text-[10px] font-bold text-white flex items-center justify-center px-0.5 leading-none">
                {unreadNotifs > 99 ? "99+" : unreadNotifs}
              </span>
            )}
          </Link>
          <Link
            href="/messages"
            title="Messages"
            className="relative w-10 h-10 flex items-center justify-center rounded-lg text-[#71717A] hover:text-[#F0F0F0] hover:bg-[#141414] transition-colors"
          >
            <MessageSquare style={{ width: 22, height: 22 }} />
            {unreadMessages > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 bg-[#E8311A] rounded-full text-[10px] font-bold text-white flex items-center justify-center px-0.5 leading-none">
                {unreadMessages > 99 ? "99+" : unreadMessages}
              </span>
            )}
          </Link>
          {profile && <ProfileMenu profile={profile} />}
        </div>
      </div>
    </header>
  );
}
