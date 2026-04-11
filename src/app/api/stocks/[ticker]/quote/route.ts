import { NextResponse } from "next/server";
import { getQuote, getSmartScore, getCurrentStats } from "@/lib/smartkarma/client";
import { getStockBySlugOrTicker } from "@/lib/stocks-db/client";

export async function GET(request: Request, { params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params;

  try {
    const [stock, quote] = await Promise.all([
      getStockBySlugOrTicker(decodeURIComponent(ticker)),
      getQuote(ticker),
    ]);

    const extras = await Promise.all([
      stock?.slug ? getSmartScore(stock.slug) : Promise.resolve({ score: null, trend: null }),
      stock?.isin ? getCurrentStats(stock.isin) : Promise.resolve({ pe_ratio: null, pb_ratio: null, market_cap: null, dividend_yield: null, week_52_high: null, week_52_low: null }),
    ]);

    return NextResponse.json({
      stock,
      quote,
      smart_score: extras[0],
      stats: extras[1],
    });
  } catch (error) {
    console.error("Quote fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch quote" }, { status: 500 });
  }
}
