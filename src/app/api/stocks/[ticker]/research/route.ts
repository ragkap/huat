import { NextResponse } from "next/server";
import { getStockBySlugOrTicker, getResearchForTicker } from "@/lib/stocks-db/client";

export async function GET(_req: Request, { params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params;
  try {
    const stock = await getStockBySlugOrTicker(decodeURIComponent(ticker));
    if (!stock?.bloomberg_ticker) return NextResponse.json({ research: [] });

    const research = await getResearchForTicker(stock.bloomberg_ticker);
    return NextResponse.json({ research }, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    });
  } catch (error) {
    console.error("Research fetch error:", error);
    return NextResponse.json({ research: [] });
  }
}
