import { NextResponse } from "next/server";
import { getChart } from "@/lib/smartkarma/client";
import { getStockBySlugOrTicker } from "@/lib/stocks-db/client";

export async function GET(request: Request, { params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params;
  const { searchParams } = new URL(request.url);
  const interval = searchParams.get("interval") ?? "y1";

  try {
    const stock = await getStockBySlugOrTicker(decodeURIComponent(ticker));
    if (!stock) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const chart = await getChart(
      stock.bloomberg_ticker ?? ticker,
      stock.yahoo_ticker ?? "",
      interval
    );
    return NextResponse.json(chart);
  } catch (error) {
    console.error("Chart fetch error:", error);
    return NextResponse.json({ dates: [], prices: [] });
  }
}
