import { NextResponse } from "next/server";
import { getNews } from "@/lib/smartkarma/client";
import { getStockBySlugOrTicker } from "@/lib/stocks-db/client";

export async function GET(_req: Request, { params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params;
  try {
    const stock = await getStockBySlugOrTicker(decodeURIComponent(ticker));
    const keyword = stock?.name ?? decodeURIComponent(ticker);
    const news = await getNews(keyword);
    return NextResponse.json({ news }, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    });
  } catch {
    return NextResponse.json({ news: [] });
  }
}
