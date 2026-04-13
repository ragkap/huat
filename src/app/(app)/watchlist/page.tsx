import { createClient } from "@/lib/supabase/server";
import { WatchlistClient } from "./watchlist-client";

export const metadata = { title: "Watchlist — Huat.co" };

export default async function WatchlistPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: rows } = await supabase
    .from("stock_watchlist")
    .select("ticker")
    .eq("user_id", user.id)
    .order("ticker");

  const tickers = (rows ?? []).map(r => r.ticker as string);

  return <WatchlistClient initialTickers={tickers} />;
}
