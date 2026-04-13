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
      <div className="flex border-b border-[#282828]">
        {TABS.map(t => (
          <div key={t.id} className="flex-1 py-3.5" />
        ))}
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex border-b border-[#282828]">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex-1 py-3.5 text-sm font-medium transition-colors relative",
              tab === t.id ? "text-[#F0F0F0]" : "text-[#9CA3AF] hover:text-[#F0F0F0]"
            )}
          >
            {t.label}
            {tab === t.id && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#E8311A] rounded-full" />
            )}
          </button>
        ))}
      </div>
      <FeedList tab={tab} profile={profile} />
    </div>
  );
}
