import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getQuote } from "@/lib/smartkarma/client";
import { getStockBySlugOrTicker } from "@/lib/stocks-db/client";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: rows } = await supabase
    .from("stock_watchlist")
    .select("ticker")
    .eq("user_id", user.id)
    .order("ticker");

  const stored: string[] = (rows ?? []).map(r => r.ticker as string);
  if (!stored.length) return NextResponse.json({ items: [] });

  // Resolve each stored value (slug or bloomberg ticker) to canonical bloomberg ticker
  const resolved = await Promise.all(
    stored.map(async (identifier) => {
      const stock = await getStockBySlugOrTicker(identifier).catch(() => null);
      if (!stock?.bloomberg_ticker) return null;
      return { stored: identifier, ticker: stock.bloomberg_ticker, name: stock.name };
    })
  );

  // Deduplicate by bloomberg ticker — keep first occurrence
  const seen = new Set<string>();
  const unique = resolved.filter((r): r is NonNullable<typeof r> => {
    if (!r || seen.has(r.ticker)) return false;
    seen.add(r.ticker);
    return true;
  });

  // Fetch quotes in parallel
  const quotes = await Promise.all(
    unique.map(r => getQuote(r.ticker).catch(() => null))
  );

  const items = unique.map((r, i) => ({
    slug: r.stored,
    ticker: r.ticker,
    name: r.name,
    quote: quotes[i],
  }));

  return NextResponse.json({ items }, { headers: { "Cache-Control": "no-store" } });
}
