import { NextResponse } from "next/server";
import { getStockBySlugOrTicker } from "@/lib/stocks-db/client";
import { getPrimer, getPrimerFresh } from "@/lib/smartkarma/primer";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;
  const identifier = decodeURIComponent(ticker);
  const fresh = new URL(req.url).searchParams.get("fresh") === "1";

  try {
    const stock = await getStockBySlugOrTicker(identifier);
    if (!stock?.bloomberg_ticker) {
      return NextResponse.json({ primer: null, error: "Stock not found" }, { status: 404 });
    }

    const result = await (fresh ? getPrimerFresh : getPrimer)(stock.bloomberg_ticker);

    // Don't cache enqueued responses — they'll be ready soon
    const cacheHeader = result.status === "enqueued"
      ? "no-store"
      : "public, s-maxage=86400, stale-while-revalidate=3600";

    return NextResponse.json(
      { primer: result.primer, status: result.status },
      { headers: { "Cache-Control": cacheHeader } }
    );
  } catch (error) {
    console.error("Primer API error:", error);
    return NextResponse.json({ primer: null, error: "Failed to fetch primer" }, { status: 500 });
  }
}
