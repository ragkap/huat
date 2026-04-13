import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStockBySlugOrTicker } from "@/lib/stocks-db/client";

async function resolveToBloomberg(identifier: string): Promise<string | null> {
  const stock = await getStockBySlugOrTicker(identifier).catch(() => null);
  return stock?.bloomberg_ticker ?? null;
}

export async function POST(_req: Request, { params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const identifier = decodeURIComponent(ticker);
  const canonical = await resolveToBloomberg(identifier) ?? identifier;

  // Delete any existing rows for this company (slug or bloomberg ticker variants)
  // to ensure only one canonical row exists
  const { data: existing } = await supabase
    .from("stock_watchlist")
    .select("ticker")
    .eq("user_id", user.id);

  const toDelete = (existing ?? [])
    .map(r => r.ticker as string)
    .filter(async () => true); // filter below with resolved

  // Find rows that resolve to the same bloomberg ticker and delete them first
  const resolved = await Promise.all(
    toDelete.map(async (t) => {
      const bt = await resolveToBloomberg(t).catch(() => null);
      return bt === canonical ? t : null;
    })
  );
  const slugsToDelete = resolved.filter((t): t is string => t !== null);

  if (slugsToDelete.length > 0) {
    await supabase
      .from("stock_watchlist")
      .delete()
      .eq("user_id", user.id)
      .in("ticker", slugsToDelete);
  }

  // Insert canonical bloomberg ticker
  const { error } = await supabase
    .from("stock_watchlist")
    .insert({ user_id: user.id, ticker: canonical });

  if (error && error.code !== "23505") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ following: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const identifier = decodeURIComponent(ticker);
  const canonical = await resolveToBloomberg(identifier) ?? identifier;

  // Delete all rows that resolve to this company (handles slug and bloomberg ticker variants)
  const { data: existing } = await supabase
    .from("stock_watchlist")
    .select("ticker")
    .eq("user_id", user.id);

  const resolved = await Promise.all(
    (existing ?? []).map(async (r) => {
      const bt = await resolveToBloomberg(r.ticker as string).catch(() => null);
      return bt === canonical ? r.ticker as string : null;
    })
  );
  const toDelete = resolved.filter((t): t is string => t !== null);

  if (toDelete.length > 0) {
    await supabase
      .from("stock_watchlist")
      .delete()
      .eq("user_id", user.id)
      .in("ticker", toDelete);
  }

  return NextResponse.json({ following: false });
}
