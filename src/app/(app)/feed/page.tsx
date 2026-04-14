"use client";
import { useEffect, useState } from "react";
import { FeedList } from "@/components/feed/feed-list";
import { cn } from "@/lib/utils";
import type { Profile } from "@/types/database";

const TABS = [
  { id: "foryou", label: "For You" },
  { id: "followed", label: "Followed" },
  { id: "trending", label: "Trending" },
  { id: "saved", label: "Saved" },
] as const;

type TabId = typeof TABS[number]["id"];

export default function FeedPage() {
  const [tab, setTab] = useState<TabId>("foryou");
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    fetch("/api/me").then(r => r.ok ? r.json() : null).then(d => {
      if (d?.profile) setProfile(d.profile);
    });
  }, []);

  if (!profile) return (
    <div>
      {/* Composer skeleton */}
      <div className="px-5 py-4 border-b border-[#282828] animate-pulse">
        <div className="flex gap-3">
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-[#1C1C1C] flex-shrink-0 mt-0.5" />
          <div className="flex-1 space-y-3">
            {/* Textarea area */}
            <div className="h-16 rounded-lg bg-[#141414]" />
            {/* Bottom row: icons + button */}
            <div className="flex items-center justify-between">
              <div className="flex gap-3">
                <div className="w-5 h-5 rounded bg-[#1C1C1C]" />
                <div className="w-5 h-5 rounded bg-[#1C1C1C]" />
                <div className="w-5 h-5 rounded bg-[#1C1C1C]" />
              </div>
              <div className="w-20 h-8 rounded-lg bg-[#1C1C1C]" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs skeleton */}
      <div className="flex border-b border-[#282828] sticky top-14 z-10 bg-[#0A0A0A]/95 backdrop-blur-md">
        {TABS.map(t => (
          <div key={t.id} className="flex-1 py-3.5 text-sm font-medium text-transparent select-none">{t.label}</div>
        ))}
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex border-b border-[#282828] sticky top-14 z-10 bg-[#0A0A0A]/95 backdrop-blur-md">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex-1 py-3.5 text-sm font-medium cursor-pointer",
              tab === t.id ? "text-[#F0F0F0]" : "text-[#9CA3AF] hover:text-[#F0F0F0]"
            )}
            style={{
              transition: "background 0.2s ease-in-out, border-color 0.2s ease-in-out, color 0.2s ease-in-out",
              background: tab === t.id ? "rgba(232, 49, 26, 0.1)" : "transparent",
              borderBottom: tab === t.id ? "1px solid rgb(232, 49, 26)" : "1px solid transparent",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      <FeedList tab={tab} profile={profile} />
    </div>
  );
}
