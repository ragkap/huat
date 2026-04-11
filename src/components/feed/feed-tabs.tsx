"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "foryou", label: "For You" },
  { id: "followed", label: "Followed" },
  { id: "trending", label: "Trending" },
  { id: "saved", label: "Saved" },
] as const;

export function FeedTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const active = searchParams.get("tab") ?? "foryou";

  return (
    <div className="flex border-b border-[#282828]">
      {TABS.map(tab => (
        <button
          key={tab.id}
          onClick={() => router.push(`/feed?tab=${tab.id}`)}
          className={cn(
            "flex-1 py-3.5 text-sm font-medium transition-colors relative",
            active === tab.id
              ? "text-[#F0F0F0]"
              : "text-[#9CA3AF] hover:text-[#F0F0F0]"
          )}
        >
          {tab.label}
          {active === tab.id && (
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#E8311A] rounded-full" />
          )}
        </button>
      ))}
    </div>
  );
}
