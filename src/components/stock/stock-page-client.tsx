"use client";
import { FeedList } from "@/components/feed/feed-list";
import type { Profile } from "@/types/database";

interface StockPageClientProps {
  ticker: string;
  profile: Profile;
}

export function StockPageClient({ profile }: StockPageClientProps) {
  return <FeedList tab="foryou" profile={profile} />;
}
