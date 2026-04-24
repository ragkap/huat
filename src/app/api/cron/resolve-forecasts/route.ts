import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getQuote } from "@/lib/smartkarma/client";
import { getStockBySlugOrTicker } from "@/lib/stocks-db/client";

const CRON_SECRET = process.env.CRON_SECRET;

interface ForecastRow {
  id: string;
  post_id: string;
  ticker: string;
  current_price: number | null;
  target_price: number;
  target_date: string;
  outcome: "pending" | "hit" | "missed";
  posts: { author_id: string; content: string } | null;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  // Resolve forecasts whose target date has passed. Also resolve early hits:
  // any pending forecast where the current price has already crossed the
  // target, even before target_date.
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const { data: forecasts, error } = await db
    .from("forecasts")
    .select("id, post_id, ticker, current_price, target_price, target_date, outcome, posts!inner(author_id, content)")
    .eq("outcome", "pending")
    .limit(500);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!forecasts?.length) return NextResponse.json({ checked: 0, resolved: 0 });

  // Cache quotes per ticker so we make one API call per unique ticker.
  const quoteCache = new Map<string, number | null>();
  async function priceFor(storedTicker: string): Promise<number | null> {
    if (quoteCache.has(storedTicker)) return quoteCache.get(storedTicker)!;
    // Map to Bloomberg ticker via stocks DB (e.g. D05.SI → D05 SP).
    const stock = await getStockBySlugOrTicker(storedTicker).catch(() => null);
    const bloomberg = stock?.bloomberg_ticker ?? storedTicker;
    const quote = await getQuote(bloomberg).catch(() => null);
    const price = quote?.price ?? null;
    quoteCache.set(storedTicker, price);
    return price;
  }

  let resolved = 0;
  const notificationRows: Array<{ recipient_id: string; type: string; payload: Record<string, unknown> }> = [];

  for (const f of forecasts as unknown as ForecastRow[]) {
    const pastDue = f.target_date <= today;
    const price = await priceFor(f.ticker);
    if (price == null) continue; // quote unavailable — try again next run

    // Direction is inferred from initial vs target price. If we don't have an
    // initial price (older forecasts), we default to bullish (target is an
    // "at-least" number).
    const direction: "up" | "down" =
      f.current_price != null && f.current_price > f.target_price ? "down" : "up";

    const hit =
      (direction === "up" && price >= f.target_price) ||
      (direction === "down" && price <= f.target_price);

    if (!hit && !pastDue) continue; // still in flight, not yet hit

    const outcome: "hit" | "missed" = hit ? "hit" : "missed";
    const { error: updateErr } = await db
      .from("forecasts")
      .update({ outcome, resolved_at: new Date().toISOString() })
      .eq("id", f.id)
      .eq("outcome", "pending"); // guard against races

    if (updateErr) {
      console.error("Forecast update failed", f.id, updateErr.message);
      continue;
    }

    if (f.posts?.author_id) {
      notificationRows.push({
        recipient_id: f.posts.author_id,
        type: "forecast_resolved",
        payload: {
          post_id: f.post_id,
          forecast_id: f.id,
          ticker: f.ticker,
          outcome,
          target_price: f.target_price,
          resolved_price: price,
        },
      });
    }
    resolved++;
  }

  if (notificationRows.length) {
    await db.from("notifications").insert(notificationRows);
  }

  return NextResponse.json({ checked: forecasts.length, resolved });
}
