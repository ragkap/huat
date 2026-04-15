"use client";
import { useState } from "react";
import { FeedList } from "@/components/feed/feed-list";
import { cn } from "@/lib/utils";
import type { Post, Profile } from "@/types/database";

const TABS = [
  { id: "foryou", label: "For You" },
  { id: "followed", label: "Followed" },
  { id: "trending", label: "Trending" },
  { id: "saved", label: "Saved" },
] as const;

type TabId = typeof TABS[number]["id"];

interface FeedTabsProps {
  profile: Profile;
  initialPosts: Post[];
}

export function FeedTabs({ profile, initialPosts }: FeedTabsProps) {
  const [tab, setTab] = useState<TabId>("foryou");

  return (
    <div>
      <div className="flex border-b border-[#282828] sticky top-14 z-10 bg-[#0A0A0A]/95 backdrop-blur-md">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); window.scrollTo({ top: 0 }); }}
            className={cn(
              "flex-1 py-3.5 text-sm font-medium cursor-pointer",
              t.id === tab ? "text-[#F0F0F0]" : "text-[#9CA3AF] hover:text-[#F0F0F0]"
            )}
            style={{
              transition: "background 0.2s ease-in-out, border-color 0.2s ease-in-out, color 0.2s ease-in-out",
              background: t.id === tab ? "rgba(232, 49, 26, 0.1)" : "transparent",
              borderBottom: t.id === tab ? "1px solid rgb(232, 49, 26)" : "1px solid transparent",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      <FeedList
        key={tab}
        tab={tab}
        profile={profile}
        initialPosts={tab === "foryou" ? initialPosts : undefined}
      />
    </div>
  );
}
