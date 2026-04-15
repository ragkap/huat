import { NextResponse } from "next/server";
import { getQuote, getCurrentStats } from "@/lib/smartkarma/client";
import { getStockBySlugOrTicker } from "@/lib/stocks-db/client";

export async function GET(request: Request, { params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params;

  try {
    const identifier = decodeURIComponent(ticker);
    const stock = await getStockBySlugOrTicker(identifier);
    const bloombergTicker = stock?.bloomberg_ticker ?? identifier;
    const quote = await getQuote(bloombergTicker);

    const stats = stock?.isin
      ? await getCurrentStats(stock.isin).catch(() => null)
      : null;

    return NextResponse.json({ stock, quote, stats });
  } catch (error) {
    console.error("Quote fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch quote" }, { status: 500 });
  }
}
