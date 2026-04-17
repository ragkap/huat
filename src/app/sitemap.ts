import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { getSingaporeStocks } from "@/lib/stocks-db/client";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://www.huat.co";

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${base}/login`, changeFrequency: "monthly", priority: 0.3 },
  ];

  // Stock pages
  let stockPages: MetadataRoute.Sitemap = [];
  try {
    const stocks = await getSingaporeStocks();
    stockPages = stocks.map((s) => ({
      url: `${base}/stocks/${encodeURIComponent(s.slug ?? s.bloomberg_ticker ?? s.name)}`,
      changeFrequency: "daily" as const,
      priority: 0.7,
    }));
  } catch {
    // skip if DB unavailable
  }

  // Recent public posts
  let postPages: MetadataRoute.Sitemap = [];
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
    const { data: posts } = await supabase
      .from("posts")
      .select("id, created_at")
      .is("parent_id", null)
      .order("created_at", { ascending: false })
      .limit(500);

    postPages = (posts ?? []).map((p) => ({
      url: `${base}/post/${p.id}`,
      lastModified: new Date(p.created_at),
      changeFrequency: "weekly" as const,
      priority: 0.5,
    }));
  } catch {
    // skip if DB unavailable
  }

  return [...staticPages, ...stockPages, ...postPages];
}
