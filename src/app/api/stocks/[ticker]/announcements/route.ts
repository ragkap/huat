import { NextResponse } from "next/server";
import { getAnnouncements } from "@/lib/smartkarma/client";
import { getStockBySlugOrTicker } from "@/lib/stocks-db/client";

export async function GET(_req: Request, { params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params;
  try {
    const stock = await getStockBySlugOrTicker(decodeURIComponent(ticker));
    if (!stock?.slug) return NextResponse.json({ announcements: [] });
    const announcements = await getAnnouncements(stock.slug);
    return NextResponse.json({ announcements }, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    });
  } catch {
    return NextResponse.json({ announcements: [] });
  }
}
